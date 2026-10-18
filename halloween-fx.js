/*!
 * Revoada — Halloween FX
 * Tema de Halloween em pixel art 2D (sem modelos 3D, sem imagens externas).
 *  - Cavaleiro sem cabeça (Jack-o'-lantern) a cavalo, com abóbora em chamas, cruzando o fundo
 *  - Túmulos nas laterais; de vez em quando um zumbi policial sai da cova, olha em volta,
 *    coça a cabeça e cai de volta
 *  - Chapéu de bruxa sobre o "R" da logo, teias com aranhas, morcegos, lua, névoa, abóboras
 *
 * API:
 *   HalloweenFX.enable({ logo: '#logo-revoada' })   // liga (idempotente)
 *   HalloweenFX.disable()                           // desliga e remove tudo
 *   HalloweenFX.ride()    // força uma passagem do cavaleiro
 *   HalloweenFX.zombie()  // força um zumbi
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
  const PUMP = { x: 58, y: 1 };

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

  function drawRider(g, f, v) {
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
    g.line(44, Y(26), 50, Y(33), H.coatLo, 1);
    g.line(50, Y(33), 56, Y(36), H.coatLo, 1);
    g.set(57, Y(36), H.boot); g.set(57, Y(37), H.boot);

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
    // gola alta, sem cabeça
    g.poly([[41, Y(23)], [49, Y(23)], [50, Y(19)], [46, Y(18)], [41, Y(19)]], H.coatLo);
    g.set(44, Y(19), '#3a0a12'); g.set(45, Y(19), '#3a0a12');
    g.ellipse(49, Y(25), 3, 2, H.silverLo); g.set(49, Y(24), H.silver);

    // braço erguido com a abóbora
    g.line(48, Y(25), 54, Y(16), H.coat, 1.3);
    g.line(54, Y(16), 57, Y(8), H.coat, 1);
    g.line(53, Y(17), 55, Y(12), H.coatHi, 0);
    g.set(56, Y(10), H.silver); g.set(57, Y(10), H.silver);
    g.ellipse(57, Y(7), 1.5, 1.5, H.boot);

    // abóbora
    const py = Y(PUMP.y), px = PUMP.x;
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

    // rédeas por cima
    g.line(57, Y(36), 77, Y(37), H.leather, 0);
    return b;
  }

  // luz da lua: pixels com o topo exposto ganham um tom mais claro
  function rimLight(g, map) {
    const d = g.d.slice(), w = g.w;
    for (let i = w; i < d.length; i++) if (d[i] && !d[i - w] && map[d[i]]) g.d[i] = map[d[i]];
  }

  let riderFrames = null, riderBob = [];
  function buildRider() {
    if (riderFrames) return;
    riderFrames = [];
    for (let f = 0; f < R_FRAMES; f++) {
      riderFrames[f] = [];
      for (let v = 0; v < 2; v++) {
        const g = new Grid(RW, RH, 0, ROY);
        riderBob[f] = drawRider(g, f, v);
        rimLight(g, { [H.horse]: H.horseHi, [H.coat]: H.coatHi, [H.cape]: H.capeHi, [H.mane]: H.maneHi, [H.far]: H.horse, [H.coatLo]: H.coat });
        g.outline(OUTLINE);
        riderFrames[f][v] = g.toCanvas();
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
    '?': ['111', '001', '011', '000', '010']
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
  const ZT = { dur: 9.7 };
  function zombiePose(t) {
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

  function handTarget(name, side, P, offY) {
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

  function drawZombie(g, P, t) {
    const offY = (1 - P.rise) * 46;
    const oy = GY - 2 + offY;
    const lean = P.lean;
    const tx = (x, y) => GCX + x + lean * (-y) / 38;
    let T = {
      set: (x, y, c) => g.set(tx(x, y), oy + y, c),
      line: (x0, y0, x1, y1, c, r) => g.line(tx(x0, y0), oy + y0, tx(x1, y1), oy + y1, c, r),
      rect: (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) T.set(x, y, c); },
      ellipse: (cx, cy, rx, ry, c) => g.ellipse(tx(cx, cy), oy + cy, rx, ry, c)
    };
    // pernas
    T.line(-2, -13, -2, -2, Z.pants, 1);
    T.line(2, -13, 3, -2, Z.pants, 1);
    T.line(-3, -12, -3, -3, Z.pantsLo, 0);
    T.set(3, -6, Z.skin); T.set(4, -5, Z.skinLo);
    T.rect(-4, -1, -1, 0, Z.shoe); T.rect(2, -1, 5, 0, Z.shoe);
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
    T = { set: (x, y, c) => T0.set(x, y + hd, c), rect: (x0, y0, x1, y1, c) => T0.rect(x0, y0 + hd, x1, y1 + hd, c) };
    const h = P.head, mx = x => (h < 0 ? -1 - x : x);
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
    T = T0;
    // braços (o ombro "sobe" debaixo da terra enquanto a mão procura a superfície)
    arm(T, 4, -25 - (P.upR || 0), ...handTarget(P.R, 1, P, offY), 1, P.wiggle);
    arm(T, -5, -25 - (P.upL || 0), ...handTarget(P.L, -1, P, offY), -1, P.wiggle);
    // interrogação
    if (P.q) {
      const qy = -48 + (Math.floor(t * 4) % 2);
      glyph({ set: (x, y) => { T.set(x, y, '#fff3c4'); } }, '?', 5, qy, '#fff3c4');
    }
  }

  function renderGrave(gr, P, t) {
    const g = new Grid(GW, GH);
    drawStone(g, gr.type, gr.seed);
    const jit = P && P.shake ? (Math.floor(t * 20) % 2 ? 1 : -1) : 0;
    g.ellipse(GCX + jit, GY, 11, 2.6, Z.soil2);
    g.set(GCX - 6 + jit, GY - 2, Z.soil3); g.set(GCX + 4 + jit, GY - 2, Z.soil3);
    if (P && P.rise > 0.01) g.ellipse(GCX, GY - 1, 6, 1.3, Z.hole);
    if (P && P.rise > 0.01) { g.clipY = GY; drawZombie(g, P, t); g.clipY = Infinity; }
    g.outline(OUTLINE);
    // chão da frente (sem contorno)
    for (let y = GY; y < GH; y++) for (let x = 0; x < GW; x++) {
      const n = (x * 31 + y * 17 + gr.seed) % 11;
      g.set(x, y, n === 0 ? Z.soil3 : n < 3 ? Z.soil2 : Z.soil);
    }
    g.ellipse(GCX + jit, GY, 11, 2.6, Z.soil2, GY);
    g.ellipse(GCX + jit, GY + 1, 9, 1.4, Z.soil3, GY + 1);
    for (let i = 0; i < 7; i++) {
      const x = (gr.seed * 5 + i * 9) % GW;
      if (Math.abs(x - GCX) < 13) continue;
      g.set(x, GY - 1, Z.grass); g.set(x + 1, GY - 2, Z.grass2); g.set(x + 2, GY - 1, Z.grass);
    }
    return g.toCanvas(gr.canvas);
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
      buildRider(); buildPumpkins();
      this.onResize = () => this.resize();
      this.onVis = () => { if (!document.hidden) this.kick(); };
      addEventListener('resize', this.onResize);
      document.addEventListener('visibilitychange', this.onVis);
      this.resize();
    },
    unmount() {
      cancelAnimationFrame(this.raf); this.raf = 0;
      removeEventListener('resize', this.onResize);
      document.removeEventListener('visibilitychange', this.onVis);
      this.timers.forEach(clearTimeout); this.timers = [];
      this.rider = this.zombie = null; this.parts = [];
      if (this.canvas) this.canvas.remove();
      this.canvas = null;
    },
    resize() {
      const W = innerWidth, Hh = innerHeight, dpr = Math.min(2, global.devicePixelRatio || 1);
      this.W = W; this.H = Hh; this.dpr = dpr;
      this.s = clamp(Math.floor(Hh / 320), 2, 4);
      this.ground = Hh - Math.round(this.s * 3);
      this.canvas.width = Math.round(W * dpr); this.canvas.height = Math.round(Hh * dpr);
      this.canvas.style.width = W + 'px'; this.canvas.style.height = Hh + 'px';
      this.layout();
      this.kick();
    },
    layout() {
      const s = this.s, gw = GW * s, W = this.W;
      const perSide = W >= 1700 ? 2 : W >= 900 ? 1 : 0;
      const types = ['rip', 'cross', 'tall'];
      const old = this.graves;
      this.graves = [];
      this.props = [];
      for (let side = 0; side < 2; side++) for (let i = 0; i < perSide; i++) {
        const x = side === 0 ? 4 + i * (gw * 0.82) : W - gw - 4 - i * (gw * 0.82);
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
    },

    kick() { if (!this.raf && this.canvas) { this.last = performance.now(); this.raf = requestAnimationFrame(t => this.loop(t)); } },
    loop(now) {
      this.raf = 0;
      if (!this.canvas || document.hidden) return;
      const dt = Math.min(50, now - this.last); this.last = now;
      const active = this.rider || this.zombie || this.parts.length;
      this.idleAcc += dt;
      if (active || this.idleAcc > 120) {
        if (this.idleAcc > 120) { this.idleAcc = 0; this.flick = Math.random() < 0.35 ? 1 : 0; }
        this.update(dt, now);
        this.draw(now);
      }
      if (!this.reduced || active) this.raf = requestAnimationFrame(t => this.loop(t));
    },

    /* ---------- atores ---------- */
    ride() {
      if (!this.canvas || this.rider) return;
      const dir = Math.random() < 0.5 ? 1 : -1, sw = RW * this.s;
      const secs = clamp(this.W / 230, 6, 11);
      this.rider = { dir, x: dir > 0 ? -sw : this.W, speed: (this.W + sw) / (secs * 1000), t: 0 };
      this.kick();
    },
    rise(index) {
      if (!this.canvas || this.zombie || !this.graves.length) return;
      const gr = this.graves[index != null ? index % this.graves.length : Math.floor(Math.random() * this.graves.length)];
      this.zombie = { grave: gr, t: 0, lastQ: -1, fired: {} };
      this.kick();
    },

    update(dt) {
      const s = this.s;
      // cavaleiro
      const r = this.rider;
      if (r) {
        r.t += dt; r.x += r.dir * r.speed * dt;
        r.f = Math.floor(r.t / 75) % R_FRAMES;
        const sw = RW * s, top = this.ground - (R_FEET + ROY) * s;
        const lx = r.dir > 0 ? PUMP.x : RW - PUMP.x;
        const px = r.x + lx * s, py = top + (ROY + PUMP.y - 3 + riderBob[r.f]) * s;
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
          this.parts.push({ k: 'dust', x: hx, y: this.ground - s, vx: -r.dir * rand(0.01, 0.05) * s, vy: -rand(0.005, 0.02) * s, life: 0, max: rand(400, 800), size: 2 });
        }
        if ((r.dir > 0 && r.x > this.W) || (r.dir < 0 && r.x < -sw)) this.rider = null;
      }
      // zumbi
      const z = this.zombie;
      if (z) {
        z.t += dt / 1000;
        const tq = Math.floor(z.t * 12) / 12;
        if (tq !== z.lastQ) {
          z.lastQ = tq;
          z.P = zombiePose(tq);
          renderGrave(z.grave, z.P, tq);
        }
        const gx = z.grave.x + GCX * s, gy = this.ground - (GH - GY) * s;
        const once = (key, at, fn) => { if (!z.fired[key] && z.t >= at) { z.fired[key] = 1; fn(); } };
        if (z.t < 0.9 && Math.random() < 0.25) this.dirt(gx, gy, 1);
        once('pop', 0.95, () => this.dirt(gx + 4 * s, gy, 14));
        once('pop2', 2.05, () => this.dirt(gx - 6 * s, gy, 8));
        once('out', 4.5, () => this.dirt(gx, gy, 10));
        once('fall', 9.15, () => { this.dirt(gx, gy, 16); this.puff(gx, gy); });
        if (z.t > 2.8 && z.t < 4.4 && Math.random() < 0.08) this.dirt(gx, gy, 2);
        if (z.t >= ZT.dur) { renderGrave(z.grave, null, 0); this.zombie = null; }
      }
      // partículas
      const g = 0.0011 * s;
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

      // abóboras dos túmulos (com brilho)
      for (const p of this.props) {
        const pw = 18 * s, ph = 16 * s, y = this.ground - ph + 2 * s;
        this.glow(p.x + pw / 2, y + ph * 0.55, pw * 1.3, 0.22 + this.flick * 0.08);
        c.drawImage(pumpkinFrames[(this.flick + p.ph) % 2], p.x, y, pw, ph);
      }
      // túmulos
      for (const gr of this.graves) c.drawImage(gr.canvas, gr.x, gy, GW * s, GH * s);

      // cavaleiro
      const r = this.rider;
      if (r) {
        const sw = RW * s, top = this.ground - (R_FEET + ROY) * s;
        c.fillStyle = 'rgba(0,0,0,.35)';
        c.beginPath(); c.ellipse(r.x + sw * 0.5, this.ground + s, sw * 0.32, 3 * s, 0, 0, TAU); c.fill();
        this.glow(r.px, r.py + 3 * s, 34 * s, 0.32 + this.flick * 0.1);
        c.save();
        if (r.dir < 0) { c.translate(r.x + sw, top); c.scale(-1, 1); } else c.translate(r.x, top);
        c.drawImage(riderFrames[r.f][this.flick], 0, 0, sw, RH * s);
        c.restore();
      }
      // partículas (quadradas, alinhadas à grade de pixel)
      for (const p of this.parts) {
        const k = p.life / p.max, sz = p.size * s;
        let col;
        if (p.k === 'fire') col = k < 0.12 ? '#fff6c8' : k < 0.3 ? '#ffd23f' : k < 0.55 ? '#ff8a1c' : k < 0.78 ? '#e2401a' : 'rgba(80,28,40,.55)';
        else if (p.k === 'ember') col = (Math.floor(p.life / 90) % 2) ? '#ffb02a' : '#ff6a1a';
        else if (p.k === 'dust') col = `rgba(120,100,140,${0.45 * (1 - k)})`;
        else { col = p.c; if (p.y > p.floor && p.vy > 0) { p.y = p.floor; p.vy *= -0.25; p.vx *= 0.5; } }
        c.fillStyle = col;
        c.fillRect(Math.round(p.x / s) * s, Math.round(p.y / s) * s, sz, sz);
      }
    },
    glow(x, y, r, a) {
      const c = this.ctx, g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,150,50,${a})`); g.addColorStop(1, 'rgba(255,120,30,0)');
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
      this.opts = Object.assign({ logo: null, riderEvery: [22, 45], zombieEvery: [14, 30], firstRider: 3, firstZombie: 7, mount: document.body }, opts);
      this.layer = buildLayer();
      this.opts.mount.prepend(this.layer);
      Scene.mount(this.layer);
      if (this.opts.logo) Hat.mount(this.opts.logo);
      if (!Scene.reduced) {
        this.loopActor('ride', this.opts.firstRider, this.opts.riderEvery);
        this.loopActor('rise', this.opts.firstZombie, this.opts.zombieEvery);
      }
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
    ride() { Scene.ride(); },
    zombie(i) { Scene.rise(i); },
    refreshHat() { Hat.place(); }
  };

  FX._debug = { Scene, renderGrave, zombiePose, GW, GH };
  global.HalloweenFX = FX;
})(window);
