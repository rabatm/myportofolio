---
title: "Jurisperform Licence — The system that runs law tutoring, from scheduling to roll call"
date: 2026-09-26
tags: ["Django", "Django REST Framework", "React", "TypeScript", "PostgreSQL", "Google Apps Script", "Docker", "Hexagonal architecture", "EdTech"]
description: "End-to-end platform for Jurisperform, a law tutoring organization serving undergraduate students (years 1 to 3 of the French Licence) in several cities. It covers declaring university section classes, scheduling tutoring sessions, photos for mobile roll call, a student photo directory, coaching, and teaching reports."
image: "/projects/jurisperform-licence/thumbnail.png"
---

Jurisperform Licence is the platform that runs Jurisperform's law tutoring for students in L1, L2, and L3 (the three years of the French *Licence*, the equivalent of a bachelor's degree), across several cities. It brings together three building blocks:

- a **Django API**;
- a **React portal** with four areas: student, teacher, coach, and administrator;
- a **Google Sheets / Google Calendar sync** for each city.

Students declare their university TDs (*travaux dirigés*, the small-group section classes that accompany lectures), and Jurisperform schedules its own sessions around them with no time conflicts. Teachers take roll on their phones using student photos, and every session triggers a teaching report.

---

### 🔧 Background

Jurisperform offers law tutoring to undergraduate students, alongside their university courses, in several cities (Aix, Montpellier, Toulouse…). Each city has its own Google Sheet: students, groups, subjects, lectures, and teaching staff. This setup created three difficulties:

- **Scheduling**: you need to know each student's university timetable to fit Jurisperform sessions in without overlaps.
- **Taking roll**: teachers have to recognize dozens of students per group.
- **Tracking progress**: students and staff need a shared history of attendance, assessments, and coaching.

I designed and built the entire system on my own, from the API to deployment. The project started in August 2024 and is still in production.

---

### 🎯 The business need

1. **Students declare their university TDs** each semester: day, start and end time, or "I'm not attending."
2. **Jurisperform schedules its sessions** based on these declarations, which feed each city's Google Sheets and Google Calendar.
3. **Students upload a profile photo**, which is required to access their area. It is validated, then used for roll call.
4. **Teachers take roll** from the mobile app and browse their city's student photo directory.
5. **After each session**, the student receives a teaching report: attendance, participation, and the teacher's comments.
6. **Coaches write coaching reports**, which students can find in their area.
7. **The administration manages each city**: statistics, missing declarations, photo validation, sessions, grades.

---

### ⚙️ Key features

**Student area**

- **TD declarations**: students enter their TDs for each semester, and every change is kept in a history. The administration can open or close the declaration windows.
- **Mandatory photo**: without a photo, students can't access their dashboard. The photo is automatically straightened using face detection.
- **My sessions**: for each tutoring session, students see their attendance, their written and oral participation grade, and the teacher's comments.
- **My grades**: students declare their university grades (exams, quizzes, assignments graded by Jurisperform), which are then saved to Google Sheets.
- **My coaching**: students can find the history of reports written by their coach.

**Teacher area**

- **Photo directory by city**, with filters by group and subject, sorting, zoom, and flagging of students without a photo.

**Coach area**

- **Student follow-up**: coaches view a student's profile (sessions, grades, history) and write a report alongside it. Once sent, the report can no longer be edited and is shared with the student and the staff.

**Administrator area**

- **Dashboard**: monthly statistics by city (enrollments, withdrawals, headcount).
- **TD declarations**: progress tracking and a list of students who haven't declared yet.
- **Photos**: a validation queue. Non-compliant photos are rejected with a reason (blurry, face not visible…).
- **Sessions**: tracking by city, bulk cancellation of sessions, closing sessions without roll call.

**Automations**

- **Daily summary** sent to administrators.
- **Weekly summary**.
- **"Missed session" alerts**.
- **Nightly photo validation**.
- **Annual reset**, with an audit.

---

### 🏗️ Architecture

**Django / DRF API with a hexagonal architecture (ports and adapters)**

- The **`domain` layer** holds the business logic in pure Python. **Use cases** live in `application`, one per file, and receive their dependencies through injection.
- **Adapters** isolate Django, Google, and email.
- About forty **ports** are defined with `typing.Protocol`.
- The code follows **strict rules**: 70 lines max per file, 4 parameters max per function, mypy in strict mode, black, isort, pylint, and bandit.
- The original monolith is being **migrated incrementally** to this architecture, one domain at a time.

**Data model**

- **20 models**: users with roles (student, teacher, coach, admin) attached to a city, teacher and student sessions, subjects, versioned university TDs, lectures, coaching, grades, and an activity log.
- Around **150 REST endpoints**, authenticated with **JWT** (refresh tokens and a blacklist).

**React + TypeScript portal (Vite)**

- **Four areas**, each with its own layout and login page. URLs are scoped by city (`/:ville`).
- State with **Zustand**, data with **React Query**. Pages are loaded on demand (*lazy loading*).
- **Design system**: Radix/shadcn components and Tailwind, with CSS tokens. The student area is designed mobile-first.

**Google sync (Apps Script)**

- **Google Sheets is the source of truth** for students, subjects, staff, groups, and lectures. The API syncs them through staggered scheduled jobs.
- A **single Apps Script codebase** is deployed to each city's Sheet with `clasp`, and a script provides a dev/prod deployment menu.
- **Lectures (CM, *cours magistraux*) and TDs become recurring events** in Google Calendar, with one calendar per group. Students are added to the TD series they declared.

**Main flow**

- TD declaration in the portal → API → Apps Script webhook → the city's Sheet and Calendar → session scheduling → mobile roll call → teaching follow-up email.

---

### ⚠️ Technical challenges

#### 1. Syncing Django, Google Sheets, and Google Calendar

The data lives in three places: the Django database, each city's Google Sheet, and the Google calendars. They have to stay consistent, in both directions.

- **From the Sheet to Django**: the Google Sheet remains the source of truth for students, subjects, staff, groups, and lectures. The API imports them through **staggered scheduled jobs**, city by city.
- **From Django to the Sheet**: when a student declares their TDs, the API calls an **Apps Script webhook** that updates their city's Sheet. Grades declared by students are saved there as well.
- **From the Sheet to the calendars**: lectures and TDs become **recurring events**, with one calendar per group, and each student is added to the TD series they declared.
- **When something goes wrong**, a command can **restore declarations from the Google Sheet**.

#### 2. Google Apps Script execution limits

An Apps Script can't run for more than 6 minutes, which isn't enough to process an entire city's Sheet. The sync therefore runs in stages:

- **Batches of 30 rows**, with a resume cursor stored in Script Properties.
- **Automatic restart** via a one-off trigger, with cleanup of old triggers.
- **Duplicate prevention**: before creating an event, the script checks whether an event with the same title and the exact same times already exists.
- **Times and time zones**: the time is reapplied after each date shift to avoid errors when switching between daylight saving time and standard time.

#### 3. Photos that actually work for roll call

Many photos uploaded by students were rotated, too large, or had no visible face.

- The API **detects the face** with `face_recognition` (dlib), **fixes the orientation**, resizes the image, and generates a thumbnail.
- **Every night**, a job validates the photos. An email notifies students if theirs is rejected, and administrators receive the list of photos where no face was detected.

#### 4. A safe annual reset

Every year, the platform needs to start from scratch without losing its configuration.

- The reset deletes students, sessions, photos, and accounts, while keeping subjects, staff, and settings.
- It was initially exposed through an HTTP route. A code review found an **authorization bypass risk** there.
- It became a **shell command** that requires explicit confirmation, with an audit and a count of deleted records.

#### 5. Migrating to a hexagonal architecture without service interruption

- The migration is done one domain at a time, following automatically enforced rules (`make check`).
- Tests rely on in-memory *fakes* rather than mocks, with a Given/When/Then structure.

---

### 📈 Results

- **A single platform** for four user profiles (students, teachers, coaches, administrators), in production since 2024 in several cities.
- **TD declarations feed Google Sheets and Google Calendar directly**, with no re-entry.
- **Teaching follow-up is sent automatically** after each session (attendance, participation, comments), including to absent students.
- **Repetitive tasks are automated**: creating the week's sessions, closing sessions, summaries, alerts, backups of grades and of the database.
- **Code quality**:
  - 827 automated tests;
  - 80% minimum coverage required;
  - 47 documented admin commands;
  - CI/CD on the portal (lint, build, deployment on version tags).

---

### 📷 Visuals

![Student area — TD declarations](/projects/jurisperform-licence/capture-1.png)
![Teacher photo directory](/projects/jurisperform-licence/capture-2.png)
![Administrator dashboard](/projects/jurisperform-licence/capture-3.png)

---

### 🧰 Tech stack

- **Front end**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI / shadcn, Zustand, React Query, Recharts, Framer Motion
- **Back end**: Python, Django 5, Django REST Framework, SimpleJWT, hexagonal architecture, pytest, mypy, pylint, face_recognition (dlib), Pillow
- **Data**: PostgreSQL 16, Google Sheets / Drive / Calendar APIs, Google Apps Script (clasp)
- **Infrastructure**: VPS, Docker Compose, Gunicorn, Nginx, Let's Encrypt, cron, `pg_dump` backups to Google Drive, GitHub Actions
