/* =============================================================================
 * audio.js — Sistema de Áudio do Bela Climb
 * -----------------------------------------------------------------------------
 * Responsável por toda a síntese sonora do jogo usando a Web Audio API.
 * Nenhum arquivo de áudio (.mp3/.wav) é usado — todos os efeitos são gerados
 * matematicamente em tempo real por osciladores e ruído.
 *
 * Dependências (declaradas em config.js):
 *   - soundBtn : referência ao botão de som no DOM (#soundBtn)
 *
 * Estado próprio deste módulo:
 *   - soundOn  : liga/desliga o som
 *   - audioCtx : instância única do AudioContext
 *
 * Funções expostas (globais, usadas por physics.js, game.js, hazards.js):
 *   beep, sndJump, sndBleat, sndLand, sndFall, sndWin, sndStar, sndCapim,
 *   ac, unlockAudio
 * ========================================================================== */

// ---------- Estado do áudio ----------
let soundOn = true;
let audioCtx = null;

/**
 * Retorna o AudioContext, criando-o na primeira chamada.
 * Os navegadores iniciam o contexto "suspenso" até um gesto do usuário,
 * então sempre tentamos retomá-lo.
 */
function ac() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/**
 * Destrava o áudio no primeiro toque/clique/tecla em qualquer lugar da tela.
 * Necessário para iOS/Safari, que bloqueiam áudio até uma interação real.
 * Toca um "blip" quase inaudível para acordar todo o pipeline de áudio.
 */
function unlockAudio() {
  try {
    const a = ac();
    if (a.state === 'suspended') a.resume();
    const o = a.createOscillator(), g = a.createGain();
    g.gain.value = 0.001;
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + 0.02);
  } catch (e) {}
}
['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'].forEach(evt =>
  window.addEventListener(evt, unlockAudio, { once: false })
);

/**
 * Gera um tom simples com envelope de fade-out.
 * @param {number} freq   - frequência inicial (Hz)
 * @param {number} dur    - duração (segundos)
 * @param {string} type   - forma de onda: 'sine' | 'square' | 'sawtooth' | 'triangle'
 * @param {number} vol    - volume inicial (0..1)
 * @param {number} slideTo- se definido, desliza a frequência até este valor
 */
function beep(freq, dur, type = 'sine', vol = 0.15, slideTo = null) {
  if (!soundOn) return;
  try {
    const a = ac();
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, a.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
    g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + dur);
  } catch (e) {}
}

// ---------- Efeitos sonoros do jogo ----------

/** Salto: pitch sobe conforme a força aplicada. */
function sndJump(power) { beep(300 + power * 200, 0.18, 'square', 0.12, 600 + power * 300); }

/** Balido da cabra: dois tons curtos em sequência. */
function sndBleat() {
  beep(520, 0.08, 'sawtooth', 0.1, 380);
  setTimeout(() => beep(440, 0.1, 'sawtooth', 0.1, 340), 90);
}

/** Pouso: baque grave. */
function sndLand() { beep(180, 0.12, 'triangle', 0.13, 90); }

/** Queda: tom descendente. */
function sndFall() { beep(400, 0.5, 'sine', 0.15, 80); }

/** Vitória: pequena fanfarra de quatro notas ascendentes. */
function sndWin() {
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => beep(f, 0.18, 'triangle', 0.14), i * 120)
  );
}

/** Estrela conquistada: "plim" agudo. */
function sndStar() { beep(1200, 0.1, 'sine', 0.1, 1600); }

/**
 * Coleta do objetivo (Super Capim / Pimenta):
 * 1) uma "mastigação crocante" feita de ruído aleatório filtrado (bandpass);
 * 2) seguida de um "plim" agudo e feliz de vitória (oscilador ascendente).
 */
function sndCapim() {
  if (!soundOn) return;
  try {
    const a = ac();
    const t0 = a.currentTime;

    // 1) mastigação crocante — rajada curta de ruído aleatório
    const dur = 0.18;
    const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const env = 1 - i / data.length;                          // decaimento
      const bite = (Math.floor(i / (data.length / 3)) % 2 === 0) ? 1 : 0.4; // "mordidas"
      data[i] = (Math.random() * 2 - 1) * env * bite;
    }
    const noise = a.createBufferSource();
    noise.buffer = buf;
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.8;
    const ng = a.createGain();
    ng.gain.setValueAtTime(0.25, t0);
    ng.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    noise.connect(bp); bp.connect(ng); ng.connect(a.destination);
    noise.start(t0); noise.stop(t0 + dur);

    // 2) "plim" feliz — oscilador ascendente com fade-out, logo após a mastigação
    const t1 = t0 + dur;
    const osc = a.createOscillator();
    const og = a.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t1);
    osc.frequency.exponentialRampToValueAtTime(1760, t1 + 0.22);
    og.gain.setValueAtTime(0.22, t1);
    og.gain.exponentialRampToValueAtTime(0.001, t1 + 0.35);
    osc.connect(og); og.connect(a.destination);
    osc.start(t1); osc.stop(t1 + 0.35);
  } catch (e) {}
}

// ---------- Botão liga/desliga do som ----------
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? '🔊' : '🔇';
});
