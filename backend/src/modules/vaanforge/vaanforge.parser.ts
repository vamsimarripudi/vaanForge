import { z } from "zod";
import type { VaanForgeRequirement } from "../../infrastructure/ai/ai.interface";

export const vaanForgePrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

const dateStringSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Expected a valid dueDate"
});

export const vaanForgeRequirementSchema = z.object({
  productName: z.string().min(2),
  productSlug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  source: z.string().min(2).default("VFORMIX"),
  requestId: z.string().optional(),
  ownerId: z.string().min(2),
  priority: vaanForgePrioritySchema,
  dueDate: dateStringSchema,
  businessContext: z.object({
    problemStatement: z.string().min(10),
    targetUsers: z.array(z.string().min(2)).min(1),
    goals: z.array(z.string().min(2)).min(1),
    successMetrics: z.array(z.string().min(2)).min(1)
  }),
  scope: z.object({
    coreFeatures: z
      .array(
        z.object({
          name: z.string().min(2),
          description: z.string().min(10),
          priority: vaanForgePrioritySchema,
          acceptanceCriteria: z.array(z.string().min(2)).min(1)
        })
      )
      .min(1),
    outOfScope: z.array(z.string()).optional()
  }),
  constraints: z.object({
    approvedArchitecture: z.string().min(5),
    designSystem: z.string().min(5),
    routing: z.array(z.string().min(1)).min(1),
    permissions: z.array(z.string().min(1)).min(1)
  }),
  dataEntities: z
    .array(
      z.object({
        name: z.string().min(2),
        fields: z.array(z.string().min(1)).min(1),
        relationships: z.array(z.string()).optional()
      })
    )
    .optional(),
  integrations: z.array(z.string()).optional(),
  nonFunctionalRequirements: z.array(z.string()).optional()
});

export function parseVaanForgeRequirement(input: unknown): VaanForgeRequirement {
  return vaanForgeRequirementSchema.parse(input);
}
