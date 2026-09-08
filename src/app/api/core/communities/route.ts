import { createCollectionHandlers } from "@/lib/core-api/handlers";

export const dynamic = "force-dynamic";

const handlers = createCollectionHandlers("communities");
export const GET = handlers.GET;
export const POST = handlers.POST;
