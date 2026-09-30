// Falas e dramaturgia da Zaira (as mesmas da Tenda 2D, revisadas por Dan).
export function rand() { const u = new Uint32Array(1); crypto.getRandomValues(u); return u[0] / 4294967296; }
export const pick = a => a[Math.floor(rand() * a.length)];
const lower1 = s => s.charAt(0).toLowerCase() + s.slice(1);

// posições da Cruz Celta (como no TAROT.EXE)
export const POS = [
  null,
  { t: 'A atmosfera que envolve sua vida até hoje' },
  { t: 'Sua personalidade e sua capacidade de agir dentro dessa atmosfera' },
  { t: 'Sua consciência: objetivos, propósitos e influências que você percebe' },
  { t: 'Seu inconsciente: forças internas que talvez você não perceba' },
  { t: 'Influências presentes que em breve deixarão sua vida' },
  { t: 'O futuro imediato' },
  { t: 'Você e seu comportamento no futuro' },
  { t: 'Influências e situações importantes que virão' },
  { t: 'Pensamentos que cruzarão sua mente enquanto o futuro se desenrola' },
  { t: 'A culminância de tudo o que esta leitura descreve' }
];

export const ACTS = [
  { name: 'O PASSADO', pos: [1, 4, 5], open: ['Comecemos pelo que ficou para trás. O passado é a raiz de tudo o que ainda vai florescer.', 'Antes do amanhã, vamos ouvir o que já foi. As primeiras cartas falam do chão onde você pisa.'] },
  { name: 'O PRESENTE', pos: [2, 3], open: ['Agora, o presente. Aquilo que você é neste instante, aqui diante de mim.', 'Voltemos ao agora. Estas cartas mostram quem você é hoje, e o que você busca.'] },
  { name: 'O FUTURO', pos: [6], open: ['E então, o que ainda não aconteceu. Não tenha pressa. O futuro gosta de ser olhado com calma.', 'Chegamos ao futuro. Ele não está escrito em pedra, mas as cartas conhecem seus caminhos.'] },
  // a parada entre a casa 6 e a 7: a cruz se completa e começa o cajado (casas 7 a 10)
  { name: 'O CAJADO', pausa: true, pos: [7, 8, 9, 10], open: ['A cruz está completa... Respire comigo. Agora eu ergo o cajado: quatro cartas que mostram como você vai caminhar até o que vem.', 'Façamos uma pausa... A cruz já falou. Agora o cajado vai mostrar o caminho, degrau por degrau, até o fim desta leitura.'] }
];

export const SUIT = {
  cups: { n: 'Copas', d: 'das emoções, do amor e dos laços' },
  pentacles: { n: 'Ouros', d: 'do dinheiro, do trabalho e das coisas concretas' },
  swords: { n: 'Espadas', d: 'da mente, dos conflitos e das decisões difíceis' },
  wands: { n: 'Paus', d: 'da ação, da energia e das iniciativas' }
};

function articleMinor(c) { return (c.rank === 1 ? 'a ' : 'o ') + c.pt_name; }

export function cardIntro(t, nome) {
  const c = t.card, pos = POS[t.pos].t;
  const open = pick([`${pos}.`, `Esta casa guarda ${lower1(pos)}.`, `Aqui, na casa ${t.pos}: ${lower1(pos)}.`]);
  const reveal = c.arcana === 'major'
    ? pick([`E quem aparece é ${c.pt_name}, um dos Arcanos Maiores. Uma força grande, ${nome}.`, `${c.pt_name}. Arcano Maior. Quando ele vem, o destino fala mais alto.`, `Veja só... ${c.pt_name}.`])
    : pick([`Surge ${articleMinor(c)}.`, `Vem ${articleMinor(c)}, carta ${SUIT[c.suit].d}.`, `${c.pt_name}. O naipe ${SUIT[c.suit].d}.`]);
  const rv = t.rev ? pick([' Mas ela chegou de cabeça para baixo, e isso muda o que ela quer dizer.', ' Ela veio invertida. Preste atenção.', ' Invertida... a energia dela está travada.']) : '';
  const mean = t.rev ? c.pt_rev : c.pt_up;
  return `${open} ${reveal}${rv} ${mean}`;
}

// nome da carta no meio da frase: "o Tolo", "a Rainha de Copas", "o Ás de Espadas"
function nomeCorrido(c) { return c.arcana === 'major' ? c.pt_name.replace(/^(O|A|Os|As) /, m => m.toLowerCase()) : articleMinor(c); }
function comCasa(t) { return `${nomeCorrido(t.card)} na casa ${t.pos}`; }
// "em" + artigo: "no Mundo", "na Morte"
const contrai = (c, pre) => nomeCorrido(c).replace(/^(os|as|o|a) /, (m, a) => pre[a] + ' ');
const emNome = c => contrai(c, { o: 'no', a: 'na', os: 'nos', as: 'nas' });
const porNome = c => contrai(c, { o: 'pelo', a: 'pela', os: 'pelos', as: 'pelas' });
const aNome = c => contrai(c, { o: 'ao', a: 'à', os: 'aos', as: 'às' });
const CARDINAL_F = ['', 'Uma', 'Duas', 'Três', 'Quatro', 'Cinco', 'Seis', 'Sete', 'Oito', 'Nove', 'Dez'];
// "a, b e c"
function lista(xs) { return xs.length < 2 ? (xs[0] || '') : xs.slice(0, -1).join(', ') + ' e ' + xs[xs.length - 1]; }

export function synthesis(tiragem, nome, pergunta, leitura = null) {
  const maiores = tiragem.filter(t => t.card.arcana === 'major'), maj = maiores.length;
  const invertidas = tiragem.filter(t => t.rev), rev = invertidas.length;
  const cnt = {}; tiragem.forEach(t => { if (t.card.suit) cnt[t.card.suit] = (cnt[t.card.suit] || 0) + 1; });
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
  const fim = tiragem[9], ime = tiragem[5];
  const nomesMaiores = lista(maiores.map(t => nomeCorrido(t.card)));
  let s = pergunta ? `Você me trouxe uma pergunta: “${pergunta}”. ` : 'Você guardou sua pergunta em silêncio, e as cartas respeitaram isso. ';
  s += maj >= 4 ? `Há ${maj} Arcanos Maiores na mesa: ${nomesMaiores}. Forças maiores do que a vontade de um dia estão em movimento na sua vida. `
    : maj === 0 ? 'Nenhum Arcano Maior apareceu. O que vem pela frente depende das suas escolhas de todo dia, não do destino. '
      : maj === 1 ? `Um só Arcano Maior, ${nomesMaiores}, marca o ponto em que o destino encosta a mão no seu caminho. `
        : `${maj === 2 ? 'Dois' : 'Três'} Arcanos Maiores, ${nomesMaiores}, marcam os pontos em que o destino encosta a mão no seu caminho. `;
  if (top && top[1] >= 3) {
    const doNaipe = tiragem.filter(t => t.card.suit === top[0]).map(t => nomeCorrido(t.card));
    s += `O naipe de ${SUIT[top[0]].n} domina a tiragem, com ${lista(doNaipe)}: este é um tempo ${SUIT[top[0]].d}. `;
  }
  s += rev === 0 ? 'Nenhuma carta se voltou contra você. '
    : rev === 1 ? `Uma carta veio invertida: ${comCasa(invertidas[0])}. É ali que mora o nó a desatar. `
      : `${CARDINAL_F[rev]} cartas vieram invertidas: ${lista(invertidas.map(comCasa))}. Há energias presas pedindo cuidado. `;
  s += `No futuro imediato, ${nomeCorrido(ime.card)}${ime.rev ? ', invertida' : ''}. E tudo culmina ${emNome(fim.card)}${fim.rev ? ', invertida' : ''}.`;
  // a revelação guardada e o enredo da leitura, pelo fio do tema escolhido
  const tema = leitura?.tema, fala = tema && interpretacao(fim, tema);
  if (fala) {
    s += ` ${fala}`;
    const [raiz, agora, passo] = [tiragem[0], tiragem[1], tiragem[6]];
    s += ` Esta é a história que a mesa contou, ${nome}: ela nasce ${emNome(raiz.card)}, atravessa ${nomeCorrido(agora.card)}, passa ${porNome(passo.card)} e chega ${aNome(fim.card)}.`;
    s += pergunta ? ` Essa é a resposta que as cartas dão à sua pergunta.` : ` Guarde-a: ela responde ao que você não precisou dizer.`;
  }
  return s;
}

// ---------- interpretações por tema (data/interpretacoes.json) ----------
// 7 interpretações por carta e por sentido (normal/invertida), uma para cada tema da vida.
// A leitura escolhe UM tema (o da pergunta, ou o que as cartas apontam) e segue esse fio:
// comentários nas casas 6 a 9, a revelação da casa 10 guardada para o fim, e o enredo na síntese.
let INTERP = {};
export function defineInterpretacoes(obj) { INTERP = obj || {}; }
export const interpretacao = (t, tema) => INTERP[t.card.id]?.[t.rev ? 'rev' : 'up']?.[tema] || null;

export const TEMAS = {
  amor: { o: 'o amor', fio: 'do coração', chaves: ['amor', ' ama ', ' amar', 'me ama', 'gosta de mim', 'ciume', 'trai', 'solteir', 'alguem especial', 'pessoa amada', 'namor', 'paixa', 'casar', 'casamento', 'relacion', 'marido', 'esposa', 'noiv', 'ex ', 'crush', 'gosta de mim', 'coracao', 'alma gemea', 'ficar com', 'volta pra mim', 'voltar comigo'] },
  trabalho: { o: 'o trabalho', fio: 'do trabalho', chaves: ['trabalh', 'emprego', 'carreira', 'chefe', 'empresa', 'promoc', 'concurso', 'estud', 'faculdade', 'vestibular', 'profiss', 'projeto', 'entrevista', 'vaga', 'demiss', 'cargo'] },
  dinheiro: { o: 'o dinheiro', fio: 'do dinheiro e dos bens', chaves: ['dinheiro', 'divida', 'financ', 'salario', 'comprar', 'vender', 'investi', 'negocio', 'lucro', 'rico', 'riqueza', 'pagar', 'heranca', 'apartamento', 'imovel', 'carro'] },
  familia: { o: 'a família', fio: 'da família e dos laços', chaves: ['familia', 'filho', 'filha', 'mae', 'pai', 'irma', 'irmao', 'avo', 'parente', 'amig', 'lar', 'casa '] },
  decisao: { o: 'a sua escolha', fio: 'da escolha que você tem diante de si', chaves: ['devo', 'escolh', 'decid', 'decis', 'aceitar', 'aceito', 'vale a pena', 'qual caminho', 'ou nao', ' ou '] },
  mudanca: { o: 'as mudanças', fio: 'das mudanças', chaves: ['mudar', 'mudanc', 'viag', 'morar', 'outra cidade', 'outro pais', 'exterior', 'recome', 'novo ciclo', 'sair de', 'deixar'] },
  espirito: { o: 'a sua alma', fio: 'do seu caminho interior', chaves: ['proposito', 'sentido', 'fe ', 'espirit', 'deus', 'missao', 'feliz', 'felicidade', 'paz', 'destino', 'quem sou', 'autoconhec'] }
};
const normaliza = s => ' ' + String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
// o tema da leitura: pela pergunta (quando houver) ou pelo que domina a mesa
export function temaDaLeitura(pergunta, tiragem) {
  const q = normaliza(pergunta);
  if (q.trim()) {
    let melhor = null, pts = 0;
    for (const [k, v] of Object.entries(TEMAS)) {
      const n = v.chaves.filter(c => q.includes(c)).length * (k === 'decisao' ? .9 : 1);   // "devo...?" perde para o assunto
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
    ? pick([`Sua pergunta fala ${T.fio}. É por esse fio que vou ler o que vem.`, `Eu ouvi a sua pergunta. Ela fala ${T.fio}, e é esse fio que eu vou seguir daqui em diante.`])
    : pick([`As cartas estão apontando para ${T.o}. É por esse fio que vou ler o que vem.`, `Sem que você dissesse nada, as cartas escolheram o assunto: ${T.o}. Vou seguir esse fio.`]);
}
// comentário sugestivo depois da descrição de cada carta do futuro (casas 6 a 9)
const ABERTURAS = [o => `Sobre ${o}, ela sussurra mais uma coisa.`, o => `E para ${o}, eis o recado dela.`, o => `Se eu olhar esta carta pelo fio da sua pergunta...`, o => `Há mais aqui, e é sobre ${o}.`, o => `Escute o que ela guarda para ${o}.`];
export function comentarioFuturo(t, tema, usadas = new Set()) {
  const txt = interpretacao(t, tema); if (!txt) return null;
  const livres = ABERTURAS.map((f, i) => i).filter(i => !usadas.has(i));
  const i = livres.length ? livres[Math.floor(rand() * livres.length)] : 0; usadas.add(i);
  return `${ABERTURAS[i](TEMAS[tema].o)} ${txt}`;
}
export function guardaCulminancia(tema) {
  return pick([`Esta carta eu guardo por um instante. O que ela tem a dizer sobre ${TEMAS[tema].o}, eu conto no fim.`, `O segredo desta última carta fica comigo mais um pouco... ele fecha a sua história.`]);
}

// reações da Zaira ao que a câmera percebe
export const REACAO = {
  sorriso: ['Esse sorriso... as cartas gostam de quem chega de coração aberto.', 'Vejo um sorriso. Guarde essa leveza, ela vai ajudar você.'],
  ausente: ['Não se afaste, as cartas ainda estão falando com você.', 'Volte para perto da mesa. Ainda não terminamos.']
};

// números por extenso (para "corte na trinta e dois")
const UN = { um: 1, uma: 1, dois: 2, duas: 2, 'três': 3, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9 };
const ESP = { dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19 };
const DEZ = { vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, 'cinqüenta': 50, sessenta: 60, setenta: 70 };
export function numeroFalado(txt) {
  const d = txt.match(/\b(\d{1,2})\b/); if (d) return +d[1];
  const w = txt.toLowerCase().split(/[^a-zà-ú]+/); let n = 0, achou = false;
  for (const p of w) {
    if (DEZ[p]) { n += DEZ[p]; achou = true; } else if (ESP[p]) { n += ESP[p]; achou = true; } else if (UN[p]) { n += UN[p]; achou = true; }
  }
  return achou ? n : null;
}
