import { readFile, writeFile } from "node:fs/promises";

const packageUrl = new URL("../node_modules/sonner/package.json", import.meta.url);
const packageJson = JSON.parse(await readFile(packageUrl, "utf8"));

if (packageJson.version !== "2.0.8") {
  throw new Error(
    `Refusing to patch unexpected Sonner version ${packageJson.version}.`,
  );
}

const marker = "QAIRU_CSP_STATIC_CSS";
const files = ["index.mjs", "index.js"];

for (const file of files) {
  const fileUrl = new URL(`../node_modules/sonner/dist/${file}`, import.meta.url);
  const source = await readFile(fileUrl, "utf8");
  if (source.includes(marker)) continue;

  const match = source.match(/function __insertCSS\(code\) \{(\r?\n)/);
  if (!match) {
    throw new Error(`Could not find Sonner CSS injector in ${file}.`);
  }

  const newline = match[1];
  const replacement = [
    "function __insertCSS(code) {",
    `  // ${marker}: CSS is imported by app/layout.tsx for strict CSP.`,
    "  return",
    "",
  ].join(newline);

  await writeFile(fileUrl, source.replace(match[0], replacement), "utf8");
  console.log(`Patched Sonner runtime CSS injection in ${file}.`);
}
