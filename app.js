// ---------- STATE ----------
const STORAGE_KEY = "expense-tracker:transactions";
const BUDGET_KEY = "expense-tracker:budget";

let transactions = loadTransactions();
let budget = loadBudget();
let selectedType = "expense";

// ---------- ELEMENTS ----------
const form = document.getElementById("transactionForm");
const nameInput = document.getElementById("txName");
const amountInput = document.getElementById("txAmount");
const categorySelect = document.getElementById("txCategory");
const formError = document.getElementById("formError");
const typeButtons = document.querySelectorAll(".type-btn");

const balanceFigure = document.getElementById("balanceFigure");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");

const budgetDisplay = document.getElementById("budgetDisplay");
const budgetForm = document.getElementById("budgetForm");
const budgetInput = document.getElementById("budgetInput");
const editBudgetBtn = document.getElementById("editBudgetBtn");

const txList = document.getElementById("txList");
const emptyState = document.getElementById("emptyState");
const historyCount = document.getElementById("historyCount");

// ---------- STORAGE HELPERS ----------
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function loadBudget() {
  try {
    const raw = localStorage.getItem(BUDGET_KEY);
    return raw ? parseFloat(raw) : null;
  } catch {
    return null;
  }
}

function saveBudget() {
  if (budget === null) {
    localStorage.removeItem(BUDGET_KEY);
  } else {
    localStorage.setItem(BUDGET_KEY, String(budget));
  }
}

// ---------- TYPE TOGGLE ----------
typeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedType = btn.dataset.type;
    typeButtons.forEach((b) => {
      const isActive = b === btn;
      b.classList.toggle("is-active", isActive);
      b.setAttribute("aria-checked", String(isActive));
    });
  });
});

// ---------- ADD TRANSACTION ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;

  if (!name || isNaN(amount) || amount <= 0) {
    formError.classList.remove("hidden");
    return;
  }
  formError.classList.add("hidden");

  transactions.unshift({
    id: Date.now(),
    name,
    amount,
    category: category || "other",
    type: selectedType,
    date: new Date().toISOString(),
  });

  saveTransactions();
  render();
  form.reset();
  categorySelect.value = "";
  nameInput.focus();
});

// ---------- DELETE TRANSACTION ----------
txList.addEventListener("click", (e) => {
  const btn = e.target.closest(".tx-delete");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  transactions = transactions.filter((t) => t.id !== id);
  saveTransactions();
  render();
});

// ---------- BUDGET ----------
editBudgetBtn.addEventListener("click", () => {
  budgetInput.value = budget ?? "";
  budgetForm.classList.remove("hidden");
  budgetDisplay.classList.add("hidden");
  budgetInput.focus();
});

budgetForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = parseFloat(budgetInput.value);
  budget = isNaN(value) || value <= 0 ? null : value;
  saveBudget();
  budgetForm.classList.add("hidden");
  budgetDisplay.classList.remove("hidden");
  render();
});

// ---------- RENDER ----------
function formatMoney(n) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function render() {
  const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  balanceFigure.textContent = formatMoney(balance);
  totalIncomeEl.textContent = formatMoney(income);
  totalExpenseEl.textContent = formatMoney(expense);

  renderBudget(expense);
  renderHistory();
}

function renderBudget(expense) {
  if (budget === null) {
    budgetDisplay.innerHTML = `<p class="budget-empty">No budget set yet.</p>`;
    return;
  }

  const pct = Math.min((expense / budget) * 100, 100);
  const overBy = expense - budget;
  let fillClass = "";
  let note = `${formatMoney(Math.max(budget - expense, 0))} left this month`;
  let noteClass = "";

  if (expense > budget) {
    fillClass = "is-over";
    note = `${formatMoney(overBy)} over budget`;
    noteClass = "is-over";
  } else if (pct >= 80) {
    fillClass = "is-warn";
  }

  budgetDisplay.innerHTML = `
    <div class="budget-numbers">
      <span class="spent">${formatMoney(expense)} spent</span>
      <span class="limit">of ${formatMoney(budget)}</span>
    </div>
    <div class="budget-track">
      <div class="budget-fill ${fillClass}" style="width:${pct}%"></div>
    </div>
    <p class="budget-note ${noteClass}">${note}</p>
  `;
}

function renderHistory() {
  historyCount.textContent = `${transactions.length} ${transactions.length === 1 ? "entry" : "entries"}`;

  if (transactions.length === 0) {
    emptyState.hidden = false;
    txList.hidden = true;
    txList.innerHTML = "";
    return;
  }

  emptyState.hidden = true;
  txList.hidden = false;

  txList.innerHTML = transactions
    .map((t) => `
      <li class="tx-row is-${t.type}">
        <span class="tx-sign">${t.type === "income" ? "+" : "−"}</span>
        <div class="tx-main">
          <p class="tx-name">${escapeHtml(t.name)}</p>
          <p class="tx-meta">${t.category} · ${formatDate(t.date)}</p>
        </div>
        <span class="tx-amount">${formatMoney(t.amount)}</span>
        <button class="tx-delete" data-id="${t.id}" aria-label="Delete ${escapeHtml(t.name)}">✕</button>
      </li>
    `)
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- INIT ----------
render();
