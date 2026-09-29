// ==========================================
// MANAGER — TASKS MODULE
// Task dropdowns, save/edit/delete task, task statistics,
// dashboard task preview, my tasks list, task status filter.
// ==========================================

// =========================
// LOAD TASK PROJECTS
// =========================

async function loadTaskProjects() {

    const taskProject =
        document.getElementById(
            "taskProject"
        );


    if (!taskProject) {

        return;

    }


    const myProjects =
        await loadMyProjects();


    taskProject.innerHTML = `
        <option value="">
            Select Project
        </option>
    `;


    myProjects.forEach(project => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            project.id;


        option.textContent =
            project.name;


        taskProject.appendChild(
            option
        );

    });

}


// =========================
// LOAD TASK MEMBERS (members picker, like project form)
// Scoped to manager's projects.
// =========================

async function loadTaskMembers(selectedIds = [], projectId = null) {

    const container =
        document.getElementById(
            "taskMembersList"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    try {

        const myProjects =
            await loadMyProjects();


        let scopeProjects = myProjects;

        if (projectId) {
            scopeProjects = myProjects.filter(project =>
                String(project.id) === String(projectId)
            );
        }


        const scopeIds = new Set();

        scopeProjects.forEach(project => {
            (project.assignedEmployees || []).forEach(id =>
                scopeIds.add(String(id))
            );
            if (project.projectManagerId !== undefined && project.projectManagerId !== "") {
                scopeIds.add(String(project.projectManagerId));
            }
        });


        const usersResponse =
            await fetch(
                `${API_URL}/users`
            );


        const users =
            usersResponse.ok ? await usersResponse.json() : [];


        const selected =
            (selectedIds || []).map(id => String(id));


        const staff =
            users.filter(user => {

                const isStaff =
                    user.role === "employee" ||
                    user.role === "project_manager";

                if (!isStaff) {
                    return false;
                }

                const isActive =
                    String(user.status || "").trim().toLowerCase() ===
                    "active";

                if (!isActive && !selected.includes(String(user.id))) {
                    return false;
                }

                if (!scopeIds.has(String(user.id)) && !selected.includes(String(user.id))) {
                    return false;
                }

                return true;

            });


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


    } catch (error) {

        console.error(
            "Error loading task members:",
            error
        );

    }

}


// =========================
// TASK MEMBERS PICKER WIRING
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


// =========================
// TASK PROJECT CHANGE
// =========================

const taskProject =
    document.getElementById(
        "taskProject"
    );


if (taskProject) {

    taskProject.addEventListener(
        "change",
        function() {

            const projectId =
                this.value;


            loadTaskMembers(
                getPickedTaskMemberIds(),
                projectId || null
            );

        }
    );

}


// =========================
// SAVE TASK
// =========================

const taskForm =
    document.getElementById(
        "taskForm"
    );


let editingTaskId = null;


// Task status filter ("all" shows everything).

let managerTaskStatusFilter = "all";


if (taskForm) {

    // Hard guard: even if a handler throws before preventDefault,
    // the form must never navigate (whole-page white flash).

    taskForm.setAttribute("action", "javascript:void(0);");

    taskForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

        },
        true
    );

    taskForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const title =
                document.getElementById(
                    "taskTitle"
                ).value.trim();


            const description =
                document.getElementById(
                    "taskDescription"
                ).value.trim();


            const projectId =
                document.getElementById(
                    "taskProject"
                ).value;


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
            // VALIDATION
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

                document.getElementById(
                    "taskFormMessage"
                ).textContent =
                    "Please fill all fields.";

                return;

            }


            try {

                const projectResponse =
                    await fetch(
                        `${API_URL}/projects/${projectId}`
                    );


                const project =
                    await projectResponse.json();


                const assignedEmployeeIds =
                    (project.assignedEmployees || []).map(id => String(id));

                if (project.projectManagerId !== undefined && project.projectManagerId !== "") {
                    assignedEmployeeIds.push(String(project.projectManagerId));
                }


                const scopeSet = new Set(assignedEmployeeIds.map(id => String(id)));

                const outsiders =
                    pickedAssignees.filter(id => !scopeSet.has(String(id)));


                if (outsiders.length > 0) {

                    document.getElementById(
                        "taskFormMessage"
                    ).textContent =
                        "Some selected employees are not assigned to this project.";

                    return;

                }


                // =========================
                // TASK DATA
                // =========================

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


                let response;


                document.getElementById(
                    "taskSubmitButton"
                ).disabled = true;


                // =========================
                // UPDATE TASK
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
                                    JSON.stringify(
                                        taskData
                                    )

                            }
                        );

                }


                // =========================
                // CREATE TASK
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
                                    JSON.stringify(
                                        taskData
                                    )

                            }
                        );

                }


                if (!response.ok) {

                    throw new Error(
                        "Failed to save task"
                    );

                }


                document.getElementById(
                    "taskFormMessage"
                ).textContent =
                    editingTaskId
                        ? "Task updated successfully."
                        : "Task created successfully.";


                taskForm.reset();

                syncCustomWidgetsIn(taskForm);


                editingTaskId = null;


                document.getElementById(
                    "taskFormTitle"
                ).textContent =
                    "Add Task";


                document.getElementById(
                    "taskSubmitButton"
                ).textContent =
                    "Save Task";


                await loadTaskMembers([], document.getElementById("taskProject").value || null);


                syncCustomWidgetsIn(taskForm);


                const tasksScrollY = window.scrollY;

                await loadMyTasks();

                await loadTaskStatistics();

                await loadDashboardTasks();


                // Stay on Tasks: re-pin persisted section and scroll
                // (no section switch, no scroll jump).

                persistManagerSection("tasks");

                window.scrollTo(0, tasksScrollY);


                document.getElementById(
                    "taskSubmitButton"
                ).disabled = false;


                // Keep message visible, then close in place
                // (no section switch, no scroll jump).

                setTimeout(() => {

                    const tasksScrollY = window.scrollY;

                    taskForm.reset();

                    syncCustomWidgetsIn(taskForm);

                    document.getElementById(
                        "taskFormMessage"
                    ).textContent = "";

                    document.getElementById(
                        "taskFormTitle"
                    ).textContent =
                        "Add Task";

                    document.getElementById(
                        "taskSubmitButton"
                    ).textContent =
                        "Save Task";

                    document.getElementById("taskMembersSearch").value = "";

                    document.getElementById("taskMembersPicker")?.classList.remove("open");

                    if (typeof taskFormContainer !== "undefined" && taskFormContainer) {
                        taskFormContainer.classList.remove("active");
                    }

                    persistManagerSection("tasks");

                    window.scrollTo(0, tasksScrollY);

                }, 1200);


            } catch (error) {

                console.error(
                    "Error creating task:",
                    error
                );


                document.getElementById(
                    "taskFormMessage"
                ).textContent =
                    "Unable to save task.";

                document.getElementById(
                    "taskSubmitButton"
                ).disabled = false;

            }

        }
    );

}


// =========================
// ADD TASK BUTTON
// =========================

const addTaskButton =
    document.getElementById(
        "addTaskButton"
    );


const taskFormContainer =
    document.getElementById(
        "taskFormContainer"
    );


if (addTaskButton) {

    addTaskButton.addEventListener(
        "click",
        async function() {

            if (taskFormContainer) {

                taskFormContainer.classList.add("active");

            }

            loadTaskProjects();

            if (typeof applyCreateModeDateMins === "function") {
                applyCreateModeDateMins();
            }

            document.getElementById("taskMembersSearch").value = "";

            await loadTaskMembers([], null);

        }
    );

}

// =========================
// CANCEL TASK BUTTON
// =========================

const cancelTaskButton =
    document.getElementById(
        "cancelTaskButton"
    );


if (cancelTaskButton) {

    cancelTaskButton.addEventListener(
        "click",
        async function() {

            // Hide form

            if (taskFormContainer) {

                taskFormContainer.classList.remove("active");

            }


            // Reset form

            if (taskForm) {

                taskForm.reset();

                if (typeof applyCreateModeDateMins === "function") {
                    applyCreateModeDateMins();
                }

            }


            // Exit edit mode

            editingTaskId = null;


            // Reset form title

            document.getElementById(
                "taskFormTitle"
            ).textContent =
                "Add Task";


            // Reset submit button

            document.getElementById(
                "taskSubmitButton"
            ).textContent =
                "Save Task";


            // Reset members picker

            document.getElementById("taskMembersSearch").value = "";

            await loadTaskMembers([], document.getElementById("taskProject").value || null);


            // Clear message

            document.getElementById(
                "taskFormMessage"
            ).textContent = "";

        }
    );

}


// =========================
// EDIT TASK
// =========================

async function editTask(taskId) {

    try {

        const response =
            await fetch(
                `${API_URL}/tasks/${taskId}`
            );


        const task =
            await response.json();


        editingTaskId =
            taskId;


        document.getElementById(
            "taskFormTitle"
        ).textContent =
            "Edit Task";


        document.getElementById(
            "taskSubmitButton"
        ).textContent =
            "Update Task";


        document.getElementById(
            "taskTitle"
        ).value =
            task.title;


        document.getElementById(
            "taskDescription"
        ).value =
            task.description;


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
            task.dueDate;


        // Edit mode: saved due date stays valid even if overdue.

        if (typeof relaxDateMinForEdit === "function") {
            relaxDateMinForEdit("taskDueDate", task.dueDate);
        }


        document.getElementById(
            "taskFormContainer"
        ).classList.add("active");


        await loadTaskProjects();


        document.getElementById(
            "taskProject"
        ).value =
            task.projectId;


        await loadTaskMembers(
            getTaskAssigneeIds(task),
            task.projectId
        );


        document.getElementById("taskMembersSearch").value = "";

        document.getElementById("taskMembersPicker")?.classList.remove("open");


        document.getElementById(
            "taskFormContainer"
        ).scrollIntoView({
            behavior: "smooth"
        });


    } catch (error) {

        console.error(
            "Error loading task for edit:",
            error
        );

        const editMessage = document.getElementById("taskFormMessage");

        if (editMessage) {
            editMessage.textContent =
                "Unable to load task. Please check whether the server is running.";
        }

    }

}


// =========================
// DELETE TASK
// =========================

async function deleteTask(taskId) {

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
                "Failed to delete task"
            );

        }


        const tasksScrollY = window.scrollY;

        await loadMyTasks();

        await loadTaskStatistics();

        await loadDashboardTasks();


        // Stay on Tasks after delete (no dashboard jump).

        persistManagerSection("tasks");

        window.scrollTo(0, tasksScrollY);


    } catch (error) {

        console.error(
            "Error deleting task:",
            error
        );

        alert("Unable to delete task. Please try again.");

    }

}


// =========================
// LOAD TASK STATISTICS
// =========================

async function loadTaskStatistics() {

    try {

        const myProjects =
            await loadMyProjects();


        const myProjectIds =
            myProjects.map(project => {

                return String(
                    project.id
                );

            });


        const response =
            await fetch(
                `${API_URL}/tasks`
            );


        const tasks =
            await response.json();


        const myTasks =
            tasks.filter(task => {

                return myProjectIds.includes(
                    String(task.projectId)
                );

            });


        const pendingTasks =
            myTasks.filter(task => {

                return task.status === "pending";

            });


        const completedTasks =
            myTasks.filter(task => {

                return task.status === "completed";

            });


        const pendingTasksElement =
            document.getElementById(
                "pendingTasks"
            );


        const completedTasksElement =
            document.getElementById(
                "completedTasks"
            );


        if (pendingTasksElement) {

            pendingTasksElement.textContent =
                pendingTasks.length;

        }


        if (completedTasksElement) {

            completedTasksElement.textContent =
                completedTasks.length;

        }


    } catch (error) {

        console.error(
            "Error loading task statistics:",
            error
        );

    }

}


// =========================
// LOAD DASHBOARD TASKS
// =========================

async function loadDashboardTasks() {

    const dashboardTasks =
        document.getElementById(
            "dashboardTasks"
        );


    if (!dashboardTasks) {

        return;

    }


    const myProjects =
        await loadMyProjects();


    const myProjectIds =
        myProjects.map(project => {

            return String(
                project.id
            );

        });


    if (myProjectIds.length === 0) {

        dashboardTasks.innerHTML = `
            <p class="empty-message">
                No tasks found.
            </p>
        `;

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/tasks`
            );


        const tasks =
            await response.json();


        const myTasks =
            tasks.filter(task => {

                return myProjectIds.includes(
                    String(task.projectId)
                );

            });


        if (myTasks.length === 0) {

            dashboardTasks.innerHTML = `
                <p class="empty-message">
                    No tasks found.
                </p>
            `;

            return;

        }


        const previewTasks =
            myTasks.slice(0, 3);


        dashboardTasks.innerHTML =
            previewTasks.map(task => {

                return `
                    <div class="preview-item">

                        <h4>
                            ${escapeHtml(task.title)}
                        </h4>

                        <p>
                            Status: ${escapeHtml(task.status)}
                        </p>

                        <p>
                            Priority: ${escapeHtml(task.priority)}
                        </p>

                    </div>
                `;

            }).join("");


    } catch (error) {

        console.error(
            "Error loading dashboard tasks:",
            error
        );

    }

}


// =========================
// LOAD MY TASKS
// =========================

async function loadMyTasks() {

    const tasksContainer =
        document.getElementById(
            "tasksContainer"
        );


    if (!tasksContainer) {

        return;

    }


    try {

        const myProjects =
            await loadMyProjects();


        const myProjectIds =
            myProjects.map(project =>
                String(project.id)
            );


        const response =
            await fetch(
                `${API_URL}/tasks`
            );


        const tasks =
            await response.json();


        const usersResponse =
            await fetch(
                `${API_URL}/users`
            );


        const users =
            usersResponse.ok ? await usersResponse.json() : [];


        const myTasks =
            tasks.filter(task => {

                if (
                    !myProjectIds.includes(
                        String(task.projectId)
                    )
                ) {
                    return false;
                }

                if (
                    managerTaskStatusFilter !== "all" &&
                    String(task.status || "") !== managerTaskStatusFilter
                ) {
                    return false;
                }

                return true;

            });


        if (myTasks.length === 0) {

            tasksContainer.innerHTML = `
                <p class="empty-message">
                    ${
                        tasks.length > 0 &&
                        managerTaskStatusFilter !== "all"
                            ? "No tasks match this filter."
                            : "No tasks to display."
                    }
                </p>
            `;

            return;

        }


        tasksContainer.innerHTML =
            myTasks.map(task => {

                const project =
                    myProjects.find(project =>
                        String(project.id) ===
                        String(task.projectId)
                    );


                const assigneeIds =
                    getTaskAssigneeIds(task);

                const assigneeChips = assigneeIds.length > 0
                    ? assigneeIds.map(id => {
                        const u = users.find(user => String(user.id) === String(id));
                        const label = u ? u.name : "Former member";
                        return `<span class="project-member-chip">${escapeHtml(label)}</span>`;
                    }).join("")
                    : `<span class="project-member-none">Not assigned</span>`;


                return `
                    <div class="task-card">

                        <div class="task-card-content">

                            <h3>
                                ${escapeHtml(task.title)}
                            </h3>

                            <p class="task-description">
                                ${escapeHtml(task.description)}
                            </p>

                            <p>
                                <strong>Project:</strong>
                                ${
                                    project
                                        ? escapeHtml(project.name)
                                        : "Removed project"
                                }
                            </p>

                            <p>
                                <strong>Assigned To:</strong>
                            </p>

                            <div class="project-member-list">
                                ${assigneeChips}
                            </div>

                            <p>
                                <strong>Priority:</strong>
                                ${escapeHtml(task.priority)}
                            </p>

                            <p>
                                <strong>Status:</strong>
                                ${escapeHtml(task.status)}
                            </p>

                            <p>
                                <strong>Due Date:</strong>
                                ${escapeHtml(task.dueDate)}
                            </p>

                        </div>


                        <div class="task-actions">

                            <button
                                type="button"
                                class="edit-task-button"
                                data-id="${escapeHtml(task.id)}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="delete-task-button"
                                data-id="${escapeHtml(task.id)}"
                            >
                                Delete
                            </button>

                        </div>

                    </div>
                `;

            }).join("");


        // =========================
        // EDIT BUTTONS
        // =========================

        document
            .querySelectorAll(
                ".edit-task-button"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function() {

                        const taskId =
                            this.getAttribute(
                                "data-id"
                            );


                        editTask(taskId);

                    }
                );

            });


        // =========================
        // DELETE BUTTONS
        // =========================

        document
            .querySelectorAll(
                ".delete-task-button"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function() {

                        const taskId =
                            this.getAttribute(
                                "data-id"
                            );


                        deleteTask(taskId);

                    }
                );

            });


    } catch (error) {

        console.error(
            "Error loading tasks:",
            error
        );


        tasksContainer.innerHTML = `
            <p class="empty-message">
                Unable to load tasks.
            </p>
        `;

    }

}


// =========================
// TASK STATUS FILTER
// =========================

document.getElementById("taskStatusFilter")?.addEventListener("change", function (event) {

    managerTaskStatusFilter = event.target.value;

    loadMyTasks();

});



