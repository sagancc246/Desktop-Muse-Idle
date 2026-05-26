import type { TapVoice } from '../types/game';

let audioContext: AudioContext | undefined;

function getAudioContext(): AudioContext | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  audioContext ??= new AudioContext();
  return audioContext;
}

export function prepareAudioSystem(): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const activateAudio = () => {
    const context = getAudioContext();

    if (context?.state === 'suspended') {
      void context.resume();
    }
  };

  window.addEventListener('pointerdown', activateAudio, { once: true });

  return () => window.removeEventListener('pointerdown', activateAudio);
}

export function playCornerHitSound(seVolume: number): void {
  if (!audioContext || audioContext.state !== 'running') {
    return;
  }

  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  const normalizedVolume = Math.min(Math.max(seVolume, 0), 100) / 100;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.115 * normalizedVolume), now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
  gain.connect(audioContext.destination);

  for (const [frequency, delay] of [
    [659.25, 0],
    [987.77, 0.06],
  ] as const) {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now + delay);
    oscillator.connect(gain);
    oscillator.start(now + delay);
    oscillator.stop(now + delay + 0.19);
  }
}

export function playMuseTapVoice(tapVoice: TapVoice, seVolume: number): void {
  if (typeof window === 'undefined' || seVolume <= 0 || !tapVoice.audioPath) {
    return;
  }

  try {
    const voice = new Audio(tapVoice.audioPath);
    voice.volume = Math.min(Math.max(seVolume, 0), 100) / 100;
    void voice.play().catch(() => undefined);
  } catch {
    // Missing prototype voice assets should not interrupt gameplay.
  }
}
