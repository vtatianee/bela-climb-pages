/* =============================================================================
 * juice.js — "Sensação de jogo" do Bela Climb (efeitos puramente visuais)
 * -----------------------------------------------------------------------------
 * Tudo que faz o jogo parecer vivo sem mudar a física: a Bela se espreme ao
 * mirar e ao pousar, estica no ar, pisca, muda de expressão; a tela treme nos
 * impactos; a plataforma afunda e volta; a poeira sobe em nuvenzinhas.
 *
 * Nada aqui altera hitbox, velocidade ou regras — só o que é DESENHADO.
 * physics.js/input.js apenas avisam os eventos (onLandImpact, addShake);
 * render.js lê o estado daqui para desenhar.
 *
 * Depende de (declaradas em config.js): goat, drag, particles, CUR
 *
 * FUNÇÕES/ESTADO QUE ESTE ARQUIVO INJETA NO ESCOPO GLOBAL:
 *   juice            : estado visual (tremor, mola da cabra, afundamento)
 *   resetJuice       : zera tudo ao montar uma fase
 *   updateJuice      : avança molas e decaimentos (1x por frame, no loop)
 *   addShake         : soma tremor de tela (intensidade em px)
 *   onLandImpact     : pouso com força -> achata a Bela, afunda a plataforma,
 *                      treme a tela e solta poeira proporcional ao impacto
 *   platDipOf        : deslocamento visual (px) de uma plataforma
 *   goatDisplayFace  : expressão a desenhar (mira, susto, piscada...)
 *   spawnPuffs       : nuvenzinhas de poeira/neve que crescem e somem
 * ========================================================================== */

const juice = {
  shake: 0,          // intensidade atual do tremor de tela (px)
  sq: 0, sqv: 0,     // mola do "achatamento" da Bela (+ achata, - estica)
  dips: {},          // índice da plataforma -> { y, v } (mola do afundamento)
  blinkAt: 0,        // instante (ms) da próxima piscada
  t: 0,              // contador de frames (respiração, pulsos)
};

function resetJuice() {
  juice.shake = 0; juice.sq = 0; juice.sqv = 0; juice.dips = {};
  juice.blinkAt = performance.now() + 2500;
}

// Diagnóstico de desempenho: ?nojuice no endereço desliga todos estes efeitos.
const JUICE_OFF = location.search.includes('nojuice');

function addShake(px) { if (!JUICE_OFF) juice.shake = Math.min(14, juice.shake + px); }

/** Mola amortecida: puxa `o[k]` para `target` usando a velocidade `o[kv]`. */
function spring(o, k, kv, target, stiff, damp) {
  o[kv] += (target - o[k]) * stiff;
  o[kv] *= damp;
  o[k]  += o[kv];
}

function updateJuice() {
  juice.t++;
  if (JUICE_OFF) { juice.sq = juice.sqv = 0; return; }
  juice.shake *= 0.86;
  if (juice.shake < 0.15) juice.shake = 0;

  // ao mirar, a Bela se encolhe conforme a força; senão volta ao normal com mola
  let target = 0;
  if (drag && goat.onGround) target = 0.32 * dragPower();
  spring(juice, 'sq', 'sqv', target, 0.22, 0.72);
  juice.sq = Math.max(-0.3, Math.min(0.42, juice.sq));   // nunca deforma demais

  for (const i in juice.dips) {
    const d = juice.dips[i];
    spring(d, 'y', 'v', 0, 0.25, 0.7);
    if (Math.abs(d.y) < 0.05 && Math.abs(d.v) < 0.05) delete juice.dips[i];
  }
}

/** Força atual do arrasto, de 0 a 1 (mesma conta de input.js). */
function dragPower() {
  if (!drag) return 0;
  return Math.min(Math.hypot(goat.x - drag.cx, goat.y - drag.cy) / 80, 1);
}

/**
 * Pouso no topo de uma plataforma.
 * @param {number} pi     - índice da plataforma
 * @param {number} impact - velocidade vertical no momento do contato
 */
function onLandImpact(pi, impact) {
  // deslizando, a física "repousa" a Bela a cada frame com impacto ~0.45:
  // só conta como pouso de verdade acima disso
  if (impact < 1.5 || JUICE_OFF) return;
  const k = Math.min(1, impact / 14);                 // 0 (leve) .. 1 (forte)
  juice.sqv += 0.12 + k * 0.35;                       // achatada na hora
  const d = juice.dips[pi] || (juice.dips[pi] = { y: 0, v: 0 });
  d.v += 1.5 + k * 4;                                 // plataforma afunda
  if (k > 0.25) addShake(1 + k * 4);
  spawnPuffs(goat.x, goat.y + GOAT_R, 3 + Math.round(k * 5));
}

function platDipOf(i) { const d = juice.dips[i]; return d ? d.y : 0; }

/**
 * Expressão a desenhar. A física guarda goat.face (feliz, tonta, triste,
 * vitória); aqui só refinamos o "feliz" com estados de momento.
 */
function goatDisplayFace() {
  const f = goat.face;
  if (f !== 'happy') return f;
  if (drag && goat.onGround) return 'aim';
  if (!goat.onGround && goat.vy > 7) return 'scared';
  const now = performance.now();
  if (goat.onGround && now > juice.blinkAt) {
    if (now > juice.blinkAt + 130) juice.blinkAt = now + 2200 + Math.random() * 2500;
    else return 'blink';
  }
  return 'happy';
}

/** Nuvenzinhas de poeira (ou neve) que crescem enquanto somem. */
function spawnPuffs(x, y, n) {
  for (let i = 0; i < n; i++) {
    const dir = i % 2 ? 1 : -1;
    particles.push({
      x: x + dir * (4 + Math.random() * 8), y: y - 2,
      vx: dir * (0.6 + Math.random() * 1.6), vy: -0.3 - Math.random() * 0.8,
      life: 26 + Math.random() * 10, puff: true, r: 3 + Math.random() * 3,
      snow: CUR && CUR.snow,
    });
  }
}
