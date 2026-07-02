import type { StoredAgentTemplate } from "../../database/in-memory-store";

type TemplateSeed = Omit<StoredAgentTemplate, "id" | "templateId" | "organizationId" | "createdBy" | "ownerId" | "dueDate" | "activityHistory" | "createdAt" | "updatedAt">;

const commonStack = ["Next.js App Router", "Express TypeScript API", "Prisma", "PostgreSQL", "KRAVIA design tokens"];
const commonSecurity = ["Authenticated admin APIs", "Role-based permissions", "CSRF-protected mutations", "No provider secrets in UI", "Input validation with Zod"];
const commonValidation = ["Architecture validation", "Design system validation", "Required fields validation", "Security validation", "Build/lint/type-check validation"];

export const builtInAgentTemplates: TemplateSeed[] = [
  template("Education App Template", "education-app", "Education", "School or coaching platform with student, teacher, class, meeting, form, support, and dashboard workflows.", ["Education dashboard", "Students", "Teachers", "Classes", "Forms", "Meetings"], ["Student", "Teacher", "Course", "Enrollment", "Attendance"]),
  template("CRM Template", "crm", "CRM", "Lead, customer, deal, follow-up, proposal, renewal, and sales operations template for VMetron workflows.", ["CRM dashboard", "Leads", "Customers", "Deals", "Follow-ups", "Renewals"], ["Lead", "Customer", "Deal", "Activity", "Proposal"]),
  template("Event Platform Template", "event-platform", "Events", "Event landing, registration, ticketing, check-in, communication, and reporting system.", ["Event dashboard", "Events", "Registrations", "Tickets", "Check-in", "Reports"], ["Event", "Registration", "Ticket", "Attendee", "CheckIn"]),
  template("Forms Platform Template", "forms-platform", "Forms", "VFormix-style form builder with submissions, validation, routing, approvals, and analytics.", ["Form builder", "Submissions", "Approvals", "Analytics", "Settings"], ["Form", "Field", "Submission", "Approval", "Webhook"]),
  template("Meeting App Template", "meeting-app", "Meetings", "VaanMeet-style scheduling, agendas, participants, notes, recordings metadata, and follow-up tasks.", ["Meetings", "Calendar", "Agenda", "Participants", "Notes", "Follow-ups"], ["Meeting", "Participant", "AgendaItem", "Note", "FollowUp"]),
  template("Admin Dashboard Template", "admin-dashboard", "Admin", "Enterprise admin console with metrics, audit logs, permissions, settings, notifications, and activity history.", ["Admin overview", "Users", "Roles", "Audit logs", "Settings", "Notifications"], ["AdminMetric", "AuditEvent", "RoleAssignment", "Setting", "Notification"]),
  template("Landing Page Template", "landing-page", "Marketing", "Conversion-focused product page with pricing, FAQs, lead capture, testimonials, and analytics handoff.", ["Home", "Features", "Pricing", "FAQ", "Contact", "Lead capture"], ["LeadCapture", "PricingPlan", "FaqItem", "Testimonial", "PageEvent"]),
  template("SaaS Billing Template", "saas-billing", "Billing", "Subscription billing foundation with plans, invoices, payments, renewals, entitlements, and account billing settings.", ["Billing dashboard", "Plans", "Invoices", "Payments", "Entitlements", "Renewals"], ["Plan", "Subscription", "Invoice", "Payment", "Entitlement"])
];

function template(name: string, slug: string, category: string, description: string, screens: string[], models: string[]): TemplateSeed {
  const basePath = `/api/v1/${slug}`;
  return {
    name,
    slug,
    category,
    description,
    previewImage: "",
    stack: commonStack,
    requiredInputs: [
      { key: "productName", label: "Product name", inputType: "text", required: true },
      { key: "targetUsers", label: "Target users", inputType: "list", required: true },
      { key: "primaryGoal", label: "Primary goal", inputType: "textarea", required: true },
      { key: "ownerId", label: "Owner", inputType: "user", required: true },
      { key: "dueDate", label: "Due date", inputType: "date", required: true }
    ],
    optionalInputs: [{ key: "brandTone", label: "Brand tone", inputType: "text", required: false }],
    includedScreens: screens,
    includedApis: [`GET ${basePath}`, `POST ${basePath}`, `GET ${basePath}/summary`, `PATCH ${basePath}/:id/status`],
    databaseModels: models,
    designTokens: ["colors", "spacing", "radius", "typography", "shadows"],
    securityRules: commonSecurity,
    validationRules: commonValidation,
    status: "published",
    version: "1.0.0",
    approvedBy: "system",
    priority: "HIGH",
    nextAction: "Ready to use in VFormix and VaanForge Coding Agent."
  };
}
