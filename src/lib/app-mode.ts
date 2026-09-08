export type AppMode = "demo" | "live";

export const appMode: AppMode =
  process.env.NEXT_PUBLIC_APP_MODE === "live" ? "live" : "demo";

export const isLiveMode = appMode === "live";
