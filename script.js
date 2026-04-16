<script>
// ─── UTILITÁRIOS ───────────────────────────────────────────────
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MC=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
 
function fmt(v){return'R$\u00A0'+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
function fmtA(v){let a=Math.abs(v),s=v<0?'-':'';if(a>=1e6)return s+'R$'+(a/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1})+'M';if(a>=1000)return s+'R$'+(a/1000).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'k';return s+'R$'+a.toLocaleString('pt-BR',{minimumFractionDigits:0});}
function fmtS(v){let a=Math.abs(v),s=v<0?'-':'';return a>=1000?s+'R$'+(a/1000).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'k':s+'R$'+a.toLocaleString('pt-BR',{minimumFractionDigits:0});}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
 
// ─── ESTADO ────────────────────────────────────────────────────
let hoje=new Date(),M=hoje.getMonth(),Y=hoje.getFullYear(),AY=hoje.getFullYear();
let aba='balanco',chartRef=null;
 
const FIXAS=['balanco','graficos','anual'];
let cats=[
  {id:'balanco',nome:'Balanço geral',temp:false,ate:null},
  {id:'salario',nome:'Salário',temp:false,ate:null},
  {id:'cartao_itau',nome:'Cartão Itaú',temp:false,ate:null},
  {id:'cartao_nubank',nome:'Cartão Nubank',temp:false,ate:null},
  {id:'aluguel',nome:'Aluguel',temp:false,ate:null},
  {id:'mercado',nome:'Mercado',temp:false,ate:null},
  {id:'transporte',nome:'Transporte',temp:false,ate:null},
  {id:'investimentos',nome:'Investimentos',temp:false,ate:null},
  {id:'graficos',nome:'Gráficos',temp:false,ate:null},
  {id:'anual',nome:'Ano',temp:false,ate:null},
];
let dados={};
 
function salvar(){
  try{
    localStorage.setItem('fin4_d',JSON.stringify(dados));
    localStorage.setItem('fin4_c',JSON.stringify(cats.filter(c=>!FIXAS.includes(c.id))));
  }catch(e){}
}
function carregar(){
  try{
    let d=localStorage.getItem('fin4_d');if(d)dados=JSON.parse(d);
    let c=localStorage.getItem('fin4_c');
    if(c){
      let sv=JSON.parse(c);
      cats=[
        {id:'balanco',nome:'Balanço geral',temp:false,ate:null},
        ...sv,
        {id:'graficos',nome:'Gráficos',temp:false,ate:null},
        {id:'anual',nome:'Ano',temp:false,ate:null},
      ];
    }
  }catch(e){}
}
carregar();
 
// ─── HELPERS DADOS ─────────────────────────────────────────────
function chave(m,y){return(y!==undefined?y:Y)+'-'+(m!==undefined?m:M);}
function gd(cid,m,y){let k=chave(m,y);if(!dados[k])dados[k]={};if(!dados[k][cid])dados[k][cid]=[];return dados[k][cid];}
 
function catAtiva(c,m,y){
  if(!c.temp||!c.ate)return true;
  let [ay,am]=c.ate.split('-').map(Number);
  if(y<ay)return true;
  if(y===ay&&m<=am-1)return true;
  return false;
}
 
function totalTipo(tipo,m,y){
  return cats
    .filter(c=>!FIXAS.includes(c.id)&&catAtiva(c,m,y))
    .reduce((s,c)=>{
      return s+gd(c.id,m,y).filter(l=>l.tipo===tipo).reduce((a,l)=>a+(parseFloat(l.valor)||0),0);
    },0);
}
 
function saldoBruto(m,y){
  return totalTipo('receita',m,y)-totalTipo('despesa',m,y)-totalTipo('investimento',m,y);
}
 
function saldoMes(m,y){
  let bruto=saldoBruto(m,y);
  let pm=m-1,py=y;if(pm<0){pm=11;py=y-1;}
  let ant=saldoBruto(pm,py);
  return ant>=0?bruto+ant:bruto;
}
 
function totalCatTipo(cid,tipo,m,y){
  return gd(cid,m,y).filter(l=>l.tipo===tipo).reduce((s,l)=>s+(parseFloat(l.valor)||0),0);
}
 
// Retorna totais agrupados por tipo para uma categoria
function totaisCat(cid,m,y){
  let r=totalCatTipo(cid,'receita',m,y);
  let d=totalCatTipo(cid,'despesa',m,y);
  let i=totalCatTipo(cid,'investimento',m,y);
  return {rec:r,dep:d,inv:i,total:r+d+i};
}
 
// ─── RESUMO HEADER ─────────────────────────────────────────────
function atualizaResumo(){
  let rec=totalTipo('receita'),dep=totalTipo('despesa')+totalTipo('investimento'),saldo=saldoMes(M,Y);
  document.getElementById('sRec').textContent=fmtS(rec);
  document.getElementById('sDep').textContent=fmtS(dep);
  document.getElementById('sSaldo').textContent=fmtS(saldo);
  let pm=M-1,py=Y;if(pm<0){pm=11;py=Y-1;}
  let ant=saldoBruto(pm,py);
  document.getElementById('sHint').textContent=ant>0?'+ ant. '+fmtS(ant):ant<0?'ant. neg. ignorado':'';
}
 
// ─── ABAS ──────────────────────────────────────────────────────
function renderAbas(){
  let nav=document.getElementById('abas');
  nav.innerHTML='';
  let visiveis=cats.filter(c=>FIXAS.includes(c.id)||catAtiva(c,M,Y));
  visiveis.forEach(c=>{
    let b=document.createElement('button');
    b.className='ab'+(c.id===aba?' on':'');
    b.textContent=c.nome;
    b.onclick=()=>{aba=c.id;renderAbas();renderMain();};
    nav.appendChild(b);
  });
  if(!visiveis.find(c=>c.id===aba))aba='balanco';
}
 
function renderMain(){
  if(aba==='graficos'){renderGraficos();return;}
  if(aba==='anual'){renderAnual();return;}
  if(aba==='balanco'){renderBalanco();return;}
  renderDetalhe();
}
 
// ─── BALANÇO GERAL — mostra apenas TOTAL por categoria ─────────
function renderBalanco(){
  atualizaResumo();
  let catAtivas=cats.filter(c=>!FIXAS.includes(c.id)&&catAtiva(c,M,Y));
 
  let totalRec=totalTipo('receita');
  let totalDep=totalTipo('despesa');
  let totalInv=totalTipo('investimento');
  let saldo=saldoMes(M,Y);
  let pm=M-1,py=Y;if(pm<0){pm=11;py=Y-1;}
  let ant=saldoBruto(pm,py);
  let ftxt=ant>0?'Receitas − Despesas − Invest. + Saldo anterior ('+fmt(ant)+')':'Receitas − Despesas − Invest. (saldo anterior negativo ignorado)';
 
  // Para o balanço: cada categoria aparece UMA vez, mostrando seus totais por tipo
  // Se tem múltiplos tipos, mostra uma linha por tipo dentro da categoria
  let rows='';
 
  // Coletar categorias com receitas
  let cComRec=catAtivas.filter(c=>totalCatTipo(c.id,'receita')>0);
  // Categorias com apenas despesas (sem receita)
  let cComDep=catAtivas.filter(c=>totalCatTipo(c.id,'despesa')>0&&totalCatTipo(c.id,'receita')===0);
  // Categorias com investimento
  let cComInv=catAtivas.filter(c=>totalCatTipo(c.id,'investimento')>0&&totalCatTipo(c.id,'receita')===0&&totalCatTipo(c.id,'despesa')===0);
  // Categorias mistas (receita + outros) — despesas e investimentos aparecem na seção receitas
  
  // Seção RECEITAS
  if(cComRec.length>0||totalRec>0){
    rows+=`<tr class="s-rec"><td colspan="2">Receitas</td></tr>`;
    cComRec.forEach(c=>{
      let t=totaisCat(c.id);
      // Linha principal: receita
      rows+=`<tr onclick="goToTab('${c.id}')" style="cursor:pointer;">
        <td>${esc(c.nome)}<span class="cat-tipo-badge badge-rec">entrada</span></td>
        <td class="val-rec">${fmt(t.rec)}</td>
      </tr>`;
      // Se também tem despesa, mostra sub-linha
      if(t.dep>0){
        rows+=`<tr onclick="goToTab('${c.id}')" style="cursor:pointer;opacity:0.85;">
          <td style="padding-left:28px;font-size:12px;color:var(--T3);">↳ despesas incluídas</td>
          <td class="val-dep" style="font-size:12px;">-${fmt(t.dep)}</td>
        </tr>`;
      }
      if(t.inv>0){
        rows+=`<tr onclick="goToTab('${c.id}')" style="cursor:pointer;opacity:0.85;">
          <td style="padding-left:28px;font-size:12px;color:var(--T3);">↳ invest. incluídos</td>
          <td class="val-inv" style="font-size:12px;">-${fmt(t.inv)}</td>
        </tr>`;
      }
    });
    rows+=`<tr class="tot"><td>Total receitas</td><td class="val-rec">${fmt(totalRec)}</td></tr>`;
  }
 
  // Seção DESPESAS
  if(cComDep.length>0||totalDep>0){
    rows+=`<tr class="s-dep"><td colspan="2">Despesas</td></tr>`;
    cComDep.forEach(c=>{
      let t=totaisCat(c.id);
      rows+=`<tr onclick="goToTab('${c.id}')" style="cursor:pointer;">
        <td>${esc(c.nome)}<span class="cat-tipo-badge badge-dep">a pagar</span></td>
        <td class="val-dep">${fmt(t.dep)}</td>
      </tr>`;
    });
    rows+=`<tr class="tot"><td>Total despesas</td><td class="val-dep">${fmt(totalDep)}</td></tr>`;
  }
 
  // Seção INVESTIMENTOS
  if(cComInv.length>0||totalInv>0){
    rows+=`<tr class="s-inv"><td colspan="2">Investimentos</td></tr>`;
    cComInv.forEach(c=>{
      let t=totaisCat(c.id);
      rows+=`<tr onclick="goToTab('${c.id}')" style="cursor:pointer;">
        <td>${esc(c.nome)}<span class="cat-tipo-badge badge-inv">investido</span></td>
        <td class="val-inv">${fmt(t.inv)}</td>
      </tr>`;
    });
    rows+=`<tr class="tot"><td>Total investimentos</td><td class="val-inv">${fmt(totalInv)}</td></tr>`;
  }
 
  // Categorias sem nenhum lançamento — não aparecem
  rows+=`<tr class="tot"><td style="font-weight:700;">Saldo do mês</td><td class="${saldo>=0?'val-rec':'val-dep'}" style="font-weight:700;">${fmt(saldo)}</td></tr>`;
 
  document.getElementById('main').innerHTML=`
    <div class="tc"><div class="tw">
      <table><thead><tr><th>Categoria</th><th>Valor</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="sf">${ftxt}<br><span style="color:var(--G);font-size:10px;">Toque em uma categoria para ver os lançamentos</span></div>
    </div></div>`;
}
 
function goToTab(id){
  aba=id;renderAbas();renderMain();
}
 
// ─── DETALHE CATEGORIA ─────────────────────────────────────────
let abaTipo={};
 
function renderDetalhe(){
  atualizaResumo();
  let linhas=gd(aba);
  if(!abaTipo[aba])abaTipo[aba]='despesa';
  let t=abaTipo[aba];
 
  let lRec=linhas.filter(l=>l.tipo==='receita');
  let lDep=linhas.filter(l=>l.tipo==='despesa');
  let lInv=linhas.filter(l=>l.tipo==='investimento');
 
  function blocoLinhas(list,tipo,colorClass,label){
    if(list.length===0)return'';
    let rows=list.map((l)=>{
      let i=linhas.indexOf(l);
      return`<tr><td><div class="cd"><button class="dbtn" onclick="delLinha(${i})">&#215;</button><input type="text" value="${esc(l.desc)}" oninput="editDesc(${i},this.value)"/></div></td><td><div class="cv-cell"><input type="number" value="${l.valor}" oninput="editVal(${i},this.value)" step="0.01" min="0" inputmode="decimal"/></div></td></tr>`;
    }).join('');
    let tot=list.reduce((s,l)=>s+(parseFloat(l.valor)||0),0);
    let secClass=tipo==='receita'?'s-rec':tipo==='despesa'?'s-dep':'s-inv';
    return`<tr class="${secClass}"><td colspan="2">${label}</td></tr>${rows}<tr class="tot"><td>Total ${label.toLowerCase()}</td><td class="${colorClass} mo">${fmt(tot)}</td></tr>`;
  }
 
  let rows='';
  rows+=blocoLinhas(lRec,'receita','cv','Receitas');
  rows+=blocoLinhas(lDep,'despesa','cr','Despesas');
  rows+=blocoLinhas(lInv,'investimento','cb','Investimentos');
 
  let tRec=lRec.reduce((s,l)=>s+(parseFloat(l.valor)||0),0);
  let tDep=lDep.reduce((s,l)=>s+(parseFloat(l.valor)||0),0);
  let tInv=lInv.reduce((s,l)=>s+(parseFloat(l.valor)||0),0);
  if(linhas.length>0){
    let net=tRec-tDep-tInv;
    rows+=`<tr class="tot"><td style="font-weight:600;">Resultado</td><td class="${net>=0?'cv':'cr'} mo" style="font-weight:600;">${fmt(net)}</td></tr>`;
  }
 
  document.getElementById('main').innerHTML=`
    <div class="tc"><div class="tw">
      <table><thead><tr><th>Descrição</th><th>Valor</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="al">
        <div class="al-tipo">
          <button class="at ${t==='receita'?'ar':''}" id="atR" onclick="setAbaTipo('receita')">Receita</button>
          <button class="at ${t==='despesa'?'ad':''}" id="atD" onclick="setAbaTipo('despesa')">Despesa</button>
          <button class="at ${t==='investimento'?'ai':''}" id="atI" onclick="setAbaTipo('investimento')">Invest.</button>
        </div>
        <div class="al-row">
          <input type="text" id="nDesc" placeholder="Descrição..."/>
          <input type="number" id="nVal" placeholder="0,00" min="0" step="0.01" inputmode="decimal"/>
          <button class="abtn" onclick="addLinha()">+</button>
        </div>
      </div>
    </div></div>`;
}
 
function setAbaTipo(t){
  abaTipo[aba]=t;
  ['R','D','I'].forEach(x=>{
    let el=document.getElementById('at'+x);
    if(!el)return;
    let map={R:'receita',D:'despesa',I:'investimento'};
    let cls={receita:'ar',despesa:'ad',investimento:'ai'};
    el.className='at'+(t===map[x]?' '+cls[t]:'');
  });
}
 
function addLinha(){
  let desc=document.getElementById('nDesc').value.trim(),valor=parseFloat(document.getElementById('nVal').value)||0;
  if(!desc)return;
  gd(aba).push({desc,valor,tipo:abaTipo[aba]||'despesa'});
  salvar();renderDetalhe();
}
function delLinha(i){gd(aba).splice(i,1);salvar();renderDetalhe();}
function editDesc(i,v){gd(aba)[i].desc=v;salvar();atualizaResumo();}
function editVal(i,v){gd(aba)[i].valor=parseFloat(v)||0;salvar();atualizaResumo();}
 
// ─── GRÁFICOS ──────────────────────────────────────────────────
function renderGraficos(){
  atualizaResumo();
  let rec=totalTipo('receita'),dep=totalTipo('despesa'),inv=totalTipo('investimento'),maxG=Math.max(rec,dep,inv,1);
  let rA=[],dA=[],iA=[],sA=[];
  for(let m=0;m<12;m++){rA.push(totalTipo('receita',m,Y));dA.push(totalTipo('despesa',m,Y));iA.push(totalTipo('investimento',m,Y));sA.push(saldoMes(m,Y));}
 
  let cDep=cats.filter(c=>!FIXAS.includes(c.id)&&catAtiva(c,M,Y));
  let maxD=Math.max(...cDep.map(c=>totalCatTipo(c.id,'despesa')),1);
 
  document.getElementById('main').innerHTML=`
    <div class="gc">
      <div class="gcard"><div class="gh">Entradas x saídas — ${MESES[M]}</div><div class="gb">
        <div class="br"><div class="bl">Receitas</div><div class="bb"><div class="bf" style="width:${Math.round(rec/maxG*100)}%;background:#2ECC71;"></div></div><div class="bv cv">${fmt(rec)}</div></div>
        <div class="br"><div class="bl">Despesas</div><div class="bb"><div class="bf" style="width:${Math.round(dep/maxG*100)}%;background:#FF3B30;"></div></div><div class="bv cr">${fmt(dep)}</div></div>
        <div class="br"><div class="bl">Investimentos</div><div class="bb"><div class="bf" style="width:${Math.round(inv/maxG*100)}%;background:#007AFF;"></div></div><div class="bv cb">${fmt(inv)}</div></div>
      </div></div>
      <div class="gcard"><div class="gh">Despesas por categoria — ${MESES[M]}</div><div class="gb">
        ${cDep.map(c=>{let v=totalCatTipo(c.id,'despesa'),p=Math.round(v/maxD*100);return`<div class="br"><div class="bl">${esc(c.nome)}</div><div class="bb"><div class="bf" style="width:${p}%;background:#FF3B30;opacity:${(0.3+0.7*(v/maxD)).toFixed(2)};"></div></div><div class="bv">${fmt(v)}</div></div>`;}).join('')}
        ${cDep.length===0?'<div style="color:var(--T3);font-size:13px;text-align:center;padding:8px 0;">Nenhuma despesa lançada</div>':''}
      </div></div>
      <div class="gcard"><div class="gh">Evolução anual — ${Y}</div><div class="gb"><canvas id="cAnual" style="max-height:220px;"></canvas></div></div>
    </div>`;
 
  if(chartRef){chartRef.destroy();chartRef=null;}
  setTimeout(()=>{
    let ctx=document.getElementById('cAnual');if(!ctx)return;
    chartRef=new Chart(ctx,{type:'bar',data:{labels:MC,datasets:[
      {label:'Receitas',data:rA,backgroundColor:'#2ECC7188',borderRadius:3},
      {label:'Despesas',data:dA,backgroundColor:'#FF3B3088',borderRadius:3},
      {label:'Invest.',data:iA,backgroundColor:'#007AFF88',borderRadius:3},
      {label:'Saldo',data:sA,type:'line',borderColor:'#5856D6',backgroundColor:'transparent',tension:0.35,pointRadius:3,borderWidth:2,pointBackgroundColor:'#5856D6'},
    ]},options:{responsive:true,plugins:{legend:{labels:{font:{size:11},boxWidth:10,padding:10}}},scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{grid:{color:'rgba(0,0,0,0.05)'},ticks:{font:{size:10},callback:v=>'R$'+(Math.abs(v)>=1000?(v/1000).toFixed(1)+'k':v)}}}}});
  },80);
}
 
// ─── ANO ───────────────────────────────────────────────────────
function renderAnual(){
  atualizaResumo();
  document.getElementById('main').innerHTML=`
    <div class="anc">
      <div class="anav"><button onclick="mudaAno(-1)">&#8249;</button><span id="anoTxt">${AY}</span><button onclick="mudaAno(1)">&#8250;</button></div>
      <div id="aConteudo"></div>
    </div>`;
  renderAnualConteudo();
}
function renderAnualConteudo(){
  let el=document.getElementById('aConteudo');if(!el)return;
  let tR=0,tD=0,tI=0,tS=0,rows='';
  for(let m=0;m<12;m++){
    let r=totalTipo('receita',m,AY),d=totalTipo('despesa',m,AY),i=totalTipo('investimento',m,AY),s=saldoMes(m,AY);
    tR+=r;tD+=d;tI+=i;tS+=s;
    let vazio=r===0&&d===0&&i===0;
    rows+=`<tr style="${vazio?'opacity:0.4;':''}"><td>${MC[m]}</td><td class="cv">${r>0?fmtA(r):'—'}</td><td class="cr">${d>0?fmtA(d):'—'}</td><td class="cb">${i>0?fmtA(i):'—'}</td><td class="${s>=0?'cp':'cr'}">${fmtA(s)}</td></tr>`;
  }
  rows+=`<tr class="tot"><td>Total</td><td class="cv">${fmtA(tR)}</td><td class="cr">${fmtA(tD)}</td><td class="cb">${fmtA(tI)}</td><td class="${tS>=0?'cp':'cr'}">${fmtA(tS)}</td></tr>`;
  el.innerHTML=`
    <div class="ares">
      <div class="acard"><div class="lbl">Receitas</div><div class="val cv">${fmtA(tR)}</div></div>
      <div class="acard"><div class="lbl">Despesas</div><div class="val cr">${fmtA(tD)}</div></div>
      <div class="acard"><div class="lbl">Investimentos</div><div class="val cb">${fmtA(tI)}</div></div>
      <div class="acard"><div class="lbl">Saldo anual</div><div class="val ${tS>=0?'cp':'cr'}">${fmtA(tS)}</div></div>
    </div>
    <div class="aw"><div class="asc"><table>
      <thead><tr><th>Mês</th><th>Rec.</th><th>Desp.</th><th>Inv.</th><th>Saldo</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div></div>`;
}
function mudaAno(d){AY+=d;document.getElementById('anoTxt').textContent=AY;renderAnualConteudo();}
 
// ─── NAVEGAÇÃO MÊS ────────────────────────────────────────────
function mudaMes(d){
  M+=d;if(M>11){M=0;Y++;}if(M<0){M=11;Y--;}
  document.getElementById('mesTit').textContent=MESES[M]+' '+Y;
  renderAbas();renderMain();
}
 
// ─── MODAL CATEGORIAS ─────────────────────────────────────────
function abrirModal(){renderCList();document.getElementById('ov').classList.add('on');}
function fecharModal(){document.getElementById('ov').classList.remove('on');}
function toggleTempUI(){document.getElementById('tempDateWrap').style.display=document.getElementById('nTemp').checked?'block':'none';}
 
function renderCList(){
  let el=document.getElementById('clist');
  let editaveis=cats.filter(c=>!FIXAS.includes(c.id));
  el.innerHTML=editaveis.map((c,i)=>{
    let badge=c.temp?`<span class="ci-temp">até ${c.ate}</span>`:'';
    return`<div class="ci" draggable="true" data-id="${c.id}" ondragstart="dragStart(event,'${c.id}')" ondragover="dragOver(event)" ondrop="dragDrop(event,'${c.id}')">
      <span class="ci-drag">&#8942;&#8942;</span>
      <span class="ci-name">${esc(c.nome)}</span>
      <div class="ci-meta">${badge}<button class="dbtn" onclick="delCat('${c.id}')">&#215;</button></div>
    </div>`;
  }).join('');
}
 
let dragSrc=null;
function dragStart(e,id){dragSrc=id;e.currentTarget.classList.add('dragging');}
function dragOver(e){e.preventDefault();}
function dragDrop(e,targetId){
  e.preventDefault();
  if(!dragSrc||dragSrc===targetId)return;
  let fixasBefore=cats.slice(0,cats.findIndex(c=>!FIXAS.includes(c.id)));
  let fixasAfter=cats.slice(cats.findLastIndex(c=>!FIXAS.includes(c.id))+1);
  let mid=cats.filter(c=>!FIXAS.includes(c.id));
  let si=mid.findIndex(c=>c.id===dragSrc),ti=mid.findIndex(c=>c.id===targetId);
  if(si<0||ti<0)return;
  let [item]=mid.splice(si,1);mid.splice(ti,0,item);
  cats=[...fixasBefore,...mid,...fixasAfter];
  dragSrc=null;salvar();renderCList();renderAbas();
}
 
function adicionarCat(){
  let nome=document.getElementById('nNome').value.trim();if(!nome)return;
  let temp=document.getElementById('nTemp').checked;
  let ate=temp?document.getElementById('nAte').value:null;
  if(temp&&!ate){alert('Escolha a data de validade.');return;}
  let id='c'+Date.now();
  let idx=cats.findIndex(c=>c.id==='graficos');
  cats.splice(idx,0,{id,nome,temp,ate});
  document.getElementById('nNome').value='';
  document.getElementById('nTemp').checked=false;
  document.getElementById('nAte').value='';
  document.getElementById('tempDateWrap').style.display='none';
  salvar();renderCList();renderAbas();
}
function delCat(id){
  cats=cats.filter(c=>c.id!==id);
  if(aba===id)aba='balanco';
  salvar();renderCList();renderAbas();renderMain();
}
 
document.getElementById('ov').addEventListener('click',function(e){if(e.target===this)fecharModal();});
 
// ─── INIT ──────────────────────────────────────────────────────
document.getElementById('mesTit').textContent=MESES[M]+' '+Y;
renderAbas();
renderMain();
</script>