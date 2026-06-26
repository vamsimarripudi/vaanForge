import assert from "node:assert/strict";
import { agentMemoryService } from "../modules/vaanforge/agent-memory.service";

async function main() {
  const organizationId = `org-agent-memory-${Date.now()}`;
  const actorId = "founder-user";

  await assert.rejects(
    () =>
      agentMemoryService.create(organizationId, actorId, {
        title: "Secret memory",
        memoryType: "deployment",
        content: "The deploy token=abc123 should never be stored.",
        summary: "Unsafe secret",
        tags: ["deployment"],
        confidenceScore: 0.9,
        source: { sourceType: "manual", sourceRef: "unsafe", evidence: {} },
        ownerId: actorId,
        priority: "HIGH"
      }),
    /Sensitive secret-like content/
  );

  const memory = await agentMemoryService.create(organizationId, actorId, {
    title: "Prisma migration fix",
    memoryType: "error_fix",
    content: "When Prisma migration validation fails because a relation is missing, add explicit organization relation fields and rerun prisma validate.",
    summary: "Add explicit relation fields and validate schema.",
    tags: ["error", "prisma", "migration", "architecture"],
    confidenceScore: 0.91,
    source: { sourceType: "fix", sourceRef: "agent-deployment-test", evidence: { command: "prisma validate", status: "passed" } },
    ownerId: actorId,
    priority: "HIGH"
  });
  assert.equal(memory.status, "pending_review");
  assert.ok(memory.sources?.length);
  assert.equal((await agentMemoryService.knowledge(organizationId)).length, 0);

  const approved = await agentMemoryService.review(organizationId, actorId, memory.memoryId, "approved", { reason: "Verified in test suite.", trustLevel: "trusted" });
  assert.equal(approved?.status, "approved");
  const knowledge = await agentMemoryService.knowledge(organizationId);
  assert.equal(knowledge.length, 1);
  assert.equal(knowledge[0].knowledgeType, "verified_fix");

  const retrieved = await agentMemoryService.retrieve(organizationId, actorId, {
    query: "prisma migration relation fix",
    tags: ["prisma", "migration"],
    knowledgeTypes: [],
    limit: 5
  });
  assert.ok(retrieved.suggestions.length);
  assert.match(String(retrieved.suggestions[0].whySelected), /Sources/);
  assert.ok(retrieved.errorFixes.length);

  const rejected = await agentMemoryService.create(organizationId, actorId, {
    title: "Rejected fix",
    memoryType: "error_fix",
    content: "A rejected fix should not be promoted into retrieval.",
    summary: "Rejected fix",
    tags: ["error"],
    confidenceScore: 0.4,
    source: { sourceType: "manual", sourceRef: "rejected", evidence: {} },
    ownerId: actorId,
    priority: "LOW"
  });
  await agentMemoryService.review(organizationId, actorId, rejected.memoryId, "rejected", { reason: "Not reliable.", trustLevel: "untrusted" });
  const afterRejected = await agentMemoryService.retrieve(organizationId, actorId, { query: "rejected fix", tags: [], knowledgeTypes: [], limit: 10 });
  assert.equal(afterRejected.suggestions.some((item) => item.memoryId === rejected.memoryId), false);

  await agentMemoryService.review(organizationId, actorId, memory.memoryId, "archived", { reason: "Retention complete.", trustLevel: "untrusted" });
  const visible = await agentMemoryService.list(organizationId);
  assert.equal(visible.some((item) => item.memoryId === memory.memoryId), false);

  console.log("Agent memory test passed through secret scanning, review gating, knowledge promotion, retrieval rationale, rejected exclusion, and archive exclusion.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
