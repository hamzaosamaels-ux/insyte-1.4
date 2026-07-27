// Pure, platform-neutral login call — no React state, no storage side
// effects. The caller (web App.tsx today, a native screen later) is
// responsible for persisting the token and applying the result to its
// own state.
import { createApi } from "./api";
import type { UserProfile } from "./types";

export interface LoginResult {
  token: string;
  user: UserProfile;
  allStudents: UserProfile[];
  allTeachers: UserProfile[];
}

// Thrown when the backend rejects login because the account exists but its
// email hasn't been verified yet — carries enough for the caller to offer a
// resend, without the caller needing to string-match the message.
export class VerificationRequiredError extends Error {
  email?: string;
  constructor(message: string, email?: string) {
    super(message);
    this.name = "VerificationRequiredError";
    this.email = email;
  }
}

export async function login(baseUrl: string, email: string, password: string): Promise<LoginResult> {
  const { api } = createApi(baseUrl);
  const res = await fetch(api("/api/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    if (data.verificationRequired) throw new VerificationRequiredError(data.error || "Log in failed.", data.email);
    throw new Error(data.error || "Log in failed.");
  }
  return data;
}

export interface SignupResult {
  verificationRequired: true;
  email: string;
  emailWarning?: string;
}

export async function signup(
  baseUrl: string,
  name: string,
  email: string,
  role: "student" | "teacher",
  password: string
): Promise<SignupResult> {
  const { api } = createApi(baseUrl);
  const res = await fetch(api("/api/signup"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, role, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Sign up failed.");
  return data;
}

// Thrown by verifyEmail when the link is expired (vs. garbage/already-used,
// which is indistinguishable by design — see server.ts's /api/verify-email
// comment) — carries `expired` so the caller can offer a resend without
// string-matching the message.
export class VerifyLinkError extends Error {
  expired: boolean;
  constructor(message: string, expired: boolean) {
    super(message);
    this.name = "VerifyLinkError";
    this.expired = expired;
  }
}

export async function verifyEmail(baseUrl: string, token: string): Promise<LoginResult> {
  const { api } = createApi(baseUrl);
  const res = await fetch(api("/api/verify-email"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });
  const data = await res.json();
  if (!res.ok) throw new VerifyLinkError(data.error || "Invalid verification link.", Boolean(data.expired));
  return data;
}

export async function resendVerification(baseUrl: string, email: string): Promise<{ message: string }> {
  const { api } = createApi(baseUrl);
  const res = await fetch(api("/api/resend-verification"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not resend.");
  return data;
}

export async function forgotPassword(baseUrl: string, email: string): Promise<{ message: string }> {
  const { api } = createApi(baseUrl);
  const res = await fetch(api("/api/forgot-password"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not send reset link.");
  return data;
}

export async function resetPassword(baseUrl: string, token: string, newPassword: string): Promise<LoginResult> {
  const { api } = createApi(baseUrl);
  const res = await fetch(api("/api/reset-password"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not reset password.");
  return data;
}
