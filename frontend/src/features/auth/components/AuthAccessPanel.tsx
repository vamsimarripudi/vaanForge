"use client";

import { useState } from "react";
import Link from "next/link";
import { apiClient } from "@/services/apiClient";

type PanelState = "idle" | "loading" | "success" | "error";

export function AuthAccessPanel() {
  const [loginState, setLoginState] = useState<PanelState>("idle");
  const [resetState, setResetState] = useState<PanelState>("idle");
  const [message, setMessage] = useState("Sign in or request password recovery for an existing founder account.");

  async function login(formData: FormData) {
    setLoginState("loading");
    try {
      await apiClient("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password")
        })
      });
      setLoginState("success");
      setMessage("Signed in. Session cookie refreshed.");
    } catch (error) {
      setLoginState("error");
      setMessage(error instanceof Error ? error.message : "Login failed.");
    }
  }

  async function requestReset(formData: FormData) {
    setResetState("loading");
    try {
      await apiClient("/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email: formData.get("resetEmail") })
      });
      setResetState("success");
      setMessage("Password reset email queued. Local development writes it to the email outbox.");
    } catch (error) {
      setResetState("error");
      setMessage(error instanceof Error ? error.message : "Password reset request failed.");
    }
  }

  return (
    <section className="rounded-panel border border-line bg-surface p-6 shadow-panel">
      <h2 className="text-2xl font-bold">Account Access</h2>
      <p className="mt-2 min-h-10 text-sm text-ink-muted">{message}</p>

      <form action={login} className="mt-5 grid gap-4">
        <label className="text-sm font-semibold">
          Email
          <input name="email" type="email" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" defaultValue="founder@vmnexus.local" />
        </label>
        <label className="text-sm font-semibold">
          Password
          <input name="password" type="password" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" defaultValue="new-secure-demo-password" />
        </label>
        <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit" disabled={loginState === "loading"}>
          {loginState === "loading" ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <form action={requestReset} className="mt-6 border-t border-line pt-5">
        <label className="text-sm font-semibold">
          Recovery email
          <input name="resetEmail" type="email" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" defaultValue="founder@vmnexus.local" />
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="submit" disabled={resetState === "loading"}>
            {resetState === "loading" ? "Queueing..." : "Send reset link"}
          </button>
          <Link className="text-sm font-semibold text-brand" href="/account/reset-password">
            Enter token
          </Link>
        </div>
      </form>
    </section>
  );
}
