const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const code = fs.readFileSync(path.join(root, "src/game.js"), "utf8");

function createGame() {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
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

  assert(catalog.actionCards.length === 32, `expected 32 action sides, got ${catalog.actionCards.length}`);
  sameJson(catalog.actionCards.map((card) => card.page), Array.from({ length: 32 }, (_, i) => i + 53), "action card pages must cover 53-84");
  const actionSummaries = Object.fromEntries(catalog.actionCards.map((card) => [card.page, `${card.waterText} | ${card.rotText} | ${card.bonusText}`]));
  const expectedSummaries = {
    53: "放置 4 个水，形状可旋转或翻面 | 5 个腐败 | +1 花，+1 阳光",
    54: "放置 4 个水，形状可旋转或翻面 | 4 个腐败，至少覆盖 日 | +1 花，+1 阳光",
    55: "放置 4 个水，形状可旋转或翻面 | 4 个腐败，至少覆盖 松 | +1 花",
    56: "放置 4 个水，形状可旋转或翻面 | 1 个腐败，锁定；1 个腐败，锁定；1 个腐败，锁定；1 个腐败 | 无奖励",
    57: "放置 2 个水，形状可旋转或翻面 | 3 个腐败 | 无奖励",
    58: "放置 2 个水，形状可旋转或翻面 | 2 个腐败 | +1 花",
    59: "放置 4 个水，形状可旋转或翻面 | 4 个腐败 | +1 花",
    60: "放置 4 个正交连通的水 | 4 个腐败，连成一条直线 | +1 花",
    64: "放置 4 个水，形状可旋转或翻面；指定水格需覆盖 松 | 3 个腐败 | +1 花，+1 阳光",
    68: "放置 5 个水，形状可旋转或翻面；指定水格需覆盖 花 | 4 个腐败 | +1 花，+1 阳光",
    74: "放置 5 个水，形状可旋转或翻面 | 8 个腐败 | +1 花，+1 阳光，本次浇水获得的韧性加倍",
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
    const s = api.submitCurrentPlacement([{ x: 0, y: 3 }]);
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
    const s = api.submitCurrentPlacement([{ x: 0, y: 2 }]);
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
    loadState(api, { garden: [{ instanceId: "g1", defId: "e6", upgraded: false }], cubes: { "0,0": "water" }, cubeRounds: { "0,0": 1 }, currentAction: action("a70") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 2 }]);
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
    loadState(api, { garden: [{ instanceId: "g1", defId: "e16", upgraded: false }], currentAction: action("a58") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 2 }, { x: 0, y: 3 }]);
    assert(s.resources.blossom === 2 && s.resources.resiliency === 2, "lotus should reward two watered pine plots");
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
    loadState(api, { garden: [{ instanceId: "g1", defId: "e9", upgraded: false }], gardenDeck: [{ instanceId: "g2", defId: "s1", upgraded: false }], currentAction: action("a59") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }]);
    assert(s.resources.blossom === 3 && s.resources.sun === 0 && s.garden.length === 2 && s.gardenDeckCount === 0, "tea should add blossom and draw garden card, not sun");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e3", upgraded: false }], currentAction: action("a70") });
    let s = api.submitCurrentPlacement([{ x: 0, y: 0 }]);
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
    loadState(api, { garden: [{ instanceId: "g1", defId: "e12", upgraded: false }, { instanceId: "g2", defId: "s1", upgraded: false }], currentAction: action("a59") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }]);
    assert(s.resources.sun === 2 && s.resources.resiliency === 2, "crane should enhance watered sun and pine");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e4", upgraded: false }], currentAction: rotAction("a70"), resources: { blossom: 0, sun: 0, resiliency: 0, vp: 0 } });
    const s = api.submitCurrentPlacement([{ x: 0, y: 1 }, { x: 0, y: 2 }]);
    assert(s.resources.blossom === 2, "mushroom should gain blossom when covered by rot");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e18", upgraded: false }], actionPiles: [[{ pairId: "ap1", sideId: "a53" }], []], currentAction: rotAction("a70") });
    const s = api.submitCurrentPlacement([{ x: 0, y: 2 }, { x: 0, y: 3 }]);
    const lantern = s.garden[0].plots.find((plot) => plot.y === 3);
    assert(s.currentAction.step === "lantern" && s.currentAction.pendingLantern.remaining === 1, "stone lantern should pause for player choice");
    assert(s.resources.blossom === 0 && lantern.cube === "rot", "stone lantern should not auto-remove rot or gain blossom");
    const afterRemove = api.chooseLantern(true);
    const removedLantern = afterRemove.garden[0].plots.find((plot) => plot.y === 3);
    assert(afterRemove.resources.blossom === 1 && !removedLantern.cube && !afterRemove.currentAction, "choosing lantern removal should remove rot, gain blossom, and finish action");
  }
  {
    const api = createGame();
    loadState(api, { garden: [{ instanceId: "g1", defId: "e18", upgraded: false }], actionPiles: [[{ pairId: "ap1", sideId: "a53" }], []], currentAction: rotAction("a70") });
    api.submitCurrentPlacement([{ x: 0, y: 2 }, { x: 0, y: 3 }]);
    const s = api.chooseLantern(false);
    const lantern = s.garden[0].plots.find((plot) => plot.y === 3);
    assert(s.resources.blossom === 0 && lantern.cube === "rot" && !s.currentAction, "keeping lantern rot should not gain blossom and should finish action");
  }
  {
    const api = createGame();
    loadState(api, {
      garden: [{ instanceId: "g1", defId: "e18", upgraded: false }, { instanceId: "g2", defId: "e18", upgraded: false }],
      actionPiles: [[{ pairId: "ap1", sideId: "a53" }], []],
      currentAction: rotAction("a70"),
    });
    let s = api.submitCurrentPlacement([{ x: 0, y: 3 }, { x: 1, y: 3 }]);
    assert(s.currentAction.step === "lantern" && s.currentAction.pendingLantern.remaining === 2, "multiple lanterns should queue choices");
    s = api.chooseLantern(false);
    assert(s.currentAction.step === "lantern" && s.currentAction.pendingLantern.remaining === 1, "choosing one lantern should continue to the next");
    s = api.chooseLantern(true);
    assert(s.resources.blossom === 1 && s.garden[0].plots[3].cube === "rot" && !s.garden[1].plots[3].cube && !s.currentAction, "multiple lantern choices should apply independently");
  }
  {
    const api = createGame();
    loadState(api, {
      resources: { blossom: 0, sun: 1, resiliency: 0, vp: 0 },
      garden: [{ instanceId: "g1", defId: "e15", upgraded: false }],
      cubes: { "0,0": "water" },
      cubeRounds: { "0,0": 1 },
      currentAction: rotAction("a70"),
    });
    const s = api.submitCurrentPlacement([{ x: 0, y: 2 }, { x: 0, y: 3 }]);
    assert(s.resources.sun === 3 && !s.garden[0].plots.find((plot) => plot.y === 0).cube, "mist should remove milestone water and gain sun");
  }
}

catalogAudit();
appendixBehaviorAudit();
console.log("rule audit passed");
