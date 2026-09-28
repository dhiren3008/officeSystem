// ==========================================
// EMPLOYEE — TASKS MODULE
// My tasks list, status update buttons/dropdowns, update task status.
// ==========================================

// =========================
// Load My Tasks
// =========================

async function loadMyTasks() {

    try {

        const response =
            await fetch(`${API_URL}/tasks`);

        if (!response.ok) {

            throw new Error(
                "Failed to fetch tasks."
            );

        }

        const tasks =
            await response.json();


        const projectsResponse =
            await fetch(`${API_URL}/projects`);

        const projects =
            projectsResponse.ok ? await projectsResponse.json() : [];


        // Get tasks assigned to logged-in employee

        const myTasks =
            tasks.filter(task => {

                if (
                    !getTaskAssigneeIds(task).includes(String(loggedInUser.id))
                ) {
                    return false;
                }

                if (
                    employeeTaskStatusFilter !== "all" &&
                    String(task.status || "") !== employeeTaskStatusFilter
                ) {
                    return false;
                }

                return true;

            });


        const tasksContainer =
            document.getElementById(
                "tasksContainer"
            );


        // Clear container

        tasksContainer.innerHTML = "";


        // No tasks

        if (myTasks.length === 0) {

            tasksContainer.innerHTML =
                `<p class="empty-message">
                    ${
                        tasks.length > 0 &&
                        employeeTaskStatusFilter !== "all"
                            ? "No tasks match this filter."
                            : "No tasks assigned."
                    }
                </p>`;

            return;

        }


        // Display tasks

        myTasks.forEach(task => {

            const project = projects.find(
                project =>
                    String(project.id) === String(task.projectId)
            );

            const projectLabel = project
                ? escapeHtml(project.name)
                : "Removed project";

            const taskCard =
                document.createElement("div");

                taskCard.classList.add("task-card")


            taskCard.innerHTML = `

                <div class="task-info">
                    <h3>
                        ${escapeHtml(task.title)}
                    </h3>
                    <p>
                        ${escapeHtml(task.description)}
                    </p>
                    <p>
                        Project:
                        ${projectLabel}
                    </p>
                    <p>
                        Due Date:
                        ${escapeHtml(task.dueDate || "Not set")}
                    </p>
                </div>


                <div class="task-details">

                    <p>
                        Priority:
                        ${escapeHtml(task.priority)}
                    </p>

                    <div class="task-status-control">

                        <select id="statusSelect-${escapeHtml(task.id)}" class="task-status-select" data-id="${escapeHtml(task.id)}">
                            <option value="pending" ${task.status === "pending" ? "selected" : ""}>Pending</option>
                            <option value="in_progress" ${task.status === "in_progress" ? "selected" : ""}>In Progress</option>
                            <option value="completed" ${task.status === "completed" ? "selected" : ""}>Completed</option>
                        </select>

                        <button type="button" class="edit-status-button" data-id="${escapeHtml(task.id)}">
                            Update
                        </button>

                    </div>

                </div>

            `;

            tasksContainer.appendChild(
                taskCard
            );

        });

        // =========================
        // STATUS UPDATE BUTTONS
        // =========================

        document.querySelectorAll(".edit-status-button").forEach(button => {

            button.addEventListener("click", function () {

                const taskId = this.getAttribute("data-id");

                updateTaskStatus(taskId);

            });

        });


        // =========================
        // ENHANCE DYNAMIC STATUS DROPDOWNS
        // =========================

        document.querySelectorAll(".task-status-select").forEach(select => {

            enhanceSelect(select);

        });

    }

    catch (error) {

        console.error(
            "Error loading my tasks:",
            error
        );

        const tasksContainer =
            document.getElementById("tasksContainer");

        if (tasksContainer) {

            tasksContainer.innerHTML =
                `<p class="empty-message">
                    Unable to load tasks. Please check whether the server is running.
                </p>`;

        }

    }

}

// =========================
// Update Task Status
// =========================

async function updateTaskStatus(taskId) {

    const select =
        document.getElementById(`statusSelect-${taskId}`);

    if (!select) {
        return;
    }

    const newStatus = select.value;

    try {

        const response =
            await fetch(`${API_URL}/tasks/${taskId}`, {

                method: "PATCH",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({ status: newStatus })

            });

        if (!response.ok) {

            throw new Error("Failed to update task status.");

        }

        loadMyTasks();

        loadDashboardStats();

        loadDashboardPreviews();

    }

    catch (error) {

        console.error(
            "Error updating task status:",
            error
        );

        alert("Unable to update task status. Please try again.");

    }

}


