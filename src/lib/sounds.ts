// Programmatic sound effects using Web Audio API
// No external files needed - lightweight & works offline

let audioCtx: AudioContext | null = null;

const getCtx = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

const playNote = (
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.15
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
};

/** 💰 Ka-ching: bright rising coins sound (for income / purchases) */
export const playKaChing = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    // Metallic shimmer
    playNote(ctx, 1200, t, 0.08, "square", 0.06);
    playNote(ctx, 1600, t + 0.06, 0.08, "square", 0.06);
    // Bright chime
    playNote(ctx, 880, t + 0.05, 0.15, "sine", 0.12);
    playNote(ctx, 1318.5, t + 0.12, 0.2, "sine", 0.1);
    playNote(ctx, 1760, t + 0.18, 0.3, "sine", 0.08);
    // Sparkle
    playNote(ctx, 2637, t + 0.25, 0.15, "sine", 0.04);
  } catch (e) {
    console.warn("Sound error:", e);
  }
};

/** 💸 Swoosh: quick descending sweep (for expenses) */
export const playSwoosh = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.2);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
    // Subtle noise layer
    playNote(ctx, 300, t, 0.12, "triangle", 0.04);
  } catch (e) {
    console.warn("Sound error:", e);
  }
};

/** ✅ Success: triumphant ascending chord (goals, achievements) */
export const playSuccess = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    // C major arpeggio
    playNote(ctx, 523.25, t, 0.3, "sine", 0.1);       // C5
    playNote(ctx, 659.25, t + 0.1, 0.3, "sine", 0.1);  // E5
    playNote(ctx, 783.99, t + 0.2, 0.3, "sine", 0.1);  // G5
    playNote(ctx, 1046.5, t + 0.3, 0.5, "sine", 0.12); // C6
    // Shimmer
    playNote(ctx, 2093, t + 0.35, 0.3, "sine", 0.04);
    playNote(ctx, 2637, t + 0.4, 0.25, "sine", 0.03);
  } catch (e) {
    console.warn("Sound error:", e);
  }
};

/** 🗑️ Delete: soft thud (removing items) */
export const playDelete = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  } catch (e) {
    console.warn("Sound error:", e);
  }
};

/** 🔔 Notification: gentle two-tone ping */
export const playNotification = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    playNote(ctx, 880, t, 0.12, "sine", 0.08);
    playNote(ctx, 1108.73, t + 0.1, 0.18, "sine", 0.08);
  } catch (e) {
    console.warn("Sound error:", e);
  }
};

/** 👆 Tap: subtle click feedback */
export const playTap = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    playNote(ctx, 800, t, 0.04, "sine", 0.06);
  } catch (e) {
    console.warn("Sound error:", e);
  }
};
