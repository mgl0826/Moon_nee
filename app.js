/*************************************************
 * 우리 가계부
 * Frontend JavaScript
 * 4~6단계 통합본
 *************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbxna8JVLRbMl4djjr71GkP0s9uwr3sshPH4dy0-NCKvoL2W3xqISsHJHlPXe-VFJy6s/exec";


/*************************************************
 * 전역 데이터
 *************************************************/

let categories = [];
let currentTransactions = [];
let currentAssets = [];
let currentDebts = [];
let recurringItems = [];


/*************************************************
 * 공통 DOM
 *************************************************/

const $ = id =>
  document.getElementById(id);


/*************************************************
 * 초기 실행
 *************************************************/

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setDefaultDates();
    bindNavigation();
    bindEvents();

    updatePaymentVisibility(
      "transactionType",
      "paymentMethodGroup"
    );

    updatePaymentVisibility(
      "editTransactionType",
      "editPaymentMethodGroup"
    );

    updatePaymentVisibility(
      "recurringType",
      "recurringPaymentMethodGroup"
    );

    try {

      await loadCategories();

      await Promise.all([
        loadDashboard(),
        loadRecurringTransactions()
      ]);

    } catch (error) {

      console.error(error);

    }

  }
);


/*************************************************
 * 기본 날짜
 *************************************************/

function setDefaultDates() {

  const today = new Date();

  $("transactionDate").value =
    formatDateForInput(today);

  $("recurringStartDate").value =
    formatDateForInput(today);

  $("dashboardYear").value =
    today.getFullYear();

  $("dashboardMonth").value =
    today.getMonth() + 1;

}


/*************************************************
 * 메뉴
 *************************************************/

function bindNavigation() {

  document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const pageId =
            button.dataset.page;

          showPage(pageId);

          if (
            pageId === "dashboardPage"
          ) {
            await loadDashboard();
          }

          if (
            pageId === "recurringPage"
          ) {
            await loadRecurringTransactions();
          }

        }
      );

    });

}


function showPage(pageId) {

  document
    .querySelectorAll(".page")
    .forEach(page =>
      page.classList.remove("active")
    );

  document
    .querySelectorAll(".nav-btn")
    .forEach(button =>
      button.classList.remove("active")
    );

  $(pageId).classList.add("active");

  const button =
    document.querySelector(
      `[data-page="${pageId}"]`
    );

  if (button) {
    button.classList.add("active");
  }

}


/*************************************************
 * 이벤트
 *************************************************/

function bindEvents() {

  $("transactionType")
    .addEventListener(
      "change",
      () => {

        updatePaymentVisibility(
          "transactionType",
          "paymentMethodGroup"
        );

        renderTransactionCategories();

      }
    );


  $("showCategoryButton")
    .addEventListener(
      "click",
      toggleCategoryBox
    );


  $("addCategoryButton")
    .addEventListener(
      "click",
      addCategory
    );


  $("transactionForm")
    .addEventListener(
      "submit",
      submitTransaction
    );


  $("refreshDashboardButton")
    .addEventListener(
      "click",
      loadDashboard
    );


  $("previousMonthButton")
    .addEventListener(
      "click",
      () => moveDashboardMonth(-1)
    );


  $("nextMonthButton")
    .addEventListener(
      "click",
      () => moveDashboardMonth(1)
    );


  $("budgetForm")
    .addEventListener(
      "submit",
      saveBudget
    );


  $("transactionFilterType")
    .addEventListener(
      "change",
      () => {

        renderTransactionFilterCategories();
        renderTransactionList();

      }
    );


  $("transactionFilterCategory")
    .addEventListener(
      "change",
      renderTransactionList
    );


  $("transactionTableBody")
    .addEventListener(
      "click",
      handleTransactionTableClick
    );


  $("editTransactionType")
    .addEventListener(
      "change",
      () => {

        renderEditTransactionCategories();

        updatePaymentVisibility(
          "editTransactionType",
          "editPaymentMethodGroup"
        );

      }
    );


  $("editTransactionForm")
    .addEventListener(
      "submit",
      submitTransactionEdit
    );


  $("deleteTransactionButton")
    .addEventListener(
      "click",
      deleteCurrentTransaction
    );


  $("closeEditModalButton")
    .addEventListener(
      "click",
      closeTransactionEditModal
    );


  $("cancelEditTransactionButton")
    .addEventListener(
      "click",
      closeTransactionEditModal
    );


  $("assetForm")
    .addEventListener(
      "submit",
      addAsset
    );


  $("assetList")
    .addEventListener(
      "click",
      handleAssetListClick
    );


  $("editAssetForm")
    .addEventListener(
      "submit",
      submitAssetEdit
    );


  $("deleteAssetButton")
    .addEventListener(
      "click",
      deleteCurrentAsset
    );


  $("closeAssetModalButton")
    .addEventListener(
      "click",
      closeAssetEditModal
    );


  $("cancelAssetEditButton")
    .addEventListener(
      "click",
      closeAssetEditModal
    );


  $("debtForm")
    .addEventListener(
      "submit",
      addDebt
    );


  $("debtList")
    .addEventListener(
      "click",
      handleDebtListClick
    );


  $("editDebtForm")
    .addEventListener(
      "submit",
      submitDebtEdit
    );


  $("deleteDebtButton")
    .addEventListener(
      "click",
      deleteCurrentDebt
    );


  $("closeDebtModalButton")
    .addEventListener(
      "click",
      closeDebtEditModal
    );


  $("cancelDebtEditButton")
    .addEventListener(
      "click",
      closeDebtEditModal
    );


  $("recurringType")
    .addEventListener(
      "change",
      () => {

        renderRecurringCategories();

        updatePaymentVisibility(
          "recurringType",
          "recurringPaymentMethodGroup"
        );

      }
    );


  $("recurringForm")
    .addEventListener(
      "submit",
      saveRecurringTransaction
    );


  $("cancelRecurringEditButton")
    .addEventListener(
      "click",
      resetRecurringForm
    );


  $("recurringTableBody")
    .addEventListener(
      "click",
      handleRecurringTableClick
    );


  document
    .querySelectorAll(".modal-backdrop")
    .forEach(backdrop => {

      backdrop.addEventListener(
        "click",
        event => {

          const type =
            event.currentTarget.dataset.closeModal;

          if (type === "transaction") {
            closeTransactionEditModal();
          }

          if (type === "asset") {
            closeAssetEditModal();
          }

          if (type === "debt") {
            closeDebtEditModal();
          }

        }
      );

    });


  document.addEventListener(
    "keydown",
    event => {

      if (event.key !== "Escape") {
        return;
      }

      closeTransactionEditModal();
      closeAssetEditModal();
      closeDebtEditModal();

    }
  );

}


/*************************************************
 * 월 이동
 *************************************************/

async function moveDashboardMonth(offset) {

  let year =
    Number(
      $("dashboardYear").value
    );

  let month =
    Number(
      $("dashboardMonth").value
    );

  month += offset;

  if (month < 1) {
    month = 12;
    year--;
  }

  if (month > 12) {
    month = 1;
    year++;
  }

  $("dashboardYear").value =
    year;

  $("dashboardMonth").value =
    month;

  await loadDashboard();

}


/*************************************************
 * 결제수단 표시
 *************************************************/

function updatePaymentVisibility(
  typeId,
  groupId
) {

  $(groupId)
    .classList
    .toggle(
      "hidden",
      $(typeId).value !== "지출"
    );

}


/*************************************************
 * 카테고리
 *************************************************/

async function loadCategories() {

  const response =
    await apiGet(
      "getCategories"
    );

  categories =
    response.data || [];

  renderTransactionCategories();
  renderBudgetCategories();
  renderTransactionFilterCategories();
  renderEditTransactionCategories();
  renderRecurringCategories();

}


function fillCategorySelect(
  select,
  type,
  emptyText,
  selected = ""
) {

  const items =
    categories.filter(
      item =>
        item.type === type
    );

  select.innerHTML = "";

  if (!items.length) {

    const option =
      document.createElement(
        "option"
      );

    option.value = "";
    option.textContent =
      emptyText;

    select.appendChild(option);

    return;

  }

  items.forEach(item => {

    const option =
      document.createElement(
        "option"
      );

    option.value =
      item.category;

    option.textContent =
      item.category;

    select.appendChild(option);

  });

  if (
    selected &&
    items.some(
      item =>
        item.category === selected
    )
  ) {
    select.value = selected;
  }

}


function renderTransactionCategories() {

  fillCategorySelect(
    $("transactionCategory"),
    $("transactionType").value,
    "카테고리를 추가해주세요"
  );

}


function renderBudgetCategories() {

  fillCategorySelect(
    $("budgetCategory"),
    "지출",
    "지출 카테고리가 없습니다"
  );

}


function renderEditTransactionCategories(
  selected = ""
) {

  fillCategorySelect(
    $("editTransactionCategory"),
    $("editTransactionType").value,
    "카테고리가 없습니다",
    selected
  );

}


function renderRecurringCategories(
  selected = ""
) {

  fillCategorySelect(
    $("recurringCategory"),
    $("recurringType").value,
    "카테고리가 없습니다",
    selected
  );

}


function renderTransactionFilterCategories() {

  const type =
    $("transactionFilterType").value;

  const select =
    $("transactionFilterCategory");

  const previous =
    select.value;

  select.innerHTML =
    '<option value="">전체 카테고리</option>';

  const names =
    categories
      .filter(
        item =>
          !type ||
          item.type === type
      )
      .map(
        item =>
          item.category
      );

  [...new Set(names)]
    .sort(
      (a, b) =>
        a.localeCompare(
          b,
          "ko"
        )
    )
    .forEach(name => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        name;

      option.textContent =
        name;

      select.appendChild(
        option
      );

    });

  if (
    [...select.options]
      .some(
        option =>
          option.value === previous
      )
  ) {
    select.value = previous;
  }

}


/*************************************************
 * 카테고리 추가
 *************************************************/

function toggleCategoryBox() {

  $("categoryAddBox")
    .classList
    .toggle("hidden");

  if (
    !$("categoryAddBox")
      .classList
      .contains("hidden")
  ) {
    $("newCategory").focus();
  }

}


async function addCategory() {

  const type =
    $("transactionType").value;

  const category =
    $("newCategory")
      .value
      .trim();

  if (!category) {

    alert(
      "카테고리명을 입력해주세요."
    );

    return;

  }

  try {

    await apiPost(
      "addCategory",
      {
        type,
        category
      }
    );

    $("newCategory").value =
      "";

    $("categoryAddBox")
      .classList
      .add("hidden");

    await loadCategories();

    $("transactionCategory").value =
      category;

  } catch (error) {

    alert(error.message);

  }

}


/*************************************************
 * 거래 등록
 *************************************************/

async function submitTransaction(
  event
) {

  event.preventDefault();

  clearMessage(
    $("transactionMessage")
  );

  const type =
    $("transactionType").value;

  const data = {

    date:
      $("transactionDate").value,

    type,

    category:
      $("transactionCategory").value,

    paymentMethod:
      type === "지출"
        ? $("paymentMethod").value
        : "",

    amount:
      Number(
        $("transactionAmount").value
      ),

    memo:
      $("transactionMemo")
        .value
        .trim()

  };

  try {

    await apiPost(
      "addTransaction",
      data
    );

    showMessage(
      $("transactionMessage"),
      "거래가 등록되었습니다.",
      "success"
    );

    $("transactionAmount").value =
      "";

    $("transactionMemo").value =
      "";

  } catch (error) {

    showMessage(
      $("transactionMessage"),
      error.message,
      "error"
    );

  }

}


/*************************************************
 * 대시보드 조회
 *************************************************/

async function loadDashboard() {

  const year =
    Number(
      $("dashboardYear").value
    );

  const month =
    Number(
      $("dashboardMonth").value
    );

  try {

    const [
      dashboard,
      transactions,
      stats,
      trend,
      debts
    ] =
      await Promise.all([

        apiGet(
          "getDashboard",
          {
            year,
            month
          }
        ),

        apiGet(
          "getTransactions",
          {
            year,
            month
          }
        ),

        apiGet(
          "getDashboardStats",
          {
            year,
            month
          }
        ),

        apiGet(
          "getMonthlyTrend",
          {
            year,
            month,
            count: 6
          }
        ),

        apiGet(
          "getDebts"
        )

      ]);


    renderDashboard(
      dashboard.data || {}
    );


    currentTransactions =
      transactions.data || [];

    currentDebts =
      debts.data || [];


    renderTransactionFilterCategories();
    renderTransactionList();

    renderDashboardStats(
      stats.data || {}
    );

    renderExpenseDonutChart(
      dashboard.data
        ?.expenseCategories ||
      []
    );

    renderMonthlyTrendChart(
      trend.data || []
    );

    renderDebts(
      currentDebts
    );

    renderWealthSummary();

  } catch (error) {

    console.error(error);

    alert(
      "대시보드 조회 실패\n" +
      error.message
    );

  }

}


/*************************************************
 * 대시보드 렌더링
 *************************************************/

function renderDashboard(data) {

  const summary =
    data.summary || {};

  $("totalIncome").textContent =
    formatMoney(
      summary.income
    );

  $("totalExpense").textContent =
    formatMoney(
      summary.expense
    );

  $("totalSaving").textContent =
    formatMoney(
      summary.saving
    );

  $("totalBalance").textContent =
    formatMoney(
      summary.balance
    );


  currentAssets =
    data.assets || [];


  renderExpenseCategories(
    data.expenseCategories || []
  );

  renderBudgets(
    data.budgets || []
  );

  renderBudgetOverview(
    data.budgets || []
  );

  renderAssets(
    currentAssets
  );

  renderAssetSummaryByCategory(
    currentAssets
  );

  renderWealthSummary();

}


/*************************************************
 * 핵심 통계
 *************************************************/

function renderDashboardStats(
  stats
) {

  const rate =
    stats.expenseChangeRate;

  $("expenseChangeRate")
    .textContent =
      rate === null ||
      rate === undefined
        ? "-"
        : (
            `${rate > 0 ? "+" : ""}` +
            `${formatPercent(rate)}%`
          );


  $("previousExpenseText")
    .textContent =
      `전월 ${
        formatMoney(
          stats.previousExpense || 0
        )
      }`;


  $("dailyExpenseAverage")
    .textContent =
      formatMoney(
        stats.dailyExpenseAverage || 0
      );


  $("topExpenseCategory")
    .textContent =
      stats.topExpenseCategory ||
      "-";


  $("topExpenseAmount")
    .textContent =
      formatMoney(
        stats.topExpenseAmount || 0
      );


  $("savingRate")
    .textContent =
      `${formatPercent(
        stats.savingRate || 0
      )}%`;

}


/*************************************************
 * 지출 카테고리
 *************************************************/

function renderExpenseCategories(
  items
) {

  const container =
    $("expenseCategoryList");

  container.innerHTML =
    "";

  if (!items.length) {

    container.innerHTML =
      '<div class="empty-message">' +
      '이번 달 지출내역이 없습니다.' +
      '</div>';

    return;

  }

  items.forEach(item => {

    const row =
      document.createElement(
        "div"
      );

    row.className =
      "data-row";

    row.innerHTML = `
      <span>
        ${escapeHtml(item.category)}
      </span>

      <strong>
        ${formatMoney(item.amount)}
      </strong>
    `;

    container.appendChild(row);

  });

}


/*************************************************
 * 지출 도넛 차트
 *************************************************/

function renderExpenseDonutChart(
  items
) {

  const container =
    $("expenseDonutChart");

  container.innerHTML =
    "";

  const total =
    items.reduce(
      (sum, item) =>
        sum +
        Number(
          item.amount || 0
        ),
      0
    );

  if (
    !items.length ||
    total <= 0
  ) {

    container.innerHTML =
      '<div class="empty-message">' +
      '지출 데이터가 없습니다.' +
      '</div>';

    return;

  }


  const shades = [
    "#222",
    "#444",
    "#666",
    "#888",
    "#aaa",
    "#bbb",
    "#ccc",
    "#ddd"
  ];

  let degree = 0;

  const segments =
    items.map(
      (item, index) => {

        const ratio =
          Number(
            item.amount || 0
          ) /
          total;

        const start =
          degree;

        degree +=
          ratio * 360;

        return (
          `${shades[
            index %
            shades.length
          ]} ` +
          `${start}deg ` +
          `${degree}deg`
        );

      }
    );


  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "donut-layout";


  const donut =
    document.createElement(
      "div"
    );

  donut.className =
    "donut-visual";

  donut.style.background =
    `conic-gradient(${segments.join(",")})`;


  const legend =
    document.createElement(
      "div"
    );

  legend.className =
    "chart-legend";


  items.forEach(
    (item, index) => {

      const percent =
        (
          Number(
            item.amount || 0
          ) /
          total
        ) * 100;

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "chart-legend-item";

      row.innerHTML = `
        <span class="chart-legend-name">

          <span
            class="chart-dot"
            style="background:${
              shades[
                index %
                shades.length
              ]
            }"
          ></span>

          ${escapeHtml(item.category)}

        </span>

        <strong>
          ${formatPercent(percent)}%
        </strong>
      `;

      legend.appendChild(row);

    }
  );


  wrapper.appendChild(
    donut
  );

  wrapper.appendChild(
    legend
  );

  container.appendChild(
    wrapper
  );

}


/*************************************************
 * 6개월 추이
 *************************************************/

function renderMonthlyTrendChart(
  items
) {

  const container =
    $("monthlyTrendChart");

  container.innerHTML =
    "";

  if (!items.length) {

    container.innerHTML =
      '<div class="empty-message">' +
      '월별 데이터가 없습니다.' +
      '</div>';

    return;

  }


  const maxValue =
    Math.max(
      1,
      ...items.flatMap(
        item => [
          Number(
            item.income || 0
          ),
          Number(
            item.expense || 0
          )
        ]
      )
    );


  const chart =
    document.createElement(
      "div"
    );

  chart.className =
    "bar-chart";


  items.forEach(item => {

    const column =
      document.createElement(
        "div"
      );

    column.className =
      "bar-column";


    const pair =
      document.createElement(
        "div"
      );

    pair.className =
      "bar-pair";


    const income =
      document.createElement(
        "div"
      );

    income.className =
      "bar";

    income.style.height =
      `${
        Math.max(
          2,
          Number(
            item.income || 0
          ) /
          maxValue *
          100
        )
      }%`;

    income.title =
      `수입 ${
        formatMoney(
          item.income
        )
      }`;


    const expense =
      document.createElement(
        "div"
      );

    expense.className =
      "bar secondary";

    expense.style.height =
      `${
        Math.max(
          2,
          Number(
            item.expense || 0
          ) /
          maxValue *
          100
        )
      }%`;

    expense.title =
      `지출 ${
        formatMoney(
          item.expense
        )
      }`;


    pair.appendChild(
      income
    );

    pair.appendChild(
      expense
    );


    const label =
      document.createElement(
        "div"
      );

    label.className =
      "bar-label";

    label.textContent =
      item.label ||
      `${item.month}월`;


    column.appendChild(
      pair
    );

    column.appendChild(
      label
    );

    chart.appendChild(
      column
    );

  });


  const caption =
    document.createElement(
      "div"
    );

  caption.className =
    "chart-caption";

  caption.innerHTML = `
    <span>
      <span
        class="chart-dot"
        style="background:#333"
      ></span>
      수입
    </span>

    <span>
      <span
        class="chart-dot"
        style="background:#999"
      ></span>
      지출
    </span>
  `;


  container.appendChild(
    chart
  );

  container.appendChild(
    caption
  );

}


/*************************************************
 * 전체 예산
 *************************************************/

function renderBudgetOverview(
  items
) {

  const totalBudget =
    items.reduce(
      (sum, item) =>
        sum +
        Number(
          item.budget || 0
        ),
      0
    );


  const totalUsed =
    items.reduce(
      (sum, item) =>
        sum +
        Number(
          item.used || 0
        ),
      0
    );


  const remaining =
    totalBudget -
    totalUsed;


  const rate =
    totalBudget > 0
      ? (
          totalUsed /
          totalBudget
        ) * 100
      : 0;


  $("totalBudgetAmount")
    .textContent =
      formatMoney(
        totalBudget
      );


  $("totalBudgetUsed")
    .textContent =
      formatMoney(
        totalUsed
      );


  $("totalBudgetRemaining")
    .textContent =
      formatMoney(
        remaining
      );


  $("totalBudgetRemaining")
    .className =
      remaining < 0
        ? "negative"
        : "";


  $("totalBudgetRate")
    .textContent =
      `${formatPercent(rate)}%`;


  $("totalBudgetStatus")
    .textContent =
      getBudgetStatus(
        totalBudget,
        remaining
      );


  const progress =
    $("totalBudgetProgress");

  progress.style.width =
    `${
      Math.min(
        Math.max(
          rate,
          0
        ),
        100
      )
    }%`;

  progress.classList.toggle(
    "progress-over",
    rate > 100
  );

}


/*************************************************
 * 예산 저장
 *************************************************/

async function saveBudget(
  event
) {

  event.preventDefault();

  clearMessage(
    $("budgetMessage")
  );

  const data = {

    year:
      Number(
        $("dashboardYear").value
      ),

    month:
      Number(
        $("dashboardMonth").value
      ),

    category:
      $("budgetCategory").value,

    amount:
      Number(
        $("budgetAmount").value
      )

  };

  try {

    await apiPost(
      "saveBudget",
      data
    );

    showMessage(
      $("budgetMessage"),
      "예산이 저장되었습니다.",
      "success"
    );

    $("budgetAmount").value =
      "";

    await loadDashboard();

  } catch (error) {

    showMessage(
      $("budgetMessage"),
      error.message,
      "error"
    );

  }

}


/*************************************************
 * 예산 목록
 *************************************************/

function renderBudgets(
  items
) {

  const tbody =
    $("budgetTableBody");

  tbody.innerHTML =
    "";

  if (!items.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="empty-message"
        >
          설정된 예산이 없습니다.
        </td>
      </tr>
    `;

    return;

  }


  items.forEach(item => {

    const budget =
      Number(
        item.budget || 0
      );

    const used =
      Number(
        item.used || 0
      );

    const remaining =
      Number(
        item.remaining || 0
      );

    const rate =
      budget > 0
        ? (
            used /
            budget
          ) * 100
        : 0;


    const status =
      item.status ||
      getBudgetStatus(
        budget,
        remaining
      );


    const row =
      document.createElement(
        "tr"
      );

    row.innerHTML = `
      <td>
        ${escapeHtml(item.category)}
      </td>

      <td>
        ${formatMoney(budget)}
      </td>

      <td>
        ${formatMoney(used)}
      </td>

      <td class="${
        remaining < 0
          ? "negative"
          : ""
      }">
        ${formatMoney(remaining)}
      </td>

      <td class="budget-progress-cell">

        <span class="budget-rate-text">
          ${formatPercent(rate)}%
        </span>

        <div class="progress-track">

          <div
            class="progress-fill ${
              rate > 100
                ? "progress-over"
                : ""
            }"
            style="
              width:${
                Math.min(
                  Math.max(
                    rate,
                    0
                  ),
                  100
                )
              }%
            "
          ></div>

        </div>

      </td>

      <td class="warning-text">
        ${escapeHtml(status)}
      </td>
    `;

    tbody.appendChild(
      row
    );

  });

}


function getBudgetStatus(
  budget,
  remaining
) {

  if (budget <= 0) {
    return "";
  }

  if (remaining < 0) {
    return "늠쳤따옹!";
  }

  if (remaining === 0) {
    return "다썼따옹!";
  }

  if (
    remaining <=
    budget * 0.2
  ) {
    return "을마안남았따옹!";
  }

  return "";

}


/*************************************************
 * 거래내역
 *************************************************/

function renderTransactionList() {

  const type =
    $("transactionFilterType")
      .value;

  const category =
    $("transactionFilterCategory")
      .value;


  const filtered =
    currentTransactions.filter(
      item => {

        if (
          type &&
          item.type !== type
        ) {
          return false;
        }

        if (
          category &&
          item.category !== category
        ) {
          return false;
        }

        return true;

      }
    );


  $("transactionCount")
    .textContent =
      `${filtered.length}건`;


  const tbody =
    $("transactionTableBody");

  tbody.innerHTML =
    "";


  if (!filtered.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="empty-message"
        >
          조건에 맞는 거래내역이 없습니다.
        </td>
      </tr>
    `;

    return;

  }


  filtered.forEach(item => {

    const row =
      document.createElement(
        "tr"
      );

    row.innerHTML = `
      <td>
        ${escapeHtml(item.date)}
      </td>

      <td>
        <span class="type-badge">
          ${escapeHtml(item.type)}
        </span>
      </td>

      <td>
        ${escapeHtml(item.category)}
      </td>

      <td>
        ${escapeHtml(
          item.paymentMethod ||
          "-"
        )}
      </td>

      <td>
        <strong>
          ${formatMoney(item.amount)}
        </strong>
      </td>

      <td>
        ${escapeHtml(
          item.memo ||
          "-"
        )}
      </td>

      <td>
        <button
          type="button"
          class="table-action-btn"
          data-action="edit-transaction"
          data-id="${escapeHtml(item.id)}"
        >
          수정
        </button>
      </td>
    `;

    tbody.appendChild(
      row
    );

  });

}


/*************************************************
 * 거래 수정
 *************************************************/

function handleTransactionTableClick(
  event
) {

  const button =
    event.target.closest(
      '[data-action="edit-transaction"]'
    );

  if (!button) {
    return;
  }

  openTransactionEditModal(
    button.dataset.id
  );

}


function openTransactionEditModal(
  id
) {

  const item =
    currentTransactions.find(
      transaction =>
        transaction.id === id
    );

  if (!item) {

    alert(
      "거래내역을 찾을 수 없습니다."
    );

    return;

  }


  $("editTransactionId").value =
    item.id;

  $("editTransactionDate").value =
    item.date;

  $("editTransactionType").value =
    item.type;

  renderEditTransactionCategories(
    item.category
  );

  $("editPaymentMethod").value =
    item.paymentMethod ||
    "카드";

  $("editTransactionAmount").value =
    item.amount;

  $("editTransactionMemo").value =
    item.memo || "";


  updatePaymentVisibility(
    "editTransactionType",
    "editPaymentMethodGroup"
  );

  clearMessage(
    $("editTransactionMessage")
  );

  openModal(
    "transactionEditModal"
  );

}


function closeTransactionEditModal() {

  closeModal(
    "transactionEditModal"
  );

}


async function submitTransactionEdit(
  event
) {

  event.preventDefault();

  const type =
    $("editTransactionType")
      .value;

  const data = {

    id:
      $("editTransactionId").value,

    date:
      $("editTransactionDate").value,

    type,

    category:
      $("editTransactionCategory")
        .value,

    paymentMethod:
      type === "지출"
        ? $("editPaymentMethod").value
        : "",

    amount:
      Number(
        $("editTransactionAmount")
          .value
      ),

    memo:
      $("editTransactionMemo")
        .value
        .trim()

  };


  try {

    await apiPost(
      "updateTransaction",
      data
    );

    closeTransactionEditModal();

    await loadDashboard();

  } catch (error) {

    showMessage(
      $("editTransactionMessage"),
      error.message,
      "error"
    );

  }

}


async function deleteCurrentTransaction() {

  const id =
    $("editTransactionId")
      .value;

  if (!id) {
    return;
  }

  if (
    !confirm(
      "이 거래를 삭제할까요?"
    )
  ) {
    return;
  }

  try {

    await apiPost(
      "deleteTransaction",
      {
        id
      }
    );

    closeTransactionEditModal();

    await loadDashboard();

  } catch (error) {

    showMessage(
      $("editTransactionMessage"),
      error.message,
      "error"
    );

  }

}


/*************************************************
 * 자산
 *************************************************/

async function addAsset(
  event
) {

  event.preventDefault();

  const data = {

    category:
      $("assetCategory").value,

    name:
      $("assetName")
        .value
        .trim(),

    amount:
      Number(
        $("assetAmount").value
      )

  };

  try {

    await apiPost(
      "addAsset",
      data
    );

    showMessage(
      $("assetMessage"),
      "자산이 등록되었습니다.",
      "success"
    );

    $("assetName").value =
      "";

    $("assetAmount").value =
      "";

    await loadDashboard();

  } catch (error) {

    showMessage(
      $("assetMessage"),
      error.message,
      "error"
    );

  }

}


function renderAssets(items) {

  const container =
    $("assetList");

  container.innerHTML =
    "";

  if (!items.length) {

    container.innerHTML =
      '<div class="empty-message">' +
      '등록된 자산이 없습니다.' +
      '</div>';

    return;

  }


  items.forEach(item => {

    const row =
      document.createElement(
        "div"
      );

    row.className =
      "data-row";

    row.innerHTML = `
      <div class="item-main">

        <div class="item-title">
          ${escapeHtml(item.name)}
        </div>

        <div class="item-sub">
          ${escapeHtml(item.category)}
        </div>

      </div>

      <div class="item-actions">

        <strong>
          ${formatMoney(item.amount)}
        </strong>

        <button
          type="button"
          class="table-action-btn"
          data-action="edit-asset"
          data-id="${escapeHtml(item.id)}"
        >
          수정
        </button>

      </div>
    `;

    container.appendChild(
      row
    );

  });

}


function renderAssetSummaryByCategory(
  items
) {

  const container =
    $("assetSummaryByCategory");

  container.innerHTML =
    "";

  if (!items.length) {

    container.classList.add(
      "hidden"
    );

    return;

  }


  const totals = {};

  items.forEach(item => {

    totals[item.category] =
      (
        totals[item.category] ||
        0
      ) +
      Number(
        item.amount || 0
      );

  });


  container.classList.remove(
    "hidden"
  );


  Object.entries(totals)
    .sort(
      (
        [, a],
        [, b]
      ) =>
        b - a
    )
    .forEach(
      ([category, amount]) => {

        const row =
          document.createElement(
            "div"
          );

        row.className =
          "mini-summary-row";

        row.innerHTML = `
          <span>
            ${escapeHtml(category)}
          </span>

          <strong>
            ${formatMoney(amount)}
          </strong>
        `;

        container.appendChild(
          row
        );

      }
    );

}


function handleAssetListClick(
  event
) {

  const button =
    event.target.closest(
      '[data-action="edit-asset"]'
    );

  if (!button) {
    return;
  }

  openAssetEditModal(
    button.dataset.id
  );

}


function openAssetEditModal(id) {

  const item =
    currentAssets.find(
      asset =>
        asset.id === id
    );

  if (!item) {

    alert(
      "자산을 찾을 수 없습니다."
    );

    return;

  }

  $("editAssetId").value =
    item.id;

  $("editAssetCategory").value =
    item.category;

  $("editAssetName").value =
    item.name;

  $("editAssetAmount").value =
    item.amount;

  clearMessage(
    $("editAssetMessage")
  );

  openModal(
    "assetEditModal"
  );

}


function closeAssetEditModal() {

  closeModal(
    "assetEditModal"
  );

}


async function submitAssetEdit(
  event
) {

  event.preventDefault();

  const data = {

    id:
      $("editAssetId").value,

    category:
      $("editAssetCategory").value,

    name:
      $("editAssetName")
        .value
        .trim(),

    amount:
      Number(
        $("editAssetAmount").value
      )

  };

  try {

    await apiPost(
      "updateAsset",
      data
    );

    closeAssetEditModal();

    await loadDashboard();

  } catch (error) {

    showMessage(
      $("editAssetMessage"),
      error.message,
      "error"
    );

  }

}


async function deleteCurrentAsset() {

  const id =
    $("editAssetId").value;

  if (
    !id ||
    !confirm(
      "이 자산을 삭제할까요?"
    )
  ) {
    return;
  }

  try {

    await apiPost(
      "deleteAsset",
      {
        id
      }
    );

    closeAssetEditModal();

    await loadDashboard();

  } catch (error) {

    showMessage(
      $("editAssetMessage"),
      error.message,
      "error"
    );

  }

}


/*************************************************
 * 부채
 *************************************************/

async function addDebt(
  event
) {

  event.preventDefault();

  const data = {

    category:
      $("debtCategory").value,

    name:
      $("debtName")
        .value
        .trim(),

    amount:
      Number(
        $("debtAmount").value
      )

  };

  try {

    await apiPost(
      "addDebt",
      data
    );

    showMessage(
      $("debtMessage"),
      "부채가 등록되었습니다.",
      "success"
    );

    $("debtName").value =
      "";

    $("debtAmount").value =
      "";

    await loadDashboard();

  } catch (error) {

    showMessage(
      $("debtMessage"),
      error.message,
      "error"
    );

  }

}


function renderDebts(items) {

  const container =
    $("debtList");

  container.innerHTML =
    "";

  if (!items.length) {

    container.innerHTML =
      '<div class="empty-message">' +
      '등록된 부채가 없습니다.' +
      '</div>';

    return;

  }


  items.forEach(item => {

    const row =
      document.createElement(
        "div"
      );

    row.className =
      "data-row";

    row.innerHTML = `
      <div class="item-main">

        <div class="item-title">
          ${escapeHtml(item.name)}
        </div>

        <div class="item-sub">
          ${escapeHtml(item.category)}
        </div>

      </div>

      <div class="item-actions">

        <strong>
          ${formatMoney(item.amount)}
        </strong>

        <button
          type="button"
          class="table-action-btn"
          data-action="edit-debt"
          data-id="${escapeHtml(item.id)}"
        >
          수정
        </button>

      </div>
    `;

    container.appendChild(
      row
    );

  });

}


function handleDebtListClick(
  event
) {

  const button =
    event.target.closest(
      '[data-action="edit-debt"]'
    );

  if (!button) {
    return;
  }

  openDebtEditModal(
    button.dataset.id
  );

}


function openDebtEditModal(id) {

  const item =
    currentDebts.find(
      debt =>
        debt.id === id
    );

  if (!item) {

    alert(
      "부채를 찾을 수 없습니다."
    );

    return;

  }

  $("editDebtId").value =
    item.id;

  $("editDebtCategory").value =
    item.category;

  $("editDebtName").value =
    item.name;

  $("editDebtAmount").value =
    item.amount;

  clearMessage(
    $("editDebtMessage")
  );

  openModal(
    "debtEditModal"
  );

}


function closeDebtEditModal() {

  closeModal(
    "debtEditModal"
  );

}


async function submitDebtEdit(
  event
) {

  event.preventDefault();

  const data = {

    id:
      $("editDebtId").value,

    category:
      $("editDebtCategory").value,

    name:
      $("editDebtName")
        .value
        .trim(),

    amount:
      Number(
        $("editDebtAmount").value
      )

  };

  try {

    await apiPost(
      "updateDebt",
      data
    );

    closeDebtEditModal();

    await loadDashboard();

  } catch (error) {

    showMessage(
      $("editDebtMessage"),
      error.message,
      "error"
    );

  }

}


async function deleteCurrentDebt() {

  const id =
    $("editDebtId").value;

  if (
    !id ||
    !confirm(
      "이 부채를 삭제할까요?"
    )
  ) {
    return;
  }

  try {

    await apiPost(
      "deleteDebt",
      {
        id
      }
    );

    closeDebtEditModal();

    await loadDashboard();

  } catch (error) {

    showMessage(
      $("editDebtMessage"),
      error.message,
      "error"
    );

  }

}


/*************************************************
 * 자산 / 부채 / 순자산
 *************************************************/

function renderWealthSummary() {

  const totalAssets =
    currentAssets.reduce(
      (sum, item) =>
        sum +
        Number(
          item.amount || 0
        ),
      0
    );


  const totalDebts =
    currentDebts.reduce(
      (sum, item) =>
        sum +
        Number(
          item.amount || 0
        ),
      0
    );


  const netWorth =
    totalAssets -
    totalDebts;


  $("totalAssets").textContent =
    formatMoney(
      totalAssets
    );

  $("totalDebts").textContent =
    formatMoney(
      totalDebts
    );

  $("netWorth").textContent =
    formatMoney(
      netWorth
    );

  $("netWorthDetail").textContent =
    formatMoney(
      netWorth
    );


  $("netWorth").className =
    netWorth < 0
      ? "negative"
      : "";

  $("netWorthDetail").className =
    netWorth < 0
      ? "negative"
      : "";

}


/*************************************************
 * 반복거래 조회
 *************************************************/

async function loadRecurringTransactions() {

  try {

    const response =
      await apiGet(
        "getRecurringTransactions"
      );

    recurringItems =
      response.data || [];

    renderRecurringTable();

  } catch (error) {

    console.error(error);

  }

}


/*************************************************
 * 반복거래 저장
 *************************************************/

async function saveRecurringTransaction(
  event
) {

  event.preventDefault();

  const id =
    $("recurringId").value;

  const type =
    $("recurringType").value;


  const data = {

    id,

    frequency:
      $("recurringFrequency")
        .value,

    startDate:
      $("recurringStartDate")
        .value,

    type,

    category:
      $("recurringCategory")
        .value,

    paymentMethod:
      type === "지출"
        ? $("recurringPaymentMethod")
            .value
        : "",

    amount:
      Number(
        $("recurringAmount")
          .value
      ),

    memo:
      $("recurringMemo")
        .value
        .trim(),

    active:
      true

  };


  try {

    if (id) {

      await apiPost(
        "updateRecurringTransaction",
        data
      );

      showMessage(
        $("recurringMessage"),
        "반복거래가 수정되었습니다.",
        "success"
      );

    } else {

      await apiPost(
        "addRecurringTransaction",
        data
      );

      showMessage(
        $("recurringMessage"),
        "반복거래가 등록되었습니다.",
        "success"
      );

    }

    resetRecurringForm(false);

    await Promise.all([
      loadRecurringTransactions(),
      loadDashboard()
    ]);

  } catch (error) {

    showMessage(
      $("recurringMessage"),
      error.message,
      "error"
    );

  }

}


/*************************************************
 * 반복거래 목록
 *************************************************/

function renderRecurringTable() {

  const tbody =
    $("recurringTableBody");

  tbody.innerHTML =
    "";

  if (!recurringItems.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="8"
          class="empty-message"
        >
          등록된 반복거래가 없습니다.
        </td>
      </tr>
    `;

    return;

  }


  recurringItems.forEach(item => {

    const row =
      document.createElement(
        "tr"
      );

    row.innerHTML = `
      <td>
        <span class="frequency-badge">
          ${
            item.frequency ===
            "YEARLY"
              ? "매년"
              : "매월"
          }
        </span>
      </td>

      <td>
        ${escapeHtml(item.startDate)}
      </td>

      <td>
        <span class="type-badge">
          ${escapeHtml(item.type)}
        </span>
      </td>

      <td>
        ${escapeHtml(item.category)}
      </td>

      <td>
        ${formatMoney(item.amount)}
      </td>

      <td>
        ${escapeHtml(
          item.memo ||
          "-"
        )}
      </td>

      <td>
        <span class="status-badge">
          ${
            item.active === false
              ? "중지"
              : "사용"
          }
        </span>
      </td>

      <td>

        <button
          type="button"
          class="table-action-btn"
          data-action="edit-recurring"
          data-id="${escapeHtml(item.id)}"
        >
          수정
        </button>

        <button
          type="button"
          class="table-action-btn"
          data-action="delete-recurring"
          data-id="${escapeHtml(item.id)}"
        >
          삭제
        </button>

      </td>
    `;

    tbody.appendChild(
      row
    );

  });

}


/*************************************************
 * 반복거래 수정 / 삭제
 *************************************************/

function handleRecurringTableClick(
  event
) {

  const edit =
    event.target.closest(
      '[data-action="edit-recurring"]'
    );

  if (edit) {

    startRecurringEdit(
      edit.dataset.id
    );

    return;

  }


  const remove =
    event.target.closest(
      '[data-action="delete-recurring"]'
    );

  if (remove) {

    deleteRecurringTransaction(
      remove.dataset.id
    );

  }

}


function startRecurringEdit(id) {

  const item =
    recurringItems.find(
      recurring =>
        recurring.id === id
    );

  if (!item) {

    alert(
      "반복거래를 찾을 수 없습니다."
    );

    return;

  }


  $("recurringId").value =
    item.id;

  $("recurringFrequency").value =
    item.frequency;

  $("recurringStartDate").value =
    item.startDate;

  $("recurringType").value =
    item.type;


  renderRecurringCategories(
    item.category
  );


  $("recurringPaymentMethod").value =
    item.paymentMethod ||
    "카드";

  $("recurringAmount").value =
    item.amount;

  $("recurringMemo").value =
    item.memo || "";


  $("recurringSubmitText")
    .textContent =
      "반복거래 수정";


  $("cancelRecurringEditButton")
    .classList
    .remove("hidden");


  updatePaymentVisibility(
    "recurringType",
    "recurringPaymentMethodGroup"
  );


  $("recurringForm")
    .scrollIntoView({
      behavior:
        "smooth",
      block:
        "start"
    });

}


function resetRecurringForm(
  clearMessageToo = true
) {

  $("recurringId").value =
    "";

  $("recurringFrequency").value =
    "MONTHLY";

  $("recurringStartDate").value =
    formatDateForInput(
      new Date()
    );

  $("recurringType").value =
    "지출";

  renderRecurringCategories();

  $("recurringPaymentMethod").value =
    "카드";

  $("recurringAmount").value =
    "";

  $("recurringMemo").value =
    "";

  $("recurringSubmitText")
    .textContent =
      "반복거래 등록";

  $("cancelRecurringEditButton")
    .classList
    .add("hidden");


  updatePaymentVisibility(
    "recurringType",
    "recurringPaymentMethodGroup"
  );


  if (clearMessageToo) {

    clearMessage(
      $("recurringMessage")
    );

  }

}


async function deleteRecurringTransaction(
  id
) {

  if (
    !confirm(
      "이 반복거래를 삭제할까요?"
    )
  ) {
    return;
  }

  try {

    await apiPost(
      "deleteRecurringTransaction",
      {
        id
      }
    );

    await Promise.all([
      loadRecurringTransactions(),
      loadDashboard()
    ]);

  } catch (error) {

    alert(error.message);

  }

}


/*************************************************
 * 모달
 *************************************************/

function openModal(id) {

  $(id)
    .classList
    .remove("hidden");

  document.body
    .classList
    .add("modal-open");

}


function closeModal(id) {

  const modal =
    $(id);

  if (
    !modal ||
    modal.classList.contains(
      "hidden"
    )
  ) {
    return;
  }

  modal.classList.add(
    "hidden"
  );


  if (
    document.querySelectorAll(
      ".modal:not(.hidden)"
    ).length === 0
  ) {

    document.body
      .classList
      .remove(
        "modal-open"
      );

  }

}


/*************************************************
 * API GET
 *************************************************/

async function apiGet(
  action,
  params = {}
) {

  checkApiUrl();

  const url =
    new URL(API_URL);

  url.searchParams.set(
    "action",
    action
  );

  Object.entries(params)
    .forEach(
      ([key, value]) => {

        url.searchParams.set(
          key,
          value
        );

      }
    );


  const response =
    await fetch(
      url.toString(),
      {
        method:
          "GET",

        redirect:
          "follow"
      }
    );


  return parseApiResponse(
    response
  );

}


/*************************************************
 * API POST
 *************************************************/

async function apiPost(
  action,
  data = {}
) {

  checkApiUrl();


  const response =
    await fetch(
      API_URL,
      {
        method:
          "POST",

        redirect:
          "follow",

        headers: {
          "Content-Type":
            "text/plain;charset=UTF-8"
        },

        body:
          JSON.stringify({
            action,
            data
          })
      }
    );


  return parseApiResponse(
    response
  );

}


/*************************************************
 * API 응답
 *************************************************/

async function parseApiResponse(
  response
) {

  if (!response.ok) {

    throw new Error(
      `HTTP 오류: ${
        response.status
      }`
    );

  }


  let result;

  try {

    result =
      await response.json();

  } catch (error) {

    throw new Error(
      "API JSON 응답을 읽을 수 없습니다."
    );

  }


  if (!result.success) {

    throw new Error(
      result.message ||
      "API 요청 중 오류가 발생했습니다."
    );

  }


  return result;

}


function checkApiUrl() {

  if (
    !API_URL ||
    API_URL ===
      "APPS_SCRIPT_WEB_APP_URL"
  ) {

    throw new Error(
      "app.js의 API_URL에 Apps Script Web App 주소를 입력해주세요."
    );

  }

}


/*************************************************
 * 메시지
 *************************************************/

function showMessage(
  element,
  message,
  type
) {

  element.textContent =
    message;

  element.className =
    `message ${type}`;

}


function clearMessage(
  element
) {

  element.textContent =
    "";

  element.className =
    "message";

}


/*************************************************
 * 표시 유틸
 *************************************************/

function formatMoney(value) {

  const amount =
    Number(value) || 0;

  return (
    amount.toLocaleString(
      "ko-KR"
    ) +
    "원"
  );

}


function formatPercent(value) {

  const number =
    Number(value) || 0;

  if (
    Number.isInteger(number)
  ) {
    return String(number);
  }

  return number
    .toFixed(1)
    .replace(
      /\.0$/,
      ""
    );

}


function formatDateForInput(
  date
) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return (
    `${year}-` +
    `${month}-` +
    `${day}`
  );

}


function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}
