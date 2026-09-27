import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { TaskStatus as Status } from "@/game/types";

const STATUS: Record<Status, { label: string; tone: BadgeTone }> = {
  locked: { label: "Sealed", tone: "muted" },
  active: { label: "Active", tone: "gold" },
  submitted: { label: "Proof in", tone: "sage" },
  approved: { label: "Complete", tone: "sage" },
  failed: { label: "Failed", tone: "burgundy" },
  expired: { label: "Expired", tone: "burgundy" },
};

export function TaskStatus({ status }: { status: Status }) {
  const { label, tone } = STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}
