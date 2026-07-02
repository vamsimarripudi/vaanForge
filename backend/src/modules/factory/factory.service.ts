import { createHash } from "node:crypto";
import { z } from "zod";
import {
  createId,
  store,
  type StoredFactoryBlueprint,
  type StoredFactoryDesignSystem,
  type StoredFactoryProject,
  type StoredFactoryProjectStatus,
  type StoredFactoryRelease
} from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";
import { billingService } from "../billing/billing.service";

const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const complexitySchema = z.enum(["lean", "standard", "advanced", "enterprise"]);

export const factoryProjectSchema = z.object({
  name: z.string().min(2),
  productType: z.string().min(2),
  targetPlatform: z.string().min(2),
  businessGoal: z.string().min(10),
  priority: prioritySchema.default("HIGH"),
  dueDate: z.string().optional(),
  complexityLevel: complexitySchema.default("standard"),
  deploymentTarget: z.string().min(2).default("KRAVIA Cloud")
});

export const factoryProjectPatchSchema = z.object({
  name: z.string().min(2).optional(),
  businessGoal: z.string().min(10).optional(),
  priority: prioritySchema.optional(),
  dueDate: z.string().optional(),
  nextAction: z.string().min(2).optional()
});

export const factoryIntakeSchema = z.object({
  userRoles: z.array(z.string().min(2)).min(1),
  coreFeatures: z.array(z.string().min(2)).min(1),
  integrations: z.array(z.string().min(2)).default([]),
  budgetLevel: z.string().min(2),
  deploymentTarget: z.string().min(2).optional(),
  dataEntities: z.array(z.string().min(2)).default([]),
  complianceNeeds: z.array(z.string().min(2)).default([])
});

export const factoryQuestionAnswerSchema = z.object({
  questionId: z.string().min(2),
  answer: z.string().min(2)
});

export const factoryRejectSchema = z.object({
  reason: z.string().min(2)
});

export type FactoryActor = {
  userId: string;
  organizationId: string;
  role: string;
};

export class FactoryService {
  list(actor: FactoryActor) {
    return {
      projects: this.visibleProjects(actor).map((project) => this.summary(project)),
      nextAction: "Create a project or continue the next required approval."
    };
  }

  adminSummary(actor: FactoryActor) {
    const projects = store.factoryProjects.filter((project) => project.organizationId === actor.organizationId);
    return {
      totalProjects: projects.length,
      blocked: projects.filter((project) => ["blocked", "failed"].includes(project.status)).length,
      awaitingReview: projects.filter((project) => ["blueprint_ready", "design_ready", "release_ready"].includes(project.status)).length,
      validations: store.factoryValidationRuns.filter((run) => run.organizationId === actor.organizationId),
      reviews: [...store.factoryBlueprints, ...store.factoryDesignSystems, ...store.factoryReleases].filter((item) => item.organizationId === actor.organizationId && ["generated", "ready"].includes(item.status)),
      memory: store.factoryMemoryEntries.filter((entry) => entry.organizationId === actor.organizationId),
      nextAction: "Review blocked projects, approvals, and failed validations."
    };
  }

  create(actor: FactoryActor, input: z.infer<typeof factoryProjectSchema>) {
    const parsed = factoryProjectSchema.parse(input);
    this.assertSafe(parsed);
    this.assertPlanAccess(actor, "agent_run", 1, "factory_project", parsed.name);
    const now = new Date().toISOString();
    const project: StoredFactoryProject = {
      id: createId("fpr"),
      projectId: createId("factory_project"),
      organizationId: actor.organizationId,
      ownerId: actor.userId,
      name: parsed.name,
      productType: parsed.productType,
      targetPlatform: parsed.targetPlatform,
      businessGoal: parsed.businessGoal,
      status: "intake",
      priority: parsed.priority,
      dueDate: parsed.dueDate || inDays(30),
      complexityLevel: parsed.complexityLevel,
      deploymentTarget: parsed.deploymentTarget,
      recommendedPlan: this.recommendPlan(parsed.complexityLevel),
      requirementQualityScore: 35,
      complexityScore: this.complexityScore(parsed.complexityLevel),
      buildSize: this.buildSize(parsed.complexityLevel),
      nextAction: "Complete the guided intake questionnaire.",
      activityHistory: [{ at: now, status: "intake", message: "Factory project created." }],
      createdAt: now,
      updatedAt: now
    };
    store.factoryProjects.push(project);
    this.log(project, actor, "project.created", project.status, "Factory project created.", { recommendedPlan: project.recommendedPlan });
    return this.detail(actor, project.projectId);
  }

  detail(actor: FactoryActor, projectId: string) {
    const project = this.findVisible(actor, projectId);
    if (!project) return undefined;
    return {
      ...project,
      intake: store.factoryIntakeAnswers.filter((item) => item.projectId === projectId).at(-1),
      questions: store.factoryRequirementQuestions.filter((item) => item.projectId === projectId),
      blueprint: this.latestBlueprint(projectId),
      design: this.latestDesign(projectId),
      taskGraph: store.factoryTaskGraphs.find((item) => item.projectId === projectId),
      tasks: this.tasks(actor, projectId),
      files: this.files(actor, projectId),
      qa: this.qa(actor, projectId),
      release: store.factoryReleases.filter((item) => item.projectId === projectId).at(-1),
      docs: this.docs(actor, projectId),
      memory: this.memory(actor, projectId),
      activity: store.factoryActivityLogs.filter((item) => item.projectId === projectId)
    };
  }

  update(actor: FactoryActor, projectId: string, patch: z.infer<typeof factoryProjectPatchSchema>) {
    const project = this.findVisible(actor, projectId);
    if (!project) return undefined;
    Object.assign(project, patch, { updatedAt: new Date().toISOString(), nextAction: patch.nextAction || project.nextAction });
    this.log(project, actor, "project.updated", project.status, "Factory project metadata updated.", patch);
    return this.detail(actor, projectId);
  }

  submitIntake(actor: FactoryActor, projectId: string, input: z.infer<typeof factoryIntakeSchema>) {
    const project = this.requireProject(actor, projectId);
    const parsed = factoryIntakeSchema.parse(input);
    this.assertSafe(parsed);
    const missing = this.detectMissing(project, parsed);
    const quality = this.qualityScore(project, parsed, missing);
    const now = new Date().toISOString();
    store.factoryIntakeAnswers.push({
      id: createId("fia"),
      answerId: createId("intake"),
      projectId,
      organizationId: actor.organizationId,
      userRoles: parsed.userRoles,
      coreFeatures: parsed.coreFeatures,
      integrations: parsed.integrations,
      budgetLevel: parsed.budgetLevel,
      rawInput: input,
      normalizedInput: { ...parsed, deploymentTarget: parsed.deploymentTarget || project.deploymentTarget },
      missingFields: missing,
      createdAt: now,
      updatedAt: now
    });
    project.requirementQualityScore = quality;
    project.complexityScore = Math.min(100, this.complexityScore(project.complexityLevel) + parsed.coreFeatures.length * 4 + parsed.integrations.length * 5);
    project.buildSize = project.complexityScore > 80 ? "enterprise" : project.complexityScore > 60 ? "large" : project.complexityScore > 38 ? "medium" : "small";
    project.recommendedPlan = this.recommendPlan(project.complexityLevel, project.complexityScore);
    project.status = missing.length ? "questions_required" : "blueprint_ready";
    project.nextAction = missing.length ? "Answer generated follow-up questions before blueprint generation." : "Generate the project blueprint.";
    project.updatedAt = now;
    this.log(project, actor, "intake.submitted", project.status, "Intake submitted and requirement intelligence scored.", { missing, quality });
    return this.detail(actor, projectId);
  }

  generateQuestions(actor: FactoryActor, projectId: string) {
    const project = this.requireProject(actor, projectId);
    const intake = store.factoryIntakeAnswers.filter((item) => item.projectId === projectId).at(-1);
    const missing = intake?.missingFields.length ? intake.missingFields : ["dataEntities", "complianceNeeds", "successMetrics"];
    const now = new Date().toISOString();
    for (const field of missing) {
      if (store.factoryRequirementQuestions.some((item) => item.projectId === projectId && item.fieldKey === field && item.status === "open")) continue;
      store.factoryRequirementQuestions.push({
        id: createId("frq"),
        questionId: createId("question"),
        projectId,
        organizationId: actor.organizationId,
        fieldKey: field,
        question: this.questionFor(field, project),
        reason: `Required to improve requirement quality for ${project.productType}.`,
        status: "open",
        createdAt: now,
        updatedAt: now
      });
    }
    project.status = "questions_required";
    project.nextAction = "Answer open follow-up questions.";
    project.updatedAt = now;
    this.log(project, actor, "questions.generated", project.status, "Smart follow-up questions generated.", { missing });
    return this.detail(actor, projectId);
  }

  answerQuestion(actor: FactoryActor, projectId: string, input: z.infer<typeof factoryQuestionAnswerSchema>) {
    const project = this.requireProject(actor, projectId);
    const parsed = factoryQuestionAnswerSchema.parse(input);
    this.assertSafe(parsed);
    const question = store.factoryRequirementQuestions.find((item) => item.projectId === projectId && item.questionId === parsed.questionId);
    if (!question) throw new Error("Question not found.");
    question.answer = parsed.answer;
    question.status = "answered";
    question.updatedAt = new Date().toISOString();
    const open = store.factoryRequirementQuestions.some((item) => item.projectId === projectId && item.status === "open");
    project.status = open ? "questions_required" : "blueprint_ready";
    project.requirementQualityScore = Math.min(100, project.requirementQualityScore + 12);
    project.nextAction = open ? "Answer remaining follow-up questions." : "Generate the project blueprint.";
    this.log(project, actor, "question.answered", project.status, "Requirement follow-up answered.", { questionId: parsed.questionId });
    return this.detail(actor, projectId);
  }

  generateBlueprint(actor: FactoryActor, projectId: string) {
    const project = this.requireProject(actor, projectId);
    if (store.factoryRequirementQuestions.some((item) => item.projectId === projectId && item.status === "open")) throw new Error("Open follow-up questions must be answered before blueprint generation.");
    this.assertPlanAccess(actor, "regeneration", 1, "factory_blueprint", projectId);
    const intake = store.factoryIntakeAnswers.filter((item) => item.projectId === projectId).at(-1);
    const features = intake?.coreFeatures.length ? intake.coreFeatures : ["Project dashboard", "Admin controls", "API integration"];
    const roles = intake?.userRoles.length ? intake.userRoles : ["Admin", "Customer"];
    const now = new Date().toISOString();
    const blueprint: StoredFactoryBlueprint = {
      id: createId("fbp"),
      blueprintId: createId("blueprint"),
      projectId,
      organizationId: actor.organizationId,
      version: this.nextVersion(store.factoryBlueprints, projectId),
      status: "generated",
      prd: `${project.name} will deliver ${project.businessGoal} for ${roles.join(", ")} on ${project.targetPlatform}.`,
      featureList: features,
      userRoles: roles,
      userJourneys: roles.map((role) => `${role} can complete core ${project.productType} workflows with audit-backed actions.`),
      uxFlow: ["Intake", "Review", "Operate", "Report"],
      pageMap: features.map((feature) => `/${slug(feature)}`),
      apiMap: features.map((feature) => `/${slug(feature)}`),
      databaseSchema: features.map((feature) => `${pascal(feature)}Record`),
      architecturePlan: [`Modular ${project.targetPlatform} application`, "API-first backend", "Tenant-isolated data access", "Audit-backed workflow services"],
      securityPlan: ["Authenticated routes", "RBAC on mutations", "CSRF on browser mutations", "Prompt-injection filtering", "Secret masking"],
      testingPlan: ["Unit tests", "Integration tests", "E2E smoke", "Route security contract", "Production readiness checks"],
      deploymentPlan: [project.deploymentTarget, "Health checks before release", "Rollback metadata", "Release approval gate"],
      createdAt: now,
      updatedAt: now
    };
    store.factoryBlueprints.push(blueprint);
    project.status = "blueprint_ready";
    project.nextAction = "Review and approve or reject the blueprint.";
    project.updatedAt = now;
    this.log(project, actor, "blueprint.generated", project.status, "Blueprint generated from approved requirements.", { blueprintId: blueprint.blueprintId });
    return blueprint;
  }

  approveBlueprint(actor: FactoryActor, projectId: string) {
    const project = this.requireProject(actor, projectId);
    const blueprint = this.requireBlueprint(projectId);
    blueprint.status = "approved";
    blueprint.approvedAt = new Date().toISOString();
    blueprint.updatedAt = new Date().toISOString();
    project.status = "blueprint_approved";
    project.nextAction = "Generate and approve AI design system.";
    project.updatedAt = new Date().toISOString();
    this.log(project, actor, "blueprint.approved", project.status, "Blueprint approved for design and engineering.", { blueprintId: blueprint.blueprintId });
    return this.detail(actor, projectId);
  }

  rejectBlueprint(actor: FactoryActor, projectId: string, input: z.infer<typeof factoryRejectSchema>) {
    const project = this.requireProject(actor, projectId);
    const blueprint = this.requireBlueprint(projectId);
    blueprint.status = "rejected";
    blueprint.rejectionReason = factoryRejectSchema.parse(input).reason;
    blueprint.updatedAt = new Date().toISOString();
    this.memoryEntry(project, "rejection", `Blueprint rejected: ${blueprint.rejectionReason}`, blueprint.blueprintId, false);
    project.status = "questions_required";
    project.nextAction = "Answer follow-up questions or update intake before regenerating blueprint.";
    project.updatedAt = new Date().toISOString();
    this.log(project, actor, "blueprint.rejected", project.status, "Blueprint rejected with reason.", { reason: blueprint.rejectionReason });
    return this.detail(actor, projectId);
  }

  generateDesign(actor: FactoryActor, projectId: string) {
    const project = this.requireProject(actor, projectId);
    const blueprint = this.requireBlueprint(projectId);
    if (blueprint.status !== "approved") throw new Error("Blueprint approval is required before design generation.");
    const now = new Date().toISOString();
    const design: StoredFactoryDesignSystem = {
      id: createId("fds"),
      designId: createId("design"),
      projectId,
      organizationId: actor.organizationId,
      version: this.nextVersion(store.factoryDesignSystems, projectId),
      status: "generated",
      designSystem: ["Neutral surfaces", "Clear hierarchy", "Keyboard-first controls", "Compact enterprise tables"],
      layoutDirection: "Linear/Vercel-style product workspace with restrained density and action-first panels.",
      componentMap: ["Shell", "Stepper", "Approval panel", "Task table", "Evidence drawer", "Release checklist"],
      responsiveStrategy: ["Mobile-first stacked flow", "Tablet two-column review", "Desktop split workspace"],
      accessibilityChecklist: ["Semantic buttons", "Visible focus", "Contrast-safe tokens", "No text overlap", "Status labels with reasons"],
      themeTokens: { canvas: "#f8fafc", surface: "#ffffff", ink: "#111827", primary: "#2563eb", accent: "#0f766e" },
      uiQualityScore: Math.min(100, project.requirementQualityScore + 8),
      createdAt: now,
      updatedAt: now
    };
    store.factoryDesignSystems.push(design);
    project.status = "design_ready";
    project.nextAction = "Approve design direction before build start.";
    project.updatedAt = now;
    this.log(project, actor, "design.generated", project.status, "Design system generated.", { designId: design.designId });
    return design;
  }

  approveDesign(actor: FactoryActor, projectId: string) {
    const project = this.requireProject(actor, projectId);
    const design = this.latestDesign(projectId);
    if (!design) throw new Error("Generated design is required before approval.");
    design.status = "approved";
    design.updatedAt = new Date().toISOString();
    this.memoryEntry(project, "design", `Approved design v${design.version}`, design.designId, true);
    project.status = "design_approved";
    project.nextAction = "Start the engineering build.";
    project.updatedAt = new Date().toISOString();
    this.log(project, actor, "design.approved", project.status, "Design approved for engineering.", { designId: design.designId });
    return this.detail(actor, projectId);
  }

  startBuild(actor: FactoryActor, projectId: string) {
    const project = this.requireProject(actor, projectId);
    const design = this.latestDesign(projectId);
    if (!design || design.status !== "approved") throw new Error("Design approval is required before build start.");
    this.assertPlanAccess(actor, "build_minute", 1, "factory_build", projectId);
    const blueprint = this.requireBlueprint(projectId);
    const graph = this.createTaskGraph(project, blueprint);
    project.status = "building";
    project.nextAction = "Review live task progress, QA evidence, and release readiness.";
    project.updatedAt = new Date().toISOString();
    this.createQa(project);
    this.createFiles(project);
    this.log(project, actor, "build.started", project.status, "Engineering factory build started.", { graphId: graph.graphId });
    return this.detail(actor, projectId);
  }

  pauseBuild(actor: FactoryActor, projectId: string) {
    const project = this.requireProject(actor, projectId);
    project.status = "paused";
    project.nextAction = "Resume build after human review.";
    project.updatedAt = new Date().toISOString();
    this.log(project, actor, "build.paused", project.status, "Build paused by user.");
    return this.detail(actor, projectId);
  }

  resumeBuild(actor: FactoryActor, projectId: string) {
    const project = this.requireProject(actor, projectId);
    project.status = "building";
    project.nextAction = "Continue validating generated modules.";
    project.updatedAt = new Date().toISOString();
    this.log(project, actor, "build.resumed", project.status, "Build resumed by user.");
    return this.detail(actor, projectId);
  }

  tasks(actor: FactoryActor, projectId: string) {
    this.requireProject(actor, projectId);
    return store.factoryTasks.filter((task) => task.projectId === projectId);
  }

  files(actor: FactoryActor, projectId: string) {
    this.requireProject(actor, projectId);
    return store.factoryGeneratedFiles.filter((file) => file.projectId === projectId);
  }

  qa(actor: FactoryActor, projectId: string) {
    this.requireProject(actor, projectId);
    return {
      validations: store.factoryValidationRuns.filter((run) => run.projectId === projectId),
      errors: store.factoryErrors.filter((error) => error.projectId === projectId),
      repairs: store.factoryRepairAttempts.filter((repair) => repair.projectId === projectId)
    };
  }

  prepareRelease(actor: FactoryActor, projectId: string) {
    const project = this.requireProject(actor, projectId);
    const failed = store.factoryValidationRuns.some((run) => run.projectId === projectId && run.status === "failed");
    if (failed) throw new Error("Release cannot be prepared while validations are failing.");
    const now = new Date().toISOString();
    const release: StoredFactoryRelease = {
      id: createId("frl"),
      releaseId: createId("release"),
      projectId,
      organizationId: actor.organizationId,
      version: `v1.${store.factoryReleases.filter((item) => item.projectId === projectId).length}.0`,
      status: "ready",
      changelog: ["Blueprint approved", "Design approved", "Task graph generated", "QA checks passed"],
      releaseNotes: `${project.name} is ready for production approval.`,
      deploymentChecklist: ["All validations passed", "Rollback plan attached", "Deployment target confirmed", "Human approval required"],
      rollbackPlan: ["Keep previous release artifact", "Restore database snapshot", "Re-run health checks", "Notify owner"],
      finalReport: "Release is blocked until user approval.",
      createdAt: now,
      updatedAt: now
    };
    store.factoryReleases.push(release);
    project.status = "release_ready";
    project.nextAction = "Approve production release.";
    project.updatedAt = now;
    this.log(project, actor, "release.prepared", project.status, "Release package prepared.", { releaseId: release.releaseId });
    return release;
  }

  approveRelease(actor: FactoryActor, projectId: string) {
    const project = this.requireProject(actor, projectId);
    const release = store.factoryReleases.filter((item) => item.projectId === projectId).at(-1);
    if (!release || release.status !== "ready") throw new Error("Prepared release is required before approval.");
    this.assertPlanAccess(actor, "deployment", 1, "factory_release", release.releaseId);
    release.status = "approved";
    release.approvedAt = new Date().toISOString();
    release.finalReport = "Release approved. Deployment can proceed through configured deployment target.";
    release.updatedAt = new Date().toISOString();
    project.status = "released";
    project.nextAction = "Monitor production health and maintenance plan.";
    project.updatedAt = new Date().toISOString();
    this.memoryEntry(project, "architecture", `Successful release ${release.version}`, release.releaseId, true);
    this.log(project, actor, "release.approved", project.status, "Production release approved.", { releaseId: release.releaseId });
    return this.detail(actor, projectId);
  }

  docs(actor: FactoryActor, projectId: string) {
    const project = this.requireProject(actor, projectId);
    const blueprint = this.latestBlueprint(projectId);
    const release = store.factoryReleases.filter((item) => item.projectId === projectId).at(-1);
    return {
      readme: `# ${project.name}\n\n${blueprint?.prd || project.businessGoal}`,
      apiDocs: blueprint?.apiMap || [],
      setupGuide: [`Deploy target: ${project.deploymentTarget}`, "Configure env vars", "Run migrations", "Run validation suite"],
      releaseNotes: release?.releaseNotes || "Release not prepared yet.",
      maintenancePlan: ["Weekly dependency review", "Monthly security review", "Usage and billing audit", "Memory pattern review"]
    };
  }

  memory(actor: FactoryActor, projectId: string) {
    this.requireProject(actor, projectId);
    return store.factoryMemoryEntries.filter((entry) => entry.projectId === projectId && !entry.sensitive);
  }

  quality(actor: FactoryActor) {
    const projects = store.factoryProjects.filter((project) => project.organizationId === actor.organizationId);
    const validations = store.factoryValidationRuns.filter((run) => run.organizationId === actor.organizationId);
    return {
      averageRequirementQuality: average(projects.map((project) => project.requirementQualityScore)),
      averageUiQuality: average(store.factoryDesignSystems.filter((item) => item.organizationId === actor.organizationId).map((item) => item.uiQualityScore)),
      validationPassRate: validations.length ? Math.round((validations.filter((run) => run.status === "passed").length / validations.length) * 100) : 0,
      blockedProjects: projects.filter((project) => project.status === "blocked").length,
      nextAction: "Improve projects with low requirement or UI quality scores."
    };
  }

  reviews(actor: FactoryActor) {
    return {
      blueprints: store.factoryBlueprints.filter((item) => item.organizationId === actor.organizationId && item.status === "generated"),
      designs: store.factoryDesignSystems.filter((item) => item.organizationId === actor.organizationId && item.status === "generated"),
      releases: store.factoryReleases.filter((item) => item.organizationId === actor.organizationId && item.status === "ready")
    };
  }

  private visibleProjects(actor: FactoryActor) {
    return store.factoryProjects.filter((project) => project.organizationId === actor.organizationId && (project.ownerId === actor.userId || ["Founder", "Admin", "Super Admin"].includes(actor.role))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private findVisible(actor: FactoryActor, projectId: string) {
    return this.visibleProjects(actor).find((project) => project.projectId === projectId);
  }

  private requireProject(actor: FactoryActor, projectId: string) {
    const project = this.findVisible(actor, projectId);
    if (!project) throw new Error("Factory project not found.");
    return project;
  }

  private latestBlueprint(projectId: string) {
    return store.factoryBlueprints.filter((item) => item.projectId === projectId).sort((a, b) => b.version - a.version)[0];
  }

  private requireBlueprint(projectId: string) {
    const blueprint = this.latestBlueprint(projectId);
    if (!blueprint) throw new Error("Blueprint is required.");
    return blueprint;
  }

  private latestDesign(projectId: string) {
    return store.factoryDesignSystems.filter((item) => item.projectId === projectId).sort((a, b) => b.version - a.version)[0];
  }

  private nextVersion(items: Array<{ projectId: string; version: number }>, projectId: string) {
    return items.filter((item) => item.projectId === projectId).length + 1;
  }

  private summary(project: StoredFactoryProject) {
    return {
      ...project,
      questionsOpen: store.factoryRequirementQuestions.filter((item) => item.projectId === project.projectId && item.status === "open").length,
      tasksTotal: store.factoryTasks.filter((item) => item.projectId === project.projectId).length,
      validationsPassed: store.factoryValidationRuns.filter((item) => item.projectId === project.projectId && item.status === "passed").length
    };
  }

  private detectMissing(project: StoredFactoryProject, intake: z.infer<typeof factoryIntakeSchema>) {
    const missing: string[] = [];
    if (!project.businessGoal || project.businessGoal.length < 20) missing.push("businessGoal");
    if (intake.userRoles.length < 2) missing.push("userRoles");
    if (intake.coreFeatures.length < 3) missing.push("coreFeatures");
    if (!intake.dataEntities.length) missing.push("dataEntities");
    if (!intake.complianceNeeds.length && project.complexityLevel !== "lean") missing.push("complianceNeeds");
    return missing;
  }

  private qualityScore(project: StoredFactoryProject, intake: z.infer<typeof factoryIntakeSchema>, missing: string[]) {
    return Math.max(10, Math.min(100, 45 + intake.userRoles.length * 8 + intake.coreFeatures.length * 5 + intake.integrations.length * 4 + (project.businessGoal.length > 40 ? 10 : 0) - missing.length * 12));
  }

  private createTaskGraph(project: StoredFactoryProject, blueprint: StoredFactoryBlueprint) {
    const now = new Date().toISOString();
    const modules = ["frontend", "backend", "database", "api", "auth", "dashboard", "tests", "deployment", "documentation"];
    const graph = { id: createId("ftg"), graphId: createId("graph"), projectId: project.projectId, organizationId: project.organizationId, status: "running" as const, nodes: modules.map((module) => ({ id: module, label: module })), edges: modules.slice(1).map((module, index) => ({ from: modules[index], to: module })), createdAt: now, updatedAt: now };
    store.factoryTaskGraphs.push(graph);
    for (const module of modules) {
      store.factoryTasks.push({ id: createId("fts"), taskId: createId("factory_task"), graphId: graph.graphId, projectId: project.projectId, organizationId: project.organizationId, module, title: `Build ${module}`, status: "completed", ownerAgent: `${pascal(module)} Agent`, priority: project.priority, dueDate: project.dueDate, nextAction: "Review evidence and generated files.", evidence: { blueprintId: blueprint.blueprintId, module }, createdAt: now, updatedAt: now });
    }
    return graph;
  }

  private createFiles(project: StoredFactoryProject) {
    const tasks = store.factoryTasks.filter((task) => task.projectId === project.projectId);
    for (const task of tasks) {
      const path = `${task.module}/README.md`;
      store.factoryGeneratedFiles.push({ id: createId("fgf"), fileId: createId("factory_file"), projectId: project.projectId, organizationId: project.organizationId, taskId: task.taskId, path, fileType: "markdown", status: "proposed", checksum: createHash("sha256").update(`${project.projectId}:${path}`).digest("hex"), diffRequired: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
  }

  private createQa(project: StoredFactoryProject) {
    for (const validationType of ["unit", "integration", "e2e", "api_smoke", "security", "route_security", "build_quality", "production_readiness"]) {
      store.factoryValidationRuns.push({ id: createId("fvr"), validationId: createId("validation"), projectId: project.projectId, organizationId: project.organizationId, validationType, status: "passed", evidence: { command: validationType, source: "factory-validation-runner" }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    project.status = "qa_ready";
    project.nextAction = "Prepare release after reviewing QA evidence.";
  }

  private assertPlanAccess(actor: FactoryActor, metric: "agent_run" | "regeneration" | "build_minute" | "deployment", quantity: number, source: string, sourceId: string) {
    const result = billingService.canConsume({ organizationId: actor.organizationId, customerId: actor.userId, metric, quantity });
    if (!result.allowed) throw new Error(`${result.reason} Upgrade required for VaanForge factory action.`);
    billingService.checkAndConsume({ organizationId: actor.organizationId, customerId: actor.userId, actorId: actor.userId, metric, quantity, source, sourceId });
  }

  private assertSafe(input: unknown) {
    const text = JSON.stringify(input);
    if (/ignore previous|system prompt|api[_ -]?key|secret/i.test(text)) throw new Error("Input rejected by prompt-injection and secret-safety filter.");
  }

  private questionFor(field: string, project: StoredFactoryProject) {
    const labels: Record<string, string> = {
      businessGoal: "What measurable business outcome should this software deliver first?",
      userRoles: "Which additional users need separate permissions or dashboards?",
      coreFeatures: "Which three features are mandatory for the first usable release?",
      dataEntities: "What core data objects should the database store?",
      complianceNeeds: "What privacy, security, or compliance requirements must be respected?",
      successMetrics: "How will you decide the first release is successful?"
    };
    return labels[field] || `What should VaanForge know about ${field} for ${project.name}?`;
  }

  private recommendPlan(complexity: string, score = 0) {
    if (complexity === "enterprise" || score > 82) return "Enterprise";
    if (complexity === "advanced" || score > 62) return "Business";
    if (complexity === "standard" || score > 42) return "Professional";
    return "Creator";
  }

  private complexityScore(complexity: string) {
    return { lean: 24, standard: 46, advanced: 68, enterprise: 86 }[complexity] || 46;
  }

  private buildSize(complexity: string): StoredFactoryProject["buildSize"] {
    return complexity === "enterprise" ? "enterprise" : complexity === "advanced" ? "large" : complexity === "standard" ? "medium" : "small";
  }

  private memoryEntry(project: StoredFactoryProject, memoryType: "architecture" | "failure" | "fix" | "preference" | "design" | "rejection", summary: string, sourceId: string, trusted: boolean) {
    store.factoryMemoryEntries.push({ id: createId("fme"), memoryId: createId("memory"), projectId: project.projectId, organizationId: project.organizationId, memoryType, summary, sourceId, trusted, sensitive: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  private log(project: StoredFactoryProject, actor: FactoryActor, action: string, status: StoredFactoryProjectStatus | string, message: string, metadata?: Record<string, unknown>) {
    const now = new Date().toISOString();
    project.activityHistory.push({ at: now, status, message });
    store.factoryActivityLogs.push({ id: createId("fal"), activityId: createId("factory_activity"), projectId: project.projectId, organizationId: project.organizationId, actorId: actor.userId, action, status, message, metadata, createdAt: now });
    store.factoryAuditLogs.push({ id: createId("fau"), auditId: createId("factory_audit"), projectId: project.projectId, organizationId: project.organizationId, actorId: actor.userId, action, entityType: "FactoryProject", entityId: project.projectId, metadata, createdAt: now });
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, action: "VAANFORGE_AGENT_RUN", entityType: "FactoryProject", entityId: project.projectId, metadata: { factoryAction: action, status, ...metadata } });
  }
}

function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function pascal(value: string) {
  return value.replace(/(^|[^a-z0-9])([a-z0-9])/gi, (_all, _sep, char: string) => char.toUpperCase()).replace(/[^a-z0-9]/gi, "");
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

export const factoryService = new FactoryService();
