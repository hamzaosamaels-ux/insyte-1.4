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
