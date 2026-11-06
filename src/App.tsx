import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CoachDiagnosisReport } from './types';
import { CURRICULUM_LESSONS, DAILY_WORKOUTS, SONG_LIBRARY, VIDEO_LESSONS, getLessonById, getVideoById } from './data';
import { sharedAudioEngine } from './engines/AudioEngine';
import { sharedInputManager } from './engines/InputManager';
import { useProfile } from './hooks/useProfile';
import { usePracticeSession } from './hooks/usePracticeSession';
import { useNoteInputs } from './hooks/useNoteInputs';
import { useLessonFlow, selectionKey, type LessonFlow } from './hooks/useLessonFlow';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useHashRoute, routeToSelection } from './hooks/useHashRoute';
import { useStepCompletion } from './hooks/useStepCompletion';
import { usePracticeController, shouldAutoStartFor, type SheetName } from './hooks/usePracticeController';
import type { Selection } from './components/practice/types';
import { COPY } from './components/copy';
import { AppHeader } from './components/shell/AppHeader';
import { InputStatusChip } from './components/shell/InputStatusChip';
import { HomeScreen } from './components/home/HomeScreen';
import { PracticeScreen } from './components/practice/PracticeScreen';
import { SettingsSheet } from './components/practice/SettingsSheet';
import { IntroVideoSheet } from './components/practice/IntroVideoSheet';
import { WorkoutsView } from './components/views/WorkoutsView';
import { InputSheet } from './components/input/InputSheet';
import { WorkTipsSheet } from './components/practice/WorkTipsSheet';

const playNote = (midi: number, velocity = 0.8, durationSec = 0.65) =>
  void sharedAudioEngine.init().then(() => sharedAudioEngine.playNote(midi, velocity, durationSec));
const playChord = (midis: number[], velocity = 0.8, durationSec = 0.85) =>
  void sharedAudioEngine.init().then(() => sharedAudioEngine.playChord(midis, velocity, durationSec));

export const App: React.FC = () => {
  const profileApi = useProfile();
  const { profile } = profileApi;
  const [route, setRoute] = useHashRoute();
  const routeSelection = routeToSelection(route);
  const [lastSelection, setLastSelection] = useState<Selection>(
    () => routeSelection ?? { kind: 'lesson', lessonId: getLessonById(profile.activeLessonId).id, stepIndex: 0 }
  );
  const selection = routeSelection ?? lastSelection;
  const inPractice = routeSelection !== null;
  const [sheet, setSheet] = useState<SheetName>(null);
  const [tipVideoId, setTipVideoId] = useState<string | null>(null);
  const [report, setReport] = useState<CoachDiagnosisReport | null>(null);
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');

  const flowRef = useRef<LessonFlow | null>(null);
  const key = selectionKey(selection);
  const completion = useStepCompletion(profileApi, flowRef, key, setReport);

  const { engine, snapshot } = usePracticeSession({ onComplete: completion.onComplete });
  const inputs = useNoteInputs(engine, {
    initialMicCalibration: profile.micCalibration,
    shouldAutoStart: (snap) => inPractice && shouldAutoStartFor(flowRef.current, snap),
  });

  const navigate = useCallback(
    (target: Selection | 'home') => {
      setSheet(null);
      if (target === 'home') return setRoute({ name: 'home' });
      if (target.kind === 'song') return setRoute({ name: 'song', songId: target.songId });
      const lesson = getLessonById(target.lessonId);
      const stepNumber = lesson.steps[target.stepIndex]?.stepNumber ?? 1;
      // Moving between steps replaces history, so the phone's Back button leaves the player.
      setRoute({ name: 'lesson', lessonId: lesson.id, stepNumber }, { replace: route.name === 'lesson' });
    },
    [setRoute, route.name]
  );
  const goHome = useCallback(() => navigate('home'), [navigate]);

  const flow = useLessonFlow(engine, selection, profileApi, navigate);
  flowRef.current = flow;
  const ctl = usePracticeController({ engine, snapshot, flow, inputs, profileApi, report, openSheet: setSheet, goHome });

  // Entering / leaving the player.
  const prevRef = useRef({ inPractice, key });
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = { inPractice, key };
    if (!inPractice) {
      ctl.cancelCountIn();
      engine.pause();
      return;
    }
    if (routeSelection) setLastSelection(routeSelection);
    if (!prev.inPractice || prev.key !== key) {
      if (selection.kind === 'lesson') {
        profileApi.setActiveLesson(selection.lessonId);
        setReport(profile.lessonProgress[selection.lessonId]?.lastDiagnosis ?? null);
      } else setReport(null);
      if (!prev.inPractice && prev.key === key) flow.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inPractice, key]);

  const lesson = flow.lesson ?? getLessonById(profile.activeLessonId);
  const { results, nextLabel } = completion.resultsFor(flow);
  const introVideo = getVideoById(tipVideoId ?? (flow.step?.videoId || lesson.primaryVideoId)) ?? null;
  const preferred = profile.preferredInput;
  const inputHint =
    preferred === 'mic' || preferred === 'midi' ? 'piano' : preferred === 'qwerty' || (!preferred && finePointer) ? 'qwerty' : 'none';
  const chip = (
    <InputStatusChip preferredInput={preferred} midiDevices={inputs.midiDevices} micTelemetry={inputs.micTelemetry} onOpen={() => setSheet('input')} />
  );

  return (
    <div className="h-[100dvh] bg-ebony-lacquer text-ink-primary flex flex-col overflow-hidden">
      {route.name === 'home' && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AppHeader right={chip} />
          <HomeScreen
            lessons={CURRICULUM_LESSONS}
            songs={SONG_LIBRARY}
            progress={profile.lessonProgress}
            activeLessonId={profile.activeLessonId}
            onOpenLesson={(lessonId, stepIndex) => navigate({ kind: 'lesson', lessonId, stepIndex })}
            onOpenSong={(songId) => navigate({ kind: 'song', songId })}
            onOpenDrills={() => setRoute({ name: 'drills' })}
          />
        </div>
      )}
      {route.name === 'drills' && (
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <AppHeader title={COPY.quickDrills} onBack={goHome} right={chip} />
          <WorkoutsView
            workouts={DAILY_WORKOUTS}
            onPlayNote={playNote}
            onPlayChord={playChord}
            onVirtualNoteOn={inputs.pressKey}
            onVirtualNoteOff={inputs.releaseKey}
            lastNoteInput={inputs.lastNote}
            currentlyHeldMidis={inputs.heldMidis}
            onWorkoutCompleted={profileApi.recordWorkout}
            showQwertyLabels={finePointer || preferred === 'qwerty'}
          />
        </div>
      )}
      {inPractice && (
        <div className="flex-1 min-h-0">
          <PracticeScreen
            title={flow.song?.title ?? lesson.title}
            steps={flow.lesson?.steps}
            stepIndex={flow.stepIndex}
            completedSteps={profile.lessonProgress[lesson.id]?.completedStepNumbers ?? []}
            step={flow.step}
            snapshot={snapshot}
            score={flow.score}
            timed={ctl.timed}
            results={results}
            troubleMeasures={report?.troubleMeasures ?? []}
            introVideo={getVideoById(flow.step?.videoId || lesson.primaryVideoId) ?? null}
            introNextLabel={nextLabel}
            heldMidis={inputs.heldMidis}
            inputHint={inputHint}
            showQwertyLabels={finePointer || preferred === 'qwerty'}
            showMeActive={ctl.showMeActive}
            countIn={ctl.countIn}
            focusNonce={ctl.focusNonce}
            showFalling={!!profile.showFalling}
            headerExtra={<div className="hidden md:flex">{chip}</div>}
            on={{ ...ctl.handlers, openIntroVideo: () => (setTipVideoId(null), setSheet('intro')) }}
          />
        </div>
      )}

      <SettingsSheet
        open={sheet === 'settings'}
        snapshot={snapshot}
        showFalling={!!profile.showFalling}
        canSkipStep={!!flow.lesson}
        onClose={() => setSheet(null)}
        on={ctl.settings}
      />
      <IntroVideoSheet
        open={sheet === 'intro'}
        video={introVideo}
        heldMidis={inputs.heldMidis}
        lastNote={inputs.lastNote}
        onClose={() => setSheet(null)}
        onWatched={profileApi.markVideoWatched}
        onPlayNote={playNote}
        onPlayChord={playChord}
        onKeyDown={inputs.pressKey}
        onKeyUp={inputs.releaseKey}
      />
      <WorkTipsSheet
        open={sheet === 'tips'}
        report={report}
        videos={VIDEO_LESSONS}
        onClose={() => setSheet(null)}
        onPractise={(m) => flow.practiseBar(m, report)}
        onWatch={(id) => {
          setTipVideoId(id);
          setSheet('intro');
        }}
      />
      <InputSheet
        open={sheet === 'input'}
        preferredInput={preferred}
        micTelemetry={inputs.micTelemetry}
        micStatus={inputs.micStatus}
        micConfig={profile.micCalibration}
        midiDevices={inputs.midiDevices}
        midiSupported={sharedInputManager.isMidiSupported()}
        onClose={() => setSheet(null)}
        onChoose={profileApi.setPreferredInput}
        onToggleMic={inputs.toggleMic}
        onCalibrate={() => sharedInputManager.calibrateMicrophone(900)}
        onUpdateMicConfig={(cfg) => {
          sharedInputManager.updateMicCalibration(cfg);
          profileApi.setMicCalibration(cfg);
        }}
        onRetryMidi={() => void sharedInputManager.initMidi()}
        onTestNote={() => playNote(60, 0.85, 0.8)}
      />
    </div>
  );
};

export default App;
