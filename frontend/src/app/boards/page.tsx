import type { Metadata } from "next";
import BoardList from "@/components/BoardList";

export const metadata: Metadata = { title: "Boards - Kanban" };

export default function BoardsPage() {
  return <BoardList />;
}
