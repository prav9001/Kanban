import { z } from "zod";

const name = (label: string) => z.string().trim().min(1, `${label} is required`).max(100, `${label} is too long`);

export const signupSchema = z.object({
  name: name("Name"),
  email: z.email("Enter a valid email").trim(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

const card = z.object({ id: z.string().min(1), title: z.string().min(1).max(500), details: z.string().max(10_000) });
const column = z.object({ id: z.string().min(1), title: z.string().min(1).max(100), cards: z.array(card) });

export const boardCreateSchema = z.object({ name: name("Board name") });

export const boardUpdateSchema = z
  .object({ name: name("Board name").optional(), columns: z.array(column).min(1).max(20).optional() })
  .refine((b) => b.name !== undefined || b.columns !== undefined, "Nothing to update");

export const profileSchema = z.object({ name: name("Name") });

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(200),
});

export const deleteAccountSchema = z.object({ password: z.string().min(1, "Password is required") });
