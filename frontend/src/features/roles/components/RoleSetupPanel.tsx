"use client";

import { useEffect, useState, useTransition } from "react";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";
import { coreRoles, permissionGroups, type CoreRole } from "@vmnexus/shared/roles";

type RoleSummary = {
  role: CoreRole;
  permissions: string[];
  finalControl: boolean;
};

type PermissionCheck = {
  role: CoreRole;
  permission: string;
  allowed: boolean;
};

export function RoleSetupPanel() {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [selectedRole, setSelectedRole] = useState<CoreRole>("Founder");
  const [selectedPermission, setSelectedPermission] = useState<(typeof permissionGroups)[number]>("organization:manage");
  const [check, setCheck] = useState<PermissionCheck | null>(null);
  const [state, setState] = useState<"loading" | "empty" | "success" | "error">("loading");
  const [message, setMessage] = useState("Loading role matrix.");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    apiClient<RoleSummary[]>("/roles")
      .then((data) => {
        setRoles(data);
        setState(data.length ? "success" : "empty");
        setMessage(data.length ? "Role matrix loaded." : "No roles returned.");
      })
      .catch((error) => {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Unable to load roles.");
      });
  }, []);

  function runPermissionCheck() {
    startTransition(async () => {
      setState("loading");
      setMessage("Checking permission.");
      try {
        const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
        const result = await apiClient<PermissionCheck>("/roles/check", {
          method: "POST",
          headers: { "x-csrf-token": csrf.csrfToken },
          body: JSON.stringify({ role: selectedRole, permission: selectedPermission })
        });
        setCheck(result);
        setState("success");
        setMessage(result.allowed ? "Permission is allowed." : "Permission is denied for this role.");
      } catch (error) {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Permission check failed.");
      }
    });
  }

  const currentRole = roles.find((item) => item.role === selectedRole);

  return (
    <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Role Setup</h2>
          <p className="mt-2 text-sm text-ink-muted">{message}</p>
        </div>
        <span className="rounded-md border border-line px-3 py-2 text-sm font-semibold uppercase">{state}</span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="text-sm font-semibold">
          Role
          <select className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as CoreRole)}>
            {coreRoles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Permission
          <select className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm" value={selectedPermission} onChange={(event) => setSelectedPermission(event.target.value as (typeof permissionGroups)[number])}>
            {permissionGroups.map((permission) => (
              <option key={permission} value={permission}>{permission}</option>
            ))}
          </select>
        </label>
        <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={isPending} type="button" onClick={runPermissionCheck}>
          {isPending ? "Checking..." : "Check permission"}
        </button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <StatePanel state="loading" title="Loading roles" detail="Shown while role matrix loads." />
        <StatePanel state="empty" title="No roles" detail="Shown before role data is available." />
        <StatePanel state="error" title="Role error" detail="Shown when role APIs fail." />
        <StatePanel state={state === "success" ? "success" : state === "error" ? "error" : "empty"} title="Role state" detail="Role and permission setup is available." />
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="rounded-md border border-line bg-muted p-4">
          <h3 className="text-sm font-bold">Selected Role Permissions</h3>
          <p className="mt-2 text-sm text-ink-muted">
            {currentRole?.permissions.length ? currentRole.permissions.join(", ") : "Load roles to view permissions."}
          </p>
        </article>
        <article className="rounded-md border border-line bg-muted p-4">
          <h3 className="text-sm font-bold">Permission Check</h3>
          <p className="mt-2 text-sm text-ink-muted">
            {check ? `${check.role} ${check.allowed ? "can" : "cannot"} use ${check.permission}.` : "Choose a role and permission to check."}
          </p>
        </article>
      </div>
    </section>
  );
}
