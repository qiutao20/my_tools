const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const merge = require("./sync-merge.js");
const clone = value => JSON.parse(JSON.stringify(value));
const base = { dateSlots: { "2026-10-05": ["原计划", "", "", "", "", ""] }, tasks: [{ id: "a", text: "论文", done: false }], notes: [] };
let local = clone(base), remote = clone(base);
local.dateSlots["2026-10-05"][0] = "本地修改";
remote.dateSlots["2026-10-05"][3] = "远端修改";
let result = merge.merge(base, local, remote);
assert.equal(result.conflicts.length, 0);
assert.equal(result.value.dateSlots["2026-10-05"][0], "本地修改");
assert.equal(result.value.dateSlots["2026-10-05"][3], "远端修改");
// Independent edits on a date that did not exist in the baseline.
result = merge.merge({ dateSlots: {} }, { dateSlots: { d: ["A", "", "", "", "", ""] } }, { dateSlots: { d: ["", "", "", "B", "", ""] } });
assert.equal(result.conflicts.length, 0);
assert.deepEqual(result.value.dateSlots.d, ["A", "", "", "B", "", ""]);
remote.dateSlots["2026-10-05"][0] = "另一内容";
result = merge.merge(base, local, remote);
assert.equal(result.conflicts.length, 1);
let conflict = result.conflicts[0];
const choices = { [conflict.key]: { mode: "manual", local: conflict.local, remote: conflict.remote, value: "合并内容" } };
result = merge.merge(base, local, remote, choices);
assert.equal(result.conflicts.length, 0);
assert.equal(result.value.dateSlots["2026-10-05"][0], "合并内容");
local.dateSlots["2026-10-05"][0] = "处理期间的新修改";
assert.equal(merge.merge(base, local, remote, choices).conflicts.length, 1);
// A deleted record versus an edited record requires a choice, rather than resurrection.
local = clone(base); remote = clone(base);
local.tasks = []; remote.tasks[0].text = "修改论文";
result = merge.merge(base, local, remote);
assert.equal(result.conflicts.length, 1);
conflict = result.conflicts[0];
result = merge.merge(base, local, remote, { [conflict.key]: { mode: "local", local: undefined, remote: conflict.remote } });
assert.deepEqual(result.value.tasks, []);
// Separate fields in the same record and additions by ID are merged.
local = clone(base); remote = clone(base);
local.tasks[0].done = true; remote.tasks[0].text = "新版论文";
local.tasks.push({ id: "b", text: "实验" }); remote.tasks.push({ id: "c", text: "图表" });
remote.tasks.reverse();
result = merge.merge(base, local, remote);
assert.equal(result.conflicts.length, 0);
assert.equal(result.value.tasks.find(x => x.id === "a").done, true);
assert.equal(result.value.tasks.find(x => x.id === "a").text, "新版论文");
assert.equal(result.value.tasks.length, 3);
// Clearing the only old cell and adding another cell in the same date is safe.
result = merge.merge({ dateSlots: { d: ["old", "", "", "", "", ""] } }, { dateSlots: {} }, { dateSlots: { d: ["old", "", "", "new", "", ""] } });
assert.equal(result.conflicts.length, 0);
assert.deepEqual(result.value.dateSlots.d, ["", "", "", "new", "", ""]);
// Object key order does not create false conflicts; input objects remain unchanged.
assert(merge.equal({ a: 1, b: 2 }, { b: 2, a: 1 }));
const before = JSON.stringify(base); merge.merge(base, local, remote); assert.equal(JSON.stringify(base), before);
// Exercise real push/pull orchestration without accessing GitHub or user data.
const source = fs.readFileSync(__dirname + "/app.js", "utf8");
function context() {
  const c = { state: clone(base), githubSync: { sha: "base", dirty: true, autoPush: true }, githubLocalRevision: 1, githubRequestInFlight: false, githubPendingPush: false, githubPendingPull: false, githubMergePending: null, githubMergeChoices: {}, githubRetryAttempt: 0, githubRetryTimer: 0, githubIssue: "", githubIssueKind: "", PlannerSyncMerge: merge,
    normalizeState: clone, isGithubConfigured: () => true, readGithubInputs() {}, updateGithubStatus() {}, showToast() {}, saveGithubSyncConfig() {}, clearGithubIssue() {}, readGithubMergeStorage: () => ({ baseline: clone(base) }), persistGithubMergePending() {}, renderGithubMergeConflicts() {}, openGithubSyncHelp() {}, setGithubBusy(value) { c.githubRequestInFlight = value; }, acceptGithubMergedState(value, remote, sha) { c.state = clone(value); c.githubLocalRevision++; c.githubSync.sha = sha; c.githubSync.dirty = !merge.equal(value, remote); }, storeGithubBaseline(value) { c.savedBaseline = clone(value); }, githubReadContent: async () => ({ sha: "remote", text: JSON.stringify(base) }), githubWriteContent: async () => ({ content: { sha: "uploaded" } }) };
  vm.createContext(c);
  for (const name of ["computeGithubMerge", "prepareGithubMerge", "pushToGithub", "pullFromGithub"]) {
    const start = source.indexOf((name.startsWith("push") || name.startsWith("pull") ? "async " : "") + "function " + name + "(");
    const end = Math.min(...[source.indexOf("\nfunction ", start + 1), source.indexOf("\nasync function ", start + 1)].filter(x => x >= 0));
    vm.runInContext(source.slice(start, end), c);
  }
  c.handleGithubFailure = error => { throw error; };
  return c;
}
(async () => {
  let c = context();
  c.state.dateSlots["2026-10-05"][0] = "local";
  const theirs = clone(base); theirs.dateSlots["2026-10-05"][3] = "remote";
  c.githubReadContent = async () => ({ sha: "remote", text: JSON.stringify(theirs) });
  c.githubWriteContent = async text => { const uploaded = JSON.parse(text); assert.equal(uploaded.dateSlots["2026-10-05"][0], "local"); assert.equal(uploaded.dateSlots["2026-10-05"][3], "remote"); c.state.tasks.push({ id: "during", text: "new edit" }); c.githubLocalRevision++; return { content: { sha: "uploaded" } }; };
  await c.pushToGithub({ auto: true });
  assert(c.githubSync.dirty && c.githubPendingPush);
  assert(!c.savedBaseline.tasks.some(x => x.id === "during"));
  c = context(); c.state.dateSlots["2026-10-05"][0] = "local";
  c.githubReadContent = async () => { c.state.tasks.push({ id: "during", text: "during pull" }); c.githubLocalRevision++; return { sha: "remote", text: JSON.stringify(theirs) }; };
  await c.pullFromGithub({ auto: true });
  assert(c.state.tasks.some(x => x.id === "during"));
  assert.equal(c.state.dateSlots["2026-10-05"][3], "remote");
  c = context(); c.readGithubMergeStorage = () => ({});
  c.state.tasks.push({ id: "first", text: "new local data" });
  await c.pushToGithub({ auto: true }); assert(c.githubMergePending);
  assert.equal(c.computeGithubMerge(c.githubMergePending).conflicts[0].path.length, 0);
  console.log("PASS: field merge, new dates, conflicts, stale choices, deletion, ID records, concurrent push/pull, missing baseline");
})().catch(error => { console.error(error); process.exitCode = 1; });
