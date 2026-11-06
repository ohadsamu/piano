# Nocturne & Ivory — Piano Studio

Beginner piano-learning web app. React 18 + Vite 5 + Tailwind 3 + TypeScript, no backend.
Live at https://ohadsamu.github.io/piano/ (GitHub Pages, deployed by `.github/workflows/deploy.yml` on every push to `main`).

## Commands

- `npm run dev`: dev server on :5173
- `npm test`: vitest (engines, data integrity, progress utils)
- `npm run build`: `tsc -b && vite build`. This is the type-check gate; run it before every push.
- `npx vite preview --port 4173`: serve the production bundle for browser QA

## Layout

- `src/App.tsx`: thin shell. It wires hooks to screens; keep it small.
- `src/hooks/`: all app state. `useHashRoute` (routes `#/`, `#/lesson/:id/:step`, `#/song/:id`, `#/drills`), `useProfile` (localStorage), `usePracticeSession` / `usePracticeController` / `useStepCompletion` (drive PracticeEngine), `useNoteInputs`, `useLessonFlow`.
- `src/components/`: `shell/` (header, sheets), `home/`, `practice/` (PracticeScreen, KeyboardDock, ProgressMeter, ...), `input/` (mic/MIDI sheet), `visualizers/` (staff, keyboard, falling notes).
- `src/components/copy.ts`: every user-facing label. Use plain language, no jargon.
- `src/engines/`: audio synthesis, mic pitch detection, MIDI/QWERTY input, PracticeEngine (scoring/progress), CoachDiagnosisEngine. UI-independent and unit-tested. The mic tuning (gain, gate, rumble filter) was tuned for a real e-piano; don't change it casually.
- `src/data/`: lessons, songs, drills, videos. `src/data/__tests__/dataIntegrity.test.ts` checks ids, MIDI range (48–83, the on-screen keyboard) and measure beats.
- Design docs: `docs/superpowers/specs/2026-11-06-ui-refactor-design.md` (current UI), `docs/specs/` (original pedagogy & architecture).

## Rules

- **Never stuck:** practice must be completable with no mic or MIDI. The on-screen keyboard stays visible during practice, QWERTY works (Q W E R T Y U = C4–B4, Z X C ... = C3 octave), and "Show me" / "Skip this note" escape hatches exist.
- **Truthful progress:** show the engine snapshot's `completedNoteCount` / `totalNoteCount` / `progressPct`. Only offer "Next" after a real completion, and don't mark skipped steps done.
- **PracticeEngine contract:** call `startPractice(mode, { lessonStep, AutoStart })` on every start or step change. Always pass `lessonStep` (or explicit tempo/hand/loop), or settings go stale. Completion fires `onSessionComplete` and sets `snapshot.isCompleted`. Run diagnosis only after completion. The UI owns advancing to the next step.
- **Mobile first:** 360px portrait is a first-class layout. No horizontal page scroll, touch targets ≥44px, respect safe-area insets.
- Keep `base: './'` in `vite.config.ts` (Pages subpath). Don't upgrade React/Vite/Tailwind as a side effect of other work.
- Song content must be public domain. All notes must sit within MIDI 48–83.
