/* =============================================================================
 * hazards.js — Perigos Dinâmicos e Plataforma-Surpresa do Bela Climb
 * -----------------------------------------------------------------------------
 * Contém:
 *  (A) a plataforma-surpresa (move-se a cada 4 saltos) e a oscilação contínua
 *      da plataforma do topo — ativas em qualquer modo;
 *  (B) os perigos do "Modo Cabra da Peste" (difícil): plataformas de grama
 *      falsa que desabam, pedras rolantes e o Lobo Faminto que sobe da base.
 *
 * Depende de (declaradas em config.js):
 *   CUR, W, H, GOAT_R, goat, started, won, lost, surprise, jumpCount,
 *   nextSurpriseAt, isHard, breakingTimers, fallenPlats, rocks, rockTimer,
 *   rockInterval, wolfSpeed, wolfY, wolfDelay, btnNext
 * Depende de (definidas em outros módulos):
 *   plats                     (levels.js)
 *   beep, sndFall             (audio.js)
 *   spawnDust, loseTry        (physics.js)
 *   triggerHaptic             (physics.js)
 *   showMsg, hideMsg          (game.js)
 *
 * FUNÇÕES QUE ESTE ARQUIVO INJETA NO ESCOPO GLOBAL:
 *   triggerSurprise : escolhe e dispara o deslocamento de uma plataforma
 *   updateSurprise  : anima a surpresa + oscila a plataforma do topo (por frame)
 *   updateHazards   : atualiza grama frágil, pedras rolantes e lobo (por frame)
 * ========================================================================== */

// ---------- (A) Plataforma-surpresa ----------

/**
 * Escolhe uma plataforma elegível e define seu deslocamento repentino.
 * NUNCA move a primeira, a do topo (objetivo) ou a que a cabra ocupa agora.
 */
function triggerSurprise() {
  const ps = plats();
  const candidates = [];
  for (let i = 1; i < ps.length - 1; i++) {
    if (i !== goat.plat) candidates.push(i); // não puxa a plataforma sob a cabra
  }
  if (candidates.length === 0) { surprise = { done: true }; return; }
  const idx = candidates[Math.floor(Math.random() * candidates.length)];
  const p = ps[idx];

  // Alcance máximo (centro-a-centro) que a cabra realmente vence num salto.
  // ALINHADO à geração de fases (levels.js): lá todo salto é garantido vencível
  // com REACH horizontal + folga proporcional às larguras. A surpresa precisa
  // respeitar o MESMO limite, senão pode mover uma plataforma para um ponto
  // "alcançável" na conta antiga (300px) mas impossível de verdade — e como ela
  // TRAVA nessa posição até o fim da fase, a fase fica impossível (Bela presa).
  const REACH = 150;    // mesmo valor conservador usado em generateLevel()
  const MAX_DY = 120;   // ~1 passo vertical entre plataformas (span/(count-1) ≈ 96) + folga

  const prev = ps[idx - 1]; // vizinha de baixo
  const next = ps[idx + 1]; // vizinha de cima

  // Verifica se, com o novo (toX,toY), os saltos vizinho->idx e idx->vizinho
  // continuam dentro do alcance real. Usa a MESMA folga da geração: (w+wViz)*0.25.
  // Não exige ordem vertical estrita (a cabra pode pular para os lados).
  function reachable(toX, toY) {
    const cx = toX + p.w / 2;
    const prevCx = prev.x + prev.w / 2;
    const nextCx = next.x + next.w / 2;
    const okPrev = Math.abs(cx - prevCx) <= REACH + (p.w + prev.w) * 0.25 && Math.abs(prev.y - toY) <= MAX_DY;
    const okNext = Math.abs(nextCx - cx) <= REACH + (p.w + next.w) * 0.25 && Math.abs(toY - next.y) <= MAX_DY;
    return okPrev && okNext;
  }

  // Candidatos de deslocamento (embaralhados), testados até achar um que mantém a fase jogável.
  const dirs = [
    { dx: 0,   dy: -55 }, // cima
    { dx: 0,   dy:  55 }, // baixo
    { dx: -70, dy: 0 },   // esquerda
    { dx: 70,  dy: 0 },   // direita
  ].sort(() => Math.random() - 0.5);

  let toX = null, toY = null;
  for (const d of dirs) {
    let cx = Math.max(8, Math.min(W - p.w - 8, p.x + d.dx));
    let cy = Math.max(70, Math.min(H - 60, p.y + d.dy));
    if (reachable(cx, cy)) { toX = cx; toY = cy; break; }
  }
  // se nenhuma direção for segura, não move (melhor não atrapalhar do que bloquear)
  if (toX === null) { surprise = { done: true }; return; }

  surprise = { idx, fromX: p.x, fromY: p.y, toX, toY, t: 0, dur: 26, done: false };
  showMsg('⚠️ Uma pedra se mexeu!');
  setTimeout(() => { if (!won && !lost) hideMsg(); }, 1500);
  beep(220, 0.18, 'sawtooth', 0.12, 140); // som grave de deslocamento
}


/**
 * A cada frame: oscila a plataforma do topo (esquerda↔direita) e, quando o
 * contador de saltos atinge o limite, dispara e anima a plataforma-surpresa.
 */
function updateSurprise() {
  const lv = CUR;

  // a plataforma do topo (objetivo) balança continuamente
  if (started && lv._orig) {
    const last = lv.platforms.length - 1;
    // congela o balanço se a cabra está em cima dela (não escorregá-la para fora)
    if (!(goat.onGround && goat.plat === last)) {
      const tp = lv.platforms[last];
      const o = lv._orig[last];
      const center = o.x + o.w / 2;         // centro original
      const baseX = center - tp.w / 2;      // x de repouso (largura possivelmente reduzida)
      const amp = 55;                       // amplitude do balanço
      let nx = baseX + Math.sin(Date.now() / 700) * amp;
      nx = Math.max(8, Math.min(W - tp.w - 8, nx)); // mantém na tela
      tp.x = nx;
    }
  }

  // dispara ao atingir o limite de saltos; re-arma para os próximos 4
  if ((!surprise || surprise.done) && started && !won && !lost && jumpCount >= nextSurpriseAt) {
    nextSurpriseAt += 4;
    triggerSurprise();
  }
  if (!surprise || surprise.done) return;

  // interpolação suave (easeInOutQuad); atualiza p.x/p.y para a hitbox acompanhar
  surprise.t++;
  const p = plats()[surprise.idx];
  const k = Math.min(1, surprise.t / surprise.dur);
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  p.x = surprise.fromX + (surprise.toX - surprise.fromX) * e;
  p.y = surprise.fromY + (surprise.toY - surprise.fromY) * e;
  if (k >= 1) {
    p.x = surprise.toX; p.y = surprise.toY; // trava na nova posição até o fim da fase
    surprise.done = true;
  }
}

// ---------- (B) Perigos do modo difícil ----------

/**
 * Atualiza, a cada frame (somente no modo difícil), os três perigos:
 *  (2) grama falsa que desaba após o timer;
 *  (3) pedras rolantes que descem e empurram/ferem a cabra;
 *  (4) Lobo Faminto que sobe da base — encostar = fim de jogo instantâneo.
 */
function updateHazards() {
  if (!isHard || !started || won || lost) return;
  const dt = 16; // ~ms por frame

  // --- (2) plataformas de grama falsa: contam o tempo e desabam ---
  for (const k in breakingTimers) {
    breakingTimers[k] -= dt;
    if (breakingTimers[k] <= 0) {
      const pi = +k;
      fallenPlats[pi] = true;            // desaba — sem colisão
      delete breakingTimers[k];
      spawnDust(plats()[pi].x + plats()[pi].w / 2, plats()[pi].y);
      beep(110, 0.3, 'sawtooth', 0.13, 50); // estrondo
      // se a cabra estava em cima, ela cai
      if (goat.onGround && goat.plat === pi) {
        goat.onGround = false; goat.jumping = true; goat.vy = 0.5; goat.face = 'sad';
      }
    }
  }

  // --- (3) pedras rolantes ---
  rockTimer -= dt;
  if (rockTimer <= 0) {
    rockTimer = rockInterval + Math.random() * 800; // frequência cresce com a profundidade
    const r = 11 + Math.random() * 6;
    rocks.push({ x: 40 + Math.random() * (W - 80), y: -20, vx: (Math.random() - 0.5) * 1.2, vy: 2.4 + Math.random() * 1.2, r, spin: 0 });
    beep(300, 0.15, 'sawtooth', 0.08, 160);
  }
  for (const rk of rocks) {
    rk.x += rk.vx; rk.y += rk.vy; rk.vy += 0.05; rk.spin += rk.vx * 0.05 + 0.04;
    if (rk.x < rk.r || rk.x > W - rk.r) rk.vx *= -1;
    // atingiu a cabra? empurra para baixo e custa uma vida (loseTry já vibra HEAVY)
    if (!rk.hit && Math.hypot(rk.x - goat.x, rk.y - goat.y) < rk.r + GOAT_R) {
      rk.hit = true;
      goat.onGround = false; goat.jumping = true;
      goat.vy = 7; goat.vx += rk.vx * 2; goat.face = 'dizzy';
      sndFall();
      loseTry("🪨 Pedra rolante!");
    }
  }
  rocks = rocks.filter(rk => rk.y < H + 30 && !rk.hit);

  // --- (4) Lobo Faminto subindo da base (após 10s de carência) ---
  if (wolfDelay > 0) {
    wolfDelay -= dt;
  } else {
    wolfY -= wolfSpeed * 2; // sobe devagar, mais rápido conforme a profundidade
    if (goat.y + GOAT_R >= wolfY) {
      // o lobo alcançou a cabra — fim de jogo instantâneo
      triggerHaptic('HEAVY'); // impacto tátil forte de colisão fatal
      lost = true;
      goat.face = 'sad';
      sndFall();
      showMsg("🐺 O Lobo Faminto pegou a Bela! Fim de jogo.");
      btnNext.style.display = 'block';
      btnNext.textContent = '↻ Reiniciar Fase';
    }
  }
}
