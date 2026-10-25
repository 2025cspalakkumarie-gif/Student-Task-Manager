
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const message = document.getElementById("message");

let tasks = [];

try {
    tasks = JSON.parse(
        localStorage.getItem("studentTasks") || "[]"
    );

    if (!Array.isArray(tasks)) {
        tasks = [];
    }
} catch (error) {
    tasks = [];
}

function saveTasks() {
    localStorage.setItem("studentTasks", JSON.stringify(tasks));
}

function displayTasks() {
    taskList.innerHTML = "";

    tasks.forEach(function(task, index) {
        const li = document.createElement("li");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", "Mark task completed");

        const name = document.createElement("span");
        name.textContent = task.name;
        name.className = "task-name";

        if (task.completed) {
            name.classList.add("done");
        }

        checkbox.addEventListener("change", function() {
            tasks[index].completed = checkbox.checked;
            saveTasks();
            displayTasks();
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", function() {
            tasks.splice(index, 1);
            saveTasks();
            displayTasks();
            message.textContent = "Task deleted.";
        });

        li.append(checkbox, name, deleteButton);
        taskList.appendChild(li);
    });

    document.getElementById("total").textContent = tasks.length;

    document.getElementById("completed").textContent =
        tasks.filter(function(task) {
            return task.completed;
        }).length;
}

taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = taskInput.value.trim();

    if (name === "") {
        message.textContent = "Please enter a task.";
        return;
    }

    tasks.push({
        name: name,
        completed: false
    });

    saveTasks();
    displayTasks();

    taskInput.value = "";
    message.textContent = "Task added successfully!";
    taskInput.focus();
});

displayTasks();
