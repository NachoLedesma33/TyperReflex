let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (
        window as unknown as {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

export function playKeySound() {
  const ac = getContext();
  if (!ac) return;

  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = "triangle";
  osc.frequency.value = 380 + Math.random() * 90;

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.start(now);
  osc.stop(now + 0.055);
}

export function playErrorSound() {
  const ac = getContext();
  if (!ac) return;

  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);

  gain.gain.setValueAtTime(0.07, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.start(now);
  osc.stop(now + 0.13);
}
