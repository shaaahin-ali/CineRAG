import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
});

export const querySchema = z.object({
  query: z.string().min(1, "Query is required").max(2000),
});

export const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum([
    "producer",
    "director",
    "actor",
    "cinematographer",
    "editor",
    "music",
    "viewer",
  ]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type QueryInput = z.infer<typeof querySchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
