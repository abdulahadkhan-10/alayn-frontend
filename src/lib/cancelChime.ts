// Synthesized cancellation chime for the kitchen screen (Web Audio API, no audio file).
// Sound: a soft bell playing three falling notes (A5 → F5 → D5, a minor feel that reads
// as "something was removed"), played twice so it catches attention without being harsh.

// Overall loudness (0–1). Raise or lower this to match the order bell.
const MASTER_VOLUME = 0.5;

// Notes of the falling phrase, in Hz
const NOTES = [880, 698.46, 587.33];
const NOTE_GAP = 0.17; // seconds between notes
const REPEAT_GAP = 0.75; // seconds between the start of each phrase
const REPEATS = 2;

/** Roughly when the last note has rung out enough for a voice announcement to start (ms). */
export const CANCEL_CHIME_MS = Math.round(((REPEATS - 1) * REPEAT_GAP + (NOTES.length - 1) * NOTE_GAP + 0.55) * 1000);

// Bell partials: [frequency ratio, relative level, decay seconds].
// The higher overtones fade quickly, which gives a soft "ding" instead of a beep.
const PARTIALS: [number, number, number][] = [
  [1, 1, 1.4],
  [2, 0.28, 0.7],
  [3, 0.1, 0.35],
  [4.07, 0.05, 0.2],
];

let ctx: AudioContext | null = null;
let output: AudioNode | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor() as AudioContext;

  // Master chain: gentle low-pass for warmth → small echo for a sense of space → speakers
  const master = ctx.createGain();
  master.gain.value = MASTER_VOLUME;

  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 5000;

  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.13;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.22;
  const echoTone = ctx.createBiquadFilter();
  echoTone.type = "lowpass";
  echoTone.frequency.value = 2200;

  tone.connect(master);
  tone.connect(delay);
  delay.connect(echoTone);
  echoTone.connect(feedback);
  feedback.connect(delay);
  echoTone.connect(master);
  master.connect(ctx.destination);

  output = tone;
  return ctx;
}

function strike(ac: AudioContext, freq: number, start: number, level: number) {
  for (const [ratio, partLevel, decay] of PARTIALS) {
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * ratio;

    const env = ac.createGain();
    const peak = level * partLevel * 0.3;
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(peak, start + 0.006); // soft attack, no click
    env.gain.exponentialRampToValueAtTime(0.0001, start + decay);

    osc.connect(env);
    env.connect(output!);
    osc.start(start);
    osc.stop(start + decay + 0.05);
  }
}

// Browsers keep audio locked until the user interacts with the page.
// Call once on mount: the first click/tap/key anywhere unlocks the chime for later socket alerts.
export function unlockCancelChimeOnFirstInteraction(): () => void {
  if (typeof window === "undefined") return () => {};
  const unlock = () => {
    getContext()?.resume().catch(() => {});
    // Safari only allows speech later if speech was first started inside a user tap: say nothing, silently
    if (window.speechSynthesis) {
      const primer = new SpeechSynthesisUtterance(" ");
      primer.volume = 0;
      window.speechSynthesis.speak(primer);
    }
    remove();
  };
  const remove = () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
  return remove;
}

let lastChimeAt = 0;

export function playCancelChime(): boolean {
  const ac = getContext();
  if (!ac || !output) return false;
  if (ac.state !== "running") ac.resume().catch(() => {}); // "suspended", or "interrupted" on Safari

  // Several cancellations arriving together get one chime, not a pile of overlapping ones
  // (each still gets its own spoken announcement)
  const nowMs = Date.now();
  if (nowMs - lastChimeAt < CANCEL_CHIME_MS) return true;
  lastChimeAt = nowMs;

  const t0 = ac.currentTime + 0.03;
  for (let r = 0; r < REPEATS; r++) {
    // Second phrase slightly quieter so it feels like an echo, not a repeat alarm
    const phraseLevel = r === 0 ? 1 : 0.75;
    NOTES.forEach((freq, i) => {
      const accent = i === 0 ? 1 : 0.85;
      strike(ac, freq, t0 + r * REPEAT_GAP + i * NOTE_GAP, phraseLevel * accent);
    });
  }
  return true;
}
