"use client";

import { useEffect, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function NotificationPanel() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [state, setState] = useState<"loading" | "empty" | "success" | "error">("loading");
  const [workflowState, setWorkflowState] = useState<"empty" | "loading" | "success" | "error">("empty");
  const [workflowMessage, setWorkflowMessage] = useState("Ready to send or update notifications.");

  async function refreshNotifications() {
    return apiClient<NotificationItem[]>("/notifications")
      .then((data) => {
        setItems(data);
        setState(data.length ? "success" : "empty");
      })
      .catch(() => setState("error"));
  }

  useEffect(() => {
    void refreshNotifications();
  }, []);

  async function createNotification(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Sending notification.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient<NotificationItem>("/notifications", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          title: String(formData.get("title") || ""),
          message: String(formData.get("message") || ""),
          smsTo: String(formData.get("smsTo") || "") || undefined
        })
      });
      await refreshNotifications();
      setWorkflowState("success");
      setWorkflowMessage("Notification sent and alert queue refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Notification send failed.");
    }
  }

  async function markRead(notificationId: string) {
    setWorkflowState("loading");
    setWorkflowMessage("Marking notification read.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient<NotificationItem>(`/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: { "x-csrf-token": csrf.csrfToken }
      });
      await refreshNotifications();
      setWorkflowState("success");
      setWorkflowMessage("Notification marked read.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Notification update failed.");
    }
  }

  return (
    <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Notifications</h2>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{state}</span>
      </div>
      <div className="mt-4">
        <StatePanel state={state} title="Notification state" detail="Loading, empty, error, and success states are available for alerts." />
      </div>
      <form action={createNotification} className="mt-4 rounded-md border border-line bg-canvas p-4">
        <h3 className="text-sm font-bold">Create Announcement</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Title
            <input name="title" className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2" placeholder="Launch update" />
          </label>
          <label className="text-sm font-semibold">
            SMS number
            <input name="smsTo" className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2" placeholder="Optional phone" />
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            Message
            <textarea name="message" className="mt-2 min-h-20 w-full rounded-md border border-line bg-surface px-3 py-2" placeholder="Write the notification body" />
          </label>
        </div>
        <button className="mt-3 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
          Send Notification
        </button>
      </form>
      <div className="mt-4">
        <StatePanel state={workflowState} title="Notification workflow" detail={workflowMessage} />
      </div>
      <div className="mt-4 space-y-3">
        {state === "loading" ? <p className="text-sm text-ink-muted">Loading notifications...</p> : null}
        {state === "empty" ? <p className="text-sm text-ink-muted">No notifications yet.</p> : null}
        {state === "error" ? <p className="text-sm text-ink-muted">Notification API is not reachable yet.</p> : null}
        {items.map((item) => (
          <article key={item.id} className="rounded-md border border-line bg-muted p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-sm font-semibold">{item.title}</p>
              <button className="rounded-md border border-line px-3 py-1 text-xs font-semibold" type="button" onClick={() => markRead(item.id)} disabled={item.read}>
                {item.read ? "Read" : "Mark read"}
              </button>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{item.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
