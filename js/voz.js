// Voz da Zaira (síntese do navegador) e ouvido (reconhecimento de fala do navegador), em português ou inglês.
// Nada é gravado: o áudio do microfone é tratado pelo próprio navegador.
import { etiqueta, aoMudarLingua } from './i18n.js';

export const Voz = {
  ligada: true, voz: null,
  // a voz feminina mais próxima do idioma escolhido
  escolhe() {
    const vs = speechSynthesis.getVoices();
    if (etiqueta() === 'en-US') {
      const en = vs.filter(v => /^en/i.test(v.lang));
      const fem = /female|samantha|zira|jenny|aria|ava|allison|susan|karen|moira|tessa|serena|victoria|libby|sonia|hazel|natasha|fiona|kate|emma/i;
      this.voz = en.find(v => /en[-_](US|GB)/i.test(v.lang) && fem.test(v.name)) || en.find(v => fem.test(v.name))
        || en.find(v => /en[-_]US/i.test(v.lang)) || en[0] || null;
    } else {
      this.voz = vs.find(v => /pt[-_]BR/i.test(v.lang) && /female|luciana|francisca|maria|vit|thalita|leticia/i.test(v.name))
        || vs.find(v => /pt[-_]BR/i.test(v.lang)) || vs.find(v => /^pt/i.test(v.lang)) || null;
    }
  },
  // Fala frase a frase: cada frase ganha a sua entonação (a síntese do navegador lê um bloco longo
  // numa melodia só, e as perguntas saíam como afirmações). Também evita o corte do Chrome em falas longas.
  RATE: .95 * 1.05,   // 5% mais rápida que a voz original (.95)
  PITCH: 1.08,
  frases(texto) {
    const limpo = texto.replace(/[“”"]/g, '');
    const out = []; const re = /[^.!?…]+(?:\.\.\.|[.!?…]+)?["”]?\s*/g; let m;
    while ((m = re.exec(limpo))) { if (m[0].trim()) out.push({ t: m[0].trim(), i: m.index }); if (re.lastIndex >= limpo.length) break; }
    return out.length ? out : [{ t: limpo, i: 0 }];
  },
  prosodia(f) {
    const t = f.trim();
    if (/\?$/.test(t)) return { pitch: this.PITCH * 1.12, rate: this.RATE * .97, pausa: 260 };        // pergunta: sobe
    if (/!$/.test(t)) return { pitch: this.PITCH * 1.07, rate: this.RATE * 1.04, pausa: 200 };          // exclamação: ênfase
    if (/(\.\.\.|…)$/.test(t)) return { pitch: this.PITCH * .94, rate: this.RATE * .9, pausa: 520 };   // reticências: suspense
    if (/^(mas|porém|cuidado|atenção|preste atenção|but|careful|beware|pay attention)\b/i.test(t) || /invertida|reversed/i.test(t)) return { pitch: this.PITCH * .96, rate: this.RATE * .95, pausa: 300 };
    return { pitch: this.PITCH, rate: this.RATE, pausa: 180 };
  },
  fala(texto, aoPalavra) {
    return new Promise(async res => {
      if (!this.ligada || !('speechSynthesis' in window)) return res();
      speechSynthesis.cancel();
      const meu = this.turno = (this.turno || 0) + 1;       // se outra fala começar (ou cala()), esta para
      for (const f of this.frases(texto)) {
        if (this.turno !== meu || !this.ligada) break;
        const p = this.prosodia(f.t);
        await new Promise(ok => {
          const u = new SpeechSynthesisUtterance(f.t);
          u.lang = this.voz?.lang || etiqueta(); if (this.voz) u.voice = this.voz; u.rate = p.rate; u.pitch = p.pitch;
          let fim = false; const acaba = () => { if (!fim) { fim = true; ok(); } };
          u.onend = acaba; u.onerror = acaba; u.onboundary = e => aoPalavra?.(f.i + e.charIndex);
          setTimeout(acaba, 1200 + f.t.length * 86);
          speechSynthesis.speak(u);
        });
        if (this.turno !== meu) break;
        await new Promise(ok => setTimeout(ok, p.pausa));   // respiro entre frases
      }
      res();
    });
  },
  cala() { this.turno = (this.turno || 0) + 1; if ('speechSynthesis' in window) speechSynthesis.cancel(); }
};
if ('speechSynthesis' in window) { Voz.escolhe(); speechSynthesis.onvoiceschanged = () => Voz.escolhe(); }
aoMudarLingua(() => { if ('speechSynthesis' in window) Voz.escolhe(); Ouvido.trocaLingua(); });

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const Ouvido = {
  existe: !!SR, ligado: false, respondeu: false, ultimoErro: '', rec: null, pausado: true, ouvintes: new Set(), ultimo: '',
  liga() {
    if (!SR) return false;
    this.ligado = true;
    if (!this.rec) {
      const r = new SR(); r.lang = etiqueta(); r.continuous = true; r.interimResults = true; r.maxAlternatives = 3;
      r.onresult = e => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i]; this.recebe([...res].map(a => a.transcript.trim()), res.isFinal);
        }
      };
      r.onstart = () => { this.respondeu = true; };
      r.onend = () => { this.ativo = false; if (this.ligado && !this.pausado) setTimeout(() => this.inicia(), 250); };
      r.onerror = e => {
        this.ultimoErro = e.error;
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { this.ligado = false; this.aoNegar?.(e.error); }
        else if (e.error !== 'no-speech' && e.error !== 'aborted') this.aoErro?.(e.error);
      };
      this.rec = r;
    }
    this.pausado = false; this.inicia(); return true;
  },
  // Alguns navegadores mandam só resultados provisórios e demoram (ou nunca chegam) ao final.
  // Se o texto provisório ficar parado por 900 ms, ele passa a valer como final.
  recebe(alts, final) {
    clearTimeout(this.estavel);
    if (!alts[0]) return;
    this.ultimo = alts[0];
    if (final) {
      if (norma(alts[0]) === this.jaValeu) { this.jaValeu = ''; return; }   // já foi entregue pelo estabilizador
      this.jaValeu = ''; this.entrega(alts, true); return;
    }
    this.entrega(alts, false);
    this.estavel = setTimeout(() => { this.jaValeu = norma(alts[0]); this.entrega(alts, true); }, 900);
  },
  entrega(alts, final) { for (const f of [...this.ouvintes]) f(alts, final); },
  inicia() { if (!this.rec || this.ativo || this.pausado || !this.ligado) return; try { this.rec.start(); this.ativo = true; } catch (e) { } },
  // outro idioma: o reconhecedor é refeito na próxima vez que ligar
  trocaLingua() { if (!this.rec) return; const ligado = this.ligado; this.desliga(); this.rec.onend = null; this.rec = null; this.ativo = false; if (ligado) this.liga(); },
  pausa() { this.pausado = true; try { this.rec?.stop(); } catch (e) { } },
  retoma() { if (!this.ligado) return; this.pausado = false; this.inicia(); },
  desliga() { this.ligado = false; this.pausa(); },
  ouve(f) { this.ouvintes.add(f); return () => this.ouvintes.delete(f); }
};

// normaliza para comparar palavras ("Não!" -> "nao")
export const norma = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
export function contem(alts, palavras) {
  return alts.some(a => { const n = ' ' + norma(a) + ' '; return palavras.some(p => n.includes(' ' + norma(p) + ' ')); });
}
