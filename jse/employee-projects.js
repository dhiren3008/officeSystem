// ==========================================
// EMPLOYEE — PROJECTS MODULE
// My projects list.
// ==========================================

// =========================
// Load My Projects
// =========================

async function loadMyProjects() {

    try {

        // Get projects

        const projectsResponse =
            await fetch(`${API_URL}/projects`);

        if (!projectsResponse.ok) {

            throw new Error(
                "Failed to fetch projects."
            );

        }

        const projects =
            await projectsResponse.json();


        const usersResponse =
            await fetch(`${API_URL}/users`);

        const users =
            usersResponse.ok ? await usersResponse.json() : [];


        // Find projects assigned to logged-in employee

        const myProjects =
            projects.filter(project => {

                return project.assignedEmployees &&
                       project.assignedEmployees.some(employeeId => {

                           return String(employeeId) ===
                                  String(loggedInUser.id);

                       });

            });


        const projectsContainer =
            document.getElementById(
                "projectsContainer"
            );


        // Clear container

        projectsContainer.innerHTML = "";


        // No projects

        if (myProjects.length === 0) {

            projectsContainer.innerHTML =
                `<p class="empty-message">
                    No projects assigned.
                </p>`;

            return;

        }


        // Display projects

        myProjects.forEach(project => {

            const manager = users.find(user =>
                String(user.id) === String(project.projectManagerId)
            );

            const managerLabel = manager
                ? escapeHtml(manager.name)
                : "Not assigned";

            const projectCard =
                document.createElement("article");

                projectCard.classList.add("project-card");

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
                        <span class="project-meta-label">Project Manager</span>
                        <span class="project-meta-value">${managerLabel}</span>
                    </div>

                    <div class="project-meta">
                        <span class="project-meta-label">Start Date</span>
                        <span class="project-meta-value">${escapeHtml(String(project.startDate || "-"))}</span>
                    </div>

                    <div class="project-meta">
                        <span class="project-meta-label">End Date</span>
                        <span class="project-meta-value">${escapeHtml(String(project.endDate || "Not set"))}</span>
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

            `;


            projectsContainer.appendChild(
                projectCard
            );

        });

    }

    catch (error) {

        console.error(
            "Error loading my projects:",
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


