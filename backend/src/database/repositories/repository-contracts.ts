export type EntityId = string;
export type OrganizationScoped = { organizationId: EntityId };

export type RepositoryHealth = {
  name: string;
  mode: "memory" | "postgres";
  writable: boolean;
  durable: boolean;
};

export interface Repository<TRecord, TCreate, TUpdate = Partial<TCreate>> {
  create(input: TCreate): Promise<TRecord> | TRecord;
  update(id: EntityId, input: TUpdate): Promise<TRecord | undefined> | TRecord | undefined;
  get(id: EntityId): Promise<TRecord | undefined> | TRecord | undefined;
  list(scope: OrganizationScoped): Promise<TRecord[]> | TRecord[];
  health(): RepositoryHealth;
}

export interface AuditRepository<TRecord, TCreate> {
  record(input: TCreate): Promise<TRecord> | TRecord;
  list(scope: OrganizationScoped): Promise<TRecord[]> | TRecord[];
  health(): RepositoryHealth;
}

export interface ReadModel<TSummary> {
  summary(scope: OrganizationScoped): Promise<TSummary> | TSummary;
  health(): RepositoryHealth;
}
