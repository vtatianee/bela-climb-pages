/* =============================================================================
 * physics.js — Motor de Física e Colisão do Bela Climb
 * -----------------------------------------------------------------------------
 * Motor próprio (sem engine de terceiros) que atualiza a cabra a cada frame:
 * gravidade, atrito, quique, colisão com plataformas/obstáculo, regras de
 * vitória e de perda de vida. Também integra o feedback tátil nativo (Haptics)
 * do Capacitor nos momentos de impacto.
 *
 * Depende de (declaradas em config.js):
 *   goat, drag, CUR, W, H, GOAT_R, GRAVITY, BOUNCE, FRICTION, obstacle,
 *   particles, fallenPlats, breakingTimers, tries, won, lost, tryBadge, btnNext
 * Depende de (definidas em outros módulos):
 *   plats, topPlat            (levels.js)
 *   sndLand, sndFall, beep    (audio.js)
 *   spawnDust                 (este arquivo)
 *   showMsg, hideMsg, winLevel(game.js)
 *
 * FUNÇÕES QUE ESTE ARQUIVO INJETA NO ESCOPO GLOBAL:
 *   triggerHaptic  : dispara vibração tátil nativa (Capacitor Haptics)
 *   stepPhysics    : avança a física da cabra um frame
 *   landOnPlatform : resolve o pouso (sucesso / salto perdido / grama frágil)
 *   loseTry        : desconta uma vida e trata o fim de jogo
 *   spawnDust      : cria partículas de poeira ao pousar
 *   checkWin       : verifica se a cabra alcançou o objetivo no topo
 *   starsFor       : converte nº de erros em estrelas (3/2/1)
 *   fallLose       : trata a queda para fora da tela
 * ========================================================================== */

/**
 * Dispara a vibração tátil nativa do dispositivo via plugin @capacitor/haptics.
 * No navegador (sem Capacitor) a chamada é ignorada silenciosamente, então o
 * jogo continua funcionando igual fora do app nativo.
 * @param {'LIGHT'|'HEAVY'} type - intensidade do impacto tátil
 */
async function triggerHaptic(type = 'LIGHT') {
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
    try {
      if (type === 'HEAVY') await window.Capacitor.Plugins.Haptics.impact({ style: 'HEAVY' });
      else await window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' });
    } catch (e) { /* Haptics indisponível (ex.: fora do app nativo): ignora */ }
  }
}

/**
 * Avança a física da cabra em um frame:
 * aplica gravidade, move, e resolve colisões com bordas, obstáculo e plataformas.
 */
function stepPhysics() {
  // atualiza partículas
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--; }

  if (goat.onGround || drag) return;

  if (CUR.weird) {
    // gravidade "bêbada": puxão vertical oscila + vento lateral (fase especial)
    const t = Date.now() / 1000;
    const gMul = 0.55 + Math.sin(t * 1.3) * 0.85;
    goat.vy += GRAVITY * gMul;
    goat.vx += Math.sin(t * 0.9) * 0.18;
    if (Math.random() < 0.7) {
      particles.push({ x: goat.x, y: goat.y, vx: 0, vy: 0, life: 18, rainbow: true, hue: (t * 200) % 360 });
    }
  } else {
    goat.vy += GRAVITY;
  }

  goat.x += goat.vx; goat.y += goat.vy;
  if (goat.spinning) goat.angle += goat.vx * 0.06;

  // paredes laterais
  if (goat.x - GOAT_R < 0) { goat.x = GOAT_R; goat.vx *= -BOUNCE; }
  if (goat.x + GOAT_R > W) { goat.x = W - GOAT_R; goat.vx *= -BOUNCE; }

  // --- colisão com o obstáculo sólido (círculo vs caixa): a cabra é bloqueada ---
  if (obstacle) {
    const o = obstacle;
    const nx = Math.max(o.x, Math.min(goat.x, o.x + o.w));
    const ny = Math.max(o.y, Math.min(goat.y, o.y + o.h));
    const ddx = goat.x - nx, ddy = goat.y - ny;
    const d2 = ddx * ddx + ddy * ddy;
    if (d2 < GOAT_R * GOAT_R) {
      const d = Math.sqrt(d2) || 0.0001;
      const push = (GOAT_R - d);
      if (Math.abs(ddx) > Math.abs(ddy)) {
        goat.x += (ddx / d) * push;   // empurrada para o lado
        goat.vx *= -BOUNCE;
        goat.face = 'dizzy'; sndLand();
      } else {
        if (ddy < 0) {                // bateu no topo do obstáculo
          goat.y += (ddy / d) * push;
          goat.vy = 0;
        } else {                      // bateu por baixo
          goat.y += (ddy / d) * push;
          goat.vy *= -BOUNCE;
        }
      }
    }
  }

  const PH = 18; // altura da plataforma
  for (let pi = 0; pi < plats().length; pi++) {
    if (fallenPlats[pi]) continue;   // plataforma já despencou — sem colisão
    const p = plats()[pi];
    const overlapX = goat.x + GOAT_R > p.x && goat.x - GOAT_R < p.x + p.w;
    if (!overlapX) continue;

    // --- pousando no topo (caindo) ---
    if (goat.vy >= 0 &&
        goat.y + GOAT_R >= p.y && goat.y + GOAT_R <= p.y + PH + 12 &&
        goat.x > p.x && goat.x < p.x + p.w) {
      goat.y = p.y - GOAT_R;
      goat.vx *= FRICTION; goat.vy = 0;
      goat.spinning = false; goat.angle = 0;
      sndLand(); spawnDust(goat.x, p.y);
      if (Math.abs(goat.vx) < 0.5) {
        goat.vx = 0; goat.onGround = true; goat.face = 'happy';
        landOnPlatform(pi);
        checkWin();
      } else { goat.face = 'dizzy'; }
      break;
    }

    // --- batendo por baixo (subindo) ---
    if (goat.vy < 0 &&
        goat.y - GOAT_R <= p.y + PH && goat.y - GOAT_R >= p.y + PH - 14 &&
        goat.x > p.x && goat.x < p.x + p.w) {
      goat.y = p.y + PH + GOAT_R;
      goat.vy *= -BOUNCE;            // cabeçada, quica de volta
      goat.face = 'dizzy';
      sndLand();
      break;
    }

    // --- batendo nas laterais ---
    if (goat.y + GOAT_R > p.y + 2 && goat.y - GOAT_R < p.y + PH - 2) {
      if (goat.vx > 0 && goat.x + GOAT_R > p.x && goat.x < p.x) {
        goat.x = p.x - GOAT_R; goat.vx *= -BOUNCE; sndLand();
      } else if (goat.vx < 0 && goat.x - GOAT_R < p.x + p.w && goat.x > p.x + p.w) {
        goat.x = p.x + p.w + GOAT_R; goat.vx *= -BOUNCE; sndLand();
      }
    }
  }

  // caiu para fora da tela
  if (goat.y - GOAT_R > H + 50 && !won && !lost && goat.jumping) {
    sndFall(); goat.face = 'sad'; fallLose();
  }
}

/**
 * Resolve o que acontece quando a cabra assenta numa plataforma:
 * inicia o timer da "grama falsa", registra progresso e decide se foi
 * um salto de sucesso (subiu) ou um salto perdido (mesma/menor plataforma).
 * @param {number} pi - índice da plataforma onde pousou
 */
function landOnPlatform(pi) {
  // "grama falsa" frágil: ao pousar, ela desaba após 2s se a cabra não sair
  const lp = plats()[pi];
  if (lp && lp.fragile && !fallenPlats[pi] && breakingTimers[pi] === undefined) {
    breakingTimers[pi] = 2000; // ms
    beep(160, 0.12, 'square', 0.1, 90); // rangido
  }

  if (!goat.jumping) {            // assentando sem um salto real (ex.: início)
    goat.plat = pi; goat.safeX = goat.x; goat.safeY = goat.y;
    return;
  }
  goat.jumping = false;
  if (pi > goat.plat) {
    // SUCESSO: alcançou uma plataforma mais alta — vibração leve de impacto positivo
    triggerHaptic('LIGHT');
    goat.plat = pi;
    goat.safeX = goat.x; goat.safeY = goat.y;
  } else {
    // ERRO: pousou na mesma ou numa mais baixa — custa uma vida
    goat.plat = pi;
    goat.safeX = goat.x; goat.safeY = goat.y;
    loseTry("🐐 Salto perdido! ↩");
  }
}

/**
 * Desconta uma vida e mostra o feedback. Ao zerar, encerra a fase.
 * Todo dano/erro passa por aqui, então disparamos a vibração forte (HEAVY).
 * @param {string} msg - mensagem exibida ao jogador
 */
function loseTry(msg) {
  triggerHaptic('HEAVY'); // impacto tátil de dano/erro
  tries--;
  tryBadge.textContent = `${tries}`;
  if (tries <= 0) {
    lost = true;
    showMsg("💀 Fim de jogo! Toque para reiniciar a fase.");
    btnNext.style.display = 'block'; btnNext.textContent = '↻ Reiniciar Fase';
  } else {
    showMsg(`${msg}  (${tries} restantes)`);
    setTimeout(() => { if (!won && !lost) hideMsg(); }, 1300);
  }
}

/** Cria partículas de poeira (ou neve) ao pousar. */
function spawnDust(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({ x, y, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 2, life: 20 + Math.random() * 10, snow: CUR.snow });
  }
}

/** Verifica se a cabra pousou sobre a plataforma do topo (objetivo). */
function checkWin() {
  const tp = topPlat();
  if (goat.x > tp.x && goat.x < tp.x + tp.w && Math.abs(goat.y - (tp.y - GOAT_R)) < 5) winLevel();
}

/** Converte o número de erros na fase em estrelas: 0 erros = 3, 1-2 = 2, 3+ = 1. */
function starsFor(missed) {
  if (missed === 0) return 3;
  if (missed <= 2) return 2;
  return 1;
}

/**
 * Trata a queda para fora da tela: conta como salto perdido e devolve a cabra
 * à última plataforma segura. (A vibração HEAVY é disparada dentro de loseTry.)
 */
function fallLose() {
  goat.jumping = false;
  goat.vx = 0; goat.vy = 0; goat.spinning = false; goat.angle = 0;
  goat.x = goat.safeX; goat.y = goat.safeY;
  goat.onGround = true; goat.face = 'happy';
  loseTry("🐐 Bela caiu!");
}
