// ==========================================
// ADMIN — PROJECTS MODULE
// Project dashboard preview, project manager/members picker,
// project add/edit/delete, project stats.
// ==========================================

// =========================
// Dashboard Projects Preview
// =========================

async function loadDashboardProjects() {

    try {

        const projectsResponse =
            await fetch(`${API_URL}/projects`);

        const usersResponse =
            await fetch(`${API_URL}/users`);

        if (!projectsResponse.ok) {

            throw new Error(
                "Failed to fetch projects."
            );

        }


        if (!usersResponse.ok) {

            throw new Error(
                "Failed to fetch users."
            );

        }


        const projects =
            await projectsResponse.json();

        const users =
            await usersResponse.json();


        // =========================
        // Find Dashboard Container
        // =========================

        const dashboardProjects =
            document.getElementById(
                "dashboardProjects"
            );


        if (!dashboardProjects) {

            throw new Error(
                "dashboardProjects element was not found in HTML."
            );

        }


        // Clear previous content

        dashboardProjects.innerHTML = "";


        // =========================
        // No Projects
        // =========================

        if (projects.length === 0) {

            dashboardProjects.innerHTML =
                `<p class="empty-message">
                    No projects found.
                </p>`;

            return;

        }


        // =========================
        // Get First 4 Projects
        // =========================

        const recentProjects =
            projects.slice(-4).reverse();


        // =========================
        // Display Projects
        // =========================

        recentProjects.forEach(project => {

            const manager =
                users.find(user => {

                    return String(user.id) ===
                           String(project.projectManagerId);

                });


            const managerName =
                manager
                    ? escapeHtml(manager.name)
                    : "Not assigned";


            const projectItem =
                document.createElement("div");


            projectItem.classList.add(
                "dashboard-preview-item"
            );


            projectItem.innerHTML = `

                <h4>
                    ${escapeHtml(project.name)}
                </h4>

                <p>
                    Status:
                    ${escapeHtml(project.status)}
                </p>

                <p>
                    Project Manager:
                    ${managerName}
                </p>

            `;


            dashboardProjects.appendChild(
                projectItem
            );

        });


        }

    catch (error) {

        console.error(
            "Dashboard project error:",
            error
        );

    }

}

// =========================
// Project Management
// =========================

const addProjectButton = document.getElementById("addProjectButton");

const projectFormContainer = document.getElementById("projectFormContainer");

const cancelProjectButton = document.getElementById("cancelProjectButton");

const projectForm = document.getElementById("projectForm");

const projectFormTitle = document.getElementById("projectFormTitle");

const projectSubmitButton = document.getElementById("projectSubmitButton");

const projectFormMessage = document.getElementById("projectFormMessage");

const projectManager = document.getElementById("projectManager");


// =========================
// Project Edit Mode
// =========================

let editingProjectId = null;


// =========================
// Open Add Project Form
// =========================

addProjectButton.addEventListener("click", function () {

    editingProjectId = null;

    projectForm.reset();

    if (typeof applyCreateModeDateMins === "function") {
        applyCreateModeDateMins();
    }

    projectFormTitle.textContent = "Add Project";

    projectSubmitButton.textContent = "Save Project";

    projectFormMessage.textContent = "";

    projectFormContainer.classList.add("active");

    loadProjectManagers();

    loadProjectEmployees();

    document.getElementById("projectMembersSearch").value = "";

    document.getElementById("projectMembersPicker")?.classList.remove("open");

});


// =========================
// Close Project Form
// =========================

cancelProjectButton.addEventListener("click", function () {

    editingProjectId = null;

    projectForm.reset();

    if (typeof applyCreateModeDateMins === "function") {
        applyCreateModeDateMins();
    }

    projectFormTitle.textContent = "Add Project";

    projectSubmitButton.textContent = "Save Project";

    projectFormMessage.textContent = "";

    projectFormContainer.classList.remove("active");

});


// =========================
// Load Project Managers
// =========================

async function loadProjectManagers(preserveId = null) {

    try {

        const response =
            await fetch(`${API_URL}/users`);

        if (!response.ok) {

            throw new Error(
                "Failed to fetch users."
            );

        }

        const users =
            await response.json();


        // Active managers only (plus the currently saved one on edit).

        let managers =
            users.filter(user => {

                return user.role === "project_manager" &&
                    String(user.status || "").trim().toLowerCase() ===
                        "active";

            });


        if (
            preserveId !== null &&
            preserveId !== "" &&
            !managers.some(
                manager =>
                    String(manager.id) === String(preserveId)
            )
        ) {

            const preserved = users.find(
                user =>
                    String(user.id) === String(preserveId)
            );

            if (preserved) {
                managers = [...managers, preserved];
            }

        }


        // Reset dropdown

        projectManager.innerHTML = `
            <option value="">
                Select Project Manager
            </option>
        `;


        // Add project managers

        managers.forEach(manager => {

            const option =
                document.createElement("option");

            option.value = manager.id;

            const isInactive =
                String(manager.status || "").trim().toLowerCase() ===
                "inactive";

            option.textContent = isInactive
                ? `${manager.name} (inactive)`
                : manager.name;

            projectManager.appendChild(option);

        });

    }

    catch (error) {

        console.error(
            "Error loading project managers:",
            error
        );

    }

}

// =========================
// Load Project Employees (members picker)
// =========================

// Active staff only, plus already-selected members preserved on edit.
// The selected project manager is always included (locked row).

async function loadProjectEmployees(selectedIds = []) {

    const container =
        document.getElementById("projectEmployees");

    if (!container) {
        return;
    }

    try {

        const response =
            await fetch(`${API_URL}/users`);

        if (!response.ok) {

            throw new Error(
                "Failed to fetch users."
            );

        }

        const users =
            await response.json();


        const selected =
            selectedIds.map(id => String(id));

        const managerId =
            String(projectManager.value || "");


        let staff = users.filter(user => {

            const isStaff =
                user.role === "employee" ||
                user.role === "project_manager";

            const isActive =
                String(user.status || "").trim().toLowerCase() ===
                "active";

            return isStaff && (isActive || selected.includes(String(user.id)));

        });


        container.innerHTML = "";


        // Locked manager row (always included, not removable).

        const manager = users.find(user =>
            managerId !== "" && String(user.id) === managerId
        );

        if (manager) {

            const locked =
                document.createElement("label");

            locked.classList.add("members-picker-locked");

            locked.dataset.search =
                `${manager.id} ${manager.name} ${manager.role}`.toLowerCase();

            locked.textContent =
                manager.name;

            const tag =
                document.createElement("span");

            tag.classList.add("lock-tag");

            tag.textContent = "Manager";

            locked.appendChild(tag);

            container.appendChild(locked);

        }


        if (staff.length === 0 && !manager) {

            container.innerHTML =
                `<p class="empty-message">No active employees found.</p>`;

            updateMembersPickerLabel();

            return;

        }


        staff
            .filter(member => String(member.id) !== managerId)
            .forEach(member => {

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

                checkbox.addEventListener("change", updateMembersPickerLabel);

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


        updateMembersPickerLabel();

    }

    catch (error) {

        console.error(
            "Error loading project employees:",
            error
        );

    }

}


// =========================
// Members Picker Label + Panel Wiring
// =========================

function getPickedMemberIds() {

    return Array.from(
        document.querySelectorAll(
            "#projectEmployees input[type='checkbox']:checked"
        )
    ).map(checkbox => String(checkbox.value));

}


function updateMembersPickerLabel() {

    const label =
        document.getElementById("projectMembersLabel");

    if (!label) {
        return;
    }

    const count = getPickedMemberIds().length;

    const hasManager =
        String(projectManager.value || "") !== "";

    const total = count + (hasManager ? 1 : 0);

    label.textContent =
        total === 0
            ? "Select team members"
            : `Team (${total} selected)`;

}


document.getElementById("projectMembersTrigger")?.addEventListener("click", function (event) {

    event.stopPropagation();

    const picker = document.getElementById("projectMembersPicker");

    if (picker && !picker.classList.contains("open") && typeof window.closeAllCustomPopups === "function") {
        window.closeAllCustomPopups(picker);
    }

    picker?.classList.toggle("open");

});


document.addEventListener("click", function (event) {

    const picker =
        document.getElementById("projectMembersPicker");

    if (picker && !picker.contains(event.target)) {
        picker.classList.remove("open");
    }

});


document.getElementById("projectMembersSearch")?.addEventListener("input", function (event) {

    const query =
        event.target.value.trim().toLowerCase();

    document.querySelectorAll("#projectEmployees > label").forEach(label => {

        const haystack = label.dataset.search || "";

        label.style.display =
            query === "" || haystack.includes(query) ? "" : "none";

    });

});


// Locked manager row follows the manager dropdown.

projectManager.addEventListener("change", function () {

    loadProjectEmployees(getPickedMemberIds());

});


// =========================
// Add / Update Project
// =========================

projectForm.addEventListener("submit",async function (event) {
    

    event.preventDefault();


        // Get form values

        const name =
            document.getElementById(
                "projectName"
            ).value.trim();

        const description =
            document.getElementById(
                "projectDescription"
            ).value.trim();

        const startDate =
            document.getElementById(
                "projectStartDate"
            ).value;

        const endDate =
            document.getElementById(
                "projectEndDate"
            ).value;

        const managerId =
            projectManager.value;

        const status =
            document.getElementById(
                "projectStatus"
            ).value;


        // End date cannot be before start date.

        if (endDate && endDate < startDate) {

            projectFormMessage.textContent =
                "End date cannot be before start date.";

            projectFormMessage.style.color = "#dc2626";

            return;

        }


        // Assigned employees (picker selection plus the
        // project manager, who is always included).

        const pickedMembers = getPickedMemberIds();

        if (
            managerId !== "" &&
            !pickedMembers.includes(String(managerId))
        ) {
            pickedMembers.push(String(managerId));
        }

        const assignedEmployees = pickedMembers;


        // Create project object

        const projectData = {

            name: name,

            description: description,

            startDate: startDate,

            endDate: endDate,

            projectManagerId: String(managerId),

            assignedEmployees: assignedEmployees.map(id => String(id)),

            status: status

        };


        try {

            projectSubmitButton.disabled = true;

            let response;


            // =========================
            // Update Existing Project
            // =========================

            if (editingProjectId) {

                response = await fetch(
                    `${API_URL}/projects/${editingProjectId}`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(projectData)
                    }
                );

            }


            // =========================
            // Add New Project
            // =========================

            else {

                projectData.id = await getNextId("projects");

                response = await fetch(
                    `${API_URL}/projects`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(projectData)
                    }
                );

            }


            if (!response.ok) {

                throw new Error(
                    "Failed to save project."
                );

            }


            const savedProject =
                await response.json();

            // Success message

            projectFormMessage.textContent =
                editingProjectId
                    ? "Project updated successfully."
                    : "Project added successfully.";

            projectFormMessage.style.color =
                "#16a34a";


            // Reset edit mode

            editingProjectId = null;


            // In-place refresh (no section switch, no scroll jump).

            await loadProjects();

            await loadDashboardProjects();

            await loadProjectStats();

            if (typeof loadReports === "function") {
                await loadReports();
            }

            // Task assignee dropdowns depend on projects/members.

            if (typeof loadTaskProjects === "function") {
                await loadTaskProjects();
            }

            projectSubmitButton.disabled = false;


            // Keep success message visible, then close the form
            // without leaving the current section.

            setTimeout(() => {

                projectForm.reset();

                projectFormMessage.textContent = "";

                projectFormTitle.textContent =
                    "Add Project";

                projectSubmitButton.textContent =
                    "Save Project";

                projectFormContainer.classList.remove(
                    "active"
                );

            }, 1200);

        }

        catch (error) {

            console.error(
                "Error saving project:",
                error
            );

            projectFormMessage.textContent =
                "Unable to save project.";

            projectFormMessage.style.color =
                "#dc2626";

            projectSubmitButton.disabled = false;

        }

    }
);

// =========================
// Load Project
// =========================

async function loadProjects() {

    try {

        const response = await fetch(`${API_URL}/projects`);

        if (!response.ok) {

            throw new Error(
                "Failed to fetch projects."
            );

        }

        const projects = await response.json();

        const usersResponse = await fetch(`${API_URL}/users`);

        const users = await usersResponse.json();


        const projectsContainer = document.getElementById("projectsContainer");


        projectsContainer.innerHTML = "";


        if (projects.length === 0) {

            projectsContainer.innerHTML =
                `<p class="empty-message">
                    No projects to display.
                </p>`;

            return;

        }


        let shownProjects = 0;

        projects.forEach(project => {

            if (
                projectStatusFilter !== "all" &&
                String(project.status || "") !== projectStatusFilter
            ) {
                return;
            }

            shownProjects++;

            const manager = users.find(user => String(user.id) === String(project.projectManagerId));

            const managerName =
                manager
                    ? escapeHtml(manager.name)
                    : "Not assigned";

            const employees =
                Array.isArray(project.assignedEmployees)
                    ? project.assignedEmployees
                    : [];

            const memberChips =
                employees.length > 0
                    ? employees.map(employeeId => {
                        const u = users.find(user => String(user.id) === String(employeeId));
                        const label = u ? u.name : "Former member";
                        return `<span class="project-member-chip">${escapeHtml(label)}</span>`;
                    }).join("")
                    : `<span class="project-member-none">No employees assigned</span>`;

            const statusKey =
                String(project.status || "").trim().toLowerCase();

            const statusText =
                statusKey.replace(/_/g, " ") || "unknown";

            const projectCard = document.createElement("article");

            projectCard.classList.add("project-card");

            projectCard.innerHTML = `

                <div class="project-card-top" style="justify-content:flex-end;">

                    <span class="project-status-badge ${escapeHtml(statusKey)}">
                        ${escapeHtml(statusText)}
                    </span>

                </div>


                <div class="project-info">

                    <span class="project-field-label">
                        Project Title
                    </span>

                    <h3 class="project-title">
                        ${escapeHtml(project.name)}
                    </h3>

                    <span class="project-field-label">
                        Description
                    </span>

                    <p class="project-description">
                        ${escapeHtml(project.description)}
                    </p>

                </div>


                <div class="project-details">

                    <div class="project-meta">
                        <span class="project-meta-label">Start Date</span>
                        <span class="project-meta-value">${escapeHtml(String(project.startDate || "-"))}</span>
                    </div>

                    <div class="project-meta">
                        <span class="project-meta-label">End Date</span>
                        <span class="project-meta-value">${escapeHtml(String(project.endDate || "Not set"))}</span>
                    </div>

                    <div class="project-meta">
                        <span class="project-meta-label">Team Size</span>
                        <span class="project-meta-value">${employees.length} ${employees.length === 1 ? "member" : "members"}</span>
                    </div>

                </div>


                <div class="project-team">

                    <span class="project-field-label">
                        Assigned Employees
                    </span>

                    <div class="project-member-list">
                        ${memberChips}
                    </div>

                </div>


                <div class="project-team">

                    <span class="project-field-label">
                        Project Manager
                    </span>

                    <div class="project-member-list">
                        <span class="project-member-chip">${managerName}</span>
                    </div>

                </div>


                <div class="task-actions">

                    <button
                        class="edit-project-button"
                        data-id="${escapeHtml(project.id)}"
                    >
                        Edit
                    </button>


                    <button
                        class="delete-project-button"
                        data-id="${escapeHtml(project.id)}"
                    >
                        Delete
                    </button>

                </div>

            `;


            projectsContainer.appendChild(
                projectCard
            );

        });


        if (shownProjects === 0 && projects.length > 0) {

            projectsContainer.innerHTML =
                `<p class="empty-message">
                    No projects match this filter.
                </p>`;

        }

    }

    catch (error) {

        console.error(
            "Error loading projects:",
            error
        );

        const projectsContainer =
            document.getElementById("projectsContainer");

        if (projectsContainer) {

            projectsContainer.innerHTML =
                `<p class="empty-message">
                    Unable to load projects. Please check whether the server is running.
                </p>`;

        }

    }

}

// =========================
// Edit / Delete Project
// =========================

document.getElementById("projectsContainer").addEventListener("click",async function (event) {

            // =========================
            // EDIT PROJECT
            // =========================

            if (
                event.target.classList.contains(
                    "edit-project-button"
                )
            ) {

                const projectId =
                    event.target.dataset.id;


                try {

                    const response =
                        await fetch(
                            `${API_URL}/projects/${projectId}`
                        );


                    if (!response.ok) {

                        throw new Error(
                            "Failed to fetch project."
                        );

                    }


                    const project =
                        await response.json();


                    // Set edit mode

                    editingProjectId =
                        project.id;


                    // Load managers first
                    // (keep the saved manager selectable even if inactive)

                    await loadProjectManagers(project.projectManagerId);

                    await loadProjectEmployees(project.assignedEmployees || []);

                    document.getElementById("projectMembersSearch").value = "";

                    document.getElementById("projectMembersPicker")?.classList.remove("open");


                    // Fill form

                    document.getElementById( "projectName").value = project.name;


                    document.getElementById("projectDescription").value = project.description;


                    document.getElementById("projectStartDate").value = project.startDate;


                    document.getElementById("projectEndDate").value = project.endDate || "";


                    document.getElementById("projectManager").value = project.projectManagerId || "";


                    document.getElementById("projectStatus").value = project.status;


                    // Edit mode: saved dates stay valid even in the past.

                    if (typeof relaxDateMinForEdit === "function") {
                        relaxDateMinForEdit("projectStartDate", project.startDate);
                        relaxDateMinForEdit("projectEndDate", project.endDate || project.startDate);
                    }

                    const projectEndEl = document.getElementById("projectEndDate");
                    if (projectEndEl) {
                        projectEndEl.min = project.startDate || projectEndEl.min;
                    }


                    // Change form to Edit mode

                    projectFormTitle.textContent = "Edit Project";

                    projectSubmitButton.textContent = "Update Project";


                    projectFormMessage.textContent = "";


                    // Open form

                    projectFormContainer.classList.add(
                        "active"
                    );

                }

                catch (error) {

                    console.error(
                        "Error loading project:",
                        error
                    );

                    projectFormMessage.textContent =
                        "Unable to load project. Please check whether the server is running.";

                    projectFormMessage.style.color = "#dc2626";

                }

            }


            // =========================
            // DELETE PROJECT
            // =========================

            if (
                event.target.classList.contains(
                    "delete-project-button"
                )
            ) {

                const projectId =
                    event.target.dataset.id;


                // Count linked tasks so the confirm warns about orphans.

                let linkedTasks = 0;

                try {

                    const tasksResponse =
                        await fetch(`${API_URL}/tasks`);

                    if (tasksResponse.ok) {

                        const allTasks =
                            await tasksResponse.json();

                        linkedTasks = allTasks.filter(task =>
                            String(task.projectId) === String(projectId)
                        ).length;

                    }

                }

                catch (countError) {

                    console.error(
                        "Error counting linked tasks:",
                        countError
                    );

                }


                if (linkedTasks > 0) {
                    alert(
                        `Cannot delete: ${linkedTasks} task(s) are linked to this project. Delete or reassign the tasks first.`
                    );
                    return;
                }

                const confirmDelete =
                    confirm(
                        "Are you sure you want to delete this project?"
                    );


                if (!confirmDelete) {

                    return;

                }


                try {

                    const response =
                        await fetch(
                            `${API_URL}/projects/${projectId}`,
                            {
                                method: "DELETE"
                            }
                        );


                    if (!response.ok) {

                        throw new Error(
                            "Failed to delete project."
                        );

                    }


                    // Reload projects in place (stay on section).

                    await loadProjects();

                    await loadDashboardProjects();

                    await loadProjectStats();

                    if (typeof loadReports === "function") {
                        await loadReports();
                    }

                }

                catch (error) {

                    console.error(
                        "Error deleting project:",
                        error
                    );

                    alert("Unable to delete project. Please try again.");

                }

            }

        }
    );



// =========================
// Dashboard Stat: Total Projects
// =========================

async function loadProjectStats() {

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


        document.getElementById(
            "totalProjects"
        ).textContent =
            projects.length;

    }

    catch (error) {

        console.error(
            "Error loading project stats:",
            error
        );

    }

}


