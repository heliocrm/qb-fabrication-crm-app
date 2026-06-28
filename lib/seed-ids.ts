/** Deterministic UUIDs for seeded data — keep in sync with scripts/seed-database.ts */

export const SEED_ORG_ID = "a0000000-0000-4000-8000-000000000001"

export const SEED_ACCOUNT_IDS = {
  c1: "a0000000-0000-4000-8000-000000000101",
  c2: "a0000000-0000-4000-8000-000000000102",
  c3: "a0000000-0000-4000-8000-000000000103",
  c4: "a0000000-0000-4000-8000-000000000104",
  c5: "a0000000-0000-4000-8000-000000000105",
} as const

export const SEED_JOB_IDS = {
  j1: "a0000000-0000-4000-8000-000000000201",
  j2: "a0000000-0000-4000-8000-000000000202",
  j3: "a0000000-0000-4000-8000-000000000203",
  j4: "a0000000-0000-4000-8000-000000000204",
  j5: "a0000000-0000-4000-8000-000000000205",
} as const

/** Map legacy mock ids (j1) → Supabase UUIDs */
export const MOCK_TO_SEED_JOB_ID: Record<string, string> = {
  j1: SEED_JOB_IDS.j1,
  j2: SEED_JOB_IDS.j2,
  j3: SEED_JOB_IDS.j3,
  j4: SEED_JOB_IDS.j4,
  j5: SEED_JOB_IDS.j5,
}

export function resolveJobId(id: string): string {
  return MOCK_TO_SEED_JOB_ID[id] ?? id
}

export const SEED_TO_MOCK_ACCOUNT_ID: Record<string, string> = Object.fromEntries(
  Object.entries(SEED_ACCOUNT_IDS).map(([mock, uuid]) => [uuid, mock])
)

export function resolveAccountId(id: string): string {
  return SEED_ACCOUNT_IDS[id as keyof typeof SEED_ACCOUNT_IDS] ?? id
}

export function normalizeCustomerId(id: string): string {
  return SEED_TO_MOCK_ACCOUNT_ID[id] ?? id
}

export function isBpaAccount(customerId: string): boolean {
  return customerId === "c1" || customerId === SEED_ACCOUNT_IDS.c1
}
