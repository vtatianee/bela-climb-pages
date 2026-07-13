/* =============================================================================
 * game.js — Orquestração e Boot do Bela Climb
 * -----------------------------------------------------------------------------
 * ÚLTIMO script carregado. Amarra todas as pontas dos módulos anteriores:
 * monta cada fase, controla o loop principal, trata vitória e avanço de
 * subfase/mundo, a seleção de dificuldade e a inicialização final do app.
 *
 * Depende de TUDO que veio antes:
 *   config.js  : estado global e constantes
 *   audio.js   : ac, sndCapim, sndWin, sndStar
 *   levels.js  : generateLevel, plats, topPlat
 *   physics.js : stepPhysics, starsFor, triggerHaptic, spawnDust
 *   hazards.js : updateSurprise, updateHazards
 *   render.js  : render, initClouds, positionCapim
 *   input.js   : listeners de toque/arrasto (já vinculados ao canvas)
 *
 * FUNÇÕES QUE ESTE ARQUIVO INJETA NO ESCOPO GLOBAL:
 *   showMsg / hideMsg : exibe/oculta a caixa de mensagem central
 *   initLevel         : monta a subfase atual (procedural + dificuldade + perigos)
 *   winLevel          : trata a coleta do objetivo e a pontuação por estrelas
 *   advanceLevel      : avança para a próxima subfase / mundo
 *   loop              : loop principal (update de perigos, física e render)
 *   startGame         : inicia o jogo com a dificuldade escolhida
 *
 * ORDEM DE INICIALIZAÇÃO (no fim do arquivo):
 *   1) vincula os botões de dificuldade;
 *   2) prepara nuvens e um nível de fundo para a tela de título;
 *   3) renderiza um frame estático atrás do título;
 *   4) o jogo de fato começa quando o jogador toca em "Cabra Mansa/da Peste".
 * ========================================================================== */

// ---------- Mensagens de interface ----------
function showMsg(t){ msgEl.textContent=t; msgEl.classList.add('show'); }
function hideMsg(){ msgEl.classList.remove('show'); }

// ---------- Ciclo de fase ----------
function initLevel() {
  // cancela quaisquer transições pendentes de uma vitória anterior,
  // evitando que um advanceLevel atrasado dispare por cima desta fase (race condition)
  transitionTimers.forEach(clearTimeout);
  transitionTimers = [];
  // build the current level procedurally for this world/subfase
  CUR = generateLevel(world, sub);
  const lv = CUR;
  // apply the difficulty width multiplier (hitbox follows p.w/p.x)
  lv.platforms.forEach((p,i)=>{
    const o = lv._orig[i];
    const center = o.x + o.w/2;
    let nw = o.w * widthMul;                // shrink width on hard mode
    if (i === 0) nw = Math.max(nw, 92);     // first platform stays usable (Bela + obstacle fit)
    p.w = Math.max(32, nw);         // piso de largura: pouso não vira loteria nas subfases altas
    p.x = center - p.w/2;                   // keep platform centered where it was
    p.y = o.y;
  });
  // refresh _orig to the post-multiplier centers (for surprise & top-sway math)
  lv._orig = lv.platforms.map(p=>({x:p.x, y:p.y, w:p.w}));

  // --- hard mode: mark ~30% of platforms as fragile "fake grass" (not first/last) ---
  isHard = (difficulty === 'hard');
  lv.platforms.forEach((p,i)=>{
    p.fragile = isHard && i !== 0 && i !== lv.platforms.length-1 && Math.random() < 0.30;
  });
  breakingTimers = {};
  fallenPlats = {};
  rocks = [];
  // hazards speed up with depth: rocks more frequent, wolf faster
  rockInterval = Math.max(1800, 4000 - lv.depth * 120);
  rockTimer = rockInterval;
  wolfSpeed = WOLF_SPEED + lv.depth * 0.012;
  wolfY = H + 40;            // wolf starts just below the screen
  wolfDelay = 10000;         // appears 10s after the level starts
  const sp = lv.platforms[0];

  // --- obstacle on the first platform (solid: Bela is blocked by it) ---
  obstacle = null;
  if (lv.obstacle) {
    const OW = 26, OH = 30;             // obstacle hitbox size
    const ox = sp.x + sp.w - OW - 6;    // sit near the RIGHT edge of platform
    const oy = sp.y - OH;               // resting on top of the platform
    obstacle = { type: lv.obstacle, x: ox, y: oy, w: OW, h: OH };
  }
  // start Bela toward the LEFT side so she must clear the obstacle to climb
  const startX = obstacle ? (sp.x + 26) : (sp.x + sp.w/2);
  goat = { x: startX, y: sp.y - GOAT_R, vx:0, vy:0, onGround:true, face:'happy', angle:0, spinning:false, plat:0 };
  goat.safeX = goat.x; goat.safeY = goat.y; goat.jumping = false;
  drag = null; won = false; lost = false; particles = [];
  maxTries = START_TRIES; tries = START_TRIES;
  lvlBadge.textContent = `Mundo ${world+1}-${sub}`;
  document.querySelector('#lvlBadge .icon').textContent = '⛰️';
  tryBadge.textContent = `${tries}`;
  btnNext.style.display = 'none';
  hideMsg();
  // reset & show the goal — Super Capim (normal) or Pimenta Malagueta (hard)
  capimEl.classList.remove('coletado');
  capimEl.classList.toggle('pimenta', isHard);
  capimEl.style.display = 'block';
  positionCapim();
  // arm the surprise platform: fires every 4 jumps
  surprise = null;
  jumpCount = 0;
  nextSurpriseAt = 4;
  // trilha de fundo do mundo atual (crossfade só quando o mundo muda)
  playWorldMusic(world);
  cancelAnimationFrame(animFrame);
  loop();
}

function winLevel() {
  won = true; goat.face='win';
  // Super Capim collected: crunchy munch + victory plim, and CSS collect animation
  sndCapim();
  capimEl.classList.add('coletado');
  setTimeout(() => { capimEl.style.display = 'none'; }, 520); // hide after 0.5s anim
  sndWin();
  const missed = maxTries - tries;
  const s = starsFor(missed);
  const starKey = `${world}-${sub}`;
  stars[starKey] = Math.max(stars[starKey]||0, s);
  saveProgress(); // persiste a melhor pontuação de estrelas
  if (isHard) {
    // ate the chili: spicy fire particles + extra spin
    goat.spinning = true; goat.angle = 0;
    for (let i=0;i<26;i++) particles.push({
      x:goat.x, y:goat.y,
      vx:(Math.random()-0.5)*7, vy:-Math.random()*6-1,
      life:34+Math.random()*16, fire:true
    });
    showMsg(`🌶️ Que ardido! ${'⭐'.repeat(s)}${'☆'.repeat(3-s)}`);
  } else {
    for (let i=0;i<14;i++) particles.push({ x:goat.x, y:goat.y, vx:(Math.random()-0.5)*6, vy:-Math.random()*5-2, life:40, gold:true });
    showMsg(`🎉 Super Capim Sagrado! ${'⭐'.repeat(s)}${'☆'.repeat(3-s)}`);
  }
  [0,1,2].forEach((i)=>{ if(i<s) setTimeout(sndStar, 600+i*200); });
  // breve transição, depois carrega a próxima subfase automaticamente.
  // os IDs ficam guardados para poder cancelar se a fase reiniciar antes da hora.
  transitionTimers.push(setTimeout(() => {
    const nextSub = sub < SUBFASES_POR_MUNDO ? sub + 1 : 1;
    const nextWorld = sub < SUBFASES_POR_MUNDO ? world : (world + 1) % WORLDS.length;
    showMsg(`Mundo ${nextWorld+1}-${nextSub} — Vamos lá!`);
  }, 1100));
  transitionTimers.push(setTimeout(advanceLevel, 2100));
}

function advanceLevel() {
  if (sub < SUBFASES_POR_MUNDO) {
    sub++;
  } else {
    sub = 1;
    world = (world + 1) % WORLDS.length; // loop worlds infinitely
  }
  savedProgress[difficulty] = { world, sub }; // lembra onde o jogador está
  saveProgress();
  initLevel();
}

// ---------- Loop principal ----------
function loop(){ updateSurprise(); updateHazards(); stepPhysics(); render(); animFrame=requestAnimationFrame(loop); }

// ---------- Botao de reiniciar fase (apos game over) ----------
btnNext.addEventListener('click',()=>{
  // reiniciar a fase após game over.
  // esconde o botão de imediato para evitar cliques repetidos que iniciariam
  // várias fases em sequência (proteção extra contra loop duplicado).
  btnNext.style.display = 'none';
  initLevel();
});

// ---------- START ----------
const btnEasy = document.getElementById('btnEasy');
const btnHard = document.getElementById('btnHard');

function startGame(diff) {
  difficulty = diff;
  widthMul = (diff === 'hard') ? 0.55 : 1.0;  // hard = much narrower platforms
  ac();          // unlock audio (efeitos)
  unlockMusic(); // destrava as faixas de fundo dentro deste gesto (iOS)
  titleEl.classList.add('fade-out');          // smooth fade
  setTimeout(() => {
    titleEl.style.display = 'none';
    started = true;
    // retoma o progresso salvo desta dificuldade (ou começa do início)
    const p = savedProgress[diff] || { world: 0, sub: 1 };
    world = p.world; sub = p.sub;
    initLevel();
  }, 500); // matches the CSS transition
}

btnEasy.addEventListener('click', () => startGame('easy'));
btnHard.addEventListener('click', () => startGame('hard'));

// ---------- Persistência de progresso (localStorage) ----------
// Guarda a melhor pontuação de estrelas por subfase e a posição atual em cada
// dificuldade, para o jogador retomar de onde parou ao reabrir o app.
const SAVE_KEY = 'belaClimb.save.v1';
let savedProgress = { easy: { world: 0, sub: 1 }, hard: { world: 0, sub: 1 } };

function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d.stars) Object.assign(stars, d.stars);
    if (d.progress) savedProgress = Object.assign(savedProgress, d.progress);
  } catch (e) { /* storage indisponível/corrompido: começa do zero */ }
}
function saveProgress() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ stars, progress: savedProgress }));
  } catch (e) { /* storage cheio/bloqueado: ignora, o jogo segue */ }
}

// ---------- Escala responsiva + safe-areas (notch / Dynamic Island) ----------
// Mantém os 420x680 internos e escala o wrapper para caber na tela útil (menos
// as safe-areas), centralizando dentro dela. O transform é transparente ao
// getBoundingClientRect do canvas, então o toque (input.js) continua alinhado.
function fitGame() {
  const vw = window.innerWidth, vh = window.innerHeight;
  if (!vw || !vh) return;              // layout ainda não pronto: o resize corrige depois
  const cs = getComputedStyle(document.documentElement);
  const px = v => parseFloat(cs.getPropertyValue(v)) || 0;
  const t = px('--sat'), b = px('--sab'), l = px('--sal'), r = px('--sar');
  const availW = vw - l - r;
  const availH = vh - t - b;
  const scale = Math.min(availW / 420, availH / 680, 1) || 1; // nunca 0
  const root = document.documentElement.style;
  root.setProperty('--game-scale', scale);
  root.setProperty('--game-shift-x', ((l - r) / 2) + 'px'); // centraliza na área útil
  root.setProperty('--game-shift-y', ((t - b) / 2) + 'px');
}
window.addEventListener('resize', fitGame);
window.addEventListener('orientationchange', fitGame);

// ---------- Pausa ao ir para segundo plano ----------
// Sem isso, a música e os setTimeout de transição continuavam correndo com o app
// minimizado, causando áudio fantasma e estados estranhos ao voltar.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(animFrame);
    setMusicMuted(true);                 // pausa a música de fundo
    if (audioCtx) audioCtx.suspend();    // suspende os efeitos
  } else {
    if (audioCtx) audioCtx.resume();
    if (soundOn) setMusicMuted(false);   // retoma a música (se o som estiver ligado)
    if (started) { cancelAnimationFrame(animFrame); loop(); } // retoma o loop sem duplicar
  }
});

// idle render behind title
loadProgress();
fitGame();
initClouds();
CUR = generateLevel(0, 1); // idle background level behind the title
goat = {x:210,y:400,vx:0,vy:0,onGround:true,face:'happy',angle:0,spinning:false};
render();
