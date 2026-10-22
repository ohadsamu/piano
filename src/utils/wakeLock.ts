/**
 * Manages Screen Wake Lock API (`navigator.wakeLock`) so a smartphone or tablet
 * resting on an electric piano's music stand never dims or locks while practicing.
 * Also configures iOS 17+ `navigator.audioSession` for simultaneous mic + audio.
 */

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
}

let activeWakeLock: WakeLockSentinelLike | null = null;

export async function requestMusicStandWakeLock(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;

  // Configure iOS 17+ audioSession so physical silent switch doesn't mute metronome/accompaniment while mic is active
  try {
    const navWithAudioSession = navigator as Navigator & {
      audioSession?: { type: string };
    };
    if (navWithAudioSession.audioSession) {
      navWithAudioSession.audioSession.type = 'play-and-record';
    }
  } catch {
    // Ignore on browsers without audioSession
  }

  try {
    const navWithWakeLock = navigator as Navigator & {
      wakeLock?: {
        request: (type: 'screen') => Promise<WakeLockSentinelLike>;
      };
    };
    if (!navWithWakeLock.wakeLock) return false;
    if (activeWakeLock && !activeWakeLock.released) return true;

    activeWakeLock = await navWithWakeLock.wakeLock.request('screen');
    return true;
  } catch {
    return false;
  }
}

export async function releaseMusicStandWakeLock(): Promise<void> {
  if (!activeWakeLock) return;
  try {
    await activeWakeLock.release();
  } catch {
    // Ignore release errors
  } finally {
    activeWakeLock = null;
  }
}
