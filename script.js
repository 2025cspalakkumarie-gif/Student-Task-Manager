
// ==========================================
// STUDENT TASK MANAGER
// Main JavaScript Application
// ==========================================

const $ = (id) => document.getElementById(id);

const STORAGE = {
    tasks: "stm_tasks",
    goals: "stm_goals",
    notes: "stm_notes",
    sessions: "stm_sessions",
    theme: "stm_theme"
};

function loadData(key, fallback = []) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

let tasks = loadData(STORAGE.tasks);
let goals = loadData(STORAGE.goals);
let notes = loadData(STORAGE.notes);
let sessions = loadData(STORAGE.sessions);

function saveData() {
    localStorage.setItem(STORAGE.tasks, JSON.stringify(tasks));
    localStorage.setItem(STORAGE.goals, JSON.stringify(goals));
    localStorage.setItem(STORAGE.notes, JSON.stringify(notes));
    localStorage.setItem(STORAGE.sessions, JSON.stringify(sessions));
}

function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function todayString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    if (!dateString) return "No due date";

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function isOverdue(task) {
    return Boolean(
        task.dueDate &&
        task.dueDate < todayString() &&
        !task.completed
    );
}

// ==========================================
// NAVIGATION
// ==========================================

const pageTitles = {
    dashboard: ["Dashboard", "Welcome back! Here's your productivity overview."],
    tasks: ["My Tasks", "Manage your assignments and daily activities."],
    calendar: ["Calendar", "Plan your tasks and deadlines."],
    categories: ["Categories", "Organize your academic and personal work."],
    focus: ["Focus Mode", "Make every study session count."],
    goals: ["Goals & Habits", "Build consistency and achieve your goals."],
    analytics: ["Analytics & Reports", "Understand your productivity."],
    notes: ["Notes & Resources", "Keep important information organized."],
    settings: ["Settings", "Manage your application preferences."]
};

function navigateTo(page) {
    if (!pageTitles[page]) return;

    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.toggle("active", section.id === page);
    });

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    $("page-title").textContent = pageTitles[page][0];
    $("page-subtitle").textContent = pageTitles[page][1];

    if (page === "calendar") renderCalendar();
    if (page === "categories") renderCategories();
    if (page === "goals") renderGoals();
    if (page === "analytics") renderAnalytics();
    if (page === "notes") renderNotes();
}

document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
        navigateTo(button.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        navigateTo(button.dataset.go);
    });
});

// ==========================================
// TASK MANAGEMENT
// ==========================================

$("task-form").addEventListener("submit", event => {
    event.preventDefault();

    const title = $("task-title").value.trim();

    if (!title) return;

    const task = {
        id: createId(),
        title,
        category: $("task-category").value,
        priority: $("task-priority").value,
        dueDate: $("task-date").value,
        description: $("task-description").value.trim(),
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(task);
    saveData();

    event.target.reset();
    $("task-priority").value = "Medium";

    renderAll();
    alert("Task added successfully!");
});

function addTaskAction(id, action) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    if (action === "complete") {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
    }

    if (action === "delete") {
        if (!confirm("Are you sure you want to delete this task?")) return;
        tasks = tasks.filter(item => item.id !== id);
    }

    if (action === "edit") {
        const title = prompt("Enter the updated task title:", task.title);

        if (title === null || !title.trim()) return;

        task.title = title.trim();

        const description = prompt(
            "Enter the updated description:",
            task.description || ""
        );

        if (description !== null) {
            task.description = description.trim();
        }
    }

    saveData();
    renderAll();
}

function taskHTML(task, compact = false) {
    const overdue = isOverdue(task);

    return `
        <div class="task-item ${task.completed ? "completed" : ""}">
            <input
                type="checkbox"
                class="task-check"
                ${task.completed ? "checked" : ""}
                aria-label="Complete task"
                onchange="addTaskAction('${task.id}', 'complete')"
            >

            <div class="task-info">
                <strong>${escapeHTML(task.title)}</strong>
                <p>
                    ${escapeHTML(task.category)}
                    · ${escapeHTML(task.priority)} priority
                    · ${task.dueDate ? formatDate(task.dueDate) : "No due date"}
                </p>
                ${task.description && !compact
                    ? `<p>${escapeHTML(task.description)}</p>` : ""}
                ${overdue ? '<span class="task-badge">Overdue</span>' : ""}
            </div>

            ${!compact ? `
                <div class="task-actions">
                    <button onclick="addTaskAction('${task.id}', 'edit')">✏️</button>
                    <button onclick="addTaskAction('${task.id}', 'delete')">🗑️</button>
                </div>
            ` : ""}
        </div>
    `;
}

function renderTaskList() {
    const search = $("task-search").value.toLowerCase().trim();
    const filter = $("task-filter").value;
    const sort = $("task-sort").value;

    let filtered = tasks.filter(task => {
        const matchesSearch =
            task.title.toLowerCase().includes(search) ||
            task.category.toLowerCase().includes(search);

        if (!matchesSearch) return false;

        if (filter === "pending" && task.completed) return false;
        if (filter === "completed" && !task.completed) return false;
        if (filter === "overdue" && !isOverdue(task)) return false;

        return true;
    });

    if (sort === "newest") {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (sort === "oldest") {
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    if (sort === "priority") {
        const order = { High: 1, Medium: 2, Low: 3 };
        filtered.sort((a, b) => order[a.priority] - order[b.priority]);
    }

    if (sort === "date") {
        filtered.sort((a, b) =>
            (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31")
        );
    }

    $("task-list").innerHTML = filtered.length
        ? filtered.map(task => taskHTML(task)).join("")
        : '<div class="empty-state">No matching tasks found.</div>';
}

$("task-search").addEventListener("input", renderTaskList);
$("task-filter").addEventListener("change", renderTaskList);
$("task-sort").addEventListener("change", renderTaskList);

// ==========================================
// DASHBOARD
// ==========================================

function renderDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(isOverdue).length;
    const percentage = total ? Math.round((completed / total) * 100) : 0;

    $("total-tasks").textContent = total;
    $("completed-tasks").textContent = completed;
    $("pending-tasks").textContent = pending;
    $("overdue-tasks").textContent = overdue;

    $("progress-percent").textContent = percentage + "%";
    $("progress-completed").textContent = completed;
    $("progress-remaining").textContent = pending;

    $("progress-circle").style.background =
        `conic-gradient(var(--primary) ${percentage}%, #eceaf7 ${percentage}%)`;

    const recent = tasks.slice(0, 5);

    $("dashboard-task-list").innerHTML = recent.length
        ? recent.map(task => taskHTML(task, true)).join("")
        : '<div class="empty-state">No tasks yet. Create your first task!</div>';

    const upcoming = tasks
        .filter(task => !task.completed && task.dueDate && task.dueDate >= todayString())
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5);

    $("upcoming-deadlines").innerHTML = upcoming.length
        ? upcoming.map(task => taskHTML(task, true)).join("")
        : '<div class="empty-state">No upcoming deadlines.</div>';
}

// ==========================================
// CALENDAR
// ==========================================

let calendarDate = new Date();
let selectedDate = todayString();

function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    $("calendar-month").textContent = calendarDate.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let html = weekdays.map(day =>
        `<div class="calendar-weekday">${day}</div>`
    ).join("");

    for (let i = 0; i < firstDay; i++) {
        html += "<div></div>";
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const hasTask = tasks.some(task => task.dueDate === date);
        const selected = selectedDate === date;

        html += `
            <button class="calendar-day ${hasTask ? "has-task" : ""} ${selected ? "selected" : ""}"
                onclick="selectCalendarDate('${date}')">
                ${day}
            </button>
        `;
    }

    $("calendar-grid").innerHTML = html;
    renderCalendarDayTasks();
}

function selectCalendarDate(date) {
    selectedDate = date;
    renderCalendar();
}

function renderCalendarDayTasks() {
    const dayTasks = tasks.filter(task => task.dueDate === selectedDate);

    $("calendar-day-tasks").innerHTML = dayTasks.length
        ? `<p style="font-size:12px;margin-bottom:12px;">${formatDate(selectedDate)}</p>` +
          dayTasks.map(task => taskHTML(task)).join("")
        : '<div class="empty-state">No tasks scheduled for this date.</div>';
}

$("calendar-prev").addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
});

$("calendar-next").addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
});

// ==========================================
// CATEGORIES
// ==========================================

function renderCategories() {
    const categories = ["Study", "Assignment", "Project", "Personal", "Exam"];
    const icons = {
        Study: "📚",
        Assignment: "📝",
        Project: "💻",
        Personal: "🌟",
        Exam: "🎓"
    };

    $("category-grid").innerHTML = categories.map(category => {
        const categoryTasks = tasks.filter(task => task.category === category);
        const completed = categoryTasks.filter(task => task.completed).length;

        return `
            <article class="category-card">
                <div style="font-size:30px">${icons[category]}</div>
                <h3>${category}</h3>
                <p>${categoryTasks.length} total tasks</p>
                <p>${completed} completed · ${categoryTasks.length - completed} pending</p>
            </article>
        `;
    }).join("");
}

// ==========================================
// FOCUS TIMER
// ==========================================

let timerSeconds = 25 * 60;
let timerInterval = null;
let focusSessions = sessions.length;

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    $("focus-timer").textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    $("focus-session-count").textContent =
        `Completed sessions: ${focusSessions}`;
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function selectTimerMode(minutes, mode) {
    stopTimer();
    timerSeconds = minutes * 60;
    $("focus-mode-label").textContent = mode;
    updateTimerDisplay();

    document.querySelectorAll(".mode-button").forEach(button => {
        button.classList.toggle(
            "active",
            Number(button.dataset.minutes) === minutes
        );
    });
}

document.querySelectorAll(".mode-button").forEach(button => {
    button.addEventListener("click", () => {
        selectTimerMode(
            Number(button.dataset.minutes),
            button.dataset.mode
        );
    });
});

$("focus-start").addEventListener("click", () => {
    if (timerInterval) return;

    timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds--;
            updateTimerDisplay();
        } else {
            stopTimer();

            if ($("focus-mode-label").textContent === "Focus Session") {
                focusSessions++;
                sessions.push({
                    id: createId(),
                    completedAt: new Date().toISOString()
                });
                saveData();
            }

            updateTimerDisplay();
            alert("Timer completed! Great work.");
        }
    }, 1000);
});

$("focus-pause").addEventListener("click", stopTimer);

$("focus-reset").addEventListener("click", () => {
    const activeButton = document.querySelector(".mode-button.active");

    selectTimerMode(
        Number(activeButton.dataset.minutes),
        activeButton.dataset.mode
    );
});

// ==========================================
// GOALS
// ==========================================

$("goal-form").addEventListener("submit", event => {
    event.preventDefault();

    const title = $("goal-title").value.trim();
    const target = Number($("goal-target").value);

    if (!title || target < 1) return;

    goals.push({
        id: createId(),
        title,
        target,
        progress: 0
    });

    saveData();
    event.target.reset();
    $("goal-target").value = 7;
    renderGoals();
});

function renderGoals() {
    $("goal-list").innerHTML = goals.length
        ? goals.map(goal => {
            const percentage = Math.min(
                100,
                Math.round((goal.progress / goal.target) * 100)
            );

            return `
                <article class="goal-card">
                    <div style="font-size:25px">🎯</div>
                    <h3>${escapeHTML(goal.title)}</h3>
                    <p>${goal.progress} of ${goal.target} days completed</p>
                    <div style="height:8px;background:var(--border);border-radius:20px;margin:15px 0;overflow:hidden;">
                        <div style="height:100%;width:${percentage}%;background:var(--primary);border-radius:20px;"></div>
                    </div>
                    <p>${percentage}% completed</p>
                    <button class="secondary-button" onclick="updateGoal('${goal.id}')">+ Progress</button>
                    <button class="secondary-button" onclick="deleteGoal('${goal.id}')">Delete</button>
                </article>
            `;
        }).join("")
        : '<div class="empty-state">Create your first study goal!</div>';
}

function updateGoal(id) {
    const goal = goals.find(item => item.id === id);
    if (!goal || goal.progress >= goal.target) return;

    goal.progress++;
    saveData();
    renderGoals();
}

function deleteGoal(id) {
    if (!confirm("Delete this goal?")) return;

    goals = goals.filter(goal => goal.id !== id);
    saveData();
    renderGoals();
}

// ==========================================
// ANALYTICS AND REPORTS
// ==========================================

function renderAnalytics() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const percentage = total
        ? Math.round((completed / total) * 100)
        : 0;

    $("analytics-completion").textContent = percentage + "%";
    $("analytics-total").textContent = total;
    $("analytics-sessions").textContent = sessions.length;

    const categories = ["Study", "Assignment", "Project", "Personal", "Exam"];

    $("analytics-summary").innerHTML = categories.map(category => {
        const count = tasks.filter(task => task.category === category).length;
        const done = tasks.filter(
            task => task.category === category && task.completed
        ).length;

        return `
            <div style="margin-bottom:12px;">
                <strong>${category}</strong>
                <span style="float:right">${done}/${count} completed</span>
                <div style="height:7px;background:var(--border);border-radius:20px;margin-top:6px;overflow:hidden;">
                    <div style="height:100%;width:${count ? done / count * 100 : 0}%;background:var(--primary);"></div>
                </div>
            </div>
        `;
    }).join("");
}

$("export-report").addEventListener("click", () => {
    const report = [
        "STUDENT TASK MANAGER REPORT",
        "Generated: " + new Date().toLocaleString(),
        "",
        "Total tasks: " + tasks.length,
        "Completed: " + tasks.filter(task => task.completed).length,
        "Pending: " + tasks.filter(task => !task.completed).length,
        "Overdue: " + tasks.filter(isOverdue).length,
        "Focus sessions: " + sessions.length,
        "",
        "TASK DETAILS",
        ...tasks.map(task =>
            `${task.title} | ${task.category} | ${task.priority} | ${task.completed ? "Completed" : "Pending"} | ${task.dueDate || "No due date"}`
        )
    ].join("\n");

    downloadFile(report, "student-task-report.txt", "text/plain");
});

// ==========================================
// NOTES
// ==========================================

$("note-form").addEventListener("submit", event => {
    event.preventDefault();

    const title = $("note-title").value.trim();
    const content = $("note-content").value.trim();

    if (!title || !content) return;

    notes.unshift({
        id: createId(),
        title,
        content,
        createdAt: new Date().toISOString()
    });

    saveData();
    event.target.reset();
    renderNotes();
});

function renderNotes() {
    $("notes-list").innerHTML = notes.length
        ? notes.map(note => `
            <article class="note-card">
                <h3>📘 ${escapeHTML(note.title)}</h3>
                <p>${escapeHTML(note.content)}</p>
                <p style="margin-top:12px;">${new Date(note.createdAt).toLocaleDateString("en-IN")}</p>
                <button class="secondary-button" onclick="deleteNote('${note.id}')">Delete Note</button>
            </article>
        `).join("")
        : '<div class="empty-state">No notes saved yet.</div>';
}

function deleteNote(id) {
    if (!confirm("Delete this note?")) return;

    notes = notes.filter(note => note.id !== id);
    saveData();
    renderNotes();
}

// ==========================================
// THEME
// ==========================================

function applyTheme(theme) {
    document.body.classList.toggle("dark-theme", theme === "dark");
    $("theme-toggle").textContent = theme === "dark" ? "☀️" : "🌙";
    localStorage.setItem(STORAGE.theme, theme);
}

function toggleTheme() {
    const nextTheme = document.body.classList.contains("dark-theme")
        ? "light"
        : "dark";

    applyTheme(nextTheme);
}

$("theme-toggle").addEventListener("click", toggleTheme);
$("settings-theme-toggle").addEventListener("click", toggleTheme);

applyTheme(loadData(STORAGE.theme, "light"));

// ==========================================
// BACKUP AND RESTORE
// ==========================================

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

$("backup-data").addEventListener("click", () => {
    const backup = {
        tasks,
        goals,
        notes,
        sessions,
        theme: localStorage.getItem(STORAGE.theme) || "light"
    };

    downloadFile(
        JSON.stringify(backup, null, 2),
        "student-task-manager-backup.json",
        "application/json"
    );
});

$("restore-data").addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const backup = JSON.parse(reader.result);

            if (
                !backup ||
                !Array.isArray(backup.tasks) ||
                !Array.isArray(backup.goals) ||
                !Array.isArray(backup.notes) ||
                !Array.isArray(backup.sessions)
            ) {
                throw new Error("Invalid backup format");
            }

            if (!confirm("Restore this backup? Current application data will be replaced.")) {
                event.target.value = "";
                return;
            }

            tasks = backup.tasks;
            goals = backup.goals;
            notes = backup.notes;
            sessions = backup.sessions;

            saveData();
            applyTheme(backup.theme === "dark" ? "dark" : "light");
            renderAll();

            alert("Backup restored successfully!");
        } catch {
            alert("Unable to restore. Please select a valid Student Task Manager backup.");
        }

        event.target.value = "";
    };

    reader.readAsText(file);
});

// ==========================================
// REFRESH ALL APPLICATION SECTIONS
// ==========================================

function renderAll() {
    renderDashboard();
    renderTaskList();
    renderCategories();
    renderCalendar();
    renderGoals();
    renderAnalytics();
    renderNotes();
    updateTimerDisplay();
}

renderAll();
