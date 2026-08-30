const STORAGE_KEY = "daily-program.weekly-planner.v1";
const SYNC_CONFIG_KEY = "daily-program.github-sync.v1";
const ACTIVE_PAGE_KEY = "daily-program.active-page.v1";
const GITHUB_API_ROOT = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const PERIOD_MIN_DAYS = 15;
const PERIOD_MAX_DAYS = 180;
const PERIOD_DEFAULT_DAYS = 35;
const PLAN_DEFAULT_DAYS = 7;
const NOTE_IMAGE_MAX_FILE_BYTES = 10 * 1024 * 1024;
const NOTE_IMAGE_MAX_DATA_URL_LENGTH = 1_500_000;
const NOTE_IMAGE_MAX_EDGE = 1400;

const dayNames = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const slotLabels = ["早", "中", "晚"];
const priorityLabels = {
  high: "重要",
  normal: "普通",
  low: "稍后",
};

const chinaHolidays = [
  { id: "2026-new-year", name: "元旦", start: "2026-01-01", end: "2026-01-03" },
  { id: "2026-spring-festival", name: "春节", start: "2026-02-15", end: "2026-02-23" },
  { id: "2026-qingming", name: "清明节", start: "2026-04-04", end: "2026-04-06" },
  { id: "2026-labor-day", name: "劳动节", start: "2026-05-01", end: "2026-05-05" },
  { id: "2026-dragon-boat", name: "端午节", start: "2026-06-19", end: "2026-06-21" },
  { id: "2026-mid-autumn", name: "中秋节", start: "2026-09-25", end: "2026-09-27" },
  { id: "2026-national-day", name: "国庆节", start: "2026-10-01", end: "2026-10-07" },
];

const defaultGithubSyncConfig = {
  owner: "qiutao20",
  repo: "private_data",
  branch: "main",
  path: "weekly-planner-data.json",
  token: "",
  autoPull: true,
  autoPush: false,
  sha: "",
  lastSyncedAt: "",
  dirty: false,
};

let state = loadState();
let githubSync = loadGithubSyncConfig();
let activePlanRange = normalizePlanRange(state.activePlanRange);
let activeView = "all";
let activePage = getInitialActivePage();
let activeNoteId = state.notes[0]?.id || "";
let dialogPlanType = "plan";
let dialogPlanKey = "";
let ideaDialogPlanType = "plan";
let ideaDialogPlanKey = "";
let toastTimer = 0;
let githubWriteTimer = 0;
let githubRequestInFlight = false;

const els = {
  weekRange: document.querySelector("#weekRange"),
  activeDateLabel: document.querySelector("#activeDateLabel"),
  prevWeek: document.querySelector("#prevWeek"),
  currentWeek: document.querySelector("#currentWeek"),
  nextWeek: document.querySelector("#nextWeek"),
  planRangeForm: document.querySelector("#planRangeForm"),
  planStart: document.querySelector("#planStart"),
  planEnd: document.querySelector("#planEnd"),
  clearWeek: document.querySelector("#clearWeek"),
  focusPanel: document.querySelector("#focusPanel"),
  weeklyFocus: document.querySelector("#weeklyFocus"),
  weeklyReview: document.querySelector("#weeklyReview"),
  doneCount: document.querySelector("#doneCount"),
  doneLabel: document.querySelector("#doneLabel"),
  openCount: document.querySelector("#openCount"),
  openLabel: document.querySelector("#openLabel"),
  ideaCount: document.querySelector("#ideaCount"),
  ideaLabel: document.querySelector("#ideaLabel"),
  quickPanel: document.querySelector("#quickPanel"),
  ideaForm: document.querySelector("#ideaForm"),
  ideaInput: document.querySelector("#ideaInput"),
  ideaDeadline: document.querySelector("#ideaDeadline"),
  taskForm: document.querySelector("#taskForm"),
  taskInput: document.querySelector("#taskInput"),
  taskDeadline: document.querySelector("#taskDeadline"),
  taskPriority: document.querySelector("#taskPriority"),
  dayGrid: document.querySelector("#dayGrid"),
  ideaList: document.querySelector("#ideaList"),
  clearDoneIdeas: document.querySelector("#clearDoneIdeas"),
  allView: document.querySelector("#allView"),
  openView: document.querySelector("#openView"),
  plannerPageBtn: document.querySelector("#plannerPageBtn"),
  holidayPageBtn: document.querySelector("#holidayPageBtn"),
  periodPageBtn: document.querySelector("#periodPageBtn"),
  inboxPageBtn: document.querySelector("#inboxPageBtn"),
  notesPageBtn: document.querySelector("#notesPageBtn"),
  syncPageBtn: document.querySelector("#syncPageBtn"),
  plannerView: document.querySelector("#plannerView"),
  holidayView: document.querySelector("#holidayView"),
  periodView: document.querySelector("#periodView"),
  inboxView: document.querySelector("#inboxView"),
  notesView: document.querySelector("#notesView"),
  syncView: document.querySelector("#syncView"),
  holidayNameLabel: document.querySelector("#holidayNameLabel"),
  holidayDateLabel: document.querySelector("#holidayDateLabel"),
  holidayDayGrid: document.querySelector("#holidayDayGrid"),
  holidayIdeaList: document.querySelector("#holidayIdeaList"),
  holidayClearDoneIdeas: document.querySelector("#holidayClearDoneIdeas"),
  holidayAllView: document.querySelector("#holidayAllView"),
  holidayOpenView: document.querySelector("#holidayOpenView"),
  holidayReview: document.querySelector("#holidayReview"),
  quickAddTask: document.querySelector("#quickAddTask"),
  exportData: document.querySelector("#exportData"),
  saveData: document.querySelector("#saveData"),
  taskDialog: document.querySelector("#taskDialog"),
  dialogForm: document.querySelector("#dialogForm"),
  dialogTaskId: document.querySelector("#dialogTaskId"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogDeadline: document.querySelector("#dialogDeadline"),
  dialogPriority: document.querySelector("#dialogPriority"),
  dialogNotes: document.querySelector("#dialogNotes"),
  deleteTask: document.querySelector("#deleteTask"),
  closeDialog: document.querySelector("#closeDialog"),
  ideaDialog: document.querySelector("#ideaDialog"),
  ideaDialogForm: document.querySelector("#ideaDialogForm"),
  dialogIdeaId: document.querySelector("#dialogIdeaId"),
  dialogIdeaText: document.querySelector("#dialogIdeaText"),
  dialogIdeaDeadline: document.querySelector("#dialogIdeaDeadline"),
  deleteDialogIdea: document.querySelector("#deleteDialogIdea"),
  closeIdeaDialog: document.querySelector("#closeIdeaDialog"),
  githubSaveConfigBtn: document.querySelector("#githubSaveConfigBtn"),
  githubPullBtn: document.querySelector("#githubPullBtn"),
  githubPushBtn: document.querySelector("#githubPushBtn"),
  githubClearBtn: document.querySelector("#githubClearBtn"),
  githubOwner: document.querySelector("#githubOwner"),
  githubRepo: document.querySelector("#githubRepo"),
  githubBranch: document.querySelector("#githubBranch"),
  githubPath: document.querySelector("#githubPath"),
  githubToken: document.querySelector("#githubToken"),
  githubAutoPull: document.querySelector("#githubAutoPull"),
  githubAutoPush: document.querySelector("#githubAutoPush"),
  githubStatus: document.querySelector("#githubStatus"),
  holidayConfigForm: document.querySelector("#holidayConfigForm"),
  customHolidayName: document.querySelector("#customHolidayName"),
  customHolidayStart: document.querySelector("#customHolidayStart"),
  customHolidayEnd: document.querySelector("#customHolidayEnd"),
  clearHolidayConfigBtn: document.querySelector("#clearHolidayConfigBtn"),
  holidayConfigStatus: document.querySelector("#holidayConfigStatus"),
  periodConfigForm: document.querySelector("#periodConfigForm"),
  periodTitle: document.querySelector("#periodTitle"),
  periodStart: document.querySelector("#periodStart"),
  periodEnd: document.querySelector("#periodEnd"),
  periodClearBtn: document.querySelector("#periodClearBtn"),
  periodConfigStatus: document.querySelector("#periodConfigStatus"),
  periodRangeMeta: document.querySelector("#periodRangeMeta"),
  periodDateLabel: document.querySelector("#periodDateLabel"),
  periodGrid: document.querySelector("#periodGrid"),
  aggregateSummary: document.querySelector("#aggregateSummary"),
  aggregateOpenCount: document.querySelector("#aggregateOpenCount"),
  aggregateDoneCount: document.querySelector("#aggregateDoneCount"),
  aggregateOpenList: document.querySelector("#aggregateOpenList"),
  aggregateDoneList: document.querySelector("#aggregateDoneList"),
  newNoteBtn: document.querySelector("#newNoteBtn"),
  emptyNewNoteBtn: document.querySelector("#emptyNewNoteBtn"),
  notesList: document.querySelector("#notesList"),
  noteEmpty: document.querySelector("#noteEmpty"),
  noteEditorPane: document.querySelector("#noteEditorPane"),
  noteTitleInput: document.querySelector("#noteTitleInput"),
  noteEditor: document.querySelector("#noteEditor"),
  noteEditorMeta: document.querySelector("#noteEditorMeta"),
  addNoteImageBtn: document.querySelector("#addNoteImageBtn"),
  noteImageInput: document.querySelector("#noteImageInput"),
  deleteNoteBtn: document.querySelector("#deleteNoteBtn"),
  toast: document.querySelector("#toast"),
};

initialize();

function initialize() {
  configureMobileQuickPanel();
  bindEvents();
  populateGithubInputs();
  updateGithubStatus();
  activatePage(activePage);
  render();
  if (isGithubConfigured() && githubSync.autoPull) {
    pullFromGithub({ auto: true, askBeforeReplace: false });
  }
}

function bindEvents() {
  els.prevWeek.addEventListener("click", () => movePlanRange(-1));
  els.nextWeek.addEventListener("click", () => movePlanRange(1));
  els.currentWeek.addEventListener("click", () => {
    setActivePlanRange(getDefaultPlanRange());
    render();
  });
  els.planRangeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    savePlanRange();
  });

  els.weeklyFocus.addEventListener("input", () => {
    getActivePlan().focus = els.weeklyFocus.value;
    saveState();
  });

  els.weeklyReview.addEventListener("input", () => {
    getActivePlan().review = els.weeklyReview.value;
    saveState();
  });

  els.holidayReview.addEventListener("input", () => {
    getActiveHolidayPlan().review = els.holidayReview.value;
    saveState();
  });

  els.ideaForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = els.ideaInput.value.trim();
    if (!text) return;
    const type = getQuickEntryType();
    const now = new Date().toISOString();
    getIdeasByType(type).unshift({
      id: createId(),
      text,
      deadline: getInputDeadline(els.ideaDeadline),
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
    els.ideaInput.value = "";
    saveAndRender(type === "holiday" ? "假期想法已记录" : "想法已记录");
  });

  els.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = els.taskInput.value.trim();
    if (!title) return;
    const type = getQuickEntryType();
    addTask({
      title,
      deadline: getInputDeadline(els.taskDeadline),
      priority: els.taskPriority.value,
    }, type);
    els.taskInput.value = "";
    saveAndRender(type === "holiday" ? "假期计划已添加" : "计划已添加");
  });

  [els.ideaDeadline, els.taskDeadline].forEach((input) => {
    input.addEventListener("change", () => {
      input.dataset.touched = "true";
    });
  });

  els.dayGrid.addEventListener("click", (event) => {
    const checkButton = event.target.closest("[data-toggle-task]");
    const editButton = event.target.closest("[data-edit-task]");

    if (checkButton) {
      toggleTask(checkButton.dataset.toggleTask);
      return;
    }

    if (editButton) {
      openTaskDialog(editButton.dataset.editTask, "plan");
    }
  });

  els.dayGrid.addEventListener("input", (event) => {
    const periodInline = event.target.closest("[data-period-inline]");
    if (periodInline) {
      updatePeriodDayNote(periodInline.dataset.periodInline, periodInline.value);
      return;
    }

    const slot = event.target.closest("[data-day-slot]");
    if (!slot) return;
    updateDaySlot(slot.dataset.dateKey, Number(slot.dataset.slotIndex), slot.value, "plan", Number(slot.dataset.daySlot));
  });

  els.holidayDayGrid.addEventListener("click", (event) => {
    const checkButton = event.target.closest("[data-toggle-task]");
    const editButton = event.target.closest("[data-edit-task]");

    if (checkButton) {
      toggleTask(checkButton.dataset.toggleTask, "holiday");
      return;
    }

    if (editButton) {
      openTaskDialog(editButton.dataset.editTask, "holiday");
    }
  });

  els.holidayDayGrid.addEventListener("input", (event) => {
    const periodInline = event.target.closest("[data-period-inline]");
    if (periodInline) {
      updatePeriodDayNote(periodInline.dataset.periodInline, periodInline.value);
      return;
    }

    const slot = event.target.closest("[data-day-slot]");
    if (!slot) return;
    updateDaySlot(slot.dataset.dateKey, Number(slot.dataset.slotIndex), slot.value, "holiday", Number(slot.dataset.daySlot));
  });

  els.periodGrid.addEventListener("input", (event) => {
    const note = event.target.closest("[data-period-day]");
    if (!note) return;
    updatePeriodDayNote(note.dataset.periodDay, note.value, note.closest(".period-day-cell"));
  });

  els.ideaList.addEventListener("click", (event) => {
    const archiveButton = event.target.closest("[data-toggle-idea]");
    const editButton = event.target.closest("[data-edit-idea]");
    const deleteButton = event.target.closest("[data-delete-idea]");

    if (archiveButton) {
      toggleIdea(archiveButton.dataset.toggleIdea);
      return;
    }

    if (editButton) {
      openIdeaDialog(editButton.dataset.editIdea, "plan");
      return;
    }

    if (deleteButton) {
      deleteIdea(deleteButton.dataset.deleteIdea);
    }
  });

  els.clearDoneIdeas.addEventListener("click", () => {
    const ideas = getIdeasByType("plan");
    const before = ideas.length;
    state.ideas = ideas.filter((idea) => !idea.archived);
    if (state.ideas.length === before) {
      showToast("没有已整理的想法");
      return;
    }
    saveAndRender("已清除整理过的想法");
  });

  els.holidayIdeaList.addEventListener("click", (event) => {
    const archiveButton = event.target.closest("[data-toggle-idea]");
    const editButton = event.target.closest("[data-edit-idea]");
    const deleteButton = event.target.closest("[data-delete-idea]");

    if (archiveButton) {
      toggleIdea(archiveButton.dataset.toggleIdea, "holiday");
      return;
    }

    if (editButton) {
      openIdeaDialog(editButton.dataset.editIdea, "holiday");
      return;
    }

    if (deleteButton) {
      deleteIdea(deleteButton.dataset.deleteIdea, "holiday");
    }
  });

  els.holidayClearDoneIdeas.addEventListener("click", () => {
    const plan = getActiveHolidayPlan();
    const before = plan.ideas.length;
    plan.ideas = plan.ideas.filter((idea) => !idea.archived);
    if (plan.ideas.length === before) {
      showToast("没有已整理的假期想法");
      return;
    }
    saveAndRender("已清除整理过的假期想法");
  });

  els.clearWeek.addEventListener("click", () => {
    const key = planRangeKey(activePlanRange);
    const ok = window.confirm("清空当前周期的焦点、每日格子和复盘？想法和计划不会被删除。");
    if (!ok) return;
    state.plans[key] = createRegularPlan(getActivePlanDates().length);
    saveAndRender("当前周期已清空");
  });

  els.allView.addEventListener("click", () => setView("all"));
  els.openView.addEventListener("click", () => setView("open"));
  els.plannerPageBtn.addEventListener("click", () => activatePage("planner"));
  els.holidayPageBtn.addEventListener("click", () => activatePage("holiday"));
  els.periodPageBtn.addEventListener("click", () => activatePage("period"));
  els.inboxPageBtn.addEventListener("click", () => activatePage("inbox"));
  els.notesPageBtn.addEventListener("click", () => activatePage("notes"));
  els.syncPageBtn.addEventListener("click", () => activatePage("sync"));
  els.holidayAllView.addEventListener("click", () => setView("all"));
  els.holidayOpenView.addEventListener("click", () => setView("open"));

  [els.aggregateOpenList, els.aggregateDoneList].forEach((list) => {
    list.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-aggregate-toggle]");
      const edit = event.target.closest("[data-aggregate-edit]");
      const remove = event.target.closest("[data-aggregate-delete]");
      if (toggle) {
        toggleAggregateItem(toggle);
        return;
      }
      if (edit) {
        editAggregateItem(edit);
        return;
      }
      if (remove) deleteAggregateItem(remove);
    });
  });

  els.newNoteBtn.addEventListener("click", createNote);
  els.emptyNewNoteBtn.addEventListener("click", createNote);
  els.notesList.addEventListener("click", (event) => {
    const item = event.target.closest("[data-note-id]");
    if (!item) return;
    activeNoteId = item.dataset.noteId;
    renderNotes();
  });
  els.noteTitleInput.addEventListener("input", updateActiveNoteTitle);
  els.noteEditor.addEventListener("input", updateActiveNoteContent);
  els.addNoteImageBtn.addEventListener("click", () => els.noteImageInput.click());
  els.noteImageInput.addEventListener("change", async () => {
    await addImagesToActiveNote([...els.noteImageInput.files]);
    els.noteImageInput.value = "";
  });
  els.noteEditor.addEventListener("paste", handleNotePaste);
  els.noteEditor.addEventListener("dragover", (event) => {
    if ([...event.dataTransfer.items].some((item) => item.kind === "file" && item.type.startsWith("image/"))) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  });
  els.noteEditor.addEventListener("drop", async (event) => {
    const images = [...event.dataTransfer.files].filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) return;
    event.preventDefault();
    await addImagesToActiveNote(images);
  });
  els.deleteNoteBtn.addEventListener("click", deleteActiveNote);

  els.quickAddTask.addEventListener("click", () => {
    if (activePage === "period") {
      focusFirstPeriodCell();
      return;
    }
    if (activePage === "sync") activatePage("planner");
    els.taskInput.focus();
  });

  els.exportData.addEventListener("click", () => {
    if (activePage === "notes") {
      exportNote();
      return;
    }
    if (activePage === "inbox") {
      exportAggregate();
      return;
    }
    if (activePage === "period") {
      exportPeriod();
      return;
    }
    if (activePage === "holiday") {
      exportHoliday();
      return;
    }
    exportWeek();
  });

  els.saveData.addEventListener("click", () => pushToGithub());

  [
    els.githubOwner,
    els.githubRepo,
    els.githubBranch,
    els.githubPath,
    els.githubToken,
    els.githubAutoPull,
    els.githubAutoPush,
  ].forEach((control) => {
    control.addEventListener("change", () => {
      readGithubInputs();
      if (githubSync.dirty) scheduleGithubAutoPush();
    });
  });

  els.githubSaveConfigBtn.addEventListener("click", () => {
    readGithubInputs();
    showToast("GitHub 同步配置已保存");
    if (isGithubConfigured() && githubSync.autoPull) {
      pullFromGithub({ askBeforeReplace: true });
    }
  });

  els.githubPullBtn.addEventListener("click", () => pullFromGithub());
  els.githubPushBtn.addEventListener("click", () => pushToGithub());
  els.githubClearBtn.addEventListener("click", () => {
    const confirmed = window.confirm("确认清除本浏览器保存的 GitHub 配置和 token？计划数据不会被删除。");
    if (!confirmed) return;
    window.clearTimeout(githubWriteTimer);
    githubSync = { ...defaultGithubSyncConfig };
    localStorage.removeItem(SYNC_CONFIG_KEY);
    populateGithubInputs();
    updateGithubStatus("已清除 GitHub 同步配置。");
  });

  els.holidayConfigForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCustomHoliday();
  });

  els.clearHolidayConfigBtn.addEventListener("click", () => {
    if (!state.customHoliday) {
      showToast("当前没有自定义假期");
      return;
    }
    state.customHoliday = null;
    saveAndRender("已恢复内置假期");
  });

  els.periodConfigForm.addEventListener("submit", (event) => {
    event.preventDefault();
    savePeriodConfig();
  });

  els.periodTitle.addEventListener("input", () => {
    const plan = getPeriodPlan();
    plan.title = els.periodTitle.value.trim() || "阶段规划";
    saveState();
    renderPeriodSummary(plan);
    updateActiveDateLabel(getActivePlanDates(), getDisplayHoliday(), getHolidayDates(getDisplayHoliday()));
  });

  els.periodClearBtn.addEventListener("click", () => {
    const plan = getPeriodPlan();
    const dates = getPeriodDates(plan);
    const filledCount = dates.filter((date) => (plan.dayNotes[dateKey(date)] || "").trim()).length;
    if (filledCount === 0) {
      showToast("当前周期没有已填写格子");
      return;
    }
    const ok = window.confirm("清空当前周期范围内所有格子？范围以外的记录会保留。");
    if (!ok) return;
    dates.forEach((date) => delete plan.dayNotes[dateKey(date)]);
    saveAndRender("当前周期格子已清空");
  });

  els.dialogForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveDialogTask();
  });

  els.deleteTask.addEventListener("click", () => {
    deleteTaskFromDialog();
  });

  els.closeDialog.addEventListener("click", closeDialog);

  els.taskDialog.addEventListener("click", (event) => {
    if (event.target === els.taskDialog) closeDialog();
  });

  els.ideaDialogForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveDialogIdea();
  });
  els.deleteDialogIdea.addEventListener("click", deleteIdeaFromDialog);
  els.closeIdeaDialog.addEventListener("click", closeIdeaDialog);
  els.ideaDialog.addEventListener("click", (event) => {
    if (event.target === els.ideaDialog) closeIdeaDialog();
  });
}

function render() {
  const plan = getActivePlan();
  const dates = getActivePlanDates();
  const entryPlan = getGlobalEntryPlan();
  const holiday = getDisplayHoliday();
  const holidayDates = getHolidayDates(holiday);
  const holidayPlan = getActiveHolidayPlan(holiday);
  const periodPlan = getPeriodPlan();

  els.weekRange.textContent = `${formatMonthDay(dates[0])} - ${formatMonthDay(dates[dates.length - 1])}`;
  renderPlanRangeControls();

  renderQuickEntryControls(dates, holidayDates);

  els.weeklyFocus.value = plan.focus;
  els.weeklyReview.value = plan.review;

  renderTasks(plan, dates, els.dayGrid, entryPlan);
  renderIdeas(entryPlan, els.ideaList);
  renderHoliday(holiday, holidayPlan, holidayDates);
  renderPeriod(periodPlan);
  renderAggregate();
  renderNotes();
  renderStats(activePage === "holiday" ? holidayPlan : activePage === "period" ? periodPlan : entryPlan);
  renderViewSwitch();
  renderHolidayConfig();
  updateActiveDateLabel(dates, holiday, holidayDates);
}

function renderPlanRangeControls() {
  els.planStart.value = activePlanRange.start;
  els.planEnd.value = activePlanRange.end;
}

function configureMobileQuickPanel() {
  if ((!els.quickPanel && !els.focusPanel) || !window.matchMedia) return;
  const mobilePanels = [els.focusPanel, els.quickPanel].filter(Boolean);
  const mobileQuery = window.matchMedia("(max-width: 860px)");
  const applyQuickPanelState = () => {
    if (mobileQuery.matches) {
      mobilePanels.forEach((panel) => panel.removeAttribute("open"));
      return;
    }
    mobilePanels.forEach((panel) => panel.setAttribute("open", ""));
  };

  applyQuickPanelState();
  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", applyQuickPanelState);
  } else {
    mobileQuery.addListener(applyQuickPanelState);
  }
}

function renderHoliday(holiday, plan, dates) {
  els.holidayNameLabel.textContent = holiday.name;
  els.holidayDateLabel.textContent = `${formatFullDate(dates[0])} 至 ${formatFullDate(dates[dates.length - 1])}`;
  els.holidayReview.value = plan.review;

  renderTasks(plan, dates, els.holidayDayGrid, plan, 7);
  renderIdeas(plan, els.holidayIdeaList);
}

function renderPeriod(plan) {
  const dates = getPeriodDates(plan);
  renderPeriodControls(plan);
  renderPeriodSummary(plan, dates);
  renderPeriodGrid(plan, dates);
}

function renderPeriodControls(plan) {
  els.periodTitle.value = plan.title;
  els.periodStart.value = plan.start;
  els.periodEnd.value = plan.end;
}

function renderPeriodSummary(plan, dates = getPeriodDates(plan)) {
  const weekCount = getPeriodWeekStarts(dates).length;
  els.periodRangeMeta.textContent = `${dates.length} 天 · ${weekCount} 行`;
  els.periodDateLabel.textContent = `${formatFullDate(dates[0])} 至 ${formatFullDate(dates[dates.length - 1])}`;
  els.periodConfigStatus.textContent = `当前范围：${dates.length} 天，按自然周分成 ${weekCount} 行。每个格子适合写一句短计划。`;
}

function renderPeriodGrid(plan, dates) {
  els.periodGrid.replaceChildren();
  const startKey = plan.start;
  const endKey = plan.end;
  const weekStarts = getPeriodWeekStarts(dates);

  weekStarts.forEach((weekStart, weekIndex) => {
    const row = document.createElement("div");
    row.className = "period-week-row";

    row.append(createPeriodWeekLabel(weekStart, weekIndex, startKey, endKey));

    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      const date = addDays(weekStart, dayOffset);
      const key = dateKey(date);
      if (key < startKey || key > endKey) {
        row.append(createPeriodBlankCell());
      } else {
        row.append(createPeriodDayCell(plan, date, key));
      }
    }

    els.periodGrid.append(row);
  });
}

function createPeriodWeekLabel(weekStart, weekIndex, startKey, endKey) {
  const label = document.createElement("div");
  label.className = "period-week-label";

  const title = document.createElement("span");
  title.textContent = `第 ${weekIndex + 1} 周`;

  const weekEnd = addDays(weekStart, 6);
  const visibleStart = dateFromKey(dateKey(weekStart) < startKey ? startKey : dateKey(weekStart));
  const visibleEnd = dateFromKey(dateKey(weekEnd) > endKey ? endKey : dateKey(weekEnd));
  const range = document.createElement("small");
  range.textContent = `${formatMonthDay(visibleStart)} - ${formatMonthDay(visibleEnd)}`;

  label.append(title, range);
  return label;
}

function createPeriodBlankCell() {
  const cell = document.createElement("div");
  cell.className = "period-day-cell period-day-cell-blank";
  cell.setAttribute("aria-hidden", "true");
  return cell;
}

function createPeriodDayCell(plan, date, key) {
  const cell = document.createElement("article");
  cell.className = "period-day-cell";
  if (isTodayInBeijing(date)) cell.classList.add("today");
  if ((plan.dayNotes[key] || "").trim()) cell.classList.add("filled");

  const head = document.createElement("header");
  head.className = "period-day-head";

  const dateLabel = document.createElement("span");
  dateLabel.textContent = formatMonthDay(date);

  const weekday = document.createElement("small");
  weekday.textContent = formatWeekday(date);

  head.append(dateLabel, weekday);

  const note = document.createElement("textarea");
  note.className = "period-day-note";
  note.rows = 3;
  note.maxLength = 100;
  note.placeholder = "短计划";
  note.setAttribute("aria-label", `${formatFullDate(date)}宏观计划`);
  note.dataset.periodDay = key;
  note.value = plan.dayNotes[key] || "";

  cell.append(head, note);
  return cell;
}

function renderQuickEntryControls(weekDates, holidayDates) {
  const type = getQuickEntryType();
  const defaultDeadline = type === "holiday" ? dateKey(holidayDates[holidayDates.length - 1]) : getBeijingDateKey();
  syncDefaultDeadline(els.ideaDeadline, defaultDeadline);
  syncDefaultDeadline(els.taskDeadline, defaultDeadline);
  els.taskInput.placeholder = type === "holiday" ? "写下假期要推进的一件事" : "写下要推进的一件事";
}

function renderTasks(plan, dates, grid, inboxPlan = plan, daysPerRow = 5) {
  grid.replaceChildren();

  for (let rowStart = 0; rowStart < dates.length; rowStart += daysPerRow) {
    const rowDates = dates.slice(rowStart, rowStart + daysPerRow);
    const weekRow = createWeekRow();
    rowDates.forEach((date, offset) => {
      weekRow.cells.append(createDayColumn(plan, date, rowStart + offset));
    });
    if (rowStart + rowDates.length >= dates.length && rowDates.length < daysPerRow) {
      weekRow.cells.append(createPlanInbox(inboxPlan, dates, daysPerRow - rowDates.length));
    }
    grid.append(weekRow.row);
  }

  if (dates.length % daysPerRow === 0) {
    const inboxRow = createWeekRow();
    inboxRow.cells.append(createPlanInbox(inboxPlan, dates, daysPerRow));
    grid.append(inboxRow.row);
  }
}

function createWeekRow() {
  const row = document.createElement("div");
  row.className = "week-row";

  const cells = document.createElement("div");
  cells.className = "week-row-cells";

  row.append(createTimeMarker(), cells);
  return { row, cells };
}

function createTimeMarker() {
  const marker = document.createElement("div");
  marker.className = "time-marker";
  marker.setAttribute("aria-hidden", "true");

  const head = document.createElement("div");
  head.className = "time-marker-head";

  const body = document.createElement("div");
  body.className = "time-marker-body";
  slotLabels.forEach((slotLabel) => {
    const label = document.createElement("span");
    label.className = "time-marker-label";
    label.textContent = slotLabel;
    body.append(label);
  });

  marker.append(head, body);
  return marker;
}

function createDayColumn(plan, date, dayIndex) {
  const column = document.createElement("article");
  column.className = "day-column";
  if (isTodayInBeijing(date)) column.classList.add("today");
  const key = dateKey(date);

  const head = document.createElement("header");
  head.className = "day-head";

  const titleWrap = document.createElement("div");
  titleWrap.className = "day-title";
  const name = document.createElement("span");
  name.className = "day-name";
  name.textContent = formatWeekday(date);
  const dayDate = document.createElement("span");
  dayDate.className = "day-date";
  dayDate.textContent = formatMonthDay(date);
  titleWrap.append(name, dayDate);

  const periodNote = document.createElement("input");
  periodNote.className = "day-period-note";
  periodNote.type = "text";
  periodNote.maxLength = 20;
  periodNote.placeholder = "宏观";
  periodNote.value = getPeriodDayNote(key);
  periodNote.dataset.periodInline = key;
  periodNote.setAttribute("aria-label", `${formatFullDate(date)}宏观计划`);

  head.append(titleWrap, periodNote);

  const slotList = document.createElement("div");
  slotList.className = "day-slot-list";
  getDateSlotValues(date, plan, dayIndex).forEach((value, slotIndex) => {
    const slotRow = document.createElement("label");
    slotRow.className = "day-slot-row";
    slotRow.dataset.slotLabel = slotLabels[slotIndex];

    const slot = document.createElement("textarea");
    slot.className = "day-slot";
    slot.rows = 3;
    slot.maxLength = 180;
    slot.setAttribute("aria-label", `${formatWeekday(date)}${slotLabels[slotIndex]}`);
    slot.value = value;
    slot.dataset.daySlot = String(dayIndex);
    slot.dataset.dateKey = key;
    slot.dataset.slotIndex = String(slotIndex);

    slotRow.append(slot);
    slotList.append(slotRow);
  });

  column.append(head, slotList);
  return column;
}

function createPlanInbox(plan, dates, span = 3) {
  const inbox = document.createElement("article");
  inbox.className = "plan-inbox";
  if (span <= 2) inbox.classList.add("compact-inbox");
  inbox.style.gridColumn = `span ${span}`;

  const head = document.createElement("header");
  head.className = "day-head inbox-head";
  const titleWrap = document.createElement("div");
  const title = document.createElement("span");
  title.className = "day-name";
  title.textContent = "计划收纳";
  const subtitle = document.createElement("span");
  subtitle.className = "day-date";
  subtitle.textContent = "按截止时间排序";
  titleWrap.append(title, subtitle);
  head.append(titleWrap);

  const taskList = document.createElement("div");
  taskList.className = "task-list inbox-task-list";

  const tasks = plan.tasks
    .filter((task) => activeView === "all" || !task.done)
    .sort(compareTasks);

  if (tasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = activeView === "all" ? "添加计划后会收纳在这里" : "没有未完成计划";
    taskList.append(empty);
  } else {
    tasks.forEach((task) => taskList.append(createTaskCard(task, dates)));
  }

  inbox.append(head, taskList);
  return inbox;
}

function createTaskCard(task, dates) {
  const card = document.createElement("article");
  card.className = `task-card priority-${task.priority}`;
  if (task.done) card.classList.add("done");

  const check = document.createElement("button");
  check.className = "check-button";
  check.type = "button";
  check.setAttribute("aria-label", task.done ? "标记为未完成" : "标记为完成");
  check.title = task.done ? "标记为未完成" : "标记为完成";
  check.dataset.toggleTask = task.id;
  check.innerHTML = checkIcon();

  const body = document.createElement("div");
  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("div");
  meta.className = "task-meta";
  const day = document.createElement("span");
  day.className = "pill day-label";
  day.textContent = formatTaskTiming(task, dates);
  meta.append(day);

  const priority = document.createElement("span");
  priority.className = `pill ${task.priority}`;
  priority.textContent = priorityLabels[task.priority] || priorityLabels.normal;
  meta.append(priority);

  if (task.notes.trim()) {
    const note = document.createElement("span");
    note.className = "pill";
    note.textContent = "有备注";
    meta.append(note);
  }

  body.append(title, meta);

  const edit = iconButton("edit-task", "编辑计划", pencilIcon());
  edit.dataset.editTask = task.id;

  card.append(check, body, edit);
  return card;
}

function renderIdeas(plan, list) {
  list.replaceChildren();

  if (plan.ideas.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "先记录一个念头";
    list.append(empty);
    return;
  }

  plan.ideas.forEach((idea) => {
    const item = document.createElement("article");
    item.className = "idea-item";
    if (idea.archived) item.classList.add("archived");

    const toggle = document.createElement("button");
    toggle.className = "check-button";
    toggle.type = "button";
    toggle.setAttribute("aria-label", idea.archived ? "恢复想法" : "标记为已整理");
    toggle.title = idea.archived ? "恢复想法" : "标记为已整理";
    toggle.dataset.toggleIdea = idea.id;
    toggle.innerHTML = checkIcon();

    const body = document.createElement("div");
    const text = document.createElement("p");
    text.className = "idea-text";
    text.textContent = idea.text;
    const time = document.createElement("span");
    time.className = "idea-time";
    const wasEdited = idea.updatedAt && idea.updatedAt !== idea.createdAt;
    time.textContent = `${formatDeadlineLabel(idea.deadline)} · ${wasEdited ? "更新" : "记录"} ${formatShortTime(wasEdited ? idea.updatedAt : idea.createdAt)}`;
    body.append(text, time);

    const actions = document.createElement("div");
    actions.className = "idea-actions";
    const edit = iconButton("edit-idea", "编辑想法", pencilIcon());
    edit.dataset.editIdea = idea.id;
    const del = iconButton("delete-idea", "删除想法", trashIcon());
    del.dataset.deleteIdea = idea.id;
    actions.append(edit, del);

    item.append(toggle, body, actions);
    list.append(item);
  });
}

function renderAggregate() {
  const items = collectAggregateItems();
  const openItems = items.filter((item) => !item.done);
  const doneItems = items.filter((item) => item.done);

  els.aggregateSummary.textContent = `待处理 ${openItems.length} · 已收纳 ${doneItems.length}`;
  els.aggregateOpenCount.textContent = String(openItems.length);
  els.aggregateDoneCount.textContent = String(doneItems.length);
  renderAggregateList(openItems, els.aggregateOpenList, "没有待处理的想法和计划");
  renderAggregateList(doneItems, els.aggregateDoneList, "完成后会收纳在这里");
}

function renderNotes() {
  if (!state.notes.some((note) => note.id === activeNoteId)) {
    activeNoteId = state.notes[0]?.id || "";
  }
  renderNotesList();

  const note = getActiveNote();
  const hasNote = Boolean(note);
  els.noteEmpty.hidden = hasNote;
  els.noteEditorPane.hidden = !hasNote;
  if (!note) return;

  els.noteTitleInput.value = note.title;
  els.noteEditor.innerHTML = note.content;
  updateNoteEditorMeta(note);
}

function renderNotesList() {
  els.notesList.replaceChildren();
  if (state.notes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state notes-list-empty";
    empty.textContent = "新建笔记后，标题会显示在这里";
    els.notesList.append(empty);
    return;
  }

  state.notes.forEach((note) => {
    const item = document.createElement("button");
    item.className = "notes-list-item";
    item.type = "button";
    item.dataset.noteId = note.id;
    item.classList.toggle("active", note.id === activeNoteId);
    item.setAttribute("aria-pressed", String(note.id === activeNoteId));

    const title = document.createElement("span");
    title.textContent = note.title.trim() || "无标题笔记";
    const time = document.createElement("small");
    time.textContent = `更新于 ${formatShortTime(note.updatedAt)}`;
    item.append(title, time);
    els.notesList.append(item);
  });
}

function createNote() {
  const now = new Date().toISOString();
  const note = {
    id: createId(),
    title: "新笔记",
    content: "",
    createdAt: now,
    updatedAt: now,
  };
  state.notes.unshift(note);
  activeNoteId = note.id;
  saveState();
  renderNotes();
  els.noteTitleInput.focus();
  els.noteTitleInput.select();
  showToast("已新建笔记");
}

function getActiveNote() {
  return state.notes.find((note) => note.id === activeNoteId) || null;
}

function updateActiveNoteTitle() {
  const note = getActiveNote();
  if (!note) return;
  note.title = els.noteTitleInput.value.slice(0, 80);
  note.updatedAt = new Date().toISOString();
  saveState();
  renderNotesList();
  updateNoteEditorMeta(getActiveNote());
}

function updateActiveNoteContent() {
  const note = getActiveNote();
  if (!note) return;
  note.content = sanitizeNoteContent(els.noteEditor.innerHTML);
  note.updatedAt = new Date().toISOString();
  saveState();
  renderNotesList();
  updateNoteEditorMeta(getActiveNote());
}

function updateNoteEditorMeta(note) {
  els.noteEditorMeta.textContent = note ? `自动保存 · ${formatShortTime(note.updatedAt)}` : "";
}

function deleteActiveNote() {
  const note = getActiveNote();
  if (!note) return;
  const confirmed = window.confirm(`删除笔记“${note.title.trim() || "无标题笔记"}”？此操作不可恢复。`);
  if (!confirmed) return;
  const index = state.notes.findIndex((item) => item.id === note.id);
  state.notes.splice(index, 1);
  activeNoteId = state.notes[index]?.id || state.notes[index - 1]?.id || "";
  saveState();
  renderNotes();
  showToast("笔记已删除");
}

async function handleNotePaste(event) {
  const images = [...event.clipboardData.items]
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter(Boolean);
  if (images.length > 0) {
    event.preventDefault();
    await addImagesToActiveNote(images);
    return;
  }

  event.preventDefault();
  insertPlainTextAtCursor(event.clipboardData.getData("text/plain"));
  updateActiveNoteContent();
}

function insertPlainTextAtCursor(text) {
  els.noteEditor.focus();
  const selection = window.getSelection();
  let range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (!range || !els.noteEditor.contains(range.commonAncestorContainer)) {
    range = document.createRange();
    range.selectNodeContents(els.noteEditor);
    range.collapse(false);
  }
  range.deleteContents();
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

async function addImagesToActiveNote(files) {
  const note = getActiveNote();
  const supported = files.filter((file) => ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type));
  if (!note || supported.length === 0) {
    showToast("请选择 PNG、JPEG、WebP 或 GIF 图片");
    return;
  }

  const previousContent = note.content;
  els.addNoteImageBtn.disabled = true;
  showToast("正在处理图片...");
  try {
    const images = [];
    for (const file of supported) {
      images.push({ src: await prepareNoteImage(file), alt: file.name || "笔记图片" });
    }

    const container = document.createElement("div");
    container.innerHTML = previousContent;
    images.forEach(({ src, alt }) => {
      const block = document.createElement("div");
      const image = document.createElement("img");
      image.src = src;
      image.alt = alt;
      block.append(image, document.createElement("br"));
      container.append(block);
    });

    note.content = sanitizeNoteContent(container.innerHTML);
    note.updatedAt = new Date().toISOString();
    saveState();
    if (activeNoteId === note.id) renderNotes();
    showToast(`已添加 ${images.length} 张图片`);
  } catch (error) {
    const current = state.notes.find((item) => item.id === note.id);
    if (current) current.content = previousContent;
    console.error(error);
    showToast(error.name === "QuotaExceededError" ? "浏览器存储空间不足，请减少图片" : error.message);
    renderNotes();
  } finally {
    els.addNoteImageBtn.disabled = false;
  }
}

async function prepareNoteImage(file) {
  if (file.size > NOTE_IMAGE_MAX_FILE_BYTES) {
    throw new Error(`图片 ${file.name || ""} 超过 10 MB`);
  }
  const source = await fileToDataUrl(file);
  const image = await loadImage(source);
  const scale = Math.min(1, NOTE_IMAGE_MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/webp", 0.82);
  if (dataUrl.length > NOTE_IMAGE_MAX_DATA_URL_LENGTH) {
    throw new Error(`图片 ${file.name || ""} 压缩后仍过大`);
  }
  return dataUrl;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")), { once: true });
    reader.addEventListener("error", () => reject(new Error("图片读取失败")), { once: true });
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error("图片解析失败")), { once: true });
    image.src = src;
  });
}

function renderAggregateList(items, list, emptyText) {
  list.replaceChildren();
  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state aggregate-empty";
    empty.textContent = emptyText;
    list.append(empty);
    return;
  }
  items.forEach((item) => list.append(createAggregateItem(item)));
}

function createAggregateItem(item) {
  const card = document.createElement("article");
  card.className = `aggregate-item ${item.kind}`;
  if (item.done) card.classList.add("done");

  const check = document.createElement("button");
  check.className = "check-button";
  check.type = "button";
  check.setAttribute("aria-label", item.done ? "恢复为待处理" : "标记为完成");
  check.title = item.done ? "恢复为待处理" : "标记为完成";
  check.dataset.aggregateToggle = "true";
  check.dataset.kind = item.kind;
  check.dataset.planType = item.planType;
  check.dataset.planKey = item.planKey;
  check.dataset.itemId = item.id;
  check.innerHTML = checkIcon();

  const body = document.createElement("div");
  const title = document.createElement("p");
  title.className = "aggregate-title";
  title.textContent = item.text;

  const meta = document.createElement("div");
  meta.className = "task-meta aggregate-meta";
  const kind = document.createElement("span");
  kind.className = `pill aggregate-kind ${item.kind}`;
  kind.textContent = item.kind === "task" ? "计划" : "想法";
  meta.append(kind);

  const source = document.createElement("span");
  source.className = "pill";
  source.textContent = item.sourceLabel;
  meta.append(source);

  if (item.dateLabel) {
    const date = document.createElement("span");
    date.className = "pill day-label";
    date.textContent = item.dateLabel;
    meta.append(date);
  }

  if (item.priority) {
    const priority = document.createElement("span");
    priority.className = `pill ${item.priority}`;
    priority.textContent = priorityLabels[item.priority] || priorityLabels.normal;
    meta.append(priority);
  }

  body.append(title, meta);
  const actions = document.createElement("div");
  actions.className = "aggregate-actions";
  const edit = iconButton("edit-idea aggregate-edit", item.kind === "task" ? "编辑计划" : "编辑想法", pencilIcon());
  edit.dataset.aggregateEdit = "true";
  edit.dataset.kind = item.kind;
  edit.dataset.planType = item.planType;
  edit.dataset.planKey = item.planKey;
  edit.dataset.itemId = item.id;

  const remove = iconButton("delete-idea aggregate-delete", item.kind === "task" ? "删除计划" : "删除想法", trashIcon());
  remove.dataset.aggregateDelete = "true";
  remove.dataset.kind = item.kind;
  remove.dataset.planType = item.planType;
  remove.dataset.planKey = item.planKey;
  remove.dataset.itemId = item.id;
  actions.append(edit, remove);

  card.append(check, body, actions);
  return card;
}

function collectAggregateItems() {
  const items = [];

  appendPlanItems(items, {
    plan: getGlobalEntryPlan(),
    planType: "plan",
    planKey: "",
    sourceLabel: "全局",
  });

  Object.entries(state.holidays).forEach(([key, plan]) => {
    const holiday = getHolidayById(key);
    const dates = holiday ? getHolidayDates(holiday) : [];
    normalizeHolidayPlan(plan, dates.length || inferPlanDayCount(plan), dates);
    const sourceLabel = holiday
      ? `${holiday.name} ${formatMonthDay(dates[0])}-${formatMonthDay(dates[dates.length - 1])}`
      : `假期 ${key}`;
    appendPlanItems(items, {
      plan,
      planType: "holiday",
      planKey: key,
      dates,
      sourceLabel,
    });
  });

  return items.sort(compareAggregateItems);
}

function appendPlanItems(items, context) {
  context.plan.tasks.forEach((task) => {
    if (!task.title.trim()) return;
    items.push({
      kind: "task",
      id: task.id,
      text: task.title,
      done: task.done,
      priority: task.priority,
      dateLabel: formatTaskTiming(task, context.dates),
      sourceLabel: context.sourceLabel,
      planType: context.planType,
      planKey: context.planKey,
      deadline: task.deadline,
      sortTime: task.updatedAt || task.createdAt,
    });
  });

  context.plan.ideas.forEach((idea) => {
    if (!idea.text.trim()) return;
    items.push({
      kind: "idea",
      id: idea.id,
      text: idea.text,
      done: idea.archived,
      dateLabel: formatDeadlineLabel(idea.deadline),
      sourceLabel: context.sourceLabel,
      planType: context.planType,
      planKey: context.planKey,
      deadline: idea.deadline,
      sortTime: idea.updatedAt || idea.createdAt,
    });
  });
}

function compareAggregateItems(a, b) {
  if (a.done !== b.done) return Number(a.done) - Number(b.done);
  const deadlineDiff = deadlineSortValue(a.deadline) - deadlineSortValue(b.deadline);
  if (deadlineDiff !== 0) return deadlineDiff;
  const aTime = new Date(a.sortTime || 0).getTime();
  const bTime = new Date(b.sortTime || 0).getTime();
  return bTime - aTime;
}

function renderStats(week) {
  if (activePage === "inbox") {
    const items = collectAggregateItems();
    const done = items.filter((item) => item.done).length;
    els.doneLabel.textContent = "待处理";
    els.openLabel.textContent = "已收纳";
    els.ideaLabel.textContent = "总数";
    els.doneCount.textContent = String(items.length - done);
    els.openCount.textContent = String(done);
    els.ideaCount.textContent = String(items.length);
    return;
  }

  if (activePage === "period") {
    const dates = getPeriodDates(week);
    const filled = dates.filter((date) => (week.dayNotes[dateKey(date)] || "").trim()).length;
    els.doneLabel.textContent = "已填写";
    els.openLabel.textContent = "空白";
    els.ideaLabel.textContent = "周数";
    els.doneCount.textContent = String(filled);
    els.openCount.textContent = String(dates.length - filled);
    els.ideaCount.textContent = String(getPeriodWeekStarts(dates).length);
    return;
  }

  const done = week.tasks.filter((task) => task.done).length;
  const open = week.tasks.length - done;
  const ideas = week.ideas.filter((idea) => !idea.archived).length;

  els.doneLabel.textContent = "已完成";
  els.openLabel.textContent = "进行中";
  els.ideaLabel.textContent = "想法";
  els.doneCount.textContent = String(done);
  els.openCount.textContent = String(open);
  els.ideaCount.textContent = String(ideas);
}

function renderViewSwitch() {
  const all = activeView === "all";
  [
    [els.allView, els.openView],
    [els.holidayAllView, els.holidayOpenView],
  ].forEach(([allButton, openButton]) => {
    allButton.classList.toggle("active", all);
    openButton.classList.toggle("active", !all);
    allButton.setAttribute("aria-selected", String(all));
    openButton.setAttribute("aria-selected", String(!all));
  });
}

function syncDefaultDeadline(input, fallback = getBeijingDateKey()) {
  if (!input.dataset.touched || !isDateKey(input.value)) {
    input.value = fallback;
  }
}

function addTask({ title, deadline, priority, notes = "" }, type = "plan") {
  getTasksByType(type).push({
    id: createId(),
    title,
    deadline: isDateKey(deadline) ? deadline : getBeijingDateKey(),
    priority,
    notes,
    done: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

function toggleTask(id, type = "plan") {
  const task = findTask(id, type);
  if (!task) return;
  task.done = !task.done;
  task.updatedAt = new Date().toISOString();
  saveAndRender(task.done ? "做完了，漂亮" : "已恢复为未完成");
}

function toggleIdea(id, type = "plan") {
  const idea = getIdeasByType(type).find((item) => item.id === id);
  if (!idea) return;
  idea.archived = !idea.archived;
  idea.updatedAt = new Date().toISOString();
  saveAndRender(idea.archived ? "想法已整理" : "想法已恢复");
}

function toggleAggregateItem(button) {
  const plan = getPlanByReference(button.dataset.planType, button.dataset.planKey);
  if (!plan) return;

  if (button.dataset.kind === "task") {
    const task = plan.tasks.find((item) => item.id === button.dataset.itemId);
    if (!task) return;
    task.done = !task.done;
    task.updatedAt = new Date().toISOString();
    saveAndRender(task.done ? "计划已收纳" : "计划已恢复为待处理");
    return;
  }

  const idea = plan.ideas.find((item) => item.id === button.dataset.itemId);
  if (!idea) return;
  idea.archived = !idea.archived;
  idea.updatedAt = new Date().toISOString();
  saveAndRender(idea.archived ? "想法已收纳" : "想法已恢复为待处理");
}

function editAggregateItem(button) {
  const type = button.dataset.planType;
  const key = button.dataset.planKey;
  const id = button.dataset.itemId;
  if (button.dataset.kind === "task") {
    openTaskDialog(id, type, key);
  } else {
    openIdeaDialog(id, type, key);
  }
}

function deleteAggregateItem(button) {
  const plan = getPlanByReference(button.dataset.planType, button.dataset.planKey);
  if (!plan) return;

  if (button.dataset.kind === "task") {
    const tasks = plan.tasks.filter((task) => task.id !== button.dataset.itemId);
    if (button.dataset.planType === "plan") {
      state.tasks = tasks;
    } else {
      plan.tasks = tasks;
    }
    saveAndRender("计划已删除");
    return;
  }

  const ideas = plan.ideas.filter((idea) => idea.id !== button.dataset.itemId);
  if (button.dataset.planType === "plan") {
    state.ideas = ideas;
  } else {
    plan.ideas = ideas;
  }
  saveAndRender("想法已删除");
}

function deleteIdea(id, type = "plan") {
  setIdeasByType(type, getIdeasByType(type).filter((idea) => idea.id !== id));
  saveAndRender("想法已删除");
}

function updateDaySlot(dayKey, slotIndex, value, type = "plan", dayIndex = -1) {
  if (!isDateKey(dayKey) || slotIndex < 0 || slotIndex >= slotLabels.length) {
    return;
  }
  const slots = getOrCreateDateSlots(dayKey);
  slots[slotIndex] = value;
  trimDateSlots(dayKey);
  updateLegacyPlanSlot(type, dayIndex, slotIndex, value);
  saveState();
}

function updatePeriodDayNote(key, value, cell) {
  if (!isDateKey(key)) return;
  const plan = getPeriodPlan();
  plan.dayNotes[key] = value;
  if (!value.trim()) delete plan.dayNotes[key];
  if (cell) cell.classList.toggle("filled", Boolean(value.trim()));
  syncPeriodDayInputs(key, value);
  saveState();
  if (activePage === "period") renderStats(plan);
}

function updateLegacyPlanSlot(type, dayIndex, slotIndex, value) {
  if (dayIndex < 0) return;
  const plan = getPlanByType(type);
  if (!plan.daySlots[dayIndex]) plan.daySlots[dayIndex] = ["", "", ""];
  plan.daySlots[dayIndex][slotIndex] = value;
}

function syncPeriodDayInputs(key, value) {
  document.querySelectorAll("[data-period-inline], [data-period-day]").forEach((control) => {
    if (control.dataset.periodInline !== key && control.dataset.periodDay !== key) return;
    if (control.value !== value) control.value = value;
    const cell = control.closest(".period-day-cell");
    if (cell) cell.classList.toggle("filled", Boolean(value.trim()));
  });
}

function savePlanRange() {
  const start = els.planStart.value;
  const end = els.planEnd.value;
  const validation = validatePlanRange(start, end);

  if (!validation.valid) {
    showToast(validation.message);
    return;
  }

  setActivePlanRange({ start, end });
  render();
  showToast(`已切换到 ${validation.dayCount} 天周期`);
}

function validatePlanRange(start, end) {
  if (!isDateKey(start) || !isDateKey(end)) {
    return { valid: false, message: "请填写完整的开始日期和结束日期。" };
  }
  if (start > end) {
    return { valid: false, message: "开始日期不能晚于结束日期。" };
  }
  return { valid: true, dayCount: daysBetweenInclusive(start, end) };
}

function savePeriodConfig() {
  const title = els.periodTitle.value.trim() || "阶段规划";
  const start = els.periodStart.value;
  const end = els.periodEnd.value;
  const validation = validatePeriodRange(start, end);

  if (!validation.valid) {
    els.periodConfigStatus.textContent = validation.message;
    showToast("请调整周期范围");
    return;
  }

  const plan = getPeriodPlan();
  plan.title = title;
  plan.start = start;
  plan.end = end;
  saveAndRender("宏观规划范围已保存");
}

function validatePeriodRange(start, end) {
  if (!isDateKey(start) || !isDateKey(end)) {
    return { valid: false, message: "请填写完整的开始日期和结束日期。" };
  }
  if (start > end) {
    return { valid: false, message: "开始日期不能晚于结束日期。" };
  }
  const dayCount = daysBetweenInclusive(start, end);
  if (dayCount < PERIOD_MIN_DAYS || dayCount > PERIOD_MAX_DAYS) {
    return {
      valid: false,
      message: `当前选择了 ${dayCount} 天。宏观规划范围需要保持在 ${PERIOD_MIN_DAYS} 至 ${PERIOD_MAX_DAYS} 天。`,
    };
  }
  return { valid: true, dayCount };
}

function getInputDeadline(input) {
  if (isDateKey(input.value)) return input.value;
  const fallback = getBeijingDateKey();
  input.value = fallback;
  return fallback;
}

function focusFirstPeriodCell() {
  activatePage("period");
  const empty = [...els.periodGrid.querySelectorAll("[data-period-day]")]
    .find((note) => !note.value.trim());
  const target = empty || els.periodGrid.querySelector("[data-period-day]");
  if (!target) return;
  target.focus();
  target.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
}

function getPlanForEditing(type, key = "") {
  if (type === "holiday" && !key) return getActiveHolidayPlan();
  return getPlanByReference(type, key);
}

function openTaskDialog(id, type = "plan", key = "") {
  dialogPlanType = type;
  dialogPlanKey = key;
  const task = getPlanForEditing(type, key)?.tasks.find((item) => item.id === id);
  if (!task) return;
  els.dialogTaskId.value = task.id;
  els.dialogTitle.value = task.title;
  els.dialogDeadline.value = isDateKey(task.deadline) ? task.deadline : getBeijingDateKey();
  els.dialogPriority.value = task.priority;
  els.dialogNotes.value = task.notes;
  els.taskDialog.showModal();
  els.dialogTitle.focus();
}

function saveDialogTask() {
  const id = els.dialogTaskId.value;
  const task = getPlanForEditing(dialogPlanType, dialogPlanKey)?.tasks.find((item) => item.id === id);
  if (!task) return;
  task.title = els.dialogTitle.value.trim();
  task.deadline = getInputDeadline(els.dialogDeadline);
  task.priority = els.dialogPriority.value;
  task.notes = els.dialogNotes.value.trim();
  task.updatedAt = new Date().toISOString();
  closeDialog();
  saveAndRender("计划已保存");
}

function deleteTaskFromDialog() {
  const id = els.dialogTaskId.value;
  const plan = getPlanForEditing(dialogPlanType, dialogPlanKey);
  if (!id || !plan) return;
  const tasks = plan.tasks.filter((task) => task.id !== id);
  if (dialogPlanType === "plan") state.tasks = tasks;
  else plan.tasks = tasks;
  closeDialog();
  saveAndRender("计划已删除");
}

function openIdeaDialog(id, type = "plan", key = "") {
  ideaDialogPlanType = type;
  ideaDialogPlanKey = key;
  const idea = getPlanForEditing(type, key)?.ideas.find((item) => item.id === id);
  if (!idea) return;
  els.dialogIdeaId.value = idea.id;
  els.dialogIdeaText.value = idea.text;
  els.dialogIdeaDeadline.value = isDateKey(idea.deadline) ? idea.deadline : getBeijingDateKey();
  els.ideaDialog.showModal();
  els.dialogIdeaText.focus();
}

function saveDialogIdea() {
  const id = els.dialogIdeaId.value;
  const idea = getPlanForEditing(ideaDialogPlanType, ideaDialogPlanKey)?.ideas.find((item) => item.id === id);
  if (!idea) return;
  idea.text = els.dialogIdeaText.value.trim();
  idea.deadline = getInputDeadline(els.dialogIdeaDeadline);
  idea.updatedAt = new Date().toISOString();
  closeIdeaDialog();
  saveAndRender("想法已保存");
}

function deleteIdeaFromDialog() {
  const id = els.dialogIdeaId.value;
  const plan = getPlanForEditing(ideaDialogPlanType, ideaDialogPlanKey);
  if (!id || !plan) return;
  const ideas = plan.ideas.filter((idea) => idea.id !== id);
  if (ideaDialogPlanType === "plan") state.ideas = ideas;
  else plan.ideas = ideas;
  closeIdeaDialog();
  saveAndRender("想法已删除");
}

function closeDialog() {
  if (els.taskDialog.open) els.taskDialog.close();
}

function closeIdeaDialog() {
  if (els.ideaDialog.open) els.ideaDialog.close();
}

function setView(view) {
  activeView = view;
  render();
}

function activatePage(page) {
  activePage = ["planner", "holiday", "period", "inbox", "notes", "sync"].includes(page) ? page : "planner";
  localStorage.setItem(ACTIVE_PAGE_KEY, activePage);

  [
    ["planner", els.plannerView, els.plannerPageBtn],
    ["holiday", els.holidayView, els.holidayPageBtn],
    ["period", els.periodView, els.periodPageBtn],
    ["inbox", els.inboxView, els.inboxPageBtn],
    ["notes", els.notesView, els.notesPageBtn],
    ["sync", els.syncView, els.syncPageBtn],
  ].forEach(([name, view, button]) => {
    const active = activePage === name;
    view.classList.toggle("active", active);
    view.hidden = !active;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });

  render();
}

function movePlanRange(delta) {
  const dayCount = getActivePlanDates().length;
  const start = addDays(dateFromKey(activePlanRange.start), delta * dayCount);
  const end = addDays(start, dayCount - 1);
  setActivePlanRange({ start: dateKey(start), end: dateKey(end) });
  render();
}

function setActivePlanRange(range, options = {}) {
  activePlanRange = normalizePlanRange(range);
  state.activePlanRange = { ...activePlanRange };
  if (options.persist !== false) saveState({ github: false });
}

function getActivePlan() {
  const dates = getActivePlanDates();
  const key = planRangeKey(activePlanRange);
  if (!state.plans[key]) state.plans[key] = createRegularPlan(dates.length);
  normalizeRegularPlan(state.plans[key], dates.length, dates);
  return state.plans[key];
}

function getActiveHolidayPlan(holiday = getDisplayHoliday()) {
  const dates = getHolidayDates(holiday);
  if (!state.holidays[holiday.id]) state.holidays[holiday.id] = createHolidayPlan(dates.length);
  normalizeHolidayPlan(state.holidays[holiday.id], dates.length, dates);
  return state.holidays[holiday.id];
}

function getPeriodPlan() {
  state.periodPlan = normalizePeriodPlan(state.periodPlan);
  return state.periodPlan;
}

function getActivePlanDates() {
  return getPlanDates(activePlanRange);
}

function getDateSlotValues(date, fallbackPlan, dayIndex) {
  const key = dateKey(date);
  const sharedSlots = state.dateSlots?.[key];
  if (Array.isArray(sharedSlots)) return normalizeSlotArray(sharedSlots);
  return normalizeSlotArray(fallbackPlan?.daySlots?.[dayIndex]);
}

function getOrCreateDateSlots(key) {
  if (!state.dateSlots || typeof state.dateSlots !== "object") state.dateSlots = {};
  if (!Array.isArray(state.dateSlots[key])) state.dateSlots[key] = ["", "", ""];
  state.dateSlots[key] = normalizeSlotArray(state.dateSlots[key]);
  return state.dateSlots[key];
}

function trimDateSlots(key) {
  if (!state.dateSlots?.[key]) return;
  state.dateSlots[key] = normalizeSlotArray(state.dateSlots[key]);
  if (!state.dateSlots[key].some((slot) => slot.trim())) delete state.dateSlots[key];
}

function getPeriodDayNote(key) {
  return getPeriodPlan().dayNotes[key] || "";
}

function ensureEntryState() {
  if (!state.plans || typeof state.plans !== "object") state.plans = {};
  state.tasks = normalizeTasks(state.tasks);
  state.ideas = normalizeIdeas(state.ideas);
  migratePlanEntriesToGlobal(state.plans, state.tasks, state.ideas);
}

function getGlobalEntryPlan() {
  ensureEntryState();
  return {
    tasks: state.tasks,
    ideas: state.ideas,
  };
}

function getPlanByType(type) {
  return type === "holiday" ? getActiveHolidayPlan() : getActivePlan();
}

function getTasksByType(type) {
  if (type !== "holiday") ensureEntryState();
  return type === "holiday" ? getActiveHolidayPlan().tasks : state.tasks;
}

function getIdeasByType(type) {
  if (type !== "holiday") ensureEntryState();
  return type === "holiday" ? getActiveHolidayPlan().ideas : state.ideas;
}

function setTasksByType(type, tasks) {
  if (type === "holiday") {
    getActiveHolidayPlan().tasks = tasks;
    return;
  }
  state.tasks = tasks;
}

function setIdeasByType(type, ideas) {
  if (type === "holiday") {
    getActiveHolidayPlan().ideas = ideas;
    return;
  }
  state.ideas = ideas;
}

function getPlanByReference(type, key) {
  if (type === "plan") {
    return getGlobalEntryPlan();
  }

  if (type === "holiday") {
    const plan = state.holidays[key];
    if (!plan) return null;
    const holiday = getHolidayById(key);
    const dates = holiday ? getHolidayDates(holiday) : [];
    normalizeHolidayPlan(plan, dates.length || inferPlanDayCount(plan), dates);
    return plan;
  }

  if (!isDateKey(key)) return null;
  const range = { start: key, end: dateKey(addDays(dateFromKey(key), PLAN_DEFAULT_DAYS - 1)) };
  const plan = state.plans[planRangeKey(range)];
  if (!plan) return null;
  const dates = getPlanDates(range);
  normalizeRegularPlan(plan, dates.length, dates);
  return plan;
}

function getQuickEntryType() {
  return activePage === "holiday" ? "holiday" : "plan";
}

function findTask(id, type = "plan") {
  return getTasksByType(type).find((task) => task.id === id);
}

function saveAndRender(message) {
  saveState();
  render();
  if (message) showToast(message);
}

function exportWeek() {
  const plan = getActivePlan();
  const dates = getActivePlanDates();
  const lines = [
    `# 周期计划 ${formatFullDate(dates[0])} - ${formatFullDate(dates[dates.length - 1])}`,
    "",
    "## 周期焦点",
    plan.focus.trim() || "未填写",
    "",
    "## 每日计划",
  ];

  dates.forEach((date, index) => {
    lines.push("", `### ${formatWeekday(date)} ${formatMonthDay(date)}`);
    const slots = getDateSlotValues(date, plan, index).map((slot) => slot.trim()).filter(Boolean);
    if (slots.length === 0) {
      lines.push("- 暂无");
      return;
    }
    slots.forEach((slot, slotIndex) => lines.push(`${slotIndex + 1}. ${slot}`));
  });

  const entryPlan = getGlobalEntryPlan();

  lines.push("", "## 全局计划");
  if (entryPlan.tasks.length === 0) {
    lines.push("- 暂无");
  } else {
    [...entryPlan.tasks].sort(compareTasks).forEach((task) => {
      const checked = task.done ? "x" : " ";
      const note = task.notes.trim() ? ` - ${task.notes.trim()}` : "";
      lines.push(`- [${checked}] ${formatTaskTiming(task, dates)} ${task.title}（${priorityLabels[task.priority]}）${note}`);
    });
  }

  lines.push("", "## 全局想法");
  if (entryPlan.ideas.length === 0) {
    lines.push("- 暂无");
  } else {
    [...entryPlan.ideas].sort(compareIdeas).forEach((idea) => {
      lines.push(`- ${idea.archived ? "[已整理] " : ""}${formatDeadlineLabel(idea.deadline)}｜${idea.text}`);
    });
  }

  lines.push("", "## 周期复盘", plan.review.trim() || "未填写", "");

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cycle-plan-${activePlanRange.start}-${activePlanRange.end}.md`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("已导出 Markdown");
}

function exportNote() {
  const note = getActiveNote();
  if (!note) {
    showToast("当前没有可导出的笔记");
    return;
  }
  const title = note.title.trim() || "无标题笔记";
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>body{max-width:860px;margin:40px auto;padding:0 20px;color:#1f2933;font:16px/1.7 system-ui,sans-serif}img{display:block;max-width:100%;height:auto;margin:18px 0}h1{line-height:1.25}</style>
</head>
<body><h1>${escapeHtml(title)}</h1><main>${sanitizeNoteContent(note.content)}</main></body>
</html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/[\\/:*?"<>|]/g, "-").slice(0, 60) || "note"}.html`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("已导出笔记 HTML");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function exportHoliday() {
  const holiday = getDisplayHoliday();
  const plan = getActiveHolidayPlan(holiday);
  const dates = getHolidayDates(holiday);
  const lines = [
    `# ${holiday.name}假期计划 ${formatFullDate(dates[0])} - ${formatFullDate(dates[dates.length - 1])}`,
    "",
    "## 每日计划",
  ];

  dates.forEach((date, index) => {
    lines.push("", `### ${formatWeekday(date)} ${formatMonthDay(date)}`);
    const slots = getDateSlotValues(date, plan, index).map((slot) => slot.trim()).filter(Boolean);
    if (slots.length === 0) {
      lines.push("- 暂无");
      return;
    }
    slots.forEach((slot, slotIndex) => lines.push(`${slotIndex + 1}. ${slot}`));
  });

  lines.push("", "## 计划收纳");
  if (plan.tasks.length === 0) {
    lines.push("- 暂无");
  } else {
    plan.tasks.sort(compareTasks).forEach((task) => {
      const checked = task.done ? "x" : " ";
      const note = task.notes.trim() ? ` - ${task.notes.trim()}` : "";
      lines.push(`- [${checked}] ${formatTaskTiming(task, dates)} ${task.title}（${priorityLabels[task.priority]}）${note}`);
    });
  }

  lines.push("", "## 想法");
  if (plan.ideas.length === 0) {
    lines.push("- 暂无");
  } else {
    plan.ideas.forEach((idea) => {
      lines.push(`- ${idea.archived ? "[已整理] " : ""}${formatDeadlineLabel(idea.deadline)}｜${idea.text}`);
    });
  }

  lines.push("", "## 假期复盘", plan.review.trim() || "未填写", "");

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `holiday-plan-${holiday.id}.md`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("已导出假期 Markdown");
}

function exportPeriod() {
  const plan = getPeriodPlan();
  const dates = getPeriodDates(plan);
  const lines = [
    `# ${plan.title} ${formatFullDate(dates[0])} - ${formatFullDate(dates[dates.length - 1])}`,
    "",
    "## 宏观规划",
  ];

  getPeriodWeekStarts(dates).forEach((weekStart, weekIndex) => {
    const weekDates = Array.from({ length: 7 }, (_, offset) => addDays(weekStart, offset))
      .filter((date) => {
        const key = dateKey(date);
        return key >= plan.start && key <= plan.end;
      });
    if (weekDates.length === 0) return;

    lines.push("", `### 第 ${weekIndex + 1} 周 ${formatMonthDay(weekDates[0])} - ${formatMonthDay(weekDates[weekDates.length - 1])}`);
    weekDates.forEach((date) => {
      const key = dateKey(date);
      const note = (plan.dayNotes[key] || "").trim() || "暂无";
      lines.push(`- ${formatWeekday(date)} ${formatMonthDay(date)}：${note}`);
    });
  });

  lines.push("");

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `period-plan-${plan.start}-${plan.end}.md`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("已导出宏观规划 Markdown");
}

function exportAggregate() {
  const items = collectAggregateItems();
  const openItems = items.filter((item) => !item.done);
  const doneItems = items.filter((item) => item.done);
  const lines = [
    "# 想法和计划汇总",
    "",
    `待处理：${openItems.length}`,
    `已收纳：${doneItems.length}`,
    "",
    "## 待处理",
  ];

  appendAggregateExportLines(lines, openItems);
  lines.push("", "## 已收纳");
  appendAggregateExportLines(lines, doneItems);
  lines.push("");

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `planner-inbox-${getBeijingDateKey()}.md`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("已导出汇总 Markdown");
}

function appendAggregateExportLines(lines, items) {
  if (items.length === 0) {
    lines.push("- 暂无");
    return;
  }
  items.forEach((item) => {
    const checked = item.done ? "x" : " ";
    const kind = item.kind === "task" ? "计划" : "想法";
    const date = item.dateLabel ? ` ${item.dateLabel}` : "";
    lines.push(`- [${checked}] ${kind}｜${item.sourceLabel}${date}｜${item.text}`);
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeState({ plans: {}, tasks: [], ideas: [], weeks: {}, holidays: {}, customHoliday: null, periodPlan: null, dateSlots: {} });
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch {
    return normalizeState({ plans: {}, tasks: [], ideas: [], weeks: {}, holidays: {}, customHoliday: null, periodPlan: null, dateSlots: {} });
  }
}

function normalizeState(input) {
  const source = input && typeof input === "object" ? input : {};
  const legacyWeeks = source.weeks && typeof source.weeks === "object" ? source.weeks : {};
  const plans = normalizeRegularPlans(source.plans, legacyWeeks);
  const tasks = normalizeTasks(source.tasks);
  const ideas = normalizeIdeas(source.ideas);
  const notes = normalizeNotes(source.notes);
  migratePlanEntriesToGlobal(plans, tasks, ideas);
  const holidays = source.holidays && typeof source.holidays === "object" ? source.holidays : {};
  const customHoliday = normalizeCustomHoliday(source.customHoliday);
  const periodPlan = normalizePeriodPlan(source.periodPlan);
  const activePlanRange = normalizePlanRange(source.activePlanRange, getInitialPlanRangeFallback(plans));
  const hasSharedDateSlots = source.dateSlots && typeof source.dateSlots === "object";
  const dateSlots = normalizeDateSlots(source.dateSlots);
  Object.entries(holidays).forEach(([id, plan]) => {
    const holiday = [...chinaHolidays, customHoliday].filter(Boolean).find((item) => item.id === id);
    const dates = holiday ? getHolidayDates(holiday) : [];
    const dayCount = dates.length || inferPlanDayCount(plan);
    normalizeHolidayPlan(plan, dayCount, dates);
  });
  if (!hasSharedDateSlots) migrateLegacyDateSlots(dateSlots, legacyWeeks, holidays, customHoliday);
  return { plans, tasks, ideas, notes, holidays, customHoliday, periodPlan, dateSlots, activePlanRange };
}

function inferPlanDayCount(plan) {
  return Array.isArray(plan?.daySlots) && plan.daySlots.length > 0 ? plan.daySlots.length : 7;
}

function normalizeTasks(input, dates = [], fallbackDeadline = getBeijingDateKey()) {
  const source = Array.isArray(input) ? input : [];
  return source
    .filter((task) => task && typeof task === "object")
    .map((task) => normalizeTask(task, dates, fallbackDeadline));
}

function normalizeIdeas(input, fallbackDeadline = getBeijingDateKey()) {
  const source = Array.isArray(input) ? input : [];
  return source
    .filter((idea) => idea && typeof idea === "object")
    .map((idea) => normalizeIdea(idea, fallbackDeadline));
}

function normalizeNotes(input) {
  const source = Array.isArray(input) ? input : [];
  return source
    .filter((note) => note && typeof note === "object")
    .map((note) => {
      const createdAt = typeof note.createdAt === "string" ? note.createdAt : new Date().toISOString();
      return {
        id: typeof note.id === "string" ? note.id : createId(),
        title: typeof note.title === "string" ? note.title.slice(0, 80) : "",
        content: sanitizeNoteContent(note.content),
        createdAt,
        updatedAt: typeof note.updatedAt === "string" ? note.updatedAt : createdAt,
      };
    });
}

function sanitizeNoteContent(input) {
  const template = document.createElement("template");
  template.innerHTML = typeof input === "string" ? input : "";
  const allowedTags = new Set(["DIV", "P", "BR", "IMG"]);
  [...template.content.querySelectorAll("*")].forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(document.createTextNode(element.textContent || ""));
      return;
    }
    if (element.tagName === "IMG") {
      const src = element.getAttribute("src") || "";
      if (!/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(src)) {
        element.remove();
        return;
      }
      const alt = element.getAttribute("alt") || "笔记图片";
      [...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
      element.setAttribute("src", src);
      element.setAttribute("alt", alt.slice(0, 160));
      return;
    }
    [...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
  });
  return template.innerHTML;
}

function normalizeTask(task, dates = [], fallbackDeadline = getBeijingDateKey()) {
  if (typeof task.id !== "string") task.id = createId();
  if (typeof task.title !== "string") task.title = "";
  task.deadline = normalizeDeadline(task.deadline, task.day, dates, fallbackDeadline);
  if (!["high", "normal", "low"].includes(task.priority)) task.priority = "normal";
  if (typeof task.notes !== "string") task.notes = "";
  task.done = Boolean(task.done);
  if (typeof task.createdAt !== "string") task.createdAt = new Date().toISOString();
  if (typeof task.updatedAt !== "string") task.updatedAt = task.createdAt;
  return task;
}

function normalizeIdea(idea, fallbackDeadline = getBeijingDateKey()) {
  if (typeof idea.id !== "string") idea.id = createId();
  if (typeof idea.text !== "string") idea.text = "";
  idea.deadline = isDateKey(idea.deadline) ? idea.deadline : fallbackDeadline;
  idea.archived = Boolean(idea.archived);
  if (typeof idea.createdAt !== "string") idea.createdAt = new Date().toISOString();
  if (typeof idea.updatedAt !== "string") idea.updatedAt = idea.createdAt;
  return idea;
}

function normalizeDeadline(deadline, legacyDay, dates = [], fallbackDeadline = getBeijingDateKey()) {
  if (isDateKey(deadline)) return deadline;
  const dayIndex = Number(legacyDay);
  if (Number.isInteger(dayIndex) && dayIndex >= 0 && dayIndex < dates.length) {
    return dateKey(dates[dayIndex]);
  }
  return isDateKey(fallbackDeadline) ? fallbackDeadline : getBeijingDateKey();
}

function normalizeRegularPlans(input, legacyWeeks = {}) {
  const plans = {};

  if (input && typeof input === "object") {
    Object.entries(input).forEach(([key, plan]) => {
      const range = parsePlanRangeKey(key);
      if (!range || !plan || typeof plan !== "object") return;
      const dates = getPlanDates(range);
      normalizeRegularPlan(plan, dates.length, dates);
      plans[planRangeKey(range)] = plan;
    });
  }

  Object.entries(legacyWeeks || {}).forEach(([key, week]) => {
    if (!isDateKey(key) || !week || typeof week !== "object") return;
    const range = {
      start: key,
      end: dateKey(addDays(dateFromKey(key), PLAN_DEFAULT_DAYS - 1)),
    };
    const targetKey = planRangeKey(range);
    if (plans[targetKey]) return;
    const dates = getPlanDates(range);
    normalizeRegularPlan(week, dates.length, dates);
    plans[targetKey] = week;
  });

  return plans;
}

function migratePlanEntriesToGlobal(plans, tasks, ideas) {
  const taskIds = new Set(tasks.map((task) => task.id));
  const ideaIds = new Set(ideas.map((idea) => idea.id));

  Object.entries(plans).forEach(([key, plan]) => {
    const range = parsePlanRangeKey(key);
    const fallbackDeadline = range?.end || getBeijingDateKey();
    const dates = range ? getPlanDates(range) : [];

    normalizeTasks(plan.tasks, dates, fallbackDeadline).forEach((task) => {
      if (taskIds.has(task.id)) return;
      taskIds.add(task.id);
      tasks.push(task);
    });

    normalizeIdeas(plan.ideas, fallbackDeadline).forEach((idea) => {
      if (ideaIds.has(idea.id)) return;
      ideaIds.add(idea.id);
      ideas.push(idea);
    });

    plan.tasks = [];
    plan.ideas = [];
  });
}

function normalizeCustomHoliday(input) {
  if (!input || typeof input !== "object") return null;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const start = typeof input.start === "string" ? input.start : "";
  const end = typeof input.end === "string" ? input.end : "";
  if (!name || !isDateKey(start) || !isDateKey(end) || start > end) return null;
  return {
    id: createCustomHolidayId(name, start, end),
    name,
    start,
    end,
    custom: true,
  };
}

function saveState(options = {}) {
  state.activePlanRange = { ...activePlanRange };
  state = normalizeState(state);
  activePlanRange = normalizePlanRange(state.activePlanRange);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
  if (options.github !== false) markGithubDirty();
}

function loadGithubSyncConfig() {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY);
    if (!raw) return { ...defaultGithubSyncConfig };
    const parsed = JSON.parse(raw);
    return {
      ...defaultGithubSyncConfig,
      ...parsed,
      owner: parsed.owner || defaultGithubSyncConfig.owner,
      repo: parsed.repo || defaultGithubSyncConfig.repo,
      branch: parsed.branch || defaultGithubSyncConfig.branch,
      path: parsed.path || defaultGithubSyncConfig.path,
    };
  } catch {
    return { ...defaultGithubSyncConfig };
  }
}

function saveGithubSyncConfig() {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(githubSync));
}

function isGithubConfigured(requireToken = true) {
  return Boolean(
    githubSync.owner &&
      githubSync.repo &&
      githubSync.branch &&
      githubSync.path &&
      (!requireToken || githubSync.token)
  );
}

function populateGithubInputs() {
  els.githubOwner.value = githubSync.owner || "";
  els.githubRepo.value = githubSync.repo || "";
  els.githubBranch.value = githubSync.branch || "main";
  els.githubPath.value = githubSync.path || defaultGithubSyncConfig.path;
  els.githubToken.value = githubSync.token || "";
  els.githubAutoPull.checked = Boolean(githubSync.autoPull);
  els.githubAutoPush.checked = Boolean(githubSync.autoPush);
}

function readGithubInputs() {
  githubSync = {
    ...githubSync,
    owner: els.githubOwner.value.trim(),
    repo: els.githubRepo.value.trim(),
    branch: els.githubBranch.value.trim() || "main",
    path: els.githubPath.value.trim() || defaultGithubSyncConfig.path,
    token: els.githubToken.value.trim(),
    autoPull: els.githubAutoPull.checked,
    autoPush: els.githubAutoPush.checked,
  };
  saveGithubSyncConfig();
  updateGithubStatus();
}

function saveCustomHoliday() {
  const name = els.customHolidayName.value.trim();
  const start = els.customHolidayStart.value;
  const end = els.customHolidayEnd.value;
  const customHoliday = normalizeCustomHoliday({ name, start, end });

  if (!customHoliday) {
    els.holidayConfigStatus.textContent = "请填写假期名，并确认开始日期不晚于结束日期。";
    showToast("假期信息不完整");
    return;
  }

  state.customHoliday = customHoliday;
  saveState();
  activatePage("holiday");
  showToast("假期版已切换到自定义假期");
}

function renderHolidayConfig() {
  const customHoliday = state.customHoliday;
  els.customHolidayName.value = customHoliday?.name || "";
  els.customHolidayStart.value = customHoliday?.start || "";
  els.customHolidayEnd.value = customHoliday?.end || "";
  els.clearHolidayConfigBtn.disabled = !customHoliday;

  if (!customHoliday) {
    els.holidayConfigStatus.textContent = "未设置自定义假期，假期版使用内置节假日。";
    return;
  }

  const dates = getHolidayDates(customHoliday);
  els.holidayConfigStatus.textContent = `当前使用：${customHoliday.name}\n假日：${formatFullDate(dateFromKey(customHoliday.start))} 至 ${formatFullDate(dateFromKey(customHoliday.end))}\n假期版显示：${formatMonthDay(dates[0])} 至 ${formatMonthDay(dates[dates.length - 1])}`;
}

function updateGithubStatus(message) {
  const lines = [];
  if (message) lines.push(message);
  if (isGithubConfigured(false)) {
    lines.push(`目标：${githubSync.owner}/${githubSync.repo}@${githubSync.branch}:${githubSync.path}`);
    lines.push(githubSync.token ? "Token：已保存在本浏览器" : "Token：未填写；private_data 通常需要 token。");
    lines.push(githubSync.dirty ? "状态：本地有未推送修改" : "状态：本地已保存");
    if (githubSync.lastSyncedAt) {
      lines.push(`上次同步：${new Date(githubSync.lastSyncedAt).toLocaleString("zh-CN")}`);
    }
  } else {
    lines.push("未配置 GitHub 同步。填写 private_data 的读取/写入 token 后即可拉取或推送。");
  }
  els.githubStatus.textContent = lines.join("\n");
}

function setGithubBusy(isBusy) {
  githubRequestInFlight = isBusy;
  [els.saveData, els.githubSaveConfigBtn, els.githubPullBtn, els.githubPushBtn, els.githubClearBtn].forEach((button) => {
    button.disabled = isBusy;
  });
}

function markGithubDirty() {
  if (!githubSync) return;
  githubSync.dirty = true;
  saveGithubSyncConfig();
  updateGithubStatus();
  scheduleGithubAutoPush();
}

function scheduleGithubAutoPush() {
  window.clearTimeout(githubWriteTimer);
  if (!githubSync.autoPush || !isGithubConfigured()) return;
  updateGithubStatus("已记录本地修改，将在 6 秒后自动推送。");
  githubWriteTimer = window.setTimeout(() => pushToGithub({ auto: true }), 6000);
}

function githubContentApiUrl(includeRef = false) {
  const owner = encodeURIComponent(githubSync.owner);
  const repo = encodeURIComponent(githubSync.repo);
  const path = githubSync.path
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  const ref = includeRef ? `?ref=${encodeURIComponent(githubSync.branch)}` : "";
  return `${GITHUB_API_ROOT}/repos/${owner}/${repo}/contents/${path}${ref}`;
}

function githubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
  if (githubSync.token) headers.Authorization = `Bearer ${githubSync.token}`;
  return headers;
}

async function githubErrorMessage(response) {
  try {
    const body = await response.json();
    return body.message || response.statusText;
  } catch {
    return response.statusText;
  }
}

function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function base64ToUtf8(value) {
  const binary = atob(String(value || "").replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

async function githubReadContent() {
  const response = await fetch(githubContentApiUrl(true), { headers: githubHeaders() });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub ${response.status}: ${await githubErrorMessage(response)}`);
  }
  const payload = await response.json();
  let encodedContent = payload.content || "";
  if (!encodedContent && payload.git_url) {
    const blobResponse = await fetch(payload.git_url, { headers: githubHeaders() });
    if (!blobResponse.ok) {
      throw new Error(`GitHub ${blobResponse.status}: ${await githubErrorMessage(blobResponse)}`);
    }
    const blobPayload = await blobResponse.json();
    encodedContent = blobPayload.content || "";
  }
  if (!encodedContent) throw new Error("GitHub 返回的数据文件为空或无法读取。");
  return {
    sha: payload.sha,
    text: base64ToUtf8(encodedContent),
    htmlUrl: payload.html_url || "",
  };
}

async function githubWriteContent(content, sha) {
  const body = {
    message: `Update cycle planner ${new Date().toISOString()}`,
    content: utf8ToBase64(content),
    branch: githubSync.branch,
  };
  if (sha) body.sha = sha;
  const response = await fetch(githubContentApiUrl(false), {
    method: "PUT",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`GitHub ${response.status}: ${await githubErrorMessage(response)}`);
  }
  return response.json();
}

async function pullFromGithub(options = {}) {
  if (githubRequestInFlight) return;
  if (!options.auto) readGithubInputs();
  if (!isGithubConfigured()) {
    updateGithubStatus("请先填写完整 GitHub 配置和 token。");
    showToast("GitHub 配置不完整");
    return;
  }
  setGithubBusy(true);
  try {
    updateGithubStatus("正在拉取 private_data 中的 JSON...");
    const remote = await githubReadContent();
    if (!remote) {
      updateGithubStatus("远端 JSON 文件不存在。可以先推送当前数据创建文件。");
      if (!options.auto) showToast("远端文件不存在");
      return;
    }
    const remoteState = normalizeState(JSON.parse(remote.text));
    const localJson = JSON.stringify(normalizeState(state));
    const remoteJson = JSON.stringify(remoteState);
    if (options.auto && githubSync.dirty && localJson !== remoteJson) {
      updateGithubStatus("远端有更新，但本地也有未推送修改。请手动拉取或推送处理。");
      return;
    }
    if (localJson !== remoteJson && options.askBeforeReplace !== false) {
      const confirmed = window.confirm("远端 JSON 将替换当前浏览器数据。本地未推送的修改会丢失。继续？");
      if (!confirmed) {
        updateGithubStatus("已取消拉取。");
        return;
      }
    }
    state = remoteState;
    activePlanRange = normalizePlanRange(state.activePlanRange);
    githubSync.sha = remote.sha;
    githubSync.lastSyncedAt = new Date().toISOString();
    githubSync.dirty = false;
    saveGithubSyncConfig();
    saveState({ github: false });
    render();
    updateGithubStatus("已从 private_data 拉取最新数据。");
    if (!options.auto) showToast("已拉取远端数据");
  } catch (error) {
    console.error(error);
    updateGithubStatus(error.message);
    showToast("GitHub 拉取失败");
  } finally {
    setGithubBusy(false);
  }
}

async function pushToGithub(options = {}) {
  if (githubRequestInFlight) return;
  if (!options.auto) readGithubInputs();
  if (!isGithubConfigured()) {
    updateGithubStatus("请先填写完整 GitHub 配置和 token。");
    showToast("GitHub 配置不完整");
    return;
  }
  setGithubBusy(true);
  try {
    updateGithubStatus("正在读取 private_data 远端版本...");
    const remote = await githubReadContent();
    const content = JSON.stringify(normalizeState(state), null, 2);
    const remoteChanged = remote && githubSync.sha && remote.sha !== githubSync.sha;
    const firstPushWouldOverwrite = remote && !githubSync.sha && remote.text.trim() !== content.trim();
    if (remoteChanged || firstPushWouldOverwrite) {
      if (options.auto) {
        updateGithubStatus("远端 JSON 已变化，自动推送已暂停。请先手动拉取或确认覆盖。");
        return;
      }
      const confirmed = window.confirm("远端 JSON 已被更新。继续推送会覆盖远端内容。建议先拉取确认。仍要推送？");
      if (!confirmed) {
        updateGithubStatus("已取消推送。");
        return;
      }
    }
    if (remote && remote.text.trim() === content.trim()) {
      githubSync.sha = remote.sha;
      githubSync.lastSyncedAt = new Date().toISOString();
      githubSync.dirty = false;
      saveGithubSyncConfig();
      updateGithubStatus("远端已是最新，无需推送。");
      if (!options.auto) showToast("远端已是最新");
      return;
    }
    const result = await githubWriteContent(content, remote ? remote.sha : "");
    githubSync.sha = result.content?.sha || "";
    githubSync.lastSyncedAt = new Date().toISOString();
    githubSync.dirty = false;
    saveGithubSyncConfig();
    updateGithubStatus("已推送当前数据到 private_data。");
    showToast(options.auto ? "已自动推送到 private_data" : "已推送到 private_data");
  } catch (error) {
    console.error(error);
    updateGithubStatus(error.message);
    showToast("GitHub 推送失败");
  } finally {
    setGithubBusy(false);
  }
}

function createRegularPlan(dayCount) {
  return {
    focus: "",
    ...createPlan(dayCount),
  };
}

function createHolidayPlan(dayCount) {
  return createPlan(dayCount);
}

function createPeriodPlan() {
  const start = startOfWeek(dateFromKey(getBeijingDateKey()));
  const end = addDays(start, PERIOD_DEFAULT_DAYS - 1);
  return {
    title: "阶段规划",
    start: dateKey(start),
    end: dateKey(end),
    dayNotes: {},
  };
}

function createPlan(dayCount) {
  return {
    review: "",
    tasks: [],
    ideas: [],
    daySlots: createEmptyDaySlots(dayCount),
  };
}

function createEmptyDaySlots(dayCount = 7) {
  return Array.from({ length: dayCount }, () => ["", "", ""]);
}

function normalizeRegularPlan(plan, dayCount, dates = []) {
  if (typeof plan.focus !== "string") plan.focus = "";
  normalizePlan(plan, dayCount, dates);
}

function normalizeHolidayPlan(plan, dayCount, dates = []) {
  normalizePlan(plan, dayCount, dates);
}

function normalizePeriodPlan(input) {
  const fallback = createPeriodPlan();
  const source = input && typeof input === "object" ? input : {};
  const title = typeof source.title === "string" && source.title.trim()
    ? source.title.trim().slice(0, 32)
    : fallback.title;
  const start = isDateKey(source.start) ? source.start : fallback.start;
  let end = isDateKey(source.end) ? source.end : dateKey(addDays(dateFromKey(start), PERIOD_DEFAULT_DAYS - 1));

  if (start > end) end = dateKey(addDays(dateFromKey(start), PERIOD_DEFAULT_DAYS - 1));

  const dayCount = daysBetweenInclusive(start, end);
  if (dayCount < PERIOD_MIN_DAYS) {
    end = dateKey(addDays(dateFromKey(start), PERIOD_MIN_DAYS - 1));
  } else if (dayCount > PERIOD_MAX_DAYS) {
    end = dateKey(addDays(dateFromKey(start), PERIOD_MAX_DAYS - 1));
  }

  const dayNotes = {};
  if (source.dayNotes && typeof source.dayNotes === "object") {
    Object.entries(source.dayNotes).forEach(([key, value]) => {
      if (isDateKey(key) && typeof value === "string" && value.trim()) {
        dayNotes[key] = value.slice(0, 100);
      }
    });
  }

  return { title, start, end, dayNotes };
}

function normalizeDateSlots(input) {
  const slotsByDate = {};
  if (!input || typeof input !== "object") return slotsByDate;
  Object.entries(input).forEach(([key, slots]) => {
    if (!isDateKey(key) || !Array.isArray(slots)) return;
    const normalized = normalizeSlotArray(slots);
    if (normalized.some((slot) => slot.trim())) slotsByDate[key] = normalized;
  });
  return slotsByDate;
}

function migrateLegacyDateSlots(dateSlots, weeks, holidays, customHoliday) {
  Object.entries(weeks).forEach(([key, week]) => {
    if (!isDateKey(key)) return;
    getWeekDates(dateFromKey(key)).forEach((date, index) => {
      mergeDateSlots(dateSlots, dateKey(date), week.daySlots[index]);
    });
  });

  Object.entries(holidays).forEach(([id, plan]) => {
    const holiday = [...chinaHolidays, customHoliday].filter(Boolean).find((item) => item.id === id);
    if (!holiday) return;
    getHolidayDates(holiday).forEach((date, index) => {
      mergeDateSlots(dateSlots, dateKey(date), plan.daySlots[index]);
    });
  });
}

function mergeDateSlots(dateSlots, key, slots) {
  if (!isDateKey(key) || !Array.isArray(slots)) return;
  const normalized = normalizeSlotArray(slots);
  if (!normalized.some((slot) => slot.trim())) return;
  const shared = dateSlots[key] || ["", "", ""];
  normalized.forEach((value, index) => {
    if (!shared[index].trim() && value.trim()) shared[index] = value;
  });
  if (shared.some((slot) => slot.trim())) dateSlots[key] = shared;
}

function normalizeSlotArray(slots) {
  const source = Array.isArray(slots) ? slots : [];
  return Array.from({ length: slotLabels.length }, (_, index) => (
    typeof source[index] === "string" ? source[index] : ""
  ));
}

function normalizePlan(plan, dayCount, dates = []) {
  if (typeof plan.review !== "string") plan.review = "";
  if (!Array.isArray(plan.tasks)) plan.tasks = [];
  if (!Array.isArray(plan.ideas)) plan.ideas = [];
  if (!Array.isArray(plan.daySlots)) plan.daySlots = createEmptyDaySlots(dayCount);

  for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
    if (!Array.isArray(plan.daySlots[dayIndex])) plan.daySlots[dayIndex] = [];
    for (let slotIndex = 0; slotIndex < 3; slotIndex += 1) {
      if (typeof plan.daySlots[dayIndex][slotIndex] !== "string") {
        plan.daySlots[dayIndex][slotIndex] = "";
      }
    }
    plan.daySlots[dayIndex] = plan.daySlots[dayIndex].slice(0, 3);
  }
  plan.daySlots = plan.daySlots.slice(0, dayCount);

  const lastDate = [...dates].reverse().find(isValidDate);
  const fallbackDeadline = lastDate ? dateKey(lastDate) : getBeijingDateKey();
  plan.tasks = normalizeTasks(plan.tasks, dates, fallbackDeadline);
  plan.ideas = normalizeIdeas(plan.ideas, fallbackDeadline);
}

function compareTasks(a, b) {
  if (a.done !== b.done) return Number(a.done) - Number(b.done);
  const deadlineDiff = deadlineSortValue(a.deadline) - deadlineSortValue(b.deadline);
  if (deadlineDiff !== 0) return deadlineDiff;
  const priorityRank = { high: 0, normal: 1, low: 2 };
  const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
  if (priorityDiff !== 0) return priorityDiff;
  return new Date(a.createdAt) - new Date(b.createdAt);
}

function compareIdeas(a, b) {
  if (a.archived !== b.archived) return Number(a.archived) - Number(b.archived);
  const deadlineDiff = deadlineSortValue(a.deadline) - deadlineSortValue(b.deadline);
  if (deadlineDiff !== 0) return deadlineDiff;
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function deadlineSortValue(value) {
  return isDateKey(value) ? dateFromKey(value).getTime() : Number.MAX_SAFE_INTEGER;
}

function startOfWeek(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function getWeekDates(start) {
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function getDefaultPlanRange() {
  const start = dateFromKey(getBeijingDateKey());
  return {
    start: dateKey(start),
    end: dateKey(addDays(start, PLAN_DEFAULT_DAYS - 1)),
  };
}

function getInitialPlanRangeFallback(plans = {}) {
  const todayRange = getDefaultPlanRange();
  const today = dateFromKey(getBeijingDateKey());
  const currentWeekStart = startOfWeek(today);
  const currentWeekRange = {
    start: dateKey(currentWeekStart),
    end: dateKey(addDays(currentWeekStart, PLAN_DEFAULT_DAYS - 1)),
  };

  if (plans[planRangeKey(currentWeekRange)]) return currentWeekRange;
  if (plans[planRangeKey(todayRange)]) return todayRange;
  return todayRange;
}

function normalizePlanRange(input, fallback = getDefaultPlanRange()) {
  const source = input && typeof input === "object" ? input : {};
  const start = isDateKey(source.start) ? source.start : fallback.start;
  const end = isDateKey(source.end) ? source.end : fallback.end;
  if (!isDateKey(start) || !isDateKey(end) || start > end) return { ...fallback };
  return { start, end };
}

function planRangeKey(range) {
  const normalized = normalizePlanRange(range);
  return `${normalized.start}_${normalized.end}`;
}

function parsePlanRangeKey(key) {
  const parts = String(key || "").split("_");
  if (parts.length !== 2) return null;
  const [start, end] = parts;
  if (!isDateKey(start) || !isDateKey(end) || start > end) return null;
  return { start, end };
}

function getPlanDates(range) {
  const normalized = normalizePlanRange(range);
  const dates = [];
  const end = dateFromKey(normalized.end);
  for (let date = dateFromKey(normalized.start); date <= end; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

function getPeriodDates(plan = getPeriodPlan()) {
  const dates = [];
  const end = dateFromKey(plan.end);
  for (let date = dateFromKey(plan.start); date <= end; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

function getPeriodWeekStarts(dates) {
  if (!Array.isArray(dates) || dates.length === 0) return [];
  const starts = [];
  const finalWeekStart = startOfWeek(dates[dates.length - 1]);
  for (let weekStart = startOfWeek(dates[0]); weekStart <= finalWeekStart; weekStart = addDays(weekStart, 7)) {
    starts.push(weekStart);
  }
  return starts;
}

function getInitialActivePage() {
  if (getCurrentHoliday()) return "holiday";
  const saved = localStorage.getItem(ACTIVE_PAGE_KEY);
  return ["planner", "holiday", "period", "inbox", "notes", "sync"].includes(saved) ? saved : "planner";
}

function getCurrentHoliday(dateKey = getBeijingDateKey()) {
  if (state.customHoliday && dateKey >= state.customHoliday.start && dateKey <= state.customHoliday.end) {
    return state.customHoliday;
  }
  return chinaHolidays.find((holiday) => dateKey >= holiday.start && dateKey <= holiday.end);
}

function getHolidayById(id) {
  return [...chinaHolidays, state.customHoliday].filter(Boolean).find((holiday) => holiday.id === id);
}

function getDisplayHoliday() {
  if (state.customHoliday) return state.customHoliday;
  const todayKey = getBeijingDateKey();
  const currentHoliday = getCurrentHoliday(todayKey);
  if (currentHoliday) return currentHoliday;
  return chinaHolidays.find((holiday) => todayKey <= holiday.end) || chinaHolidays[chinaHolidays.length - 1];
}

function getHolidayDates(holiday) {
  const start = addDays(dateFromKey(holiday.start), -1);
  const end = dateFromKey(holiday.end);
  const dates = [];
  for (let date = start; date <= end; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

function getBeijingDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = dateFromKey(value);
  return dateKey(date) === value;
}

function daysBetweenInclusive(start, end) {
  const startDate = dateFromKey(start);
  const endDate = dateFromKey(end);
  return Math.round((endDate - startDate) / 86400000) + 1;
}

function dateKey(date) {
  if (!isValidDate(date)) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isTodayInBeijing(date) {
  if (!isValidDate(date)) return false;
  return dateKey(date) === getBeijingDateKey();
}

function createCustomHolidayId(name, start, end) {
  return `custom-${start}-${end}-${hashText(name).toString(36)}`;
}

function hashText(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function formatMonthDay(date) {
  if (!isValidDate(date)) return "";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatFullDate(date) {
  if (!isValidDate(date)) return "";
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatWeekday(date) {
  if (!isValidDate(date)) return "";
  const index = date.getDay() === 0 ? 6 : date.getDay() - 1;
  return dayNames[index];
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function formatTaskTiming(task, dates) {
  if (isDateKey(task.deadline)) {
    return formatDeadlineLabel(task.deadline);
  }
  return formatTaskDay(task, dates);
}

function formatDeadlineLabel(value) {
  if (!isDateKey(value)) return "截止未定";
  const date = dateFromKey(value);
  return `截止 ${formatWeekday(date)} ${formatMonthDay(date)}`;
}

function formatTaskDay(task, dates) {
  if (!Array.isArray(dates) || dates.length === 0) return "未定";
  const dayIndex = Number(task.day);
  if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex >= dates.length) return "未定";
  const date = dates?.[dayIndex];
  return date ? `${formatWeekday(date)} ${formatMonthDay(date)}` : dayNames[dayIndex] || "未定";
}

function updateActiveDateLabel(weekDates, holiday, holidayDates) {
  if (activePage === "sync") {
    els.activeDateLabel.textContent = "设置";
    return;
  }
  if (activePage === "inbox") {
    els.activeDateLabel.textContent = "想法和计划汇总";
    return;
  }
  if (activePage === "notes") {
    els.activeDateLabel.textContent = "笔记";
    return;
  }
  if (activePage === "period") {
    const plan = getPeriodPlan();
    els.activeDateLabel.textContent = `${plan.title} ${formatFullDate(dateFromKey(plan.start))} 至 ${formatFullDate(dateFromKey(plan.end))}`;
    return;
  }
  if (activePage === "holiday") {
    els.activeDateLabel.textContent = `${holiday.name} ${formatFullDate(holidayDates[0])} 至 ${formatFullDate(holidayDates[holidayDates.length - 1])}`;
    return;
  }
  els.activeDateLabel.textContent = `${formatFullDate(weekDates[0])} 至 ${formatFullDate(weekDates[weekDates.length - 1])}`;
}

function formatShortTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function isSameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function createId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function iconButton(className, label, icon) {
  const button = document.createElement("button");
  button.className = `icon-button ${className}`;
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.title = label;
  button.innerHTML = icon;
  return button;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 1800);
}

function plusIcon() {
  return '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 5v14M5 12h14" /></svg>';
}

function checkIcon() {
  return '<svg viewBox="0 0 24 24" focusable="false"><path d="m5 12 4 4L19 6" /></svg>';
}

function pencilIcon() {
  return '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>';
}

function trashIcon() {
  return '<svg viewBox="0 0 24 24" focusable="false"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-.7 13.2A2 2 0 0 1 16.3 21H7.7a2 2 0 0 1-2-1.8L5 6" /></svg>';
}
