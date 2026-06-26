"use client";

import { useState } from "react";
import { apiClient } from "@/services/apiClient";

export function RegisterPanel() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("Create the founder account before workspace activation.");

  async function register(formData: FormData) {
    setStatus("loading");
    try {
      await apiClient("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password")
        })
      });
      setStatus("success");
      setMessage("Founder account created and session cookie set.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Registration failed.");
    }
  }

  return (
    <form action={register} className="rounded-panel border border-line bg-surface p-6 shadow-panel">
      <h2 className="text-2xl font-bold">Founder Account</h2>
      <p className="mt-2 text-sm text-ink-muted">{message}</p>
      <div className="mt-5 grid gap-4">
        <label className="text-sm font-semibold">
          Founder name
          <input name="name" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" defaultValue="Vamsi Marripudi" />
        </label>
        <label className="text-sm font-semibold">
          Email
          <input name="email" type="email" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" defaultValue="founder@vmnexus.local" />
        </label>
        <label className="text-sm font-semibold">
          Password
          <input name="password" type="password" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" defaultValue="secure-demo-password" />
        </label>
      </div>
      <button className="mt-5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Creating..." : "Create founder account"}
      </button>
    </form>
  );
}
