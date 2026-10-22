import { Drawer } from "@/components/ui/Drawer";
import type { Task } from "@/game/types";
import { TaskBody } from "./TaskBody";
import "./tasks.css";

/** Re-read any one of your missions at any time. */
export function TaskDetails({
  open,
  onClose,
  task,
  manitoName,
}: {
  open: boolean;
  onClose: () => void;
  task: Task;
  manitoName?: string;
}) {
  return (
    <Drawer open={open} onClose={onClose} title={task.title} eyebrow="Your secret mission · Top secret">
      <TaskBody task={task} manitoName={manitoName} />
    </Drawer>
  );
}
