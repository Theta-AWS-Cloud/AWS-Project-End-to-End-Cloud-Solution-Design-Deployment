(()=>{const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const page=document.body.dataset.page;
const pages=[["index","Home"],["plant","Plant"],["store","Store"],["sell","Sell"],["crops","Crops"],["services","Services"],["about","About"]];
$("header").innerHTML=`<div class="wrap nav"><a class="logo" href="index.html"><i>🌱</i>HarvestHub</a><button class="menu" aria-label="Menu">☰</button><nav>${pages.map(([p,t])=>`<a href="${p}.html" class="${p===page?"on":""}">${t}</a>`).join("")}</nav></div>`;
$("footer").innerHTML=`<div class="wrap"><div><b>🌱 HarvestHub</b><p>Plant at the right time.<br>Store without losing.<br>Sell at a fair price.</p></div><div><b>Explore</b>${pages.map(([p,t])=>`<br><a href="${p}.html">${t}</a>`).join("")}</div><div><b>Contact</b><p>📞 Toll-free 0800 900 123<br>💬 WhatsApp 024 700 4455<br>✉️ hello@harvesthub.com.gh<br>📍 14 Ring Road East, Osu, Accra</p></div><div><b>Prices</b><p>All prices in Ghana cedis (GH₵).<br>Updated every morning at 6:00 AM.</p></div></div><div class="wrap copy">© 2026 HarvestHub Ghana · Platform built &amp; run on AWS by ThetaCloud · Demo project · Crop photos: Wikipedia &amp; Wikimedia Commons contributors</div>`;
$(".menu").onclick=()=>$("nav").classList.toggle("open");
const get=f=>window.HH&&HH[f.replace(".json","")]?Promise.resolve(HH[f.replace(".json","")]):fetch("data/"+f).then(r=>r.json()).catch(()=>null);
const fail=e=>e.innerHTML='<div class="alert">Could not load data. Serve the site over HTTP (e.g. <code>python3 -m http.server</code> inside app/).</div>';
const cedi=v=>"GH₵ "+v.toLocaleString("en-GH",{minimumFractionDigits:2,maximumFractionDigits:2});
const spark=t=>{const a=Math.min(...t),b=Math.max(...t);return`<svg class="spark" viewBox="0 0 100 40" preserveAspectRatio="none"><polyline points="${t.map((v,i)=>`${i*100/(t.length-1)},${36-(v-a)/(b-a||1)*32}`).join(" ")}"/></svg>`};
const chg=t=>{const c=(t.at(-1)-t.at(-2))/t.at(-2)*100;return`<span class="chg ${c>=0?"up":"dn"}">${c>=0?"▲":"▼"} ${Math.abs(c).toFixed(1)}%</span>`};
const avg=o=>Object.values(o).reduce((a,b)=>a+b,0)/Object.keys(o).length;
const CR=(window.HH&&HH.crops)||[],cf=n=>CR.find(c=>c.name===n);
const av=(n,c="")=>{const k=cf(n);return k?`<span class="cimg av ${c}" data-id="${k.id}" data-wiki="${k.wiki}"><span>${k.icon}</span></span>`:""};
const tryImg=(u,el)=>{const x=u.shift();if(!x)return;const i=new Image();i.onload=()=>{el.style.backgroundImage=`url("${x}")`;el.classList.add("ph")};i.onerror=()=>tryImg(u,el);i.src=x};
const hydrate=()=>$$("[data-wiki]:not([data-done])").forEach(async el=>{el.dataset.done=1;const t=el.dataset.wiki;let u=null;try{u=sessionStorage.getItem("w:"+t);if(!u){const j=await(await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/"+t)).json();u=j.thumbnail&&j.thumbnail.source;u&&sessionStorage.setItem("w:"+t,u)}}catch(e){}
tryImg([`assets/images/crops/${el.dataset.id}.jpg`,u&&u.replace(/\/\d+px-/,"/500px-"),u].filter(Boolean),el)});
const M="JFMAMJJASOND",tag=a=>a.map(c=>`<span class="tag">${c}</span>`).join("");
(async()=>{
if(page==="index"){const d=await get("prices.json"),e=$("#prices");if(!d)return fail(e);
e.innerHTML=d.crops.slice(0,5).map(c=>`<div class="card rv pc">${av(c.name,"banner")}<div class="crop"><span>${c.name}</span>${chg(c.trend)}</div><div class="big">${cedi(avg(c.markets))} <small>/kg</small></div>${spark(c.trend)}</div>`).join("");
$("#upd").textContent=d.updated+" · average across 6 markets · "+d.currency;
const t=d.crops.map(c=>`<span>${c.icon} ${c.name} <b>${cedi(avg(c.markets))}/kg</b> ${chg(c.trend)}</span>`).join("");$("#ticker").innerHTML=`<div>${t}${t}</div>`}
if($("#strip")){const t=CR.map(c=>`<a href="crops.html" class="tile"><span class="cimg" data-id="${c.id}" data-wiki="${c.wiki}"><span>${c.icon}</span></span><b>${c.name}</b></a>`).join("");$("#strip").innerHTML=`<div>${t}${t}</div>`}
if(page==="crops"){const d=await get("prices.json"),P={};(d?d.crops:[]).forEach(c=>P[c.name]=avg(c.markets));
const cats=["All",...new Set(CR.map(c=>c.cat))];let cur="All",q="";
const draw=()=>{$("#tabs").innerHTML=cats.map(x=>`<button class="tab ${x===cur?"on":""}">${x}</button>`).join("");$$(".tab").forEach(b=>b.onclick=()=>{cur=b.textContent;draw()});
const L=CR.filter(c=>(cur==="All"||c.cat===cur)&&(c.name+c.twi+c.where).toLowerCase().includes(q));
$("#cgrid").innerHTML=L.length?L.map(c=>`<article class="card crp"><div class="cimg lg" data-id="${c.id}" data-wiki="${c.wiki}"><span>${c.icon}</span></div><div class="cb"><span class="tag">${c.cat}</span>${P[c.name]?`<span class="pp">${cedi(P[c.name])}/kg</span>`:""}<h3>${c.name}</h3>${c.twi?`<p class="tw">Twi: <b>${c.twi}</b></p>`:""}<p>📍 ${c.where}</p><p>🗓️ Harvest: ${c.harvest}</p><p class="mute">${c.fact}</p>${P[c.name]?'<a class="btn sm" href="sell.html">See prices →</a>':""}</div></article>`).join(""):'<p class="lead">No crops match your search.</p>'};
$("#q").oninput=e=>{q=e.target.value.toLowerCase();draw()};draw();$("#cnt").textContent=CR.length}
if(page==="sell"){const d=await get("prices.json"),e=$("#sell");if(!d)return fail(e);
const ms=Object.keys(d.crops[0].markets);$("#mk").innerHTML='<option value="all">Average of all markets</option>'+ms.map(m=>`<option>${m}</option>`).join("");
const draw=()=>{const m=$("#mk").value;e.innerHTML=d.crops.map(c=>{const v=m==="all"?avg(c.markets):c.markets[m],b=Object.entries(c.markets).sort((a,b)=>b[1]-a[1])[0];
return`<tr><td class="cn">${av(c.name)}<b>${c.name}</b></td><td class="p">${cedi(v)}</td><td>${cedi(v*c.kg)}<br><small>${c.pack}</small></td><td>${chg(c.trend)}</td><td>${spark(c.trend)}</td><td>${b[0]}<br><span class="best">${cedi(b[1])}</span></td></tr>`}).join("")};
$("#mk").onchange=draw;draw();$("#upd").textContent=d.updated+" · "+d.currency;
$("#mkts").innerHTML=ms.map(m=>`<div class="card rv"><h3>${m}</h3>${d.crops.map(c=>`<div class="crop"><span>${c.icon} ${c.name}</span><span>${cedi(c.markets[m])}</span></div>`).join("")}</div>`).join("");
$("#buyers").innerHTML=d.buyers.map(b=>`<div class="card rv"><h3>${b.co}</h3><p style="color:var(--mute)">${b.name} · ${b.base}</p><p>${tag(b.buys)}</p><p>Buys <b>${b.vol}</b></p><a class="btn sm" href="tel:${b.tel.replace(/ /g,"")}">📞 ${b.tel}</a></div>`).join("")}
if(page==="plant"){const d=await get("calendar.json"),e=$("#cal");if(!d)return fail(e);
const rs=Object.keys(d.regions);let cur=rs[0];
const draw=()=>{const r=d.regions[cur];$("#tabs").innerHTML=rs.map(x=>`<button class="tab ${x===cur?"on":""}">${x}</button>`).join("");
$$(".tab").forEach(b=>b.onclick=()=>{cur=b.textContent;draw()});
e.innerHTML=`<p class="lead" style="margin:0 0 14px">🌧️ ${r.note}</p>`+Object.entries(r.crops).map(([c,v])=>`<div class="row"><b class="cn">${av(c)}${c}</b><div class="months">${[...M].map((l,i)=>`<i class="${v.m.includes(i+1)?"m":v.n.includes(i+1)?"n":""}">${l}</i>`).join("")}</div></div>`).join("")};draw();
$("#guide").innerHTML=d.guide.map(g=>`<tr><td class="cn">${av(g.crop)}<b>${g.crop}</b></td><td>${g.days}</td><td>${g.spacing}</td><td>${g.seed}</td><td>${g.yield}</td><td>${g.soil}</td></tr>`).join("");
$("#late").innerHTML=d.late.map(x=>`<li>${x}</li>`).join("")}
if(page==="store"){const d=await get("storage.json"),e=$("#fac");if(!d)return fail(e);
const rs=["All",...new Set(d.facilities.map(f=>f.region))];let cur="All";
const draw=()=>{$("#tabs").innerHTML=rs.map(x=>`<button class="tab ${x===cur?"on":""}">${x}</button>`).join("");
$$(".tab").forEach(b=>b.onclick=()=>{cur=b.textContent;draw()});
e.innerHTML=d.facilities.filter(f=>cur==="All"||f.region===cur).map(f=>`<div class="card rv in"><span class="tag">${{"Cold room":"❄️","Warehouse":"🏭","Drying":"☀️"}[f.type]} ${f.type}</span><h3 style="margin:10px 0 4px">${f.name}</h3><p style="color:var(--mute)">📍 ${f.address} · ${f.region}</p><p>${tag(f.crops)}</p><p>Capacity: <b>${f.capacity}</b><br>Fee: <b>${f.fee}</b><br>Hours: ${f.hours}</p><a class="btn sm" href="tel:${f.tel.replace(/ /g,"")}">📞 ${f.tel}</a></div>`).join("")};draw();
const dur=n=>n<14?n+(n===1?" day":" days"):n<60?Math.round(n/7)+" weeks":Math.round(n/30)+" months",wd=n=>Math.max(5,Math.log(n+1)/Math.log(366)*100),T=d.tips,ic={"Cold room":"❄️","Warehouse":"🏭","Drying":"☀️"};let sel=Object.keys(T)[0];
$("#life").innerHTML='<div class="key"><span><i style="background:var(--clay)"></i>Without proper storage</span><span><i style="background:var(--leaf)"></i>With good storage</span></div>'+Object.entries(T).map(([c,t])=>`<button class="lrow" data-c="${c}"><span class="cn">${av(c)}<b>${c}</b></span><span class="bars"><span class="bar r" style="width:${wd(t.raw)}%"><em>${dur(t.raw)}</em></span><span class="bar k" style="width:${wd(t.kept)}%"><em>${dur(t.kept)}</em></span></span></button>`).join("")+'<p class="small">Bars use a log scale so short and long shelf lives fit one chart. Tap a crop for its storage guide.</p>';
const show=()=>{const t=T[sel],fs=d.facilities.filter(f=>f.crops.includes(sel));
$("#chips").innerHTML=Object.keys(T).map(c=>`<button class="chip ${c===sel?"on":""}" data-c="${c}">${av(c)}${c}</button>`).join("");
$("#tipd").innerHTML=`<div class="tl1">${av(sel,"tipimg")}<div class="cond"><h3>${sel}</h3><div class="stat"><small>Keeps for up to</small><b>${dur(t.kept)}</b></div><div class="stat"><small>Ideal conditions</small><b>${t.cond}</b></div><div class="stat"><small>Best container</small><b>${t.box}</b></div></div></div><div class="tl2"><h4>Do this</h4><ol class="stp">${t.steps.map(s=>`<li>${s}</li>`).join("")}</ol><div class="warn">⚠️ <b>Avoid:</b> ${t.avoid}</div><div class="warn sign">🔎 <b>Spoilage signs:</b> ${t.signs}</div><h4>Store it here</h4><div>${fs.map(f=>`<a class="fchip" href="#fac">${ic[f.type]} ${f.name}</a>`).join("")}</div></div>`};
$("#life").onclick=$("#chips").onclick=e=>{const b=e.target.closest("[data-c]");if(b){sel=b.dataset.c;show();$("#tipd").scrollIntoView({behavior:"smooth",block:"nearest"})}};show()}
hydrate();new MutationObserver(hydrate).observe(document.body,{childList:true,subtree:true});
const io=new IntersectionObserver(es=>es.forEach(x=>x.isIntersecting&&(x.target.classList.add("in"),io.unobserve(x.target))),{threshold:.1});
$$(".rv").forEach(x=>io.observe(x));
$$("[data-n]").forEach(x=>{const n=+x.dataset.n,s=x.dataset.s||"";let t=0;const k=setInterval(()=>{t+=n/40;x.textContent=(t>=n?n:Math.round(t*10)/10).toLocaleString()+s;t>=n&&clearInterval(k)},30)})
})()})();
