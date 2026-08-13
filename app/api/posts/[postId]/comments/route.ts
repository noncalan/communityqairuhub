import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listPostComments } from "@/lib/data/posts";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const responseHeaders = { "Cache-Control": "private, no-store" };

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  if (!uuidPattern.test(postId)) {
    return NextResponse.json(
      { error: "Invalid post." },
      { status: 400, headers: responseHeaders },
    );
  }
  const { supabase, userId } = await getCurrentUser();
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401, headers: responseHeaders },
    );
  }
  try {
    const comments = await listPostComments(supabase, postId);
    return NextResponse.json({ comments }, { headers: responseHeaders });
  } catch {
    return NextResponse.json(
      { error: "Comments could not be loaded." },
      { status: 500, headers: responseHeaders },
    );
  }
}
