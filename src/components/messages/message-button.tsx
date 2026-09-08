"use client";

import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { openDirectConversationAction } from "@/app/actions/activity";
import { Button } from "@/components/ui/button";

export function MessageButton({ targetProfileId }: { targetProfileId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function openConversation() {
    startTransition(async () => {
      const result = await openDirectConversationAction({ otherProfileId: targetProfileId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push(`/messages?conversation=${result.data.conversationId}`);
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={openConversation} disabled={pending}>
      <MessageCircle className="size-3.5" />
      {pending ? "Opening..." : "Message"}
    </Button>
  );
}
