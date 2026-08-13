import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AvatarMark({ initials, color, className = "size-9" }: { initials: string; color: string; className?: string }) {
  return <Avatar className={className}><AvatarFallback style={{ backgroundColor: color }} className="font-medium text-white">{initials}</AvatarFallback></Avatar>;
}
