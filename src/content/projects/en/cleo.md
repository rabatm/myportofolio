---
title: "Cleo — The menu bar cat"
date: 2026-09-01
tags: ["macOS", "SwiftUI", "AppKit"]
description: "A macOS menu bar app: an animated cat that runs at the speed of your CPU, and shows memory plus Claude and Kimi quotas with their countdowns."
kind: atelier
services: []
---

The cat in your menu bar. That runs..

Version Cat in the menu bar Has never missed a nap

**The saga**
Once upon a time there was a menu bar. Cold. Grey. Desperately devoid of felines.

Then Cleo arrived. An animated cat doing parkour across your menu bar at a speed proportional to your CPU. The more you compile, the harder he sprints. The worse you compile, the faster he sprints.

Cleo doesn't just run. Cleo knows. He knows your Claude quotas (5 h / 7 d) and your Kimi quotas (5 h + monthly). He shows them as pretty rings, with a countdown to the reset, so you know exactly how much time you have left before disaster strikes.

And when the quota hits zero… Cleo watches you. He saw it all coming.

**What Cleo keeps an eye on**

| Metric | Source | Display |
|---|---|---|
| 🏃 CPU | Mach API (host_processor_info) | Cat speed (smoothed, he won't panic-sprint over a 50 ms spike) |
| 🧠 Memory | host_statistics64 + system pressure | Pressure (normal / warning / critical) + GB used + swap |
| 🟠 Claude quota | Unofficial /api/oauth/usage endpoint, token read from the macOS Keychain | Double ring: 5 h window (inner) and 7 d (outer) |
| 🌙 Kimi quota | api.kimi.ai/coding/v1/usages, token refreshed from ~/.kimi-code/credentials/ | Double ring: 5 h window + monthly |

The quota counters show the time left before reset (3h12, 47m, 2d14h) — so you can savour the wait.

**Features**
- 🐱 Animated cat (19 hand-drawn frames, because Cleo deserves better than an emoji)
- 📊 Detailed menu: CPU, memory, quotas, countdown
- 🔄 Automatic quota refresh
- 🙈 Hide what you like: "Show Claude Code" and "Show Kimi Code" in the menu. A hidden provider disappears from the bar and the panel, and is no longer queried. Cleo remembers.
- 🚀 Launch at login via LaunchAgent (with a toggle in the menu, and Cleo detects on his own if he's already running — he doesn't like look-alikes)
- 🪶 Lightweight: menu bar accessory (LSUIElement), zero Dock, zero pointless windows

**Installation**: build with Xcode (Cleo target), drag the app into /Applications, launch. Turn on launch at login from the menu. Cleo does the rest.

**Requirements**: a recent macOS (AppKit + SwiftUI); Claude Code CLI installed (for the Claude quota — Cleo reads the token via /usr/bin/security, like the CLI does: no Keychain prompt); Kimi Code CLI installed (for the Kimi quota).

**Philosophy**: "I don't run because your CPU is at 90%. I run because *you* are running." — Cleo, probably, while you were waiting for your build.

No cats were stressed during development

Behind the joke, the same reflex as in [my client projects](/en/projects): go fetch the information where it lives and make it readable at a glance.
