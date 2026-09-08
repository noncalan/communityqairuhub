import { createItemHandlers } from "@/lib/core-api/handlers";

export const dynamic = "force-dynamic";

const handlers = createItemHandlers("events");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handlers.GET(request, (await params).id);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handlers.PATCH(request, (await params).id);
}
