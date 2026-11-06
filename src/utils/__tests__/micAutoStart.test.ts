import { describe, expect, it, vi } from 'vitest';
import { createMicAutoStart } from '../micAutoStart';
import { resolvePreferredInput } from '../storage';

function makeDeps(active = false) {
  let isActive = active;
  return {
    input: {
      enableMicrophone: vi.fn(async () => {
        isActive = true;
        return true;
      }),
      disableMicrophone: vi.fn(() => {
        isActive = false;
      }),
      isMicrophoneActive: () => isActive,
    },
    audio: { init: vi.fn(async () => {}) },
    target: new EventTarget(),
  };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('resolvePreferredInput', () => {
  it('defaults to the microphone when nothing was chosen', () => {
    expect(resolvePreferredInput(undefined)).toBe('mic');
  });
  it('keeps an explicit choice', () => {
    expect(resolvePreferredInput('touch')).toBe('touch');
  });
});

describe('createMicAutoStart', () => {
  it('starts the mic immediately when mic is preferred', async () => {
    const d = makeDeps();
    const ctl = createMicAutoStart(d);
    ctl.setPreferred('mic');
    await flush();
    expect(d.input.enableMicrophone).toHaveBeenCalledTimes(1);
    ctl.dispose();
  });

  it('wakes audio and retries the mic on the first user gesture', async () => {
    const d = makeDeps();
    d.input.enableMicrophone.mockResolvedValueOnce(false); // e.g. no permission yet
    const ctl = createMicAutoStart(d);
    ctl.setPreferred('mic');
    await flush();
    d.target.dispatchEvent(new Event('pointerdown'));
    await flush();
    expect(d.audio.init).toHaveBeenCalled();
    expect(d.input.enableMicrophone).toHaveBeenCalledTimes(2);
    expect(d.input.isMicrophoneActive()).toBe(true);
    ctl.dispose();
  });

  it('resumes audio on the first gesture even when the mic is already active', async () => {
    const d = makeDeps(true);
    const ctl = createMicAutoStart(d);
    ctl.setPreferred('mic');
    d.target.dispatchEvent(new Event('keydown'));
    await flush();
    expect(d.audio.init).toHaveBeenCalled();
    ctl.dispose();
  });

  it('turns the mic off when another input is chosen', async () => {
    const d = makeDeps(true);
    const ctl = createMicAutoStart(d);
    ctl.setPreferred('touch');
    expect(d.input.disableMicrophone).toHaveBeenCalled();
    d.target.dispatchEvent(new Event('pointerdown'));
    await flush();
    expect(d.input.enableMicrophone).not.toHaveBeenCalled();
    ctl.dispose();
  });

  it('does not restart the mic after the user turned it off by hand', async () => {
    const d = makeDeps();
    const ctl = createMicAutoStart(d);
    ctl.setPreferred('mic');
    await flush();
    ctl.userStopped();
    d.target.dispatchEvent(new Event('pointerdown'));
    await flush();
    expect(d.input.enableMicrophone).toHaveBeenCalledTimes(1);
    ctl.dispose();
  });
});
