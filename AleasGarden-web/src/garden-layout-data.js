(() => {
  const plot = (x, y, type, golden = false, upgraded = false) => ({ x, y, type, golden, upgraded });
  const side = (page, columns, plots) => ({ page, columns, plots });
  const card = (front, back) => ({
    front,
    back: {
      ...back,
      plots: back.plots.map((entry) => ({
        ...entry,
        upgraded: entry.type === "empty",
      })),
    },
  });

  window.AleasGardenDefaultLayouts = {
    format: "aleas-garden-layouts",
    version: 2,
    cards: {
      s1: card(
        side(1, 1, [plot(0, 0, "blossom"), plot(0, 1, "empty"), plot(0, 2, "empty"), plot(0, 3, "pine")]),
        side(2, 1, [plot(0, 0, "blossom"), plot(0, 1, "empty"), plot(0, 2, "pine"), plot(0, 3, "pine")]),
      ),
      s2: card(
        side(3, 1, [plot(0, 0, "empty"), plot(0, 1, "blossom"), plot(0, 2, "empty"), plot(0, 3, "sun")]),
        side(4, 1, [plot(0, 0, "sun"), plot(0, 1, "blossom"), plot(0, 2, "empty"), plot(0, 3, "sun")]),
      ),
      s3: card(
        side(5, 1, [plot(0, 0, "empty"), plot(0, 1, "pine"), plot(0, 2, "empty"), plot(0, 3, "blossom")]),
        side(6, 1, [plot(0, 0, "pine"), plot(0, 1, "pine"), plot(0, 2, "empty"), plot(0, 3, "blossom")]),
      ),
      s4: card(
        side(7, 1, [plot(0, 0, "sun"), plot(0, 1, "empty"), plot(0, 2, "blossom"), plot(0, 3, "empty")]),
        side(8, 1, [plot(0, 0, "sun"), plot(0, 1, "empty"), plot(0, 2, "blossom", true), plot(0, 3, "empty")]),
      ),
      s5: card(
        side(9, 1, [plot(0, 0, "empty"), plot(0, 1, "empty"), plot(0, 2, "blossom"), plot(0, 3, "sun")]),
        side(10, 1, [plot(0, 0, "empty"), plot(0, 1, "empty"), plot(0, 2, "blossom"), plot(0, 3, "sun", true)]),
      ),
      s6: card(
        side(11, 1, [plot(0, 0, "empty"), plot(0, 1, "sun"), plot(0, 2, "pine"), plot(0, 3, "empty")]),
        side(12, 1, [plot(0, 0, "empty"), plot(0, 1, "sun"), plot(0, 2, "pine", true), plot(0, 3, "empty")]),
      ),
      s7: card(
        side(13, 1, [plot(0, 0, "pine"), plot(0, 1, "empty"), plot(0, 2, "sun"), plot(0, 3, "empty")]),
        side(14, 1, [plot(0, 0, "pine"), plot(0, 1, "sun", true), plot(0, 2, "sun", true), plot(0, 3, "empty")]),
      ),
      s8: card(
        side(15, 1, [plot(0, 0, "pine"), plot(0, 1, "blossom"), plot(0, 2, "empty"), plot(0, 3, "empty")]),
        side(16, 1, [plot(0, 0, "pine"), plot(0, 1, "blossom", true), plot(0, 2, "blossom"), plot(0, 3, "empty")]),
      ),
      e1: card(
        side(17, 2, [
          plot(0, 0, "empty"), plot(1, 0, "sun"),
          plot(0, 1, "blossom"), plot(1, 1, "empty"),
          plot(0, 2, "empty"), plot(1, 2, "blossom"),
          plot(0, 3, "empty"), plot(1, 3, "pine"),
        ]),
        side(18, 2, [
          plot(0, 0, "empty"), plot(1, 0, "sun"),
          plot(0, 1, "blossom", true), plot(1, 1, "empty"),
          plot(0, 2, "empty"), plot(1, 2, "blossom"),
          plot(0, 3, "empty"), plot(1, 3, "pine", true),
        ]),
      ),
      e2: card(
        side(19, 3, [plot(0, 0, "sun"), plot(0, 1, "empty"), plot(1, 1, "blossom"), plot(2, 1, "empty"), plot(2, 2, "pine")]),
        side(20, 3, [
          plot(0, 0, "sun"), plot(2, 0, "empty"),
          plot(0, 1, "empty"), plot(1, 1, "blossom", true), plot(2, 1, "empty"),
          plot(0, 2, "empty"), plot(2, 2, "pine"),
        ]),
      ),
      e3: card(
        side(21, 1, [plot(0, 1, "mitsudomoe"), plot(0, 2, "empty"), plot(0, 3, "mitsudomoe")]),
        side(22, 1, [plot(0, 0, "empty"), plot(0, 1, "mitsudomoe"), plot(0, 2, "mitsudomoe"), plot(0, 3, "mitsudomoe")]),
      ),
      e4: card(
        side(23, 1, [plot(0, 0, "sun"), plot(0, 1, "mushroom"), plot(0, 3, "empty")]),
        side(24, 1, [plot(0, 0, "sun"), plot(0, 1, "mushroom"), plot(0, 3, "mushroom")]),
      ),
      e5: card(
        side(25, 1, [plot(0, 0, "chidori"), plot(0, 2, "empty")]),
        side(26, 1, [plot(0, 0, "chidori"), plot(0, 2, "pine")]),
      ),
      e6: card(
        side(27, 1, [plot(0, 1, "parasol"), plot(0, 3, "sun")]),
        side(28, 1, [plot(0, 1, "parasol"), plot(0, 3, "sun", true)]),
      ),
      e7: card(
        side(29, 1, [plot(0, 0, "empty"), plot(0, 1, "pine"), plot(0, 2, "empty"), plot(0, 3, "raked")]),
        side(30, 1, [plot(0, 0, "pine", true), plot(0, 1, "pine"), plot(0, 2, "empty"), plot(0, 3, "raked")]),
      ),
      e8: card(
        side(31, 1, [plot(0, 0, "empty"), plot(0, 1, "spring"), plot(0, 2, "empty")]),
        side(32, 1, [plot(0, 0, "empty"), plot(0, 1, "spring"), plot(0, 2, "empty"), plot(0, 3, "empty")]),
      ),
      e9: card(
        side(33, 1, [plot(0, 0, "tea"), plot(0, 1, "empty"), plot(0, 3, "tea")]),
        side(34, 1, [plot(0, 0, "tea"), plot(0, 1, "empty"), plot(0, 2, "empty"), plot(0, 3, "tea")]),
      ),
      e10: card(
        side(35, 1, [plot(0, 0, "empty"), plot(0, 1, "butterflies"), plot(0, 2, "sun")]),
        side(36, 1, [plot(0, 0, "sun"), plot(0, 1, "butterflies"), plot(0, 2, "sun")]),
      ),
      e11: card(
        side(37, 1, [plot(0, 2, "empty"), plot(0, 3, "dragonfly")]),
        side(38, 1, [plot(0, 2, "empty"), plot(0, 3, "dragonfly")]),
      ),
      e12: card(
        side(39, 1, [plot(0, 0, "pine"), plot(0, 1, "empty"), plot(0, 2, "crane"), plot(0, 3, "sun")]),
        side(40, 1, [plot(0, 0, "pine"), plot(0, 1, "sun"), plot(0, 2, "crane"), plot(0, 3, "sun")]),
      ),
      e13: card(
        side(41, 1, [plot(0, 2, "koi")]),
        side(42, 1, [plot(0, 2, "koi"), plot(0, 3, "empty")]),
      ),
      e14: card(
        side(43, 1, [plot(0, 0, "empty"), plot(0, 1, "sun"), plot(0, 2, "empty"), plot(0, 3, "bridge")]),
        side(44, 1, [plot(0, 0, "sun", true), plot(0, 1, "sun"), plot(0, 2, "empty"), plot(0, 3, "bridge")]),
      ),
      e15: card(
        side(45, 1, [plot(0, 1, "empty"), plot(0, 2, "mist")]),
        side(46, 1, [plot(0, 0, "empty"), plot(0, 1, "empty"), plot(0, 2, "mist"), plot(0, 3, "empty")]),
      ),
      e16: card(
        side(47, 1, [plot(0, 1, "lotus"), plot(0, 2, "empty"), plot(0, 3, "pine")]),
        side(48, 1, [plot(0, 0, "empty"), plot(0, 1, "lotus"), plot(0, 2, "pine"), plot(0, 3, "pine")]),
      ),
      e17: card(
        side(49, 1, [plot(0, 1, "empty"), plot(0, 2, "treasure")]),
        side(50, 1, [plot(0, 0, "empty"), plot(0, 1, "empty"), plot(0, 2, "treasure"), plot(0, 3, "empty")]),
      ),
      e18: card(
        side(51, 1, [plot(0, 0, "pine"), plot(0, 1, "empty"), plot(0, 2, "lantern")]),
        side(52, 1, [plot(0, 0, "pine"), plot(0, 1, "empty"), plot(0, 2, "lantern"), plot(0, 3, "empty")]),
      ),
    },
  };
})();
