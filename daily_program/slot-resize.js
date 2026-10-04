/* Local display preferences: sizes never enter planner JSON or cloud sync. */
(function (root) {
  const MIN_HEIGHT = 48;
  const MAX_HEIGHT = 480;
  const DEFAULT_HEIGHT = 64;
  const STORAGE_KEY = "daily-program.slot-heights.v1";
  function clampHeight(height) {
    return Math.round(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Number(height) || DEFAULT_HEIGHT)));
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { clampHeight, MIN_HEIGHT, MAX_HEIGHT, DEFAULT_HEIGHT };
    return;
  }
  let heights = {};
  try { heights = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { heights = {}; }
  if (!heights || typeof heights !== "object" || Array.isArray(heights)) heights = {};
  const keyFor = slot => `${slot.dataset.dateKey}:${slot.dataset.slotIndex}`;
  function setHeight(slot, height) {
    const value = clampHeight(height);
    slot.style.height = `${value}px`;
    const handle = slot.closest(".day-slot-cell")?.querySelector(".slot-resize-handle");
    if (handle) handle.setAttribute("aria-valuenow", String(value));
    return value;
  }
  function persist(slot) {
    heights[keyFor(slot)] = clampHeight(slot.style.height.replace("px", ""));
    // Keep the same date/half size in cycle and holiday views.
    document.querySelectorAll(".day-slot").forEach(other => {
      if (keyFor(other) === keyFor(slot)) setHeight(other, heights[keyFor(slot)]);
    });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(heights)); } catch { /* Resizing still works if storage is full. */ }
  }
  let drag = null;
  function finish(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const current = drag;
    drag = null;
    current.handle.classList.remove("resizing");
    persist(current.slot);
    if (current.handle.hasPointerCapture(event.pointerId)) current.handle.releasePointerCapture(event.pointerId);
  }
  document.addEventListener("pointerdown", event => {
    const handle = event.target.closest(".slot-resize-handle");
    if (!handle || (event.pointerType === "mouse" && event.button !== 0) || drag) return;
    const slot = handle.closest(".day-slot-cell").querySelector(".day-slot");
    event.preventDefault();
    handle.focus({ preventScroll: true });
    drag = { handle, slot, pointerId: event.pointerId, y: event.clientY, height: slot.getBoundingClientRect().height };
    handle.setPointerCapture(event.pointerId);
    handle.classList.add("resizing");
  });
  document.addEventListener("pointermove", event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    const height = setHeight(drag.slot, drag.height + event.clientY - drag.y);
    heights[keyFor(drag.slot)] = height;
  }, { passive: false });
  document.addEventListener("pointerup", finish);
  document.addEventListener("pointercancel", finish);
  document.addEventListener("lostpointercapture", finish);
  document.addEventListener("keydown", event => {
    const handle = event.target.closest(".slot-resize-handle");
    if (!handle || !["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const slot = handle.closest(".day-slot-cell").querySelector(".day-slot");
    const height = event.key === "Home" ? DEFAULT_HEIGHT : event.key === "End" ? MAX_HEIGHT : slot.getBoundingClientRect().height + (event.key === "ArrowUp" ? -16 : 16);
    setHeight(slot, height);
    persist(slot);
  });
  document.addEventListener("dblclick", event => {
    const handle = event.target.closest(".slot-resize-handle");
    if (!handle) return;
    const slot = handle.closest(".day-slot-cell").querySelector(".day-slot");
    setHeight(slot, DEFAULT_HEIGHT);
    persist(slot);
  });
  root.PlannerSlotResize = {
    applyHeight(slot) { setHeight(slot, heights[keyFor(slot)] || DEFAULT_HEIGHT); },
    MIN_HEIGHT, MAX_HEIGHT, DEFAULT_HEIGHT
  };
})(globalThis);
