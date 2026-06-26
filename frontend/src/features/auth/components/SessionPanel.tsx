"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/services/apiClient";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string | null;
};

type SessionState = "checking" | "signed-in" | "signed-out" | "error" | "logging-out";

export function SessionPanel() {
  const [status, setStatus] = useState<SessionState>("checking");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [message, setMessage] = useState("Checking current browser session.");

  async function loadSession() {
    setStatus("checking");
    try {
      const sessionUser = await apiClient<SessionUser | null>("/auth/session");
      if (!sessionUser) {
        setUser(null);
        setStatus("signed-out");
        setMessage("No active session.");
        return;
      }

      setUser(sessionUser);
      setStatus("signed-in");
      setMessage("Session cookie is active.");
    } catch (error) {
      setUser(null);
      setStatus("signed-out");
      setMessage(error instanceof Error ? error.message : "No active session.");
    }
  }

  async function logout() {
    setStatus("logging-out");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient("/auth/logout", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken }
      });
      setUser(null);
      setStatus("signed-out");
      setMessage("Signed out and session revoked.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Logout failed.");
    }
  }

  useEffect(() => {
    void loadSession();
  }, []);

  return (
    <section className="rounded-panel border border-line bg-surface p-6 shadow-panel">
      <h2 className="text-2xl font-bold">Current Session</h2>
      <p className="mt-2 min-h-10 text-sm text-ink-muted">{message}</p>

      <div className="mt-5 rounded-md border border-line bg-canvas p-4">
        <p className="text-xs font-semibold uppercase text-ink-muted">Status</p>
        <p className="mt-1 text-lg font-bold">
          {status === "checking" ? "Checking" : status === "signed-in" || status === "logging-out" ? "Signed in" : "Signed out"}
        </p>
        {user ? (
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="font-semibold text-ink-muted">Name</dt>
              <dd className="break-words">{user.name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-muted">Email</dt>
              <dd className="break-words">{user.email}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-muted">Role</dt>
              <dd>{user.role}</dd>
            </div>
          </dl>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={loadSession} disabled={status === "checking"}>
          {status === "checking" ? "Refreshing..." : "Refresh"}
        </button>
        <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink-muted" type="button" onClick={logout} disabled={!user || status === "logging-out"}>
          {status === "logging-out" ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </section>
  );
}
