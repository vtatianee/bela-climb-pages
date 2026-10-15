/**
 * verifica-fases.js — prova, com a física REAL do jogo, que nenhuma fase trava.
 *
 * Como usar: abra o jogo no navegador (ex.: python3 -m http.server 8010),
 * cole este arquivo inteiro no console e rode:
 *     verificaFases(200)            // 200 fases do modo Cabra Mansa
 *     verificaFases(200, true)      // idem, com a pedra-surpresa mexendo 2 plataformas
 *
 * Para cada fase, parte da posição inicial da Bela e tenta ~290 saltos (ângulo
 * x força) de cada ponto onde ela pode parar, montando o grafo de "onde ela
 * consegue chegar". Uma ARMADILHA é um ponto alcançável de onde não existe
 * nenhuma sequência de saltos até o topo. O resultado esperado é 0 falhas.
 *
 * Atenção: troca funções do jogo por versões silenciosas; recarregue a página
 * depois de usar.
 */
(function () {
  let landedOn = null, fell = false;
  window.landOnPlatform = (pi) => { landedOn = pi; };
  window.fallLose = () => { fell = true; goat.y = -9999; goat.onGround = true; };
  for (const f of ['checkWin', 'sndLand', 'onLandImpact', 'spawnDust', 'addShake',
                   'sndFall', 'showMsg', 'hideMsg', 'beep']) window[f] = () => {};

  function sim(pl, x, ang, power) {
    const ps = plats();
    goat = { x, y: ps[pl].y - GOAT_R, vx: Math.cos(ang) * power * MAX_FORCE, vy: Math.sin(ang) * power * MAX_FORCE,
             onGround: false, spinning: false, jumping: true, angle: 0, face: 'happy', plat: pl };
    drag = null; won = false; lost = false; particles = []; landedOn = null; fell = false;
    for (let f = 0; f < 500 && !goat.onGround; f++) stepPhysics();
    return (fell || landedOn === null) ? null : { pl: landedOn, x: goat.x };
  }

  const ANGLES = []; for (let d = -172; d <= -8; d += 7) ANGLES.push(d * Math.PI / 180);
  const POWERS = []; for (let p = 0.12; p <= 1.0001; p += 0.08) POWERS.push(p);

  function checkLevel() {
    const top = plats().length - 1;
    const key = (pl, x) => pl + ':' + Math.round(x / 10);
    const seen = new Map(), edges = new Map(), queue = [];
    const s0 = { pl: 0, x: goat.x, k: key(0, goat.x) };
    seen.set(s0.k, s0); queue.push(s0);
    while (queue.length) {
      const s = queue.shift(); s.expanded = true;
      const out = new Set(); edges.set(s.k, out);
      if (s.pl === top) continue;
      for (const a of ANGLES) for (const p of POWERS) {
        const r = sim(s.pl, s.x, a, p);
        if (!r) continue;
        r.k = key(r.pl, r.x); out.add(r.k);
        if (!seen.has(r.k) && seen.size < 400) { seen.set(r.k, r); queue.push(r); }
      }
    }
    const ok = new Set([...seen.values()].filter(s => s.pl === top).map(s => s.k));
    for (let changed = true; changed;) {
      changed = false;
      for (const [k, out] of edges) if (!ok.has(k) && [...out].some(o => ok.has(o))) { ok.add(k); changed = true; }
    }
    const traps = [...seen.values()].filter(s => s.expanded && !ok.has(s.k)).map(s => ({ pl: s.pl, x: Math.round(s.x) }));
    return { reachedTop: ok.has(s0.k), traps };
  }

  window.verificaFases = (n = 100, comSurpresa = false) => {
    const fails = [], counts = {};
    for (let k = 0; k < n; k++) {
      world = k % 5; sub = 1 + (k * 7) % 10;
      difficulty = 'easy'; widthMul = 1; isHard = false;
      initLevel(); cancelAnimationFrame(animFrame); CUR.weird = false;
      if (comSurpresa) for (let m = 0; m < 2; m++) {
        goat.plat = Math.floor(Math.random() * (plats().length - 1));
        surprise = null; triggerSurprise();
        if (surprise && !surprise.done) { const p = plats()[surprise.idx]; p.x = surprise.toX; p.y = surprise.toY; }
      }
      goat.x = obstacle ? plats()[0].x + 26 : plats()[0].x + plats()[0].w / 2; goat.plat = 0;
      counts[plats().length] = (counts[plats().length] || 0) + 1;
      const r = checkLevel();
      if (!r.reachedTop || r.traps.length) {
        fails.push({ world, sub, plataformas: plats().map(p => ({ x: Math.round(p.x), y: p.y, w: Math.round(p.w) })), ...r });
      }
    }
    return { fases: n, plataformasPorFase: counts, falhas: fails.length, exemplos: fails.slice(0, 3) };
  };
})();
