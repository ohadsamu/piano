# Piano Pedagogy, Curriculum & Studio UI/UX Specification
**Theme Identity:** *Nocturne & Ivory — The Concert Conservatory Studio*  
**Version:** 1.0.0  
**Scope:** Aesthetic & Visual Design System, 4 Core View Wireframes, 5-Step Pedagogical Engine, "Identify My Play & Fix Me" Corrective Coach Taxonomy, 8 Complete Beginner Lessons (Soloist & Chords Paths), 8 Contextual Video Tutorials (Hybrid Interactive Canvas + YouTube), and 5-Minute Daily Workouts.

---

## 1. Aesthetic & Visual Identity: *"Nocturne & Ivory — The Concert Conservatory Studio"*

### 1.1 Grounding in Physical Subject Matter & Anti-Cliché Review
Most educational music apps fall into one of two traps: either a loud, cartoon-candy mobile game aesthetic that alienates adult and teen learners after 10 minutes, or a generic dark-mode SaaS dashboard chopped into identical rounded cards with meaningless uppercase eyebrows.

Our visual identity is grounded directly in the physical materials of a **Steinway Model D / Yamaha CFX concert grand piano inside a late-evening conservatory practice studio**:
- **Polished Ebony Fallboard & Cabinet (`#0D0F14`)**: The deep, low-glare lacquered wood surrounding the keybed, letting illuminated notes, sheet music, and finger guides command 100% of visual attention.
- **Sitka Spruce Soundboard & Cast-Iron Plate (`#161922` / `#1E2230`)**: Warm, resonant structural panels with subtle grain and fine brass rules (`#E5A93C`) inspired by the cast-iron harp and brass pedals of a grand piano.
- **Scarlet Keybed Felt Strip (`#881337` → `#9F1239`)**: A signature 3px woven crimson felt line running directly above the top edge of the piano keys—an unmistakable tactile landmark from real acoustic grand pianos that visually separates the falling-notes cascade from the physical keybed.
- **Henle Urtext Ivory Parchment (`#FAF6EE`) & Conservatory Night Staff (`#131722`)**: Sheet music is rendered with genuine engraved music typography proportions—warm, glare-free ivory parchment in Classic Score View, or high-contrast luminous ivory staff lines (`#EAE3D2`) over deep ebony in Stage View.
- **Color as Pedagogical Information, Never Decoration**: Every vibrant color on screen encodes either **hand assignment** (Right Hand vs. Left Hand) or **real-time performance truth** (First-Try Hit, Hint-Assisted Hit, Mistake/Wrong Pitch, or Ghost Detected Input).

#### Design Self-Critique (Frontend Design Calibration)
1. **What we rejected**: We rejected generic SaaS metric cards, gradient-washed hero banners, `WORD — fragment` uppercase eyebrows, and floating unconnected widgets.
2. **Where we spend our boldness**: The **Interactive Stage + Grand Piano Keybed** is the unmistakable centerpiece. Even on the Curriculum Hub, an interactive live mini-keybed bar responds to the user's MIDI/Mic/QWERTY input immediately so the instrument feels alive from the first second.
3. **Structural devices encode sequence and pitch**: Measure numbers, step markers (`Step 1` to `Step 5`), and finger numbers (`1`–`5`) appear strictly because music and pedagogy are sequential and spatial.

---

### 1.2 Color Token System (CSS Custom Properties)

```css
:root {
  /* === Studio Architecture & Surfaces (Polished Ebony & Spruce) === */
  --bg-ebony-void: #090B0F;          /* Outer concert hall frame & keybed recess */
  --bg-ebony-lacquer: #0D0F14;       /* Primary application background */
  --bg-spruce-panel: #161922;        /* Elevated studio panels, HUD bar, drawers */
  --bg-iron-surface: #1E2230;        /* Interactive controls, measure loop pill, cards */
  --bg-glass-overlay: rgba(22, 25, 34, 0.86); /* Floating coach HUD & modals */

  /* === Physical Piano Materials === */
  --piano-felt-crimson: #9F1239;     /* 3px woven keybed felt strip above keys */
  --piano-ivory-top: #FBF9F5;        /* White key resting surface */
  --piano-ivory-front: #E6E0D4;      /* White key front lip (depth bevel) */
  --piano-ebony-key: #181A20;        /* Sharp/flat black key resting surface */
  --piano-ebony-highlight: #2C303C;  /* Black key top specular bevel */

  /* === Sheet Music Score Surfaces === */
  --score-parchment-bg: #FAF6EE;     /* Classic Urtext Ivory sheet music surface */
  --score-parchment-ink: #18181B;    /* Engraved noteheads & staff lines (light mode) */
  --score-stage-bg: #12151E;         /* Dark stage sheet music background */
  --score-stage-lines: rgba(234, 227, 210, 0.28); /* Luminous staff lines in dark mode */
  --score-stage-ink: #F5F0E6;        /* Default unplayed noteheads in dark mode */

  /* === Typography & Hierarchy === */
  --text-ivory-primary: #F5F2EB;     /* Primary headings & active lyrics/instructions */
  --text-warm-secondary: #B8B2A6;    /* Subtitle copy, teacher explanations */
  --text-muted-slate: #7D8494;       /* Measure numbers, inactive controls, secondary meta */

  /* === Hardware & Musical Accents === */
  --accent-brass: #E5A93C;           /* Metronome pulse, active step badge, star gold */
  --accent-brass-soft: rgba(229, 169, 60, 0.16);
  --border-hairline: rgba(245, 242, 235, 0.09);
  --border-brass-active: rgba(229, 169, 60, 0.55);

  /* === Real-Time Pedagogical Feedback Palette (Simply Piano + Flowkey Synthesis) === */
  --eval-first-try-blue: #38BDF8;    /* Played correctly on first try (no hint needed) */
  --eval-stage-emerald: #10B981;     /* Sustained accuracy / phrase mastery / pass */
  --eval-stage-emerald-bright: #22C55E; /* Perfect timing burst & completion check */
  --eval-hint-amber: #F59E0B;        /* Target key hint & played-after-hint state */
  --eval-error-coral: #F43F5E;       /* Wrong pitch or missed note in moving mode */
  --eval-detected-ghost: #64748B;    /* Live grey highlight showing actual pitch heard */

  /* === Hand Assignment & Path Identity === */
  --hand-right-sky: #38BDF8;         /* Right Hand (RH) notes, falling bars & finger badges */
  --hand-left-indigo: #818CF8;       /* Left Hand (LH) bass notes, falling bars & badges */
  --path-soloist-blue: #38BDF8;      /* Soloist Path (Melody & Sight-Reading) */
  --path-chords-rose: #EC4899;       /* Chords Path (Triads, Rhythm & Accompaniment) */
  --path-synthesis-gold: #E5A93C;    /* Combined Two-Hand Repertoire Mastery */
}
```

---

### 1.3 Typography System & Type Scale

We use a disciplined three-family typographic system where each typeface has a strict, non-overlapping job:

1. **Editorial Display Serif (`'Fraunces'`, fallback `'Playfair Display', Georgia, serif`)**
   - **Role**: Lesson titles, classical & pop repertoire headings, course milestones, and coach diagnostic headlines.
   - **Why**: Evokes printed conservatory editions (Henle, Peters, Schirmer) and gives musical pieces emotional gravity.
2. **Studio Interface Sans (`'Plus Jakarta Sans'`, fallback `'Inter', system-ui, sans-serif`)**
   - **Role**: Navigation, step instructions, teacher coaching explanations, video transcripts, and interactive buttons.
   - **Why**: High x-height and open apertures remain effortless to read at arms-length (60–80 cm away on a music stand or laptop behind a keyboard).
3. **Precision Technical Mono (`'JetBrains Mono'`, `font-variant-numeric: tabular-nums`)**
   - **Role**: BPM tempo readouts, measure/beat counters (`BAR 03 : BEAT 2`), live pitch detection readouts (`F4 · 349.2 Hz · +4¢`), timing offsets (`-18ms EARLY`), and finger number badges (`1` `2` `3` `4` `5`).
   - **Why**: Zero horizontal jitter during 60fps real-time audio/MIDI feedback updates.

| Token Name | Font Family | Size (rem / px) | Line Height | Weight / Features | Primary Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--type-repertoire-xl` | `Fraunces` | `2.25rem` (36px) | `1.15` | `600`, optical size auto | Curriculum Hero, Performance Completion Title |
| `--type-lesson-lg` | `Fraunces` | `1.5rem` (24px) | `1.22` | `600` | Lesson Stage Title, Coach Modal Headline |
| `--type-section-md` | `Fraunces` | `1.25rem` (20px) | `1.3` | `500` | Course Track Headers, Video Academy Titles |
| `--type-coach-prompt` | `Plus Jakarta Sans` | `1.0625rem` (17px) | `1.45` | `600` | Live Corrective Coach Banner (readable from piano bench) |
| `--type-body` | `Plus Jakarta Sans` | `0.9375rem` (15px) | `1.55` | `400` / `500` | Step instructions, teacher diagnostics, video chapters |
| `--type-ui-control` | `Plus Jakarta Sans` | `0.8125rem` (13px) | `1.2` | `600` | Mode toggles, hand filters, transport controls |
| `--type-hud-metric` | `JetBrains Mono` | `1.125rem` (18px) | `1.0` | `700`, `tabular-nums` | Live BPM, Measure/Beat counter, Detected Note (`C4`) |
| `--type-finger-badge` | `JetBrains Mono` | `0.75rem` (12px) | `1.0` | `700`, `tabular-nums` | Finger numbers (`1`–`5`) inside notes and piano keys |

---

### 1.4 Layout Architecture & 4 Core View ASCII Wireframes

The application is designed for **zero-scroll viewport lock (`100dvh`) during active playing** (View 2 & View 3) so the piano keys and staff never jump while the user is playing, and a clean **two-column studio layout** for curriculum browsing and video study (View 1 & View 4).

#### View 1: Learning Path & Curriculum Hub
Left-aligned editorial hierarchy with a persistent top **Instrument & Input Readiness Bar** (so users can test their Microphone, MIDI keyboard, or Virtual Piano at any moment) and a dual-track progressive map showing **Soloist Path** and **Chords Path** converging at Synthesis milestones.

```text
+------------------------------------------------------------------------------------------------------------------+
| [Nocturne & Ivory]   (o) Curriculum   ( ) Practice Stage   ( ) Video Academy   ( ) 5-Min Workouts                |
| INPUT: [(*) Live Mic: Listening -42dB] [MIDI: No Device] [QWERTY/Touch: Ready]  | Streak: 4d | Stars: 18/24 [*]  |
+------------------------------------------------------------------------------------------------------------------+
|                                                                                                                  |
|  CURRENT CONSERVATORY SESSION                                  |  RECOMMENDED FOR YOUR HANDS TODAY               |
|  ------------------------------------------------------------  |  ---------------------------------------------  |
|  Lesson 02 · Soloist Path                                      |  [!] Coach Insight from last session:           |
|  "The 5-Finger Right Hand Arch & Ode to Joy"                   |  You rushed Measure 3 (E4->D4->C4) by 95ms      |
|  Step 3 of 5 completed · Next: Slow Flow (72 BPM)              |  and substituted F4 for E4 twice.               |
|                                                                |                                                 |
|  [ ▶ Resume Lesson 02 (Step 4: Slow Flow) ]  [Fix Weak Bar 3]  |  +-------------------------------------------+  |
|                                                                |  | [▶ VIDEO] Curved Fingers & The 5-Key Arch |  |
|  ============================================================  |  | 2:15 · Prescribed for E4/F4 Neighbor Slip |  |
|  DUAL-TRACK PROGRESSIVE CURRICULUM MAP                         |  +-------------------------------------------+  |
|                                                                |                                                 |
|  SOLOIST PATH (Blue)                 CHORDS PATH (Rose)        |  5-MINUTE DAILY WORKOUTS                        |
|  Sight-Reading & Melody              Triads & Accompaniment    |  ---------------------------------------------  |
|                                                                |  [⚡] Note Flashcard Sprint    Best: 28/min [Go] |
|  [★ ★ ★] L1: Finding Middle C &      (Unlocks after L2)        |  [♪] Ear Pitch & Interval     Best: 92%    [Go] |
|          The 3-Note Walk (C-D-E)             |                 |  [❖] Chord Switcher (C<->G)   Best: 18/min [Go] |
|             |                                v                 |                                                 |
|  [★ ★ ☆] L2: 5-Finger Arch & ------> [★ ★ ★] L5: Chords I:     |  CONTEXTUAL VIDEO LIBRARY                       |
|          Ode to Joy (Current)                C & G Major Pop   |  ---------------------------------------------  |
|             |                                |                 |  • V1: The Natural Hand Arch (Ball Drop) [Play] |
|  [ 🔒 ]  L3: Rhythm & Half Notes     [★ ☆ ☆] L6: Chords II:    |  • V2: Finding Middle C Instantly        [Play] |
|          Au Clair de la Lune                 4-Chord Hit (C-G  |  • V4: Counting Quarter vs Half Notes    [Play] |
|             |                                -Am-F Anthem)     |  • V6: The 1-3-5 Triad Claw Shape        [Play] |
|  [ 🔒 ]  L4: Left Hand Bass &                |                 |                                                 |
|          Twinkle Twinkle                     |                 |                                                 |
|             +---------------+----------------+                 |                                                 |
|                             |                                  |                                                 |
|                  [ 🔒 ] L7: Both Hands Together                |                                                 |
|                         Minuet in G (Synthesis)                |                                                 |
|                             |                                  |                                                 |
|                  [ 🔒 ] L8: Expressive Mastery                 |                                                 |
|                         Fur Elise & Gymnopedie                 |                                                 |
+------------------------------------------------------------------------------------------------------------------+
| LIVE STUDIO KEYBED PREVIEW (Test your Mic, MIDI, or press A S D F G H J K on keyboard): [C4][D4][E4][F4][G4]...  |
+------------------------------------------------------------------------------------------------------------------+
```

---

#### View 2: Step-by-Step Interactive Lesson & Practice Stage
The core playing interface. Locked to `100dvh` with 4 vertical zones:
1. **Top Studio Transport & 5-Step Pedagogical Progress HUD**
2. **Live Corrective Coach Banner** (transforms dynamically between positive flow state and specific directional correction when a mistake occurs)
3. **Dual/Tri-Mode Visualizer Stage** (Split or toggleable between **Grand Staff Sheet Music**, **Falling Notes Cascade**, and **Overhead Hand Guide**)
4. **Scarlet Felt Strip + Interactive Multi-Octave Piano Keybed** (showing target keys, finger numbers, ghost hands, and live detected pitch).

```text
+------------------------------------------------------------------------------------------------------------------+
| [← Hub] L2: Ode to Joy  |  STEP: (1:Video)—(2:Keys)—([3:Wait Mode])—(4:Slow 70%)—(5:Stage)  |  [🛠 Fix Me (2)]   |
| [▶ Play] [⟲ Loop Bar 2-3] | Hand: [RH][LH][Both] | View: [Combined][Sheet][Cascade] | Tempo: [- 72 BPM +] (75%)  |
+------------------------------------------------------------------------------------------------------------------+
| LIVE COACH | [!] You played F4 (349 Hz) — 1 white key too high!                                                  |
| DIAGNOSTIC |     Move 1 white key LEFT to play E4 with Right Hand Finger 3 (Middle).         [▶ Watch Hand Fix]  |
+------------------------------------------------------------------------------------------------------------------+
| OVERHEAD HAND GUIDE (Synchronized)   | GRAND STAFF SHEET MUSIC (Horizontal Playhead & Measure Highlights)        |
|  +--------------------------------+  |   Treble (RH)    Bar 1                  Bar 2 (ACTIVE)       Bar 3        |
|  |     [Right Hand Arch Model]    |  |   ============|======================|===================[!]==============|
|  |        (2) (3*) (4)            |  |   ---G4-------|----------------------|------o-(5)--------|----------------|
|  |      (1)          (5)          |  |   ---E4-------|--●-(3)--●-(3)--o-(4)-|-------------------|--o-(3)---------|
|  |    [C4][D4][E4*][F4x][G4]      |  |   ---C4-(o)---|----------------------|-------------------|----------------|
|  |   Target: Finger 3 on E4       |  |   Lyrics/Fing:   E4(3)  E4(3)  F4(4)    G4(5)  G4(5)  F4*   E4(3)  D4(2)  |
|  +--------------------------------+  |    Color state:   [Blue] [Blue] [Blue]   [Blue] [Blue] [AMBER: WAIT E4]    |
+--------------------------------------+---------------------------------------------------------------------------+
| FALLING NOTES CASCADE (Synchronized directly above keybed columns; height = duration; color = RH Sky / LH Indigo)|
|                     |      |      |  +------+  |      |      |                                                   |
|                     |      |      |  | E4   |  |      |      |   <-- Incoming note bar with Finger Badge (3)     |
|                     |      |      |  | RH:3 |  |      |      |                                                   |
|                     |      |      |  +------+  |      |      |                                                   |
+=====================+======+======+============+======+======+===================================================+
| ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ SCARLET KEYBED FELT STRIP (#9F1239) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ |
|  |  |C#| |D#| |  | |F#| |G#| |A#| |  |  |C#| |D#| |  | |F#| |G#| |A#| |  |  |C#| |D#| |  | |F#| |G#| |A#| |  |   |
|  |  |3 | |3 | |  | |3 | |3 | |3 | |  |  |4 | |4 | |  | |4 | |4 | |4 | |  |  |5 | |5 | |  | |5 | |5 | |5 | |  |   |
|  |  +--+ +--+ |  | +--+ +--+ +--+ |  |  +--+ +--+ |  | +--+ +--+ +--+ |  |  +--+ +--+ |  | +--+ +--+ +--+ |  |   |
|  | C3 | D3 | E3 | F3 | G3 | A3 | B3 |●C4 | D4 |[E4*]|[F4x]| G4 | A4 | B4 | C5 | D5 | E5 | F5 | G5 | A5 | B5 |C6  |
|  |    |    |    |    |    |    |    |RH:1|RH:2|RH:3 |HEARD|RH:5|    |    |    |    |    |    |    |    |    |    |
|  |    |    |    |    |    |    |    | [A]| [S]| [D] | [F] | [G]| [H]| [J]| [K]| [L]| [;]| [']|    |    |    |    |
|  +----+----+----+----+----+----+----+----+----+-----+-----+----+----+----+----+----+----+----+----+----+----+----+
|                                                 ▲       ▲                                                        |
|                                      [Target: Amber] [Heard: Coral/Grey with "← 1 key left" arrow]               |
+------------------------------------------------------------------------------------------------------------------+
```

---

#### View 3: "Fix Me" Interactive Coach & Guided Remediation Drawer
Triggered either automatically after Step 5 (if accuracy < 90% or a recurring mistake pattern is detected) or at any time by clicking **`[🛠 Fix Me]`**. It never scolds or gives generic scores; it isolates the exact measure, shows **Played vs. Target**, explains the physical hand reason, links the matching video chapter, and runs a **3-Stage Micro-Drill** right in place.

```text
+------------------------------------------------------------------------------------------------------------------+
| 🛠 COACH DIAGNOSTIC & GUIDED REMEDIATION                                                       [✕ Return to Song] |
| "Let's smooth out Measure 2 → Measure 3 (The Step-Down from G4 to E4)"                                           |
+------------------------------------------------------------------------------------------------------------------+
|                                                                                                                  |
|  1. WHAT WE HEARD VS. TARGET                           |  2. WHY THIS HAPPENS & HOW TO FIX IT                    |
|  ----------------------------------------------------  |  -----------------------------------------------------  |
|  Measure 2, Beat 4 → Measure 3, Beat 1:                |  DIAGNOSIS: Adjacent Finger Slip + Early Rush (-95ms)   |
|                                                        |                                                         |
|  Expected:  G4 (Finger 5) ──► F4 (Finger 4) ──► E4 (3) |  "After playing G4 with your pinky (Finger 5), your     |
|  You Played: G4 (Finger 5) ──► F4 (Finger 4) ──► F4 [!] |   ring finger (4) stayed heavy and re-struck F4        |
|                                                        |   instead of transferring weight to your middle         |
|  Mini Keyboard Diff:                                   |   finger (3) on E4."                                    |
|  [ C4 ][ D4 ][ E4: TARGET (3) ] ◄── [ F4: PLAYED (4) ] |                                                         |
|                                                        |  PHYSICAL CUE: Imagine walking downhill from Pinky (5)  |
|  Timing Profile:                                       |  → Ring (4) → Middle (3). Lift Finger 4 cleanly as      |
|  Beat 1 [●]   Beat 2 [●]   Beat 3 [●]   Beat 4 [◄95ms] |  Finger 3 presses E4.                                   |
|                                                        |                                                         |
|  +--------------------------------------------------+  |  +---------------------------------------------------+  |
|  | 🎥 PRESCRIBED VIDEO LESSON                       |  |  | 3-STEP REMEDIATION DRILL (MEASURES 2–3 ONLY)      |  |
|  | "V3: Independent Ring & Pinky Control (5-4-3)"   |  |  |                                                   |  |
|  | Jump to 0:42 — Walking down G4–F4–E4 cleanly     |  |  | [●] Phase A: Wait Mode Isolate (2/2 clean reps)   |  |
|  | [ ▶ Watch 35s Clip & Try Interactive Check ]     |  |  | [◉] Phase B: Slow 60% Loop (1/3 clean reps)  <--  |  |
|  +--------------------------------------------------+  |  | [○] Phase C: Full Tempo Stitch (Bars 1–4 @ 100%)  |  |
|                                                        |  |                                                   |  |
|                                                        |  | [ ▶ Start Phase B Slow Loop Now ]  [Hear Teacher] |  |
|                                                        |  +---------------------------------------------------+  |
+------------------------------------------------------------------------------------------------------------------+
```

---

#### View 4: Video Academy & Technique Studio
Combines **Interactive Procedural Overhead Hand Animations** (which always render at 60fps with synthesized audio and adjustable camera angles/speed, even offline) with **Curated YouTube Conservatory Lessons**, chapter markers, and **"Try It Now on Keyboard" interactive checkpoints**.

```text
+------------------------------------------------------------------------------------------------------------------+
| [← Back]  VIDEO ACADEMY & TECHNIQUE STUDIO                           Filter: [All] [Posture] [Sight-Reading]     |
|                                                                              [Chords] [Rhythm] [Prescribed (2)]  |
+------------------------------------------------------------------------------------------------------------------+
|                                                                      | CHAPTERS & INTERACTIVE CHECKPOINTS        |
|  +----------------------------------------------------------------+  | ----------------------------------------- |
|  | [Mode: (●) Interactive Studio Hand Player  (○) YouTube Video ] |  | Video V2: Finding Middle C Instantly      |
|  |                                                                |  | Duration: 2:30 · Instructor: Clara Vance  |
|  |          OVERHEAD CONSERVATORY CAMERA + LIVE KEYBOARD          |  |                                           |
|  |                                                                |  | [✓] 0:00  The 2-Black-Key Chopsticks      |
|  |              ||  ||      ||  ||  ||      ||  ||                |  |     "Find any group of 2 black keys..."   |
|  |              ||  ||      ||  ||  ||      ||  ||                |  |                                           |
|  |            +--+--+--+  +--+--+--+--+--+  +--+--+--+            |  | [▶] 0:48  Sliding Left to C               |
|  |            |C4|D4|E4|  |F4|G4|A4|B4|C5|  |C5|D5|E5|            |  |     "Slide one white key left of the      |
|  |            +--+--+--+  +--+--+--+--+--+  +--+--+--+            |  |      2 black keys—that is always a C."    |
|  |              ▲                                                 |  |                                           |
|  |         [Thumb: 1]  "Look for the 2 black keys ('chopsticks')  |  | [⚡] 1:25  INTERACTIVE CHECKPOINT #1      |
|  |                      near the center brand logo. Slide to the  |  |     Play Middle C (C4) and E4 using       |
|  |                      white key immediately on their left."     |  |     Right Hand Fingers 1 and 3!           |
|  |                                                                |  |     Status: [ Waiting for your play... ]  |
|  |  [⏸ Pause] [━━━●──────── 0:54 / 2:30] [Speed: 0.75x] [🔊 Demo] |  |                                           |
|  +----------------------------------------------------------------+  | [ ] 1:50  The Middle C Thumb Anchor       |
|                                                                      |                                           |
|  INTERACTIVE CHECKPOINT KEYBOARD (Play along with the video!)        | RELATED VIDEOS FOR YOUR CURRENT LESSON    |
|  +----+----+----+----+----+----+----+----+----+----+----+----+----+  | • V1: Curved Fingers & The Natural Arch   |
|  | C3 | D3 | E3 | F3 | G3 | A3 | B3 |[C4]| D4 |[E4]| F4 | G4 | C5 |  | • V3: 5-Finger Right Hand Position        |
|  +----+----+----+----+----+----+----+----+----+----+----+----+----+  | • V4: Counting Quarter & Half Note Pulse  |
+------------------------------------------------------------------------------------------------------------------+
```

---

## 2. The 5-Step Pedagogical Lesson Flow Specification

Every lesson in the curriculum follows a strict, confidence-building **5-Step Micro-Mastery Loop**. Beginners are never thrown straight into a scrolling full-speed song without preparation.

| Step # | Step ID | Stage Name | Metronome / Clock | Passing Criteria | Pedagogical Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Step 1** | `video_intro` | **Watch & Posture Check** | Paused (Interactive Demo) | Watch/scrub the 60–90s overhead hand demo + complete 1 quick posture/concept check. | Establishes physical hand shape, landmark location, and musical concept before touching the score. |
| **Step 2** | `key_discovery` | **Find Your Keys & Fingers** | Untimed Discovery | Strike the 3–5 target keys/chords prompted on the keyboard with the specified fingers. | Eliminates "where do my hands go?" anxiety; calibrates Microphone/MIDI/Keyboard input. |
| **Step 3** | `wait_mode` | **Wait Mode Walkthrough** | **Frozen Playhead** (Advances on hit) | Reach the end of the piece; every note must be matched (hints appear after 1 wrong note or 2.5s hesitation). | Builds pitch-to-key spatial mapping and sight-reading accuracy with zero rhythm pressure. |
| **Step 4** | `slow_flow` | **Guided Slow Flow (70% Tempo)** | **70% Target BPM** + 4-Beat Count-In | Complete piece with `≥ 75%` note accuracy. Wrong notes highlight Coral; playhead keeps gentle pulse. | Bridges the gap between untimed note hunting and continuous rhythmic flow with warm accompaniment. |
| **Step 5** | `stage_performance` | **Concert Stage & Coach Review** | **100% Target BPM** + Full Backing Track | **1★**: `≥ 70%` accuracy<br>**2★**: `≥ 85%` accuracy<br>**3★**: `≥ 94%` first-try accuracy | Evaluates real-time pitch + rhythm, awards Stars/XP, and triggers the **"Fix Me" Coach** on any weak measures. |

---

## 3. "Identify My Play & Fix Me" Corrective Coaching Engine Specification

### 3.1 Real-Time Color-Coded Evaluation States (Per Note Event)
Inspired by Simply Piano and Flowkey, every note on the Sheet Music Staff, Falling Notes Cascade, and Piano Keybed reflects one of 5 live states:

1. **Upcoming (`--score-stage-ink` / `#F5F0E6`)**: Crisp unplayed notehead with finger badge (`1`–`5`).
2. **Active Target (`--accent-brass` / `#E5A93C` pulse)**: Currently under the playhead.
3. **First-Try Hit (`--eval-first-try-blue` / `#38BDF8` → `--eval-stage-emerald` / `#10B981`)**: User played the exact MIDI pitch within the timing window (`±140ms` for beginners) on the first try without triggering a hint.
4. **Hint-Assisted Hit (`--eval-hint-amber` / `#F59E0B`)**: User hesitated (`>2.2s` in Wait Mode) or struck a wrong key first, received the illuminated Amber keybed hint + directional arrow, and then played the correct note.
5. **Miss / Wrong Note (`--eval-error-coral` / `#F43F5E` + Ghost Key `#64748B`)**: User struck an incorrect pitch or missed the timing window in moving mode. The actual pitch heard is illuminated in **Slate Grey (`#64748B`) with a Coral border** on the keyboard, connected by an animated directional arrow (`←` or `→`) to the **Amber target key**.

---

### 3.2 Complete Taxonomy of 10 Play Error Archetypes & Live Coaching Copy Rules

Voice & Tone Rules for the Coach:
- **Specific & Spatial**: Always name the note heard (`F4`), the physical distance in white/black keys and direction (`1 white key left`), the target note (`E4`), the hand (`Right Hand`), and the finger (`Finger 3`).
- **Zero Apology, Zero Scolding**: Never say *"Oops! Wrong note!"* or *"Sorry, try again."* Give immediate physical direction like a warm conservatory teacher sitting beside the bench.

| Error ID | Detection Rule (Pitch / Timing Engine) | Live Banner Copy Template (During Play) | Post-Attempt Coach Diagnosis & Physical Fix | Prescribed Video ID |
| :--- | :--- | :--- | :--- | :--- |
| `ADJACENT_KEY_SLIP` | `abs(playedMidi - targetMidi) <= 2` and same diatonic neighborhood | `"You played {playedNote} — {keyDelta} key too {highOrLow}! Move {keyDelta} {whiteOrBlack} key {leftOrRight} to {targetNote} ({hand} Finger {finger})."` | `"Your hand is in the right neighborhood, but Finger {finger} slipped onto {playedNote} next door. Keep your knuckles gently curved so each finger rests directly over its own home key."` | `vid-01-posture-arch` / `vid-03-five-finger-ode` |
| `LANDMARK_DISPLACEMENT` | First 2+ notes of a phrase are shifted by a constant interval (`+2`, `-2`, `+5` semitones) | `"Hand position check! You started on {playedNote} instead of {targetNote}. Find the 2 black keys and place {hand} Finger {finger} on {targetNote}."` | `"You played the right finger pattern, but your whole hand started {keyDelta} keys {highOrLow} of home base. Anchor your thumb on Middle C (left of the 2 black keys) before counting in."` | `vid-02-middle-c-landmarks` |
| `OCTAVE_SHIFT` | `(playedMidi - targetMidi) % 12 === 0` and `abs(playedMidi - targetMidi) >= 12` | `"Right note name ({pitchClass}), wrong octave! You played {playedNote} — shift your hand {octaveDelta} octave {leftOrRight} to {targetNote}."` | `"Your ear and eye found {pitchClass}, just one octave too {highOrLow}. Check whether the note sits in the Treble Clef (middle/right of keyboard) or Bass Clef (left of Middle C)."` | `vid-02-middle-c-landmarks` / `vid-05-left-hand-bass-power` |
| `INTERVAL_MISJUDGE` | Melodic skip (`3rd`/`4th`/`5th`) played as a step (`2nd`) or vice versa | `"Watch the skip! From {prevNote} to {targetNote} skips over {skippedNote}. Use {hand} Finger {finger} on {targetNote}."` | `"In Measure {bar}, the melody jumps a {intervalName} from {prevNote} to {targetNote} (line-to-line on the staff), but you stepped to {playedNote}. Skip one white key between those fingers."` | `vid-05-left-hand-bass-power` |
| `CHROMATIC_ACCIDENTAL_MISS` | Target is a sharp/flat black key (e.g., `D#5`) and user played the adjacent natural (`D5` or `E5`) | `"Black key alert! {targetNote} is the black key between {lowerNat} and {upperNat}. Slide {hand} Finger {finger} slightly forward onto {targetNote}."` | `"You played {playedNote} (white key) instead of {targetNote} (black key). Slide your hand 2 cm closer to the fallboard so Finger {finger} reaches {targetNote} without twisting your wrist."` | `vid-08-two-hand-independence` |
| `RUSHING_BEAT` | Rolling mean timing offset `< -75ms` across 3+ consecutive notes | `"Steady pulse! You are {msEarly}ms ahead of the beat. Listen to the brass metronome click and let each key breathe."` | `"In Measure {bar}, your fingers sped up on the familiar notes ({msEarly}ms early). Great pianists play inside the pocket—count '1 - 2 - 3 - 4' out loud before pressing."` | `vid-04-rhythm-pulse-counting` |
| `DRAGGING_HESITATION` | Timing offset `> +120ms` or inter-note gap `> 450ms` at a measure or hand transition | `"Take your time finding {targetNote} ({hand} Finger {finger}). Look ahead to the next note while holding the current key."` | `"You paused for {pauseMs}ms entering Measure {bar} while searching for {targetNote}. Let's loop the last beat of Measure {prevBar} into Measure {bar} so your eyes lead your fingers."` | `vid-04-rhythm-pulse-counting` |
| `SHORT_NOTE_CLIPPING` | Half note (`2 beats`) or Whole note (`4 beats`) released in `< 55%` of expected duration (MIDI/Touch) | `"Hold {targetNote} longer! That's a {noteType} ({beats} full beats) — keep Finger {finger} down through beat {endBeat}."` | `"You struck {targetNote} at the right time in Measure {bar}, but lifted your finger after 1 beat. Let the soundboard ring for all {beats} beats before releasing."` | `vid-04-rhythm-pulse-counting` |
| `CHORD_TRANSITION_STALL` | Gap `> 400ms` or staggered notes (`> 110ms` spread) when switching between 3-note triads | `"Lock your 1–3–5 triad shape! Move all 3 fingers together as a unit to {chordName} ({chordNotes})."` | `"Switching from {prevChord} to {chordName} in Measure {bar} took {pauseMs}ms because your fingers moved one at a time. Freeze your 1–3–5 'claw' shape in the air and land together."` | `vid-06-triad-chords-claw` / `vid-07-four-chord-transitions` |
| `TWO_HAND_DESYNC` | Simultaneous RH + LH notes struck `> 90ms` apart, or one hand omitted on a downbeat | `"Both hands together on Beat {beat}! Play Left Hand {lhNote} ({lhFinger}) + Right Hand {rhNote} ({rhFinger}) at the same instant."` | `"In Measure {bar}, your {lateHand} landed {desyncMs}ms after your {earlyHand}. Practice tapping both thumbs/pinkies on the closed fallboard together, then play Beat 1 in Wait Mode."` | `vid-08-two-hand-independence` |

---

### 3.3 The 3-Phase "Fix Me" Micro-Drill Protocol
Whenever the user clicks **`[🛠 Fix Me]`** or accepts the Coach's post-song recommendation:
1. **Measure Isolation**: The engine automatically sets the Measure A–B Loop to `[troubleMeasure - 1, troubleMeasure]` (including the pickup transition beat from the preceding bar).
2. **Phase A — Wait Mode Precision (2 Clean Reps)**:
   - Metronome paused. Overhead Hand Guide zoomed onto the active octave.
   - User plays through the isolated 1–2 measures note-by-note. Must complete **2 consecutive reps with 0 wrong keys**.
3. **Phase B — 60% Slow Metronome Loop (3 Clean Reps)**:
   - Tempo locked to `60%` of lesson BPM with clear woodblock count-in.
   - User plays the looped bars in rhythm. Must complete **3 consecutive reps with `≥ 90%` accuracy**.
4. **Phase C — Context Stitch at 90%–100% Tempo (1 Final Check)**:
   - Expands loop by 1 measure before and after (`[troubleMeasure - 1, troubleMeasure + 1]`) at normal lesson tempo.
   - Upon completion, plays a warm emerald cadence and returns the user to the full song.

---

## 4. Complete 8-Lesson Beginner Curriculum & Repertoire Data Specification

All 8 lessons are fully playable out-of-the-box with exact note events, fingerings, accompaniment harmonies, and 5-step prompts.

### Curriculum Progression Matrix

| Lesson ID | # | Title & Repertoire | Track | Key / Meter | BPM | Hand(s) | Range | Core Pedagogical Skill | Prescribed Videos |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `lesson-01-middle-c-walk` | 01 | **Finding Middle C & The 3-Note Walk** | `soloist` | C Maj · 4/4 | 68 | RH (`1-2-3`) | `C4–E4` | 2-black-key landmark, Middle C, stepping up & down | `vid-01`, `vid-02` |
| `lesson-02-ode-to-joy` | 02 | **The 5-Finger Arch & Ode to Joy** (Beethoven) | `soloist` | C Maj · 4/4 | 80 | RH (`1-2-3-4-5`) | `C4–G4` | 5-finger C position, ring/pinky control (`E4-F4-G4`) | `vid-01`, `vid-03` |
| `lesson-03-au-clair-rhythm` | 03 | **Rhythm & Half Notes — Au Clair de la Lune** | `soloist` | C Maj · 4/4 | 76 | RH (`1-2-3`) | `C4–E4` | Quarter (1 beat), Half (2 beats), Whole (4 beats) duration | `vid-04`, `vid-03` |
| `lesson-04-left-hand-twinkle` | 04 | **Left Hand Bass Landmarks & Twinkle Twinkle** | `soloist` | C Maj · 4/4 | 74 | LH (`5-4-3-2-1`) | `C3–A3` | Bass clef reading, `C3–G3` 5th skip, LH finger numbering | `vid-05`, `vid-02` |
| `lesson-05-chords-c-g-pop` | 05 | **Chords Path I: C Major & G Major Pop Pulse** | `chords` | C Maj · 4/4 | 82 | RH Triads (`1-3-5`) | `C4–D5` | Simultaneous 3-note triads, C Maj (`C-E-G`) & G Maj (`G-B-D`) | `vid-06`, `vid-04` |
| `lesson-06-four-chord-anthem` | 06 | **Chords Path II: The 4-Chord Hit Progression** (*Let It Be / Someone Like You* style) | `chords` | C Maj · 4/4 | 76 | Both (LH Root + RH Triad) | `C3–E5` | `C – G – Am – F` pop progression, minor vs. major color | `vid-07`, `vid-06` |
| `lesson-07-minuet-in-g` | 07 | **Both Hands Together — Minuet in G** (Petzold / J.S. Bach, Simplified) | `synthesis` | G/C · 3/4 | 84 | Both (`RH + LH`) | `G3–G5` | `3/4` waltz pulse, two-hand downbeat coordination, melodic grace | `vid-08`, `vid-05` |
| `lesson-08-fur-elise-gymnopedie` | 08 | **Expressive Mastery — Für Elise & Gymnopédie Motif** (Beethoven / Satie) | `synthesis` | A Min · 3/4 | 78 | Both (`RH + LH`) | `A2–E5` | `E5–D#5` chromatic neighbor black key, broken bass-to-melody handoff | `vid-08`, `vid-01` |

---

### Detailed Lesson Specifications (1 through 8)

#### Lesson 1: `lesson-01-middle-c-walk` — *Finding Middle C & The 3-Note Walk*
- **Track**: `soloist` | **Time Signature**: `4/4` | **Tempo**: `68 BPM` | **Hands**: Right Hand (`RH`)
- **Pedagogical Goal**: Locate the 2-black-key group ("chopsticks") near the center of the keyboard, anchor Right Hand Thumb (`Finger 1`) on Middle C (`C4`), and walk smoothly across `C4–D4–E4` ("Hot Cross Buns / 3-Note Promenade").
- **5-Step Flow**:
  1. `video_intro`: Watch `vid-02-middle-c-landmarks` (Finding the 2 Black Keys & Middle C) + `vid-01-posture-arch` (The Relaxed Ball-Drop Hand Arch).
  2. `key_discovery`:
     - Prompt 1: *"Find the group of 2 black keys in the middle. Press the white key just to their left: **Middle C (C4)** with **Right Hand Thumb (Finger 1)**."*
     - Prompt 2: *"Step 1 white key right to **D4** with **Index Finger (2)**."*
     - Prompt 3: *"Step 1 more white key right to **E4** with **Middle Finger (3)**."*
  3. `wait_mode`: Play all 4 measures of *The 3-Note Walk* untimed.
  4. `slow_flow`: Play at `48 BPM` (70%) with warm acoustic bass accompaniment (`C2–G2`).
  5. `stage_performance`: Full performance at `68 BPM` with chamber strings + upright bass backing.
- **Score Note Events (`notes`)**:
  - **Measure 1**: `E4` (beat 0, dur 1, RH:3, `"Step"`), `D4` (beat 1, dur 1, RH:2, `"down"`), `C4` (beat 2, dur 2, RH:1, `"home —"`)
  - **Measure 2**: `E4` (beat 0, dur 1, RH:3, `"Three"`), `D4` (beat 1, dur 1, RH:2, `"white"`), `C4` (beat 2, dur 2, RH:1, `"keys —"`)
  - **Measure 3**: `C4` (beat 0, dur 1, RH:1, `"Climb"`), `D4` (beat 1, dur 1, RH:2, `"right"`), `E4` (beat 2, dur 1, RH:3, `"up"`), `C4` (beat 3, dur 1, RH:1, `"to"`)
  - **Measure 4**: `D4` (beat 0, dur 1, RH:2, `"D"`), `E4` (beat 1, dur 1, RH:3, `"and"`), `C4` (beat 2, dur 2, RH:1, `"rest —"`)

---

#### Lesson 2: `lesson-02-ode-to-joy` — *The 5-Finger Right Hand Arch & Ode to Joy*
- **Track**: `soloist` | **Time Signature**: `4/4` | **Tempo**: `80 BPM` | **Hands**: Right Hand (`RH`)
- **Pedagogical Goal**: Expand from 3 fingers to the full **5-Finger C Position (`C4–D4–E4–F4–G4` with Fingers `1–2–3–4–5`)**, strengthening the naturally weaker Ring (`4`) and Pinky (`5`) fingers through Beethoven's *Ode to Joy* (Symphony No. 9 theme).
- **5-Step Flow**:
  1. `video_intro`: Watch `vid-03-five-finger-ode` (5-Finger Home Base & Ring/Pinky Independence).
  2. `key_discovery`:
     - Prompt 1: *"Place Right Hand Fingers 1, 2, 3, 4, 5 over C4, D4, E4, F4, G4. Press **E4** with **Middle Finger (3)**."*
     - Prompt 2: *"Press **F4** with **Ring Finger (4)**—keep your knuckle curved!"*
     - Prompt 3: *"Press **G4** with **Pinky (5)** on the side of its tip."*
     - Prompt 4: *"Walk down **G4 → F4 → E4 → D4 → C4** (`5–4–3–2–1`)."*
  3. `wait_mode`: Untimed walkthrough of all 8 measures of *Ode to Joy*.
  4. `slow_flow`: Play at `56 BPM` (70%) with orchestral strings + French horn backing.
  5. `stage_performance`: Full performance at `80 BPM`.
- **Score Note Events (`notes`, 8 Measures / 32 Beats)**:
  - **Measure 1**: `E4` (b0, d1, RH:3), `E4` (b1, d1, RH:3), `F4` (b2, d1, RH:4), `G4` (b3, d1, RH:5) — *Harmony: C Major*
  - **Measure 2**: `G4` (b0, d1, RH:5), `F4` (b1, d1, RH:4), `E4` (b2, d1, RH:3), `D4` (b3, d1, RH:2) — *Harmony: G Major*
  - **Measure 3**: `C4` (b0, d1, RH:1), `C4` (b1, d1, RH:1), `D4` (b2, d1, RH:2), `E4` (b3, d1, RH:3) — *Harmony: A Minor*
  - **Measure 4**: `E4` (b0, d1.5, RH:3), `D4` (b1.5, d0.5, RH:2), `D4` (b2, d2, RH:2) — *Harmony: G Major*
  - **Measure 5**: `E4` (b0, d1, RH:3), `E4` (b1, d1, RH:3), `F4` (b2, d1, RH:4), `G4` (b3, d1, RH:5) — *Harmony: C Major*
  - **Measure 6**: `G4` (b0, d1, RH:5), `F4` (b1, d1, RH:4), `E4` (b2, d1, RH:3), `D4` (b3, d1, RH:2) — *Harmony: G Major*
  - **Measure 7**: `C4` (b0, d1, RH:1), `C4` (b1, d1, RH:1), `D4` (b2, d1, RH:2), `E4` (b3, d1, RH:3) — *Harmony: F Major → G Major*
  - **Measure 8**: `D4` (b0, d1.5, RH:2), `C4` (b1.5, d0.5, RH:1), `C4` (b2, d2, RH:1) — *Harmony: C Major*

---

#### Lesson 3: `lesson-03-au-clair-rhythm` — *Rhythm & Half Notes — Au Clair de la Lune*
- **Track**: `soloist` | **Time Signature**: `4/4` | **Tempo**: `76 BPM` | **Hands**: Right Hand (`RH`)
- **Pedagogical Goal**: Master note duration literacy—distinguishing filled **Quarter Notes (`1 beat`)**, open-head **Half Notes (`2 beats`)**, and stemless **Whole Notes (`4 beats`)** so the learner holds long notes through their full rhythmic value without rushing into the next measure.
- **5-Step Flow**:
  1. `video_intro`: Watch `vid-04-rhythm-pulse-counting` (The Heartbeat of Music: Quarter, Half & Whole Notes).
  2. `key_discovery`:
     - Prompt 1: *"Play **C4** (`Finger 1`) 3 times on steady beats: 1, 2, 3, then step to **D4** (`Finger 2`) on beat 4."*
     - Prompt 2: *"Play **E4** (`Finger 3`) and HOLD it for 2 full beats ('1–2'), then **D4** (`Finger 2`) for 2 beats ('3–4')."*
  3. `wait_mode`: Untimed note sequence check across 4 measures.
  4. `slow_flow`: `54 BPM` with clear metronome subdivision and harp/woodwind accompaniment.
  5. `stage_performance`: `76 BPM` performance evaluating both **note onset** and **sustain duration** (`SHORT_NOTE_CLIPPING` detector active).
- **Score Note Events (`notes`, 4 Measures / 16 Beats)**:
  - **Measure 1**: `C4` (b0, d1, RH:1), `C4` (b1, d1, RH:1), `C4` (b2, d1, RH:1), `D4` (b3, d1, RH:2)
  - **Measure 2**: `E4` (b0, d2, RH:3, *Half Note*), `D4` (b2, d2, RH:2, *Half Note*)
  - **Measure 3**: `C4` (b0, d1, RH:1), `E4` (b1, d1, RH:3), `D4` (b2, d1, RH:2), `D4` (b3, d1, RH:2)
  - **Measure 4**: `C4` (b0, d4, RH:1, *Whole Note — Hold 4 Beats*)

---

#### Lesson 4: `lesson-04-left-hand-twinkle` — *Left Hand Bass Landmarks & Twinkle Twinkle*
- **Track**: `soloist` | **Time Signature**: `4/4` | **Tempo**: `74 BPM` | **Hands**: Left Hand (`LH`)
- **Pedagogical Goal**: Introduce the **Bass Clef (`F Clef`)**, Left Hand C3 Position (`C3–D3–E3–F3–G3–A3`), mirror-image finger numbering (`Pinky = 5` on `C3`, `Thumb = 1` on `G3/A3`), and the iconic **Perfect 5th skip (`C3 → G3`)** in *Twinkle, Twinkle, Little Star*.
- **5-Step Flow**:
  1. `video_intro`: Watch `vid-05-left-hand-bass-power` (Left Hand Mirror Numbers & Bass Clef Landmarks).
  2. `key_discovery`:
     - Prompt 1: *"Shift 1 octave left of Middle C to **Bass C (C3)**. Press **C3** with **Left Hand Pinky (Finger 5)**."*
     - Prompt 2: *"Jump a 5th up to **G3** with **Left Hand Thumb (Finger 1)**."*
     - Prompt 3: *"Stretch your Left Hand Thumb 1 white key right to **A3 (`Finger 1`)**, then return to **G3 (`Finger 1`)**."*
     - Prompt 4: *"Walk down **F3 (`2`) → E3 (`3`) → D3 (`4`) → C3 (`5`)**."*
  3. `wait_mode`: Untimed walkthrough of *Twinkle Twinkle* in the rich baritone register.
  4. `slow_flow`: `52 BPM` with shimmering celesta/piano upper-register accompaniment.
  5. `stage_performance`: `74 BPM` performance.
- **Score Note Events (`notes`, 4 Measures / 16 Beats)**:
  - **Measure 1**: `C3` (b0, d1, LH:5), `C3` (b1, d1, LH:5), `G3` (b2, d1, LH:1), `G3` (b3, d1, LH:1)
  - **Measure 2**: `A3` (b0, d1, LH:1), `A3` (b1, d1, LH:1), `G3` (b2, d2, LH:1)
  - **Measure 3**: `F3` (b0, d1, LH:2), `F3` (b1, d1, LH:2), `E3` (b2, d1, LH:3), `E3` (b3, d1, LH:3)
  - **Measure 4**: `D3` (b0, d1, LH:4), `D3` (b1, d1, LH:4), `C3` (b2, d2, LH:5)

---

#### Lesson 5: `lesson-05-chords-c-g-pop` — *Chords Path I: C Major & G Major Pop Accompaniment*
- **Track**: `chords` | **Time Signature**: `4/4` | **Tempo**: `82 BPM` | **Hands**: Right Hand Chords (`RH 1-3-5`)
- **Pedagogical Goal**: Unlock the **Chords Path**! Teach how to build any Root-Position Triad ("Play 1, Skip 1, Play 1, Skip 1, Play 1" with **Fingers `1–3–5`**), strike 3 keys simultaneously without rolling, and groove on a rhythmic pop backing using **C Major (`C4+E4+G4`)** and **G Major (`G4+B4+D5`)**.
- **5-Step Flow**:
  1. `video_intro`: Watch `vid-06-triad-chords-claw` (Building 3-Note Triads & The 1–3–5 Chord Shape).
  2. `key_discovery`:
     - Prompt 1: *"Build **C Major (`C`): Press C4 (`1`) + E4 (`3`) + G4 (`5`)** together at the same instant."*
     - Prompt 2: *"Keep that exact 1–3–5 hand shape and glide up so Thumb (`1`) lands on G4: Press **G Major (`G`): G4 (`1`) + B4 (`3`) + D5 (`5`)**."*
     - Prompt 3: *"Switch back to **C Major (`C4+E4+G4`)** cleanly!"*
  3. `wait_mode`: Untimed chord progression check across 4 measures (half-note pop pulse).
  4. `slow_flow`: `58 BPM` with studio drums, bass, and vocal-style lead synth melody over the user's chords.
  5. `stage_performance`: `82 BPM` pop band stage performance (`CHORD_TRANSITION_STALL` detector active).
- **Score Note Events (`notes`, 4 Measures / 16 Beats — Simultaneous Triad Events)**:
  - **Measure 1 (C Major)**:
    - Beat 0 (dur 2): `C4` (RH:1) + `E4` (RH:3) + `G4` (RH:5) `[Chord: C]`
    - Beat 2 (dur 2): `C4` (RH:1) + `E4` (RH:3) + `G4` (RH:5) `[Chord: C]`
  - **Measure 2 (G Major)**:
    - Beat 0 (dur 2): `G4` (RH:1) + `B4` (RH:3) + `D5` (RH:5) `[Chord: G]`
    - Beat 2 (dur 2): `G4` (RH:1) + `B4` (RH:3) + `D5` (RH:5) `[Chord: G]`
  - **Measure 3 (C Major → G Major)**:
    - Beat 0 (dur 2): `C4` (RH:1) + `E4` (RH:3) + `G4` (RH:5) `[Chord: C]`
    - Beat 2 (dur 2): `G4` (RH:1) + `B4` (RH:3) + `D5` (RH:5) `[Chord: G]`
  - **Measure 4 (C Major Finale)**:
    - Beat 0 (dur 4): `C4` (RH:1) + `E4` (RH:3) + `G4` (RH:5) `[Chord: C]`

---

#### Lesson 6: `lesson-06-four-chord-anthem` — *Chords Path II: The 4-Chord Hit Progression (C–G–Am–F)*
- **Track**: `chords` | **Time Signature**: `4/4` | **Tempo**: `76 BPM` | **Hands**: Both Hands (`LH Bass Root + RH Triad`)
- **Pedagogical Goal**: Master the most famous chord progression in modern music (**I – V – vi – IV**: **C Major → G Major → A Minor → F Major**, heard in *Let It Be*, *Someone Like You*, *No Woman No Cry*, *Don't Stop Believin'*), introducing **A Minor (`A4–C5–E5`)**, **F Major (`F4–A4–C5`)**, and **Left Hand Bass Root anchoring**.
- **5-Step Flow**:
  1. `video_intro`: Watch `vid-07-four-chord-transitions` (The 4 Chords That Unlock 1,000 Songs: C–G–Am–F).
  2. `key_discovery`:
     - Prompt 1: *"Play **C Major** with Left Hand Bass **C3 (`5`)** + Right Hand **C4+E4+G4 (`1-3-5`)**."*
     - Prompt 2: *"Play **G Major**: Left Hand **G3 (`1`)** + Right Hand **G4+B4+D5 (`1-3-5`)**."*
     - Prompt 3: *"Step up 1 white key to **A Minor (`Am`)**: Left Hand **A3 (`1`)** + Right Hand **A4+C5+E5 (`1-3-5`)** — hear that emotional minor color!"*
     - Prompt 4: *"Step down to **F Major (`F`)**: Left Hand **F3 (`2`)** + Right Hand **F4+A4+C5 (`1-3-5`)**."*
  3. `wait_mode`: Untimed walkthrough of the 4-measure anthem progression.
  4. `slow_flow`: `54 BPM` with soulful ballad drums & cello backing.
  5. `stage_performance`: `76 BPM` concert ballad performance.
- **Score Note Events (`notes`, 4 Measures / 16 Beats)**:
  - **Measure 1 (`C Major`)**:
    - Beat 0 (dur 2): `C3` (LH:5) + `C4` (RH:1) + `E4` (RH:3) + `G4` (RH:5)
    - Beat 2 (dur 2): `C4` (RH:1) + `E4` (RH:3) + `G4` (RH:5)
  - **Measure 2 (`G Major`)**:
    - Beat 0 (dur 2): `G3` (LH:1) + `G4` (RH:1) + `B4` (RH:3) + `D5` (RH:5)
    - Beat 2 (dur 2): `G4` (RH:1) + `B4` (RH:3) + `D5` (RH:5)
  - **Measure 3 (`A Minor`)**:
    - Beat 0 (dur 2): `A3` (LH:1) + `A4` (RH:1) + `C5` (RH:3) + `E5` (RH:5)
    - Beat 2 (dur 2): `A4` (RH:1) + `C5` (RH:3) + `E5` (RH:5)
  - **Measure 4 (`F Major`)**:
    - Beat 0 (dur 2): `F3` (LH:2) + `F4` (RH:1) + `A4` (RH:3) + `C5` (RH:5)
    - Beat 2 (dur 2): `F4` (RH:1) + `A4` (RH:3) + `C5` (RH:5)

---

#### Lesson 7: `lesson-07-minuet-in-g` — *Both Hands Together — Minuet in G (Petzold / Bach, Simplified)*
- **Track**: `synthesis` | **Time Signature**: `3/4` | **Tempo**: `84 BPM` | **Hands**: Both Hands (`LH Bass + RH Melody`)
- **Pedagogical Goal**: Synthesize Soloist melody reading with Left Hand harmonic anchoring in **`3/4` triple meter (`ONE - two - three`)**. Learner coordinates simultaneous downbeats on Beat 1 while Right Hand dances through the baroque melody (`D5 — G4 A4 B4 C5 | D5 — G4 — G4 —`).
- **5-Step Flow**:
  1. `video_intro`: Watch `vid-08-two-hand-independence` (Unlocking Two-Hand Coordination & 3/4 Waltz Pulse).
  2. `key_discovery`:
     - Prompt 1: *"Place Left Hand Thumb (`1`) on **B3** and Pinky (`5`) on **G3**. Place Right Hand Thumb (`1`) on **G4** and Pinky (`5`) on **D5**."*
     - Prompt 2: *"Beat 1 Downbeat Anchor: Strike Left Hand **G3 (`5`)** and Right Hand **D5 (`5`)** at the exact same instant!"*
     - Prompt 3: *"Now walk the Right Hand up **G4 (`1`) → A4 (`2`) → B4 (`3`) → C5 (`4`) → D5 (`5`)**."*
  3. `wait_mode`: Untimed two-hand walkthrough across all 4 measures (`12 beats` of `3/4`).
  4. `slow_flow`: `58 BPM` with harpsichord/string continuo backing.
  5. `stage_performance`: `84 BPM` baroque recital performance (`TWO_HAND_DESYNC` detector active).
- **Score Note Events (`notes`, 4 Measures in `3/4` / 12 Beats)**:
  - **Measure 1 (`3/4`)**:
    - Beat 0: `G3` (dur 3, LH:5) + `D5` (dur 1, RH:5)
    - Beat 1: `G4` (dur 0.5, RH:1), Beat 1.5: `A4` (dur 0.5, RH:2)
    - Beat 2: `B4` (dur 0.5, RH:3), Beat 2.5: `C5` (dur 0.5, RH:4)
  - **Measure 2 (`3/4`)**:
    - Beat 0: `B3` (dur 3, LH:3) + `D5` (dur 1, RH:5)
    - Beat 1: `G4` (dur 1, RH:1)
    - Beat 2: `G4` (dur 1, RH:1)
  - **Measure 3 (`3/4`)**:
    - Beat 0: `C4` (dur 3, LH:2) + `E5` (dur 1, RH:5)
    - Beat 1: `C5` (dur 1, RH:3)
    - Beat 2: `D5` (dur 1, RH:4)
  - **Measure 4 (`3/4`)**:
    - Beat 0: `G3` (dur 3, LH:5) + `B4` (dur 2, RH:2)
    - Beat 2: `G4` (dur 1, RH:1)

---

#### Lesson 8: `lesson-08-fur-elise-gymnopedie` — *Expressive Mastery — Für Elise Opening & Gymnopédie Flow*
- **Track**: `synthesis` | **Time Signature**: `3/4` | **Tempo**: `78 BPM` | **Hands**: Both Hands (`LH Arpeggio + RH Chromatic Motif`)
- **Pedagogical Goal**: Introduce **Black Key Accidentals (`D#5` / `Eb5`)**, expressive touch, and seamless **Left-to-Right Hand Handoff** in Beethoven's iconic *Für Elise* opening in A Minor.
- **5-Step Flow**:
  1. `video_intro`: Watch `vid-08-two-hand-independence` + `vid-01-posture-arch` (Sliding Forward for Black Keys & Seamless Hand Handoffs).
  2. `key_discovery`:
     - Prompt 1: *"Locate high **E5** (`Right Hand Finger 5`) and the black key immediately to its left: **D#5** (`Right Hand Finger 4`). Alternate **E5 → D#5 → E5**."*
     - Prompt 2: *"Play the famous resolution: **B4 (`2`) → D5 (`4`) → C5 (`3`) → A4 (`1`)**."*
     - Prompt 3: *"Add the Left Hand bass answer: **A2 (`5`) → E3 (`1`) → A3 (`2`)**."*
  3. `wait_mode`: Untimed walkthrough of the 4-measure *Für Elise* theme.
  4. `slow_flow`: `55 BPM` with expressive pedal resonance.
  5. `stage_performance`: `78 BPM` conservatory showcase (`CHROMATIC_ACCIDENTAL_MISS` detector active on `D#5`).
- **Score Note Events (`notes`, 4 Measures in `3/4` / 12 Beats)**:
  - **Measure 1 (`3/4`)**:
    - Beat 0: `E5` (dur 0.5, RH:5), Beat 0.5: `D#5` (dur 0.5, RH:4)
    - Beat 1: `E5` (dur 0.5, RH:5), Beat 1.5: `D#5` (dur 0.5, RH:4)
    - Beat 2: `E5` (dur 0.5, RH:5), Beat 2.5: `B4` (dur 0.5, RH:2)
  - **Measure 2 (`3/4`)**:
    - Beat 0: `D5` (dur 0.5, RH:4), Beat 0.5: `C5` (dur 0.5, RH:3)
    - Beat 1: `A3` (dur 2, LH:2) + `A4` (dur 1, RH:1)
    - Beat 2: `C4` (dur 0.5, RH:1), Beat 2.5: `E4` (dur 0.5, RH:2)
  - **Measure 3 (`3/4`)**:
    - Beat 0: `A4` (dur 1, RH:4)
    - Beat 1: `G#3` (dur 2, LH:3) + `B4` (dur 1, RH:5)
    - Beat 2: `E4` (dur 0.5, RH:1), Beat 2.5: `G#4` (dur 0.5, RH:2)
  - **Measure 4 (`3/4`)**:
    - Beat 0: `B4` (dur 0.5, RH:4), Beat 0.5: `C5` (dur 0.5, RH:5)
    - Beat 1: `A3` (dur 2, LH:2) + `A4` (dur 2, RH:3)

---

## 5. Contextual Video Tutorial Catalog (`VIDEOS` Data Spec)

To ensure **100% reliability whether online or offline** and solve the #1 problem of embedded video tutorials (passive watching without physical application), every video tutorial in the app has a **Dual-Engine Player**:
1. **Interactive Studio Overhead Hand Player (Default & Always Available)**: Renders an animated, high-precision overhead grand piano & articulated left/right hand model on HTML5 Canvas with synchronized Web Audio piano demonstration, voiceover subtitles, slow-motion scrub (`0.5x` / `0.75x` / `1.0x`), and **Interactive Checkpoints** that pause playback and wait for the user to try the technique on their own keyboard.
2. **Curated YouTube Conservatory Embed Mode**: Embeds real, verified beginner piano tutorials (`youtube-nocookie.com`) with timestamped jump links.

### Complete 8-Video Catalog

| Video ID | Title & Instructor | Duration | Error Triggers Linked | Interactive Checkpoint Task | Curated YouTube ID & Topic |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `vid-01-posture-arch` | **The Natural Hand Arch & Curved Fingers ("The Orange Hold")** · *Clara Vance, Royal Conservatory* | `1:45` | `ADJACENT_KEY_SLIP`, `CHROMATIC_ACCIDENTAL_MISS` | Play `C4 → D4 → E4` slowly while keeping knuckles gently arched and thumb playing on its side corner. | `QBH6IpRkVDs` (Pianote — Proper Piano Hand Posture & Technique) |
| `vid-02-middle-c-landmarks` | **Finding Middle C & The 2-Black-Key Chopsticks Landmark** · *Clara Vance* | `2:10` | `LANDMARK_DISPLACEMENT`, `OCTAVE_SHIFT` | Locate `C3`, `C4 (Middle C)`, and `C5` using the 2-black-key landmark in under 10 seconds. | `4SXQ_wlbWog` (Pianote — How to Find Notes on the Piano Keyboard) |
| `vid-03-five-finger-ode` | **Taming Fingers 4 & 5: The 5-Finger C Position Arch** · *Julian Mercer* | `2:25` | `ADJACENT_KEY_SLIP`, `INTERVAL_MISJUDGE` | Play the upper walk `E4 (3) → F4 (4) → G4 (5) → F4 (4) → E4 (3)` twice without pressing two keys at once. | `WJ3-F02-F_Y` (Hoffman Academy — 5-Finger Scale & Finger Control) |
| `vid-04-rhythm-pulse-counting` | **The Inner Metronome: Quarter, Half & Whole Note Pulse** · *Clara Vance* | `2:15` | `RUSHING_BEAT`, `DRAGGING_HESITATION`, `SHORT_NOTE_CLIPPING` | Play two 1-beat Quarter notes (`C4, D4`) followed by one held 2-beat Half note (`E4`) in time with the 72 BPM pulse. | `2UphJk0QqYM` (Pianote — Piano Rhythm & Counting Beats for Beginners) |
| `vid-05-left-hand-bass-power` | **Left Hand Mirror Numbers & The 5th Skip (C3 to G3)** · *Julian Mercer* | `2:20` | `OCTAVE_SHIFT`, `INTERVAL_MISJUDGE` | Play Left Hand `C3 (Pinky 5)` → `G3 (Thumb 1)` → `F3 (Index 2)` → `E3 (Middle 3)`. | `3BULT0-vT7Q` (Pianote — Left Hand Piano Exercises for Beginners) |
| `vid-06-triad-chords-claw` | **The 1–3–5 Triad Shape: Striking 3 Notes Together** · *Elena Rostova* | `2:30` | `CHORD_TRANSITION_STALL`, `ADJACENT_KEY_SLIP` | Strike a `C Major Triad (C4+E4+G4)` with Fingers `1–3–5` within a 60ms simultaneous window. | `gmvwZRwn-j0` (Pianote — How to Play Piano Chords for Beginners) |
| `vid-07-four-chord-transitions` | **Smooth Pop Chord Jumps: C – G – Am – F Without Looking Panic** · *Elena Rostova* | `2:50` | `CHORD_TRANSITION_STALL`, `DRAGGING_HESITATION` | Switch from `C Major (C4-E4-G4)` to `A Minor (A4-C5-E5)` and `F Major (F4-A4-C5)` in Wait Mode. | `5pidokakU4I` (Pianote — The 4 Chords That Unlock Hundreds of Songs) |
| `vid-08-two-hand-independence` | **Unlocking Both Hands Together & Chromatic Black Keys** · *Julian Mercer* | `3:00` | `TWO_HAND_DESYNC`, `CHROMATIC_ACCIDENTAL_MISS` | Strike Left Hand `G3 (5)` + Right Hand `D5 (5)` together on Beat 1, then play `E5 → D#5 → E5`. | `x2rQ7B5gX0I` (Pianote — Hand Independence for Beginners) |

### Detailed Chapter & Overhead Keyframe Spec for Each Video

Each video entry in the application data layer contains:
```ts
export interface VideoTutorialSpec {
  id: string;
  title: string;
  subtitle: string;
  instructor: string;
  durationSec: number;
  category: 'posture' | 'landmarks' | 'rhythm' | 'left-hand' | 'chords' | 'coordination';
  youtubeId: string;
  errorTriggerTypes: PlayErrorArchetype[];
  recommendedForLessons: string[];
  summary: string;
  chapters: Array<{
    timestampSec: number;
    title: string;
    narration: string;
    overheadDemoNotes: Array<{
      pitch: string;
      midi: number;
      hand: 'R' | 'L';
      finger: 1 | 2 | 3 | 4 | 5;
      offsetSec: number;
      durationSec: number;
    }>;
    coachTip: string;
  }>;
  interactiveCheckpoint: {
    prompt: string;
    instructions: string;
    targetSequence: Array<{
      pitches: string[];
      hand: 'R' | 'L' | 'BOTH';
      fingers: number[];
      label: string;
    }>;
  };
}
```

---

## 6. 5-Minute Daily Workouts Specification

Inspired by Simply Piano's *5-Minute Workouts*, users can launch three focused, high-replayability skill builders from the Navigation Bar or Curriculum Hub at any time.

### Workout 1: Note Flashcard Sprint (`workout-flashcard-sprint`)
- **Duration**: 60-second timed round (or 20-card untimed Zen mode).
- **Pedagogical Goal**: Build instant, reflex-speed sight-reading from the Grand Staff to the physical keyboard without counting up lines and spaces every time.
- **Difficulty Tiers**:
  - *Tier 1 (Treble Landmarks)*: `C4, D4, E4, F4, G4`
  - *Tier 2 (Bass Landmarks)*: `C3, D3, E3, F3, G3, A3`
  - *Tier 3 (Full Grand Staff)*: `C3` through `E5` including `D#5 / F#4`
- **Mechanics & Feedback**:
  - A large engraved note appears on the Grand Staff. Note-name badges are hidden initially.
  - If the user hits the right key on the first try within `2.0s`, they earn a **Speed Streak (`+150 XP`)** and the note bursts in **First-Try Blue (`#38BDF8`)**.
  - If the user hits a wrong key, the keyboard immediately shows their played key in **Coral (`#F43F5E`)**, illuminates the target key in **Amber (`#F59E0B`)** with a mnemonic tip (e.g., *"Line 1 of Treble Clef = E4 ('Every Good Boy...')"*), and waits for them to press the correct key before dealing the next card.

### Workout 2: Ear Pitch & Interval Match (`workout-ear-pitch-match`)
- **Duration**: 8 progressive rounds (~3–5 minutes).
- **Pedagogical Goal**: Connect the beginner's ear to the keyboard so they can hear whether a pitch moves **higher (right)**, **lower (left)**, by a **step (2nd)**, or by a **skip (3rd/5th)**.
- **Mechanics & Feedback**:
  - The app gives the **Starting Anchor Note** visually and aurally (e.g., *"Anchor: C4 — Listen to the 3-note mystery phrase"*).
  - The synthesized grand piano plays a 2- or 3-note melodic phrase (e.g., `C4 → E4 → G4` or `E4 → D4 → C4`) while hiding the mystery notes behind golden question badges on the staff.
  - As the user plays each note on their Mic/MIDI/Virtual keyboard, the Coach gives warm directional ear feedback (`"Close! You played D4, which is 1 white key too low—the mystery note jumped a 3rd higher to E4"`).

### Workout 3: Chord Switcher Turbo (`workout-chord-switcher`)
- **Duration**: 90-second groove drill.
- **Pedagogical Goal**: Eliminate the "chord change pause" where beginners freeze between chords while placing one finger at a time.
- **Progression Sets**:
  - *Set A*: `C Major ↔ G Major`
  - *Set B*: `C Major ↔ A Minor ↔ F Major`
  - *Set C*: `The 4-Chord Hit Loop (C – G – Am – F)`
- **Mechanics & Feedback**:
  - Plays a steady drum & bass groove at `64 BPM` (auto-scaling up by `+4 BPM` every 4 clean switches).
  - Evaluates two metrics per chord strike:
    1. **Simultaneity Spread (`ms`)**: Did all 3 triad notes land together (`< 65ms` = *"Locked Triad!"*) or roll unevenly?
    2. **Transition Time (`ms`)**: How quickly did the hand relocate from the previous chord?

---

## 7. Multi-Input Ergonomics & Calibration UX

Because a beginner may practice with a real acoustic piano (via laptop/phone microphone), a USB/Bluetooth MIDI keyboard, or their laptop keyboard/trackpad, the **Input Readiness Bar** is always accessible in a single click:

1. **Live Microphone Pitch Detection Mode (`Web Audio API + YIN Autocorrelation`)**:
   - Displays a live **Input Level & Pitch Confidence Meter** (`-60dB` to `0dB`, plus live detected note name `C4 · 261.6 Hz` and cent tuning indicator).
   - **Ambient Noise Gate Calibration**: A 2-second *"Calibrate Room Quietness"* button samples background room noise and sets an adaptive RMS threshold + harmonic verification check (confirming the fundamental frequency against the 2nd/3rd overtone so spoken voice or key thuds don't trigger false notes).
2. **Web MIDI Mode (`navigator.requestMIDIAccess`)**:
   - Auto-detects connected USB/BLE MIDI controllers, displays the device name (e.g., `Yamaha P-125 / Roland FP-30X`), and captures exact `noteOn` velocity (`1–127`) and `noteOff` duration.
3. **Virtual Grand Piano + Computer QWERTY Keyboard Mapping**:
   - Always active alongside Mic/MIDI so anyone can test or play immediately:
     - **Lower / Bass Octave (`C3`–`B3`)**: `Z X C V B N M` (White keys `C3 D3 E3 F3 G3 A3 B3`), with `S D G H J` for sharps (`C#3 D#3 F#3 G#3 A#3`). *(Or shiftable octave toggle `[Octave: C3-C5 | C4-C6]`)*
     - **Primary / Middle C Octave (`C4`–`E5`)**: Home row `A S D F G H J K L ; '` maps directly to white keys **`C4 D4 E4 F4 G4 A4 B4 C5 D5 E5 F5`**, and top row `W E T Y U O P` maps to black keys **`C#4 D#4 F#4 G#4 A#4 C#5 D#5`**.
   - Every key on the visual keyboard displays its **Note Name (`C4`)**, optional **Solfège (`Do`)**, **Active Finger Number (`1`–`5`)**, and subtle **QWERTY Shortcut Badge (`[A]`)**.

---

## 8. Cross-Specification Type Alignment (`technical-architecture.md` ↔ `piano-pedagogy-and-ux-design.md`)

To ensure seamless interoperability between the UI/Pedagogy specification and `docs/specs/technical-architecture.md`, the following canonical union mappings apply:

1. **`CurriculumTrackId` Alignment**:
   - `'foundations'` ↔ Lesson 1 (`lesson-01-middle-c-walk`) & Lesson 2 (`lesson-02-ode-to-joy`) entry foundation
   - `'soloist'` ↔ Soloist Path (`lesson-01` through `lesson-04`)
   - `'chords'` ↔ Chords Path (`lesson-05-chords-c-g-pop`, `lesson-06-four-chord-anthem`)
   - `'songs'` / `'synthesis'` ↔ Combined Two-Hand Repertoire (`lesson-07-minuet-in-g`, `lesson-08-fur-elise-gymnopedie`)
2. **`LessonStepType` Alignment (5-Step Flow)**:
   - Step 1: `'video_intro'`
   - Step 2: `'key_discovery'`
   - Step 3: `'wait_mode'`
   - Step 4: `'slow_tempo'` (alias `'slow_flow'`, 70% BPM guided tempo)
   - Step 5: `'performance_stage'` (alias `'stage_performance'`, 100% BPM stage & coach diagnostic)
3. **`MistakeCategory` ↔ Granular `PlayErrorArchetype` Rollup**:
   - `'NEIGHBOR_KEY_SLIP'` ← `ADJACENT_KEY_SLIP`, `INTERVAL_MISJUDGE`, `CHROMATIC_ACCIDENTAL_MISS`
   - `'LANDMARK_OCTAVE_DRIFT'` ← `LANDMARK_DISPLACEMENT`, `OCTAVE_SHIFT`
   - `'RHYTHM_RUSHING'` ← `RUSHING_BEAT`, `SHORT_NOTE_CLIPPING`
   - `'RHYTHM_DRAGGING_HESITATION'` ← `DRAGGING_HESITATION`
   - `'CHORD_FINGER_TENSION'` ← `CHORD_TRANSITION_STALL`
   - `'HAND_COORDINATION_LAG'` ← `TWO_HAND_DESYNC`
