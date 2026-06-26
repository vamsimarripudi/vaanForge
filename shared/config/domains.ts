export type EnvironmentName = "local" | "staging" | "production";

export interface DomainSet {
  root: string;
  app: string;
  founder: string;
  admin: string;
  finance: string;
  hr: string;
  sales: string;
  support: string;
  legal: string;
  ca: string;
  creator: string;
  customer: string;
  partner: string;
  docs: string;
  meet: string;
  api: string;
  assets: string;
}

const rootDomain = process.env.ROOT_DOMAIN || "example.com";

const buildDomainSet = (root: string): DomainSet => ({
  root,
  app: `app.${root}`,
  founder: `founder.${root}`,
  admin: `admin.${root}`,
  finance: `finance.${root}`,
  hr: `hr.${root}`,
  sales: `sales.${root}`,
  support: `support.${root}`,
  legal: `legal.${root}`,
  ca: `ca.${root}`,
  creator: `creator.${root}`,
  customer: `customer.${root}`,
  partner: `partner.${root}`,
  docs: `docs.${root}`,
  meet: `meet.${root}`,
  api: `api.${root}`,
  assets: `assets.${root}`
});

export const domains: Record<EnvironmentName, DomainSet> = {
  local: {
    root: "localhost",
    app: "localhost:3000",
    founder: "localhost:3000/founder",
    admin: "localhost:3000/admin",
    finance: "localhost:3000/finance",
    hr: "localhost:3000/hr",
    sales: "localhost:3000/sales",
    support: "localhost:3000/support",
    legal: "localhost:3000/legal",
    ca: "localhost:3000/ca",
    creator: "localhost:3000/creator",
    customer: "localhost:3000/customer",
    partner: "localhost:3000/partner",
    docs: "localhost:3000/docs",
    meet: "localhost:3000/meet",
    api: "localhost:4000/api/v1",
    assets: "localhost:3000/assets"
  },
  staging: buildDomainSet(`staging.${rootDomain}`),
  production: buildDomainSet(rootDomain)
};

export const getDomains = (environment: EnvironmentName = "local") => domains[environment];
