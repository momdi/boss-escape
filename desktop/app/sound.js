/* ===========================================================
   츄두리스트 — 효과음 (WebAudio, 파일 없이 합성)
   =========================================================== */

const Sound = (function () {
  let ctx = null;
  let master = null;
  let enabled = true;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.22;
        master.connect(ctx.destination);
      } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /** 짧은 삐용 한 음 */
  function tone(o) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + (o.at || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type || 'triangle';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur);
    const vol = o.vol === undefined ? 0.6 : o.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.02);
  }

  /** 짧은 노이즈 (셔터 등) */
  function noise(dur, vol, at) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + (at || 0);
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 1400;
    const g = c.createGain();
    g.gain.value = vol === undefined ? 0.5 : vol;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
  }

  const N = {
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880,
    B5: 987.77, C6: 1046.5, D6: 1174.7, E6: 1318.5, G6: 1568, C7: 2093,
  };

  const RECIPE = {
    /* 할 일 체크 — 도-미 두 알 */
    check: function () {
      tone({ f: N.E6, dur: 0.09, vol: 0.5 });
      tone({ f: N.G6, dur: 0.13, vol: 0.45, at: 0.07 });
    },
    /* 체크 해제 */
    uncheck: function () {
      tone({ f: N.D6, to: N.G5, dur: 0.14, vol: 0.32, type: 'sine' });
    },
    /* 특별한 할 일 / 보너스 */
    sparkle: function () {
      [N.C6, N.E6, N.G6, N.C7].forEach(function (f, i) {
        tone({ f: f, dur: 0.12, vol: 0.4, at: i * 0.055 });
      });
    },
    /* 밥 담기 — 톡 */
    drop: function () {
      tone({ f: 880, to: 420, dur: 0.1, vol: 0.45, type: 'sine' });
      noise(0.04, 0.12, 0.005);
    },
    /* 고양이 등장 — 냐-옹 (매번 조금씩 다르게) */
    meow: function () {
      /* 0: 보통 / 1: 짧고 높게 / 2: 길고 낮게 / 3: 냐아-옹 (두 번 꺾임) */
      const kind = Math.floor(Math.random() * 4);
      const p = 0.9 + Math.random() * 0.25;          /* 개체차 */
      if (kind === 1) {
        tone({ f: 760 * p, to: 1180 * p, dur: 0.1, vol: 0.36, type: 'sawtooth' });
        tone({ f: 1120 * p, to: 820 * p, dur: 0.13, vol: 0.3, type: 'sawtooth', at: 0.09 });
      } else if (kind === 2) {
        tone({ f: 470 * p, to: 700 * p, dur: 0.2, vol: 0.36, type: 'sawtooth' });
        tone({ f: 680 * p, to: 400 * p, dur: 0.36, vol: 0.3, type: 'sawtooth', at: 0.19 });
      } else if (kind === 3) {
        tone({ f: 600 * p, to: 900 * p, dur: 0.12, vol: 0.36, type: 'sawtooth' });
        tone({ f: 880 * p, to: 700 * p, dur: 0.1, vol: 0.3, type: 'sawtooth', at: 0.11 });
        tone({ f: 720 * p, to: 480 * p, dur: 0.26, vol: 0.28, type: 'sawtooth', at: 0.2 });
      } else {
        tone({ f: 620 * p, to: 980 * p, dur: 0.14, vol: 0.4, type: 'sawtooth' });
        tone({ f: 940 * p, to: 560 * p, dur: 0.24, vol: 0.34, type: 'sawtooth', at: 0.13 });
      }
    },
    /* 고양이 퇴장 */
    bye: function () {
      tone({ f: 700, to: 380, dur: 0.26, vol: 0.28, type: 'sine' });
    },
    /* 카메라 셔터 */
    shutter: function () {
      noise(0.05, 0.6);
      noise(0.07, 0.35, 0.07);
      tone({ f: 2200, dur: 0.03, vol: 0.25, type: 'square' });
    },
    /* 구매 */
    coin: function () {
      tone({ f: N.B5, dur: 0.07, vol: 0.45, type: 'square' });
      tone({ f: N.E6, dur: 0.18, vol: 0.4, type: 'square', at: 0.06 });
    },
    /* 선물 주기 */
    gift: function () {
      tone({ f: N.G5, dur: 0.1, vol: 0.4 });
      tone({ f: N.C6, dur: 0.1, vol: 0.4, at: 0.08 });
      tone({ f: N.E6, dur: 0.18, vol: 0.4, at: 0.16 });
    },
    /* 방울 */
    bell: function () {
      tone({ f: N.C7, dur: 0.22, vol: 0.3, type: 'sine' });
      tone({ f: 3130, dur: 0.28, vol: 0.16, type: 'sine', at: 0.02 });
    },
    /* 탭 이동 */
    tap: function () {
      tone({ f: N.A5, dur: 0.05, vol: 0.22, type: 'sine' });
    },
    /* 시트 열기 */
    pop: function () {
      tone({ f: 420, to: 820, dur: 0.09, vol: 0.28, type: 'sine' });
    },
    /* 실패 / 부족 */
    nope: function () {
      tone({ f: 330, to: 220, dur: 0.16, vol: 0.3, type: 'square' });
    },
  };

  function play(name) {
    if (!enabled) return;
    const fn = RECIPE[name];
    if (!fn) return;
    try { fn(); } catch (e) { /* 오디오 미지원 */ }
  }

  function setEnabled(v) {
    enabled = !!v;
    if (enabled) ensure();
  }
  function isEnabled() { return enabled; }

  /* 첫 사용자 입력에서 오디오 컨텍스트를 깨운다 */
  function unlock() {
    const h = function () { ensure(); };
    document.addEventListener('pointerdown', h, { once: true });
    document.addEventListener('keydown', h, { once: true });
  }

  return { play: play, setEnabled: setEnabled, isEnabled: isEnabled, unlock: unlock };
})();
