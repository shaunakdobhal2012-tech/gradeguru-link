import { createFileRoute } from "@tanstack/react-router";
import { DeadlineTetris } from "@/components/deadline-tetris";

export const Route = createFileRoute("/tetris")({
  head: () => ({
    meta: [
      { title: "Deadline Tetris — Scholaria" },
      { name: "description", content: "Drag and drop your pending assignments into your week and auto-arrange around classes." },
    ],
  }),
  component: TetrisPage,
});

function TetrisPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <DeadlineTetris />
    </div>
  );
}
