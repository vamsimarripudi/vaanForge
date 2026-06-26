"use client";

import { useState, useTransition } from "react";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

type UploadedFile = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  storageProvider: string;
  storageKey: string;
  storageUrl: string;
  folder: string;
  tags: string[];
  version: number;
  expiresAt?: string;
  documentType: string;
  expiryReminder: string;
};

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export function FileUploadPanel() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [state, setState] = useState<"empty" | "loading" | "success" | "error">("empty");
  const [message, setMessage] = useState("Upload operational documents through the storage abstraction.");
  const [isPending, startTransition] = useTransition();

  function upload(formData: FormData) {
    startTransition(async () => {
      const file = formData.get("file");
      if (!(file instanceof File) || !file.name) {
        setState("error");
        setMessage("Choose a file before uploading.");
        return;
      }

      setState("loading");
      setMessage("Uploading file.");
      try {
        const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
        const contentBase64 = await toBase64(file);
        const uploaded = await apiClient<UploadedFile>("/files/uploads", {
          method: "POST",
          headers: { "x-csrf-token": csrf.csrfToken },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            folder: String(formData.get("folder") || "settings"),
            tags: String(formData.get("tags") || "")
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            version: Number(formData.get("version") || 1),
            expiresAt: String(formData.get("expiresAt") || ""),
            documentType: String(formData.get("documentType") || "GENERAL"),
            contentBase64
          })
        });
        setUploadedFile(uploaded);
        setState("success");
        setMessage("File uploaded and audited.");
      } catch (error) {
        setState("error");
        setMessage(error instanceof Error ? error.message : "File upload failed.");
      }
    });
  }

  return (
    <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold">File Uploads</h2>
          <p className="mt-2 text-sm text-ink-muted">{message}</p>
        </div>
        <span className="rounded-md border border-line px-3 py-2 text-sm font-semibold uppercase">{state}</span>
      </div>
      <form action={upload} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_0.55fr_0.55fr_0.55fr_0.55fr_auto] xl:items-end">
        <label className="text-sm font-semibold">
          File
          <input name="file" type="file" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold">
          Folder
          <input name="folder" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm" defaultValue="settings" />
        </label>
        <label className="text-sm font-semibold">
          Tags
          <input name="tags" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm" placeholder="legal,customer" />
        </label>
        <label className="text-sm font-semibold">
          Version
          <input name="version" type="number" min={1} defaultValue={1} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold">
          Expires
          <input name="expiresAt" type="date" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-semibold">
          Type
          <select name="documentType" defaultValue="GENERAL" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm">
            <option value="GENERAL">General</option>
            <option value="AGREEMENT">Agreement</option>
            <option value="INVOICE">Invoice</option>
            <option value="LEGAL">Legal</option>
            <option value="HR">HR</option>
            <option value="CA">CA</option>
            <option value="CUSTOMER">Customer</option>
          </select>
        </label>
        <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={isPending} type="submit">
          {isPending ? "Uploading..." : "Upload file"}
        </button>
      </form>
      <section className="mt-5 rounded-md border border-line bg-muted p-4">
        <h3 className="text-lg font-bold">Document OS Metadata</h3>
        <p className="mt-2 text-sm text-ink-muted">
          Folders, tags, versioning, expiry reminders, agreements, invoices, legal docs, HR docs, CA docs, and customer docs are captured with each upload.
        </p>
      </section>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <StatePanel state="loading" title="Uploading" detail="Shown while file content is sent." />
        <StatePanel state="empty" title="No file" detail="Shown before a file is selected." />
        <StatePanel state="error" title="Upload error" detail="Shown when validation or storage fails." />
        <StatePanel state={state === "success" ? "success" : state === "error" ? "error" : "empty"} title="Storage state" detail="Storage provider response is available after upload." />
      </div>
      {uploadedFile ? (
        <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-md border border-line bg-muted p-3">
            <dt className="font-semibold">Storage</dt>
            <dd className="mt-1 text-ink-muted">{uploadedFile.storageProvider}</dd>
          </div>
          <div className="rounded-md border border-line bg-muted p-3">
            <dt className="font-semibold">Key</dt>
            <dd className="mt-1 break-all text-ink-muted">{uploadedFile.storageKey}</dd>
          </div>
          <div className="rounded-md border border-line bg-muted p-3">
            <dt className="font-semibold">Size</dt>
            <dd className="mt-1 text-ink-muted">{uploadedFile.sizeBytes} bytes</dd>
          </div>
          <div className="rounded-md border border-line bg-muted p-3">
            <dt className="font-semibold">Checksum</dt>
            <dd className="mt-1 break-all text-ink-muted">{uploadedFile.checksum}</dd>
          </div>
          <div className="rounded-md border border-line bg-muted p-3">
            <dt className="font-semibold">Document type</dt>
            <dd className="mt-1 text-ink-muted">{uploadedFile.documentType}</dd>
          </div>
          <div className="rounded-md border border-line bg-muted p-3">
            <dt className="font-semibold">Version</dt>
            <dd className="mt-1 text-ink-muted">{uploadedFile.version}</dd>
          </div>
          <div className="rounded-md border border-line bg-muted p-3">
            <dt className="font-semibold">Tags</dt>
            <dd className="mt-1 text-ink-muted">{uploadedFile.tags.join(", ") || "None"}</dd>
          </div>
          <div className="rounded-md border border-line bg-muted p-3">
            <dt className="font-semibold">Expiry reminder</dt>
            <dd className="mt-1 text-ink-muted">{uploadedFile.expiryReminder}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
