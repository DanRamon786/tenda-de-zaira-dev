// Zaira's lines in English. Same shape as textos.js (Portuguese): main.js picks one of the two by the chosen language.
// Card texts come from the original English of the TAROT program (R. K. West, 1986).
import { rand, pick } from './textos.js';
export { rand, pick };
const lower1 = s => s.charAt(0).toLowerCase() + s.slice(1);
const upper1 = s => s.charAt(0).toUpperCase() + s.slice(1);

// Celtic Cross positions (as in TAROT.EXE)
export const POS = [
  null,
  { t: 'The atmosphere that surrounds your life up to today' },
  { t: 'Your personality and your ability to act within that atmosphere' },
  { t: 'Your consciousness, with the goals, purposes and influences you are aware of' },
  { t: 'Your unconscious, the inner forces you may not be aware of' },
  { t: 'Present influences that will soon leave your life' },
  { t: 'The immediate future' },
  { t: 'You and your behavior in the future' },
  { t: 'Important influences and situations still to come' },
  { t: 'Thoughts that will cross your mind as the future unfolds' },
  { t: 'The culmination of everything this reading describes' }
];

export const ACTS = [
  { name: 'THE PAST', pos: [1, 4, 5], open: ['Let us begin with what was left behind. The past is the root of everything that is still to bloom.', 'Before tomorrow, let us listen to what has been. The first cards speak of the ground beneath your feet.'] },
  { name: 'THE PRESENT', pos: [2, 3], open: ['Now, the present. What you are in this very moment, here before me.', 'Let us return to now. These cards show who you are today, and what you are seeking.'] },
  { name: 'THE FUTURE', futuro: true, pos: [6], open: ['And then, what has not yet happened. Do not hurry. The future likes to be looked at calmly.', 'We have reached the future. It is not written in stone, but the cards know its paths.'] },
  // the pause between position 6 and 7: the cross is complete and the staff begins (positions 7 to 10)
  { name: 'THE STAFF', pausa: true, pos: [7, 8, 9, 10], open: ['The cross is complete... Breathe with me. Now I raise the staff: four cards that show how you will walk toward what is coming.', 'Let us pause... The cross has spoken. Now the staff will show the way, step by step, to the end of this reading.'] }
];

export const SUIT = {
  cups: { n: 'Cups', d: 'emotions, love and bonds' },
  pentacles: { n: 'Pentacles', d: 'money, work and concrete things' },
  swords: { n: 'Swords', d: 'the mind, conflicts and hard decisions' },
  wands: { n: 'Wands', d: 'action, energy and new ventures' }
};

// card name inside a sentence: "the Fool", "Justice", "the Wheel of Fortune", "the Queen of Cups"
function nomeCorrido(c) {
  const n = c.en_name || c.pt_name;
  if (c.arcana !== 'major') return 'the ' + n;
  if (/^The /.test(n)) return 'the ' + n.slice(4);
  return n === 'Wheel of Fortune' ? 'the Wheel of Fortune' : n;
}
const comCasa = t => `${nomeCorrido(t.card)} in position ${t.pos}`;
const CARDINAL = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
// "a, b and c"
function lista(xs) { return xs.length < 2 ? (xs[0] || '') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]; }

export function cardIntro(t, nome) {
  const c = t.card, pos = POS[t.pos].t, nm = c.en_name || c.pt_name;
  const open = pick([`${pos}.`, `This house holds ${lower1(pos)}.`, `Here, in position ${t.pos}: ${lower1(pos)}.`]);
  const reveal = c.arcana === 'major'
    ? pick([`And the one who appears is ${nomeCorrido(c)}, one of the Major Arcana. A great force, ${nome}.`, `${upper1(nomeCorrido(c))}. A Major Arcanum. When it comes, destiny speaks louder.`, `Look at that... ${nomeCorrido(c)}.`])
    : pick([`Here comes ${nomeCorrido(c)}.`, `${upper1(nomeCorrido(c))} arrives, a card of ${SUIT[c.suit].d}.`, `${nm}. The suit of ${SUIT[c.suit].d}.`]);
  const rv = t.rev ? pick([' But it came upside down, and that changes what it wants to say.', ' It came reversed. Pay attention.', ' Reversed... its energy is blocked.']) : '';
  const mean = t.rev ? (c.en_rev || c.pt_rev) : (c.en_up || c.pt_up);
  return `${open} ${reveal}${rv} ${mean}`;
}

export function synthesis(tiragem, nome, pergunta, leitura = null) {
  const maiores = tiragem.filter(t => t.card.arcana === 'major'), maj = maiores.length;
  const invertidas = tiragem.filter(t => t.rev), rev = invertidas.length;
  const cnt = {}; tiragem.forEach(t => { if (t.card.suit) cnt[t.card.suit] = (cnt[t.card.suit] || 0) + 1; });
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
  const fim = tiragem[9], ime = tiragem[5];
  const nomesMaiores = lista(maiores.map(t => nomeCorrido(t.card)));
  let s = pergunta ? `You brought me a question: “${pergunta}”${/[.?!…]$/.test(pergunta) ? '' : '.'} ` : 'You kept your question in silence, and the cards respected that. ';
  s += maj >= 4 ? `There are ${maj} Major Arcana on the table: ${nomesMaiores}. Forces greater than the will of a single day are moving in your life. `
    : maj === 0 ? 'No Major Arcanum appeared. What lies ahead depends on your everyday choices, not on destiny. '
      : maj === 1 ? `A single Major Arcanum, ${nomesMaiores}, marks the point where destiny lays its hand on your path. `
        : `${maj === 2 ? 'Two' : 'Three'} Major Arcana, ${nomesMaiores}, mark the points where destiny lays its hand on your path. `;
  if (top && top[1] >= 3) {
    const doNaipe = tiragem.filter(t => t.card.suit === top[0]).map(t => nomeCorrido(t.card));
    s += `The suit of ${SUIT[top[0]].n} rules this spread, with ${lista(doNaipe)}: this is a time of ${SUIT[top[0]].d}. `;
  }
  s += rev === 0 ? 'No card turned against you. '
    : rev === 1 ? `One card came reversed: ${comCasa(invertidas[0])}. That is where the knot to untie lives. `
      : `${CARDINAL[rev]} cards came reversed: ${lista(invertidas.map(comCasa))}. There are trapped energies asking for care. `;
  s += `In the immediate future, ${nomeCorrido(ime.card)}${ime.rev ? ', reversed' : ''}. And everything culminates in ${nomeCorrido(fim.card)}${fim.rev ? ', reversed' : ''}.`;
  // the revelation kept for the end, and the story of the reading, along the thread of the chosen theme
  const tema = leitura?.tema, fala = tema && interpretacao(fim, tema);
  if (fala) {
    s += ` ${fala}`;
    const [raiz, agora, passo] = [tiragem[0], tiragem[1], tiragem[6]];
    s += ` This is the story the table told, ${nome}: it is born in ${nomeCorrido(raiz.card)}, crosses ${nomeCorrido(agora.card)}, passes through ${nomeCorrido(passo.card)} and arrives at ${nomeCorrido(fim.card)}.`;
    s += pergunta ? ` That is the answer the cards give to your question.` : ` Keep it: it answers what you did not need to say.`;
  }
  return s;
}

// ---------- interpretations by theme (data/interpretacoes_en.json) ----------
let INTERP = {};
export function defineInterpretacoes(obj) { INTERP = obj || {}; }
export const interpretacao = (t, tema) => INTERP[t.card.id]?.[t.rev ? 'rev' : 'up']?.[tema] || null;

// the theme keys stay in Portuguese (they are the keys of the interpretation files)
export const TEMAS = {
  amor: { o: 'love', fio: 'of the heart', chaves: ['love', 'loves me', 'in love', 'boyfriend', 'girlfriend', 'husband', 'wife', 'partner', 'marry', 'married', 'marriage', 'wedding', 'relationship', 'dating', 'date ', 'crush', ' ex ', 'my ex', 'soulmate', 'soul mate', 'heart', 'romance', 'romantic', 'cheat', 'jealous', 'single', 'engaged', 'fiance', 'come back to me', 'likes me', 'feel about me'] },
  trabalho: { o: 'work', fio: 'of work', chaves: ['work', 'job', 'career', 'boss', 'company', 'promotion', 'exam', 'study', 'studies', 'college', 'university', 'school', 'profession', 'project', 'interview', 'hired', 'fired', 'position', 'business plan', 'colleague'] },
  dinheiro: { o: 'money', fio: 'of money and possessions', chaves: ['money', 'debt', 'finance', 'financial', 'salary', 'income', 'buy', 'sell', 'invest', 'business', 'profit', 'rich', 'wealth', 'pay', 'inheritance', 'apartment', 'house ', 'property', 'car', 'loan', 'savings'] },
  familia: { o: 'family', fio: 'of family and bonds', chaves: ['family', 'son', 'daughter', 'child', 'children', 'kids', 'mother', 'mom', 'father', 'dad', 'sister', 'brother', 'grandmother', 'grandfather', 'relative', 'friend', 'home', 'parents'] },
  decisao: { o: 'your choice', fio: 'of the choice before you', chaves: ['should i', 'choose', 'choice', 'decide', 'decision', 'accept', 'worth it', 'which path', 'which way', 'or not', ' or '] },
  mudanca: { o: 'the changes ahead', fio: 'of change', chaves: ['change', 'move', 'moving', 'travel', 'trip', 'journey', 'another city', 'another country', 'abroad', 'start over', 'new beginning', 'new chapter', 'leave', 'quit'] },
  espirito: { o: 'your soul', fio: 'of your inner path', chaves: ['purpose', 'meaning', 'faith', 'spirit', 'spiritual', 'god', 'mission', 'happy', 'happiness', 'peace', 'destiny', 'fate', 'who am i', 'myself', 'soul'] }
};
const normaliza = s => ' ' + String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
// the theme of the reading: from the question (when there is one) or from what rules the table
export function temaDaLeitura(pergunta, tiragem) {
  const q = normaliza(pergunta);
  if (q.trim()) {
    let melhor = null, pts = 0;
    for (const [k, v] of Object.entries(TEMAS)) {
      const n = v.chaves.filter(c => q.includes(c)).length * (k === 'decisao' ? .9 : 1);   // "should I...?" loses to the subject
      if (n > pts) { pts = n; melhor = k; }
    }
    if (melhor) return { tema: melhor, daPergunta: true };
  }
  const maj = tiragem.filter(t => t.card.arcana === 'major').length;
  if (maj >= 4) return { tema: 'espirito', daPergunta: false };
  const cnt = {}; tiragem.forEach(t => { if (t.card.suit) cnt[t.card.suit] = (cnt[t.card.suit] || 0) + 1; });
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  const porNaipe = { cups: 'amor', pentacles: 'dinheiro', swords: 'decisao', wands: 'trabalho' };
  if (top[0] && (!top[1] || top[0][1] > top[1][1])) return { tema: porNaipe[top[0][0]], daPergunta: false };
  return { tema: 'mudanca', daPergunta: false };
}
export function anunciaTema({ tema, daPergunta }) {
  const T = TEMAS[tema];
  return daPergunta
    ? pick([`Your question speaks ${T.fio}. That is the thread I will follow to read what comes.`, `I heard your question. It speaks ${T.fio}, and that is the thread I will follow from now on.`])
    : pick([`The cards are pointing toward ${T.o}. That is the thread I will follow to read what comes.`, `Without you saying a word, the cards chose the subject: ${T.o}. I will follow that thread.`]);
}
// a suggestive comment after each card of the future (positions 6 to 9)
const ABERTURAS = [o => `About ${o}, it whispers one more thing.`, o => `And for ${o}, here is its message.`, o => `If I look at this card along the thread of your question...`, o => `There is more here, and it is about ${o}.`, o => `Listen to what it keeps for ${o}.`];
export function comentarioFuturo(t, tema, usadas = new Set()) {
  const txt = interpretacao(t, tema); if (!txt) return null;
  const livres = ABERTURAS.map((f, i) => i).filter(i => !usadas.has(i));
  const i = livres.length ? livres[Math.floor(rand() * livres.length)] : 0; usadas.add(i);
  return `${ABERTURAS[i](TEMAS[tema].o)} ${txt}`;
}
export function guardaCulminancia(tema) {
  return pick([`This card I will keep for a moment. What it has to say about ${TEMAS[tema].o}, I will tell you at the end.`, `The secret of this last card stays with me a little longer... it closes your story.`]);
}

// Zaira's reactions to what the camera notices
export const REACAO = {
  sorriso: ['That smile... the cards like those who arrive with an open heart.', 'I see a smile. Keep that lightness, it will help you.'],
  ausente: ['Do not move away, the cards are still speaking to you.', 'Come back close to the table. We are not finished yet.']
};

// spoken numbers (for "cut at thirty two")
const UN = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
const ESP = { ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const DEZ = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70 };
const ALIAS = { to: 2, too: 2, for: 4, won: 1, ate: 8 };   // what recognizers sometimes hear after "card" / "at"
export function numeroFalado(txt) {
  const d = txt.match(/\b(\d{1,2})\b/); if (d) return +d[1];
  const w = txt.toLowerCase().split(/[^a-z]+/); let n = 0, achou = false;
  for (let i = 0; i < w.length; i++) {
    const p = w[i];
    if (DEZ[p]) { n += DEZ[p]; achou = true; } else if (ESP[p]) { n += ESP[p]; achou = true; } else if (UN[p]) { n += UN[p]; achou = true; }
    else if (ALIAS[p] && /^(card|number|at)$/.test(w[i - 1] || '')) { n += ALIAS[p]; achou = true; }
  }
  return achou ? n : null;
}

// ---------- script lines (main.js decides when each one is said) ----------
export const FALA = {
  chegue: 'Come closer to the candlelight. I want to see your face.',
  boasVindas: () => pick(['Ah... you came in. I knew someone would come tonight. Sit down, the chair is yours.', 'Welcome to my tent. The incense was already burning, as if it were waiting for you.']),
  apresenta: 'I am Zaira. I read the Tarot as my grandmother did, and her grandmother before her. Do you wish me to open the cards for you?',
  recusa: 'Not every night is a night for knowing. The curtain will be open when you return.',
  pedeNome: 'What shall I call you?',
  nomeBonito: nome => `${nome}... a beautiful name, it carries an ancient sound. Now think of a question. You may say it to me, or keep it only in your heart.`,
  embaralha: 'Concentrate on your question while I shuffle. When you feel it is time, tell me to stop.',
  abreCorte: 'I have spread the deck before you. Tap where you want to cut, or tell me a number from 1 to 77. The cards above the cut will go to the bottom of the pile.',
  cortou: n => pick([`At card ${n}. So be it.`, `You cut at card ${n}. The cards already know the way.`]),
  distribui: 'The cards now find their places. Ten houses, a cross and a staff.',
  despedida: nome => pick([`Thank you for trusting me, ${nome}. Remember: the cards show paths, but you are the one who walks.`, `I thank you for your visit, ${nome}. What you heard here is a map, not a sentence. Use it with courage.`]),
  fumaca: 'Take with you only what lights a flame. The rest, leave here on the table, together with the smoke.'
};

// ---------- words Zaira understands by voice ----------
export const PALAVRAS = {
  sim: ['yes', 'yeah', 'yep', 'sure', 'please', 'of course', 'okay', 'ok', 'go ahead', 'read', 'i want', 'i do', 'let s go', 'uh huh'],
  nao: ['no', 'nope', 'not today', 'not tonight', 'not now', 'later', 'no thanks'],
  segue: ['next', 'continue', 'go on', 'carry on', 'go ahead', 'keep going', 'ok', 'okay', 'right', 'got it', 'alright', 'all right', 'proceed', 'understood'],
  pare: ['stop', 'enough', 'ready', 'now', 'halt', 'that s enough', 'done', 'okay stop'],
  cortaNumero: ['cut', 'at', 'card', 'here', 'on', 'number'],
  cortaJa: ['here', 'cut', 'this one', 'that one', 'now', 'right here'],
  esquerda: ['left', 'less', 'back'], direita: ['right', 'more', 'forward'],
  obrigado: ['thank you', 'thanks', 'thank', 'grateful', 'cheers'],
  nova: ['new', 'another', 'again', 'one more'],
  rever: ['review', 'see', 'show', 'look'],
  finalizar: ['finish', 'exit', 'end', 'quit', 'goodbye', 'bye', 'leave'],
  guardar: ['keep', 'silence', 'secret', 'none', 'skip', 'pass', 'no question']
};
// "my name is Dan" -> "Dan"
export const limpaNome = s => {
  const t = s.replace(/^(hi|hello|hey)[, ]+/i, '').replace(/^(my name is|my name's|i am|i'm|im|you can call me|call me|it's|its|this is|name is|name's)\s+/i, '').replace(/[.!?,]/g, '').trim();
  return t.split(/\s+/).slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};
