const { createClient } = window.supabase;
const supabaseConfig = window.supabaseConfig || {};

const STORAGE_KEY = "content-tracker-app-v1";
const META_KEY = "content-tracker-meta-v1";
const USER_META_ID = "default";
const STATUSES = [
  "Idea Capture",
  "Research & Validation",
  "Script Writing",
  "Recording / Voiceover",
  "Video Editing",
  "Thumbnail Design",
  "Upload & Publish"
];

const defaultTasksByStatus = {
  "Idea Capture": ["Research & Idea Validation (အချက်အလက်ရှာရန်)", "Script Writing", "Recording / Voiceover (အသံ/ဗီဒီယို သွင်းရန်)", "Video Editing", "Thumbnail Design", "Upload & Publish"],
  "Research & Validation": ["Script Writing", "Recording / Voiceover (အသံ/ဗီဒီယို သွင်းရန်)", "Video Editing (အယ်ဒစ်လုပ်ရန်)", "Thumbnail Design", "Upload & Publish"],
  "Script Writing": ["Script Writing", "Recording / Voiceover (အသံ/ဗီဒီယို သွင်းရန်)", "Video Editing (အယ်ဒစ်လုပ်ရန်)", "Thumbnail Design", "Upload & Publish"],
  "Recording / Voiceover": ["Recording / Voiceover (အသံ/ဗီဒီယို သွင်းရန်)", "Video Editing (အယ်ဒစ်လုပ်ရန်)", "Thumbnail Design", "Upload & Publish"],
  "Video Editing": ["Video Editing (အယ်ဒစ်လုပ်ရန်)", "Thumbnail Design", "Upload & Publish"],
  "Thumbnail Design": ["Thumbnail Design", "Upload & Publish"],
  "Upload & Publish": ["Upload content", "Write caption", "Publish and log metrics"]
};


const defaultWorkflowTasks = [
  "Research references",
  "Validate topic angle",
  "Write script outline",
  "Record footage or voiceover",
  "Edit final cut",
  "Design thumbnail",
  "Upload and publish"
];

const demoData = [
  {
    id: crypto.randomUUID(),
    title: "3 mistakes wasting editing time",
    description: "Short form reel with fast hook and examples.",
    category: "Productivity",
    project: "Growth Sprint",
    channel: "TikTok Main",
    platform: "TikTok",
    status: "Video Editing",
    priority: "High",
    createdAt: "2026-03-20",
    deadline: "2026-03-24",
    publishDate: "2026-03-25",
    tags: ["Trending", "Low Effort"],
    notes: "Need sharper intro. Attach CapCut template link later.",
    metrics: { views: 0, engagement: 0 },
    tasks: [
      { id: crypto.randomUUID(), title: "Research examples", done: true },
      { id: crypto.randomUUID(), title: "Write hook", done: true },
      { id: crypto.randomUUID(), title: "Edit final cut", done: false },
      { id: crypto.randomUUID(), title: "Polish transitions", done: false }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: "Monthly creator planning workflow",
    description: "HTML export demo + planning routine video.",
    category: "Workflow",
    project: "Creator OS",
    channel: "YouTube Longform",
    platform: "YouTube",
    status: "Research & Validation",
    priority: "Medium",
    createdAt: "2026-03-18",
    deadline: "2026-03-28",
    publishDate: "2026-03-30",
    tags: ["Template"],
    notes: "Show tracker dashboard and export screens.",
    metrics: { views: 0, engagement: 0 },
    tasks: [
      { id: crypto.randomUUID(), title: "Collect examples", done: true },
      { id: crypto.randomUUID(), title: "Plan outline", done: false }
    ]
  }
];

const state = {
  contents: loadContents(),
  currentView: "dashboard",
  meta: loadMeta(),
  filters: { project: "all", channel: "all" },
  cloud: { enabled: hasSupabaseConfig(), ready: false, session: null, user: null, client: null }
};

const elements = {
  statsGrid: document.getElementById("statsGrid"),
  board: document.getElementById("board"),
  contentList: document.getElementById("contentList"),
  calendarList: document.getElementById("calendarList"),
  quickAddForm: document.getElementById("quickAddForm"),
  contentModal: document.getElementById("contentModal"),
  contentForm: document.getElementById("contentForm"),
  modalTitle: document.getElementById("modalTitle"),
  statusFilter: document.getElementById("statusFilter"),
  monthFilter: document.getElementById("monthFilter"),
  globalProjectFilter: document.getElementById("globalProjectFilter"),
  globalChannelFilter: document.getElementById("globalChannelFilter"),
  contentProjectFilter: document.getElementById("contentProjectFilter"),
  contentChannelFilter: document.getElementById("contentChannelFilter"),
  contentSearch: document.getElementById("contentSearch"),
  quickProjectSelect: document.getElementById("quickProjectSelect"),
  quickChannelSelect: document.getElementById("quickChannelSelect"),
  modalProjectSelect: document.getElementById("modalProjectSelect"),
  modalChannelSelect: document.getElementById("modalChannelSelect"),
  exportProjectFilter: document.getElementById("exportProjectFilter"),
  exportChannelFilter: document.getElementById("exportChannelFilter"),
  exportStart: document.getElementById("exportStart"),
  exportEnd: document.getElementById("exportEnd"),
  exportMonth: document.getElementById("exportMonth"),
  deleteContentBtn: document.getElementById("deleteContentBtn"),
  authForm: document.getElementById("authForm"),
  authStatus: document.getElementById("authStatus"),
  authHint: document.getElementById("authHint"),
  authEmailField: document.getElementById("authEmailField"),
  authPasswordField: document.getElementById("authPasswordField"),
  authGuestActions: document.getElementById("authGuestActions"),
  authUserActions: document.getElementById("authUserActions"),
  loginBtn: document.getElementById("loginBtn"),
  registerBtn: document.getElementById("registerBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
};

bindEvents();
hydrateMetaFromContents();
renderSelectOptions();
render();
initializeCloud();

function hasSupabaseConfig() {
  return Boolean(supabaseConfig?.url && supabaseConfig?.anonKey);
}

function loadContents() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function loadMeta() {
  const saved = localStorage.getItem(META_KEY);
  return saved ? JSON.parse(saved) : { projects: ["General"], channels: ["General"] };
}

function saveContents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.contents));
}

function saveMeta() {
  localStorage.setItem(META_KEY, JSON.stringify(state.meta));
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });
  document.getElementById("openContentModal").addEventListener("click", () => openModal());
  document.getElementById("closeModal").addEventListener("click", () => elements.contentModal.close());
  document.getElementById("seedDemo").addEventListener("click", seedDemo);
  elements.quickAddForm.addEventListener("submit", handleQuickAdd);
  elements.contentForm.addEventListener("submit", handleSaveContent);
  elements.statusFilter.addEventListener("change", renderContentList);
  elements.monthFilter.addEventListener("change", renderContentList);
  elements.globalProjectFilter.addEventListener("change", handleGlobalFilterChange);
  elements.globalChannelFilter.addEventListener("change", handleGlobalFilterChange);
  elements.contentProjectFilter.addEventListener("change", renderContentList);
  elements.contentChannelFilter.addEventListener("change", renderContentList);
  elements.contentSearch.addEventListener("input", renderContentList);
  elements.exportMonth.addEventListener("change", syncExportMonth);
  elements.deleteContentBtn.addEventListener("click", handleDeleteContent);
  elements.loginBtn.addEventListener("click", () => handleAuth("login"));
  elements.registerBtn.addEventListener("click", () => handleAuth("register"));
  elements.logoutBtn.addEventListener("click", handleLogout);
  document.querySelectorAll("[data-meta-action]").forEach((button) => {
    button.addEventListener("click", () => handleMetaManagement(button));
  });
  document.getElementById("exportCsvBtn").addEventListener("click", () => exportData("csv"));
  document.getElementById("exportHtmlBtn").addEventListener("click", () => exportData("html"));
}

async function initializeCloud() {
  if (!window.supabase?.createClient) {
    updateAuthUi("Supabase script failed", "Check your internet connection and reload the page.");
    return;
  }

  if (!state.cloud.enabled) {
    updateAuthUi("Cloud setup required", "Add your Supabase URL and anon key in supabase-config.js.");
    return;
  }

  try {
    state.cloud.client = createClient(supabaseConfig.url, supabaseConfig.anonKey);
    state.cloud.ready = true;
    const { data, error } = await state.cloud.client.auth.getSession();
    if (error) throw error;
    await applySession(data.session);
    state.cloud.client.auth.onAuthStateChange(async (_event, session) => {
      await applySession(session);
    });
  } catch (error) {
    updateAuthUi("Cloud unavailable", error.message || "Failed to initialize Supabase.");
  }
}

async function applySession(session) {
  state.cloud.session = session;
  state.cloud.user = session?.user || null;
  syncAuthForms();
  setAuthLock(!state.cloud.user);

  if (!state.cloud.user) {
    syncAuthForms();
    updateAuthUi(
      state.cloud.ready ? "Not signed in" : "Cloud setup required",
      state.cloud.ready ? "Login or register to sync across devices." : "Add your Supabase credentials in supabase-config.js."
    );
    return;
  }

  updateAuthUi(`Signed in as ${state.cloud.user.email}`, "Cloud sync is active.");
  syncAuthForms();
  await loadCloudState();
}

function updateAuthUi(status, hint) {
  elements.authStatus.textContent = status;
  elements.authHint.textContent = hint;
}

function setAuthLock(locked) {
  document.body.classList.toggle("auth-locked", locked);
}

function syncAuthForms() {
  const signedIn = Boolean(state.cloud.user);
  elements.authEmailField.classList.toggle("hidden", signedIn);
  elements.authPasswordField.classList.toggle("hidden", signedIn);
  elements.authGuestActions.classList.toggle("hidden", signedIn);
  elements.authUserActions.classList.toggle("hidden", !signedIn);
  document.getElementById("authSection").classList.toggle("hidden", signedIn);
}

async function handleAuth(mode) {
  if (!state.cloud.ready) {
    window.alert("Set up Supabase in supabase-config.js first.");
    return;
  }

  const formData = new FormData(elements.authForm);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();
  if (!email || !password) {
    window.alert("Enter email and password first.");
    return;
  }

  try {
    if (mode === "login") {
      const { error } = await state.cloud.client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      updateAuthUi("Login successful", "Loading cloud data...");
      return;
    }

    const { error } = await state.cloud.client.auth.signUp({ email, password });
    if (error) throw error;
    updateAuthUi("Registration submitted", "Check your email if confirmation is enabled.");
  } catch (error) {
    window.alert(error.message || "Authentication failed.");
  }
}

async function handleLogout() {
  if (!state.cloud.ready) return;
  if (!window.confirm("Logout from this device?")) return;
  const { error } = await state.cloud.client.auth.signOut();
  if (error) {
    window.alert(error.message || "Logout failed.");
    return;
  }
  state.contents = loadContents();
  state.meta = loadMeta();
  hydrateMetaFromContents();
  renderSelectOptions();
  render();
}

async function loadCloudState() {
  if (!state.cloud.user) return;

  try {
    const [contentsResult, metaResult] = await Promise.all([
      state.cloud.client.from("contents").select("*").eq("user_id", state.cloud.user.id).order("updated_at", { ascending: false }),
      state.cloud.client.from("user_meta").select("*").eq("user_id", state.cloud.user.id).maybeSingle()
    ]);

    if (contentsResult.error) throw contentsResult.error;
    if (metaResult.error) throw metaResult.error;

    state.contents = (contentsResult.data || []).map(mapCloudContentToLocal);
    state.meta = metaResult.data
      ? {
          projects: uniqueValues(["General", ...(metaResult.data.projects || [])]),
          channels: uniqueValues(["General", ...(metaResult.data.channels || [])])
        }
      : loadMeta();

    hydrateMetaFromContents();
    saveContents();
    saveMeta();
    renderSelectOptions();
    render();
  } catch (error) {
    updateAuthUi(`Signed in as ${state.cloud.user.email}`, `Cloud load failed: ${error.message || "Unknown error"}`);
  }
}

function switchView(view) {
  state.currentView = view;
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  document.querySelectorAll(".view").forEach((panel) => panel.classList.toggle("active", panel.id === `${view}View`));
}

function render() {
  renderStats();
  renderBoard();
  renderContentList();
  renderCalendar();
  syncFilterControls();
}

function renderStats() {
  const filteredContents = getFilteredContents();
  const total = filteredContents.length;
  const posted = filteredContents.filter((item) => item.status === "Upload & Publish").length;
  const inProgress = filteredContents.filter((item) => item.status !== "Upload & Publish").length;
  const avg = total ? Math.round(filteredContents.reduce((sum, item) => sum + calculateProgress(item.tasks), 0) / total) : 0;
  const stats = [
    { label: "Total Content", value: total, note: "All ideas and posts" },
    { label: "In Progress", value: inProgress, note: "Still moving through workflow" },
    { label: "Posted", value: posted, note: "Ready and published" },
    { label: "Average Progress", value: `${avg}%`, note: "Across filtered content" }
  ];

  elements.statsGrid.innerHTML = stats.map((stat) => `
    <article class="stat-card">
      <p class="eyebrow">${stat.label}</p>
      <div class="stat-value">${stat.value}</div>
      <div class="muted">${stat.note}</div>
    </article>
  `).join("");
}

function renderBoard() {
  const filteredContents = getFilteredContents();
  elements.board.innerHTML = STATUSES.map((stage) => {
    const items = filteredContents.filter((item) => item.status === stage);
    return `
      <section class="column">
        <div class="column-head">
          <h4>${stage}</h4>
          <span class="column-count">${items.length}</span>
        </div>
        ${items.length ? items.map(renderPipelineCard).join("") : `<p class="muted">No content here yet.</p>`}
      </section>
    `;
  }).join("");
  wireCardEvents();
}

function renderContentList() {
  let items = [...getFilteredContents()];
  const status = elements.statusFilter.value;
  const month = elements.monthFilter.value;
  const project = elements.contentProjectFilter.value;
  const channel = elements.contentChannelFilter.value;
  const search = elements.contentSearch.value.trim().toLowerCase();

  if (status !== "all") items = items.filter((item) => item.status === status);
  if (project !== "all") items = items.filter((item) => item.project === project);
  if (channel !== "all") items = items.filter((item) => item.channel === channel);
  if (month) items = items.filter((item) => (item.deadline || item.createdAt || "").startsWith(month));
  if (search) items = items.filter((item) => searchableText(item).includes(search));

  elements.contentList.innerHTML = items.length
    ? items.map(renderCard).join("")
    : `<p class="muted">No content matched the current filters.</p>`;
  wireCardEvents();
  wireTaskEvents();
}

function renderCalendar() {
  const items = [...getFilteredContents()]
    .filter((item) => item.deadline || item.publishDate)
    .sort((a, b) => (a.deadline || a.publishDate).localeCompare(b.deadline || b.publishDate));

  elements.calendarList.innerHTML = items.length
    ? items.map((item) => `
      <article class="calendar-item">
        <div class="card-top">
          <strong>${item.title}</strong>
          <span class="badge">${item.platform}</span>
        </div>
        <div class="muted">Project: ${item.project || "General"}</div>
        <div class="muted">Channel: ${item.channel || "General"}</div>
        <div class="muted">Deadline: ${formatDate(item.deadline)}</div>
        <div class="muted">Publish: ${formatDate(item.publishDate)}</div>
        <div class="muted">Status: ${item.status}</div>
      </article>
    `).join("")
    : `<p class="muted">Add deadlines to see your calendar timeline.</p>`;
}

function renderCard(item) {
  const progress = calculateProgress(item.tasks);
  const color = progressColor(progress);
  return `
    <article class="content-card" data-id="${item.id}">
      <div class="card-top">
        <strong>${item.title}</strong>
        <span class="priority ${item.priority}">${item.priority}</span>
      </div>
      <div class="chip-row">
        <span class="chip project-chip">${item.project || "General"}</span>
        <span class="chip channel-chip">${item.channel || "General"}</span>
        <span class="badge">${item.platform}</span>
        <span class="chip status-chip ${statusChipClass(item.status)}">${item.status}</span>
      </div>
      <div class="muted">${item.description || "No description yet."}</div>
      <div class="progress-head">
        <span>Progress</span>
        <strong>${progress}%</strong>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${progress}%;background:${color};"></div></div>
      <div class="task-list">
        ${item.tasks.map((task) => `
          <label class="task-item">
            <input type="checkbox" data-task-id="${task.id}" data-content-id="${item.id}" ${task.done ? "checked" : ""}>
            <span>${task.title}</span>
          </label>
        `).join("")}
      </div>
      <button class="ghost-btn edit-btn" data-id="${item.id}">Edit</button>
    </article>
  `;
}

function renderPipelineCard(item) {
  const progress = calculateProgress(item.tasks);
  const color = progressColor(progress);
  return `
    <article class="pipeline-card" data-id="${item.id}">
      <div class="card-top">
        <strong>${item.title}</strong>
        <strong>${progress}%</strong>
      </div>
      <div class="chip-row">
        <span class="chip project-chip">${item.project || "General"}</span>
        <span class="chip channel-chip">${item.channel || "General"}</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${progress}%;background:${color};"></div></div>
    </article>
  `;
}

async function handleQuickAdd(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const project = resolveMetaValue(formData.get("project"), formData.get("newProject"), "projects");
  const channel = resolveMetaValue(formData.get("channel"), formData.get("newChannel"), "channels");
  const content = {
    id: crypto.randomUUID(),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    project,
    channel,
    platform: String(formData.get("platform") || "TikTok"),
    status: "Idea Capture",
    priority: "Medium",
    createdAt: today(),
    deadline: String(formData.get("deadline") || ""),
    publishDate: "",
    tags: [],
    notes: "",
    metrics: { views: 0, engagement: 0 },
    tasks: defaultWorkflowTasks.map((taskTitle) => ({ id: crypto.randomUUID(), title: taskTitle, done: false }))
  };

  state.contents.unshift(content);
  await persistState({ type: "upsert-content", content });
  renderSelectOptions();
  event.currentTarget.reset();
  render();
  switchView("contents");
}

function openModal(id = null) {
  elements.contentForm.reset();
  renderSelectOptions();
  if (!id) {
    elements.modalTitle.textContent = "New Content";
    elements.contentForm.elements.id.value = "";
    elements.contentForm.elements.project.value = state.filters.project === "all" ? "General" : state.filters.project;
    elements.contentForm.elements.channel.value = state.filters.channel === "all" ? "General" : state.filters.channel;
    elements.deleteContentBtn.classList.add("hidden");
    elements.contentModal.showModal();
    return;
  }

  const item = state.contents.find((content) => content.id === id);
  if (!item) return;

  elements.modalTitle.textContent = "Edit Content";
  elements.contentForm.elements.id.value = item.id;
  elements.deleteContentBtn.classList.remove("hidden");
  elements.contentForm.elements.title.value = item.title;
  elements.contentForm.elements.platform.value = item.platform;
  elements.contentForm.elements.category.value = item.category || "";
  elements.contentForm.elements.project.value = item.project || "General";
  elements.contentForm.elements.channel.value = item.channel || "General";
  elements.contentForm.elements.priority.value = item.priority || "Medium";
  elements.contentForm.elements.status.value = item.status;
  elements.contentForm.elements.deadline.value = item.deadline || "";
  elements.contentForm.elements.publishDate.value = item.publishDate || "";
  elements.contentForm.elements.tags.value = (item.tags || []).join(", ");
  elements.contentForm.elements.description.value = item.description || "";
  elements.contentForm.elements.notes.value = item.notes || "";
  elements.contentForm.elements.tasksText.value = item.tasks.map((task) => task.title).join("\n");
  elements.contentModal.showModal();
}

async function handleSaveContent(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const id = String(formData.get("id") || crypto.randomUUID());
  const existing = state.contents.find((item) => item.id === id);
  const previousTasks = existing?.tasks || [];
  const project = resolveMetaValue(formData.get("project"), formData.get("newProject"), "projects");
  const channel = resolveMetaValue(formData.get("channel"), formData.get("newChannel"), "channels");
  const taskLines = String(formData.get("tasksText") || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const tasks = taskLines.map((title) => previousTasks.find((task) => task.title === title) || { id: crypto.randomUUID(), title, done: false });
  const status = String(formData.get("status") || "Idea Capture");

  const content = {
    id,
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    project,
    channel,
    platform: String(formData.get("platform") || "TikTok"),
    status,
    priority: String(formData.get("priority") || "Medium"),
    createdAt: existing?.createdAt || today(),
    deadline: String(formData.get("deadline") || ""),
    publishDate: String(formData.get("publishDate") || ""),
    tags: String(formData.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    notes: String(formData.get("notes") || "").trim(),
    metrics: existing?.metrics || { views: 0, engagement: 0 },
    tasks: tasks.length ? tasks : defaultTasksByStatus[status].map((taskTitle) => ({ id: crypto.randomUUID(), title: taskTitle, done: false }))
  };

  state.contents = existing ? state.contents.map((item) => item.id === id ? content : item) : [content, ...state.contents];
  await persistState({ type: "upsert-content", content });
  renderSelectOptions();
  elements.contentModal.close();
  render();
}

function wireCardEvents() {
  document.querySelectorAll(".pipeline-card").forEach((card) => card.addEventListener("click", () => openModal(card.dataset.id)));
  document.querySelectorAll(".edit-btn").forEach((button) => button.addEventListener("click", () => openModal(button.dataset.id)));
}

function wireTaskEvents() {
  document.querySelectorAll(".task-item input[type='checkbox']").forEach((input) => {
    input.addEventListener("change", async () => {
      const content = state.contents.find((item) => item.id === input.dataset.contentId);
      const task = content?.tasks.find((entry) => entry.id === input.dataset.taskId);
      if (!content || !task) return;
      task.done = input.checked;
      await persistState({ type: "upsert-content", content });
      render();
    });
  });
}

function calculateProgress(tasks = []) {
  return tasks.length ? Math.round((tasks.filter((task) => task.done).length / tasks.length) * 100) : 0;
}

function progressColor(progress) {
  if (progress <= 30) return "linear-gradient(90deg, #ef4444, #f97316)";
  if (progress <= 70) return "linear-gradient(90deg, #f59e0b, #facc15)";
  return "linear-gradient(90deg, #22c55e, #16a34a)";
}

function plainProgressColor(progress) {
  if (progress <= 30) return "#ef4444";
  if (progress <= 70) return "#f59e0b";
  return "#16a34a";
}

async function seedDemo() {
  state.contents = demoData;
  hydrateMetaFromContents();
  await persistState({ type: "full-sync" });
  renderSelectOptions();
  render();
}

function syncExportMonth() {
  if (!elements.exportMonth.value) return;
  const [year, month] = elements.exportMonth.value.split("-");
  elements.exportStart.value = `${year}-${month}-01`;
  const endDate = new Date(Number(year), Number(month), 0);
  elements.exportEnd.value = `${year}-${month}-${String(endDate.getDate()).padStart(2, "0")}`;
}

function exportData(type) {
  const filtered = getExportData();
  if (type === "csv") {
    const headers = ["Title", "Platform", "Category", "Project", "Channel", "Status", "Priority", "Progress", "Created At", "Deadline", "Publish Date", "Completed Tasks", "Remaining Tasks", "Tags"];
    const rows = filtered.map((item) => [
      item.title, item.platform, item.category, item.project || "General", item.channel || "General", item.status, item.priority,
      `${calculateProgress(item.tasks)}%`, item.createdAt, item.deadline, item.publishDate,
      item.tasks.filter((task) => task.done).length, item.tasks.filter((task) => !task.done).length, item.tags.join(" | ")
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    downloadFile(csv, "content-tracker-export.csv", "text/csv;charset=utf-8;");
    return;
  }

  const total = filtered.length;
  const completed = filtered.filter((item) => item.status === "Upload & Publish").length;
  const average = total ? Math.round(filtered.reduce((sum, item) => sum + calculateProgress(item.tasks), 0) / total) : 0;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Content Tracker Export</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#1f2937}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}.card,.item{border:1px solid #e5e7eb;border-radius:16px;padding:16px}.list{display:grid;gap:12px}.bar{height:10px;border-radius:999px;background:#e5e7eb;overflow:hidden}.fill{height:100%}</style></head><body><h1>Content Tracker Report</h1><div class="cards"><div class="card"><strong>Total</strong><div>${total}</div></div><div class="card"><strong>Posted</strong><div>${completed}</div></div><div class="card"><strong>Average Progress</strong><div>${average}%</div></div></div><div class="list">${filtered.map((item) => { const progress = calculateProgress(item.tasks); return `<div class="item"><h3>${item.title}</h3><div>${item.project || "General"} | ${item.channel || "General"} | ${item.platform}</div><div>${item.status} | ${item.priority}</div><div>Deadline: ${item.deadline || "-"}</div><div class="bar"><div class="fill" style="width:${progress}%;background:${plainProgressColor(progress)}"></div></div><div>${progress}% complete</div></div>`; }).join("")}</div></body></html>`;
  downloadFile(html, "content-tracker-export.html", "text/html;charset=utf-8;");
}

function getExportData() {
  const start = elements.exportStart.value;
  const end = elements.exportEnd.value;
  const project = elements.exportProjectFilter.value;
  const channel = elements.exportChannelFilter.value;
  return state.contents.filter((item) => {
    const baseDate = item.deadline || item.createdAt;
    if (project !== "all" && item.project !== project) return false;
    if (channel !== "all" && item.channel !== channel) return false;
    if (!start && !end) return true;
    if (start && baseDate < start) return false;
    if (end && baseDate > end) return false;
    return true;
  });
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function formatDate(value) {
  return value || "-";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function handleDeleteContent() {
  const id = elements.contentForm.elements.id.value;
  const item = state.contents.find((content) => content.id === id);
  if (!item) return;
  if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
  state.contents = state.contents.filter((content) => content.id !== id);
  await persistState({ type: "delete-content", id });
  elements.contentModal.close();
  render();
}

function hydrateMetaFromContents() {
  state.meta.projects = uniqueValues(["General", ...state.meta.projects, ...state.contents.map((item) => item.project).filter(Boolean)]);
  state.meta.channels = uniqueValues(["General", ...state.meta.channels, ...state.contents.map((item) => item.channel).filter(Boolean)]);
}

function renderSelectOptions() {
  fillSelect(elements.globalProjectFilter, state.meta.projects, true);
  fillSelect(elements.globalChannelFilter, state.meta.channels, true);
  fillSelect(elements.contentProjectFilter, state.meta.projects, true);
  fillSelect(elements.contentChannelFilter, state.meta.channels, true);
  fillSelect(elements.exportProjectFilter, state.meta.projects, true);
  fillSelect(elements.exportChannelFilter, state.meta.channels, true);
  fillSelect(elements.quickProjectSelect, state.meta.projects, false);
  fillSelect(elements.quickChannelSelect, state.meta.channels, false);
  fillSelect(elements.modalProjectSelect, state.meta.projects, false);
  fillSelect(elements.modalChannelSelect, state.meta.channels, false);
}

function fillSelect(select, values, includeAll) {
  const previous = select.value;
  const options = includeAll ? ["all", ...values] : values;
  select.innerHTML = options.map((value) => `<option value="${value}">${value === "all" ? "All" : value}</option>`).join("");
  if (options.includes(previous)) select.value = previous;
}

function syncFilterControls() {
  elements.globalProjectFilter.value = state.filters.project;
  elements.globalChannelFilter.value = state.filters.channel;
  if (!elements.contentProjectFilter.value) elements.contentProjectFilter.value = "all";
  if (!elements.contentChannelFilter.value) elements.contentChannelFilter.value = "all";
  if (!elements.exportProjectFilter.value) elements.exportProjectFilter.value = "all";
  if (!elements.exportChannelFilter.value) elements.exportChannelFilter.value = "all";
}

function handleGlobalFilterChange() {
  state.filters.project = elements.globalProjectFilter.value;
  state.filters.channel = elements.globalChannelFilter.value;
  render();
}

function getFilteredContents() {
  return state.contents.filter((item) => {
    if (state.filters.project !== "all" && item.project !== state.filters.project) return false;
    if (state.filters.channel !== "all" && item.channel !== state.filters.channel) return false;
    return true;
  });
}

function resolveMetaValue(selectedValue, newValue, type) {
  const cleanNewValue = String(newValue || "").trim();
  if (cleanNewValue) {
    state.meta[type] = uniqueValues([...state.meta[type], cleanNewValue]);
    return cleanNewValue;
  }
  const fallback = String(selectedValue || "").trim() || "General";
  state.meta[type] = uniqueValues([...state.meta[type], fallback]);
  return fallback;
}

function uniqueValues(values) {
  return [...new Set(values)];
}

function searchableText(item) {
  return [item.title, item.description, item.notes, item.project, item.channel, item.platform, item.status, ...(item.tags || [])].join(" ").toLowerCase();
}

function statusChipClass(status) {
  return status === "Upload & Publish" ? "done" : "active";
}

function handleMetaManagement(button) {
  const action = button.dataset.metaAction;
  const type = button.dataset.metaType;
  const select = document.getElementById(button.dataset.selectTarget);
  if (!select || !select.value) {
    window.alert("Choose a value first.");
    return;
  }
  if (action === "rename") {
    renameMetaValue(type, select.value);
    return;
  }
  if (action === "delete") deleteMetaValue(type, select.value);
}

async function renameMetaValue(type, oldValue) {
  if (oldValue === "General") {
    window.alert("General cannot be renamed.");
    return;
  }
  const label = metaLabel(type);
  const nextValue = window.prompt(`Rename ${label} "${oldValue}" to:`, oldValue);
  if (nextValue === null) return;
  const cleanValue = nextValue.trim();
  if (!cleanValue || cleanValue === oldValue) return;
  if (state.meta[type].includes(cleanValue)) {
    window.alert(`${label} already exists.`);
    return;
  }
  if (!window.confirm(`Rename ${label} "${oldValue}" to "${cleanValue}"?`)) return;
  state.meta[type] = state.meta[type].map((value) => value === oldValue ? cleanValue : value);
  const field = singularMetaField(type);
  state.contents = state.contents.map((item) => item[field] === oldValue ? { ...item, [field]: cleanValue } : item);
  updateFilterSelectionsAfterRename(field, oldValue, cleanValue);
  await persistState({ type: "meta-update" });
  renderSelectOptions();
  render();
}

async function deleteMetaValue(type, valueToDelete) {
  if (valueToDelete === "General") {
    window.alert("General cannot be deleted.");
    return;
  }
  const label = metaLabel(type);
  if (!window.confirm(`Delete ${label} "${valueToDelete}"? Related content will move to General.`)) return;
  state.meta[type] = state.meta[type].filter((value) => value !== valueToDelete);
  const field = singularMetaField(type);
  state.contents = state.contents.map((item) => item[field] === valueToDelete ? { ...item, [field]: "General" } : item);
  updateFilterSelectionsAfterDelete(field, valueToDelete);
  await persistState({ type: "meta-update" });
  renderSelectOptions();
  render();
}

function singularMetaField(type) {
  return type === "projects" ? "project" : "channel";
}

function metaLabel(type) {
  return type === "projects" ? "project" : "channel";
}

function updateFilterSelectionsAfterRename(field, oldValue, newValue) {
  if (field === "project") {
    if (state.filters.project === oldValue) state.filters.project = newValue;
    if (elements.contentProjectFilter.value === oldValue) elements.contentProjectFilter.value = newValue;
    if (elements.exportProjectFilter.value === oldValue) elements.exportProjectFilter.value = newValue;
    if (elements.quickProjectSelect.value === oldValue) elements.quickProjectSelect.value = newValue;
    if (elements.modalProjectSelect.value === oldValue) elements.modalProjectSelect.value = newValue;
    return;
  }
  if (state.filters.channel === oldValue) state.filters.channel = newValue;
  if (elements.contentChannelFilter.value === oldValue) elements.contentChannelFilter.value = newValue;
  if (elements.exportChannelFilter.value === oldValue) elements.exportChannelFilter.value = newValue;
  if (elements.quickChannelSelect.value === oldValue) elements.quickChannelSelect.value = newValue;
  if (elements.modalChannelSelect.value === oldValue) elements.modalChannelSelect.value = newValue;
}

function updateFilterSelectionsAfterDelete(field, deletedValue) {
  if (field === "project") {
    if (state.filters.project === deletedValue) state.filters.project = "all";
    if (elements.contentProjectFilter.value === deletedValue) elements.contentProjectFilter.value = "all";
    if (elements.exportProjectFilter.value === deletedValue) elements.exportProjectFilter.value = "all";
    if (elements.quickProjectSelect.value === deletedValue) elements.quickProjectSelect.value = "General";
    if (elements.modalProjectSelect.value === deletedValue) elements.modalProjectSelect.value = "General";
    return;
  }
  if (state.filters.channel === deletedValue) state.filters.channel = "all";
  if (elements.contentChannelFilter.value === deletedValue) elements.contentChannelFilter.value = "all";
  if (elements.exportChannelFilter.value === deletedValue) elements.exportChannelFilter.value = "all";
  if (elements.quickChannelSelect.value === deletedValue) elements.quickChannelSelect.value = "General";
  if (elements.modalChannelSelect.value === deletedValue) elements.modalChannelSelect.value = "General";
}

async function persistState(action) {
  saveContents();
  saveMeta();
  if (!state.cloud.user || !state.cloud.ready) return;

  try {
    await saveMetaToCloud();
    if (action.type === "delete-content") {
      const { error } = await state.cloud.client.from("contents").delete().eq("id", action.id).eq("user_id", state.cloud.user.id);
      if (error) throw error;
      return;
    }
    if (action.type === "upsert-content") {
      const { error } = await state.cloud.client.from("contents").upsert(mapLocalContentToCloud(action.content, state.cloud.user.id), { onConflict: "id" });
      if (error) throw error;
      return;
    }
    if (action.type === "full-sync" || action.type === "meta-update") {
      const { error: deleteError } = await state.cloud.client.from("contents").delete().eq("user_id", state.cloud.user.id);
      if (deleteError) throw deleteError;
      if (state.contents.length) {
        const payload = state.contents.map((item) => mapLocalContentToCloud(item, state.cloud.user.id));
        const { error: insertError } = await state.cloud.client.from("contents").insert(payload);
        if (insertError) throw insertError;
      }
    }
  } catch (error) {
    updateAuthUi(`Signed in as ${state.cloud.user.email}`, `Cloud sync failed: ${error.message || "Unknown error"}`);
  }
}

async function saveMetaToCloud() {
  const payload = { id: USER_META_ID, user_id: state.cloud.user.id, projects: state.meta.projects, channels: state.meta.channels, updated_at: new Date().toISOString() };
  const { error } = await state.cloud.client.from("user_meta").upsert(payload, { onConflict: "user_id" });
  if (error) throw error;
}

function mapLocalContentToCloud(content, userId) {
  return {
    id: content.id,
    user_id: userId,
    title: content.title,
    description: content.description,
    category: content.category,
    project: content.project,
    channel: content.channel,
    platform: content.platform,
    status: content.status,
    priority: content.priority,
    created_at: content.createdAt,
    deadline: content.deadline || null,
    publish_date: content.publishDate || null,
    tags: content.tags || [],
    notes: content.notes || "",
    metrics: content.metrics || {},
    tasks: content.tasks || [],
    updated_at: new Date().toISOString()
  };
}

function mapCloudContentToLocal(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    category: row.category || "",
    project: row.project || "General",
    channel: row.channel || "General",
    platform: row.platform || "TikTok",
    status: row.status || "Idea Capture",
    priority: row.priority || "Medium",
    createdAt: row.created_at || today(),
    deadline: row.deadline || "",
    publishDate: row.publish_date || "",
    tags: row.tags || [],
    notes: row.notes || "",
    metrics: row.metrics || { views: 0, engagement: 0 },
    tasks: row.tasks || []
  };
}
