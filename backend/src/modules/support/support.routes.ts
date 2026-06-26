import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { supportService } from "./support.service";

export const supportRouter = Router();

const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const statusSchema = z.enum(["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"]);

supportRouter.get("/summary", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await supportService.summary(organizationId) : { tickets: 0, open: 0, urgent: 0, resolved: 0 } });
});

supportRouter.get("/operations", authMiddleware, async (_request, response) => {
  response.json({ data: supportService.operations() });
});

supportRouter.get("/tickets", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await supportService.listTickets(organizationId) : [] });
});

supportRouter.post("/tickets", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ customerId: z.string().optional(), subject: z.string().min(2), priority: prioritySchema.default("MEDIUM"), status: statusSchema.default("OPEN") }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid support ticket request" });
    return;
  }
  response.status(201).json({ data: await supportService.createTicket({ ...parsed.data, organizationId }) });
});

supportRouter.get("/tickets/:ticketId/messages", authMiddleware, async (request, response) => {
  response.json({ data: await supportService.listMessages(String(request.params.ticketId)) });
});

supportRouter.post("/tickets/:ticketId/messages", authMiddleware, requirePermission("support:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ message: z.string().min(2), internal: z.boolean().optional() }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid ticket message request" });
    return;
  }
  response.status(201).json({ data: await supportService.addMessage({ ...parsed.data, ticketId: String(request.params.ticketId), authorId: request.session?.userId, organizationId }) });
});

supportRouter.patch("/tickets/:ticketId/status", authMiddleware, requirePermission("support:manage"), async (request, response) => {
  const parsed = z.object({ status: statusSchema }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid ticket status request" });
    return;
  }
  const ticket = await supportService.updateStatus(String(request.params.ticketId), parsed.data.status);
  if (!ticket) {
    response.status(404).json({ error: "Ticket not found" });
    return;
  }
  response.json({ data: ticket });
});
