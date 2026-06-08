const themeToggle = document.getElementById("themeToggle");

(function initTheme() {
  if (localStorage.getItem("diary_theme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  }
})();

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("diary_theme", isDark ? "dark" : "light");
});

const entryInput = document.getElementById("entryInput");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const searchInput = document.getElementById("searchInput");
const entriesContainer = document.getElementById("entriesContainer");
const categorySelect = document.getElementById("categorySelect");
const tagsInput = document.getElementById("tagsInput");
const promptButtons = document.querySelectorAll(".prompt-btn");
const selectedPromptText = document.getElementById("selectedPromptText");
const selectedPromptWrapper = document.getElementById("selectedPrompt");
const clearPromptBtn = document.getElementById("clearPromptBtn");
const charCount = document.getElementById("charCount");

const STORAGE_KEY = "diary_entries";
const WORD_LIMIT = 150;
let selectedPrompt = "";
let editingId = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  displayEntries();
  saveBtn.addEventListener("click", saveEntry);
  clearBtn.addEventListener("click", clearInput);
  searchInput.addEventListener("input", filterEntries);
  promptButtons.forEach((button) => {
    button.addEventListener("click", () => usePrompt(button.dataset.prompt));
  });
  clearPromptBtn.addEventListener("click", clearPrompt);
  entryInput.addEventListener("input", updateWordCount);
  updateWordCount();
});

function saveEntry() {
  const text = entryInput.value.trim();

  if (!text) {
    alert("Please write something before saving!");
    return;
  }

  const wordCount = countWords(text);
  if (wordCount > WORD_LIMIT) {
    alert(
      `Your entry is ${wordCount} words. Please keep it under ${WORD_LIMIT} words.`,
    );
    return;
  }

  const entries = getEntries();

  if (editingId !== null) {
    const idx = entries.findIndex((e) => e.id === editingId);
    if (idx !== -1) {
      entries[idx].text = text;
      entries[idx].category = categorySelect.value;
      entries[idx].tags = parseTags(tagsInput.value);
      entries[idx].prompt = selectedPrompt;
      entries[idx].edited = new Date().toLocaleString();
    }
  } else {
    const newEntry = {
      id: Date.now(),
      text,
      date: new Date().toLocaleString(),
      category: categorySelect.value,
      tags: parseTags(tagsInput.value),
      prompt: selectedPrompt,
    };
    entries.unshift(newEntry);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  resetForm();
  displayEntries();
}

function getEntries() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function editEntry(id) {
  const entries = getEntries();
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;

  editingId = id;
  entryInput.value = entry.text;
  categorySelect.value = entry.category || "";
  tagsInput.value = (entry.tags || []).join(", ");
  if (entry.prompt) {
    usePrompt(entry.prompt);
  } else {
    clearPrompt();
  }
  saveBtn.textContent = "Update Entry";
  updateWordCount();
  entryInput.focus();
  entryInput.scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteEntry(id) {
  if (confirm("Are you sure you want to delete this entry?")) {
    let entries = getEntries();
    entries = entries.filter((entry) => entry.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    displayEntries();
  }
}

function displayEntries(entriesToShow = null) {
  const entries = entriesToShow || getEntries();
  entriesContainer.innerHTML = "";

  if (entries.length === 0) {
    entriesContainer.innerHTML =
      '<div class="empty-state">No entries yet. Start writing!</div>';
    return;
  }

  entries.forEach((entry) => {
    const entryEl = document.createElement("div");
    entryEl.className = "entry";
    entryEl.innerHTML = `
      <div class="entry-header">
        <div>
          <span class="entry-date">${escapeHtml(entry.date)}</span>
          ${entry.category ? `<span class="entry-category">${escapeHtml(entry.category)}</span>` : ""}
          ${entry.edited ? `<span class="entry-edited">edited ${escapeHtml(entry.edited)}</span>` : ""}
        </div>
        <div class="entry-actions">
          <button class="edit-btn" title="Edit entry" onclick="editEntry(${entry.id})">&#9998;</button>
          <button class="delete-btn" onclick="deleteEntry(${entry.id})">Delete</button>
        </div>
      </div>
      ${entry.prompt ? `<div class="entry-prompt">Prompt: ${escapeHtml(entry.prompt)}</div>` : ""}
      <div class="entry-text">${escapeHtml(entry.text)}</div>
      ${renderTags(entry.tags)}
    `;
    entriesContainer.appendChild(entryEl);
  });
}

function filterEntries() {
  const query = searchInput.value.toLowerCase();
  const entries = getEntries();
  const filtered = entries.filter((entry) => {
    const tagsText = (entry.tags || []).join(" ").toLowerCase();
    const categoryText = (entry.category || "").toLowerCase();
    const promptText = (entry.prompt || "").toLowerCase();

    return (
      entry.text.toLowerCase().includes(query) ||
      entry.date.toLowerCase().includes(query) ||
      categoryText.includes(query) ||
      tagsText.includes(query) ||
      promptText.includes(query)
    );
  });
  displayEntries(filtered);
}

function clearInput() {
  resetForm();
  entryInput.focus();
}

function resetForm() {
  editingId = null;
  saveBtn.textContent = "Save Entry";
  entryInput.value = "";
  categorySelect.value = "";
  tagsInput.value = "";
  clearPrompt();
  updateWordCount();
}

function parseTags(tagsValue) {
  return tagsValue
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function renderTags(tags = []) {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  return `
    <div class="entry-tags">
      ${tags
        .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
        .join("")}
    </div>
  `;
}

function usePrompt(prompt) {
  selectedPrompt = prompt;
  selectedPromptText.textContent = prompt;
  selectedPromptWrapper.classList.remove("hidden");
}

function clearPrompt() {
  selectedPrompt = "";
  selectedPromptText.textContent = "";
  selectedPromptWrapper.classList.add("hidden");
}

function countWords(text) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function updateWordCount() {
  const words = countWords(entryInput.value);
  charCount.textContent = `${words} word${words === 1 ? "" : "s"} out of ${WORD_LIMIT} words`;
  if (words > WORD_LIMIT) {
    charCount.classList.add("over-limit");
  } else if (words > WORD_LIMIT * 0.9) {
    charCount.classList.remove("over-limit");
    charCount.classList.add("near-limit");
  } else {
    charCount.classList.remove("over-limit", "near-limit");
  }
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}
