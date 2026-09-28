// ==========================================
// MANAGER — PROJECTS MODULE
// My projects list, dashboard project preview, project statistics,
// full projects section.
// ==========================================

// =========================
// LOAD MY PROJECTS
// =========================

async function loadMyProjects() {

    try {

        const response =
            await fetch(
                `${API_URL}/projects`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load projects"
            );

        }


        const projects =
            await response.json();


        const myProjects =
            projects.filter(project => {

                return String(
                    project.projectManagerId
                ) === String(
                    loggedInUser.id
                );

            });


        return myProjects;


    } catch (error) {

        console.error(
            "Error loading manager projects:",
            error
        );


        return [];

    }

}


// =========================
// DASHBOARD PROJECT PREVIEW
// =========================

async function loadDashboardProjects() {

    const projectsContainer =
        document.getElementById(
            "dashboardProjects"
        );


    if (!projectsContainer) {

        return;

    }


    const myProjects =
        await loadMyProjects();


    if (myProjects.length === 0) {

        projectsContainer.innerHTML = `
            <p class="empty-message">
                No projects assigned.
            </p>
        `;

        return;

    }


    const previewProjects =
        myProjects.slice(0, 3);


    projectsContainer.innerHTML =
        previewProjects.map(project => {

            return `
                <div class="preview-item">

                    <h4>
                        ${escapeHtml(project.name)}
                    </h4>

                    <p>
                        ${escapeHtml(project.description)}
                    </p>

                    <span>
                        Status: ${project.status}
                    </span>

                </div>
            `;

        }).join("");

}


// =========================
// LOAD PROJECT STATISTICS
// =========================

async function loadProjectStatistics() {

    const myProjects =
        await loadMyProjects();


    const totalProjectsElement =
        document.getElementById(
            "totalProjects"
        );


    if (totalProjectsElement) {

        totalProjectsElement.textContent =
            myProjects.length;

    }

}


// =========================
// LOAD MY PROJECTS SECTION
// =========================

async function loadMyProjectsSection() {

    const projectsContainer =
        document.getElementById(
            "projectsContainer"
        );


    if (!projectsContainer) {

        return;

    }


    const myProjects =
        await loadMyProjects();


    if (myProjects.length === 0) {

        projectsContainer.innerHTML = `
            <p class="empty-message">
                No projects assigned.
            </p>
        `;

        return;

    }


    let users = [];

    try {

        const usersResponse =
            await fetch(
                `${API_URL}/users`
            );

        if (usersResponse.ok) {
            users = await usersResponse.json();
        }

    } catch (userError) {

        console.error(
            "Error loading users for projects:",
            userError
        );

    }


    const userLabel = userId => {

        const user = users.find(user =>
            String(user.id) === String(userId)
        );

        return user
            ? escapeHtml(user.name)
            : escapeHtml(String(userId));

    };


        projectsContainer.innerHTML =
        myProjects.map(project => {

            const employees =
                Array.isArray(project.assignedEmployees)
                    ? project.assignedEmployees
                    : [];

            const memberChips =
                employees.length > 0
                    ? employees.map(employeeId => {

                        const user = users.find(user =>
                            String(user.id) === String(employeeId)
                        );

                        const label = user
                            ? escapeHtml(user.name)
                            : "Former member";

                        return `<span class="project-member-chip">${label}</span>`;

                    }).join("")
                    : `<span class="project-member-none">No employees assigned</span>`;

            const statusKey =
                String(project.status || "").trim().toLowerCase();

            const statusText =
                statusKey.replace(/_/g, " ") || "unknown";

            return `
                <article class="project-card">

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

                </article>
            `;

        }).join("");
}



