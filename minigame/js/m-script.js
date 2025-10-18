}
const D = (v) => {
  if (DecimalLib) return new DecimalLib(v);
  return typeof v === "number" ? v : Number(v);
};
/* Helper boolean to detect Decimal usage */
const usingDecimal = !!DecimalLib;

/* safe helpers so code can look clean */
function add(a,b){ return usingDecimal ? a.plus(b) : a + b; }
function sub(a,b){ return usingDecimal ? a.minus(b) : a - b; }
function mul(a,b){ return usingDecimal ? a.times(b) : a * b; }
function div(a,b){ return usingDecimal ? a.dividedBy(b) : a / b; }
function gte(a,b){ return usingDecimal ? a.greaterThanOrEqualTo(b) : a >= b; }
function lt(a,b){ return usingDecimal ? a.lessThan(b) : a < b; }
function toNumber(a){ return usingDecimal ? a.toNumber() : a; }
function toString(a){ return usingDecimal ? a.toString() : String(a); }

/* ================= Game state (use Decimal for big numbers) */
let count = D(0);
let clickValue = D(1);
let idleValue = D(0);
let prestigeMultiplier = D(1);
let stars = 0;
let autoPrestigeUnlocked = false;
let autoPrestigeEnabled = false;

/* Upgrade definitions */
let upgrades = [
  { id:'click05', name: "+0.5 / click", baseCost: D(20), cost: D(20), value: D(0.5), type:"click", owned:0, scale: D(1.5), desc:"Practice makes perfect." },
  { id:'click1', name: "+1 / click", baseCost: D(150), cost: D(150), value: D(1), type:"click", owned:0, scale: D(1.5), desc:"Heavier fingertips." },
  { id:'cps1', name: "+1 / sec", baseCost: D(100), cost: D(100), value: D(1), type:"idle", owned:0, scale: D(1.5), desc:"Little helpers." },
  { id:'cps5', name: "+5 / sec", baseCost: D(500), cost: D(500), value: D(5), type:"idle", owned:0, scale: D(1.5), desc:"Bigger crew." },
  { id:'burst', name: "Burst x2", baseCost: D(1000), cost: D(1000), value: D(2), type:"burst", owned:0, scale: D(2), desc:"Permanently doubles click value (stackable)." }
];

/* Star shop */
let shopUpgrades = [
  { id:'guidingLight', name:"Guiding Light", cost:2, owned:0, desc:"Start with +Idle/sec × Prestige multiplier." },
  { id:'celestialClicks', name:"Celestial Clicks", cost:5, owned:0, desc:"Permanently double click value." },
  { id:'ascendantCycle', name:"Ascendant Cycle", cost:10, owned:0, desc:"Unlock auto prestige toggle." },
  { id:'efficientUniverse', name:"Efficient Universe", cost:15, owned:0, desc:"5% cheaper upgrades." }
];

/* Achievements */
let achievements = [
  { id:'first',   name:"First Click",          unlocked:false, condition:()=> gte(count, D(1)) },
  { id:'ten',     name:"Ten Up",               unlocked:false, condition:()=> gte(count, D(10)) },
  { id:'hundred', name:"Triple Digits",        unlocked:false, condition:()=> gte(count, D(100)) },
  { id:'thousand',name:"1,000!",               unlocked:false, condition:()=> gte(count, D(1000)) },
  { id:'auto',    name:"Automation",           unlocked:false, condition:()=> gte(idleValue, D(1)) },
  { id:'banked',  name:"5,000 Banked",         unlocked:false, condition:()=> gte(count, D(5000)) },
  { id:'lotones', name:"A Lot of Ones",        unlocked:false, condition:()=> gte(clickValue, D(11)) },
  { id:'moneym',  name:"Money Money",          unlocked:false, condition:()=> gte(count, D(1e6)) },
  { id:'prest',   name:"Prestigious",          unlocked:false, condition:()=> gte(prestigeMultiplier, D(2)) },
  { id:'starry',  name:"Starry Eyed",          unlocked:false, condition:()=> stars > 0 },
  { id:'collect', name:"Collector",            unlocked:false, condition:()=> shopUpgrades.some(s=> s.owned>0) },
  { id:'trueg',   name:"True Grinder",         unlocked:false, condition:()=> gte(count, D(1e9)) }
];

/* ===================== Helpers & formatting ===================== */

/* Old formatting */
function formatDecimal(d){
  if (!usingDecimal) return formatNumberFallback(d);
  try {
    if (!isFinite(d.m)) {
      return d.toString();
    }
  } catch(e){}
  const thresholds = [
    {limit: new DecimalLib('1e33'), suffix:'Dc'},
    {limit: new DecimalLib('1e30'), suffix:'No'},
    {limit: new DecimalLib('1e27'), suffix:'Oc'},
    {limit: new DecimalLib('1e24'), suffix:'Sp'},
    {limit: new DecimalLib('1e21'), suffix:'Sx'},
    {limit: new DecimalLib('1e18'), suffix:'Qi'},
    {limit: new DecimalLib('1e15'), suffix:'Qa'},
    {limit: new DecimalLib('1e12'), suffix:'T'},
    {limit: new DecimalLib('1e9'),  suffix:'B'},
    {limit: new DecimalLib('1e6'),  suffix:'M'},
    {limit: new DecimalLib('1e3'),  suffix:'K'}
  ];
  for(let i=0;i<thresholds.length;i++){
    const t = thresholds[i];
    if (d.greaterThanOrEqualTo(t.limit)){
      const val = d.dividedBy(t.limit);
      const s = val.lessThan(100) ? val.toFixed(2) : val.toFixed(0);
      return s + t.suffix;
    }
  }
  return d.toFixed(d.greaterThanOrEqualTo(1) ? 0 : 2).toString();
}

function formatNumberFallback(num){
  if (num >= 1e12) return (num/1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num/1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num/1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num/1e3).toFixed(2) + 'K';
  return Math.floor(num).toString();
}

function parseD(v){
  if (usingDecimal){
    try { return new DecimalLib(v); } catch(e){ return new DecimalLib(0); }
  }
  return Number(v) || 0;
}

/* ===================== Cosmic currency formatting ===================== */

const cosmicTiers = [
  {limit: D(1e6), suffix:'★'},    // Stars
  {limit: D(1e10), suffix:'🪐'},  // Planets
  {limit: D(1e13), suffix:'🌌'}   // Galaxies
];

function formatCosmic(d){
  for (let i = cosmicTiers.length - 1; i >= 0; i--){
    const tier = cosmicTiers[i];
    if (gte(d, tier.limit)){
      const val = usingDecimal ? d.dividedBy(tier.limit) : d / tier.limit;
      const display = val.lessThan(100) ? val.toFixed(2) : val.toFixed(0);
      return display + ' ' + tier.suffix;
    }
  }
  // fallback for numbers smaller than 1M
  return formatDecimal(d);
}

/* ===================== Core game functions ===================== */

function clickStar(){
  count = add(count, clickValue);
  checkAchievements();
  updateDisplay();
  saveGame();
}

function buyUpgrade(i){
  const u = upgrades[i];
  if (gte(count, u.cost)){
    count = sub(count, u.cost);
    u.owned += 1;
    if (u.type === 'click') clickValue = add(clickValue, u.value);
    if (u.type === 'idle') idleValue = add(idleValue, u.value);
    if (u.type === 'burst') clickValue = mul(clickValue, u.value);
    u.cost = usingDecimal ? u.cost.times(u.scale) : Math.floor(Number(u.cost) * Number(u.scale));
    renderAll();
    saveGame();
  }
}

function tradeForStar(){
  const tradeCost = usingDecimal ? new DecimalLib('5e13') : 5e13;
  if (gte(count, tradeCost)){
    count = sub(count, tradeCost);
    stars += 1;
    renderAll();
    saveGame();
  }
}

function buyStarUpgrade(i){
  const s = shopUpgrades[i];
  if (stars >= s.cost && s.owned === 0){
    stars -= s.cost;
    s.owned = 1;
    if (s.id === 'celestialClicks') clickValue = mul(clickValue, D(2));
    if (s.id === 'ascendantCycle') autoPrestigeUnlocked = true;
    if (s.id === 'efficientUniverse') {
      upgrades.forEach(u => {
        u.cost = usingDecimal ? u.cost.times(0.95) : Math.floor(Number(u.cost) * 0.95);
      });
    }
    renderAll();
    saveGame();
  }
}

function prestige(){
  const threshold = usingDecimal ? D(1e6) : 1e6;
  if (!gte(count, threshold)){
    alert("You need at least 1,000,000 to Prestige!");
    return;
  }
  prestigeMultiplier = mul(prestigeMultiplier, D(2));
  count = D(0);
  clickValue = D(1);
  idleValue = D(0);
  upgrades.forEach(u => {
    u.owned = 0;
    u.cost = u.baseCost;
  });
  const gl = shopUpgrades.find(s => s.id === 'guidingLight');
  if (gl && gl.owned){
    idleValue = mul(D(1), prestigeMultiplier);
  }
  renderAll();
  saveGame();
}

/* Auto prestige toggle */
function renderAutoPrestigeToggle(){
  const el = document.getElementById('autoPrestigeToggle');
  if (!autoPrestigeUnlocked){
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `<div style="display:flex;gap:10px;align-items:center;margin-top:10px;">
    <div class="small">Auto Prestige</div>
    <button class="${autoPrestigeEnabled ? 'toggle-on' : 'toggle-off'}" onclick="toggleAutoPrestige()" style="padding:6px 10px;border-radius:8px;border:0;cursor:pointer;">
      ${autoPrestigeEnabled ? 'ON' : 'OFF'}
    </button>
  </div>`;
}
function toggleAutoPrestige(){
  autoPrestigeEnabled = !autoPrestigeEnabled;
  saveGame();
  renderAutoPrestigeToggle();
}

/* Achievements */
function checkAchievements(){
  let changed = false;
  achievements.forEach(a => {
    if (!a.unlocked && a.condition()){
      a.unlocked = true;
      changed = true;
    }
  });
  if (changed) renderAchievements();
}

/* ===================== Rendering ===================== */

function renderShop(){
  document.getElementById('starCount').textContent = stars;
  const container = document.getElementById('starUpgrades');
  let html = '';
  shopUpgrades.forEach((s, i) => {
    html += `<div class="item">
      <div class="left">
        <b>${s.name} (Owned: ${s.owned})</b>
        <small>${s.desc}</small>
      </div>
      <div class="cost">
        <div class="price">${s.cost}<i class="fa-solid fa-star"></i></div>
        <button class="buy" ${s.owned ? 'disabled' : ''} onclick="buyStarUpgrade(${i})">Buy</button>
      </div>
    </div>`;
  });
  container.innerHTML = html;
  renderAutoPrestigeToggle();
}

function renderUpgrades(){
  const container = document.getElementById('upgradeList');
  let html = '';
  upgrades.forEach((u, i) => {
    const price = usingDecimal ? formatDecimal(u.cost) : formatNumberFallback(Number(u.cost));
    html += `<div class="item">
      <div class="left">
        <b>${u.name} (Owned: ${u.owned})</b>
        <small>${u.desc}</small>
      </div>
      <div class="cost">
        <div class="price">${price}</div>
        <button class="buy" onclick="buyUpgrade(${i})">Buy</button>
      </div>
    </div>`;
  });
  container.innerHTML = html;
}

function renderAchievements(){
  const container = document.getElementById('achievementsList');
  let html = '';
  achievements.forEach(a => {
    const cls = a.unlocked ? 'achievement unlocked' : 'achievement locked';
    html += `<div class="${cls}">${a.unlocked ? '<i class="fa-solid fa-trophy"></i> ' : '<i class="fa-solid fa-lock"></i> '}${a.name}</div>`;
  });
  container.innerHTML = html;
}

function updateDisplay(){
  document.getElementById('count').textContent = formatCosmic(count);
  document.getElementById('clickVal').textContent = formatDecimal(clickValue);
  document.getElementById('idleVal').textContent = formatDecimal(idleValue);
  document.getElementById('prestigeVal').textContent = (usingDecimal ? formatDecimal(prestigeMultiplier) : prestigeMultiplier) + 'x';
  document.getElementById('prestigeBtn').disabled = !gte(count, D(1e6));
  renderShop();
  renderUpgrades();
  renderAchievements();
}

function renderAll(){ updateDisplay(); renderShop(); renderUpgrades(); renderAchievements(); }

/* ===================== Game loop & save/load ===================== */
/* ===================== Game loop & save/load ===================== */

setInterval(()=>{
  count = add(count, idleValue);
  if (autoPrestigeEnabled && gte(count, D(1e6))){
    prestige();
  }
  checkAchievements();
  updateDisplay();
}, 1000);

function saveGame(){
  try {
    const save = {
      count: toString(count),
      clickValue: toString(clickValue),
      idleValue: toString(idleValue),
      prestigeMultiplier: toString(prestigeMultiplier),
      stars,
      autoPrestigeUnlocked,
      autoPrestigeEnabled,
      upgrades: upgrades.map(u=>({
        id:u.id, owned:u.owned, cost: toString(u.cost)
      })),
      shopUpgrades: shopUpgrades.map(s=>({id:s.id || s.name, owned:s.owned})),
      achievements: achievements.map(a=>({id:a.id, unlocked:a.unlocked}))
    };
    localStorage.setItem('starClickerSave', JSON.stringify(save));
  } catch(e){}
}

function loadGame(){
  try {
    const raw = localStorage.getItem('starClickerSave');
    if (!raw) return;
    const s = JSON.parse(raw);
    count = parseD(s.count ?? 0);
    clickValue = parseD(s.clickValue ?? 1);
    idleValue = parseD(s.idleValue ?? 0);
    prestigeMultiplier = parseD(s.prestigeMultiplier ?? 1);
    stars = s.stars ?? 0;
    autoPrestigeUnlocked = s.autoPrestigeUnlocked ?? false;
    autoPrestigeEnabled = s.autoPrestigeEnabled ?? false;
    if (s.upgrades && Array.isArray(s.upgrades)){
      s.upgrades.forEach(savedU => {
        const u = upgrades.find(x=>x.id === savedU.id);
        if (u){
          u.owned = savedU.owned ?? u.owned;
          u.cost = parseD(savedU.cost ?? u.cost);
        }
      });
    }
    if (s.shopUpgrades && Array.isArray(s.shopUpgrades)){
      s.shopUpgrades.forEach(savedS => {
        const sUp = shopUpgrades.find(x => (x.id || x.name) === savedS.id);
        if (sUp) sUp.owned = savedS.owned ?? sUp.owned;
      });
    }
    if (s.achievements && Array.isArray(s.achievements)){
      s.achievements.forEach(savedA => {
        const a = achievements.find(x => x.id === savedA.id);
        if (a) a.unlocked = savedA.unlocked ?? a.unlocked;
      });
    }
  } catch(e){ console.warn('Load failed', e); }
}

function hardReset(){
  if (!confirm('Are you sure? This will wipe everything!')) return;
  localStorage.removeItem('starClickerSave');
  count = D(0); clickValue = D(1); idleValue = D(0); prestigeMultiplier = D(1); stars = 0;
  upgrades.forEach(u => { u.owned = 0; u.cost = u.baseCost; });
  shopUpgrades.forEach(s => s.owned = 0);
  achievements.forEach(a => a.unlocked = false);
  autoPrestigeUnlocked = false; autoPrestigeEnabled = false;
  renderAll();
  saveGame();
}

/* ===================== Dev key (P) ===================== */
window.addEventListener('keydown', (e) => {
  if (e.key && e.key.toLowerCase() === 'p'){
    count = add(count, D('1e15'));
    console.log('Dev boost: +1e15');
    const star = document.getElementById('starBtn');
    if (star){
      star.style.transform = 'scale(1.06)';
      setTimeout(()=> star.style.transform = '', 160);
    }
    updateDisplay();
    saveGame();
  }
});

/* ===================== Init ===================== */
document.getElementById('starBtn').addEventListener('click', ()=> clickStar());
window.clickStar = clickStar;
window.buyUpgrade = buyUpgrade;
window.buyStarUpgrade = buyStarUpgrade;
window.tradeForStar = tradeForStar;
window.saveGame = saveGame;
window.hardReset = hardReset;
window.prestige = prestige;
window.toggleAutoPrestige = toggleAutoPrestige;

loadGame();
renderAll();
setInterval(saveGame, 10000); // autosave every 10s

