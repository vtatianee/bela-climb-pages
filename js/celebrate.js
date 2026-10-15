/* =============================================================================
 * celebrate.js — Comemoração, Bela da tela inicial e "pulinhos" da interface
 * -----------------------------------------------------------------------------
 * Só visual, como juice.js:
 *  - ao vencer a fase: chuva de confete, três estrelas grandes que surgem uma
 *    a uma (no ritmo do sndStar de game.js) e a Bela dançando;
 *  - na tela inicial: uma Bela pulando num canvas próprio acima do logo;
 *  - bump(): reinicia uma animação CSS (vidas tremendo, fase saltando...).
 *
 * Depende de (config.js): ctx (let), canvas, W, H, DPR, goat, won, isHard,
 *   particles, started, titleEl
 * Depende de: drawGoat, goatDisplayFace (render.js / juice.js), juice
 *
 * FUNÇÕES/ESTADO QUE ESTE ARQUIVO INJETA NO ESCOPO GLOBAL:
 *   celebration       : estado da comemoração ({ t, stars }) ou null
 *   startCelebration  : dispara confete + estrelas (chamada por winLevel)
 *   clearCelebration  : encerra (ao montar uma fase)
 *   updateCelebration : avança o relógio da comemoração (passo fixo)
 *   goatDance         : deslocamento/inclinação da Bela dançando
 *   drawWinStars      : as três estrelas grandes
 *   drawTitleGoat     : a Bela pulando na tela inicial
 *   bump              : reinicia uma animação CSS num elemento
 * ========================================================================== */

let celebration = null;

const CONFETTI_COLORS = ['#ff5d8f', '#ffd23f', '#3ec1d3', '#7bd389', '#a77bf3', '#ff9f43'];

// As estrelas surgem junto com o sndStar de winLevel (600 ms + 200 ms cada,
// a 60 passos por segundo): passo 36, 48 e 60.
const STAR_AT = (k) => 36 + k * 12;

function startCelebration(stars) {
  celebration = { t: 0, stars };
  if (JUICE_OFF) return;
  for (let i = 0; i < 70; i++) {   // chuva caindo do alto
    particles.push(confetti(Math.random() * W, -10 - Math.random() * 120, (Math.random() - 0.5) * 1.5, Math.random() * 1.5));
  }
  for (let i = 0; i < 28; i++) {   // estouro saindo da Bela
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8, v = 4 + Math.random() * 4;
    particles.push(confetti(goat.x, goat.y - 10, Math.cos(a) * v, Math.sin(a) * v));
  }
}

function confetti(x, y, vx, vy) {
  return { x, y, vx, vy, confetti: true, life: 110 + Math.random() * 50,
           w: 5 + Math.random() * 4, h: 3 + Math.random() * 3,
           rot: Math.random() * 6.3, vr: (Math.random() - 0.5) * 0.3,
           c: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] };
}

function clearCelebration() { celebration = null; }
function updateCelebration() { if (celebration) celebration.t++; }

/** Bela dançando depois de comer o capim (no modo difícil ela já gira com a pimenta). */
function goatDance() {
  if (!celebration || isHard || JUICE_OFF) return { dy: 0, tilt: 0 };
  const t = celebration.t;
  return { dy: -Math.abs(Math.sin(t * 0.21)) * 12, tilt: Math.sin(t * 0.105) * 0.18 };
}

/** easeOutBack: passa um pouco do tamanho final e volta (efeito "pop"). */
function popEase(k) { const c = 2.2; k = Math.min(1, Math.max(0, k)); return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); }

function starPath(r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
}

function drawWinStars() {
  if (!celebration) return;
  const t = celebration.t;
  if (t < STAR_AT(0) - 4) return;
  const cy = 290;
  // véu suave atrás das estrelas, para destacá-las de qualquer bioma
  const fade = Math.min(1, (t - STAR_AT(0) + 4) / 10);
  const g = ctx.createRadialGradient(W/2, cy, 10, W/2, cy, 150);
  g.addColorStop(0, `rgba(20,15,40,${0.45 * fade})`); g.addColorStop(1, 'rgba(20,15,40,0)');
  ctx.fillStyle = g; ctx.fillRect(W/2 - 160, cy - 150, 320, 300);
  for (let k = 0; k < 3; k++) {
    const e = t - STAR_AT(k);
    if (e < 0) continue;
    const s = popEase(e / 14);
    const earned = k < celebration.stars;
    const big = k === 1 ? 1.25 : 1;
    const x = W/2 + (k - 1) * 70, y = cy - (k === 1 ? 14 : 0);
    ctx.save(); ctx.translate(x, y); ctx.scale(s * big, s * big);
    ctx.rotate((k - 1) * 0.18 + (earned ? Math.sin(t * 0.08 + k) * 0.05 : 0));
    starPath(26);
    ctx.lineJoin = 'round'; ctx.lineWidth = 5;
    ctx.strokeStyle = earned ? '#8a4b00' : 'rgba(30,30,45,0.8)'; ctx.stroke();
    ctx.fillStyle = earned ? '#ffd23f' : 'rgba(120,120,140,0.55)'; ctx.fill();
    if (earned) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.ellipse(-7, -9, 6, 3.2, -0.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

// ---------- Bela da tela inicial ----------
const titleGoatCanvas = document.getElementById('titleGoat');
const TG_W = 140, TG_H = 128;
titleGoatCanvas.width = TG_W * DPR; titleGoatCanvas.height = TG_H * DPR;
titleGoatCanvas.style.width = TG_W + 'px'; titleGoatCanvas.style.height = TG_H + 'px';
const titleGoatCtx = titleGoatCanvas.getContext('2d');

/** Pulo em loop de 70 passos: sobe, cai, achata ao tocar o chão e respira. */
function drawTitleGoat() {
  if (started) return;
  const main = ctx;
  ctx = titleGoatCtx;
  try {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, TG_W, TG_H);
    const ph = (juice.t % 70) / 70;
    const air = ph < 0.55 ? Math.sin(ph / 0.55 * Math.PI) : 0;
    const hop = air * 26;
    const sq = ph < 0.55 ? -0.1 * air : Math.sin((ph - 0.55) / 0.45 * Math.PI) * 0.22;
    const groundY = TG_H - 8;
    // sombra encolhe enquanto ela sobe
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(TG_W/2, groundY, 26 * (1 - air * 0.4), 5 * (1 - air * 0.4), 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(TG_W/2, groundY - hop);
    ctx.scale(1.6 * (1 + sq * 0.8), 1.6 * (1 - sq));
    ctx.translate(0, -21);   // os pés da Bela ficam 21px abaixo do centro
    drawGoat(0, 0, air > 0.1 ? 'happy' : goatDisplayFace(), Math.sin(juice.t * 0.09) * 0.06 * air);
  } finally {
    ctx = main;
  }
}

// ---------- Animações CSS de interface ----------
/** Reinicia uma animação CSS (a classe é removida sozinha ao terminar). */
function bump(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;            // força o navegador a "esquecer" a animação anterior
  el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}
