import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CoachDiagnosisReport,
  Hand,
  LessonStep,
  LiveMicTelemetry,
  MidiDeviceInfo,
  MistakeCategory,
  NoteInputEvent,
  PracticeMode,
  PracticeSessionSnapshot,
  RemediationPlan,
  VisualizerMode,
} from './types';
import {
  CURRICULUM_LESSONS,
  DAILY_WORKOUTS,
  SONG_LIBRARY,
  VIDEO_LESSONS,
  getLessonById,
  getVideoById,
} from './data';
import { sharedAudioEngine } from './engines/AudioEngine';
import { sharedInputManager } from './engines/InputManager';
import { PracticeEngine } from './engines/PracticeEngine';
import { CoachDiagnosisEngine } from './engines/CoachDiagnosisEngine';
import {
  loadUserProfile,
  saveUserProfile,
  type PersistedUserProfile,
} from './utils/storage';
import { TopNavigation, type StudioTab } from './components/layout/TopNavigation';
import { CurriculumMapView } from './components/views/CurriculumMapView';
import { PracticeStudioView } from './components/views/PracticeStudioView';
import { VideoAcademyView } from './components/views/VideoAcademyView';
import { WorkoutsView } from './components/views/WorkoutsView';
import { InputSetupModal } from './components/views/InputSetupModal';
import { FixMeModal } from './components/coaching/FixMeModal';
import { VideoCoachDrawer } from './components/video/VideoCoachDrawer';

const coachEngine = new CoachDiagnosisEngine();

function mapStepTypeToPracticeMode(step: LessonStep): PracticeMode {
  switch (step.type) {
    case 'key_discovery':
      return 'key_discovery';
    case 'wait_mode':
      return 'wait_mode';
    case 'slow_flow':
      return 'slow_practice';
    case 'stage_performance':
      return 'performance';
    case 'video_intro':
    default:
      return 'wait_mode';
  }
}

export const App: React.FC = () => {
  const [profile, setProfile] = useState<PersistedUserProfile>(() =>
    loadUserProfile()
  );
  const [activeTab, setActiveTab] = useState<StudioTab>('stage');
  const [activeLessonId, setActiveLessonId] = useState<string>(
    profile.activeLessonId || CURRICULUM_LESSONS[0].id
  );
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string>(
    DAILY_WORKOUTS[0]?.id ?? 'workout-flashcard-sprint'
  );
  const [activeStepIndex, setActiveStepIndex] = useState<number>(2);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('both');
  // Modals & Drawers
  const [isInputSetupOpen, setIsInputSetupOpen] = useState(false);
  const [isFixMeModalOpen, setIsFixMeModalOpen] = useState(false);
  const [videoDrawerState, setVideoDrawerState] = useState<{
    isOpen: boolean;
    videoId: string | null;
  }>({ isOpen: false, videoId: null });

  // Input telemetry
  const [micTelemetry, setMicTelemetry] = useState<LiveMicTelemetry>(() =>
    sharedInputManager.getMicTelemetry()
  );
  const [midiDevices, setMidiDevices] = useState<MidiDeviceInfo[]>([]);
  const [lastNoteInput, setLastNoteInput] = useState<NoteInputEvent | null>(null);
  const [currentlyHeldMidis, setCurrentlyHeldMidis] = useState<number[]>([]);

  // Active lesson & score resolution
  const activeLesson = useMemo(
    () => getLessonById(activeLessonId),
    [activeLessonId]
  );
  const activeSong = useMemo(
    () => (activeSongId ? SONG_LIBRARY.find((s) => s.id === activeSongId) ?? null : null),
    [activeSongId]
  );
  const activeScore = activeSong ? activeSong.score : activeLesson.score;

  // Diagnosis report state
  const [diagnosisReport, setDiagnosisReport] =
    useState<CoachDiagnosisReport | null>(
      () => profile.lessonProgress[activeLesson.id]?.lastDiagnosis ?? null
    );

  // PracticeEngine instance ref
  const practiceEngineRef = useRef<PracticeEngine | null>(null);
  if (!practiceEngineRef.current) {
    const initialStep = activeLesson.steps[activeStepIndex] ?? activeLesson.steps[2];
    practiceEngineRef.current = new PracticeEngine(
      activeScore,
      sharedAudioEngine
    );
    practiceEngineRef.current.startPractice(
      mapStepTypeToPracticeMode(initialStep),
      {
        lessonStep: initialStep,
        AutoStart: true,
      }
    );
  }

  const [snapshot, setSnapshot] = useState<PracticeSessionSnapshot>(() =>
    practiceEngineRef.current!.getSnapshot()
  );

  // Persist user profile changes
  useEffect(() => {
    saveUserProfile(profile);
  }, [profile]);

  // Subscribe to PracticeEngine snapshot & session completion
  useEffect(() => {
    const engine = practiceEngineRef.current!;
    engine.setCallbacks({
      onSessionComplete: (attempts, snap) => {
        const currentScore = engine.getScore();
        const report = coachEngine.analyzeSession(
          currentScore,
          attempts,
          snap.mode
        );
        if (snap.mode !== 'auto_demo') {
          setDiagnosisReport(report);
        }

        // Update user profile progress & XP only for curriculum lessons (not Song Library or Auto-Demo)
        if (!activeSongId && snap.mode !== 'auto_demo') {
          setProfile((prev) => {
            const existing = prev.lessonProgress[activeLesson.id] ?? {
              lessonId: activeLesson.id,
              completedStepNumbers: [],
              starsEarned: 0,
              bestAccuracyPct: 0,
              attemptsCount: 0,
              lastPlayedIso: new Date().toISOString(),
            };
            const currentStepNum =
              activeLesson.steps[activeStepIndex]?.stepNumber ?? 3;
            const nextCompletedSteps = Array.from(
              new Set([...existing.completedStepNumbers, currentStepNum])
            ).sort((a, b) => a - b);

            return {
              ...prev,
              xp: prev.xp + (report.starsEarned > 0 ? report.starsEarned * 40 : 25),
              lessonProgress: {
                ...prev.lessonProgress,
                [activeLesson.id]: {
                  ...existing,
                  completedStepNumbers: nextCompletedSteps,
                  starsEarned: Math.max(
                    existing.starsEarned,
                    report.starsEarned
                  ) as 0 | 1 | 2 | 3,
                  bestAccuracyPct: Math.max(
                    existing.bestAccuracyPct,
                    report.overallAccuracyPct
                  ),
                  attemptsCount: existing.attemptsCount + 1,
                  lastPlayedIso: new Date().toISOString(),
                  lastDiagnosis: report,
                },
              },
            };
          });
        }
        if (
          snap.mode === 'performance' ||
          (snap.mode === 'slow_practice' && report.troubleMeasures.length > 0)
        ) {
          setIsFixMeModalOpen(true);
        }
      },
    });

    const unsub = engine.subscribe((newSnap) => {
      setSnapshot(newSnap);
      sharedInputManager.setExpectedTargetMidis(newSnap.activeTargetMidis);
    });
    return unsub;
  }, [activeLesson, activeStepIndex, activeSongId]);
  // High-precision requestAnimationFrame clock for PracticeEngine
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const deltaMs = Math.min(100, Math.max(0, now - lastTime));
      lastTime = now;
      practiceEngineRef.current?.tick(deltaMs);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Connect InputManager (Microphone, Web MIDI, QWERTY, Virtual Keyboard)
  useEffect(() => {
    sharedInputManager.startDefaultInputs();
    sharedInputManager.updateMicCalibration(profile.micCalibration);

    const unsubNote = sharedInputManager.onNoteEvent((event) => {
      setLastNoteInput(event);
      setCurrentlyHeldMidis((prev) => {
        if (event.type === 'note_on') {
          return prev.includes(event.midi) ? prev : [...prev, event.midi];
        }
        return prev.filter((m) => m !== event.midi);
      });
      practiceEngineRef.current?.handleNoteInput(event);
    });

    const unsubMic = sharedInputManager.onMicTelemetry((tel) => {
      setMicTelemetry(tel);
    });

    const unsubMidi = sharedInputManager.onMidiDevicesChanged((devs) => {
      setMidiDevices(devs);
    });

    return () => {
      unsubNote();
      unsubMic();
      unsubMidi();
    };
  }, []);

  // Helper to load a lesson and step into PracticeEngine
  const handleSelectLesson = useCallback(
    (lessonId: string, stepIndex = 2) => {
      const targetLesson = getLessonById(lessonId);
      const clampedStepIdx = Math.max(
        0,
        Math.min(targetLesson.steps.length - 1, stepIndex)
      );
      const step = targetLesson.steps[clampedStepIdx];

      setActiveSongId(null);
      setActiveLessonId(targetLesson.id);
      setActiveStepIndex(clampedStepIdx);
      setActiveTab('stage');

      setProfile((prev) => {
        setDiagnosisReport(
          prev.lessonProgress[targetLesson.id]?.lastDiagnosis ?? null
        );
        return {
          ...prev,
          activeLessonId: targetLesson.id,
        };
      });

      const engine = practiceEngineRef.current!;
      const mode = mapStepTypeToPracticeMode(step);
      engine.loadScore(targetLesson.score, {
        mode,
        lessonStep: step,
      });
      if (step.type !== 'video_intro') {
        engine.resume();
      }
    },
    []
  );

  const handleSelectStep = useCallback(
    (stepIndex: number) => {
      const clamped = Math.max(
        0,
        Math.min(activeLesson.steps.length - 1, stepIndex)
      );
      const step = activeLesson.steps[clamped];
      setActiveStepIndex(clamped);

      const engine = practiceEngineRef.current!;
      const mode = mapStepTypeToPracticeMode(step);
      engine.startPractice(mode, {
        lessonStep: step,
        AutoStart: step.type !== 'video_intro',
      });
    },
    [activeLesson]
  );

  const handleAdvanceNextStep = useCallback(() => {
    const currentStepNum =
      activeLesson.steps[activeStepIndex]?.stepNumber ?? 1;
    setProfile((prev) => {
      const existing = prev.lessonProgress[activeLesson.id] ?? {
        lessonId: activeLesson.id,
        completedStepNumbers: [],
        starsEarned: 0,
        bestAccuracyPct: 0,
        attemptsCount: 0,
        lastPlayedIso: new Date().toISOString(),
      };
      return {
        ...prev,
        xp: prev.xp + 30,
        lessonProgress: {
          ...prev.lessonProgress,
          [activeLesson.id]: {
            ...existing,
            completedStepNumbers: Array.from(
              new Set([...existing.completedStepNumbers, currentStepNum])
            ),
          },
        },
      };
    });

    if (activeStepIndex + 1 < activeLesson.steps.length) {
      handleSelectStep(activeStepIndex + 1);
    }
  }, [activeLesson, activeStepIndex, handleSelectStep]);

  const handleSelectSong = useCallback(
    (songId: string | null) => {
      setActiveSongId(songId);
      const engine = practiceEngineRef.current!;
      if (!songId) {
        const step = activeLesson.steps[activeStepIndex] ?? activeLesson.steps[2];
        const mode = mapStepTypeToPracticeMode(step);
        engine.loadScore(activeLesson.score, { mode, lessonStep: step });
        engine.startPractice(mode, { lessonStep: step, AutoStart: true });
      } else {
        const song = SONG_LIBRARY.find((s) => s.id === songId);
        if (song) {
          engine.loadScore(song.score, { mode: 'wait_mode' });
          engine.startPractice('wait_mode', {
            tempoMultiplier: 1.0,
            handFilter: 'both',
            loopRange: null,
            AutoStart: true,
          });
        }
      }
    },
    [activeLesson, activeStepIndex]
  );

  const handleToggleMic = useCallback(async () => {
    if (sharedInputManager.isMicrophoneActive()) {
      sharedInputManager.disableMicrophone();
    } else {
      await sharedInputManager.enableMicrophone();
    }
  }, []);

  const handleOpenFixMeModal = useCallback(() => {
    const engine = practiceEngineRef.current!;
    const attempts = engine.getAttemptRecords();
    const hasPlayed = attempts.some(
      (a) => a.status !== 'missed' || a.wrongMidisPlayed.length > 0
    );

    if (hasPlayed) {
      const report = coachEngine.analyzeSession(
        engine.getScore(),
        attempts,
        snapshot.mode
      );
      setDiagnosisReport(report);
    } else if (!diagnosisReport) {
      const demo = coachEngine.createSyntheticMistakeDemo(engine.getScore());
      setDiagnosisReport(demo.report);
    }
    setIsFixMeModalOpen(true);
  }, [diagnosisReport, snapshot.mode]);

  const handleSimulateMistakeDemo = useCallback(() => {
    const engine = practiceEngineRef.current!;
    const demo = coachEngine.createSyntheticMistakeDemo(engine.getScore());
    setDiagnosisReport(demo.report);
    setIsFixMeModalOpen(true);
  }, []);

  const handleStartRemediationPlan = useCallback((plan: RemediationPlan) => {
    setIsFixMeModalOpen(false);
    setActiveTab('stage');
    if (activeStepIndex === 0) {
      setActiveStepIndex(2);
    }
    practiceEngineRef.current?.startRemediationPlan(plan);
  }, [activeStepIndex]);

  const handleMarkVideoWatched = useCallback((videoId: string) => {
    setProfile((prev) => ({
      ...prev,
      xp: prev.xp + 40,
      watchedVideoIds: Array.from(new Set([...prev.watchedVideoIds, videoId])),
    }));
  }, []);

  // Total stars calculation
  const totalStars = useMemo(() => {
    return Object.values(profile.lessonProgress).reduce(
      (acc, r) => acc + (r.starsEarned ?? 0),
      0
    );
  }, [profile.lessonProgress]);

  const recentMistakes = useMemo<MistakeCategory[]>(() => {
    if (!diagnosisReport) return [];
    return diagnosisReport.detectedIssues.map((i) => i.category);
  }, [diagnosisReport]);

  const recommendedVideos = useMemo(() => {
    if (diagnosisReport && diagnosisReport.recommendedVideos.length > 0) {
      const vids = diagnosisReport.recommendedVideos
        .map((id) => getVideoById(id))
        .filter((v): v is NonNullable<typeof v> => Boolean(v));
      if (vids.length > 0) return vids;
    }
    const primary = getVideoById(activeLesson.primaryVideoId);
    const remedials = activeLesson.remedialVideoIds
      .map((id) => getVideoById(id))
      .filter((v): v is NonNullable<typeof v> => Boolean(v));
    return [primary, ...remedials, ...VIDEO_LESSONS].filter(
      (v, i, arr): v is NonNullable<typeof v> =>
        Boolean(v) && arr.findIndex((x) => x?.id === v?.id) === i
    );
  }, [activeLesson, diagnosisReport]);

  const activeVideoForLesson = useMemo(() => {
    const stepVidId = activeLesson.steps[activeStepIndex]?.videoId;
    return (
      getVideoById(stepVidId || activeLesson.primaryVideoId) ?? VIDEO_LESSONS[0]
    );
  }, [activeLesson, activeStepIndex]);

  return (
    <div className="min-h-screen bg-[#0D0F14] text-[#F5F2EB] flex flex-col">
      {/* Top Studio Navigation */}
      <TopNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        micActive={micTelemetry.active}
        micTelemetry={micTelemetry}
        midiDevices={midiDevices}
        onToggleMic={handleToggleMic}
        onOpenInputSetup={() => setIsInputSetupOpen(true)}
        onQuickTestNote={() => {
          sharedAudioEngine.init().then(() => {
            sharedAudioEngine.playNote(60, 0.85, 0.8);
          });
        }}
        streakDays={profile.streakDays}
        xp={profile.xp}
        totalStars={totalStars}
        maxStars={CURRICULUM_LESSONS.length * 3}
        unwatchedRecommendedVideosCount={
          recommendedVideos.filter(
            (v) => !profile.watchedVideoIds.includes(v.id)
          ).length
        }
      />

      {/* Main View Content */}
      <main className="flex-1">
        {activeTab === 'curriculum' && (
          <CurriculumMapView
            lessons={CURRICULUM_LESSONS}
            activeLessonId={activeLesson.id}
            lessonProgress={profile.lessonProgress}
            recommendedVideos={recommendedVideos}
            watchedVideoIds={profile.watchedVideoIds}
            workouts={DAILY_WORKOUTS}
            currentlyHeldMidis={currentlyHeldMidis}
            onVirtualNoteOn={(midi, velocity) => {
              sharedAudioEngine.init();
              sharedInputManager.triggerVirtualNoteOn(midi, velocity);
            }}
            onVirtualNoteOff={(midi) => {
              sharedInputManager.triggerVirtualNoteOff(midi);
            }}
            onSelectLesson={(lessonId, stepIdx) =>
              handleSelectLesson(lessonId, stepIdx ?? 0)
            }
            onOpenVideo={(vidId) =>
              setVideoDrawerState({ isOpen: true, videoId: vidId })
            }
            onOpenWorkout={(workoutId) => {
              setActiveWorkoutId(workoutId);
              setActiveTab('workouts');
            }}
          />
        )}

        {activeTab === 'stage' && (
          <PracticeStudioView
            lessons={CURRICULUM_LESSONS}
            songs={SONG_LIBRARY}
            activeLesson={activeLesson}
            activeSongId={activeSongId}
            activeStepIndex={activeStepIndex}
            completedStepNumbers={
              profile.lessonProgress[activeLesson.id]?.completedStepNumbers ?? []
            }
            snapshot={snapshot}
            visualizerMode={visualizerMode}
            diagnosisReport={diagnosisReport}
            activeVideo={activeVideoForLesson}
            lastNoteInput={lastNoteInput}
            onSelectLesson={handleSelectLesson}
            onSelectSong={handleSelectSong}
            onSelectStep={handleSelectStep}
            onAdvanceNextStep={handleAdvanceNextStep}
            onChangeMode={(mode) => {
              practiceEngineRef.current?.startPractice(mode, { AutoStart: true });
            }}
            onChangeVisualizerMode={setVisualizerMode}
            onStartOrResume={() => {
              sharedAudioEngine.init();
              practiceEngineRef.current?.resume();
            }}
            onPause={() => practiceEngineRef.current?.pause()}
            onRestart={() => {
              practiceEngineRef.current?.startPractice(snapshot.mode, {
                AutoStart: true,
              });
            }}
            onChangeTempoMultiplier={(mult) =>
              practiceEngineRef.current?.setTempoMultiplier(mult)
            }
            onChangeHandFilter={(hand) =>
              practiceEngineRef.current?.setHandFilter(hand)
            }
            onSetLoopRange={(range) =>
              practiceEngineRef.current?.setLoopRange(range)
            }
            onToggleMetronome={() =>
              practiceEngineRef.current?.setMetronomeEnabled(
                !snapshot.metronomeEnabled
              )
            }
            onToggleAccompaniment={() =>
              practiceEngineRef.current?.setAccompanimentEnabled(
                !snapshot.accompanimentEnabled
              )
            }
            onToggleShowNoteNames={() =>
              practiceEngineRef.current?.setShowNoteNames(
                !snapshot.showNoteNames
              )
            }
            onToggleShowOverheadHands={() =>
              practiceEngineRef.current?.setShowOverheadHands(
                !snapshot.showOverheadHands
              )
            }
            onVirtualNoteOn={(midi, velocity) => {
              sharedAudioEngine.init();
              sharedInputManager.triggerVirtualNoteOn(midi, velocity);
            }}
            onVirtualNoteOff={(midi) => {
              sharedInputManager.triggerVirtualNoteOff(midi);
            }}
            onPlayNote={(midi, velocity = 0.8, durationSec = 0.65) => {
              sharedAudioEngine.init().then(() => {
                sharedAudioEngine.playNote(midi, velocity, durationSec);
              });
            }}
            onPlayChord={(midis, velocity = 0.8, durationSec = 0.85) => {
              sharedAudioEngine.init().then(() => {
                sharedAudioEngine.playChord(midis, velocity, durationSec);
              });
            }}
            onOpenFixMeModal={handleOpenFixMeModal}
            onSimulateMistakeDemo={handleSimulateMistakeDemo}
            onOpenVideoDrawer={(vidId) =>
              setVideoDrawerState({
                isOpen: true,
                videoId: vidId ?? activeLesson.primaryVideoId,
              })
            }
            onStartRemediationPlan={handleStartRemediationPlan}
          />
        )}

        {activeTab === 'videos' && (
          <VideoAcademyView
            videos={VIDEO_LESSONS}
            initialVideoId={
              videoDrawerState.videoId ?? activeLesson.primaryVideoId
            }
            watchedVideoIds={profile.watchedVideoIds}
            recentMistakes={recentMistakes}
            onMarkVideoWatched={handleMarkVideoWatched}
            onPlayNote={(midi, velocity = 0.8, durationSec = 0.65) => {
              sharedAudioEngine.init().then(() => {
                sharedAudioEngine.playNote(midi, velocity, durationSec);
              });
            }}
            onPlayChord={(midis, velocity = 0.8, durationSec = 0.85) => {
              sharedAudioEngine.init().then(() => {
                sharedAudioEngine.playChord(midis, velocity, durationSec);
              });
            }}
            lastNoteInput={lastNoteInput}
            currentlyHeldMidis={currentlyHeldMidis}
          />
        )}

        {activeTab === 'workouts' && (
          <WorkoutsView
            workouts={DAILY_WORKOUTS}
            initialWorkoutId={activeWorkoutId}
            onPlayNote={(midi, velocity = 0.8, durationSec = 0.65) => {
              sharedAudioEngine.init().then(() => {
                sharedAudioEngine.playNote(midi, velocity, durationSec);
              });
            }}
            onPlayChord={(midis, velocity = 0.8, durationSec = 0.85) => {
              sharedAudioEngine.init().then(() => {
                sharedAudioEngine.playChord(midis, velocity, durationSec);
              });
            }}
            onVirtualNoteOn={(midi, velocity) => {
              sharedAudioEngine.init();
              sharedInputManager.triggerVirtualNoteOn(midi, velocity);
            }}
            onVirtualNoteOff={(midi) => {
              sharedInputManager.triggerVirtualNoteOff(midi);
            }}
            lastNoteInput={lastNoteInput}
            currentlyHeldMidis={currentlyHeldMidis}
            onWorkoutCompleted={(workoutId, earnedXp) => {
              setProfile((prev) => ({
                ...prev,
                xp: prev.xp + earnedXp,
                completedWorkoutCounts: {
                  ...prev.completedWorkoutCounts,
                  [workoutId]: (prev.completedWorkoutCounts[workoutId] ?? 0) + 1,
                },
              }));
            }}
          />
        )}
      </main>

      {/* "Identify My Play & Fix Me" Diagnostic Coach Modal */}
      <FixMeModal
        isOpen={isFixMeModalOpen}
        report={diagnosisReport}
        videos={VIDEO_LESSONS}
        onClose={() => setIsFixMeModalOpen(false)}
        onStartRemediation={handleStartRemediationPlan}
        onWatchVideo={(videoId) => {
          setIsFixMeModalOpen(false);
          setVideoDrawerState({ isOpen: true, videoId });
        }}
        onLoopMeasure={(measureIdx) => {
          setIsFixMeModalOpen(false);
          setActiveTab('stage');
          practiceEngineRef.current?.setLoopRange([measureIdx, measureIdx]);
          practiceEngineRef.current?.startPractice('wait_mode', {
            loopRange: [measureIdx, measureIdx],
            AutoStart: true,
          });
        }}
        onRetrySong={() => {
          setIsFixMeModalOpen(false);
          practiceEngineRef.current?.startPractice(snapshot.mode, {
            AutoStart: true,
          });
        }}
      />

      {/* Contextual Video Coach Slide-Over Drawer */}
      <VideoCoachDrawer
        isOpen={videoDrawerState.isOpen}
        videos={VIDEO_LESSONS}
        activeVideoId={videoDrawerState.videoId ?? activeLesson.primaryVideoId}
        recommendedVideoIds={recommendedVideos.map((v) => v.id)}
        detectedMistakeCategories={recentMistakes}
        currentLessonId={activeLesson.id}
        completedVideoIds={profile.watchedVideoIds}
        currentlyHeldMidis={currentlyHeldMidis}
        onSelectVideo={(vidId) =>
          setVideoDrawerState({ isOpen: true, videoId: vidId })
        }
        onCompleteVideo={(vidId) => handleMarkVideoWatched(vidId)}
        onPlayNote={(midi, velocity = 0.8) => {
          sharedAudioEngine.init().then(() => {
            sharedAudioEngine.playNote(midi, velocity, 0.65);
          });
        }}
        onClose={() => setVideoDrawerState({ isOpen: false, videoId: null })}
      />

      {/* Microphone / MIDI / QWERTY Setup & Calibration Modal */}
      <InputSetupModal
        isOpen={isInputSetupOpen}
        onClose={() => setIsInputSetupOpen(false)}
        micActive={micTelemetry.active}
        micTelemetry={micTelemetry}
        micConfig={sharedInputManager.getMicCalibration()}
        onToggleMic={handleToggleMic}
        onUpdateMicConfig={(cfg) => {
          sharedInputManager.updateMicCalibration(cfg);
          setProfile((prev) => ({
            ...prev,
            micCalibration: {
              ...prev.micCalibration,
              ...cfg,
            },
          }));
        }}
        onCalibrateNoiseFloor={() => sharedInputManager.calibrateMicrophone(900)}
        midiDevices={midiDevices}
        onRefreshMidi={() => {
          sharedInputManager.initMidi();
        }}
        onTestNote={(midi) => {
          sharedAudioEngine.init().then(() => {
            sharedAudioEngine.playNote(midi, 0.85, 0.8);
          });
        }}
      />
    </div>
  );
};

export default App;
