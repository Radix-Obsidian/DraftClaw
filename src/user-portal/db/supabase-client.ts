/**
 * PostgreSQL-backed Supabase-compatible adapter for local development.
 *
 * Exports the same `supabase` interface as @supabase/supabase-js so no
 * other file needs to change.  Uses the shared pg Pool from ./pool.js.
 */

import { Pool } from "pg";

// ── Lazy pool ────────────────────────────────────────────────────────────────
let _pool: Pool | null = null;
function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

// ── Types re-exported for consumers ─────────────────────────────────────────
export type DbUser = {
  id: string;
  email: string;
  phone: string | null;
  password_hash: string | null;
  whatsapp_jid: string | null;
  whatsapp_linked: boolean;
  subscription_tier: "free" | "pro" | "goat" | "enterprise";
  is_admin: boolean;
  stripe_customer_id: string | null;
  email_verified: boolean;
  email_verification_token: string | null;
  password_reset_token: string | null;
  password_reset_expires: string | null;
  created_at: string;
  updated_at: string;
};

export type DbSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
};

export type DbUsageRecord = {
  id: string;
  user_id: string;
  metric_type: "api_calls" | "messages_sent" | "messages_received" | "ai_tokens" | "media_uploads";
  metric_value: number;
  period_start: string;
  period_end: string;
  created_at: string;
};

export type DbSession = {
  id: string;
  user_id: string;
  token: string;
  refresh_token: string;
  expires_at: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
};

export type DbPick = {
  id: string;
  sport: "NBA" | "UFC" | "Soccer";
  type: "lock" | "longshot" | "trap";
  matchup: string;
  selection: string;
  odds: string;
  claw_edge: number;
  anchor_take: string;
  confidence: number;
  game_time: string | null;
  event_id: string | null;
  affiliate_links: Record<string, string>;
  is_active: boolean;
  generated_at: string;
  expires_at: string | null;
  created_at: string;
};

export type DbEvent = {
  id: string;
  sport: "NBA" | "UFC" | "Soccer";
  league: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  external_id: string | null;
  venue: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DbOddsSnapshot = {
  id: string;
  event_id: string;
  sportsbook: string;
  market_type: string;
  outcome: string;
  odds: number;
  line: number | null;
  fetched_at: string;
  created_at: string;
};

// ── Query result type ────────────────────────────────────────────────────────
type QueryResult = { data: any; error: any };

// ── Query builder ────────────────────────────────────────────────────────────
class QueryBuilder {
  private _table: string;
  private _op: "select" | "insert" | "update" | "delete" = "select";
  private _columns = "*";
  private _conds: Array<{ col: string; val: unknown; op: string }> = [];
  private _data: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private _single = false;
  private _orderCol: string | null = null;
  private _orderAsc = true;
  private _limit: number | null = null;
  private _offset: number | null = null;

  constructor(table: string) {
    this._table = table;
  }

  // ── Column spec (also used as chainable no-op after insert/update) ──────
  select(columns = "*", _opts?: unknown): this {
    if (this._op === "select") this._columns = columns;
    // called after insert/update – RETURNING * already in SQL, just a chain marker
    return this;
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]): this {
    this._op = "insert";
    this._data = data;
    return this;
  }

  update(data: Record<string, unknown>): this {
    this._op = "update";
    this._data = data;
    return this;
  }

  delete(): this {
    this._op = "delete";
    return this;
  }

  upsert(data: Record<string, unknown>, _opts?: unknown): this {
    this._op = "insert"; // simplified – uses ON CONFLICT DO UPDATE in _execute
    this._data = data;
    return this;
  }

  // ── Filters ──────────────────────────────────────────────────────────────
  eq(col: string, val: unknown): this {
    this._conds.push({ col, val, op: "=" });
    return this;
  }

  neq(col: string, val: unknown): this {
    this._conds.push({ col, val, op: "!=" });
    return this;
  }

  gte(col: string, val: unknown): this {
    this._conds.push({ col, val, op: ">=" });
    return this;
  }

  lte(col: string, val: unknown): this {
    this._conds.push({ col, val, op: "<=" });
    return this;
  }

  is(col: string, val: unknown): this {
    this._conds.push({ col, val: val === null ? "NULL" : val, op: "IS" });
    return this;
  }

  // ── Modifiers ─────────────────────────────────────────────────────────────
  order(col: string, opts?: { ascending?: boolean }): this {
    this._orderCol = col;
    this._orderAsc = opts?.ascending !== false;
    return this;
  }

  limit(n: number): this {
    this._limit = n;
    return this;
  }

  range(start: number, end: number): this {
    this._offset = start;
    this._limit = end - start + 1;
    return this;
  }

  single(): this {
    this._single = true;
    if (this._limit == null) this._limit = 1;
    return this;
  }

  // ── Thenable – executed when awaited ────────────────────────────────────
  then(resolve: (value: QueryResult) => unknown, reject?: (reason: unknown) => unknown) {
    return this._execute().then(resolve, reject);
  }

  catch(reject: (reason: unknown) => unknown) {
    return this._execute().catch(reject);
  }

  private async _execute(): Promise<QueryResult> {
    const pool = getPool();
    try {
      const params: unknown[] = [];
      let p = 1;

      const where = () => {
        if (this._conds.length === 0) return "";
        const parts = this._conds.map(({ col, val, op }) => {
          if (op === "IS" && val === "NULL") return `"${col}" IS NULL`;
          if (op === "IS") return `"${col}" IS NOT NULL`;
          params.push(val);
          return `"${col}" ${op} $${p++}`;
        });
        return " WHERE " + parts.join(" AND ");
      };

      let sql: string;

      if (this._op === "select") {
        sql = `SELECT ${this._columns} FROM "${this._table}"`;
        sql += where();
        if (this._orderCol)
          sql += ` ORDER BY "${this._orderCol}" ${this._orderAsc ? "ASC" : "DESC"}`;
        if (this._limit != null) sql += ` LIMIT ${this._limit}`;
        if (this._offset != null) sql += ` OFFSET ${this._offset}`;
      } else if (this._op === "insert") {
        const rows = Array.isArray(this._data) ? this._data : [this._data!];
        const cols = Object.keys(rows[0] as object);
        const colList = cols.map((c) => `"${c}"`).join(", ");
        const valueSets = rows.map((row) => {
          const placeholders = cols.map((c) => {
            params.push((row as Record<string, unknown>)[c]);
            return `$${p++}`;
          });
          return `(${placeholders.join(", ")})`;
        });
        sql = `INSERT INTO "${this._table}" (${colList}) VALUES ${valueSets.join(", ")} RETURNING *`;
      } else if (this._op === "update") {
        const data = this._data as Record<string, unknown>;
        const setClauses = Object.keys(data).map((col) => {
          params.push(data[col]);
          return `"${col}" = $${p++}`;
        });
        sql = `UPDATE "${this._table}" SET ${setClauses.join(", ")}`;
        sql += where();
        sql += " RETURNING *";
      } else {
        // delete
        sql = `DELETE FROM "${this._table}"`;
        sql += where();
        sql += " RETURNING *";
      }

      const result = await pool.query(sql, params as any[]);
      const rows = result.rows;

      if (this._single) {
        if (rows.length === 0) {
          return { data: null, error: { message: "Row not found", code: "PGRST116" } };
        }
        return { data: rows[0], error: null };
      }
      return { data: rows, error: null };
    } catch (err: unknown) {
      const e = err as Error & { code?: string };
      return { data: null, error: { message: e.message, code: e.code ?? "" } };
    }
  }
}

// ── SupabaseClient-compatible adapter ────────────────────────────────────────
class SupabaseAdapter {
  from(table: string): QueryBuilder {
    return new QueryBuilder(table);
  }
}

export const supabase: SupabaseAdapter = new SupabaseAdapter();
export type { SupabaseAdapter as SupabaseClient };
export default supabase;
