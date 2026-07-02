import assert from "node:assert/strict";
import { store } from "../database/in-memory-store";
import { accountService, hashSecret, safeHashEqual } from "../modules/account/account.service";
import { billingService } from "../modules/billing/billing.service";

async function main() {
  const organizationId = `org-account-subdomains-${Date.now()}`;
  const customerId = `user-customer-${Date.now()}`;
  const otherCustomerId = `user-other-${Date.now()}`;
  const adminId = `user-admin-${Date.now()}`;

  store.organizations.push({ id: organizationId, name: "Account Subdomain Test", suiteType: "VMETRON_SUITE", activePlan: "free", billingStatus: "TRIAL", createdAt: new Date().toISOString() });
  store.workspaces.push({ id: `workspace-${Date.now()}`, organizationId, suiteType: "VMETRON_SUITE", name: "Account Workspace", enabledProducts: ["VAANFORGE"], status: "ACTIVE", createdAt: new Date().toISOString() });
  store.users.push(
    { id: customerId, name: "Customer User", email: `${customerId}@example.com`, passwordHash: "hash", role: "Customer", organizationId, createdAt: new Date().toISOString() },
    { id: otherCustomerId, name: "Other User", email: `${otherCustomerId}@example.com`, passwordHash: "hash", role: "Customer", organizationId, createdAt: new Date().toISOString() },
    { id: adminId, name: "Support Admin", email: `${adminId}@example.com`, passwordHash: "hash", role: "Admin", organizationId, createdAt: new Date().toISOString() }
  );

  const customer = { userId: customerId, organizationId, role: "Customer", sessionId: "session-customer" };
  const otherCustomer = { userId: otherCustomerId, organizationId, role: "Customer", sessionId: "session-other" };
  const admin = { userId: adminId, organizationId, role: "Admin", sessionId: "session-admin" };

  const profile = accountService.updateProfile(customer, { displayName: "VaanForge Customer", timezone: "Asia/Kolkata" });
  assert.equal(profile.profile.displayName, "VaanForge Customer");

  const aiPreferences = accountService.updateAiPreferences(customer, { defaultTone: "concise", approvalMode: "strict", allowMemory: false });
  assert.equal(accountService.aiPreferences(customer).value, aiPreferences.value);

  const workspace = accountService.updateWorkspace(customer, { name: "Production Workspace" });
  assert.equal(workspace.name, "Production Workspace");

  const keyResult = accountService.createApiKey(customer, { name: "Live automation", scopes: ["projects:read"], environment: "live" });
  const storedKey = store.apiKeys.find((item) => item.keyId === keyResult.key.keyId);
  assert.ok(storedKey, "API key must be stored");
  assert.notEqual(storedKey!.keyHash, keyResult.secret, "Full API secret must not be stored");
  assert.equal(storedKey!.keyHash, hashSecret(keyResult.secret));
  assert.equal(safeHashEqual(keyResult.secret, storedKey!.keyHash), true);

  const rotated = accountService.rotateApiKey(customer, keyResult.key.keyId);
  assert.ok(rotated.secret.startsWith("vf_live_"));
  assert.equal(accountService.revokeApiKey(customer, rotated.key.keyId).status, "revoked");

  const ticket = accountService.createTicket(customer, {
    subject: "Blueprint approval question",
    category: "Technical",
    priority: "HIGH",
    message: "Need help reviewing an approval checkpoint."
  });
  assert.equal(accountService.customerTickets(customer).length, 1);
  assert.equal(accountService.customerTickets(otherCustomer).length, 0, "Customers must not see another user's tickets");

  accountService.internalNote(admin, ticket.ticket.id, { note: "Admin-only triage note." });
  const customerTicketView = accountService.ticket(customer, ticket.ticket.id, false);
  assert.equal(customerTicketView.messages.some((message) => message.internal), false, "Internal notes must stay hidden from customers");
  const adminTicketView = accountService.ticket(admin, ticket.ticket.id, true);
  assert.ok(adminTicketView.internalNotes?.length, "Admin support view must include internal notes");

  const article = accountService.createArticle(admin, { title: "Getting started", slug: "getting-started", body: "Use the guided builder flow.", category: "General", status: "draft" });
  assert.equal(accountService.patchArticle(admin, article.articleId, { status: "published" }).status, "published");
  assert.equal(accountService.articles(customer).length, 1);

  const announcement = accountService.createAnnouncement(admin, { title: "Support hours", body: "Support coverage is available.", status: "draft" });
  assert.equal(accountService.patchAnnouncement(admin, announcement.announcementId, { status: "published" }).status, "published");
  assert.equal(accountService.announcements(customer).length, 1);

  const exportRequest = accountService.requestDataExport(customer);
  const deleteRequest = accountService.requestDataDeletion(customer, "Privacy review");
  assert.equal(store.dataExportRequests.some((item) => item.requestId === exportRequest.requestId), true);
  assert.equal(store.dataDeleteRequests.some((item) => item.requestId === deleteRequest.requestId), true);

  const plans = billingService.plans(undefined);
  assert.ok(plans.find((plan) => plan.name === "Professional" && plan.monthlyPrice === 299900 && plan.features.includes("Most Popular")), "Approved Professional plan must be backend sourced and marked popular");

  const webhook = billingService.handleRazorpayWebhook({ signature: "local", payload: { id: "evt-account-subdomains", event: "payment.captured" } });
  const duplicate = billingService.handleRazorpayWebhook({ signature: "local", payload: { id: "evt-account-subdomains", event: "payment.captured" } });
  assert.equal(webhook.status, "processed");
  assert.equal(duplicate.status, "duplicate");

  console.log("Account subdomain test passed for profile, settings, API keys, support, billing plans, and Razorpay webhook idempotency.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
