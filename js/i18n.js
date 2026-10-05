// Idioma da Tenda (português ou inglês). Escolhido na tela de entrada; lembrado neste aparelho.
// Também aceita ?lang=en ou ?lang=pt no endereço (para links e anúncios em cada idioma).
// The Tent's language (Portuguese or English). Chosen on the entrance screen; remembered on this device.

const CHAVE = 'zaira.lang';
let L = 'pt';
const ouvintes = new Set();

export const lingua = () => L;
export const ehIngles = () => L === 'en';
// etiqueta BCP-47 para voz e reconhecimento de fala
export const etiqueta = () => (L === 'en' ? 'en-US' : 'pt-BR');

// idioma salvo antes (ou pelo endereço); null se a pessoa ainda não escolheu
export function linguaSalva() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && /^(pt|en)/i.test(q)) return q.slice(0, 2).toLowerCase();
  try { const s = localStorage.getItem(CHAVE); if (s === 'pt' || s === 'en') return s; } catch (e) { }
  return null;
}
// sugestão quando ainda não há escolha: o idioma do navegador
export const linguaDoNavegador = () => (/^pt/i.test(navigator.language || '') ? 'pt' : 'en');

export function defineLingua(l) {
  L = l === 'en' ? 'en' : 'pt';
  document.documentElement.lang = L === 'en' ? 'en' : 'pt-BR';
  try { localStorage.setItem(CHAVE, L); } catch (e) { }
  aplica();
  for (const f of [...ouvintes]) { try { f(L); } catch (e) { console.warn(e); } }
}
export const aoMudarLingua = f => { ouvintes.add(f); return () => ouvintes.delete(f); };

// textos da interface (o que não é fala da Zaira)
const UI = {
  pt: {
    titulo: 'A Tenda de Zaira',
    descricao: 'Uma leitura de Tarô em 3D com a cartomante Zaira: voz, microfone e webcam. Baseado no programa TAROT (R. K. West, 1986).',
    cenaAria: 'A tenda de Zaira em 3D',
    sub: 'Velas acesas, ervas secas e um baralho de 1909.',
    intro: 'Zaira vai ler o Tarô para você na Cruz Celta, com as dez cartas e os textos do programa TAROT de 1986. Converse com ela pela voz, ou use os botões.',
    micTitulo: 'Microfone',
    micTexto: 'Diga seu nome, peça para ela parar de embaralhar, corte o baralho falando um número, diga "continue".',
    micIndisp: 'Este navegador não reconhece fala. No Chrome ou no Edge, você poderá conversar com a Zaira.',
    camTitulo: 'Câmera',
    camTexto: 'Zaira percebe quando você se senta, acompanha seu rosto com o olhar e entende um aceno de "sim". A imagem é analisada só no seu aparelho: nada é enviado.',
    preparando: 'Preparando a tenda…',
    entrar: 'Entrar na tenda',
    voltar: 'Voltar à tenda',
    chegando: p => `Zaira está chegando… ${p}%`,
    falhaCarga: m => 'Não consegui preparar a tenda: ' + m,
    creditos: 'Baseado no programa TAROT (R. K. West, 1986), recuperado e traduzido por Dan Ramon Ribeiro.<br>Cartas: baralho Rider-Waite-Smith de 1909 (Pamela Colman Smith), domínio público, via Wikimedia Commons.<br>Retrato da Zaira: Dan Ramon Ribeiro. Modelo 3D a partir da amostra VRM da pixiv. Funciona melhor no Chrome ou no Edge.',
    trocaIdioma: 'English',
    trocaIdiomaAria: 'Switch to English',
    fechou: 'A cortina se fechou. Obrigada pela visita. Quando quiser, Zaira estará à sua espera.',
    // HUD
    hudMic: 'Microfone', hudCam: 'Câmera', hudVoz: 'Voz da Zaira', hudSom: 'Som ambiente', espelho: 'Sua imagem na câmera',
    // escuta
    ouvi: s => `Ouvi: <b>${s}</b>`,
    naoEntendi: (s, ex) => `Ouvi <b>${s}</b>, mas não entendi. Diga ${ex.join(' ou ')}.`,
    viSim: 'Vi você acenar que sim.', viNao: 'Vi você balançar a cabeça.',
    digaPare: 'Diga <b>"pare"</b>',
    // microfone
    micInexistente: 'Este navegador não reconhece fala. No Chrome, você poderá conversar com a Zaira.',
    micErro: e => `O microfone deu o erro "${e}".`,
    mic: {
      'not-allowed': 'O microfone foi bloqueado. Libere-o no cadeado da barra de endereço e toque no botão do microfone.',
      'service-not-allowed': 'Este navegador não permite o reconhecimento de fala. Use o Chrome, ou os botões.',
      'network': 'O reconhecimento de fala do navegador não conseguiu falar com o serviço dele (erro de rede). Use o Chrome, ou os botões.',
      'audio-capture': 'Não encontrei um microfone neste aparelho, ou outro programa está usando o microfone.',
      'language-not-supported': 'Este navegador não reconhece fala em português.',
      'mudo': 'O reconhecimento de fala não respondeu neste navegador. Use o Chrome, ou os botões.'
    },
    // câmera
    cam: {
      NotAllowedError: 'A câmera foi bloqueada. Libere-a no cadeado da barra de endereço e toque no botão da câmera.',
      NotFoundError: 'Não encontrei uma câmera neste aparelho.',
      NotReadableError: 'A câmera está sendo usada por outro programa.',
      OverconstrainedError: 'A câmera não aceitou o tamanho de imagem pedido.'
    },
    camModelo: 'Não consegui carregar o reconhecimento de rosto. A consulta segue sem a câmera.',
    camVideo: 'A câmera abriu, mas a imagem não começou. A consulta segue sem ela.',
    camOutro: e => `Não consegui usar a câmera (${e}). A consulta segue sem ela.`,
    camFalhou: 'Não consegui usar a câmera.',
    // botões e campos da consulta
    sim: 'Sim, leia minha sorte', naoHoje: 'Hoje não',
    seuNome: 'Seu nome', dizer: 'Dizer',
    suaPergunta: 'Sua pergunta (opcional)', perguntar: 'Perguntar', guardar: 'Guardar em silêncio',
    viajante: 'viajante',
    parar: 'Parar',
    cortePara: n => `Corte na carta <b id="corteN">${n}</b> de 78`,
    corteEsq: 'Uma carta para a esquerda', corteDir: 'Uma carta para a direita', cortarAqui: 'Cortar aqui',
    proxima: 'Próxima carta', continuar: 'Continuar', agradeco: 'Agradeço, Zaira',
    nova: 'Nova consulta', rever: 'Rever', finalizar: 'Finalizar',
    cadeiraVazia: 'A cadeira de Zaira está vazia. Só o cheiro de incenso ficou.',
    reverDica: 'Toque em qualquer carta da mesa, ou diga "carta 3", para ler de novo o que ela diz.',
    // detalhe da carta
    invertida: 'invertida', casa: n => `Casa ${n}`,
    figura: 'A FIGURA', geral: 'SIGNIFICADO GERAL', naInvertida: 'NA POSIÇÃO INVERTIDA',
    sintese: 'A SÍNTESE', tiragem: 'A TIRAGEM',
    sorteio: (l, cs, e, p, c) => `sorteio: letras ${l} · relógio ${cs} · estado ${e} · passadas ${p} · corte ${c}`, noBasic: 'no BASIC'
  },
  en: {
    titulo: "Zaira's Tent",
    descricao: 'A 3D Tarot reading with the fortune-teller Zaira: voice, microphone and webcam. Based on the TAROT program (R. K. West, 1986).',
    cenaAria: "Zaira's tent in 3D",
    sub: 'Lit candles, dried herbs and a deck from 1909.',
    intro: 'Zaira will read the Tarot for you in the Celtic Cross, with the ten cards and the texts of the 1986 TAROT program. Talk to her with your voice, or use the buttons.',
    micTitulo: 'Microphone',
    micTexto: 'Say your name, ask her to stop shuffling, cut the deck by saying a number, say "continue".',
    micIndisp: 'This browser does not recognize speech. In Chrome or Edge you will be able to talk to Zaira.',
    camTitulo: 'Camera',
    camTexto: 'Zaira notices when you sit down, follows your face with her eyes and understands a nod for "yes". The image is analyzed only on your device: nothing is sent.',
    preparando: 'Preparing the tent…',
    entrar: 'Enter the tent',
    voltar: 'Back to the tent',
    chegando: p => `Zaira is arriving… ${p}%`,
    falhaCarga: m => 'I could not prepare the tent: ' + m,
    creditos: 'Based on the TAROT program (R. K. West, 1986), recovered and translated by Dan Ramon Ribeiro.<br>Cards: the 1909 Rider-Waite-Smith deck (Pamela Colman Smith), public domain, via Wikimedia Commons.<br>Portrait of Zaira: Dan Ramon Ribeiro. 3D model based on the pixiv VRM sample. Works best in Chrome or Edge.',
    trocaIdioma: 'Português',
    trocaIdiomaAria: 'Mudar para português',
    fechou: 'The curtain has closed. Thank you for your visit. Whenever you wish, Zaira will be waiting for you.',
    hudMic: 'Microphone', hudCam: 'Camera', hudVoz: "Zaira's voice", hudSom: 'Ambient sound', espelho: 'Your camera image',
    ouvi: s => `I heard: <b>${s}</b>`,
    naoEntendi: (s, ex) => `I heard <b>${s}</b>, but did not understand. Say ${ex.join(' or ')}.`,
    viSim: 'I saw you nod yes.', viNao: 'I saw you shake your head.',
    digaPare: 'Say <b>"stop"</b>',
    micInexistente: 'This browser does not recognize speech. In Chrome you will be able to talk to Zaira.',
    micErro: e => `The microphone reported the error "${e}".`,
    mic: {
      'not-allowed': 'The microphone was blocked. Allow it in the padlock of the address bar and tap the microphone button.',
      'service-not-allowed': 'This browser does not allow speech recognition. Use Chrome, or the buttons.',
      'network': "The browser's speech recognition could not reach its service (network error). Use Chrome, or the buttons.",
      'audio-capture': 'I could not find a microphone on this device, or another program is using it.',
      'language-not-supported': 'This browser does not recognize speech in English.',
      'mudo': 'Speech recognition did not respond in this browser. Use Chrome, or the buttons.'
    },
    cam: {
      NotAllowedError: 'The camera was blocked. Allow it in the padlock of the address bar and tap the camera button.',
      NotFoundError: 'I could not find a camera on this device.',
      NotReadableError: 'The camera is being used by another program.',
      OverconstrainedError: 'The camera did not accept the requested image size.'
    },
    camModelo: 'I could not load face recognition. The reading goes on without the camera.',
    camVideo: 'The camera opened, but the image did not start. The reading goes on without it.',
    camOutro: e => `I could not use the camera (${e}). The reading goes on without it.`,
    camFalhou: 'I could not use the camera.',
    sim: 'Yes, read my fortune', naoHoje: 'Not tonight',
    seuNome: 'Your name', dizer: 'Tell her',
    suaPergunta: 'Your question (optional)', perguntar: 'Ask', guardar: 'Keep it in silence',
    viajante: 'traveler',
    parar: 'Stop',
    cortePara: n => `Cut at card <b id="corteN">${n}</b> of 78`,
    corteEsq: 'One card to the left', corteDir: 'One card to the right', cortarAqui: 'Cut here',
    proxima: 'Next card', continuar: 'Continue', agradeco: 'Thank you, Zaira',
    nova: 'New reading', rever: 'Review', finalizar: 'Finish',
    cadeiraVazia: "Zaira's chair is empty. Only the scent of incense remains.",
    reverDica: 'Tap any card on the table, or say "card 3", to read again what it says.',
    invertida: 'reversed', casa: n => `Position ${n}`,
    figura: 'THE PICTURE', geral: 'GENERAL MEANING', naInvertida: 'IN THE REVERSED POSITION',
    sintese: 'THE SYNTHESIS', tiragem: 'THE SPREAD',
    sorteio: (l, cs, e, p, c) => `draw: letters ${l} · clock ${cs} · state ${e} · shuffles ${p} · cut ${c}`, noBasic: 'in BASIC'
  }
};

export function t(chave, ...args) {
  const v = UI[L][chave] ?? UI.pt[chave];
  return typeof v === 'function' ? v(...args) : v;
}

// nome e textos da carta no idioma escolhido
export const nomeCarta = c => (L === 'en' ? c.en_name : c.pt_name) || c.pt_name;
export const descCarta = c => (L === 'en' ? c.en_desc : c.pt_desc) || c.pt_desc;
export const sentidoCarta = (c, rev) => (L === 'en' ? (rev ? c.en_rev : c.en_up) : (rev ? c.pt_rev : c.pt_up)) || (rev ? c.pt_rev : c.pt_up);

// textos fixos da página: data-i18n (texto), data-i18n-html, data-i18n-aria, data-i18n-title
export function aplica(raiz = document) {
  raiz.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  raiz.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  raiz.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  raiz.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.title = t('titulo');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('descricao'));
}
