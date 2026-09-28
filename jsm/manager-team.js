// ==========================================
// MANAGER — TEAM MODULE
// My team members, team members list, dashboard team preview.
// ==========================================

// =========================
// LOAD MY TEAM MEMBERS
// =========================

async function loadMyTeamMembers() {

    const employeesContainer =
        document.getElementById(
            "employeesContainer"
        );


    if (!employeesContainer) {

        return;

    }


    const myProjects =
        await loadMyProjects();


    const employeeIds = [];


    myProjects.forEach(project => {

        if (
            Array.isArray(
                project.assignedEmployees
            )
        ) {

            project.assignedEmployees.forEach(
                employeeId => {

                    employeeIds.push(
                        String(employeeId)
                    );

                }
            );

        }

    });


    const uniqueEmployeeIds =
        [...new Set(employeeIds)];


    if (uniqueEmployeeIds.length === 0) {

        employeesContainer.innerHTML = `
            <p class="empty-message">
                No employees assigned to your projects.
            </p>
        `;

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/users`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load users"
            );

        }


        const users =
            await response.json();


        const teamMembers =
            users.filter(user => {

                return (
                    uniqueEmployeeIds.includes(
                        String(user.id)
                    ) &&
                    String(user.status || "").trim().toLowerCase() ===
                        "active"
                );

            });


        if (teamMembers.length === 0) {

            employeesContainer.innerHTML = `
                <p class="empty-message">
                    No employees found.
                </p>
            `;

            return;

        }


        employeesContainer.innerHTML =
            teamMembers.map(employee => {

                return `
                    <div class="employee-card">

                        <h3>
                            ${escapeHtml(employee.name)}
                        </h3>

                        <p>
                            <strong>Email:</strong>
                            ${escapeHtml(employee.email)}
                        </p>

                        <p>
                            <strong>Department:</strong>
                            ${escapeHtml(employee.department)}
                        </p>

                        <p>
                            <strong>Designation:</strong>
                            ${escapeHtml(employee.designation)}
                        </p>

                        <p>
                            <strong>Status:</strong>
                            ${escapeHtml(employee.status)}
                        </p>

                    </div>
                `;

            }).join("");


    } catch (error) {

        console.error(
            "Error loading team members:",
            error
        );

    }

}


// =========================
// LOAD TEAM MEMBERS
// =========================

async function loadTeamMembers() {

    const myProjects =
        await loadMyProjects();


    const employeeIds = [];


    myProjects.forEach(project => {

        if (
            Array.isArray(
                project.assignedEmployees
            )
        ) {

            project.assignedEmployees.forEach(
                employeeId => {

                    employeeIds.push(
                        String(employeeId)
                    );

                }
            );

        }

    });


    const uniqueEmployeeIds =
        [...new Set(employeeIds)];


    const totalTeamMembers =
        uniqueEmployeeIds.length;


    const teamMembersElement =
        document.getElementById(
            "totalTeamMembers"
        );


    if (teamMembersElement) {

        teamMembersElement.textContent =
            totalTeamMembers;

    }


    }


// =========================
// LOAD DASHBOARD TEAM PREVIEW
// =========================

async function loadDashboardTeam() {

    const dashboardEmployees =
        document.getElementById(
            "dashboardEmployees"
        );


    if (!dashboardEmployees) {

        return;

    }


    const myProjects =
        await loadMyProjects();


    const employeeIds = [];


    myProjects.forEach(project => {

        if (
            Array.isArray(
                project.assignedEmployees
            )
        ) {

            project.assignedEmployees.forEach(
                employeeId => {

                    employeeIds.push(
                        String(employeeId)
                    );

                }
            );

        }

    });


    const uniqueEmployeeIds =
        [...new Set(employeeIds)];


    if (uniqueEmployeeIds.length === 0) {

        dashboardEmployees.innerHTML = `
            <p class="empty-message">
                No team members found.
            </p>
        `;

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/users`
            );


        const users =
            await response.json();


        const teamMembers =
            users.filter(user => {

                return (
                    uniqueEmployeeIds.includes(
                        String(user.id)
                    ) &&
                    String(user.status || "").trim().toLowerCase() ===
                        "active"
                );

            });


        const previewMembers =
            teamMembers.slice(0, 3);


        dashboardEmployees.innerHTML =
            previewMembers.map(employee => {

                return `
                    <div class="preview-item">

                        <h4>
                            ${escapeHtml(employee.name)}
                        </h4>

                        <p>
                            ${escapeHtml(employee.designation)}
                        </p>

                    </div>
                `;

            }).join("");


    } catch (error) {

        console.error(
            "Error loading dashboard team:",
            error
        );

    }

}



