/* =============================================================================
 * render.js — Camada de Visualização (View) do Bela Climb
 * -----------------------------------------------------------------------------
 * Responsável por TODO o desenho no Canvas, quadro a quadro. Esta é uma camada
 * estritamente visual: NÃO altera física nem estado de jogo — apenas LÊ o
 * estado atual (goat, CUR, particles, rocks, wolfY, etc.) e o desenha.
 *
 * A criação de estado visual mora em outros módulos por design:
 *   - spawnDust (cria partículas) fica em physics.js, pois ADICIONA estado;
 *     aqui apenas desenhamos as partículas existentes (drawParticles).
 *
 * Depende de (declaradas em config.js):
 *   ctx, W, H, CUR, goat, obstacle, particles, rocks, wolfY, isHard, won,
 *   started, capimEl, canvas, drag, clouds, GOAT_R, GRAVITY, MAX_FORCE
 * Depende de (definidas em outros módulos):
 *   plats, topPlat            (levels.js)
 *
 * FUNÇÕES QUE ESTE ARQUIVO INJETA NO ESCOPO GLOBAL:
 *   render            : desenha um frame completo (chamada pelo loop em game.js)
 *   initClouds        : inicializa as nuvens decorativas
 *   drawCloud         : desenha uma nuvem fofa (círculos sobrepostos)
 *   updateAndDrawClouds: move e desenha as nuvens (loop infinito)
 *   drawBg            : céu, montanha e sol de fundo (por bioma)
 *   drawBiomeBase     : base temática do bioma (grama, água, lava, neve...)
 *   drawPlatforms     : plataformas (pedra/madeira/gelo/grama frágil)
 *   drawObstacle      : obstáculo sólido da primeira plataforma
 *   drawGoal          : mantém o Capim/Pimenta (HTML) alinhado à plataforma
 *   positionCapim     : posiciona o elemento do objetivo sobre o topo
 *   drawGoat          : desenha a cabra Bela e suas expressões
 *   drawParticles     : desenha poeira / fogo / confete / arco-íris
 *   drawRocks         : desenha as pedras rolantes (modo difícil)
 *   drawWolf          : desenha o Lobo Faminto que sobe (modo difícil)
 *   drawDragLine      : desenha a mira/trajetória durante o arrasto
 * ========================================================================== */

// ---------- Nuvens decorativas (atrás das plataformas e da cabra) ----------
function initClouds() {
  // 4 fluffy clouds, varied size/speed/height for a sense of depth
  const cfg = [
    { y: 90,  scale: 1.0,  speed: 0.18 },
    { y: 200, scale: 0.7,  speed: 0.30 },
    { y: 320, scale: 1.25, speed: 0.12 },
    { y: 150, scale: 0.55, speed: 0.40 },
  ];
  clouds = cfg.map((c, i) => ({
    x: (W / cfg.length) * i + Math.random() * 60,
    y: c.y,
    scale: c.scale,
    speed: c.speed,
  }));
}
function drawCloud(x, y, s) {
  // soft cartoon cloud built from overlapping circles
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = (CUR && CUR.cloud) || '#ffffff';
  const lobes = [
    [0, 0, 22], [22, -8, 26], [48, 0, 22],
    [12, 8, 20], [36, 8, 20], [24, 4, 28],
  ];
  for (const [dx, dy, r] of lobes) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function updateAndDrawClouds() {
  const cloudW = 80; // approx width for wrap math
  for (const c of clouds) {
    c.x += c.speed;
    // infinite loop: when fully off the right, restart from the left
    if (c.x - cloudW * c.scale > W) c.x = -cloudW * c.scale;
    drawCloud(c.x, c.y, c.scale);
  }
}

function drawBg() {
  const lv = CUR;

  if (lv.weird) {
    // psychedelic shifting sky
    const t = Date.now() / 1000;
    const h1 = (t * 40) % 360, h2 = (t * 40 + 120) % 360;
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, `hsl(${h1}, 70%, 22%)`);
    g.addColorStop(1, `hsl(${h2}, 70%, 14%)`);
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    // floating googly stars
    for (let i=0;i<10;i++){
      const sx = (i*61 + Math.sin(t + i)*40 + 40) % W;
      const sy = (i*97 + Math.cos(t*1.2 + i)*30) % H;
      ctx.fillStyle = `hsla(${(t*120+i*36)%360},90%,65%,0.5)`;
      ctx.beginPath(); ctx.arc(sx, sy, 4 + (i%3)*2, 0, Math.PI*2); ctx.fill();
    }
    // wobbly gravity-arrow hint near top
    const flip = Math.sin(t*1.3);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#fff';
    ctx.font = '22px sans-serif'; ctx.textAlign='center';
    ctx.fillText(flip > 0 ? '⬇⬇⬇' : '⬆⬆⬆', W/2, 50);
    ctx.textAlign='left'; ctx.globalAlpha = 1;
    return;
  }

  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,lv.bg[0]); g.addColorStop(1,lv.bg[1]);
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

  // soft sun glow
  const sun = ctx.createRadialGradient(330,90,10,330,90,140);
  sun.addColorStop(0,'rgba(255,250,220,0.55)');
  sun.addColorStop(1,'rgba(255,250,220,0)');
  ctx.fillStyle = sun; ctx.fillRect(0,0,W,H);

  // distant range (lightest, hazy)
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.moveTo(0,H);
  ctx.lineTo(0,360); ctx.lineTo(70,270); ctx.lineTo(150,330);
  ctx.lineTo(240,230); ctx.lineTo(330,310); ctx.lineTo(420,250);
  ctx.lineTo(420,H); ctx.closePath(); ctx.fill();

  // mid range
  ctx.fillStyle = 'rgba(40,55,75,0.20)';
  ctx.beginPath();
  ctx.moveTo(0,H);
  ctx.lineTo(0,420); ctx.lineTo(110,250); ctx.lineTo(210,360);
  ctx.lineTo(300,200); ctx.lineTo(420,330);
  ctx.lineTo(420,H); ctx.closePath(); ctx.fill();

  // main peak (darkest)
  const peakX = 250, peakY = 90;
  ctx.fillStyle = 'rgba(30,40,58,0.30)';
  ctx.beginPath();
  ctx.moveTo(0,H);
  ctx.lineTo(40,440); ctx.lineTo(150,290);
  ctx.lineTo(peakX,peakY); ctx.lineTo(350,260); ctx.lineTo(420,400);
  ctx.lineTo(420,H); ctx.closePath(); ctx.fill();

  // snow cap on main peak
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.moveTo(peakX,peakY);
  ctx.lineTo(peakX-34,peakY+58);
  ctx.lineTo(peakX-22,peakY+48); ctx.lineTo(peakX-10,peakY+60);
  ctx.lineTo(peakX+4,peakY+46); ctx.lineTo(peakX+18,peakY+58);
  ctx.lineTo(peakX+30,peakY+50);
  ctx.closePath(); ctx.fill();

  // snow cap on left mid peak
  ctx.beginPath();
  ctx.moveTo(110,250); ctx.lineTo(92,286);
  ctx.lineTo(104,278); ctx.lineTo(116,290); ctx.lineTo(128,276);
  ctx.closePath(); ctx.fill();

  // low haze band
  const haze = ctx.createLinearGradient(0,300,0,460);
  haze.addColorStop(0,'rgba(255,255,255,0)');
  haze.addColorStop(1, lv.snow ? 'rgba(210,230,245,0.35)' : 'rgba(255,250,235,0.28)');
  ctx.fillStyle = haze; ctx.fillRect(0,300,W,160);

  // themed base of the mountain (bottom of the screen) per biome
  drawBiomeBase(lv);
}

function drawBiomeBase(lv) {
  const t = Date.now();
  const baseY = 560; // where the foreground base begins
  switch (lv.biome) {
    case 'forest': {
      // green ground + bushes
      ctx.fillStyle = '#4f8a3a';
      ctx.beginPath(); ctx.moveTo(0,H); ctx.lineTo(0,baseY+20);
      ctx.quadraticCurveTo(W/2,baseY-10,W,baseY+20); ctx.lineTo(W,H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(40,90,45,0.55)';
      for (let i=0;i<7;i++){ const bx=30+i*60; ctx.beginPath(); ctx.arc(bx,baseY+24,18,Math.PI,0); ctx.arc(bx+16,baseY+24,14,Math.PI,0); ctx.fill(); }
      break;
    }
    case 'river': {
      // flowing blue water with moving ripples
      const g = ctx.createLinearGradient(0,baseY,0,H);
      g.addColorStop(0,'#3d8fd0'); g.addColorStop(1,'#1f5e9e');
      ctx.fillStyle = g; ctx.fillRect(0,baseY+10,W,H-baseY);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
      for (let r=0;r<5;r++){
        const yy = baseY+30 + r*22;
        ctx.beginPath();
        for (let x=0;x<=W;x+=10){ const yo = Math.sin((x+t/180+r*30)/26)*3; if(x===0)ctx.moveTo(x,yy+yo); else ctx.lineTo(x,yy+yo); }
        ctx.stroke();
      }
      break;
    }
    case 'lake': {
      // mirrored still lake with subtle sparkles
      const g = ctx.createLinearGradient(0,baseY,0,H);
      g.addColorStop(0,'#bfeae2'); g.addColorStop(1,'#7fc3bd');
      ctx.fillStyle = g; ctx.fillRect(0,baseY+10,W,H-baseY);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i=0;i<14;i++){
        const sx = (i*53 + Math.sin(t/600+i)*20) % W;
        const sy = baseY+30 + (i*37 % (H-baseY-40));
        const tw = 0.5+0.5*Math.sin(t/300+i);
        ctx.globalAlpha = tw; ctx.fillRect(sx,sy,2,2); ctx.globalAlpha = 1;
      }
      break;
    }
    case 'volcano': {
      // dark rocky base with glowing lava cracks
      ctx.fillStyle = '#241c1a';
      ctx.beginPath(); ctx.moveTo(0,H); ctx.lineTo(0,baseY+15);
      ctx.lineTo(80,baseY+30); ctx.lineTo(180,baseY+8); ctx.lineTo(300,baseY+30); ctx.lineTo(W,baseY+15); ctx.lineTo(W,H); ctx.closePath(); ctx.fill();
      const glow = 0.5+Math.sin(t/300)*0.4;
      ctx.strokeStyle = `rgba(255,${100+glow*100|0},20,${0.6+glow*0.4})`; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40,H); ctx.lineTo(70,baseY+40); ctx.moveTo(160,H); ctx.lineTo(200,baseY+50);
      ctx.moveTo(300,H); ctx.lineTo(330,baseY+45); ctx.stroke();
      break;
    }
    case 'glacier': {
      // snow base + extra stars near top (sky is darker for this level)
      ctx.fillStyle = '#fff';
      for (let i=0;i<40;i++){ const sx=(i*97)%W, sy=(i*53)%220; const tw=0.4+0.6*Math.sin(t/400+i); ctx.globalAlpha=tw*0.8; ctx.fillRect(sx,sy,1.6,1.6); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#eaf4ff';
      ctx.beginPath(); ctx.moveTo(0,H); ctx.lineTo(0,baseY+25);
      ctx.quadraticCurveTo(W*0.3,baseY,W*0.6,baseY+20); ctx.quadraticCurveTo(W*0.85,baseY+35,W,baseY+10); ctx.lineTo(W,H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(180,210,235,0.5)';
      ctx.beginPath(); ctx.moveTo(0,H); ctx.lineTo(W*0.4,baseY+40); ctx.lineTo(W*0.7,H); ctx.closePath(); ctx.fill();
      break;
    }
  }
}

function drawPlatforms() {
  const surf = CUR.surface;
  const weird = CUR.weird;
  const PH = 18;
  plats().forEach((p,i)=>{
    if (fallenPlats[i]) return;   // collapsed — don't draw
    ctx.save();
    if (weird) {
      // jittery, wobbling platforms (visual only — hitbox stays put)
      const t = Date.now()/120 + i*1.7;
      ctx.translate(Math.sin(t)*2.5, Math.cos(t*1.3)*2);
    }
    // fragile "fake grass" (hard mode): dry straw look, shakes while breaking
    if (p.fragile) {
      if (breakingTimers[i] !== undefined) {
        const shake = (breakingTimers[i] < 500) ? 2.5 : 1;
        ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake);
      }
      ctx.fillStyle='rgba(0,0,0,0.18)';
      ctx.beginPath(); ctx.roundRect(p.x+3,p.y+5,p.w,PH,5); ctx.fill();
      ctx.fillStyle = '#c9a23e'; // straw yellow-brown
      ctx.beginPath(); ctx.roundRect(p.x,p.y,p.w,PH,4); ctx.fill();
      // dry straw strands
      ctx.strokeStyle = '#9a7423'; ctx.lineWidth = 1;
      for (let s=0;s<Math.max(3,p.w/9);s++){ const sx=p.x+4+s*9; ctx.beginPath(); ctx.moveTo(sx,p.y+3); ctx.lineTo(sx+2,p.y+PH-2); ctx.stroke(); }
      ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(p.x+4,p.y+2,p.w-8,2);
      ctx.restore();
      return;
    }
    // shadow (all types)
    ctx.fillStyle='rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.roundRect(p.x+3,p.y+5,p.w,PH,5); ctx.fill();

    if (surf === 'rock') {
      ctx.fillStyle = ['#7a5c3a','#6b4f30','#5e4428'][i%3];
      ctx.beginPath(); ctx.roundRect(p.x,p.y,p.w,PH,5); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.14)'; ctx.fillRect(p.x+4,p.y+2,p.w-8,3);
      // cracks
      ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(p.x+p.w*0.4,p.y+4); ctx.lineTo(p.x+p.w*0.45,p.y+PH-3); ctx.stroke();
      // moss
      ctx.fillStyle='rgba(80,160,40,0.35)';
      for (let j=0;j<3;j++){ ctx.beginPath(); ctx.arc(p.x+10+j*((p.w-20)/2),p.y+2,3,0,Math.PI*2); ctx.fill(); }

    } else if (surf === 'wood') {
      ctx.fillStyle = '#9c6b3f';
      ctx.beginPath(); ctx.roundRect(p.x,p.y,p.w,PH,3); ctx.fill();
      // plank lines
      ctx.strokeStyle='rgba(60,35,15,0.5)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(p.x,p.y+PH/2); ctx.lineTo(p.x+p.w,p.y+PH/2); ctx.stroke();
      const planks = Math.max(2, Math.round(p.w/26));
      for (let j=1;j<planks;j++){ const px=p.x+j*(p.w/planks); ctx.beginPath(); ctx.moveTo(px,p.y); ctx.lineTo(px,p.y+PH); ctx.stroke(); }
      // nails
      ctx.fillStyle='#5a3a1a';
      ctx.beginPath(); ctx.arc(p.x+5,p.y+5,1.5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x+p.w-5,p.y+5,1.5,0,Math.PI*2); ctx.fill();

    } else if (surf === 'mushroom') {
      // stem
      ctx.fillStyle='#efe6d2';
      ctx.beginPath(); ctx.roundRect(p.x+p.w*0.35,p.y+PH-2,p.w*0.3,14,3); ctx.fill();
      // cap
      ctx.fillStyle='#c0392b';
      ctx.beginPath(); ctx.ellipse(p.x+p.w/2,p.y+PH/2,p.w/2,PH/1.4,0,Math.PI,0); ctx.fill();
      ctx.fillRect(p.x,p.y+PH/2,p.w,PH/2);
      ctx.beginPath(); ctx.roundRect(p.x,p.y+PH-4,p.w,5,2); ctx.fill();
      // white spots
      ctx.fillStyle='rgba(255,255,255,0.85)';
      for (let j=0;j<4;j++){ ctx.beginPath(); ctx.arc(p.x+12+j*((p.w-24)/3),p.y+4,2.5,0,Math.PI*2); ctx.fill(); }

    } else if (surf === 'ice') {
      ctx.fillStyle = '#a8cfe8';
      ctx.beginPath(); ctx.roundRect(p.x,p.y,p.w,PH,4); ctx.fill();
      // glossy highlight
      ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.fillRect(p.x+4,p.y+2,p.w-8,4);
      // snow layer on top
      ctx.fillStyle='rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.roundRect(p.x,p.y-3,p.w,6,3); ctx.fill();
      // icicle
      ctx.fillStyle='rgba(220,240,255,0.8)';
      ctx.beginPath(); ctx.moveTo(p.x+p.w*0.5,p.y+PH); ctx.lineTo(p.x+p.w*0.55,p.y+PH); ctx.lineTo(p.x+p.w*0.525,p.y+PH+7); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  });
}

function positionCapim() {
  // place the HTML capim above the center of the top platform,
  // converting canvas coords to on-screen (CSS) coords via the canvas scale
  const tp = topPlat();
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / W, scaleY = rect.height / H;
  const cx = (tp.x + tp.w/2) * scaleX;          // center over platform
  const cy = (tp.y) * scaleY;                    // top edge of platform
  const HUD_SAFE = 76 * scaleY;                  // keep clear of the top info bar
  capimEl.style.left = (cx - 23) + 'px';         // 23 = half of 46px width
  capimEl.style.top  = Math.max(HUD_SAFE, cy - 50) + 'px'; // above platform, but never under the HUD
}

function drawGoal() {
  // the goal (Super Capim) is now an HTML element; keep it aligned each frame
  if (started && !won) positionCapim();
}

function drawDragLine() {
  if (!drag || !goat.onGround) return;
  const dx=goat.x-drag.cx, dy=goat.y-drag.cy;
  const dist=Math.min(Math.hypot(dx,dy),80);
  if (dist<4) return;
  const ang=Math.atan2(dy,dx), force=(dist/80)*MAX_FORCE;
  const vx0=Math.cos(ang)*force, vy0=Math.sin(ang)*force;
  for (let t=0;t<30;t+=2){
    const px=goat.x+vx0*t, py=goat.y+vy0*t+0.5*GRAVITY*t*t;
    const r=Math.max(1,5-t*0.15), a=Math.max(0,0.7-t*0.022);
    ctx.fillStyle=`rgba(255,230,100,${a})`;
    ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fill();
  }
  const barW=80,barH=8,bx=16,by=H-30,pct=dist/80;
  ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.roundRect(bx,by,barW,barH,4); ctx.fill();
  ctx.fillStyle = pct<0.5?'#80e060':pct<0.8?'#ffd040':'#ff5020';
  ctx.beginPath(); ctx.roundRect(bx,by,barW*pct,barH,4); ctx.fill();
  ctx.fillStyle='#ffd580'; ctx.font='11px sans-serif'; ctx.fillText('FORÇA',bx,by-4);
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life/40);
    if (p.rainbow) {
      ctx.fillStyle = `hsl(${p.hue}, 90%, 60%)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI*2); ctx.fill();
    } else if (p.fire) {
      // hot ember: red/orange/yellow by remaining life
      const k = p.life / 50;
      const hue = 8 + k * 42; // 8 (red) -> 50 (yellow)
      ctx.fillStyle = `hsl(${hue}, 100%, ${50 + k*15}%)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2 + k*3, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = p.gold ? '#ffe060' : p.snow ? '#ffffff' : '#c8a878';
      ctx.beginPath(); ctx.arc(p.x,p.y, p.gold?3:2, 0,Math.PI*2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawGoat(x,y,face,angle) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  const body='#f5f0e8';
  // contorno escuro (2px) destaca a Bela de qualquer fundo, inclusive neve/lago claros
  ctx.fillStyle=body; ctx.strokeStyle='#3a2f22'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(0,4,14,11,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0,-10,10,9,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='#8b7355'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(-5,-17); ctx.lineTo(-8,-26); ctx.lineTo(-4,-22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5,-17); ctx.lineTo(8,-26); ctx.lineTo(4,-22); ctx.stroke();
  ctx.fillStyle='#f0c0a0';
  ctx.beginPath(); ctx.ellipse(-11,-11,4,6,-0.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(11,-11,4,6,0.4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#e8e0d0'; ctx.beginPath(); ctx.ellipse(0,-2,4,6,0,0,Math.PI*2); ctx.fill();
  if (face==='happy'||face==='win') {
    ctx.fillStyle='#2a1a00';
    ctx.beginPath(); ctx.arc(-3.5,-11,2.2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.5,-11,2.2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='white';
    ctx.beginPath(); ctx.arc(-2.8,-12,0.7,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(4.2,-12,0.7,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#4a3010'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(0,-8,3,0.2,Math.PI-0.2); ctx.stroke();
  } else if (face==='dizzy') {
    ctx.strokeStyle='#cc2200'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(-5,-13); ctx.lineTo(-2,-10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2,-13); ctx.lineTo(-5,-10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2,-13); ctx.lineTo(5,-10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5,-13); ctx.lineTo(2,-10); ctx.stroke();
  } else if (face==='sad') {
    ctx.fillStyle='#2a1a00';
    ctx.beginPath(); ctx.arc(-3.5,-10,2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.5,-10,2,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#4a3010'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(0,-5,3,Math.PI+0.2,-0.2); ctx.stroke();
    ctx.fillStyle='#80c0ff';
    ctx.beginPath(); ctx.arc(-4,-7,1.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(4,-7,1.5,0,Math.PI*2); ctx.fill();
  }
  if (face==='win'){ ctx.font='12px sans-serif'; ctx.fillText('⭐',-20,-28); ctx.fillText('⭐',10,-30); }
  ctx.fillStyle='#d4c4a8';
  for (const lx of [-8,-3,3,8]){ ctx.beginPath(); ctx.roundRect(lx-2.5,12,5,9,2); ctx.fill(); }
  ctx.restore();
}

function drawObstacle() {
  if (!obstacle) return;
  const o = obstacle, cx = o.x + o.w/2, baseY = o.y + o.h;
  ctx.save();
  switch (o.type) {
    case 'log': { // fallen log + little mushroom
      ctx.fillStyle = '#7a4a24';
      ctx.beginPath(); ctx.roundRect(o.x, o.y+10, o.w, o.h-12, 7); ctx.fill();
      ctx.fillStyle = '#5e3618';
      ctx.beginPath(); ctx.arc(o.x+5, o.y+10+(o.h-12)/2, (o.h-12)/2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#caa06a';
      ctx.beginPath(); ctx.arc(o.x+5, o.y+10+(o.h-12)/2, 3, 0, Math.PI*2); ctx.fill();
      // tiny mushroom on top
      ctx.fillStyle = '#efe6d2'; ctx.fillRect(cx-2, o.y+2, 4, 9);
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.ellipse(cx, o.y+3, 8, 5, 0, Math.PI, 0); ctx.fill();
      break;
    }
    case 'wetrock': { // wet shiny rock
      ctx.fillStyle = '#5a6b73';
      ctx.beginPath(); ctx.ellipse(cx, baseY-9, o.w/2, o.h/2, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#7d929c';
      ctx.beginPath(); ctx.ellipse(cx-3, baseY-13, o.w/3, o.h/3.5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; // wet glint
      ctx.beginPath(); ctx.ellipse(cx-4, baseY-16, 3, 2, -0.5, 0, Math.PI*2); ctx.fill();
      // drip
      ctx.fillStyle = 'rgba(120,190,230,0.8)';
      ctx.beginPath(); ctx.arc(cx+6, baseY-2, 2, 0, Math.PI*2); ctx.fill();
      break;
    }
    case 'lily': { // lily pad + flower
      ctx.fillStyle = '#3aa856';
      ctx.beginPath(); ctx.ellipse(cx, baseY-6, o.w/2, o.h/4, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#2e8c46';
      ctx.beginPath(); ctx.moveTo(cx, baseY-6); ctx.lineTo(cx+o.w/2, baseY-6); ctx.arc(cx, baseY-6, o.w/2, 0, -0.5, true); ctx.closePath(); ctx.fill();
      // flower
      ctx.fillStyle = '#f6a6c8';
      for (let i=0;i<6;i++){ const a=i*Math.PI/3; ctx.beginPath(); ctx.ellipse(cx+Math.cos(a)*6, o.y+4+Math.sin(a)*6, 4, 2.5, a, 0, Math.PI*2); ctx.fill(); }
      ctx.fillStyle = '#ffe060'; ctx.beginPath(); ctx.arc(cx, o.y+4, 3, 0, Math.PI*2); ctx.fill();
      break;
    }
    case 'emberrock': { // dark rock with glowing lava cracks + smoke
      ctx.fillStyle = '#2b2422';
      ctx.beginPath(); ctx.moveTo(o.x, baseY); ctx.lineTo(o.x+5, o.y+4); ctx.lineTo(cx, o.y); ctx.lineTo(o.x+o.w-4, o.y+6); ctx.lineTo(o.x+o.w, baseY); ctx.closePath(); ctx.fill();
      const glow = 0.5 + Math.sin(Date.now()/250)*0.4;
      ctx.strokeStyle = `rgba(255,${90+glow*80|0},20,${0.7+glow*0.3})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx-4, o.y+6); ctx.lineTo(cx, baseY-6); ctx.lineTo(cx+5, o.y+12); ctx.stroke();
      // smoke puff
      ctx.fillStyle = `rgba(160,160,160,${0.25+glow*0.2})`;
      ctx.beginPath(); ctx.arc(cx, o.y-4+Math.sin(Date.now()/400)*2, 5, 0, Math.PI*2); ctx.fill();
      break;
    }
    case 'icespike': { // pointy ice block
      const g = ctx.createLinearGradient(o.x, o.y, o.x, baseY);
      g.addColorStop(0,'#dff2ff'); g.addColorStop(1,'#9cc8e8');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(o.x+3, baseY); ctx.lineTo(o.x+6, o.y+8); ctx.lineTo(cx, o.y); ctx.lineTo(o.x+o.w-6, o.y+10); ctx.lineTo(o.x+o.w-3, baseY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.moveTo(cx, o.y); ctx.lineTo(cx+3, o.y+14); ctx.lineTo(cx-2, o.y+14); ctx.closePath(); ctx.fill();
      break;
    }
  }
  ctx.restore();
}

function render() {
  ctx.clearRect(0,0,W,H);
  drawBg();
  if (!CUR.weird) updateAndDrawClouds();
  drawPlatforms(); drawObstacle(); drawGoal(); drawParticles(); drawDragLine();
  if (isHard) drawRocks();
  if (isHard && won) goat.angle += 0.35;  // spicy spin after eating the chili
  drawGoat(goat.x,goat.y,goat.face,goat.angle);
  if (isHard) drawWolf();   // wolf in front, at the bottom
}

function drawRocks() {
  for (const rk of rocks) {
    ctx.save();
    ctx.translate(rk.x, rk.y); ctx.rotate(rk.spin);
    ctx.fillStyle = '#6b6660';
    ctx.beginPath(); ctx.arc(0,0,rk.r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#565049';
    ctx.beginPath(); ctx.arc(-rk.r*0.3,-rk.r*0.2,rk.r*0.4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.arc(rk.r*0.3,-rk.r*0.35,rk.r*0.25,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

function drawWolf() {
  if (wolfY > H) return; // not yet on screen
  // dark rising mass
  const g = ctx.createLinearGradient(0, wolfY, 0, H);
  g.addColorStop(0, 'rgba(20,18,24,0.0)');
  g.addColorStop(0.25, 'rgba(20,18,24,0.85)');
  g.addColorStop(1, 'rgba(8,6,10,0.97)');
  ctx.fillStyle = g;
  ctx.fillRect(0, wolfY, W, H - wolfY);
  // jagged fur top edge
  ctx.fillStyle = 'rgba(15,12,18,0.9)';
  ctx.beginPath(); ctx.moveTo(0, wolfY+6);
  for (let x=0; x<=W; x+=22){ ctx.lineTo(x, wolfY + (x/22%2?2:10)); }
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  // glowing red eyes
  const eyeY = wolfY + 26, ex = W/2, glow = 0.6 + Math.sin(Date.now()/200)*0.4;
  for (const dx of [-26, 26]) {
    ctx.fillStyle = `rgba(255,40,30,${0.7+glow*0.3})`;
    ctx.shadowColor = 'red'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.ellipse(ex+dx, eyeY, 8, 5, dx<0?0.3:-0.3, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#2a0000';
    ctx.beginPath(); ctx.ellipse(ex+dx, eyeY, 2.5, 4, 0, 0, Math.PI*2); ctx.fill();
  }
}

