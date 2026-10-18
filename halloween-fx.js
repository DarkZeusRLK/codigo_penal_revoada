/*!
 * Revoada — Halloween FX
 * Tema de Halloween em pixel art 2D (sem modelos 3D, sem imagens externas).
 *  - Cavaleiro sem cabeça cruzando o fundo. Na maioria das vezes com a abóbora em chamas erguida na mão;
 *    às vezes (swordChance) vem de espada, com a abóbora em chamas no lugar da cabeça: um zumbi levanta,
 *    o cavaleiro passa, corta e leva a cabeça. O zumbi corre atrás, some, volta com a cabeça debaixo
 *    do braço, recoloca e entra na cova.
 *  - Túmulos nas laterais; de vez em quando um zumbi policial sai da cova, olha em volta,
 *    coça a cabeça e cai de volta.
 *  - Corvo pousado num túmulo: segue o mouse com a cabeça, grasna, voa quando assustado e volta
 *  - Fantasma que atravessa a tela por cima dos painéis (sem bloquear cliques); dá um "BU!" se o mouse chegar perto
 *  - Bruxa na vassoura passando na frente da lua, com rastro de faíscas
 *  - Cenário de fundo: chão contínuo, cerca de ferro, lápides distantes, árvores secas e um mausoléu
 *    no centro com vitrais acesos (às vezes um vulto passa pela janela)
 *  - Chapéu de bruxa sobre o "R" da logo, teias com aranhas, morcegos, lua, névoa, abóboras
 *
 * API:
 *   HalloweenFX.enable({ logo: '#logo-revoada' })   // liga (idempotente)
 *   HalloweenFX.disable()                           // desliga e remove tudo
 *   HalloweenFX.ride()         // cavaleiro (sorteia abóbora na mão ou espada)
 *   HalloweenFX.ride('sword')  // força a cena da espada | ride('pumpkin') força a abóbora na mão
 *   HalloweenFX.zombie()       // zumbi (sorteia clássico ou cena do cavaleiro)
 *   HalloweenFX.zombie(0, 'classic' | 'horse' | 'decap')
 *   HalloweenFX.ghost() / HalloweenFX.witch() / HalloweenFX.crow()  // fantasma, bruxa, assustar o corvo
 * Opções do enable: eventGap ([25, 50] s entre eventos), firstEvent (6 s),
 *   weights ({ ride, zombie, ghost, witch }), swordChance (0.35), horseChance (0.25),
 *   decapChance (0), killer ('reaper' | 'slasher')
 * Só um evento grande acontece por vez; corvo, vitrais e enfeites são ambientes.
 */
(function (global) {
  'use strict';

  /* ======================================================================
   * Grade de pixels
   * ==================================================================== */
  const RGB = {};
  function rgb(h) {
    if (!RGB[h]) { const n = parseInt(h.slice(1), 16); RGB[h] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    return RGB[h];
  }

  class Grid {
    constructor(w, h, ox = 0, oy = 0) {
      this.w = w; this.h = h; this.ox = ox; this.oy = oy;
      this.d = new Array(w * h).fill(null);
      this.clipY = Infinity;
    }
    set(x, y, c) {
      x = Math.round(x) + this.ox; y = Math.round(y) + this.oy;
      if (x < 0 || y < 0 || x >= this.w || y >= this.h || y >= this.clipY) return;
      this.d[y * this.w + x] = c;
    }
    rect(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c); }
    ellipse(cx, cy, rx, ry, c, onlyFrom) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        if (onlyFrom !== undefined && y < onlyFrom) continue;
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x - cx) / rx, dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1) this.set(x, y, c);
        }
      }
    }
    line(x0, y0, x1, y1, c, r = 0) {
      const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) + 1;
      const R = Math.ceil(r);
      for (let i = 0; i <= n; i++) {
        const t = i / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
        if (r <= 0) { this.set(px, py, c); continue; }
        for (let oy = -R; oy <= R; oy++) for (let ox = -R; ox <= R; ox++)
          if (ox * ox + oy * oy <= r * r + 0.25) this.set(px + ox, py + oy, c);
      }
    }
    poly(pts, c) {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.set(x, y, c);
      }
    }
    outline(c) {
      const d = this.d.slice(), w = this.w, h = this.h;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (d[i]) continue;
        if ((x > 0 && d[i - 1]) || (x < w - 1 && d[i + 1]) || (y > 0 && d[i - w]) || (y < h - 1 && d[i + w])) this.d[i] = c;
      }
    }
    toCanvas(canvas) {
      const c = canvas || document.createElement('canvas');
      c.width = this.w; c.height = this.h;
      const x = c.getContext('2d'), im = x.createImageData(this.w, this.h);
      for (let i = 0; i < this.d.length; i++) {
        const v = this.d[i]; if (!v) continue;
        const [r, g, b] = rgb(v);
        im.data[i * 4] = r; im.data[i * 4 + 1] = g; im.data[i * 4 + 2] = b; im.data[i * 4 + 3] = 255;
      }
      x.putImageData(im, 0, 0);
      return c;
    }
  }

  const OUTLINE = '#06030a';
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  /* ======================================================================
   * Cavaleiro sem cabeça
   * ==================================================================== */
  const H = {
    horse: '#1c1626', horseHi: '#342a44', horseLo: '#100c17', far: '#0f0b15',
    mane: '#0b0811', maneHi: '#2c2140',
    eye: '#ff2e1f', eyeGlow: '#ff9a62',
    silver: '#aab2c6', silverLo: '#5f6679', gold: '#d2a64a', leather: '#3b2418',
    saddle: '#4e1b27', saddleHi: '#73303c', blanket: '#5b1428',
    coat: '#2c2342', coatHi: '#44375f', coatLo: '#1b1529',
    cape: '#160f1f', capeIn: '#6a1630', capeHi: '#271b36',
    boot: '#120e16', belt: '#3b2618',
    pump: '#ea711a', pumpHi: '#ffa040', pumpLo: '#a5440b', stem: '#3d5a1e',
    face: '#ffe36a', face2: '#ffb02a', faceIn: '#fff6c4'
  };
  const RW = 92, RH = 92, ROY = 16, R_FEET = 73, R_FRAMES = 8;
  const PUMP = { x: 58, y: 1 };     // abóbora erguida na mão
  const NECK = { x: 46, y: 13 };    // abóbora no lugar da cabeça (modo espada)
  const SWORD_TIP = 90;             // ponta da espada no quadro do golpe (x do sprite)
  const RIDER_MODES = ['pumpkin', 'swordUp', 'swordSwing', 'carry'];
  const SW_C = { steel: '#cfd6e2', hi: '#ffffff', lo: '#6f7889', grip: '#3b2418' };

  function riderLeg(g, hx, hy, p, front, col) {
    const a = Math.sin(TAU * p), sw = Math.max(0, Math.cos(TAU * p));
    let th, lo;
    if (front) { th = 0.55 * a; lo = th - 1.45 * sw; }
    else { th = -0.12 + 0.5 * a; lo = th + 0.32 - 1.15 * sw; }
    const kx = hx + Math.sin(th) * 8, ky = hy + Math.cos(th) * 8;
    const fx = kx + Math.sin(lo) * 9, fy = ky + Math.cos(lo) * 9;
    g.line(hx, hy, kx, ky, col, front ? 1.4 : 2);
    g.line(kx, ky, fx, fy, col, 1);
    g.rect(Math.round(fx) - 1, Math.round(fy), Math.round(fx) + 1, Math.round(fy) + 1, H.horseLo);
  }

  function drawRider(g, f, v, mode = 'pumpkin') {
    const ph = f / R_FRAMES;
    const b = Math.round(Math.sin(TAU * ph * 2) * 0.9);
    const w1 = Math.sin(TAU * ph), w2 = Math.sin(TAU * ph + 1.3), w3 = Math.sin(TAU * ph + 2.6);
    const Y = y => y + b;

    // cauda
    g.line(28, Y(49), 20, Y(50 + w1), H.mane, 2);
    g.line(20, Y(50 + w1), 13, Y(55 + w2 * 2), H.mane, 2);
    g.line(13, Y(55 + w2 * 2), 9, Y(62 + w3), H.mane, 1);
    g.line(22, Y(49 + w1), 12, Y(54 + w2 * 2), H.maneHi, 0);

    // pernas do lado de lá
    riderLeg(g, 55, Y(55), ph + 0.12, true, H.far);
    riderLeg(g, 34, Y(54), ph + 0.62, false, H.far);

    // corpo
    g.ellipse(32, Y(49), 9, 8, H.horse);
    g.ellipse(44, Y(51), 17, 8.5, H.horse);
    g.ellipse(57, Y(50), 7, 7, H.horse);
    g.ellipse(43, Y(47), 11, 2.6, H.horseHi);
    g.ellipse(44, Y(57), 12, 2, H.horseLo);
    // pescoço e cabeça
    g.poly([[53, Y(45)], [58, Y(36)], [63, Y(30)], [68, Y(29)], [70, Y(33)], [65, Y(42)], [61, Y(53)]], H.horse);
    g.poly([[64, Y(31)], [68, Y(27)], [72, Y(28)], [78, Y(33)], [82, Y(38)], [80, Y(41)], [75, Y(40)], [69, Y(37)]], H.horse);
    g.line(62, Y(33), 58, Y(40), H.horseHi, 0);
    g.line(70, Y(30), 76, Y(34), H.horseHi, 0);
    g.line(67, Y(28), 66, Y(23), H.horse, 1);
    g.line(69, Y(28), 70, Y(24), H.horse, 0);
    g.rect(79, Y(39), 81, Y(40), H.horseLo);
    g.set(80, Y(38), OUTLINE);
    // crina
    for (let k = 0; k <= 5; k++) {
      const t = k / 5, bx = lerp(66, 56, t), by = lerp(30, 44, t);
      g.line(bx, Y(by), bx - 4 - 1.6 * Math.sin(TAU * ph + k), Y(by - 1 + k * 0.3), H.mane, 1);
    }
    g.line(65, Y(31), 57, Y(43), H.maneHi, 0);
    // arreio
    g.line(69, Y(29), 76, Y(37), H.silver, 0);
    g.line(76, Y(35), 78, Y(40), H.silver, 0);
    g.line(60, Y(44), 63, Y(52), H.silverLo, 0);
    g.set(62, Y(48), H.gold);
    // olho
    g.set(71, Y(31), H.eye); g.set(72, Y(31), H.eyeGlow);

    // pernas do lado de cá
    riderLeg(g, 57, Y(55), ph, true, H.horse);
    riderLeg(g, 32, Y(54), ph + 0.5, false, H.horse);

    // manta e sela
    g.poly([[36, Y(44)], [53, Y(44)], [52, Y(50)], [37, Y(50)]], H.blanket);
    g.line(37, Y(50), 52, Y(50), H.gold, 0);
    g.poly([[38, Y(42)], [51, Y(42)], [52, Y(46)], [37, Y(46)]], H.saddle);
    g.line(38, Y(42), 51, Y(42), H.saddleHi, 0);

    // capa
    const cape = [[46, Y(22)], [41, Y(23)], [34, Y(25 + w1)], [24, Y(27 + w2 * 1.5)], [14, Y(26 + w3 * 2)],
      [7, Y(30 + w1 * 2)], [12, Y(33 + w2)], [16, Y(35 + w3)], [22, Y(38 + w3)], [30, Y(40)], [40, Y(41)]];
    g.poly(cape, H.cape);
    g.line(7, Y(30 + w1 * 2), 12, Y(33 + w2), H.capeIn, 0);
    g.line(12, Y(33 + w2), 22, Y(38 + w3), H.capeIn, 0);
    g.line(22, Y(38 + w3), 32, Y(40), H.capeIn, 0);
    g.line(38, Y(26), 20, Y(30 + w2), H.capeHi, 0);
    g.line(36, Y(31), 16, Y(31 + w3), H.capeHi, 0);

    // braço de trás (rédeas)
    if (mode !== 'carry') {
      g.line(44, Y(26), 50, Y(33), H.coatLo, 1);
      g.line(50, Y(33), 56, Y(36), H.coatLo, 1);
      g.set(57, Y(36), H.boot); g.set(57, Y(37), H.boot);
    }

    // perna do cavaleiro
    g.line(46, Y(43), 51, Y(49), H.coat, 1.4);
    g.line(51, Y(49), 50, Y(57), H.boot, 1);
    g.line(50, Y(57), 54, Y(58), H.boot, 1);
    g.rect(49, Y(60), 53, Y(60), H.silver);

    // tronco
    g.poly([[40, Y(43)], [50, Y(43)], [51, Y(33)], [50, Y(25)], [46, Y(22)], [41, Y(23)], [39, Y(30)]], H.coat);
    g.line(40, Y(25), 40, Y(42), H.coatLo, 0);
    g.line(49, Y(26), 50, Y(40), H.coatHi, 0);
    g.rect(40, Y(38), 50, Y(39), H.belt);
    g.set(48, Y(38), H.gold); g.set(48, Y(39), H.gold);
    g.set(47, Y(27), H.silver); g.set(47, Y(30), H.silver); g.set(47, Y(33), H.silver);
    g.poly([[39, Y(40)], [45, Y(40)], [44 + w1 * 0.6, Y(47)], [37 + w2, Y(46)]], H.coatLo);
    // gola alta
    g.poly([[41, Y(23)], [49, Y(23)], [50, Y(19)], [46, Y(18)], [41, Y(19)]], H.coatLo);
    g.ellipse(49, Y(25), 3, 2, H.silverLo); g.set(49, Y(24), H.silver);

    if (mode === 'pumpkin') {
      g.set(44, Y(19), '#3a0a12'); g.set(45, Y(19), '#3a0a12');
      // braço erguido com a abóbora
      g.line(48, Y(25), 54, Y(16), H.coat, 1.3);
      g.line(54, Y(16), 57, Y(8), H.coat, 1);
      g.line(53, Y(17), 55, Y(12), H.coatHi, 0);
      g.set(56, Y(10), H.silver); g.set(57, Y(10), H.silver);
      g.ellipse(57, Y(7), 1.5, 1.5, H.boot);
      drawPumpkinHead(g, PUMP.x, Y(PUMP.y), v);
    } else {
      // modo espada: abóbora em chamas no lugar da cabeça
      if (mode === 'carry') {
        // braço de trás erguido com a cabeça do zumbi como troféu
        g.line(42, Y(24), 37, Y(16), H.coatLo, 1.2);
        g.line(37, Y(16), 33, Y(9), H.coatLo, 1);
        drawHead({ set: (x, y, c) => g.set(33 + x, Y(y + 33 + 1), c) }, 0, false);
        g.ellipse(33, Y(7), 1.5, 1.5, H.boot);
        g.set(32, Y(8), Z.blood); g.set(34, Y(9), Z.blood);
      }
      drawPumpkinHead(g, NECK.x, Y(NECK.y), v);
      const sword = (hx, hy, tx, ty, gx0, gy0, gx1, gy1) => {
        g.line(hx, hy, tx, ty, SW_C.steel, 0.8);
        g.line(hx + (tx > hx ? 1 : 0), hy - 1, tx, ty - 1, SW_C.hi, 0);
        g.line(gx0, gy0, gx1, gy1, H.gold, 0);
      };
      if (mode === 'swordUp') {
        g.line(48, Y(25), 53, Y(19), H.coat, 1.3);
        g.line(53, Y(19), 55, Y(13), H.coat, 1);
        g.line(55, Y(13), 54, Y(16), SW_C.grip, 0);
        sword(56, Y(11), 62, Y(-8), 53, Y(12), 58, Y(11));
        g.ellipse(55, Y(13), 1.4, 1.4, H.boot);
      } else if (mode === 'swordSwing') {
        g.line(48, Y(25), 55, Y(34), H.coat, 1.3);
        g.line(55, Y(34), 60, Y(42), H.coat, 1);
        sword(62, Y(44), SWORD_TIP, Y(45), 61, Y(41), 61, Y(47));
        g.ellipse(60, Y(43), 1.4, 1.4, H.boot);
      } else {
        g.line(48, Y(25), 53, Y(31), H.coat, 1.3);
        g.line(53, Y(31), 56, Y(34), H.coat, 1);
        sword(57, Y(36), 70, Y(49), 55, Y(37), 58, Y(34));
        g.ellipse(56, Y(34), 1.4, 1.4, H.boot);
      }
    }

    // rédeas por cima
    if (mode !== 'carry') g.line(57, Y(36), 77, Y(37), H.leather, 0);
    return b;
  }

  function drawPumpkinHead(g, px, py, v) {
    g.ellipse(px, py, 6.4, 5.2, H.pumpLo);
    g.ellipse(px, py, 5.4, 4.6, H.pump);
    g.line(px - 2, py - 4, px - 3, py - 1, H.pumpLo, 0);
    g.line(px + 2, py - 4, px + 3, py - 1, H.pumpLo, 0);
    g.set(px - 4, py - 2, H.pumpHi); g.set(px - 5, py - 1, H.pumpHi); g.set(px + 1, py - 4, H.pumpHi);
    g.set(px, py - 6, H.stem); g.set(px, py - 5, H.stem); g.set(px + 1, py - 6, H.stem);
    const fc = v ? H.face2 : H.face;
    [[-3, 0], [-2, 0], [-2, -1], [2, -1], [2, 0], [3, 0], [0, 1]].forEach(([x, y]) => g.set(px + x, py + y, fc));
    [[-4, 3], [-3, 3], [-2, 4], [-1, 3], [0, 4], [1, 3], [2, 4], [3, 3], [4, 2]].forEach(([x, y]) => g.set(px + x, py + y, fc));
    g.set(px - 2, py, H.faceIn); g.set(px + 2, py, H.faceIn); g.set(px, py + 4, H.faceIn);
  }

  // luz da lua: pixels com o topo exposto ganham um tom mais claro
  function rimLight(g, map) {
    const d = g.d.slice(), w = g.w;
    for (let i = w; i < d.length; i++) if (d[i] && !d[i - w] && map[d[i]]) g.d[i] = map[d[i]];
  }

  let riderFrames = null, riderBob = [];
  function buildRider() {
    if (riderFrames) return;
    riderFrames = {};
    for (const mode of RIDER_MODES) {
      riderFrames[mode] = [];
      for (let f = 0; f < R_FRAMES; f++) {
        riderFrames[mode][f] = [];
        for (let v = 0; v < 2; v++) {
          const g = new Grid(RW, RH, 0, ROY);
          riderBob[f] = drawRider(g, f, v, mode);
          rimLight(g, { [H.horse]: H.horseHi, [H.coat]: H.coatHi, [H.cape]: H.capeHi, [H.mane]: H.maneHi, [H.far]: H.horse, [H.coatLo]: H.coat });
          g.outline(OUTLINE);
          riderFrames[mode][f][v] = g.toCanvas();
        }
      }
    }
  }

  /* ======================================================================
   * Túmulos + zumbi policial
   * ==================================================================== */
  const GW = 56, GH = 66, GY = 58, GCX = 28;
  const Z = {
    skin: '#86a66a', skinLo: '#5f7d4c', skinHi: '#a8c788',
    shirt: '#2b4b88', shirtLo: '#1c3361', shirtHi: '#3f66ac',
    pants: '#18264a', pantsLo: '#101a33', shoe: '#141018',
    cap: '#18244c', capBand: '#0a0e1c', visor: '#05070f',
    gold: '#e2b84a', eye: '#ff3b30', eyeW: '#f2efc4', mouth: '#2a0f14', blood: '#7d1623', tie: '#0e1426',
    stone: '#5e5771', stoneHi: '#7b7492', stoneLo: '#3f3951', text: '#2a2536', moss: '#3f5a3a', moss2: '#56743f',
    soil: '#2b1b17', soil2: '#3c271f', soil3: '#4f3328', hole: '#110908', grass: '#2d3c2b', grass2: '#40553a',
    wood: '#4a3424', woodHi: '#5f4430'
  };

  const GLYPH = {
    R: ['111', '101', '110', '101', '101'],
    I: ['111', '010', '010', '010', '111'],
    P: ['111', '101', '111', '100', '100'],
    '?': ['111', '001', '011', '000', '010'],
    '!': ['010', '010', '010', '000', '010'],
    B: ['110', '101', '110', '101', '110'],
    U: ['101', '101', '101', '101', '111']
  };
  function glyph(g, ch, x, y, c) {
    GLYPH[ch].forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') g.set(x + i, y + j, c); }));
  }

  function drawStone(g, type, seed) {
    const s = seed;
    if (type === 'cross') {
      g.rect(23, GY - 4, 33, GY - 1, Z.stoneLo);
      g.rect(26, 24, 30, GY - 4, Z.wood);
      g.rect(19, 31, 37, 35, Z.wood);
      g.line(26, 24, 26, GY - 5, Z.woodHi, 0);
      g.line(19, 31, 37, 31, Z.woodHi, 0);
      g.set(28, 33, Z.text); g.set(28, 38, Z.text);
      g.line(30, 40, 29, 46, '#3a2819', 0);
    } else if (type === 'tall') {
      g.rect(20, GY - 6, 36, GY - 1, Z.stoneLo);
      g.rect(22, 22, 34, GY - 6, Z.stone);
      g.poly([[22, 22], [28, 14], [35, 22]], Z.stone);
      g.line(22, 22, 22, GY - 6, Z.stoneHi, 0);
      g.line(34, 22, 34, GY - 6, Z.stoneLo, 0);
      g.line(23, 21, 28, 15, Z.stoneHi, 0);
      glyph(g, 'R', 23, 30, Z.text); glyph(g, 'I', 27, 30, Z.text); glyph(g, 'P', 31, 30, Z.text);
      g.line(31, 38 + s % 4, 29, 44, Z.stoneLo, 0);
    } else {
      g.rect(19, 32, 37, GY - 1, Z.stone);
      g.ellipse(28, 33, 9, 6, Z.stone);
      g.line(20, 31, 20, GY - 2, Z.stoneHi, 0);
      g.line(36, 31, 36, GY - 2, Z.stoneLo, 0);
      g.set(25, 28, Z.stoneHi); g.set(26, 28, Z.stoneHi); g.set(23, 29, Z.stoneHi);
      glyph(g, 'R', 23, 35, Z.text); glyph(g, 'I', 27, 35, Z.text); glyph(g, 'P', 31, 35, Z.text);
      g.line(34, 28, 32, 32, Z.stoneLo, 0); g.line(32, 32, 34, 36, Z.stoneLo, 0);
      g.line(22, 44, 26, 46, Z.stoneLo, 0);
    }
    for (let i = 0; i < 9; i++) {
      const x = 19 + ((s * 7 + i * 13) % 19), y = GY - 1 - ((s + i * 3) % 4);
      g.set(x, y, i % 2 ? Z.moss : Z.moss2);
    }
  }

  // braço com cinemática inversa (2 ossos): a mão vai ao alvo, o cotovelo dobra para fora
  function arm(T, sx, sy, tx, ty, side, wiggle) {
    const L1 = 6, L2 = 6;
    let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy);
    const dc = clamp(d, 1, L1 + L2 - 0.05);
    const a = Math.atan2(dy, dx);
    const b = Math.acos(clamp((L1 * L1 + dc * dc - L2 * L2) / (2 * L1 * dc), -1, 1));
    const e1 = [sx + Math.cos(a + b) * L1, sy + Math.sin(a + b) * L1];
    const e2 = [sx + Math.cos(a - b) * L1, sy + Math.sin(a - b) * L1];
    const el = (side > 0 ? e1[0] >= e2[0] : e1[0] <= e2[0]) ? e1 : e2;
    const hx = sx + Math.cos(a) * dc, hy = sy + Math.sin(a) * dc;
    T.line(sx, sy, el[0], el[1], Z.shirt, 1);
    T.line(el[0], el[1], hx, hy, Z.skin, 0.8);
    T.set(el[0], el[1], Z.shirtLo);
    // mão + dedos
    T.ellipse(hx, hy, 1.2, 1.2, Z.skin);
    const fa = Math.atan2(hy - el[1], hx - el[0]);
    const px = -Math.sin(fa), py = Math.cos(fa);
    for (let k = -1; k <= 1; k++) {
      const ext = 2 + (wiggle && ((k + wiggle) & 1) ? 1 : 0);
      T.set(hx + Math.cos(fa) * ext + px * k, hy + Math.sin(fa) * ext + py * k, Z.skinLo);
    }
  }

  // timeline do zumbi (segundos)
  const ZT = { dur: 9.7, durDecap: 11.6 };
  function zombiePose(t, Z0) {
    if (Z0 && Z0.variant === 'decap' && t >= 5.0) return decapPose(t, Z0.side);
    if (Z0 && Z0.variant === 'horse' && t >= 5.0) return horsePose(t, Z0.side);
    const P = { rise: 0, R: 'up', L: 'hidden', mixR: 0, mixL: 0, head: 0, lean: 0, q: false, wiggle: 0, shake: false, scratch: false, upR: 6, upL: 6, duck: 3 };
    const up = Math.sin(t * 6) * 1.6;
    if (t < 0.9) { P.shake = true; }
    else if (t < 1.7) { P.rise = lerp(0, 0.22, ease((t - 0.9) / 0.8)); P.wiggle = Math.floor(t * 8) % 3; P.sway = up; }
    else if (t < 2.3) { const k = ease((t - 1.7) / 0.6); P.rise = lerp(0.22, 0.34, k); P.R = 'up>plant'; P.mixR = k; P.upR = 6 * (1 - k); P.L = 'up'; P.wiggle = Math.floor(t * 8) % 3; }
    else if (t < 2.8) { const k = ease((t - 2.3) / 0.5); P.rise = lerp(0.34, 0.45, k); P.R = 'plant'; P.upR = 0; P.L = 'up>plant'; P.mixL = k; P.upL = 6 * (1 - k); P.duck = 3 * (1 - k); }
    if (t >= 2.8) { P.upR = P.upL = P.duck = 0; }
    if (t < 2.8) { /* já tratado */ }
    else if (t < 4.4) {
      const k = (t - 2.8) / 1.6;
      // sobe aos trancos: esforço, pausa, esforço
      P.rise = lerp(0.45, 0.82, k - Math.sin(k * TAU * 3) / (TAU * 3));
      P.R = 'plant'; P.L = 'plant'; P.lean = Math.sin(t * 5) * 0.8;
    }
    else if (t < 5.0) { P.rise = lerp(0.82, 1, ease((t - 4.4) / 0.6)); P.R = 'plant>hang'; P.L = 'plant>hang'; P.mixR = P.mixL = ease((t - 4.4) / 0.6); }
    else if (t < 5.5) { P.rise = 1; P.R = P.L = 'hang'; P.lean = Math.sin(t * 3) * 0.7; }
    else if (t < 7.1) {
      P.rise = 1; P.R = P.L = 'hang';
      P.head = t < 6.0 ? -1 : t < 6.5 ? 1 : t < 6.9 ? -1 : 0;
    }
    else if (t < 8.5) { P.rise = 1; P.R = 'scratch'; P.L = 'hang'; P.q = t > 7.3; P.lean = -0.6; P.scratch = Math.floor(t * 10) % 2; }
    else if (t < 8.8) { P.rise = 1; P.R = 'hang>flail'; P.L = 'hang>flail'; P.mixR = P.mixL = ease((t - 8.5) / 0.3); P.head = 0; }
    else { const k = clamp((t - 8.8) / 0.5, 0, 1); P.rise = 1 - k * k; P.R = P.L = 'flail'; }
    return P;
  }

  // Variante: o Ceifador corta a cabeça; o zumbi procura, recoloca (de costas!) e volta pra cova.
  // side = lado onde o Ceifador aparece (+1 direita, -1 esquerda); a cabeça voa para o lado oposto.
  function decapPose(t, side) {
    const dir = -side, j = Math.floor(t * 10) % 2;
    const P = { rise: 1, R: 'hang', L: 'hang', mixR: 0, mixL: 0, head: 0, lean: 0, q: false, wiggle: 0,
      upR: 0, upL: 0, duck: 0, headMode: 'on', headPos: [0, -33], headRot: 0, back: false, bang: false };
    const ground = [dir * 14, -4];
    if (t < 6.5) {
      P.head = t < 5.6 ? 0 : side;
      P.bang = t > 6.0;
      P.lean = Math.sin(t * 3) * 0.6;
    } else {
      P.headMode = 'off';
      if (t < 7.1) {
        const k = (t - 6.5) / 0.6;
        P.headPos = [lerp(0, ground[0], k), lerp(-33, ground[1], k) - 22 * 4 * k * (1 - k)];
        P.headRot = Math.floor((t - 6.5) * 14) % 4;
      } else {
        const b = t < 7.25 ? Math.sin(Math.PI * (t - 7.1) / 0.15) * 3 : 0;
        P.headPos = [ground[0], ground[1] - b];
        P.headRot = 1;
      }
      if (t < 7.6) { P.R = [8 + j * 2, -34]; P.L = [-9 - j * 2, -34]; P.lean = Math.sin(t * 14) * 1.2; P.wiggle = 1 + j; }
      else if (t < 8.2) { P.R = [2, -29 + j]; P.L = [-3, -29 + (1 - j)]; }
      else if (t < 8.9) {
        const k = ease((t - 8.2) / 0.7);
        P.lean = dir * 5 * k;
        const near = [lerp(dir * 7, ground[0], k), lerp(-15, ground[1] + 1, k)];
        if (dir > 0) P.R = near; else P.L = near;
      } else if (t < 9.5) {
        const k = ease((t - 8.9) / 0.6);
        P.lean = dir * 5 * (1 - k);
        const hand = [lerp(ground[0], dir * 4, k), lerp(ground[1] + 1, -31, k)];
        const other = [lerp(-dir * 7, -dir * 6, k), lerp(-15, -32, k)];
        if (dir > 0) { P.R = hand; P.L = other; } else { P.L = hand; P.R = other; }
        P.headMode = 'held';
        P.headPos = [hand[0] - dir, hand[1] - 3];
        P.headRot = k < 0.6 ? 1 : 0;
      } else {
        P.headMode = 'on';
        if (t < 10.2) { P.back = true; P.R = [5, -33 + j]; P.L = [-6, -33 - j]; P.q = t > 9.7; }
        else if (t < 10.5) { P.R = [5, -33]; P.L = [-6, -33]; P.head = t < 10.35 ? -1 : 1; }
        else if (t < 10.8) { P.R = 'hang>flail'; P.L = 'hang>flail'; P.mixR = P.mixL = ease((t - 10.5) / 0.3); }
        else { const k = clamp((t - 10.8) / 0.5, 0, 1); P.rise = 1 - k * k; P.R = P.L = 'flail'; }
      }
    }
    return P;
  }

  // Variante "horse": o cavaleiro com espada passa, corta e leva a cabeça. Até 8.4s o zumbi está na cova;
  // depois a perseguição (soloPose) é conduzida pela cena.
  const HORSE_HIT = 6.6;
  function horsePose(t, side) {
    const ex = -side, j = Math.floor(t * 10) % 2;
    const P = { rise: 1, R: 'hang', L: 'hang', mixR: 0, mixL: 0, head: 0, lean: 0, q: false, wiggle: 0, upR: 0, upL: 0, duck: 0, headMode: 'on' };
    if (t < HORSE_HIT) { P.head = t < 5.5 ? 0 : side; P.bang = t > 6.0; P.lean = Math.sin(t * 3) * 0.6; return P; }
    P.headMode = 'gone';
    if (t < 7.5) { P.R = [8 + j * 2, -34]; P.L = [-9 - j * 2, -34]; P.lean = Math.sin(t * 14) * 1.2; P.wiggle = 1 + j; }
    else if (t < 8.1) { P.R = [2, -29 + j]; P.L = [-3, -29 + (1 - j)]; }
    else { const k = ease(clamp((t - 8.1) / 0.3, 0, 1)), pt = [ex * 12, -27]; if (ex > 0) P.R = [lerp(7, pt[0], k), lerp(-15, pt[1], k)]; else P.L = [lerp(-8, pt[0], k), lerp(-15, pt[1], k)]; P.lean = ex * k; }
    return P;
  }
  // fora da cova: perseguindo, voltando com a cabeça debaixo do braço, recolocando
  function soloPose(z) {
    const j = Math.floor(z.pt * 10) % 2, base = { rise: 1, head: 0, lean: 0, wiggle: 0, upR: 0, upL: 0, duck: 0, mixR: 0, mixL: 0 };
    if (z.phase === 'chase') {
      const ex = z.ex;
      return Object.assign(base, { outside: true, headMode: 'gone', walk: z.pt * 11, R: [ex * 10, -27 + j], L: [ex * 9, -26 - j], lean: ex * 2.5, wiggle: 1 + j });
    }
    if (z.phase === 'return') {
      const w = z.wdir;
      return Object.assign(base, { outside: true, headMode: 'held', headPos: [-8, -20], headFace: w, walk: z.pt * 7,
        L: [-7, -18], R: [7 + Math.sin(z.pt * 7) * 2, -15], lean: w * 0.6 });
    }
    // recolocando (já de volta na cova)
    const τ = z.pt;
    if (τ < 0.6) {
      const k = ease(τ / 0.6), L = [lerp(-7, -1, k), lerp(-18, -31, k)];
      return Object.assign(base, { headMode: 'held', headPos: [L[0], L[1] - 2], L, R: 'hang' });
    }
    if (τ < 1.1) return Object.assign(base, { headMode: 'on', R: [5, -33 + j], L: [-6, -33 - j] });
    if (τ < 1.7) return Object.assign(base, { headMode: 'on', R: 'hang', L: 'hang', head: τ < 1.4 ? -1 : 1 });
    if (τ < 2.0) { const m = ease((τ - 1.7) / 0.3); return Object.assign(base, { headMode: 'on', R: 'hang>flail', L: 'hang>flail', mixR: m, mixL: m }); }
    const k = clamp((τ - 2.0) / 0.5, 0, 1);
    return Object.assign(base, { headMode: 'on', R: 'flail', L: 'flail', rise: 1 - k * k });
  }

  function handTarget(name, side, P, offY) {
    if (Array.isArray(name)) return name;
    const sx = side > 0 ? 4 : -5;
    const T = {
      hidden: [sx * 1.4, -30],
      up: [side > 0 ? 5 + (P.sway || 0) : -6 - (P.sway || 0), -37 - (side > 0 ? P.upR : P.upL)],
      plant: [side > 0 ? 10 : -11, -offY],
      hang: [side > 0 ? 7 : -8, -15],
      scratch: [1 + P.scratch, -37],
      flail: [side > 0 ? 8 : -9, -35]
    };
    if (name.includes('>')) {
      const [a, b] = name.split('>'), m = side > 0 ? P.mixR : P.mixL;
      return [lerp(T[a][0], T[b][0], m), lerp(T[a][1], T[b][1], m)];
    }
    return T[name];
  }

  function drawZombie(g, P, t, org) {
    const ox = org ? org.x : GCX;
    const offY = (1 - P.rise) * 46;
    const oy = (org ? org.y : GY - 2) + offY;
    const lean = P.lean;
    const tx = (x, y) => ox + x + lean * (-y) / 38;
    let T = {
      set: (x, y, c) => g.set(tx(x, y), oy + y, c),
      line: (x0, y0, x1, y1, c, r) => g.line(tx(x0, y0), oy + y0, tx(x1, y1), oy + y1, c, r),
      rect: (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) T.set(x, y, c); },
      ellipse: (cx, cy, rx, ry, c) => g.ellipse(tx(cx, cy), oy + cy, rx, ry, c)
    };
    // pernas (P.walk = fase do passo, quando andando)
    const wk = P.walk != null ? Math.sin(P.walk) : 0;
    const fl = Math.round(-2 + wk * 3), fr = Math.round(3 - wk * 3);
    const ll = wk > 0.4 ? 1 : 0, rl = wk < -0.4 ? 1 : 0;
    T.line(-2, -13, fl, -2 - ll, Z.pants, 1);
    T.line(2, -13, fr, -2 - rl, Z.pants, 1);
    T.line(-3, -12, fl - 1, -3 - ll, Z.pantsLo, 0);
    T.set(fr, -6, Z.skin); T.set(fr + 1, -5, Z.skinLo);
    T.rect(fl - 2, -1 - ll, fl + 1, -ll, Z.shoe); T.rect(fr - 1, -1 - rl, fr + 2, -rl, Z.shoe);
    // tronco
    T.rect(-5, -27, 4, -25, Z.shirt);
    T.rect(-4, -24, 3, -14, Z.shirt);
    for (let y = -26; y <= -15; y++) { T.set(-4, y, Z.shirtHi); T.set(3, y, Z.shirtLo); }
    T.set(-1, -27, Z.skin); T.set(0, -27, Z.skin);
    T.line(0, -26, 0, -20, Z.tie, 0); T.set(-1, -21, Z.tie);
    T.set(2, -24, Z.gold); T.set(3, -24, Z.gold); T.set(2, -23, Z.gold);
    T.set(-3, -24, Z.shirtLo); T.set(-2, -24, Z.shirtLo);
    T.set(-3, -19, Z.skin); T.set(-2, -18, Z.skin); T.set(-3, -18, Z.skinLo); T.set(-2, -19, Z.blood);
    T.set(1, -17, Z.blood); T.set(1, -16, Z.blood);
    T.rect(-4, -14, 3, -14, Z.shoe); T.set(0, -14, Z.gold);
    // cabeça (abaixada enquanto escava: P.duck)
    const T0 = T, hd = Math.round(P.duck || 0);
    if (!P.headMode || P.headMode === 'on') {
      drawHead({ set: (x, y, c) => T0.set(x, y + hd, c) }, P.head, P.back);
    } else {
      // pescoço cortado
      T.set(-1, -28, Z.blood); T.set(0, -28, Z.blood); T.set(-1, -29, '#4a0b14'); T.set(0, -29, '#4a0b14');
      if (P.headPos) {
        const [px, py] = P.headPos, k = (((P.headRot || 0) % 4) + 4) % 4;
        drawHead({ set: (x, y, c) => {
          let dx = x, dy = y + 33;
          for (let i = 0; i < k; i++) [dx, dy] = [-dy, dx];
          g.set(ox + px + dx, oy + py + dy, c);
        } }, P.headFace || 0, false);
      }
    }
    // braços (o ombro "sobe" debaixo da terra enquanto a mão procura a superfície)
    arm(T, 4, -25 - (P.upR || 0), ...handTarget(P.R, 1, P, offY), 1, P.wiggle);
    arm(T, -5, -25 - (P.upL || 0), ...handTarget(P.L, -1, P, offY), -1, P.wiggle);
    // interrogação / exclamação
    const mark = P.q ? '?' : P.bang ? '!' : null;
    if (mark) {
      const qy = -48 + (Math.floor(t * 4) % 2);
      glyph({ set: (x, y) => { T.set(x, y, mark === '!' ? '#ffd84a' : '#fff3c4'); } }, mark, 5, qy);
    }
  }

  // cabeça do zumbi (coordenadas padrão: centro em 0,-33). h = olhar (-1, 0, 1); back = de costas
  function drawHead(T, h, back) {
    T.rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) T.set(x, y, c); };
    const mx = x => (h < 0 ? -1 - x : x);
    if (back) {
      T.rect(-4, -35, 3, -28, Z.skinLo);
      T.set(-5, -31, Z.skinLo); T.set(4, -31, Z.skinLo);
      T.set(-2, -32, '#3d5232'); T.set(-1, -31, '#3d5232'); T.set(0, -32, '#3d5232'); T.set(1, -31, '#3d5232');
      T.rect(-4, -39, 3, -37, Z.cap); T.rect(-5, -38, 4, -37, Z.cap); T.rect(-5, -36, 4, -36, Z.capBand);
      return;
    }
    T.rect(-4, -35, 3, -28, Z.skin);
    for (let y = -34; y <= -28; y++) { T.set(mx(3), y, Z.skinLo); T.set(mx(-4), y, Z.skinHi); }
    if (h === 0) {
      T.set(-2, -32, Z.eye); T.set(1, -32, Z.eye);
      T.set(-3, -33, Z.skinLo); T.set(-2, -33, Z.skinLo); T.set(1, -33, Z.skinLo); T.set(2, -33, Z.skinLo);
      T.set(0, -31, Z.skinLo);
      T.set(-2, -29, Z.mouth); T.set(-1, -29, Z.mouth); T.set(0, -29, Z.eyeW); T.set(1, -29, Z.mouth);
      T.set(-1, -30, Z.mouth);
    } else {
      [[0, -32, Z.eye], [2, -32, Z.eye], [3, -31, Z.skin], [4, -31, Z.skin], [4, -30, Z.skinLo],
        [1, -29, Z.mouth], [2, -29, Z.eyeW], [3, -29, Z.mouth], [-3, -31, Z.skinLo], [-3, -30, Z.skinLo],
        [1, -33, Z.skinLo], [2, -33, Z.skinLo]].forEach(([x, y, c]) => T.set(mx(x), y, c));
    }
    T.set(-3, -28, Z.blood);
    // quepe de policial
    T.rect(-4, -39, 3, -37, Z.cap);
    T.rect(-5, -38, 4, -37, Z.cap);
    T.rect(-5, -36, 4, -36, Z.capBand);
    T.set(-1, -39, '#24336a'); T.set(0, -39, '#24336a');
    if (h === 0) { T.rect(-5, -35, 4, -35, Z.visor); T.set(-1, -38, Z.gold); T.set(0, -38, Z.gold); T.set(-1, -37, Z.gold); }
    else { [[3, -35], [4, -35], [5, -35], [6, -35]].forEach(([x, y]) => T.set(mx(x), y, Z.visor)); T.set(mx(1), -38, Z.gold); T.set(mx(2), -38, Z.gold); }
  }

  function renderGrave(gr, P, t) {
    const g = new Grid(GW, GH);
    drawStone(g, gr.type, gr.seed);
    const jit = P && P.shake ? (Math.floor(t * 20) % 2 ? 1 : -1) : 0;
    const active = P && P.rise > 0.01;
    if (active) g.ellipse(GCX, GY - 1, 6, 1.3, Z.hole);
    if (active && !P.outside) { g.clipY = GY; drawZombie(g, P, t); g.clipY = Infinity; }
    g.outline(OUTLINE);
    // o chão em si vem do cenário de fundo (mesma linha e mesma textura); aqui só limpa abaixo da superfície
    for (let y = GY; y < GH; y++) for (let x = 0; x < GW; x++) g.d[y * GW + x] = null;
    // terra remexida da cova, rente ao chão (só uma linha acima da superfície)
    const patch = (x, y, c) => { if (x >= 0 && x < GW && y >= 0 && y < GH && !g.d[y * GW + x]) g.d[y * GW + x] = c; };
    for (let x = -9; x <= 9; x++) patch(GCX + jit + x, GY - 1, Math.abs(x) > 7 ? Z.soil : (x * 7 + gr.seed) % 5 === 0 ? Z.soil3 : Z.soil2);
    for (let y = GY; y <= GY + 2; y++) for (let x = -10 + (y - GY); x <= 10 - (y - GY); x++)
      patch(GCX + jit + x, y, (x * 13 + y * 7 + gr.seed) % 6 === 0 ? Z.soil3 : Z.soil2);
    if (active) for (let x = -5; x <= 5; x++) { g.d[(GY - 1) * GW + GCX + x] = g.d[(GY - 1) * GW + GCX + x] || Z.hole; }
    for (let i = 0; i < 7; i++) {
      const x = (gr.seed * 5 + i * 9) % GW;
      if (Math.abs(x - GCX) < 13) continue;
      g.set(x, GY - 1, Z.grass); g.set(x + 1, GY - 2, Z.grass2); g.set(x + 2, GY - 1, Z.grass);
    }
    return g.toCanvas(gr.canvas);
  }

  /* ======================================================================
   * Ceifador (personagem original): capuz, caveira de olhos roxos, foice
   * ==================================================================== */
  const C = {
    robe: '#150f1e', robeHi: '#2c2140', robeLo: '#0a0710', trim: '#5b2d8a',
    bone: '#e9e3d0', boneLo: '#b3aa92', eye: '#c27bff', voidC: '#030206',
    wood: '#4a3424', woodHi: '#6a4a30', steel: '#c9d1e0', steelHi: '#ffffff', steelLo: '#7d869a'
  };
  const CW = 48, CH = 64, COY = 8, CBX = 16, CBOTTOM = 48;  // CBX = centro do corpo; CBOTTOM = barra do manto
  const REAPER_HAND = { x: 24, y: 20 };                       // pivô do golpe (coordenadas do sprite)

  function drawReaper(g, pose, tat) {
    // manto
    g.poly([[10, 15], [22, 15], [25, 30], [28, 47], [24, 44 + tat], [20, 48 - tat], [16, 45 + tat], [12, 48],
      [8, 44 - tat], [5, 46], [7, 30]], C.robe);
    g.line(9, 18, 6, 43, C.robeHi, 0);
    g.line(14, 20, 12, 44, C.robeHi, 0);
    g.line(23, 18, 26, 43, C.robeLo, 0);
    [[12, 48], [20, 48 - tat], [5, 46], [28, 47]].forEach(([x, y]) => g.set(x, y - 1, C.trim));
    // capuz
    g.ellipse(16, 11, 7, 8, C.robeHi);
    g.ellipse(15.5, 11.5, 6.4, 7.4, C.robe);
    g.set(13, 3, C.robe); g.set(12, 4, C.robe);
    g.ellipse(18.5, 12.5, 3.6, 4.6, C.voidC);
    // caveira
    g.rect(17, 10, 20, 15, C.bone);
    g.line(20, 10, 20, 15, C.boneLo, 0);
    g.set(17, 11, C.eye); g.set(19, 11, C.eye);
    g.set(18, 13, C.voidC);
    g.set(17, 15, C.voidC); g.set(19, 15, C.voidC);

    const sleeve = (x0, y0, x1, y1) => g.line(x0, y0, x1, y1, C.robe, 1.4);
    const hand = (x, y) => { g.set(x, y, C.bone); g.set(x + 1, y, C.bone); g.set(x, y + 1, C.boneLo); };
    if (pose === 'windup') {
      g.line(4, 6, 24, 30, C.wood, 0); g.line(5, 6, 25, 30, C.woodHi, 0);
      g.poly([[5, 7], [1, 1], [3, -5], [7, -2], [6, 2], [9, 6]], C.steel);
      g.line(2, 0, 3, -4, C.steelHi, 0); g.line(6, 2, 8, 5, C.steelLo, 0);
      sleeve(20, 16, 14, 18); hand(13, 17);
      sleeve(12, 18, 20, 25); hand(20, 25);
    } else if (pose === 'slash') {
      g.line(12, 22, 40, 18, C.wood, 0); g.line(12, 23, 40, 19, C.woodHi, 0);
      g.poly([[39, 16], [43, 18], [45, 24], [44, 32], [41, 27], [39, 21]], C.steel);
      g.line(44, 20, 44, 29, C.steelHi, 0); g.line(40, 20, 41, 25, C.steelLo, 0);
      sleeve(20, 16, 22, 20); hand(22, 20);
      sleeve(13, 19, 28, 20); hand(29, 19);
    } else {
      g.line(26, 4, 25, 47, C.wood, 0); g.line(27, 4, 26, 47, C.woodHi, 0);
      g.poly([[26, 4], [31, 1], [37, 3], [41, 8], [37, 6], [31, 5], [26, 6]], C.steel);
      g.line(31, 1, 38, 3, C.steelHi, 0); g.line(31, 5, 37, 6, C.steelLo, 0);
      sleeve(20, 17, 24, 23); hand(24, 23);
      sleeve(12, 18, 18, 30); g.line(18, 30, 23, 32, C.robe, 1); hand(24, 32);
    }
  }
  let reaperFrames = null;
  function buildReaper() {
    if (reaperFrames) return;
    reaperFrames = {};
    [['idleA', 'idle', 0], ['idleB', 'idle', 2], ['windup', 'windup', 1], ['slash', 'slash', 1]].forEach(([name, pose, tat]) => {
      const g = new Grid(CW, CH, 0, COY);
      drawReaper(g, pose, tat);
      g.outline(OUTLINE);
      reaperFrames[name] = g.toCanvas();
    });
  }

  /* ======================================================================
   * "O Rebitado" — slasher original: ex-açougueiro de matadouro abandonado.
   * Máscara de chapa de ferro rebitada (fenda única, um olho aceso), capuz de pano,
   * camisa de trabalho, avental de couro manchado, galochas e cutelo enferrujado.
   * ==================================================================== */
  const K = {
    hood: '#17141c', hoodHi: '#2a2531',
    shirt: '#2c302a', shirtHi: '#40463c', shirtLo: '#1a1c18',
    apron: '#3b151a', apronHi: '#57212a', apronLo: '#250b0f', stain: '#661019',
    pants: '#1d1b23', boot: '#0f0f13', bootHi: '#2a2a31',
    skin: '#8c7c70', skinLo: '#685a50',
    mask: '#5f5049', maskHi: '#8c7a6c', maskLo: '#3b302b', rivet: '#c9b394', slit: '#0a0506',
    eye: '#ffb030', eyeDim: '#7a2a10', rustSpot: '#8a3f1c',
    steel: '#9aa0aa', steelHi: '#dfe4ec', steelLo: '#5a6068', rust: '#7a3a1e', handle: '#3b2618', buckle: '#8a7a5a'
  };
  const KW = 50, KH = 64, KOY = 8, KBX = 16, KFEET = 54;
  const SLASHER_PIVOT = { x: 22, y: 21 };

  function drawSlasher(g, pose, b, walk) {
    const U = y => y + b;
    // pernas e galochas
    const legs = walk === 1 ? [[14, 9], [19, 24]] : walk === 2 ? [[14, 18], [19, 15]] : [[14, 13], [19, 20]];
    legs.forEach(([hx, fx], i) => {
      g.line(hx, 38, fx + 0.5, 49, i ? K.pants : '#16141b', 1.5);
      g.rect(fx - 2, 50, fx + 3, 54, K.boot);
      g.line(fx - 2, 50, fx + 2, 50, K.bootHi, 0);
    });
    // braço de trás
    g.line(10, U(20), 8, U(29), K.shirtLo, 1.3);
    g.line(8, U(29), 9, U(34), K.skinLo, 1);
    // tronco largo, ombros curvados para frente
    g.poly([[8, U(18)], [24, U(18)], [26, U(24)], [24, 38], [10, 38], [7, U(24)]], K.shirt);
    g.line(8, U(19), 7, U(30), K.shirtHi, 0);
    g.line(25, U(22), 24, 37, K.shirtLo, 0);
    // avental de couro
    g.poly([[11, U(22)], [21, U(22)], [23, 44], [9, 44]], K.apron);
    g.line(11, U(23), 9, 43, K.apronHi, 0);
    g.line(12, U(22), 14, U(17), K.apronLo, 0); g.line(20, U(22), 19, U(17), K.apronLo, 0);
    [[14, 34], [15, 35], [18, 40], [19, 41], [13, 26], [20, 30]].forEach(([x, y]) => g.set(x, y < 30 ? U(y) : y, K.stain));
    g.line(9, U(30), 24, U(30), K.apronLo, 0);
    g.set(16, U(30), K.buckle); g.set(17, U(30), K.buckle);
    // gancho de carne no cinto
    g.line(9, U(31), 9, U(34), K.steelLo, 0); g.set(10, U(35), K.steel); g.set(11, U(34), K.steel);
    const armFn = (sx, sy, ex, ey, hx, hy) => {
      g.line(sx, sy, ex, ey, K.shirt, 1.4);
      g.line(ex, ey, hx, hy, K.skin, 1);
      g.set(ex, ey, K.shirtLo);
      g.ellipse(hx, hy, 1.3, 1.3, K.skinLo);
    };
    const bladeFn = (pts, edge, hole) => {
      g.poly(pts, K.steel);
      g.line(edge[0], edge[1], edge[2], edge[3], K.steelHi, 0);
      if (hole) g.set(hole[0], hole[1], K.slit);
      g.set(pts[1][0] - 1, pts[1][1] + 1, K.rust); g.set(pts[1][0] - 2, pts[1][1] + 2, K.rust);
    };
    if (pose === 'windup') {
      // cutelo erguido por trás do capuz
      armFn(22, U(20), 15, U(10), 11, U(3));
      g.line(11, U(3), 8, U(-1), K.handle, 1);
      bladeFn([[8, U(-1)], [2, U(-6)], [6, U(-10)], [12, U(-4)]], [2, U(-6), 6, U(-10)], [6, U(-5)]);
    }
    // capuz + máscara de chapa rebitada
    g.ellipse(17, U(12), 6.5, 7, K.hood);
    g.set(11, U(15), K.hood); g.set(10, U(17), K.hood); g.set(12, U(18), K.hood);
    g.line(12, U(8), 13, U(16), K.hoodHi, 0);
    g.poly([[16, U(6)], [22, U(6)], [24, U(9)], [24, U(15)], [21, U(18)], [17, U(18)], [16, U(15)]], K.mask);
    g.line(16, U(7), 16, U(15), K.maskHi, 0);
    g.line(23, U(10), 23, U(15), K.maskLo, 0);
    [[17, 7], [22, 7], [17, 16], [22, 16]].forEach(([x, y]) => g.set(x, U(y), K.rivet));
    g.line(17, U(11), 23, U(11), K.slit, 0);
    g.set(19, U(11), K.eye); g.set(22, U(11), K.eyeDim);
    g.set(20, U(7), K.maskHi); g.set(20, U(8), K.maskHi); g.set(21, U(9), K.maskLo);
    g.set(20, U(13), K.maskLo); g.set(21, U(14), K.maskLo); g.set(20, U(15), K.maskLo);
    g.line(18, U(14), 19, U(14), K.slit, 0); g.line(18, U(16), 19, U(16), K.slit, 0);
    [[23, 12], [17, 13], [22, 9], [18, 9], [22, 15], [21, 17]].forEach(([x, y]) => g.set(x, U(y), K.rustSpot));

    // braço da frente + cutelo
    const arm = armFn, blade = bladeFn;
    if (pose === 'windup') {
      g.line(23, U(19), 22, U(15), K.shirt, 1.2);   // ombro erguido aparece na frente do capuz
    } else if (pose === 'chop') {
      arm(22, U(20), 28, U(23), 33, U(24));
      g.line(33, U(24), 37, U(24), K.handle, 1);
      blade([[37, U(21)], [46, U(21)], [46, U(27)], [37, U(28)]], [46, U(21), 46, U(27)], [39, U(23)]);
    } else if (pose === 'follow') {
      arm(22, U(20), 26, U(27), 29, U(30));
      g.line(29, U(30), 32, U(32), K.handle, 1);
      blade([[32, U(30)], [38, U(34)], [35, U(39)], [29, U(35)]], [38, U(34), 35, U(39)], [32, U(33)]);
    } else {
      arm(22, U(20), 24, U(28), 24, U(34));
      g.line(24, U(34), 24, U(37), K.handle, 1);
      blade([[22, U(37)], [27, U(37)], [27, U(46)], [22, U(44)]], [22, U(38), 22, U(44)], [26, U(39)]);
    }
  }
  let slasherFrames = null;
  function buildSlasher() {
    if (slasherFrames) return;
    slasherFrames = {};
    [['idleA', 'idle', 0, 0], ['idleB', 'idle', -1, 0], ['walkA', 'idle', 0, 1], ['walkB', 'idle', -1, 2],
      ['windup', 'windup', -1, 0], ['chop', 'chop', 0, 0], ['follow', 'follow', 1, 0]].forEach(([name, pose, b, walk]) => {
      const g = new Grid(KW, KH, 0, KOY);
      drawSlasher(g, pose, b, walk);
      g.outline(OUTLINE);
      slasherFrames[name] = g.toCanvas();
    });
  }

  /* ======================================================================
   * Corvo, fantasma e bruxa
   * ==================================================================== */
  const CR = { body: '#0e0b13', hi: '#2f2840', beak: '#3c3842', leg: '#4a4650', eye: '#ffd84a' };
  const CRW = 20, CRH = 14, CR_FEET = 13, CR_CX = 9;
  const CROW_PERCH = { rip: 27, cross: 24, tall: 15 };
  let crowFrames = null;
  function buildCrow() {
    if (crowFrames) return;
    crowFrames = {};
    const sitBase = g => {
      g.poly([[5, 9], [1, 11], [2, 12], [6, 11]], CR.body);
      g.ellipse(9, 9, 4, 3, CR.body);
      g.line(6, 8, 11, 9, CR.hi, 0);
      [[8, 12], [8, 13], [10, 12], [10, 13], [11, 13], [7, 13]].forEach(([x, y]) => g.set(x, y, CR.leg));
    };
    const defs = {
      sit: g => { sitBase(g); g.ellipse(13, 5, 2.5, 2.2, CR.body); g.line(15, 5, 17, 6, CR.beak, 0); g.set(13, 4, CR.eye); },
      blink: g => { sitBase(g); g.ellipse(13, 5, 2.5, 2.2, CR.body); g.line(15, 5, 17, 6, CR.beak, 0); },
      up: g => { sitBase(g); g.ellipse(13, 4, 2.5, 2.2, CR.body); g.line(15, 3, 17, 2, CR.beak, 0); g.set(13, 3, CR.eye); },
      caw: g => { sitBase(g); g.ellipse(13, 5, 2.5, 2.2, CR.body); g.line(15, 4, 17, 2, CR.beak, 0); g.line(15, 6, 17, 7, CR.beak, 0); g.set(13, 4, CR.eye); },
      fly1: g => {
        g.poly([[6, 8], [1, 9], [2, 10], [6, 10]], CR.body); g.ellipse(10, 8, 4, 2.4, CR.body);
        g.ellipse(14, 7, 2.2, 2, CR.body); g.line(16, 7, 18, 8, CR.beak, 0); g.set(14, 6, CR.eye);
        g.poly([[8, 7], [12, 7], [8, 0], [4, 1]], CR.body); g.line(8, 6, 6, 1, CR.hi, 0);
      },
      fly2: g => {
        g.poly([[6, 8], [1, 9], [2, 10], [6, 10]], CR.body); g.ellipse(10, 8, 4, 2.4, CR.body);
        g.ellipse(14, 7, 2.2, 2, CR.body); g.line(16, 7, 18, 8, CR.beak, 0); g.set(14, 6, CR.eye);
        g.poly([[8, 9], [12, 9], [9, 13], [5, 12]], CR.body); g.line(9, 10, 7, 12, CR.hi, 0);
      }
    };
    for (const k in defs) { const g = new Grid(CRW, CRH); defs[k](g); g.outline(OUTLINE); crowFrames[k] = g.toCanvas(); }
  }

  const GHW = 28, GHH = 31;
  let ghostFrames = null, booCanvas = null;
  function buildGhost() {
    if (ghostFrames) return;
    const G = { a: '#efeaff', b: '#c9bff0', eye: '#1b1430', mouth: '#2a1f45', ol: '#5b4c94' };
    ghostFrames = {};
    ['idleA', 'idleB', 'boo'].forEach(name => {
      const g = new Grid(GHW, GHH), ph = name === 'idleB' ? 3 : 0, boo = name === 'boo';
      if (boo) { g.line(5, 15, 1, 8, G.a, 1); g.line(22, 15, 26, 8, G.a, 1); }
      else { g.rect(3, 16, 4, 18, G.a); g.rect(23, 16, 24, 18, G.a); }
      g.ellipse(14, 11, 9, 9, G.a);
      g.rect(5, 11, 23, 24, G.a);
      for (let x = 5; x <= 23; x++) if ((x + ph) % 6 < 3) g.rect(x, 25, x, 26, G.a);
      g.line(21, 7, 22, 25, G.b, 0.6);
      g.set(9, 5, '#ffffff'); g.set(10, 4, '#ffffff');
      if (boo) { g.rect(8, 9, 11, 13, G.eye); g.rect(17, 9, 20, 13, G.eye); g.ellipse(14, 18.5, 3, 3.5, G.mouth); }
      else { g.rect(9, 10, 10, 13, G.eye); g.rect(17, 10, 18, 13, G.eye); g.ellipse(14, 17, 1.2, 1.6, G.mouth); }
      g.outline(G.ol);
      ghostFrames[name] = g.toCanvas();
    });
    const t = new Grid(14, 7);
    glyph(t, 'B', 1, 1, '#fff6d0'); glyph(t, 'U', 5, 1, '#fff6d0'); glyph(t, '!', 9, 1, '#fff6d0');
    t.d = t.d.map(v => v && '#fff6d0'); t.outline('#2a1f45');
    booCanvas = t.toCanvas();
  }

  const WW = 46, WH = 36, WOY = 12;
  const WITCH_STRAW = { x: 2, y: 17 };
  let witchFrames = null;
  function buildWitch() {
    if (witchFrames) return;
    const C2 = { cloak: '#140c1e', hi: '#2a1c3a', skin: '#5f8a4c', hair: '#d2602a', hat: '#1a0f28', band: '#7a3cc0',
      stick: '#3a2616', straw: '#7a5a2a', strawLo: '#4e3818', boot: '#0b0810', eye: '#ffd84a' };
    witchFrames = [0, 1].map(f => {
      const g = new Grid(WW, WH, 0, WOY), w = f ? 1 : -1;
      // vassoura
      g.line(4, 16, 42, 12, C2.stick, 0); g.line(4, 17, 42, 13, C2.stick, 0);
      g.poly([[0, 12 + w], [8, 14], [8, 19], [0, 22 - w]], C2.straw);
      g.line(1, 14, 7, 15, C2.strawLo, 0); g.line(1, 19, 7, 17, C2.strawLo, 0);
      g.line(8, 14, 8, 19, '#2a1a10', 0);
      // capa esvoaçando
      g.poly([[18, 4], [10, 3 + w], [4, 6 - w], [9, 9], [17, 11]], C2.cloak);
      g.line(17, 5, 9, 5 + w, C2.hi, 0);
      // corpo, perna, braço
      g.poly([[17, 4], [24, 4], [27, 12], [26, 15], [16, 15]], C2.cloak);
      g.line(18, 5, 17, 14, C2.hi, 0);
      g.line(24, 14, 29, 16, C2.cloak, 1); g.set(30, 16, C2.boot); g.set(31, 16, C2.boot); g.set(31, 15, C2.boot);
      g.line(23, 7, 28, 12, C2.cloak, 1); g.set(29, 12, C2.skin); g.set(29, 13, C2.skin);
      // cabeça, cabelo
      g.line(21, 1, 16, 6 + w, C2.hair, 1); g.line(21, 3, 17, 8 - w, C2.hair, 0.8);
      g.ellipse(23, 1, 2.6, 2.6, C2.skin);
      g.set(26, 1, C2.skin); g.set(27, 2, C2.skin); g.set(25, 3, C2.skin); g.set(24, 0, C2.eye);
      // chapéu
      g.line(17, -2, 29, -2, C2.hat, 0); g.line(18, -1, 28, -1, C2.hat, 0);
      g.poly([[19, -2], [27, -2], [24, -8], [18, -12]], C2.hat);
      g.line(20, -3, 26, -3, C2.band, 0);
      g.outline(OUTLINE);
      return g.toCanvas();
    });
  }

  /* ======================================================================
   * Cenário de fundo: cemitério contínuo + mausoléu no centro
   * (renderizado uma vez por redimensionamento; só as janelas são animadas)
   * ==================================================================== */
  const BD = {
    hill: '#120b1c', backStone: '#221b2e', backHi: '#2d2540', tree: '#1a1124',
    fence: '#1b1526', fenceHi: '#352c45',
    stone: '#3b3549', stoneHi: '#544c68', stoneLo: '#28233a', inner: '#2f293d', col: '#4a4360',
    door: '#0a0610', plank: '#191120', band: '#2a2236', knob: '#8a7040',
    win: '#ff9a3c', winHi: '#ffd27a', bar: '#2a1a10', ivy: '#2b4a2c', ivy2: '#3c6234', web: '#6d6680'
  };
  const BH = 112, B_GROUND = BH - 11;   // linha do chão no grid do cenário (= linha do chão dos túmulos)

  function prng(seed) { let x = seed | 0 || 1; return () => ((x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff); }

  function drawTree(g, x, base, h, dir, rnd) {
    g.line(x, base, x + dir * 2, base - h * 0.55, BD.tree, 2);
    const br = (x0, y0, ang, len, d) => {
      const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
      g.line(x0, y0, x1, y1, BD.tree, Math.max(0, d * 0.45));
      if (d <= 0) return;
      br(x1, y1, ang - 0.45 - rnd() * 0.35, len * (0.62 + rnd() * 0.15), d - 1);
      br(x1, y1, ang + 0.4 + rnd() * 0.35, len * (0.6 + rnd() * 0.15), d - 1);
    };
    const tx = x + dir * 2, ty = base - h * 0.55;
    br(tx, ty, -Math.PI / 2 - 0.15 * dir, h * 0.3, 4);
    br(tx, ty + 6, -Math.PI / 2 + 0.9 * dir, h * 0.22, 3);
    br(tx, ty + 10, -Math.PI / 2 - 1.0 * dir, h * 0.18, 2);
  }

  // mausoléu desenhado num grid próprio (com contorno) e colado no cenário
  function drawMausoleum() {
    const m = new Grid(96, 96), cx = 48, B = 94;
    const C = BD;
    m.rect(cx - 44, B - 3, cx + 43, B - 1, C.stoneLo); m.line(cx - 44, B - 3, cx + 43, B - 3, C.stone, 0);
    m.rect(cx - 40, B - 6, cx + 39, B - 4, C.stone); m.line(cx - 40, B - 6, cx + 39, B - 6, C.stoneHi, 0);
    m.rect(cx - 36, B - 50, cx + 35, B - 7, C.stone);
    m.line(cx - 36, B - 49, cx - 36, B - 7, C.stoneHi, 0);
    m.rect(cx + 34, B - 49, cx + 35, B - 7, C.stoneLo);
    // colunas
    [-34, -24, 23, 33].forEach(o => {
      const x = cx + o;
      m.rect(x - 1, B - 48, x + 2, B - 8, C.col); m.line(x + 2, B - 48, x + 2, B - 8, C.stoneLo, 0); m.line(x - 1, B - 48, x - 1, B - 8, C.stoneHi, 0);
      m.rect(x - 2, B - 50, x + 3, B - 48, C.stoneHi); m.rect(x - 2, B - 9, x + 3, B - 7, C.stoneHi);
    });
    // entablamento + inscrição
    m.rect(cx - 39, B - 55, cx + 38, B - 50, C.stone); m.line(cx - 39, B - 55, cx + 38, B - 55, C.stoneHi, 0);
    glyph(m, 'R', cx - 6, B - 55 + 0, C.stoneLo); glyph(m, 'I', cx - 2, B - 55, C.stoneLo); glyph(m, 'P', cx + 2, B - 55, C.stoneLo);
    // frontão
    m.poly([[cx - 41, B - 55], [cx + 41, B - 55], [cx, B - 76]], C.stone);
    m.poly([[cx - 32, B - 57], [cx + 32, B - 57], [cx, B - 72]], C.inner);
    m.line(cx - 41, B - 55, cx, B - 76, C.stoneHi, 0);
    m.ellipse(cx, B - 63, 4, 4, C.win); m.line(cx, B - 67, cx, B - 59, C.bar, 0); m.line(cx - 4, B - 63, cx + 4, B - 63, C.bar, 0);
    // cruz
    m.rect(cx - 1, B - 92, cx + 1, B - 76, C.stone); m.rect(cx - 6, B - 88, cx + 5, B - 86, C.stone);
    m.line(cx - 1, B - 92, cx - 1, B - 77, C.stoneHi, 0);
    // porta em arco
    m.ellipse(cx, B - 30, 9, 6, C.door); m.rect(cx - 9, B - 30, cx + 8, B - 7, C.door);
    [cx - 4, cx, cx + 4].forEach(x => m.line(x, B - 32, x, B - 8, C.plank, 0));
    m.line(cx - 9, B - 25, cx + 8, B - 25, C.band, 0); m.line(cx - 9, B - 14, cx + 8, B - 14, C.band, 0);
    m.set(cx + 5, B - 19, C.knob);
    m.line(cx - 10, B - 30, cx - 10, B - 7, C.stoneHi, 0);
    // janelas em arco (vitrais)
    [-16, 16].forEach(o => {
      const x = cx + o;
      m.ellipse(x, B - 40, 3.4, 3.4, C.win); m.rect(x - 3, B - 40, x + 3, B - 26, C.win);
      m.line(x, B - 43, x, B - 26, C.bar, 0); m.line(x - 3, B - 34, x + 3, B - 34, C.bar, 0);
      m.set(x - 2, B - 39, C.winHi); m.set(x - 2, B - 38, C.winHi);
      m.line(x - 4, B - 25, x + 4, B - 25, C.stoneHi, 0);
    });
    // rachaduras, hera, teia
    m.line(cx + 26, B - 49, cx + 29, B - 40, C.stoneLo, 0); m.line(cx + 29, B - 40, cx + 27, B - 33, C.stoneLo, 0);
    m.line(cx - 30, B - 20, cx - 27, B - 14, C.stoneLo, 0);
    const r = prng(7);
    for (let i = 0; i < 40; i++) {
      const y = B - 6 - Math.floor(r() * 46), x = cx - 37 + Math.floor(r() * 6 + (B - y) * 0.08);
      m.set(x, y, r() < 0.5 ? C.ivy : C.ivy2);
    }
    for (let i = 0; i < 18; i++) m.set(cx + 30 + Math.floor(r() * 7), B - 8 - Math.floor(r() * 14), r() < 0.5 ? C.ivy : C.ivy2);
    m.line(cx + 8, B - 33, cx + 4, B - 33, C.web, 0); m.line(cx + 8, B - 33, cx + 8, B - 29, C.web, 0); m.line(cx + 8, B - 33, cx + 5, B - 30, C.web, 0);
    m.outline(OUTLINE);
    return { m, cx, B,
      windows: [-16, 16].map(o => ({ x0: cx + o - 3, x1: cx + o + 3, y0: B - 43, y1: B - 26 })).concat([{ x0: cx - 4, x1: cx + 4, y0: B - 67, y1: B - 59, round: true }]),
      doorX: cx + 8, doorY0: B - 34, doorY1: B - 8 };
  }

  function buildBackdrop(W, s) {
    const GWd = Math.ceil(W / s) + 2, g = new Grid(GWd, BH), G = B_GROUND, rnd = prng(GWd);
    // colinas distantes
    for (let x = 0; x < GWd; x++) {
      const h = Math.round(7 + 4 * Math.sin(x / 37) + 3 * Math.sin(x / 13 + 1));
      g.rect(x, G - h, x, G - 1, BD.hill);
    }
    // lápides distantes
    for (let x = 4; x < GWd; x += 10 + Math.floor(rnd() * 22)) {
      const kind = rnd(), y = G - 1;
      if (kind < 0.55) { g.rect(x, y - 5, x + 3, y, BD.backStone); g.rect(x + 1, y - 6, x + 2, y - 6, BD.backStone); g.set(x, y - 5, BD.backHi); }
      else if (kind < 0.85) { g.rect(x + 1, y - 7, x + 1, y, BD.backStone); g.rect(x, y - 5, x + 2, y - 5, BD.backStone); }
      else { g.rect(x, y - 9, x + 2, y, BD.backStone); g.set(x + 1, y - 10, BD.backStone); }
    }
    // árvores secas (nas margens, entre os túmulos e o conteúdo)
    const t1 = Math.round(GWd * 0.17), t2 = Math.round(GWd * 0.83);
    drawTree(g, t1, G - 1, 64, 1, prng(11));
    drawTree(g, t2, G - 1, 58, -1, prng(23));
    // mausoléu no centro
    const M = drawMausoleum(), mx = Math.round(GWd / 2) - M.cx, my = G - 1 - M.B;
    // cerca de ferro (com portão aberto na frente do mausoléu)
    const gate0 = mx + M.cx - 50, gate1 = mx + M.cx + 49;
    g.line(0, G - 15, gate0, G - 15, BD.fence, 0); g.line(gate1, G - 15, GWd, G - 15, BD.fence, 0);
    g.line(0, G - 6, gate0, G - 6, BD.fence, 0); g.line(gate1, G - 6, GWd, G - 6, BD.fence, 0);
    for (let x = 2; x < GWd; x += 6) {
      if (x > gate0 - 2 && x < gate1 + 2) continue;
      if (rnd() < 0.08) continue;                     // grade faltando
      const bend = rnd() < 0.12 ? (rnd() < 0.5 ? -1 : 1) : 0;
      g.line(x, G - 1, x + bend, G - 17, BD.fence, 0);
      g.set(x + bend, G - 18, BD.fenceHi); g.set(x + bend - 1, G - 17, BD.fence); g.set(x + bend + 1, G - 17, BD.fence);
    }
    [gate0, gate1].forEach(x => {
      g.rect(x - 2, G - 22, x + 2, G - 1, BD.stone); g.line(x - 2, G - 22, x - 2, G - 1, BD.stoneHi, 0);
      g.ellipse(x, G - 24, 2.5, 2.5, BD.stoneHi);
    });
    // cola o mausoléu
    for (let y = 0; y < M.m.h; y++) for (let x = 0; x < M.m.w; x++) {
      const v = M.m.d[y * M.m.w + x]; if (v) g.set(mx + x, my + y, v);
    }
    // chão contínuo
    for (let y = G; y < BH; y++) for (let x = 0; x < GWd; x++) {
      const n = (x * 31 + y * 17 + 5) % 11;
      g.set(x, y, n === 0 ? Z.soil3 : n < 3 ? Z.soil2 : Z.soil);
    }
    for (let x = 1; x < GWd; x += 3 + Math.floor(rnd() * 6)) { g.set(x, G - 1, Z.grass); g.set(x + 1, G - 2, Z.grass2); }
    const off = v => ({ x0: mx + v.x0, x1: mx + v.x1, y0: my + v.y0, y1: my + v.y1, round: v.round });
    return { canvas: g.toCanvas(), windows: M.windows.map(off), door: { x: mx + M.doorX, y0: my + M.doorY0, y1: my + M.doorY1 } };
  }

  /* ======================================================================
   * Abóbora pixel (enfeite dos túmulos)
   * ==================================================================== */
  let pumpkinFrames = null;
  function buildPumpkins() {
    if (pumpkinFrames) return;
    pumpkinFrames = [0, 1].map(v => {
      const g = new Grid(18, 16);
      const cx = 9, cy = 9;
      g.ellipse(cx, cy, 8, 6, H.pumpLo);
      g.ellipse(cx, cy, 6.8, 5.6, H.pump);
      g.ellipse(cx, cy, 2.6, 5.6, H.pump);
      g.line(cx - 3, cy - 5, cx - 4, cy + 4, H.pumpLo, 0);
      g.line(cx + 3, cy - 5, cx + 4, cy + 4, H.pumpLo, 0);
      g.set(cx - 5, cy - 3, H.pumpHi); g.set(cx - 6, cy - 2, H.pumpHi);
      g.rect(cx, cy - 8, cx + 1, cy - 6, H.stem); g.set(cx + 2, cy - 8, H.stem);
      const fc = v ? H.face2 : H.face;
      [[-4, -1], [-3, -1], [-3, -2], [3, -2], [3, -1], [4, -1], [0, 0],
        [-5, 2], [-4, 2], [-3, 3], [-2, 2], [-1, 3], [0, 2], [1, 3], [2, 2], [3, 3], [4, 2], [5, 2]]
        .forEach(([x, y]) => g.set(cx + x, cy + y, fc));
      g.set(cx - 3, cy - 1, H.faceIn); g.set(cx + 3, cy - 1, H.faceIn);
      g.outline(OUTLINE);
      return g.toCanvas();
    });
  }

  /* ======================================================================
   * Cena (canvas fixo no fundo)
   * ==================================================================== */
  const Scene = {
    canvas: null, ctx: null, W: 0, H: 0, dpr: 1, s: 3, ground: 0,
    graves: [], props: [], parts: [], rider: null, zombie: null,
    raf: 0, last: 0, idleAcc: 0, flick: 0, reduced: false, timers: [],

    mount(layer) {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'hw-scene';
      layer.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.reduced = !!(global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      buildRider(); buildPumpkins(); buildReaper(); buildSlasher(); buildCrow(); buildGhost(); buildWitch();
      // canvas da frente (fantasma passa por cima do conteúdo, sem bloquear cliques)
      this.front = document.createElement('canvas');
      this.front.className = 'hw-front';
      this.front.setAttribute('aria-hidden', 'true');
      this.front.style.cssText = 'position:fixed;inset:0;z-index:30;pointer-events:none;image-rendering:pixelated';
      document.body.appendChild(this.front);
      this.fctx = this.front.getContext('2d');
      this.mx = this.my = -9999;
      this.onMove = e => { this.mx = e.clientX; this.my = e.clientY; };
      addEventListener('pointermove', this.onMove, { passive: true });
      this.onResize = () => this.resize();
      this.onScroll = () => { this.coverDirty = true; };
      addEventListener('scroll', this.onScroll, { passive: true, capture: true });
      this.onVis = () => { if (!document.hidden) this.kick(); };
      addEventListener('resize', this.onResize);
      document.addEventListener('visibilitychange', this.onVis);
      this.resize();
    },
    unmount() {
      cancelAnimationFrame(this.raf); this.raf = 0;
      removeEventListener('resize', this.onResize);
      removeEventListener('scroll', this.onScroll, { capture: true });
      document.removeEventListener('visibilitychange', this.onVis);
      removeEventListener('pointermove', this.onMove);
      if (this.front) this.front.remove();
      this.front = null; this.crow = this.ghost = this.witch = null;
      this.timers.forEach(t => { clearTimeout(t); clearInterval(t); }); this.timers = [];
      this.rider = this.zombie = null; this.parts = [];
      if (this.canvas) this.canvas.remove();
      this.canvas = null;
    },
    resize() {
      const W = innerWidth, Hh = innerHeight, dpr = Math.min(2, global.devicePixelRatio || 1);
      this.W = W; this.H = Hh; this.dpr = dpr;
      this.s = clamp(Math.floor(Hh / 320), 2, 4);
      this.ground = Hh - Math.round(this.s * 3);
      this.surface = this.ground - (GH - GY) * this.s;   // linha da grama (onde tudo pisa)
      this.canvas.width = Math.round(W * dpr); this.canvas.height = Math.round(Hh * dpr);
      this.canvas.style.width = W + 'px'; this.canvas.style.height = Hh + 'px';
      this.front.width = this.canvas.width; this.front.height = this.canvas.height;
      this.front.style.width = W + 'px'; this.front.style.height = Hh + 'px';
      this.layout();
      this.kick();
    },
    layout() {
      this.backdrop = buildBackdrop(this.W, this.s);
      this.backdropTop = this.H - BH * this.s;
      this.coverDirty = true;
      const s = this.s, gw = GW * s, W = this.W;
      const perSide = W >= 1700 ? 2 : W >= 900 ? 1 : 0;
      const types = ['rip', 'cross', 'tall'];
      const old = this.graves;
      this.graves = [];
      this.props = [];
      for (let side = 0; side < 2; side++) for (let i = 0; i < perSide; i++) {
        const x = Math.round((side === 0 ? 4 + i * (gw * 0.82) : W - gw - 4 - i * (gw * 0.82)) / s) * s;   // alinhado à grade do cenário
        const k = side * 2 + i;
        const prev = old[k];
        const gr = { x, type: prev ? prev.type : types[(k + (side ? 1 : 0)) % 3], seed: prev ? prev.seed : 3 + k * 7, canvas: document.createElement('canvas') };
        renderGrave(gr, null, 0);
        this.graves.push(gr);
      }
      if (perSide) {
        const pw = 18 * s;
        this.props.push({ x: this.graves[0].x + gw * (perSide === 2 ? 1.62 : 0.86), ph: 0 });
        this.props.push({ x: this.graves[perSide].x - pw * 0.55 - (perSide === 2 ? gw * 0.82 : 0), ph: 1 });
      }
      if (this.zombie && !this.graves.includes(this.zombie.grave)) this.zombie = null;
      // corvo pousado num túmulo (prefere a lápide arredondada)
      if (!this.graves.length) this.crow = null;
      else {
        let gi = this.graves.findIndex(g => g.type === 'rip');
        if (gi < 0) gi = 0;
        if (!this.crow || this.crow.gi >= this.graves.length) this.crow = { gi, state: 'sit', face: 1, nextCaw: 0, cawUntil: 0, blinkUntil: 0, t: 0 };
        else this.crow.gi = gi;
        if (this.crow.state === 'sit') Object.assign(this.crow, this.perch());
      }
    },

    kick() { if (!this.raf && this.canvas) { this.last = performance.now(); this.raf = requestAnimationFrame(t => this.loop(t)); } },
    loop(now) {
      this.raf = 0;
      if (!this.canvas || document.hidden) return;
      const dt = Math.min(50, now - this.last); this.last = now;
      const active = this.rider || this.zombie || this.parts.length || this.ghost || this.witch ||
        (this.crow && this.crow.state !== 'sit' && this.crow.state !== 'gone');
      this.idleAcc += dt;
      if (active || this.idleAcc > 120) {
        if (this.idleAcc > 120) { this.idleAcc = 0; this.flick = Math.random() < 0.35 ? 1 : 0; }
        this.update(dt, now);
        this.draw(now);
        this.drawFront();
      }
      if (!this.reduced || active) this.raf = requestAnimationFrame(t => this.loop(t));
    },

    /* ---------- atores ---------- */
    ride(kind) {
      if (!this.canvas || this.rider) return;
      if (this.zombie && this.zombie.variant === 'horse' && !this.zombie.phase) return;   // a vez é do cavaleiro de espada
      const o = FX.opts || {};
      if (kind === 'sword' || (kind !== 'pumpkin' && !this.zombie && this.graves.length && Math.random() < (o.swordChance != null ? o.swordChance : 0.35))) {
        // o cavaleiro vem de espada: primeiro um zumbi levanta, depois ele chega para buscar a cabeça
        if (!this.zombie && this.graves.length) { this.rise(null, 'horse'); return; }
        if (kind === 'sword') return;
      }
      const dir = Math.random() < 0.5 ? 1 : -1, sw = RW * this.s;
      const secs = clamp(this.W / 230, 6, 11);
      this.rider = { dir, x: dir > 0 ? -sw : this.W, speed: (this.W + sw) / (secs * 1000), t: 0, f: 0, mode: 'pumpkin' };
      this.kick();
    },
    busy() { return !!(this.rider || this.zombie || this.ghost || this.witch); },
    perch() {
      const s = this.s, gr = this.graves[this.crow.gi];
      return { x: gr.x + GCX * s, y: this.ground - GH * s + (CROW_PERCH[gr.type] || 27) * s };
    },
    scareCrow(fromX) {
      const cr = this.crow;
      if (!cr || cr.state !== 'sit') return;
      cr.state = 'fly'; cr.t = 0;
      const away = fromX == null ? (cr.x < this.W / 2 ? -1 : 1) : (cr.x >= fromX ? 1 : -1);
      cr.face = away; cr.vx = away * 0.11 * this.s; cr.vy = -0.07 * this.s;
      this.kick();
    },
    ghostPass() {
      if (!this.front || this.ghost) return;
      const dir = Math.random() < 0.5 ? 1 : -1, size = GHW * this.s * 1.3;
      this.ghost = { dir, x: dir > 0 ? -size : this.W + size, baseY: this.H * rand(0.22, 0.62), t: 0,
        speed: (this.W + size * 2) / 15000, booT: -1, flee: 0, size };
      this.kick();
    },
    witchPass() {
      if (this.witch) return;
      const moon = this.canvas && this.canvas.parentElement && this.canvas.parentElement.querySelector('.hw-moon');
      const r = moon && moon.getBoundingClientRect();
      const my = r && r.height ? r.top + r.height / 2 : this.H * 0.14;
      const dir = Math.random() < 0.5 ? 1 : -1, ww = WW * this.s;
      this.witch = { dir, x: dir > 0 ? -ww : this.W + ww, y: my - (WOY + 6) * this.s, t: 0, speed: (this.W + ww * 2) / 8000 };
      this.kick();
    },
    // cavaleiro de espada sincronizado para passar no pescoço do zumbi em HORSE_HIT
    spawnSwordRider(z) {
      const s = this.s, dir = -z.side, gc = z.grave.x + GCX * s;
      const targetX = dir > 0 ? gc - SWORD_TIP * s : gc - (RW - SWORD_TIP) * s;
      const x0 = dir > 0 ? -RW * s : this.W;
      const dur = (HORSE_HIT - z.t) * 1000;
      this.rider = { dir, x: x0, speed: Math.abs(targetX - x0) / dur, t: 0, f: 0, mode: 'swordUp', sword: true, z };
    },
    rise(index, variant) {
      if (!this.canvas || this.zombie || !this.graves.length) return;
      const gr = this.graves[index != null ? index % this.graves.length : Math.floor(Math.random() * this.graves.length)];
      const o = FX.opts || {};
      if (!['classic', 'decap', 'horse'].includes(variant)) {
        const r = Math.random(), hc = o.horseChance != null ? o.horseChance : 0.25, dc = o.decapChance || 0;
        variant = r < hc ? 'horse' : r < hc + dc ? 'decap' : 'classic';
      }
      if (variant === 'horse' && this.rider) variant = 'classic';   // não interrompe um cavaleiro que já está passando
      const side = gr.x + GW * this.s / 2 < this.W / 2 ? 1 : -1;   // o Ceifador vem do lado de dentro da tela
      const pick = FX.opts ? FX.opts.killer : 'slasher';
      const killer = pick === 'random' ? (Math.random() < 0.5 ? 'slasher' : 'reaper') : (pick || 'slasher');
      this.zombie = { grave: gr, t: 0, lastQ: -1, fired: {}, variant, side, killer };
      this.kick();
    },

    update(dt) {
      const s = this.s;
      this.updateExtras(dt);
      // cavaleiro
      const r = this.rider;
      if (r) {
        r.t += dt; r.x += r.dir * r.speed * dt;
        r.f = Math.floor(r.t / 75) % R_FRAMES;
        if (r.sword) {
          const zt = r.z && this.zombie === r.z ? r.z.t : Infinity;
          r.mode = zt < HORSE_HIT - 0.3 ? 'swordUp' : zt < HORSE_HIT + 0.15 ? 'swordSwing' : 'carry';
        }
        const sw = RW * s, top = this.surface - (R_FEET + ROY + 1) * s;
        const pp = r.mode === 'pumpkin' ? PUMP : NECK;
        const lx = r.dir > 0 ? pp.x : RW - pp.x;
        const px = r.x + lx * s, py = top + (ROY + pp.y - 3 + riderBob[r.f]) * s;
        if (r.mode === 'carry' && Math.random() < 0.25) {
          const hx = r.x + (r.dir > 0 ? 33 : RW - 33) * s;
          this.blood(hx, top + (ROY + 8 + riderBob[r.f]) * s, 1, 0);
        }
        r.px = px; r.py = py;
        for (let i = 0; i < 9; i++) {
          const spread = rand(-5, 5);
          this.parts.push({
            k: 'fire', x: px + spread * s, y: py + (rand(0, 4) + Math.abs(spread) * 0.5) * s,
            vx: r.dir * r.speed * rand(0.55, 0.85) + rand(-0.015, 0.015) * s, vy: -rand(0.03, 0.075) * s,
            life: 0, max: rand(220, 560), size: Math.random() < 0.45 ? 2 : 1
          });
        }
        if (Math.random() < 0.15) this.parts.push({ k: 'ember', x: px + rand(-3, 3) * s, y: py, vx: rand(-0.03, 0.03) * s, vy: -rand(0.02, 0.05) * s, life: 0, max: rand(900, 1600), size: 1 });
        if ((r.f === 1 || r.f === 5) && Math.random() < 0.6) {
          const hx = r.x + (r.dir > 0 ? rand(30, 62) : RW - rand(30, 62)) * s;
          this.parts.push({ k: 'dust', x: hx, y: this.surface - s, vx: -r.dir * rand(0.01, 0.05) * s, vy: -rand(0.005, 0.02) * s, life: 0, max: rand(400, 800), size: 2 });
        }
        if ((r.dir > 0 && r.x > this.W) || (r.dir < 0 && r.x < -sw)) this.rider = null;
      }
      // zumbi
      const z = this.zombie;
      if (z) {
        z.t += dt / 1000;
        const tq = Math.floor(z.t * 12) / 12;
        if (tq !== z.lastQ && !z.phase) {
          z.lastQ = tq;
          z.P = zombiePose(tq, z);
          renderGrave(z.grave, z.P, tq);
        }
        const gx = z.grave.x + GCX * s, gy = this.ground - (GH - GY) * s;
        const once = (key, at, fn) => { if (!z.fired[key] && z.t >= at) { z.fired[key] = 1; fn(); } };
        if (z.t < 0.9 && Math.random() < 0.25) this.dirt(gx, gy, 1);
        once('pop', 0.95, () => this.dirt(gx + 4 * s, gy, 14));
        once('pop2', 2.05, () => this.dirt(gx - 6 * s, gy, 8));
        once('out', 4.5, () => this.dirt(gx, gy, 10));
        const decap = z.variant === 'decap';
        if (z.variant === 'horse') { this.updateHorseZombie(z, dt, gx, gy, once); return this.updateParts(dt); }
        once('fall', decap ? 11.15 : 9.15, () => { this.dirt(gx, gy, 16); this.puff(gx, gy); });
        if (z.t > 2.8 && z.t < 4.4 && Math.random() < 0.08) this.dirt(gx, gy, 2);
        if (decap) {
          const neckY = gy - 31 * s, dir = -z.side;
          once('cut', 6.5, () => this.blood(gx, neckY, 18, dir));
          if (z.t > 6.5 && z.t < 7.6 && Math.random() < 0.3) this.blood(gx, neckY, 1, 0);
          once('land', 7.1, () => this.dirt(gx + dir * 14 * s, gy, 8));
          once('grab', 8.9, () => this.dirt(gx + dir * 14 * s, gy, 4));
          z.reaper = z.killer === 'reaper' ? this.reaperState(z, gx) : this.slasherState(z, gx);
        }
        if (z.t >= (decap ? ZT.durDecap : ZT.dur)) { renderGrave(z.grave, null, 0); this.zombie = null; }
      }
      this.updateParts(dt);
    },
    updateExtras(dt) {
      const s = this.s, now = performance.now();
      // vulto passando numa janela do mausoléu
      if (!this.shade && this.backdrop && Math.random() < dt / 30000) this.shade = { wi: Math.random() < 0.5 ? 0 : 1, t: 0, dir: Math.random() < 0.5 ? 1 : -1 };
      if (this.shade) { this.shade.t += dt; if (this.shade.t > 1600) this.shade = null; }
      this.coverAcc = (this.coverAcc || 0) + dt;
      if (this.coverAcc > 1000) { this.coverAcc = 0; this.coverDirty = true; }
      // corvo
      const cr = this.crow;
      if (cr) {
        cr.t += dt;
        if (cr.state === 'sit') {
          Object.assign(cr, this.perch());
          cr.face = this.mx < -9000 ? cr.face : (this.mx < cr.x ? -1 : 1);
          cr.look = this.my < cr.y - 220 ? 'up' : null;
          if (!cr.nextCaw) cr.nextCaw = now + rand(4000, 11000);
          if (now > cr.nextCaw) { cr.cawUntil = now + 500; cr.nextCaw = now + rand(5000, 13000); }
          if (Math.random() < dt / 3000) cr.blinkUntil = now + 130;
          const near = Math.hypot(this.mx - cr.x, this.my - (cr.y - 6 * s)) < 70;
          const z = this.zombie, r = this.rider;
          const zNear = z && z.t < 1.2 && z.t > 0.7 && Math.abs(z.grave.x + GCX * s - cr.x) < this.W / 2;
          const rNear = r && Math.abs(r.x + RW * s / 2 - cr.x) < 230;
          if (near) this.scareCrow(this.mx);
          else if (zNear) this.scareCrow(z.grave.x + GCX * s);
          else if (rNear) this.scareCrow(r.x + RW * s / 2);
        } else if (cr.state === 'fly') {
          cr.vy -= 0.00006 * s * dt; cr.x += cr.vx * dt; cr.y += cr.vy * dt;
          if (cr.x < -40 * s || cr.x > this.W + 40 * s || cr.y < -30 * s) { cr.state = 'gone'; cr.t = 0; cr.wait = rand(9000, 17000); }
        } else if (cr.state === 'gone') {
          if (cr.t > cr.wait) {
            const pp = this.perch(), from = pp.x < this.W / 2 ? -1 : 1;
            cr.state = 'return'; cr.t = 0; cr.x = from < 0 ? -20 * s : this.W + 20 * s; cr.y = pp.y - 120 * s; cr.face = -from;
          }
        } else if (cr.state === 'return') {
          const pp = this.perch(), dx = pp.x - cr.x, dy = pp.y - cr.y, d = Math.hypot(dx, dy), sp = 0.09 * s * dt;
          if (d <= sp) { cr.state = 'sit'; cr.t = 0; cr.x = pp.x; cr.y = pp.y; }
          else { cr.x += dx / d * sp; cr.y += dy / d * sp; cr.face = dx < 0 ? -1 : 1; }
        }
      }
      // fantasma
      const gh = this.ghost;
      if (gh) {
        gh.t += dt;
        const cx = gh.x, cy = gh.baseY + Math.sin(gh.t / 700) * 10 * s / 3;
        gh.cy = cy;
        if (gh.booT >= 0 && !gh.flee) { gh.booT += dt; if (gh.booT > 1100) gh.flee = 1; }
        else gh.x += gh.dir * gh.speed * (gh.flee ? 4 : 1) * dt;
        if (gh.flee) gh.flee += dt;
        if (gh.booT < 0 && cx > 0 && cx < this.W && Math.hypot(this.mx - cx, this.my - cy) < 150) gh.booT = 0;
        if (gh.x < -gh.size * 2 || gh.x > this.W + gh.size * 2 || gh.flee > 900) this.ghost = null;
      }
      // bruxa
      const wi = this.witch;
      if (wi) {
        wi.t += dt; wi.x += wi.dir * wi.speed * dt;
        wi.f = Math.floor(wi.t / 160) % 2;
        wi.yy = wi.y + Math.sin(wi.t / 420) * 5 * s;
        const sx = wi.x + (wi.dir > 0 ? WITCH_STRAW.x : WW - WITCH_STRAW.x) * s, sy = wi.yy + (WITCH_STRAW.y + WOY) * s;
        const cols = ['#b86bff', '#7dff9a', '#ffd166', '#ff8af0'];
        for (let i = 0; i < 2; i++) this.parts.push({ k: 'spark', x: sx + rand(-2, 2) * s, y: sy + rand(-3, 3) * s,
          vx: -wi.dir * rand(0.01, 0.04) * s, vy: rand(-0.005, 0.02) * s, life: 0, max: rand(450, 900), size: 1, c: cols[(Math.random() * 4) | 0] });
        const ww = WW * s;
        if ((wi.dir > 0 && wi.x > this.W + ww) || (wi.dir < 0 && wi.x < -ww * 2)) this.witch = null;
      }
    },
    updateParts(dt) {
      const s = this.s, g = 0.0011 * s;
      this.parts = this.parts.filter(p => {
        p.life += dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.k === 'dirt') p.vy += g * dt;
        if (p.k === 'fire') p.vx *= 0.985;
        return p.life < p.max && p.y < this.H + 20;
      });
    },
    dirt(x, y, n) {
      const s = this.s, cols = [Z.soil2, Z.soil3, Z.soil, '#5a3b2d'];
      for (let i = 0; i < n; i++) this.parts.push({
        k: 'dirt', x: x + rand(-6, 6) * s, y: y - s, vx: rand(-0.05, 0.05) * s, vy: -rand(0.06, 0.16) * s,
        life: 0, max: 1200, size: Math.random() < 0.3 ? 2 : 1, c: cols[i % cols.length], floor: y + s
      });
    },
    // zumbi da variante do cavaleiro: cova -> perseguição -> fora da tela -> volta -> recoloca -> cova
    updateHorseZombie(z, dt, gx, gy, once) {
      const s = this.s;
      if (z.t < 0.9 && Math.random() < 0.25) this.dirt(gx, gy, 1);
      once('pop', 0.95, () => this.dirt(gx + 4 * s, gy, 14));
      once('pop2', 2.05, () => this.dirt(gx - 6 * s, gy, 8));
      once('out', 4.5, () => this.dirt(gx, gy, 10));
      if (z.t > 2.8 && z.t < 4.4 && Math.random() < 0.08) this.dirt(gx, gy, 2);
      once('rider', 1.6, () => { if (!this.rider) this.spawnSwordRider(z); });
      const neckY = gy - 31 * s, ex = -z.side;
      once('cut', HORSE_HIT, () => this.blood(gx, neckY, 20, ex));
      if (z.t > HORSE_HIT && z.t < 7.6 && Math.random() < 0.3) this.blood(gx, neckY, 1, 0);

      if (!z.phase && z.t >= 8.4) { z.phase = 'chase'; z.pt = 0; z.ex = ex; z.wx = gx; this.dirt(gx, gy, 6); }
      if (z.phase) {
        z.pt += dt / 1000;
        const edgeOut = 26 * s;
        if (z.phase === 'chase') {
          z.wx += z.ex * 26 * s * dt / 1000;
          if (z.wx < -edgeOut || z.wx > this.W + edgeOut) { z.phase = 'away'; z.pt = 0; }
        } else if (z.phase === 'away') {
          if (z.pt > 3.2) { z.phase = 'return'; z.pt = 0; z.wdir = -z.ex; z.wx = z.ex < 0 ? -edgeOut : this.W + edgeOut; }
        } else if (z.phase === 'return') {
          z.wx += z.wdir * 16 * s * dt / 1000;
          if ((z.wdir > 0 && z.wx >= gx) || (z.wdir < 0 && z.wx <= gx)) { z.wx = gx; z.phase = 'reattach'; z.pt = 0; }
        } else if (z.phase === 'reattach') {
          if (z.pt > 2.3 && !z.fired.sink) { z.fired.sink = 1; this.dirt(gx, gy, 16); this.puff(gx, gy); }
          if (z.pt > 2.6) { renderGrave(z.grave, null, 0); this.zombie = null; z.solo = null; return; }
        }
        const q = Math.floor(z.pt * 12);
        if (q !== z.lastSoloQ || z.phase !== z.lastPhase) {
          z.lastSoloQ = q; z.lastPhase = z.phase;
          if (z.phase === 'away') { z.solo = null; renderGrave(z.grave, { rise: 1, outside: true }, 0); }
          else {
            const P = soloPose(z);
            if (P.outside) {
              renderGrave(z.grave, { rise: 1, outside: true }, 0);
              const g = new Grid(44, 64);
              drawZombie(g, P, z.pt, { x: 22, y: 61 });
              g.outline(OUTLINE);
              z.solo = g.toCanvas(z.solo || undefined);
            } else { z.solo = null; renderGrave(z.grave, P, z.pt); }
          }
        }
      }
    },
    // Se um painel do site estiver por cima de uma janela/porta do mausoléu, apaga o brilho dela.
    // (o canvas tem pointer-events: none, então elementFromPoint devolve o que está por cima)
    checkCover() {
      const bd = this.backdrop, s = this.s, top = this.backdropTop;
      // conta como "coberto" só se algum elemento com fundo visível (painel, card, modal) estiver na frente;
      // wrappers transparentes que ocupam a página inteira não contam
      const opaque = el => {
        for (let e = el; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
          const cs = getComputedStyle(e), m = cs.backgroundColor.match(/[\d.]+/g);
          const alpha = m ? (m.length > 3 ? +m[3] : 1) : 0;
          if (alpha > 0.15 || (cs.backgroundImage && cs.backgroundImage !== 'none')) return true;
        }
        return false;
      };
      const isContent = (x, y) => {
        const el = document.elementFromPoint(x, y);
        return !!el && !el.closest('#hw-layer') && opaque(el);
      };
      bd.windows.forEach(w => {
        const cx = (w.x0 + w.x1 + 1) / 2 * s, cy = top + (w.y0 + w.y1 + 1) / 2 * s, r = 16 * s;
        w.covered = [[0, 0], [-r, 0], [r, 0], [0, -r], [0, r]].some(([dx, dy]) => isContent(cx + dx, cy + dy));
      });
      bd.doorCovered = isContent(bd.door.x * s, top + (bd.door.y0 + bd.door.y1) / 2 * s);
    },
    blood(x, y, n, dir) {
      const s = this.s, cols = ['#7d1623', '#a3202e', '#5a0e18'];
      for (let i = 0; i < n; i++) this.parts.push({
        k: 'dirt', x: x + rand(-1, 1) * s, y, vx: (dir * rand(0.02, 0.09) + rand(-0.03, 0.03)) * s, vy: -rand(0.05, 0.14) * s,
        life: 0, max: 1100, size: 1, c: cols[i % 3], floor: this.ground - (GH - GY) * s + s
      });
    },
    // posição/quadro do Ceifador ao longo da cena de decapitação
    reaperState(z, gx) {
      const t = z.t, s = this.s, side = z.side;
      if (t < 5.0 || t > 8.1) return null;
      let off = 30, alpha = 1, lift = 0, frame;
      if (t < 5.9) { const k = ease((t - 5.0) / 0.9); off = 30 + 16 * (1 - k); alpha = k; }
      if (t > 7.3) { const k = ease((t - 7.3) / 0.8); off = 30 + 14 * k; alpha = 1 - k; lift = 8 * k; }
      if (t < 6.1 || t > 7.3) frame = Math.floor(t * 4) % 2 ? 'idleB' : 'idleA';
      else if (t < 6.42) frame = 'windup';
      else frame = 'slash';
      const bob = Math.round(Math.sin(t * 4) * 1.2);
      return { cx: gx + side * off * s, alpha, frame, face: -side, top: this.ground - (3 + lift + CBOTTOM + COY) * s + bob * s,
        arc: t >= 6.42 && t < 6.75 ? clamp((t - 6.42) / 0.16, 0, 1) : 0, arcFade: t >= 6.58 ? clamp(1 - (t - 6.58) / 0.17, 0, 1) : 1 };
    },
    // "O Rebitado": chega andando pesado, respira, golpe horizontal, vai embora sem pressa
    slasherState(z, gx) {
      const t = z.t, s = this.s, side = z.side;
      if (t < 5.0 || t > 8.9) return null;
      let off = 30, alpha = 1, frame, face = -side;
      const step = Math.floor(t * 4.5) % 2 ? 'walkA' : 'walkB';
      if (t < 5.9) { const k = (t - 5.0) / 0.9; off = 30 + 18 * (1 - k); alpha = clamp(k * 3, 0, 1); frame = step; }
      else if (t < 6.12) frame = Math.floor(t * 2) % 2 ? 'idleB' : 'idleA';
      else if (t < 6.42) frame = 'windup';
      else if (t < 6.6) frame = 'chop';
      else if (t < 7.4) frame = 'follow';
      else if (t < 7.6) frame = 'idleA';
      else { const k = (t - 7.6) / 1.3; off = 30 + 20 * k; alpha = clamp((1 - k) * 2.5, 0, 1); frame = step; face = side; }
      const feet = this.ground - 9 * s;
      return { kind: 'slasher', cx: gx + side * off * s, alpha, frame, face, top: feet - (KFEET + KOY + 1) * s,
        arc: t >= 6.42 && t < 6.75 ? clamp((t - 6.42) / 0.14, 0, 1) : 0, arcFade: t >= 6.56 ? clamp(1 - (t - 6.56) / 0.19, 0, 1) : 1 };
    },
    puff(x, y) {
      const s = this.s;
      for (let i = 0; i < 12; i++) this.parts.push({ k: 'dust', x: x + rand(-8, 8) * s, y: y - rand(0, 3) * s, vx: rand(-0.03, 0.03) * s, vy: -rand(0.005, 0.025) * s, life: 0, max: rand(500, 900), size: 2 });
    },

    draw() {
      const c = this.ctx, s = this.s, dpr = this.dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, this.W, this.H);
      c.imageSmoothingEnabled = false;
      const gy = this.ground - GH * s;

      // cenário: cemitério contínuo + mausoléu
      const bd = this.backdrop;
      if (bd && this.coverDirty) { this.coverDirty = false; this.checkCover(); }
      if (bd) {
        const top = this.backdropTop;
        c.drawImage(bd.canvas, 0, top, bd.canvas.width * s, bd.canvas.height * s);
        const t = performance.now();
        bd.windows.forEach((w, i) => {
          const wx = (w.x0 + w.x1 + 1) / 2 * s, wy = top + (w.y0 + w.y1 + 1) / 2 * s;
          const fl = 0.22 + 0.08 * Math.sin(t / (260 + i * 70)) + this.flick * 0.06;
          if (!w.covered) this.glow(wx, wy, (w.round ? 12 : 18) * s, fl);
        });
        // vulto atravessando o vitral
        const sh = this.shade;
        if (sh && !bd.windows[sh.wi].covered) {
          const w = bd.windows[sh.wi], k = sh.t / 1600;
          const x0 = w.x0 * s, x1 = (w.x1 + 1) * s, y0 = top + w.y0 * s, y1 = top + (w.y1 + 1) * s;
          c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip();
          const fx = sh.dir > 0 ? lerp(x0 - 4 * s, x1 + 2 * s, k) : lerp(x1 + 2 * s, x0 - 4 * s, k);
          c.fillStyle = '#1a0a08';
          c.fillRect(Math.round(fx / s) * s, y0 + 4 * s, 2 * s, 2 * s);
          c.fillRect(Math.round(fx / s) * s - s, y0 + 6 * s, 4 * s, 12 * s);
          c.restore();
        }
        // luz pela fresta da porta
        const dA = bd.doorCovered ? 0 : 0.25 + 0.25 * Math.abs(Math.sin(t / 900)) + this.flick * 0.15;
        c.fillStyle = `rgba(255,150,60,${dA})`;
        c.fillRect(bd.door.x * s, top + bd.door.y0 * s, s, (bd.door.y1 - bd.door.y0) * s);
      }

      // abóboras dos túmulos (com brilho)
      for (const p of this.props) {
        const pw = 18 * s, ph = 16 * s, y = this.surface - 15 * s;
        this.glow(p.x + pw / 2, y + ph * 0.55, pw * 1.3, 0.22 + this.flick * 0.08);
        c.drawImage(pumpkinFrames[(this.flick + p.ph) % 2], p.x, y, pw, ph);
      }
      // túmulos
      for (const gr of this.graves) c.drawImage(gr.canvas, gr.x, gy, GW * s, GH * s);

      // corvo
      const cr = this.crow;
      if (cr && cr.state !== 'gone' && cr.x != null) {
        const now = performance.now();
        let fr;
        if (cr.state === 'sit') fr = now < cr.cawUntil ? 'caw' : now < cr.blinkUntil ? 'blink' : cr.look || 'sit';
        else fr = Math.floor(cr.t / 90) % 2 ? 'fly1' : 'fly2';
        const w = CRW * s, top = cr.y - CR_FEET * s - s;
        c.save();
        if (cr.face < 0) { c.translate(cr.x + CR_CX * s, top); c.scale(-1, 1); } else c.translate(cr.x - CR_CX * s, top);
        c.drawImage(crowFrames[fr], 0, 0, w, CRH * s);
        c.restore();
        if (fr === 'caw') {
          c.fillStyle = 'rgba(255,255,255,.55)';
          const bx = cr.x + cr.face * 10 * s, by = top + 3 * s;
          [[0, 0], [1, -1], [2, -2], [1, 1], [2, 2]].forEach(([a, b2]) => c.fillRect(Math.round((bx + cr.face * a * s) / s) * s, Math.round((by + b2 * s) / s) * s, s, s));
        }
      }
      // bruxa (passa na frente da lua)
      const wi = this.witch;
      if (wi && wi.yy != null) {
        const w = WW * s;
        c.save();
        if (wi.dir < 0) { c.translate(wi.x + w, wi.yy); c.scale(-1, 1); } else c.translate(wi.x, wi.yy);
        c.drawImage(witchFrames[wi.f || 0], 0, 0, w, WH * s);
        c.restore();
      }

      // zumbi fora da cova
      const zz = this.zombie;
      if (zz && zz.solo) {
        const feetY = this.ground - GH * s + (GY - 2) * s;
        c.drawImage(zz.solo, Math.round(zz.wx - 22 * s), feetY - 61 * s, 44 * s, 64 * s);
      }
      // assassino (Ceifador ou "O Rebitado")
      const rp = this.zombie && this.zombie.reaper;
      if (rp && rp.kind === 'slasher') this.drawSlasherActor(rp);
      else if (rp) {
        const w = CW * s, left = rp.face > 0 ? rp.cx - CBX * s : rp.cx - (CW - CBX) * s;
        c.save();
        c.globalAlpha = rp.alpha;
        c.fillStyle = 'rgba(0,0,0,.3)';
        c.beginPath(); c.ellipse(rp.cx, this.ground + s, 9 * s, 2 * s, 0, 0, TAU); c.fill();
        const ex = rp.face > 0 ? left + 18 * s : left + w - 18 * s;
        this.glow(ex, rp.top + (11 + COY) * s, 10 * s, 0.25 * rp.alpha, '170,90,255');
        if (rp.face > 0) { c.translate(left, rp.top); } else { c.translate(left + w, rp.top); c.scale(-1, 1); }
        c.drawImage(reaperFrames[rp.frame], 0, 0, w, CH * s);
        c.restore();
        // rastro do golpe
        if (rp.arc > 0 && rp.arcFade > 0) {
          const hx = rp.cx + rp.face * (REAPER_HAND.x - CBX) * s, hy = rp.top + (REAPER_HAND.y + COY) * s;
          const a0 = -1.9, a1 = 0.75, steps = 26;
          for (let i = 0; i <= steps * rp.arc; i++) {
            const a = a0 + (a1 - a0) * (i / steps), age = rp.arc - i / steps;
            for (let r = 21; r <= 23; r++) {
              const px = hx + rp.face * Math.cos(a) * r * s, py = hy + Math.sin(a) * r * s;
              c.fillStyle = `rgba(${age < 0.15 ? '255,255,255' : '200,170,255'},${(0.9 - age) * rp.arcFade})`;
              c.fillRect(Math.round(px / s) * s, Math.round(py / s) * s, s, s);
            }
          }
        }
      }

      // cavaleiro
      const r = this.rider;
      if (r) {
        const sw = RW * s, top = this.surface - (R_FEET + ROY + 1) * s;
        c.fillStyle = 'rgba(0,0,0,.35)';
        c.beginPath(); c.ellipse(r.x + sw * 0.5, this.surface + s, sw * 0.32, 2.5 * s, 0, 0, TAU); c.fill();
        if (r.px != null) this.glow(r.px, r.py + 3 * s, 34 * s, 0.32 + this.flick * 0.1);
        c.save();
        if (r.dir < 0) { c.translate(r.x + sw, top); c.scale(-1, 1); } else c.translate(r.x, top);
        c.drawImage(riderFrames[r.mode || 'pumpkin'][r.f][this.flick], 0, 0, sw, RH * s);
        c.restore();
      }
      // partículas (quadradas, alinhadas à grade de pixel)
      for (const p of this.parts) {
        const k = p.life / p.max, sz = p.size * s;
        let col;
        if (p.k === 'fire') col = k < 0.12 ? '#fff6c8' : k < 0.3 ? '#ffd23f' : k < 0.55 ? '#ff8a1c' : k < 0.78 ? '#e2401a' : 'rgba(80,28,40,.55)';
        else if (p.k === 'ember') col = (Math.floor(p.life / 90) % 2) ? '#ffb02a' : '#ff6a1a';
        else if (p.k === 'dust') col = `rgba(120,100,140,${0.45 * (1 - k)})`;
        else if (p.k === 'spark') { if (Math.random() < 0.25) continue; col = p.c; }
        else { col = p.c; if (p.y > p.floor && p.vy > 0) { p.y = p.floor; p.vy *= -0.25; p.vx *= 0.5; } }
        c.fillStyle = col;
        c.fillRect(Math.round(p.x / s) * s, Math.round(p.y / s) * s, sz, sz);
      }
    },
    drawFront() {
      const f = this.fctx;
      if (!f) return;
      const gh = this.ghost;
      if (!gh && !this.frontDirty) return;
      f.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      f.clearRect(0, 0, this.W, this.H);
      f.imageSmoothingEnabled = false;
      this.frontDirty = !!gh;
      if (!gh || gh.cy == null) return;
      const s = this.s, booing = gh.booT >= 0 && !gh.flee;
      const scale = 1.3 * (booing ? 1 + 0.3 * clamp(gh.booT / 150, 0, 1) : 1);
      const w = GHW * s * scale, h = GHH * s * scale;
      const edge = clamp(Math.min(gh.x + w, this.W - gh.x + w) / 200, 0, 1);
      let a = (booing ? 0.85 : 0.5) * edge;
      if (gh.flee) a *= clamp(1 - gh.flee / 900, 0, 1);
      f.save();
      f.globalAlpha = a;
      const gr = f.createRadialGradient(gh.x, gh.cy, 0, gh.x, gh.cy, w);
      gr.addColorStop(0, 'rgba(200,185,255,.35)'); gr.addColorStop(1, 'rgba(200,185,255,0)');
      f.fillStyle = gr; f.fillRect(gh.x - w, gh.cy - w, w * 2, w * 2);
      const fr = booing ? 'boo' : Math.floor(gh.t / 300) % 2 ? 'idleB' : 'idleA';
      f.drawImage(ghostFrames[fr], Math.round(gh.x - w / 2), Math.round(gh.cy - h / 2), w, h);
      if (booing) {
        f.globalAlpha = Math.min(1, a + 0.15);
        const bw = 14 * s * 1.4, bh = 7 * s * 1.4, j = Math.floor(gh.booT / 60) % 2;
        f.drawImage(booCanvas, Math.round(gh.x - bw / 2 + j * s), Math.round(gh.cy - h / 2 - bh - 2 * s), bw, bh);
      }
      f.restore();
    },
    drawSlasherActor(rp) {
      const c = this.ctx, s = this.s, w = KW * s;
      const left = rp.face > 0 ? rp.cx - KBX * s : rp.cx - (KW - KBX) * s;
      c.save();
      c.globalAlpha = rp.alpha;
      c.fillStyle = 'rgba(0,0,0,.4)';
      c.beginPath(); c.ellipse(rp.cx + rp.face * 2 * s, rp.top + (KFEET + KOY + 1) * s, 9 * s, 1.6 * s, 0, 0, TAU); c.fill();
      // olho aceso (pisca de vez em quando)
      if (this.flick || Math.random() < 0.9) {
        const ex = rp.face > 0 ? left + 19.5 * s : left + w - 19.5 * s;
        const by = rp.frame === 'idleB' || rp.frame === 'walkB' || rp.frame === 'windup' ? -1 : rp.frame === 'follow' ? 1 : 0;
        this.glow(ex, rp.top + (11.5 + KOY + by) * s, 7 * s, 0.35 * rp.alpha, '255,170,60');
      }
      if (rp.face > 0) c.translate(left, rp.top); else { c.translate(left + w, rp.top); c.scale(-1, 1); }
      c.drawImage(slasherFrames[rp.frame], 0, 0, w, KH * s);
      c.restore();
      if (rp.arc > 0 && rp.arcFade > 0) {
        const hx = rp.cx + rp.face * (SLASHER_PIVOT.x - KBX) * s, hy = rp.top + (SLASHER_PIVOT.y + KOY) * s;
        const a0 = -1.1, a1 = 0.25, steps = 22;
        for (let i = 0; i <= steps * rp.arc; i++) {
          const a = a0 + (a1 - a0) * (i / steps), age = rp.arc - i / steps;
          for (let r = 21; r <= 25; r++) {
            const px = hx + rp.face * Math.cos(a) * r * s, py = hy + Math.sin(a) * r * s + 3 * s;
            c.fillStyle = `rgba(${age < 0.2 ? '255,248,235' : '255,170,90'},${(0.95 - age) * rp.arcFade})`;
            c.fillRect(Math.round(px / s) * s, Math.round(py / s) * s, s, s);
          }
        }
      }
    },
    glow(x, y, r, a, rgbStr) {
      const c = this.ctx, g = c.createRadialGradient(x, y, 0, x, y, r), col = rgbStr || '255,150,50';
      g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g;
      c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
    }
  };

  /* ======================================================================
   * Decoração SVG (teias, aranhas, morcegos, lua, névoa)
   * ==================================================================== */
  function webSVG(size) {
    const spokes = 8, rings = 7, pts = [];
    for (let i = 0; i < spokes; i++) {
      const a = (i / (spokes - 1)) * (Math.PI / 2), len = size * (0.92 + ((i * 37) % 10) / 100);
      pts.push({ a, len });
    }
    let d = '';
    pts.forEach(p => { d += `M0 0L${(Math.cos(p.a) * p.len).toFixed(1)} ${(Math.sin(p.a) * p.len).toFixed(1)}`; });
    for (let k = 1; k < rings; k++) {
      const f = k / rings;
      pts.forEach((p, i) => {
        const x = Math.cos(p.a) * p.len * f, y = Math.sin(p.a) * p.len * f;
        if (i === 0) { d += `M${x.toFixed(1)} ${y.toFixed(1)}`; return; }
        const q = pts[i - 1], px = Math.cos(q.a) * q.len * f, py = Math.sin(q.a) * q.len * f;
        const mx = (x + px) / 2 * 0.86, my = (y + py) / 2 * 0.86;
        d += `Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
      });
    }
    return `<svg class="hw-web-svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>`;
  }
  const SPIDER = `<svg viewBox="-14 -12 28 26" width="28" height="26" class="hw-spider-svg">
    <g stroke="#0a0610" stroke-width="1.6" fill="none" stroke-linecap="round">
      <path d="M-3 0 L-9 -6 L-12 -2 M-3 1 L-10 -1 L-13 4 M-3 2 L-9 4 L-11 10 M-2 3 L-6 7 L-7 12"/>
      <path d="M3 0 L9 -6 L12 -2 M3 1 L10 -1 L13 4 M3 2 L9 4 L11 10 M2 3 L6 7 L7 12"/>
    </g>
    <ellipse cx="0" cy="3" rx="5" ry="6" fill="#120a1c"/><ellipse cx="0" cy="-3" rx="3.4" ry="3" fill="#120a1c"/>
    <ellipse cx="-1.5" cy="1" rx="1.5" ry="2.2" fill="#3b2a55" opacity=".7"/>
    <circle cx="-1.2" cy="-3.6" r=".9" fill="#ff3b30"/><circle cx="1.2" cy="-3.6" r=".9" fill="#ff3b30"/>
  </svg>`;
  const BAT = `<svg viewBox="-30 -12 60 24" width="60" height="24" class="hw-bat-svg">
    <g fill="#07040c">
      <path class="hw-wing hw-wing-l" d="M-3 0 C-8 -9 -18 -10 -28 -4 C-22 -3 -21 1 -19 4 C-16 1 -13 2 -11 6 C-9 2 -6 2 -3 4 Z"/>
      <path class="hw-wing hw-wing-r" d="M3 0 C8 -9 18 -10 28 -4 C22 -3 21 1 19 4 C16 1 13 2 11 6 C9 2 6 2 3 4 Z"/>
      <ellipse cx="0" cy="1" rx="4" ry="5"/><path d="M-3 -3 L-3.5 -8 L-1 -4 Z M3 -3 L3.5 -8 L1 -4 Z"/>
    </g><circle cx="-1.4" cy="-1" r=".8" fill="#ff5a2a"/><circle cx="1.4" cy="-1" r=".8" fill="#ff5a2a"/>
  </svg>`;
  const HAT = `<svg viewBox="0 0 100 92" class="hw-hat-svg" aria-hidden="true">
    <defs>
      <linearGradient id="hwHatCone" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#1d0f2e"/><stop offset=".45" stop-color="#4d2477"/><stop offset=".7" stop-color="#36195a"/><stop offset="1" stop-color="#170b26"/>
      </linearGradient>
      <linearGradient id="hwHatBrim" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#3a1d5c"/><stop offset="1" stop-color="#150a22"/>
      </linearGradient>
    </defs>
    <path d="M6 76 Q50 61 94 76 Q50 90 6 76 Z" fill="url(#hwHatBrim)" stroke="#07030c" stroke-width="2.4"/>
    <path d="M25 73 Q31 52 40 37 Q48 22 58 14 Q66 8 78 9 Q70 13 66 20 Q62 28 63 40 Q66 58 75 73 Q50 80 25 73 Z" fill="url(#hwHatCone)" stroke="#07030c" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M42 40 Q47 30 54 22" stroke="#7a48b0" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M27 64 Q50 71 73 64 L75 72 Q50 80 25 72 Z" fill="#ff7a1a" stroke="#07030c" stroke-width="2"/>
    <rect x="44" y="64.5" width="11" height="10" rx="1.5" fill="none" stroke="#ffd166" stroke-width="2.6"/>
    <path d="M70 26 l1.6 3.3 3.6.5 -2.6 2.5 .6 3.6 -3.2-1.7 -3.2 1.7 .6-3.6 -2.6-2.5 3.6-.5z" fill="#ffd166"/>
  </svg>`;

  function buildLayer() {
    const L = document.createElement('div');
    L.id = 'hw-layer'; L.setAttribute('aria-hidden', 'true');
    L.innerHTML = `
      <div class="hw-vignette"></div>
      <div class="hw-moon"><i></i><i></i><i></i></div>
      <div class="hw-fog hw-fog-1"></div><div class="hw-fog hw-fog-2"></div>
      <div class="hw-web hw-web-tl">${webSVG(230)}<div class="hw-spider" style="--drop:92px;left:118px;top:70px">${SPIDER}</div></div>
      <div class="hw-web hw-web-tr">${webSVG(200)}<div class="hw-spider" style="--drop:64px;left:84px;top:96px;animation-delay:-2.2s">${SPIDER}</div></div>
      <div class="hw-bats">
        <div class="hw-bat" style="--y:9vh;--dur:19s;--delay:-3s;--scale:.9">${BAT}</div>
        <div class="hw-bat" style="--y:18vh;--dur:26s;--delay:-14s;--scale:.6">${BAT}</div>
        <div class="hw-bat" style="--y:5vh;--dur:31s;--delay:-21s;--scale:.45">${BAT}</div>
      </div>`;
    return L;
  }

  /* ======================================================================
   * Chapéu de bruxa sobre o "R" da logo
   * ==================================================================== */
  const Hat = {
    el: null, logo: null, ro: null,
    mount(selector) {
      const logo = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!logo || !logo.parentElement) return;
      this.logo = logo;
      logo.parentElement.classList.add('hw-hat-host');
      this.el = document.createElement('span');
      this.el.className = 'hw-hat';
      this.el.innerHTML = HAT;
      logo.parentElement.appendChild(this.el);
      this.place = this.place.bind(this);
      this.ro = global.ResizeObserver ? new ResizeObserver(this.place) : null;
      if (this.ro) this.ro.observe(logo);
      addEventListener('resize', this.place);
      if (logo.tagName === 'IMG' && !logo.complete) logo.addEventListener('load', this.place, { once: true });
      this.place();
    },
    place() {
      if (!this.el || !this.logo) return;
      const cs = getComputedStyle(this.el);
      const fx = parseFloat(cs.getPropertyValue('--hw-hat-x')) || 0.1;  // centro do R, fração da largura da logo
      const fy = parseFloat(cs.getPropertyValue('--hw-hat-y')) || 0.22;  // onde a aba encosta, fração da altura
      const fw = parseFloat(cs.getPropertyValue('--hw-hat-size')) || 1.5; // largura do chapéu, fração da altura da logo
      const l = this.logo, w = l.offsetHeight * fw;
      this.el.style.width = w + 'px';
      this.el.style.left = (l.offsetLeft + l.offsetWidth * fx - w / 2) + 'px';
      this.el.style.top = (l.offsetTop + l.offsetHeight * fy - w * 0.84) + 'px';
    },
    unmount() {
      if (this.ro) this.ro.disconnect();
      removeEventListener('resize', this.place);
      if (this.logo && this.logo.parentElement) this.logo.parentElement.classList.remove('hw-hat-host');
      if (this.el) this.el.remove();
      this.el = this.logo = this.ro = null;
    }
  };

  /* ======================================================================
   * API pública
   * ==================================================================== */
  const FX = {
    enabled: false, layer: null, opts: null,
    enable(opts = {}) {
      if (this.enabled) return;
      this.enabled = true;
      this.opts = Object.assign({ logo: null, swordChance: 0.35, horseChance: 0.25, decapChance: 0, killer: 'reaper', eventGap: [25, 50], firstEvent: 6,
        weights: { ride: 0.35, zombie: 0.3, ghost: 0.2, witch: 0.15 }, mount: document.body }, opts);
      this.opts.weights = Object.assign({ ride: 0.35, zombie: 0.3, ghost: 0.2, witch: 0.15 }, opts.weights || {});
      this.layer = buildLayer();
      this.opts.mount.prepend(this.layer);
      Scene.mount(this.layer);
      if (this.opts.logo) Hat.mount(this.opts.logo);
      if (!Scene.reduced) this.director();
    },
    // "Diretor": só um evento grande por vez (cavaleiro, zumbi, fantasma ou bruxa) e uma pausa
    // aleatória (eventGap) depois que o anterior termina. Nunca repete o mesmo evento em seguida.
    director() {
      const o = this.opts, events = [['ride', o.weights.ride], ['rise', o.weights.zombie], ['ghostPass', o.weights.ghost], ['witchPass', o.weights.witch]];
      let lastEnd = performance.now() - (o.eventGap[0] - o.firstEvent) * 1000, gap = o.eventGap[0], last = null;
      const pick = () => {
        const pool = events.filter(([n, w]) => w > 0 && n !== last);
        let r = Math.random() * pool.reduce((a, [, w]) => a + w, 0);
        for (const [n, w] of pool) { if ((r -= w) <= 0) return n; }
        return pool[0][0];
      };
      const id = setInterval(() => {
        if (!this.enabled) return;
        const now = performance.now();
        if (Scene.busy()) { lastEnd = now; return; }
        if (document.hidden || now - lastEnd < gap * 1000) return;
        last = pick();
        Scene[last]();
        lastEnd = now;
        gap = rand(o.eventGap[0], o.eventGap[1]);
      }, 500);
      Scene.timers.push(id);
    },
    loopActor(fn, first, [a, b]) {
      const go = delay => Scene.timers.push(setTimeout(() => {
        if (!this.enabled) return;
        if (!document.hidden) Scene[fn]();
        go(rand(a, b));
      }, delay * 1000));
      go(first);
    },
    disable() {
      if (!this.enabled) return;
      this.enabled = false;
      Scene.unmount(); Hat.unmount();
      if (this.layer) this.layer.remove();
      this.layer = null;
    },
    ride(kind) { Scene.ride(kind); },
    zombie(i, variant) { Scene.rise(i, variant); },
    ghost() { Scene.ghostPass(); },
    witch() { Scene.witchPass(); },
    crow() { Scene.scareCrow(); },
    refreshHat() { Hat.place(); }
  };

  FX._debug = { Scene, renderGrave, zombiePose, GW, GH, sprites: () => ({ slasherFrames, riderFrames }) };
  global.HalloweenFX = FX;
})(window);
