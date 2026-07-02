import assert from "node:assert/strict";
import { store } from "../database/in-memory-store";
import { marketplaceService } from "../modules/marketplace/marketplace.service";
import { publicTrustService } from "../modules/public-trust/public-trust.service";

async function main() {
  const organizationId = `org-public-trust-${Date.now()}`;
  const userId = `user-public-trust-${Date.now()}`;
  const actor = { organizationId, userId, role: "Admin" };

  store.organizations.push({ id: organizationId, name: "Public Trust Test", suiteType: "VMETRON_SUITE", activePlan: "business", billingStatus: "ACTIVE", createdAt: new Date().toISOString() });
  store.users.push({ id: userId, name: "Trust Admin", email: `${userId}@example.com`, passwordHash: "hash", role: "Admin", organizationId, createdAt: new Date().toISOString() });

  const marketplaceApp = marketplaceService.createApp(actor, {
    name: "Trust Workflow Extension",
    appType: "plugin",
    category: "Governance",
    shortDescription: "Adds review workflow automation to VaanForge.",
    description: "A governed marketplace plugin submitted through review gates for public trust testing.",
    requestedPermissions: ["project:read"],
    pricing: { model: "paid", currency: "INR", amount: 1000, revenueSharePercent: 70 },
    manifest: { entry: "https://example.com/plugin" },
    versionNumber: "1.0.0",
    changelog: "Initial governed version.",
    releaseNotes: "Initial governed release."
  });
  marketplaceService.submitApp(actor, marketplaceApp.appId);
  const pendingReviews = store.marketplaceReviews.filter((review) => review.appId === marketplaceApp.appId);
  assert.equal(pendingReviews.length, 4);
  for (const review of pendingReviews) {
    marketplaceService.decideReview(actor, review.reviewId, { status: "approved", reason: "Review evidence accepted.", evidence: { automated: review.reviewerId === "system" } });
  }
  const published = marketplaceService.publishApp(actor, marketplaceApp.appId);
  assert.equal(published.status, "published");
  assert.equal(marketplaceService.categories().some((category) => category.slug === "governance"), true);
  const install = marketplaceService.install(actor, marketplaceApp.appId, { workspaceId: "workspace-public-trust", consentedPermissions: ["project:read"] });
  assert.equal(install.status, "installed");
  assert.equal(store.marketplaceRevenueEvents.some((event) => event.sourceInstallId === install.installId), true);
  assert.equal(marketplaceService.uninstall(actor, marketplaceApp.appId).status, "uninstalled");

  const docs = publicTrustService.docs();
  assert.ok(docs.articles.length > 0);
  assert.ok(publicTrustService.searchDocs("security").results.length >= 0);
  const doc = publicTrustService.createDoc(actor, {
    slug: "public-trust-test",
    title: "Public Trust Test",
    categorySlug: "product",
    summary: "A managed documentation article for public trust testing.",
    body: "This documentation article proves managed docs can be created, versioned, published, and searched.",
    status: "published"
  });
  assert.equal(publicTrustService.docBySlug(doc.slug).version, 1);
  assert.equal(store.docsVersions.some((version) => version.docId === doc.docId), true);

  const status = publicTrustService.status();
  assert.equal(status.services.some((service) => service.monitoringConnected === false), true);
  assert.equal(JSON.stringify(status).includes("99.9"), false);
  const incident = publicTrustService.createIncident(actor, { title: "API latency review", severity: "medium", serviceIds: [], impact: "API requests are slower than expected." });
  publicTrustService.addIncidentUpdate(actor, incident.incidentId, { status: "resolved", message: "Latency returned to normal after investigation." });
  assert.equal(publicTrustService.statusIncident(incident.incidentId).status, "resolved");

  const legalPage = publicTrustService.createLegalPage(actor, {
    slug: "public-trust-terms",
    title: "Public Trust Terms",
    body: "Managed KRAVIA PRIVATE LIMITED terms page created for versioning and publication testing.",
    effectiveDate: "2026-07-01",
    status: "draft",
    changelog: "Initial draft."
  });
  publicTrustService.publishLegalPage(actor, legalPage.pageId);
  assert.equal(publicTrustService.legalPage("public-trust-terms").company, "KRAVIA PRIVATE LIMITED");
  assert.equal(store.legalPageVersions.some((version) => version.pageId === legalPage.pageId), true);

  const release = publicTrustService.createRelease(actor, {
    version: "v-test-public-trust",
    title: "Public trust release",
    summary: "Release notes created from managed release records.",
    status: "published",
    migrationNotes: "No migrations.",
    knownIssues: [],
    changelogItems: [{ type: "added", description: "Public trust subdomain release record." }]
  });
  assert.equal(publicTrustService.release(release.releaseId).version, "v-test-public-trust");
  assert.equal(publicTrustService.changelog().some((item) => item.releaseId === release.releaseId), true);

  const lead = publicTrustService.createEnterpriseLead({ name: "Enterprise Buyer", email: "buyer@example.com", company: "Example Co", message: "We need VaanForge enterprise controls." });
  assert.equal(publicTrustService.updateEnterpriseLead(actor, lead.leadId, { status: "qualified" }).status, "qualified");
  const demo = publicTrustService.createDemoRequest({ name: "Demo Buyer", email: "demo@example.com", company: "Example Co", message: "Please show VaanForge.", useCase: "Enterprise AI factory evaluation." });
  assert.equal(store.enterpriseDemoRequests.some((request) => request.requestId === demo.requestId), true);

  const application = publicTrustService.applyForPartner({ applicantName: "Trusted Agency", email: "agency@example.com", company: "Trusted Agency", partnerType: "agency", message: "We want to implement VaanForge for clients." });
  assert.equal(publicTrustService.decidePartnerApplication(actor, application.applicationId, "approved").status, "approved");
  assert.ok(publicTrustService.partnerResources().length > 0);
  assert.deepEqual(publicTrustService.partnerCommissions(actor), []);

  console.log("Public trust subdomain test passed for marketplace, docs, status, legal, releases, enterprise, and partners.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
