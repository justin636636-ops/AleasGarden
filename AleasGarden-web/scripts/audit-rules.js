const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const layoutCode = fs.readFileSync(path.join(root, "src/garden-layout-data.js"), "utf8");
const code = fs.readFileSync(path.join(root, "src/game.js"), "utf8");

function createGame() {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(layoutCode, sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.AleasGarden;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sameJson(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message}\nactual:   ${a}\nexpected: ${e}`);
}

function loadState(api, overrides) {
  const base = {
    seed: 1,
    year: 1,
    phase: "action",
    resources: { blossom: 0, sun: 0, resiliency: 0, vp: 0 },
    cubes: {},
    cubeRounds: {},
    cardMarks: {},
    garden: [],
    gardenDeck: [],
    expansionDeck: [],
    expansionOffer: [],
    actionPiles: [[], []],
    actionDiscard: [],
    currentAction: null,
    pendingChoice: null,
    usedReplant: false,
    nextRotAsWater: false,
    log: [],
    result: null,
  };
  return api.load(JSON.stringify({ state: { ...base, ...overrides }, nextInstance: 100, history: [], rngState: 1 }));
}

function action(sideId) {
  const page = Number(sideId.slice(1));
  const pairId = `ap${Math.ceil((page - 52) / 2)}`;
  return { card: { pairId, sideId }, sideId, step: "water", rotIndex: 0, rotReductions: {}, rotKeys: [], pendingChoice: null, validationError: "" };
}

function rotAction(sideId, rotIndex = 0) {
  return { ...action(sideId), step: "rot", rotIndex };
}

function catalogAudit() {
  const api = createGame();
  const catalog = api.getCatalog();
  const expectedEffectKeys = [
    "extension", "milestone", "golden", "mitsudomoe", "spring", "bridge", "butterflies", "dragonfly", "crane", "koi", "tea",
    "mushroom", "lantern", "mist", "raked", "parasol", "chidori", "lotus", "treasure",
  ];
  sameJson(Object.keys(catalog.appendixEffects), expectedEffectKeys, "appendix effect keys changed");
  assert(catalog.appendixEffects.chidori.text.includes("+1 花和 +1 阳光"), "chidori appendix text must mention blossom and sun");
  assert(catalog.appendixEffects.bridge.text.includes("里程碑的花") && catalog.appendixEffects.bridge.text.includes("+2 阳光"), "bridge appendix text mismatch");
  assert(catalog.appendixEffects.raked.text.includes("松树") && catalog.appendixEffects.raked.text.includes("+1 阳光"), "raked sand appendix text mismatch");
  assert(catalog.appendixEffects.parasol.text.includes("阳光被浇水") && !catalog.appendixEffects.parasol.text.includes("花朵被浇水"), "parasol appendix text must target watered sun");

  assert(catalog.gardenCards.length === 26, `expected 26 garden cards, got ${catalog.gardenCards.length}`);
  const gardenPages = catalog.gardenCards.flatMap((card) => [card.frontPage, card.backPage]);
  sameJson(gardenPages, Array.from({ length: 52 }, (_, i) => i + 1), "garden card pages must cover 1-52 in order");
  const gardenNames = catalog.gardenCards.map((card) => card.name);
  sameJson(gardenNames, [
    "Starting Card A", "Starting Card B", "Starting Card C", "Starting Card D", "Starting Card E", "Starting Card F", "Starting Card G", "Starting Card H",
    "Garden Extension", "Garden Extension", "Mitsudomoe", "Mushrooms", "Chidori", "Parasol", "Raked Sand", "Spring Breeze", "Tea", "Butterflies",
    "Dragonfly", "Crane", "Koi", "Bridge", "Mist", "Lotus", "Treasure Knot", "Stone Lantern",
  ], "garden card names changed");
  const extensionFlags = Object.fromEntries(catalog.gardenCards
    .filter((card) => card.name === "Garden Extension")
    .map((card) => [`${card.frontPage}/${card.backPage}`, Boolean(card.flags.extension)]));
  sameJson(extensionFlags, { "17/18": false, "19/20": true }, "Garden Extension cards must follow printed extension icons");
  const actualGoldenPlots = {};
  for (const card of catalog.gardenCards) {
    for (const side of [
      { page: card.frontPage, plots: card.frontPlots },
      { page: card.backPage, plots: card.backPlots },
    ]) {
      const goldenRows = [];
      for (const plot of side.plots) {
        assert(plot.plot !== "golden", `page ${side.page} row ${plot.y + 1} must keep its base plot and use golden: true`);
        if (plot.golden) goldenRows.push(`${plot.y + 1}:${plot.plot}`);
      }
      if (goldenRows.length) actualGoldenPlots[side.page] = goldenRows;
    }
  }
  sameJson(actualGoldenPlots, {
    8: ["3:blossom"],
    10: ["4:sun"],
    12: ["3:pine"],
    14: ["2:sun", "3:sun"],
    16: ["2:blossom"],
    18: ["2:blossom", "4:pine"],
    20: ["2:blossom"],
    28: ["4:sun"],
    30: ["1:pine"],
    44: ["1:sun"],
  }, "golden plot positions must match printed garden cards");

  const lotus = catalog.gardenCards.find((card) => card.frontPage === 47);
  sameJson(lotus.frontPlots.map((plot) => [plot.localX, plot.y, plot.plot]), [[0, 1, "lotus"], [0, 2, "empty"], [0, 3, "pine"]], "page 47 lotus plots must match printed card");
  sameJson(lotus.backPlots.map((plot) => plot.plot), ["empty", "lotus", "pine", "pine"], "page 48 lotus plots must match printed card");

  const butterflies = catalog.gardenCards.find((card) => card.backPage === 36);
  sameJson(butterflies.backPlots.map((plot) => [plot.localX, plot.y, plot.plot]), [[0, 0, "sun"], [0, 1, "butterflies"], [0, 2, "sun"]], "page 36 must have two suns and no fourth-row plot");

  assert(catalog.actionCards.length === 32, `expected 32 action sides, got ${catalog.actionCards.length}`);
  sameJson(catalog.actionCards.map((card) => card.page), Array.from({ length: 32 }, (_, i) => i + 53), "action card pages must cover 53-84");
  const actionSummaries = Object.fromEntries(catalog.actionCards.map((card) => [card.page, `${card.waterText} | ${card.rotText} | ${card.bonusText}`]));
  sameJson(catalog.actionCards.find((card) => card.page === 66).water, { count: 2, disconnected: true }, "action card 66 must use disconnected water rather than a fixed grid shape");
  const expectedSummaries = {
    53: "放置 4 个水，形状可旋转或翻面 | 5 个腐败 | +1 花，+1 阳光",
    54: "放置 4 个水，形状可旋转或翻面 | 4 个腐败，至少覆盖 日 | +1 花，+1 阳光",
    55: "放置 4 个水，形状可旋转或翻面 | 4 个腐败，至少覆盖 松 | +1 花",
    56: "放置 4 个水，形状可旋转或翻面 | 1 个腐败，锁定；1 个腐败，锁定；1 个腐败，锁定；1 个腐败 | +1 花",
    57: "放置 2 个水，形状可旋转或翻面 | 3 个腐败 | 无奖励",
    58: "放置 2 个水，形状可旋转或翻面 | 2 个腐败 | 无奖励",
    59: "放置 4 个水，形状可旋转或翻面 | 4 个腐败 | +1 花",
    60: "放置 4 个正交连通的水 | 4 个腐败，连成一条直线 | +1 花",
    64: "放置 4 个水，形状可旋转或翻面；指定水格需覆盖 松 | 3 个腐败 | +1 花，+1 阳光",
    66: "放置 2 个互不正交相邻的水（对角相邻可以） | 5 个腐败 | +1 花",
    68: "放置 5 个水，形状可旋转或翻面；指定水格需覆盖 花 | 4 个腐败 | +1 花，+1 阳光",
    74: "放置 5 个水，形状可旋转或翻面 | 8 个腐败；本次浇水获得的韧性加倍 | +1 花，+1 阳光",
    76: "放置 3 个水，形状可旋转或翻面 | 5 - 当前里程碑 个腐败，锁定 | +1 花",
    84: "放置 3 个水，形状可旋转或翻面 | 1 个腐败；3 个腐败，连成一条直线 | +1 花",
  };
  for (const [page, summary] of Object.entries(expectedSummaries)) {
    assert(actionSummaries[page] === summary, `action card ${page} summary mismatch\n${actionSummaries[page]}\n${summary}`);
  }
}

function appendixBehaviorAudit() {
  {
    const api = createGame();
    loadState(api, {
      resources: { blossom: 0, sun: 0, resiliency: 0, vp: 0 },
      garden: [{ instanceId: "g0", defId: "s2", upgraded: false }],
      gardenDeck: [{ instanceId: "g1", defId: "s1", upgraded: false }, { instanceId: "g2", defId: "e1", upgraded: false }],
      currentAction: action("a70"),
    });
    const s = api.submitCurrentPlacement([{ x: 0, y: 3 }]);
    assert(s.garden.length === 2 && s.garden[1].frontPage === 17 && s.gardenDeckCount === 1, "Garden Extension 17/18 should not draw an extra card");
  }
  {
    const api = createGame();
    loadState(api, {
      resources: { blossom: 0, sun: 0, resiliency: 0, vp: 0 },
      garden: [{ instanceId: "g0", defId: "s2", upgraded: false }],
      gardenDeck: [{ instanceId: "g1", defId: "s1", upgraded: false }, { instanceId: "g2", defId: "e2", upgraded: false }],
      currentAction: action("a70"),
    });
    const s = api.submitCurrentPlacement([{ x: 0, y: 3 }]);
    assert(s.garden.length === 3 && s.garden[1].frontPage === 19 && s.garden[2].name === "Starting Card A" && s.gardenDeckCount === 0, "Garden Extension 19/20 should draw an extra card");
  }
  {
    const api = createGame();
    loadState(api, {
      garden: [{ instanceId: "g1", defId: "e14", upgraded: true }],
      currentAction: action("a59"),
    });
    const s = api.submitCurrentPlacement([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }]);
    assert(s.resources.sun === 5 && s.resources.blossom === 1, "golden bridge sun should keep sun plot, add golden sun, and still trigger bridge");
  }
  {
    const api = createGame();
    loadState(api, {
      garden: [{ instanceId: "g1", defId: "e1", upgraded: true }],
      currentAction: action("a70"),
    });
    const s = api.submitCurrentPlacement([{ x: 0, y: 1 }]);
    assert(s.resources.blossom === 2 && s.garden.length === 1, "Garden Extension 17/18 golden blossom should reward blossom without extension draw");
  }
  {
    const api = createGame();
    loadState(api, {
      garden: [{ instanceId: "g1", defId: "e1", upgraded: true }],
      currentAction: action("a70"),
    });
    const s = api.submitCurrentPlacement([{ x: 1, y: 3 }]);
    assert(s.resources.resiliency === 2 && s.garden.length === 1, "Garden Extension 17/18 golden pine should reward resiliency without extension draw");
  }
  {
    const api = createGame();
    loadState(api, {
      garden: [{ instanceId: "g1", defId: "e8", upgraded: true }],
      currentAction: action("a70"),
    });
    const s = api.submitCurrentPlacement([{ x: 0, y: 0 }]);
    assert(s.resources.sun === 0 && s.resources.blossom === 0 && s.resources.resiliency === 0, "Spring Breeze upgraded empty row should not be treated as golden");
  }
  {
    const api = createGame();
    loadState(api, { resources: { blossom: 0, sun: 4, resiliency: 0, vp: 0 }, garden: [{ instanceId: "g1", defId: "e14", upgraded: false }], currentAction: action("a70") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 3 }]);
    assert(s.resources.blossom === 2 && s.resources.sun === 6, "bridge should gain milestone blossom and +2 sun");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e7", upgraded: false }, { instanceId: "g2", defId: "s7", upgraded: false }], currentAction: action("a70") });
    const s = api.submitCurrentPlacement([{ x: 1, y: 0 }]);
    assert(s.resources.sun === 1 && s.resources.resiliency === 1 && s.resources.blossom === 0, "raked sand should add sun to watered pine");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e6", upgraded: false }], currentAction: action("a70") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 3 }]);
    assert(s.resources.sun === 2 && s.resources.blossom === 0, "parasol should add sun to nearby watered sun");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e6", upgraded: false }, { instanceId: "g2", defId: "s1", upgraded: false }], currentAction: action("a70") });
    const s = api.submitCurrentPlacement([{ x: 1, y: 0 }]);
    assert(s.resources.sun === 0 && s.resources.blossom === 1, "parasol should not trigger from nearby watered blossom");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e6", upgraded: false }], cubes: { "0,1": "water" }, cubeRounds: { "0,1": 1 }, currentAction: action("a70") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 3 }]);
    assert(s.resources.sun === 1, "covered parasol should not trigger from nearby watered sun");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e6", upgraded: true }], currentAction: action("a70") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 3 }]);
    assert(s.resources.sun === 3, "golden sun near parasol should gain base sun, golden sun, and parasol sun");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e5", upgraded: false }, { instanceId: "g2", defId: "s7", upgraded: false }], currentAction: action("a70") });
    const s = api.submitCurrentPlacement([{ x: 1, y: 0 }]);
    assert(s.resources.blossom === 1 && s.resources.sun === 1 && s.resources.resiliency === 1, "chidori should add blossom and sun to nearby watered pine");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e16", upgraded: true }], currentAction: action("a58") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 2 }, { x: 0, y: 3 }]);
    assert(s.resources.blossom === 2 && s.resources.resiliency === 2, "upgraded lotus should reward two watered pine plots");
  }
  {
    const api = createGame();
    loadState(api, {
      garden: [
        { instanceId: "g1", defId: "s7", upgraded: true },
        { instanceId: "g2", defId: "e16", upgraded: false },
        { instanceId: "g3", defId: "s1", upgraded: false },
      ],
      currentAction: action("a53"),
    });
    const s = api.submitCurrentPlacement([{ x: 0, y: 3 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 3 }]);
    const pineLogs = s.log.filter((entry) => entry.message === "获得 1 韧性：浇水松树");
    assert(s.resources.resiliency === 2, "screenshot marker 2 placement should water exactly two pine plots");
    assert(s.resources.blossom === 2, "screenshot marker 2 placement should still trigger lotus");
    assert(pineLogs.length === 2, "screenshot marker 2 placement should log two watered pine plots");
  }
  {
    const api = createGame();
    loadState(api, {
      garden: [
        { instanceId: "g1", defId: "e1", upgraded: false },
        { instanceId: "g2", defId: "e1", upgraded: false },
      ],
      currentAction: action("a74"),
    });
    let s = api.submitCurrentPlacement([{ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 3 }]);
    assert(s.currentAction.step === "rot" && s.resources.resiliency === 2, "action card 74 should double watered-pine resiliency before its rot stage");
    api.setRotReduction(2);
    s = api.submitCurrentPlacement([{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 0 }, { x: 3, y: 1 }]);
    assert(s.resources.blossom === 3 && s.resources.sun === 1 && s.resources.resiliency === 0, "action card 74 should spend doubled resiliency on rot, then grant only its printed blossom and sun bonus");
  }
  {
    const api = createGame();
    loadState(api, {
      garden: [{ instanceId: "g1", defId: "s4", upgraded: false }, { instanceId: "g2", defId: "s8", upgraded: false }, { instanceId: "g3", defId: "e17", upgraded: false }],
      currentAction: action("a63"),
    });
    const s = api.submitCurrentPlacement([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }]);
    assert(s.resources.blossom === 3 && s.resources.sun === 1 && s.resources.resiliency === 1, "treasure knot should reward flower/sun/pine set");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e9", upgraded: true }], gardenDeck: [{ instanceId: "g2", defId: "s1", upgraded: false }], currentAction: action("a59") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }]);
    assert(s.resources.blossom === 3 && s.resources.sun === 0 && s.garden.length === 2 && s.gardenDeckCount === 0, "tea should add blossom and draw garden card, not sun");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e3", upgraded: false }], currentAction: action("a70") });
    let s = api.submitCurrentPlacement([{ x: 0, y: 1 }]);
    assert(s.currentAction.step === "choice" && s.currentAction.pendingChoice.remaining === 1, "mitsudomoe should pause for resource choice");
    s = api.choosePendingResource("sun");
    assert(s.resources.sun === 1 && s.resources.blossom === 0 && s.resources.resiliency === 0, "mitsudomoe chosen sun should grant sun only");
  }
  {
    const api = createGame();
    loadState(api, {
      garden: [{ instanceId: "g1", defId: "e10", upgraded: false }, { instanceId: "g2", defId: "s8", upgraded: false }],
      currentAction: action("a63"),
    });
    const s = api.submitCurrentPlacement([{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }]);
    assert(s.resources.blossom === 3, "butterflies should add +2 blossom to watered blossoms");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e11", upgraded: false }], currentAction: action("a58") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 2 }, { x: 0, y: 3 }]);
    assert(s.resources.blossom === 1, "dragonfly should add blossom to watered regular empty plots");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e11", upgraded: true }], currentAction: action("a58") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 2 }, { x: 0, y: 3 }]);
    assert(s.resources.blossom === 2, "dragonfly should add two blossoms to watered upgraded empty plots");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "s1", upgraded: false }], currentAction: rotAction("a56", 3) });
    const s = api.submitCurrentPlacement([{ x: 0, y: 0 }]);
    assert(s.resources.blossom === 1, "action card 56 should grant its printed +1 blossom after the final rot placement");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "s1", upgraded: false }], currentAction: rotAction("a58") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 0 }, { x: 0, y: 1 }]);
    assert(s.resources.blossom === 0, "action card 58 should not grant an unprinted blossom reward");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e12", upgraded: false }, { instanceId: "g2", defId: "s1", upgraded: false }], currentAction: action("a59") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }]);
    assert(s.resources.sun === 2 && s.resources.resiliency === 2, "crane should enhance watered sun and pine");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e4", upgraded: false }], currentAction: rotAction("a70"), resources: { blossom: 0, sun: 0, resiliency: 0, vp: 0 } });
    const s = api.submitCurrentPlacement([{ x: 0, y: 0 }, { x: 0, y: 1 }]);
    assert(s.resources.blossom === 2, "mushroom should gain blossom when covered by rot");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e18", upgraded: false }], actionPiles: [[{ pairId: "ap1", sideId: "a53" }], []], currentAction: rotAction("a70") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 1 }, { x: 0, y: 2 }]);
    const lantern = s.garden[0].plots.find((plot) => plot.y === 2);
    assert(s.currentAction.step === "lantern" && s.currentAction.pendingLantern.remaining === 1, "stone lantern should pause for player choice");
    assert(s.resources.blossom === 0 && lantern.cube === "rot", "stone lantern should not auto-remove rot or gain blossom");
    const afterRemove = api.chooseLantern(true);
    const removedLantern = afterRemove.garden[0].plots.find((plot) => plot.y === 2);
    assert(afterRemove.resources.blossom === 1 && !removedLantern.cube && !afterRemove.currentAction, "choosing lantern removal should remove rot, gain blossom, and finish action");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e18", upgraded: false }], actionPiles: [[{ pairId: "ap1", sideId: "a53" }], []], currentAction: rotAction("a70") });
    api.submitCurrentPlacement([{ x: 0, y: 1 }, { x: 0, y: 2 }]);
    const s = api.chooseLantern(false);
    const lantern = s.garden[0].plots.find((plot) => plot.y === 2);
    assert(s.resources.blossom === 0 && lantern.cube === "rot" && !s.currentAction, "keeping lantern rot should not gain blossom and should finish action");
  }
  {
    const api = createGame();
    loadState(api, {
      garden: [{ instanceId: "g1", defId: "e18", upgraded: false }, { instanceId: "g2", defId: "e18", upgraded: false }],
      actionPiles: [[{ pairId: "ap1", sideId: "a53" }], []],
      currentAction: rotAction("a70"),
    });
    let s = api.submitCurrentPlacement([{ x: 0, y: 2 }, { x: 1, y: 2 }]);
    assert(s.currentAction.step === "lantern" && s.currentAction.pendingLantern.remaining === 2, "multiple lanterns should queue choices");
    s = api.chooseLantern(false);
    assert(s.currentAction.step === "lantern" && s.currentAction.pendingLantern.remaining === 1, "choosing one lantern should continue to the next");
    s = api.chooseLantern(true);
    assert(s.resources.blossom === 1 && s.garden[0].plots.find((plot) => plot.y === 2).cube === "rot" && !s.garden[1].plots.find((plot) => plot.y === 2).cube && !s.currentAction, "multiple lantern choices should apply independently");
  }
  {
    const api = createGame();
    loadState(api, {
      resources: { blossom: 0, sun: 1, resiliency: 0, vp: 0 },
      garden: [{ instanceId: "g1", defId: "e15", upgraded: true }],
      cubes: { "0,0": "water" },
      cubeRounds: { "0,0": 1 },
      currentAction: rotAction("a70"),
    });
    const s = api.submitCurrentPlacement([{ x: 0, y: 2 }, { x: 0, y: 3 }]);
    assert(s.resources.sun === 3 && !s.garden[0].plots.find((plot) => plot.y === 0).cube, "mist should remove milestone water and gain sun");
  }
}

function disconnectedWaterAudit() {
  const garden = [{ instanceId: "g1", defId: "e1", upgraded: false }];

  {
    const api = createGame();
    const initial = loadState(api, { garden, currentAction: action("a66") });
    assert(initial.currentAction.validationHint.includes("不能正交相邻") && initial.currentAction.validationHint.includes("对角相邻可以"), "card 66 placement hint must explain disconnected water");
    const s = api.submitCurrentPlacement([{ x: 0, y: 0 }, { x: 1, y: 3 }]);
    assert(s.currentAction.step === "rot", "card 66 must allow water at any non-adjacent distance");
  }

  {
    const api = createGame();
    loadState(api, { garden, currentAction: action("a66") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 0 }, { x: 1, y: 1 }]);
    assert(s.currentAction.step === "rot", "card 66 must allow diagonally adjacent water");
  }

  {
    const api = createGame();
    loadState(api, { garden, currentAction: action("a66") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    assert(s.currentAction.step === "water" && s.currentAction.validationError === "两个水不能正交相邻（对角相邻可以）。", "card 66 must reject orthogonally adjacent water with a specific error");
  }

  {
    const api = createGame();
    loadState(api, { garden, cubes: { "0,0": "water" }, cubeRounds: { "0,0": 1 }, currentAction: action("a66") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 0 }, { x: 1, y: 3 }]);
    assert(s.currentAction.step === "water" && s.currentAction.validationError === "水只能放在未占用的花园格。", "card 66 must reject occupied plots with a specific error");
  }

  {
    const api = createGame();
    const occupied = { "0,1": "water", "0,2": "water", "0,3": "water", "1,1": "water", "1,2": "water", "1,3": "water" };
    const cubeRounds = Object.fromEntries(Object.keys(occupied).map((key) => [key, 1]));
    let s = loadState(api, { garden, cubes: occupied, cubeRounds, currentAction: action("a66") });
    assert(s.currentAction.legalPlacementCount === 0, "card 66 must have no placement when only an adjacent pair remains");
    s = api.placeCurrent();
    assert(s.phase === "upgrade" && !s.currentAction && s.garden.every((card) => card.plots.every((plot) => !plot.cube)), "card 66 impossible placement must use the existing failure flow and clear cubes");
  }
}

function saveAudit() {
  const api = createGame();
  api.newGame({ seed: 12345 });
  const serialized = api.serialize();
  assert(api.validateSave(serialized) === true, "serialized game should pass save validation");

  const before = JSON.stringify(api.getState());
  const damaged = JSON.parse(serialized);
  damaged.state.garden[0].defId = "missing-card";
  let validationFailed = false;
  try {
    api.validateSave(JSON.stringify(damaged));
  } catch (_error) {
    validationFailed = true;
  }
  assert(validationFailed, "damaged garden card should fail save validation");
  sameJson(api.getState(), JSON.parse(before), "save validation must not change current state");

  let loadFailed = false;
  try {
    api.load(JSON.stringify(damaged));
  } catch (_error) {
    loadFailed = true;
  }
  assert(loadFailed, "transactional load should reject damaged save");
  sameJson(api.getState(), JSON.parse(before), "failed load must preserve current state");
}

function sparseLayoutAudit() {
  const api = createGame();
  const layouts = api.getDefaultGardenLayouts();
  assert(api.validateGardenLayouts(layouts) === true, "built-in sparse layouts must validate");
  assert(layouts.version === 2, "layout schema must use version 2");
  assert(layouts.cards.e1.front.columns === 2 && layouts.cards.e1.front.plots.length === 8, "pages 17/18 must use two columns");
  assert(layouts.cards.e2.front.columns === 3 && !layouts.cards.e2.front.plots.some((plot) => plot.x === 1 && plot.y === 0), "pages 19/20 must preserve sparse three-column holes");
  for (const cardLayout of Object.values(layouts.cards)) {
    for (const entry of cardLayout.front.plots.filter((plot) => plot.type === "empty")) assert(entry.upgraded === false, `page ${cardLayout.front.page} empty plots must be regular`);
    for (const entry of cardLayout.back.plots.filter((plot) => plot.type === "empty")) assert(entry.upgraded === true, `page ${cardLayout.back.page} empty plots must be upgraded`);
  }
  const dragonflyFront = layouts.cards.e11.front.plots.find((plot) => plot.x === 0 && plot.y === 2);
  const dragonflyBack = layouts.cards.e11.back.plots.find((plot) => plot.x === 0 && plot.y === 2);
  assert(dragonflyFront.type === "empty" && !dragonflyFront.upgraded, "page 37 must contain a regular empty plot at 1,3");
  assert(dragonflyBack.type === "empty" && dragonflyBack.upgraded, "page 38 must contain an upgraded empty plot at 1,3");

  const legacy = JSON.parse(JSON.stringify(layouts));
  legacy.version = 1;
  for (const cardLayout of Object.values(legacy.cards)) {
    for (const side of [cardLayout.front, cardLayout.back]) side.plots.forEach((plot) => delete plot.upgraded);
  }
  legacy.cards.e11.front.plots[0].golden = false;
  const migrated = api.migrateGardenLayouts(legacy);
  assert(migrated.version === 2, "version 1 layouts must migrate to version 2");
  assert(!migrated.cards.e11.front.plots[0].upgraded && migrated.cards.e11.back.plots[0].upgraded, "migration must derive regular/upgraded empty from face direction");
  sameJson(migrated.cards.e11.front.plots.map(({ x, y, type }) => ({ x, y, type })), legacy.cards.e11.front.plots.map(({ x, y, type }) => ({ x, y, type })), "migration must preserve user plot coordinates and types");

  const broken = JSON.parse(JSON.stringify(layouts));
  broken.cards.e10.back.plots.push({ ...broken.cards.e10.back.plots[0] });
  let rejected = false;
  try {
    api.validateGardenLayouts(broken);
  } catch (_error) {
    rejected = true;
  }
  assert(rejected, "duplicate layout coordinates must be rejected");

  const invalidUpgrade = JSON.parse(JSON.stringify(layouts));
  invalidUpgrade.cards.e11.front.plots.find((plot) => plot.type === "dragonfly").upgraded = true;
  let invalidUpgradeRejected = false;
  try {
    api.validateGardenLayouts(invalidUpgrade);
  } catch (_error) {
    invalidUpgradeRejected = true;
  }
  assert(invalidUpgradeRejected, "non-empty plots must not accept the upgraded-empty flag");

  const widthState = loadState(api, {
    garden: [
      { instanceId: "g1", defId: "e1", upgraded: false },
      { instanceId: "g2", defId: "e2", upgraded: false },
      { instanceId: "g3", defId: "s1", upgraded: false },
    ],
  });
  sameJson(widthState.garden.map((card) => [card.columns, card.columnStart, card.columnEnd]), [[2, 0, 1], [3, 2, 4], [1, 5, 5]], "multi-column cards must receive cumulative global column ranges");

  loadState(api, { garden: [{ instanceId: "g1", defId: "e10", upgraded: true }], currentAction: action("a57") });
  const watered = api.submitCurrentPlacement([{ x: 0, y: 0 }, { x: 0, y: 2 }]);
  assert(watered.resources.sun === 2, "page 36 screenshot placement must advance sunlight twice");
  assert(watered.garden[0].plots.length === 3 && !watered.garden[0].plots.some((plot) => plot.y === 3), "page 36 must not create a ghost fourth-row plot");

  loadState(api, { garden: [{ instanceId: "g1", defId: "e10", upgraded: true }], currentAction: action("a57") });
  const invalid = api.submitCurrentPlacement([{ x: 0, y: 1 }, { x: 0, y: 3 }]);
  assert(invalid.currentAction.step === "water" && invalid.currentAction.validationError, "water shapes must not land on missing plots");
}

function blossomTrackAudit() {
  const api = createGame();
  const expectedCells = {
    0: ["blossom-0"],
    1: ["blossom-1"],
    10: ["blossom-10"],
    11: ["blossom-10+", "blossom-1"],
    12: ["blossom-10+", "blossom-2"],
    19: ["blossom-10+", "blossom-9"],
    20: ["blossom-10+", "blossom-10"],
    21: ["blossom-10+", "blossom-10+", "blossom-1"],
  };
  for (const [value, cells] of Object.entries(expectedCells)) {
    const s = loadState(api, { resources: { blossom: Number(value), sun: 0, resiliency: 0, vp: 0 } });
    sameJson(s.tracks.blossom.cells, cells, `blossom ${value} track markers mismatch`);
    assert(s.tracks.blossom.value === Number(value), `blossom ${value} track must preserve its unbounded total`);
  }
  let s = loadState(api, { resources: { blossom: 12, sun: 0, resiliency: 0, vp: 0 } });
  assert(s.tracks.blossom.markers.length === 2, "blossom 12 should render two markers");
  s = loadState(api, { resources: { blossom: 9, sun: 0, resiliency: 0, vp: 0 } });
  sameJson(s.tracks.blossom.cells, ["blossom-9"], "spending blossom from 12 to 9 should collapse back to one marker");
}

function replantAndSeedAudit() {
  const api = createGame();
  let s = api.newGame({ seed: 101 });
  assert(s.canReplant === true, "Replant should be available before the first action of a year");

  s = api.chooseActionPile(0);
  assert(s.currentAction && s.canReplant === false, "choosing the first action must immediately disable Replant");
  const gardenDuringAction = s.garden.map((card) => card.instanceId);
  s = api.replant();
  sameJson(s.garden.map((card) => card.instanceId), gardenDuringAction, "Replant must not change the garden after the year has started");
  assert(Boolean(s.currentAction), "blocked Replant must not cancel the current action");

  s = api.undo();
  assert(!s.currentAction && s.canReplant === true, "undoing the first action choice should restore Replant availability");
  s = api.replant();
  assert(s.usedReplant === true && s.canReplant === false, "Replant should be usable only once at the start of a year");

  s = loadState(api, {
    garden: [{ instanceId: "g1", defId: "s1", upgraded: false }],
    actionPiles: [[{ pairId: "ap1", sideId: "a53" }], []],
    actionDiscard: [{ pairId: "ap2", sideId: "a55" }],
  });
  assert(s.canReplant === false, "Replant must stay disabled between actions after the first action has finished");
  const idleGarden = s.garden.map((card) => card.instanceId);
  s = api.replant();
  sameJson(s.garden.map((card) => card.instanceId), idleGarden, "blocked between-action Replant must not change the garden");

  s = loadState(api, { phase: "upgrade", gardenDeck: [{ instanceId: "g1", defId: "s1", upgraded: false }] });
  assert(s.canReplant === false, "Replant must be disabled during upgrade");
  s = api.finishUpgrade();
  assert(s.year === 2 && s.phase === "action" && s.canReplant === true, "starting the next year should restore Replant availability");

  const reproducibleA = api.newGame({ seed: 987654321 });
  const signatureA = {
    seed: reproducibleA.seed,
    garden: reproducibleA.garden.map((card) => card.defId),
    piles: reproducibleA.actionPiles.map((pile) => pile.map((card) => card.sideId)),
  };
  const reproducibleB = api.newGame({ seed: 987654321 });
  const signatureB = {
    seed: reproducibleB.seed,
    garden: reproducibleB.garden.map((card) => card.defId),
    piles: reproducibleB.actionPiles.map((pile) => pile.map((card) => card.sideId)),
  };
  sameJson(signatureB, signatureA, "explicit seeds must continue to reproduce the same game");

  const randomA = api.newGame();
  const randomB = api.newGame();
  assert(randomA.seed !== reproducibleB.seed && randomB.seed !== randomA.seed, "automatic new games must always replace the current seed");
}

catalogAudit();
appendixBehaviorAudit();
disconnectedWaterAudit();
saveAudit();
sparseLayoutAudit();
blossomTrackAudit();
replantAndSeedAudit();
console.log("rule audit passed");
