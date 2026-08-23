(function(){
  "use strict";

  const REPO="https://github.com/wadmes/wadmes.github.io";
  const CARD_W=150,CARD_H=132,CARD_CLEARANCE=Math.hypot(CARD_W,CARD_H)+20,TAU=Math.PI*2;
  const domains={
    "NUS":"nus.edu.sg","National University of Singapore":"nus.edu.sg","CUHK":"cuhk.edu.hk","CUHK-Shenzhen":"cuhk.edu.cn","Carnegie Mellon":"cmu.edu","CMU":"cmu.edu","Berkeley":"berkeley.edu","UC Berkeley":"berkeley.edu","UCLA":"ucla.edu","UT Austin":"utexas.edu","UIUC":"illinois.edu","Illinois":"illinois.edu","Stanford":"stanford.edu","MIT":"mit.edu","Harvard":"harvard.edu","Princeton":"princeton.edu","Michigan":"umich.edu","Purdue":"purdue.edu","Georgia Tech":"gatech.edu","Cornell":"cornell.edu","EPFL":"epfl.ch","ETH Zürich":"ethz.ch","USC":"usc.edu","UC San Diego":"ucsd.edu","UC Santa Barbara":"ucsb.edu","UCSB":"ucsb.edu","Duke":"duke.edu","Duke Kunshan":"dukekunshan.edu.cn","Arizona State":"asu.edu","Peking University":"pku.edu.cn","Tsinghua":"tsinghua.edu.cn","HKUST":"ust.hk","HKUST(GZ)":"hkust-gz.edu.cn","ShanghaiTech":"shanghaitech.edu.cn","Zhejiang University":"zju.edu.cn","Fudan":"fudan.edu.cn","Notre Dame":"nd.edu","Pittsburgh":"pitt.edu","Binghamton":"binghamton.edu","Wisconsin":"wisc.edu","NTU":"ntu.edu.tw","NTU Singapore":"ntu.edu.sg","NTHU":"nthu.edu.tw","NCTU":"nycu.edu.tw","NCKU":"ncku.edu.tw","NTUST":"ntust.edu.tw","Northwestern":"northwestern.edu","Illinois Tech":"iit.edu","Iowa State":"iastate.edu","Minnesota":"umn.edu","Texas A&M":"tamu.edu","Brown":"brown.edu","Virginia":"virginia.edu","Virginia Tech":"vt.edu","Columbia":"columbia.edu","Boston University":"bu.edu","Waterloo":"uwaterloo.ca","Syracuse":"syracuse.edu","Northeastern":"northeastern.edu","UC Irvine":"uci.edu","UCF":"ucf.edu","San Francisco State":"sfsu.edu","Rice":"rice.edu","Auckland":"auckland.ac.nz","Hunan University":"hnu.edu.cn","Hong Kong Baptist University":"hkbu.edu.hk","Yonsei":"yonsei.ac.kr","Sungkyunkwan":"skku.edu","UFMG":"ufmg.br","Seoul National University":"snu.ac.kr","Kyungpook National University":"knu.ac.kr","POSTECH":"postech.ac.kr","IIT Kanpur":"iitk.ac.in","IIT Delhi":"iitd.ac.in","NJIT":"njit.edu","UTEP":"utep.edu","UT Dallas":"utdallas.edu","Yale":"yale.edu","Penn State":"psu.edu","Pennsylvania":"upenn.edu","Shanghai Jiao Tong":"sjtu.edu.cn","Chongqing University":"cqu.edu.cn","Simon Fraser":"sfu.ca","Hong Kong Polytechnic":"polyu.edu.hk","Kwangwoon University":"kw.ac.kr","Chungbuk National University":"chungbuk.ac.kr","Nebraska":"unl.edu","SUSTech":"sustech.edu.cn","UBC":"ubc.ca","UC Davis":"ucdavis.edu","UC Santa Cruz":"ucsc.edu","UIC":"uic.edu","UNICAMP":"unicamp.br","Utah":"utah.edu","Maryland":"umd.edu","Stevens":"stevens.edu","Vermont":"uvm.edu","Buffalo":"buffalo.edu","Academia Sinica":"sinica.edu.tw","Kookmin University":"kookmin.ac.kr","Chinese Academy of Sciences":"ict.ac.cn","Synopsys":"synopsys.com","Easy-Logic":"easy-logic.com","Caltech":"caltech.edu","Xerox PARC":"parc.com","Carnegie Institution":"carnegiescience.edu","KU Leuven":"kuleuven.be","IMEC":"imec-int.com","Florida":"ufl.edu","Colorado State":"colostate.edu"};
  const localLogos={"zju.edu.cn":"./logos/zhejiang.png","pku.edu.cn":"./logos/peking.png","tsinghua.edu.cn":"./logos/tsinghua.png","nthu.edu.tw":"./logos/nthu.jpg","ntu.edu.tw":"./logos/ntu.png","sjtu.edu.cn":"./logos/sjtu.png","ust.hk":"./logos/hkust.png"};
  let localPortraits={};
  const els={tabs:q("#branch-tabs"),nodes:q("#tree-nodes"),edges:q("#tree-edges"),rings:q("#orbit-rings"),canvas:q("#radial-canvas"),stage:q("#radial-stage"),count:q("#scholar-count"),branchCount:q("#branch-count"),search:q("#scholar-search"),results:q("#search-results"),zoom:q("#zoom-level"),panel:q("#profile-panel"),profileName:q("#profile-name"),profileAffiliation:q("#profile-affiliation"),profileDetails:q("#profile-details"),profileLogo:q("#profile-logo"),profileLink:q("#profile-link"),suggest:q("#suggest-link")};
  let nodes=[],edges=[],byId=new Map(),incoming=new Map(),outgoing=new Map(),selectedId="",focusId="",scale=.42,layout=null,baseLayout=null,drag=null;

  function q(sel){return document.querySelector(sel)}
  function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
  function slug(s){return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}
  function initials(s){return s.replace(/\([^)]*\)/g,"").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()}
  function institutionDomain(name){
    const clean=(name||"").trim();
    if(domains[clean])return domains[clean];
    const key=Object.keys(domains).find(k=>clean.includes(k)||k.includes(clean));
    return key?domains[key]:"";
  }
  function logoSources(name){const d=institutionDomain(name);if(!d)return[];const sources=[];if(localLogos[d])sources.push(localLogos[d]);sources.push(`https://www.google.com/s2/favicons?domain_url=https://${encodeURIComponent(d)}&sz=128`);if(!localLogos[d])sources.push(`https://${d}/favicon.ico`,`https://www.${d}/favicon.ico`);return sources}
  function portraitSources(node){const portrait=localPortraits[node.name];if(!portrait)return[];return[typeof portrait==="string"?portrait:portrait.file].filter(Boolean)}
  window.edaLogoFallback=img=>{const sources=(img.dataset.logoFallbacks||"").split("|").filter(Boolean),attempt=Number(img.dataset.logoAttempt||0);if(attempt<sources.length){img.dataset.logoAttempt=String(attempt+1);img.src=sources[attempt];return}img.className="failed";const fallback=img.nextElementSibling;if(fallback)fallback.hidden=false;else img.remove()};
  function issueUrl(node){
    const title=node?`EDA Family Tree update: ${node.name}`:"EDA Family Tree: proposed update";
    const body=node?`Scholar: ${node.name}\nCurrent entry: ${node.details}\n\nProposed change:\n\nEvidence URL (required):\n\nRelationship / degree details:\n\nYour name and affiliation:\n`:`Proposal type (new scholar / correction / affiliation):\n\nScholar name:\n\nAdvisor name:\n\nDegree institution and year:\n\nCurrent academic affiliation:\n\nEvidence URL (required):\n\nYour name and affiliation:\n`;
    return `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=${encodeURIComponent("EDA genealogy")}`;
  }
  function parseMarkdown(text){
    const out=[],links=[],stack=[],seen=new Map();let section="Selected EDA lineages",order=0;
    for(const line of text.split(/\r?\n/)){
      const h=line.match(/^##+\s+(.+)/);if(h){section=h[1].trim();continue}
      const m=line.match(/^(\s*)\+ \[([^\]]+)\]\((https?:\/\/[^)]+)\)\s*\((.+)\)\s*$/);if(!m)continue;
      const depth=Math.floor(m[1].replace(/\t/g,"  ").length/2),name=m[2].trim(),details=m[4].trim();
      const parent=depth>0?stack[depth-1]:null;
      const year=(details.match(/[’'](\d{2})/)||[])[1];
      const path=details.split(/\s*→\s*/).map(x=>x.trim());
      let affiliation=(path[path.length-1]||"").replace(/;.*$/,"").trim();
      const degree=(details.match(/^([^()]+?)\s+(?:Ph\.D\.|Sc\.D\.|D\.Eng\.|M\.Phil\.)/)||[])[1]||path[0]||"";
      const relation=/intellectual collaboration/i.test(details)?"collaboration":/M\.Phil\./i.test(details)?"mphil":/postdoc/i.test(details)?"postdoc":"phd";
      const id=slug(name),existing=seen.get(id);
      const node=existing||{id,name,url:m[3],details,degreeInstitution:degree.trim(),year:year?(/^[0-2]/.test(year)?`20${year}`:`19${year}`):"",affiliation,sections:[],order:order++};
      if(!existing){out.push(node);seen.set(id,node)}
      if(!node.sections.includes(section))node.sections.push(section);
      if(parent&&parent.id!==node.id&&!links.some(e=>e.source===parent.id&&e.target===node.id&&e.relation===relation))links.push({source:parent.id,target:node.id,relation});
      stack[depth]=node;stack.length=depth+1;
    }
    return {nodes:out,edges:links};
  }
  function rebuildIndexes(){
    byId=new Map(nodes.map(n=>[n.id,n]));incoming=new Map(nodes.map(n=>[n.id,[]]));outgoing=new Map(nodes.map(n=>[n.id,[]]));
    edges=edges.filter(e=>byId.has(e.source)&&byId.has(e.target));
    edges.forEach(e=>{outgoing.get(e.source).push(e);incoming.get(e.target).push(e)});
  }
  function academicEdges(){return edges.filter(e=>e.relation!=="collaboration")}
  function components(){
    const unseen=new Set(nodes.map(n=>n.id)),sets=[];
    while(unseen.size){const seed=unseen.values().next().value,ids=new Set([seed]),queue=[seed];unseen.delete(seed);while(queue.length){const id=queue.shift(),near=[...(incoming.get(id)||[]),...(outgoing.get(id)||[])];near.forEach(e=>{const other=e.source===id?e.target:e.source;if(unseen.delete(other)){ids.add(other);queue.push(other)}})}sets.push(ids)}
    return sets.sort((a,b)=>b.size-a.size);
  }
  function layeredComponent(ids){
    const list=[...ids].map(id=>byId.get(id)),links=academicEdges().filter(e=>ids.has(e.source)&&ids.has(e.target)),depth=new Map(list.map(n=>[n.id,0]));
    for(let pass=0;pass<list.length;pass++){let changed=false;links.forEach(e=>{const next=(depth.get(e.source)||0)+1;if(next>(depth.get(e.target)||0)){depth.set(e.target,next);changed=true}});if(!changed)break}
    const levels=new Map();list.forEach(n=>{const d=depth.get(n.id)||0,a=levels.get(d)||[];a.push(n);levels.set(d,a)});levels.forEach(a=>a.sort((x,y)=>x.order-y.order));
    const score=(n,neighbors,orders)=>{const es=neighbors.get(n.id)||[],vals=es.map(e=>orders.get(e.source===n.id?e.target:e.source)).filter(v=>v!==undefined);return vals.length?vals.reduce((s,v)=>s+v,0)/vals.length:n.order};
    for(let sweep=0;sweep<8;sweep++){
      const ds=[...levels.keys()].sort((a,b)=>a-b),forward=sweep%2===0,walk=forward?ds:ds.slice().reverse(),orders=new Map();levels.forEach(a=>a.forEach((n,i)=>orders.set(n.id,i)));
      walk.forEach(d=>levels.get(d).sort((a,b)=>score(a,forward?incoming:outgoing,orders)-score(b,forward?incoming:outgoing,orders)||a.order-b.order));
    }
    let minX=Infinity,maxX=-Infinity,maxY=0;const pos=[];levels.forEach((level,d)=>{const span=(level.length-1)*185;level.forEach((n,i)=>{const x=i*185-span/2,y=d*205;minX=Math.min(minX,x);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);pos.push({...n,x,y,relativeDepth:d})})});
    return {nodes:pos,width:Math.max(330,maxX-minX+260),height:Math.max(260,maxY+250)};
  }
  function nebulaLayout(){
    /* Placement-like overview: minimize weighted wirelength first, legalize
       card density second, and use crossing reduction only as a light tie-break.
       It intentionally has no generation rows. */
    const groups=components(),state=[],index=new Map(),golden=2.399963229728653;
    groups.forEach((group,g)=>{const theta=g*golden,r=g?380*Math.sqrt(g):0,cx=Math.cos(theta)*r,cy=Math.sin(theta)*r,ids=[...group];ids.forEach((id,i)=>{const a=i*golden+g*.73,rr=42*Math.sqrt(i+1),n=byId.get(id),item={...n,x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr,seedX:cx+Math.cos(a)*rr,seedY:cy+Math.sin(a)*rr,vx:0,vy:0};index.set(id,state.length);state.push(item)})});
    const add=(id,x,y)=>{const n=state[index.get(id)];if(n){n.fx+=x;n.fy+=y}};
    const crosses=(a,b,c,d)=>{const side=(p,q,r)=>Math.sign((q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x));return side(a,b,c)*side(a,b,d)<0&&side(c,d,a)*side(c,d,b)<0};
    for(let tick=0;tick<460;tick++){
      state.forEach(n=>{n.fx=(n.seedX-n.x)*.00005;n.fy=(n.seedY-n.y)*.00005});
      for(let i=0;i<state.length;i++)for(let j=i+1;j<state.length;j++){const a=state[i],b=state[j],dx=b.x-a.x||.01,dy=b.y-a.y||.01,d=Math.hypot(dx,dy),ux=dx/d,uy=dy/d,collision=168,repel=Math.min(1.7,9200/(d*d));let push=repel;if(d<collision)push+=(collision-d)*.04;a.fx-=ux*push;a.fy-=uy*push;b.fx+=ux*push;b.fy+=uy*push}
      edges.forEach(e=>{const a=state[index.get(e.source)],b=state[index.get(e.target)],dx=b.x-a.x||.01,dy=b.y-a.y||.01,d=Math.hypot(dx,dy),target=e.relation==="collaboration"?245:195,weight=e.relation==="collaboration"?.45:1,pull=Math.max(-6,Math.min(6,(d-target)*.025))*weight,ux=dx/d,uy=dy/d;a.fx+=ux*pull;a.fy+=uy*pull;b.fx-=ux*pull;b.fy-=uy*pull});
      if(tick>180&&tick%8===0)for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){const a=edges[i],b=edges[j];if(a.source===b.source||a.source===b.target||a.target===b.source||a.target===b.target)continue;const as=state[index.get(a.source)],at=state[index.get(a.target)],bs=state[index.get(b.source)],bt=state[index.get(b.target)];if(crosses(as,at,bs,bt)){const dx=at.x-as.x,dy=at.y-as.y,d=Math.hypot(dx,dy)||1,nx=-dy/d*.055,ny=dx/d*.055;add(a.source,-nx,-ny);add(a.target,-nx,-ny);add(b.source,nx,ny);add(b.target,nx,ny)}}
      state.forEach(n=>{n.vx=(n.vx+n.fx)*.79;n.vy=(n.vy+n.fy)*.79;const speed=Math.hypot(n.vx,n.vy),cap=12;if(speed>cap){n.vx=n.vx/speed*cap;n.vy=n.vy/speed*cap}n.x+=n.vx;n.y+=n.vy});
    }
    const separateCards=passes=>{for(let pass=0;pass<passes;pass++)for(let i=0;i<state.length;i++)for(let j=i+1;j<state.length;j++){const a=state[i],b=state[j],dx=b.x-a.x,dy=b.y-a.y,ox=164-Math.abs(dx),oy=148-Math.abs(dy);if(ox>0&&oy>0){if(ox<oy){const shift=ox/2*(dx<0?-1:1);a.x-=shift;b.x+=shift}else{const shift=oy/2*(dy<0?-1:1);a.y-=shift;b.y+=shift}}}};
    separateCards(70);
    const margin=230,minX=Math.min(...state.map(n=>n.x))-margin,maxX=Math.max(...state.map(n=>n.x))+margin,minY=Math.min(...state.map(n=>n.y))-margin,maxY=Math.max(...state.map(n=>n.y))+margin,size=Math.ceil(Math.max(maxX-minX,maxY-minY));
    return {nodes:state.map(n=>({...n,x:n.x-minX+(size-(maxX-minX))/2,y:n.y-minY+(size-(maxY-minY))/2})),size,cx:size/2,cy:size/2,localIds:null,ancestors:new Set(),descendants:new Set(),radii:[]};
  }
  function localNeighborhood(id){
    const ancestors=new Set(),descendants=new Set(),up=[[id,0]],down=[id];
    while(up.length){const [current,d]=up.shift();if(d===2)continue;(incoming.get(current)||[]).filter(e=>e.relation!=="collaboration").forEach(e=>{if(!ancestors.has(e.source)){ancestors.add(e.source);up.push([e.source,d+1])}})}
    while(down.length){const current=down.shift();(outgoing.get(current)||[]).filter(e=>e.relation!=="collaboration").forEach(e=>{if(!descendants.has(e.target)){descendants.add(e.target);down.push(e.target)}})}
    return {ancestors,descendants,localIds:new Set([id,...ancestors,...descendants])};
  }
  function focusLayout(id){
    const local=localNeighborhood(id),relDepth=new Map([[id,0]]),up=[[id,0]],down=[[id,0]];
    while(up.length){const [current,d]=up.shift();if(d===-2)continue;(incoming.get(current)||[]).filter(e=>local.ancestors.has(e.source)).forEach(e=>{const nd=d-1;if(!relDepth.has(e.source)||nd<relDepth.get(e.source)){relDepth.set(e.source,nd);up.push([e.source,nd])}})}
    while(down.length){const [current,d]=down.shift();(outgoing.get(current)||[]).filter(e=>local.descendants.has(e.target)).forEach(e=>{const nd=d+1;if(!relDepth.has(e.target)||nd>relDepth.get(e.target)){relDepth.set(e.target,nd);down.push([e.target,nd])}})}
    const levels=new Map();local.localIds.forEach(nodeId=>{const d=relDepth.get(nodeId)||0,a=levels.get(d)||[];a.push(byId.get(nodeId));levels.set(d,a)});levels.forEach(a=>a.sort((x,y)=>x.order-y.order));
    for(let sweep=0;sweep<8;sweep++){
      const forward=sweep%2===0,depths=[...levels.keys()].sort((a,b)=>forward?a-b:b-a),order=new Map();levels.forEach(a=>a.forEach((n,i)=>order.set(n.id,i)));
      depths.forEach(d=>{const adjacent=forward?incoming:outgoing,endpoint=forward?"source":"target";levels.get(d).sort((a,b)=>{const mean=n=>{const values=(adjacent.get(n.id)||[]).filter(e=>e.relation!=="collaboration"&&local.localIds.has(e[endpoint])).map(e=>order.get(e[endpoint])).filter(v=>v!==undefined);return values.length?values.reduce((sum,v)=>sum+v,0)/values.length:n.order};return mean(a)-mean(b)||a.order-b.order});levels.get(d).forEach((n,i)=>order.set(n.id,i))})
    }
    const localPos=new Map(),maxCount=Math.max(...[...levels.values()].map(a=>a.length),1),localWidth=Math.max(1000,maxCount*185+260),maxD=Math.max(...levels.keys()),minD=Math.min(...levels.keys()),localHeight=Math.max(900,(maxD-minD)*205+420),size=Math.max(baseLayout.size,Math.ceil(Math.max(localWidth,localHeight)+900)),cx=size/2,cy=size/2;
    levels.forEach((level,d)=>{const span=(level.length-1)*185;level.forEach((n,i)=>localPos.set(n.id,{x:cx+i*185-span/2,y:cy+d*205}))});
    const baseById=new Map(baseLayout.nodes.map(n=>[n.id,n]));const all=nodes.map(n=>{const p=localPos.get(n.id);if(p)return {...n,...p,relativeDepth:relDepth.get(n.id)||0};const b=baseById.get(n.id),dx=b.x-baseLayout.cx,dy=b.y-baseLayout.cy,len=Math.hypot(dx,dy)||1,push=Math.max(localWidth,localHeight)*.62;return {...n,x:cx+dx/len*push+dx*.18,y:cy+dy/len*push+dy*.18,relativeDepth:99}});
    return {nodes:all,size,cx,cy,localIds:local.localIds,ancestors:local.ancestors,descendants:local.descendants,radii:[]};
  }
  function renderTabs(){const ids=["vannevar-bush","c-l-liu","edward-j-mccluskey","donald-o-pederson","a-richard-newton","randal-e-bryant","leon-o-chua","sachin-s-sapatnekar","carver-mead"];els.tabs.innerHTML=`<button type="button" data-fit="true" class="${focusId?"":"active"}"><b>ALL</b>Unified DAG</button>`+ids.filter(id=>byId.has(id)).map((id,i)=>`<button type="button" data-focus="${id}" class="${id===focusId?"active":""}"><b>${String(i+1).padStart(2,"0")}</b>${esc(byId.get(id).name)}</button>`).join("")}
  function render(){
    const oldPos=new Map([...els.nodes.querySelectorAll(".scholar-card")].map(el=>[el.dataset.id,{left:el.style.left,top:el.style.top}]));layout=focusId?focusLayout(focusId):baseLayout;els.branchCount.textContent=focusId?layout.localIds.size:nodes.length;els.canvas.style.width=`${layout.size}px`;els.canvas.style.height=`${layout.size}px`;els.rings.setAttribute("viewBox",`0 0 ${layout.size} ${layout.size}`);els.edges.setAttribute("viewBox",`0 0 ${layout.size} ${layout.size}`);
    els.rings.innerHTML="";const pos=new Map(layout.nodes.map(n=>[n.id,n])),pathIds=ancestorIds(selectedId);
    const defs=`<defs><marker id="dag-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker></defs>`;
    els.edges.innerHTML=defs+edges.map(e=>{const p=pos.get(e.source),n=pos.get(e.target);if(!p||!n)return"";const local=!focusId||layout.localIds.has(p.id)&&layout.localIds.has(n.id),active=focusId&&local,midY=(p.y+n.y)/2,curve=Math.abs(n.y-p.y)<40?90:0,d=focusId?`M ${p.x} ${p.y} C ${p.x+curve} ${midY-curve}, ${n.x+curve} ${midY+curve}, ${n.x} ${n.y}`:`M ${p.x} ${p.y} L ${n.x} ${n.y}`;return `<path data-parent="${p.id}" data-child="${n.id}" class="${e.relation} ${active?"active":""} ${local?"":"dimmed"}" d="${d}"></path>`}).join("");
    els.nodes.innerHTML=layout.nodes.map(n=>cardHtml(n,pathIds)).join("");els.nodes.querySelectorAll(".scholar-card").forEach(el=>{const old=oldPos.get(el.dataset.id);if(old){el.style.left=old.left;el.style.top=old.top}});void els.nodes.offsetWidth;requestAnimationFrame(()=>els.nodes.querySelectorAll(".scholar-card").forEach(el=>{const n=pos.get(el.dataset.id);el.style.left=`${n.x}px`;el.style.top=`${n.y}px`}));els.canvas.style.transform=`scale(${scale})`;els.zoom.textContent=`${Math.round(scale*100)}%`;renderTabs();
  }
  function cardHtml(n,pathIds){const logoInstitution=institutionDomain(n.affiliation)?n.affiliation:n.degreeInstitution,logos=logoSources(logoInstitution),logo=logos[0],logoFallback=initials(logoInstitution||n.name),portraits=portraitSources(n),portrait=portraits[0],personFallback=initials(n.name),local=!focusId||layout.localIds.has(n.id),role=focusId?(n.id===focusId?"local-center":layout.ancestors.has(n.id)?"local-ancestor":layout.descendants.has(n.id)?"local-descendant":"dimmed"):"";return `<button type="button" class="scholar-card ${n.id==="vannevar-bush"?"root-card":""} ${n.id===selectedId?"selected":""} ${pathIds.has(n.id)?"in-path":""} ${local?"local-focus":"dimmed"} ${role}" data-id="${n.id}" style="left:${n.x}px;top:${n.y}px"><span class="portrait-wrap"><span class="person-avatar">${portrait?`<img src="${portrait}" alt="${esc(n.name)}" data-logo-fallbacks="${esc(portraits.slice(1).join("|"))}" onerror="window.edaLogoFallback(this)"><b hidden>${esc(personFallback)}</b>`:`<b>${esc(personFallback)}</b>`}</span><span class="institution-mark">${logo?`<img src="${logo}" alt="${esc(logoInstitution)} logo" data-logo-fallbacks="${esc(logos.slice(1).join("|"))}" onerror="window.edaLogoFallback(this)"><b hidden>${esc(logoFallback)}</b>`:`<b>${esc(logoFallback)}</b>`}</span></span><span class="card-copy"><strong>${esc(n.name)}</strong><small>${esc(n.affiliation||n.degreeInstitution)}</small></span></button>`}
  function ancestorIds(id){const set=new Set(),queue=[id];while(queue.length){const current=queue.shift();(incoming.get(current)||[]).filter(e=>e.relation!=="collaboration").forEach(e=>{if(!set.has(e.source)){set.add(e.source);queue.push(e.source)}})}return set}
  function selectNode(id,showPanel=true,center=true){const n=byId.get(id);if(!n)return;focusId=n.id;selectedId=n.id;if(scale<.42)scale=.5;renderWithoutRecentering();if(showPanel)openProfile(n);if(center)setTimeout(()=>centerNode(id,true),80)}
  function renderWithoutRecentering(){const oldX=els.stage.scrollLeft,oldY=els.stage.scrollTop;render();requestAnimationFrame(()=>{els.stage.scrollLeft=oldX;els.stage.scrollTop=oldY})}
  function openProfile(n){els.profileName.textContent=n.name;els.profileAffiliation.textContent=n.affiliation||"Academic lineage";const logoInstitution=institutionDomain(n.affiliation)?n.affiliation:n.degreeInstitution,sources=logoSources(logoInstitution),logo=sources[0],fallback=initials(logoInstitution||n.name),parents=(incoming.get(n.id)||[]).map(e=>`${byId.get(e.source).name} (${e.relation==="mphil"?"M.Phil.":e.relation==="postdoc"?"postdoc":e.relation==="collaboration"?"intellectual collaboration":"Ph.D."})`);els.profileLogo.innerHTML=logo?`<img src="${logo}" alt="${esc(logoInstitution)} institution mark" data-logo-fallbacks="${esc(sources.slice(1).join("|"))}" onerror="window.edaLogoFallback(this)"><b hidden>${esc(fallback)}</b>`:esc(fallback);els.profileDetails.innerHTML=`<div><dt>Academic path</dt><dd>${esc(n.details)}</dd></div><div><dt>Genealogy branches</dt><dd>${esc(n.sections.join(" · "))}</dd></div>${parents.length?`<div><dt>Incoming relationships</dt><dd>${esc(parents.join("; "))}</dd></div>`:""}`;els.profileLink.href=n.url;els.suggest.href=issueUrl(n);els.panel.classList.add("open")}
  function centerCanvas(smooth=true){if(!layout)return;const left=layout.cx*scale-els.stage.clientWidth/2,top=layout.cy*scale-els.stage.clientHeight/2;els.stage.scrollTo({left:Math.max(0,left),top:Math.max(0,top),behavior:smooth?"smooth":"auto"})}
  function centerNode(id,smooth=true){if(!layout)return;const n=layout.nodes.find(x=>x.id===id);if(!n)return;els.stage.scrollTo({left:Math.max(0,n.x*scale-els.stage.clientWidth/2),top:Math.max(0,n.y*scale-els.stage.clientHeight/2),behavior:smooth?"smooth":"auto"})}
  function fit(){if(!layout)return;scale=Math.max(.12,Math.min(.9,Math.min((els.stage.clientWidth-60)/layout.size,(els.stage.clientHeight-60)/layout.size)));els.canvas.style.transform=`scale(${scale})`;els.zoom.textContent=`${Math.round(scale*100)}%`;requestAnimationFrame(()=>centerCanvas(true))}
  function setZoom(next,anchor){const previous=scale,bounded=Math.max(.12,Math.min(1.2,next));if(Math.abs(bounded-previous)<.0001)return;if(anchor){const rect=els.stage.getBoundingClientRect(),pointerX=anchor.x-rect.left,pointerY=anchor.y-rect.top,worldX=(els.stage.scrollLeft+pointerX)/previous,worldY=(els.stage.scrollTop+pointerY)/previous;scale=bounded;els.canvas.style.transform=`scale(${scale})`;els.zoom.textContent=`${Math.round(scale*100)}%`;els.stage.scrollLeft=worldX*scale-pointerX;els.stage.scrollTop=worldY*scale-pointerY;return}scale=bounded;els.canvas.style.transform=`scale(${scale})`;els.zoom.textContent=`${Math.round(scale*100)}%`}
  function bind(){
    els.tabs.addEventListener("click",e=>{const allButton=e.target.closest("button[data-fit]");if(allButton){focusId="";selectedId="";render();requestAnimationFrame(()=>fit());return}const b=e.target.closest("button[data-focus]");if(b)selectNode(b.dataset.focus,true,true)});
    els.nodes.addEventListener("click",e=>{const b=e.target.closest("button[data-id]");if(b)selectNode(b.dataset.id,true,true)});q("#panel-close").onclick=()=>els.panel.classList.remove("open");q("#zoom-in").onclick=()=>setZoom(scale+.1);q("#zoom-out").onclick=()=>setZoom(scale-.1);q("#fit-view").onclick=fit;
    els.stage.addEventListener("wheel",e=>{e.preventDefault();const unit=e.deltaMode===1?.03:e.deltaMode===2?.3:.0015;setZoom(scale*Math.exp(-e.deltaY*unit),{x:e.clientX,y:e.clientY})},{passive:false});
    els.search.addEventListener("input",()=>{const term=els.search.value.trim().toLowerCase();if(!term){els.results.hidden=true;return}const hits=nodes.filter(n=>`${n.name} ${n.details} ${n.sections.join(" ")}`.toLowerCase().includes(term)).slice(0,12);els.results.innerHTML=hits.map(n=>`<button type="button" data-id="${n.id}"><strong>${esc(n.name)}</strong><small>${esc(n.affiliation)} · ${esc(n.sections[0])}</small></button>`).join("");els.results.hidden=!hits.length});
    els.results.addEventListener("click",e=>{const b=e.target.closest("button[data-id]");if(!b)return;els.search.value="";els.results.hidden=true;selectNode(b.dataset.id,true,true)});document.addEventListener("click",e=>{if(!e.target.closest(".search-wrap"))els.results.hidden=true});
    els.stage.addEventListener("pointerdown",e=>{if(e.target.closest("button"))return;drag={x:e.clientX,y:e.clientY,left:els.stage.scrollLeft,top:els.stage.scrollTop};els.stage.setPointerCapture(e.pointerId);els.stage.classList.add("dragging")});els.stage.addEventListener("pointermove",e=>{if(!drag)return;els.stage.scrollLeft=drag.left-(e.clientX-drag.x);els.stage.scrollTop=drag.top-(e.clientY-drag.y)});els.stage.addEventListener("pointerup",()=>{drag=null;els.stage.classList.remove("dragging")});
    window.addEventListener("resize",()=>centerCanvas(false));q("#general-contribution").href=issueUrl();q("#method-contribution").href=issueUrl();
  }
  async function init(){try{const [response,portraitResponse]=await Promise.all([fetch("./tree.txt",{cache:"no-store"}),fetch("./portraits/portraits.json",{cache:"no-store"})]);if(!response.ok)throw new Error(`HTTP ${response.status}`);if(portraitResponse.ok)localPortraits=await portraitResponse.json();const graph=parseMarkdown(await response.text());nodes=graph.nodes;edges=graph.edges;if(!nodes.length)throw new Error("No scholars parsed");rebuildIndexes();baseLayout=nebulaLayout();els.count.textContent=nodes.length;bind();render();requestAnimationFrame(()=>fit())}catch(error){els.nodes.innerHTML=`<p style="padding:40px;color:#9d3f2a">The genealogy data could not be loaded. ${esc(error.message)}</p>`;console.error(error)}}
  init();
})();
