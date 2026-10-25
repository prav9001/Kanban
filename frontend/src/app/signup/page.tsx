import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "Create account - Kanban" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
