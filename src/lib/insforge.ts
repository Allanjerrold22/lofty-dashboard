const baseUrl = process.env.INSFORGE_BASE_URL;
const anonKey = process.env.INSFORGE_ANON_KEY;
const apiKey = process.env.INSFORGE_API_KEY;

if (!baseUrl || !apiKey) {
  console.warn("[insforge] INSFORGE_BASE_URL or INSFORGE_API_KEY not set. DB features disabled.");
}

export const INSFORGE_API_KEY = apiKey ?? "";
export const INSFORGE_ANON_KEY = anonKey ?? "";
export const INSFORGE_BASE_URL = baseUrl ?? "";
export const isDbEnabled = Boolean(baseUrl && apiKey);

// Lightweight fetch helpers that talk directly to InsForge REST API
async function dbFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${INSFORGE_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": INSFORGE_API_KEY,
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`InsForge ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

export const insforgeDb = {
  async select(table: string): Promise<Record<string, unknown>[]> {
    return dbFetch(`/api/database/records/${table}`);
  },

  async insert(table: string, rows: object[]): Promise<Record<string, unknown>[]> {
    return dbFetch(`/api/database/records/${table}`, {
      method: "POST",
      body: JSON.stringify(rows),
      headers: { "Prefer": "return=representation" },
    });
  },

  async update(table: string, id: string, fields: object): Promise<Record<string, unknown>[]> {
    return dbFetch(`/api/database/records/${table}`, {
      method: "PATCH",
      body: JSON.stringify({ filters: [{ column: "id", operator: "eq", value: id }], data: fields }),
    });
  },
};
