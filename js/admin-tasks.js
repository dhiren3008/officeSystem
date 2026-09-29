// ==========================================
// ADMIN — TASKS MODULE
// Task add/edit/delete, task dropdowns, dashboard task preview.
// ==========================================

    // =========================
    // Task Management
    // =========================

const addTaskButton =
    document.getElementById("addTaskButton");

const taskFormContainer =
    document.getElementById("taskFormContainer");

const cancelTaskButton =
    document.getElementById("cancelTaskButton");

const taskForm =
    document.getElementById("taskForm");

const taskFormTitle =
    document.getElementById("taskFormTitle");

const taskSubmitButton =
    document.getElementById("taskSubmitButton");

const taskFormMessage =
    document.getElementById("taskFormMessage");

const taskProject =
    document.getElementById("taskProject");


// =========================
// Task Edit Mode
// =========================

let editingTaskId = null;


// =========================
// Open Add Task Form
// =========================

addTaskButton.addEventListener("click", function () {

    editingTaskId = null;

    taskForm.reset();

    if (typeof applyCreateModeDateMins === "function") {
        applyCreateModeDateMins();
    }

    taskFormTitle.textContent =
        "Add Task";

    taskSubmitButton.textContent =
        "Save Task";

    taskFormMessage.textContent = "";

    taskFormContainer.classList.add("active");

    loadTaskProjects();

    loadTaskMembers([], null);

    document.getElementById("taskMembersSearch").value = "";

    document.getElementById("taskMembersPicker")?.classList.remove("open");

});

// =========================
// Add / Update Task
// =========================

taskForm.addEventListener("submit",async function (event) {
        event.preventDefault();


        // Get form values

        const title =
            document.getElementById(
                "taskTitle"
            ).value.trim();


        const description =
            document.getElementById(
                "taskDescription"
            ).value.trim();


        const projectId =
            taskProject.value;


        const pickedAssignees = getPickedTaskMemberIds();


        const priority =
            document.getElementById(
                "taskPriority"
            ).value;


        const status =
            document.getElementById(
                "taskStatus"
            ).value;


        const dueDate =
            document.getElementById(
                "taskDueDate"
            ).value;


        // =========================
        // Validation
        // =========================

        if (
            !title ||
            !description ||
            !projectId ||
            pickedAssignees.length === 0 ||
            !priority ||
            !status ||
            !dueDate
        ) {

            taskFormMessage.textContent =
                "Please fill all fields.";

            taskFormMessage.style.color = "#dc2626";

            return;

        }


        // Assignee must belong to the selected project.

        try {

            const projectResponse =
                await fetch(`${API_URL}/projects/${projectId}`);

            if (projectResponse.ok) {

                const project =
                    await projectResponse.json();

                const memberIds =
                    (project.assignedEmployees || []).map(id => String(id));

                const managerId =
                    project.projectManagerId !== undefined && project.projectManagerId !== ""
                        ? String(project.projectManagerId)
                        : null;

                const scopeIds = new Set([...memberIds, ...(managerId ? [managerId] : [])]);

                const outsiders = pickedAssignees.filter(id => !scopeIds.has(String(id)));

                if (outsiders.length > 0) {

                    taskFormMessage.textContent =
                        "Some selected employees are not assigned to this project.";

                    taskFormMessage.style.color = "#dc2626";

                    return;

                }

            }

        }

        catch (validationError) {

            console.error(
                "Error validating task assignment:",
                validationError
            );

        }


        // Create task object

        const taskData = {

            title: title,

            description: description,

            projectId: String(projectId),

            assignedEmployees: pickedAssignees.map(id => String(id)),

            assignedTo: String(pickedAssignees[0]),

            priority: priority,

            status: status,

            dueDate: dueDate

        };


        try {

            taskSubmitButton.disabled = true;

            let response;


            // =========================
            // Update Task
            // =========================

            if (editingTaskId) {

                response =
                    await fetch(
                        `${API_URL}/tasks/${editingTaskId}`,
                        {

                            method: "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(taskData)

                        }
                    );

            }


            // =========================
            // Add Task
            // =========================

            else {

                taskData.id = await getNextId("tasks");

                response =
                    await fetch(
                        `${API_URL}/tasks`,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(taskData)

                        }
                    );

            }


            if (!response.ok) {

                throw new Error(
                    "Failed to save task."
                );

            }


            const savedTask =
                await response.json();


            // Success message

            taskFormMessage.textContent =
                editingTaskId
                    ? "Task updated successfully."
                    : "Task added successfully.";

            taskFormMessage.style.color =
                "#16a34a";


            // Reset edit mode

            editingTaskId = null;


            // In-place refresh (no section switch, no scroll jump).

            await loadTasks();

            await loadDashboardTasks();

            if (typeof loadReports === "function") {
                await loadReports();
            }

            taskSubmitButton.disabled = false;


            // Keep success message visible, then close.

            setTimeout(() => {

                taskForm.reset();

                taskFormMessage.textContent = "";

                taskFormTitle.textContent =
                    "Add Task";

                taskSubmitButton.textContent =
                    "Save Task";

                taskFormContainer.classList.remove(
                    "active"
                );

            }, 1200);

        }

        catch (error) {

            console.error(
                "Error saving task:",
                error
            );


            taskFormMessage.textContent =
                "Unable to save task.";

            taskFormMessage.style.color =
                "#dc2626";

            taskSubmitButton.disabled = false;

        }

    }
);

// =========================
// Close Task Form
// =========================

cancelTaskButton.addEventListener("click", function () {

    editingTaskId = null;

    taskForm.reset();

    if (typeof applyCreateModeDateMins === "function") {
        applyCreateModeDateMins();
    }

    taskFormTitle.textContent =
        "Add Task";

    taskSubmitButton.textContent =
        "Save Task";

    taskFormMessage.textContent = "";

    taskFormContainer.classList.remove("active");

});

// =========================
// Load Projects
// =========================

async function loadTaskProjects() {

    try {

        const response =
            await fetch(`${API_URL}/projects`);

        if (!response.ok) {

            throw new Error(
                "Failed to fetch projects."
            );

        }

        const projects =
            await response.json();


        taskProject.innerHTML = `
            <option value="">
                Select Project
            </option>
        `;


        projects.forEach(project => {

            const option =
                document.createElement("option");

            option.value = project.id;

            option.textContent =
                project.name;

            taskProject.appendChild(option);

        });

    }

    catch (error) {

        console.error(
            "Error loading projects:",
            error
        );

    }

}

// =========================
// Load Task Members (members picker, like project form)
// =========================

// Without a project scope: all active staff.
// With scopeProjectId: only that project's members
// (members + manager, plus already-selected ones on edit).

async function loadTaskMembers(selectedIds = [], scopeProjectId = null) {

    const container =
        document.getElementById("taskMembersList");

    if (!container) {
        return;
    }

    try {

        const [usersResponse, projectResponse] =
            await Promise.all([
                fetch(`${API_URL}/users`),
                scopeProjectId
                    ? fetch(`${API_URL}/projects/${scopeProjectId}`)
                    : Promise.resolve(null)
            ]);


        if (!usersResponse.ok) {

            throw new Error(
                "Failed to fetch employees."
            );

        }

        const users =
            await usersResponse.json();


        let scopeIds = null;

        if (projectResponse && projectResponse.ok) {

            const project =
                await projectResponse.json();

            scopeIds = new Set(
                (project.assignedEmployees || []).map(id => String(id))
            );

            if (project.projectManagerId !== undefined && project.projectManagerId !== "") {
                scopeIds.add(String(project.projectManagerId));
            }

        }


        const selected =
            (selectedIds || []).map(id => String(id));


        // Active staff only (plus already-selected ones on edit).

        const staff =
            users.filter(user => {

                const isStaff =
                    user.role === "employee" ||
                    user.role === "project_manager";

                const isActive =
                    String(user.status || "").trim().toLowerCase() ===
                    "active";

                if (!isStaff) {
                    return false;
                }

                if (!isActive && !selected.includes(String(user.id))) {
                    return false;
                }

                if (scopeIds && !scopeIds.has(String(user.id)) && !selected.includes(String(user.id))) {
                    return false;
                }

                return true;

            });


        container.innerHTML = "";


        if (staff.length === 0) {

            container.innerHTML =
                `<p class="empty-message">No employees found for this project.</p>`;

            updateTaskMembersLabel();

            return;

        }


        staff.forEach(member => {

            const isInactive =
                String(member.status || "").trim().toLowerCase() ===
                "inactive";

            const label =
                document.createElement("label");

            label.dataset.search =
                `${member.id} ${member.name} ${member.role}`
                    .toLowerCase();

            const checkbox =
                document.createElement("input");

            checkbox.type = "checkbox";

            checkbox.value = member.id;

            checkbox.checked = selected.includes(String(member.id));

            checkbox.addEventListener("change", updateTaskMembersLabel);

            label.appendChild(checkbox);

            label.append(
                document.createTextNode(
                    isInactive
                        ? `${member.name} (inactive)`
                        : member.name
                )
            );

            container.appendChild(label);

        });


        updateTaskMembersLabel();

    }

    catch (error) {

        console.error(
            "Error loading task members:",
            error
        );

    }

}


// =========================
// Task Members Picker Label + Panel Wiring
// =========================

function getPickedTaskMemberIds() {

    return Array.from(
        document.querySelectorAll(
            "#taskMembersList input[type='checkbox']:checked"
        )
    ).map(checkbox => String(checkbox.value));

}


function updateTaskMembersLabel() {

    const label =
        document.getElementById("taskMembersLabel");

    if (!label) {
        return;
    }

    const count = getPickedTaskMemberIds().length;

    label.textContent =
        count === 0
            ? "Select team members"
            : `Team (${count} selected)`;

}


document.getElementById("taskMembersTrigger")?.addEventListener("click", function (event) {

    event.stopPropagation();

    const picker = document.getElementById("taskMembersPicker");

    if (picker && !picker.classList.contains("open") && typeof window.closeAllCustomPopups === "function") {
        window.closeAllCustomPopups(picker);
    }

    picker?.classList.toggle("open");

});


document.addEventListener("click", function (event) {

    const picker =
        document.getElementById("taskMembersPicker");

    if (picker && !picker.contains(event.target)) {
        picker.classList.remove("open");
    }

});


document.getElementById("taskMembersSearch")?.addEventListener("input", function (event) {

    const query =
        event.target.value.trim().toLowerCase();

    document.querySelectorAll("#taskMembersList > label").forEach(label => {

        const haystack = label.dataset.search || "";

        label.style.display =
            query === "" || haystack.includes(query) ? "" : "none";

    });

});


// Assignees follow the selected project.

taskProject.addEventListener("change", function () {

    loadTaskMembers(getPickedTaskMemberIds(), this.value || null);

});

// =========================
// Load Tasks
// =========================

async function loadTasks() {

    try {

        const [tasksResponse, projectsResponse, usersResponse] =
            await Promise.all([
                fetch(`${API_URL}/tasks`),
                fetch(`${API_URL}/projects`),
                fetch(`${API_URL}/users`)
            ]);


        if (!tasksResponse.ok) {

            throw new Error(
                "Failed to fetch tasks."
            );

        }


        const tasks =
            await tasksResponse.json();

        const projects =
            projectsResponse.ok ? await projectsResponse.json() : [];

        const users =
            usersResponse.ok ? await usersResponse.json() : [];


        const tasksContainer =
            document.getElementById(
                "tasksContainer"
            );


        // Clear previous tasks

        tasksContainer.innerHTML = "";


        // No tasks

        if (tasks.length === 0) {

            tasksContainer.innerHTML =
                `<p class="empty-message">
                    No tasks to display.
                </p>`;

            return;

        }


        // Display tasks

        let shownTasks = 0;

        tasks.forEach(task => {

            if (
                taskStatusFilter !== "all" &&
                String(task.status || "") !== taskStatusFilter
            ) {
                return;
            }

            if (
                taskPriorityFilter !== "all" &&
                String(task.priority || "") !== taskPriorityFilter
            ) {
                return;
            }

            shownTasks++;

            const project = projects.find(
                project =>
                    String(project.id) === String(task.projectId)
            );

            const projectLabel = project
                ? escapeHtml(project.name)
                : "Removed project";

            const assigneeIds = getTaskAssigneeIds(task);

            const assigneeChips = assigneeIds.length > 0
                ? assigneeIds.map(id => {
                    const u = users.find(user => String(user.id) === String(id));
                    const label = u ? u.name : "Former member";
                    return `<span class="project-member-chip">${escapeHtml(label)}</span>`;
                }).join("")
                : `<span class="project-member-none">Not assigned</span>`;

            const taskCard =
                document.createElement("div");

            taskCard.classList.add(
                "task-card"
            );


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
                        Assigned To:
                    </p>

                    <div class="project-member-list">
                        ${assigneeChips}
                    </div>

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

                    <p>
                        Status:
                        ${escapeHtml(task.status)}
                    </p>

                    <button
                        class="edit-task-button"
                        data-id="${escapeHtml(task.id)}"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-task-button"
                        data-id="${escapeHtml(task.id)}"
                    >
                        Delete
                    </button>

                </div>

            `;


            tasksContainer.appendChild(
                taskCard
            );

        });


        if (shownTasks === 0 && tasks.length > 0) {

            tasksContainer.innerHTML =
                `<p class="empty-message">
                    No tasks match this filter.
                </p>`;

        }

    }

    catch (error) {

        console.error(
            "Error loading tasks:",
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
// Edit / Delete Task
// =========================

document.getElementById("tasksContainer").addEventListener(
    "click",
    async function (event) {

        // =========================
        // EDIT TASK
        // =========================

        if (
            event.target.classList.contains(
                "edit-task-button"
            )
        ) {

            const taskId =
                event.target.dataset.id;

            try {

                const response =
                    await fetch(
                        `${API_URL}/tasks/${taskId}`
                    );


                if (!response.ok) {

                    throw new Error(
                        "Failed to fetch task."
                    );

                }


                const task =
                    await response.json();


                // Set edit mode

                editingTaskId =
                    task.id;


                // Load projects and employees first
                // (assignees scoped to the task's project,
                // saved assignee kept selectable even if inactive)

                await loadTaskProjects();

                await loadTaskMembers(getTaskAssigneeIds(task), task.projectId);

                document.getElementById("taskMembersSearch").value = "";

                document.getElementById("taskMembersPicker")?.classList.remove("open");


                // Fill form

                document.getElementById(
                    "taskTitle"
                ).value =
                    task.title;


                document.getElementById(
                    "taskDescription"
                ).value =
                    task.description;


                document.getElementById(
                    "taskProject"
                ).value =
                    task.projectId;


                document.getElementById(
                    "taskPriority"
                ).value =
                    task.priority;


                document.getElementById(
                    "taskStatus"
                ).value =
                    task.status;


                document.getElementById(
                    "taskDueDate"
                ).value =
                    task.dueDate || "";


                // Edit mode: saved due date stays valid even if overdue.

                if (typeof relaxDateMinForEdit === "function") {
                    relaxDateMinForEdit("taskDueDate", task.dueDate);
                }


                // Change form to Edit mode

                taskFormTitle.textContent =
                    "Edit Task";

                taskSubmitButton.textContent =
                    "Update Task";

                taskFormMessage.textContent =
                    "";


                // Open form

                taskFormContainer.classList.add(
                    "active"
                );

            }

            catch (error) {

                console.error(
                    "Error loading task:",
                    error
                );

                taskFormMessage.textContent =
                    "Unable to load task. Please check whether the server is running.";

                taskFormMessage.style.color = "#dc2626";

            }

        }


        // =========================
        // DELETE TASK
        // =========================

        if (
            event.target.classList.contains(
                "delete-task-button"
            )
        ) {

            const taskId =
                event.target.dataset.id;


            const confirmDelete =
                confirm(
                    "Are you sure you want to delete this task?"
                );


            if (!confirmDelete) {

                return;

            }


            try {

                const response =
                    await fetch(
                        `${API_URL}/tasks/${taskId}`,
                        {
                            method: "DELETE"
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        "Failed to delete task."
                    );

                }


                // Reload task section in place (stay put).

                await loadTasks();


                // Reload dashboard

                await loadDashboardTasks();

                if (typeof loadReports === "function") {
                    await loadReports();
                }

            }

            catch (error) {

                console.error(
                    "Error deleting task:",
                    error
                );

                alert("Unable to delete task. Please try again.");

            }

        }

    }
);

// =========================
// Dashboard Tasks Preview
// =========================

async function loadDashboardTasks() {

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


        const recentTasks =
            tasks.slice(-4).reverse();


        const dashboardTasks =
            document.getElementById(
                "dashboardTasks"
            );


        // Clear previous content

        dashboardTasks.innerHTML = "";


        // No tasks

        if (recentTasks.length === 0) {

            dashboardTasks.innerHTML =
                `<p class="empty-message">
                    No tasks found.
                </p>`;

            return;

        }


        // Display tasks

        recentTasks.forEach(task => {

            const taskItem =
                document.createElement("div");

            taskItem.classList.add(
                "dashboard-preview-item"
            );


            taskItem.innerHTML = `

                <h4>
                    ${escapeHtml(task.title)}
                </h4>

                <p>
                    Priority:
                    ${escapeHtml(task.priority)}
                </p>

                <p>
                    Status:
                    ${escapeHtml(task.status)}
                </p>

            `;


            dashboardTasks.appendChild(
                taskItem
            );

        });

    }

    catch (error) {

        console.error(
            "Error loading dashboard tasks:",
            error
        );

    }

}


