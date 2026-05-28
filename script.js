const form = document.getElementById("ev-form");
const errorMessage = document.getElementById("error-message");
const resultCard = document.getElementById("result-card");
const settingResultCard = document.getElementById("setting-result-card");
const settingFields = document.getElementById("setting-fields");
const modeButtons = document.querySelectorAll(".mode-button");
const ceilingOnlyFields = document.querySelectorAll(".ceiling-only");
const settingFieldContainers = document.querySelectorAll("[data-setting-field]");

const fields = {
  machineSelect: document.getElementById("machine-select"),
  currentGames: document.getElementById("current-games"),
  exchangeRate: document.getElementById("exchange-rate"),
  medalSignToggle: document.getElementById("medal-sign-toggle"),
  totalGames: document.getElementById("total-games"),
  todayMedals: document.getElementById("today-medals"),
  initialHits: document.getElementById("initial-hits"),
  czCount: document.getElementById("cz-count"),
  atCount: document.getElementById("at-count"),
  directAtCount: document.getElementById("direct-at-count"),
  bonusCount: document.getElementById("bonus-count"),
  bigCount: document.getElementById("big-count"),
  regCount: document.getElementById("reg-count"),
  throughCount: document.getElementById("through-count"),
};

const outputs = {
  machineLabel: document.getElementById("machine-label"),
  moneyEv: document.getElementById("money-ev"),
  ceilingRate: document.getElementById("ceiling-rate"),
  investment: document.getElementById("investment"),
  returnMedals: document.getElementById("return-medals"),
  medalEv: document.getElementById("medal-ev"),
  targetScore: document.getElementById("target-score"),
  averageGames: document.getElementById("average-games"),
};

const settingOutputs = {
  machineLabel: document.getElementById("setting-machine-label"),
  score: document.getElementById("setting-score"),
  combinedRate: document.getElementById("combined-rate"),
  hitRate: document.getElementById("setting-hit-rate"),
  czRate: document.getElementById("cz-rate"),
  directAtRate: document.getElementById("direct-at-rate"),
  bigRegRatio: document.getElementById("big-reg-ratio"),
  medalRating: document.getElementById("medal-rating"),
  comment: document.getElementById("setting-comment"),
};

const infoOutputs = {
  typeLabel: document.getElementById("machine-type-label"),
  ceilingGame: document.getElementById("info-ceiling-game"),
  coinBase: document.getElementById("info-coin-base"),
  hitRate: document.getElementById("info-hit-rate"),
  category: document.getElementById("info-category"),
  firstHitType: document.getElementById("info-first-hit-type"),
  hasCZ: document.getElementById("info-has-cz"),
  hasCeiling: document.getElementById("info-has-ceiling"),
  hasThroughCount: document.getElementById("info-has-through-count"),
  recommendedStart: document.getElementById("info-recommended-start"),
  yametoki: document.getElementById("info-yametoki"),
  notes: document.getElementById("info-notes"),
};

const historyForm = document.getElementById("history-form");
const historyMessage = document.getElementById("history-message");
const historyList = document.getElementById("history-list");
const historyFields = {
  editId: document.getElementById("history-edit-id"),
  date: document.getElementById("history-date"),
  store: document.getElementById("history-store"),
  machine: document.getElementById("history-machine"),
  rate: document.getElementById("history-rate"),
  reason: document.getElementById("history-reason"),
  investment: document.getElementById("history-investment"),
  returns: document.getElementById("history-return"),
  profit: document.getElementById("history-profit"),
  note: document.getElementById("history-note"),
  submit: document.getElementById("history-submit"),
  cancelEdit: document.getElementById("history-cancel-edit"),
  exportButton: document.getElementById("history-export"),
  importButton: document.getElementById("history-import-button"),
  importFile: document.getElementById("history-import-file"),
  totalProfit: document.getElementById("history-total-profit"),
  monthlyProfit: document.getElementById("history-monthly-profit"),
};

const HISTORY_STORAGE_KEY = "slotEvToolProfitHistory";

let machines = [];
let currentMode = "ceiling";
let diffSign = 1;
let profitHistory = loadProfitHistory();

loadMachines();
renderDiffSignButton();
setDefaultHistoryDate();
renderProfitHistory();

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMode(button.dataset.mode);
  });
});

fields.machineSelect.addEventListener("change", () => {
  errorMessage.textContent = "";
  renderMachineInfo(getSelectedMachine());
  updateVisibleFields();
  resetResults();
});

fields.medalSignToggle.addEventListener("click", (event) => {
  event.preventDefault();
  diffSign = diffSign === 1 ? -1 : 1;
  renderDiffSignButton();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  errorMessage.textContent = "";

  if (currentMode === "setting") {
    handleSettingSubmit();
    return;
  }

  handleCeilingSubmit();
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    errorMessage.textContent = "";
    diffSign = 1;
    renderDiffSignButton();
    renderMachineInfo(getSelectedMachine());
    resetResults();
  }, 0);
});

historyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveProfitHistoryEntry();
});

historyFields.investment.addEventListener("input", renderHistoryProfitPreview);
historyFields.returns.addEventListener("input", renderHistoryProfitPreview);
historyFields.cancelEdit.addEventListener("click", resetHistoryForm);
historyFields.exportButton.addEventListener("click", exportProfitHistory);
historyFields.importButton.addEventListener("click", () => {
  historyFields.importFile.click();
});
historyFields.importFile.addEventListener("change", importProfitHistory);

historyList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const id = button.dataset.id;

  if (button.dataset.action === "edit") {
    editProfitHistoryEntry(id);
  }

  if (button.dataset.action === "delete") {
    deleteProfitHistoryEntry(id);
  }
});

async function loadMachines() {
  try {
    const response = await fetch("./machines.json", { cache: "reload" });

    if (!response.ok) {
      throw new Error("Failed to load machines.json");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("machines.json is not an array");
    }

    machines = data;
    renderMachineOptions(machines);
    renderMachineInfo(getSelectedMachine());
    updateVisibleFields();
  } catch (error) {
    machines = [];
    fields.machineSelect.innerHTML = '<option value="">読み込み失敗</option>';
    fields.machineSelect.disabled = true;
    errorMessage.textContent = "機種データを読み込めませんでした";
  }
}

function setMode(mode) {
  currentMode = mode === "setting" ? "setting" : "ceiling";

  modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === currentMode);
  });

  const isSetting = currentMode === "setting";
  settingFields.classList.toggle("is-hidden", !isSetting);
  resultCard.classList.toggle("is-hidden", isSetting);
  settingResultCard.classList.toggle("is-hidden", !isSetting);
  errorMessage.textContent = "";
  updateVisibleFields();
  resetResults();
}

function updateVisibleFields() {
  const machine = getSelectedMachine();
  const flags = getMachineFlags(machine);
  const isSetting = currentMode === "setting";

  ceilingOnlyFields.forEach((container) => {
    const feature = container.dataset.feature;
    const visible = !isSetting && (!feature || flags[feature]);
    setContainerVisible(container, visible);
  });

  settingFields.classList.toggle("is-hidden", !isSetting);
  settingFieldContainers.forEach((container) => {
    const key = container.dataset.settingField;
    const feature = container.dataset.feature;
    let visible = isSetting && (!feature || flags[feature]);

    if (key === "initialHits") {
      visible = isSetting && flags.firstHitType !== "BIGREG";
    }

    if (key === "todayMedals") {
      visible = isSetting;
    }

    if (key === "bonusCount" && flags.hasBigReg) {
      visible = false;
    }

    setContainerVisible(container, visible);
  });
}

function setContainerVisible(container, visible) {
  container.classList.toggle("is-hidden", !visible);
  container.querySelectorAll("input, select").forEach((control) => {
    control.disabled = !visible;
  });
}

function handleCeilingSubmit() {
  const selectedMachine = getSelectedMachine();
  const values = readCeilingValues(selectedMachine);
  const validationError = validateCeilingValues(values);

  if (validationError) {
    errorMessage.textContent = validationError;
    return;
  }

  const result = calculateExpectedValue(values);
  renderCeilingResult(selectedMachine.name, result);
}

function handleSettingSubmit() {
  const selectedMachine = getSelectedMachine();
  const values = readSettingValues(selectedMachine);
  const validationError = validateSettingValues(values);

  if (validationError) {
    errorMessage.textContent = validationError;
    return;
  }

  const result = calculateSettingExpectation(values);
  renderSettingResult(selectedMachine.name, result);
}

function renderMachineOptions(items) {
  const options = ['<option value="">機種を選択してください</option>'];

  items.forEach((machine) => {
    options.push(
      `<option value="${escapeHtml(machine.id)}">${escapeHtml(machine.name)}</option>`
    );
  });

  fields.machineSelect.innerHTML = options.join("");
  fields.machineSelect.disabled = false;
}

function getSelectedMachine() {
  return machines.find((machine) => machine.id === fields.machineSelect.value) || null;
}

function readCeilingValues(machine) {
  return {
    machine,
    currentGames: Number(fields.currentGames.value),
    ceilingGames: Number(machine?.ceilingGame),
    hitProbability: Number(machine?.hitRate),
    spinsPer50: Number(machine?.coinBase),
    averagePayout: Number(machine?.avgPayout),
    ceilingPayout: Number(machine?.ceilingPayout),
    exchangeRate: Number(fields.exchangeRate.value),
    raw: {
      currentGames: fields.currentGames.value,
      exchangeRate: fields.exchangeRate.value,
    },
  };
}

function readSettingValues(machine) {
  const flags = getMachineFlags(machine);
  const parsedTodayMedals = parseUnsignedNumber(fields.todayMedals.value);

  return {
    machine,
    flags,
    totalGames: Number(fields.totalGames.value),
    todayMedals: Math.abs(parsedTodayMedals.value) * diffSign,
    todayMedalsValid: parsedTodayMedals.valid,
    initialHits: isSettingFieldVisible("initialHits") ? Number(fields.initialHits.value) : 0,
    czCount: isSettingFieldVisible("czCount") ? Number(fields.czCount.value) : 0,
    atCount: isSettingFieldVisible("atCount") ? Number(fields.atCount.value) : 0,
    directAtCount: isSettingFieldVisible("directAtCount") ? Number(fields.directAtCount.value) : 0,
    bonusCount: isSettingFieldVisible("bonusCount") ? Number(fields.bonusCount.value) : 0,
    bigCount: isSettingFieldVisible("bigCount") ? Number(fields.bigCount.value) : 0,
    regCount: isSettingFieldVisible("regCount") ? Number(fields.regCount.value) : 0,
    throughCount: isSettingFieldVisible("throughCount") ? Number(fields.throughCount.value) : 0,
    raw: {
      totalGames: fields.totalGames.value,
      todayMedals: fields.todayMedals.value,
      initialHits: fields.initialHits.value,
      czCount: fields.czCount.value,
      atCount: fields.atCount.value,
      directAtCount: fields.directAtCount.value,
      bonusCount: fields.bonusCount.value,
      bigCount: fields.bigCount.value,
      regCount: fields.regCount.value,
      throughCount: fields.throughCount.value,
    },
  };
}

function isSettingFieldVisible(key) {
  const container = document.querySelector(`[data-setting-field="${key}"]`);
  return Boolean(container && !container.classList.contains("is-hidden"));
}

function validateCeilingValues(values) {
  if (!values.machine) {
    return "機種を選択してください。";
  }

  if (isNormalMachine(values.machine)) {
    return "この機種は天井期待値計算に未対応です。";
  }

  if (!getMachineFlags(values.machine).hasCeiling) {
    return "この機種は天井期待値計算に未対応です。設定期待度モードを使ってください。";
  }

  if (values.raw.currentGames === "" || !Number.isFinite(values.currentGames)) {
    return "現在ゲーム数を正しい数値で入力してください。";
  }

  if (values.raw.exchangeRate === "" || !Number.isFinite(values.exchangeRate)) {
    return "交換率を選択してください。";
  }

  const requiredMachineNumbers = {
    ceilingGames: "天井G数",
    hitProbability: "初当たり確率",
    spinsPer50: "コイン持ち",
    averagePayout: "平均獲得枚数",
    ceilingPayout: "天井到達時の平均獲得枚数",
  };

  for (const [key, label] of Object.entries(requiredMachineNumbers)) {
    if (!Number.isFinite(values[key]) || values[key] <= 0) {
      return `${label}が未対応または要確認のため、計算できません。`;
    }
  }

  if (values.currentGames < 0) {
    return "現在ゲーム数は0以上で入力してください。";
  }

  if (values.exchangeRate < 0) {
    return "交換率は0以上で選択してください。";
  }

  if (values.currentGames >= values.ceilingGames) {
    return "現在ゲーム数が天井ゲーム数以上です。天井到達後の状態として扱えないため、数値を確認してください。";
  }

  return "";
}

function validateSettingValues(values) {
  if (!values.machine) {
    return "機種を選択してください。";
  }

  if (values.raw.totalGames === "" || !Number.isFinite(values.totalGames) || values.totalGames <= 0) {
    return "今日の総回転数は1以上で入力してください。";
  }

  if (!values.todayMedalsValid || !Number.isFinite(values.todayMedals)) {
    return "今日の差枚を正しい数値で入力してください。";
  }

  const labels = {
    initialHits: "初当たり回数",
    czCount: "CZ回数",
    atCount: "AT回数",
    directAtCount: "AT直撃回数",
    bonusCount: "ボーナス回数",
    bigCount: "BIG回数",
    regCount: "REG回数",
    throughCount: "現在のスルー回数",
  };

  for (const [key, label] of Object.entries(labels)) {
    if (!isSettingFieldVisible(key)) {
      continue;
    }

    if (key === "initialHits" && values.flags.firstHitType === "AT" && isSettingFieldVisible("atCount")) {
      if (values.raw.initialHits === "" && values.raw.atCount === "") {
        return "初当たり回数またはAT回数を入力してください。";
      }
      if (values.raw.initialHits === "") {
        continue;
      }
    }

    if (values.raw[key] === "" || !Number.isFinite(values[key])) {
      return `${label}を正しい数値で入力してください。`;
    }

    if (values[key] < 0) {
      return `${label}は0以上で入力してください。`;
    }
  }

  return "";
}

function calculateExpectedValue(values) {
  const remainingGames = values.ceilingGames - values.currentGames;
  const ceilingRate = Math.pow(1 - 1 / values.hitProbability, remainingGames);
  const normalHitRate = 1 - ceilingRate;
  const averageGames = values.hitProbability * normalHitRate + remainingGames * ceilingRate;
  const investmentMedals = (averageGames / values.spinsPer50) * 50;
  const averageReturnMedals =
    normalHitRate * values.averagePayout + ceilingRate * values.ceilingPayout;
  const medalExpectedValue = averageReturnMedals - investmentMedals;
  const moneyExpectedValue = medalExpectedValue * values.exchangeRate;
  const targetScore = calculateTargetScore(moneyExpectedValue);

  return {
    ceilingRate,
    averageGames,
    investmentMedals,
    averageReturnMedals,
    medalExpectedValue,
    moneyExpectedValue,
    targetScore,
  };
}

function calculateSettingExpectation(values) {
  const flags = values.flags;
  const bonusTotal = flags.hasBigReg
    ? values.bigCount + values.regCount
    : flags.hasBonus
      ? values.bonusCount
      : 0;
  const firstHitCount = getFirstHitCount(values);
  const combinedRate = rate(values.totalGames, bonusTotal);
  const initialRate = rate(values.totalGames, firstHitCount);
  const czRate = flags.hasCZ ? rate(values.totalGames, values.czCount) : null;
  const atRate = flags.hasAT ? rate(values.totalGames, values.atCount) : null;
  const directAtRate = flags.hasAT ? rate(values.totalGames, values.directAtCount) : null;
  const regRatio = flags.hasBigReg && bonusTotal > 0 ? values.regCount / bonusTotal : null;
  const medalPer1000 = (values.todayMedals / values.totalGames) * 1000;
  const normalMachine = isNormalMachine(values.machine);
  const volatileAtMachine = flags.category === "smart" || flags.category === "at";
  const referenceRate = findReferenceRate(values.machine, normalMachine ? "bonus" : "initial");
  const primaryRate = initialRate || atRate || combinedRate;
  const primaryRateIsClearlyLight = isClearlyLightRate(primaryRate, referenceRate || Number(values.machine.hitRate));

  let score = 50;

  if (normalMachine) {
    if (flags.hasBigReg) {
      score += scoreRate(combinedRate, referenceRate || Number(values.machine.hitRate), 30);
      score += scoreRegRatio(regRatio);
    }
    score += scoreMedals(medalPer1000, 16);
  } else {
    score += scoreRate(primaryRate, referenceRate || Number(values.machine.hitRate), 32);

    if (firstHitCount <= 0) {
      score -= 28;
    } else if (firstHitCount === 1) {
      score -= 18;
    }

    if (flags.hasCZ) {
      score += values.czCount > 0 ? scoreCountDensity(values.czCount, values.totalGames, 10) : -5;
    }

    if (flags.hasAT) {
      score += values.directAtCount > 0 ? Math.min(values.directAtCount * 7, 16) : -2;
    }

    if (flags.hasBonus) {
      score += scoreRate(combinedRate, referenceRate || Number(values.machine.hitRate), 8);
    }

    score += scoreAtMedals(medalPer1000, primaryRateIsClearlyLight);

    if (flags.hasThroughCount) {
      score -= Math.min(values.throughCount * 3, 12);
    }
  }

  if (volatileAtMachine && values.totalGames < 1500) {
    score = Math.min(score, 54);
  } else if (values.totalGames < 1000) {
    score = Math.min(score, 45);
  } else if (values.totalGames < 2000) {
    score = Math.min(score, 55);
  }

  score = clamp(score, 0, 100);

  return {
    flags,
    combinedRate,
    initialRate,
    czRate,
    atRate,
    directAtRate,
    regRatio,
    medalPer1000,
    medalTotal: values.todayMedals,
    medalRating: getMedalRating(medalPer1000),
    score,
    comment: buildSettingComment(score, values.totalGames, {
      firstHitCount,
      medalTotal: values.todayMedals,
      volatileAtMachine,
    }),
  };
}

function getFirstHitCount(values) {
  const type = values.flags.firstHitType;

  if (type === "BIGREG") {
    return values.bigCount + values.regCount;
  }
  if (type === "AT") {
    return values.initialHits || values.atCount;
  }
  if (type === "BONUS") {
    return values.initialHits || values.bonusCount;
  }
  if (type === "CZ") {
    return values.initialHits || values.czCount;
  }

  return values.initialHits;
}

function calculateTargetScore(moneyExpectedValue) {
  if (moneyExpectedValue <= 0) {
    return clamp(30 + moneyExpectedValue / 100, 0, 30);
  }

  if (moneyExpectedValue <= 1000) {
    return 30 + (moneyExpectedValue / 1000) * 20;
  }

  if (moneyExpectedValue <= 3000) {
    return 50 + ((moneyExpectedValue - 1000) / 2000) * 25;
  }

  return clamp(75 + ((moneyExpectedValue - 3000) / 5000) * 25, 75, 100);
}

function renderMachineInfo(machine) {
  if (!machine) {
    infoOutputs.typeLabel.textContent = "未選択";
    infoOutputs.ceilingGame.textContent = "--";
    infoOutputs.coinBase.textContent = "--";
    infoOutputs.hitRate.textContent = "--";
    infoOutputs.category.textContent = "--";
    infoOutputs.firstHitType.textContent = "--";
    infoOutputs.hasCZ.textContent = "--";
    infoOutputs.hasCeiling.textContent = "--";
    infoOutputs.hasThroughCount.textContent = "--";
    infoOutputs.recommendedStart.textContent = "--";
    infoOutputs.yametoki.textContent = "--";
    infoOutputs.notes.textContent = "--";
    return;
  }

  const flags = getMachineFlags(machine);
  infoOutputs.typeLabel.textContent = machine.machineType || "要確認";
  infoOutputs.ceilingGame.textContent = formatGameValue(machine.ceilingGame);
  infoOutputs.coinBase.textContent = formatCoinBase(machine.coinBase);
  infoOutputs.hitRate.textContent = formatHitRate(machine.hitRate);
  infoOutputs.category.textContent = formatCategory(flags.category);
  infoOutputs.firstHitType.textContent = flags.firstHitType;
  infoOutputs.hasCZ.textContent = formatBooleanSpec(flags.hasCZ);
  infoOutputs.hasCeiling.textContent = formatBooleanSpec(flags.hasCeiling);
  infoOutputs.hasThroughCount.textContent = flags.hasThroughCount ? "対応" : "なし";
  infoOutputs.recommendedStart.textContent = formatGameValue(machine.recommendedStart);
  infoOutputs.yametoki.textContent = formatTextValue(machine.yametoki);
  infoOutputs.notes.textContent = isNormalMachine(machine)
    ? `${formatTextValue(machine.notes)} この機種は天井期待値計算に未対応です。`
    : formatTextValue(machine.notes);
}

function renderCeilingResult(machineName, result) {
  const isPositive = result.moneyExpectedValue > 0;
  resultCard.className = `result-card ${isPositive ? "is-positive" : "is-negative"}`;

  outputs.machineLabel.textContent = machineName || "機種名なし";
  outputs.moneyEv.textContent = `${formatSigned(result.moneyExpectedValue, 0)} 円`;
  outputs.ceilingRate.textContent = `${formatNumber(result.ceilingRate * 100, 1)} %`;
  outputs.investment.textContent = `${formatNumber(result.investmentMedals, 1)} 枚`;
  outputs.returnMedals.textContent = `${formatNumber(result.averageReturnMedals, 1)} 枚`;
  outputs.medalEv.textContent = `${formatSigned(result.medalExpectedValue, 1)} 枚`;
  outputs.targetScore.textContent = `${formatNumber(result.targetScore, 0)} %`;
  outputs.averageGames.textContent = `${formatNumber(result.averageGames, 1)} G`;
}

function renderSettingResult(machineName, result) {
  const resultClass = result.score >= 55 ? "is-positive" : "is-negative";
  settingResultCard.className = `result-card ${resultClass}`;

  settingOutputs.machineLabel.textContent = machineName || "機種名なし";
  settingOutputs.score.textContent = `${formatNumber(result.score, 0)} %`;
  settingOutputs.combinedRate.textContent =
    result.flags.hasBonus || result.flags.hasBigReg ? formatRate(result.combinedRate) : "未対応";
  settingOutputs.hitRate.textContent = formatRate(result.initialRate);
  settingOutputs.czRate.textContent = result.flags.hasCZ ? formatRate(result.czRate) : "未対応";
  settingOutputs.directAtRate.textContent = result.flags.hasAT
    ? formatRate(result.directAtRate)
    : "未対応";
  settingOutputs.bigRegRatio.textContent = result.flags.hasBigReg
    ? formatBigRegRatio(result.regRatio)
    : "未対応";
  settingOutputs.medalRating.textContent = result.medalRating;
  settingOutputs.medalRating.classList.toggle("is-medal-plus", result.medalTotal > 0);
  settingOutputs.medalRating.classList.toggle("is-medal-minus", result.medalTotal < 0);
  settingOutputs.comment.textContent = result.comment;
}

function resetResults() {
  resetCeilingResult();
  resetSettingResult();
}

function resetCeilingResult() {
  resultCard.className = `result-card is-empty${currentMode === "setting" ? " is-hidden" : ""}`;
  outputs.machineLabel.textContent = "未計算";
  outputs.moneyEv.textContent = "-- 円";
  outputs.ceilingRate.textContent = "-- %";
  outputs.investment.textContent = "-- 枚";
  outputs.returnMedals.textContent = "-- 枚";
  outputs.medalEv.textContent = "-- 枚";
  outputs.targetScore.textContent = "-- %";
  outputs.averageGames.textContent = "-- G";
}

function resetSettingResult() {
  settingResultCard.className = `result-card is-empty${currentMode === "setting" ? "" : " is-hidden"}`;
  settingOutputs.machineLabel.textContent = "未計算";
  settingOutputs.score.textContent = "-- %";
  settingOutputs.combinedRate.textContent = "--";
  settingOutputs.hitRate.textContent = "--";
  settingOutputs.czRate.textContent = "--";
  settingOutputs.directAtRate.textContent = "--";
  settingOutputs.bigRegRatio.textContent = "--";
  settingOutputs.medalRating.textContent = "--";
  settingOutputs.medalRating.classList.remove("is-medal-plus", "is-medal-minus");
  settingOutputs.comment.textContent = "--";
}

function loadProfitHistory() {
  try {
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    return savedHistory ? JSON.parse(savedHistory) : [];
  } catch (error) {
    return [];
  }
}

function persistProfitHistory() {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(profitHistory));
}

function setDefaultHistoryDate() {
  if (!historyFields.date.value) {
    historyFields.date.value = new Date().toISOString().slice(0, 10);
  }
}

function saveProfitHistoryEntry() {
  historyMessage.textContent = "";

  const investment = parseMoneyInput(historyFields.investment.value);
  const returns = parseMoneyInput(historyFields.returns.value);

  if (!historyFields.date.value) {
    historyMessage.textContent = "日付を入力してください。";
    return;
  }

  if (!investment.valid || !returns.valid) {
    historyMessage.textContent = "投資金額と回収金額は数値で入力してください。";
    return;
  }

  const entry = {
    id: historyFields.editId.value || createHistoryId(),
    date: historyFields.date.value,
    store: historyFields.store.value.trim(),
    machine: historyFields.machine.value.trim(),
    rate: historyFields.rate.value.trim(),
    reason: historyFields.reason.value.trim(),
    investment: investment.value,
    returns: returns.value,
    profit: returns.value - investment.value,
    note: historyFields.note.value.trim(),
    updatedAt: new Date().toISOString(),
  };

  if (historyFields.editId.value) {
    profitHistory = profitHistory.map((item) => (item.id === entry.id ? entry : item));
  } else {
    profitHistory.unshift(entry);
  }

  persistProfitHistory();
  resetHistoryForm();
  renderProfitHistory();
}

function editProfitHistoryEntry(id) {
  const entry = profitHistory.find((item) => item.id === id);

  if (!entry) {
    return;
  }

  historyFields.editId.value = entry.id;
  historyFields.date.value = entry.date;
  historyFields.store.value = entry.store;
  historyFields.machine.value = entry.machine;
  historyFields.rate.value = entry.rate;
  historyFields.reason.value = entry.reason;
  historyFields.investment.value = entry.investment;
  historyFields.returns.value = entry.returns;
  historyFields.note.value = entry.note;
  historyFields.submit.textContent = "履歴を更新";
  historyFields.cancelEdit.classList.remove("is-hidden");
  renderHistoryProfitPreview();
  historyMessage.textContent = "編集中です。内容を変更して更新してください。";
}

function deleteProfitHistoryEntry(id) {
  profitHistory = profitHistory.filter((item) => item.id !== id);
  persistProfitHistory();

  if (historyFields.editId.value === id) {
    resetHistoryForm();
  }

  renderProfitHistory();
}

function exportProfitHistory() {
  const backupData = {
    app: "slot-ev-tool",
    version: 1,
    exportedAt: new Date().toISOString(),
    history: profitHistory,
  };
  const json = JSON.stringify(backupData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateLabel = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `slot-profit-history-${dateLabel}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  historyMessage.textContent = "バックアップJSONを作成しました。";
}

function importProfitHistory(event) {
  const file = event.target.files && event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const parsedData = JSON.parse(String(reader.result));
      const importedHistory = Array.isArray(parsedData)
        ? parsedData
        : Array.isArray(parsedData.history)
          ? parsedData.history
          : null;

      if (!importedHistory) {
        throw new Error("Invalid backup format");
      }

      profitHistory = importedHistory.map(normalizeProfitHistoryEntry);
      persistProfitHistory();
      resetHistoryForm();
      renderProfitHistory();
      historyMessage.textContent = "バックアップを読み込みました。";
    } catch (error) {
      historyMessage.textContent = "バックアップJSONを読み込めませんでした。";
    } finally {
      historyFields.importFile.value = "";
    }
  });

  reader.addEventListener("error", () => {
    historyMessage.textContent = "バックアップファイルを読み込めませんでした。";
    historyFields.importFile.value = "";
  });

  reader.readAsText(file);
}

function normalizeProfitHistoryEntry(entry) {
  const investment = Number(entry.investment) || 0;
  const returns = Number(entry.returns) || 0;

  return {
    id: entry.id || createHistoryId(),
    date: entry.date || new Date().toISOString().slice(0, 10),
    store: String(entry.store || ""),
    machine: String(entry.machine || ""),
    rate: String(entry.rate || ""),
    reason: String(entry.reason || ""),
    investment,
    returns,
    profit: Number.isFinite(Number(entry.profit)) ? Number(entry.profit) : returns - investment,
    note: String(entry.note || ""),
    updatedAt: entry.updatedAt || new Date().toISOString(),
  };
}

function resetHistoryForm() {
  historyForm.reset();
  historyFields.editId.value = "";
  historyFields.submit.textContent = "履歴を保存";
  historyFields.cancelEdit.classList.add("is-hidden");
  historyMessage.textContent = "";
  setDefaultHistoryDate();
  renderHistoryProfitPreview();
}

function renderHistoryProfitPreview() {
  const investment = parseMoneyInput(historyFields.investment.value);
  const returns = parseMoneyInput(historyFields.returns.value);
  const profit = (returns.valid ? returns.value : 0) - (investment.valid ? investment.value : 0);
  historyFields.profit.value = `${formatSigned(profit, 0)} 円`;
  historyFields.profit.classList.toggle("money-plus", profit > 0);
  historyFields.profit.classList.toggle("money-minus", profit < 0);
}

function renderProfitHistory() {
  renderHistoryProfitPreview();
  renderProfitSummary();

  if (profitHistory.length === 0) {
    historyList.innerHTML = '<div class="history-item"><p class="history-note">まだ履歴がありません。</p></div>';
    return;
  }

  const sortedHistory = [...profitHistory].sort((a, b) => b.date.localeCompare(a.date));
  historyList.innerHTML = sortedHistory.map(renderProfitHistoryItem).join("");
}

function renderProfitHistoryItem(entry) {
  const profitClass = entry.profit > 0 ? "money-plus" : entry.profit < 0 ? "money-minus" : "";

  return `
    <article class="history-item">
      <div class="history-main">
        <div>
          <h3 class="history-title">${escapeHtml(entry.machine || "機種名なし")}</h3>
          <div class="history-meta">${escapeHtml(entry.date)} / ${escapeHtml(entry.store || "店舗なし")} / ${escapeHtml(entry.rate || "レート未入力")}</div>
        </div>
        <div class="history-profit ${profitClass}">${formatSigned(entry.profit, 0)} 円</div>
      </div>
      <div class="history-meta">投資 ${formatNumber(entry.investment, 0)} 円 / 回収 ${formatNumber(entry.returns, 0)} 円 / 理由 ${escapeHtml(entry.reason || "未入力")}</div>
      ${entry.note ? `<div class="history-note">${escapeHtml(entry.note)}</div>` : ""}
      <div class="history-actions">
        <button type="button" data-action="edit" data-id="${escapeHtml(entry.id)}">編集</button>
        <button type="button" class="secondary" data-action="delete" data-id="${escapeHtml(entry.id)}">削除</button>
      </div>
    </article>
  `;
}

function renderProfitSummary() {
  const totalProfit = profitHistory.reduce((sum, entry) => sum + entry.profit, 0);
  const monthlyProfitMap = profitHistory.reduce((map, entry) => {
    const month = entry.date ? entry.date.slice(0, 7) : "日付なし";
    map[month] = (map[month] || 0) + entry.profit;
    return map;
  }, {});

  const monthlyProfitText = Object.entries(monthlyProfitMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6)
    .map(([month, profit]) => `${month}: ${formatSigned(profit, 0)}円`)
    .join(" / ");

  historyFields.totalProfit.textContent = `${formatSigned(totalProfit, 0)} 円`;
  historyFields.totalProfit.classList.toggle("money-plus", totalProfit > 0);
  historyFields.totalProfit.classList.toggle("money-minus", totalProfit < 0);
  historyFields.monthlyProfit.textContent = monthlyProfitText || "--";
}

function parseMoneyInput(value) {
  const trimmedValue = String(value).trim();

  if (trimmedValue === "") {
    return { value: 0, valid: true };
  }

  const normalizedValue = trimmedValue.replace(/,/g, "").replace(/^\+/, "");

  if (!/^-?\d+(\.\d+)?$/.test(normalizedValue)) {
    return { value: NaN, valid: false };
  }

  return {
    value: Number(normalizedValue),
    valid: true,
  };
}

function createHistoryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function renderDiffSignButton() {
  const isMinus = diffSign < 0;
  fields.medalSignToggle.textContent = isMinus ? "−" : "+";
  fields.medalSignToggle.classList.toggle("is-minus", isMinus);
  fields.medalSignToggle.setAttribute("aria-pressed", String(isMinus));
}

function isNormalMachine(machine) {
  const machineType = machine.machineType || "";
  return (
    machine.category === "normal" ||
    machineType.includes("ノーマル") ||
    machineType.includes("Aタイプ")
  );
}

function getMachineFlags(machine) {
  if (!machine) {
    return {
      category: "",
      hasCeiling: false,
      hasCZ: false,
      hasAT: false,
      hasBonus: false,
      hasBigReg: false,
      hasThroughCount: false,
      firstHitType: "",
    };
  }

  const normal = isNormalMachine(machine);
  const category = machine.category || (normal ? "normal" : "at");

  return {
    category,
    hasCeiling: Boolean(machine.hasCeiling),
    hasCZ: Boolean(machine.hasCZ),
    hasAT: Boolean(machine.hasAT),
    hasBonus: Boolean(machine.hasBonus),
    hasBigReg: Boolean(machine.hasBigReg),
    hasThroughCount: Boolean(machine.hasThroughCount),
    firstHitType: machine.firstHitType || (normal ? "BIGREG" : "AT"),
  };
}

function findReferenceRate(machine, kind) {
  if (!machine.settingRates) {
    return Number(machine.hitRate) || null;
  }

  const candidates =
    kind === "bonus"
      ? [machine.settingRates.bonus, machine.settingRates.combined, machine.settingRates.hitRate]
      : [machine.settingRates.initialHit, machine.settingRates.at, machine.settingRates.hitRate];

  for (const candidate of candidates) {
    const extracted = extractBestRate(candidate);
    if (extracted) {
      return extracted;
    }
  }

  return Number(machine.hitRate) || null;
}

function extractBestRate(value) {
  if (typeof value === "number" && value > 0) {
    return value;
  }

  if (Array.isArray(value)) {
    const numbers = value.map(Number).filter((number) => Number.isFinite(number) && number > 0);
    return numbers.length ? Math.min(...numbers) : null;
  }

  if (value && typeof value === "object") {
    const numbers = Object.values(value)
      .map(Number)
      .filter((number) => Number.isFinite(number) && number > 0);
    return numbers.length ? Math.min(...numbers) : null;
  }

  return null;
}

function rate(totalGames, count) {
  return count > 0 ? totalGames / count : null;
}

function scoreRate(observedRate, referenceRate, weight) {
  if (!observedRate || !referenceRate || !Number.isFinite(referenceRate)) {
    return -4;
  }

  const ratio = referenceRate / observedRate;
  if (ratio >= 1.15) {
    return weight;
  }
  if (ratio >= 1.05) {
    return weight * 0.65;
  }
  if (ratio >= 0.95) {
    return weight * 0.25;
  }
  if (ratio >= 0.85) {
    return -weight * 0.25;
  }
  return -weight * 0.55;
}

function isClearlyLightRate(observedRate, referenceRate) {
  if (!observedRate || !referenceRate || !Number.isFinite(referenceRate)) {
    return false;
  }

  return observedRate <= referenceRate * 0.85;
}

function scoreRegRatio(regRatio) {
  if (regRatio === null) {
    return -6;
  }
  if (regRatio >= 0.46) {
    return 18;
  }
  if (regRatio >= 0.4) {
    return 12;
  }
  if (regRatio >= 0.34) {
    return 5;
  }
  return -8;
}

function scoreCountDensity(count, totalGames, weight) {
  const per1000 = count / (totalGames / 1000);

  if (per1000 >= 3) {
    return weight;
  }
  if (per1000 >= 1.5) {
    return weight * 0.55;
  }
  if (per1000 > 0) {
    return weight * 0.2;
  }
  return -weight * 0.35;
}

function scoreMedals(medalPer1000, weight) {
  if (medalPer1000 >= 220) {
    return weight;
  }
  if (medalPer1000 >= 80) {
    return weight * 0.55;
  }
  if (medalPer1000 >= -80) {
    return 0;
  }
  if (medalPer1000 >= -220) {
    return -weight * 0.4;
  }
  return -weight * 0.75;
}

function scoreAtMedals(medalPer1000, primaryRateIsClearlyLight) {
  if (medalPer1000 >= 220) {
    return 4;
  }
  if (medalPer1000 >= 80) {
    return 2;
  }
  if (medalPer1000 >= -80) {
    return 0;
  }
  if (primaryRateIsClearlyLight) {
    return 2;
  }
  if (medalPer1000 >= -220) {
    return -4;
  }
  return -8;
}

function getMedalRating(medalPer1000) {
  if (medalPer1000 >= 220) {
    return "かなり強い";
  }
  if (medalPer1000 >= 80) {
    return "プラス傾向";
  }
  if (medalPer1000 >= -80) {
    return "ほぼ中立";
  }
  if (medalPer1000 >= -220) {
    return "やや弱い";
  }
  return "弱い";
}

function buildSettingComment(score, totalGames, context = {}) {
  const prefix =
    totalGames < 1000
      ? "試行回数不足です。 "
      : totalGames < 2000
        ? "まだ試行回数不足気味です。 "
        : "";

  if (context.volatileAtMachine && totalGames < 1500 && context.medalTotal <= -1500) {
    return `${prefix}荒波機種では短時間の大幅マイナスだけでは高低判別不可です。判断保留として、初当たり・AT直撃・スルー回数・示唆要素を優先してください。`;
  }

  if (context.volatileAtMachine && context.firstHitCount <= 1) {
    return `${prefix}初当たり回数が少ないため判断保留です。荒波AT機は差枚だけでは高設定挙動と判定できません。`;
  }

  if (score < 35) {
    return `${prefix}低設定寄りの可能性があります。あくまで目安です。`;
  }
  if (score < 55) {
    return `${prefix}判断保留です。短時間の出玉や初当たりだけでは断定できません。`;
  }
  if (score < 75) {
    return `${prefix}中間以上に期待できる可能性があります。示唆やホール状況も確認してください。`;
  }
  return `${prefix}高設定挙動の可能性あり。ただし実際の設定を保証するものではありません。`;
}

function formatGameValue(value) {
  if (value === null || value === undefined || value === 0 || value === "") {
    return "未対応";
  }

  return `${formatNumber(Number(value), 0)} G`;
}

function formatCoinBase(value) {
  if (value === null || value === undefined || value === "" || Number(value) <= 0) {
    return "要確認";
  }

  return `${formatNumber(Number(value), 1)} G / 50枚`;
}

function formatHitRate(value) {
  if (value === null || value === undefined || value === "" || Number(value) <= 0) {
    return "要確認";
  }

  return `1/${formatNumber(Number(value), 1)}`;
}

function formatCategory(category) {
  const labels = {
    at: "AT機",
    normal: "Aタイプ/ノーマル",
    art: "ART機",
    smart: "スマスロ",
  };

  return labels[category] || "要確認";
}

function formatBooleanSpec(value) {
  return value ? "あり" : "なし";
}

function formatRate(value) {
  return value ? `1/${formatNumber(value, 1)}` : "未発生";
}

function formatBigRegRatio(regRatio) {
  if (regRatio === null) {
    return "未発生";
  }

  const bigRatio = 1 - regRatio;
  return `BIG ${formatNumber(bigRatio * 100, 0)}% / REG ${formatNumber(regRatio * 100, 0)}%`;
}

function formatTextValue(value) {
  return value === null || value === undefined || value === "" ? "要確認" : String(value);
}

function parseUnsignedNumber(value) {
  const trimmedValue = String(value).trim();

  if (trimmedValue === "") {
    return { value: 0, valid: true };
  }

  const normalizedValue = trimmedValue.replace(/,/g, "");

  if (!/^\d+(\.\d+)?$/.test(normalizedValue)) {
    return { value: NaN, valid: false };
  }

  return {
    value: Number(normalizedValue),
    valid: true,
  };
}

function formatNumber(value, digits) {
  return value.toLocaleString("ja-JP", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatSigned(value, digits) {
  const formatted = formatNumber(value, digits);
  return value > 0 ? `+${formatted}` : formatted;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
