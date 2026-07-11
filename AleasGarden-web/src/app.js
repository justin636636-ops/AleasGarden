(() => {
  const $ = (id) => document.getElementById(id);
  const phaseNames = {
    action: "行动",
    upgrade: "升级",
    "endgame-upgrade": "终局升级",
    gameover: "结束",
  };
  const slotLeft = 17.8;
  const slotTops = [13.0, 34.7, 58.0, 81.3];
  const themeStorageKey = "aleasGardenTheme";
  const saveStorageKey = "aleasGardenSaveV1";
  const saveVersion = 1;
  const gardenLabelNames = {
    "Garden Extension": "扩展",
    Mitsudomoe: "三巴",
    Mushrooms: "蘑菇",
    Chidori: "千鸟",
    Parasol: "阳伞",
    "Raked Sand": "枯山水",
    "Spring Breeze": "春风",
    Tea: "茶",
    Butterflies: "蝴蝶",
    Dragonfly: "蜻蜓",
    Crane: "鹤",
    Koi: "鲤鱼",
    Bridge: "桥",
    Mist: "雾",
    Lotus: "莲",
    "Treasure Knot": "宝结",
    "Stone Lantern": "灯笼",
  };
  const trackSlots = {
    year: {
      y: 13.0,
      x: [7.8, 22.3, 36.8, 51.6, 66.3],
    },
    blossom: {
      y: 40.6,
      x: [4.8, 13.2, 21.5, 29.7, 37.9, 46.0, 54.2, 62.5, 70.8, 79.0, 87.5, 96.3],
    },
    sun: {
      y: 79.8,
      x: [4.8, 13.2, 21.5, 29.7, 37.9, 46.0, 54.2, 62.5, 70.8, 79.0, 87.5],
    },
  };
  let tempSelection = [];
  let systemThemeQuery = null;
  let trackMarkersReady = false;
  let statusFlash = "";
  let statusFlashTimer = 0;
  let previousGardenIds = null;
  const trackMarkerTimers = {};

  function init() {
    initTheme();
    sizeAutomationCanvas();
    bind();
    const seed = new URLSearchParams(location.search).get("seed");
    if (seed) {
      $("seedInput").value = seed;
      window.AleasGarden.newGame({ seed });
      saveGame("已按链接种子开新局并保存。");
    } else if (!restoreSavedGame()) {
      window.AleasGarden.newGame({ seed: $("seedInput").value });
      saveGame("新局已保存。");
    }
    clearTemp();
    resetGardenAnimationSnapshot();
    render();
  }

  function bind() {
    window.addEventListener("resize", sizeAutomationCanvas);
    $("themeToggleBtn").addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      setTheme(next, true);
    });
    $("newGameBtn").addEventListener("click", () => {
      window.AleasGarden.newGame({ seed: $("seedInput").value });
      $("seedInput").value = window.AleasGarden.getState().seed;
      clearTemp();
      resetTrackMarkers();
      resetGardenAnimationSnapshot();
      saveGame("新游戏已保存。");
      render();
    });
    $("undoBtn").addEventListener("click", () => {
      window.AleasGarden.undo();
      clearTemp();
      saveGame("已保存撤销后的状态。");
      render();
    });
    $("pile0Btn").addEventListener("click", () => {
      window.AleasGarden.chooseActionPile(0);
      clearTemp();
      saveGame();
      render();
    });
    $("pile1Btn").addEventListener("click", () => {
      window.AleasGarden.chooseActionPile(1);
      clearTemp();
      saveGame();
      render();
    });
    $("submitPlacementBtn").addEventListener("click", () => {
      const before = actionSignature(window.AleasGarden.getState());
      window.AleasGarden.submitCurrentPlacement(tempSelection);
      const after = actionSignature(window.AleasGarden.getState());
      if (before !== after) clearTemp();
      saveGame();
      render();
    });
    $("clearPlacementBtn").addEventListener("click", () => {
      clearTemp();
      render();
    });
    $("rotReductionMinusBtn").addEventListener("click", () => adjustRotReduction(-1));
    $("rotReductionPlusBtn").addEventListener("click", () => adjustRotReduction(1));
    $("failBtn").addEventListener("click", () => {
      window.AleasGarden.failAction();
      clearTemp();
      saveGame();
      render();
    });
    $("finishUpgradeBtn").addEventListener("click", () => {
      window.AleasGarden.finishUpgrade();
      clearTemp();
      resetGardenAnimationSnapshot();
      saveGame();
      render();
    });
    $("replantBtn").addEventListener("click", () => {
      window.AleasGarden.replant();
      clearTemp();
      resetGardenAnimationSnapshot();
      saveGame();
      render();
    });
    $("clearSaveBtn").addEventListener("click", () => {
      clearSavedGame();
      render();
    });
    $("rulesBtn").addEventListener("click", () => $("rulesDialog").showModal());
    $("closeRulesBtn").addEventListener("click", () => $("rulesDialog").close());
    $("catalogBtn").addEventListener("click", () => {
      renderCatalog();
      $("catalogDialog").showModal();
    });
    $("closeCatalogBtn").addEventListener("click", () => $("catalogDialog").close());
    document.querySelectorAll(".catalog-tab").forEach((button) => {
      button.addEventListener("click", () => setCatalogTab(button.dataset.catalogTab));
    });
    document.querySelectorAll(".resource-choice-btn").forEach((button) => {
      button.addEventListener("click", () => {
        window.AleasGarden.choosePendingResource(button.dataset.resource);
        clearTemp();
        saveGame();
        render();
      });
    });
    $("lanternRemoveBtn").addEventListener("click", () => {
      window.AleasGarden.chooseLantern(true);
      clearTemp();
      saveGame();
      render();
    });
    $("lanternKeepBtn").addEventListener("click", () => {
      window.AleasGarden.chooseLantern(false);
      clearTemp();
      saveGame();
      render();
    });
    $("logBtn").addEventListener("click", () => {
      renderLog(window.AleasGarden.getState());
      $("logDialog").showModal();
    });
    $("closeLogBtn").addEventListener("click", () => $("logDialog").close());
    $("closeCardBtn").addEventListener("click", () => $("cardDialog").close());
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && $("cardDialog").open) $("cardDialog").close();
    });
  }

  function initTheme() {
    const stored = readStoredTheme();
    systemThemeQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const initial = stored || (systemThemeQuery?.matches ? "dark" : "light");
    setTheme(initial, false);
    if (systemThemeQuery) {
      const handleSystemTheme = (event) => {
        if (!readStoredTheme()) setTheme(event.matches ? "dark" : "light", false);
      };
      if (systemThemeQuery.addEventListener) {
        systemThemeQuery.addEventListener("change", handleSystemTheme);
      } else if (systemThemeQuery.addListener) {
        systemThemeQuery.addListener(handleSystemTheme);
      }
    }
  }

  function readStoredTheme() {
    try {
      const value = localStorage.getItem(themeStorageKey);
      return value === "dark" || value === "light" ? value : "";
    } catch (_error) {
      return "";
    }
  }

  function setTheme(theme, persist) {
    const next = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    if (persist) {
      try {
        localStorage.setItem(themeStorageKey, next);
      } catch (_error) {
        // Local files can be opened in contexts where storage is unavailable.
      }
    }
    updateThemeButton(next);
  }

  function updateThemeButton(theme) {
    const button = $("themeToggleBtn");
    if (!button) return;
    const isDark = theme === "dark";
    button.textContent = isDark ? "浅色" : "深色";
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("title", isDark ? "切换到浅色模式" : "切换到深色模式");
  }

  function restoreSavedGame() {
    const stored = readSavedGame();
    if (!stored) return false;
    try {
      window.AleasGarden.load(stored.payload);
      window.__aleaSaveStatus = {
        available: true,
        saved: true,
        restored: true,
        savedAt: stored.savedAt || 0,
        message: "已恢复本地存档。",
      };
      flashStatus("已恢复本地存档。");
      resetTrackMarkers();
      resetGardenAnimationSnapshot();
      return true;
    } catch (_error) {
      window.AleasGarden.newGame({ seed: $("seedInput").value });
      saveGame("存档损坏，已开始新局并保存。");
      return true;
    }
  }

  function readSavedGame() {
    try {
      const raw = localStorage.getItem(saveStorageKey);
      if (!raw) {
        window.__aleaSaveStatus = { available: true, saved: false, restored: false, savedAt: 0, message: "" };
        return null;
      }
      const parsed = JSON.parse(raw);
      if (parsed.version !== saveVersion || typeof parsed.payload !== "string") {
        window.__aleaSaveStatus = { available: true, saved: false, restored: false, savedAt: 0, message: "存档版本不兼容。" };
        return null;
      }
      return parsed;
    } catch (_error) {
      window.__aleaSaveStatus = { available: false, saved: false, restored: false, savedAt: 0, message: "无法读取本地存档。" };
      return null;
    }
  }

  function saveGame(message = "已保存。") {
    try {
      const payload = window.AleasGarden.serialize();
      const savedAt = Date.now();
      localStorage.setItem(saveStorageKey, JSON.stringify({ version: saveVersion, savedAt, payload }));
      window.__aleaSaveStatus = { available: true, saved: true, restored: false, savedAt, message };
      flashStatus(message);
      return true;
    } catch (_error) {
      window.__aleaSaveStatus = { available: false, saved: false, restored: false, savedAt: 0, message: "无法保存，本局仍可继续。" };
      flashStatus("无法保存，本局仍可继续。");
      return false;
    }
  }

  function clearSavedGame() {
    try {
      localStorage.removeItem(saveStorageKey);
      window.__aleaSaveStatus = { available: true, saved: false, restored: false, savedAt: 0, message: "已清除本地存档。" };
      flashStatus("已清除本地存档。");
    } catch (_error) {
      window.__aleaSaveStatus = { available: false, saved: false, restored: false, savedAt: 0, message: "无法清除本地存档。" };
      flashStatus("无法清除本地存档。");
    }
  }

  function flashStatus(message) {
    statusFlash = message;
    clearTimeout(statusFlashTimer);
    statusFlashTimer = setTimeout(() => {
      statusFlash = "";
      render();
    }, 2200);
  }

  function render() {
    const s = window.AleasGarden.getState();
    window.__aleaTempSelectionCount = tempSelection.length;
    $("seedInput").value = s.seed;
    $("yearText").textContent = `${Math.min(s.year, 5)} / 5`;
    $("phaseText").textContent = phaseNames[s.phase] || s.phase;
    $("blossomText").textContent = s.resources.blossom;
    $("sunText").textContent = `${s.resources.sun} / 10`;
    $("milestoneText").textContent = s.milestone;
    $("resiliencyText").textContent = s.resources.resiliency;
    $("scoreText").textContent = `${s.score} / 25`;
    renderResourceTrack(s);
    $("deckSummary").textContent = `花园牌库 ${s.gardenDeckCount} · 扩展牌库 ${s.expansionDeckCount}`;
    $("deckPreviewSummary").textContent = `花园牌库 ${s.gardenDeckCount}`;
    $("discardSummary").textContent = `行动弃牌 ${s.actionDiscardCount}`;
    $("statusText").textContent = statusText(s);
    renderResult(s);
    renderGarden(s);
    renderGardenShop(s);
    renderEndgameDeckUpgrades(s);
    renderPiles(s);
    renderCurrentAction(s);
    renderUpgrade(s);
    renderDeckPreview(s);
    renderDiscardPreview(s);
    renderLog(s);
  }

  function statusText(s) {
    if (statusFlash) return statusFlash;
    if (s.phase === "action") {
      if (s.currentAction?.step === "choice") return "选择三巴纹获得的资源，然后继续当前行动。";
      if (s.currentAction?.step === "lantern") return "选择是否移除石灯笼上的腐败，然后继续当前行动。";
      return s.currentAction ? "点击叠放花园里的可见格子放置立方，然后提交校验。" : "选择一个行动牌堆顶牌。";
    }
    if (s.phase === "upgrade") return "升级当前花园中的卡牌，或购买扩展牌。";
    if (s.phase === "endgame-upgrade") return "终局可升级所有花园牌，然后计分。";
    if (s.phase === "gameover") return s.result === "win" ? "胜利！花园达成 25 分。" : "本局未达成 25 分。";
    return "";
  }

  function renderResult(s) {
    const box = $("resultBox");
    if (s.phase !== "gameover") {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    box.textContent = `${s.resources.vp} 分 · ${s.result === "win" ? "胜利" : "失败"}`;
    box.className = `result ${s.result}`;
  }

  function renderResourceTrack(s) {
    const markers = trackMarkerData(s);
    window.__aleaTrackState = markers;
    for (const marker of markers) {
      const el = $(`${marker.kind}Marker`);
      if (!el) continue;
      const changed = el.dataset.cell && el.dataset.cell !== marker.cell;
      el.style.setProperty("--marker-x", `${marker.x}%`);
      el.style.setProperty("--marker-y", `${marker.y}%`);
      el.dataset.cell = marker.cell;
      el.dataset.value = marker.value;
      el.setAttribute("aria-label", `${marker.label} ${marker.displayValue}`);
      el.title = `${marker.label} ${marker.displayValue}`;
      if (trackMarkersReady && changed) pulseTrackMarker(el, marker.kind);
    }
    trackMarkersReady = true;
  }

  function trackMarkerData(s) {
    const yearValue = Math.min(Math.max(Number(s.year) || 1, 1), 5);
    const blossomValue = Math.max(0, Number(s.resources.blossom) || 0);
    const sunValue = Math.min(10, Math.max(0, Number(s.resources.sun) || 0));
    return [
      makeTrackMarker("year", yearValue, yearValue),
      makeTrackMarker("blossom", blossomValue, blossomValue > 10 ? 11 : blossomValue),
      makeTrackMarker("sun", sunValue, sunValue),
    ];
  }

  function makeTrackMarker(kind, value, slotValue) {
    const config = trackSlots[kind];
    const slotIndex = kind === "year" ? slotValue - 1 : slotValue;
    const displayValue = kind === "blossom" && value > 10 ? "10+" : String(value);
    return {
      kind,
      value,
      displayValue,
      label: { year: "年份", blossom: "花朵", sun: "阳光" }[kind],
      cell: `${kind}-${displayValue}`,
      x: config.x[slotIndex],
      y: config.y,
    };
  }

  function pulseTrackMarker(el, kind) {
    clearTimeout(trackMarkerTimers[kind]);
    el.classList.remove("is-moving");
    requestAnimationFrame(() => {
      el.classList.add("is-moving");
      trackMarkerTimers[kind] = setTimeout(() => el.classList.remove("is-moving"), 420);
    });
  }

  function resetTrackMarkers() {
    trackMarkersReady = false;
    Object.values(trackMarkerTimers).forEach(clearTimeout);
    for (const kind of ["year", "blossom", "sun"]) {
      const el = $(`${kind}Marker`);
      if (!el) continue;
      el.classList.remove("is-moving");
      delete el.dataset.cell;
      delete el.dataset.value;
    }
  }

  function resetGardenAnimationSnapshot() {
    previousGardenIds = null;
  }

  function renderGarden(s) {
    const cards = $("gardenCards");
    const gardenIds = s.garden.map((card) => card.instanceId);
    const enteringStart = appendedGardenStart(previousGardenIds, gardenIds);
    const hasEnteringCards = enteringStart >= 0;
    cards.innerHTML = "";
    const stage = document.createElement("div");
    stage.className = "overlap-stage";
    stage.style.setProperty("--cols", s.garden.length);
    const labels = document.createElement("div");
    labels.className = "garden-column-labels";
    for (const [index, card] of s.garden.entries()) {
      const entering = enteringStart >= 0 && index >= enteringStart;
      const enterDelay = entering ? `${(index - enteringStart) * 85}ms` : "0ms";
      const el = document.createElement("article");
      el.className = "garden-card card-board";
      if (entering) {
        el.classList.add("is-entering");
        el.style.setProperty("--enter-delay", enterDelay);
        el.addEventListener("animationend", () => el.classList.remove("is-entering"), { once: true });
      }
      el.style.zIndex = String(index + 1);
      const media = document.createElement("div");
      media.className = "card-media";
      media.innerHTML = `<img src="${card.image}" alt="${escapeHtml(card.name)}">`;
      for (const plot of card.plots) {
        const slot = document.createElement("button");
        slot.type = "button";
        slot.className = "card-slot";
        slot.style.left = `${slotLeft}%`;
        slot.style.top = `${slotTops[plot.y]}%`;
        slot.dataset.key = plot.key;
        slot.dataset.x = plot.x;
        slot.dataset.y = plot.y;
        slot.disabled = !s.currentAction || s.currentAction.step === "choice" || s.currentAction.step === "lantern" || Boolean(plot.cube);
        slot.addEventListener("click", () => toggleTemp(plot));
        const tempKind = tempKindFor(plot.key, s.currentAction);
        const cubeKind = plot.cube || tempKind;
        const cubeRound = plot.cube ? plot.cubeRound : (tempKind ? currentActionRound(s) : null);
        slot.setAttribute("aria-label", `${card.name} 第 ${plot.y + 1} 格${cubeKind ? `，${cubeLabel(cubeKind, cubeRound)}` : ""}`);
        if (cubeKind) {
          const cube = document.createElement("span");
          cube.className = `cube-marker ${cubeKind} ${tempKind ? "pending" : ""}`;
          if (cubeRound) cube.textContent = cubeRound;
          slot.appendChild(cube);
        }
        media.appendChild(slot);
      }
      el.appendChild(media);
      stage.appendChild(el);

      const columnControls = document.createElement("div");
      columnControls.className = "garden-column-controls";
      if (entering) {
        columnControls.classList.add("is-entering");
        columnControls.style.setProperty("--enter-delay", enterDelay);
        columnControls.addEventListener("animationend", () => columnControls.classList.remove("is-entering"), { once: true });
      }

      const label = document.createElement("button");
      label.type = "button";
      label.className = "garden-column-label";
      const labelName = gardenLabelName(card.name);
      label.title = card.name;
      label.setAttribute("aria-label", `第 ${index + 1} 列：${card.name}，${card.upgraded ? `${card.vp} 分` : `${card.cost} 花`}`);
      label.innerHTML = `<strong>${index + 1}</strong><span>${escapeHtml(labelName)}</span><small>${card.upgraded ? `${card.vp} 分` : `${card.cost} 花`}</small>`;
      label.addEventListener("click", () => openCardDialog(card));
      columnControls.appendChild(label);

      if (isUpgradePhase(s) && !card.upgraded) {
        columnControls.appendChild(gardenUpgradeButton(card, s.resources.blossom, "garden-column-upgrade"));
      }

      labels.appendChild(columnControls);
    }
    cards.appendChild(stage);
    cards.appendChild(labels);
    previousGardenIds = gardenIds;
    if (hasEnteringCards) revealNewGardenCards(cards);
  }

  function gardenLabelName(name) {
    const starting = /^Starting Card ([A-H])$/.exec(name);
    if (starting) return `起始 ${starting[1]}`;
    return gardenLabelNames[name] || name;
  }

  function isUpgradePhase(s) {
    return s.phase === "upgrade" || s.phase === "endgame-upgrade";
  }

  function gardenUpgradeButton(card, blossom, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.disabled = blossom < card.cost;
    button.textContent = `升级 ${card.cost} 花`;
    button.title = `${card.name}：花费 ${card.cost} 花升级为 ${card.vp} 分`;
    button.setAttribute("aria-label", `升级 ${card.name}，花费 ${card.cost} 花，升级后 ${card.vp} 分`);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      window.AleasGarden.upgradeGarden(card.instanceId);
      clearTemp();
      saveGame();
      render();
    });
    return button;
  }

  function openCardDialog(card) {
    const shortName = gardenLabelName(card.name);
    $("cardDialogTitle").textContent = `${shortName} · ${card.name}`;
    $("cardDialogMeta").textContent = `升级费用 ${card.cost} 花 · 升级后 ${card.vp} 分`;
    $("cardDetailImages").innerHTML = [
      cardFigure("基础面", card.frontImage, `${card.name} 基础面，第 ${card.frontPage} 页`),
      cardFigure(card.upgraded ? "升级面（当前）" : "升级面", card.backImage, `${card.name} 升级面，第 ${card.backPage} 页`),
    ].join("");
    renderCardEffects(card);
    $("cardDialog").showModal();
  }

  function cardFigure(title, image, alt) {
    return `
      <figure class="card-detail-figure">
        <figcaption>${escapeHtml(title)}</figcaption>
        <img src="${image}" alt="${escapeHtml(alt)}">
      </figure>
    `;
  }

  function renderCardEffects(card) {
    const list = $("cardEffectList");
    list.innerHTML = "";
    const effects = appendixEffects();
    const keys = cardEffectKeys(card);
    const descriptions = keys.map((key) => effects[key]?.text).filter(Boolean);
    if (!descriptions.length) descriptions.push("无特殊效果。");
    for (const description of descriptions) {
      const li = document.createElement("li");
      li.textContent = description;
      list.appendChild(li);
    }
  }

  function cardEffectKeys(card) {
    const keys = new Set();
    const effects = appendixEffects();
    if (card.flags?.extension) keys.add("extension");
    for (const plot of [...(card.frontPlots || []), ...(card.backPlots || [])]) {
      if (plot.golden) keys.add("golden");
      if (effects[plot.plot]) keys.add(plot.plot);
    }
    return [...keys];
  }

  function appendixEffects() {
    return window.AleasGarden.getCatalog().appendixEffects || {};
  }

  function renderCatalog() {
    const catalog = window.AleasGarden.getCatalog();
    renderGardenCatalog(catalog.gardenCards || []);
    renderActionCatalog(catalog.actionCards || []);
    renderEffectsCatalog(catalog.appendixEffects || {});
    setCatalogTab(document.querySelector(".catalog-tab.is-active")?.dataset.catalogTab || "garden");
  }

  function setCatalogTab(name) {
    const selected = name || "garden";
    document.querySelectorAll(".catalog-tab").forEach((button) => {
      const active = button.dataset.catalogTab === selected;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll(".catalog-panel").forEach((panel) => {
      panel.hidden = panel.dataset.catalogPanel !== selected;
    });
  }

  function renderGardenCatalog(cards) {
    const panel = $("catalogGardenPanel");
    panel.innerHTML = `<div class="catalog-grid garden-catalog-grid"></div>`;
    const grid = panel.querySelector(".catalog-grid");
    for (const card of cards) {
      const item = document.createElement("article");
      item.className = "catalog-card garden-catalog-card";
      const effects = cardEffectKeys(card).map((key) => appendixEffects()[key]?.text).filter(Boolean);
      item.innerHTML = `
        <div class="catalog-card-head">
          <strong>${escapeHtml(gardenLabelName(card.name))}</strong>
          <span>${escapeHtml(card.name)}</span>
        </div>
        <div class="catalog-card-images">
          ${catalogImageButton("基础面", card.frontImage, `${card.name} 基础面`)}
          ${catalogImageButton("升级面", card.backImage, `${card.name} 升级面`)}
        </div>
        <p class="catalog-meta">升级费用 ${card.cost} 花 · 升级后 ${card.vp} 分 · 第 ${card.frontPage}/${card.backPage} 页</p>
        <ul class="catalog-effects">${(effects.length ? effects : ["无特殊效果。"]).map((text) => `<li>${escapeHtml(text)}</li>`).join("")}</ul>
      `;
      item.querySelectorAll(".catalog-image-btn").forEach((button) => {
        button.addEventListener("click", () => openCardDialog(card));
      });
      grid.appendChild(item);
    }
  }

  function renderActionCatalog(cards) {
    const panel = $("catalogActionPanel");
    panel.innerHTML = `<div class="catalog-grid action-catalog-grid"></div>`;
    const grid = panel.querySelector(".catalog-grid");
    for (const card of cards) {
      const item = document.createElement("article");
      item.className = "catalog-card action-catalog-card";
      item.innerHTML = `
        <button class="action-catalog-preview" type="button" aria-label="查看第 ${card.page} 页行动牌">
          <img src="${card.image}" alt="行动牌第 ${card.page} 页">
        </button>
        <div class="catalog-card-head">
          <strong>行动牌 ${card.page}</strong>
          <span>${card.pairId}</span>
        </div>
        <dl class="action-summary">
          <dt>浇水</dt><dd>${escapeHtml(card.waterText)}</dd>
          <dt>腐败</dt><dd>${escapeHtml(card.rotText)}</dd>
          <dt>奖励</dt><dd>${escapeHtml(card.bonusText)}</dd>
        </dl>
      `;
      item.querySelector(".action-catalog-preview").addEventListener("click", () => openActionDialog(card));
      grid.appendChild(item);
    }
  }

  function renderEffectsCatalog(effects) {
    const panel = $("catalogEffectsPanel");
    const categoryNames = {
      water: "浇水触发",
      rot: "腐败触发",
      ongoing: "持续效果",
      other: "其他图标",
      misc: "补充规则",
    };
    const entries = Object.entries(effects);
    panel.innerHTML = `
      <p class="catalog-source">来源：Rules/AleasGarden_Rulebook_v1-3.pdf 第 3 页 appendix；garden extension 与 milestone 来自第 4 页图标说明。</p>
      <div class="effect-catalog-list"></div>
    `;
    const list = panel.querySelector(".effect-catalog-list");
    for (const [key, effect] of entries) {
      const item = document.createElement("article");
      item.className = "effect-catalog-item";
      item.innerHTML = `<strong>${escapeHtml(categoryNames[effect.category] || effect.category)} · ${escapeHtml(effect.name)}</strong><p>${escapeHtml(effect.text)}</p><small>${escapeHtml(key)}</small>`;
      list.appendChild(item);
    }
  }

  function catalogImageButton(label, image, alt) {
    return `
      <button class="catalog-image-btn" type="button">
        <span>${escapeHtml(label)}</span>
        <img src="${image}" alt="${escapeHtml(alt)}">
      </button>
    `;
  }

  function openActionDialog(card) {
    $("cardDialogTitle").textContent = `行动牌 ${card.page}`;
    $("cardDialogMeta").textContent = `${card.waterText} · ${card.rotText} · ${card.bonusText}`;
    $("cardDetailImages").innerHTML = [
      cardFigure("行动牌", card.image, `行动牌第 ${card.page} 页`),
    ].join("");
    const list = $("cardEffectList");
    list.innerHTML = "";
    for (const text of [`浇水：${card.waterText}`, `腐败：${card.rotText}`, `奖励：${card.bonusText}`]) {
      const li = document.createElement("li");
      li.textContent = text;
      list.appendChild(li);
    }
    $("cardDialog").showModal();
  }

  function appendedGardenStart(before, after) {
    if (!before || !before.length || after.length <= before.length) return -1;
    for (let i = 0; i < before.length; i += 1) {
      if (before[i] !== after[i]) return -1;
    }
    return before.length;
  }

  function revealNewGardenCards(cards) {
    requestAnimationFrame(() => {
      cards.scrollTo({ left: cards.scrollWidth, behavior: "smooth" });
    });
  }

  function renderPiles(s) {
    const panel = $("actionPilesPanel");
    panel.hidden = s.phase !== "action";
    if (panel.hidden) return;
    [0, 1].forEach((index) => {
      const btn = $(`pile${index}Btn`);
      const top = s.actionPiles[index][0];
      btn.disabled = s.phase !== "action" || Boolean(s.currentAction) || !top;
      btn.innerHTML = top
        ? `<img src="${top.image}" alt="行动牌 ${top.page}"><span>牌堆 ${index + 1} · ${s.actionPiles[index].length} 张</span>`
        : `<span>牌堆 ${index + 1} 已空</span>`;
    });
    $("replantBtn").disabled = s.phase !== "action" || s.usedReplant || Boolean(s.currentAction);
  }

  function renderCurrentAction(s) {
    const panel = $("currentActionPanel");
    const current = s.currentAction;
    panel.hidden = !current;
    if (!current) return;
    const kindText = current.cubeKind === "water" ? "水" : "腐败";
    $("currentActionTitle").textContent = current.step === "choice"
      ? "资源选择"
      : (current.step === "lantern" ? "石灯笼选择" : (current.step === "water" ? "浇水放置" : `腐败放置 ${current.rotIndex + 1}`));
    $("currentActionCard").innerHTML = `<img src="${current.image}" alt="当前行动牌">`;
    $("placementCount").textContent = `${tempSelection.length} / ${current.requiredCount} ${kindText}`;
    $("submitPlacementBtn").disabled = tempSelection.length !== current.requiredCount;
    $("submitPlacementBtn").hidden = current.step === "choice" || current.step === "lantern";
    $("clearPlacementBtn").hidden = current.step === "choice" || current.step === "lantern";
    $("placementCount").hidden = current.step === "choice" || current.step === "lantern";
    renderResiliencyControl(current);
    renderResourceChoiceControl(current);
    renderLanternChoiceControl(current);
    $("placementHint").textContent = current.validationHint;
    $("placementHint").className = current.validationError ? "placement-hint error" : "placement-hint";
  }

  function renderResourceChoiceControl(current) {
    const panel = $("resourceChoiceControl");
    const choice = current.pendingChoice;
    panel.hidden = current.step !== "choice" || !choice;
    if (panel.hidden) return;
    $("resourceChoiceLabel").textContent = `${choice.reason}：选择获得的资源（剩余 ${choice.remaining} 次）`;
  }

  function renderLanternChoiceControl(current) {
    const panel = $("lanternChoiceControl");
    const lantern = current.pendingLantern;
    panel.hidden = current.step !== "lantern" || !lantern;
    if (panel.hidden) return;
    $("lanternChoiceLabel").textContent = `第 ${lantern.x + 1} 列第 ${lantern.y + 1} 行石灯笼（剩余 ${lantern.remaining} 个）`;
  }

  function renderGardenShop(s) {
    const panel = $("gardenShopPanel");
    panel.hidden = s.phase !== "upgrade";
    if (panel.hidden) return;
    $("gardenShopHint").textContent = s.expansionOffer.length ? `${s.expansionOffer.length} 张可购买` : "没有可购买扩展";
    const offer = $("expansionOffer");
    offer.innerHTML = "";
    if (!s.expansionOffer.length) {
      offer.innerHTML = `<p class="empty-note">本阶段没有剩余扩展牌。</p>`;
      return;
    }
    for (const card of s.expansionOffer) {
      const item = document.createElement("article");
      item.className = "shop-card";

      const preview = document.createElement("button");
      preview.type = "button";
      preview.className = "shop-card-preview";
      preview.title = card.name;
      preview.setAttribute("aria-label", `查看 ${card.name} 详情`);
      preview.innerHTML = `<img src="${card.image}" alt="${escapeHtml(card.name)}">`;
      preview.addEventListener("click", () => openCardDialog(card));

      const meta = document.createElement("div");
      meta.className = "shop-card-meta";
      meta.innerHTML = `<strong>${escapeHtml(gardenLabelName(card.name))}</strong><span>${card.cost} 花 · ${card.vp} 分</span>`;

      const buy = document.createElement("button");
      buy.type = "button";
      buy.className = "shop-card-buy";
      buy.disabled = s.resources.blossom < card.cost;
      buy.textContent = `购买 ${card.cost} 花`;
      buy.setAttribute("aria-label", `购买 ${card.name}，花费 ${card.cost} 花`);
      buy.addEventListener("click", () => {
        window.AleasGarden.buyExpansion(card.instanceId);
        clearTemp();
        saveGame();
        render();
      });

      item.append(preview, meta, buy);
      offer.appendChild(item);
    }
  }

  function renderEndgameDeckUpgrades(s) {
    const panel = $("endgameDeckUpgradePanel");
    panel.hidden = s.phase !== "endgame-upgrade";
    if (panel.hidden) return;
    const deckCards = s.gardenDeck.filter((card) => !card.upgraded);
    $("endgameDeckUpgradeHint").textContent = deckCards.length ? `${deckCards.length} 张未升级` : "牌库已全部升级";
    const list = $("endgameDeckUpgrades");
    list.innerHTML = "";
    if (!deckCards.length) {
      list.innerHTML = `<p class="empty-note">牌库中没有未升级的花园牌。</p>`;
      return;
    }
    for (const card of deckCards) {
      const item = document.createElement("article");
      item.className = "endgame-upgrade-item";

      const detail = document.createElement("button");
      detail.type = "button";
      detail.className = "endgame-card-detail";
      detail.innerHTML = `<strong>${escapeHtml(gardenLabelName(card.name))}</strong><span>${escapeHtml(card.name)}</span><small>${card.cost} 花 · ${card.vp} 分</small>`;
      detail.setAttribute("aria-label", `查看 ${card.name} 详情`);
      detail.addEventListener("click", () => openCardDialog(card));

      item.append(detail, gardenUpgradeButton(card, s.resources.blossom, "endgame-upgrade-btn"));
      list.appendChild(item);
    }
  }

  function renderResiliencyControl(current) {
    const panel = $("resiliencyControl");
    const show = current.step === "rot" && current.maxResiliencyForThisRot > 0;
    panel.hidden = !show;
    if (!show) return;
    $("resiliencyLabel").textContent = `本段使用韧性（${current.rawRequiredCount} - ${current.appliedResiliency} = ${current.requiredCount}）`;
    $("rotReductionText").textContent = `${current.appliedResiliency} / ${current.maxResiliencyForThisRot}`;
    $("rotReductionMinusBtn").disabled = current.appliedResiliency <= 0;
    $("rotReductionPlusBtn").disabled = current.appliedResiliency >= current.maxResiliencyForThisRot;
  }

  function renderUpgrade(s) {
    const panel = $("upgradePanel");
    panel.hidden = !(s.phase === "upgrade" || s.phase === "endgame-upgrade");
    if (panel.hidden) return;
    $("upgradeTitle").textContent = s.phase === "endgame-upgrade" ? "终局升级" : "升级阶段";
    $("finishUpgradeBtn").textContent = s.phase === "endgame-upgrade" ? "终局计分" : "完成阶段";
    $("upgradePanelHint").textContent = s.phase === "endgame-upgrade"
      ? "终局可升级当前花园和牌库中的所有花园牌。"
      : "在当前花园下方升级可见卡牌，或从左侧商店购买扩展。";
  }

  function renderDeckPreview(s) {
    const preview = $("deckPreview");
    preview.innerHTML = "";
    s.gardenDeck.slice(-12).reverse().forEach((card) => {
      const img = document.createElement("img");
      img.src = card.image;
      img.alt = card.name;
      preview.appendChild(img);
    });
  }

  function renderDiscardPreview(s) {
    const preview = $("discardPreview");
    preview.innerHTML = "";
    const cards = [...(s.actionDiscard || [])].reverse();
    if (!cards.length) {
      preview.innerHTML = `<p class="empty-note">暂无弃牌</p>`;
      return;
    }
    cards.forEach((card) => {
      const img = document.createElement("img");
      img.src = card.image;
      img.alt = `行动牌第 ${card.page} 页`;
      preview.appendChild(img);
    });
  }

  function renderLog(s) {
    const list = $("logList");
    if (!list) return;
    list.innerHTML = "";
    for (const entry of s.log.slice(0, 80)) {
      const li = document.createElement("li");
      li.className = `log-${entry.type}`;
      li.textContent = entry.message;
      list.appendChild(li);
    }
  }

  function toggleTemp(plot) {
    const s = window.AleasGarden.getState();
    if (!s.currentAction || plot.cube) return;
    const existing = tempSelection.findIndex((cell) => cell.x === plot.x && cell.y === plot.y);
    if (existing >= 0) {
      tempSelection.splice(existing, 1);
    } else if (tempSelection.length < s.currentAction.requiredCount) {
      tempSelection.push({ x: plot.x, y: plot.y });
    }
    syncTempDebugState();
    render();
  }

  function adjustRotReduction(delta) {
    const current = window.AleasGarden.getState().currentAction;
    if (!current) return;
    window.AleasGarden.setRotReduction(current.appliedResiliency + delta);
    clearTemp();
    saveGame();
    render();
  }

  function tempKindFor(key, current) {
    if (!current) return "";
    return tempSelection.some((cell) => `${cell.x},${cell.y}` === key) ? current.cubeKind : "";
  }

  function currentActionRound(s) {
    return (s.actionDiscardCount || 0) + 1;
  }

  function cubeLabel(kind, round) {
    const name = kind === "water" ? "水" : "腐败";
    return round ? `第 ${round} 轮放置的${name}` : name;
  }

  function actionSignature(s) {
    const a = s.currentAction;
    return a ? `${a.step}:${a.rotIndex}:${a.page}:${a.requiredCount}` : "none";
  }

  function clearTemp() {
    tempSelection = [];
    syncTempDebugState();
  }

  function syncTempDebugState() {
    window.__aleaTempSelection = tempSelection.map((cell) => ({ x: cell.x, y: cell.y }));
    window.__aleaTempSelectionCount = tempSelection.length;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[ch]);
  }

  function sizeAutomationCanvas() {
    const canvas = $("automationCanvas");
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  init();
})();
