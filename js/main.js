// A Tenda de Zaira em 3D: o Maestro conduz a consulta (a mesma dramaturgia da Tenda 2D),
// agora com a cena em Three.js, a Zaira em VRM, voz, microfone e webcam.
import * as THREE from 'three';
import { criaCena, MESA_Y } from './cena.js';
import { carregaZaira } from './zaira.js';
import { Carta, Baralho, Leque, LUGAR, BARALHO, CH, resolveImagens, texFrente, urlImagem, criaAura } from './cartas.js';
import { MotorV2 } from './motor.js';
import * as PT from './textos.js';
import * as EN from './textos_en.js';
import { pick } from './textos.js';
import { t, lingua, ehIngles, defineLingua, linguaSalva, linguaDoNavegador, aplica, aoMudarLingua, nomeCarta, descCarta, sentidoCarta } from './i18n.js';
import { Voz, Ouvido, contem, norma } from './voz.js';
import { Olhos } from './olhos.js';

const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// as falas e palavras da Zaira no idioma escolhido
const TX = () => (ehIngles() ? EN : PT);
const W = k => TX().PALAVRAS[k];

// ---------- cena ----------
const cena = criaCena($('#mundo'));
cena.olhar('porta', 100);
let zaira = null, CARTAS = [];
const aura = criaAura(cena.scene);
const timer = new THREE.Timer(); let tempo = 0;
const veu = document.getElementById('veu');
const veuAberto = () => !veu.classList.contains('some');
function quadro() {
  timer.update(); const dt = Math.min(timer.getDelta(), .05); tempo += dt;
  if (Olhos.ligado && Olhos.presente) cena.rig.paralaxe.set((Olhos.x - .5) * 2, -(Olhos.y - .5) * 2); else cena.rig.paralaxe.set(0, 0);
  // com a cortina de entrada fechada, a cena não aparece: não gasta bateria desenhando
  if (!veuAberto()) {
    cena.atualiza(dt, tempo);
    if (zaira) zaira.atualiza(dt, cena.camera);
    if (aura.visible) aura.material.opacity = .75 + .25 * Math.sin(tempo * 3);
    cena.renderer.render(cena.scene, cena.camera);
  }
  requestAnimationFrame(quadro);
}
quadro();

// ---------- carregamento ----------
const btnEntrar = $('#entrar');
if (!Ouvido.existe) { $('#querMic').checked = false; $('#querMic').disabled = true; $('#optMic').classList.add('indisponivel'); $('#optMic span').dataset.i18n = 'micIndisp'; }
if (!navigator.mediaDevices?.getUserMedia) { $('#querCam').checked = false; $('#querCam').disabled = true; $('#optCam').classList.add('indisponivel'); }
(async () => {
  try {
    const [dados] = await Promise.all([
      fetch('./data/cartas.json').then(r => r.json()),
      fetch('./data/interpretacoes.json').then(r => r.json()).then(PT.defineInterpretacoes).catch(e => console.warn('sem interpretações', e)),
      fetch('./data/interpretacoes_en.json').then(r => r.json()).then(EN.defineInterpretacoes).catch(e => console.warn('sem interpretações em inglês', e)),
      carregaZaira(cena, './modelo/zaira.vrm', p => { carga = p; $('#carga i').style.width = (p * 100).toFixed(0) + '%'; $('#cargaTxt').textContent = t('chegando', (p * 100).toFixed(0)); }).then(z => { zaira = z; })
    ]);
    CARTAS = dados;
    resolveImagens(CARTAS).then(n => console.log('imagens do Commons:', n));
    $('#carga i').style.width = '100%'; $('#cargaTxt').textContent = ''; carga = 1;
    btnEntrar.disabled = false; rotuloEntrar = 'entrar'; btnEntrar.textContent = t(rotuloEntrar);
    window.PRONTO = true;
  } catch (e) {
    console.error(e); falhaCarga = e.message; $('#cargaTxt').textContent = t('falhaCarga', e.message);
  }
})();

// ---------- idioma ----------
// a escolha aparece no início; ?lang=en (ou pt) no endereço pula a escolha
let rotuloEntrar = 'preparando', carga = 0, falhaCarga = '';
aoMudarLingua(() => {
  btnEntrar.textContent = t(rotuloEntrar);
  $('#cargaTxt').textContent = falhaCarga ? t('falhaCarga', falhaCarga) : carga > 0 && carga < 1 ? t('chegando', (carga * 100).toFixed(0)) : '';
  if (fechada) $('#veu .sub').textContent = t('fechou');
});
let fechada = false;
function mostraEntrada(l) {
  defineLingua(l);
  $('#idioma').hidden = true; $('#entrada').hidden = false;
  (btnEntrar.disabled ? $('#trocaLingua') : btnEntrar).focus({ preventScroll: true });
}
document.querySelectorAll('.lingua').forEach(b => b.addEventListener('click', () => mostraEntrada(b.dataset.lingua)));
$('#trocaLingua').addEventListener('click', () => defineLingua(ehIngles() ? 'pt' : 'en'));
{
  const salva = linguaSalva(), sugerida = salva || linguaDoNavegador();
  const viaEndereco = new URLSearchParams(location.search).has('lang');
  if (viaEndereco && salva) mostraEntrada(salva);
  else {
    defineLingua(sugerida);   // os textos já ficam prontos no idioma provável
    const b = document.querySelector(`.lingua[data-lingua="${sugerida}"]`); b?.classList.add('sugerida'); b?.focus({ preventScroll: true });
  }
}

// ---------- som ambiente ----------
let ac = null, master = null, somOn = true;
function iniciaSom() {
  if (ac) return; try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  master = ac.createGain(); master.gain.value = somOn ? .5 : 0; master.connect(ac.destination);
  const len = ac.sampleRate * 4, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0); let last = 0;
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.2 + (Math.random() < .0006 ? Math.random() * .8 : 0); }
  const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
  const g = ac.createGain(); g.gain.value = .12; src.connect(lp).connect(g).connect(master); src.start();
  [[55, .05], [82.4, .03], [110.5, .018]].forEach(([f, v]) => {
    const o = ac.createOscillator(); o.frequency.value = f; const og = ac.createGain(); og.gain.value = v;
    const l = ac.createOscillator(); l.frequency.value = .07 + Math.random() * .05; const lg = ac.createGain(); lg.gain.value = v * .6; l.connect(lg).connect(og.gain); l.start(); o.connect(og).connect(master); o.start();
  });
}
function sino(f = 660) { if (!ac || !somOn) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, ac.currentTime); g.gain.linearRampToValueAtTime(.16, ac.currentTime + .01); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + 2.2); o.connect(g).connect(master); o.start(); o.stop(ac.currentTime + 2.3); }
function sopro() {
  if (!ac || !somOn) return; const b = ac.createBuffer(1, ac.sampleRate * 1.6, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / d.length);
  const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(300, ac.currentTime); f.frequency.exponentialRampToValueAtTime(2400, ac.currentTime + 1.4); const g = ac.createGain(); g.gain.value = .35; s.connect(f).connect(g).connect(master); s.start();
}
function carteado() { if (!ac || !somOn) return; const b = ac.createBuffer(1, ac.sampleRate * .08, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3); const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1800; const g = ac.createGain(); g.gain.value = .25; s.connect(f).connect(g).connect(master); s.start(); }

// ---------- HUD ----------
function marca(el, v) { el.setAttribute('aria-pressed', v); }
$('#tVoz').onclick = () => { Voz.ligada = !Voz.ligada; marca($('#tVoz'), Voz.ligada); if (!Voz.ligada) Voz.cala(); };
$('#tSom').onclick = () => { somOn = !somOn; marca($('#tSom'), somOn); if (master) master.gain.value = somOn ? .5 : 0; };
$('#tMic').onclick = () => { if (Ouvido.ligado) { Ouvido.desliga(); marca($('#tMic'), false); $('#tMic').classList.remove('escutando'); } else ligaMic(); };
$('#tCam').onclick = () => { if (Olhos.ligado) { Olhos.desliga(); marca($('#tCam'), false); $('#espelho').classList.remove('on'); } else ligaCam(); };
const msgMic = e => t('mic')[e];
const DIAG = window.__diag = [];
function avisa(chave, texto) { DIAG.push(chave); console.warn('diagnóstico:', chave); ouvi(texto, false, 15000); }
function desmarcaMic() { marca($('#tMic'), false); $('#tMic').classList.remove('escutando'); }
function ligaMic() {
  if (!Ouvido.existe) { avisa('mic:inexistente', t('micInexistente')); return; }
  Ouvido.aoNegar = err => { desmarcaMic(); avisa('mic:' + err, msgMic(err)); };
  Ouvido.aoErro = err => { avisa('mic:' + err, msgMic(err) || t('micErro', err)); if (err === 'network' || err === 'audio-capture' || err === 'language-not-supported') { Ouvido.desliga(); desmarcaMic(); } };
  if (Ouvido.liga()) {
    marca($('#tMic'), true); $('#tMic').classList.add('escutando');
    // se em 8 s o reconhecedor nunca começou a ouvir, avisa
    setTimeout(() => { if (Ouvido.ligado && !Ouvido.respondeu) { avisa('mic:mudo', msgMic('mudo')); Ouvido.desliga(); desmarcaMic(); } }, 8000);
  }
}
const msgCam = e => t('cam')[e];
async function ligaCam(stream) {
  try {
    marca($('#tCam'), true); $('#espelho').classList.add('on');
    await Olhos.liga($('#espelho'), stream);
  } catch (e) {
    console.warn(e); marca($('#tCam'), false); $('#espelho').classList.remove('on'); Olhos.desliga();
    const etapa = Olhos.etapa;
    const texto = msgCam(e.name) || (etapa === 'modelo' ? t('camModelo') : etapa === 'video' ? t('camVideo') : t('camOutro', e.name || e.message));
    avisa('cam:' + etapa + ':' + (e.name || 'erro'), texto);
  }
}
// pede microfone e câmera numa só permissão, um depois do outro, para não disputarem o aparelho (no celular isso falhava)
async function ligaSensores() {
  const querMic = $('#querMic').checked && Ouvido.existe, querCam = $('#querCam').checked && !!navigator.mediaDevices?.getUserMedia;
  let stream = null;
  if (navigator.mediaDevices?.getUserMedia && (querMic || querCam)) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: querMic, video: querCam ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false });
    } catch (e) {
      console.warn('permissão conjunta:', e);
      if (querMic && querCam) { try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }); } catch (e2) { avisa('cam:permissao:' + e2.name, msgCam(e2.name) || t('camFalhou')); } }
      else if (querCam) avisa('cam:permissao:' + e.name, msgCam(e.name) || t('camFalhou'));
    }
  }
  // o reconhecimento de fala abre o microfone por conta própria: solta o nosso para não ocupá-lo
  stream?.getAudioTracks().forEach(t => t.stop());
  const video = stream?.getVideoTracks().length ? new MediaStream(stream.getVideoTracks()) : null;
  // o microfone não espera a câmera terminar de carregar o reconhecimento de rosto
  if (querMic) ligaMic();
  if (querCam && video) await ligaCam(video);
}
let ouviTimer = 0;
function ouvi(t, html = false, ms = 5000) { const el = $('#ouvi'); if (html) el.innerHTML = t; else el.textContent = t; clearTimeout(ouviTimer); ouviTimer = setTimeout(() => el.textContent = '', ms); }
Ouvido.ouve((alts, fim) => { if (alts[0]) ouvi(t('ouvi', esc(alts[0])) + (fim ? '' : '…'), true); });

// ---------- fala da Zaira ----------
let pulaDigitar = null;
$('#fala').addEventListener('click', () => { pulaDigitar?.(); });
async function diz(texto, { pausa = 350 } = {}) {
  const el = $('#fala'); el.innerHTML = '<span class="quem">ZAIRA</span><span class="txt"></span>'; const tx = el.querySelector('.txt');
  Ouvido.pausa(); zaira?.falar(texto);
  const voz = Voz.fala(texto, i => zaira?.palavra(i));
  let pula = false; pulaDigitar = () => { pula = true; Voz.cala(); };
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (let i = 0; i < texto.length && !pula && !calmo; i++) {
    tx.textContent = texto.slice(0, i + 1);
    const ch = texto[i]; await sleep(/[.!?…]/.test(ch) ? 240 : /[,;:]/.test(ch) ? 110 : 22);
  }
  tx.textContent = texto; pulaDigitar = null;
  if (Voz.ligada && !pula) await voz;
  zaira?.calar(); Ouvido.retoma();
  await sleep(pausa);
}
function limpaUI() { $('#ui').innerHTML = ''; }
function ato(t) { $('#ato').textContent = t; }

// escolha por botão, voz ou gesto de cabeça
function escolhe(opcoes, { dica = '' } = {}) {
  return new Promise(res => {
    const box = document.createElement('div'); box.style.display = 'contents';
    let feito = false; const fim = v => { if (feito) return; feito = true; limpaUI(); offV(); offO(); Voz.cala(); res(v); };
    if (dica) { const d = document.createElement('span'); d.className = 'dica'; d.innerHTML = dica; box.appendChild(d); }
    for (const o of opcoes) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (o.fantasma ? ' fantasma' : '');
      b.textContent = o.label; b.onclick = () => fim(o.v); box.appendChild(b);
    }
    limpaUI(); $('#ui').appendChild(box); box.querySelector('button')?.focus({ preventScroll: true });
    const offV = Ouvido.ouve((alts, final) => {
      for (const o of opcoes) if (o.fala && (final || o.rapido) && contem(alts, o.fala)) { sino(880); fim(o.v); return; }
      // ouviu algo que não é nenhuma das opções: diz o que ouviu e o que pode ser dito
      if (final) { const ex = opcoes.filter(o => o.fala).map(o => '"' + o.fala[0] + '"'); if (ex.length) ouvi(t('naoEntendi', esc(alts[0]), ex), true, 6000); }
    });
    const offO = Olhos.ouve(ev => { for (const o of opcoes) if (o.gesto === ev) { sino(880); ouvi(ev === 'sim' ? t('viSim') : t('viNao')); fim(o.v); return; } });
  });
}

// texto por teclado ou voz
function pedeTexto(placeholder, ok, pular, limpa = s => s) {
  return new Promise(res => {
    limpaUI(); const f = document.createElement('form');
    f.innerHTML = `<input autocomplete="off" maxlength="140" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}"><button class="btn" type="submit">${esc(ok)}</button>` + (pular ? `<button class="btn fantasma" type="button">${esc(pular)}</button>` : '');
    const inp = f.querySelector('input'); let feito = false, auto = 0;
    const fim = v => { if (feito) return; feito = true; clearTimeout(auto); off(); limpaUI(); res(v); };
    f.addEventListener('submit', e => { e.preventDefault(); const v = inp.value.trim(); if (!v && !pular) { inp.focus(); return; } fim(v); });
    inp.addEventListener('input', () => clearTimeout(auto));
    if (pular) f.querySelector('.fantasma').onclick = () => fim('');
    const off = Ouvido.ouve((alts, final) => {
      if (pular && final && contem(alts, W('guardar'))) { fim(''); return; }
      const t = limpa(alts[0]); if (!t) return;
      inp.value = t;
      if (final) { clearTimeout(auto); auto = setTimeout(() => fim(inp.value.trim()), 1100); }
    });
    $('#ui').appendChild(f); if (!matchMedia('(pointer: coarse)').matches) inp.focus({ preventScroll: true });
  });
}
const limpaNome = s => TX().limpaNome(s);

// ---------- detalhe da carta ----------
function mostraDetalhe(tt) {
  const c = tt.card, u = urlImagem(c) || texFrente(c).image?.toDataURL?.() || '';
  $('#detalhe').innerHTML = `<div class="fig"><img src="${u}" alt="${esc(nomeCarta(c))}" class="${tt.rev ? 'inv' : ''}" crossorigin="anonymous">
    <div><h3>${esc(nomeCarta(c))}${tt.rev ? ` <small style="font-size:.6em;color:var(--fumo)">(${t('invertida')})</small>` : ''}</h3><div class="pos">${t('casa', tt.pos)} · ${esc(TX().POS[tt.pos].t)}</div></div></div>
    <dl><dt>${t('figura')}</dt><dd>${esc(descCarta(c))}</dd><dt>${tt.rev ? t('naInvertida') : t('geral')}</dt><dd>${esc(sentidoCarta(c, tt.rev))}</dd></dl>
`;
  $('#detalhe').classList.add('on');
}
function escondeDetalhe() { $('#detalhe').classList.remove('on'); }

// ---------- mesa ----------
const S = { nome: '', pergunta: '', tiragem: [], cartas3d: [] };
let baralho = null;
function limpaMesa() {
  S.cartas3d.forEach(c => c.remove()); S.cartas3d = [];
  if (baralho) cena.scene.remove(baralho.g); baralho = null; aura.visible = false;
}
function lugarCarta(p) { const l = LUGAR[p]; return V(l.x, MESA_Y + (l.cruz ? .004 : .001), l.z); }
// a carta que acaba de ser virada fica por cima de qualquer outra que ela cruze
// (a casa 1 cobre a casa 2 quando abre; depois a casa 2, ao abrir, cobre a casa 1)
function alturaAoVirar(c) {
  const p = c.g.position; let topo = null;
  for (const o of S.cartas3d) {
    if (o === c) continue;
    const q = o.g.position; if (Math.hypot(q.x - p.x, q.z - p.z) < CH * .9) topo = Math.max(topo ?? -1, q.y);
  }
  return topo !== null && topo >= p.y ? topo + .0012 : p.y;
}
function focaCarta(p) { const pos = lugarCarta(p); cena.olharPara(pos.clone().add(V(-.02, .40, .34)), pos.clone().add(V(0, 0, -.03)), 1.4); }

// eventos da câmera durante a leitura
let sorriuPendente = false, saiuPendente = false;
Olhos.ouve(ev => { if (ev === 'sorriso') sorriuPendente = true; if (ev === 'saiu') saiuPendente = true; if (ev === 'chegou') saiuPendente = false; });
async function reageCamera() {
  if (saiuPendente && Olhos.ligado) {
    await diz(pick(TX().REACAO.ausente));
    const t0 = performance.now(); while (!Olhos.presente && performance.now() - t0 < 12000) await sleep(200);
    saiuPendente = false;
  }
  if (sorriuPendente && !S.sorriu) { sorriuPendente = false; S.sorriu = true; zaira.expressao = 'happy'; await diz(pick(TX().REACAO.sorriso)); zaira.expressao = null; }
}


// ---------- o Maestro ----------
const Maestro = {
  async ENTRADA() { cena.olhar('rosto', .6); await sleep(1800); return 'CONVITE'; },
  async CONVITE() {
    limpaMesa(); escondeDetalhe(); ato(''); zaira.aparece(); zaira.expressao = null; S.sorriu = false;
    cena.olhar('rosto', 1);
    if (Olhos.ligado && !Olhos.presente) {
      const t0 = performance.now(); while (!Olhos.presente && performance.now() - t0 < 5000) await sleep(150);
      if (!Olhos.presente) await diz(TX().FALA.chegue);
      const t1 = performance.now(); while (!Olhos.presente && performance.now() - t1 < 6000) await sleep(150);
    }
    zaira.expressao = 'happy';
    await diz(TX().FALA.boasVindas());
    zaira.expressao = null;
    await diz(TX().FALA.apresenta);
    const v = await escolhe([{ label: t('sim'), v: true, fala: W('sim'), gesto: 'sim' }, { label: t('naoHoje'), v: false, fantasma: true, fala: W('nao'), gesto: 'nao' }]);
    return v ? 'NOME' : 'RECUSA';
  },
  async RECUSA() { zaira.expressao = 'sad'; await diz(TX().FALA.recusa); zaira.expressao = null; return 'DESAPARECER'; },
  async NOME() {
    await diz(TX().FALA.pedeNome);
    S.nome = (await pedeTexto(t('seuNome'), t('dizer'), null, limpaNome)).replace(/\s+/g, ' ').slice(0, 40) || t('viajante');
    zaira.expressao = 'relaxed';
    await diz(TX().FALA.nomeBonito(S.nome));
    S.pergunta = await pedeTexto(t('suaPergunta'), t('perguntar'), t('guardar'), s => s.charAt(0).toUpperCase() + s.slice(1));
    return 'EMBARALHAR';
  },
  async EMBARALHAR() {
    const sem = MotorV2.semente(S.nome, new Date());
    MotorV2.s = sem.estado; S.baralho = MotorV2.novoBaralho(); S.passadas = 0;
    S.sorteio = { letras: (S.nome.toUpperCase() + '   ').slice(0, 3), cs: sem.cs, estado: sem.estado };
    baralho = new Baralho(cena.scene);
    cena.olharPara(V(0, 1.28, .62), V(.05, .86, -.45), 1.2);
    zaira.baralhoPos = baralho.topo; zaira.embaralhando = true; zaira.inclina = 1; zaira.olharMesa = BARALHO.clone();
    baralho.comecaEmbaralhar();
    const ritmo = setInterval(() => { MotorV2.embaralha(S.baralho); S.passadas++; carteado(); }, 110);
    await diz(TX().FALA.embaralha, { pausa: 0 });
    zaira.olharMesa = null;
    while (S.passadas < 3) await sleep(60);
    await escolhe([{ label: t('parar'), v: 1, fala: W('pare'), rapido: true }], { dica: Ouvido.ligado ? t('digaPare') : '' });
    clearInterval(ritmo); baralho.paraEmbaralhar(); zaira.embaralhando = false; zaira.inclina = 0;
    zaira.maoRepouso('left'); zaira.maoRepouso('right'); sino(440);
    return 'CORTE';
  },
  async CORTE() {
    baralho.mostra(false);
    const leque = new Leque(cena.scene, cena.camera, $('#mundo'));
    cena.olhar('corte', 1.2);
    const atualiza = n => { const b = $('#corteN'); if (b) b.textContent = n; };
    leque.aoMudar = atualiza;
    await diz(TX().FALA.abreCorte, { pausa: 0 });
    limpaUI(); $('#fala').innerHTML = '';
    const box = document.createElement('div'); box.style.display = 'contents';
    box.innerHTML = `<button class="btn redondo fantasma" type="button" aria-label="${esc(t('corteEsq'))}">◀</button><span class="dica">${t('cortePara', leque.corte)}</span><button class="btn redondo fantasma" type="button" aria-label="${esc(t('corteDir'))}">▶</button><button class="btn" type="button">${esc(t('cortarAqui'))}</button>`;
    $('#ui').appendChild(box);
    const [menos, mais, cortar] = box.querySelectorAll('button');
    menos.onclick = () => leque.define(leque.corte - 1); mais.onclick = () => leque.define(leque.corte + 1);
    const teclas = e => { if (e.key === 'ArrowLeft') leque.define(leque.corte - 1); if (e.key === 'ArrowRight') leque.define(leque.corte + 1); };
    addEventListener('keydown', teclas);
    await new Promise(res => {
      let feito = false;
      const acaba = (atraso = 0) => { if (feito) return; feito = true; off(); setTimeout(res, atraso); };
      cortar.onclick = () => acaba(); cortar.focus({ preventScroll: true });
      const off = Ouvido.ouve((alts, final) => {
        if (!final) return;
        const n = TX().numeroFalado(alts[0]);
        if (n && n >= 1 && n <= 77) { leque.define(n); if (contem(alts, W('cortaNumero'))) acaba(900); }
        else if (contem(alts, W('cortaJa'))) acaba();
        else if (contem(alts, W('esquerda'))) leque.define(leque.corte - 3);
        else if (contem(alts, W('direita'))) leque.define(leque.corte + 3);
      });
    });
    removeEventListener('keydown', teclas); limpaUI();
    S.corte = leque.corte; S.baralho = MotorV2.corta(S.baralho, S.corte); sino(520);
    await leque.recolhe(); baralho.mostra(true);
    await diz(TX().FALA.cortou(S.corte));
    return 'TIRAGEM';
  },
  async TIRAGEM() {
    S.tiragem = MotorV2.tira(S.baralho).map(t => ({ pos: t.pos, card: CARTAS[t.id - 1], rev: t.inv > 0 }));
    S.tiragem.forEach(t => texFrente(t.card));   // já começa a carregar as imagens
    cena.olhar('mesa', 1.1);
    const fala = diz(TX().FALA.distribui, { pausa: 0 });
    for (const t of S.tiragem) {
      const c = new Carta(cena.scene, t.card); S.cartas3d.push(c); t.c3d = c;
      c.g.position.copy(baralho.topo); c.g.rotation.y = baralho.g.rotation.y;
      baralho.n--; baralho.ajusta();
      const destino = lugarCarta(t.pos);
      const lado = zaira.ladoPara(destino.x < -.05 ? -1 : 1);
      zaira.maoPara(lado, baralho.topo.add(V(0, .028, 0)), .25);      // palma sobre o monte
      await sleep(180); carteado();
      zaira.maoPara(lado, destino.clone().add(V(0, .03, -.06)), .5);   // acompanha a carta até a casa
      const yaw = (LUGAR[t.pos].cruz ? Math.PI / 2 : 0) + (t.rev ? Math.PI : 0);
      await c.voa(destino, { yaw, dur: 520 });
      sino(300 + t.pos * 30);
      zaira.maoRepouso(lado);
    }
    await fala; await sleep(600);
    return 'LEITURA';
  },
  async LEITURA() {
    const X = TX(); S.leitura = X.temaDaLeitura(S.pergunta, S.tiragem); const usadas = new Set();
    for (const a of X.ACTS) {
      if (a.pausa) { aura.visible = false; escondeDetalhe(); cena.olhar('rosto', 1.2); sino(330); await sleep(1600); }   // a parada entre a casa 6 e a 7
      ato(a.name); cena.olhar('rosto', 2); await diz(pick(a.open));
      if (a.futuro) await diz(X.anunciaTema(S.leitura));
      for (const p of a.pos) {
        await reageCamera();
        const ct = S.tiragem[p - 1];
        focaCarta(p);
        const pos = lugarCarta(p); aura.position.copy(pos).add(V(0, -.0005, 0)); aura.rotation.z = LUGAR[p].cruz ? Math.PI / 2 : 0; aura.visible = true;
        zaira.olharMesa = pos;
        const lado = await zaira.alcanca(pos, 420);
        sino(ct.card.arcana === 'major' ? 392 : 587);
        zaira.maoRepouso(lado);                       // a mão se recolhe enquanto a carta gira
        await ct.c3d.virar(700, alturaAoVirar(ct.c3d)); zaira.olharMesa = null;
        mostraDetalhe(ct);
        await diz(X.cardIntro(ct, S.nome));
        // no futuro: um comentário pelo fio do tema; a casa 10 guarda a revelação para o fim
        if (p >= 6 && p <= 9) { const c = X.comentarioFuturo(ct, S.leitura.tema, usadas); if (c) await diz(c); }
        if (p === 10) await diz(X.guardaCulminancia(S.leitura.tema));
        await escolhe([{ label: p === 10 ? t('continuar') : t('proxima'), v: 1, fala: W('segue'), gesto: 'sim' }]);
      }
    }
    aura.visible = false; escondeDetalhe();
    return 'SINTESE';
  },
  async SINTESE() {
    ato(t('sintese')); cena.olhar('rosto', 2);
    await diz(TX().synthesis(S.tiragem, S.nome, S.pergunta, S.leitura));
    await escolhe([{ label: t('agradeco'), v: 1, fala: W('obrigado'), gesto: 'sim' }]);
    return 'DESPEDIDA';
  },
  async DESPEDIDA() {
    ato(''); zaira.expressao = 'happy';
    await diz(TX().FALA.despedida(S.nome));
    await diz(TX().FALA.fumaca);
    zaira.expressao = null;
    return 'DESAPARECER';
  },
  async DESAPARECER() {
    sopro(); const p = zaira.vrm.scene.position.clone().add(V(0, .5, .1));
    cena.soltaFumaca(p, 60, 3, 0xb89ab8); cena.escuro = 1;
    await sleep(700); zaira.some(); await sleep(1300); cena.escuro = 0;
    $('#fala').innerHTML = `<span class="txt" style="font-style:italic;color:var(--fumo)">${esc(t('cadeiraVazia'))}</span>`;
    const opcoes = [{ label: t('nova'), v: 'VOLTA', fala: W('nova') }];
    if (S.tiragem.length) opcoes.push({ label: t('rever'), v: 'REVER', fantasma: true, fala: W('rever') });
    opcoes.push({ label: t('finalizar'), v: 'FINALIZAR', fantasma: true, fala: W('finalizar') });
    return await escolhe(opcoes);
  },
  async VOLTA() {
    const p = zaira.vrm.scene.position.clone().add(V(0, .5, .1)); sopro(); cena.soltaFumaca(p, 50, 3, 0xb89ab8);
    await sleep(600); zaira.aparece(); S.tiragem = []; limpaMesa();
    return 'CONVITE';
  },
  async REVER() {
    ato(t('tiragem')); cena.olhar('mesa', 1);
    $('#fala').innerHTML = `<span class="txt" style="font-size:.85em;color:var(--fumo)">${esc(t('reverDica'))}</span>` +
      `<div id="sorteio">${t('sorteio', esc(S.sorteio.letras), S.sorteio.cs, S.sorteio.estado, S.passadas, S.corte)}<br>${t('noBasic')}: tarotsrt V2 ${S.sorteio.estado} ${S.passadas} ${S.corte}</div>`;
    const mostra = p => { const t = S.tiragem[p - 1]; mostraDetalhe(t); const pos = lugarCarta(p); aura.position.copy(pos); aura.rotation.z = LUGAR[p].cruz ? Math.PI / 2 : 0; aura.visible = true; };
    mostra(1);
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), dom = $('#mundo');
    const toque = e => {
      const r = dom.getBoundingClientRect(); ptr.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
      ray.setFromCamera(ptr, cena.camera);
      const hit = ray.intersectObjects(S.cartas3d.map(c => c.g), true)[0];
      if (hit) { let o = hit.object; while (o && !o.userData.carta) o = o.parent; const i = S.cartas3d.indexOf(o?.userData.carta); if (i >= 0) mostra(i + 1); }
    };
    dom.addEventListener('pointerdown', toque);
    const off = Ouvido.ouve((alts, final) => { if (!final) return; const n = TX().numeroFalado(alts[0]); if (n >= 1 && n <= 10) mostra(n); });
    const v = await escolhe([{ label: t('nova'), v: 'VOLTA', fala: W('nova') }, { label: t('finalizar'), v: 'FINALIZAR', fantasma: true, fala: W('finalizar') }]);
    dom.removeEventListener('pointerdown', toque); off(); escondeDetalhe(); aura.visible = false;
    return v;
  },
  async FINALIZAR() {
    Voz.cala(); if (master && ac) master.gain.setTargetAtTime(0, ac.currentTime, .4);
    limpaMesa(); escondeDetalhe(); ato(''); $('#fala').textContent = ''; limpaUI();
    Ouvido.desliga(); Olhos.desliga(); marca($('#tMic'), false); marca($('#tCam'), false); $('#tMic').classList.remove('escutando'); $('#espelho').classList.remove('on');
    cena.olhar('porta', .6);
    const v = $('#veu'); fechada = true; v.querySelector('.sub').textContent = t('fechou');
    rotuloEntrar = 'voltar'; btnEntrar.textContent = t(rotuloEntrar); v.classList.remove('some');
    return null;
  }
};
async function roda(estado) { while (estado) { window.ESTADO = estado; estado = await Maestro[estado](); } }

btnEntrar.addEventListener('click', async () => {
  fechada = false;
  iniciaSom(); if (ac?.state === 'suspended') ac.resume();
  if (master && ac) master.gain.setTargetAtTime(somOn ? .5 : 0, ac.currentTime, .3);
  if (Voz.ligada && 'speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); }
  $('#veu').classList.add('some');
  ligaSensores();
  zaira.aparece(); S.tiragem = [];
  roda('ENTRADA');
});

// para testes automáticos
window.__zaira = { Maestro, S, cena, get zaira() { return zaira; }, Olhos, Ouvido, MotorV2 };
