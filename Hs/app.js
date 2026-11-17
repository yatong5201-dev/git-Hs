const STORAGE_KEY = "todo-app-items";

const form = document.querySelector("#composer");
const input = document.querySelector("#new-todo");
const list = document.querySelector("#list");
const empty = document.querySelector("#empty");
const summary = document.querySelector("#summary");
const clearDone = document.querySelector("#clear-done");
const filters = document.querySelectorAll(".filter");

let items = loadItems();
let filter = "all";

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  items.unshift({
    id: crypto.randomUUID(),
    text,
    done: false,
  });
  input.value = "";
  saveAndRender();
});

filters.forEach((button) => {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle("is-active", item === button));
    render();
  });
});

clearDone.addEventListener("click", () => {
  items = items.filter((item) => !item.done);
  saveAndRender();
});

list.addEventListener("click", (event) => {
  const row = event.target.closest(".item");
  if (!row) return;
  const id = row.dataset.id;
  const item = items.find((entry) => entry.id === id);
  if (!item) return;

  if (event.target.closest("[data-action='toggle']")) {
    item.done = !item.done;
    saveAndRender();
  }

  if (event.target.closest("[data-action='delete']")) {
    items = items.filter((entry) => entry.id !== id);
    saveAndRender();
  }

  if (event.target.closest("[data-action='edit']")) {
    startEdit(row, item);
  }
});

function startEdit(row, item) {
  const title = row.querySelector(".title");
  const editor = document.createElement("input");
  editor.className = "title-input";
  editor.value = item.text;
  editor.maxLength = 120;
  title.replaceWith(editor);
  editor.focus();
  editor.setSelectionRange(editor.value.length, editor.value.length);

  const finish = (save) => {
    const next = editor.value.trim();
    if (save && next) item.text = next;
    saveAndRender();
  };

  editor.addEventListener("keydown", (event) => {
    if (event.key === "Enter") finish(true);
    if (event.key === "Escape") finish(false);
  });
  editor.addEventListener("blur", () => finish(true));
}

function visibleItems() {
  if (filter === "active") return items.filter((item) => !item.done);
  if (filter === "done") return items.filter((item) => item.done);
  return items;
}

function render() {
  const visible = visibleItems();
  const remaining = items.filter((item) => !item.done).length;

  list.innerHTML = visible.map((item) => `
    <li class="item${item.done ? " is-done" : ""}" data-id="${item.id}">
      <button class="check" type="button" data-action="toggle" aria-label="切换完成">${item.done ? "✓" : ""}</button>
      <p class="title">${escapeHtml(item.text)}</p>
      <div class="actions">
        <button class="icon-btn" type="button" data-action="edit" aria-label="编辑">改</button>
        <button class="icon-btn" type="button" data-action="delete" aria-label="删除">删</button>
      </div>
    </li>
  `).join("");

  empty.hidden = visible.length > 0;
  empty.textContent = items.length === 0 ? "还没有待办，先加一件吧" : "这一栏还是空的";
  summary.textContent = remaining === 0
    ? (items.length === 0 ? "把今天要做的事记下来" : "全部完成了")
    : `还有 ${remaining} 件未完成`;
  clearDone.hidden = !items.some((item) => item.done);
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  render();
}

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => item && typeof item.text === "string" && typeof item.id === "string");
  } catch {
    return [];
  }
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

render();
