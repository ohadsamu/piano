import type { PreferredInput } from './storage';

export interface MicAutoStartDeps {
  input: {
    enableMicrophone(): Promise<boolean>;
    disableMicrophone(): void;
    isMicrophoneActive(): boolean;
  };
  /** Creates/resumes the shared AudioContext. Browsers only allow this after a user gesture. */
  audio: { init(): Promise<void> };
  /** Where to listen for the first user gesture (window in the app). */
  target: EventTarget;
  /** Called after each automatic start attempt with whether the mic is now live. */
  onResult?(ok: boolean): void;
}

const GESTURES = ['pointerdown', 'keydown', 'touchstart'] as const;

/**
 * Keeps the microphone listening whenever it is the preferred input.
 *
 * Why the gesture hook: browsers start an AudioContext "suspended" until the user interacts
 * with the page. A mic started on page load is then connected to a silent graph and never
 * hears anything. So we try at once (works when permission was already granted), and again
 * on every user gesture until the mic is live and audio is running.
 */
export function createMicAutoStart(deps: MicAutoStartDeps) {
  let preferred: PreferredInput | undefined;
  let stoppedByUser = false;
  let starting: Promise<void> | null = null;

  const wanted = () => preferred === 'mic' && !stoppedByUser;

  const tryStart = (): Promise<void> => {
    if (!wanted()) return Promise.resolve();
    if (starting) return starting;
    starting = (async () => {
      try {
        if (!deps.input.isMicrophoneActive()) await deps.input.enableMicrophone();
        deps.onResult?.(deps.input.isMicrophoneActive());
      } catch {
        // Permission denied or no device: the UI shows the blocked state.
        deps.onResult?.(false);
      } finally {
        starting = null;
      }
    })();
    return starting;
  };

  const onGesture = () => {
    if (!wanted()) return;
    // Resume audio synchronously inside the gesture, then make sure the mic is on.
    void deps.audio.init().catch(() => {});
    void tryStart();
  };

  for (const g of GESTURES) deps.target.addEventListener(g, onGesture, { capture: true });

  return {
    setPreferred(next: PreferredInput) {
      const changed = next !== preferred;
      preferred = next;
      if (!changed) return;
      if (next === 'mic') {
        stoppedByUser = false;
        void tryStart();
      } else if (deps.input.isMicrophoneActive()) {
        deps.input.disableMicrophone();
      }
    },
    /** The user pressed "Turn off mic": respect it until they pick the mic again. */
    userStopped() {
      stoppedByUser = true;
    },
    userStarted() {
      stoppedByUser = false;
    },
    dispose() {
      for (const g of GESTURES) deps.target.removeEventListener(g, onGesture, { capture: true });
    },
  };
}
