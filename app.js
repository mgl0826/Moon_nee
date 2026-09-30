/*************************************************
 * 우리 가계부 MVP
 * Frontend JavaScript
 *************************************************/


/*************************************************
 * Apps Script Web App 주소
 *************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbxna8JVLRbMl4djjr71GkP0s9uwr3sshPH4dy0-NCKvoL2W3xqISsHJHlPXe-VFJy6s/exec";


/*************************************************
 * 전역 데이터
 *************************************************/

let categories = [];


/*************************************************
 * 초기 실행
 *************************************************/

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setDefaultDate();
    setDefaultDashboardDate();

    bindNavigation();
    bindEvents();

    updatePaymentMethodVisibility();

    try {

      await loadCategories();
      await loadDashboard();

    } catch (error) {

      console.error(error);

    }

  }
);


/*************************************************
 * 기본 날짜 설정
 *************************************************/

function setDefaultDate() {

  const today = new Date();

  const dateString =
    formatDateForInput(today);

  document.getElementById(
    "transactionDate"
  ).value = dateString;

}


/*************************************************
 * 대시보드 기본 연/월
 *************************************************/

function setDefaultDashboardDate() {

  const today = new Date();

  document.getElementById(
    "dashboardYear"
  ).value = today.getFullYear();

  document.getElementById(
    "dashboardMonth"
  ).value = today.getMonth() + 1;

}


/*************************************************
 * 메뉴 이동
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

        }
      );

    });

}


/*************************************************
 * 페이지 변경
 *************************************************/

function showPage(pageId) {

  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.remove("active");

    });

  document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

      button.classList.remove("active");

    });

  document
    .getElementById(pageId)
    .classList
    .add("active");

  document
    .querySelector(
      `[data-page="${pageId}"]`
    )
    .classList
    .add("active");

}


/*************************************************
 * 이벤트 등록
 *************************************************/

function bindEvents() {

  document
    .getElementById("transactionType")
    .addEventListener(
      "change",
      () => {

        updatePaymentMethodVisibility();
        renderTransactionCategories();

      }
    );


  document
    .getElementById("showCategoryButton")
    .addEventListener(
      "click",
      toggleCategoryBox
    );


  document
    .getElementById("addCategoryButton")
    .addEventListener(
      "click",
      addCategory
    );


  document
    .getElementById("transactionForm")
    .addEventListener(
      "submit",
      submitTransaction
    );


  document
    .getElementById(
      "refreshDashboardButton"
    )
    .addEventListener(
      "click",
      loadDashboard
    );


  document
    .getElementById("budgetForm")
    .addEventListener(
      "submit",
      saveBudget
    );


  document
    .getElementById("assetForm")
    .addEventListener(
      "submit",
      addAsset
    );

}


/*************************************************
 * 결제수단 표시 / 숨김
 *************************************************/

function updatePaymentMethodVisibility() {

  const type =
    document.getElementById(
      "transactionType"
    ).value;

  const paymentGroup =
    document.getElementById(
      "paymentMethodGroup"
    );

  if (type === "소비") {

    paymentGroup.classList.remove(
      "hidden"
    );

  } else {

    paymentGroup.classList.add(
      "hidden"
    );

  }

}


/*************************************************
 * 카테고리 추가 영역 토글
 *************************************************/

function toggleCategoryBox() {

  const box =
    document.getElementById(
      "categoryAddBox"
    );

  box.classList.toggle("hidden");

  if (
    !box.classList.contains("hidden")
  ) {

    document
      .getElementById("newCategory")
      .focus();

  }

}


/*************************************************
 * 카테고리 조회
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

}


/*************************************************
 * 거래 카테고리 출력
 *************************************************/

function renderTransactionCategories() {

  const type =
    document.getElementById(
      "transactionType"
    ).value;

  const select =
    document.getElementById(
      "transactionCategory"
    );

  const filtered =
    categories.filter(
      item => item.type === type
    );

  select.innerHTML = "";

  filtered.forEach(item => {

    const option =
      document.createElement("option");

    option.value = item.category;
    option.textContent = item.category;

    select.appendChild(option);

  });

  if (filtered.length === 0) {

    const option =
      document.createElement("option");

    option.value = "";
    option.textContent =
      "카테고리를 추가해주세요";

    select.appendChild(option);

  }

}


/*************************************************
 * 예산 카테고리 출력
 *************************************************/

function renderBudgetCategories() {

  const select =
    document.getElementById(
      "budgetCategory"
    );

  const consumerCategories =
    categories.filter(
      item => item.type === "소비"
    );

  select.innerHTML = "";

  consumerCategories.forEach(item => {

    const option =
      document.createElement("option");

    option.value = item.category;
    option.textContent = item.category;

    select.appendChild(option);

  });

}


/*************************************************
 * 카테고리 추가
 *************************************************/

async function addCategory() {

  const type =
    document.getElementById(
      "transactionType"
    ).value;

  const input =
    document.getElementById(
      "newCategory"
    );

  const category =
    input.value.trim();

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

    input.value = "";

    document
      .getElementById("categoryAddBox")
      .classList
      .add("hidden");

    await loadCategories();

    document.getElementById(
      "transactionCategory"
    ).value = category;

  } catch (error) {

    alert(error.message);

  }

}


/*************************************************
 * 거래 등록
 *************************************************/

async function submitTransaction(event) {

  event.preventDefault();

  const messageElement =
    document.getElementById(
      "transactionMessage"
    );

  clearMessage(messageElement);

  const type =
    document.getElementById(
      "transactionType"
    ).value;

  const data = {

    date:
      document.getElementById(
        "transactionDate"
      ).value,

    type,

    category:
      document.getElementById(
        "transactionCategory"
      ).value,

    paymentMethod:
      type === "소비"
        ? document.getElementById(
            "paymentMethod"
          ).value
        : "",

    amount:
      Number(
        document.getElementById(
          "transactionAmount"
        ).value
      ),

    memo:
      document.getElementById(
        "transactionMemo"
      ).value.trim()

  };


  try {

    await apiPost(
      "addTransaction",
      data
    );

    showMessage(
      messageElement,
      "거래가 등록되었습니다.",
      "success"
    );

    document.getElementById(
      "transactionAmount"
    ).value = "";

    document.getElementById(
      "transactionMemo"
    ).value = "";

  } catch (error) {

    showMessage(
      messageElement,
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
      document.getElementById(
        "dashboardYear"
      ).value
    );

  const month =
    Number(
      document.getElementById(
        "dashboardMonth"
      ).value
    );

  try {

    const response =
      await apiGet(
        "getDashboard",
        {
          year,
          month
        }
      );

    renderDashboard(
      response.data
    );

  } catch (error) {

    console.error(error);

    alert(
      "대시보드 조회 실패\n" +
      error.message
    );

  }

}


/*************************************************
 * 대시보드 출력
 *************************************************/

function renderDashboard(data) {

  const summary =
    data.summary || {};

  document.getElementById(
    "totalIncome"
  ).textContent =
    formatMoney(summary.income);

  document.getElementById(
    "totalExpense"
  ).textContent =
    formatMoney(summary.expense);

  document.getElementById(
    "totalSaving"
  ).textContent =
    formatMoney(summary.saving);

  document.getElementById(
    "totalBalance"
  ).textContent =
    formatMoney(summary.balance);

  document.getElementById(
    "totalAssets"
  ).textContent =
    formatMoney(summary.totalAssets);


  renderExpenseCategories(
    data.expenseCategories || []
  );

  renderBudgets(
    data.budgets || []
  );

  renderAssets(
    data.assets || []
  );

}


/*************************************************
 * 소비 카테고리 출력
 *************************************************/

function renderExpenseCategories(items) {

  const container =
    document.getElementById(
      "expenseCategoryList"
    );

  container.innerHTML = "";

  if (items.length === 0) {

    container.innerHTML =
      '<div class="empty-message">' +
      '이번 달 소비내역이 없습니다.' +
      '</div>';

    return;

  }

  items.forEach(item => {

    const row =
      document.createElement("div");

    row.className = "data-row";

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
 * 예산 저장
 *************************************************/

async function saveBudget(event) {

  event.preventDefault();

  const messageElement =
    document.getElementById(
      "budgetMessage"
    );

  clearMessage(messageElement);

  const data = {

    year:
      Number(
        document.getElementById(
          "dashboardYear"
        ).value
      ),

    month:
      Number(
        document.getElementById(
          "dashboardMonth"
        ).value
      ),

    category:
      document.getElementById(
        "budgetCategory"
      ).value,

    amount:
      Number(
        document.getElementById(
          "budgetAmount"
        ).value
      )

  };


  try {

    await apiPost(
      "saveBudget",
      data
    );

    showMessage(
      messageElement,
      "예산이 저장되었습니다.",
      "success"
    );

    document.getElementById(
      "budgetAmount"
    ).value = "";

    await loadDashboard();

  } catch (error) {

    showMessage(
      messageElement,
      error.message,
      "error"
    );

  }

}


/*************************************************
 * 예산 출력
 *************************************************/

function renderBudgets(items) {

  const tbody =
    document.getElementById(
      "budgetTableBody"
    );

  tbody.innerHTML = "";

  if (items.length === 0) {

    const row =
      document.createElement("tr");

    row.innerHTML = `
      <td colspan="5" class="empty-message">
        설정된 예산이 없습니다.
      </td>
    `;

    tbody.appendChild(row);

    return;

  }

  items.forEach(item => {

    const row =
      document.createElement("tr");

    const remaining =
      Number(item.remaining) || 0;

    const budget =
      Number(item.budget) || 0;

    const remainingClass =
      remaining < 0
        ? "negative"
        : "";

    /*
     * 예산 상태
     *
     * 0원 미만      → 늠쳤따옹!
     * 정확히 0원    → 다썼따옹!
     * 20% 이하 남음 → 을마안남았따옹!
     */

    let statusText =
      item.status || "";

    /*
     * 이전 버전의 Code.gs와 연결되어도
     * 정상 표시될 수 있도록 프론트에서도
     * 상태를 한 번 더 계산합니다.
     */

    if (!statusText) {

      if (remaining < 0) {

        statusText =
          "늠쳤따옹!";

      } else if (
        remaining === 0 &&
        budget > 0
      ) {

        statusText =
          "다썼따옹!";

      } else if (
        budget > 0 &&
        remaining > 0 &&
        remaining <= budget * 0.2
      ) {

        statusText =
          "을마안남았따옹!";

      }

    }

    row.innerHTML = `

      <td>
        ${escapeHtml(item.category)}
      </td>

      <td>
        ${formatMoney(item.budget)}
      </td>

      <td>
        ${formatMoney(item.used)}
      </td>

      <td class="${remainingClass}">
        ${formatMoney(item.remaining)}
      </td>

      <td class="warning-text">
        ${escapeHtml(statusText)}
      </td>

    `;

    tbody.appendChild(row);

  });

}


/*************************************************
 * 자산 등록
 *************************************************/

async function addAsset(event) {

  event.preventDefault();

  const messageElement =
    document.getElementById(
      "assetMessage"
    );

  clearMessage(messageElement);

  const data = {

    category:
      document.getElementById(
        "assetCategory"
      ).value,

    name:
      document.getElementById(
        "assetName"
      ).value.trim(),

    amount:
      Number(
        document.getElementById(
          "assetAmount"
        ).value
      )

  };


  try {

    await apiPost(
      "addAsset",
      data
    );

    showMessage(
      messageElement,
      "자산이 등록되었습니다.",
      "success"
    );

    document.getElementById(
      "assetName"
    ).value = "";

    document.getElementById(
      "assetAmount"
    ).value = "";

    await loadDashboard();

  } catch (error) {

    showMessage(
      messageElement,
      error.message,
      "error"
    );

  }

}


/*************************************************
 * 자산 출력
 *************************************************/

function renderAssets(items) {

  const container =
    document.getElementById(
      "assetList"
    );

  container.innerHTML = "";

  if (items.length === 0) {

    container.innerHTML =
      '<div class="empty-message">' +
      '등록된 자산이 없습니다.' +
      '</div>';

    return;

  }

  items.forEach(item => {

    const row =
      document.createElement("div");

    row.className = "data-row";

    row.innerHTML = `

      <div>
        <strong>
          ${escapeHtml(item.name)}
        </strong>

        <div>
          ${escapeHtml(item.category)}
        </div>
      </div>

      <strong>
        ${formatMoney(item.amount)}
      </strong>

    `;

    container.appendChild(row);

  });

}


/*************************************************
 * GET 요청
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
    .forEach(([key, value]) => {

      url.searchParams.set(
        key,
        value
      );

    });


  const response =
    await fetch(
      url.toString(),
      {
        method: "GET",
        redirect: "follow"
      }
    );

  return parseApiResponse(response);

}


/*************************************************
 * POST 요청
 *************************************************/

async function apiPost(
  action,
  data = {}
) {

  checkApiUrl();

  /*
   * 중요:
   *
   * application/json 대신 text/plain 사용.
   *
   * GitHub Pages / Cloudflare Pages 등
   * 다른 도메인에서 Apps Script에 요청할 때
   * 불필요한 OPTIONS preflight를 피하기 위한 방식.
   *
   * 실제 내용은 JSON 문자열.
   */

  const response =
    await fetch(
      API_URL,
      {
        method: "POST",

        redirect: "follow",

        headers: {
          "Content-Type":
            "text/plain;charset=UTF-8"
        },

        body: JSON.stringify({
          action,
          data
        })
      }
    );

  return parseApiResponse(response);

}


/*************************************************
 * API 응답 처리
 *************************************************/

async function parseApiResponse(response) {

  if (!response.ok) {

    throw new Error(
      `HTTP 오류: ${response.status}`
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


/*************************************************
 * API URL 확인
 *************************************************/

function checkApiUrl() {

  if (
    !API_URL ||
    API_URL ===
      "APPS_SCRIPT_WEB_APP_URL"
  ) {

    throw new Error(
      "app.js의 API_URL에 " +
      "Apps Script Web App 주소를 입력해주세요."
    );

  }

}


/*************************************************
 * 메시지 출력
 *************************************************/

function showMessage(
  element,
  message,
  type
) {

  element.textContent = message;

  element.className =
    `message ${type}`;

}


/*************************************************
 * 메시지 초기화
 *************************************************/

function clearMessage(element) {

  element.textContent = "";

  element.className = "message";

}


/*************************************************
 * 원화 표시
 *************************************************/

function formatMoney(value) {

  const amount =
    Number(value) || 0;

  return (
    amount.toLocaleString("ko-KR") +
    "원"
  );

}


/*************************************************
 * 날짜 input 형식 변환
 *************************************************/

function formatDateForInput(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}


/*************************************************
 * HTML Escape
 *************************************************/

function escapeHtml(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}