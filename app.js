"use strict";
/* ================================================================
   1. BASE
   ================================================================ */
const D = window.DADOS_CAMERON;
const HOJE = D.hoje;
const UNI = D.unidades;
const ANOS = D.anos;
const porId = new Map(UNI.map(u => [u.id, u]));
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const MES_CURTO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DIAS_SEM = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const DIAS_SEM_C = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const ESPECIAIS = new Map(D.datasEspeciais.map(e => [e.data, e]));
const RASCUNHO = {};   // lançamento digitado que ainda não vai para o banco
const EU = D.eu || { papel: 'lancamento', nome: '', email: '' };
const SB = window.sbCliente || null;

const dt = s => new Date(+s.slice(0,4), +s.slice(5,7)-1, +s.slice(8,10));
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const diaSemana = s => dt(s).getDay();
const ehFds = s => [0,5,6].includes(diaSemana(s));
const anoDe = s => +s.slice(0,4);
const mesDe = s => +s.slice(5,7);
const diaDe = s => +s.slice(8,10);
const diasNoMes = (ano,m) => new Date(ano, m, 0).getDate();

const brl = n => 'R$ ' + Math.round(n).toLocaleString('pt-BR');
const brlCurto = n => {
  const a = Math.abs(n);
  if (a >= 1e6) return 'R$ ' + (n/1e6).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' mi';
  if (a >= 1000) return 'R$ ' + Math.round(n/1000).toLocaleString('pt-BR') + ' mil';
  return brl(n);
};
const num = n => Math.round(n).toLocaleString('pt-BR');

/* ---------- dinheiro nos campos de lançamento ----------
   O campo é de texto, não de número: <input type="number"> não aceita
   ponto de milhar nem vírgula decimal, que é como a pessoa lê o valor
   no relatório do caixa.                                              */
const moeda = n => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Aceita como a pessoa digitar: 7361 · 7.361 · 7361,50 · 7.361,50 · 7361.50
function lerMoeda(txt){
  const limpo = String(txt ?? '').replace(/[^\d.,-]/g, '').trim();
  if (!limpo) return null;
  let normal;
  if (limpo.includes(',')) {
    // tem vírgula: ela é o decimal e os pontos são separador de milhar
    normal = limpo.replace(/\./g, '').replace(',', '.');
  } else if (/\.\d{3}(?:\D|$)/.test(limpo)) {
    // "1.234" ou "1.234.567": ponto agrupando três dígitos é milhar
    normal = limpo.replace(/\./g, '');
  } else {
    normal = limpo;   // "1234" ou "1234.50"
  }
  const n = parseFloat(normal);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
const pct = n => (n>0?'+':'') + n.toLocaleString('pt-BR',{maximumFractionDigits:1}) + '%';
const dataBr = s => `${s.slice(8,10)}/${s.slice(5,7)}`;
const dataBrLonga = s => `${s.slice(8,10)}/${s.slice(5,7)}/${s.slice(0,4)}`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const classeVar = n => n === null ? 'neutro' : n > 0.5 ? 'up' : n < -0.5 ? 'down' : 'neutro';
const varPct = (a,b) => (b ? a*100/b - 100 : null);
const mostraVar = v => v === null ? '<span class="vazio">—</span>' : `<span class="${classeVar(v)}">${pct(v)}</span>`;

/* ---------- consultas ---------- */
const valoresDoDia = data => Object.assign({}, D.lancamentos[data] || {}, RASCUNHO[data] || {});
function valor(data, id){ const v = valoresDoDia(data)[id]; return typeof v === 'number' ? v : null; }
function totalDoDia(data, filtro){
  let t = 0;
  for (const [id, v] of Object.entries(valoresDoDia(data))){
    if (filtro && !filtro(porId.get(id))) continue;
    t += v;
  }
  return t;
}
const DATAS = Object.keys(D.lancamentos).sort();
const ULTIMA_DATA = DATAS[DATAS.length-1];
const DATAS_POR_MES = (() => {
  const m = new Map();
  for (const d of DATAS){
    const k = anoDe(d)*100 + mesDe(d);
    (m.get(k) || m.set(k, []).get(k)).push(d);
  }
  return m;
})();
const datasDoMes = (ano, mes) => DATAS_POR_MES.get(ano*100+mes) || [];
const mesesDoAno = ano => MESES.map((_,i)=>i+1).filter(m => datasDoMes(ano,m).length);

function totalMes(ano, mes, filtro){ return datasDoMes(ano,mes).reduce((s,d)=>s+totalDoDia(d,filtro),0); }
function totalUnidadeMes(id, ano, mes){ return datasDoMes(ano,mes).reduce((s,d)=>s+(valor(d,id)||0),0); }
function diasComVendaNoMes(id, ano, mes){ return datasDoMes(ano,mes).filter(d=>valor(d,id)!==null).length; }
function totalAno(ano, filtro){ return mesesDoAno(ano).reduce((s,m)=>s+totalMes(ano,m,filtro),0); }

function unidadesDoMes(ano, mes){
  const ids = new Set();
  for (const d of datasDoMes(ano,mes)) for (const id of Object.keys(valoresDoDia(d))) ids.add(id);
  return UNI.filter(u => ids.has(u.id));
}
const ehLoja  = u => u && u.bloco === 'lojas';
const ehFeira = u => u && u.bloco === 'feiras';

function metaMes(mes, filtro){
  const m = D.metas[mes] || {};
  let t = 0;
  for (const [id, v] of Object.entries(m)){
    const u = porId.get(id);
    if (!u || (filtro && !filtro(u))) continue;
    t += v;
  }
  return t;
}
// A planilha parou de preencher meta a partir de junho/2026. Sem cobertura total,
// "% da meta" vira um número sem sentido — então o app não mostra.
function coberturaMeta(ano, mes){
  const comMovimento = unidadesDoMes(ano, mes);
  const m = (ano === 2026 && D.metas[mes]) || {};
  const com = comMovimento.filter(u => m[u.id]).length;
  return { total: comMovimento.length, com,
           completa: comMovimento.length > 0 && com === comMovimento.length,
           faltando: comMovimento.filter(u => !m[u.id]) };
}

function resumoMes(ano, mes, filtro){
  const datas = datasDoMes(ano,mes);
  const realizado = totalMes(ano,mes,filtro);
  const diasLancados = datas.length;
  const media = diasLancados ? realizado/diasLancados : 0;
  const totalDias = diasNoMes(ano,mes);
  const projecao = media * totalDias;
  const meta = ano === 2026 ? metaMes(mes,filtro) : 0;
  const cob = coberturaMeta(ano,mes);
  return { realizado, diasLancados, media, totalDias, projecao, meta, cob,
           pctMeta: (meta && cob.completa) ? realizado*100/meta : null,
           pctProjMeta: (meta && cob.completa) ? projecao*100/meta - 100 : null };
}

/* ---------- comparação entre anos ----------
   Comparar julho/2026 (27 dias) com julho/2025 (31 dias) daria uma queda falsa.
   Então a comparação sempre usa os MESMOS dias do mês nos dois anos.          */
function comparaMes(mes, anoA, anoB, filtro){
  const dA = datasDoMes(anoA,mes), dB = datasDoMes(anoB,mes);
  if (!dA.length || !dB.length) return null;
  const diasA = new Set(dA.map(diaDe)), diasB = new Set(dB.map(diaDe));
  const comuns = [...diasA].filter(x => diasB.has(x));
  if (!comuns.length) return null;
  const soma = (datas) => datas.filter(d => comuns.includes(diaDe(d)))
                               .reduce((s,d)=>s+totalDoDia(d,filtro),0);
  const a = soma(dA), b = soma(dB);
  return { a, b, variacao: varPct(a,b), dias: comuns.length,
           parcial: comuns.length < Math.max(dA.length, dB.length) };
}
function acumuladoAte(ano, mes, dia, filtro){
  return DATAS.filter(d => anoDe(d)===ano && (mesDe(d)<mes || (mesDe(d)===mes && diaDe(d)<=dia)))
              .reduce((s,d)=>s+totalDoDia(d,filtro),0);
}

/* ---------- pendências ---------- */
function unidadesEsperadasEm(data){
  const lim = iso(new Date(dt(data).getTime() - 14*86400000));
  const ids = new Set();
  for (const d of DATAS){
    if (d >= data || d < lim) continue;
    for (const id of Object.keys(valoresDoDia(d))) ids.add(id);
  }
  return UNI.filter(u => ids.has(u.id));
}
function pendenciasDe(data){
  const dia = valoresDoDia(data);
  return unidadesEsperadasEm(data).filter(u => !(u.id in dia));
}

const ANO_ATUAL = anoDe(HOJE), MES_ATUAL = mesDe(HOJE);

/* ================================================================
   2. GRÁFICOS (SVG puro)
   ================================================================ */
function graficoLinha({pontos, altura=210, rotuloX=(p,i)=>p.rot, marcar=()=>null, serie2=null}){
  if (!pontos.length) return '<p class="nota">Sem dados no período.</p>';
  const L=52,R=12,T=16,B=30,W=Math.max(560,pontos.length*22),H=altura;
  const todos = pontos.map(p=>p.v).concat(serie2 ? serie2.map(p=>p.v) : []);
  const max = Math.max(...todos, 1);
  const y = v => T + (H-T-B)*(1 - v/max);
  const px = i => L + (W-L-R)*(pontos.length===1 ? .5 : i/(pontos.length-1));
  const media = pontos.reduce((s,p)=>s+p.v,0)/pontos.length;

  let eixos='';
  for (let i=0;i<=4;i++){
    const v=max*i/4, yy=y(v);
    eixos += `<line x1="${L}" y1="${yy.toFixed(1)}" x2="${W-R}" y2="${yy.toFixed(1)}" stroke="var(--line)"/>`;
    eixos += `<text x="${L-7}" y="${(yy+4).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--text-faint)">${v>=1000?Math.round(v/1000)+'k':Math.round(v)}</text>`;
  }
  const ym = y(media);
  eixos += `<line x1="${L}" y1="${ym.toFixed(1)}" x2="${W-R}" y2="${ym.toFixed(1)}" stroke="var(--brand-blue-2)" stroke-width="1.5" stroke-dasharray="5 4"/>`;
  eixos += `<text x="${W-R}" y="${(ym-6).toFixed(1)}" text-anchor="end" font-size="10" font-weight="700" fill="var(--brand-blue-2)">média ${brlCurto(media)}</text>`;

  let s2='';
  if (serie2 && serie2.length){
    const d2 = serie2.map((p,i)=>`${i?'L':'M'}${px(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
    s2 = `<path d="${d2}" fill="none" stroke="var(--text-faint)" stroke-width="1.8" stroke-dasharray="4 3" opacity=".8"/>`;
  }
  const linha = pontos.map((p,i)=>`${i?'L':'M'}${px(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  const area = `M${px(0).toFixed(1)},${(H-B).toFixed(1)}` +
    pontos.map((p,i)=>`L${px(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('') +
    `L${px(pontos.length-1).toFixed(1)},${(H-B).toFixed(1)}Z`;

  let marcas='', rotulos='', bolinhas='';
  pontos.forEach((p,i)=>{
    const x=px(i), yy=y(p.v), m=marcar(p,i);
    if (m){
      marcas += `<line x1="${x.toFixed(1)}" y1="${T}" x2="${x.toFixed(1)}" y2="${H-B}" stroke="var(--brand-red)" stroke-width="1" stroke-dasharray="3 3" opacity=".55"/>`;
      marcas += `<text x="${x.toFixed(1)}" y="${T-4}" text-anchor="middle" font-size="9.5" font-weight="700" fill="var(--brand-red)">${esc(m)}</text>`;
    }
    bolinhas += `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="2.6" fill="var(--brand-red)"><title>${esc(p.tit || (p.rot+': '+brl(p.v)))}</title></circle>`;
    const r = rotuloX(p,i);
    if (r) rotulos += `<text x="${x.toFixed(1)}" y="${H-10}" text-anchor="middle" font-size="10" fill="var(--text-faint)">${esc(r)}</text>`;
  });
  return `<div class="svg-caixa"><svg class="grafico" viewBox="0 0 ${W} ${H}" role="img">
    <defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--brand-red)" stop-opacity=".22"/>
      <stop offset="100%" stop-color="var(--brand-red)" stop-opacity="0"/></linearGradient></defs>
    ${eixos}${marcas}<path d="${area}" fill="url(#gA)"/>${s2}
    <path d="${linha}" fill="none" stroke="var(--brand-red)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
    ${bolinhas}${rotulos}</svg></div>`;
}

function graficoBarras({itens, altura=230, comMeta=false, series=null}){
  if (!itens.length) return '<p class="nota">Sem dados.</p>';
  const nSeries = series ? series.length : 1;
  const L=54,R=12,T=20,B=36,W=Math.max(560,itens.length*(nSeries>1?34*nSeries+22:74)),H=altura;
  const vals = [];
  for (const it of itens){
    if (series) for (const s of series) vals.push(it[s.chave]||0);
    else vals.push(it.v);
    if (it.meta) vals.push(it.meta);
  }
  const max = Math.max(...vals, 1);
  const y = v => T + (H-T-B)*(1 - v/max);
  const larg = (W-L-R)/itens.length;

  let eixos='';
  for (let i=0;i<=4;i++){
    const v=max*i/4, yy=y(v);
    eixos += `<line x1="${L}" y1="${yy.toFixed(1)}" x2="${W-R}" y2="${yy.toFixed(1)}" stroke="var(--line)"/>`;
    eixos += `<text x="${L-7}" y="${(yy+4).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--text-faint)">${v>=1e6?(v/1e6).toFixed(1)+'M':Math.round(v/1000)+'k'}</text>`;
  }
  let barras='';
  itens.forEach((it,i)=>{
    const cx = L + larg*i + larg/2;
    if (series){
      const bl = Math.min(30, (larg*0.8)/nSeries);
      series.forEach((s,j)=>{
        const v = it[s.chave]||0;
        const x = cx - (nSeries*bl)/2 + j*bl;
        const yv = y(v);
        barras += `<rect x="${x.toFixed(1)}" y="${yv.toFixed(1)}" width="${(bl-2).toFixed(1)}" height="${Math.max((H-B)-yv,0).toFixed(1)}" rx="3" fill="${s.cor}"><title>${esc(s.rot)} ${esc(it.rot)}: ${brl(v)}</title></rect>`;
      });
    } else {
      const bl = Math.min(46, larg*0.56);
      const yv = y(it.v);
      barras += `<rect x="${(cx-bl/2).toFixed(1)}" y="${yv.toFixed(1)}" width="${bl.toFixed(1)}" height="${Math.max((H-B)-yv,0).toFixed(1)}" rx="4" fill="${it.cor||'var(--brand-red)'}"><title>${esc(it.rot)}: ${brl(it.v)}</title></rect>`;
      if (it.v>0) barras += `<text x="${cx.toFixed(1)}" y="${(yv-5).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="var(--text-dim)">${brlCurto(it.v).replace('R$ ','')}</text>`;
      if (comMeta && it.meta){
        const ym = y(it.meta);
        barras += `<line x1="${(cx-bl/2-4).toFixed(1)}" y1="${ym.toFixed(1)}" x2="${(cx+bl/2+4).toFixed(1)}" y2="${ym.toFixed(1)}" stroke="var(--brand-blue)" stroke-width="2.5" stroke-linecap="round"><title>meta ${brl(it.meta)}</title></line>`;
      }
    }
    barras += `<text x="${cx.toFixed(1)}" y="${H-12}" text-anchor="middle" font-size="11" fill="var(--text-dim)">${esc(it.rot)}</text>`;
    if (it.rot2) barras += `<text x="${cx.toFixed(1)}" y="${H-1}" text-anchor="middle" font-size="9.5" fill="var(--text-faint)">${esc(it.rot2)}</text>`;
  });
  let legenda = '';
  if (series) legenda = series.map((s,j)=>`<text x="${L+j*86}" y="${T-7}" font-size="10.5" font-weight="700" fill="${s.cor}">■ ${esc(s.rot)}</text>`).join('');
  else if (comMeta) legenda = `<text x="${W-R}" y="${T-7}" text-anchor="end" font-size="10" fill="var(--brand-blue)">— traço azul = meta</text>`;
  return `<div class="svg-caixa"><svg class="grafico" viewBox="0 0 ${W} ${H}" role="img">${eixos}${barras}${legenda}</svg></div>`;
}

/* ---------- controles dos gráficos ----------
   Botões que ligam e desligam o que o gráfico mostra. Usam aria-pressed,
   então o estado é visível para quem enxerga e para leitor de tela.        */
function chips(itens, colado){
  return `<div class="chips"${colado ? ' style="min-height:38px;align-items:center"' : ' style="margin-bottom:12px"'}>${itens.map(i=>{
    const estilo = i.cor && i.ativo ? ` style="border-color:${i.cor};background:${i.cor};color:#fff"` : '';
    return `<button type="button" class="chip" aria-pressed="${!!i.ativo}" onclick="${i.acao}"${estilo}>${esc(i.rot)}</button>`;
  }).join('')}</div>`;
}
// filtro reutilizado pelos seletores de unidade dos gráficos
function filtroDe(sel){
  if (!sel || sel === 'todas') return null;
  if (sel === 'lojas') return ehLoja;
  if (sel === 'feiras') return ehFeira;
  if (sel.startsWith('grupo:')) return u => u && u.grupo === sel.slice(6);
  return u => u && u.id === sel;
}
function rotuloDe(sel){
  if (!sel || sel === 'todas') return 'a rede inteira';
  if (sel === 'lojas') return 'as lojas e quiosques';
  if (sel === 'feiras') return 'as feiras e eventos';
  if (sel.startsWith('grupo:')) return 'o grupo ' + sel.slice(6);
  return (porId.get(sel) || {}).nome || sel;
}
// <select> de unidade, com os agregados no topo
function seletorUnidade(valor, acao, unidades){
  const grupos = [...new Set(UNI.filter(u=>u.grupo).map(u=>u.grupo))];
  const lista = unidades || UNI;
  return `<select onchange="${acao}">
    <option value="todas" ${valor==='todas'?'selected':''}>Rede inteira</option>
    <option value="lojas" ${valor==='lojas'?'selected':''}>Só lojas e quiosques</option>
    <option value="feiras" ${valor==='feiras'?'selected':''}>Só feiras e eventos</option>
    ${grupos.map(g=>`<option value="grupo:${esc(g)}" ${valor==='grupo:'+g?'selected':''}>Grupo: ${esc(g)}</option>`).join('')}
    ${lista.map(u=>`<option value="${u.id}" ${valor===u.id?'selected':''}>${esc(u.nome)}</option>`).join('')}
  </select>`;
}

/* ================================================================
   3. PAINEL
   ================================================================ */
function telaPainel(){
  const ontem = iso(new Date(dt(HOJE).getTime() - 86400000));
  const totOntem = totalDoDia(ontem);
  const ds = diaSemana(ontem);

  // mesmo dia da semana, no mesmo mês
  const mesmos = datasDoMes(ANO_ATUAL, mesDe(ontem)).filter(d => diaSemana(d)===ds && d!==ontem);
  const mediaDs = mesmos.length ? mesmos.reduce((s,d)=>s+totalDoDia(d),0)/mesmos.length : 0;

  // mesmo dia da semana no ano anterior, na mesma semana do ano
  const alvo = new Date(dt(ontem).getTime() - 364*86400000);   // 52 semanas: cai no mesmo dia da semana
  const dataAA = iso(alvo);
  const totAA = DATAS.includes(dataAA) ? totalDoDia(dataAA) : null;

  const rm = resumoMes(ANO_ATUAL, MES_ATUAL);
  const cmpMesAA = comparaMes(MES_ATUAL, ANO_ATUAL, ANO_ATUAL-1);

  const acumAgora = acumuladoAte(ANO_ATUAL, MES_ATUAL, diaDe(HOJE));
  const acumAnt   = acumuladoAte(ANO_ATUAL-1, MES_ATUAL, diaDe(HOJE));

  const pend = pendenciasDe(HOJE), pendOntem = pendenciasDe(ontem);
  const fPainel = filtroDe(painelSerie);
  const ult = DATAS.slice(-30).map(d => {
    const v = totalDoDia(d, fPainel);
    return { rot: dataBr(d), v, tit: `${DIAS_SEM[diaSemana(d)]} ${dataBrLonga(d)}: ${brl(v)}` };
  });

  const top = unidadesDoMes(ANO_ATUAL, MES_ATUAL)
    .map(u => ({u, v: totalUnidadeMes(u.id, ANO_ATUAL, MES_ATUAL)}))
    .sort((a,b)=>b.v-a.v).slice(0,6);
  const maxTop = top.length ? top[0].v : 1;

  const anoT = totalAno(ANO_ATUAL), anoL = totalAno(ANO_ATUAL, ehLoja);

  let alerta = '';
  for (const [data, lista] of [[HOJE, pend], [ontem, pendOntem]]){
    if (!lista.length) continue;
    alerta += `<div class="aviso aviso--alerta"><span class="aviso__ico">${data===HOJE?'⏰':'⚠️'}</span><div>
      <strong>${lista.length} unidade${lista.length>1?'s':''} sem lançamento em ${dataBrLonga(data)}</strong>
      ${esc(lista.map(u=>u.curto).join(', '))}
      <div style="margin-top:8px"><button class="btn ${data===HOJE?'btn--primario':''} btn--pequeno" onclick="irLancar('${data}')">${data===HOJE?'Lançar agora':'Completar '+dataBr(data)}</button></div>
    </div></div>`;
  }

  return `
  <h2 class="titulo">Painel da rede</h2>
  <p class="sub">Situação em ${dataBrLonga(HOJE)} — dados reais de 2024, 2025 e 2026 importados das planilhas.</p>
  ${alerta}

  <div class="kpis bloco">
    <div class="kpi kpi--destaque">
      <div class="kpi__rot">Ontem · ${DIAS_SEM[ds]} ${dataBr(ontem)}</div>
      <div class="kpi__val">${brl(totOntem)}</div>
      <div class="kpi__pe">${mesmos.length ? `${mostraVar(varPct(totOntem, mediaDs))} contra as ${DIAS_SEM[ds].toLowerCase()}s do mês` : '—'}
        ${totAA!==null ? ` · ${mostraVar(varPct(totOntem, totAA))} contra ${ANO_ATUAL-1}` : ''}</div>
    </div>
    <div class="kpi">
      <div class="kpi__rot">${MESES[MES_ATUAL-1]} até agora</div>
      <div class="kpi__val">${brl(rm.realizado)}</div>
      <div class="kpi__pe">${rm.diasLancados} de ${rm.totalDias} dias · média ${brlCurto(rm.media)}/dia</div>
    </div>
    <div class="kpi">
      <div class="kpi__rot">${MESES[MES_ATUAL-1]} contra ${ANO_ATUAL-1}</div>
      <div class="kpi__val">${cmpMesAA ? pct(cmpMesAA.variacao) : '—'}</div>
      <div class="kpi__pe">${cmpMesAA
        ? `${brlCurto(cmpMesAA.a)} contra ${brlCurto(cmpMesAA.b)}, nos mesmos ${cmpMesAA.dias} dias`
        : 'sem base de comparação'}</div>
    </div>
    <div class="kpi">
      <div class="kpi__rot">Ano até ${dataBr(HOJE)}</div>
      <div class="kpi__val">${brlCurto(acumAgora)}</div>
      <div class="kpi__pe">${mostraVar(varPct(acumAgora, acumAnt))} contra ${brlCurto(acumAnt)} em ${ANO_ATUAL-1}</div>
    </div>
  </div>

  <div class="grade-2 bloco">
    <div class="card">
      <div class="card__cab">
        <p class="card__tit">Últimos 30 dias com lançamento</p>
        <p class="card__sub">Mostrando ${esc(rotuloDe(painelSerie))}, dia a dia. O traço azul é a média do período.</p>
      </div>
      <div class="card__corpo">
        ${chips([
          {rot:'Rede inteira', ativo: painelSerie==='todas',  acao:"setPainelSerie('todas')"},
          {rot:'Lojas',        ativo: painelSerie==='lojas',  acao:"setPainelSerie('lojas')"},
          {rot:'Feiras',       ativo: painelSerie==='feiras', acao:"setPainelSerie('feiras')"},
        ])}
        ${graficoLinha({pontos: ult, rotuloX:(p,i)=> i%4===0 ? p.rot : ''})}
      </div>
    </div>
    <div class="card">
      <div class="card__cab">
        <p class="card__tit">Maiores unidades em ${MESES[MES_ATUAL-1]}</p>
        <p class="card__sub">Participação no faturamento do mês.</p>
      </div>
      <div class="card__corpo">
        <ul class="lista-limpa">
          ${top.map(t=>`<li>
            <span style="flex:1;min-width:0">
              <b>${esc(t.u.nome)}</b> <span class="tag ${t.u.bloco==='lojas'?'tag--loja':'tag--feira'}">${t.u.bloco==='lojas'?'loja':'feira'}</span>
              <div class="barra" style="margin-top:5px"><i style="width:${(t.v*100/maxTop).toFixed(1)}%;background:${t.u.bloco==='lojas'?'var(--brand-blue)':'var(--brand-red)'}"></i></div>
            </span>
            <span class="num">${brlCurto(t.v)}</span></li>`).join('')}
        </ul>
      </div>
    </div>
  </div>

  <div class="card bloco">
    <div class="card__cab">
      <p class="card__tit">Lojas × Feiras em ${ANO_ATUAL}</p>
      <p class="card__sub">A divisão que a planilha calcula na aba Totais — aqui atualizada sozinha.</p>
    </div>
    <div class="card__corpo">
      <div class="barra" style="height:26px;border-radius:9px">
        <i style="width:${(anoL*100/anoT).toFixed(1)}%;background:var(--brand-blue)"></i>
        <i style="width:${((anoT-anoL)*100/anoT).toFixed(1)}%;background:var(--brand-red)"></i>
      </div>
      <div style="display:flex;gap:20px;margin-top:11px;flex-wrap:wrap;font-size:13px">
        <span><b style="color:var(--brand-blue)">■</b> Lojas e quiosques — <b>${(anoL*100/anoT).toFixed(1)}%</b> · ${brlCurto(anoL)}</span>
        <span><b style="color:var(--brand-red)">■</b> Feiras e eventos — <b>${((anoT-anoL)*100/anoT).toFixed(1)}%</b> · ${brlCurto(anoT-anoL)}</span>
      </div>
    </div>
  </div>`;
}

/* ================================================================
   4. LANÇAR
   ================================================================ */
let dataLancamento = HOJE;
let painelSerie = 'todas';
function setPainelSerie(v){ painelSerie = v; render(); }
function irLancar(data){ dataLancamento = data; abrir('lancar'); }

function telaLancar(){
  const data = dataLancamento;
  const esperadas = unidadesEsperadasEm(data);
  const dia = valoresDoDia(data);
  const lista = esperadas.length ? esperadas : UNI.filter(u=>u.ativa);
  const lojas = lista.filter(ehLoja), feiras = lista.filter(ehFeira);
  const esp = ESPECIAIS.get(data);

  const item = u => {
    const v = dia[u.id], ok = typeof v === 'number';
    return `<label class="lanc__item ${ok?'preenchido':''}">
      <span class="lanc__nome"><b>${esc(u.nome)}</b>
        <small>${esc(u.tipo)}${u.grupo?' · '+esc(u.grupo):''}</small></span>
      <span class="lanc__moeda"><span aria-hidden="true">R$</span>
        <input type="text" inputmode="decimal" placeholder="—" value="${ok?moeda(v):''}"
               aria-label="Valor de ${esc(u.nome)} em reais"
               data-uni="${u.id}" onfocus="this.select()"
               onchange="salvarLanc(this)" oninput="somarRodape()"></span></label>`;
  };

  return `
  <h2 class="titulo">Fechamento do dia</h2>
  <p class="sub">Uma tela só para a rede inteira. Tab ou Enter pula para a próxima unidade.</p>

  <div class="controles">
    <button class="btn" onclick="mudarDia(-1)">‹ Dia anterior</button>
    <div class="campo"><span>Data</span>
      <input type="date" value="${data}" min="2024-01-01" max="2026-12-31" onchange="dataLancamento=this.value;render()"></div>
    <button class="btn" onclick="mudarDia(1)">Próximo dia ›</button>
    <button class="btn" onclick="dataLancamento='${ULTIMA_DATA}';render()">Último dia lançado</button>
  </div>

  <div class="aviso aviso--info"><span class="aviso__ico">📅</span><div>
    <strong>${DIAS_SEM[diaSemana(data)]}, ${dataBrLonga(data)}${esp ? ' — ' + esc(esp.nome) : ''}</strong>
    ${Object.keys(dia).length} de ${lista.length} unidades lançadas.
    ${esp ? 'Data especial: o app guarda a marcação para comparar com o mesmo evento nos outros anos.' : ''}
  </div></div>

  ${lojas.length ? `<div class="bloco"><p class="card__tit" style="margin-bottom:8px">Lojas e quiosques</p>
    <div class="lanc">${lojas.map(item).join('')}</div></div>` : ''}
  ${feiras.length ? `<div class="bloco"><p class="card__tit" style="margin-bottom:8px">Feiras e eventos</p>
    <div class="lanc">${feiras.map(item).join('')}</div></div>` : ''}

  <div class="rodape-fixo" id="rodapeLanc"></div>
  <p class="nota">O lançamento ainda não está gravando no banco — isso entra na próxima etapa.
  Por enquanto o que você digitar fica só neste navegador e some ao recarregar a página.</p>`;
}

function salvarLanc(input){
  const id = input.dataset.uni;
  (RASCUNHO[dataLancamento] ||= {});
  const valor = lerMoeda(input.value);
  if (valor === null){
    delete RASCUNHO[dataLancamento][id];
    input.value = '';
  } else {
    RASCUNHO[dataLancamento][id] = valor;
    input.value = moeda(valor);      // devolve formatado: 7361 vira 7.361,00
  }
  input.closest('.lanc__item').classList.toggle('preenchido', input.value !== '');
  somarRodape();
}
function mudarDia(n){ dataLancamento = iso(new Date(dt(dataLancamento).getTime()+n*86400000)); render(); }
function somarRodape(){
  const el = document.getElementById('rodapeLanc');
  if (!el) return;
  let lojas=0, feiras=0, n=0;
  document.querySelectorAll('#sec-lancar input[data-uni]').forEach(i=>{
    const v = lerMoeda(i.value);          // soma ao vivo, mesmo meio digitado
    if (v === null) return;
    n++;
    if (ehLoja(porId.get(i.dataset.uni))) lojas += v; else feiras += v;
  });
  const rm = resumoMes(anoDe(dataLancamento), mesDe(dataLancamento));
  const total = lojas+feiras;
  // aqui vai com centavos: é a tela onde o valor é conferido contra o caixa
  el.innerHTML = `
    <div class="item"><span>Lojas</span><b>R$ ${moeda(lojas)}</b></div>
    <div class="item"><span>Feiras</span><b>R$ ${moeda(feiras)}</b></div>
    <div class="item grande"><span>Total do dia · ${n} lançadas</span><b>R$ ${moeda(total)}</b></div>
    <div class="item"><span>Contra a média do mês</span><b class="${classeVar(varPct(total,rm.media))}">${total&&rm.media?pct(varPct(total,rm.media)):'—'}</b></div>`;
}

/* ================================================================
   5. VISÃO MENSAL
   ================================================================ */
let mesSel = MES_ATUAL, anoMensal = ANO_ATUAL;
let mensalUnidade = 'todas', mensalMostrarAA = true;
function telaMensal(){
  const ano = anoMensal, mes = mesSel;
  const datas = datasDoMes(ano,mes);
  if (!datas.length) return `<h2 class="titulo">Visão mensal</h2>${seletorMes()}<p class="nota">Sem lançamentos em ${MESES[mes-1]} de ${ano}.</p>`;

  const unis = unidadesDoMes(ano,mes);
  const lojas = unis.filter(ehLoja), feiras = unis.filter(ehFeira);
  const r = resumoMes(ano,mes);
  const cmp = comparaMes(mes, ano, ano-1);
  const ordenados = datas.map(d=>({d, v:totalDoDia(d)}));
  const melhor = [...ordenados].sort((a,b)=>b.v-a.v)[0];
  const pior = [...ordenados].filter(x=>x.v>0).sort((a,b)=>a.v-b.v)[0];

  const celula = (d,u) => { const v = valor(d,u.id); return v===null ? '<td class="vazio">—</td>' : `<td>${num(v)}</td>`; };
  const linhas = datas.map(d => {
    const esp = ESPECIAIS.get(d);
    const tl = totalDoDia(d, ehLoja), tf = totalDoDia(d, ehFeira);
    return `<tr class="${ehFds(d)?'fds':''}">
      <td class="fix"><b>${diaDe(d)}</b> <span style="color:var(--text-faint)">${DIAS_SEM_C[diaSemana(d)]}</span>
        ${esp?`<div class="especial" style="font-size:10.5px">${esc(esp.curto||esp.nome)}</div>`:''}</td>
      ${lojas.map(u=>celula(d,u)).join('')}
      <td style="font-weight:700">${num(tl)}</td>
      ${feiras.map(u=>celula(d,u)).join('')}
      <td style="font-weight:700">${num(tf)}</td>
      <td style="font-weight:800;color:var(--brand-red)">${num(tl+tf)}</td></tr>`;
  }).join('');

  const totLinha = (rot, fn, cls) => `<tr class="${cls}"><td class="fix">${rot}</td>
    ${lojas.map(u=>`<td>${fn(u)}</td>`).join('')}<td>${fn(null,'lojas')}</td>
    ${feiras.map(u=>`<td>${fn(u)}</td>`).join('')}<td>${fn(null,'feiras')}</td><td>${fn(null,'geral')}</td></tr>`;
  const somaCol = u => totalUnidadeMes(u.id, ano, mes);
  const dl = r.diasLancados || 1;

  const rodape =
    totLinha('Total', (u,g)=> u ? num(somaCol(u))
      : num(g==='lojas' ? totalMes(ano,mes,ehLoja) : g==='feiras' ? totalMes(ano,mes,ehFeira) : r.realizado), 'lin-total') +
    totLinha('Média/dia', (u,g)=>{
      if (u){ const n = diasComVendaNoMes(u.id,ano,mes); return n ? num(somaCol(u)/n) : '—'; }
      return num((g==='lojas' ? totalMes(ano,mes,ehLoja) : g==='feiras' ? totalMes(ano,mes,ehFeira) : r.realizado)/dl);
    }, 'lin-sub') +
    totLinha('Projeção', (u,g)=>{
      if (u){ const n = diasComVendaNoMes(u.id,ano,mes); return n ? num(somaCol(u)/n*r.totalDias) : '—'; }
      return num((g==='lojas' ? totalMes(ano,mes,ehLoja) : g==='feiras' ? totalMes(ano,mes,ehFeira) : r.realizado)/dl*r.totalDias);
    }, 'lin-sub') +
    totLinha(`Mesmo mês de ${ano-1}`, (u,g)=>{
      const f = u ? (x=>x&&x.id===u.id) : g==='lojas' ? ehLoja : g==='feiras' ? ehFeira : null;
      const c = comparaMes(mes, ano, ano-1, f);
      return c ? num(c.b) : '<span class="vazio">—</span>';
    }, 'lin-sub') +
    totLinha('Variação', (u,g)=>{
      const f = u ? (x=>x&&x.id===u.id) : g==='lojas' ? ehLoja : g==='feiras' ? ehFeira : null;
      const c = comparaMes(mes, ano, ano-1, f);
      return c ? mostraVar(c.variacao) : '<span class="vazio">—</span>';
    }, 'lin-sub');

  // fins de semana (sexta a domingo)
  const fdsGrupos = [];
  for (const d of datas){
    if (diaSemana(d) !== 5) continue;
    const bloco = [0,1,2].map(k => iso(new Date(dt(d).getTime()+k*86400000))).filter(x => datas.includes(x));
    fdsGrupos.push({dias:bloco, v: bloco.reduce((s,x)=>s+totalDoDia(x),0)});
  }
  const somaFds = fdsGrupos.reduce((s,g)=>s+g.v,0);

  const resumoUni = unis.map(u=>{
    const t = somaCol(u), n = diasComVendaNoMes(u.id,ano,mes);
    const c = comparaMes(mes, ano, ano-1, x=>x&&x.id===u.id);
    return {u, t, n, aa: c};
  }).sort((a,b)=>b.t-a.t);

  // o gráfico segue a unidade escolhida; as tabelas continuam mostrando tudo
  const fGraf = filtroDe(mensalUnidade);
  const pontos = datas.map(d=>{
    const v = totalDoDia(d, fGraf);
    return { rot:String(diaDe(d)), v, tit:`${DIAS_SEM[diaSemana(d)]} ${dataBrLonga(d)}: ${brl(v)}` };
  });
  // linha pontilhada do ano anterior, dia a dia
  const datasAA = datasDoMes(ano-1, mes);
  const temAA = datasAA.length > 0;
  const serie2 = (temAA && mensalMostrarAA) ? datas.map(d=>{
    const alvo = datasAA.find(x => diaDe(x) === diaDe(d));
    return { rot: String(diaDe(d)), v: alvo ? totalDoDia(alvo, fGraf) : 0 };
  }) : null;
  const unisDoAno = UNI.filter(u => u.anos.includes(ano));

  return `
  <h2 class="titulo">Visão mensal</h2>
  <p class="sub">O mesmo formato da planilha — só que Total, Média, Projeção, fim de semana e a comparação com o ano anterior se calculam sozinhos.</p>
  ${seletorMes()}

  ${!r.cob.completa && ano === 2026 ? `<div class="aviso aviso--alerta"><span class="aviso__ico">🎯</span><div>
    <strong>Meta incompleta neste mês na planilha</strong>
    Só ${r.cob.com} de ${r.cob.total} unidades com movimento têm meta cadastrada em ${MESES[mes-1]}${r.cob.faltando.length?' — faltam '+esc(r.cob.faltando.map(u=>u.curto).join(', ')):''}.
    Por isso o app não mostra "% da meta" aqui: com meta pela metade, o percentual daria um número sem sentido
    (a planilha mostra +335% em julho por causa disso).
  </div></div>` : ''}

  <div class="kpis bloco">
    <div class="kpi kpi--destaque">
      <div class="kpi__rot">Realizado</div>
      <div class="kpi__val">${brl(r.realizado)}</div>
      <div class="kpi__pe">${r.pctMeta!==null ? `${r.pctMeta.toFixed(0)}% da meta de ${brlCurto(r.meta)}` : `${r.diasLancados} de ${r.totalDias} dias lançados`}</div>
    </div>
    <div class="kpi">
      <div class="kpi__rot">Contra ${MESES[mes-1]} de ${ano-1}</div>
      <div class="kpi__val">${cmp ? pct(cmp.variacao) : '—'}</div>
      <div class="kpi__pe">${cmp ? `${brlCurto(cmp.a)} contra ${brlCurto(cmp.b)}${cmp.parcial?`, nos mesmos ${cmp.dias} dias`:''}` : `sem dados de ${ano-1}`}</div>
    </div>
    <div class="kpi">
      <div class="kpi__rot">Média por dia</div>
      <div class="kpi__val">${brl(r.media)}</div>
      <div class="kpi__pe">dividido por ${r.diasLancados} dias lançados — sem digitar nada</div>
    </div>
    <div class="kpi">
      <div class="kpi__rot">Melhor dia</div>
      <div class="kpi__val">${melhor?brlCurto(melhor.v):'—'}</div>
      <div class="kpi__pe">${melhor?`${DIAS_SEM[diaSemana(melhor.d)]} ${dataBr(melhor.d)}`:''}${pior?` · pior: ${dataBr(pior.d)} (${brlCurto(pior.v)})`:''}</div>
    </div>
  </div>

  <div class="card bloco">
    <div class="card__cab">
      <p class="card__tit">Dia a dia de ${MESES[mes-1]} de ${ano}</p>
      <p class="card__sub">Mostrando ${esc(rotuloDe(mensalUnidade))}. Linha cheia = ${ano}.
        ${serie2?`Linha pontilhada cinza = ${ano-1}. `:''}Traço azul = média do mês. Marcas vermelhas = datas especiais.</p>
    </div>
    <div class="card__corpo">
      <div class="controles" style="margin-bottom:12px">
        <div class="campo"><span>O gráfico mostra</span>
          ${seletorUnidade(mensalUnidade, 'mensalUnidade=this.value;render()', unisDoAno)}</div>
        ${temAA ? `<div class="campo"><span>Comparar</span>
          ${chips([{rot:`Linha de ${ano-1}`, ativo: mensalMostrarAA, acao:'mensalMostrarAA=!mensalMostrarAA;render()'}], true)}</div>` : ''}
      </div>
      ${graficoLinha({pontos, serie2, rotuloX:(p,i)=> i%3===0?p.rot:'',
        marcar:(p,i)=>{ const e=ESPECIAIS.get(datas[i]); return e ? (e.curto||e.nome) : null; }})}
    </div>
  </div>

  <div class="bloco">
    <p class="card__tit" style="margin-bottom:8px">Tabela do mês</p>
    <div class="rolagem">
      <table>
        <thead><tr><th class="fix">Dia</th>
          ${lojas.map(u=>`<th>${esc(u.curto)}</th>`).join('')}
          <th style="color:var(--brand-blue-2)">Σ Lojas</th>
          ${feiras.map(u=>`<th>${esc(u.curto)}</th>`).join('')}
          <th style="color:var(--brand-red-2)">Σ Feiras</th><th>Total</th></tr></thead>
        <tbody>${linhas}</tbody>
        <tfoot>${rodape}</tfoot>
      </table>
    </div>
    <p class="nota">Linhas em azul claro são sexta, sábado e domingo. Valores em reais, sem centavos — igual à planilha.</p>
  </div>

  <div class="grade-2 bloco">
    <div class="card">
      <div class="card__cab"><p class="card__tit">Fins de semana</p>
        <p class="card__sub">Sexta + sábado + domingo, somados automaticamente.</p></div>
      <div class="card__corpo">
        <ul class="lista-limpa">
          ${fdsGrupos.map(g=>`<li><span>${dataBr(g.dias[0])} a ${dataBr(g.dias[g.dias.length-1])}
            <span style="color:var(--text-faint)">(${g.dias.length} dia${g.dias.length>1?'s':''})</span></span>
            <span class="num">${brl(g.v)}</span></li>`).join('') || '<li class="vazio">Nenhum fim de semana no período.</li>'}
        </ul>
        ${fdsGrupos.length?`<p class="nota">Total dos fins de semana: <b>${brl(somaFds)}</b> — ${(somaFds*100/r.realizado).toFixed(0)}% do mês.</p>`:''}
      </div>
    </div>
    <div class="card">
      <div class="card__cab"><p class="card__tit">Unidades do mês</p>
        <p class="card__sub">Cada uma contra o mesmo mês de ${ano-1}.</p></div>
      <div class="card__corpo" style="padding:0">
        <div class="rolagem" style="border:0;box-shadow:none">
        <table>
          <thead><tr><th class="fix">Unidade</th><th>${ano}</th><th>${ano-1}</th><th>Variação</th></tr></thead>
          <tbody>${resumoUni.map(x=>`<tr>
            <td class="fix">${esc(x.u.curto)} <span class="tag ${x.u.bloco==='lojas'?'tag--loja':'tag--feira'}">${x.u.bloco==='lojas'?'loja':'feira'}</span></td>
            <td>${num(x.t)}</td>
            <td>${x.aa?num(x.aa.b):'<span class="vazio">—</span>'}</td>
            <td>${x.aa?mostraVar(x.aa.variacao):'<span class="vazio">—</span>'}</td></tr>`).join('')}</tbody>
        </table></div>
      </div>
    </div>
  </div>`;
}

function seletorMes(){
  return `<div class="controles">
    <div class="campo"><span>Ano</span>
      <select onchange="anoMensal=+this.value;ajustarMes();render()">
        ${ANOS.map(a=>`<option value="${a}" ${a===anoMensal?'selected':''}>${a}</option>`).join('')}
      </select></div>
    <div class="campo"><span>Mês</span>
      <select onchange="mesSel=+this.value;render()">
        ${MESES.map((m,i)=>{const n=i+1, tem=datasDoMes(anoMensal,n).length;
          return `<option value="${n}" ${n===mesSel?'selected':''} ${tem?'':'disabled'}>${m[0].toUpperCase()+m.slice(1)}${tem?'':' (sem dados)'}</option>`;}).join('')}
      </select></div>
  </div>`;
}
function ajustarMes(){
  if (!datasDoMes(anoMensal, mesSel).length){
    const m = mesesDoAno(anoMensal);
    mesSel = m.length ? m[m.length-1] : mesSel;
  }
}

/* ================================================================
   6. VISÃO ANUAL
   ================================================================ */
let anoSel = ANO_ATUAL;
let anualUnidade = 'todas';
const anosVisiveis = new Set(ANOS);
function alternarAno(a){
  if (anosVisiveis.has(a)) { if (anosVisiveis.size > 1) anosVisiveis.delete(a); }
  else anosVisiveis.add(a);
  render();
}
function telaAnual(){
  const ano = anoSel;
  const meses = mesesDoAno(ano);
  const unis = UNI.filter(u => u.anos.includes(ano));
  const lojas = unis.filter(ehLoja), feiras = unis.filter(ehFeira);
  const total = totalAno(ano), tLojas = totalAno(ano, ehLoja);

  const linhaUni = u => {
    const vals = meses.map(m=>totalUnidadeMes(u.id,ano,m));
    const tot = vals.reduce((a,b)=>a+b,0);
    const anterior = totalAno(ano-1) ? MESES.map((_,i)=>totalUnidadeMes(u.id,ano-1,i+1)).reduce((a,b)=>a+b,0) : 0;
    return `<tr><td class="fix">${esc(u.nome)}</td>
      ${vals.map(v=>v?`<td>${num(v)}</td>`:'<td class="vazio">—</td>').join('')}
      <td style="font-weight:700">${num(tot)}</td>
      <td>${(tot*100/total).toFixed(1)}%</td>
      <td>${anterior?mostraVar(varPct(tot,anterior)):'<span class="vazio">—</span>'}</td></tr>`;
  };
  const linhaSub = (rot, filtro) => {
    const vals = meses.map(m=>totalMes(ano,m,filtro));
    const tot = vals.reduce((a,b)=>a+b,0);
    const ant = totalAno(ano-1, filtro);
    return `<tr class="lin-sub"><td class="fix">${rot}</td>
      ${vals.map(v=>`<td>${num(v)}</td>`).join('')}
      <td>${num(tot)}</td><td>${(tot*100/total).toFixed(1)}%</td>
      <td>${ant?mostraVar(varPct(tot,ant)):'<span class="vazio">—</span>'}</td></tr>`;
  };

  // 12 meses, os anos escolhidos lado a lado
  const fAnual = filtroDe(anualUnidade);
  const barras = MESES.map((_,i)=>{
    const m = i+1;
    const it = { rot: MES_CURTO[i] };
    for (const a of ANOS) it['a'+a] = totalMes(a,m,fAnual);
    return it;
  });
  const cores = { 2024:'#8b96aa', 2025:'#14528c', 2026:'#c2211f' };
  const series = ANOS.filter(a=>anosVisiveis.has(a))
    .map(a=>({chave:'a'+a, rot:String(a), cor:cores[a]||'#2c78bd'}));

  const maiorMes = meses.map(m=>({m,v:totalMes(ano,m)})).sort((a,b)=>b.v-a.v)[0];
  const antTotal = totalAno(ano-1);

  return `
  <h2 class="titulo">Visão anual</h2>
  <p class="sub">A aba Totais da planilha, atualizada sozinha — e com os três anos na mesma tela.</p>

  <div class="controles">
    <div class="campo"><span>Ano</span>
      <select onchange="anoSel=+this.value;render()">
        ${ANOS.map(a=>`<option value="${a}" ${a===ano?'selected':''}>${a}</option>`).join('')}
      </select></div>
    <span class="nota" style="margin:0">${meses.length} meses com lançamento · ${unis.length} unidades</span>
  </div>

  <div class="kpis bloco">
    <div class="kpi kpi--destaque">
      <div class="kpi__rot">Total de ${ano}</div>
      <div class="kpi__val">${brlCurto(total)}</div>
      <div class="kpi__pe">${meses.length} meses lançados</div>
    </div>
    <div class="kpi">
      <div class="kpi__rot">Contra ${ano-1}</div>
      <div class="kpi__val">${antTotal ? pct(varPct(total,antTotal)) : '—'}</div>
      <div class="kpi__pe">${antTotal ? `${brlCurto(antTotal)} em ${ano-1}${meses.length<12?' (ano inteiro)':''}` : `sem dados de ${ano-1}`}</div>
    </div>
    <div class="kpi">
      <div class="kpi__rot">Lojas × Feiras</div>
      <div class="kpi__val">${(tLojas*100/total).toFixed(0)} / ${((total-tLojas)*100/total).toFixed(0)}</div>
      <div class="kpi__pe">${brlCurto(tLojas)} · ${brlCurto(total-tLojas)}</div>
    </div>
    <div class="kpi">
      <div class="kpi__rot">Maior mês</div>
      <div class="kpi__val">${MESES[maiorMes.m-1][0].toUpperCase()+MESES[maiorMes.m-1].slice(1)}</div>
      <div class="kpi__pe">${brlCurto(maiorMes.v)}</div>
    </div>
  </div>

  <div class="card bloco">
    <div class="card__cab"><p class="card__tit">Ano a ano, mês a mês</p>
      <p class="card__sub">Mostrando ${esc(rotuloDe(anualUnidade))}. Clique num ano para tirar e pôr de volta.</p></div>
    <div class="card__corpo">
      <div class="controles" style="margin-bottom:12px">
        <div class="campo"><span>O gráfico mostra</span>
          ${seletorUnidade(anualUnidade, 'anualUnidade=this.value;render()')}</div>
        <div class="campo"><span>Anos</span>
          ${chips(ANOS.map(a=>({rot:String(a), ativo:anosVisiveis.has(a), cor:cores[a], acao:`alternarAno(${a})`})), true)}
        </div>
      </div>
      ${graficoBarras({itens:barras, series, altura:250})}
      <p class="nota">2026 tem lançamentos até 27 de julho — os meses seguintes aparecem zerados de propósito.</p>
    </div>
  </div>

  <div class="bloco">
    <p class="card__tit" style="margin-bottom:8px">Unidade × mês em ${ano}</p>
    <div class="rolagem">
      <table>
        <thead><tr><th class="fix">Unidade</th>
          ${meses.map(m=>`<th>${MES_CURTO[m-1]}</th>`).join('')}
          <th>Ano</th><th>%</th><th>× ${ano-1}</th></tr></thead>
        <tbody>
          ${lojas.map(linhaUni).join('')}
          ${linhaSub('Σ Lojas e quiosques', ehLoja)}
          ${feiras.map(linhaUni).join('')}
          ${linhaSub('Σ Feiras e eventos', ehFeira)}
        </tbody>
        <tfoot><tr class="lin-total"><td class="fix">Total da rede</td>
          ${meses.map(m=>`<td>${num(totalMes(ano,m))}</td>`).join('')}
          <td>${num(total)}</td><td>100%</td>
          <td>${antTotal?mostraVar(varPct(total,antTotal)):'—'}</td></tr></tfoot>
      </table>
    </div>
  </div>`;
}

/* ================================================================
   7. COMPARAÇÕES
   ================================================================ */
let cmpUnidade = 'todas', cmpAno = ANO_ATUAL, cmpMes = 0, cmpMostrarAnt = true;
function telaComparar(){
  const filtro = u => cmpUnidade==='todas' ? true
    : cmpUnidade==='lojas' ? ehLoja(u)
    : cmpUnidade==='feiras' ? ehFeira(u)
    : cmpUnidade.startsWith('grupo:') ? u.grupo === cmpUnidade.slice(6)
    : u.id === cmpUnidade;
  const ano = cmpAno;
  const datas = cmpMes ? datasDoMes(ano,cmpMes) : DATAS.filter(d=>anoDe(d)===ano);
  const tot = d => totalDoDia(d, filtro);

  /* --- dia da semana, com o ano anterior ao lado --- */
  const datasAnt = cmpMes ? datasDoMes(ano-1,cmpMes) : DATAS.filter(d=>anoDe(d)===ano-1);
  const porDs = DIAS_SEM.map((nome,i)=>{
    const a = datas.filter(d=>diaSemana(d)===i);
    const b = datasAnt.filter(d=>diaSemana(d)===i);
    const somaA = a.reduce((s,d)=>s+tot(d),0), somaB = b.reduce((s,d)=>s+tot(d),0);
    return { nome, curto:DIAS_SEM_C[i], n:a.length, soma:somaA,
             media: a.length?somaA/a.length:0, mediaAnt: b.length?somaB/b.length:0 };
  });
  const somaSemana = porDs.reduce((s,x)=>s+x.soma,0) || 1;
  const maxMedia = Math.max(...porDs.map(x=>x.media));
  const barrasDs = porDs.map(x=>({ rot:x.curto, rot2:x.n+'x', ['a'+ano]:Math.round(x.media), ['a'+(ano-1)]:Math.round(x.mediaAnt) }));
  const temAnt = porDs.some(x=>x.mediaAnt > 0);
  const seriesDs = [
    ...(temAnt && cmpMostrarAnt ? [{chave:'a'+(ano-1), rot:String(ano-1), cor:'#8b96aa'}] : []),
    {chave:'a'+ano, rot:String(ano), cor:'#c2211f'},
  ];

  /* --- mês a mês contra o ano anterior --- */
  const mm = mesesDoAno(ano).map(m=>{
    const c = comparaMes(m, ano, ano-1, filtro);
    const v = totalMes(ano,m,filtro);
    const dias = datasDoMes(ano,m).length;
    return { m, v, dias, media: dias?v/dias:0, cmp:c };
  });

  /* --- datas especiais: cada uma contra a mesma data do ano anterior --- */
  const espComDado = D.datasEspeciais
    .filter(e => anoDe(e.data)===ano && DATAS.includes(e.data) && (!cmpMes || mesDe(e.data)===cmpMes))
    .map(e=>{
      const v = tot(e.data);
      const ds = diaSemana(e.data);
      const vizinhos = datas.filter(d=>diaSemana(d)===ds && d!==e.data && Math.abs(dt(d)-dt(e.data)) < 45*86400000);
      const normal = vizinhos.length ? vizinhos.reduce((s,d)=>s+tot(d),0)/vizinhos.length : 0;
      // mesmo evento no ano anterior
      const irmao = D.datasEspeciais.find(x => x.nome===e.nome && anoDe(x.data)===ano-1);
      const vAnt = irmao && DATAS.includes(irmao.data) ? tot(irmao.data) : null;
      return {...e, v, normal, contraNormal: varPct(v,normal), vAnt, contraAnt: vAnt!==null?varPct(v,vAnt):null, irmao, ds};
    });

  /* --- unidade a unidade, ano contra ano --- */
  const rank = UNI.filter(u => u.anos.includes(ano) || u.anos.includes(ano-1)).map(u=>{
    const f = x => x && x.id === u.id;
    const somaAno = (a) => (cmpMes ? totalUnidadeMes(u.id,a,cmpMes)
      : MESES.map((_,i)=>totalUnidadeMes(u.id,a,i+1)).reduce((x,y)=>x+y,0));
    const a = somaAno(ano), b = somaAno(ano-1);
    return { u, a, b, variacao: b ? varPct(a,b) : null };
  }).filter(x=>x.a>0||x.b>0).sort((a,b)=>b.a-a.a);

  const grupos = [...new Set(UNI.filter(u=>u.grupo).map(u=>u.grupo))];
  const rotuloPeriodo = cmpMes ? `${MESES[cmpMes-1]} de ${ano}` : `${ano} inteiro`;

  return `
  <h2 class="titulo">Comparações</h2>
  <p class="sub">O que a planilha não fazia. Tudo aqui sai sozinho da data do lançamento.</p>

  <div class="controles">
    <div class="campo"><span>Unidade</span>
      <select onchange="cmpUnidade=this.value;render()">
        <option value="todas" ${cmpUnidade==='todas'?'selected':''}>Rede inteira</option>
        <option value="lojas" ${cmpUnidade==='lojas'?'selected':''}>Só lojas e quiosques</option>
        <option value="feiras" ${cmpUnidade==='feiras'?'selected':''}>Só feiras e eventos</option>
        ${grupos.map(g=>`<option value="grupo:${esc(g)}" ${cmpUnidade==='grupo:'+g?'selected':''}>Grupo: ${esc(g)}</option>`).join('')}
        ${UNI.map(u=>`<option value="${u.id}" ${cmpUnidade===u.id?'selected':''}>${esc(u.nome)}</option>`).join('')}
      </select></div>
    <div class="campo"><span>Ano</span>
      <select onchange="cmpAno=+this.value;render()">
        ${ANOS.map(a=>`<option value="${a}" ${a===ano?'selected':''}>${a}</option>`).join('')}
      </select></div>
    <div class="campo"><span>Período</span>
      <select onchange="cmpMes=+this.value;render()">
        <option value="0" ${!cmpMes?'selected':''}>Ano inteiro</option>
        ${mesesDoAno(ano).map(m=>`<option value="${m}" ${cmpMes===m?'selected':''}>${MESES[m-1][0].toUpperCase()+MESES[m-1].slice(1)}</option>`).join('')}
      </select></div>
  </div>

  <div class="card bloco">
    <div class="card__cab"><p class="card__tit">Média por dia da semana — ${esc(rotuloPeriodo)}</p>
      <p class="card__sub">Comparar sábado com terça não diz nada. Esta é a comparação que vale no varejo, e agora com ${ano-1} do lado.</p></div>
    <div class="card__corpo">
      ${temAnt ? chips([{rot:`Comparar com ${ano-1}`, ativo: cmpMostrarAnt, acao:'cmpMostrarAnt=!cmpMostrarAnt;render()'}]) : ''}
      ${graficoBarras({itens:barrasDs, series:seriesDs, altura:220})}
      <div class="rolagem" style="border:0;box-shadow:none;margin-top:10px">
        <table>
          <thead><tr><th class="fix">Dia</th><th>Média ${ano}</th><th>Média ${ano-1}</th><th>Variação</th><th>% da semana</th><th>Ocorrências</th></tr></thead>
          <tbody>${porDs.map(x=>`<tr>
            <td class="fix">${x.nome}${x.media===maxMedia?' <span class="tag">melhor</span>':''}</td>
            <td>${num(x.media)}</td>
            <td>${x.mediaAnt?num(x.mediaAnt):'<span class="vazio">—</span>'}</td>
            <td>${x.mediaAnt?mostraVar(varPct(x.media,x.mediaAnt)):'<span class="vazio">—</span>'}</td>
            <td>${(x.soma*100/somaSemana).toFixed(1)}%</td><td>${x.n}</td></tr>`).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="grade-2 bloco">
    <div class="card">
      <div class="card__cab"><p class="card__tit">Mês a mês</p>
        <p class="card__sub">Cada mês contra o mesmo mês de ${ano-1}, usando os mesmos dias nos dois anos.</p></div>
      <div class="card__corpo" style="padding:0">
        <div class="rolagem" style="border:0;box-shadow:none">
        <table>
          <thead><tr><th class="fix">Mês</th><th>Total</th><th>Média/dia</th><th>× ${ano-1}</th></tr></thead>
          <tbody>${mm.map(x=>`<tr>
            <td class="fix">${MESES[x.m-1][0].toUpperCase()+MESES[x.m-1].slice(1)}</td>
            <td>${num(x.v)}</td><td>${num(x.media)}</td>
            <td>${x.cmp?mostraVar(x.cmp.variacao):'<span class="vazio">—</span>'}</td></tr>`).join('')}</tbody>
        </table></div>
      </div>
    </div>

    <div class="card">
      <div class="card__cab"><p class="card__tit">Datas especiais</p>
        <p class="card__sub">Cada data contra um dia normal e contra o mesmo evento de ${ano-1}.</p></div>
      <div class="card__corpo" style="padding:0">
        <div class="rolagem" style="border:0;box-shadow:none">
        <table>
          <thead><tr><th class="fix">Data</th><th>Vendeu</th><th>× dia normal</th><th>× ${ano-1}</th></tr></thead>
          <tbody>${espComDado.map(e=>`<tr>
            <td class="fix"><b>${esc(e.nome)}</b><div style="font-size:11px;color:var(--text-faint)">${DIAS_SEM_C[e.ds]} ${dataBr(e.data)}${e.irmao?` · ${ano-1}: ${DIAS_SEM_C[diaSemana(e.irmao.data)]} ${dataBr(e.irmao.data)}`:''}</div></td>
            <td>${num(e.v)}</td>
            <td>${e.contraNormal===null?'<span class="vazio">—</span>':mostraVar(e.contraNormal)}</td>
            <td>${e.contraAnt===null?'<span class="vazio">—</span>':mostraVar(e.contraAnt)}</td></tr>`).join('')
            || '<tr><td colspan="4" class="vazio">Nenhuma data especial no período.</td></tr>'}</tbody>
        </table></div>
        <p class="nota" style="padding:0 16px 14px">É por isso que o calendário existe: o Dia das Mães cai num domingo
        diferente todo ano, então comparar pela data do mês daria a resposta errada.</p>
      </div>
    </div>
  </div>

  <div class="bloco">
    <p class="card__tit" style="margin-bottom:8px">Unidade a unidade — ${esc(rotuloPeriodo)} contra ${ano-1}</p>
    <div class="rolagem">
      <table>
        <thead><tr><th class="fix">Unidade</th><th>${ano}</th><th>${ano-1}</th><th>Variação</th><th>% do período</th></tr></thead>
        <tbody>${(()=>{ const tt = rank.reduce((s,x)=>s+x.a,0)||1; return rank.map(x=>`<tr>
          <td class="fix">${esc(x.u.nome)} <span class="tag ${x.u.bloco==='lojas'?'tag--loja':'tag--feira'}">${x.u.bloco==='lojas'?'loja':'feira'}</span></td>
          <td>${x.a?num(x.a):'<span class="vazio">—</span>'}</td>
          <td>${x.b?num(x.b):'<span class="vazio">—</span>'}</td>
          <td>${x.variacao===null?'<span class="vazio">—</span>':mostraVar(x.variacao)}</td>
          <td>${x.a?(x.a*100/tt).toFixed(1)+'%':'—'}</td></tr>`).join(''); })()}</tbody>
      </table>
    </div>
    <p class="nota">Unidades que existiam em ${ano-1} e não aparecem em ${ano} ficam na lista com a coluna de ${ano} vazia —
    é assim que se enxerga o que a rede fechou.</p>
  </div>`;
}

/* ================================================================
   8. CADASTROS
   ================================================================ */
function telaCadastros(){
  const linhaUni = u => `<tr>
    <td class="fix">${esc(u.nome)}</td>
    <td style="text-align:left"><span class="tag">${esc(u.tipo)}</span></td>
    <td style="text-align:left"><span class="tag ${u.bloco==='lojas'?'tag--loja':'tag--feira'}">${u.bloco==='lojas'?'Lojas':'Feiras'}</span></td>
    <td style="text-align:left">${u.grupo?esc(u.grupo):'<span class="vazio">—</span>'}</td>
    <td style="text-align:left">${u.ativa?'<span class="up">Ativa</span>':'<span class="vazio">Inativa</span>'}</td>
    <td style="text-align:left">${u.anos.join(', ')}</td>
    <td>${u.primeiro?dataBr(u.primeiro)+'/'+anoDe(u.primeiro).toString().slice(2)+' a '+dataBr(u.ultimo)+'/'+anoDe(u.ultimo).toString().slice(2):'—'}</td>
    <td>${u.diasComVenda||0}</td></tr>`;

  const conf = D.conferencia;
  const batem = conf.filter(c => Math.abs(c.dif) <= 1).length;
  const historico = D.dePara.filter(d => d.nota);

  return `
  <h2 class="titulo">Cadastros</h2>
  <p class="sub">Some a ideia de "coluna da planilha". Cada unidade é um cadastro, e por isso nada quebra quando uma feira abre, fecha ou troca de nome.</p>

  <div class="bloco">
    <p class="card__tit" style="margin-bottom:8px">Unidades (${UNI.length})</p>
    <div class="rolagem">
      <table>
        <thead><tr><th class="fix">Nome</th><th style="text-align:left">Tipo</th><th style="text-align:left">Bloco</th>
        <th style="text-align:left">Grupo</th><th style="text-align:left">Situação</th><th style="text-align:left">Anos</th>
        <th>Período</th><th>Dias</th></tr></thead>
        <tbody>${UNI.filter(ehLoja).map(linhaUni).join('')}${UNI.filter(ehFeira).map(linhaUni).join('')}</tbody>
      </table>
    </div>
    <p class="nota">As unidades sem movimento em 2026 entram como <b>inativas</b>: não aparecem na tela de lançamento,
    mas o histórico continua guardado e volta a aparecer nas comparações com 2024 e 2025.</p>
  </div>

  ${historico.length ? `<div class="bloco">
    <p class="card__tit" style="margin-bottom:8px">Histórico dos nomes</p>
    <div class="aviso aviso--ok"><span class="aviso__ico">🔗</span><div>
      <strong>Os nomes das colunas mudaram de ano para ano — todos já ligados e validados</strong>
      Sem isso não existe comparação entre anos: era preciso dizer que "Iguatemi", "Quiosque" e "Q.Iguatemi"
      são o mesmo quiosque. Ficam registrados aqui para ninguém precisar redescobrir depois.
    </div></div>
    <div class="rolagem">
      <table>
        <thead><tr><th class="fix">Como estava na planilha</th><th style="text-align:left">É</th><th style="text-align:left">Anos</th><th style="text-align:left">Histórico</th></tr></thead>
        <tbody>${historico.map(d=>`<tr>
          <td class="fix"><code>${esc(d.planilha)}</code></td>
          <td style="text-align:left"><b>${esc((porId.get(d.id)||{}).nome||d.id)}</b></td>
          <td style="text-align:left">${d.anos.join(', ')}</td>
          <td style="text-align:left;white-space:normal;max-width:520px">${esc(d.nota)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  </div>` : ''}

  <div class="bloco">
    <p class="card__tit" style="margin-bottom:8px">Metas por mês (2026)</p>
    <div class="rolagem">
      <table>
        <thead><tr><th class="fix">Unidade</th>${mesesDoAno(2026).map(m=>`<th>${MES_CURTO[m-1]}</th>`).join('')}</tr></thead>
        <tbody>${UNI.filter(u=>u.ativa).map(u=>`<tr><td class="fix">${esc(u.curto)}</td>
          ${mesesDoAno(2026).map(m=>{const v=(D.metas[m]||{})[u.id]; return v?`<td>${num(v)}</td>`:'<td class="vazio">—</td>';}).join('')}</tr>`).join('')}</tbody>
        <tfoot><tr class="lin-total"><td class="fix">Total</td>
          ${mesesDoAno(2026).map(m=>`<td>${num(metaMes(m))}</td>`).join('')}</tr></tfoot>
      </table>
    </div>
    <p class="nota">Regra padrão: <b>faturamento do mesmo mês do ano anterior × 85%</b>. Agora que 2024 e 2025 estão no app,
    o botão "gerar metas do ano" consegue calcular isso sozinho para todas as unidades — inclusive junho e julho,
    que na planilha ficaram sem meta. A meta da quinzena é metade da meta do mês.</p>
  </div>

  <div class="bloco">
    <p class="card__tit" style="margin-bottom:8px">Calendário</p>
    <div class="rolagem">
      <table>
        <thead><tr><th class="fix">Data</th><th style="text-align:left">Dia</th><th style="text-align:left">Evento</th><th style="text-align:left">Tipo</th><th>Vendas</th></tr></thead>
        <tbody>${D.datasEspeciais.filter(e=>anoDe(e.data)===ANO_ATUAL).map(e=>`<tr>
          <td class="fix">${dataBrLonga(e.data)}</td>
          <td style="text-align:left">${DIAS_SEM[diaSemana(e.data)]}</td>
          <td style="text-align:left"><b>${esc(e.nome)}</b></td>
          <td style="text-align:left"><span class="tag">${e.tipo}</span></td>
          <td>${DATAS.includes(e.data)?num(totalDoDia(e.data)):'<span class="vazio">—</span>'}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <p class="nota">O calendário é calculado para os três anos, então Carnaval, Páscoa, Dia das Mães, Dia dos Pais e Black Friday
    caem na data certa de cada ano — é o que permite comparar evento com evento.</p>
  </div>

  <div class="bloco">
    <p class="card__tit" style="margin-bottom:8px">Conferência da importação</p>
    <div class="aviso ${batem===conf.length?'aviso--ok':'aviso--info'}"><span class="aviso__ico">✅</span><div>
      <strong>${batem} de ${conf.length} meses batem exatamente com o total da própria planilha</strong>
      Os ${conf.length-batem} meses restantes têm diferença porque <b>a planilha erra a conta</b>, não a importação.
      Cada caso está identificado abaixo.
    </div></div>
    <div class="rolagem">
      <table>
        <thead><tr><th class="fix">Mês</th><th>Dias</th><th>Unidades</th><th>Importado</th><th>Total da planilha</th><th>Diferença</th></tr></thead>
        <tbody>${conf.map(c=>`<tr>
          <td class="fix">${c.ano} · ${esc(c.aba.replace(/_$/,''))}</td>
          <td>${c.dias}</td><td>${c.unidades}</td><td>${num(c.soma)}</td><td>${num(c.planilha)}</td>
          <td>${Math.abs(c.dif)<=1?'<span class="up">bate</span>':`<span class="down">${num(c.dif)}</span>`}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  </div>

  <div class="bloco">
    <p class="card__tit" style="margin-bottom:8px">O que foi encontrado e corrigido na importação</p>
    <div class="card"><div class="card__corpo">
      <ul class="lista-limpa">${D.avisosImportacao.map(a=>`<li><span style="white-space:normal">${esc(a)}</span></li>`).join('')}</ul>
      <p class="nota">Total importado dos três anos: <b>${brl(ANOS.reduce((s,a)=>s+totalAno(a),0))}</b> em ${DATAS.length} dias.</p>
    </div></div>
  </div>`;
}

/* ================================================================
   8b. ACESSOS
   Só a diretoria enxerga esta aba. Aqui se dá e se tira acesso.

   Uma limitação honesta: criar o LOGIN em si (e-mail e senha) exige a
   chave de administrador do Supabase, e essa chave não pode ficar num
   site aberto — quem a tivesse leria o banco inteiro sem login. Então o
   login nasce no painel do Supabase, em dois cliques, e aqui se decide
   quem entra e com qual papel. É a separação que faz um cadastro
   esquecido nunca virar acesso indevido.
   ================================================================ */
let acessos = null, acessosErro = '';

/* O banco fala em jargão; aqui vira português. */
function explicarErro(error){
  const m = (error && error.message) || String(error);
  if (/row-level security/i.test(m))
    return 'O banco recusou: seu acesso não tem permissão para isso. Só quem tem perfil de diretoria libera pessoas.';
  if (/violates foreign key/i.test(m))
    return 'Esse UID não existe em Authentication → Users. Crie o login primeiro e depois copie o UID de lá.';
  if (/duplicate key/i.test(m))
    return 'Essa pessoa já tem acesso. Para mudar o papel, use a lista acima.';
  if (/JWT|session|not authenticated/i.test(m))
    return 'Sua sessão expirou. Saia e entre de novo.';
  return 'Não consegui salvar: ' + m;
}

async function carregarAcessos(){
  if (!SB) { acessosErro = 'Sem ligação com o banco.'; return; }
  const { data, error } = await SB.from('perfis').select('id,nome,papel,criado_em').order('criado_em');
  if (error){ acessosErro = error.message; acessos = []; return; }
  acessosErro = ''; acessos = data;
}

/* Cria o login e libera o acesso de uma vez. Quem faz o trabalho é a
   Edge Function "criar-usuario", no servidor do Supabase: é lá que a
   chave de administrador pode existir sem ficar exposta no site. */
async function criarUsuario(ev){
  ev.preventDefault();
  const nome  = document.getElementById('acNome').value.trim();
  const email = document.getElementById('acEmail').value.trim();
  const senha = document.getElementById('acSenha').value;
  const papel = document.getElementById('acPapel').value;
  const aviso = document.getElementById('acAviso');
  const botao = document.getElementById('acBotao');

  if (senha.length < 8){ aviso.textContent = 'A senha precisa de pelo menos 8 caracteres.'; return; }

  botao.disabled = true; botao.textContent = 'Criando…';
  aviso.textContent = '';

  const { data, error } = await SB.functions.invoke('criar-usuario', {
    body: { nome, email, senha, papel },
  });

  botao.disabled = false; botao.textContent = 'Criar acesso';

  // a função devolve o motivo no corpo, mesmo quando o status é de erro
  const motivo = (data && data.erro) || (error && error.message);
  if (motivo){
    aviso.textContent = /Failed to send|fetch/i.test(motivo)
      ? 'Não consegui falar com o servidor. A função "criar-usuario" já foi publicada no Supabase?'
      : motivo;
    return;
  }

  document.getElementById('formAcesso').reset();
  aviso.textContent = data.jaExistia
    ? `${data.nome} já tinha login; liberei o acesso.`
    : `${data.nome} criado. Passe o e-mail e a senha para a pessoa.`;
  await carregarAcessos();
  const guardar = aviso.textContent;
  render();
  const novo = document.getElementById('acAviso');
  if (novo) novo.textContent = guardar;
}

async function mudarPapel(id, papel){
  const { error } = await SB.from('perfis').update({ papel }).eq('id', id);
  if (error) alert(explicarErro(error));
  await carregarAcessos(); render();
}

async function tirarAcesso(id, nome){
  if (!confirm('Tirar o acesso de ' + nome + '?\n\nA pessoa continua existindo no Supabase, mas para de enxergar qualquer dado do app.')) return;
  const { error } = await SB.from('perfis').delete().eq('id', id);
  if (error) alert(explicarErro(error));
  await carregarAcessos(); render();
}

function telaAcessos(){
  if (EU.papel !== 'diretoria'){
    return `<h2 class="titulo">Acessos</h2>
      <div class="aviso aviso--info"><span class="aviso__ico">🔒</span><div>
        <strong>Só a diretoria administra acessos</strong>
        Seu perfil é <b>${esc(EU.papel)}</b>. Se precisar liberar alguém, peça a quem tem perfil de diretoria.
      </div></div>`;
  }
  if (acessos === null){
    carregarAcessos().then(render);
    return `<h2 class="titulo">Acessos</h2><div class="carregando"><div class="carregando__giro"></div><span>Buscando quem tem acesso…</span></div>`;
  }

  const linha = p => `<tr>
    <td class="fix"><b>${esc(p.nome)}</b>${p.id === EU.id ? ' <span class="tag">você</span>' : ''}
      <div style="font-size:11px;color:var(--text-faint);font-family:ui-monospace,monospace">${esc(p.id)}</div></td>
    <td style="text-align:left">
      <select onchange="mudarPapel('${p.id}', this.value)" ${p.id === EU.id ? 'disabled title="Você não pode mudar o próprio papel"' : ''}>
        <option value="diretoria"  ${p.papel==='diretoria'?'selected':''}>Diretoria</option>
        <option value="lancamento" ${p.papel==='lancamento'?'selected':''}>Lançamento</option>
      </select></td>
    <td>${p.criado_em ? dataBrLonga(p.criado_em.slice(0,10)) : '—'}</td>
    <td>${p.id === EU.id ? '<span class="vazio">—</span>'
      : `<button class="btn btn--pequeno" onclick="tirarAcesso('${p.id}', ${JSON.stringify(p.nome)})">Tirar acesso</button>`}</td>
  </tr>`;

  return `
  <h2 class="titulo">Acessos</h2>
  <p class="sub">Quem entra no app e o que cada um pode fazer. São ${acessos.length} pessoa${acessos.length===1?'':'s'} com acesso.</p>

  ${acessosErro ? `<div class="aviso aviso--alerta"><span class="aviso__ico">⚠️</span><div>${esc(acessosErro)}</div></div>` : ''}

  <div class="bloco">
    <div class="rolagem">
      <table>
        <thead><tr><th class="fix">Pessoa</th><th style="text-align:left">Papel</th><th>Desde</th><th></th></tr></thead>
        <tbody>${acessos.map(linha).join('') || '<tr><td colspan="4" class="vazio">Ninguém cadastrado.</td></tr>'}</tbody>
      </table>
    </div>
    <p class="nota"><b>Diretoria</b> vê tudo e mexe em cadastro, meta e acesso.
    <b>Lançamento</b> lança e corrige venda, mas não mexe em cadastro nem libera ninguém.</p>
  </div>

  <div class="grade-2 bloco">
    <div class="card">
      <div class="card__cab"><p class="card__tit">Criar um acesso</p>
        <p class="card__sub">Cria o login e libera de uma vez. A pessoa já entra com o que você digitar aqui.</p></div>
      <div class="card__corpo">
        <form id="formAcesso" onsubmit="criarUsuario(event)" autocomplete="off">
          <div class="login__campo"><label for="acNome">Nome</label>
            <input id="acNome" type="text" required placeholder="Como aparece no app"></div>
          <div class="login__campo"><label for="acEmail">E-mail</label>
            <input id="acEmail" type="email" required placeholder="pessoa@empresa.com.br" autocomplete="off"></div>
          <div class="login__campo"><label for="acSenha">Senha inicial</label>
            <input id="acSenha" type="text" required minlength="8" placeholder="mínimo 8 caracteres" autocomplete="new-password">
            <button type="button" class="btn btn--pequeno" style="align-self:flex-start"
                    onclick="sortearSenha()">Sortear uma senha</button></div>
          <div class="login__campo"><label for="acPapel">Papel</label>
            <select id="acPapel">
              <option value="lancamento">Lançamento</option>
              <option value="diretoria">Diretoria</option>
            </select></div>
          <button type="submit" class="btn btn--primario login__botao" id="acBotao">Criar acesso</button>
          <p class="nota" id="acAviso" role="alert"></p>
        </form>
      </div>
    </div>

    <div class="card">
      <div class="card__cab"><p class="card__tit">Como funciona</p>
        <p class="card__sub">Por que criar usuário não é só mais um formulário.</p></div>
      <div class="card__corpo">
        <ul class="lista-limpa">
          <li><span>A senha que você digitar é a <b>senha inicial</b> da pessoa. Passe para ela por um canal
            seguro — de preferência não por grupo de mensagem.</span></li>
          <li><span>O acesso vale <b>na hora</b>: não há e-mail de confirmação para a pessoa clicar.</span></li>
          <li><span>Se o e-mail já tiver login, o app <b>não cria outro</b> — só libera o acesso dele.</span></li>
          <li><span><b>Tirar acesso</b> na lista acima não apaga a conta: a pessoa simplesmente para de
            enxergar qualquer número.</span></li>
        </ul>
        <p class="nota">Criar conta exige uma chave de administrador, que leria o banco inteiro sem passar por
        login. Ela não está neste site: fica guardada numa função no servidor do Supabase, que antes de criar
        qualquer coisa confere se quem pediu é da diretoria. É por isso que o botão acima existe sem abrir
        um buraco.</p>
      </div>
    </div>
  </div>`;
}

/* Senha inicial decente, para ninguém cair no "123456". */
function sortearSenha(){
  const letras = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  const aleatorio = new Uint32Array(14);
  crypto.getRandomValues(aleatorio);
  for (const n of aleatorio) s += letras[n % letras.length];
  const campo = document.getElementById('acSenha');
  campo.value = s;
  campo.focus();
  campo.select();
}

/* ================================================================
   9. NAVEGAÇÃO
   ================================================================ */
const TELAS = { painel:telaPainel, lancar:telaLancar, mensal:telaMensal, anual:telaAnual,
                comparar:telaComparar, cadastros:telaCadastros, acessos:telaAcessos };
let secaoAtual = 'painel';

function render(){
  document.getElementById('sec-' + secaoAtual).innerHTML = TELAS[secaoAtual]();
  if (secaoAtual === 'lancar') somarRodape();
}
function abrir(nome){
  secaoAtual = nome;
  document.querySelectorAll('.secao').forEach(s => s.classList.remove('ativa'));
  document.getElementById('sec-' + nome).classList.add('ativa');
  document.querySelectorAll('.aba').forEach(a => {
    const ativa = a.dataset.secao === nome;
    a.setAttribute('aria-selected', String(ativa));   // para o leitor de tela
    a.classList.toggle('ativa', ativa);               // para o visual
  });
  render();
  window.scrollTo({top:0, behavior:'smooth'});
}
document.querySelectorAll('.aba').forEach(a => a.addEventListener('click', () => abrir(a.dataset.secao)));

/* O tema vive no atributo data-theme da raiz, que é o mesmo que o visualizador
   usa — assim o botão daqui e o botão de fora falam a mesma língua. Sem o
   atributo, vale a preferência do sistema. */
const btnTema = document.getElementById('btnTema');
const escuroNoSistema = window.matchMedia('(prefers-color-scheme: dark)');
const temaAtual = () => document.documentElement.dataset.theme
  || (escuroNoSistema.matches ? 'dark' : 'light');
function marcarBotao(){ btnTema.textContent = temaAtual() === 'dark' ? '☀️' : '🌙'; }
function aplicarTema(t){
  document.documentElement.dataset.theme = t;
  marcarBotao();
  try { localStorage.setItem('cameron-tema', t); } catch(e){}
}
btnTema.addEventListener('click', () => aplicarTema(temaAtual() === 'dark' ? 'light' : 'dark'));
escuroNoSistema.addEventListener('change', marcarBotao);
// o visualizador pode trocar o data-theme por fora; o ícone acompanha
new MutationObserver(marcarBotao).observe(document.documentElement, { attributeFilter: ['data-theme'] });

let temaSalvo = null;
try { temaSalvo = localStorage.getItem('cameron-tema'); } catch(e){}
if (temaSalvo === 'dark' || temaSalvo === 'light') aplicarTema(temaSalvo); else marcarBotao();

document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target.matches('#sec-lancar input[data-uni]')) return;
  e.preventDefault();
  const campos = [...document.querySelectorAll('#sec-lancar input[data-uni]')];
  const prox = campos[campos.indexOf(e.target) + 1];
  if (prox){ prox.focus(); prox.select(); }
});

document.getElementById('topoHoje').textContent = 'Hoje: ' + dataBrLonga(HOJE);
// a aba de acessos só existe para a diretoria
document.querySelector('.aba[data-secao="acessos"]').hidden = EU.papel !== 'diretoria';
render();
