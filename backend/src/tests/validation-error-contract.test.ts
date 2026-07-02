import assert from "node:assert/strict";
import { z } from "zod";
import { buildErrorResponse, legacyToSafeError, validationError } from "../http/error-response";

const request = { requestId: "req_validation_contract", header: () => undefined } as any;

async function main() {
  const schema = z.object({ email: z.string().email(), amount: z.number().positive() });
  const parsed = schema.safeParse({ email: "bad", amount: -1 });
  assert.equal(parsed.success, false);
  if (!parsed.success) {
    const response = validationError(request, parsed.error);
    assert.equal(response.success, false);
    assert.equal(response.error.code, "VALIDATION_ERROR");
    assert.equal(response.error.message, "Please correct the highlighted fields.");
    assert.equal(response.error.fieldErrors?.email, "Invalid email");
    assert.ok(response.error.fieldErrors?.amount);
    assert.equal(response.requestId, "req_validation_contract");
  }

  const permission = buildErrorResponse(request, { code: "PERMISSION_DENIED", message: "C:\\private\\secret\\path should be hidden.", fieldErrors: { permission: "Missing permission: billing:manage" } });
  assert.equal(permission.error.message.includes("C:\\"), false);
  assert.equal(permission.error.nextAction, "request_access");

  const legacy = legacyToSafeError(request, 400, { error: "Invalid support ticket request", issues: [{ path: ["subject"], message: "Subject is required." }] });
  assert.equal(legacy.error.code, "VALIDATION_ERROR");
  assert.equal(legacy.error.fieldErrors?.subject, "Subject is required.");
  assert.equal(legacy.error.recoverable, true);

  const rateLimited = legacyToSafeError(request, 429, { error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" });
  assert.equal(rateLimited.error.code, "RATE_LIMITED");

  console.log("Validation and error response contract test passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
