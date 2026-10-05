// Cartas em 3D: verso desenhado, frente do baralho Rider-Waite-Smith de 1909 (domínio público,
// carregado do Wikimedia Commons), baralho, embaralhar, leque de corte, Cruz Celta e virada.
import * as THREE from 'three';
import { MESA_Y } from './cena.js';
import { lingua, nomeCarta } from './i18n.js';

export const CW = .1, CH = .172, ESP = .0006;       // carta: largura, altura, espessura
export const RAIO = CW * .07;                        // raio dos cantos arredondados
export const PASSO = .00038;                         // espessura de cada carta no monte (78 cartas ≈ 3 cm)
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const easeInOut = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// posições da Cruz Celta sobre a mesa (x, z) e rotação; a carta "de pé" aponta para a Zaira
export const LUGAR = [null,
  { x: -.1, z: .02 }, { x: -.1, z: .02, cruz: true }, { x: -.1, z: -.19 }, { x: -.1, z: .23 },
  { x: -.31, z: .02 }, { x: .11, z: .02 },
  { x: .35, z: .33 }, { x: .35, z: .13 }, { x: .35, z: -.07 }, { x: .35, z: -.27 }];
export const BARALHO = V(0, MESA_Y, -.37);          // no centro, entre as mãos da Zaira (antes ficava sob a mão esquerda)

// ---------- formas com cantos arredondados ----------
function retArredondado(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
// UV de 0 a 1 a partir das coordenadas x,y da forma (a textura cobre a carta inteira)
function uvCarta(geo, w, h) {
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + .5, pos.getY(i) / h + .5);
  uv.needsUpdate = true; return geo;
}
// face plana da carta (no plano XY, como o PlaneGeometry que substitui)
const geoFace = () => uvCarta(new THREE.ShapeGeometry(retArredondado(CW, CH, RAIO), 6), CW, CH);
// bloco arredondado de altura 1 em Y, centrado na origem (a borda da carta e o corpo do monte)
function geoBloco(w, h, r) {
  const g = new THREE.ExtrudeGeometry(retArredondado(w, h, r), { depth: 1, bevelEnabled: false, curveSegments: 6 });
  uvCarta(g, w, h);                  // tampas mapeiam a textura inteira; as laterais usam cor lisa
  g.translate(0, 0, -.5); g.rotateX(-Math.PI / 2);
  return g;
}

// ---------- texturas ----------
function texCanvas(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const rr = (g, x, y, w, h, r) => { r = Math.max(3, r); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
const texVerso = texCanvas(256, 440, (g, w, h) => {
  const R = w * .07;   // o mesmo raio da carta, em pixels
  g.fillStyle = '#f3e6c8'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#4a0f24'; rr(g, 9, 9, w - 18, h - 18, R - 7); g.fill();
  g.strokeStyle = '#c9a04e'; g.lineWidth = 3; rr(g, 17, 17, w - 34, h - 34, R - 13); g.stroke();
  g.lineWidth = 1.2; rr(g, 23, 23, w - 46, h - 46, R - 17); g.stroke();
  // treliça de losangos
  g.save(); rr(g, 24, 24, w - 48, h - 48, R - 18); g.clip();
  g.strokeStyle = 'rgba(201,160,78,.35)';
  for (let i = -h; i < w + h; i += 22) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); }
  g.restore();
  // sol e lua
  const cx = w / 2, cy = h / 2;
  g.fillStyle = '#4a0f24'; g.beginPath(); g.arc(cx, cy, 62, 0, 7); g.fill();
  g.strokeStyle = '#c9a04e'; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, 60, 0, 7); g.stroke();
  g.fillStyle = '#e0bb62';
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; g.beginPath(); g.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30); g.lineTo(cx + Math.cos(a + .12) * 50, cy + Math.sin(a + .12) * 50); g.lineTo(cx + Math.cos(a + .24) * 30, cy + Math.sin(a + .24) * 30); g.fill(); }
  g.beginPath(); g.arc(cx, cy, 28, 0, 7); g.fill();
  g.fillStyle = '#4a0f24'; g.beginPath(); g.arc(cx + 11, cy - 6, 24, 0, 7); g.fill();
  g.fillStyle = '#e0bb62'; g.font = '20px serif'; g.textAlign = 'center';
  g.fillText('✦', cx, 70); g.fillText('✦', cx, h - 56);
});

const NAIPE = { cups: '🏆', pentacles: '⛤', swords: '⚔', wands: '⚚' };
const ROM = { pt: ['Rei', 'Rainha', 'Cavaleiro', 'Valete', 'Ás', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'], en: ['King', 'Queen', 'Knight', 'Page', 'Ace', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'] };
// frente provisória (enquanto a imagem do Commons não chega). A tela já nasce do tamanho final da carta:
// a imagem real é depois desenhada DENTRO desta mesma tela. Trocar por uma imagem de outro tamanho
// não funciona no WebGL (a textura já reservada não muda de tamanho) e a carta ficava com o desenho provisório.
const FW = 512, FH = Math.round(FW * CH / CW);
function texFrenteDesenhada(c) {
  return texCanvas(FW, FH, (g0, W, H) => {
    const g = g0; g.scale(W / 256, W / 256); const w = 256, h = H * 256 / W;
    g.fillStyle = '#f3e6c8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#2b1a10'; g.lineWidth = 3; rr(g, 14, 14, w - 28, h - 28, w * .07 - 10); g.stroke();
    g.fillStyle = '#2b1a10'; g.textAlign = 'center';
    g.font = 'bold 30px Georgia, serif'; g.fillText(c.arcana === 'major' ? c.number : ROM[lingua()][c.rank], w / 2, 62);
    g.font = '96px serif'; g.fillText(c.arcana === 'major' ? '✶' : NAIPE[c.suit], w / 2, h / 2 + 30);
    g.font = 'bold 19px Georgia, serif';
    const palavras = nomeCarta(c).toUpperCase().split(' '); let linha = '', y = h - 70; const linhas = [];
    for (const p of palavras) { if ((linha + ' ' + p).trim().length > 16) { linhas.push(linha.trim()); linha = p; } else linha += ' ' + p; }
    linhas.push(linha.trim()); y = h - 40 - (linhas.length - 1) * 22;
    for (const l of linhas) { g.fillText(l, w / 2, y); y += 22; }
  });
}

// resolve os endereços das imagens no Commons (API com CORS aberto)
const urls = {};
export async function resolveImagens(cartas) {
  const nomes = [...new Set(cartas.flatMap(c => c.commons))];
  const lotes = []; for (let i = 0; i < nomes.length; i += 45) lotes.push(nomes.slice(i, i + 45));
  const achados = {};
  await Promise.all(lotes.map(async l => {
    const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url&iiurlwidth=420&titles=' +
      encodeURIComponent(l.map(n => 'File:' + n).join('|'));
    try {
      const r = await fetch(u); const j = await r.json();
      const norm = {}; (j.query.normalized || []).forEach(n => norm[n.to] = n.from);
      for (const p of Object.values(j.query.pages || {})) {
        const ii = p.imageinfo?.[0]; if (!ii) continue;
        const orig = (norm[p.title] || p.title).replace(/^File:/, '');
        achados[orig] = ii.thumburl || ii.url; achados[p.title.replace(/^File:/, '')] = ii.thumburl || ii.url;
      }
    } catch (e) { console.warn('Commons indisponível', e); }
  }));
  for (const c of cartas) for (const n of c.commons) if (achados[n] || achados[n.replace(/_/g, ' ')]) { urls[c.id] = achados[n] || achados[n.replace(/_/g, ' ')]; break; }
  return Object.keys(urls).length;
}
// ---------- limpeza do scan ----------
// As digitalizações do Commons trazem a margem do papel com sujeira, sombra e o corte torto do scanner.
// Aqui achamos o fio preto da moldura da carta a partir de cada borda, cortamos ali e
// recolocamos a carta sobre uma margem creme limpa.
const CREME = '#f3e6c8';
function achaMoldura(px, w, h) {
  const lum = (x, y) => { const i = (y * w + x) * 4; return .299 * px[i] + .587 * px[i + 1] + .114 * px[i + 2]; };
  // fração de pixels escuros numa linha (horizontal) ou coluna (vertical), só no miolo, longe dos cantos
  const escuros = (k, horiz) => {
    const n = horiz ? w : h, a = Math.floor(n * .2), b = Math.ceil(n * .8); let e = 0;
    for (let j = a; j < b; j++) if ((horiz ? lum(j, k) : lum(k, j)) < 110) e++;
    return e / (b - a);
  };
  const claros = (k, horiz) => {
    const n = horiz ? w : h, a = Math.floor(n * .2), b = Math.ceil(n * .8); let c = 0;
    for (let j = a; j < b; j++) if ((horiz ? lum(j, k) : lum(k, j)) > 150) c++;
    return c / (b - a);
  };
  // anda da borda para dentro: pula um eventual fundo escuro do scanner, atravessa a margem clara
  // e para no primeiro fio escuro contínuo (a moldura)
  const varre = (ini, passo, limite, horiz) => {
    let k = ini, viuClaro = false;
    for (let s = 0; s < limite; s++, k += passo) {
      if (!viuClaro) {
        if (claros(k, horiz) > .6) viuClaro = true;
        else if (s > limite * .4) return null;      // sem margem clara perto da borda: scan já rente, não arrisca
        continue;
      }
      if (escuros(k, horiz) > .45) return k;
    }
    return null;
  };
  const lh = Math.floor(h * .16), lw = Math.floor(w * .16);
  const topo = varre(0, 1, lh, true), base = varre(h - 1, -1, lh, true);
  const esq = varre(0, 1, lw, false), dir = varre(w - 1, -1, lw, false);
  if ([topo, base, esq, dir].some(v => v === null)) return null;
  const x0 = esq, y0 = topo, x1 = dir + 1, y1 = base + 1;
  if (x1 - x0 < w * .6 || y1 - y0 < h * .6) return null;     // detecção duvidosa: não mexe
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
function limpaScan(img) {
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  const c0 = document.createElement('canvas'); c0.width = w; c0.height = h;
  const g0 = c0.getContext('2d', { willReadFrequently: true }); g0.drawImage(img, 0, 0);
  let r;
  try { r = achaMoldura(g0.getImageData(0, 0, w, h).data, w, h); } catch (e) { r = null; }
  // sem moldura detectada: apara só 2% de cada lado (tira o fio sujo do corte sem comer a arte)
  if (!r) r = { x: Math.round(w * .02), y: Math.round(h * .02), w: Math.round(w * .96), h: Math.round(h * .96) };
  // tela final na proporção da carta 3D, com margem creme lisa
  const W = FW, H = FH, M = Math.round(W * .045);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.fillStyle = CREME; g.fillRect(0, 0, W, H);
  const esc = Math.min((W - 2 * M) / r.w, (H - 2 * M) / r.h);
  const dw = r.w * esc, dh = r.h * esc;
  g.imageSmoothingQuality = 'high';
  g.drawImage(c0, r.x, r.y, r.w, r.h, (W - dw) / 2, (H - dh) / 2, dw, dh);
  return c;
}

const cacheTex = {};
const loader = new THREE.ImageLoader(); loader.setCrossOrigin('anonymous');
export function texFrente(c) {
  // a frente desenhada traz o nome no idioma da consulta; a imagem real do Commons vale para os dois
  const ja = cacheTex[c.id];
  if (ja && (ja.real || ja.lingua === lingua())) return ja;
  const tex = texFrenteDesenhada(c); tex.lingua = lingua(); cacheTex[c.id] = tex;
  if (urls[c.id]) loader.load(urls[c.id], img => {
    const g = tex.image.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0);
    try { g.drawImage(limpaScan(img), 0, 0, FW, FH); }
    catch (e) { g.fillStyle = CREME; g.fillRect(0, 0, FW, FH); g.drawImage(img, 0, 0, FW, FH); }
    try { tex.urlLimpa = tex.image.toDataURL('image/jpeg', .9); } catch (e) { }
    tex.needsUpdate = true; tex.real = true; tex.url = urls[c.id];
  }, undefined, () => console.warn('sem imagem', c.pt_name));
  return tex;
}
export const urlImagem = c => cacheTex[c.id]?.urlLimpa || urls[c.id] || null;

// ---------- a carta ----------
const geoPlano = geoFace();
const matVerso = new THREE.MeshStandardMaterial({ map: texVerso, roughness: .55 });
const matBorda = new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: .8 });
const geoBorda = geoBloco(CW * .995, CH * .995, RAIO * .995).scale(1, ESP * .9, 1);

export class Carta {
  constructor(scene, dados = null) {
    this.g = new THREE.Group();            // posição e giro sobre a mesa
    this.vira = new THREE.Group();         // virada (gira em X)
    this.g.add(this.vira);
    const verso = new THREE.Mesh(geoPlano, matVerso); verso.rotation.x = -Math.PI / 2; verso.position.y = ESP / 2; verso.castShadow = true;
    this.vira.add(verso);
    this.borda = new THREE.Mesh(geoBorda, matBorda); this.vira.add(this.borda);
    this.frente = new THREE.Mesh(geoPlano, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .6 }));
    this.frente.rotation.x = Math.PI / 2; this.frente.position.y = -ESP / 2; this.vira.add(this.frente);
    this.g.userData.carta = this;
    scene.add(this.g); this.scene = scene;
    if (dados) this.define(dados);
  }
  define(c) { this.dados = c; this.frente.material.map = texFrente(c); this.frente.material.needsUpdate = true; }
  remove() { this.scene.remove(this.g); }
  // voo em arco até um ponto
  async voa(dest, { yaw = null, dur = 600, altura = .12 } = {}) {
    const p0 = this.g.position.clone(), y0 = this.g.rotation.y, y1 = yaw ?? y0; const t0 = performance.now();
    return new Promise(res => {
      const passo = () => {
        const k = Math.min(1, (performance.now() - t0) / dur), e = easeInOut(k);
        this.g.position.lerpVectors(p0, dest, e); this.g.position.y += Math.sin(Math.PI * k) * altura;
        this.g.rotation.y = y0 + (y1 - y0) * e;
        if (k < 1) requestAnimationFrame(passo); else res();
      };
      passo();
    });
  }
  // yFinal: altura em que a carta pousa depois de virada (acima de outra que ela cruze)
  async virar(dur = 700, yFinal = null) {
    const t0 = performance.now(), base = this.g.position.y, alvo = yFinal ?? base;
    return new Promise(res => {
      const passo = () => {
        const k = Math.min(1, (performance.now() - t0) / dur), e = easeInOut(k);
        this.g.position.y = base + (alvo - base) * e;
        // meia carta de altura + folga: de pé, ela não atravessa a mesa nem a carta vizinha
        this.vira.rotation.x = Math.PI * e; this.vira.position.y = Math.sin(Math.PI * k) * (CH / 2 + .015);
        if (k < 1) requestAnimationFrame(passo); else { this.vira.position.y = 0; this.aberta = true; res(); }
      };
      passo();
    });
  }
}

// ---------- o baralho sobre a mesa ----------
export class Baralho {
  constructor(scene) {
    this.scene = scene; this.n = 78;
    this.g = new THREE.Group(); this.g.position.copy(BARALHO); this.g.rotation.y = .15;
    this.corpo = new THREE.Mesh(geoBloco(CW, CH, RAIO), [matVerso, matBorda]);   // tampas com o verso, laterais lisas
    this.corpo.castShadow = true; this.g.add(this.corpo);
    this.ajusta(); scene.add(this.g);
    this.voando = [];
  }
  ajusta() { const h = Math.max(this.n, 1) * PASSO; this.corpo.scale.y = h; this.corpo.position.y = h / 2; this.corpo.visible = this.n > 0; }
  get topo() { return this.g.position.clone().add(V(0, this.n * PASSO + .001, 0)); }
  mostra(v) { this.g.visible = v; }

  // embaralhar: cartas saltam de um monte para o outro, sem parar, até mandarem parar
  comecaEmbaralhar() {
    this.embaralhando = true; const cartas = [];
    for (let i = 0; i < 8; i++) { const c = new Carta(this.scene); c.g.visible = false; cartas.push(c); }
    let i = 0;
    const loop = async () => {
      while (this.embaralhando) {
        const c = cartas[i++ % cartas.length]; c.g.visible = true;
        const lado = (i % 2 ? 1 : -1);
        c.g.position.copy(this.topo).add(V(lado * .07, 0, 0)); c.g.rotation.y = this.g.rotation.y + lado * .2;
        c.voa(this.topo.add(V(0, .002, 0)), { yaw: this.g.rotation.y, dur: 260, altura: .05 }).then(() => { c.g.visible = false; });
        await sleep(95);
      }
      cartas.forEach(c => c.remove());
    };
    loop();
  }
  paraEmbaralhar() { this.embaralhando = false; }
}

// ---------- leque para o corte ----------
export class Leque {
  constructor(scene, camera, dom) {
    this.scene = scene; this.camera = camera; this.dom = dom;
    this.cartas = []; this.corte = 39; this.g = new THREE.Group(); scene.add(this.g);
    const centro = V(0, MESA_Y, .38), R = .40;
    for (let i = 0; i < 78; i++) {
      const a = THREE.MathUtils.degToRad(-58 + 116 * i / 77);
      const m = new THREE.Mesh(geoPlano, matVerso.clone());
      m.rotation.x = -Math.PI / 2;
      const h = new THREE.Group(); h.add(m);
      h.position.set(centro.x + Math.sin(a) * R, MESA_Y + .001 + i * .0004, centro.z - Math.cos(a) * R);
      h.rotation.y = -a; h.userData.i = i; m.userData.i = i;
      this.g.add(h); this.cartas.push(h);
    }
    this.ray = new THREE.Raycaster(); this.ptr = new THREE.Vector2();
    this.marca();
    this.onPtr = e => {
      if (e.type === 'pointermove' && !e.buttons && e.pointerType !== 'mouse') return;
      const r = dom.getBoundingClientRect();
      this.ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.ray.setFromCamera(this.ptr, camera);
      const hit = this.ray.intersectObjects(this.cartas.map(h => h.children[0]))[0];
      if (hit) { this.corte = Math.max(1, Math.min(77, hit.object.userData.i + 1)); this.marca(); this.aoMudar?.(this.corte); if (e.type === 'pointerdown') this.aoTocar?.(this.corte); }
    };
    dom.addEventListener('pointermove', this.onPtr); dom.addEventListener('pointerdown', this.onPtr);
  }
  define(n) { this.corte = Math.max(1, Math.min(77, n)); this.marca(); this.aoMudar?.(this.corte); }
  marca() {
    this.cartas.forEach((h, i) => {
      const m = h.children[0], em = i < this.corte;
      m.position.y = em ? .004 : 0; m.position.z = em ? -.012 : 0;
      m.material.emissive = new THREE.Color(em ? 0x3a2408 : 0x000000);
      m.material.emissiveIntensity = em ? 1 : 0;
    });
  }
  async recolhe() {
    this.dom.removeEventListener('pointermove', this.onPtr); this.dom.removeEventListener('pointerdown', this.onPtr);
    const t0 = performance.now(), ini = this.cartas.map(h => ({ p: h.position.clone(), y: h.rotation.y }));
    await new Promise(res => {
      const passo = () => {
        const k = Math.min(1, (performance.now() - t0) / 700), e = easeInOut(k);
        this.cartas.forEach((h, i) => { h.position.lerpVectors(ini[i].p, BARALHO.clone().add(V(0, i * PASSO, 0)), e); h.rotation.y = ini[i].y + (.15 - ini[i].y) * e; });
        if (k < 1) requestAnimationFrame(passo); else res();
      };
      passo();
    });
    this.scene.remove(this.g);
  }
}

// brilho dourado sob a carta em destaque
export function criaAura(scene) {
  const tex = texCanvas(128, 128, (g, w, h) => {
    const rg = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    rg.addColorStop(0, 'rgba(255,210,120,.9)'); rg.addColorStop(.5, 'rgba(255,170,60,.35)'); rg.addColorStop(1, 'rgba(255,140,40,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(CW * 2.6, CH * 1.9), new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m);
  return m;
}
