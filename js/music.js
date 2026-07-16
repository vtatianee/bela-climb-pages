/* =============================================================================
 * music.js — Música de Fundo por Mundo/Bioma do Bela Climb
 * -----------------------------------------------------------------------------
 * Toca uma trilha de fundo diferente para cada um dos 5 mundos, com crossfade
 * suave na troca de bioma. Ao contrário dos efeitos (audio.js, sintetizados na
 * Web Audio API), a música usa ARQUIVOS .mp3 royalty-free em js/../music/.
 *
 * Decisão de design: música gravada foi uma exceção consciente à regra
 * "nenhum .mp3" — só para a trilha de fundo; todos os EFEITOS seguem sintetizados.
 *
 * iOS/Safari: elementos <audio> precisam ser "destravados" dentro de um gesto
 * do usuário. unlockMusic() é chamado no toque em "Cabra Mansa/da Peste"
 * (game.js/startGame), tocando+pausando cada faixa em volume 0 para liberá-las.
 *
 * FALLBACK: se um arquivo não existir/carregar, o erro é ignorado e o jogo
 * continua normalmente (apenas sem música naquele mundo).
 *
 * Depende de (declaradas em config.js / audio.js):
 *   soundBtn   : botão de som no DOM (compartilha o liga/desliga com os efeitos)
 *   soundOn    : flag global de som (invertida por audio.js no clique do botão)
 *
 * FUNÇÕES QUE ESTE ARQUIVO INJETA NO ESCOPO GLOBAL:
 *   unlockMusic     : destrava as faixas dentro de um gesto (chamado no start)
 *   playWorldMusic  : toca / faz crossfade para a trilha de um mundo
 *   setMusicMuted   : liga/desliga a música junto com o botão de som
 * ========================================================================== */

// Trilha de cada mundo — a ORDEM segue WORLDS em levels.js
// (0 Floresta, 1 Rio, 2 Lago, 3 Vulcão, 4 Neve).
const MUSIC_TRACKS = [
  'music/floresta.mp3', // Mundo 1 — Floresta
  'music/rio.mp3',      // Mundo 2 — Rio
  'music/lago.mp3',     // Mundo 3 — Lago
  'music/vulcao.mp3',   // Mundo 4 — Vulcão
  'music/neve.mp3',     // Mundo 5 — Neve
];

const MUSIC_VOLUME = 0.35;   // volume alvo da música (fica ABAIXO dos efeitos)
const MUSIC_FADE_MS = 800;   // duração do crossfade entre mundos

let musicEls = [];           // um <audio> por mundo, pré-criado e destravado
let musicWorld = -1;         // índice do mundo cuja trilha está ativa (-1 = nenhuma)

/** Cria (uma única vez) os elementos <audio> de cada mundo. */
function initMusic() {
  if (musicEls.length) return;
  musicEls = MUSIC_TRACKS.map(src => {
    const a = new Audio(src);
    a.loop = true;
    a.preload = 'none';   // só carrega quando destravada/tocada (economiza banda)
    a.volume = 0;
    // arquivo ausente/inválido: silêncio, o jogo segue sem quebrar
    a.addEventListener('error', () => {});
    return a;
  });
}

/**
 * Destrava todas as faixas dentro de um gesto do usuário (exigência do iOS).
 * Toca e pausa cada uma em volume 0, deixando-as prontas para dar play()
 * programático depois (na troca de mundo, sem um novo gesto).
 */
function unlockMusic() {
  initMusic();
  musicEls.forEach(a => {
    // NÃO pausar a faixa que já virou a trilha ativa: o pause abaixo roda dentro
    // de um .then() assíncrono e, se playWorldMusic() tiver começado nesse meio
    // tempo, pausaríamos por cima a música que acabou de iniciar.
    const stopIfNotPlaying = () => {
      if (musicEls[musicWorld] === a) return; // é a trilha ativa: deixa tocando
      a.pause(); a.currentTime = 0;
    };
    const p = a.play();
    if (p && p.then) p.then(stopIfNotPlaying).catch(() => {});
    else { try { stopIfNotPlaying(); } catch (e) {} }
  });
}

/**
 * Faz a transição suave de volume de um elemento <audio> até um alvo.
 * @param {HTMLAudioElement} a   - elemento a animar
 * @param {number} target        - volume alvo (0..1)
 * @param {number} ms            - duração em ms
 * @param {Function} [onDone]    - callback ao terminar
 */
function fadeTo(a, target, ms, onDone) {
  if (!a) return;
  clearInterval(a._fade);
  const steps = Math.max(1, Math.round(ms / 40));
  const start = a.volume;
  let i = 0;
  a._fade = setInterval(() => {
    i++;
    a.volume = Math.max(0, Math.min(1, start + (target - start) * (i / steps)));
    if (i >= steps) { clearInterval(a._fade); if (onDone) onDone(); }
  }, 40);
}

/**
 * Toca (ou faz crossfade para) a trilha do mundo indicado.
 * Idempotente: chamar com o mesmo mundo não reinicia a faixa.
 * @param {number} world - índice do mundo (0..4)
 */
function playWorldMusic(world) {
  initMusic();
  const idx = world % musicEls.length;
  if (idx === musicWorld) {
    // já é a trilha atual; só garante que está tocando (se o som estiver ligado)
    if (soundOn && musicEls[idx].paused) musicEls[idx].play().catch(() => {});
    return;
  }
  const prev = musicWorld >= 0 ? musicEls[musicWorld] : null;
  const next = musicEls[idx];
  musicWorld = idx;
  if (!soundOn) return;                 // som desligado: só registra o mundo
  next.currentTime = 0;
  next.play().catch(() => {});
  fadeTo(next, MUSIC_VOLUME, MUSIC_FADE_MS);
  if (prev) fadeTo(prev, 0, MUSIC_FADE_MS, () => prev.pause());
}

/**
 * Liga/desliga a música acompanhando o botão de som.
 * @param {boolean} muted - true = silenciar a música
 */
function setMusicMuted(muted) {
  if (muted) {
    musicEls.forEach(a => { clearInterval(a._fade); a.volume = 0; a.pause(); });
  } else if (musicWorld >= 0) {
    const a = musicEls[musicWorld];
    a.play().catch(() => {});
    fadeTo(a, MUSIC_VOLUME, 300);
  }
}

// Integração com o botão de som. audio.js registrou seu listener ANTES deste
// (ele carrega primeiro) e já inverteu `soundOn`; aqui só espelhamos na música.
soundBtn.addEventListener('click', () => setMusicMuted(!soundOn));
