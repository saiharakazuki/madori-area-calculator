const TSUBO_TO_M2 = 3.305785;
const TATAMI_TO_M2 = 1.6562;

const state = {
  unit: "tsubo",
  taxMode: "ex",
};

const PROJECTS_KEY = "azEstimateProjects";

const unitLabels = {
  tsubo: "坪",
  m2: "平米",
  tatami: "畳",
};

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("ja-JP", {
  maximumFractionDigits: 2,
});

const $ = (id) => document.getElementById(id);

function numericValue(id) {
  return Number($(id).value) || 0;
}

function readProjects() {
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || [];
  } catch {
    return [];
  }
}

function writeProjects(projects) {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch {
    $("projectStatus").textContent = "保存できませんでした";
  }
}

function defaultProjectName() {
  const stamp = new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  return `案件 ${stamp}`;
}

function currentProjectPayload(name) {
  return {
    id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()),
    name: name || defaultProjectName(),
    savedAt: Date.now(),
    unit: state.unit,
    taxMode: state.taxMode,
    areaInput: $("areaInput").value,
    sakanArea: $("sakanArea").value,
    sakanRate: $("sakanRate").value,
    designRate: $("designRate").value,
    syncArea: $("syncArea").checked,
    includeDesign: $("includeDesign").checked,
  };
}

function renderProjects(selectedId = "") {
  const projects = readProjects().sort((a, b) => b.savedAt - a.savedAt);
  $("savedProjects").innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = projects.length ? "保存案件を選択" : "保存案件なし";
  $("savedProjects").appendChild(placeholder);

  projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    $("savedProjects").appendChild(option);
  });

  $("savedProjects").value = selectedId;
}

function inputToM2(value) {
  if (state.unit === "tsubo") return value * TSUBO_TO_M2;
  if (state.unit === "tatami") return value * TATAMI_TO_M2;
  return value;
}

function calculate() {
  const inputValue = numericValue("areaInput");
  const m2 = inputToM2(inputValue);
  const tsubo = m2 / TSUBO_TO_M2;
  const tatami = m2 / TATAMI_TO_M2;

  $("inputUnitLabel").textContent = unitLabels[state.unit];
  $("tsuboResult").textContent = number.format(tsubo);
  $("m2Result").textContent = number.format(m2);
  $("tatamiResult").textContent = number.format(tatami);

  if ($("syncArea").checked) {
    $("sakanArea").value = m2 ? number.format(m2).replace(/,/g, "") : "";
  }

  calculateEstimate();
}

function calculateEstimate() {
  const sakanArea = numericValue("sakanArea");
  const sakanRate = numericValue("sakanRate");
  const designRate = numericValue("designRate");
  const includeDesign = $("includeDesign").checked;

  const sakanCost = sakanArea * sakanRate;
  const designCost = includeDesign ? sakanArea * designRate : 0;
  const subtotal = sakanCost + designCost;
  const taxTotal = subtotal * 1.1;
  const displayTotal = state.taxMode === "in" ? taxTotal : subtotal;

  $("sakanCost").textContent = yen.format(sakanCost);
  $("designCost").textContent = yen.format(designCost);
  $("grandTotal").textContent = yen.format(displayTotal);
  $("headerTotal").textContent = yen.format(displayTotal);
  $("grandTotalLabel").textContent = state.taxMode === "in" ? "施工金額 税込" : "施工金額 税抜";
  $("taxCompareLabel").textContent = state.taxMode === "in" ? "税抜合計" : "税込合計";
  $("taxTotal").textContent = yen.format(state.taxMode === "in" ? subtotal : taxTotal);
  $("formulaText").textContent = `${number.format(sakanArea)}m2 x ${yen.format(sakanRate)}${includeDesign ? ` + ${yen.format(designRate)}` : ""}`;

  document.querySelectorAll("[data-tax-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.taxMode === state.taxMode);
  });
}

document.querySelectorAll(".unit-button").forEach((button) => {
  button.addEventListener("click", () => {
    state.unit = button.dataset.unit;
    document.querySelectorAll(".unit-button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    calculate();
  });
});

["areaInput", "syncArea"].forEach((id) => $(id).addEventListener("input", calculate));
["sakanArea", "sakanRate", "designRate", "includeDesign"].forEach((id) => {
  $(id).addEventListener("input", calculateEstimate);
  $(id).addEventListener("change", calculateEstimate);
});

document.querySelectorAll("[data-tax-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    state.taxMode = button.dataset.taxMode;
    calculateEstimate();
  });
});

$("clearButton").addEventListener("click", () => {
  $("areaInput").value = "";
  if ($("syncArea").checked) $("sakanArea").value = "";
  calculate();
});

$("saveProject").addEventListener("click", () => {
  const name = $("projectName").value.trim() || defaultProjectName();
  const projects = readProjects();
  const selectedId = $("savedProjects").value;
  const nextProject = currentProjectPayload(name);
  nextProject.id = selectedId || nextProject.id;

  const nextProjects = [
    nextProject,
    ...projects.filter((project) => project.id !== nextProject.id),
  ];

  writeProjects(nextProjects);
  $("projectName").value = name;
  renderProjects(nextProject.id);
  $("projectStatus").textContent = `${name} を保存しました`;
});

$("loadProject").addEventListener("click", () => {
  const project = readProjects().find((item) => item.id === $("savedProjects").value);
  if (!project) {
    $("projectStatus").textContent = "保存案件を選択してください";
    return;
  }

  $("projectName").value = project.name;
  $("areaInput").value = project.areaInput;
  $("sakanArea").value = project.sakanArea;
  $("sakanRate").value = project.sakanRate;
  $("designRate").value = project.designRate;
  $("syncArea").checked = project.syncArea;
  $("includeDesign").checked = project.includeDesign;
  state.unit = project.unit || "tsubo";
  state.taxMode = project.taxMode || "ex";

  document.querySelectorAll(".unit-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.unit === state.unit);
  });

  calculate();
  $("projectStatus").textContent = `${project.name} を呼び出しました`;
});

$("deleteProject").addEventListener("click", () => {
  const selectedId = $("savedProjects").value;
  const project = readProjects().find((item) => item.id === selectedId);
  if (!project) {
    $("projectStatus").textContent = "削除する案件を選択してください";
    return;
  }

  writeProjects(readProjects().filter((item) => item.id !== selectedId));
  renderProjects();
  $("projectStatus").textContent = `${project.name} を削除しました`;
});

$("newProject").addEventListener("click", () => {
  $("projectName").value = "";
  $("areaInput").value = "10";
  $("sakanRate").value = "55000";
  $("designRate").value = "11000";
  $("syncArea").checked = true;
  $("includeDesign").checked = true;
  state.unit = "tsubo";
  state.taxMode = "ex";
  renderProjects();
  calculate();
  $("projectStatus").textContent = "新規入力にしました";
});

renderProjects();
calculate();
