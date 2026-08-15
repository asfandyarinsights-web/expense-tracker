// ---------- CONSTANTS ----------
const STORAGE_KEY = "ledger:transactions";
const BUDGET_KEY = "ledger:budget";
const THEME_KEY = "ledger:theme";

const CATEGORY_META = {
  food: { icon: "🍔", color: "#FF9F43" },
  shopping: { icon: "🛍️", color: "#A66DFF" },
  utilities: { icon: "💡", color: "#FFC542" },
  rent: { icon: "🏠", color: "#3654FF" },
  transport: { icon: "🚗", color: "#00B4D8" },
  salary: { icon: "💼", color: "#00C48C" },
  freelance: { icon: "💻", color: "#2ED9C3" },
  other: { icon: "✨", color: "#8B8E9C" },
};

// ---------- STATE ----------
let transactions = loadJSON(STORAGE_KEY, []);
let budget = loadJSON(BUDGET_KEY, null);
let selectedType = "expense";
let selectedCategory = null;
let pendingDelete = null; // holds {tx, timeoutId} while an undo window is open

// ---------- ELEMENTS ----------
const el = (id) => document.getElementById(id);

const themeToggle = el("themeToggle");
const themeIcon = el("themeIcon");
const greeting = el("greeting");

const balanceFigure = el("balanceFigure");
const totalIncomeEl = el("totalIncome");
const totalExpenseEl = el("totalExpense");

const gaugeFill = el("gaugeFill");
const budgetCopy = el("budgetCopy");
const budgetForm = el("budgetForm");
const budgetInput = el("budgetInput");

const donutRow = el("donutRow");

const searchInput = el("searchInput");
const filterType = el("filterType");
const sortBy = el("sortBy");

const txGroups = el("txGroups");
const emptyState = el("emptyState");
const noResults = el("noResults");

const fabBtn = el("fabBtn");
const sheetBackdrop = el("sheetBackdrop");
const sheetClose = el("sheetClose");
const transactionForm = el("transactionForm");
const nameInput = el("txName");
const amountInput = el("txAmount");
const nameError = el("nameError");
const amountError = el("amountError");
const typeButtons = document.querySelectorAll(".type-btn");
const categoryGrid = el("categoryGrid");

const toast = el("toast");
const toastMsg = el("toastMsg");
const toastUndo = el("toastUndo");

// ---------- STORAGE HELPERS ----------
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  if (value === null || value === undefined) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// ---------- THEME ----------
function initTheme() {
  const saved = loadJSON(THEME_KEY, null);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  applyTheme(theme);
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeIcon.innerHTML =
    theme === "dark"
      ? `<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>`
      : `<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`;
  saveJSON(THEME_KEY, theme);
}
themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

// ---------- GREETING ----------
(function setGreeting() {
  const hour = new Date().getHours();
  greeting.textContent = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
})();

// ---------- SHEET (ADD TRANSACTION) ----------
function openSheet() {
  sheetBackdrop.classList.remove("hidden");
  nameInput.focus();
}
function closeSheet() {
  sheetBackdrop.classList.add("hidden");
  transactionForm.reset();
  nameError.classList.add("hidden");
  amountError.classList.add("hidden");
  selectedCategory = null;
  document.querySelectorAll(".cat-chip").forEach((c) => c.classList.remove("is-active"));
}
fabBtn.addEventListener("click", openSheet);
sheetClose.addEventListener("click", closeSheet);
sheetBackdrop.addEventListener("click", (e) => {
  if (e.target === sheetBackdrop) closeSheet();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !sheetBackdrop.classList.contains("hidden")) closeSheet();
});

// ---------- TYPE TOGGLE ----------
typeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedType = btn.dataset.type;
    typeButtons.forEach((b) => {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-checked", String(active));
    });
  });
});

// ---------- CATEGORY CHIPS ----------
categoryGrid.addEventListener("click", (e) => {
  const chip = e.target.closest(".cat-chip");
  if (!chip) return;
  selectedCategory = chip.dataset.cat;
  document.querySelectorAll(".cat-chip").forEach((c) => c.classList.toggle("is-active", c === chip));
});

// ---------- ADD TRANSACTION ----------
transactionForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const amount = parseFloat(amountInput.value);

  let valid = true;
  if (!name) {
    nameError.classList.remove("hidden");
    valid = false;
  } else {
    nameError.classList.add("hidden");
  }
  if (isNaN(amount) || amount <= 0) {
    amountError.classList.remove("hidden");
    valid = false;
  } else {
    amountError.classList.add("hidden");
  }
  if (!valid) return;

  transactions.unshift({
    id: Date.now(),
    name,
    amount,
    category: selectedCategory || "other",
    type: selectedType,
    date: new Date().toISOString(),
  });
  saveJSON(STORAGE_KEY, transactions);
  closeSheet();
  showToast(`${selectedType === "income" ? "Income" : "Expense"} added`);
  render();
});

// ---------- DELETE WITH UNDO ----------
txGroups.addEventListener("click", (e) => {
  const btn = e.target.closest(".tx-delete");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) return;

  const [removed] = transactions.splice(index, 1);
  saveJSON(STORAGE_KEY, transactions);
  render();

  showToast("Transaction deleted", () => {
    transactions.splice(index, 0, removed);
    saveJSON(STORAGE_KEY, transactions);
    render();
  });
});

// ---------- TOAST ----------
let toastTimer = null;
function showToast(message, onUndo) {
  clearTimeout(toastTimer);
  toastMsg.textContent = message;
  toast.classList.remove("hidden");

  if (onUndo) {
    toastUndo.classList.remove("hidden");
    toastUndo.onclick = () => {
      onUndo();
      toast.classList.add("hidden");
      clearTimeout(toastTimer);
    };
  } else {
    toastUndo.classList.add("hidden");
    toastUndo.onclick = null;
  }

  toastTimer = setTimeout(() => toast.classList.add("hidden"), 4000);
}

// ---------- BUDGET ----------
// Delegated so it keeps working even after renderBudget() rewrites budgetCopy's innerHTML.
budgetCopy.addEventListener("click", (e) => {
  if (!e.target.closest("[data-action='edit-budget']")) return;
  budgetInput.value = budget ?? "";
  budgetForm.classList.remove("hidden");
  budgetInput.focus();
});
budgetForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = parseFloat(budgetInput.value);
  budget = isNaN(value) || value <= 0 ? null : value;
  saveJSON(BUDGET_KEY, budget);
  budgetForm.classList.add("hidden");
  render();
});

// ---------- FILTER / SEARCH / SORT ----------
[searchInput, filterType, sortBy].forEach((control) =>
  control.addEventListener("input", renderHistory)
);

function getFilteredSorted() {
  const query = searchInput.value.trim().toLowerCase();
  const type = filterType.value;

  let list = transactions.filter((t) => {
    const matchesQuery =
      !query || t.name.toLowerCase().includes(query) || t.category.toLowerCase().includes(query);
    const matchesType = type === "all" || t.type === type;
    return matchesQuery && matchesType;
  });

  const sort = sortBy.value;
  list = [...list].sort((a, b) => {
    if (sort === "newest") return new Date(b.date) - new Date(a.date);
    if (sort === "oldest") return new Date(a.date) - new Date(b.date);
    if (sort === "highest") return b.amount - a.amount;
    if (sort === "lowest") return a.amount - b.amount;
    return 0;
  });

  return list;
}

// ---------- FORMATTING ----------
function money(n) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function groupLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}
function timeOf(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- RENDER: SUMMARY ----------
function renderSummary() {
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  balanceFigure.textContent = money(income - expense);
  totalIncomeEl.textContent = money(income);
  totalExpenseEl.textContent = money(expense);
  return { income, expense };
}

// ---------- RENDER: BUDGET GAUGE ----------
const CIRCUMFERENCE = 2 * Math.PI * 50;
function renderBudget(expense) {
  if (budget === null) {
    gaugeFill.style.stroke = "var(--brand)";
    gaugeFill.style.strokeDashoffset = CIRCUMFERENCE;
    budgetCopy.innerHTML = `
      <p class="budget-empty">No budget set</p>
      <button class="link-btn" data-action="edit-budget" type="button">Set a budget</button>
    `;
    return;
  }

  const pct = Math.min(expense / budget, 1);
  gaugeFill.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - pct));
  gaugeFill.style.stroke = expense > budget ? "var(--expense)" : pct >= 0.8 ? "var(--warn)" : "var(--brand)";

  const noteClass = expense > budget ? "is-over" : "";
  const note = expense > budget ? `${money(expense - budget)} over` : `${money(budget - expense)} left`;

  budgetCopy.innerHTML = `
    <p class="gauge-amount">${Math.round(pct * 100)}%</p>
    <p class="gauge-note ${noteClass}">${note}</p>
    <button class="link-btn" data-action="edit-budget" type="button">Edit</button>
  `;
}

// ---------- RENDER: CATEGORY DONUT ----------
function renderDonut(expense) {
  const expenseTx = transactions.filter((t) => t.type === "expense");
  if (expenseTx.length === 0 || expense === 0) {
    donutRow.innerHTML = `<div class="donut-empty"><p>Log an expense to see your breakdown</p></div>`;
    return;
  }

  const byCategory = {};
  expenseTx.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });

  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  let cursor = 0;
  const stops = entries.map(([cat, amt]) => {
    const pct = (amt / expense) * 100;
    const color = CATEGORY_META[cat]?.color || "#8B8E9C";
    const stop = `${color} ${cursor}% ${cursor + pct}%`;
    cursor += pct;
    return stop;
  });

  const legendItems = entries
    .slice(0, 4)
    .map(([cat, amt]) => {
      const pct = Math.round((amt / expense) * 100);
      const color = CATEGORY_META[cat]?.color || "#8B8E9C";
      return `
        <li>
          <span class="legend-dot" style="background:${color}"></span>
          <span class="legend-label">${cat}</span>
          <span class="legend-pct">${pct}%</span>
        </li>`;
    })
    .join("");

  donutRow.innerHTML = `
    <div class="donut" style="background: conic-gradient(${stops.join(",")})"></div>
    <ul class="donut-legend">${legendItems}</ul>
  `;
}

// ---------- RENDER: HISTORY ----------
function renderHistory() {
  const list = getFilteredSorted();

  if (transactions.length === 0) {
    emptyState.classList.remove("hidden");
    noResults.classList.add("hidden");
    txGroups.innerHTML = "";
    return;
  }
  emptyState.classList.add("hidden");

  if (list.length === 0) {
    noResults.classList.remove("hidden");
    txGroups.innerHTML = "";
    return;
  }
  noResults.classList.add("hidden");

  const groups = [];
  let lastLabel = null;
  list.forEach((t) => {
    const label = groupLabel(t.date);
    if (label !== lastLabel) {
      groups.push({ label, items: [] });
      lastLabel = label;
    }
    groups[groups.length - 1].items.push(t);
  });

  txGroups.innerHTML = groups
    .map(
      (g) => `
      <p class="tx-group-label">${g.label}</p>
      ${g.items
        .map((t) => {
          const meta = CATEGORY_META[t.category] || CATEGORY_META.other;
          return `
          <div class="tx-row is-${t.type}">
            <span class="tx-icon">${meta.icon}</span>
            <div class="tx-main">
              <p class="tx-name">${escapeHtml(t.name)}</p>
              <p class="tx-meta">${t.category} · ${timeOf(t.date)}</p>
            </div>
            <span class="tx-amount">${t.type === "income" ? "+" : "−"}${money(t.amount)}</span>
            <button class="tx-delete" data-id="${t.id}" aria-label="Delete ${escapeHtml(t.name)}">✕</button>
          </div>`;
        })
        .join("")}
    `
    )
    .join("");
}

// ---------- RENDER: ALL ----------
function render() {
  const { expense } = renderSummary();
  renderBudget(expense);
  renderDonut(expense);
  renderHistory();
}

// ---------- INIT ----------
initTheme();
render();
