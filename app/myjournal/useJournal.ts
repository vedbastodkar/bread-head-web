'use client'
import { useCallback, useEffect, useState } from 'react'
import { collection, doc, getDocs, setDoc, serverTimestamp, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useAuth } from '@/app/context/AuthContext'

export interface JournalEntry {
  id: string
  body: string
  teacherAssigned: boolean
  assignmentId?: string
  classId?: string
  questions?: string[]
  answers?: string[]   // per-question answers when the entry has multiple questions
  wordCount: number
  secondsSpent: number
  createdAt?: Date
  lastModified?: Date
}

// Owner-only reads/writes of users/{uid}/journal — private by rule. Teachers can
// never read this subcollection; metadata reaches them only via the submit route.
export function useJournal() {
  const { user, loading: authLoading } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    ;(async () => {
      setLoading(true)
      try {
        setErr('')
        const q = query(collection(db, 'users', user.uid, 'journal'), orderBy('lastModified', 'desc'))
        const snap = await getDocs(q)
        const rows: JournalEntry[] = snap.docs.map((d) => {
          const x = d.data() as any
          return {
            id: d.id,
            body: x.body ?? '',
            teacherAssigned: x.teacherAssigned === true,
            assignmentId: x.assignmentId ?? undefined,
            classId: x.classId ?? undefined,
            questions: Array.isArray(x.questions) ? x.questions : undefined,
            answers: Array.isArray(x.answers) ? x.answers : undefined,
            wordCount: x.wordCount ?? 0,
            secondsSpent: x.secondsSpent ?? 0,
            createdAt: x.createdAt?.toDate?.() ?? undefined,
            lastModified: x.lastModified?.toDate?.() ?? undefined,
          }
        })
        setEntries(rows)
      } catch (e: any) {
        setErr(e?.message || 'Failed to load journal')
      } finally {
        setLoading(false)
      }
    })()
  }, [authLoading, user, reloadKey])

  const saveEntry = useCallback(async (e: JournalEntry) => {
    if (!user) throw new Error('Not signed in')
    const ref = doc(db, 'users', user.uid, 'journal', e.id)
    await setDoc(ref, {
      id: e.id,
      body: e.body,
      teacherAssigned: e.teacherAssigned,
      ...(e.assignmentId ? { assignmentId: e.assignmentId } : {}),
      ...(e.classId ? { classId: e.classId } : {}),
      ...(e.questions ? { questions: e.questions } : {}),
      ...(e.answers ? { answers: e.answers } : {}),
      wordCount: e.wordCount,
      secondsSpent: e.secondsSpent,
      createdAt: e.createdAt ?? serverTimestamp(),
      lastModified: serverTimestamp(),
    }, { merge: true })
  }, [user])

  return {
    entries, loading, err, saveEntry,
    reload: () => setReloadKey((k) => k + 1),
    uid: user?.uid ?? null,
  }
}
