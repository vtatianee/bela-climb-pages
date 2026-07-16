/* =============================================================================
 * config.js — Estado Global e Constantes do Bela Climb
 * -----------------------------------------------------------------------------
 * PRIMEIRO script a ser carregado. Declara TODAS as variáveis globais
 * compartilhadas entre os demais módulos (audio, levels, physics, hazards,
 * render, input, game). Como usamos scripts clássicos (não módulos ES), tudo
 * declarado aqui fica visível no escopo global da página.
 *
 * VARIÁVEIS QUE ESTE ARQUIVO INJETA NO ESCOPO GLOBAL:
 *
 *  — Referências ao DOM / Canvas —
 *   canvas, ctx        : elemento <canvas> e seu contexto de desenho 2D
 *   W, H               : largura e altura do canvas (420 x 680)
 *   msgEl              : caixa de mensagem central (#message)
 *   btnNext            : botão de reiniciar fase (#btnNext)
 *   lvlBadge           : texto do mundo/fase no HUD (#lvlText)
 *   tryBadge           : texto de vidas no HUD (#tryText)
 *   soundBtn           : botão de som (#soundBtn) — usado por audio.js
 *   wrapperEl          : container do jogo (#gameWrapper); recebe a classe
 *                        'playing' para mostrar o HUD só durante a partida
 *   titleEl            : tela de título/seleção (#title)
 *   capimEl            : elemento do objetivo, Capim/Pimenta (#superCapim)
 *
 *  — Constantes de física —
 *   GOAT_R             : raio de colisão da cabra
 *   GRAVITY            : aceleração da gravidade por frame
 *   BOUNCE             : coeficiente de quique
 *   FRICTION           : atrito ao pousar
 *   MAX_FORCE          : força máxima do salto (arrasto no limite)
 *   START_TRIES        : vidas iniciais por fase
 *   WOLF_SPEED         : velocidade base de subida do lobo (modo difícil)
 *   SUBFASES_POR_MUNDO : quantidade de subfases por mundo (10)
 *
 *  — Estado de progresso —
 *   world, sub         : mundo (0..4) e subfase atual (1..10)
 *   CUR                : nível corrente montado proceduralmente (ver levels.js)
 *   stars              : melhor pontuação de estrelas por subfase
 *
 *  — Estado da rodada / personagem —
 *   tries, maxTries    : vidas restantes / vidas máximas da fase
 *   goat               : objeto da cabra (posição, velocidade, estado)
 *   drag               : estado do arrasto atual (mira do salto)
 *   won, lost          : flags de vitória / derrota
 *   animFrame          : id do requestAnimationFrame (para cancelar o loop)
 *   particles          : partículas ativas (poeira, fogo, confete, arco-íris)
 *   obstacle           : obstáculo sólido na primeira plataforma
 *   started            : true depois que o jogador escolhe a dificuldade
 *   paused             : true enquanto o menu de pausa está aberto
 *   difficulty         : 'easy' (Cabra Mansa) | 'hard' (Cabra da Peste)
 *   widthMul           : multiplicador de largura das plataformas (dificuldade)
 *
 *  — Perigos do modo difícil —
 *   isHard             : atalho booleano = (difficulty === 'hard')
 *   breakingTimers     : timers das plataformas de "grama falsa"
 *   fallenPlats        : plataformas que já despencaram
 *   rocks              : pedras rolantes ativas
 *   rockTimer          : contagem até a próxima pedra
 *   rockInterval       : intervalo entre pedras (diminui com a profundidade)
 *   wolfSpeed          : velocidade atual do lobo (cresce com a profundidade)
 *   wolfY              : posição (topo) do lobo que sobe; H = fora da tela
 *   wolfDelay          : atraso antes do lobo começar a subir (10s)
 *
 *  — Plataforma-surpresa —
 *   surprise           : estado da plataforma que se move de surpresa
 *   jumpCount          : saltos dados na fase atual
 *   nextSurpriseAt     : nº de saltos para disparar a próxima surpresa
 *
 *  — Nuvens decorativas —
 *   clouds             : nuvens de fundo (ver render.js)
 * ========================================================================== */

// ---------- Referências ao DOM / Canvas ----------
const canvas  = document.getElementById('c');
const ctx     = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const msgEl    = document.getElementById('message');
const btnNext  = document.getElementById('btnNext');
const lvlBadge = document.getElementById('lvlText');
const tryBadge = document.getElementById('tryText');
const soundBtn = document.getElementById('soundBtn');
const wrapperEl = document.getElementById('gameWrapper');
const titleEl  = document.getElementById('title');
const capimEl  = document.getElementById('superCapim');

// ---------- Constantes de física ----------
const GOAT_R = 18, GRAVITY = 0.45, BOUNCE = 0.28, FRICTION = 0.82, MAX_FORCE = 22;
const START_TRIES = 5;
const WOLF_SPEED = 0.18;          // velocidade base de subida do lobo
const SUBFASES_POR_MUNDO = 10;    // subfases por mundo

// ---------- Estado de progresso ----------
let world = 0;   // índice do mundo (0..4)
let sub = 1;     // subfase atual (1..10)
let CUR = null;  // nível corrente construído proceduralmente (levels.js)
const stars = {}; // melhor pontuação de estrelas por chave "world-sub"

// ---------- Estado da rodada / personagem ----------
let tries, maxTries;
let goat, drag, won, lost, animFrame, particles = [];
let obstacle = null;        // obstáculo sólido na primeira plataforma
let started = false;        // true após escolher a dificuldade
let paused = false;         // true enquanto o menu de pausa está aberto
let difficulty = 'easy';    // 'easy' (Cabra Mansa) | 'hard' (Cabra da Peste)
let widthMul = 1.0;         // multiplicador de largura das plataformas

// ---------- Perigos do modo difícil ("Cabra da Peste") ----------
let isHard = false;         // atalho = (difficulty === 'hard')
let breakingTimers = {};    // índice da plataforma -> ms até desabar
let fallenPlats = {};       // índice da plataforma -> true quando já caiu
let rocks = [];             // pedras rolantes { x, y, vx, vy, r, spin }
let rockTimer = 0;          // ms até a próxima pedra
let rockInterval = 4000;    // ms entre pedras (diminui com a profundidade)
let wolfSpeed = 0.18;       // velocidade atual do lobo (cresce com a profundidade)
let wolfY = H;              // posição (topo) do lobo; H = fora da tela
let wolfDelay = 10000;      // ms antes do lobo começar a subir

// ---------- Plataforma-surpresa ----------
let surprise = null;        // { idx, fromX, fromY, toX, toY, t, dur, done }
let jumpCount = 0;          // saltos dados nesta fase
let nextSurpriseAt = 4;     // nº de saltos para disparar a próxima surpresa

// ---------- Nuvens decorativas ----------
let clouds = [];

// ---------- Timers de transição entre fases ----------
// Guarda os IDs dos setTimeout usados na vitória/transição, para poder
// cancelá-los ao reiniciar a fase e evitar loops duplicados (race condition).
let transitionTimers = [];
