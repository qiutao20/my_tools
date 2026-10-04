/* Three-way merge for planner JSON; also loadable in Node for verification. */
(function (root) {
  function equal(a, b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && equal(a[key], b[key]));
  }
  function merge(base, local, remote, choices = {}) {
    const conflicts = [];
    function visit(b, l, r, path) {
      // An absent date represents six empty cells, including clearing the last cell.
      if (path.length === 2 && path[0] === "dateSlots") {
        b = b === undefined ? Array(6).fill("") : b;
        l = l === undefined ? Array(6).fill("") : l;
        r = r === undefined ? Array(6).fill("") : r;
      }
      const key = JSON.stringify(path);
      if (path.length === 1 && path[0] === "activePlanRange") return l;
      // Legacy copies of the grid are not authoritative; dateSlots holds editable cells.
      if (path[path.length - 1] === "daySlots") return l;
      if (equal(l, r)) return l;
      if (equal(l, b)) return r;
      if (equal(r, b)) return l;
      if (path[path.length - 1] === "updatedAt" && typeof l === "string" && typeof r === "string") return l > r ? l : r;
      if (Array.isArray(l) && Array.isArray(r) && (b === undefined || Array.isArray(b))) {
        const all = [...(b || []), ...l, ...r];
        const keyed = all.length > 0 && all.every(item => item && typeof item === "object" && typeof item.id === "string") && [b || [], l, r].every(items => new Set(items.map(item => item.id)).size === items.length);
        if (keyed) {
          const bm = new Map((b || []).map(item => [item.id, item]));
          const lm = new Map(l.map(item => [item.id, item]));
          const rm = new Map(r.map(item => [item.id, item]));
          return [...new Set([...lm.keys(), ...rm.keys(), ...bm.keys()])].map(id => visit(bm.get(id), lm.get(id), rm.get(id), [...path, { id }])).filter(item => item !== undefined);
        }
        const result = [];
        for (let i = 0; i < Math.max((b || []).length, l.length, r.length); i++) result[i] = visit(b?.[i], l[i], r[i], [...path, i]);
        return result;
      }
      if (l && r && typeof l === "object" && typeof r === "object" && !Array.isArray(l) && !Array.isArray(r) && (b === undefined || (b && typeof b === "object" && !Array.isArray(b)))) {
        const result = {};
        for (const field of new Set([...Object.keys(b || {}), ...Object.keys(l), ...Object.keys(r)])) {
          const value = visit(b?.[field], l[field], r[field], [...path, field]);
          if (value !== undefined) Object.defineProperty(result, field, { value, enumerable: true, writable: true, configurable: true });
        }
        return result;
      }
      const choice = choices[key];
      if (choice && equal(choice.local, l) && equal(choice.remote, r)) {
        if (choice.mode === "local") return l;
        if (choice.mode === "remote") return r;
        if (choice.mode === "manual") return choice.value;
      }
      conflicts.push({ key, path, base: b, local: l, remote: r });
      return l;
    }
    return { value: visit(base, local, remote, []), conflicts };
  }
  const api = { equal, merge };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PlannerSyncMerge = api;
})(globalThis);
