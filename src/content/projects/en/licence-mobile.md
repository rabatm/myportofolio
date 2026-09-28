---
title: "Jurisperform Professeur — Roll call and teaching follow-up from a phone"
date: 2026-06-01
tags: ["React Native", "Expo", "TypeScript", "MobX", "EAS", "EdTech"]
description: "Mobile app for Jurisperform's teachers: they see their sessions for the week, take roll using student photos, then assess each student who attended. The teaching report is then sent automatically."
image: "/projects/licence-mobile/thumbnail.png"
---

Jurisperform Professeur is the mobile app for Jurisperform's teachers. It shows the week's sessions, lets teachers take roll by tapping the photos of students who are present, then walks them through assessing each student, one at a time. It runs on the API of the [Jurisperform Licence](/en/projects/jurisperform-licence) platform.

---

### 🔧 Background

Jurisperform offers law tutoring to undergraduate students (enrolled in the French *Licence*, the equivalent of a bachelor's degree) in several cities. After each session, students must receive a report: attendance, participation, and the teacher's comments. For that report to exist, the teacher has to enter attendance and the assessment right after class, often standing in the classroom, on their phone.

I built the app on my own. The first version dates from September 2024. It was updated in September 2025 (move to Expo 53, new session list), then completely redesigned in August 2026.

---

### 🎯 The business need

1. **Teachers log in** with their Jurisperform account. Only teacher accounts are accepted.
2. **They see their sessions for the week**: subject, group, city, sessions completed out of the total planned, and what's left to do.
3. **They take roll** by tapping the photos of the students who are present.
4. **They assess each student present**: oral participation, written preparation for the session, and a comment.
5. **The teaching report is sent** to the student by the platform.

---

### ⚙️ Key features

- **Sessions of the week**: sessions are sorted by year (L1, L2, L3), then by group. Groups that have a TD (a university section class) come first. Each city has its own color, so a teacher who works in several cities can tell them apart at a glance. Each session shows "Roll call pending" or "Session done."
- **Photo roll call**: the group's students are displayed in a grid of three photos per row. A tap marks a student as present, and a counter tracks the number present. A summary screen lets the teacher review the selection before submitting.
- **Teaching follow-up**: after roll call, the app goes through the students who were present one by one, showing the photo, the subject, and the number of students left. There are two criteria:
  - oral participation: insufficient, fair, satisfactory, or excellent;
  - written preparation, with an additional "not applicable" option.
  
  The comment is optional. A confirmation dialog summarizes the assessment before it is sent.
- **Resume after interruption**: a roll call in progress and the remaining assessments are kept on the phone. If the app is closed mid-roll call, it reopens directly on the screen where the teacher left off.
- **Remembered login**: credentials are stored in the phone's secure keychain, and the session is checked against the API each time the app opens.
- **Mandatory updates**: at launch, the app checks whether a new version is available. If so, it blocks access and redirects to the app store.

---

### 🏗️ Architecture

**Expo / React Native app in TypeScript**

- **Expo Router**: file-based routing with typed routes. The screens are login, sessions, roll call, summary, and teaching follow-up.
- **MobX**: three stores (authentication, the week's sessions, the teaching follow-up in progress), persisted to AsyncStorage so they survive the app being closed.
- **API layer**: a centralized `fetch` service adds the JWT to every request. Hooks (`useAuth`, `useSession`, `useNextPeda`) expose the calls to the screens.
- **Design system**: colors, radii, and the glass effect are defined as tokens in `styles/theme.ts`. Two base components, `GlassPanel` (real blur with `expo-blur`) and `Pill` (capsule button), are used across all screens.

**Communication with the Django API**

- Login → the teacher's list of sessions → the session's students → submission of those present. The API then returns the first student to assess.
- Each submitted assessment returns the next student, until the end-of-roll-call message.
- Photos arrive as base64 in the response, which avoids one request per photo.

**Build and distribution**

- **EAS Build** with three profiles: development, preview, and production. The build number is incremented automatically, and the version follows the `YYYYMMDDHHmm` format.
- **Continuous Native Generation**: native folders aren't version-controlled and are regenerated at build time. A patch (`patches/`) on `expo-modules-jsi` makes it compile with Swift 6.2.

---

### ⚠️ Technical challenges

#### 1. Never losing a roll call in progress

A teacher can be interrupted mid-roll call: a phone call, switching apps, or a force quit. Starting over would mean losing the attendance already entered.

- The session and the list of checked students are **saved to AsyncStorage** each time a step is confirmed.
- When returning to the session list, the app **automatically redirects** to the roll call in progress, or to the teaching follow-up if some students still need to be assessed.
- This local data is cleared only once the API confirms the roll call is complete.

#### 2. Preventing duplicate submissions

Submitting attendance and submitting assessments both create data on the server: a double submission would produce duplicates. On mobile, a double tap happens easily.

- Each submit button is **locked while the request is in flight**, then unlocked when the response comes back.
- Navigation is protected by a **synchronous guard**, so a double tap on a session doesn't open two screens.

#### 3. Keeping the app up to date for every teacher

The API evolves, and an old version installed on a phone may stop working with it.

- At startup, the app queries **expo-updates**. If an update is available, a blocking screen redirects to the app store.
- A **contract test** in Python (`backend_tests/`) checks that the API returns the fields expected by the app's TypeScript types: login, sessions, roll call, teaching follow-up.

#### 4. Redesigning the app without breaking the business logic

In August 2026, the app was completely redesigned: an ivory background, frosted-glass panels, a burgundy header band, and capsule buttons.

- The work started from a **specification** and an **implementation plan** written before any code. Each screen in the mockup is mapped to the existing files.
- The tokens and base components were built first, then the screens were reworked one by one.
- The **business logic stayed identical**: same assessment levels, same rule for "not applicable," same API calls.

---

### 📈 Results

- **In production since September 2024** and published on the App Store as *Jurisperform Professeur*.
- **Roll call and assessments are done from the phone**, right after the session. Each assessment feeds the teaching report the platform sends to the student.
- **Three generations of the app** (2024, 2025, 2026), with Expo upgrades up to SDK 57.

---

### 📷 Visuals

![Sessions of the week](/projects/licence-mobile/capture-1.png)
![Photo roll call](/projects/licence-mobile/capture-2.png)
![Assessing a student](/projects/licence-mobile/capture-3.png)

---

### 🧰 Tech stack

- **Front end**: React Native 0.86, React 19, Expo SDK 57, Expo Router, TypeScript, MobX, expo-blur, Reanimated
- **Back end**: Django REST API from [Jurisperform Licence](/en/projects/jurisperform-licence), JWT authentication
- **Data**: AsyncStorage (local state and resume), expo-secure-store (credentials)
- **Infrastructure**: EAS Build, expo-updates, API contract tests in Python (unittest)
