document.addEventListener("DOMContentLoaded", () => {

  // ===================== GAME STATE =====================
  const state = {
    count: 0,
    clickValue: 1,
    idleValue: 0,
    prestigeMultiplier: 1,
    stars: 0,
    autoPrestigeUnlocked: false,
    autoPrestigeEnabled: false
  };

  // ===================== UPGRADES =====================
  const upgrades = [
    {id:"click05", name:"+0.5 / click", baseCost:20, value:0.5, type:"click", scale:1.5, desc:"Practice makes perfect.", owned:0},
    {id:"click1", name:"+1 / click", baseCost:150, value:1, type:"click", scale:1.5, desc:"Heavier fingertips.", owned:0},
    {id:"cps1", name:"+1 / sec", baseCost:100, value:1, type:"idle", scale:1.5, desc:"Little helpers.", owned:0},
    {id:"cps5", name:"+5 / sec", baseCost:500, value:5, type:"idle", scale:1.5, desc:"Bigger crew.", owned:0},
    {id:"burst", name:"Burst x2", baseCost:1000, value:2, type:"burst", scale:2, desc:"Permanently doubles click value.", owned:0}
  ];

  const starShop = [
    {id:"guidingLight", name:"Guiding Light", cost:2, desc:"Start with +Idle/sec × Prestige multiplier.", owned:0},
    {id:"celestialClicks", name:"Celestial Clicks", cost:5, desc:"Permanently double click value.", owned:0},
    {id:"ascendantCycle", name:"Ascendant Cycle", cost:10, desc:"Unlock auto prestige toggle.", owned:0},
    {id:"efficientUniverse", name:"Efficient Universe", cost:15, desc:"5% cheaper upgrades.", owned:0}
  ];

  const achievements = [
    {id:"first", name:"First Click", condition:()=>state.count>=1, unlocked:false},
    {id:"ten", name:"Ten Up", condition:()=>state.count>=10, unlocked:false},
    {id:"hundred", name:"Triple Digits", condition:()=>state.count>=100, unlocked:false},
    {id:"auto", name:"Automation", condition:()=>state.idleValue>=1, unlocked:false},
    {id:"prest", name:"Prestigious", condition:()=>state.prestigeMultiplier>=2, unlocked:false}
  ];

  // ===================== HELPERS =====================
  function formatNumber(n){
    if(n>=1e12) return (n/1e12).toFixed(2)+"T";
    if(n>=1e9) return (n/1e9).toFixed(2)+"B";
    if(n>=1e6) return (n/1e6).toFixed(2)+"M";
    if(n>=1e3) return (n/1e3).toFixed(2)+"K";
    return Math.floor(n).toString();
  }

  // ===================== CORE FUNCTIONS =====================
  function clickStar(event){
    state.count += state.clickValue;
    spawnParticles(event.clientX, event.clientY);
    checkAchievements();
    updateDisplay();
    saveGame();
  }

  function buyUpgrade(index){
    const u = upgrades[index];
    if(state.count < u.baseCost) return;
    state.count -= u.baseCost;
    u.owned++;
    if(u.type==="click") state.clickValue += u.value;
    if(u.type==="idle") state.idleValue += u.value;
    if(u.type==="burst") state.clickValue *= u.value;
    u.baseCost *= u.scale;
    updateDisplay();
    saveGame();
  }

  function prestige(){
    if(state.count < 1e6){ alert("Need at least 1,000,000 to Prestige!"); return; }
    state.prestigeMultiplier *= 2;
    state.count = 0;
    state.clickValue = 1;
    state.idleValue = 0;
    upgrades.forEach(u=>{ u.owned=0; u.baseCost = u.baseCost; });
    if(starShop.find(s=>s.id==="guidingLight" && s.owned)) state.idleValue = 1*state.prestigeMultiplier;
    updateDisplay();
    saveGame();
  }

  // ===================== ACHIEVEMENTS =====================
  function checkAchievements(){
    achievements.forEach(a=>{
      if(!a.unlocked && a.condition()){
        a.unlocked = true;
        showAchievement(a.name);
      }
    });
  }

  function showAchievement(name){
    const a = document.createElement('div');
    a.className = 'achievement';
    a.textContent = `🏆 ${name}`;
    document.body.appendChild(a);
    setTimeout(()=>document.body.removeChild(a),2000);
  }

  // ===================== DISPLAY =====================
  function updateDisplay(){
    document.getElementById('starCountDisplay').textContent = formatNumber(state.count);
    renderUpgrades();
    renderShop();
    renderAutoPrestigeToggle();
  }

  function renderUpgrades(){
    const container = document.getElementById('upgradeList');
    container.innerHTML = upgrades.map((u,i)=>`
      <div class="upgrade">
        <div>
          <b>${u.name} (Owned: ${u.owned})</b><br>
          <small>${u.desc}</small>
        </div>
        <div>
          <div>${formatNumber(u.baseCost)}</div>
          <button onclick="buyUpgrade(${i})">Buy</button>
        </div>
      </div>
    `).join('');
  }

  function renderShop(){
    const container = document.getElementById('starUpgrades');
    container.innerHTML = starShop.map((s,i)=>`
      <div class="shopItem">
        <div>
          <b>${s.name} (Owned: ${s.owned})</b><br>
          <small>${s.desc}</small>
        </div>
        <div>
          <div>${s.cost}★</div>
          <button onclick="buyStarShop(${i})" ${s.owned?'disabled':''}>Buy</button>
        </div>
      </div>
    `).join('');
  }

  function renderAutoPrestigeToggle(){
    const el = document.getElementById('autoPrestigeToggle');
    if(!state.autoPrestigeUnlocked){ el.innerHTML=''; return; }
    el.innerHTML = `
      <div style="display:flex;justify-content:center;align-items:center;gap:10px;">
        <div>Auto Prestige</div>
        <button onclick="toggleAutoPrestige()">${state.autoPrestigeEnabled?'ON':'OFF'}</button>
      </div>
    `;
  }

  function toggleAutoPrestige(){
    state.autoPrestigeEnabled = !state.autoPrestigeEnabled;
    renderAutoPrestigeToggle();
    saveGame();
  }

  // ===================== SHOP FUNCTIONS =====================
  function buyStarShop(index){
    const s = starShop[index];
    if(state.stars >= s.cost && s.owned===0){
      state.stars -= s.cost; s.owned=1;
      if(s.id==='celestialClicks') state.clickValue *= 2;
      if(s.id==='ascendantCycle') state.autoPrestigeUnlocked = true;
      if(s.id==='efficientUniverse') upgrades.forEach(u=> u.baseCost *= 0.95);
      updateDisplay(); saveGame();
    }
  }

  // ===================== PARTICLES =====================
  function spawnParticles(x,y){
    for(let i=0;i<10;i++){
      const p = document.createElement('div');
      p.className = 'particle';
      const dx = (Math.random()-0.5)*200 + 'px';
      const dy = (Math.random()-1)*200 + 'px';
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.setProperty('--dx', dx);
      p.style.setProperty('--dy', dy);
      document.body.appendChild(p);
      setTimeout(()=>document.body.removeChild(p),1000);
    }
  }

  // ===================== BACKGROUND STARS =====================
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let w,h,stars=[];
  function resizeCanvas(){ 
    w=canvas.width=window.innerWidth;
    h=canvas.height=window.innerHeight;
    stars=[]; 
    for(let i=0;i<200;i++) stars.push({x:Math.random()*w, y:Math.random()*h, r:Math.random()*2+1, s:Math.random()*0.5+0.1}); 
  }
  window.addEventListener('resize',resizeCanvas);
  resizeCanvas();
  function animateStars(){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='white';
    stars.forEach(s=>{
      s.y -= s.s;
      if(s.y<0) s.y=h;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(animateStars);
  }
  animateStars();

  // ===================== SAVE / LOAD =====================
  function saveGame(){
    localStorage.setItem('cosmicStarSave',JSON.stringify({state, upgrades, starShop, achievements}));
  }
  function loadGame(){
    const raw = localStorage.getItem('cosmicStarSave');
    if(!raw) return;
    try{
      const saved = JSON.parse(raw);
      Object.assign(state,saved.state);
      saved.upgrades.forEach(sU=>{
        const u = upgrades.find(x=>x.id===sU.id);
        if(u) Object.assign(u,sU);
      });
      saved.starShop.forEach(sS=>{
        const s = starShop.find(x=>x.id===sS.id);
        if(s) Object.assign(s,sS);
      });
      saved.achievements.forEach(sA=>{
        const a = achievements.find(x=>x.id===sA.id);
        if(a) Object.assign(a,sA);
      });
    }catch(e){console.warn("Load failed",e);}
  }

  // ===================== GAME LOOP =====================
  setInterval(()=>{
    state.count += state.idleValue;
    if(state.autoPrestigeEnabled && state.count >= 1e6) prestige();
    updateDisplay();
  },1000);

  // ===================== INIT =====================
  window.clickStar = clickStar;
  window.buyUpgrade = buyUpgrade;
  window.buyStarShop = buyStarShop;
  window.prestige = prestige;
  window.toggleAutoPrestige = toggleAutoPrestige;

  document.getElementById('starBtn').addEventListener('click', clickStar);
  loadGame();
  updateDisplay();
  setInterval(saveGame,10000);

});
