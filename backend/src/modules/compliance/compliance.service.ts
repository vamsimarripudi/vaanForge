import type { ComplianceItemInput, ComplianceStatus, GovernmentRegistrationInput } from "@vmnexus/shared/legal";
import { complianceRepository, type ComplianceRepository } from "./compliance.repository";

export class ComplianceService {
  constructor(private readonly repository: ComplianceRepository = complianceRepository) {}

  async createItem(input: ComplianceItemInput) {
    return this.repository.createItem(input);
  }

  async updateItemStatus(itemId: string, status: ComplianceStatus) {
    return this.repository.updateItemStatus(itemId, status);
  }

  async createRegistration(input: GovernmentRegistrationInput) {
    return this.repository.createRegistration(input);
  }

  async updateRegistrationStatus(registrationId: string, status: ComplianceStatus) {
    return this.repository.updateRegistrationStatus(registrationId, status);
  }

  async listItems(organizationId: string) {
    return this.repository.listItems(organizationId);
  }

  async listRegistrations(organizationId: string) {
    return this.repository.listRegistrations(organizationId);
  }

  async summary(organizationId: string) {
    const items = await this.listItems(organizationId);
    const registrations = await this.listRegistrations(organizationId);
    return {
      complianceItems: items.length,
      completed: items.filter((item) => item.status === "COMPLETED").length,
      overdue: items.filter((item) => item.status === "OVERDUE" || new Date(item.dueDate).getTime() < Date.now()).length,
      registrations: registrations.length,
      registrationCompleted: registrations.filter((item) => item.status === "COMPLETED").length,
      registrationInProgress: registrations.filter((item) => item.status === "IN_PROGRESS").length
    };
  }

  async operatingSystem(organizationId: string) {
    const items = await this.listItems(organizationId);
    const registrations = await this.listRegistrations(organizationId);
    const registrationCatalog = [
      { type: "INCORPORATION", label: "Company incorporation tracker", authority: "MCA", reminder: "Track incorporation documents and approval milestones." },
      { type: "GST", label: "GST registration", authority: "GST Portal", reminder: "Keep GST application, filings, and returns aligned." },
      { type: "PAN_TAN", label: "PAN/TAN", authority: "Income Tax", reminder: "Track PAN/TAN issuance and tax identity updates." },
      { type: "DIN_DSC", label: "DIN/DSC", authority: "MCA", reminder: "Track director identification and digital signature validity." },
      { type: "MCA_ROC", label: "MCA/ROC", authority: "ROC", reminder: "Track ROC forms, filings, and statutory due dates." },
      { type: "TRADEMARK", label: "Trademark", authority: "IP India", reminder: "Track trademark application, objections, hearing, and renewal." },
      { type: "STARTUP_INDIA", label: "Startup India", authority: "DPIIT", reminder: "Track recognition, benefits, and compliance needs." },
      { type: "MSME_UDYAM", label: "MSME/Udyam", authority: "Udyam", reminder: "Track MSME/Udyam registration and updates." }
    ];

    return {
      registrationCatalog: registrationCatalog.map((entry) => ({
        ...entry,
        records: registrations.filter((registration) => registration.type === entry.type).length,
        status: registrations.find((registration) => registration.type === entry.type)?.status || "NOT_STARTED"
      })),
      complianceCalendar: items.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        dueDate: item.dueDate,
        status: item.status,
        ownerId: item.ownerId
      })),
      filingReminders: [
        { label: "GST return review", cadence: "monthly", nextDue: "2026-07-20", category: "GST" },
        { label: "ROC annual filing check", cadence: "annual", nextDue: "2026-09-30", category: "MCA/ROC" },
        { label: "Trademark status review", cadence: "quarterly", nextDue: "2026-08-15", category: "Trademark" },
        { label: "MSME/Udyam profile review", cadence: "annual", nextDue: "2026-12-31", category: "MSME/Udyam" }
      ],
      riskSummary: {
        overdue: items.filter((item) => item.status === "OVERDUE" || new Date(item.dueDate).getTime() < Date.now()).length,
        inProgressRegistrations: registrations.filter((registration) => registration.status === "IN_PROGRESS").length,
        openCalendarItems: items.filter((item) => item.status !== "COMPLETED").length
      }
    };
  }

  health() {
    return this.repository.health();
  }
}

export const complianceService = new ComplianceService();
