import type { Sql } from "postgres";
import type { AgiCard, AgentExecution } from "./types";

// Normalize to a plain JSON value for the postgres jsonb columns.
function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

// Persistence behind one interface (same swappable pattern as the signer and
// transport). In-memory by default so the demo needs zero config; Postgres when
// DATABASE_URL is set, so cards survive restarts in production.
export interface Store {
  saveCard(card: AgiCard): Promise<AgiCard>;
  getCard(id: string): Promise<AgiCard | undefined>;
  listCards(): Promise<AgiCard[]>;
  updateCard(id: string, patch: Partial<AgiCard>): Promise<AgiCard | undefined>;
  addExecution(execution: AgentExecution): Promise<AgentExecution>;
  listExecutions(cardId: string): Promise<AgentExecution[]>;
  listAllExecutions(): Promise<AgentExecution[]>;
  updateExecution(
    id: string,
    patch: Partial<AgentExecution>
  ): Promise<AgentExecution | undefined>;
}

// --- In-memory (default; resets on restart) ---
class InMemoryStore implements Store {
  private cards = new Map<string, AgiCard>();
  private execs = new Map<string, AgentExecution[]>();

  async saveCard(card: AgiCard) {
    this.cards.set(card.id, card);
    return card;
  }
  async getCard(id: string) {
    return this.cards.get(id);
  }
  async listCards() {
    return [...this.cards.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }
  async updateCard(id: string, patch: Partial<AgiCard>) {
    const existing = this.cards.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.cards.set(id, updated);
    return updated;
  }
  async addExecution(execution: AgentExecution) {
    const list = this.execs.get(execution.cardId) ?? [];
    list.unshift(execution);
    this.execs.set(execution.cardId, list);
    return execution;
  }
  async listExecutions(cardId: string) {
    return this.execs.get(cardId) ?? [];
  }
  async listAllExecutions() {
    return [...this.execs.values()]
      .flat()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async updateExecution(id: string, patch: Partial<AgentExecution>) {
    for (const list of this.execs.values()) {
      const index = list.findIndex((e) => e.id === id);
      if (index >= 0) {
        list[index] = { ...list[index], ...patch };
        return list[index];
      }
    }
    return undefined;
  }
}

// --- Postgres (production; activates when DATABASE_URL is set) ---
// Cards/executions are stored as JSONB so the AgiCard shape can evolve without
// migrations. Connection + tables are created lazily on first use.
class PostgresStore implements Store {
  private ready: Promise<Sql> | null = null;

  private connect(): Promise<Sql> {
    if (!this.ready) {
      this.ready = (async () => {
        const postgres = (await import("postgres")).default;
        const sql = postgres(process.env.DATABASE_URL as string);
        await sql`create table if not exists agicards (
          id text primary key, data jsonb not null,
          created_at timestamptz not null default now())`;
        await sql`create table if not exists agicard_executions (
          id text primary key, card_id text not null, data jsonb not null,
          created_at timestamptz not null default now())`;
        return sql;
      })();
    }
    return this.ready;
  }

  async saveCard(card: AgiCard) {
    const sql = await this.connect();
    await sql`insert into agicards (id, data) values (${card.id}, ${sql.json(toJson(card))})
      on conflict (id) do update set data = ${sql.json(toJson(card))}`;
    return card;
  }
  async getCard(id: string) {
    const sql = await this.connect();
    const rows = await sql`select data from agicards where id = ${id}`;
    return rows[0]?.data as AgiCard | undefined;
  }
  async listCards() {
    const sql = await this.connect();
    const rows = await sql`select data from agicards order by created_at desc`;
    return rows.map((r) => r.data as AgiCard);
  }
  async updateCard(id: string, patch: Partial<AgiCard>) {
    const existing = await this.getCard(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    await this.saveCard(updated);
    return updated;
  }
  async addExecution(execution: AgentExecution) {
    const sql = await this.connect();
    await sql`insert into agicard_executions (id, card_id, data)
      values (${execution.id}, ${execution.cardId}, ${sql.json(toJson(execution))})
      on conflict (id) do update set data = ${sql.json(toJson(execution))}`;
    return execution;
  }
  async listExecutions(cardId: string) {
    const sql = await this.connect();
    const rows = await sql`select data from agicard_executions
      where card_id = ${cardId} order by created_at desc`;
    return rows.map((r) => r.data as AgentExecution);
  }
  async listAllExecutions() {
    const sql = await this.connect();
    const rows = await sql`select data from agicard_executions order by created_at desc`;
    return rows.map((r) => r.data as AgentExecution);
  }
  async updateExecution(id: string, patch: Partial<AgentExecution>) {
    const sql = await this.connect();
    const rows = await sql`select data from agicard_executions where id = ${id}`;
    const existing = rows[0]?.data as AgentExecution | undefined;
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    await sql`update agicard_executions set data = ${sql.json(toJson(updated))} where id = ${id}`;
    return updated;
  }
}

// Share one instance across route bundles and dev hot-reloads. In serverless
// production each instance is isolated, so set DATABASE_URL for shared state.
const globalForStore = globalThis as unknown as { __agicardsStore?: Store };

export function getStore(): Store {
  if (!globalForStore.__agicardsStore) {
    globalForStore.__agicardsStore = process.env.DATABASE_URL
      ? new PostgresStore()
      : new InMemoryStore();
  }
  return globalForStore.__agicardsStore;
}
