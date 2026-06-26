"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { developerApi } from "../services/developerApi";
import type { DeveloperApiKey, DeveloperApp, DeveloperMode, DeveloperPlugin, DeveloperWebhook } from "../types";

const navItems: Array<[string, string, DeveloperMode]> = [
  ["/developers", "Dashboard", "dashboard"],
  ["/developers/apps", "Apps", "apps"],
  ["/developers/api-keys", "API Keys", "apiKeys"],
  ["/developers/docs", "Docs", "docs"],
  ["/developers/sdk", "SDKs", "sdk"],
  ["/developers/webhooks", "Webhooks", "webhooks"],
  ["/developers/plugins", "Plugins", "plugins"],
  ["/developers/usage", "Usage", "usage"]
];

export function DeveloperPlatform({ mode }: { mode: DeveloperMode }) {
  const [data, setData] = useState<Record<string, unknown> | unknown[] | null>(null);
  const [state, setState] = useState<"loading" | "success" | "empty" | "error">("loading");
  const [message, setMessage] = useState("");
  const loaders = useMemo(() => ({
    dashboard: developerApi.dashboard,
    apps: developerApi.apps,
    apiKeys: developerApi.apiKeys,
    docs: developerApi.docs,
    sdk: developerApi.sdk,
    webhooks: developerApi.webhooks,
    plugins: developerApi.plugins,
    usage: developerApi.usage
  }), []);

  async function load() {
    setState("loading");
    try {
      const result = await loaders[mode]();
      setData(result);
      setState(Array.isArray(result) && !result.length ? "empty" : "success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Developer platform data unavailable.");
      setState("error");
    }
  }

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        const result = await loaders[mode]();
        if (!mounted) return;
        setData(result);
        setState(Array.isArray(result) && !result.length ? "empty" : "success");
      } catch (error) {
        if (!mounted) return;
        setMessage(error instanceof Error ? error.message : "Developer platform data unavailable.");
        setState("error");
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [loaders, mode]);

  async function createApp() {
    const name = window.prompt("App name") || "";
    const description = window.prompt("App description") || "";
    if (name.length < 2 || description.length < 8) return;
    if (!window.confirm("Create this developer app and OAuth client?")) return;
    await developerApi.createApp({ name, description, redirectUris: ["https://example.com/oauth/callback"], scopes: ["agent:read", "usage:read"] });
    await load();
  }

  async function createKey() {
    const name = window.prompt("API key name") || "";
    if (name.length < 2) return;
    if (!window.confirm("Create a scoped API key? The secret is only returned once.")) return;
    const created = await developerApi.createApiKey({ name, scopes: ["agent:read", "events:write", "usage:read"] });
    window.alert(`Store this secret securely now: ${String((created as { secret?: string }).secret || "secret unavailable")}`);
    await load();
  }

  async function keyAction(keyId: string, action: "rotate" | "revoke") {
    if (!window.confirm(`Confirm ${action} for ${keyId}?`)) return;
    const result = action === "rotate" ? await developerApi.rotateApiKey(keyId) : await developerApi.revokeApiKey(keyId);
    if (action === "rotate") window.alert(`New secret: ${String((result as { secret?: string }).secret || "secret unavailable")}`);
    await load();
  }

  async function createWebhook() {
    const url = window.prompt("Webhook URL") || "";
    if (!url.startsWith("https://")) return;
    if (!window.confirm("Create webhook endpoint with signing secret and retry policy?")) return;
    const created = await developerApi.createWebhook({ url, events: ["agent.lifecycle", "build.completed", "deployment.completed", "validation.failed"], retryPolicy: { maxAttempts: 5, backoffSeconds: [30, 120, 600] } });
    window.alert(`Store this signing secret securely now: ${String((created as { signingSecret?: string }).signingSecret || "secret unavailable")}`);
    await load();
  }

  async function registerPlugin() {
    const name = window.prompt("Plugin name") || "";
    if (name.length < 2) return;
    if (!window.confirm("Register plugin for review?")) return;
    await developerApi.registerPlugin({ name, pluginType: "agent", version: "1.0.0", permissions: ["agent:read"], manifest: { entry: "index.js", hooks: ["agent.lifecycle"], apiVersion: "v1" }, status: "review" });
    await load();
  }

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">KRAVIA Developer Platform</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">{titleFor(mode)}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">Build, integrate, automate, and extend the KRAVIA AI ecosystem through versioned APIs, SDKs, webhooks, plugins, OAuth-ready apps, and audited developer credentials.</p>
        </div>
        <span className="w-fit rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold uppercase text-ink-muted">{state}</span>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {navItems.map(([href, label, itemMode]) => <Link key={href} className={`rounded-md border border-line px-3 py-2 hover:bg-muted ${itemMode === mode ? "bg-primary text-white" : "bg-surface"}`} href={href}>{label}</Link>)}
      </nav>

      {state === "error" ? <StatePanel state="error" title="Developer data unavailable" detail={message} /> : null}
      {state === "empty" ? <StatePanel state="empty" title="No developer records yet" detail="Create an app, API key, webhook, or plugin to start integrating with KRAVIA." /> : null}

      {mode === "dashboard" ? <Dashboard data={asRecord(data)} /> : null}
      {mode === "apps" ? <Apps apps={Array.isArray(data) ? data as DeveloperApp[] : []} onCreate={createApp} /> : null}
      {mode === "apiKeys" ? <ApiKeys keys={Array.isArray(data) ? data as DeveloperApiKey[] : []} onCreate={createKey} onAction={keyAction} /> : null}
      {mode === "webhooks" ? <Webhooks webhooks={Array.isArray(data) ? data as DeveloperWebhook[] : []} onCreate={createWebhook} /> : null}
      {mode === "plugins" ? <Plugins plugins={Array.isArray(data) ? data as DeveloperPlugin[] : []} onCreate={registerPlugin} /> : null}
      {!["dashboard", "apps", "apiKeys", "webhooks", "plugins"].includes(mode) ? <JsonPanel title={titleFor(mode)} value={data || {}} /> : null}
    </section>
  );
}

function Dashboard({ data }: { data: Record<string, unknown> }) {
  const totals = asRecord(data.totals);
  return <><div className="mt-6 grid gap-3 md:grid-cols-5"><Metric label="Apps" value={String(totals.apps || 0)} /><Metric label="Keys" value={String(totals.activeKeys || 0)} /><Metric label="Webhooks" value={String(totals.webhooks || 0)} /><Metric label="Plugins" value={String(totals.plugins || 0)} /><Metric label="Requests" value={String(totals.requestsToday || 0)} /></div><JsonPanel title="Developer Account Evidence" value={data} /></>;
}

function Apps({ apps, onCreate }: { apps: DeveloperApp[]; onCreate: () => void }) {
  return <Panel title="OAuth Applications"><button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={onCreate}>Create app</button>{apps.map((app) => <Row key={app.appId} title={app.name} meta={app.appId} right={app.status} detail={app.nextAction} />)}</Panel>;
}

function ApiKeys({ keys, onCreate, onAction }: { keys: DeveloperApiKey[]; onCreate: () => void; onAction: (keyId: string, action: "rotate" | "revoke") => void }) {
  return <Panel title="API Key Management"><button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={onCreate}>Create key</button>{keys.map((key) => <div key={key.keyId} className="rounded-md border border-line bg-muted p-3"><Row title={key.name} meta={`${key.prefix}...`} right={key.status} detail={key.scopes.join(", ")} /><div className="mt-3 flex gap-2"><button className="rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold" onClick={() => onAction(key.keyId, "rotate")}>Rotate</button><button className="rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold" onClick={() => onAction(key.keyId, "revoke")}>Revoke</button></div></div>)}</Panel>;
}

function Webhooks({ webhooks, onCreate }: { webhooks: DeveloperWebhook[]; onCreate: () => void }) {
  return <Panel title="Webhook Endpoints"><button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={onCreate}>Create webhook</button>{webhooks.map((webhook) => <Row key={webhook.webhookId} title={webhook.url} meta={webhook.webhookId} right={webhook.status} detail={`${webhook.events.join(", ")} | failures ${webhook.failureCount}`} />)}</Panel>;
}

function Plugins({ plugins, onCreate }: { plugins: DeveloperPlugin[]; onCreate: () => void }) {
  return <Panel title="Plugin Registry"><button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={onCreate}>Register plugin</button>{plugins.map((plugin) => <Row key={plugin.pluginId} title={plugin.name} meta={`${plugin.pluginType} ${plugin.version}`} right={plugin.status} detail={plugin.nextAction} />)}</Panel>;
}

function Row({ title, meta, right, detail }: { title: string; meta: string; right: string; detail: string }) {
  return <div className="grid gap-2 rounded-md border border-line bg-muted p-3 md:grid-cols-[1fr_0.4fr]"><div><strong>{title}</strong><p className="font-mono text-xs text-ink-muted">{meta}</p><p className="mt-2 text-sm text-ink-muted">{detail}</p></div><span className="text-sm font-semibold">{right}</span></div>;
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return <Panel title={title}><pre className="max-h-[620px] overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(value, null, 2)}</pre></Panel>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel"><h2 className="text-xl font-bold">{title}</h2><div className="mt-4 grid gap-3">{children}</div></section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-line bg-surface p-4 shadow-panel"><p className="text-xs font-semibold uppercase text-accent">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>;
}

function titleFor(mode: DeveloperMode) {
  return ({ dashboard: "Developer Dashboard", apps: "OAuth Apps", apiKeys: "API Keys", docs: "API Explorer and Docs", sdk: "SDK Downloads", webhooks: "Webhooks", plugins: "Plugin Framework", usage: "Usage Analytics" } as const)[mode];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
