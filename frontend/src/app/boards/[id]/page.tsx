import { Suspense } from "react";
import type { Metadata } from "next";
import BoardPage, { Loading } from "@/components/BoardPage";

export const metadata: Metadata = { title: "Board - Kanban" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <BoardPage />
    </Suspense>
  );
}
