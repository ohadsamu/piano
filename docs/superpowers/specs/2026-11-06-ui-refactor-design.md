# UI Refactor: One Clear Path to Play

- **Date:** 2026-11-06
- **Scope:** `src/App.tsx`, `src/components/**`, new `src/hooks/**`, small UI-only helpers in `src/utils/**`, `tailwind.config.js`, `src/index.css`, `index.html`.
- **Out of scope:** the internals of `src/engines/*` (AudioEngine, MicPitchDetector, InputManager, PracticeEngine, CoachDiagnosisEngine). A separate agent is fixing PracticeEngine stalls. This plan only uses the engines' existing public methods (§4.4).
- **Supersedes:** §1.4 (wireframes) and §7 (input UX) of `docs/specs/piano-pedagogy-and-ux-design.md`. The colour tokens in §1.2 stay, with the changes listed in §2.6.

---

## 1. Problems found

| # | Problem | Evidence |
|---|---|---|
| P1 | **A user with no MIDI and no mic can't move forward.** The on-screen keyboard is hidden by default, QWERTY labels are turned off, and nothing says that Q W E R T… play C4 D4 E4…. | `PracticeStudioView.tsx:120` `hideUiKeyboard = true`; `showQwertyLabels={false}`; no QWERTY copy anywhere |
| P2 | **Lessons skip ahead and auto-start.** Picking a lesson jumps to step 3 (`stepIndex = 2`), so the video and "find the keys" steps are skipped. The engine clock starts (`AutoStart: true`) before the user has looked at the screen. | `App.tsx:71`, `handleSelectLesson(…, 2)`, dropdown `onSelectLesson(val, 2)` |
| P3 | **Notes are thrown away while paused.** `handleNoteInput` ignores `note_on` when `!isPlaying` or when paused. A user who presses Pause (or any loaded-but-not-started step) and then plays sees no reaction. | `PracticeEngine.ts:686` |
| P4 | **Progress isn't shown, and the progress that is recorded isn't true.** There is no "notes done / total" anywhere. "Continue to next step" and "Skip to Step 3" both run `handleAdvanceNextStep`, which marks the step complete and awards XP whether or not it was played. The key-discovery handler always marks step **2**, even when it's a different step. XP 250 and a 3-day streak are seeded as fake defaults. | `App.tsx:340-385`, `App.tsx:139-145`, `storage.ts` `DEFAULT_PROFILE` |
| P5 | **Too much on screen.** The practice view stacks 4 bars (tabs, lesson select + 5 step pills + Play/Restart/RH/LH/Both/Key Map/Options, coach banner with Start Listening + Fix Play, song title) above the staff. A modal (Fix Me) opens by itself at the end of the slow and full-speed steps. | `PracticeStudioView.tsx:222-420`, `App.tsx:225-230` |
| P6 | **Not built for mobile.** The keyboard draws C3–B5 (21 white keys) at percentage widths, so each key is about 17px wide at 360px. Many controls are 24–28px tall (`py-1 text-[11px]`). The grand staff is 228px per bar plus a 104px header, so less than one bar fits on a phone and it doesn't follow the music. | `keyboardLayout.ts:3-5`, `GrandStaffView.tsx:36-37` |
| P7 | **Jargon:** "Wait", "Flow", "Fix Play", "Ivory", "Key Map", "Coach Diagnostic", "Landmark", "Stage Performance", "S1–S5". | throughout |
| P8 | **Four peer tabs (Practice, Lessons, Videos, Workouts) compete with the main path.** Videos shows up in three places (tab, drawer, step 1). | `TopNavigation.tsx`, `VideoCoachDrawer.tsx` |
| P9 | **`App.tsx` does everything (828 lines):** routing, profile persistence, engine lifecycle, the rAF clock, input wiring, coach analysis, and 40-prop drilling into `PracticeStudioView` (831 lines). Session-complete callbacks are re-bound on every lesson change and capture stale closures. | `App.tsx:120-235` |
| P10 | **Dead code:** `TransportControlBar.tsx` and `StepGuideStepper.tsx` are not imported anywhere. | grep |

---

## 2. Information architecture and screens

### 2.1 Principles

1. **One verb per screen.** Home: *choose*. Practice: *play the lit key*. Results: *go to the next step*.
2. **The instrument is always there.** During any playable step the keyboard sits at the bottom of the viewport. You can always play on screen, and nothing else is needed to make progress.
3. **Progress is counted, never claimed.** A step is marked done only when the engine reports `isCompleted`. Skipping is allowed but recorded as skipped, not done.
4. **Spend boldness in one place.** The memorable element is the *target note*: a large Fraunces note name ("E4") with the finger number, sitting directly above the key on the crimson-felt keybed that glows in the hand colour. Everything else is quiet: plain sans-serif text, hairline separators, no cards inside cards.
5. **Plain language** (§2.7 is the single source for labels).

### 2.2 Navigation model

```
Home (#/)
 ├── Lesson player  (#/lesson/:lessonId/:stepNumber)   ← primary path
 ├── Song player    (#/song/:songId)
 └── Quick drills   (#/drills)                         ← demoted Workouts
Sheets (overlays, no route): How you play · Settings · What to work on · Intro video
```

- **Hash routing** (`window.location.hash`): it works on GitHub Pages under `/piano/` with no 404 fallback, and it makes the phone's Back button leave the player. It's about 40 lines in `useHashRoute`, with no new dependency.
- **Tabs removed.** Videos is no longer a destination. The intro video is step 1 of each lesson, as an optional sheet. The Video Academy grid and the video drawer are deleted. Workouts becomes "Quick drills", reached from a row on Home.

### 2.3 Screens: mobile portrait (360–430px), first-class

**Home**

```
┌──────────────────────────────────────┐  360px
│ ♪ Nocturne            [⌨ Tap keys ▾] │  header 56px; right chip = How you play
├──────────────────────────────────────┤
│ Pick up where you left off           │
│ ┌──────────────────────────────────┐ │
│ │ Lesson 2                         │ │
│ │ Ode to Joy (Fraunces 24px)       │ │
│ │ Step 3 of 5 · At your pace       │ │
│ │ ▓▓▓▓▓▓▓▓░░░░░░  2 of 5 steps done│ │
│ │ [        Continue        ]  48px │ │  brass primary button, full width
│ └──────────────────────────────────┘ │
│                                      │
│ Lessons                              │
│ ✓ 1  Finding Middle C        ★★☆  › │  row 56px; tap = first incomplete step
│ ●  2  Ode to Joy          2/5 steps › │
│ ○  3  Au Clair de la Lune          › │
│ ○  4  Left hand: Twinkle           › │
│   … (grouped: Melody · Chords · Both hands, only as sub-headings)  │
│                                      │
│ Songs to play freely                 │
│ Für Elise (opening)   Classical    › │
│ …                                    │
│                                      │
│ Quick drills (5 min)               › │
└──────────────────────────────────────┘
```

**Practice: playable step (the main screen)**

```
┌──────────────────────────────────────┐
│ ‹  Ode to Joy                [⚙]     │  header 56px. ‹ = back to Home, ⚙ = Settings
│ Step 3 of 5 · At your pace   ●●●○○   │  step dots are 44px tap targets (row 44px)
│ ▓▓▓▓▓▓▓░░░░░░░░░  7 of 16 notes      │  progress bar (always visible)
├──────────────────────────────────────┤
│  ┌ grand staff, auto-scrolled ─────┐ │  ~170px; follows currentMeasure
│  │ 𝄞 ♩ ♩ [♩] ♩ | ♩ ♩ 𝅗𝅥 |          │ │  (hidden when the viewport is under 560px tall)
│  └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│  E4                    right hand    │  PromptCard: note name in Fraunces 44px,
│  finger 3              press  E  ⌨   │  QWERTY hint only on pointer:fine devices
│  [ Show me ]   [ Skip this note ]    │  44px secondary buttons
├══════════════════════════════════════┤  3px crimson felt
│‹│▌C│D▌│E│F▌│G│A▌│B│C│▌D│E │ … │›│  │  KeyboardDock: white keys ≥44px wide,
│ │ ▐  ▐   ▐▐▐▐ (E4 glowing sky)   │  │  scrolls itself to the target; ‹ › = octave
│ │                                │  │  jump (44×44); keys ~150px tall
└──────────────────────────────────────┘  dock sticks to the bottom (safe-area inset)
```

- **Before the first note**, PromptCard reads *"Press the glowing key to start"* with a brass **Start** button. Pressing any key (on screen, QWERTY, MIDI or mic) also starts it (§4.3). Nothing moves until then.
- **Timed steps** ("Slow play-along", "Full speed") replace the two buttons with **[Pause] [Slower]**. Skipping single notes doesn't make sense when the music keeps moving. PromptCard shows the next note coming up and a 4-dot beat pulse instead of the instruction.
- **Paused:** PromptCard shows *"Paused"* with **[Resume]** and **[Start over]**.

**Practice: step finished (ResultsPanel replaces PromptCard; the keyboard stays)**

```
┌──────────────────────────────────────┐
│ ‹  Ode to Joy                [⚙]     │
│ Step 3 of 5 · At your pace   ●●✓○○   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 16 of 16 notes      │
├──────────────────────────────────────┤
│  Step done                           │  Fraunces 28px
│  14 of 16 right first time · ★★☆     │
│  Bar 3 needed help.  [Practise bar 3]│  only when the report has trouble bars
│                                      │
│  [ Next: Slow play-along (step 4) ]  │  brass primary, full width, 52px
│  [ Play again ]   [ What to work on ]│  secondary; the latter opens the sheet
├══════════════════════════════════════┤
│  keyboard dock (still playable)      │
└──────────────────────────────────────┘
```

**Practice: intro step (video_intro)**

```
┌──────────────────────────────────────┐
│ ‹  Finding Middle C          [⚙]     │
│ Step 1 of 5 · Watch first    ●○○○○   │
├──────────────────────────────────────┤
│  Watch how two black keys point to   │  step.instruction, max 3 lines
│  Middle C.                           │
│  [ ▶ Watch the intro (2 min) ]       │  opens IntroVideoSheet (full-screen on phone)
│  [ Next: Find the keys      ]        │  brass primary; marks step 1 done (nothing
│                                      │  to verify on a watch step)
├══════════════════════════════════════┤
│  keyboard dock (free play, no target)│
└──────────────────────────────────────┘
```

**Sheets (bottom sheet on phone, centred dialog ≥768px)**

```
How you play                         ✕     Settings                              ✕
( ) Tap the keys on screen                 Hands        [Right] [Left] [Both]
(•) Computer keyboard                      Speed        [60%] [75%] [100%]
     Q W E R T Y U = C D E F G A B          Metronome                       [on ]
(  ) MIDI keyboard  · none found [Retry]    Backing music                   [on ]
(  ) Microphone (real piano)  [Turn on]     Note names on the music         [on ]
     level ▁▂▅▂▁  heard: E4                 Falling notes                   [off]
     [Tune to my room (1s)]                 Hand guide picture              [off]
```

- "How you play" doesn't switch inputs exclusively. All inputs are always live. The radio choice only sets which hint PromptCard shows (QWERTY letter, "play on your piano", or nothing), and it's stored in the profile as `preferredInput`. Turning the mic on stays an explicit tap, because it needs permission.

### 2.4 Landscape phone (height ≤ 480px)

```
┌──────────────────────────────────────────────────────────────────┐
│ ‹ Ode to Joy · Step 3/5 · 7 of 16 notes ▓▓▓▓░░░░   E4 · RH 3 [Show me][Skip] [⚙] │ 48px single bar
├══════════════════════════════════════════════════════════════════┤
│ keyboard dock, full width, keys ~ 52px wide, ~ 55% of height     │
└──────────────────────────────────────────────────────────────────┘
```

The grand staff is hidden (the media query `(max-height: 560px)` sets `showStaff=false`). The note name in the bar takes its place. ResultsPanel shows as a sheet.

### 2.5 Tablet (≥768px) and desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ‹ Lessons   Ode to Joy                            [⌨ Computer keys ▾]  [⚙]   │
├──────────────┬───────────────────────────────────────────────────────────────┤
│ Steps        │ Step 3 of 5 · At your pace         ▓▓▓▓▓▓░░░░░  7 of 16 notes │
│ ✓ 1 Watch    │ ┌───────────────────────── grand staff (3–4 bars) ──────────┐ │
│ ✓ 2 Find keys│ │                                                           │ │
│ ● 3 At your  │ └───────────────────────────────────────────────────────────┘ │
│     pace     │  E4  right hand · finger 3 · press E        [Show me] [Skip]  │
│ ○ 4 Slow     │                                                               │
│ ○ 5 Full     │                                                               │
│   speed      │                                                               │
├══════════════╧═══════════════════════════════════════════════════════════════┤
│ keyboard dock: all 3 octaves fit (keys = width/21, ≥44px), no scroll         │
└──────────────────────────────────────────────────────────────────────────────┘
```

- The step rail (StepList, 220px) appears at ≥1024px. Below that the step dots in StepHeader do the same job.
- Content max width is 1200px. The keyboard dock spans the full width.

### 2.6 Visual system (Nocturne & Ivory, refined)

Kept: the ebony/spruce surfaces, the ivory text, the brass accent, the crimson felt strip, and the hand colours. Deliberate changes:

| Change | Why |
|---|---|
| **Two type families, not three.** Fraunces (lesson titles, the target note name, "Step done") + Plus Jakarta Sans (everything else, `font-variant-numeric: tabular-nums` for counters). Drop JetBrains Mono from `index.html`, `index.css` and `tailwind.config.js`. | A mono face on small labels is template chrome. One less web font helps on mobile. |
| **Colour roles narrowed:** brass = the one primary action per screen plus current-step marker; sky `#38BDF8` = right-hand target; indigo `#818CF8` = left-hand target; amber = "Show me"/hint; emerald `#10B981` = correct and done; coral `#F43F5E` = wrong key. "First-try blue" is retired from the UI and correct notes use emerald, so blue means only "right hand". | Each colour means one thing. |
| **Tokens in Tailwind.** Add `ink` (`primary #F5F2EB`, `secondary #B8B2A6`, `muted #7D8494`), `hand.right`, `hand.left`, `state.ok/hint/wrong` to `tailwind.config.js`. New components must not contain `#RRGGBB` literals. | The current code has hundreds of hex literals. |
| **Type scale** (1.25 ratio, 16px base): 13 / 16 / 20 / 25 / 31 / 44. Body text is 16px on phone, and nothing is smaller than 13px. Labels use sentence case and no all-caps. | Legible at arm's length on a music stand. |
| **Radius hierarchy:** 6px controls, 12px panels and sheets, 0 on keys (except bottom corners 4px). One soft shadow, used only on sheets. | Avoids the uniform-card look. |
| **Motion:** one orchestrated moment. When a step completes, the progress bar fills to emerald and the "Step done" headline fades in (200ms). Key press feedback is instant (no transition). Everything respects `prefers-reduced-motion`. Remove `animate-ping` pulses. | |
| **Touch:** every interactive element is at least 44×44px. Keys use `touch-action: none` and are at least 44px wide. Visible `focus-visible` ring: 2px brass, 2px offset. | |

### 2.7 Plain-language label table (use these exact strings)

| Old | New |
|---|---|
| Practice / Lessons / Videos / Workouts tabs | Home · (lesson title in header) · Quick drills |
| 1. Video | Watch first |
| Key Discovery / 2. Keys / Landmark | Find the keys |
| Wait Mode / 3. Wait | At your pace |
| Slow Flow / 4. Flow | Slow play-along |
| Stage Performance / 5. Perform | Full speed |
| Listen (auto_demo) | Hear it |
| Remediation drill | Practise bar N |
| Fix Me / Fix Play / Coach Diagnostic | What to work on |
| Key Map / Hide Diagram | (removed; keyboard always shown) |
| Start Listening / Enable Mic for Real Piano | Turn on microphone |
| Studio Options | Settings |
| RH / LH / Both | Right / Left / Both hands |
| Tempo Speed | Speed |
| Backing Accompaniment | Backing music |
| Finger Arch Guide | Hand guide picture |
| Falling Notes Cascade | Falling notes |
| Hear Reference Note (C4) | Show me (plays and lights the key) |
| Continue to Next Step → | Next: {step label} |
| Complete Unit & Next Lesson → | Next lesson: {title} |
| 🎉 … Complete! | Step done |
| Restart Piece | Start over |
| Replay | Play again |

The labels live in `src/components/copy.ts` (§3). Don't use emoji in UI copy, and don't add `→` to buttons.

---

## 3. Component inventory

### 3.1 New files

| File | Responsibility | Props / API |
|---|---|---|
| `src/hooks/useProfile.ts` | Load and save `PersistedUserProfile`. Pure updaters for the profile. | `() => { profile, markStepDone(lessonId, stepNumber, report?), markStepSkipped(lessonId, stepNumber), markVideoWatched(id), recordWorkout(id, xp), setMicCalibration(cfg), setPreferredInput(p) }` |
| `src/hooks/usePracticeSession.ts` | Owns the single `PracticeEngine` (ref), the rAF `tick` loop, the snapshot subscription, `onSessionComplete`, and pushing `setExpectedTargetMidis`. Uses refs for the latest callbacks so engine callbacks are bound once. | `(opts: { onComplete(attempts, snap): void }) => { engine, snapshot }` |
| `src/hooks/useNoteInputs.ts` | Subscribes to InputManager (note events, mic telemetry, MIDI devices). Forwards notes to the engine, applying the auto-start rule (§4.3). Exposes the virtual key handlers. | `(engine, snapshotRef) => { micTelemetry, midiDevices, heldMidis, lastNote, pressKey(midi), releaseKey(midi), toggleMic() }` |
| `src/hooks/useLessonFlow.ts` | Current lesson/song/step, derived from a `Selection` (§3.1a; App state in Task 1, the hash route from Task 4). Calls `loadScore`/`startPractice` on change with `AutoStart: false`. Implements `start`, `next`, `skipStep`, `restart`, `practiseBar`. | `(engine, selection: Selection, profile) => { lesson, song, step, stepIndex, score, start(), next(), skipStep(), restart(), practiseBar(m), hearIt() }` |
| `src/hooks/useHashRoute.ts` | Parses and writes `#/…` routes. | `() => [route: Route, navigate(route)]`, `type Route = {name:'home'} \| {name:'lesson', lessonId, stepNumber} \| {name:'song', songId} \| {name:'drills'}` |
| `src/hooks/useMediaQuery.ts` | `matchMedia` hook. | `(query: string) => boolean` |
| `src/utils/progress.ts` (+ `__tests__/progress.test.ts`) | Pure functions: `stepProgress(snapshot, step)`, `firstIncompleteStepIndex(lesson, record)`, `lessonProgress(lesson, record)`, `stepLabel(step)`. | see §4.2 |
| `src/components/copy.ts` | Label table from §2.7. | `STEP_LABEL: Record<LessonStepType, string>`, `MODE_LABEL`, `HAND_LABEL`, etc. |
| `src/components/shell/AppHeader.tsx` | 56px header: back button or brand, title, an optional `InputStatusChip`, an optional settings button. Sticky, with safe-area padding. | `{ title?: string; onBack?: () => void; right?: ReactNode }` |
| `src/components/shell/Sheet.tsx` | A single overlay primitive: a bottom sheet under 768px and a dialog at 768px and up. Focus trap, Esc/✕/backdrop to close, `aria-modal`, body scroll lock. | `{ open; title; onClose; children; size?: 'auto' \| 'full' }` |
| `src/components/shell/InputStatusChip.tsx` | Shows how the app hears you: "Tap keys", "Computer keys", "MIDI: {name}", "Mic: hearing E4". Tapping opens InputSheet. | `{ preferredInput; midiDevices; micTelemetry; onOpen }` |
| `src/components/home/HomeScreen.tsx` | ContinueCard + LessonList + SongList + "Quick drills" row. | `{ lessons; songs; progress: Record<string, LessonProgressRecord>; onOpenLesson(id, stepNumber); onOpenSong(id); onOpenDrills() }` |
| `src/components/home/ContinueCard.tsx` | Resume card (it's the hero). | `{ lesson; stepIndex; doneCount; onContinue }` |
| `src/components/home/LessonList.tsx` | Rows grouped by track with ✓/●/○ state, "n of 5 steps", and stars. | `{ lessons; progress; activeLessonId; onOpen(id) }` |
| `src/components/practice/PracticeScreen.tsx` | Lays out the player for portrait, landscape and desktop (§2.3–2.5). No engine calls: it only receives handlers. | `{ title; steps?: LessonStep[]; stepIndex?; completedSteps: number[]; snapshot; score; step?; progress: StepProgress; report; heldMidis; preferredInput; on: PracticeHandlers }` |
| `src/components/practice/StepHeader.tsx` | "Step 3 of 5 · At your pace", step dots (tappable, 44px), ProgressMeter. In song mode: "Song · {mode}" with a 3-way mode switch (At your pace / Slow play-along / Hear it). | `{ steps; stepIndex; completedSteps; progress; onSelectStep }` |
| `src/components/practice/ProgressMeter.tsx` | Bar plus "7 of 16 notes" (or "2 of 3 keys"). `role="progressbar"` with aria values. | `{ done; total; unit: 'notes' \| 'keys' }` |
| `src/components/practice/StepList.tsx` | Desktop rail version of the steps. | `{ steps; stepIndex; completedSteps; onSelectStep }` |
| `src/components/practice/PromptCard.tsx` | What to play next: note name(s), hand, finger, QWERTY letter, and the state-dependent actions (Start / Show me / Skip this note / Pause / Slower / Resume / Start over). It also shows the live correction line ("That was F4. Go one key left") from `snapshot.liveCorrection.headline`. | `{ phase: 'ready' \| 'playing' \| 'paused'; timed: boolean; targets: TargetNote[]; discoveryPrompt?; correction; qwertyHint: boolean; on }` |
| `src/components/practice/StaffPanel.tsx` | Wraps `GrandStaffView` in an `overflow-x:auto` container and keeps `currentMeasure` in view (scrollLeft = `STAFF_LEFT_HEADER_WIDTH + m*MEASURE_WIDTH - 24`, smooth, only when it's out of view). Tapping a bar calls `onPracticeBar`. Shows FallingNotesCanvas below it when that setting is on. | `{ score; snapshot; troubleMeasures; showFalling; onPracticeBar(m) }` |
| `src/components/practice/KeyboardDock.tsx` | Phone-usable keyboard (§4.5). Sticky bottom, ‹ › octave buttons, auto-centre on targets, QWERTY labels on fine pointers. | `{ snapshot; targets: TargetNote[]; heldMidis; showQwertyLabels; range?: [min,max]; onKeyDown(midi); onKeyUp(midi) }` |
| `src/components/practice/ResultsPanel.tsx` | "Step done", score line, trouble-bar shortcut, Next / Play again / What to work on. | `{ isDiscovery; report; nextLabel; onNext; onReplay; onPractiseBar(m); onOpenTips }` |
| `src/components/practice/IntroStep.tsx` | Step 1 body: instruction, "Watch the intro" and "Next". | `{ step; video; onWatch; onNext }` |
| `src/components/practice/IntroVideoSheet.tsx` | `Sheet size="full"` containing the existing `InteractiveVideoPlayer`. | `{ open; video; heldMidis; onClose; onWatched; onPlayNote; onPlayChord; onKeyDown; onKeyUp }` |
| `src/components/practice/SettingsSheet.tsx` | Hands, speed, metronome, backing, note names, falling notes, hand guide. | `{ open; snapshot; showFalling; onClose; on: SettingsHandlers }` |
| `src/components/practice/WorkTipsSheet.tsx` | "What to work on": top 3 `detectedIssues` (title + actionableFixTip), a bar-health strip from `measureHealth`, the "Practise bar N" (remediation) button, and links to the recommended videos (opening IntroVideoSheet). It replaces FixMeModal and never opens by itself. | `{ open; report; videos; onClose; onPractise(plan); onWatch(videoId) }` |
| `src/components/input/InputSheet.tsx` | "How you play" (§2.3). It ports the mic level, "Tune to my room" (`calibrateMicrophone`) and sensitivity sliders out of InputSetupModal into a collapsible "Microphone fine-tuning" section. | `{ open; preferredInput; micTelemetry; micConfig; midiDevices; midiSupported; onClose; onChoose(p); onToggleMic; onCalibrate; onUpdateMicConfig; onRetryMidi; onTestNote }` |

### 3.1a Shared types (define in `src/components/practice/types.ts`)

```ts
export type TargetNote = TargetKeyAnnotation; // re-use from InteractiveKeyboard.tsx: { midi; hand?; finger?; noteName? }
export type Selection =
  | { kind: 'lesson'; lessonId: string; stepIndex: number }
  | { kind: 'song'; songId: string };
export interface PracticeHandlers {
  start(): void; pause(): void; resume(): void; restart(): void;
  showMe(): void; skipNote(): void; slower(): void;
  next(): void; skipStep(): void;
  practiseBar(measureIndex: number): void; clearLoop(): void;
  selectStep(stepIndex: number): void;
  changeMode(mode: 'wait_mode' | 'slow_practice' | 'auto_demo'): void; // song mode only
  keyDown(midi: number): void; keyUp(midi: number): void;
  openSettings(): void; openTips(): void; openInput(): void; openIntroVideo(): void;
}
export interface SettingsHandlers {
  setHand(h: Hand): void; setSpeed(mult: number): void;
  toggleMetronome(): void; toggleBacking(): void; toggleNoteNames(): void;
  toggleFalling(): void; toggleHandGuide(): void; skipStep(): void;
}
```

### 3.2 Kept (changes listed)

| File | Change |
|---|---|
| `src/App.tsx` | Rewritten as the composition root, under 200 lines: hooks + route switch + sheets. |
| `components/visualizers/InteractiveKeyboard.tsx` | Add optional `whiteKeyWidthPx?: number` (when set, it renders at a fixed width = `TOTAL_WHITE_KEYS * px` instead of `w-full`) and `heightClass?: string`. Add `touch-action: none` on keys. All new props are optional, so WorkoutsView and InteractiveVideoPlayer keep working. Fix the aria-label copy. |
| `utils/keyboardLayout.ts` | Add `export function keyCenterPx(midi, whiteKeyPx): number` (built on the existing geometry). No range change: the dock scrolls, it doesn't re-slice. |
| `components/visualizers/GrandStaffView.tsx` | Export `MEASURE_WIDTH` and `STAFF_LEFT_HEADER_WIDTH`. Remove `onFixMeasure` if unused after Task 3. No other change. |
| `components/visualizers/FallingNotesCanvas.tsx` | Unchanged. Off by default (Settings). |
| `components/visualizers/OverheadHandGuide.tsx` | Unchanged. Off by default (Settings). It's used by InteractiveVideoPlayer. |
| `components/video/InteractiveVideoPlayer.tsx` | Kept, shown only inside IntroVideoSheet. Acceptance: no horizontal overflow at 360px (wrap or stack its internal rows if needed). |
| `components/views/WorkoutsView.tsx` | Kept as "Quick drills" behind `#/drills`, with an AppHeader back button. Mobile pass: no horizontal overflow at 360px, and 44px buttons. |

### 3.3 Deleted (with every import site)

| File | Imported by | Replaced by |
|---|---|---|
| `components/views/PracticeStudioView.tsx` | App.tsx | PracticeScreen + children |
| `components/coaching/LiveCoachBanner.tsx` | PracticeStudioView | PromptCard (correction line, input hint) |
| `components/coaching/FixMeModal.tsx` | App.tsx | ResultsPanel + WorkTipsSheet |
| `components/coaching/StepGuideStepper.tsx` | none | StepHeader / StepList |
| `components/layout/TransportControlBar.tsx` | none | PromptCard actions |
| `components/layout/TopNavigation.tsx` | App.tsx | AppHeader + InputStatusChip |
| `components/views/CurriculumMapView.tsx` | App.tsx | HomeScreen |
| `components/views/VideoAcademyView.tsx` | App.tsx | IntroVideoSheet (videos reached from lesson step 1 and from WorkTipsSheet) |
| `components/video/VideoCoachDrawer.tsx` | App.tsx | IntroVideoSheet |
| `components/views/InputSetupModal.tsx` | App.tsx | InputSheet |

`src/data/videoLibraryData.ts` stays (it feeds IntroVideoSheet and WorkTipsSheet).

---

## 4. State and data flow

### 4.1 Where state lives

```
App.tsx (composition root)
 ├─ useHashRoute()            → route                     (URL hash)
 ├─ useProfile()              → profile + updaters        (localStorage)
 ├─ usePracticeSession(...)   → engine, snapshot          (PracticeEngine instance in a ref)
 ├─ useNoteInputs(engine)     → mic/midi/held/pressKey    (sharedInputManager singletons)
 ├─ useLessonFlow(engine, selectionFromRoute, profile) → lesson/step/score + actions
 ├─ local UI state: which sheet is open, diagnosisReport, showFalling
 └─ renders: HomeScreen | PracticeScreen | WorkoutsView  + Sheets
```

- **Engine state** (tempo, hand filter, metronome, note names, overhead hands, loop) stays in `PracticeEngine` and is read from `snapshot`. No UI copy of it.
- **UI-only settings** (`showFalling`, `preferredInput`) live in the profile so they persist. Add `preferredInput?: 'touch' | 'qwerty' | 'midi' | 'mic'` and `skippedSteps?: Record<lessonId, number[]>` to `PersistedUserProfile` as **optional** fields. `loadUserProfile` spreads `DEFAULT_PROFILE` under the parsed object, so adding defaults there is enough.
- **Fake defaults removed (optional, Task 4):** `DEFAULT_PROFILE.xp = 0`, `streakDays = 0`. Keep the seeded `lessonProgress` entry (lesson 1, step 1 done) so a new user starts at "Find the keys". XP and streak are no longer displayed but are still computed and stored.
- **No global store library.** Hooks + props, with prop depth at most 2 (App → PracticeScreen → leaf).

### 4.2 Progress: exact formulas (`utils/progress.ts`)

```ts
const DONE = new Set(['correct_first_try', 'correct_after_hint', 'missed']);
export interface StepProgress { done: number; total: number; unit: 'notes' | 'keys' }

export function stepProgress(snap: PracticeSessionSnapshot, step?: LessonStep): StepProgress {
  if (snap.mode === 'key_discovery') {
    const total = step?.discoveryPrompts?.length ?? 0;
    return { done: snap.isCompleted ? total : snap.discoveryCompletedCount, total, unit: 'keys' };
  }
  const statuses = Object.values(snap.noteStatuses); // already filtered by hand + loop
  return { done: statuses.filter(s => DONE.has(s)).length, total: statuses.length, unit: 'notes' };
}
```

- `total` comes from `noteStatuses`, which the engine builds only for notes inside the active hand filter and loop range. That makes the count true for the step being played.
- **Chords:** each note counts separately ("12 of 24 notes"). That's honest and simple.
- `firstIncompleteStepIndex(lesson, record)` = the index of the first step whose `stepNumber` isn't in `completedStepNumbers`, or the last step if all are done.
- Lesson progress on Home = `completedStepNumbers.length / steps.length`. Skipped steps are *not* counted.

### 4.3 Rules that fix "stuck" and "untruthful" (UI layer only)

1. **Step entry never auto-starts.** `useLessonFlow` calls `engine.loadScore(score, { mode, lessonStep })`. `loadScore` already forces `AutoStart: false`. On a step change within the same score it calls `engine.startPractice(mode, { lessonStep: step, AutoStart: false })`. The phase is `ready`.
2. **Start = audio unlock + resume.** `start()` → `await sharedAudioEngine.init()` → `engine.resume()`. It runs from a user gesture, which iOS needs.
3. **Any key starts an untimed step.** In `useNoteInputs`, for a `note_on`: if the snapshot is `!isPlaying || isPaused`, `!isCompleted`, and the mode is `key_discovery` or `wait_mode` (or `remediation_drill` whose current stage, `remediationPlan.stages[snapshot.remediationStageIndex].mode`, is `wait_mode`), then call `sharedAudioEngine.init()`, then `engine.resume()`, and *then* `engine.handleNoteInput(event)`. This works around P3 without touching the engine. Timed modes (`slow_practice`, `performance`) need the explicit Start, so the music doesn't take off on a stray key.
4. **Show me** = for each `snapshot.activeTargetMidis`, `sharedAudioEngine.playNote(midi, 0.8, 0.8)`. The dock scrolls to the key and PromptCard pulses the note name in amber for 1.2s (a UI flag `showMeUntil`). It doesn't count as a press.
5. **Skip this note** (untimed modes only) = for each target midi, `sharedInputManager.triggerVirtualNoteOn(midi)`, then `triggerVirtualNoteOff(midi)` after 120ms. The engine records it as a correct press (`correct_first_try` if pressed within 2.2s, otherwise `correct_after_hint`), so it counts as done and the stars will be slightly generous. This is accepted: never being stuck matters more. It needs no engine change.
6. **Slower** (timed modes) = `engine.setTempoMultiplier(max(0.4, current - 0.15))`.
7. **Next vs Skip step:**
   - **Timed modes played silently don't count.** In `slow_practice`/`performance` the clock can reach the end with nothing played. `onSessionComplete` marks the step done only if `attempts.some(a => a.status !== 'missed')`. Otherwise ResultsPanel reads "Nothing was played. Try again" with **Play again** as the primary button and **Skip step** as a secondary one, and no Next.
   - The ResultsPanel **Next** shows only when `snapshot.isCompleted` (and the step was marked done). `onSessionComplete` has already called `markStepDone(lesson, step.stepNumber, report)` using the *current* step (fixing the hard-coded "2"), so Next only navigates to the next step, or to the next lesson's first incomplete step, or back Home after the last lesson.
   - **Skip step** lives in the Settings sheet footer (a quiet text button), not in the main flow. It calls `markStepSkipped` and navigates. It awards no XP and adds no ✓.
   - The intro step's **Next** marks step 1 done (there's nothing to verify on a watch step).
8. **No auto-opening modals.** Session complete always shows ResultsPanel inline. WorkTipsSheet opens only from its button.
9. **Practise bar N** = `engine.startRemediationPlan(report.remediationPlan)` if the report has a plan whose range covers bar N. Otherwise it's `engine.startPractice('wait_mode', { loopRange: [m, m], AutoStart: false })` and the phase goes to `ready`. A small "Practising bar N · [Back to full piece]" line appears in StepHeader while `snapshot.loopRange` is set.
10. **Song mode:** the mode switch calls `engine.startPractice(mode, { tempoMultiplier, handFilter, loopRange: null, AutoStart: false })`. Song completion shows ResultsPanel with "Play again" and "Back to Home" (it doesn't touch lesson progress). In **Hear it** (`auto_demo`) input is ignored, so ProgressMeter shows "Listening…" with no counts, and the end panel offers "Play it yourself" (switches to At your pace).

### 4.4 Engine contract (the only calls the UI may make)

`PracticeEngine`: `new PracticeEngine(score, sharedAudioEngine)`, `setCallbacks({ onSessionComplete })`, `subscribe`, `getSnapshot`, `getScore`, `getAttemptRecords`, `loadScore`, `startPractice`, `startRemediationPlan`, `resume`, `pause`, `tick`, `handleNoteInput`, `setTempoMultiplier`, `setHandFilter`, `setLoopRange`, `setMetronomeEnabled`, `setAccompanimentEnabled`, `setShowNoteNames`, `setShowFingerNumbers`, `setShowOverheadHands`.

`sharedInputManager`: `startDefaultInputs`, `onNoteEvent`, `onMicTelemetry`, `onMidiDevicesChanged`, `triggerVirtualNoteOn/Off`, `enableMicrophone`, `disableMicrophone`, `isMicrophoneActive`, `calibrateMicrophone`, `updateMicCalibration`, `getMicCalibration`, `getMicTelemetry`, `setExpectedTargetMidis`, `initMidi`, `isMidiSupported`, `getMidiDevices`.

`sharedAudioEngine`: `init`, `playNote`, `playChord`.

`CoachDiagnosisEngine`: `analyzeSession`. (`createSyntheticMistakeDemo` is no longer used, because the fake "simulate a mistake" demo is removed.)

If the PracticeEngine agent renames or changes any of these, only `usePracticeSession`, `useLessonFlow` and `useNoteInputs` need updating.

### 4.5 KeyboardDock mechanics

- Container: `position: sticky; bottom: 0`, `padding-bottom: env(safe-area-inset-bottom)`, a 3px felt strip on top, and `overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: none`.
- `whiteKeyPx = max(44, floor(containerWidth / 21))`, measured with a `ResizeObserver`. Pass it to `InteractiveKeyboard whiteKeyWidthPx`. On desktop all 21 keys fit and nothing scrolls.
- **Auto-centre:** when `targets` change (or "Show me"), compute the midpoint of the target keys with `keyCenterPx`. If it's outside the middle 60% of the visible area, `scrollTo({ left: mid - width/2, behavior: reduced ? 'auto' : 'smooth' })`. **Initial position:** centre on the first target, or on C4 (midi 60) when there's none.
- **Manual navigation:** swiping on keys plays notes (`touch-action: none`), so the dock has ‹ and › buttons (44×44, overlaid on the edges with an ebony gradient). Each one scrolls by 7 white keys. There's also a 6px scroll-position strip above the keys, which shows where you are within C3–B5.
- Key height: 150px portrait phone, 55% of the viewport height in landscape (`max-height: 480px`), 180px at 1024px and up.
- QWERTY letter labels: shown when `useMediaQuery('(hover: hover) and (pointer: fine)')` is true, or when `preferredInput === 'qwerty'`.

---

## 5. Implementation plan

Rules for every task:
- After each task, `npm run build` and `npm test` pass, and `npm run dev` loads with no console errors.
- No change inside `src/engines/*`.
- Delete a file only after its last import is gone.
- `noUnusedLocals` is off in tsconfig, so `tsc` won't catch leftovers. Each task must also leave **no unused props or imports** in files it touched (check with `grep`).
- Viewports to check in DevTools: 360×740, 430×932, 740×360 (landscape), 820×1180, 1440×900.

### Task 1: Extract hooks and progress utilities (no visual change)

Create `src/hooks/{useProfile,usePracticeSession,useNoteInputs,useLessonFlow,useMediaQuery}.ts`, `src/utils/progress.ts`, `src/utils/__tests__/progress.test.ts` and `src/components/copy.ts`. Move the logic out of `App.tsx` into the hooks. `App.tsx` keeps rendering today's views with the same props. `useLessonFlow` takes a `Selection` built from App's existing `activeLessonId`/`activeStepIndex`/`activeSongId` state. Keep today's behaviour exactly, including `AutoStart: true` and the step-3 default: the §4.3 rules arrive in Task 3.

Acceptance:
- `App.tsx` ≤ 350 lines and contains no `setProfile((prev) => …)` progress-merging code. That lives in `useProfile`.
- `usePracticeSession` binds `setCallbacks` once and reads the current lesson/step from refs. The key-discovery completion marks the **current** step's `stepNumber`, not a literal `2`.
- `progress.test.ts` covers: key_discovery mid-way and completed; wait_mode with mixed statuses; an empty `noteStatuses` (total 0); and `firstIncompleteStepIndex` with none, some and all steps done.
- The app behaves as before in a manual smoke test: choose a lesson, play notes with QWERTY, and steps advance.

### Task 2: KeyboardDock (phone-usable keyboard)

Add `whiteKeyWidthPx`/`heightClass` props and `touch-action: none` to `InteractiveKeyboard`. Add `keyCenterPx` to `keyboardLayout.ts`. Build `components/practice/KeyboardDock.tsx` per §4.5. In the current `PracticeStudioView`, replace the hidden-by-default keyboard block with `<KeyboardDock>`, always rendered on playable steps, and remove the `hideUiKeyboard` state and the "Key Map" button.

Acceptance:
- At 360px wide the page has no horizontal scroll (`document.documentElement.scrollWidth === innerWidth`). White keys are ≥ 44px wide and the dock scrolls internally.
- When the target note changes, the target key is fully visible within 400ms, without manual scrolling, in lessons 1 (C4–E4), 4 (left-hand bass) and 7 (both hands).
- The ‹ › buttons move by one octave, are 44×44px, and are disabled at the ends.
- On desktop (1440px) all keys fit with no scrollbar and QWERTY letters show. In DevTools touch emulation the letters are hidden.
- Tapping a key with touch emulation plays the note and counts in wait mode. WorkoutsView and InteractiveVideoPlayer keyboards still render as before.

### Task 3: The new PracticeScreen

Build `Sheet`, `PracticeScreen`, `StepHeader`, `ProgressMeter`, `StepList`, `PromptCard`, `StaffPanel`, `ResultsPanel`, `IntroStep`, `IntroVideoSheet` and `SettingsSheet`, plus a temporary bridge so `WorkTipsSheet` can come in Task 5. ResultsPanel's "What to work on" may open the old FixMeModal until then. Wire them through `useLessonFlow` and implement every rule in §4.3. Replace `PracticeStudioView` in App. Delete `PracticeStudioView.tsx`, `LiveCoachBanner.tsx`, `StepGuideStepper.tsx` and `TransportControlBar.tsx`.

Acceptance:
- **No-hardware path:** with mic off, no MIDI and only on-screen taps at 390×844, a new user can finish lesson 1, steps 2→5, using only on-screen buttons and keys, never seeing a stuck state. Every screen shows either a lit target key or a primary button.
- Letting Slow play-along run to the end without playing shows "Nothing was played. Try again" and doesn't mark the step done.
- Choosing a lesson opens its first incomplete step (lesson 1 with the default profile = "Find the keys"), not step 3.
- Before Start, nothing moves (`snapshot.isPlaying === false`). Pressing the lit key in Find the keys or At your pace starts the step and counts the note.
- The progress text matches §4.2 at every moment. It reaches "16 of 16 notes" exactly when ResultsPanel appears.
- "Show me" plays the target and scrolls the dock. "Skip this note" moves the target to the next note within 300ms. Neither appears in Slow play-along or Full speed, which show Pause and Slower instead.
- "Next" shows only after `isCompleted`. Skipping a step from Settings doesn't add a ✓ to that step.
- No modal opens without a tap.
- The vertical stack at 360×740 shows header, step header, staff, PromptCard and dock with no page scroll needed to reach the dock. At 740×360 the staff is hidden and the single-bar layout from §2.4 is used. The old TopNavigation still sits above it until Task 4, which is expected.
- Every label comes from `copy.ts`. Grepping the new components finds none of: Wait, Flow, Fix Play, Ivory, Key Map, Landmark, Stage Performance.

### Task 4: Home, routing and shell

Build `useHashRoute`, `AppHeader`, `InputStatusChip` (it may open the old InputSetupModal until Task 5), `HomeScreen`, `ContinueCard` and `LessonList`. Route `#/`, `#/lesson/:id/:step`, `#/song/:id` and `#/drills`. Put WorkoutsView behind `#/drills` with an AppHeader back button. Delete `TopNavigation.tsx`, `CurriculumMapView.tsx`, `VideoAcademyView.tsx` and `VideoCoachDrawer.tsx`, and remove the `activeTab` state. Optionally zero the fake XP/streak defaults (§4.1).

Acceptance:
- On a fresh profile (localStorage cleared), the first screen is Home with "Continue" pointing at Lesson 1 · Find the keys.
- The browser Back button from a lesson returns to Home. Reloading `#/lesson/lesson-02-ode-to-joy/3` opens that step directly, including on the deployed `/piano/` base path (`npm run build && npm run preview`).
- Lesson rows show ✓/●/○ and "n of 5 steps", matching `completedStepNumbers`.
- Songs open in song mode with the At your pace / Slow play-along / Hear it switch. Quick drills opens WorkoutsView, which has no horizontal overflow at 360px.
- No "Videos" or "Workouts" tabs anywhere.

### Task 5: InputSheet and WorkTipsSheet

Build `InputSheet` (porting the mic calibration UI) and `WorkTipsSheet`. Add `preferredInput` to the profile and have PromptCard use it for the hint. Delete `InputSetupModal.tsx` and `FixMeModal.tsx`, and remove `createSyntheticMistakeDemo` usage.

Acceptance:
- The header chip always reflects reality: "MIDI: {name}" when a device is connected, "Mic: hearing E4" while the mic is detecting, otherwise the preferred input.
- Turning the mic on from the sheet shows the permission prompt. If permission is denied, the sheet shows "Microphone blocked. Allow it in your browser's site settings." and the on-screen keyboard keeps working.
- "Tune to my room" runs `calibrateMicrophone(900)` and shows the new noise floor. Slider changes persist across a reload.
- When `preferredInput === 'qwerty'`, PromptCard shows "press E" for E4 (using `MIDI_TO_QWERTY_LABEL`).
- WorkTipsSheet shows at most 3 issues, one "Practise bar N" button (§4.3 rule 9), and video links that open IntroVideoSheet. With no report it shows "Play this step once to get tips." It never opens by itself.

### Task 6: Visual system, accessibility and responsive polish

Apply §2.6. Add Tailwind tokens. Replace hex literals in all new/kept UI components, keeping visualizers' canvas/SVG colours where they're computed. Drop JetBrains Mono. Add focus rings, reduced motion, the desktop StepList rail at ≥1024px, safe-area insets, and the "Step done" moment. Update `docs/specs/piano-pedagogy-and-ux-design.md` §1.4 with a one-line pointer to this document.

Acceptance:
- `grep -rE "#[0-9A-Fa-f]{6}" src/components/{shell,home,practice,input}` returns nothing.
- `grep -r "JetBrains\|font-mono\|font-tabular" src index.html` returns nothing.
- Lighthouse (mobile) accessibility ≥ 95 on Home and the lesson player. All interactive elements are ≥ 44×44px (DevTools "tap targets" audit clean).
- All five viewports show no horizontal page scroll, nothing clipped, and the dock reachable without scrolling during a step.
- Tab order on desktop: header → step header → PromptCard actions → keys. Esc closes any sheet and returns focus to its trigger.
- With `prefers-reduced-motion: reduce`, there's no smooth scroll and no fades.
