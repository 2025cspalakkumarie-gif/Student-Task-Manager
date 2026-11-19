/* ==========================================
   STUDY ASSISTANT CHATBOT
   Local, dependency-free assistant.
   It reads the existing app data without changing it.
========================================== */

(() => {
    const toggle = document.getElementById("stm-chatbot-toggle");
    const panel = document.getElementById("stm-chatbot");
    const close = document.getElementById("stm-chatbot-close");
    const messages = document.getElementById("stm-chatbot-messages");
    const form = document.getElementById("stm-chatbot-form");
    const input = document.getElementById("stm-chatbot-input");
    const micButton = document.getElementById("stm-chatbot-mic");
    const voiceStatus = document.getElementById("stm-chatbot-voice-status");

    if (!toggle || !panel || !close || !messages || !form || !input) return;

    const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

    function addMessage(text, sender = "bot", allowHTML = false) {
        const message = document.createElement("div");
        message.className = `stm-chat-message ${sender}`;
        message.innerHTML = allowHTML ? text : escape(text);
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
    }

    function openChat() {
        panel.classList.add("open");
        panel.setAttribute("aria-hidden", "false");
        toggle.setAttribute("aria-expanded", "true");
        input.focus();
    }

    function closeChat() {
        panel.classList.remove("open");
        panel.setAttribute("aria-hidden", "true");
        toggle.setAttribute("aria-expanded", "false");
    }

    function getTasks() {
        try {
            return JSON.parse(localStorage.getItem("stm_tasks")) || [];
        } catch {
            return [];
        }
    }

    function getGoals() {
        try {
            return JSON.parse(localStorage.getItem("stm_goals")) || [];
        } catch {
            return [];
        }
    }

    function formatDueDate(dateString) {
        if (!dateString) return "No due date";
        const date = new Date(`${dateString}T00:00:00`);
        if (Number.isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short"
        });
    }

    function todayString() {
        const date = new Date();
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    function navigateTo(page) {
        const navButton = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (navButton) navButton.click();
    }

    function taskSummary() {
        const tasks = getTasks();
        if (!tasks.length) return "You don't have any tasks yet. You can add one from **My Tasks**.";

        const pending = tasks.filter(task => !task.completed);
        const completed = tasks.length - pending.length;

        let reply = `You have **${tasks.length} task${tasks.length === 1 ? "" : "s"}**: ${completed} completed and ${pending.length} pending.`;

        if (pending.length) {
            const visible = pending.slice(0, 5).map(task => {
                const title = escape(task.title || "Untitled task");
                const due = escape(formatDueDate(task.dueDate));
                return `<li><strong>${title}</strong> — ${due}</li>`;
            }).join("");
            reply += `<br><br><strong>Pending tasks:</strong><ul>${visible}</ul>`;
            if (pending.length > 5) reply += `<br>And ${pending.length - 5} more.`;
        }

        return reply;
    }

    function progressSummary() {
        const tasks = getTasks();
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const rate = total ? Math.round((completed / total) * 100) : 0;
        return `Your current task completion rate is **${rate}%** (${completed}/${total} completed). ${rate >= 75 ? "You're doing great — keep the momentum going!" : "Try finishing one small pending task next to build momentum."}`;
    }

    function todaySummary() {
        const tasks = getTasks();
        const today = todayString();
        const dueToday = tasks.filter(task => task.dueDate === today && !task.completed);
        const overdue = tasks.filter(task => task.dueDate && task.dueDate < today && !task.completed);

        if (!dueToday.length && !overdue.length) {
            return "You have no pending tasks due today, and nothing is overdue. Nice. ✨";
        }

        let reply = "";
        if (dueToday.length) {
            const list = dueToday.map(task => `<li>${escape(task.title || "Untitled task")}</li>`).join("");
            reply += `<strong>Due today:</strong><ul>${list}</ul>`;
        }
        if (overdue.length) {
            const list = overdue.slice(0, 5).map(task => `<li>${escape(task.title || "Untitled task")} — overdue</li>`).join("");
            reply += `${reply ? "<br>" : ""}<strong>Overdue:</strong><ul>${list}</ul>`;
        }
        return reply;
    }

    function goalsSummary() {
        const goals = getGoals();
        if (!goals.length) return "You don't have any goals added yet. Open **Goals & Habits** to create one.";
        const active = goals.filter(goal => !goal.completed);
        return `You have **${goals.length} goal${goals.length === 1 ? "" : "s"}** in total, with **${active.length}** still active. ${active.length ? "Pick one small action and work on it today." : "All your current goals are marked complete. 🎉"}`;
    }

    function getReply(raw) {
        const message = raw.toLowerCase().trim();

        if (!message) return "Type something and I'll help.";

        if (/^(hi|hello|hey|hii|helo)\b/.test(message)) {
            return "Hey! 👋 I'm your Study Assistant. I can help you check tasks, progress, goals, and focus sessions.";
        }

        if (message.includes("what tasks") || message.includes("my tasks") || message.includes("pending task") || message.includes("show task")) {
            return taskSummary();
        }

        if (message.includes("complete") || message.includes("progress") || message.includes("completion") || message.includes("how am i doing")) {
            return progressSummary();
        }

        if (message.includes("focus today") || message.includes("what should i study") || message.includes("what should i focus")) {
            const tasks = getTasks().filter(task => !task.completed);
            if (!tasks.length) return "You're all caught up! 🎉 Use this time for revision, practice questions, or your next goal.";
            const sorted = [...tasks].sort((a, b) => {
                const ad = a.dueDate || "9999-12-31";
                const bd = b.dueDate || "9999-12-31";
                return ad.localeCompare(bd);
            });
            const first = sorted[0];
            return `I'd start with **${escape(first.title || "your first pending task")}**${first.dueDate ? `, due ${escape(formatDueDate(first.dueDate))}` : ""}. Finish that before moving to the next task.`;
        }

        if (message.includes("today") || message.includes("due") || message.includes("deadline")) {
            return todaySummary();
        }

        if (message.includes("goal") || message.includes("habit")) {
            return goalsSummary();
        }

        if (message.includes("focus") || message.includes("pomodoro") || message.includes("concentrat")) {
            return "Try a distraction-free focus session. Open **Focus Mode**, choose a duration, and start the timer. I can also help you decide what task to work on first.";
        }

        if (message.includes("note") || message.includes("notes")) {
            return "Your notes are available in **Notes**. Add a short summary after each study session so revision becomes easier later.";
        }

        if (message.includes("motivat") || message.includes("tired") || message.includes("procrastinat")) {
            return "Don't aim for a perfect study session. Pick one task, set a short focus timer, and start for just 5 minutes. Starting is the hard part.";
        }

        if (message.includes("help") || message.includes("what can you do")) {
            return "I can help with:<ul><li>Checking your tasks and deadlines</li><li>Tracking completion progress</li><li>Checking goals</li><li>Suggesting a focus session</li><li>Giving simple study/productivity tips</li></ul>Try asking: <strong>What should I focus on today?</strong>";
        }

        return "I can help with your tasks, goals, progress, deadlines, notes, and Focus Mode. Try asking **What tasks do I have?** or **What should I focus on today?**";
    }

    function sendMessage(text) {
        const trimmed = text.trim();
        if (!trimmed) return;
        addMessage(trimmed, "user");
        input.value = "";

        window.setTimeout(() => {
            addMessage(getReply(trimmed), "bot", true);
        }, 180);
    }

    toggle.addEventListener("click", () => {
        if (panel.classList.contains("open")) closeChat();
        else openChat();
    });

    close.addEventListener("click", closeChat);

    form.addEventListener("submit", event => {
        event.preventDefault();
        sendMessage(input.value);
    });

    document.querySelectorAll("[data-chat-prompt]").forEach(button => {
        button.addEventListener("click", () => sendMessage(button.dataset.chatPrompt || ""));
    });

    // Browser-based speech-to-text dictation.
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isListening = false;

    function setVoiceStatus(message) {
        if (voiceStatus) voiceStatus.textContent = message;
    }

    if (micButton) {
        if (!SpeechRecognition) {
            micButton.disabled = true;
            micButton.title = "Voice dictation is not supported in this browser";
            setVoiceStatus("Voice dictation is unsupported here. Try Chrome or Edge on localhost/HTTPS.");
        } else {
            recognition = new SpeechRecognition();
            recognition.lang = "en-IN";
            recognition.continuous = false;
            recognition.interimResults = true;

            recognition.addEventListener("start", () => {
                isListening = true;
                micButton.classList.add("listening");
                micButton.setAttribute("aria-label", "Stop voice dictation");
                setVoiceStatus("Listening… speak now.");
            });

            recognition.addEventListener("result", event => {
                let finalText = "";
                let interimText = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) finalText += transcript;
                    else interimText += transcript;
                }
                if (finalText) {
                    input.value = `${input.value}${input.value ? " " : ""}${finalText}`.trim();
                }
                if (interimText) setVoiceStatus(`Hearing: ${interimText}`);
                else if (finalText) setVoiceStatus("Speech captured. Edit it or send it.");
            });

            recognition.addEventListener("error", event => {
                const errors = {
                    "not-allowed": "Microphone permission denied. Allow microphone access in browser settings.",
                    "no-speech": "No speech detected. Tap the microphone and try again.",
                    "audio-capture": "No microphone was found."
                };
                setVoiceStatus(errors[event.error] || `Voice input error: ${event.error}`);
            });

            recognition.addEventListener("end", () => {
                isListening = false;
                micButton.classList.remove("listening");
                micButton.setAttribute("aria-label", "Start voice dictation");
                if (voiceStatus.textContent === "Listening… speak now.") {
                    setVoiceStatus("Dictation ended. You can edit the text or send it.");
                }
                input.focus();
            });

            micButton.addEventListener("click", () => {
                if (isListening) {
                    recognition.stop();
                } else {
                    try {
                        recognition.start();
                    } catch (error) {
                        setVoiceStatus("Voice dictation is starting. Please wait.");
                    }
                }
            });
        }
    }

    addMessage("Hey! 👋 I'm your Study Assistant. Ask me about your tasks, progress, goals, or Focus Mode.", "bot", true);
})();
