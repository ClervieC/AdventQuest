// Moteur de bruitages injecté dans chaque jeu Phaser (WebView / iframe) avant son chargement.
// Les sons sont synthétisés à la volée (Web Audio) : aucun fichier à télécharger.
// Dans un jeu : window.GameSounds.play('shoot'). Le son est coupé par le message { type: 'SET_MUTED', muted }.
export const GAME_SOUNDS_SCRIPT = `
(function () {
  if (window.GameSounds) return;
  var ctx = null;
  var muted = false;

  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // Les navigateurs n'autorisent le son qu'après un geste du joueur : on débloque au premier toucher
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (evt) {
    window.addEventListener(evt, audio, { capture: true, passive: true });
  });

  // Note simple : type d'onde, fréquence (avec glissando optionnel), durée, volume
  function tone(o) {
    var c = audio(); if (!c) return;
    var t = c.currentTime + (o.delay || 0);
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(o.vol || 0.15, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + o.dur + 0.02);
  }

  // Bruit filtré (explosions, coupes, glissades)
  function noise(o) {
    var c = audio(); if (!c) return;
    var t = c.currentTime + (o.delay || 0);
    var length = Math.floor(c.sampleRate * o.dur);
    var buffer = c.createBuffer(1, length, c.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    var src = c.createBufferSource();
    src.buffer = buffer;
    var filter = c.createBiquadFilter();
    filter.type = o.filter || 'lowpass';
    filter.frequency.setValueAtTime(o.freq || 1200, t);
    if (o.to) filter.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
    var gain = c.createGain();
    gain.gain.setValueAtTime(o.vol || 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t);
  }

  var SOUNDS = {
    shoot: function () { tone({ type: 'square', freq: 880, to: 330, dur: 0.09, vol: 0.06 }); },
    explode: function () { noise({ dur: 0.35, freq: 900, to: 80, vol: 0.35 }); tone({ type: 'sine', freq: 120, to: 40, dur: 0.3, vol: 0.2 }); },
    hurt: function () { tone({ type: 'sawtooth', freq: 260, to: 90, dur: 0.3, vol: 0.12 }); },
    coin: function () { tone({ type: 'square', freq: 988, dur: 0.07, vol: 0.06 }); tone({ type: 'square', freq: 1319, dur: 0.16, vol: 0.06, delay: 0.07 }); },
    jump: function () { tone({ type: 'square', freq: 280, to: 620, dur: 0.14, vol: 0.06 }); },
    slide: function () { noise({ dur: 0.2, filter: 'highpass', freq: 2500, to: 800, vol: 0.12 }); },
    place: function () { tone({ type: 'triangle', freq: 392, dur: 0.1, vol: 0.2 }); },
    perfect: function () { [784, 988, 1319].forEach(function (f, i) { tone({ type: 'sine', freq: f, dur: 0.14, vol: 0.14, delay: i * 0.06 }); }); },
    pop: function () { tone({ type: 'sine', freq: 500, to: 1300, dur: 0.08, vol: 0.18 }); },
    bounce: function () { tone({ type: 'triangle', freq: 520, dur: 0.06, vol: 0.18 }); },
    brick: function () { tone({ type: 'square', freq: 1046, dur: 0.05, vol: 0.07 }); noise({ dur: 0.06, filter: 'highpass', freq: 3000, vol: 0.08 }); },
    tick: function () { tone({ type: 'sine', freq: 1500, dur: 0.03, vol: 0.1 }); },
    whack: function () { noise({ dur: 0.08, freq: 1800, vol: 0.25 }); tone({ type: 'sine', freq: 220, to: 110, dur: 0.12, vol: 0.2 }); },
    slice: function () { noise({ dur: 0.14, filter: 'bandpass', freq: 5000, to: 1500, vol: 0.2 }); },
    powerup: function () { tone({ type: 'sine', freq: 523, to: 1046, dur: 0.25, vol: 0.14 }); },
    powerdown: function () { tone({ type: 'sine', freq: 620, to: 200, dur: 0.3, vol: 0.14 }); },
  };

  function onMessage(event) {
    try {
      var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data && (data.type === 'SET_MUTED' || data.type === 'INIT') && typeof data.muted === 'boolean') muted = data.muted;
    } catch (e) {}
  }
  window.addEventListener('message', onMessage);
  document.addEventListener('message', onMessage); // WebView Android

  window.GameSounds = {
    play: function (name) {
      if (muted || !SOUNDS[name]) return;
      try { SOUNDS[name](); } catch (e) {}
    },
  };
})();
true;
`;
