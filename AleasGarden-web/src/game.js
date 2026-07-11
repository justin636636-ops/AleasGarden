(() => {
  const ICONS = {
    empty: "□",
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

  const APPENDIX_EFFECTS = {
    extension: {
      name: "garden extension",
      category: "other",
      text: "花园扩展：抽到带有此图标的牌时，从花园牌库底抽 1 张额外加入当前花园最右侧。",
    },
    milestone: {
      name: "milestone",
      category: "misc",
      text: "里程碑：阳光轨道分为 4 段；到达每个里程碑奖励格时，抽 1 张花园牌加入当前花园。",
    },
    golden: {
      name: "golden plot",
      category: "water",
      text: "金色地块：浇水时额外获得 +1 对应资源。",
    },
    mitsudomoe: {
      name: "mitsudomoe",
      category: "water",
      text: "三巴纹：浇水时选择获得 +1 花、+1 阳光或 +1 韧性。",
    },
    spring: {
      name: "spring breeze",
      category: "water",
      text: "春风：浇水时，获得等于其所在行腐败数量的花。",
    },
    bridge: {
      name: "bridge",
      category: "water",
      text: "桥：浇水时获得等于当前里程碑的花，然后获得 +2 阳光。",
    },
    butterflies: {
      name: "butterflies",
      category: "water",
      text: "蝴蝶：浇水时，本次行动中每个被浇水的花朵额外获得 +2 花。",
    },
    dragonfly: {
      name: "dragonfly",
      category: "water",
      text: "蜻蜓：浇水时，本次行动中每个被浇水的普通空地获得 +1 花，升级空地获得 +2 花。",
    },
    crane: {
      name: "crane",
      category: "water",
      text: "鹤：浇水时，本次行动中被浇水的花朵、阳光、松树各自额外获得 +1 对应资源。",
    },
    koi: {
      name: "koi",
      category: "water",
      text: "鲤鱼：浇水时，下一次腐败改为放置水；遵循腐败放置规则，但使用水并结算浇水收益。",
    },
    tea: {
      name: "tea",
      category: "water",
      text: "茶：两个茶格都被浇水后，立即获得 +3 花并抽 1 张花园牌加入当前花园；可跨多次行动完成。",
    },
    mushroom: {
      name: "mushrooms",
      category: "rot",
      text: "蘑菇：被腐败覆盖时获得 +2 花。",
    },
    lantern: {
      name: "stone lantern",
      category: "rot",
      text: "石灯笼：被腐败覆盖时，可在本行动结束时移除该腐败；若移除，获得 +1 花。",
    },
    mist: {
      name: "mist",
      category: "rot",
      text: "雾：被腐败覆盖时，移除等于当前里程碑数量的水，然后获得 +2 阳光。",
    },
    raked: {
      name: "raked sand",
      category: "ongoing",
      text: "枯山水：持续效果；每个被浇水的松树额外获得 +1 阳光。",
    },
    parasol: {
      name: "parasol",
      category: "ongoing",
      text: "阳伞：持续效果；同列及左右相邻列的阳光被浇水时，额外获得 +1 阳光。",
    },
    chidori: {
      name: "chidori",
      category: "ongoing",
      text: "千鸟：持续效果；同列及左右相邻列的松树被浇水时，额外获得 +1 花和 +1 阳光。",
    },
    lotus: {
      name: "lotus",
      category: "ongoing",
      text: "莲：持续效果；每次行动一次，若同次行动至少浇水 2 个松树，获得 +2 花。",
    },
    treasure: {
      name: "treasure knot",
      category: "ongoing",
      text: "宝结：持续效果；每次行动一次，若同次行动至少浇水 1 个花朵、1 个阳光、1 个松树，获得 +2 花。",
    },
  };

  const STARTERS = [
    garden("s1", "Starting Card A", 1, 2, 2, 1, ["blossom", "empty", "empty", "pine"], ["blossom", "empty", "pine", "pine"]),
    garden("s2", "Starting Card B", 3, 4, 2, 1, ["empty", "blossom", "empty", "sun"], ["sun", "blossom", "empty", "sun"]),
    garden("s3", "Starting Card C", 5, 6, 2, 1, ["empty", "pine", "empty", "blossom"], ["pine", "pine", "empty", "blossom"]),
    garden("s4", "Starting Card D", 7, 8, 4, 2, ["sun", "empty", "blossom", "empty"], ["sun", "empty", gold("blossom"), "empty"]),
    garden("s5", "Starting Card E", 9, 10, 4, 2, ["empty", "empty", "blossom", "sun"], ["empty", "empty", "blossom", gold("sun")]),
    garden("s6", "Starting Card F", 11, 12, 4, 2, ["empty", "sun", "pine", "empty"], ["empty", "sun", gold("pine"), "empty"]),
    garden("s7", "Starting Card G", 13, 14, 6, 3, ["pine", "empty", "sun", "empty"], ["pine", gold("sun"), gold("sun"), "empty"]),
    garden("s8", "Starting Card H", 15, 16, 6, 3, ["pine", "blossom", "empty", "empty"], ["pine", gold("blossom"), "blossom", "empty"]),
  ];

  const EXPANSIONS = [
    garden("e1", "Garden Extension", 17, 18, 5, 5, ["sun", "blossom", "blossom", "pine"], ["sun", gold("blossom"), "blossom", gold("pine")]),
    garden("e2", "Garden Extension", 19, 20, 3, 3, ["sun", "empty", "blossom", "pine"], ["sun", gold("blossom"), "blossom", "pine"], { extension: true }),
    garden("e3", "Mitsudomoe", 21, 22, 3, 3, ["mitsudomoe", "empty", "mitsudomoe", "empty"], ["empty", "mitsudomoe", "mitsudomoe", "mitsudomoe"], { extension: true }),
    garden("e4", "Mushrooms", 23, 24, 3, 3, ["sun", "mushroom", "empty", "empty"], ["sun", "mushroom", "empty", "mushroom"]),
    garden("e5", "Chidori", 25, 26, 4, 4, ["chidori", "empty", "empty", "empty"], ["chidori", "empty", "pine", "empty"], { extension: true }),
    garden("e6", "Parasol", 27, 28, 3, 3, ["parasol", "empty", "sun", "empty"], ["parasol", "empty", "sun", gold("sun")], { extension: true }),
    garden("e7", "Raked Sand", 29, 30, 4, 4, ["empty", "pine", "raked", "empty"], [gold("pine"), "pine", "raked", "empty"]),
    garden("e8", "Spring Breeze", 31, 32, 5, 5, ["empty", "spring", "empty", "empty"], ["empty", "spring", "empty", "empty"]),
    garden("e9", "Tea", 33, 34, 3, 3, ["tea", "empty", "empty", "tea"], ["tea", "empty", "empty", "tea"]),
    garden("e10", "Butterflies", 35, 36, 6, 6, ["empty", "butterflies", "butterflies", "sun"], ["sun", "butterflies", "butterflies", "sun"]),
    garden("e11", "Dragonfly", 37, 38, 5, 5, ["empty", "empty", "dragonfly", "empty"], ["empty", "empty", "dragonfly", "empty"]),
    garden("e12", "Crane", 39, 40, 4, 4, ["pine", "empty", "crane", "sun"], ["pine", "sun", "crane", "sun"]),
    garden("e13", "Koi", 41, 42, 5, 5, ["empty", "empty", "koi", "empty"], ["empty", "empty", "koi", "empty"], { extension: true }),
    garden("e14", "Bridge", 43, 44, 4, 4, ["empty", "sun", "empty", "bridge"], [gold("sun"), "sun", "empty", "bridge"]),
    garden("e15", "Mist", 45, 46, 5, 5, ["empty", "empty", "mist", "empty"], ["empty", "empty", "mist", "empty"]),
    garden("e16", "Lotus", 47, 48, 5, 5, ["lotus", "empty", "pine", "pine"], ["empty", "lotus", "pine", "pine"], { extension: true }),
    garden("e17", "Treasure Knot", 49, 50, 6, 6, ["empty", "empty", "treasure", "empty"], ["empty", "empty", "treasure", "empty"]),
    garden("e18", "Stone Lantern", 51, 52, 4, 4, ["pine", "empty", "empty", "lantern"], ["pine", "empty", "empty", "lantern"]),
  ];

  const ACTION_PAIRS = [
    pair(1, side(53, [[0, 0], [1, 0], [2, 0], [1, 1]], [{ count: 5 }], { blossom: 1, sun: 1 }), side(54, [[0, 0], [1, 0], [2, 0], [1, 1]], [{ count: 4, coverPlots: ["sun"] }], { blossom: 1, sun: 1 })),
    pair(2, side(55, [[0, 0], [1, 0], [1, 1], [2, 1]], [{ count: 4, coverPlots: ["pine"] }], { blossom: 1 }), side(56, [[0, 0], [1, 0], [1, 1], [2, 1]], [{ count: 1, locked: true }, { count: 1, locked: true }, { count: 1, locked: true }, { count: 1 }])),
    pair(3, side(57, [[0, 0], [0, 2]], [{ count: 3 }]), side(58, [[0, 0], [0, 1]], [{ count: 2 }], { blossom: 1 })),
    pair(4, side(59, [[0, 0], [0, 1], [0, 2], [0, 3]], [{ count: 4 }], { blossom: 1 }), side(60, { count: 4, connected: true }, [{ count: 4, line: true }], { blossom: 1 })),
    pair(5, side(61, [[0, 0], [0, 1], [0, 2], [1, 2]], [{ count: 2, locked: true, coverPlots: ["pine"] }, { count: 2 }], { blossom: 1 }), side(62, [[0, 0], [0, 1], [0, 2], [1, 2]], [{ count: 4, diagonal: true }], { blossom: 1 })),
    pair(6, side(63, [[0, 0], [1, 0], [0, 1], [1, 1]], [{ count: 4 }], { blossom: 1 }), side(64, [[0, 0], [1, 0], waterPoint(0, 1, ["pine"]), [1, 1]], [{ count: 3 }], { blossom: 1, sun: 1 })),
    pair(7, side(65, [[0, 0], [2, 0], [1, 1], [0, 2]], [{ count: 4 }], { blossom: 2, sun: 1 }), side(66, [[0, 0], [2, 0]], [{ count: 5 }], { blossom: 1 })),
    pair(8, side(67, [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], [{ count: 1, locked: true, coverPlots: ["blossom"] }, { count: 3 }], { blossom: 2 }), side(68, [waterPoint(0, 0, ["blossom"]), [0, 1], [0, 2], [1, 2], [2, 2]], [{ count: 4 }], { blossom: 1, sun: 1 })),
    pair(9, side(69, [[2, 0], [1, 1], [0, 2]], [{ count: 3, diagonal: true }]), side(70, [[0, 0]], [{ count: 2 }])),
    pair(10, side(71, [[0, 0], [2, 0], [1, 1], [1, 2]], [{ count: 2 }, { count: 2 }], { blossom: 1 }), side(72, [[0, 0], [1, 0], [2, 0], [1, 2]], [{ count: 2 }, { count: 2 }], { blossom: 1 })),
    pair(11, side(73, [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]], [{ count: 4 }], { blossom: 1 }), side(74, [[0, 0], [0, 1], [1, 1], [0, 2], [1, 2]], [{ count: 8 }], { blossom: 1, sun: 1 }, { doubleResiliency: true })),
    pair(12, side(75, [[1, 0], [0, 2], [1, 2]], [{ count: 1, locked: true }, { count: 1, locked: true }, { count: 2 }], { sun: 1 }), side(76, [[1, 0], [0, 1], [2, 1]], [{ milestoneFormula: "fiveMinusCurrent", locked: true }], { blossom: 1 })),
    pair(13, side(77, [[1, 0], [0, 1], [2, 1], [1, 2]], [{ count: 1, locked: true }, { count: 3 }], { blossom: 1, sun: 1 }), side(78, [[0, 0], [2, 0], [0, 2]], [{ count: 3, diagonal: true }], { blossom: 1, sun: 1 })),
    pair(14, side(79, [[0, 0], [0, 1], [1, 2], [1, 3]], [{ count: 4, coverPlots: ["sun"] }], { sun: 2 }), side(80, [[0, 0], [1, 1], [0, 2], [0, 3]], [{ count: 4 }], { blossom: 1, sun: 1 })),
    pair(15, side(81, [[0, 0], [0, 1], [1, 1]], [{ count: 3, coverPlots: ["sun", "pine", "blossom"] }]), side(82, [[0, 0], [0, 1], [0, 2]], [{ count: 2 }])),
    pair(16, side(83, [[0, 0], [2, 0], [1, 2]], [{ count: 1, locked: true }, { count: 1, locked: true }, { count: 2 }], { sun: 1 }), side(84, [[0, 0], [0, 1], [0, 3]], [{ count: 1 }, { count: 3, line: true }], { blossom: 1 })),
  ];

  const SUN_GARDEN_REWARD_THRESHOLDS = [1, 3, 6, 10];

  let state = null;
  let rng = null;
  let nextInstance = 1;
  let history = [];
  const allGardenDefs = [...STARTERS, ...EXPANSIONS];
  const gardenById = Object.fromEntries(allGardenDefs.map((c) => [c.id, c]));

  function garden(id, name, frontPage, backPage, cost, vp, front, back, flags = {}) {
    return { id, name, frontPage, backPage, cost, vp, front, back, flags };
  }

  function gold(plot) {
    return { plot, golden: true };
  }

  function side(page, water, rot = [], bonus = {}, flags = {}) {
    return { id: `a${page}`, page, water, rot, bonus, ...flags };
  }

  function waterPoint(x, y, coverPlots = []) {
    return { x, y, coverPlots };
  }

  function pair(id, a, b) {
    return { id: `ap${id}`, sides: [a, b] };
  }

  function createRng(seed) {
    let x = Number(seed) || Math.floor(Math.random() * 0xffffffff);
    x >>>= 0;
    if (x === 0) x = 1;
    const initial = x;
    const fn = () => {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      return (x >>> 0) / 0x100000000;
    };
    fn.seed = initial;
    fn.getState = () => x >>> 0;
    fn.setState = (value) => {
      x = Number(value) >>> 0;
      if (x === 0) x = 1;
    };
    return fn;
  }

  function shuffle(items) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function makeCard(defId) {
    return { instanceId: `g${nextInstance++}`, defId, upgraded: false };
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function pushHistory() {
    history.push(JSON.stringify({ state, nextInstance, rngState: rng?.getState?.() || null }));
    if (history.length > 80) history.shift();
  }

  function restore(snapshot) {
    const payload = JSON.parse(snapshot);
    state = payload.state;
    ensureStateShape();
    nextInstance = payload.nextInstance;
    rng = createRng(state.seed || 1);
    if (payload.rngState) rng.setState(payload.rngState);
  }

  function ensureStateShape() {
    state.cubes = state.cubes || {};
    state.cubeRounds = state.cubeRounds || {};
    if (state.currentAction) {
      state.currentAction.rotKeys = Array.isArray(state.currentAction.rotKeys) ? state.currentAction.rotKeys : [];
      state.currentAction.rotReductions = state.currentAction.rotReductions || {};
    }
  }

  function log(message, type = "system") {
    state.log.unshift({ type, message });
    state.log = state.log.slice(0, 80);
  }

  function newGame(options = {}) {
    rng = createRng(options.seed);
    nextInstance = 1;
    history = [];
    const starting = shuffle(STARTERS.map((c) => makeCard(c.id)));
    const expansion = shuffle(EXPANSIONS.map((c) => makeCard(c.id)));
    state = {
      seed: rng.seed,
      year: 1,
      phase: "action",
      resources: { blossom: 0, sun: 0, resiliency: 0, vp: 0 },
      cubes: {},
      cubeRounds: {},
      cardMarks: {},
      garden: [],
      gardenDeck: starting,
      expansionDeck: expansion,
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
    rebuildActionPiles();
    drawGarden();
    log(`新游戏开始。Seed ${state.seed}。`);
    return getPublicState();
  }

  function rebuildActionPiles() {
    const actionCards = shuffle(ACTION_PAIRS.map((pairDef) => {
      const sideDef = pairDef.sides[Math.floor(rng() * 2)];
      return { pairId: pairDef.id, sideId: sideDef.id };
    }));
    state.actionPiles = [actionCards.slice(0, 8), actionCards.slice(8)];
    state.actionDiscard = [];
  }

  function drawBottom(deck) {
    return deck.pop();
  }

  function drawGarden() {
    state.garden = [];
    state.cubes = {};
    state.cubeRounds = {};
    state.cardMarks = {};
    for (let i = 0; i < 5 && state.gardenDeck.length; i += 1) {
      addGardenCard(drawBottom(state.gardenDeck));
    }
    state.usedReplant = false;
  }

  function addGardenCard(card) {
    state.garden.push(card);
    const def = gardenById[card.defId];
    if (def.flags.extension && state.gardenDeck.length) {
      const extra = drawBottom(state.gardenDeck);
      state.garden.push(extra);
      log(`${def.name} 扩展花园，额外加入 ${gardenById[extra.defId].name}。`, "garden");
    }
  }

  function getActionSide(card) {
    const pairDef = ACTION_PAIRS.find((p) => p.id === card.pairId);
    return pairDef.sides.find((s) => s.id === card.sideId);
  }

  function cardImage(page) {
    return `assets/cards/card-${String(page).padStart(2, "0")}.jpg?v=bleed-crop-1`;
  }

  function getPlot(card, row) {
    const def = gardenById[card.defId];
    const side = card.upgraded ? def.back : def.front;
    return normalizePlotEntry(side[row]).plot;
  }

  function getPlotInfo(card, row) {
    const def = gardenById[card.defId];
    const side = card.upgraded ? def.back : def.front;
    return normalizePlotEntry(side[row]);
  }

  function normalizePlotEntry(entry) {
    if (!entry) return { plot: "empty", golden: false };
    if (typeof entry === "string") return { plot: entry, golden: false };
    return { plot: entry.plot || "empty", golden: Boolean(entry.golden) };
  }

  function plotList(side) {
    return [0, 1, 2, 3].map((y) => {
      const { plot, golden } = normalizePlotEntry(side[y]);
      return { y, plot, golden, icon: ICONS[plot] || plot };
    });
  }

  function publicGardenCardBase(card, def) {
    return {
      ...card,
      name: def.name,
      cost: def.cost,
      vp: def.vp,
      frontPage: def.frontPage,
      backPage: def.backPage,
      frontImage: cardImage(def.frontPage),
      backImage: cardImage(def.backPage),
      frontPlots: plotList(def.front),
      backPlots: plotList(def.back),
      flags: { ...def.flags },
    };
  }

  function getCatalog() {
    const gardenCards = allGardenDefs.map((def) => ({
      ...publicGardenCardBase({ instanceId: def.id, defId: def.id, upgraded: false }, def),
      id: def.id,
      group: STARTERS.some((card) => card.id === def.id) ? "starter" : "expansion",
    }));
    const actionCards = ACTION_PAIRS.flatMap((pairDef) => pairDef.sides.map((sideDef) => publicActionSide(pairDef.id, sideDef)));
    return clone({
      appendixEffects: APPENDIX_EFFECTS,
      gardenCards,
      actionCards,
    });
  }

  function publicActionSide(pairId, sideDef) {
    return {
      pairId,
      sideId: sideDef.id,
      page: sideDef.page,
      image: cardImage(sideDef.page),
      water: clone(sideDef.water || []),
      rot: clone(sideDef.rot || []),
      bonus: clone(sideDef.bonus || {}),
      flags: {
        doubleResiliency: Boolean(sideDef.doubleResiliency),
      },
      waterText: describeWater(sideDef.water),
      rotText: describeRot(sideDef.rot || []),
      bonusText: describeBonus(sideDef.bonus || {}, sideDef),
    };
  }

  function describeWater(water) {
    if (isConnectedWater(water)) return `放置 ${water.count} 个正交连通的水`;
    const points = (water || []).map(normalizeWaterPoint);
    const constrained = points.filter((point) => point.coverPlots?.length);
    const suffix = constrained.length ? `；指定水格需覆盖 ${constrained.map((point) => plotListLabel(point.coverPlots)).join("、")}` : "";
    return points.length ? `放置 ${points.length} 个水，形状可旋转或翻面${suffix}` : "无浇水";
  }

  function describeRot(rotList) {
    if (!rotList.length) return "无腐败";
    return rotList.map((rot) => {
      const count = rot.milestoneFormula === "fiveMinusCurrent" ? "5 - 当前里程碑" : (rot.milestone ? "6 - 当前里程碑" : rot.count);
      const bits = [`${count} 个腐败`];
      if (rot.locked) bits.push("锁定");
      if (rot.line) bits.push("连成一条直线");
      if (rot.diagonal) bits.push("对角连接");
      if (rot.coverPlots?.length) bits.push(`至少覆盖 ${plotListLabel(rot.coverPlots)}`);
      if (rot.cover) bits.push("至少覆盖非空格");
      return bits.join("，");
    }).join("；");
  }

  function describeBonus(bonus, sideDef) {
    const parts = [];
    for (const [kind, amount] of Object.entries(bonus || {})) parts.push(`+${amount} ${labelResource(kind)}`);
    if (sideDef.doubleResiliency) parts.push("本次浇水获得的韧性加倍");
    return parts.length ? parts.join("，") : "无奖励";
  }

  function getCell(x, y) {
    const card = state.garden[x];
    if (!card || y < 0 || y > 3) return null;
    const key = `${x},${y}`;
    const { plot, golden } = getPlotInfo(card, y);
    return { x, y, key, card, plot, golden, cube: state.cubes[key] || null, cubeRound: state.cubeRounds?.[key] || null };
  }

  function allCells() {
    const cells = [];
    for (let x = 0; x < state.garden.length; x += 1) {
      for (let y = 0; y < 4; y += 1) cells.push(getCell(x, y));
    }
    return cells;
  }

  function isUnoccupied(x, y) {
    const cell = getCell(x, y);
    return Boolean(cell && !cell.cube);
  }

  function milestone() {
    if (state.resources.sun >= 10) return 4;
    if (state.resources.sun >= 7) return 3;
    if (state.resources.sun >= 4) return 2;
    if (state.resources.sun >= 1) return 1;
    return 0;
  }

  function gain(kind, amount, reason = "") {
    if (!amount) return;
    if (kind === "sun") {
      const beforeSun = state.resources.sun || 0;
      state.resources.sun = Math.min(10, Math.max(0, beforeSun + amount));
      resolveSunGardenRewards(beforeSun, state.resources.sun);
    } else {
      state.resources[kind] = (state.resources[kind] || 0) + amount;
    }
    if (reason) log(`获得 ${amount} ${labelResource(kind)}：${reason}`, "resource");
  }

  function resolveSunGardenRewards(beforeSun, afterSun) {
    const crossed = SUN_GARDEN_REWARD_THRESHOLDS.filter((threshold) => beforeSun < threshold && afterSun >= threshold);
    for (const threshold of crossed) {
      if (!state.gardenDeck.length) {
        log(`阳光达到 ${threshold}，但花园牌库为空，无法加入新牌。`, "resource");
        continue;
      }
      const card = drawBottom(state.gardenDeck);
      const def = gardenById[card.defId];
      addGardenCard(card);
      log(`阳光达到 ${threshold}，将 ${def.name} 加入当前花园。`, "garden");
    }
  }

  function labelResource(kind) {
    return { blossom: "花", sun: "阳光", resiliency: "韧性", vp: "分" }[kind] || kind;
  }

  function shapeVariants(shape) {
    const keys = new Set();
    const variants = [];
    const transforms = [
      ([x, y]) => [x, y],
      ([x, y]) => [-x, y],
      ([x, y]) => [x, -y],
      ([x, y]) => [-x, -y],
      ([x, y]) => [y, x],
      ([x, y]) => [-y, x],
      ([x, y]) => [y, -x],
      ([x, y]) => [-y, -x],
    ];
    for (const transform of transforms) {
      const pts = shape.map((point) => {
        const normalized = normalizeWaterPoint(point);
        const [x, y] = transform([normalized.x, normalized.y]);
        return { ...normalized, x, y };
      });
      const minX = Math.min(...pts.map((p) => p.x));
      const minY = Math.min(...pts.map((p) => p.y));
      const norm = pts
        .map((p) => ({ ...p, x: p.x - minX, y: p.y - minY }))
        .sort((a, b) => a.x - b.x || a.y - b.y || (a.coverPlots || []).join(",").localeCompare((b.coverPlots || []).join(",")));
      const key = JSON.stringify(norm.map((p) => [p.x, p.y, p.coverPlots || []]));
      if (!keys.has(key)) {
        keys.add(key);
        variants.push(norm);
      }
    }
    return variants;
  }

  function normalizeWaterPoint(point) {
    if (Array.isArray(point)) return { x: point[0], y: point[1], coverPlots: [] };
    return {
      x: point.x,
      y: point.y,
      coverPlots: [...(point.coverPlots || [])].sort(),
    };
  }

  function legalWaterPlacements(action) {
    if (isConnectedWater(action.water)) return connectedGroups(waterCount(action));
    const placements = [];
    for (const variant of shapeVariants(action.water || [])) {
      const w = Math.max(...variant.map((p) => p.x)) + 1;
      const h = Math.max(...variant.map((p) => p.y)) + 1;
      for (let x = 0; x <= state.garden.length - w; x += 1) {
        for (let y = 0; y <= 4 - h; y += 1) {
          const cells = variant.map((point) => getCell(x + point.x, y + point.y));
          if (cells.every((cell) => cell && !cell.cube) && cellsSatisfyWaterConstraints(cells, variant)) {
            placements.push({ cells: cells.map(simpleCell), label: `${x + 1}列/${y + 1}行` });
          }
        }
      }
    }
    return uniquePlacements(placements);
  }

  function cellsSatisfyWaterConstraints(cells, variant) {
    return cells.every((cell, index) => {
      const targets = variant[index].coverPlots || [];
      return !targets.length || targets.includes(cell.plot);
    });
  }

  function uniquePlacements(placements) {
    const seen = new Set();
    return placements.filter((p) => {
      const key = p.cells.map((c) => `${c.x},${c.y}`).sort().join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function simpleCell(cell) {
    return { x: cell.x, y: cell.y, key: cell.key, plot: cell.plot, golden: Boolean(cell.golden), cube: cell.cube, cubeRound: cell.cubeRound || null };
  }

  function connectedGroups(size, diagonal = false, requireCover = false, coverPlots = [], requireLine = false, blockedAdjacentKeys = []) {
    if (size <= 0) return [{ cells: [], label: "无需放置" }];
    const cells = allCells().filter((c) => !c.cube);
    const targets = new Set(coverPlots || []);
    const adjacentBlocks = new Set(blockedAdjacentKeys || []);
    const dirs = diagonal ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const byKey = Object.fromEntries(cells.map((c) => [c.key, c]));
    const results = [];
    const seen = new Set();
    function walk(group) {
      if (group.length === size) {
        const sorted = group.map((c) => c.key).sort();
        const key = sorted.join("|");
        if (!seen.has(key)) {
          const actual = sorted.map((k) => byKey[k]);
          const coversPlot = !requireCover || actual.some((c) => c.plot !== "empty");
          const coversTarget = !targets.size || actual.some((c) => targets.has(c.plot));
          const inLine = !requireLine || actual.every((c) => c.x === actual[0].x) || actual.every((c) => c.y === actual[0].y);
          const clearsPriorRot = actual.every((c) => !touchesAny(c, adjacentBlocks));
          if (coversPlot && coversTarget && inLine && clearsPriorRot) {
            seen.add(key);
            results.push({ cells: actual.map(simpleCell), label: actual.map((c) => `${c.x + 1}-${c.y + 1}`).join(", ") });
          }
        }
        return;
      }
      const candidates = new Map();
      for (const c of group) {
        for (const [dx, dy] of dirs) {
          const key = `${c.x + dx},${c.y + dy}`;
          if (byKey[key] && !group.some((g) => g.key === key)) candidates.set(key, byKey[key]);
        }
      }
      for (const next of candidates.values()) {
        if (results.length > 160) return;
        walk([...group, next]);
      }
    }
    for (const cell of cells) {
      if (results.length > 160) break;
      walk([cell]);
    }
    return results;
  }

  function touchesAny(cell, keys) {
    if (!keys.size) return false;
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => keys.has(`${cell.x + dx},${cell.y + dy}`));
  }

  function chooseActionPile(index) {
    if (state.phase !== "action" || state.currentAction) return getPublicState();
    const pile = state.actionPiles[index];
    if (!pile || pile.length === 0) return getPublicState();
    pushHistory();
    const card = pile.shift();
    const action = getActionSide(card);
    state.currentAction = {
      pile: index,
      card,
      sideId: action.id,
      step: waterCount(action) ? "water" : "rot",
      rotIndex: 0,
      rotReductions: {},
      rotKeys: [],
      pendingChoice: null,
      validationError: "",
    };
    log(`选择行动牌堆 ${index + 1}：第 ${action.page} 页行动牌。`, "action");
    return getPublicState();
  }

  function currentSide() {
    return getActionSide(state.currentAction.card);
  }

  function currentPlacements() {
    if (!state.currentAction) return [];
    const action = currentSide();
    if (state.currentAction.step === "water") return legalWaterPlacements(action);
    if (state.currentAction.step === "choice") return [];
    if (state.currentAction.step === "lantern") return [];
    const rot = action.rot[state.currentAction.rotIndex];
    if (!rot) return [];
    const requirement = rotRequirement(rot);
    ensureCurrentActionRotKeys();
    return connectedGroups(requirement.requiredCount, rot.diagonal, rot.cover, rot.coverPlots, rot.line, state.currentAction.rotKeys);
  }

  function currentRequirement() {
    if (!state.currentAction) return null;
    const action = currentSide();
    if (state.currentAction.step === "water") {
      const count = waterCount(action);
      const connectedHint = isConnectedWater(action.water) ? "，水格必须正交连通" : "";
      const constraints = waterConstraints(action);
      const constraintHint = constraints.length ? `，带${constraints.map((c) => plotListLabel(c.coverPlots)).join("、")}图标的水格必须覆盖对应图标` : "";
      return {
        rawRequiredCount: count,
        requiredCount: count,
        appliedResiliency: 0,
        maxResiliencyForThisRot: 0,
        cubeKind: "water",
        canSubmitEmpty: count === 0,
        waterConstraints: constraints,
        validationHint: `选择 ${count} 个未占用格${connectedHint || `，形状可旋转或翻面${constraintHint}`}。`,
      };
    }
    if (state.currentAction.step === "choice") {
      const choice = state.currentAction.pendingChoice;
      const remaining = choice?.remaining || 0;
      return {
        rawRequiredCount: 0,
        requiredCount: 0,
        appliedResiliency: 0,
        maxResiliencyForThisRot: 0,
        cubeKind: "water",
        canSubmitEmpty: false,
        waterConstraints: [],
        validationHint: `选择三巴纹获得的资源（剩余 ${remaining} 次）。`,
      };
    }
    if (state.currentAction.step === "lantern") {
      const lantern = currentLanternChoice();
      const remaining = state.currentAction.pendingLanterns?.length || 0;
      return {
        rawRequiredCount: 0,
        requiredCount: 0,
        appliedResiliency: 0,
        maxResiliencyForThisRot: 0,
        cubeKind: "rot",
        canSubmitEmpty: false,
        waterConstraints: [],
        validationHint: lantern
          ? `选择是否移除第 ${lantern.x + 1} 列第 ${lantern.y + 1} 行石灯笼上的腐败（剩余 ${remaining} 个）。`
          : "选择是否移除石灯笼上的腐败。",
      };
    }
    const rot = action.rot[state.currentAction.rotIndex];
    if (!rot) {
      return { rawRequiredCount: 0, requiredCount: 0, appliedResiliency: 0, maxResiliencyForThisRot: 0, cubeKind: "rot", canSubmitEmpty: true, validationHint: "没有需要放置的腐败。" };
    }
    const requirement = rotRequirement(rot);
    const count = requirement.requiredCount;
    const cubeKind = state.nextRotAsWater ? "water" : "rot";
    const mode = rot.diagonal ? "对角连接" : "正交连接";
    const cover = rot.cover ? "，且至少覆盖 1 个非空地块" : "";
    const targetCover = count > 0 && rot.coverPlots?.length ? `，且至少覆盖 1 个${plotListLabel(rot.coverPlots)}格` : "";
    const line = count > 1 && rot.line ? "，且腐败需连成一条直线" : "";
    const locked = rot.locked ? "，锁定腐败不受韧性抵消" : "";
    const sameAction = state.currentAction.rotKeys?.length ? "，且不能正交相邻本行动已放置的其他腐败实例" : "";
    return {
      rawRequiredCount: requirement.rawRequiredCount,
      requiredCount: count,
      appliedResiliency: requirement.appliedResiliency,
      maxResiliencyForThisRot: requirement.maxResiliencyForThisRot,
      cubeKind,
      canSubmitEmpty: count === 0,
      validationHint: `选择 ${count} 个未占用格，腐败需${mode}${cover}${targetCover}${line}${locked}${sameAction}。`,
    };
  }

  function waterConstraints(action) {
    if (!Array.isArray(action.water)) return [];
    return (action.water || [])
      .map(normalizeWaterPoint)
      .filter((point) => point.coverPlots?.length)
      .map((point) => ({
        x: point.x,
        y: point.y,
        coverPlots: point.coverPlots,
      }));
  }

  function waterCount(action) {
    if (Array.isArray(action.water)) return action.water.length;
    return Number(action.water?.count) || 0;
  }

  function isConnectedWater(water) {
    return !Array.isArray(water) && Boolean(water?.connected);
  }

  function plotListLabel(plots) {
    return plots.map((plot) => ICONS[plot] || plot).join("或");
  }

  function placementKey(cells) {
    return cells.map((c) => `${c.x},${c.y}`).sort().join("|");
  }

  function ensureCurrentActionRotKeys() {
    if (state.currentAction && !Array.isArray(state.currentAction.rotKeys)) state.currentAction.rotKeys = [];
  }

  function touchesSameActionRot(cells, blockedAdjacentKeys = []) {
    const blocked = new Set(blockedAdjacentKeys || []);
    return cells.some((cell) => blocked.has(cell.key) || touchesAny(cell, blocked));
  }

  function submitCurrentPlacement(cells = []) {
    if (!state.currentAction) return getPublicState();
    if (state.currentAction.step === "choice") {
      state.currentAction.validationError = "请先选择三巴纹获得的资源。";
      return getPublicState();
    }
    if (state.currentAction.step === "lantern") {
      state.currentAction.validationError = "请先选择是否移除石灯笼上的腐败。";
      return getPublicState();
    }
    const submitted = cells
      .map((cell) => ({ x: Number(cell.x), y: Number(cell.y), key: `${Number(cell.x)},${Number(cell.y)}` }))
      .filter((cell) => Number.isInteger(cell.x) && Number.isInteger(cell.y));
    const requirement = currentRequirement();
    const expected = requirement?.requiredCount ?? 0;
    if (submitted.length !== expected) {
      state.currentAction.validationError = `需要选择 ${expected} 个格子，当前选择了 ${submitted.length} 个。`;
      return getPublicState();
    }
    ensureCurrentActionRotKeys();
    if (state.currentAction.step === "rot" && touchesSameActionRot(submitted, state.currentAction.rotKeys)) {
      state.currentAction.validationError = "不同腐败实例不能正交相邻。";
      return getPublicState();
    }
    const options = currentPlacements();
    const key = placementKey(submitted);
    const index = options.findIndex((option) => placementKey(option.cells) === key);
    if (index < 0) {
      state.currentAction.validationError = state.currentAction.step === "water"
        ? "这组格子不符合当前行动牌的形状或指定图标要求。"
        : "这组格子不符合当前行动牌的放置规则。";
      return getPublicState();
    }
    state.currentAction.validationError = "";
    return placeCurrent(index);
  }

  function setRotReduction(amount) {
    if (!state.currentAction || state.currentAction.step !== "rot") return getPublicState();
    const action = currentSide();
    const rot = action.rot[state.currentAction.rotIndex];
    if (!rot || rot.locked) return getPublicState();
    const rawRequiredCount = rawRotCount(rot);
    const max = Math.min(rawRequiredCount, state.resources.resiliency);
    state.currentAction.rotReductions = state.currentAction.rotReductions || {};
    state.currentAction.rotReductions[state.currentAction.rotIndex] = clampNumber(amount, 0, max);
    state.currentAction.validationError = "";
    return getPublicState();
  }

  function rawRotCount(rot) {
    if (rot.milestoneFormula === "fiveMinusCurrent") return Math.max(0, 5 - milestone());
    return rot.milestone ? Math.max(1, 6 - milestone()) : rot.count;
  }

  function effectiveRotCount(rot) {
    return rotRequirement(rot).requiredCount;
  }

  function rotRequirement(rot) {
    const rawRequiredCount = rawRotCount(rot);
    const maxResiliencyForThisRot = rot.locked ? 0 : Math.min(rawRequiredCount, state.resources.resiliency);
    const saved = state.currentAction?.rotReductions?.[state.currentAction.rotIndex];
    const appliedResiliency = clampNumber(saved ?? maxResiliencyForThisRot, 0, maxResiliencyForThisRot);
    return {
      rawRequiredCount,
      maxResiliencyForThisRot,
      appliedResiliency,
      requiredCount: Math.max(0, rawRequiredCount - appliedResiliency),
    };
  }

  function clampNumber(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.floor(n)));
  }

  function placeCurrent(index = 0) {
    if (!state.currentAction) return getPublicState();
    const options = currentPlacements();
    const option = options[index];
    if (!option) {
      failAction("没有合法放置。");
      return getPublicState();
    }
    pushHistory();
    if (state.currentAction.step === "water") {
      state.currentAction.validationError = "";
      const action = currentSide();
      state.currentAction.resiliencyBeforeWater = state.resources.resiliency;
      for (const c of option.cells) setCube(c.key, "water");
      resolveWater(option.cells.map((c) => getCell(c.x, c.y)));
      if (state.currentAction.pendingChoice) {
        state.currentAction.pendingChoice.resume = { type: "afterWater" };
        state.currentAction.step = "choice";
      } else {
        finishWaterStage(action);
      }
    } else {
      state.currentAction.validationError = "";
      const asWater = state.nextRotAsWater;
      const action = currentSide();
      const rot = action.rot[state.currentAction.rotIndex];
      const requirement = rot ? rotRequirement(rot) : { appliedResiliency: 0 };
      if (requirement.appliedResiliency) {
        state.resources.resiliency -= requirement.appliedResiliency;
        log(`韧性抵消 ${requirement.appliedResiliency} 个腐败。`, "resource");
      }
      for (const c of option.cells) setCube(c.key, asWater ? "water" : "rot");
      if (asWater) {
        state.nextRotAsWater = false;
        resolveWater(option.cells.map((c) => getCell(c.x, c.y)));
        log("鲤鱼效果：本次腐败改为浇水。", "effect");
      } else {
        resolveRot(option.cells.map((c) => getCell(c.x, c.y)));
      }
      ensureCurrentActionRotKeys();
      state.currentAction.rotKeys = [...state.currentAction.rotKeys, ...option.cells.map((c) => c.key)];
      if (state.currentAction.pendingChoice) {
        state.currentAction.pendingChoice.resume = { type: "afterRot", nextRotIndex: state.currentAction.rotIndex + 1 };
        state.currentAction.step = "choice";
        return getPublicState();
      }
      state.currentAction.rotIndex += 1;
      advancePastEmptyRot();
    }
    return getPublicState();
  }

  function finishWaterStage(action = currentSide()) {
    if (!state.currentAction) return;
    if (action.doubleResiliency) {
      const before = state.currentAction.resiliencyBeforeWater ?? state.resources.resiliency;
      const gainedResiliency = state.resources.resiliency - before;
      if (gainedResiliency > 0) gain("resiliency", gainedResiliency, "行动牌韧性加倍");
    }
    delete state.currentAction.resiliencyBeforeWater;
    delete state.currentAction.pendingChoice;
    state.currentAction.step = "rot";
    state.currentAction.rotIndex = 0;
    advancePastEmptyRot();
  }

  function advancePastEmptyRot() {
    const action = currentSide();
    while (state.currentAction && state.currentAction.step === "rot") {
      if (state.currentAction.rotIndex >= action.rot.length) {
        completeAction();
        return;
      }
      const before = state.resources.resiliency;
      const placements = currentPlacements();
      if (placements.length) return;
      state.resources.resiliency = before;
      failAction("腐败无法完整放置。");
      return;
    }
  }

  function completeAction() {
    if (state.currentAction?.pendingLanterns?.length) {
      state.currentAction.step = "lantern";
      state.currentAction.validationError = "";
      return;
    }
    finishAction();
  }

  function finishAction() {
    const action = currentSide();
    for (const [kind, amount] of Object.entries(action.bonus || {})) gain(kind, amount, "行动牌奖励");
    state.actionDiscard.push(state.currentAction.card);
    state.currentAction = null;
    if (!state.actionPiles[0].length && !state.actionPiles[1].length) {
      clearCubes();
      enterUpgrade("行动牌用尽。");
    }
  }

  function failAction(reason) {
    log(reason, "fail");
    if (state.currentAction) {
      state.actionDiscard.push(state.currentAction.card);
      state.currentAction = null;
    }
    clearCubes();
    if (state.year >= 5) enterEndgame();
    else enterUpgrade(reason);
  }

  function clearCubes() {
    state.cubes = {};
    state.cubeRounds = {};
    state.resources.resiliency = 0;
    state.nextRotAsWater = false;
  }

  function setCube(key, kind) {
    state.cubes[key] = kind;
    state.cubeRounds[key] = currentActionRound();
  }

  function deleteCube(key) {
    delete state.cubes[key];
    delete state.cubeRounds[key];
  }

  function currentActionRound() {
    return state.actionDiscard.length + 1;
  }

  function resolveWater(cells) {
    const triggered = new Set(cells.map((c) => c.plot));
    for (const cell of cells) {
      const marks = state.cardMarks[cell.card.instanceId] || {};
      marks[cell.y] = true;
      state.cardMarks[cell.card.instanceId] = marks;
      if (cell.plot === "blossom") gain("blossom", 1, "浇水花朵");
      if (cell.plot === "sun") gain("sun", 1, "浇水阳光");
      if (cell.plot === "pine") gain("resiliency", 1, "浇水松树");
      if (cell.golden) {
        const resource = goldenResource(cell.plot);
        if (resource) gain(resource, 1, "金色地块");
      }
      if (cell.plot === "mitsudomoe") queueResourceChoice("三巴纹");
      if (cell.plot === "spring") gain("blossom", rowRotCount(cell.y), "春风");
      if (cell.plot === "bridge") {
        gain("blossom", milestone(), "桥");
        gain("sun", 2, "桥");
      }
      if (cell.plot === "koi") state.nextRotAsWater = true;
      if (cell.plot === "tea" && teaComplete(cell.card)) {
        gain("blossom", 3, "茶");
        drawGardenReward("茶");
      }
    }
    if (triggered.has("butterflies")) {
      const n = cells.filter((c) => c.plot === "blossom").length;
      gain("blossom", n * 2, "蝴蝶增强花朵");
    }
    if (triggered.has("dragonfly")) {
      const n = cells.filter((c) => c.plot === "empty").length;
      gain("blossom", n, "蜻蜓增强空地");
    }
    if (triggered.has("crane")) {
      gain("blossom", cells.filter((c) => c.plot === "blossom").length, "鹤");
      gain("sun", cells.filter((c) => c.plot === "sun").length, "鹤");
      gain("resiliency", cells.filter((c) => c.plot === "pine").length, "鹤");
    }
    if (hasUncovered("raked")) gain("sun", cells.filter((c) => c.plot === "pine").length, "枯山水持续效果");
    if (hasUncovered("parasol")) gain("sun", nearbyWatered("parasol", cells, "sun"), "阳伞持续效果");
    if (hasUncovered("chidori")) {
      const chidoriCount = nearbyWatered("chidori", cells, "pine");
      gain("blossom", chidoriCount, "千鸟持续效果");
      gain("sun", chidoriCount, "千鸟持续效果");
    }
    if (hasUncovered("lotus") && cells.filter((c) => c.plot === "pine").length >= 2) gain("blossom", 2, "莲持续效果");
    if (
      hasUncovered("treasure")
      && cells.some((c) => c.plot === "blossom")
      && cells.some((c) => c.plot === "sun")
      && cells.some((c) => c.plot === "pine")
    ) {
      gain("blossom", 2, "宝结持续效果");
    }
  }

  function goldenResource(plot) {
    if (plot === "blossom") return "blossom";
    if (plot === "sun") return "sun";
    if (plot === "pine") return "resiliency";
    return null;
  }

  function queueResourceChoice(reason) {
    if (!state.currentAction) return;
    const current = state.currentAction.pendingChoice || {
      type: "resource",
      reason,
      remaining: 0,
      options: ["blossom", "sun", "resiliency"],
    };
    current.remaining += 1;
    state.currentAction.pendingChoice = current;
  }

  function choosePendingResource(kind) {
    if (!state.currentAction || state.currentAction.step !== "choice") return getPublicState();
    const choice = state.currentAction.pendingChoice;
    if (!choice || !choice.options.includes(kind)) return getPublicState();
    gain(kind, 1, choice.reason);
    choice.remaining -= 1;
    if (choice.remaining <= 0) {
      const resume = choice.resume || { type: "afterWater" };
      delete state.currentAction.pendingChoice;
      if (resume.type === "afterRot") {
        state.currentAction.step = "rot";
        state.currentAction.rotIndex = resume.nextRotIndex;
        advancePastEmptyRot();
      } else {
        finishWaterStage();
      }
    }
    return getPublicState();
  }

  function drawGardenReward(reason) {
    if (!state.gardenDeck.length) {
      log(`${reason}：花园牌库为空，无法加入新牌。`, "resource");
      return;
    }
    const card = drawBottom(state.gardenDeck);
    const def = gardenById[card.defId];
    addGardenCard(card);
    log(`${reason}：将 ${def.name} 加入当前花园。`, "garden");
  }

  function resolveRot(cells) {
    for (const cell of cells) {
      if (cell.plot === "mushroom") gain("blossom", 2, "蘑菇被腐败覆盖");
      if (cell.plot === "lantern") {
        queueLanternChoice(cell);
      }
      if (cell.plot === "mist") {
        removeWater(milestone());
        gain("sun", 2, "雾");
      }
    }
  }

  function queueLanternChoice(cell) {
    if (!state.currentAction) return;
    state.currentAction.pendingLanterns = state.currentAction.pendingLanterns || [];
    if (!state.currentAction.pendingLanterns.some((lantern) => lantern.key === cell.key)) {
      state.currentAction.pendingLanterns.push({ key: cell.key, x: cell.x, y: cell.y });
    }
  }

  function currentLanternChoice() {
    return state.currentAction?.pendingLanterns?.[0] || null;
  }

  function chooseLantern(remove) {
    if (!state.currentAction || state.currentAction.step !== "lantern") return getPublicState();
    const lantern = currentLanternChoice();
    if (!lantern) {
      finishAction();
      return getPublicState();
    }
    pushHistory();
    state.currentAction.pendingLanterns.shift();
    if (remove) {
      deleteCube(lantern.key);
      gain("blossom", 1, "石灯笼移除腐败");
    } else {
      log("石灯笼：保留腐败。", "effect");
    }
    if (state.currentAction.pendingLanterns.length) {
      state.currentAction.validationError = "";
    } else {
      delete state.currentAction.pendingLanterns;
      finishAction();
    }
    return getPublicState();
  }

  function rowRotCount(y) {
    return allCells().filter((c) => c.y === y && c.cube === "rot").length;
  }

  function teaComplete(card) {
    const def = gardenById[card.defId];
    const side = card.upgraded ? def.back : def.front;
    const teaRows = side.map((p, i) => p === "tea" ? i : -1).filter((i) => i >= 0);
    const marks = state.cardMarks[card.instanceId] || {};
    return teaRows.length > 1 && teaRows.every((row) => marks[row]);
  }

  function hasUncovered(plot) {
    return allCells().some((c) => c.plot === plot && !c.cube);
  }

  function nearbyWatered(effectPlot, cells, targetPlot) {
    const sources = allCells().filter((c) => c.plot === effectPlot && !c.cube);
    let count = 0;
    for (const water of cells) {
      if (water.plot !== targetPlot) continue;
      if (sources.some((s) => Math.abs(s.x - water.x) <= 1)) count += 1;
    }
    return count;
  }

  function removeWater(count) {
    for (const key of Object.keys(state.cubes)) {
      if (count <= 0) return;
      if (state.cubes[key] === "water") {
        deleteCube(key);
        count -= 1;
      }
    }
  }

  function enterUpgrade(reason) {
    state.phase = "upgrade";
    state.currentAction = null;
    state.expansionOffer = [];
    for (let i = 0; i < 3 && state.expansionDeck.length; i += 1) state.expansionOffer.push(drawBottom(state.expansionDeck));
    log(`进入升级阶段：${reason}`, "phase");
  }

  function upgradeGarden(instanceId) {
    if (state.phase !== "upgrade" && state.phase !== "endgame-upgrade") return getPublicState();
    const upgradePool = state.phase === "upgrade" ? state.garden : [...state.garden, ...state.gardenDeck];
    const card = upgradePool.find((c) => c.instanceId === instanceId);
    if (!card || card.upgraded) return getPublicState();
    const def = gardenById[card.defId];
    if (state.resources.blossom < def.cost) return getPublicState();
    pushHistory();
    state.resources.blossom -= def.cost;
    card.upgraded = true;
    log(`花费 ${def.cost} 花升级 ${def.name}。`, "upgrade");
    return getPublicState();
  }

  function buyExpansion(instanceId) {
    if (state.phase !== "upgrade") return getPublicState();
    const index = state.expansionOffer.findIndex((c) => c.instanceId === instanceId);
    if (index < 0) return getPublicState();
    const card = state.expansionOffer[index];
    const def = gardenById[card.defId];
    if (state.resources.blossom < def.cost) return getPublicState();
    pushHistory();
    state.resources.blossom -= def.cost;
    state.gardenDeck.push(card);
    state.expansionOffer.splice(index, 1);
    log(`花费 ${def.cost} 花，将 ${def.name} 加入花园牌库。`, "upgrade");
    return getPublicState();
  }

  function finishUpgrade() {
    if (state.phase === "endgame-upgrade") return scoreGame();
    if (state.phase !== "upgrade") return getPublicState();
    pushHistory();
    state.expansionDeck = [...state.expansionOffer.reverse(), ...state.expansionDeck];
    state.expansionOffer = [];
    resetCleanupTracks();
    state.gardenDeck = shuffle([...state.gardenDeck, ...state.garden]);
    state.garden = [];
    rebuildActionPiles();
    state.year += 1;
    state.phase = "action";
    drawGarden();
    log(`进入第 ${state.year} 年。`, "phase");
    return getPublicState();
  }

  function resetCleanupTracks() {
    state.resources.blossom = 0;
    state.resources.sun = 0;
  }

  function replant() {
    if (state.phase !== "action" || state.usedReplant) return getPublicState();
    pushHistory();
    state.gardenDeck = shuffle([...state.gardenDeck, ...state.garden]);
    state.garden = [];
    state.usedReplant = true;
    drawGarden();
    state.usedReplant = true;
    log("本年已使用 Replant 重新布置花园。", "garden");
    return getPublicState();
  }

  function enterEndgame() {
    state.phase = "endgame-upgrade";
    state.expansionOffer = [];
    clearCubes();
    log("第 5 年行动结束，进入终局升级。", "phase");
  }

  function scoreGame() {
    pushHistory();
    const vp = currentScore();
    state.resources.vp = vp;
    state.result = vp >= 25 ? "win" : "lose";
    state.phase = "gameover";
    log(`终局 ${vp} 分，${vp >= 25 ? "胜利" : "未达成 25 分"}。`, "score");
    return getPublicState();
  }

  function currentScore() {
    return [...state.garden, ...state.gardenDeck]
      .reduce((sum, card) => sum + (card.upgraded ? gardenById[card.defId].vp : 0), 0);
  }

  function serialize() {
    return JSON.stringify({ state, nextInstance, history, rngState: rng?.getState?.() || null });
  }

  function load(serialized) {
    const payload = JSON.parse(serialized);
    state = payload.state;
    ensureStateShape();
    if (state.currentAction) {
      state.currentAction.rotKeys = Array.isArray(state.currentAction.rotKeys) ? state.currentAction.rotKeys : [];
      state.currentAction.rotReductions = state.currentAction.rotReductions || {};
    }
    nextInstance = payload.nextInstance || 1;
    history = payload.history || [];
    rng = createRng(state.seed || 1);
    if (payload.rngState) rng.setState(payload.rngState);
    return getPublicState();
  }

  function undo() {
    const snapshot = history.pop();
    if (snapshot) restore(snapshot);
    return getPublicState();
  }

  function getPublicState() {
    if (!state) newGame();
    const garden = state.garden.map((card, x) => {
      const def = gardenById[card.defId];
      return {
        ...publicGardenCardBase(card, def),
        image: cardImage(card.upgraded ? def.backPage : def.frontPage),
        plots: [0, 1, 2, 3].map((y) => {
          const cell = getCell(x, y);
          return { ...simpleCell(cell), icon: ICONS[cell.plot] || cell.plot };
        }),
      };
    });
    const piles = state.actionPiles.map((pile) => pile.map((card) => {
      const sideDef = getActionSide(card);
      return { ...card, page: sideDef.page, image: cardImage(sideDef.page) };
    }));
    const offer = state.expansionOffer.map((card) => {
      const def = gardenById[card.defId];
      return { ...publicGardenCardBase(card, def), image: cardImage(def.frontPage) };
    });
    const deckCards = state.gardenDeck.map((card) => {
      const def = gardenById[card.defId];
      return { ...publicGardenCardBase(card, def), image: cardImage(card.upgraded ? def.backPage : def.frontPage) };
    });
    const discardCards = state.actionDiscard.map((card) => {
      const sideDef = getActionSide(card);
      return { ...card, page: sideDef.page, image: cardImage(sideDef.page) };
    });
    let current = null;
    if (state.currentAction) {
      const sideDef = currentSide();
      const requirement = currentRequirement();
      current = {
        step: state.currentAction.step,
        rotIndex: state.currentAction.rotIndex,
        page: sideDef.page,
        image: cardImage(sideDef.page),
        legalPlacementCount: currentPlacements().length,
        rawRequiredCount: requirement.rawRequiredCount,
        requiredCount: requirement.requiredCount,
        appliedResiliency: requirement.appliedResiliency,
        maxResiliencyForThisRot: requirement.maxResiliencyForThisRot,
        cubeKind: requirement.cubeKind,
        canSubmitEmpty: requirement.canSubmitEmpty,
        waterConstraints: requirement.waterConstraints || [],
        sameActionRotKeys: [...(state.currentAction.rotKeys || [])],
        pendingChoice: state.currentAction.pendingChoice ? {
          type: state.currentAction.pendingChoice.type,
          reason: state.currentAction.pendingChoice.reason,
          remaining: state.currentAction.pendingChoice.remaining,
          options: [...(state.currentAction.pendingChoice.options || [])],
        } : null,
        pendingLantern: state.currentAction.pendingLanterns?.length ? {
          ...state.currentAction.pendingLanterns[0],
          remaining: state.currentAction.pendingLanterns.length,
        } : null,
        validationHint: state.currentAction.validationError || requirement.validationHint,
        validationError: state.currentAction.validationError || "",
      };
    }
    return clone({
      seed: state.seed,
      year: state.year,
      phase: state.phase,
      resources: state.resources,
      score: currentScore(),
      milestone: milestone(),
      garden,
      gardenDeckCount: state.gardenDeck.length,
      gardenDeck: deckCards,
      expansionDeckCount: state.expansionDeck.length,
      expansionOffer: offer,
      actionPiles: piles,
      actionDiscard: discardCards,
      actionDiscardCount: state.actionDiscard.length,
      currentAction: current,
      log: state.log,
      result: state.result,
      usedReplant: state.usedReplant,
    });
  }

  function renderGameToText() {
    const s = getPublicState();
    return JSON.stringify({
      coordinateSystem: "x is garden column from left, y is row from top, both zero-based",
      phase: s.phase,
      year: s.year,
      resources: s.resources,
      milestone: s.milestone,
      gardenColumns: s.garden.length,
      tracks: trackTextState(s),
      garden: s.garden.map((card, x) => ({
        x,
        card: card.name,
        upgraded: card.upgraded,
        plots: card.plots.map((p) => ({ y: p.y, plot: p.plot, cube: p.cube, cubeRound: p.cubeRound })),
      })),
      actionPiles: s.actionPiles.map((pile) => pile[0]?.page || null),
      currentAction: s.currentAction ? {
        step: s.currentAction.step,
        page: s.currentAction.page,
        rotIndex: s.currentAction.rotIndex,
        rawRequiredCount: s.currentAction.rawRequiredCount,
        requiredCount: s.currentAction.requiredCount,
        appliedResiliency: s.currentAction.appliedResiliency,
        maxResiliencyForThisRot: s.currentAction.maxResiliencyForThisRot,
        cubeKind: s.currentAction.cubeKind,
        waterConstraints: s.currentAction.waterConstraints,
        sameActionRotKeys: s.currentAction.sameActionRotKeys,
        sameActionRotCount: s.currentAction.sameActionRotKeys.length,
        selectedCount: window.__aleaTempSelectionCount || 0,
        legalPlacements: s.currentAction.legalPlacementCount,
      } : null,
      log: s.log.slice(0, 5).map((entry) => entry.message),
      result: s.result,
      saved: Boolean(window.__aleaSaveStatus?.saved),
      saveAvailable: window.__aleaSaveStatus?.available !== false,
    });
  }

  function trackTextState(s) {
    const year = Math.min(Math.max(Number(s.year) || 1, 1), 5);
    const blossom = Math.max(0, Number(s.resources.blossom) || 0);
    const sun = Math.min(10, Math.max(0, Number(s.resources.sun) || 0));
    const blossomDisplay = blossom > 10 ? "10+" : String(blossom);
    return {
      year: { value: year, displayValue: String(year), cell: `year-${year}` },
      blossom: { value: blossom, displayValue: blossomDisplay, cell: `blossom-${blossomDisplay}` },
      sun: {
        value: sun,
        displayValue: String(sun),
        cell: `sun-${sun}`,
        rewardsReached: SUN_GARDEN_REWARD_THRESHOLDS.filter((threshold) => sun >= threshold),
      },
    };
  }

  window.AleasGarden = {
    newGame,
    getState: getPublicState,
    chooseActionPile,
    placeCurrent,
    submitCurrentPlacement,
    setRotReduction,
    choosePendingResource,
    chooseLantern,
    failAction: () => {
      pushHistory();
      failAction("玩家手动判定当前行动失败。");
      return getPublicState();
    },
    upgradeGarden,
    buyExpansion,
    finishUpgrade,
    replant,
    undo,
    getCatalog,
    serialize,
    load,
  };
  window.render_game_to_text = renderGameToText;
  window.advanceTime = () => {};
})();
