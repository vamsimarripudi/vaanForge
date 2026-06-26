"use client";

import { useState } from "react";
import { apiClient } from "@/services/apiClient";

type ResetState = "idle" | "loading" | "success" | "error";

export function PasswordResetPanel({ token }: { token?: string }) {
  const [state, setState] = useState<ResetState>("idle");
  const [message, setMessage] = useState("Paste the reset token from the recovery email.");

  async function confirmReset(formData: FormData) {
    setState("loading");
    try {
      await apiClient("/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({
          token: formData.get("token"),
          password: formData.get("password")
        })
      });
      setState("success");
      setMessage("Password reset complete. You can sign in with the new password.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Password reset failed.");
    }
  }

  return (
    <form action={confirmReset} className="rounded-panel border border-line bg-surface p-6 shadow-panel">
      <h2 className="text-2xl font-bold">Reset Password</h2>
      <p className="mt-2 min-h-10 text-sm text-ink-muted">{message}</p>
      <div className="mt-5 grid gap-4">
        <label className="text-sm font-semibold">
          Reset token
          <textarea name="token" className="mt-2 min-h-24 w-full rounded-md border border-line bg-canvas px-3 py-2" defaultValue={token || ""} />
        </label>
        <label className="text-sm font-semibold">
          New password
          <input name="password" type="password" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" defaultValue="new-secure-demo-password" />
        </label>
      </div>
      <button className="mt-5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit" disabled={state === "loading"}>
        {state === "loading" ? "Resetting..." : "Reset password"}
      </button>
    </form>
  );
}
