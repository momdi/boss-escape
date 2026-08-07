/* ===========================================================
   상사 피하기 - 8비트 느낌 효과음 (WebAudio)
   =========================================================== */

const Sfx = {
  ac: null,
  master: null,
  muted: false,

  init() {
    if (this.ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ac = new AC();
    this.master = this.ac.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ac.destination);
  },

  resume() {
    if (this.ac && this.ac.state === 'suspended') this.ac.resume();
  },

  tone(freq, dur, type = 'square', vol = 0.5, endFreq = null) {
    if (!this.ac || this.muted) return;
    const t = this.ac.currentTime;
    const osc = this.ac.createOscillator();
    const g = this.ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },

  noise(dur, vol = 0.3) {
    if (!this.ac || this.muted) return;
    const t = this.ac.currentTime;
    const len = Math.floor(this.ac.sampleRate * dur);
    const buf = this.ac.createBuffer(1, len, this.ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ac.createBufferSource();
    src.buffer = buf;
    const g = this.ac.createGain();
    g.gain.value = vol;
    src.connect(g);
    g.connect(this.master);
    src.start(t);
  },

  seq(notes) {
    if (!this.ac || this.muted) return;
    notes.forEach((n, i) => {
      setTimeout(() => this.tone(n[0], n[1], n[2] || 'square', n[3] || 0.45), i * 90);
    });
  },

  pickup() { this.seq([[880, 0.07], [1174, 0.1]]); },
  coffee() { this.seq([[660, 0.06], [990, 0.06], [1320, 0.12, 'triangle']]); },
  alert() { this.seq([[220, 0.09, 'sawtooth', 0.5], [180, 0.16, 'sawtooth', 0.5]]); },
  caught() { this.seq([[300, 0.12, 'sawtooth', 0.5], [220, 0.14, 'sawtooth', 0.5], [140, 0.3, 'sawtooth', 0.5]]); this.noise(0.35, 0.2); },
  clear() { this.seq([[523, 0.09], [659, 0.09], [784, 0.09], [1046, 0.24, 'triangle']]); },
  over() { this.seq([[392, 0.18, 'triangle'], [330, 0.18, 'triangle'], [262, 0.18, 'triangle'], [196, 0.45, 'triangle']]); },
  start() { this.seq([[392, 0.08], [523, 0.08], [659, 0.16]]); },
  hide() { this.tone(300, 0.09, 'triangle', 0.3, 180); },
  blocked() { this.tone(140, 0.07, 'square', 0.25); },
  bad() { this.seq([[330, 0.1, 'sawtooth', 0.45], [247, 0.12, 'sawtooth', 0.45], [165, 0.26, 'square', 0.4]]); this.noise(0.18, 0.14); },
  betray() { this.seq([[988, 0.07, 'square', 0.5], [740, 0.07, 'square', 0.5], [988, 0.07, 'square', 0.5], [523, 0.26, 'sawtooth', 0.5]]); },
  ending() { this.seq([[523, 0.1], [659, 0.1], [784, 0.1], [1046, 0.1], [880, 0.1, 'triangle'], [1318, 0.42, 'triangle']]); },
};
