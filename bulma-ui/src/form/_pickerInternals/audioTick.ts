/**
 * Audio-tick fallback for platforms with no haptic API. iOS Safari has no
 * web-accessible Taptic path (see `./haptics.ts` for the full story), so the
 * closest UX substitute is a very short audible thunk played per item tick.
 *
 * Sound design — tuned to read as a body-felt impact, not an ear-felt beep:
 *
 * - Single triangle-wave oscillator at 160Hz, exponentially sweeping down to
 *   110Hz over ~30ms. The low fundamental matches the frequency band where
 *   the Taptic Engine fires its UI pops (~150–200Hz); the downward sweep is
 *   the single biggest contributor to the perception of a damped physical
 *   impact (vs. a flat tone, which reads as a beep).
 *
 * - Triangle adds one odd harmonic over sine — just enough body to feel
 *   "soft" without the buzz of square or sawtooth.
 *
 * - Quick 1ms attack to 0.08 gain; exponential decay to silence over ~30ms;
 *   oscillator stops at +0.04s. Ramped envelope (no hard 0→1 jumps) avoids
 *   the classic Web Audio speaker pop on attack/release.
 *
 * - Uses a single oscillator + envelope rather than an audio buffer /
 *   decoded sample so there's no asset to ship and no `decodeAudioData`
 *   round-trip.
 *
 * - iOS Safari requires a user gesture to *resume* a suspended
 *   `AudioContext`. Call `unlockAudioTick()` from inside a touch / click
 *   handler before the first `playAudioTick()`. After that single resume,
 *   the context stays running and subsequent ticks play with no further
 *   gesture needed.
 *
 * - Silent / Ring switch behaviour on iOS: with the side switch in silent
 *   mode, this tick is suppressed (Web Audio respects the ringer). That
 *   matches iOS native UX expectations — silent mode means silent UI.
 *
 * - On hardware with neither speakers nor an audio device, every call
 *   silently no-ops.
 */

let audioCtx: AudioContext | null = null;

interface WindowWithWebkitAudio extends Window {
  // `AudioContext` lives on `typeof globalThis`, which a plain `Window` cast
  // drops — declare both the standard and the legacy webkit-prefixed ctor.
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

const getAudioContextCtor = (): typeof AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const w = window as WindowWithWebkitAudio;
  return w.AudioContext ?? w.webkitAudioContext ?? null;
};

const ensureAudioCtx = (): AudioContext | null => {
  if (audioCtx) return audioCtx;
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;
  try {
    audioCtx = new Ctor();
    return audioCtx;
  } catch {
    return null;
  }
};

/**
 * Call from inside a user-gesture handler (pointerdown, click, touchstart)
 * to resume the AudioContext on iOS Safari. Idempotent and cheap; safe to
 * call on every gesture. No-ops on platforms without Web Audio.
 */
export const unlockAudioTick = (): void => {
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    // Fire-and-forget: if the resume promise rejects (no gesture in
    // progress), the next call from a real gesture will succeed.
    void ctx.resume().catch(() => {});
  }
};

/**
 * Play a single short tick. No-op if Web Audio is unavailable or the
 * context hasn't been unlocked yet.
 */
export const playAudioTick = (): void => {
  const ctx = ensureAudioCtx();
  if (!ctx || ctx.state !== 'running') return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    // Pitch sweep: 160Hz → 110Hz over 30ms. The downward exponential ramp
    // is what makes this read as a damped impact rather than a flat beep.
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.03);
    // Envelope: 1ms attack to 0.08, exponential-style decay to near-zero
    // over 30ms. `exponentialRampToValueAtTime` requires a strictly
    // positive target — 0.0001 is inaudible and stops cleanly.
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Connecting / starting an oscillator in an aborted context can throw;
    // best-effort, never propagate.
  }
};

/** Test-only hook to drop the singleton AudioContext. */
export const __resetAudioTickForTest = (): void => {
  if (audioCtx) {
    try {
      void audioCtx.close();
    } catch {
      // ignore
    }
  }
  audioCtx = null;
};
