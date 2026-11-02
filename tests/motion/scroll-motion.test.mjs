import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EASINGS, EASING_NAMES, REVEAL_EFFECTS, clamp, hiddenState, mapRange, nextHeaderHidden,
  resolveMotionTier, revealStates, splitText, staggerDelay, tierProfile,
} from "../../src/lib/scroll-motion.ts";

test("reduced motion always wins, regardless of device power", () => {
  assert.equal(resolveMotionTier({ reducedMotion: true, viewportWidth: 1920, deviceMemory: 16, hardwareConcurrency: 16 }), "none");
});

test("weak devices and data-saver get the lite tier", () => {
  assert.equal(resolveMotionTier({ reducedMotion: false, viewportWidth: 390, deviceMemory: 2 }), "lite");
  assert.equal(resolveMotionTier({ reducedMotion: false, viewportWidth: 390, hardwareConcurrency: 2 }), "lite");
  assert.equal(resolveMotionTier({ reducedMotion: false, viewportWidth: 1280, saveData: true }), "lite");
});

test("capable or unknown devices get the full tier (unsupported APIs are not penalised)", () => {
  assert.equal(resolveMotionTier({ reducedMotion: false, viewportWidth: 1280 }), "full");
  assert.equal(resolveMotionTier({ reducedMotion: false, viewportWidth: 1280, deviceMemory: 8, hardwareConcurrency: 8 }), "full");
});

test("tier profiles: none is inert, lite has no parallax/blur, phones travel less than desktop", () => {
  const none = tierProfile("none", 1280);
  assert.deepEqual([none.distance, none.duration, none.parallax, none.blur], [0, 0, 0, false]);
  const lite = tierProfile("lite", 1280);
  assert.equal(lite.parallax, 0);
  assert.equal(lite.blur, false);
  assert.ok(tierProfile("full", 390).distance < tierProfile("full", 1280).distance);
  assert.ok(tierProfile("full", 390).parallax < tierProfile("full", 1280).parallax);
});

test("every effect hides content (opacity 0) at full tier and animates to visible", () => {
  for (const effect of REVEAL_EFFECTS) {
    const { hidden, visible } = revealStates({ effect, tier: "full" });
    assert.equal(hidden.opacity, 0, effect);
    assert.equal(visible.opacity, 1, effect);
    assert.deepEqual(Object.keys(hidden).sort(), Object.keys(visible).sort(), `${effect}: hidden/visible animate the same properties`);
  }
});

test("reduced motion: nothing is hidden and nothing animates", () => {
  for (const effect of REVEAL_EFFECTS) {
    assert.deepEqual(revealStates({ effect, tier: "none" }), { hidden: {}, visible: {} }, effect);
  }
});

test("slide direction maps to the right axis and sign", () => {
  assert.equal(hiddenState({ effect: "slide", direction: "up", distance: 40 }).y, 40);
  assert.equal(hiddenState({ effect: "slide", direction: "down", distance: 40 }).y, -40);
  assert.equal(hiddenState({ effect: "slide", direction: "left", distance: 40 }).x, 40);
  assert.equal(hiddenState({ effect: "slide", direction: "right", distance: 40 }).x, -40);
});

test("slide distance scales with tier and viewport", () => {
  const full = hiddenState({ effect: "slide", distance: 100, tier: "full", viewportWidth: 1280 }).y;
  assert.equal(full, 100);
  assert.ok(hiddenState({ effect: "slide", distance: 100, tier: "full", viewportWidth: 390 }).y < full);
  assert.ok(hiddenState({ effect: "slide", distance: 100, tier: "lite", viewportWidth: 1280 }).y < full);
});

test("blur is dropped on lite devices (falls back to a plain fade)", () => {
  assert.match(revealStates({ effect: "blur", tier: "full" }).hidden.filter, /blur/);
  assert.deepEqual(revealStates({ effect: "blur", tier: "lite" }).hidden, { opacity: 0 });
});

test("a plain fade leaves no transform/filter residue", () => {
  assert.deepEqual(Object.keys(revealStates({ effect: "fade", tier: "full" }).visible), ["opacity"]);
});

test("zoom/scale effects start on the expected side of 1", () => {
  assert.ok(hiddenState({ effect: "zoom-in" }).scale < 1);
  assert.ok(hiddenState({ effect: "scale-up" }).scale < 1);
  assert.ok(hiddenState({ effect: "zoom-out" }).scale > 1);
  assert.ok(hiddenState({ effect: "scale-down" }).scale > 1);
});

test("stagger delay grows linearly and is capped", () => {
  assert.equal(staggerDelay(0), 0);
  assert.ok(Math.abs(staggerDelay(3, 0.1) - 0.3) < 1e-9);
  assert.equal(staggerDelay(1000, 0.1, 0.5), 0.5);
  assert.equal(staggerDelay(-4), 0);
});

test("splitText keeps whitespace so wrapping matches the original", () => {
  const words = splitText("Stream  the best", "word");
  assert.equal(words.map((w) => w.value).join(""), "Stream  the best");
  assert.deepEqual(words.filter((w) => !w.space).map((w) => w.value), ["Stream", "the", "best"]);
  assert.deepEqual(splitText("Hi", "char").map((c) => c.value), ["H", "i"]);
  assert.deepEqual(splitText("", "word"), []);
});

test("splitText does not break emoji or astral characters apart", () => {
  assert.equal(splitText("a🎬b", "char").length, 3);
});

test("clamp and mapRange behave at and beyond the bounds", () => {
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(clamp(-5, 0, 1), 0);
  assert.equal(mapRange(50, 0, 100, 0, 1), 0.5);
  assert.equal(mapRange(-10, 0, 100, 10, 20), 10);
  assert.equal(mapRange(500, 0, 100, 10, 20), 20);
  assert.equal(mapRange(5, 3, 3, 7, 9), 7, "zero-width input range must not divide by zero");
});

test("header: shown near the top, hides scrolling down, reveals scrolling up", () => {
  const base = { hidden: false };
  assert.equal(nextHeaderHidden({ ...base, previousY: 0, y: 80 }), false, "inside the top offset");
  assert.equal(nextHeaderHidden({ ...base, previousY: 400, y: 520 }), true, "scrolling down");
  assert.equal(nextHeaderHidden({ hidden: true, previousY: 520, y: 480 }), false, "scrolling up");
});

test("header: ignores tiny jitters and never hides while pinned (keyboard focus)", () => {
  assert.equal(nextHeaderHidden({ hidden: true, previousY: 500, y: 502 }), true, "jitter keeps the current state");
  assert.equal(nextHeaderHidden({ hidden: false, previousY: 500, y: 503 }), false);
  assert.equal(nextHeaderHidden({ hidden: false, previousY: 400, y: 900, pinned: true }), false);
});

test("easings are valid cubic-bezier control points", () => {
  for (const name of EASING_NAMES) {
    const [x1, , x2] = EASINGS[name];
    assert.equal(EASINGS[name].length, 4, name);
    assert.ok(x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1, `${name}: x control points must stay within [0,1]`);
  }
});
