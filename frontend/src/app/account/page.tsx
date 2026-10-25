import type { Metadata } from "next";
import AccountPage from "@/components/AccountPage";

export const metadata: Metadata = { title: "Account - Kanban" };

export default function Page() {
  return <AccountPage />;
}
