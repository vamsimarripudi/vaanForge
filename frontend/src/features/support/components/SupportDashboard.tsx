"use client";

import { useCallback, useEffect, useState } from "react";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

interface SupportSummary {
  tickets: number;
  open: number;
  urgent: number;
  resolved: number;
}

type SupportOperations = {
  liveChat: {
    mode: string;
    status: string;
    detail: string;
  };
  slaRules: Array<{
    priority: string;
    responseTargetMinutes: number;
    resolutionTargetHours: number;
  }>;
  escalationPaths: Array<{
    trigger: string;
    ownerRole: string;
    nextStep: string;
  }>;
  knowledgeBase: Array<{
    title: string;
    audience: string;
    summary: string;
  }>;
};

type SupportTicket = {
  id: string;
  subject: string;
  priority: string;
  status: string;
  customerId?: string;
  createdAt: string;
};

type TicketMessage = {
  id: string;
  ticketId: string;
  authorId?: string;
  message: string;
  internal: boolean;
  createdAt: string;
};

export function SupportDashboard() {
  const [summary, setSummary] = useState<SupportSummary>({ tickets: 0, open: 0, urgent: 0, resolved: 0 });
  const [operations, setOperations] = useState<SupportOperations>({
    liveChat: { mode: "loading", status: "loading", detail: "Loading live chat mode." },
    slaRules: [],
    escalationPaths: [],
    knowledgeBase: []
  });
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [state, setState] = useState<"loading" | "empty" | "success" | "error">("loading");
  const [lastTicketId, setLastTicketId] = useState("");
  const [workflowState, setWorkflowState] = useState<"empty" | "loading" | "success" | "error">("empty");
  const [workflowMessage, setWorkflowMessage] = useState("Ready for ticket or message entry.");

  const refreshSummary = useCallback(async () => {
    return apiClient<SupportSummary>("/support/summary")
      .then((data) => {
        setSummary(data);
        setState(data.tickets ? "success" : "empty");
      })
      .catch(() => setState("error"));
  }, []);

  const refreshTickets = useCallback(async () => {
    const nextTickets = await apiClient<SupportTicket[]>("/support/tickets").catch(() => []);
    setTickets(nextTickets.slice(0, 8));
    const selectedTicketId = lastTicketId || nextTickets[0]?.id || "";
    if (selectedTicketId) {
      const nextMessages = await apiClient<TicketMessage[]>(`/support/tickets/${selectedTicketId}/messages`).catch(() => []);
      setMessages(nextMessages.slice(-8));
    } else {
      setMessages([]);
    }
  }, [lastTicketId]);

  const refreshOperations = useCallback(async () => {
    const nextOperations = await apiClient<SupportOperations>("/support/operations").catch(() => ({
      liveChat: { mode: "unavailable", status: "error", detail: "Support operations failed to load." },
      slaRules: [],
      escalationPaths: [],
      knowledgeBase: []
    }));
    setOperations(nextOperations);
  }, []);

  async function loadTicketMessages(ticketId: string) {
    setLastTicketId(ticketId);
    const nextMessages = await apiClient<TicketMessage[]>(`/support/tickets/${ticketId}/messages`).catch(() => []);
    setMessages(nextMessages.slice(-8));
  }

  useEffect(() => {
    void refreshSummary();
    void refreshOperations();
    void refreshTickets();
  }, [refreshOperations, refreshSummary, refreshTickets]);

  async function createTicket(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Creating ticket.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      const ticket = await apiClient<{ id: string }>("/support/tickets", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          subject: String(formData.get("subject") || ""),
          priority: String(formData.get("priority") || "MEDIUM"),
          status: String(formData.get("status") || "OPEN")
        })
      });
      setLastTicketId(ticket.id);
      await refreshSummary();
      await loadTicketMessages(ticket.id);
      await refreshTickets();
      setWorkflowState("success");
      setWorkflowMessage("Ticket created and support metrics refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Ticket creation failed.");
    }
  }

  async function addTicketMessage(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Adding ticket message.");
    try {
      const ticketId = String(formData.get("ticketId") || lastTicketId || "");
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient(`/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          message: String(formData.get("message") || ""),
          internal: formData.get("internal") === "on"
        })
      });
      await refreshSummary();
      await loadTicketMessages(ticketId);
      await refreshTickets();
      setWorkflowState("success");
      setWorkflowMessage("Ticket message added.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Ticket message failed.");
    }
  }

  async function updateTicketStatus(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Updating ticket status.");
    const ticketId = String(formData.get("ticketId") || lastTicketId || "");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient(`/support/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          status: String(formData.get("status") || "IN_PROGRESS")
        })
      });
      await refreshSummary();
      await refreshTickets();
      setWorkflowState("success");
      setWorkflowMessage("Ticket status updated and support metrics refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Ticket status update failed.");
    }
  }

  return (
    <section className="py-8">
      <h1 className="text-4xl font-bold">Support OS</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Ticketing, priority, status, internal notes, customer communication, and escalation foundation.
      </p>
      <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <MetricGrid
          metrics={[
            { label: "Tickets", value: String(summary.tickets), detail: "Total support load" },
            { label: "Open", value: String(summary.open), detail: "Needs action" },
            { label: "Urgent", value: String(summary.urgent), detail: "Highest priority" },
            { label: "Resolved", value: String(summary.resolved), detail: "Closed or resolved" },
            { label: "SLA", value: String(operations.slaRules.length), detail: "Response and resolution rules" },
            { label: "State", value: state, detail: "Support API status" }
          ]}
        />
      </div>
      <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Support Operations</h2>
            <p className="mt-2 text-sm text-ink-muted">Live chat mode, SLA rules, escalation paths, and knowledge base guidance.</p>
          </div>
          <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={() => void refreshOperations()}>
            Refresh operations
          </button>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <div className="rounded-md border border-line bg-canvas p-4">
            <p className="text-sm font-semibold text-accent">Live Chat</p>
            <h3 className="mt-2 text-lg font-bold">{operations.liveChat.mode}</h3>
            <p className="mt-1 text-sm text-ink-muted">{operations.liveChat.detail}</p>
            <p className="mt-3 text-xs font-semibold uppercase text-ink-muted">{operations.liveChat.status}</p>
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <p className="text-sm font-semibold text-accent">Escalation Paths</p>
            <ul className="mt-3 grid gap-2 text-sm">
              {operations.escalationPaths.map((path) => (
                <li key={path.trigger}>
                  <span className="font-semibold">{path.trigger}</span>: {path.ownerRole} - {path.nextStep}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <p className="text-sm font-semibold text-accent">Knowledge Base</p>
            <ul className="mt-3 grid gap-2 text-sm">
              {operations.knowledgeBase.map((article) => (
                <li key={article.title}>
                  <span className="font-semibold">{article.title}</span> ({article.audience}): {article.summary}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-ink-muted">
              <tr>
                <th className="border-b border-line py-2 pr-4 font-semibold">Priority</th>
                <th className="border-b border-line py-2 pr-4 font-semibold">First response</th>
                <th className="border-b border-line py-2 pr-4 font-semibold">Resolution</th>
              </tr>
            </thead>
            <tbody>
              {operations.slaRules.map((rule) => (
                <tr key={rule.priority} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4">{rule.priority}</td>
                  <td className="py-3 pr-4">{rule.responseTargetMinutes} minutes</td>
                  <td className="py-3 pr-4">{rule.resolutionTargetHours} hours</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <form action={createTicket} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Create Ticket</h2>
          <div className="mt-4 grid gap-3">
            <label className="text-sm font-semibold">
              Subject
              <input name="subject" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Need onboarding help" />
            </label>
            <label className="text-sm font-semibold">
              Priority
              <select name="priority" defaultValue="MEDIUM" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Status
              <select name="status" defaultValue="OPEN" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="WAITING_ON_CUSTOMER">Waiting on customer</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </label>
          </div>
          <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Ticket
          </button>
        </form>

        <form action={addTicketMessage} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Add Message</h2>
          <div className="mt-4 grid gap-3">
            <label className="text-sm font-semibold">
              Ticket ID
              <input name="ticketId" defaultValue={lastTicketId} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Use saved ticket ID" />
            </label>
            <label className="text-sm font-semibold">
              Message
              <textarea name="message" className="mt-2 min-h-28 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="We are checking this now." />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input name="internal" type="checkbox" className="h-4 w-4" />
              Internal note
            </label>
          </div>
          <button className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Message
          </button>
        </form>

        <form action={updateTicketStatus} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Update Ticket Status</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Ticket ID
              <input name="ticketId" defaultValue={lastTicketId} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Use saved ticket ID" />
            </label>
            <label className="text-sm font-semibold">
              Status
              <select name="status" defaultValue="IN_PROGRESS" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="WAITING_ON_CUSTOMER">Waiting on customer</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </label>
          </div>
          <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
            Update Status
          </button>
        </form>
      </section>
      <div className="mt-6">
        <StatePanel state={workflowState} title="Support workflow" detail={workflowMessage} />
      </div>
      <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold">Recent Tickets</h2>
            <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={() => void refreshTickets()}>
              Refresh tickets
            </button>
          </div>
          {tickets.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-ink-muted">
                  <tr>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Subject</th>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Priority</th>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Status</th>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Messages</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-line last:border-0">
                      <td className="py-3 pr-4">{ticket.subject}</td>
                      <td className="py-3 pr-4">{ticket.priority}</td>
                      <td className="py-3 pr-4">{ticket.status}</td>
                      <td className="py-3 pr-4">
                        <button className="rounded-md border border-line px-3 py-1 text-xs font-semibold" type="button" onClick={() => void loadTicketMessages(ticket.id)}>
                          View messages
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <StatePanel state="empty" title="No tickets" detail="Saved support tickets will appear here." />
          )}
        </div>

        <div className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Ticket Messages</h2>
          <p className="mt-2 text-sm text-ink-muted">{lastTicketId ? `Showing messages for ${lastTicketId}.` : "Select or create a ticket to view messages."}</p>
          {messages.length ? (
            <ul className="mt-4 grid gap-3">
              {messages.map((message) => (
                <li key={message.id} className="rounded-md border border-line bg-canvas p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase text-ink-muted">{message.internal ? "Internal" : "Public"}</span>
                    <span className="text-xs text-ink-muted">{message.createdAt}</span>
                  </div>
                  <p className="mt-2 text-sm">{message.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <StatePanel state="empty" title="No messages" detail="Ticket replies and internal notes will appear here." />
          )}
        </div>
      </section>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <StatePanel state="loading" title="Loading tickets" detail="Shown while support data loads." />
        <StatePanel state="empty" title="No tickets" detail="Shown before support tickets exist." />
        <StatePanel state="error" title="Support error" detail="Shown when ticket APIs fail." />
        <StatePanel state="success" title="Support ready" detail="Ticketing foundation is available." />
      </div>
    </section>
  );
}
