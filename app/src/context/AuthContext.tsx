import React, { createContext, useContext, useEffect, useState } from "react";
import type { UserProfile } from "@insyte/shared/types";
import {
  login as sharedLogin,
  signup as sharedSignup,
  verifyEmail as sharedVerifyEmail,
  resendVerification as sharedResendVerification,
  forgotPassword as sharedForgotPassword,
  resetPassword as sharedResetPassword,
  VerificationRequiredError,
  VerifyLinkError,
  type LoginResult
} from "@insyte/shared/auth";
import { API_BASE } from "../config";
import { nativeStorage } from "../storage";
import { api, authHeaders } from "../api";

interface AuthContextValue {
  currentUser: UserProfile | null;
  booting: boolean; // true while checking for a stored session on cold start
  login: (email: string, password: string) => Promise<void>; // throws VerificationRequiredError
  signup: (name: string, email: string, role: "student" | "teacher", password: string) => Promise<{ email: string; emailWarning?: string }>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>; // throws VerifyLinkError
  resendVerification: (email: string) => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export { VerificationRequiredError, VerifyLinkError };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [booting, setBooting] = useState(true);

  // Cold start: a stored token doesn't mean the session is still valid
  // (30-day server-side expiry) — /api/me is the real check.
  useEffect(() => {
    (async () => {
      const token = await nativeStorage.getToken();
      if (!token) {
        setBooting(false);
        return;
      }
      try {
        const res = await fetch(api("/api/me"), { headers: await authHeaders() });
        if (!res.ok) {
          await nativeStorage.clearToken();
          setCurrentUser(null);
        } else {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch {
        // Network hiccup on boot — treat as logged out rather than stuck
        setCurrentUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const applySession = async (result: LoginResult) => {
    await nativeStorage.setToken(result.token);
    setCurrentUser(result.user);
  };

  const login = async (email: string, password: string) => {
    const result = await sharedLogin(API_BASE, email, password); // may throw VerificationRequiredError
    await applySession(result);
  };

  const signup = async (name: string, email: string, role: "student" | "teacher", password: string) => {
    const result = await sharedSignup(API_BASE, name, email, role, password);
    // No token yet by design — account isn't usable until the email link is tapped.
    return { email: result.email, emailWarning: result.emailWarning };
  };

  const logout = async () => {
    await nativeStorage.clearToken();
    setCurrentUser(null);
  };

  const verifyEmail = async (token: string) => {
    const result = await sharedVerifyEmail(API_BASE, token); // may throw VerifyLinkError
    await applySession(result);
  };

  const resendVerification = async (email: string) => {
    const result = await sharedResendVerification(API_BASE, email);
    return result.message;
  };

  const forgotPassword = async (email: string) => {
    const result = await sharedForgotPassword(API_BASE, email);
    return result.message;
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const result = await sharedResetPassword(API_BASE, token, newPassword);
    await applySession(result);
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, booting, login, signup, logout, verifyEmail, resendVerification, forgotPassword, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
