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
  { name:"Floresta", biome:'forest',  bg:['#7ec8e3','#bfe3a8'], snow:false, surface:'rock', cloud:'#ffffff', obstacle:'log' },
  { name:"Rio",      biome:'river',   bg:['#8fd0e8','#a8d8ea'], snow:false, surface:'wood', cloud:'#eef8ff', obstacle:'wetrock' },
  { name:"Lago",     biome:'lake',    bg:['#9fd4d0','#cfeee6'], snow:false, surface:'rock', cloud:'#eafff7', obstacle:'lily' },
  { name:"Vulcão",   biome:'volcano', bg:['#e08050','#7a2a18'], snow:false, surface:'rock', cloud:'#ffd0b0', obstacle:'emberrock' },
  { name:"Neve",     biome:'glacier', bg:['#2a3a6e','#9ec8e8'], snow:true,  surface:'ice',  cloud:'#dceeff', obstacle:'icespike' },
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
function generateLevel(world, sub) {
  const tpl = WORLDS[world % WORLDS.length];
  const depth = world * SUBFASES_POR_MUNDO + (sub - 1); // profundidade acumulada

  // Fase caótica surpresa: gravidade oscilante + vento lateral + arco-íris
  // (physics.js e render.js já tratam a flag CUR.weird). Aparece ~1 a cada 7
  // fases, nunca a primeira do mundo (sub 1) para não confundir logo de cara.
  const weird = sub > 1 && Math.random() < 1 / 7;

  // Largura encolhe com a subfase (com um piso mínimo) — alavanca principal de dificuldade
  const baseW = 112, minW = 46;
  const platW = Math.max(minW, baseW - sub * 6);

  // Nº fixo de plataformas mantém a escalada dentro da tela;
  // a dificuldade vem da largura menor + espalhamento horizontal.
  const count = 6;
  const bottomY = 612, topY = 130; // o topo fica abaixo do HUD + capim flutuante
  const span = bottomY - topY;
  const gap = span / (count - 1);

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
    const y = Math.round(bottomY - i * gap);
    let x;
    if (i === 0) {
      x = 150 - w / 2;                                    // guardado como borda esquerda (x)
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

/** Plataformas do nível corrente. */
function plats() { return CUR.platforms; }

/** Plataforma do topo (onde fica o Super Capim / Pimenta). */
function topPlat() { return plats()[plats().length - 1]; }
