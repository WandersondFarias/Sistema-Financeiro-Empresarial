(() => {
"use strict";
/* ---------- utilidades ---------- */
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MES_C = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const CATS = {
  receita:["Prestação de serviços","Contratos recorrentes","Venda de produtos","Rendimentos","Outras receitas"],
  despesa:["Aluguel","Folha de pagamento","Impostos (DAS)","Fornecedores","Energia e água","Internet e telefone","Marketing","Material de escritório","Transporte","Tarifas bancárias","Outras despesas"]
};
const brl = new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});
const fmt = v => brl.format(v||0);
const fmtK = v => { const a=Math.abs(v); if(a>=1e6) return "R$ "+(v/1e6).toLocaleString("pt-BR",{maximumFractionDigits:1})+" mi"; if(a>=1e3) return "R$ "+(v/1e3).toLocaleString("pt-BR",{maximumFractionDigits:1})+" mil"; return "R$ "+Math.round(v); };
const pad = n => String(n).padStart(2,"0");
const iso = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const TODAY = iso(new Date());
const brDate = s => s ? s.slice(8,10)+"/"+s.slice(5,7)+"/"+s.slice(0,4) : "";
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k,v) => { try { localStorage.setItem(k,v); } catch {} };
const useCap = name => (window.claude && window.claude.use) ? window.claude.use(name).catch(()=>null) : Promise.resolve(null);
const inViewer = () => !!(window.claude && window.claude.use);
let toastT;
function toast(msg){ const t=document.getElementById("toast"); t.textContent=msg; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>t.hidden=true,3200); }

/* ---------- dados de exemplo ---------- */
function exemplos(){
  const Y = new Date().getFullYear(); let s = 20261019;
  const rnd = () => { s|=0; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  const out = []; const r2 = v => Math.round(v*100)/100;
  const add = (tipo,descricao,categoria,parte,valor,m,d) => {
    const venc = Y+"-"+pad(m)+"-"+pad(d);
    out.push({id:"ex"+out.length,tipo,descricao,categoria,parte,valor:r2(valor),vencimento:venc,status:venc<TODAY?"pago":"pendente",pagoEm:venc<TODAY?venc:"",exemplo:true});
  };
  for(let m=1;m<=12;m++){
    let rec=0;
    add("receita","Contrato de manutenção mensal","Contratos recorrentes","Clínica Vida Plena",3200,m,5); rec+=3200;
    const c=1650+Math.round(rnd()*6)*50; add("receita","Consultoria em processos","Prestação de serviços","Padaria Pão Dourado",c,m,12); rec+=c;
    const v=2100+rnd()*3400; add("receita","Vendas do balcão","Venda de produtos","Clientes diversos",v,m,20); rec+=v;
    if([3,7,10].includes(m)){ add("receita","Projeto de site institucional","Prestação de serviços","Auto Peças Silva",4500,m,24); rec+=4500; }
    add("despesa","Folha de pagamento","Folha de pagamento","Equipe (3 pessoas)",6400,m,5);
    add("despesa","Internet fibra 500 MB","Internet e telefone","Conecta Telecom",189.9,m,8);
    add("despesa","Aluguel da sala comercial","Aluguel","Imobiliária Central",2800,m,10);
    add("despesa","Conta de energia","Energia e água","Cemig",380+rnd()*150,m,15);
    add("despesa","Compra de insumos","Fornecedores","Distribuidora Minas Sul",900+rnd()*1500,m,18);
    add("despesa","DAS do Simples Nacional","Impostos (DAS)","Receita Federal",rec*0.06,m,20);
    if(m%2===0) add("despesa","Anúncios em redes sociais","Marketing","Meta Ads",450+rnd()*300,m,22);
    add("despesa","Tarifa de manutenção da conta","Tarifas bancárias","Banco",64.5,m,28);
  }
  // dois atrasos para mostrar alertas
  const cm = new Date().getMonth()+1;
  out.forEach(i=>{ const m=+i.vencimento.slice(5,7);
    if(m===cm && (i.descricao==="Consultoria em processos"||i.descricao==="Conta de energia") && i.vencimento<TODAY){ i.status="pendente"; i.pagoEm=""; }
  });
  return out;
}

/* ---------- estado ---------- */
const state = {
  mode:"exemplo",          // exemplo | real
  backend:"local",         // local | db
  items: exemplos(),
  tab: lsGet("cf.tab") || "painel",
  mes: new Date().getMonth()+1,
  ano: new Date().getFullYear(),
  q:"", fTipo:"todos", fStatus:"todos",
  graf: lsGet("cf.graf")==="pizza"?"pizza":"barras"
};
let col = null; // coleção do db

function loadLocal(){
  try{ const raw=lsGet("cf.dados.v1"); if(!raw) return false; const d=JSON.parse(raw);
    if(d && Array.isArray(d.items) && (d.started || d.items.length)){ state.items=d.items; state.mode="real"; return true; } }catch{}
  return false;
}
function saveLocal(){ if(state.backend==="local") lsSet("cf.dados.v1",JSON.stringify({started:state.mode==="real",items:state.mode==="real"?state.items:[]})); }

async function connectDb(){
  const [db,user] = await Promise.all([useCap("db"),useCap("user")]);
  if(!db || !user) { setNote(); return; }
  let id; try{ id = await user.id(); }catch{ setNote(); return; }
  if(!id){ setNote(); return; }
  col = db.collection("data/users/"+id);
  state.backend = "db";
  col.onSnapshot(snap=>{
    let started=false; const items=[];
    snap.docs.forEach(d=>{ if(d.id==="_meta"){ started=!!(d.data()||{}).started; } else items.push(d.data()); });
    if(started || items.length){ state.mode="real"; state.items=items; }
    else if(state.mode==="real" && !started){ state.mode="exemplo"; state.items=exemplos(); }
    setNote(); render();
  }, ()=>toast("Não foi possível sincronizar seus dados. Verifique a conexão."));
}
function setNote(){
  const n=document.getElementById("status-note");
  n.textContent = state.backend==="db" ? "Seus lançamentos ficam salvos na sua conta e só você os vê."
    : "Lançamentos salvos neste navegador.";
}

async function putItem(it){
  const i=state.items.findIndex(x=>x.id===it.id);
  if(i>=0) state.items[i]=it; else state.items.push(it);
  render();
  if(it.exemplo) return;
  if(state.backend==="db"){ try{ await col.doc(it.id).set(it); }catch(e){ toast("Não foi possível salvar. Tente de novo."); } }
  else saveLocal();
}
async function delItem(id){
  const it=state.items.find(x=>x.id===id);
  state.items=state.items.filter(x=>x.id!==id); render();
  if(!it || it.exemplo) return;
  if(state.backend==="db"){ try{ await col.doc(id).delete(); }catch{ toast("Não foi possível excluir. Tente de novo."); } }
  else saveLocal();
}
async function startReal(keepExamples){
  const items = keepExamples ? state.items.map(i=>({...i,id:uid(),exemplo:false})) : [];
  state.mode="real"; state.items=items; render();
  if(state.backend==="db"){
    try{ await col.doc("_meta").set({started:true}); for(const it of items) await col.doc(it.id).set(it); }
    catch{ toast("Não foi possível salvar todos os lançamentos."); }
  } else saveLocal();
  toast(keepExamples?"Exemplos mantidos como seus lançamentos":"Pronto. Registre seu primeiro lançamento.");
}

/* ---------- cálculos ---------- */
const inPeriod = (d,mes=state.mes,ano=state.ano) => +d.slice(0,4)===ano && (mes===0 || +d.slice(5,7)===mes);
const periodEnd = () => state.mes===0 ? state.ano+"-12-31" : iso(new Date(state.ano,state.mes,0));
const periodLabel = () => state.mes===0 ? "Ano de "+state.ano : MESES[state.mes-1]+" de "+state.ano;
const isLate = i => i.status==="pendente" && i.vencimento<TODAY;
const sum = (arr,f=()=>true) => arr.reduce((a,i)=>f(i)?a+i.valor:a,0);

function resumo(mes=state.mes,ano=state.ano){
  const p = state.items.filter(i=>inPeriod(i.vencimento,mes,ano));
  const rec=sum(p,i=>i.tipo==="receita"), desp=sum(p,i=>i.tipo==="despesa");
  return {p,rec,desp,res:rec-desp,
    recPago:sum(p,i=>i.tipo==="receita"&&i.status==="pago"),
    despPago:sum(p,i=>i.tipo==="despesa"&&i.status==="pago")};
}
function saldoAte(dataFim){
  return state.items.reduce((a,i)=>{ if(i.status!=="pago") return a; const d=i.pagoEm||i.vencimento; if(d>dataFim) return a; return a+(i.tipo==="receita"?i.valor:-i.valor); },0);
}
function pendentes(tipo){
  const fim=periodEnd();
  return state.items.filter(i=>i.tipo===tipo&&i.status==="pendente"&&i.vencimento<=fim).sort((a,b)=>a.vencimento.localeCompare(b.vencimento));
}
function porCategoria(arr,tipo){
  const m=new Map(); arr.filter(i=>i.tipo===tipo).forEach(i=>m.set(i.categoria,(m.get(i.categoria)||0)+i.valor));
  return [...m.entries()].sort((a,b)=>b[1]-a[1]);
}
function mensal(ano=state.ano){
  return MES_C.map((_,k)=>{ const r=resumo(k+1,ano); const fim=iso(new Date(ano,k+1,0)); return {mes:k+1,rec:r.rec,desp:r.desp,res:r.res,saldo:saldoAte(fim)}; });
}

/* ---------- gráficos ---------- */
function niceMax(v){ if(v<=0) return 1000; const e=Math.pow(10,Math.floor(Math.log10(v))); const n=v/e; return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*e; }
function chartFluxo(){
  const data=mensal(); const W=720,H=290,L=62,R=12,T=14,B=30;
  const maxV=niceMax(Math.max(...data.map(d=>Math.max(d.rec,d.desp)),1));
  const minRes=Math.min(0,...data.map(d=>d.res)); const minV=minRes<0?-niceMax(-minRes):0;
  const y=v=>T+(maxV-v)/(maxV-minV)*(H-T-B); const gw=(W-L-R)/12, bw=Math.min(16,gw*0.3);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Receitas e despesas por mês em ${state.ano}">`;
  data.forEach((d,k)=>{ if(state.mes===d.mes) s+=`<rect class="sel-band" x="${L+k*gw+2}" y="${T}" width="${gw-4}" height="${H-T-B}" rx="6"/>`; });
  const step=(maxV-minV)/4;
  for(let t=0;t<=4;t++){ const v=minV+step*t; const yy=y(v); s+=`<line class="${Math.abs(v)<1e-6?"zero":"gl"}" x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}"/><text x="${L-8}" y="${yy+4}" text-anchor="end">${fmtK(v)}</text>`; }
  if(minV<0) s+=`<line class="zero" x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}"/>`;
  const pts=[];
  data.forEach((d,k)=>{ const cx=L+k*gw+gw/2; const op=(state.mes===0||state.mes===d.mes)?1:.45;
    s+=`<g opacity="${op}"><rect class="b-in" x="${cx-bw-1}" y="${y(d.rec)}" width="${bw}" height="${Math.max(0,y(0)-y(d.rec))}" rx="2"><title>${MESES[k]}: receitas ${fmt(d.rec)}</title></rect>`;
    s+=`<rect class="b-out" x="${cx+1}" y="${y(d.desp)}" width="${bw}" height="${Math.max(0,y(0)-y(d.desp))}" rx="2"><title>${MESES[k]}: despesas ${fmt(d.desp)}</title></rect></g>`;
    s+=`<text x="${cx}" y="${H-10}" text-anchor="middle">${MES_C[k]}</text>`; pts.push([cx,y(d.res),d]); });
  s+=`<polyline class="res" points="${pts.map(p=>p[0]+","+p[1]).join(" ")}"/>`;
  pts.forEach(([x,yy,d])=>{ s+=`<circle class="res-dot" cx="${x}" cy="${yy}" r="${state.mes===d.mes?5:3.2}"><title>${MESES[d.mes-1]}: resultado ${fmt(d.res)}</title></circle>`; });
  return s+"</svg>";
}
function sparkSaldo(){
  const d=mensal().map(x=>x.saldo); const W=200,H=34; const mn=Math.min(...d),mx=Math.max(...d); const sp=(mx-mn)||1;
  const pts=d.map((v,k)=>[k*(W/11),H-3-(v-mn)/sp*(H-8)]);
  const line=pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
  const sel=state.mes?pts[state.mes-1]:pts[11];
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,${H} ${line} ${W},${H}" fill="currentColor" opacity=".12"/><polyline points="${line}" fill="none" stroke="currentColor" stroke-width="1.6" vector-effect="non-scaling-stroke"/><circle cx="${sel[0]}" cy="${sel[1]}" r="2.6" fill="currentColor"/></svg>`;
}

const PALETA=["var(--c1)","var(--c2)","var(--c3)","var(--c4)","var(--c5)","var(--c6)","var(--c7)","var(--c8)"];
function pizza(entries,total){
  let e=entries; if(e.length>7){ const resto=e.slice(6).reduce((a,x)=>a+x[1],0); e=[...e.slice(0,6),["Outras",resto]]; }
  const C=90,R=86; let a=-Math.PI/2, fat="";
  e.forEach(([c,v],k)=>{ const fr=v/total; const cor=PALETA[k===6&&c==="Outras"?7:k];
    const tip=`<title>${esc(c)}: ${fmt(v)} (${(fr*100).toLocaleString("pt-BR",{maximumFractionDigits:1})}%)</title>`;
    if(fr>=0.9999){ fat+=`<circle cx="${C}" cy="${C}" r="${R}" style="fill:${cor}">${tip}</circle>`; return; }
    const a2=a+fr*2*Math.PI; const x1=C+R*Math.cos(a),y1=C+R*Math.sin(a),x2=C+R*Math.cos(a2),y2=C+R*Math.sin(a2);
    fat+=`<path d="M${C},${C} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${fr>.5?1:0} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" style="fill:${cor}">${tip}</path>`; a=a2; });
  return `<div class="pie"><svg viewBox="0 0 180 180" role="img" aria-label="Gráfico de pizza por categoria">${fat}</svg>
    <ul class="pie-leg">${e.map(([c,v],k)=>`<li><i style="background:${PALETA[k===6&&c==="Outras"?7:k]}"></i><span class="n">${esc(c)}<span class="pct">${(v/total*100).toLocaleString("pt-BR",{maximumFractionDigits:1})}%</span></span><span class="num">${fmt(v)}</span></li>`).join("")}</ul></div>`;
}
function barras(entries,total,cor){
  return `<div class="cats">${entries.slice(0,8).map(([c,v])=>`<div class="cat"><span>${esc(c)}<span class="pct">${(v/total*100).toLocaleString("pt-BR",{maximumFractionDigits:1})}%</span></span><span class="num">${fmt(v)}</span><div class="bar"><span style="width:${(v/entries[0][1]*100).toFixed(1)}%;background:${cor}"></span></div></div>`).join("")}</div>`;
}
function catPanel(titulo,entries,total,cor,vazio){
  return `<div class="panel">
      <div class="panel-h"><div><h2>${titulo}</h2><p>${periodLabel()}</p></div>${seg("graf",state.graf,[["barras","Barras"],["pizza","Pizza"]])}</div>
      ${entries.length ? (state.graf==="pizza"?pizza(entries,total||1):barras(entries,total||1,cor)) : `<div class="empty">${vazio}</div>`}
    </div>`;
}

/* ---------- views ---------- */
function kpis(){
  const r=resumo(); const fim=periodEnd(); const saldo=saldoAte(fim<TODAY?fim:TODAY);
  const pr=pendentes("receita"), pp=pendentes("despesa");
  const lr=pr.filter(isLate).length, lp=pp.filter(isLate).length;
  const marg = r.rec? (r.res/r.rec*100):0;
  return `<div class="kpis">
    <div class="kpi hero"><span class="lbl">Saldo em caixa</span><span class="val">${fmt(saldo)}</span><span class="meta">Realizado até ${brDate(fim<TODAY?fim:TODAY)}</span>${sparkSaldo()}</div>
    <div class="kpi"><span class="lbl">Receitas</span><span class="val pos">${fmt(r.rec)}</span><span class="meta">${fmt(r.recPago)} recebidos</span></div>
    <div class="kpi"><span class="lbl">Despesas</span><span class="val neg">${fmt(r.desp)}</span><span class="meta">${fmt(r.despPago)} pagos</span></div>
    <div class="kpi"><span class="lbl">Resultado</span><span class="val ${r.res>=0?"pos":"neg"}">${fmt(r.res)}</span><span class="meta">Margem de ${marg.toLocaleString("pt-BR",{maximumFractionDigits:1})}%</span></div>
    <div class="kpi"><span class="lbl">A receber</span><span class="val">${fmt(sum(pr))}</span><span class="meta">${pr.length} títulos ${lr?`<span class="chip chip-out">${lr} vencido${lr>1?"s":""}</span>`:""}</span></div>
    <div class="kpi"><span class="lbl">A pagar</span><span class="val">${fmt(sum(pp))}</span><span class="meta">${pp.length} contas ${lp?`<span class="chip chip-out">${lp} vencida${lp>1?"s":""}</span>`:""}</span></div>
  </div>`;
}
function viewPainel(){
  const r=resumo(); const cats=porCategoria(r.p,"despesa"); const tot=r.desp||1;
  const prox=state.items.filter(i=>i.status==="pendente").sort((a,b)=>a.vencimento.localeCompare(b.vencimento)).slice(0,7);
  return kpis()+`
  <div class="grid2">
    <div class="panel">
      <div class="panel-h"><h2>Fluxo mensal de ${state.ano}</h2><div class="legend"><span><i style="background:var(--in)"></i>Receitas</span><span><i style="background:var(--out)"></i>Despesas</span><span><i style="background:var(--accent);height:3px;vertical-align:3px"></i>Resultado</span></div></div>
      <div class="chart">${chartFluxo()}</div>
    </div>
    ${catPanel("Despesas por categoria",cats,r.desp,"var(--out)","Nenhuma despesa registrada neste período.")}
  </div>
  <div class="grid2">
    <div class="panel">
      <div class="panel-h"><h2>Próximos vencimentos</h2><p>Contas pendentes em ordem de data</p></div>
      ${prox.length?`<ul class="due">${prox.map(i=>`<li><div class="d ${isLate(i)?"late":""}"><b>${i.vencimento.slice(8,10)}</b>${MES_C[+i.vencimento.slice(5,7)-1]}</div><div class="t"><div>${esc(i.descricao)}</div><small>${esc(i.parte||i.categoria)} · ${i.tipo==="receita"?"a receber":"a pagar"}${isLate(i)?' · <span class="neg">vencido</span>':""}</small></div><div class="num ${i.tipo==="receita"?"pos":"neg"}">${fmt(i.valor)}</div></li>`).join("")}</ul>`:`<div class="empty">Nenhuma conta pendente. Tudo em dia.</div>`}
    </div>
    ${catPanel("Receitas por categoria",porCategoria(r.p,"receita"),r.rec,"var(--in)","Nenhuma receita registrada neste período.")}
  </div>`;
}
function statusChip(i){
  if(i.status==="pago") return `<span class="chip chip-in">${i.tipo==="receita"?"Recebido":"Pago"}</span>`;
  if(isLate(i)) return `<span class="chip chip-out">Vencido</span>`;
  return `<span class="chip chip-warn">Pendente</span>`;
}
function rowsHtml(rows){
  return rows.map(i=>`<tr>
    <td class="mono">${brDate(i.vencimento)}</td>
    <td><div>${esc(i.descricao)}</div>${i.parte?`<div class="sub">${esc(i.parte)}</div>`:""}</td>
    <td>${esc(i.categoria)}</td>
    <td>${i.tipo==="receita"?'<span class="chip chip-in">Receita</span>':'<span class="chip chip-out">Despesa</span>'}</td>
    <td>${statusChip(i)}${i.status==="pago"&&i.pagoEm?`<div class="sub mono">${brDate(i.pagoEm)}</div>`:""}</td>
    <td class="val r ${i.tipo==="receita"?"pos":"neg"}">${i.tipo==="receita"?"+":"−"} ${fmt(i.valor)}</td>
    <td><div class="acts">
      ${i.status==="pendente"?`<button class="btn btn-sm" data-act="baixar" data-id="${i.id}">${i.tipo==="receita"?"Receber":"Pagar"}</button>`:`<button class="btn btn-sm btn-ghost" data-act="reabrir" data-id="${i.id}">Reabrir</button>`}
      <button class="btn btn-sm btn-ghost" data-act="editar" data-id="${i.id}">Editar</button>
      <button class="btn btn-sm btn-ghost btn-danger" data-act="excluir" data-id="${i.id}">Excluir</button>
    </div></td></tr>`).join("");
}
function table(rows,emptyMsg){
  if(!rows.length) return `<div class="tbl-wrap"><div class="empty">${emptyMsg}</div></div>`;
  return `<div class="tbl-wrap"><table><thead><tr><th>Vencimento</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Situação</th><th class="r">Valor</th><th class="r">Ações</th></tr></thead><tbody>${rowsHtml(rows)}</tbody></table></div>`;
}
function seg(name,cur,opts){ return `<div class="seg" role="group">${opts.map(([v,l])=>`<button type="button" data-seg="${name}" data-v="${v}" aria-pressed="${cur===v}">${l}</button>`).join("")}</div>`; }
function viewLanc(){
  const q=state.q.trim().toLowerCase();
  let rows=resumo().p.filter(i=>(state.fTipo==="todos"||i.tipo===state.fTipo)
    && (state.fStatus==="todos"||(state.fStatus==="vencido"?isLate(i):i.status===state.fStatus))
    && (!q || (i.descricao+" "+i.categoria+" "+(i.parte||"")).toLowerCase().includes(q)));
  rows.sort((a,b)=>b.vencimento.localeCompare(a.vencimento));
  const rec=sum(rows,i=>i.tipo==="receita"), desp=sum(rows,i=>i.tipo==="despesa");
  return `<div class="panel">
    <div class="panel-h"><h2>Lançamentos · ${periodLabel()}</h2><p>${rows.length} registro${rows.length===1?"":"s"}</p></div>
    <div class="toolbar">
      <input type="search" id="busca" placeholder="Buscar por descrição, categoria ou cliente" value="${esc(state.q)}" aria-label="Buscar">
      ${seg("fTipo",state.fTipo,[["todos","Todos"],["receita","Receitas"],["despesa","Despesas"]])}
      ${seg("fStatus",state.fStatus,[["todos","Todas"],["pago","Pagas"],["pendente","Pendentes"],["vencido","Vencidas"]])}
    </div>
    <div class="sumline"><span>Receitas <b class="pos">${fmt(rec)}</b></span><span>Despesas <b class="neg">${fmt(desp)}</b></span><span>Saldo da seleção <b>${fmt(rec-desp)}</b></span></div>
    ${table(rows, state.mode==="real"&&!state.items.length?"Nenhum lançamento ainda. Use “Novo lançamento” para registrar a primeira receita ou despesa.":"Nenhum lançamento encontrado com esses filtros.")}
  </div>`;
}
function viewContas(tipo){
  const rows=pendentes(tipo); const late=rows.filter(isLate);
  const venc7=rows.filter(i=>!isLate(i)&&i.vencimento<=iso(new Date(Date.now()+7*864e5)));
  const nome = tipo==="despesa"?"Contas a pagar":"Contas a receber";
  return `<div class="panel">
    <div class="panel-h"><h2>${nome}</h2><p>Pendentes com vencimento até ${brDate(periodEnd())}</p></div>
    <div class="sumline"><span>Total em aberto <b>${fmt(sum(rows))}</b></span><span>Vencido <b class="neg">${fmt(sum(late))}</b> (${late.length})</span><span>Vence em 7 dias <b>${fmt(sum(venc7))}</b> (${venc7.length})</span></div>
    ${table(rows, tipo==="despesa"?"Nenhuma conta a pagar em aberto.":"Nenhum valor a receber em aberto.")}
  </div>`;
}
function viewRel(){
  const r=resumo(); const rc=porCategoria(r.p,"receita"), dc=porCategoria(r.p,"despesa"); const m=mensal();
  const marg=r.rec?(r.res/r.rec*100):0;
  return `<div class="panel">
    <div class="panel-h"><h2>Exportar relatório · ${periodLabel()}</h2><p>Inclui resumo, DRE simplificada, mensal do ano e lançamentos do período</p></div>
    <div class="exports">
      <button class="btn btn-primary" data-act="pdf" type="button"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 1.5h5.5L13 5v9.5H4z"/><path d="M9.5 1.5V5H13"/></svg>Baixar PDF</button>
      <button class="btn" data-act="xlsx" type="button"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M2 6h12M2 10h12M6 2v12"/></svg>Baixar Excel</button>
    </div>
  </div>
  <div class="grid2">
    <div class="panel dre">
      <div class="panel-h"><h2>DRE simplificada</h2><p>Regime de competência · ${periodLabel()}</p></div>
      <div class="tbl-wrap"><table><tbody>
        <tr class="grp"><td>Receita bruta</td><td class="val r">${fmt(r.rec)}</td></tr>
        ${rc.map(([c,v])=>`<tr class="ind"><td>${esc(c)}</td><td class="val r">${fmt(v)}</td></tr>`).join("")}
        <tr class="grp"><td>(−) Despesas</td><td class="val r neg">${fmt(r.desp)}</td></tr>
        ${dc.map(([c,v])=>`<tr class="ind"><td>${esc(c)}</td><td class="val r">${fmt(v)}</td></tr>`).join("")}
        <tr class="total"><td>Resultado do período</td><td class="val r ${r.res>=0?"pos":"neg"}">${fmt(r.res)}</td></tr>
        <tr class="ind"><td>Margem líquida</td><td class="val r">${marg.toLocaleString("pt-BR",{maximumFractionDigits:1})}%</td></tr>
      </tbody></table></div>
    </div>
    <div class="panel mensal">
      <div class="panel-h"><h2>Resultado mês a mês</h2><p>${state.ano}</p></div>
      <div class="tbl-wrap"><table><thead><tr><th>Mês</th><th class="r">Receitas</th><th class="r">Despesas</th><th class="r">Resultado</th><th class="r">Saldo</th></tr></thead><tbody>
      ${m.map(x=>`<tr${state.mes===x.mes?' style="font-weight:600"':""}><td>${MES_C[x.mes-1]}</td><td class="val r">${fmt(x.rec)}</td><td class="val r">${fmt(x.desp)}</td><td class="val r ${x.res>=0?"pos":"neg"}">${fmt(x.res)}</td><td class="val r">${fmt(x.saldo)}</td></tr>`).join("")}
      </tbody><tfoot><tr><td>Ano</td><td class="val r">${fmt(m.reduce((a,x)=>a+x.rec,0))}</td><td class="val r">${fmt(m.reduce((a,x)=>a+x.desp,0))}</td><td class="val r">${fmt(m.reduce((a,x)=>a+x.res,0))}</td><td></td></tr></tfoot></table></div>
    </div>
  </div>`;
}

/* ---------- render ---------- */
function fillPeriod(){
  const fm=document.getElementById("f-mes"), fa=document.getElementById("f-ano");
  fm.innerHTML=`<option value="0">Ano todo</option>`+MESES.map((n,k)=>`<option value="${k+1}">${n}</option>`).join("");
  const anos=new Set([state.ano]);
  for(let a=2000;a<=2090;a++) anos.add(a);
  fa.innerHTML=[...anos].sort().map(a=>`<option>${a}</option>`).join("");
  fm.value=state.mes; fa.value=state.ano;
}
function render(){
  fillPeriod();
  document.querySelectorAll(".tab").forEach(t=>t.setAttribute("aria-selected",t.dataset.tab===state.tab));
  const lp=pendentes("despesa").filter(isLate).length, lr=pendentes("receita").filter(isLate).length;
  const bp=document.getElementById("bdg-pagar"), br=document.getElementById("bdg-receber");
  bp.textContent=lp||pendentes("despesa").length; bp.className="badge"+(lp?" alert":"");
  br.textContent=lr||pendentes("receita").length; br.className="badge"+(lr?" alert":"");
  document.getElementById("banner").innerHTML = state.mode==="exemplo" ? `<div class="banner"><p><strong>Você está vendo dados de exemplo</strong> de uma pequena empresa de serviços. Ao registrar seu primeiro lançamento, os exemplos são descartados.</p><button class="btn btn-sm" data-act="manter">Manter exemplos</button><button class="btn btn-sm btn-primary" data-act="zerar">Começar do zero</button></div>` : "";
  const v=document.getElementById("view");
  const busca=document.activeElement&&document.activeElement.id==="busca"; const pos=busca?document.activeElement.selectionStart:0;
  v.innerHTML = state.tab==="painel"?viewPainel(): state.tab==="lancamentos"?viewLanc(): state.tab==="pagar"?viewContas("despesa"): state.tab==="receber"?viewContas("receita"): viewRel();
  v.style.display="grid"; v.style.gap="20px";
  if(busca){ const b=document.getElementById("busca"); if(b){ b.focus(); b.setSelectionRange(pos,pos); } }
}

/* ---------- formulário ---------- */
function openForm(item, presetTipo){
  const it = item ? {...item} : {tipo:presetTipo||"despesa",descricao:"",categoria:"",parte:"",valor:"",vencimento:TODAY,status:"pendente",pagoEm:""};
  const root=document.getElementById("modal-root");
  root.innerHTML=`<div class="overlay" id="ov"><form class="modal" id="frm" novalidate>
    <h3>${item?"Editar lançamento":"Novo lançamento"}</h3>
    <div class="seg big" role="group" aria-label="Tipo">
      <button type="button" data-ftipo data-v="receita" aria-pressed="${it.tipo==="receita"}">Receita</button>
      <button type="button" data-ftipo data-v="despesa" aria-pressed="${it.tipo==="despesa"}">Despesa</button>
    </div>
    <div class="fgrid">
      <div class="field full"><label for="m-desc">Descrição</label><input type="text" id="m-desc" value="${esc(it.descricao)}" placeholder="Ex.: Aluguel da sala comercial" maxlength="120"></div>
      <div class="field"><label for="m-cat">Categoria</label><input type="text" id="m-cat" list="m-cats" value="${esc(it.categoria)}" placeholder="Escolha ou digite"><datalist id="m-cats"></datalist></div>
      <div class="field"><label for="m-parte" id="m-parte-l"></label><input type="text" id="m-parte" value="${esc(it.parte||"")}" maxlength="80"></div>
      <div class="field"><label for="m-valor">Valor (R$)</label><input type="text" inputmode="decimal" id="m-valor" value="${it.valor!==""?String(it.valor).replace(".",","):""}" placeholder="0,00"></div>
      <div class="field"><label for="m-venc">Vencimento</label><input type="date" id="m-venc" min="2000-01-01" max="2090-12-31" value="${it.vencimento}"></div>
      <div class="field"><label for="m-status">Situação</label><select id="m-status"><option value="pendente">Pendente</option><option value="pago"></option></select></div>
      <div class="field" id="m-pago-f"><label for="m-pago">Data do pagamento</label><input type="date" id="m-pago" min="2000-01-01" max="2090-12-31" value="${it.pagoEm||TODAY}"></div>
    </div>
    <p class="err" id="m-err"></p>
    <div class="mfoot"><button type="button" class="btn" id="m-cancel">Cancelar</button><button type="submit" class="btn btn-primary">${item?"Salvar alterações":"Registrar"}</button></div>
  </form></div>`;
  const $=id=>document.getElementById(id);
  $("m-status").value=it.status;
  const sync=()=>{
    root.querySelectorAll("[data-ftipo]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===it.tipo));
    $("m-cats").innerHTML=CATS[it.tipo].map(c=>`<option value="${c}">`).join("");
    $("m-parte-l").textContent = it.tipo==="receita"?"Cliente":"Fornecedor";
    $("m-status").options[1].textContent = it.tipo==="receita"?"Recebido":"Pago";
    $("m-pago-f").hidden = $("m-status").value!=="pago";
  };
  sync();
  root.querySelectorAll("[data-ftipo]").forEach(b=>b.onclick=()=>{ it.tipo=b.dataset.v; if(!CATS[it.tipo].includes($("m-cat").value)) $("m-cat").value=""; sync(); });
  $("m-status").onchange=sync;
  const close=()=>{ root.innerHTML=""; document.removeEventListener("keydown",onKey); };
  const onKey=e=>{ if(e.key==="Escape") close(); };
  document.addEventListener("keydown",onKey);
  $("m-cancel").onclick=close;
  $("ov").addEventListener("mousedown",e=>{ if(e.target.id==="ov") close(); });
  $("frm").onsubmit=e=>{
    e.preventDefault();
    const desc=$("m-desc").value.trim(); const cat=$("m-cat").value.trim();
    const raw=$("m-valor").value.trim().replace(/\s|R\$/g,""); const valor=Number(raw.includes(",")?raw.replace(/\./g,"").replace(",","."):raw);
    const venc=$("m-venc").value; const st=$("m-status").value;
    const err = !desc?"Informe a descrição.": !cat?"Escolha ou digite uma categoria.": !(valor>0)?"Informe um valor maior que zero, como 1.250,00.": !venc?"Informe a data de vencimento.": (venc<"2000-01-01"||venc>"2090-12-31")?"Use uma data entre 2000 e 2090.":"";
    if(err){ $("m-err").textContent=err; return; }
    const novo={id:item?item.id:uid(),tipo:it.tipo,descricao:desc,categoria:cat,parte:$("m-parte").value.trim(),valor:Math.round(valor*100)/100,vencimento:venc,status:st,pagoEm:st==="pago"?($("m-pago").value||TODAY):"",exemplo:!!(item&&item.exemplo)};
    close();
    if(!item && !inPeriod(venc)){ state.ano=+venc.slice(0,4); state.mes= state.mes===0?0:+venc.slice(5,7); }
    const go=()=>{ putItem(novo); toast(item?"Lançamento atualizado":"Lançamento registrado"); };
    if(state.mode==="exemplo" && !item){ startReal(false).then(go); } else go();
  };
  setTimeout(()=>$("m-desc").focus(),30);
}

/* ---------- exportação ---------- */
const libs={};
function loadScript(src){ return libs[src] ||= new Promise((ok,ko)=>{ const s=document.createElement("script"); s.src=src; s.onload=ok; s.onerror=()=>{ delete libs[src]; ko(); }; document.head.appendChild(s); }); }
async function saveFile(filename,blob){
  const dl = await useCap("downloads");
  if(dl){ try{ await dl.save({filename,data:blob}); toast("Arquivo salvo: "+filename); }
    catch(e){ toast(e&&e.code==="declined"?"Download cancelado.":"Não foi possível salvar o arquivo nesta visualização."); } return; }
  if(inViewer()){ toast("Downloads não estão disponíveis nesta visualização."); return; }
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);
}
const slug = () => state.mes===0? String(state.ano) : state.ano+"-"+pad(state.mes);
function dadosRel(){
  const r=resumo(); const fim=periodEnd(); const lim=fim<TODAY?fim:TODAY;
  const linhas=[...r.p].sort((a,b)=>a.vencimento.localeCompare(b.vencimento));
  return {r, saldo:saldoAte(lim), lim, pr:pendentes("receita"), pp:pendentes("despesa"), rc:porCategoria(r.p,"receita"), dc:porCategoria(r.p,"despesa"), m:mensal(), linhas};
}
const sit = i => i.status==="pago" ? (i.tipo==="receita"?"Recebido":"Pago") : isLate(i)?"Vencido":"Pendente";
async function exportXlsx(){
  toast("Gerando planilha...");
  try{ await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"); }catch{ toast("Não foi possível carregar o gerador de planilhas. Verifique a conexão."); return; }
  const d=dadosRel(); const X=window.XLSX; const wb=X.utils.book_new();
  const res=[["Caixa Firme · Relatório financeiro"],["Período",periodLabel()],["Gerado em",brDate(TODAY)],[],
    ["Indicador","Valor (R$)"],["Receitas",d.r.rec],["Despesas",d.r.desp],["Resultado",d.r.res],["Margem líquida (%)",d.r.rec?+(d.r.res/d.r.rec*100).toFixed(2):0],
    ["Saldo em caixa em "+brDate(d.lim),d.saldo],["A receber (em aberto)",sum(d.pr)],["A pagar (em aberto)",sum(d.pp)],[],
    ["DRE simplificada","Valor (R$)"],["Receita bruta",d.r.rec],...d.rc.map(([c,v])=>["   "+c,v]),["(-) Despesas",d.r.desp],...d.dc.map(([c,v])=>["   "+c,v]),["Resultado do período",d.r.res]];
  const s1=X.utils.aoa_to_sheet(res); s1["!cols"]=[{wch:36},{wch:18}];
  const s2=X.utils.aoa_to_sheet([["Vencimento","Descrição","Cliente/Fornecedor","Categoria","Tipo","Situação","Pagamento","Valor (R$)"],
    ...d.linhas.map(i=>[brDate(i.vencimento),i.descricao,i.parte||"",i.categoria,i.tipo==="receita"?"Receita":"Despesa",sit(i),brDate(i.pagoEm),i.tipo==="receita"?i.valor:-i.valor])]);
  s2["!cols"]=[{wch:12},{wch:34},{wch:26},{wch:22},{wch:10},{wch:10},{wch:12},{wch:14}];
  const s3=X.utils.aoa_to_sheet([["Mês","Receitas","Despesas","Resultado","Saldo acumulado"],...d.m.map(x=>[MESES[x.mes-1],x.rec,x.desp,x.res,x.saldo])]);
  s3["!cols"]=[{wch:12},{wch:14},{wch:14},{wch:14},{wch:16}];
  const s4=X.utils.aoa_to_sheet([["Tipo","Vencimento","Descrição","Cliente/Fornecedor","Situação","Valor (R$)"],
    ...[...d.pp,...d.pr].map(i=>[i.tipo==="receita"?"A receber":"A pagar",brDate(i.vencimento),i.descricao,i.parte||"",sit(i),i.valor])]);
  s4["!cols"]=[{wch:10},{wch:12},{wch:34},{wch:26},{wch:10},{wch:14}];
  [s1,s2,s3,s4].forEach(s=>{ Object.keys(s).forEach(k=>{ if(k[0]!=="!" && typeof s[k].v==="number") s[k].z='#,##0.00'; }); });
  X.utils.book_append_sheet(wb,s1,"Resumo"); X.utils.book_append_sheet(wb,s2,"Lançamentos"); X.utils.book_append_sheet(wb,s3,"Mensal "+state.ano); X.utils.book_append_sheet(wb,s4,"Contas em aberto");
  const buf=X.write(wb,{bookType:"xlsx",type:"array"});
  await saveFile("caixa-firme-"+slug()+".xlsx", new Blob([buf]));
}
async function exportPdf(){
  toast("Gerando PDF...");
  try{ await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"); await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"); }
  catch{ toast("Não foi possível carregar o gerador de PDF. Verifique a conexão."); return; }
  const d=dadosRel(); const doc=new window.jspdf.jsPDF({unit:"pt",format:"a4"}); const W=doc.internal.pageSize.getWidth();
  const ink=[18,26,46], acc=[39,71,201];
  doc.setFillColor(...ink); doc.rect(0,0,W,70,"F");
  doc.setTextColor(255); doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.text("Caixa Firme",40,34);
  doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.text("Relatório financeiro · "+periodLabel(),40,52);
  doc.text("Gerado em "+brDate(TODAY),W-40,52,{align:"right"});
  doc.setTextColor(...ink);
  const tiles=[["Receitas",d.r.rec],["Despesas",d.r.desp],["Resultado",d.r.res],["Saldo em caixa",d.saldo]];
  const tw=(W-80-30)/4;
  tiles.forEach(([l,v],k)=>{ const x=40+k*(tw+10); doc.setDrawColor(214,220,232); doc.roundedRect(x,88,tw,52,4,4,"S");
    doc.setFontSize(8); doc.setTextColor(119,129,154); doc.text(l.toUpperCase(),x+10,104);
    doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(...(l==="Despesas"||v<0?[181,62,26]:l==="Receitas"?[13,122,83]:ink)); doc.text(fmt(v),x+10,126); doc.setFont("helvetica","normal"); });
  const head={fillColor:[233,237,245],textColor:ink,fontStyle:"bold",fontSize:8.5};
  const base={styles:{fontSize:8.5,cellPadding:4,textColor:ink},headStyles:head,margin:{left:40,right:40},theme:"grid",tableLineColor:[214,220,232],tableLineWidth:.5};
  const marg=d.r.rec?(d.r.res/d.r.rec*100):0;
  doc.autoTable({...base,startY:160,head:[["DRE simplificada (competência)","Valor"]],
    body:[[{content:"Receita bruta",styles:{fontStyle:"bold"}},{content:fmt(d.r.rec),styles:{fontStyle:"bold"}}],...d.rc.map(([c,v])=>["    "+c,fmt(v)]),
      [{content:"(-) Despesas",styles:{fontStyle:"bold"}},{content:fmt(d.r.desp),styles:{fontStyle:"bold"}}],...d.dc.map(([c,v])=>["    "+c,fmt(v)]),
      [{content:"Resultado do período",styles:{fontStyle:"bold"}},{content:fmt(d.r.res),styles:{fontStyle:"bold"}}],["Margem líquida",marg.toLocaleString("pt-BR",{maximumFractionDigits:1})+"%"]],
    columnStyles:{1:{halign:"right",cellWidth:120}}});
  doc.autoTable({...base,startY:doc.lastAutoTable.finalY+18,head:[["Mês","Receitas","Despesas","Resultado","Saldo acumulado"]],
    body:d.m.map(x=>[MESES[x.mes-1],fmt(x.rec),fmt(x.desp),fmt(x.res),fmt(x.saldo)]),columnStyles:{1:{halign:"right"},2:{halign:"right"},3:{halign:"right"},4:{halign:"right"}},
    didParseCell:c=>{ if(c.section==="body" && state.mes===c.row.index+1) c.cell.styles.fontStyle="bold"; }});
  doc.autoTable({...base,startY:doc.lastAutoTable.finalY+18,head:[["Contas em aberto","Vencimento","Situação","Valor"]],
    body:[...d.pp,...d.pr].map(i=>[(i.tipo==="receita"?"A receber: ":"A pagar: ")+i.descricao,brDate(i.vencimento),sit(i),fmt(i.valor)]),
    columnStyles:{3:{halign:"right"}}});
  doc.autoTable({...base,startY:doc.lastAutoTable.finalY+18,head:[["Vencimento","Descrição","Categoria","Situação","Valor"]],
    body:d.linhas.map(i=>[brDate(i.vencimento),i.descricao+(i.parte?" ("+i.parte+")":""),i.categoria,sit(i),(i.tipo==="receita"?"+ ":"- ")+fmt(i.valor)]),
    columnStyles:{4:{halign:"right",cellWidth:80}},
    didParseCell:c=>{ if(c.section==="body"&&c.column.index===4){ c.cell.styles.textColor = c.cell.raw.startsWith("+")?[13,122,83]:[181,62,26]; } }});
  const n=doc.getNumberOfPages();
  for(let p=1;p<=n;p++){ doc.setPage(p); doc.setFontSize(8); doc.setTextColor(119,129,154); doc.text("Página "+p+" de "+n,W-40,doc.internal.pageSize.getHeight()-20,{align:"right"}); }
  await saveFile("caixa-firme-"+slug()+".pdf", new Blob([doc.output("arraybuffer")]));
}

/* ---------- tema ---------- */
const mq = window.matchMedia("(prefers-color-scheme: dark)");
function isDark(){ const t=document.documentElement.getAttribute("data-theme"); return t?t==="dark":mq.matches; }
function paintThemeBtn(){
  const b=document.getElementById("btn-tema"); const d=isDark();
  b.innerHTML = (d?`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3"/></svg>`
    :`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M13.5 9.5A5.5 5.5 0 016.5 2.5a5.5 5.5 0 107 7z"/></svg>`)+`<span class="btn-label">${d?"Tema claro":"Tema escuro"}</span>`;
}
const savedTheme=lsGet("cf.tema"); if(savedTheme==="dark"||savedTheme==="light") document.documentElement.setAttribute("data-theme",savedTheme);
mq.addEventListener && mq.addEventListener("change",paintThemeBtn);

/* ---------- eventos ---------- */
document.getElementById("btn-tema").onclick=()=>{ const n=isDark()?"light":"dark"; document.documentElement.setAttribute("data-theme",n); lsSet("cf.tema",n); paintThemeBtn(); };
document.getElementById("btn-novo").onclick=()=>openForm(null, state.tab==="receber"?"receita":"despesa");
document.getElementById("f-mes").onchange=e=>{ state.mes=+e.target.value; render(); };
document.getElementById("f-ano").onchange=e=>{ state.ano=+e.target.value; render(); };
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{ state.tab=t.dataset.tab; lsSet("cf.tab",state.tab); render(); });
document.addEventListener("input",e=>{ if(e.target.id==="busca"){ state.q=e.target.value; render(); } });
const armed=new Map();
document.addEventListener("click",e=>{
  const s=e.target.closest("[data-seg]"); if(s){ state[s.dataset.seg]=s.dataset.v; if(s.dataset.seg==="graf") lsSet("cf.graf",s.dataset.v); render(); return; }
  const b=e.target.closest("[data-act]"); if(!b) return;
  const act=b.dataset.act, id=b.dataset.id; const it=id&&state.items.find(x=>x.id===id);
  if(act==="baixar"&&it){ putItem({...it,status:"pago",pagoEm:TODAY}); toast(it.tipo==="receita"?"Recebimento registrado":"Pagamento registrado"); }
  else if(act==="reabrir"&&it){ putItem({...it,status:"pendente",pagoEm:""}); toast("Lançamento voltou para pendente"); }
  else if(act==="editar"&&it) openForm(it);
  else if(act==="excluir"&&it){
    if(armed.get(id)){ clearTimeout(armed.get(id)); armed.delete(id); delItem(id); toast("Lançamento excluído"); }
    else { b.textContent="Confirmar exclusão"; b.classList.add("confirm"); armed.set(id,setTimeout(()=>{ armed.delete(id); b.textContent="Excluir"; b.classList.remove("confirm"); },3500)); }
  }
  else if(act==="manter") startReal(true);
  else if(act==="zerar") startReal(false);
  else if(act==="pdf") exportPdf();
  else if(act==="xlsx") exportXlsx();
});

/* ---------- início ---------- */
loadLocal(); setNote(); paintThemeBtn(); render();
if(inViewer()) connectDb();
})();
