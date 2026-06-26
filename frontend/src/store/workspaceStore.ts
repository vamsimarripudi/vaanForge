"use client";

import { create } from "zustand";
import type { SuiteType } from "@vmnexus/shared/types";

interface WorkspacePreview {
  organizationName: string;
  workspaceName: string;
  suiteType: SuiteType;
  planId: string;
  founderName?: string;
  businessType?: string;
  country?: string;
  industry?: string;
  teamSize?: string;
  productsNeeded?: string[];
  painPoints?: string;
  revenueStage?: string;
  requiredPortals?: string[];
  complianceNeeds?: string;
  supportNeeds?: string;
  recommendedModules?: string[];
}

interface WorkspaceState {
  preview?: WorkspacePreview;
  setPreview: (preview: WorkspacePreview) => void;
  clearPreview: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  setPreview: (preview) => set({ preview }),
  clearPreview: () => set({ preview: undefined })
}));
