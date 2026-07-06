#!/usr/bin/env python3
"""
Seed demo data for the Bread Head teacher dashboard (project: bread-head-4b6f9).

Creates: 1 teacher (role=teacher claim), TWO classes each with a roster of students,
and writes each student's progress into users/{uid} using the EXACT schema the iOS
app reads/writes (lessonProgress map with unitNlessonM ids + gamificationProgress).
Also sets a varied profile.updatedAt (last-active proxy) so the dashboard's
"needs attention" panel has something to surface.

Offline tooling — runs with the Admin SDK, bypasses security rules.

Setup:
    pip3 install firebase-admin
    export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
    python3 scripts/seed_demo.py
"""
import random
from datetime import datetime, timedelta, timezone

import firebase_admin
from firebase_admin import auth as admin_auth, credentials, firestore

PROJECT_ID = "bread-head-4b6f9"
TEACHER_EMAIL = "demo.teacher@bread-head.org"
TEACHER_PASSWORD = "DemoPass123!"   # demo only
STUDENT_PASSWORD = "DemoPass123!"

# REAL per-unit lesson counts from CourseCatalog (all 10 units).
UNIT_LESSON_COUNTS = {1: 4, 2: 15, 3: 8, 4: 18, 5: 9, 6: 7, 7: 13, 8: 8, 9: 7, 10: 6}

CLASSES = [
    {
        "id": "demo-period-1", "name": "Period 1 — Personal Finance",
        "joinCode": "BREADA", "school": "Demo High School",
        # an assignment already past its due date (for the "needs attention" demo)
        "overdue_lessons": ["unit4lesson1", "unit4lesson2"],
        "students": [
            ("demo.student1@bread-head.org", "Ava Martinez"),
            ("demo.student2@bread-head.org", "Ben Carter"),
            ("demo.student3@bread-head.org", "Chloe Nguyen"),
            ("demo.student4@bread-head.org", "Diego Rossi"),
            ("demo.student5@bread-head.org", "Emma Johnson"),
        ],
    },
    {
        "id": "demo-period-2", "name": "Period 2 — Personal Finance",
        "joinCode": "BREADB", "school": "Demo High School",
        "students": [
            ("demo.student6@bread-head.org", "Frank Ortiz"),
            ("demo.student7@bread-head.org", "Grace Kim"),
            ("demo.student8@bread-head.org", "Hassan Ali"),
        ],
    },
]


def init() -> firestore.Client:
    if not firebase_admin._apps:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {"projectId": PROJECT_ID})
    return firestore.client()


def upsert_user(email: str, password: str, name: str) -> str:
    try:
        user = admin_auth.get_user_by_email(email)
    except admin_auth.UserNotFoundError:
        user = admin_auth.create_user(email=email, password=password, display_name=name)
    return user.uid


def completed_ids_up_to(unit: int, lesson: int) -> list[str]:
    """All lesson ids strictly before (unit, lesson), 1-indexed."""
    ids: list[str] = []
    for u in range(1, unit + 1):
        last = (lesson - 1) if u == unit else UNIT_LESSON_COUNTS[u]
        for l in range(1, last + 1):
            ids.append(f"unit{u}lesson{l}")
    return ids


def seed():
    db = init()
    now = datetime.now(timezone.utc)

    # ---- Teacher ----
    teacher_uid = upsert_user(TEACHER_EMAIL, TEACHER_PASSWORD, "Demo Teacher")
    admin_auth.set_custom_user_claims(teacher_uid, {"role": "teacher"})
    db.collection("users").document(teacher_uid).set({
        "profile": {
            "uid": teacher_uid, "email": TEACHER_EMAIL, "name": "Demo Teacher",
            "role": "teacher", "provider": "email",
            "createdAt": now, "updatedAt": now,
            "classIds": [c["id"] for c in CLASSES],
        }
    }, merge=True)
    print(f"teacher: {TEACHER_EMAIL}  uid={teacher_uid}  (role=teacher)")

    for cls in CLASSES:
        db.collection("classes").document(cls["id"]).set({
            "name": cls["name"], "teacherId": teacher_uid, "schoolName": cls["school"],
            "joinCode": cls["joinCode"], "createdAt": now,
        }, merge=True)
        print(f"\nclass: {cls['name']}  (join {cls['joinCode']})")

        for email, name in cls["students"]:
            uid = upsert_user(email, STUDENT_PASSWORD, name)
            unit = random.randint(1, 6)
            lesson = random.randint(1, UNIT_LESSON_COUNTS[unit])
            completed = completed_ids_up_to(unit, lesson)
            xp = len(completed) * random.randint(40, 80)
            # varied last-active so "needs attention" (inactive) has signal
            last_active = now - timedelta(days=random.randint(0, 20), hours=random.randint(0, 23))

            db.collection("users").document(uid).set({
                "profile": {
                    "uid": uid, "email": email, "name": name,
                    "role": "student", "provider": "email",
                    "createdAt": now, "updatedAt": last_active,
                    "classIds": [cls["id"]],
                    "teacherIds": [teacher_uid],   # what the security rule checks
                },
                "lessonProgress": {
                    "completedLessons": completed,
                    "currentUnit": unit,
                    "currentLesson": lesson,
                },
                "gamificationProgress": {
                    "xp": xp, "lifetimeXP": xp, "level": 1 + len(completed) // 5,
                },
            }, merge=True)

            db.collection("classes").document(cls["id"]).collection("roster").document(uid).set({
                "studentUid": uid, "displayName": name, "joinedAt": now, "status": "active",
            }, merge=True)
            days = (now - last_active).days
            print(f"  {name:16s} {len(completed):2d} lessons  {xp:4d} xp  active {days}d ago")

        # optional overdue assignment (drives "needs attention")
        if cls.get("overdue_lessons"):
            due = (now - timedelta(days=3)).date().isoformat()
            db.collection("classes").document(cls["id"]).collection("assignments").add({
                "lessonIds": cls["overdue_lessons"], "scope": "class", "studentUids": [],
                "dueDate": due, "createdAt": now,
            })
            print(f"  + overdue assignment: {cls['overdue_lessons']} due {due}")

    print("\nDone. Log in as the teacher and open /dashboard.")
    print(f"  email: {TEACHER_EMAIL}\n  pass:  {TEACHER_PASSWORD}")


if __name__ == "__main__":
    seed()
