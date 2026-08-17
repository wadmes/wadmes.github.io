(function(){
  "use strict";

  const REPO="https://github.com/wadmes/wadmes.github.io";
  const CARD_W=194,CARD_H=68,TAU=Math.PI*2;
  const domains={
    "NUS":"nus.edu.sg","National University of Singapore":"nus.edu.sg","CUHK":"cuhk.edu.hk","CUHK-Shenzhen":"cuhk.edu.cn","Carnegie Mellon":"cmu.edu","CMU":"cmu.edu","Berkeley":"berkeley.edu","UC Berkeley":"berkeley.edu","UCLA":"ucla.edu","UT Austin":"utexas.edu","UIUC":"illinois.edu","Illinois":"illinois.edu","Stanford":"stanford.edu","MIT":"mit.edu","Princeton":"princeton.edu","Michigan":"umich.edu","Purdue":"purdue.edu","Georgia Tech":"gatech.edu","Cornell":"cornell.edu","EPFL":"epfl.ch","ETH Zürich":"ethz.ch","USC":"usc.edu","UC San Diego":"ucsd.edu","UC Santa Barbara":"ucsb.edu","UCSB":"ucsb.edu","Duke":"duke.edu","Duke Kunshan":"dukekunshan.edu.cn","Arizona State":"asu.edu","Peking University":"pku.edu.cn","Tsinghua":"tsinghua.edu.cn","HKUST":"ust.hk","HKUST(GZ)":"hkust-gz.edu.cn","ShanghaiTech":"shanghaitech.edu.cn","Zhejiang University":"zju.edu.cn","Fudan":"fudan.edu.cn","Notre Dame":"nd.edu","Pittsburgh":"pitt.edu","Binghamton":"binghamton.edu","Wisconsin":"wisc.edu","NTU":"ntu.edu.tw","NTU Singapore":"ntu.edu.sg","NTHU":"nthu.edu.tw","NCTU":"nycu.edu.tw","NCKU":"ncku.edu.tw","NTUST":"ntust.edu.tw","Northwestern":"northwestern.edu","Illinois Tech":"iit.edu","Iowa State":"iastate.edu","Minnesota":"umn.edu","Texas A&M":"tamu.edu","Brown":"brown.edu","Virginia":"virginia.edu","Virginia Tech":"vt.edu","Columbia":"columbia.edu","Boston University":"bu.edu","Waterloo":"uwaterloo.ca","Syracuse":"syracuse.edu","Northeastern":"northeastern.edu","UC Irvine":"uci.edu","UCF":"ucf.edu","San Francisco State":"sfsu.edu","Rice":"rice.edu","Auckland":"auckland.ac.nz","Hunan University":"hnu.edu.cn","Hong Kong Baptist University":"hkbu.edu.hk","Yonsei":"yonsei.ac.kr","Sungkyunkwan":"skku.edu","UFMG":"ufmg.br","Seoul National University":"snu.ac.kr","Kyungpook National University":"knu.ac.kr","POSTECH":"postech.ac.kr","IIT Kanpur":"iitk.ac.in","NJIT":"njit.edu","UTEP":"utep.edu","Georgia Tech":"gatech.edu","UT Dallas":"utdallas.edu","Yale":"yale.edu","Penn State":"psu.edu","Shanghai Jiao Tong":"sjtu.edu.cn","Chongqing University":"cqu.edu.cn","Simon Fraser":"sfu.ca","Hong Kong Polytechnic":"polyu.edu.hk","Kwangwoon University":"kw.ac.kr","Chungbuk National University":"chungbuk.ac.kr","Nebraska":"unl.edu","SUSTech":"sustech.edu.cn","UBC":"ubc.ca","UC Davis":"ucdavis.edu","UC Santa Cruz":"ucsc.edu","UIC":"uic.edu","UNICAMP":"unicamp.br","Utah":"utah.edu","Stevens":"stevens.edu","Vermont":"uvm.edu","Buffalo":"buffalo.edu","Synopsys":"synopsys.com","Easy-Logic":"easy-logic.com"};
  const localLogos={"zju.edu.cn":"./logos/zhejiang.png","pku.edu.cn":"./logos/peking.png","tsinghua.edu.cn":"./logos/tsinghua.png"};
  const els={tabs:q("#branch-tabs"),nodes:q("#tree-nodes"),edges:q("#tree-edges"),rings:q("#orbit-rings"),canvas:q("#radial-canvas"),stage:q("#radial-stage"),count:q("#scholar-count"),branchCount:q("#branch-count"),search:q("#scholar-search"),results:q("#search-results"),zoom:q("#zoom-level"),panel:q("#profile-panel"),profileName:q("#profile-name"),profileAffiliation:q("#profile-affiliation"),profileDetails:q("#profile-details"),profileLogo:q("#profile-logo"),profileLink:q("#profile-link"),suggest:q("#suggest-link")};
  let nodes=[],byId=new Map(),children=new Map(),roots=[],rootId="",selectedId="",scale=.62,layout=null,drag=null;

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
  window.edaLogoFallback=img=>{const sources=(img.dataset.logoFallbacks||"").split("|").filter(Boolean),attempt=Number(img.dataset.logoAttempt||0);if(attempt<sources.length){img.dataset.logoAttempt=String(attempt+1);img.src=sources[attempt];return}img.className="failed";const fallback=img.nextElementSibling;if(fallback)fallback.hidden=false;else img.remove()};
  function issueUrl(node){
    const title=node?`EDA Family Tree update: ${node.name}`:"EDA Family Tree: proposed update";
    const body=node?`Scholar: ${node.name}\nCurrent entry: ${node.details}\n\nProposed change:\n\nEvidence URL (required):\n\nRelationship / degree details:\n\nYour name and affiliation:\n`:`Proposal type (new scholar / correction / affiliation):\n\nScholar name:\n\nAdvisor name:\n\nDegree institution and year:\n\nCurrent academic affiliation:\n\nEvidence URL (required):\n\nYour name and affiliation:\n`;
    return `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=${encodeURIComponent("EDA genealogy")}`;
  }
  function parseMarkdown(text){
    const out=[],stack=[];let section="Selected EDA lineages";
    for(const line of text.split(/\r?\n/)){
      const h=line.match(/^##+\s+(.+)/);if(h){section=h[1].trim();continue}
      const m=line.match(/^(\s*)\+ \[([^\]]+)\]\((https?:\/\/[^)]+)\)\s*\((.+)\)\s*$/);if(!m)continue;
      const depth=Math.floor(m[1].replace(/\t/g,"  ").length/2),name=m[2].trim(),details=m[4].trim();
      const parent=depth>0?stack[depth-1]:null;
      const year=(details.match(/[’'](\d{2})/)||[])[1];
      const path=details.split(/\s*→\s*/).map(x=>x.trim());
      let affiliation=(path[path.length-1]||"").replace(/;.*$/,"").trim();
      const degree=(details.match(/^([^()]+?)\s+(?:Ph\.D\.|Sc\.D\.|M\.Phil\.)/)||[])[1]||path[0]||"";
      let relation=/M\.Phil\./i.test(details)?"mphil":/postdoc/i.test(details)?"postdoc":"phd";
      const id=`${slug(name)}-${out.filter(n=>slug(n.name)===slug(name)).length+1}`;
      const node={id,name,url:m[3],details,degreeInstitution:degree.trim(),year:year?(/^[0-2]/.test(year)?`20${year}`:`19${year}`):"",affiliation,section,parentId:parent?parent.id:null,relation,depth};
      out.push(node);stack[depth]=node;stack.length=depth+1;
    }
    return out;
  }
  function rebuildIndexes(){byId=new Map(nodes.map(n=>[n.id,n]));children=new Map();for(const n of nodes){if(!n.parentId)continue;const a=children.get(n.parentId)||[];a.push(n);children.set(n.parentId,a)}roots=nodes.filter(n=>!n.parentId)}
  function rootOf(node){let n=node;while(n&&n.parentId)n=byId.get(n.parentId);return n}
  function descendants(id){const out=[];(function walk(x){const n=byId.get(x);if(!n)return;out.push(n);(children.get(x)||[]).forEach(c=>walk(c.id))})(id);return out}
  function spreadAngles(members,targets,radius){
    if(members.length<2)return;
    const ordered=[...members].sort((a,b)=>(targets.get(a.id)||0)-(targets.get(b.id)||0));
    const separation=2*Math.asin(Math.min(.98,(CARD_W+18)/(2*radius)));
    const blocks=[];
    ordered.forEach((node,i)=>{
      const value=(targets.get(node.id)||0)-i*separation;
      blocks.push({start:i,end:i,sum:value,count:1,mean:value});
      while(blocks.length>1&&blocks[blocks.length-2].mean>blocks[blocks.length-1].mean){
        const right=blocks.pop(),left=blocks.pop(),sum=left.sum+right.sum,count=left.count+right.count;
        blocks.push({start:left.start,end:right.end,sum,count,mean:sum/count});
      }
    });
    const adjusted=[];blocks.forEach(block=>{for(let i=block.start;i<=block.end;i++)adjusted[i]=block.mean+i*separation});
    const drift=ordered.reduce((sum,node,i)=>sum+(targets.get(node.id)||0)-adjusted[i],0)/ordered.length;
    ordered.forEach((node,i)=>targets.set(node.id,adjusted[i]+drift));
  }
  function radialLayout(branch){
    const branchSet=new Set(branch.map(n=>n.id)),ranges=new Map();let leafCursor=0;
    function assignRange(id){const kids=(children.get(id)||[]).filter(n=>branchSet.has(n.id));let range;if(!kids.length){range={start:leafCursor,end:leafCursor};leafCursor++}else{const rootGap=id===rootId&&kids.length>1?12:0;if(rootGap)leafCursor+=rootGap/2;const childRanges=[];kids.forEach((kid,i)=>{childRanges.push(assignRange(kid.id));if(rootGap&&i<kids.length-1)leafCursor+=5});if(rootGap)leafCursor+=rootGap/2;range={start:childRanges[0].start,end:childRanges[childRanges.length-1].end}}ranges.set(id,range);return range}
    assignRange(rootId);const leafCount=Math.max(leafCursor,1),slot=TAU/leafCount,offset=-Math.PI/2;
    const angles=new Map();branch.forEach(n=>{const range=ranges.get(n.id);angles.set(n.id,n.id===rootId?offset:offset+((range.start+range.end+1)/2)*slot)});
    branch.forEach(parent=>{const kids=(children.get(parent.id)||[]).filter(n=>branchSet.has(n.id));if(kids.length<2||kids.some(k=>(children.get(k.id)||[]).some(n=>branchSet.has(n.id))))return;const center=angles.get(parent.id)||0;kids.forEach((kid,i)=>{const step=i===0?0:(i%2?Math.ceil(i/2):-Math.ceil(i/2));angles.set(kid.id,center+step*slot)})});
    const levels=new Map();branch.forEach(n=>{const d=relativeDepth(n);const a=levels.get(d)||[];a.push(n);levels.set(d,a)});
    const radii=new Map([[0,0]]);let prev=0;[...levels.keys()].sort((a,b)=>a-b).forEach(d=>{if(!d)return;const count=levels.get(d).length;prev=Math.max(prev+280,count*(CARD_W+22)/TAU,280);radii.set(d,prev);spreadAngles(levels.get(d),angles,prev)});
    const maxR=Math.max(...radii.values(),0),size=Math.ceil(maxR*2+520),cx=size/2,cy=size/2;const positioned=[];
    branch.forEach(n=>{const d=relativeDepth(n),a=angles.get(n.id)||0,r=radii.get(d)||0;positioned.push({...n,x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r,angle:a,ring:r,relativeDepth:d})});
    return {nodes:positioned,size,cx,cy,radii:[...radii.entries()].filter(([d])=>d>0).map(([,r])=>r)};
  }
  function relativeDepth(node){const root=byId.get(rootId);return Math.max(0,node.depth-(root?root.depth:0))}
  function renderTabs(){els.tabs.innerHTML=roots.map((n,i)=>`<button type="button" role="tab" data-root="${n.id}" class="${n.id===rootId?"active":""}"><b>${String(i+1).padStart(2,"0")}</b>${esc(n.name)}</button>`).join("")}
  function render(){
    const branch=descendants(rootId);layout=radialLayout(branch);els.branchCount.textContent=branch.length;els.canvas.style.width=`${layout.size}px`;els.canvas.style.height=`${layout.size}px`;els.rings.setAttribute("viewBox",`0 0 ${layout.size} ${layout.size}`);els.edges.setAttribute("viewBox",`0 0 ${layout.size} ${layout.size}`);
    els.rings.innerHTML=layout.radii.map(r=>`<circle cx="${layout.cx}" cy="${layout.cy}" r="${r}"></circle>`).join("");const pos=new Map(layout.nodes.map(n=>[n.id,n]));const pathIds=ancestorIds(selectedId);
    els.edges.innerHTML=layout.nodes.filter(n=>n.parentId&&pos.has(n.parentId)).map(n=>{const p=pos.get(n.parentId),active=n.id===selectedId||pathIds.has(n.id)||pathIds.has(p.id),span=n.ring-p.ring,parentAngle=p.ring===0?n.angle:p.angle,c1r=p.ring+span*.48,c2r=n.ring-span*.35,c1x=layout.cx+Math.cos(parentAngle)*c1r,c1y=layout.cy+Math.sin(parentAngle)*c1r,c2x=layout.cx+Math.cos(n.angle)*c2r,c2y=layout.cy+Math.sin(n.angle)*c2r;return `<path data-parent="${p.id}" data-child="${n.id}" class="${n.relation} ${active?"active":""}" d="M ${p.x} ${p.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${n.x} ${n.y}"></path>`}).join("");
    els.nodes.innerHTML=layout.nodes.map(n=>cardHtml(n,pathIds)).join("");els.canvas.style.transform=`scale(${scale})`;els.zoom.textContent=`${Math.round(scale*100)}%`;renderTabs();requestAnimationFrame(()=>centerCanvas(false));
  }
  function cardHtml(n,pathIds){const logoInstitution=institutionDomain(n.affiliation)?n.affiliation:n.degreeInstitution,sources=logoSources(logoInstitution),logo=sources[0],fallback=initials(logoInstitution||n.name);return `<button type="button" class="scholar-card ${n.id===rootId?"root-card":""} ${n.id===selectedId?"selected":""} ${pathIds.has(n.id)?"in-path":""}" data-id="${n.id}" style="left:${n.x}px;top:${n.y}px"><span class="institution-mark">${logo?`<img src="${logo}" alt="" data-logo-fallbacks="${esc(sources.slice(1).join("|"))}" onerror="window.edaLogoFallback(this)"><b hidden>${esc(fallback)}</b>`:`<b>${esc(fallback)}</b>`}</span><span class="card-copy"><strong>${esc(n.name)}</strong><small>${esc(n.affiliation||n.degreeInstitution)}</small></span></button>`}
  function ancestorIds(id){const set=new Set();let n=byId.get(id);while(n&&n.parentId){set.add(n.parentId);n=byId.get(n.parentId)}return set}
  function selectNode(id,showPanel=true){const n=byId.get(id);if(!n)return;const root=rootOf(n);if(root&&root.id!==rootId){rootId=root.id;selectedId=n.id;render()}else{selectedId=n.id;renderWithoutRecentering()}if(showPanel)openProfile(n)}
  function renderWithoutRecentering(){const oldX=els.stage.scrollLeft,oldY=els.stage.scrollTop;render();requestAnimationFrame(()=>{els.stage.scrollLeft=oldX;els.stage.scrollTop=oldY})}
  function openProfile(n){els.profileName.textContent=n.name;els.profileAffiliation.textContent=n.affiliation||"Academic lineage";const logoInstitution=institutionDomain(n.affiliation)?n.affiliation:n.degreeInstitution,sources=logoSources(logoInstitution),logo=sources[0],fallback=initials(logoInstitution||n.name);els.profileLogo.innerHTML=logo?`<img src="${logo}" alt="${esc(logoInstitution)} institution mark" data-logo-fallbacks="${esc(sources.slice(1).join("|"))}" onerror="window.edaLogoFallback(this)"><b hidden>${esc(fallback)}</b>`:esc(fallback);els.profileDetails.innerHTML=`<div><dt>Academic path</dt><dd>${esc(n.details)}</dd></div><div><dt>Genealogy branch</dt><dd>${esc(n.section)}</dd></div>${n.parentId?`<div><dt>Relationship</dt><dd>${n.relation==="mphil"?"M.Phil.":n.relation==="postdoc"?"Postdoctoral mentorship":"Ph.D."}</dd></div>`:""}`;els.profileLink.href=n.url;els.suggest.href=issueUrl(n);els.panel.classList.add("open")}
  function centerCanvas(smooth=true){if(!layout)return;const left=layout.cx*scale-els.stage.clientWidth/2,top=layout.cy*scale-els.stage.clientHeight/2;els.stage.scrollTo({left:Math.max(0,left),top:Math.max(0,top),behavior:smooth?"smooth":"auto"})}
  function fit(){if(!layout)return;scale=Math.max(.38,Math.min(.9,(Math.min(els.stage.clientWidth,els.stage.clientHeight)-70)/layout.size));renderWithoutRecentering();requestAnimationFrame(()=>centerCanvas(true))}
  function setZoom(next,anchor){const previous=scale,bounded=Math.max(.38,Math.min(1.2,next));if(Math.abs(bounded-previous)<.0001)return;if(anchor){const rect=els.stage.getBoundingClientRect(),pointerX=anchor.x-rect.left,pointerY=anchor.y-rect.top,worldX=(els.stage.scrollLeft+pointerX)/previous,worldY=(els.stage.scrollTop+pointerY)/previous;scale=bounded;els.canvas.style.transform=`scale(${scale})`;els.zoom.textContent=`${Math.round(scale*100)}%`;els.stage.scrollLeft=worldX*scale-pointerX;els.stage.scrollTop=worldY*scale-pointerY;return}scale=bounded;els.canvas.style.transform=`scale(${scale})`;els.zoom.textContent=`${Math.round(scale*100)}%`}
  function bind(){
    els.tabs.addEventListener("click",e=>{const b=e.target.closest("button[data-root]");if(!b)return;rootId=b.dataset.root;selectedId=rootId;render();openProfile(byId.get(rootId))});
    els.nodes.addEventListener("click",e=>{const b=e.target.closest("button[data-id]");if(b)selectNode(b.dataset.id)});q("#panel-close").onclick=()=>els.panel.classList.remove("open");q("#zoom-in").onclick=()=>setZoom(scale+.1);q("#zoom-out").onclick=()=>setZoom(scale-.1);q("#fit-view").onclick=fit;
    els.stage.addEventListener("wheel",e=>{e.preventDefault();const unit=e.deltaMode===1?.03:e.deltaMode===2?.3:.0015;setZoom(scale*Math.exp(-e.deltaY*unit),{x:e.clientX,y:e.clientY})},{passive:false});
    els.search.addEventListener("input",()=>{const term=els.search.value.trim().toLowerCase();if(!term){els.results.hidden=true;return}const hits=nodes.filter(n=>`${n.name} ${n.details} ${n.section}`.toLowerCase().includes(term)).slice(0,12);els.results.innerHTML=hits.map(n=>`<button type="button" data-id="${n.id}"><strong>${esc(n.name)}</strong><small>${esc(n.affiliation)} · ${esc(n.section)}</small></button>`).join("");els.results.hidden=!hits.length});
    els.results.addEventListener("click",e=>{const b=e.target.closest("button[data-id]");if(!b)return;els.search.value="";els.results.hidden=true;selectNode(b.dataset.id)});document.addEventListener("click",e=>{if(!e.target.closest(".search-wrap"))els.results.hidden=true});
    els.stage.addEventListener("pointerdown",e=>{if(e.target.closest("button"))return;drag={x:e.clientX,y:e.clientY,left:els.stage.scrollLeft,top:els.stage.scrollTop};els.stage.setPointerCapture(e.pointerId);els.stage.classList.add("dragging")});els.stage.addEventListener("pointermove",e=>{if(!drag)return;els.stage.scrollLeft=drag.left-(e.clientX-drag.x);els.stage.scrollTop=drag.top-(e.clientY-drag.y)});els.stage.addEventListener("pointerup",()=>{drag=null;els.stage.classList.remove("dragging")});
    window.addEventListener("resize",()=>centerCanvas(false));q("#general-contribution").href=issueUrl();q("#method-contribution").href=issueUrl();
  }
  async function init(){try{const response=await fetch("./tree.txt",{cache:"no-store"});if(!response.ok)throw new Error(`HTTP ${response.status}`);nodes=parseMarkdown(await response.text());if(!nodes.length)throw new Error("No scholars parsed");rebuildIndexes();rootId=roots[0].id;selectedId=rootId;scale=window.innerWidth<600?.52:window.innerWidth<1000?.56:.62;els.count.textContent=nodes.length;bind();render()}catch(error){els.nodes.innerHTML=`<p style="padding:40px;color:#9d3f2a">The genealogy data could not be loaded. ${esc(error.message)}</p>`;console.error(error)}}
  init();
})();
