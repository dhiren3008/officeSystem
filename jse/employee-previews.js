// ==========================================
// EMPLOYEE — DASHBOARD PREVIEWS MODULE
// Builds the small project/task/leave/attendance preview
// widgets shown on the dashboard tab.
// ==========================================

// =========================
// Load Dashboard Previews
// =========================

async function loadDashboardPreviews() {

    try {

        // =========================
        // Get Projects
        // =========================

        const projectsResponse = await fetch(`${API_URL}/projects`);

        const projects = await projectsResponse.json();

        // =========================
        // Get Tasks
        // =========================

        const tasksResponse = await fetch(`${API_URL}/tasks`);

        const tasks = await tasksResponse.json();

        // =========================
        // Get Leaves
        // =========================

        const leavesResponse = await fetch(`${API_URL}/leaves`);

        const leaves = await leavesResponse.json();

        // =========================
        // Get Attendance
        // =========================

        const attendanceResponse = await fetch(`${API_URL}/attendance`);

        const attendance = await attendanceResponse.json();

        // =========================
        // My Tasks
        // =========================

        const myTasks = tasks.filter(task => {
            return getTaskAssigneeIds(task).includes(String(loggedInUser.id));
        });

        // =========================
        // My Projects
        // =========================

        const myProjects = projects.filter(project => {
            return Array.isArray(project.assignedEmployees) &&
                project.assignedEmployees.some(employeeId => {
                    return String(employeeId) === String(loggedInUser.id);
                });
        });

        // =========================
        // My Leaves
        // =========================

        const myLeaves =
            leaves.filter(leave => {

                return String(leave.employeeId) ===
                       String(loggedInUser.id);

            });


        // =========================
        // Project Preview
        // =========================

        const dashboardProjects = document.getElementById("dashboardProjects");

        dashboardProjects.innerHTML = "";


        if (myProjects.length === 0) {

            dashboardProjects.innerHTML =
                `<p class="empty-message">
                    No projects assigned.
                </p>`;

        } else {

            myProjects.slice(0, 2).forEach(project => {

                const projectCard =
                    document.createElement("div");

                projectCard.classList.add(
                    "project-card"
                );


                projectCard.innerHTML = `

                    <h3>
                        ${escapeHtml(project.name)}
                    </h3>

                    <p>
                        Status: ${project.status}
                    </p>

                `;


                dashboardProjects.appendChild(
                    projectCard
                );

            });

        }


        // =========================
        // Task Preview
        // =========================

        const dashboardTasks =
            document.getElementById(
                "dashboardTasks"
            );


        dashboardTasks.innerHTML = "";


        if (myTasks.length === 0) {

            dashboardTasks.innerHTML =
                `<p class="empty-message">
                    No tasks assigned.
                </p>`;

        } else {

            myTasks.slice(0, 2).forEach(task => {

                const taskCard =
                    document.createElement("div");

                taskCard.classList.add(
                    "task-card"
                );


                taskCard.innerHTML = `

                    <h3>
                        ${escapeHtml(task.title)}
                    </h3>

                    <p>
                        Status: ${task.status}
                    </p>

                `;


                dashboardTasks.appendChild(
                    taskCard
                );

            });

        }

        // =========================
        // Leave Preview
        // =========================

        const dashboardLeaves =
            document.getElementById(
                "dashboardLeaves"
            );


        dashboardLeaves.innerHTML = "";


        if (myLeaves.length === 0) {

            dashboardLeaves.innerHTML =
                `<p class="empty-message">
                    No leave requests found.
                </p>`;

        } else {

            myLeaves.slice(0, 2).forEach(leave => {

                const leaveCard =
                    document.createElement("div");

                leaveCard.classList.add("preview-item");


                leaveCard.innerHTML = `

                    <p>
                        ${leave.startDate}
                        to
                        ${leave.endDate}
                    </p>

                    <p>
                        Status: ${leave.status}
                    </p>

                `;


                dashboardLeaves.appendChild(
                    leaveCard
                );

            });

        }

        // =========================
        // Attendance Preview
        // =========================

        const dashboardAttendanceStatus = document.getElementById("dashboardAttendanceStatus");

        const dashboardCheckInTime = document.getElementById("dashboardCheckInTime");

        const dashboardCheckOutTime = document.getElementById("dashboardCheckOutTime");

        const now = new Date();

        const today =
            `${now.getFullYear()}-` +
            `${String(now.getMonth() + 1).padStart(2, "0")}-` +
            `${String(now.getDate()).padStart(2, "0")}`;

        const todayAttendance = attendance.find(record => {
            return String(record.employeeId) === String(loggedInUser.id) && record.date === today;
        });


        if (!todayAttendance) {

            dashboardAttendanceStatus.textContent =
                "Not checked in";

            dashboardCheckInTime.textContent =
                "--";

            dashboardCheckOutTime.textContent =
                "--";

        } else {

            dashboardCheckInTime.textContent = todayAttendance.checkIn || "--";

            dashboardCheckOutTime.textContent = todayAttendance.checkOut || "--";


            if (todayAttendance.checkOut) {
                dashboardAttendanceStatus.textContent = "Attendance completed";

            } else {
                dashboardAttendanceStatus.textContent = "Currently checked in";
            }
        }
    }
    catch (error) {

        console.error(
            "Error loading dashboard previews:",
            error
        );

    }

}


