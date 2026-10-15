/* =============================================================================
 * levels.js — Mundos e Geração Procedural de Fases do Bela Climb
 * -----------------------------------------------------------------------------
 * Define os 5 mundos (biomas) e a lógica que cria, por algoritmo, as
 * plataformas de cada subfase — com dificuldade progressiva e uma restrição
 * matemática que garante que TODA fase gerada seja fisicamente vencível.
 *
 * Depende de (declaradas em config.js):
 *   W, H                 : dimensões do canvas (limites de tela)
 *   SUBFASES_POR_MUNDO   : nº de subfases por mundo (10)
 *   CUR                  : nível corrente (definido em game.js ao iniciar a fase)
 *
 * VARIÁVEIS/FUNÇÕES QUE ESTE ARQUIVO INJETA NO ESCOPO GLOBAL:
 *   WORLDS         : array com os 5 templates de mundo (bioma, cores, obstáculo)
 *   generateLevel  : monta o objeto de nível procedural para (world, sub)
 *   curLevel       : atalho que retorna o nível corrente (CUR)
 *   plats          : retorna o array de plataformas do nível corrente
 *   topPlat        : retorna a plataforma do topo (onde fica o objetivo)
 * ========================================================================== */

// ---------- Templates dos 5 mundos (biomas) ----------
// Cada mundo define aparência (cores de fundo/nuvem, superfície) e o tipo de
// obstáculo sólido que aparece na primeira plataforma.
const WORLDS = [
  { name:"Floresta", biome:'forest',  bg:['#5cc3f0','#c8f0a0'], snow:false, surface:'log',    cloud:'#ffffff', obstacle:'log' },
  { name:"Rio",      biome:'river',   bg:['#5fc2f2','#b5e6f5'], snow:false, surface:'raft',   cloud:'#eef8ff', obstacle:'wetrock' },
  { name:"Lago",     biome:'lake',    bg:['#76d3df','#e0f7ec'], snow:false, surface:'lily',   cloud:'#eafff7', obstacle:'lily' },
  { name:"Vulcão",   biome:'volcano', bg:['#ff8a4c','#5e1a10'], snow:false, surface:'basalt', cloud:'#ffd0b0', obstacle:'emberrock' },
  { name:"Neve",     biome:'glacier', bg:['#1d2b6b','#8fc3f0'], snow:true,  surface:'ice',    cloud:'#dceeff', obstacle:'icespike' },
];

/** Atalho: retorna o nível corrente montado proceduralmente. */
function curLevel() { return CUR; }

/**
 * Gera o objeto de nível para um dado mundo e subfase.
 *
 * Dificuldade progressiva:
 *   - Largura das plataformas DIMINUI a cada subfase (baseW - sub*6, com piso).
 *   - O espalhamento horizontal AUMENTA a cada subfase (saltos mais longos).
 *
 * Garantia de jogabilidade (anti-fase-impossível):
 *   - A distância horizontal entre os CENTROS de plataformas consecutivas é
 *     limitada por REACH (+ folga proporcional às larguras). Isso mantém todo
 *     salto dentro do alcance real da cabra, mesmo nas subfases mais difíceis.
 *
 * @param {number} world - índice do mundo (0..4)
 * @param {number} sub   - subfase (1..10)
 * @returns {object} nível com plataformas, bioma e cópia original (_orig)
 */
function generateLevel(world, sub, varied = false) {
  const tpl = WORLDS[world % WORLDS.length];
  const depth = world * SUBFASES_POR_MUNDO + (sub - 1); // profundidade acumulada

  // Fase caótica surpresa: gravidade oscilante + vento lateral + arco-íris
  // (physics.js e render.js já tratam a flag CUR.weird). Aparece ~1 a cada 7
  // fases, nunca a primeira do mundo (sub 1) para não confundir logo de cara.
  const weird = sub > 1 && Math.random() < 1 / 7;

  // Largura encolhe com a subfase (com um piso mínimo) — alavanca principal de dificuldade
  const baseW = 112, minW = 46;
  const platW = Math.max(minW, baseW - sub * 6);

  // Modo difícil: 6 plataformas em alturas fixas. Modo Cabra Mansa (`varied`):
  // de 5 a 8 plataformas, com alturas irregulares (ver variedHeights).
  const bottomY = 612, topY = 130; // o topo fica abaixo do HUD + capim flutuante
  const count = varied ? [5, 6, 6, 7, 7, 8][Math.floor(Math.random() * 6)] : 6;
  const ys = varied
    ? variedHeights(count, bottomY, topY)
    : Array.from({ length: count }, (_, i) => Math.round(bottomY - i * (bottomY - topY) / (count - 1)));

  // Espalhamento horizontal cresce com a subfase (saltos diagonais mais longos)
  const spread = Math.min(1, 0.5 + sub * 0.05);

  const platforms = [];
  let prevX = 150;                     // x do CENTRO da plataforma anterior
  let prevW = Math.max(92, platW + 10);

  // Distância horizontal máxima entre CENTROS que a cabra ainda alcança num salto.
  // Valor conservador derivado do alcance real do pulo; sempre vencível.
  const REACH = 150;

  for (let i = 0; i < count; i++) {
    const w = (i === 0) ? Math.max(92, platW + 10) : platW; // 1ª plataforma fica usável
    const y = ys[i];
    let x;
    if (i === 0) {
      x = 150 - w / 2;                                    // guardado como borda esquerda (x)
    } else if (varied) {
      x = variedX(platforms[i - 1], w, y, REACH + (w + prevW) * 0.25, i === 1, spread);
    } else {
      const margin = 22;
      const slack = (w + prevW) * 0.25;                   // folga de pouso pelas larguras
      const maxDX = REACH + slack;
      const dir = (prevX < W / 2) ? 1 : -1;               // tende a alternar os lados
      const want = dir * (60 + spread * 90) * (0.7 + Math.random() * 0.3);
      const dx = Math.max(-maxDX, Math.min(maxDX, want)); // limita ao alcance (mantém vencível)
      let cx = prevX + dx;
      // mantém a plataforma inteira dentro da tela
      cx = Math.max(margin + w / 2, Math.min(W - margin - w / 2, cx));
      x = cx - w / 2;
    }
    platforms.push({ x, y, w });
    prevX = x + w / 2;
    prevW = w;
  }

  return {
    name: tpl.name, biome: tpl.biome, bg: tpl.bg, snow: tpl.snow,
    surface: tpl.surface, cloud: tpl.cloud, obstacle: tpl.obstacle,
    world, sub, depth, weird, platforms,
    // cópia original das posições/larguras — usada ao aplicar dificuldade,
    // reposicionar após a plataforma-surpresa e alinhar a oscilação do topo
    _orig: platforms.map(p => ({ x: p.x, y: p.y, w: p.w })),
  };
}

// ---------- Fases variadas (modo Cabra Mansa) ----------
// Limites que mantêm TODA fase vencível, alinhados à plataforma-surpresa
// (hazards.js usa MAX_DY = 120 e o mesmo corredor de 44px):
const VAR_MIN_GAP = 66;              // degrau mínimo: a Bela (36px) passa por baixo da de cima
const VAR_MAX_GAP = 120;             // degrau máximo: salto confortável
const VAR_CORREDOR = GOAT_R * 2 + 8; // parte da plataforma de baixo que fica descoberta

/**
 * Alturas irregulares de baixo para cima: cada degrau sorteado entre
 * VAR_MIN_GAP e VAR_MAX_GAP, somando a altura disponível. Com poucas
 * plataformas o topo desce um pouco, para nenhum degrau passar do máximo.
 */
function variedHeights(count, bottomY, topY) {
  const n = count - 1;
  const span = Math.min(bottomY - topY, n * VAR_MAX_GAP);
  let gaps = Array.from({ length: n }, () => 0.6 + Math.random() * 0.8);
  const sum0 = gaps.reduce((a, b) => a + b, 0);
  gaps = gaps.map(g => g * span / sum0);
  // prende cada degrau aos limites e redistribui a sobra entre os que ainda têm folga
  for (let pass = 0; pass < 30; pass++) {
    gaps = gaps.map(g => Math.max(VAR_MIN_GAP, Math.min(VAR_MAX_GAP, g)));
    const rest = span - gaps.reduce((a, b) => a + b, 0);
    if (Math.abs(rest) < 0.5) break;
    const free = gaps.map((g, k) => rest > 0 ? g < VAR_MAX_GAP : g > VAR_MIN_GAP);
    const nFree = free.filter(Boolean).length || 1;
    gaps = gaps.map((g, k) => free[k] ? g + rest / nFree : g);
  }
  const ys = [bottomY];
  for (const g of gaps) ys.push(Math.round(ys[ys.length - 1] - g));
  return ys;
}

/** Largura da parte de `abaixo` que `acima` NÃO cobre (por onde a Bela sobe). */
function corredorLivreGen(abaixo, acima) {
  const esq = Math.max(0, acima.x - abaixo.x);
  const dir = Math.max(0, (abaixo.x + abaixo.w) - (acima.x + acima.w));
  return Math.max(esq, dir);
}

/**
 * Posição lateral (borda esquerda) de uma plataforma variada, a partir da
 * anterior. Sorteia lado e distância, e só aceita se:
 *  - o centro fica dentro do alcance do salto (maxDX);
 *  - a plataforma de baixo continua com um corredor livre para a Bela subir;
 *  - na 2ª plataforma, o lado esquerdo da 1ª (onde a Bela nasce, longe do
 *    obstáculo) fica descoberto.
 */
function variedX(prev, w, y, maxDX, second, spread) {
  const margin = 22;
  const prevCx = prev.x + prev.w / 2;
  const ok = (x) => {
    const cx = x + w / 2;
    if (Math.abs(cx - prevCx) > maxDX) return false;
    const cand = { x, y, w };
    if (second) return x - prev.x >= 70;                 // lado da Bela livre
    return corredorLivreGen(prev, cand) >= VAR_CORREDOR;
  };
  const clampX = (cx) => Math.max(margin + w / 2, Math.min(W - margin - w / 2, cx)) - w / 2;
  for (let tries = 0; tries < 24; tries++) {
    const alternate = prevCx < W / 2 ? 1 : -1;
    const dir = second ? 1 : (Math.random() < 0.7 ? alternate : -alternate);
    const dist = (40 + Math.random() * (maxDX - 40)) * (0.6 + spread * 0.4);
    const x = clampX(prevCx + dir * dist);
    if (ok(x)) return x;
  }
  // garantia: encosta do lado oposto, sem cobrir a anterior
  for (const dir of [1, -1]) {
    const x = clampX(prevCx + dir * (prev.w / 2 + w / 2 + 12));
    if (ok(x)) return x;
  }
  return clampX(prevCx + (prevCx < W / 2 ? 1 : -1) * maxDX * 0.8);
}

/** Plataformas do nível corrente. */
function plats() { return CUR.platforms; }

/** Plataforma do topo (onde fica o Super Capim / Pimenta). */
function topPlat() { return plats()[plats().length - 1]; }
