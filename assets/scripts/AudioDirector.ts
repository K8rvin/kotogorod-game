import { _decorator, Component, input, Input } from "cc";
import { GameState } from "./core/state";
const { ccclass } = _decorator;

@ccclass("AudioDirector")
export class AudioDirector extends Component {
  private state!: GameState;
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private chord = 0;
  private nextChord = 0;

  init(state: GameState): void {
    this.state = state;
    input.on(Input.EventType.TOUCH_START, this.unlock, this);
    document.addEventListener("visibilitychange", this.onVisibility);
    state.on("spawn", () => this.tone(540, 720, 0.09, "triangle", 0.08));
    state.on("merge", (detail) => {
      const item = detail.item as { tier?: number } | undefined;
      const tier = item?.tier ?? 3;
      this.tone(280 + tier * 55, 760 + tier * 80, 0.22, "triangle", 0.14);
      this.tone(560 + tier * 70, 1120 + tier * 80, 0.2, "sine", 0.07, 0.05);
      if (detail.bonus) [740, 940, 1180].forEach((frequency, index) => this.tone(frequency, frequency, 0.15, "triangle", 0.08, 0.08 + index * 0.06));
    });
    state.on("deliver", () => [523, 659, 784].forEach((frequency, index) => this.tone(frequency, frequency, 0.2, "sine", 0.09, index * 0.07)));
    state.on("restore", () => [392, 494, 587, 784, 988].forEach((frequency, index) => this.tone(frequency, frequency, 0.35, "triangle", 0.09, index * 0.09)));
    state.on("chest", () => [784, 988, 1175, 1568].forEach((frequency, index) => this.tone(frequency, frequency, 0.15, "sine", 0.07, index * 0.06)));
    state.on("error", () => this.tone(155, 115, 0.16, "sawtooth", 0.045));
    state.on("level", () => [523, 659, 784, 1046].forEach((frequency, index) => this.tone(frequency, frequency, 0.4, "sine", 0.08, index * 0.11)));
  }

  private unlock(): void {
    if (!this.context) {
      const Context = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Context) return;
      this.context = new Context();
      this.master = this.context.createGain();
      this.master.gain.value = this.state.profile.settings.volume;
      this.master.connect(this.context.destination);
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = this.state.profile.settings.music ? 0.035 : 0;
      this.musicGain.connect(this.master);
      [174.61, 220, 261.63].forEach((frequency) => {
        const oscillator = this.context!.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        oscillator.connect(this.musicGain!);
        oscillator.start();
        this.oscillators.push(oscillator);
      });
      this.nextChord = this.context.currentTime + 8;
    }
    if (this.context.state === "suspended") void this.context.resume();
  }

  private tone(from: number, to: number, duration: number, type: OscillatorType, volume: number, delay = 0): void {
    if (!this.context || !this.master || !this.state.profile.settings.sound) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, to), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  update(): void {
    if (!this.context || !this.master || !this.musicGain) return;
    const settings = this.state.profile.settings;
    this.master.gain.setTargetAtTime(document.hidden ? 0 : settings.volume, this.context.currentTime, 0.08);
    this.musicGain.gain.setTargetAtTime(settings.music ? 0.035 : 0, this.context.currentTime, 0.3);
    if (settings.music && this.context.currentTime >= this.nextChord) {
      const chords = [[174.61, 220, 261.63], [196, 246.94, 293.66], [164.81, 220, 261.63], [196, 246.94, 329.63]];
      this.chord = (this.chord + 1) % chords.length;
      this.oscillators.forEach((oscillator, index) => oscillator.frequency.linearRampToValueAtTime(chords[this.chord][index], this.context!.currentTime + 2));
      this.nextChord = this.context.currentTime + 9;
    }
  }

  private onVisibility = (): void => {
    if (!this.context) return;
    if (document.hidden) void this.context.suspend();
    else if (this.state.profile.settings.sound || this.state.profile.settings.music) void this.context.resume();
  };

  protected onDestroy(): void {
    input.off(Input.EventType.TOUCH_START, this.unlock, this);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.oscillators.forEach((oscillator) => oscillator.stop());
    void this.context?.close();
  }
}
