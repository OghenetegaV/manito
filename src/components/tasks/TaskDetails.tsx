import { Drawer } from "@/components/ui/Drawer";
import type { Task } from "@/game/types";
import { TaskBody } from "./TaskBody";
import "./tasks.css";

/** Re-read the whole task at any time. */
export function TaskDetails({ open, onClose, task }: { open: boolean; onClose: () => void; task: Task }) {
  return (
    <Drawer open={open} onClose={onClose} title={task.title} eyebrow="Your secret task · Top secret">
      <TaskBody task={task} />
    </Drawer>
  );
}
