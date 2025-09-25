class TodoApp {
  constructor() {
    this.taskInput = document.getElementById("taskInput");
    this.addTaskBtn = document.getElementById("addTaskBtn");
    this.taskList = document.getElementById("taskList");
    this.taskCount = document.getElementById("taskCount");
    this.emptyState = document.getElementById("emptyState");

    this.tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    // Création du canal pour la synchro temps réel
    this.channel = new BroadcastChannel("todo-sync");
    this.channel.onmessage = (event) => {
      if (event.data === "update") {
        this.tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        this.renderTasks();
        this.updateTaskCount();
        console.log("🔄 Tâches synchronisées depuis une autre instance");
      }
    };

    this.init();
  }

  init() {
    this.renderTasks();
    this.bindEvents();
    this.updateTaskCount();
  }

  bindEvents() {
    this.addTaskBtn.addEventListener("click", () => this.addTask());

    this.taskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.addTask();
      }
    });

    this.taskInput.addEventListener("input", () => {
      this.addTaskBtn.style.opacity = this.taskInput.value.trim() ? "1" : "0.7";
    });
  }

  addTask() {
    const taskText = this.taskInput.value.trim();
    if (!taskText) {
      this.taskInput.focus();
      return;
    }

    const task = {
      id: Date.now(),
      text: taskText,
      createdAt: new Date().toISOString(),
    };

    this.tasks.unshift(task);
    this.saveTasks();
    this.renderTasks();
    this.updateTaskCount();

    // Synchronisation temps réel
    this.channel.postMessage("update");

    this.taskInput.value = "";
    this.taskInput.focus();
    this.addTaskBtn.style.opacity = "0.7";
  }

  deleteTask(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);

    if (taskElement) {
      taskElement.classList.add("removing");

      setTimeout(() => {
        this.tasks = this.tasks.filter((task) => task.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateTaskCount();

        // Synchronisation temps réel
        this.channel.postMessage("update");
      }, 300);
    }
  }

  renderTasks() {
    this.taskList.innerHTML = "";

    if (this.tasks.length === 0) {
      this.emptyState.classList.remove("hidden");
      return;
    }

    this.emptyState.classList.add("hidden");

    this.tasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item";
      li.setAttribute("data-task-id", task.id);

      li.innerHTML = `
        <span class="task-text">${this.escapeHtml(task.text)}</span>
        <div class="task-actions">
            <button class="delete-btn" onclick="todoApp.deleteTask(${task.id})" title="Supprimer la tâche">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        </div>
      `;

      this.taskList.appendChild(li);
    });
  }

  updateTaskCount() {
    const count = this.tasks.length;
    this.taskCount.textContent = `${count} ${count <= 1 ? "tâche" : "tâches"}`;
  }

  saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialisation
const todoApp = new TodoApp();

// Enregistrement du service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((registration) => console.log("SW registered: ", registration))
      .catch((registrationError) => console.log("SW registration failed: ", registrationError));
  });
}

// Touch interactions pour mobile
document.addEventListener("touchstart", () => {}, { passive: true });
