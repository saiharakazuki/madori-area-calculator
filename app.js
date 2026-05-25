const TSUBO_TO_M2 = 3.305785;
const TATAMI_TO_M2 = 1.6562;

const state = {
  unit: "tsubo",
};

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
  const total = sakanCost + designCost;

  $("sakanCost").textContent = yen.format(sakanCost);
  $("designCost").textContent = yen.format(designCost);
  $("grandTotal").textContent = yen.format(total);
  $("headerTotal").textContent = yen.format(total);
  $("taxTotal").textContent = yen.format(total * 1.1);
  $("formulaText").textContent = `${number.format(sakanArea)}m2 x ${yen.format(sakanRate)}${includeDesign ? ` + ${yen.format(designRate)}` : ""}`;
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

$("clearButton").addEventListener("click", () => {
  $("areaInput").value = "";
  if ($("syncArea").checked) $("sakanArea").value = "";
  calculate();
});

calculate();
