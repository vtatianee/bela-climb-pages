/* =============================================================================
 * scenery.js — Cenário vivo dos biomas do Bela Climb (só visual)
 * -----------------------------------------------------------------------------
 * Montanhas em camadas com parallax (elas se deslocam de leve conforme a Bela
 * sobe e anda, dando profundidade) e a "vida" de cada bioma: pássaros e folhas
 * na floresta, peixes saltando no rio, libélulas no lago, brasas e fumaça no
 * vulcão, neve e aurora na geleira.
 *
 * Nada aqui afeta a física. updateScenery roda no passo fixo do loop (game.js);
 * as funções draw* são chamadas por render.js na ordem certa de camadas.
 *
 * Depende de (declaradas em config.js): ctx, W, H, CUR, goat
 *
 * FUNÇÕES/ESTADO QUE ESTE ARQUIVO INJETA NO ESCOPO GLOBAL:
 *   SCENE_PALETTES   : cores das montanhas por bioma
 *   scene            : estado (parallax suavizado, seres do ambiente)
 *   initScenery      : prepara o ambiente do bioma atual (ao montar a fase)
 *   updateScenery    : move parallax e seres (1x por passo de física)
 *   drawMountains    : as três camadas de montanha, com parallax
 *   drawAmbientBack  : seres atrás das plataformas (pássaros, libélulas, aurora)
 *   drawAmbientFront : seres na frente (neve, brasas, folhas)
 * ========================================================================== */

// Cores das três camadas (longe, meio, pico) e se o pico tem neve
const SCENE_PALETTES = {
  forest:  { far:'rgba(120,195,170,0.40)', mid:'rgba(55,135,110,0.42)', peak:'rgba(35,95,80,0.48)',  cap:true  },
  river:   { far:'rgba(135,185,225,0.40)', mid:'rgba(70,125,175,0.42)', peak:'rgba(40,85,135,0.48)',  cap:true  },
  lake:    { far:'rgba(145,210,200,0.40)', mid:'rgba(75,150,150,0.42)', peak:'rgba(45,105,120,0.48)', cap:true  },
  volcano: { far:'rgba(130,55,40,0.40)',   mid:'rgba(85,30,22,0.55)',   peak:'rgba(42,18,16,0.80)',   cap:false },
  glacier: { far:'rgba(200,225,255,0.28)', mid:'rgba(140,170,225,0.38)', peak:'rgba(85,115,180,0.50)', cap:true },
};

const scene = {
  ox: 0, oy: 0,      // parallax suavizado (-1..1), segue a posição da Bela
  amb: [],           // seres do ambiente
  smoke: [],         // fumaça saindo da cratera (vulcão)
  fishT: 180,        // passos até o próximo peixe saltar (rio)
  t: 0,
};

const rnd = (a, b) => a + Math.random() * (b - a);

function initScenery() {
  scene.amb = []; scene.smoke = []; scene.fishT = 180;
  if (!CUR || CUR.weird) return;
  const add = (n, make) => { for (let i = 0; i < n; i++) scene.amb.push(make(i)); };
  switch (CUR.biome) {
    case 'forest':
      add(3, () => bird());
      add(6, () => leaf(rnd(0, H)));
      break;
    case 'river':
      add(2, () => bird());
      break;
    case 'lake':
      add(3, () => ({ kind:'fly', bx: rnd(40, W-40), by: rnd(160, 520), ph: rnd(0, 6.3), sp: rnd(0.6, 1.1) }));
      break;
    case 'volcano':
      add(14, () => ember(rnd(0, H)));
      break;
    case 'glacier':
      add(34, () => flake(rnd(-20, H)));
      break;
  }
}

function bird()      { return { kind:'bird', x: rnd(-60, W), y: rnd(70, 300), vx: rnd(0.35, 0.7), ph: rnd(0, 6.3), s: rnd(0.7, 1.1) }; }
function leaf(y)     { return { kind:'leaf', x: rnd(0, W), y, vy: rnd(0.35, 0.7), ph: rnd(0, 6.3), rot: rnd(0, 6.3), c: ['#e0a030','#c8602a','#8cbf3a'][Math.random()*3|0] }; }
function ember(y)    { return { kind:'ember', x: rnd(0, W), y, vy: -rnd(0.4, 1.1), ph: rnd(0, 6.3), r: rnd(1.2, 2.6) }; }
function flake(y)    { return { kind:'flake', x: rnd(0, W), y, vy: rnd(0.4, 1.0), ph: rnd(0, 6.3), r: rnd(1, 2.6) }; }

function updateScenery() {
  scene.t++;
  if (goat) {
    const tx = (W/2 - goat.x) / (W/2), ty = (goat.y - H/2) / (H/2);
    scene.ox += (tx - scene.ox) * 0.03;
    scene.oy += (ty - scene.oy) * 0.03;
  }
  if (!CUR || CUR.weird) return;

  for (const a of scene.amb) {
    a.ph += 0.05;
    switch (a.kind) {
      case 'bird':
        a.x += a.vx;
        if (a.x > W + 40) Object.assign(a, bird(), { x: -40 });
        break;
      case 'leaf':
        a.y += a.vy; a.x += Math.sin(a.ph) * 0.6; a.rot += 0.03;
        if (a.y > H + 10) Object.assign(a, leaf(-10));
        break;
      case 'fly':
        a.ph += 0.02 * a.sp;
        break;
      case 'ember':
        a.y += a.vy; a.x += Math.sin(a.ph) * 0.4;
        if (a.y < -10) Object.assign(a, ember(H + 5));
        break;
      case 'flake':
        a.y += a.vy; a.x += Math.sin(a.ph) * 0.5;
        if (a.y > H + 5) Object.assign(a, flake(-5));
        break;
      case 'fish':
        a.t++;
        break;
    }
  }
  scene.amb = scene.amb.filter(a => a.kind !== 'fish' || a.t < 70);

  if (CUR.biome === 'river' && --scene.fishT <= 0) {
    scene.amb.push({ kind:'fish', x: rnd(40, W-60), dir: Math.random() < 0.5 ? 1 : -1, t: 0 });
    scene.fishT = rnd(200, 400);
  }
  if (CUR.biome === 'volcano') {
    if (scene.t % 14 === 0) scene.smoke.push({ x: 0, y: 0, r: 6, a: 0.45, vx: rnd(0.1, 0.4) });
    for (const s of scene.smoke) { s.y -= 0.5; s.x += s.vx; s.r += 0.12; s.a -= 0.003; }
    scene.smoke = scene.smoke.filter(s => s.a > 0);
  }
}

/** Desloca uma camada pelo parallax: quanto maior `amp`, mais "perto" ela parece. */
function parallax(amp) { ctx.translate(scene.ox * amp, scene.oy * amp * 0.8); }

function drawMountains(lv) {
  const pal = SCENE_PALETTES[lv.biome] || SCENE_PALETTES.forest;
  const L = -40, R = W + 40, B = H + 40;   // as camadas passam das bordas (parallax)

  // camada distante
  ctx.save(); parallax(5);
  ctx.fillStyle = pal.far;
  ctx.beginPath(); ctx.moveTo(L,B);
  ctx.lineTo(L,370); ctx.lineTo(70,270); ctx.lineTo(150,330);
  ctx.lineTo(240,230); ctx.lineTo(330,310); ctx.lineTo(R,240);
  ctx.lineTo(R,B); ctx.closePath(); ctx.fill();
  ctx.restore();

  // camada do meio
  ctx.save(); parallax(11);
  ctx.fillStyle = pal.mid;
  ctx.beginPath(); ctx.moveTo(L,B);
  ctx.lineTo(L,440); ctx.lineTo(110,250); ctx.lineTo(210,360);
  ctx.lineTo(300,200); ctx.lineTo(R,340);
  ctx.lineTo(R,B); ctx.closePath(); ctx.fill();
  if (pal.cap) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.moveTo(110,250); ctx.lineTo(92,286);
    ctx.lineTo(104,278); ctx.lineTo(116,290); ctx.lineTo(128,276);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // pico principal (o mais próximo)
  const px = 250, py = 90;
  ctx.save(); parallax(19);
  ctx.fillStyle = pal.peak;
  ctx.beginPath(); ctx.moveTo(L,B);
  ctx.lineTo(L,470); ctx.lineTo(40,440); ctx.lineTo(150,290);
  ctx.lineTo(px,py); ctx.lineTo(350,260); ctx.lineTo(R,420);
  ctx.lineTo(R,B); ctx.closePath(); ctx.fill();
  if (pal.cap) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.moveTo(px,py);
    ctx.lineTo(px-34,py+58); ctx.lineTo(px-22,py+48); ctx.lineTo(px-10,py+60);
    ctx.lineTo(px+4,py+46); ctx.lineTo(px+18,py+58); ctx.lineTo(px+30,py+50);
    ctx.closePath(); ctx.fill();
  } else {
    // vulcão: cratera incandescente + fumaça subindo
    const glow = 0.6 + Math.sin(scene.t * 0.06) * 0.25;
    const g = ctx.createRadialGradient(px, py+6, 2, px, py+6, 46);
    g.addColorStop(0, `rgba(255,200,80,${glow})`);
    g.addColorStop(0.5, `rgba(255,90,20,${glow*0.5})`);
    g.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = g; ctx.fillRect(px-50, py-44, 100, 100);
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath(); ctx.moveTo(px-9,py+12); ctx.lineTo(px,py+1); ctx.lineTo(px+9,py+12);
    ctx.lineTo(px+4,py+30); ctx.lineTo(px-2,py+20); ctx.closePath(); ctx.fill();
    for (const s of scene.smoke) {
      ctx.fillStyle = `rgba(70,60,60,${s.a})`;
      ctx.beginPath(); ctx.arc(px + s.x, py - 6 + s.y, s.r, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();
}

/** Aurora boreal (geleira): duas faixas ondulando no céu escuro. */
function drawAurora() {
  const t = scene.t * 0.012;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let band = 0; band < 2; band++) {
    const baseY = 70 + band * 45, hue = band ? 175 : 135;
    ctx.beginPath();
    for (let x = -10; x <= W + 10; x += 14) {
      const y = baseY + Math.sin(x / 70 + t + band) * 18 + Math.sin(x / 31 - t * 1.4) * 6;
      if (x === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `hsla(${hue},90%,65%,0.16)`; ctx.lineWidth = 26; ctx.stroke();
    ctx.strokeStyle = `hsla(${hue},95%,75%,0.22)`; ctx.lineWidth = 6;  ctx.stroke();
  }
  ctx.restore();
}

function drawAmbientBack() {
  if (!CUR || CUR.weird) return;
  for (const a of scene.amb) {
    if (a.kind === 'bird') {
      const flap = Math.sin(a.ph * 2.2) * 5 * a.s;
      ctx.strokeStyle = 'rgba(40,40,55,0.7)'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a.x - 8*a.s, a.y - flap); ctx.quadraticCurveTo(a.x - 3*a.s, a.y - 2, a.x, a.y);
      ctx.quadraticCurveTo(a.x + 3*a.s, a.y - 2, a.x + 8*a.s, a.y - flap);
      ctx.stroke(); ctx.lineCap = 'butt';
    } else if (a.kind === 'fly') {
      const x = a.bx + Math.sin(a.ph) * 60 + Math.sin(a.ph * 2.7) * 14;
      const y = a.by + Math.cos(a.ph * 1.3) * 34;
      const wing = Math.abs(Math.sin(scene.t * 0.9)) * 5 + 2;
      ctx.fillStyle = 'rgba(220,250,255,0.6)';
      ctx.beginPath(); ctx.ellipse(x - 3, y - 2, wing, 2, -0.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 3, y - 2, wing, 2, 0.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1e8fa8';
      ctx.beginPath(); ctx.roundRect(x - 1.5, y - 3, 3, 11, 1.5); ctx.fill();
    } else if (a.kind === 'fish') {
      // salto em arco saindo da água do rio
      const k = a.t / 70, x = a.x + a.dir * k * 50, y = 600 - Math.sin(k * Math.PI) * 50;
      const ang = Math.atan2(-Math.cos(k * Math.PI) * 50 * Math.PI, a.dir * 50); // direção do voo
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      if (a.dir < 0) ctx.scale(1, -1);   // indo para a esquerda: não fica de barriga para cima
      ctx.fillStyle = '#f08a3c';
      ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-12, -4); ctx.lineTo(-12, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(4, -1, 1.3, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }
}

function drawAmbientFront() {
  if (!CUR || CUR.weird) return;
  for (const a of scene.amb) {
    if (a.kind === 'flake') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI*2); ctx.fill();
    } else if (a.kind === 'ember') {
      const f = 0.55 + Math.sin(a.ph * 3) * 0.35;
      ctx.fillStyle = `rgba(255,${150 + f*80|0},40,${f})`;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI*2); ctx.fill();
    } else if (a.kind === 'leaf') {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot);
      ctx.fillStyle = a.c;
      ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.6, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }
}
