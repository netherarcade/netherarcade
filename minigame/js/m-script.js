/* ================== Helpers ================== */
const D = (v) => new Decimal(v); // Using BreakInfinity.js
const add = (a, b) => a.add(b);
const sub = (a, b) => a.sub(b);
const mul = (a, b) => a.mul(b);
const gte = (a, b) => a.gte(b);
const format = (d) => d.gte(1e3) ? d.toExponential(2) : d.toString();

/* ================== Game State ================== */
let count = D(0);
let clickValue = D(1);
let idleValue = D(0);
let prestigeMultiplier = D(1);
let stars = 0;
let autoPrestigeUnlocked = false;
let autoPrestigeEnabled = false;

/* ================== Upgrades ================== */
let upgrades = [
  { name: "+1/click", cost: D(10), value: D(1), type: "click", owned: 0, scale: D(1.5) },
  { name: "+5/sec", cost: D(50), value: D(5), type: "idle", owned: 0, scale: D(1.5) },
  { name: "Burst x2", cost: D(200), value: D(2), type: "burst", owned: 0, scale: D(2) }
];

/* ================== Star Shop ================== */
let shopUpgrades = [
  { name: "Double Clicks", cost: 2, owned: 0, effect: () => clickValue = mul(clickValue, D(2)) },
  { name: "Auto Prestige", cost: 5, owned: 0, effect: () => autoPrestigeUnlocked = true },
  { name: "Cheaper Upgrades", cost: 10, owned: 0, effect: () => upgrades.forEach(u => u.cost = mul(u.cost, D(0.9))) }
];

/* ================== Achievements ================== */
let achievements = [
  { name: "First Click", unlocked: false, condition: () => gte(count, D(1)) },
  { name: "Ten Stars", unlocked: false, condition: () => gte(count, D(10)) },
  { name: "Prestige Once", unlocked: false, condition: () => gte(prestigeMultiplier, D(2)) }
];

/* ================== Core Game Functions ================== */
function clickStar() {
  count = add(count, clickValue);
  animateStar();
  checkAchievements();
  updateDisplay();
  saveGame();
}

function animateStar() {
  const star = document.getElementById("starBtn");
  if (!star) return;
  star.classList.add("clicked");
  setTimeout(() => star.classList.remove("clicked"), 100);
}

function buyUpgrade(index) {
  const u = upgrades[index];
  if (!gte(count, u.cost)) return;
  count = sub(count, u.cost);
  u.owned++;
  if (u.type === "click") clickValue = add(clickValue, u.value);
  if (u.type === "idle") idleValue = add(idleValue, u.value);
  if (u.type === "burst") clickValue = mul(clickValue, u.value);
  u.cost = mul(u.cost, u.scale);
  renderAll();
  saveGame();
}

function buyStarUpgrade(index) {
  const s = shopUpgrades[index];
  if (stars >= s.cost && s.owned === 0) {
    stars -= s.cost;
    s.owned = 1;
    s.effect();
    renderAll();
    saveGame();
  }
}

function prestige() {
  const threshold = D(1000);
  if (!gte(count, threshold)) {
    alert(`You need at least ${format(threshold)} to Prestige!`);
    return;
  }
  prestigeMultiplier = mul(prestigeMultiplier, D(2));
  count = D(0);
  clickValue = D(1);
  idleValue = D(0);
  upgrades.forEach(u => { u.owned = 0; u.cost = u.cost.div(u.scale).mul(u.scale); });
  renderAll();
  saveGame();
}

/* ================== Achievements ================== */
function checkAchievements() {
  let changed = false;
  achievements.forEach(a => {
    if (!a.unlocked && a.condition()) {
      a.unlocked = true;
      changed = true;
    }
  });
  if (changed) renderAchievements();
}

/* ================== Auto Prestige Toggle ================== */
function toggleAutoPrestige() {
  autoPrestigeEnabled = !autoPrestigeEnabled;
  renderAutoPrestigeToggle();
  saveGame();
}

/* ================== Rendering ================== */
function renderUpgrades() {
  const container = document.getElementById("upgradeList");
  if (!container) return;
  container.innerHTML = "";
  upgrades.forEach((u, i) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.innerText = `${u.name} (${format(u.cost)}) Owned: ${u.owned}`;
    btn.disabled = !gte(count, u.cost);
    btn.onclick = () => buyUpgrade(i);
    container.appendChild(btn);
  });
}

function renderShop() {
  const container = document.getElementById("starUpgrades");
  const starEl = document.getElementById("starCount");
  if (starEl) starEl.textContent = stars;
  if (!container) return;
  container.innerHTML = "";
  shopUpgrades.forEach((s, i) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.innerText = `${s.name} (${s.cost}⭐)`;
    btn.disabled = s.owned > 0 || stars < s.cost;
    btn.onclick = () => buyStarUpgrade(i);
    container.appendChild(btn);
  });
  renderAutoPrestigeToggle();
}

function renderAchievements() {
  const container = document.getElementById("achievementsList");
  if (!container) return;
  container.innerHTML = "";
  achievements.forEach(a => {
    const div = document.createElement("div");
    div.className = "achievement " + (a.unlocked ? "unlocked" : "locked");
    div.textContent = `${a.unlocked ? "🏆 " : "🔒 "}${a.name}`;
    container.appendChild(div);
  });
}

function renderAutoPrestigeToggle() {
  const el = document.getElementById("autoPrestigeToggle");
  if (!el) return;
  if (!autoPrestigeUnlocked) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = `<div>Auto Prestige: <button class="${autoPrestigeEnabled ? "toggle-on":"toggle-off"}" onclick="toggleAutoPrestige()">${autoPrestigeEnabled ? "ON":"OFF"}</button></div>`;
}

function updateDisplay() {
  const countEl = document.getElementById("count");
  const clickEl = document.getElementById("clickVal");
  const idleEl = document.getElementById("idleVal");
  const prestigeEl = document.getElementById("prestigeVal");
  const prestigeBtn = document.getElementById("prestigeBtn");
  if (countEl) countEl.textContent = format(count);
  if (clickEl) clickEl.textContent = format(clickValue);
  if (idleEl) idleEl.textContent = format(idleValue);
  if (prestigeEl) prestigeEl.textContent = format(prestigeMultiplier) + "x";
  if (prestigeBtn) prestigeBtn.disabled = !gte(count, D(1000));
  renderShop();
  renderUpgrades();
  renderAchievements();
}

function renderAll() {
  updateDisplay();
  renderShop();
  renderUpgrades();
  renderAchievements();
}

/* ================== Game Loop ================== */
setInterval(() => {
  count = add(count, idleValue);
  if (autoPrestigeEnabled && gte(count, D(1000))) prestige();
  checkAchievements();
  updateDisplay();
}, 1000);

/* ================== Save / Load ================== */
function saveGame() {
  const save = {
    count: count.toString(),
    clickValue: clickValue.toString(),
    idleValue: idleValue.toString(),
    prestigeMultiplier: prestigeMultiplier.toString(),
    stars,
    autoPrestigeUnlocked,
    autoPrestigeEnabled,
    upgrades: upgrades.map(u => ({ owned: u.owned, cost: u.cost.toString() })),
    shopUpgrades: shopUpgrades.map(s => ({ owned: s.owned })),
    achievements: achievements.map(a => ({ unlocked: a.unlocked }))
  };
  localStorage.setItem("starClickerSave", JSON.stringify(save));
}

function loadGame() {
  const raw = localStorage.getItem("starClickerSave");
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    count = D(s.count ?? 0);
    clickValue = D(s.clickValue ?? 1);
    idleValue = D(s.idleValue ?? 0);
    prestigeMultiplier = D(s.prestigeMultiplier ?? 1);
    stars = s.stars ?? 0;
    autoPrestigeUnlocked = s.autoPrestigeUnlocked ?? false;
    autoPrestigeEnabled = s.autoPrestigeEnabled ?? false;
    s.upgrades?.forEach((u, i) => { upgrades[i].owned = u.owned; upgrades[i].cost = D(u.cost); });
    s.shopUpgrades?.forEach((sU, i) => { shopUpgrades[i].owned = sU.owned; });
    s.achievements?.forEach((a, i) => { achievements[i].unlocked = a.unlocked; });
  } catch(e){ console.warn("Failed to load save", e); }
}

/* ================== Hard Reset ================== */
function hardReset() {
  if (!confirm("Are you sure? This will erase all progress!")) return;
  localStorage.removeItem("starClickerSave");
  count = D(0); clickValue = D(1); idleValue = D(0); prestigeMultiplier = D(1);
  stars = 0; autoPrestigeUnlocked = false; autoPrestigeEnabled = false;
  upgrades.forEach(u => { u.owned=0; u.cost=mul(u.cost,D(1)); });
  shopUpgrades.forEach(s => s.owned=0);
  achievements.forEach(a => a.unlocked=false);
  renderAll();
  saveGame();
}

/* ================== Init ================== */
document.getElementById("starBtn")?.addEventListener("click", clickStar);
document.getElementById("prestigeBtn")?.addEventListener("click", prestige);
window.clickStar = clickStar;
window.buyUpgrade = buyUpgrade;
window.buyStarUpgrade = buyStarUpgrade;
window.prestige = prestige;
window.toggleAutoPrestige = toggleAutoPrestige;
window.saveGame = saveGame;
window.hardReset = hardReset;

loadGame();
renderAll();
setInterval(saveGame, 10000); // Auto-save every 10 seconds
