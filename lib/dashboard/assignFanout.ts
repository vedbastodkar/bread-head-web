// Client-side fan-out helper: takes a base assignment payload and a list of
// class targets (each with its own due date / student scope) and POSTs one
// assignment per class, collecting per-class ok/error results so a partial
// failure (e.g. one class's roster rejects) doesn't abort the others.
export interface ClassTarget { classId: string; className: string; dueDate: string | null; studentUids?: string[] | null }
export interface FanoutResult { classId: string; className: string; ok: boolean; error?: string }

export async function fanoutAssign(
  post: (classId: string, body: object) => Promise<unknown>,
  basePayload: object,
  targets: ClassTarget[],
): Promise<FanoutResult[]> {
  const out: FanoutResult[] = []
  for (const t of targets) {
    const useStudents = Array.isArray(t.studentUids) && t.studentUids.length > 0
    const body = { ...basePayload, scope: useStudents ? 'students' : 'class', studentUids: useStudents ? t.studentUids : [], dueDate: t.dueDate }
    try { await post(t.classId, body); out.push({ classId: t.classId, className: t.className, ok: true }) }
    catch (e: any) { out.push({ classId: t.classId, className: t.className, ok: false, error: e?.message ?? 'failed' }) }
  }
  return out
}
