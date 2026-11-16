// BigQuery client for the admin portal — server only. Reads the reporting layer
// (`breadhead_analytics.v_users` / `v_events` / `v_lesson_progress`, defined in
// breadhead/docs/analytics/views.sql); reporting never touches Firestore directly.
//
// Credentials: `BIGQUERY_CREDENTIALS_JSON` (a full service-account JSON, for a narrower
// BigQuery-only account) if set, else the same service account the Admin SDK uses
// (`FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY`), which holds BigQuery
// Data Editor + Job User. Nothing here is ever imported into a client component.
import { BigQuery } from '@google-cloud/bigquery'

export const DATASET = 'breadhead_analytics'
/** The dataset lives in us-central1; jobs must be routed there or BigQuery reports "not found". */
export const LOCATION = process.env.BIGQUERY_LOCATION || 'us-central1'

let client: BigQuery | null = null

function credentials(): { projectId: string; credentials: { client_email: string; private_key: string } } {
  const raw = process.env.BIGQUERY_CREDENTIALS_JSON
  if (raw) {
    const k = JSON.parse(raw) as { project_id: string; client_email: string; private_key: string }
    return { projectId: k.project_id, credentials: { client_email: k.client_email, private_key: k.private_key } }
  }
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const client_email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const private_key = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!projectId || !client_email || !private_key) throw new Error('BigQuery credentials are not configured')
  return { projectId, credentials: { client_email, private_key } }
}

export function bigquery(): BigQuery {
  if (!client) client = new BigQuery(credentials())
  return client
}

/** Fully-qualified view reference for use inside SQL. */
export const view = (name: 'v_users' | 'v_events' | 'v_lesson_progress' | 'v_slide_dwell') => `\`${DATASET}.${name}\``

/** Run a parameterised query and return plain rows. Timestamps come back as BigQuery objects; see `tsValue`. */
export async function runQuery<T = Record<string, unknown>>(query: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const [rows] = await bigquery().query({ query, params, location: LOCATION })
  return rows as T[]
}

/** BigQuery TIMESTAMP/DATE cells arrive as `{ value: string }`; normalise to an ISO string or null. */
export function tsValue(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v
  if (typeof v === 'object' && 'value' in (v as object)) return String((v as { value: unknown }).value)
  return String(v)
}
