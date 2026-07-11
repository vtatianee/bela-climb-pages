/* =============================================================================
 * input.js — Captura de Entrada (Toque / Mouse) do Bela Climb
 * -----------------------------------------------------------------------------
 * Traduz o gesto do jogador (tocar na cabra, arrastar e soltar) em um vetor de
 * lançamento (direção + força), no estilo estilingue. Suporta mouse (desktop)
 * e toque (mobile), com o mesmo conjunto de handlers.
 *
 * Depende de (declaradas em config.js):
 *   canvas, W, H, goat, drag, started, won, lost, GOAT_R, MAX_FORCE, jumpCount
 * Depende de (definidas em outros módulos):
 *   sndJump, sndBleat   (audio.js)
 *
 * FUNÇÕES QUE ESTE ARQUIVO INJETA NO ESCOPO GLOBAL:
 *   getPos  : converte coordenadas do evento em coordenadas do canvas
 *   onDown  : inicia o arrasto quando o toque começa sobre a cabra
 *   onMove  : atualiza o ponto atual do arrasto (a mira)
 *   onUp    : solta o estilingue e lança a cabra
 *
 * Este arquivo também VINCULA os event listeners ao canvas (mouse + toque).
 * ========================================================================== */

/**
 * Converte a posição de um evento de mouse/toque para o sistema de coordenadas
 * interno do canvas (420x680), corrigindo a escala com que ele é exibido.
 */
function getPos(e) {
  const r = canvas.getBoundingClientRect();
  const sx = W / r.width, sy = H / r.height;
  const s = e.touches ? e.touches[0] : e;
  return { x: (s.clientX - r.left) * sx, y: (s.clientY - r.top) * sy };
}

/**
 * Início do gesto: só arma o arrasto se o toque cair sobre a cabra e ela
 * estiver no chão (parada, pronta para saltar).
 */
function onDown(e) {
  if (!started || !goat.onGround || won || lost) return;
  const p = getPos(e);
  if (Math.hypot(p.x - goat.x, p.y - goat.y) < GOAT_R + 25) {
    drag = { cx: p.x, cy: p.y };
    e.preventDefault();
  }
}

/** Durante o arrasto: atualiza o ponto atual (usado pela mira em render.js). */
function onMove(e) {
  if (!drag) return;
  const p = getPos(e);
  drag.cx = p.x; drag.cy = p.y;
  e.preventDefault();
}

/**
 * Soltar: calcula direção e força a partir do vetor (cabra → ponto solto),
 * no estilo estilingue (puxa para trás e solta), e lança a cabra.
 * Cada lançamento incrementa jumpCount (usado pela plataforma-surpresa).
 */
function onUp(e) {
  if (!drag) return;
  const dx = goat.x - drag.cx, dy = goat.y - drag.cy, dist = Math.hypot(dx, dy);
  if (dist > 8) {
    const ang = Math.atan2(dy, dx), power = Math.min(dist / 80, 1);
    const force = power * MAX_FORCE;
    goat.vx = Math.cos(ang) * force; goat.vy = Math.sin(ang) * force;
    goat.onGround = false; goat.spinning = true; goat.jumping = true;
    goat.face = power > 0.6 ? 'dizzy' : 'happy';
    sndJump(power); sndBleat();
    jumpCount++;   // a plataforma-surpresa dispara a cada 4 saltos (ver updateSurprise)
  }
  drag = null;
  e.preventDefault();
}

// ---------- Vínculo dos listeners ao canvas (mouse + toque) ----------
canvas.addEventListener('mousedown', onDown);
canvas.addEventListener('mousemove', onMove);
canvas.addEventListener('mouseup', onUp);
canvas.addEventListener('touchstart', onDown, { passive: false });
canvas.addEventListener('touchmove', onMove, { passive: false });
canvas.addEventListener('touchend', onUp, { passive: false });
