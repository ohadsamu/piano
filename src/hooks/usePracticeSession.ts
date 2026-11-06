import { useEffect, useRef, useState } from 'react';
import type { NoteAttemptRecord, PracticeSessionSnapshot } from '../types';
import { PracticeEngine } from '../engines/PracticeEngine';
import { sharedAudioEngine } from '../engines/AudioEngine';
import { sharedInputManager } from '../engines/InputManager';

export interface PracticeSessionOptions {
  onComplete(attempts: NoteAttemptRecord[], snap: PracticeSessionSnapshot): void;
}

/**
 * Owns the single PracticeEngine, its rAF clock and snapshot subscription.
 * Engine callbacks are bound once; the latest onComplete is read from a ref.
 */
export function usePracticeSession(opts: PracticeSessionOptions) {
  const engineRef = useRef<PracticeEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new PracticeEngine(undefined, sharedAudioEngine);
    // The hand guide picture is opt-in (Settings).
    engineRef.current.setShowOverheadHands(false);
  }
  const engine = engineRef.current;

  const onCompleteRef = useRef(opts.onComplete);
  onCompleteRef.current = opts.onComplete;

  const [snapshot, setSnapshot] = useState<PracticeSessionSnapshot>(() => engine.getSnapshot());
  const snapshotRef = useRef(snapshot);

  useEffect(() => {
    engine.setCallbacks({
      onSessionComplete: (attempts, snap) => onCompleteRef.current(attempts, snap),
    });
    const unsub = engine.subscribe((next) => {
      snapshotRef.current = next;
      setSnapshot(next);
      sharedInputManager.setExpectedTargetMidis(next.activeTargetMidis);
    });
    return unsub;
  }, [engine]);

  useEffect(() => {
    let rafId = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const delta = Math.min(100, Math.max(0, now - last));
      last = now;
      engine.tick(delta);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [engine]);

  return { engine, snapshot, snapshotRef };
}
