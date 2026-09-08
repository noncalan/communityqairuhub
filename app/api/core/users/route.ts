import { createCollectionHandlers } from "@/lib/core-api/handlers";

export const dynamic = "force-dynamic";

const handlers = createCollectionHandlers("users");
export const GET = handlers.GET;
export const POST = handlers.POST;
