# Implemented playability improvements · v1.1.0

The [baseline review](REVIEW.md) describes the previous interface at `b7fd656`. This release implements its seven prioritised fixes and simplifies the main player flow.

- The game uses an available-height budget. The garden and controls stay visible across portrait, landscape, laptop and desktop layouts, including calibrated gardens. Garden geometry stays fixed through cue, sorting, retention and recall.
- Leaving an empty session safely returns home. The complete state no longer reads a missing trial.
- Unsupported check-ins are identified before onboarding. Returning from the original-style protocol selects training explicitly, and resuming a session identifies its actual mode and configuration.
- Home is shorter, the introduction has two practical steps, and explicit Start actions begin play without a second ready confirmation. The two-success practice criterion is preserved.
- Feedback places Next round before an optional replay; no replay garden appears until requested. A touch that finishes recall cannot accidentally activate a new feedback action beneath it.
- Recall uses one garden tab stop, arrow-key navigation and Enter/Space. Unavailable controls are disabled. Focus follows recall and feedback; the countdown no longer produces a live announcement every second.
- Results show two main scores with denominators and clear round counts. Details and downloads are collapsed. Practice history is labelled as unscored practice.
- Essential text is larger and darker. Repeated taglines and decorative explanations have been removed; the pepper artwork is retained.

Task timings, sequence generation, scoring and adaptation rules are preserved. New sessions record presentation version `compact-2`; an old session resumed in the new interface is marked `mixed-compact-2`. Check-in trends require the same presentation version, avoiding direct grouping of original and revised layouts. Existing saved sessions remain available.

## Verification

The automated suite includes core behaviour, complete training and assessment sessions, persistence/recovery/export, all four empty-session exits, 16 viewport sizes, five calibrated layouts, keyboard interaction and a complete touch onboarding journey. Layout assertions run before pointer actions can automatically scroll controls into view.

The final build and test results are recorded in the release handoff. Unit tests also run in the GitHub Pages build workflow.

The implementation smoke check captures fresh browser contexts at five representative sizes and verifies that the complete garden, response row and pause action are visible at scroll position zero. It also exercises pause, finish and results. Screenshots and numeric evidence are in [implemented/measurements.json](implemented/measurements.json).

| Screen | Before | After |
| --- | --- | --- |
| Home, 390 × 844 | About 205 visible words; 2134 px page | About 66 visible words; one viewport |
| Play, 375 × 667 | Sorting buttons at 692–788 px, below the viewport | Buttons at 587–657 px, fully visible |
| Play, 1440 × 900 | Sorting buttons at 860–950 px, partly outside the viewport | Buttons at 738–814 px, fully visible |
| Play, 844 × 390 | Pepper and buttons require scrolling | Stage and controls fit side by side |

See [phone play](implemented/sort-375x667.png), [landscape play](implemented/sort-844x390.png), [phone home](implemented/home-390x844.png), and [phone results](implemented/results-390x844.png).

Reproduce the current smoke check with `node review/verify.mjs`, with Vite running on port 5174. Pass a deployed base URL as its argument to verify a production build; this uses native IndexedDB in disposable browser contexts and needs no development modules or production test hooks.

Physical-device Safari/Android browser chrome, text enlargement and assistive-technology testing remain follow-up checks. Automated Chromium viewports do not establish cross-browser or clinical equivalence.
