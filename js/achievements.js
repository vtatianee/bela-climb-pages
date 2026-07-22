/* =============================================================================
 * achievements.js — Conquistas do Bela Climb
 * -----------------------------------------------------------------------------
 * Conquistas LOCAIS: tudo fica no aparelho (localStorage), funciona offline e
 * não coleta nenhum dado — mantém a promessa "Data Not Collected" da ficha da
 * App Store. (Espelhar no Game Center é uma possibilidade futura; a lista de ids
 * abaixo já serve de base para isso.)
 *
 * Como funciona:
 *   - ACHIEVEMENTS define a lista (id, emoji e as chaves de tradução).
 *   - Os "gatilhos" são checados em achOnLevelWin(), chamada por game.js quando
 *     a fase é vencida. Os perigos que aconteceram durante a fase chegam por
 *     `levelFlags` (config.js), preenchida em hazards.js.
 *   - Contadores acumulados (fases, sequência de 3 estrelas, biomas visitados)
 *     ficam no mesmo blob persistido.
 *
 * Depende de (globais):
 *   t()            (i18n.js)     — textos
 *   stars          (config.js)   — melhores estrelas por fase, para o total
 *   levelFlags     (config.js)   — o que aconteceu na fase atual
 *
 * FUNÇÕES QUE ESTE ARQUIVO INJETA NO ESCOPO GLOBAL:
 *   ACHIEVEMENTS      : a lista de conquistas
 *   loadAchievements  : carrega o progresso salvo
 *   achOnLevelWin     : avalia os gatilhos ao vencer uma fase
 *   isAchUnlocked     : true se a conquista já foi desbloqueada
 *   achUnlockedCount  : quantas já foram desbloqueadas
 *   renderAchievements: monta a lista na tela de conquistas
 * ========================================================================== */

const ACH_KEY = 'belaClimb.ach.v1';

// id: usado na persistência (não mudar depois de publicado).
// nome/descrição vêm do i18n com as chaves `ach_<id>` e `ach_<id>_d`.
const ACHIEVEMENTS = [
  { id: 'first_climb', emoji: '🐐' },
  { id: 'world1',      emoji: '⛰️' },
  { id: 'biomes5',     emoji: '🌍' },
  { id: 'marathon',    emoji: '🏃' },
  { id: 'perfect',     emoji: '⭐' },
  { id: 'triple',      emoji: '✨' },
  { id: 'stars30',     emoji: '💎' },
  { id: 'hard_first',  emoji: '⚡' },
  { id: 'wolf_escape', emoji: '🐺' },
  { id: 'rock_hit',    emoji: '🪨' },
  { id: 'chaos',       emoji: '🌪️' },
  { id: 'fake_grass',  emoji: '🍃' },
];

let achState = {
  unlocked: {},                       // { id: true }
  counters: { levels: 0, streak3: 0, biomes: {} },
};

/** Carrega o progresso de conquistas do localStorage. */
function loadAchievements() {
  try {
    const raw = localStorage.getItem(ACH_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d.unlocked) achState.unlocked = d.unlocked;
    if (d.counters) achState.counters = Object.assign(achState.counters, d.counters);
  } catch (e) { /* storage indisponível: começa do zero */ }
}

function saveAchievements() {
  try { localStorage.setItem(ACH_KEY, JSON.stringify(achState)); } catch (e) {}
}

/** true se a conquista já foi desbloqueada. */
function isAchUnlocked(id) { return !!achState.unlocked[id]; }

/** Quantas conquistas já foram desbloqueadas. */
function achUnlockedCount() { return Object.keys(achState.unlocked).length; }

/** Soma das melhores estrelas de todas as fases já jogadas. */
function totalStars() {
  let n = 0;
  for (const k in stars) n += stars[k] || 0;
  return n;
}

/**
 * Desbloqueia uma conquista (idempotente) e mostra o aviso.
 * @param {string} id
 */
function unlockAchievement(id) {
  if (achState.unlocked[id]) return;       // já tinha
  achState.unlocked[id] = true;
  saveAchievements();
  showAchToast(id);
}

/**
 * Avalia todos os gatilhos ao vencer uma fase.
 * @param {number} s - estrelas ganhas nesta fase (1..3)
 */
function achOnLevelWin(s) {
  const c = achState.counters;
  c.levels = (c.levels || 0) + 1;
  c.biomes[world] = true;
  c.streak3 = (s === 3) ? (c.streak3 || 0) + 1 : 0;   // sequência de fases perfeitas

  // --- progresso ---
  if (world === 0 && sub === 1) unlockAchievement('first_climb');
  if (world === 0 && sub === SUBFASES_POR_MUNDO) unlockAchievement('world1');
  if (Object.keys(c.biomes).length >= 5) unlockAchievement('biomes5');
  if (c.levels >= 50) unlockAchievement('marathon');

  // --- perícia ---
  if (s === 3) unlockAchievement('perfect');
  if (c.streak3 >= 3) unlockAchievement('triple');
  if (totalStars() >= 30) unlockAchievement('stars30');

  // --- coragem (modo difícil / fase caótica) ---
  if (isHard) {
    unlockAchievement('hard_first');
    if (levelFlags.wolfSeen)     unlockAchievement('wolf_escape');
    if (levelFlags.rockHit)      unlockAchievement('rock_hit');
    if (levelFlags.platformFell) unlockAchievement('fake_grass');
  }
  if (CUR && CUR.weird) unlockAchievement('chaos');

  saveAchievements();
}

// ---------- Aviso de desbloqueio (toast) ----------
let achToastTimer = null;

/** Mostra o aviso "Conquista desbloqueada" por alguns segundos. */
function showAchToast(id) {
  const el = document.getElementById('achToast');
  if (!el) return;
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a) return;
  el.innerHTML = '';
  const emoji = document.createElement('div');
  emoji.className = 'achToastEmoji';
  emoji.textContent = a.emoji;
  const txt = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'achToastTitle';
  title.textContent = t('ach_unlocked');
  const name = document.createElement('div');
  name.className = 'achToastName';
  name.textContent = t('ach_' + a.id);
  txt.appendChild(title); txt.appendChild(name);
  el.appendChild(emoji); el.appendChild(txt);
  el.classList.add('show');
  clearTimeout(achToastTimer);
  achToastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

// ---------- Tela de conquistas ----------

/** Monta a lista de conquistas (desbloqueadas coloridas, bloqueadas em cinza). */
function renderAchievements() {
  const list = document.getElementById('achList');
  if (!list) return;
  list.innerHTML = '';
  for (const a of ACHIEVEMENTS) {
    const got = isAchUnlocked(a.id);
    const row = document.createElement('div');
    row.className = 'achItem' + (got ? ' got' : '');

    const emoji = document.createElement('div');
    emoji.className = 'achEmoji';
    emoji.textContent = got ? a.emoji : '🔒';

    const info = document.createElement('div');
    info.className = 'achInfo';
    const nm = document.createElement('div');
    nm.className = 'achName';
    nm.textContent = t('ach_' + a.id);
    const ds = document.createElement('div');
    ds.className = 'achDesc';
    ds.textContent = t('ach_' + a.id + '_d');
    info.appendChild(nm); info.appendChild(ds);

    row.appendChild(emoji); row.appendChild(info);
    list.appendChild(row);
  }
  const counter = document.getElementById('achCount');
  if (counter) counter.textContent = t('ach_count', achUnlockedCount(), ACHIEVEMENTS.length);
}
