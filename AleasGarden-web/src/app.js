(() => {
  const $ = (id) => document.getElementById(id);
  const phaseNames = {
    action: "行动",
    upgrade: "升级",
    "endgame-upgrade": "终局升级",
    gameover: "结束",
  };
  const slotLefts = [17.8, 50.0, 82.2];
  const slotTops = [13.0, 34.7, 58.0, 81.3];
  const plotMarkLabels = {
    empty: "普空",
    upgradedEmpty: "升空",
    blossom: "花",
    sun: "日",
    pine: "松",
    mitsudomoe: "巴",
    mushroom: "菇",
    chidori: "千",
    parasol: "伞",
    raked: "砂",
    spring: "风",
    tea: "茶",
    butterflies: "蝶",
    dragonfly: "蜓",
    crane: "鹤",
    koi: "鲤",
    bridge: "桥",
    mist: "雾",
    lotus: "莲",
    treasure: "结",
    lantern: "灯",
  };
  const plotMarkIcons = {
    empty: "□",
    upgradedEmpty: "■",
    blossom: "✿",
    sun: "☀",
    pine: "♠",
    mitsudomoe: "巴",
    mushroom: "菇",
    chidori: "千",
    parasol: "伞",
    raked: "砂",
    spring: "风",
    tea: "茶",
    butterflies: "蝶",
    dragonfly: "蜓",
    crane: "鹤",
    koi: "鲤",
    bridge: "桥",
    mist: "雾",
    lotus: "莲",
    treasure: "结",
    lantern: "灯",
  };
  const resourceMarkLabels = { blossom: "花", sun: "日", resiliency: "韧", vp: "分" };
  const themeStorageKey = "aleasGardenTheme";
  const saveStorageKey = "aleasGardenSaveV1";
  const saveVersion = 2;
  const saveFileFormat = "aleas-garden-save";
  const activeLayoutsStorageKey = "aleasGardenLayoutsActiveV1";
  const draftLayoutsStorageKey = "aleasGardenLayoutsDraftV1";
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
  let catalogMarksVisible = false;
  let catalogLayoutEditing = false;
  let layoutDraft = null;
  let layoutUndoStack = [];
  let selectedLayoutCell = null;
  let openGardenCardId = null;
  const trackMarkerTimers = {};

  function init() {
    initTheme();
    loadStoredLayouts();
    sizeAutomationCanvas();
    bind();
    const seed = new URLSearchParams(location.search).get("seed");
    if (seed) {
      $("seedInput").value = seed;
      window.AleasGarden.newGame({ seed });
      saveGame("已按链接种子开新局并保存。");
    } else if (!restoreSavedGame()) {
      const incompatible = window.__aleaSaveStatus?.message === "存档版本不兼容。";
      window.AleasGarden.newGame({ seed: $("seedInput").value });
      saveGame(incompatible ? "旧版存档与多列布局不兼容，已开始新局。" : "新局已保存。");
    }
    clearTemp();
    resetGardenAnimationSnapshot();
    render();
  }

  function bind() {
    window.addEventListener("resize", () => {
      sizeAutomationCanvas();
      if (!window.matchMedia("(max-width: 640px) and (orientation: portrait)").matches) setMobileMenu(false);
    });
    $("mobileMenuBtn").addEventListener("click", (event) => {
      event.stopPropagation();
      setMobileMenu(!$("topToolbar").classList.contains("is-open"));
    });
    $("topToolbar").addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("button")) setMobileMenu(false);
    });
    document.addEventListener("click", (event) => {
      const topbar = document.querySelector(".topbar");
      if (topbar && event.target instanceof Node && !topbar.contains(event.target)) setMobileMenu(false);
    });
    $("themeToggleBtn").addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      setTheme(next, true);
    });
    $("newGameBtn").addEventListener("click", () => {
      promoteLayoutDraft();
      window.AleasGarden.newGame();
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
    $("importSaveBtn").addEventListener("click", () => $("importSaveInput").click());
    $("importSaveInput").addEventListener("change", importSavedGame);
    $("exportSaveBtn").addEventListener("click", exportSavedGame);
    $("rulesBtn").addEventListener("click", () => $("rulesDialog").showModal());
    $("closeRulesBtn").addEventListener("click", () => $("rulesDialog").close());
    $("catalogBtn").addEventListener("click", () => {
      renderCatalog();
      syncCatalogMarksVisibility();
      $("catalogDialog").showModal();
    });
    $("catalogMarksToggle").addEventListener("change", (event) => {
      catalogMarksVisible = Boolean(event.currentTarget.checked);
      syncCatalogMarksVisibility();
    });
    $("catalogEditLayoutsBtn").addEventListener("click", toggleLayoutEditor);
    $("undoLayoutBtn").addEventListener("click", undoLayoutEdit);
    $("resetAllLayoutsBtn").addEventListener("click", resetAllLayouts);
    $("exportLayoutsBtn").addEventListener("click", exportLayouts);
    $("importLayoutsBtn").addEventListener("click", () => $("importLayoutsInput").click());
    $("importLayoutsInput").addEventListener("change", importLayouts);
    $("layoutPlotTypeSelect").addEventListener("change", applySelectedLayoutCell);
    $("layoutGoldenToggle").addEventListener("change", applySelectedLayoutCell);
    $("resetLayoutFaceBtn").addEventListener("click", resetSelectedLayoutFace);
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
      if (event.key !== "Escape") return;
      if ($("cardDialog").open) $("cardDialog").close();
      setMobileMenu(false);
    });
  }

  function setMobileMenu(open) {
    const toolbar = $("topToolbar");
    const button = $("mobileMenuBtn");
    if (!toolbar || !button) return;
    toolbar.classList.toggle("is-open", Boolean(open));
    button.setAttribute("aria-expanded", String(Boolean(open)));
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

  function cloneData(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readLayoutStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const migrated = window.AleasGarden.migrateGardenLayouts(parsed);
      if (JSON.stringify(parsed) !== JSON.stringify(migrated)) localStorage.setItem(key, JSON.stringify(migrated));
      return migrated;
    } catch (_error) {
      return null;
    }
  }

  function loadStoredLayouts() {
    const active = readLayoutStorage(activeLayoutsStorageKey) || window.AleasGarden.getDefaultGardenLayouts();
    window.AleasGarden.installGardenLayouts(active);
    layoutDraft = readLayoutStorage(draftLayoutsStorageKey);
    updateLayoutStatus();
  }

  function saveLayoutDraft(next, pushUndo = true) {
    window.AleasGarden.validateGardenLayouts(next);
    if (pushUndo) layoutUndoStack.push(cloneData(layoutDraft || window.AleasGarden.getGardenLayouts()));
    const matchesActive = JSON.stringify(next) === JSON.stringify(window.AleasGarden.getGardenLayouts());
    layoutDraft = matchesActive ? null : cloneData(next);
    try {
      if (layoutDraft) localStorage.setItem(draftLayoutsStorageKey, JSON.stringify(layoutDraft));
      else localStorage.removeItem(draftLayoutsStorageKey);
    } catch (_error) {
      flashStatus("布局已修改，但浏览器无法保存草稿。");
    }
    updateLayoutStatus(layoutDraft ? "布局草稿已自动保存，下一局生效。" : "修改已撤销，当前没有待生效草稿。");
  }

  function promoteLayoutDraft() {
    if (!layoutDraft) return false;
    window.AleasGarden.installGardenLayouts(layoutDraft);
    try {
      localStorage.setItem(activeLayoutsStorageKey, JSON.stringify(layoutDraft));
      localStorage.removeItem(draftLayoutsStorageKey);
    } catch (_error) {
      flashStatus("布局已用于本次新游戏，但无法持久保存。");
    }
    layoutDraft = null;
    layoutUndoStack = [];
    selectedLayoutCell = null;
    updateLayoutStatus("布局草稿已应用到新游戏。");
    return true;
  }

  function updateLayoutStatus(message = "") {
    const status = $("catalogLayoutStatus");
    if (status) status.textContent = message || (layoutDraft ? "有布局草稿：下一局生效" : "当前没有待生效的布局修改");
    const undo = $("undoLayoutBtn");
    if (undo) undo.disabled = !layoutUndoStack.length;
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

  function exportSavedGame() {
    try {
      const now = new Date();
      const archive = {
        format: saveFileFormat,
        version: saveVersion,
        exportedAt: now.toISOString(),
        game: JSON.parse(window.AleasGarden.serialize()),
      };
      const blob = new Blob([`${JSON.stringify(archive, null, 2)}\n`], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `aleas-garden-save-${fileTimestamp(now)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      flashStatus("存档已导出为 JSON 文件。");
      render();
    } catch (_error) {
      flashStatus("导出存档失败，当前游戏未更改。");
      render();
    }
  }

  async function importSavedGame(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const serialized = parseSaveArchive(await file.text());
      const confirmed = window.confirm("导入会覆盖当前游戏，是否继续？");
      if (!confirmed) {
        flashStatus("已取消导入，当前游戏未更改。");
        render();
        return;
      }
      window.AleasGarden.load(serialized);
      clearTemp();
      resetTrackMarkers();
      resetGardenAnimationSnapshot();
      saveGame("存档已导入并保存。");
      render();
    } catch (error) {
      const detail = error instanceof Error && error.message ? `：${error.message}` : "";
      flashStatus(`导入存档失败${detail}`);
      render();
    } finally {
      input.value = "";
    }
  }

  function parseSaveArchive(text) {
    let archive;
    try {
      archive = JSON.parse(text);
    } catch (_error) {
      throw new Error("文件不是有效的 JSON");
    }
    if (!archive || typeof archive !== "object" || Array.isArray(archive)) throw new Error("存档包结构无效");
    if (archive.format !== saveFileFormat) throw new Error("不是 Alea's Garden 存档文件");
    if (archive.version !== saveVersion) throw new Error("存档版本不兼容");
    if (!archive.game || typeof archive.game !== "object" || Array.isArray(archive.game)) throw new Error("缺少游戏状态");
    const serialized = JSON.stringify(archive.game);
    window.AleasGarden.validateSave(serialized);
    return serialized;
  }

  function fileTimestamp(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  function downloadJson(value, filename) {
    const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
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
    const board = document.querySelector(".track-board");
    const activeIds = new Set(markers.map((marker) => marker.elementId));
    board?.querySelectorAll('[data-dynamic-track-marker="true"]').forEach((el) => {
      if (activeIds.has(el.id)) return;
      clearTimeout(trackMarkerTimers[el.id]);
      delete trackMarkerTimers[el.id];
      el.remove();
    });
    for (const marker of markers) {
      let el = $(marker.elementId);
      const isNew = !el;
      if (!el && board) {
        el = document.createElement("span");
        el.id = marker.elementId;
        el.className = `track-marker ${marker.kind}`;
        el.dataset.trackMarker = marker.kind;
        el.dataset.dynamicTrackMarker = "true";
        board.appendChild(el);
      }
      if (!el) continue;
      const changed = el.dataset.cell && el.dataset.cell !== marker.cell;
      el.style.setProperty("--marker-x", `${marker.x}%`);
      el.style.setProperty("--marker-y", `${marker.y}%`);
      el.style.setProperty("--marker-offset-x", `${marker.offsetX || 0}px`);
      el.style.setProperty("--marker-offset-y", `${marker.offsetY || 0}px`);
      el.style.zIndex = String(2 + (marker.stackIndex || 0));
      el.dataset.cell = marker.cell;
      el.dataset.value = marker.value;
      el.dataset.markerRole = marker.role || "current";
      el.setAttribute("aria-label", marker.ariaLabel);
      el.title = marker.ariaLabel;
      if (trackMarkersReady && (isNew || changed)) pulseTrackMarker(el, marker.elementId);
    }
    trackMarkersReady = true;
  }

  function trackMarkerData(s) {
    const yearValue = Math.min(Math.max(Number(s.year) || 1, 1), 5);
    const blossomValue = Math.max(0, Number(s.resources.blossom) || 0);
    const sunValue = Math.min(10, Math.max(0, Number(s.resources.sun) || 0));
    const blossomMarkers = s.tracks?.blossom?.markers || localBlossomTrackMarkers(blossomValue);
    return [
      makeTrackMarker("year", yearValue, yearValue, { elementId: "yearMarker" }),
      ...blossomMarkers.map((marker) => makeTrackMarker("blossom", blossomValue, marker.slotValue, {
        elementId: marker.role === "current" ? "blossomMarker" : `blossomBankMarker${marker.index + 1}`,
        displayValue: marker.displayValue,
        cell: marker.cell,
        role: marker.role,
        stackIndex: marker.role === "banked" ? marker.index : 0,
        ariaLabel: marker.role === "banked"
          ? `花朵累计十点指示物 ${marker.index + 1}，总计 ${blossomValue}`
          : (blossomValue > 10 ? `花朵当前区间 ${marker.displayValue}，总计 ${blossomValue}` : `花朵 ${blossomValue}`),
      })),
      makeTrackMarker("sun", sunValue, sunValue, { elementId: "sunMarker" }),
    ];
  }

  function localBlossomTrackMarkers(value) {
    if (value <= 10) return [{ role: "current", index: 0, slotValue: value, displayValue: String(value), cell: `blossom-${value}` }];
    const bankedCount = Math.floor((value - 1) / 10);
    const currentValue = ((value - 1) % 10) + 1;
    return [
      ...Array.from({ length: bankedCount }, (_, index) => ({ role: "banked", index, slotValue: 11, displayValue: "10+", cell: "blossom-10+" })),
      { role: "current", index: 0, slotValue: currentValue, displayValue: String(currentValue), cell: `blossom-${currentValue}` },
    ];
  }

  function makeTrackMarker(kind, value, slotValue, options = {}) {
    const config = trackSlots[kind];
    const slotIndex = kind === "year" ? slotValue - 1 : slotValue;
    const displayValue = options.displayValue || String(value);
    const stackIndex = options.stackIndex || 0;
    return {
      kind,
      value,
      displayValue,
      label: { year: "年份", blossom: "花朵", sun: "阳光" }[kind],
      elementId: options.elementId || `${kind}Marker`,
      cell: options.cell || `${kind}-${displayValue}`,
      role: options.role || "current",
      stackIndex,
      offsetX: kind === "blossom" && options.role === "banked" ? -(stackIndex % 4) * 7 : 0,
      offsetY: kind === "blossom" && options.role === "banked" ? -Math.floor(stackIndex / 4) * 7 : 0,
      ariaLabel: options.ariaLabel || `${{ year: "年份", blossom: "花朵", sun: "阳光" }[kind]} ${displayValue}`,
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
    document.querySelectorAll("[data-track-marker]").forEach((el) => {
      el.classList.remove("is-moving");
      delete el.dataset.cell;
      delete el.dataset.value;
      if (el.dataset.dynamicTrackMarker === "true") el.remove();
    });
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
    const totalColumns = s.garden.reduce((max, card) => Math.max(max, Number(card.columnEnd) + 1), 0);
    stage.style.setProperty("--cols", totalColumns);
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
      if (index > 0) {
        const previousColumns = s.garden[index - 1].columns || 1;
        el.style.marginLeft = `calc(var(--garden-step) * ${previousColumns} - var(--garden-card-w))`;
      }
      const media = document.createElement("div");
      media.className = "card-media";
      media.innerHTML = `<img src="${card.image}" alt="${escapeHtml(card.name)}">`;
      for (const plot of card.plots) {
        const slot = document.createElement("button");
        slot.type = "button";
        slot.className = "card-slot";
        slot.style.left = `${slotLefts[plot.localX] ?? slotLefts[0]}%`;
        slot.style.top = `${slotTops[plot.y]}%`;
        slot.dataset.key = plot.key;
        slot.dataset.x = plot.x;
        slot.dataset.y = plot.y;
        slot.disabled = !s.currentAction || s.currentAction.step === "choice" || s.currentAction.step === "lantern" || Boolean(plot.cube);
        slot.addEventListener("click", () => toggleTemp(plot));
        const tempKind = tempKindFor(plot.key, s.currentAction);
        const cubeKind = plot.cube || tempKind;
        const cubeRound = plot.cube ? plot.cubeRound : (tempKind ? currentActionRound(s) : null);
        slot.setAttribute("aria-label", `${card.name} 牌内第 ${Number(plot.localX) + 1} 列第 ${plot.y + 1} 行${cubeKind ? `，${cubeLabel(cubeKind, cubeRound)}` : ""}`);
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
      columnControls.style.setProperty("--card-columns", card.columns || 1);
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
      const range = card.columnStart === card.columnEnd ? `${card.columnStart + 1}` : `${card.columnStart + 1}–${card.columnEnd + 1}`;
      label.setAttribute("aria-label", `全局第 ${range} 列：${card.name}，${card.upgraded ? `${card.vp} 分` : `${card.cost} 花`}`);
      label.innerHTML = `<strong>${index + 1}</strong><span>${escapeHtml(labelName)}</span><small>列 ${range} · ${card.upgraded ? `${card.vp} 分` : `${card.cost} 花`}</small>`;
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
    const cardId = card.id || card.defId;
    if (cardId) {
      openGardenCardId = cardId;
      card = catalogGardenCards().find((item) => item.id === cardId) || card;
    }
    const shortName = gardenLabelName(card.name);
    $("cardDialogTitle").textContent = `${shortName} · ${card.name}`;
    $("cardDialogMeta").textContent = `升级费用 ${card.cost} 花 · 升级后 ${card.vp} 分`;
    $("cardDetailImages").innerHTML = [
      cardFigure("基础面", card.frontImage, `${card.name} 基础面，第 ${card.frontPage} 页`, `${gardenProgramOverlay(card.frontPlots)}${layoutEditorOverlay(card.id, "front", card.frontPlots)}`),
      cardFigure(card.upgraded ? "升级面（当前）" : "升级面", card.backImage, `${card.name} 升级面，第 ${card.backPage} 页`, `${gardenProgramOverlay(card.backPlots)}${layoutEditorOverlay(card.id, "back", card.backPlots)}`),
    ].join("");
    $("cardDetailImages").querySelectorAll(".layout-candidate").forEach((button) => {
      button.addEventListener("click", () => selectLayoutCell(button.dataset.cardId, button.dataset.side, Number(button.dataset.x), Number(button.dataset.y)));
    });
    renderCardEffects(card);
    syncLayoutEditorPanel();
    syncCatalogMarksVisibility();
    if (!$("cardDialog").open) $("cardDialog").showModal();
  }

  function cardFigure(title, image, alt, overlay = "") {
    return `
      <figure class="card-detail-figure">
        <figcaption>${escapeHtml(title)}</figcaption>
        <div class="catalog-image-stack detail-image-stack">
          <img src="${image}" alt="${escapeHtml(alt)}">
          ${overlay}
        </div>
      </figure>
    `;
  }

  function syncCatalogMarksVisibility() {
    const toggle = $("catalogMarksToggle");
    if (toggle) toggle.checked = catalogMarksVisible;
    $("catalogDialog")?.classList.toggle("show-program-marks", catalogMarksVisible);
    $("cardDialog")?.classList.toggle("show-program-marks", catalogMarksVisible);
  }

  function gardenProgramOverlay(plots = []) {
    const columnCount = Math.max(1, ...plots.map((plot) => Number(plot.localX ?? 0) + 1));
    const columnClass = columnCount > 1 ? ` is-multi-column columns-${columnCount}` : " is-single-column";
    const markers = plots.map((plot) => {
      const key = plot.plot === "empty" && plot.upgraded ? "upgradedEmpty" : (plot.plot || "empty");
      const label = plotMarkLabels[key] || plot.icon || key;
      const icon = plotMarkIcons[key] || plot.icon || label;
      const goldClass = plot.golden ? " is-golden" : "";
      const upgradedClass = plot.plot === "empty" && plot.upgraded ? " is-upgraded-empty" : "";
      const gold = plot.golden ? `<span class="program-gold-mark">金</span>` : "";
      return `
        <span class="garden-program-mark${goldClass}${upgradedClass}" style="--mark-left:${slotLefts[plot.localX] ?? slotLefts[0]}%;--mark-top:${slotTops[plot.y] ?? 50}%">
          <span class="program-row-mark">${Number(plot.localX ?? 0) + 1},${Number(plot.y) + 1}</span>
          <span class="program-plot-icon">${escapeHtml(icon)}</span>
          <span class="program-plot-label">${escapeHtml(label)}</span>
          ${gold}
        </span>
      `;
    }).join("");
    return `<span class="program-overlay garden-program-overlay${columnClass}" aria-hidden="true">${markers}</span>`;
  }

  function layoutEditorOverlay(cardId, sideName, plots = []) {
    if (!catalogLayoutEditing || !cardId) return "";
    const byKey = new Map(plots.map((plot) => [`${plot.localX},${plot.y}`, plot]));
    const cells = [];
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        const plot = byKey.get(`${x},${y}`);
        const selected = selectedLayoutCell?.cardId === cardId && selectedLayoutCell.side === sideName
          && selectedLayoutCell.x === x && selectedLayoutCell.y === y;
        const type = plot?.plot || "none";
        const displayType = type === "empty" && plot?.upgraded ? "upgradedEmpty" : type;
        const label = plot ? `${plotMarkIcons[displayType] || plotMarkLabels[displayType] || displayType}${plot.golden ? " 金" : ""}` : "+";
        cells.push(`<button class="layout-candidate${plot ? " has-plot" : " is-missing"}${plot?.golden ? " is-golden" : ""}${plot?.plot === "empty" && plot.upgraded ? " is-upgraded-empty" : ""}${selected ? " is-selected" : ""}" type="button" data-card-id="${cardId}" data-side="${sideName}" data-x="${x}" data-y="${y}" style="--candidate-left:${slotLefts[x]}%;--candidate-top:${slotTops[y]}%" aria-label="${sideName === "front" ? "基础面" : "升级面"}第 ${x + 1} 列第 ${y + 1} 行：${escapeHtml(plot ? plotMarkLabels[displayType] : "无地块")}"><small>${x + 1},${y + 1}</small>${escapeHtml(label)}</button>`);
      }
    }
    return `<span class="layout-editor-overlay">${cells.join("")}</span>`;
  }

  function actionProgramOverlay(card) {
    const water = actionWaterOverlay(card.water);
    const rot = (card.rot || []).map((requirement, index) => actionRotMark(requirement, index));
    if (card.flags?.doubleResiliency) rot.push(`<span class="action-program-chip">韧性 ×2</span>`);
    if (!rot.length) rot.push(`<span class="action-program-chip is-empty">无腐败</span>`);
    const bonus = Object.entries(card.bonus || {}).map(([kind, amount]) => (
      `<span class="action-program-chip is-bonus">+${escapeHtml(amount)} ${escapeHtml(resourceMarkLabels[kind] || kind)}</span>`
    ));
    if (!bonus.length) bonus.push(`<span class="action-program-chip is-empty">无奖励</span>`);
    return `
      <span class="program-overlay action-program-overlay" aria-hidden="true">
        <span class="action-program-zone action-water-zone"><b>浇水</b>${water}</span>
        <span class="action-program-zone action-rot-zone"><b>腐败</b><span class="action-program-chips">${rot.join("")}</span></span>
        <span class="action-program-zone action-bonus-zone"><b>奖励</b><span class="action-program-chips">${bonus.join("")}</span></span>
      </span>
    `;
  }

  function actionWaterOverlay(water) {
    if (!Array.isArray(water)) {
      const count = Number(water?.count) || 0;
      if (water?.disconnected) {
        const marks = Array.from({ length: count }, () => "<i>水</i>").join("");
        return `<span class="action-connected-water is-disconnected"><span class="action-disconnected-water-pair">${marks}</span><small>不正交相邻</small></span>`;
      }
      return `<span class="action-connected-water">水 ×${count}<small>正交连通</small></span>`;
    }
    if (!water.length) return `<span class="action-program-chip is-empty">无浇水</span>`;
    const points = water.map((point) => Array.isArray(point)
      ? { x: point[0], y: point[1], coverPlots: [] }
      : { x: point.x, y: point.y, coverPlots: point.coverPlots || [] });
    const minX = Math.min(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const width = Math.max(...points.map((point) => point.x)) - minX + 1;
    const height = Math.max(...points.map((point) => point.y)) - minY + 1;
    const marks = points.map((point) => {
      const left = ((point.x - minX + 0.5) / width) * 100;
      const top = ((point.y - minY + 0.5) / height) * 100;
      const targets = (point.coverPlots || []).map((plot) => plotMarkLabels[plot] || plot).join("/");
      return `<span class="action-water-point${targets ? " has-target" : ""}" style="left:${left}%;top:${top}%">水${targets ? `<small>${escapeHtml(targets)}</small>` : ""}</span>`;
    }).join("");
    return `<span class="action-water-shape" style="--shape-ratio:${width} / ${height}">${marks}</span>`;
  }

  function actionRotMark(requirement, index) {
    const count = requirement.milestoneFormula === "fiveMinusCurrent"
      ? "5−里程碑"
      : (requirement.milestone ? "6−里程碑" : requirement.count);
    const flags = [];
    if (requirement.locked) flags.push("锁");
    if (requirement.line) flags.push("直线");
    if (requirement.diagonal) flags.push("对角");
    if (requirement.cover) flags.push("非空");
    if (requirement.coverPlots?.length) flags.push(`覆${requirement.coverPlots.map((plot) => plotMarkLabels[plot] || plot).join("/")}`);
    return `<span class="action-program-chip is-rot"><i>${index + 1}</i>腐 ×${escapeHtml(count)}${flags.length ? `<small>${escapeHtml(flags.join(" · "))}</small>` : ""}</span>`;
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

  function layoutPlotsForCatalog(side) {
    return (side?.plots || []).map((entry) => ({
      localX: entry.x,
      y: entry.y,
      plot: entry.type,
      golden: Boolean(entry.golden),
      upgraded: Boolean(entry.upgraded),
      icon: plotMarkIcons[entry.type] || entry.type,
    }));
  }

  function catalogGardenCards() {
    const catalog = window.AleasGarden.getCatalog();
    const layouts = layoutDraft || window.AleasGarden.getGardenLayouts();
    return (catalog.gardenCards || []).map((card) => {
      const layout = layouts.cards[card.id];
      return {
        ...card,
        frontPlots: layoutPlotsForCatalog(layout.front),
        backPlots: layoutPlotsForCatalog(layout.back),
        frontColumns: layout.front.columns,
        backColumns: layout.back.columns,
      };
    });
  }

  function renderCatalog() {
    const catalog = window.AleasGarden.getCatalog();
    renderGardenCatalog(catalogGardenCards());
    renderActionCatalog(catalog.actionCards || []);
    renderEffectsCatalog(catalog.appendixEffects || {});
    setCatalogTab(document.querySelector(".catalog-tab.is-active")?.dataset.catalogTab || "garden");
    syncLayoutEditorUi();
  }

  function toggleLayoutEditor() {
    catalogLayoutEditing = !catalogLayoutEditing;
    if (catalogLayoutEditing) {
      catalogMarksVisible = true;
      setCatalogTab("garden");
    } else {
      selectedLayoutCell = null;
    }
    renderCatalog();
    syncCatalogMarksVisibility();
    if ($("cardDialog").open && openGardenCardId) openCardDialog({ id: openGardenCardId, name: openGardenCardId });
  }

  function syncLayoutEditorUi() {
    const button = $("catalogEditLayoutsBtn");
    if (button) {
      button.classList.toggle("is-active", catalogLayoutEditing);
      button.setAttribute("aria-pressed", String(catalogLayoutEditing));
      button.textContent = catalogLayoutEditing ? "退出编辑" : "编辑布局";
    }
    if ($("catalogLayoutTools")) $("catalogLayoutTools").hidden = !catalogLayoutEditing;
    $("catalogDialog")?.classList.toggle("is-layout-editing", catalogLayoutEditing);
    $("cardDialog")?.classList.toggle("is-layout-editing", catalogLayoutEditing);
    updateLayoutStatus();
  }

  function selectLayoutCell(cardId, side, x, y) {
    selectedLayoutCell = { cardId, side, x, y };
    const card = catalogGardenCards().find((item) => item.id === cardId);
    if (card) openCardDialog(card);
  }

  function selectedLayoutEntry(layouts = layoutDraft || window.AleasGarden.getGardenLayouts()) {
    if (!selectedLayoutCell) return null;
    const side = layouts.cards?.[selectedLayoutCell.cardId]?.[selectedLayoutCell.side];
    return side?.plots.find((plot) => plot.x === selectedLayoutCell.x && plot.y === selectedLayoutCell.y) || null;
  }

  function syncLayoutEditorPanel() {
    const panel = $("layoutEditorPanel");
    if (!panel) return;
    panel.hidden = !catalogLayoutEditing || !openGardenCardId;
    if (panel.hidden) return;
    const entry = selectedLayoutEntry();
    const selection = $("layoutEditorSelection");
    if (!selectedLayoutCell || selectedLayoutCell.cardId !== openGardenCardId) {
      selection.textContent = "请点击基础面或升级面原图上的任一候选格。";
      $("layoutPlotTypeSelect").disabled = true;
      $("layoutGoldenToggle").disabled = true;
      $("resetLayoutFaceBtn").disabled = true;
      return;
    }
    const faceLabel = selectedLayoutCell.side === "front" ? "基础面" : "升级面";
    selection.textContent = `${faceLabel} · 第 ${selectedLayoutCell.x + 1} 列第 ${selectedLayoutCell.y + 1} 行`;
    $("layoutPlotTypeSelect").disabled = false;
    $("layoutPlotTypeSelect").value = entry?.type === "empty" && entry.upgraded ? "empty-upgraded" : (entry?.type || "none");
    const canGolden = entry && ["blossom", "sun", "pine"].includes(entry.type);
    $("layoutGoldenToggle").disabled = !canGolden;
    $("layoutGoldenToggle").checked = Boolean(canGolden && entry.golden);
    $("resetLayoutFaceBtn").disabled = false;
  }

  function applySelectedLayoutCell() {
    if (!selectedLayoutCell) return;
    const next = cloneData(layoutDraft || window.AleasGarden.getGardenLayouts());
    const side = next.cards[selectedLayoutCell.cardId][selectedLayoutCell.side];
    const selectedType = $("layoutPlotTypeSelect").value;
    const type = selectedType === "empty-upgraded" ? "empty" : selectedType;
    const upgraded = selectedType === "empty-upgraded";
    const golden = ["blossom", "sun", "pine"].includes(type) && $("layoutGoldenToggle").checked;
    side.plots = side.plots.filter((plot) => plot.x !== selectedLayoutCell.x || plot.y !== selectedLayoutCell.y);
    if (type !== "none") side.plots.push({ x: selectedLayoutCell.x, y: selectedLayoutCell.y, type, golden, upgraded });
    side.plots.sort((a, b) => a.y - b.y || a.x - b.x);
    side.columns = Math.max(1, ...side.plots.map((plot) => plot.x + 1));
    try {
      saveLayoutDraft(next);
    } catch (error) {
      flashStatus(error.message || "布局修改无效。");
      syncLayoutEditorPanel();
      return;
    }
    renderCatalog();
    openCardDialog({ id: selectedLayoutCell.cardId, name: selectedLayoutCell.cardId });
  }

  function undoLayoutEdit() {
    const previous = layoutUndoStack.pop();
    if (!previous) return;
    saveLayoutDraft(previous, false);
    renderCatalog();
    if ($("cardDialog").open && openGardenCardId) openCardDialog({ id: openGardenCardId, name: openGardenCardId });
  }

  function resetSelectedLayoutFace() {
    if (!selectedLayoutCell) return;
    const next = cloneData(layoutDraft || window.AleasGarden.getGardenLayouts());
    const defaults = window.AleasGarden.getDefaultGardenLayouts();
    next.cards[selectedLayoutCell.cardId][selectedLayoutCell.side] = cloneData(defaults.cards[selectedLayoutCell.cardId][selectedLayoutCell.side]);
    saveLayoutDraft(next);
    renderCatalog();
    openCardDialog({ id: selectedLayoutCell.cardId, name: selectedLayoutCell.cardId });
  }

  function resetAllLayouts() {
    saveLayoutDraft(window.AleasGarden.getDefaultGardenLayouts());
    selectedLayoutCell = null;
    renderCatalog();
    if ($("cardDialog").open && openGardenCardId) openCardDialog({ id: openGardenCardId, name: openGardenCardId });
  }

  function exportLayouts() {
    const layouts = layoutDraft || window.AleasGarden.getGardenLayouts();
    downloadJson(layouts, `aleas-garden-layouts-${new Date().toISOString().slice(0, 10)}.json`);
    updateLayoutStatus("已导出完整布局 JSON。");
  }

  async function importLayouts(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const migrated = window.AleasGarden.migrateGardenLayouts(parsed);
      saveLayoutDraft(migrated);
      selectedLayoutCell = null;
      renderCatalog();
      updateLayoutStatus("导入成功：完整布局已保存为下一局草稿。");
    } catch (error) {
      updateLayoutStatus(`导入失败：${error.message || "JSON 无效"}`);
    }
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
          ${catalogImageButton("基础面", card.frontImage, `${card.name} 基础面`, gardenProgramOverlay(card.frontPlots))}
          ${catalogImageButton("升级面", card.backImage, `${card.name} 升级面`, gardenProgramOverlay(card.backPlots))}
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
          <span class="catalog-image-stack">
            <img src="${card.image}" alt="行动牌第 ${card.page} 页">
            ${actionProgramOverlay(card)}
          </span>
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

  function catalogImageButton(label, image, alt, overlay = "") {
    return `
      <button class="catalog-image-btn" type="button">
        <span>${escapeHtml(label)}</span>
        <span class="catalog-image-stack">
          <img src="${image}" alt="${escapeHtml(alt)}">
          ${overlay}
        </span>
      </button>
    `;
  }

  function openActionDialog(card) {
    openGardenCardId = null;
    $("cardDialogTitle").textContent = `行动牌 ${card.page}`;
    $("cardDialogMeta").textContent = `${card.waterText} · ${card.rotText} · ${card.bonusText}`;
    $("cardDetailImages").innerHTML = [
      cardFigure("行动牌", card.image, `行动牌第 ${card.page} 页`, actionProgramOverlay(card)),
    ].join("");
    const list = $("cardEffectList");
    list.innerHTML = "";
    for (const text of [`浇水：${card.waterText}`, `腐败：${card.rotText}`, `奖励：${card.bonusText}`]) {
      const li = document.createElement("li");
      li.textContent = text;
      list.appendChild(li);
    }
    syncLayoutEditorPanel();
    syncCatalogMarksVisibility();
    if (!$("cardDialog").open) $("cardDialog").showModal();
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
    $("replantBtn").disabled = !s.canReplant;
    $("replantBtn").title = s.canReplant ? "重新洗混并布置本年花园" : "Replant 只能在每年第一张行动牌选择前使用一次";
  }

  function renderCurrentAction(s) {
    const panel = $("currentActionPanel");
    const current = s.currentAction;
    document.querySelector(".action-zone")?.classList.toggle("has-current-action", Boolean(current));
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
