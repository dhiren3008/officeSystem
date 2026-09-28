// ==========================================
// ADMIN — REPORTS MODULE
// Calculates and renders the Reports tab.
// ==========================================

// =========================
// Load Reports
// =========================

async function loadReports() {

    try {

        // =========================
        // Fetch Data
        // =========================

        const [
            usersResponse,
            projectsResponse,
            tasksResponse,
            attendanceResponse,
            leavesResponse
        ] = await Promise.all([
            fetch(`${API_URL}/users`),
            fetch(`${API_URL}/projects`),
            fetch(`${API_URL}/tasks`),
            fetch(`${API_URL}/attendance`),
            fetch(`${API_URL}/leaves`)
        ]);


        if (
            !usersResponse.ok ||
            !projectsResponse.ok ||
            !tasksResponse.ok ||
            !attendanceResponse.ok ||
            !leavesResponse.ok
        ) {

            throw new Error(
                "Failed to fetch report data."
            );

        }


        const users =
            await usersResponse.json();

        const projects =
            await projectsResponse.json();

        const tasks =
            await tasksResponse.json();

        const attendance =
            await attendanceResponse.json();

        const leaves =
            await leavesResponse.json();


        // =========================
        // Employee Report
        // =========================

        const employees =
            users.filter(user => {

                return user.role === "employee" ||
                       user.role === "project_manager";

            });


        const projectManagers =
            users.filter(user => {

                return user.role === "project_manager";

            });


        const activeEmployees =
            users.filter(user => {

                return (
                    user.role === "employee" ||
                    user.role === "project_manager"
                ) &&
                String(user.status || "").trim().toLowerCase() === "active";

            });


        const inactiveEmployees =
            users.filter(user => {

                return (
                    user.role === "employee" ||
                    user.role === "project_manager"
                ) &&
                String(user.status || "").trim().toLowerCase() === "inactive";

            });


        document.getElementById(
            "reportTotalEmployees"
        ).textContent =
            employees.length;


        document.getElementById(
            "reportActiveEmployees"
        ).textContent =
            activeEmployees.length;


        document.getElementById(
            "reportInactiveEmployees"
        ).textContent =
            inactiveEmployees.length;


        document.getElementById(
            "reportProjectManagers"
        ).textContent =
            projectManagers.length;


        // =========================
        // Project Report
        // =========================

        const activeProjects =
            projects.filter(project => {

                return String(project.status || "").trim().toLowerCase() === "active";

            });


        const completedProjects =
            projects.filter(project => {

                return String(project.status || "").trim().toLowerCase() === "completed";

            });


        document.getElementById(
            "reportTotalProjects"
        ).textContent =
            projects.length;


        document.getElementById(
            "reportActiveProjects"
        ).textContent =
            activeProjects.length;


        document.getElementById(
            "reportCompletedProjects"
        ).textContent =
            completedProjects.length;


        // =========================
        // Task Report
        // =========================

        const pendingTasks =
            tasks.filter(task => {

                return String(task.status || "").trim().toLowerCase() === "pending";

            });


        const inProgressTasks =
            tasks.filter(task => {

                return String(task.status || "").trim().toLowerCase() === "in_progress";

            });


        const completedTasks =
            tasks.filter(task => {

                return String(task.status || "").trim().toLowerCase() === "completed";

            });


        document.getElementById(
            "reportTotalTasks"
        ).textContent =
            tasks.length;


        document.getElementById(
            "reportPendingTasks"
        ).textContent =
            pendingTasks.length;


        document.getElementById(
            "reportInProgressTasks"
        ).textContent =
            inProgressTasks.length;


        document.getElementById(
            "reportCompletedTasks"
        ).textContent =
            completedTasks.length;


        // =========================
        // Attendance Report (date-specific, same rule as
        // the Attendance section; defaults to today)
        // =========================

        const reportDateInput =
            document.getElementById("reportAttendanceDate");

        const now = new Date();

        const reportToday =
            `${now.getFullYear()}-` +
            `${String(now.getMonth() + 1).padStart(2, "0")}-` +
            `${String(now.getDate()).padStart(2, "0")}`;

        if (reportDateInput) {

            if (!reportDateInput.value) {
                reportDateInput.value = reportToday;
            }

            reportDateInput.max = reportToday;

            if (!reportDateInput.dataset.wired) {

                reportDateInput.dataset.wired = "true";

                reportDateInput.addEventListener("change", loadReports);

            }

        }

        const reportDate =
            (reportDateInput && reportDateInput.value) || reportToday;

        const attendanceSummary =
            computeAttendanceSummary(
                users,
                attendance,
                leaves,
                reportDate
            );


        document.getElementById(
            "reportPresent"
        ).textContent =
            attendanceSummary.present;


        document.getElementById(
            "reportAbsent"
        ).textContent =
            attendanceSummary.absent;


        document.getElementById(
            "reportOnLeave"
        ).textContent =
            attendanceSummary.onLeave;


        // =========================
        // Leave Report
        // =========================

        const pendingLeaves =
            leaves.filter(leave => {

                return String(leave.status || "").trim().toLowerCase() === "pending";

            });


        const approvedLeaves =
            leaves.filter(leave => {

                return String(leave.status || "").trim().toLowerCase() === "approved";

            });


        const rejectedLeaves =
            leaves.filter(leave => {

                return String(leave.status || "").trim().toLowerCase() === "rejected";

            });


        document.getElementById(
            "reportPendingLeaves"
        ).textContent =
            pendingLeaves.length;


        document.getElementById(
            "reportApprovedLeaves"
        ).textContent =
            approvedLeaves.length;


        document.getElementById(
            "reportRejectedLeaves"
        ).textContent =
            rejectedLeaves.length;


        }

    catch (error) {

        console.error(
            "Error loading reports:",
            error
        );

        const reportsContainer =
            document.getElementById("reportsContainer");

        if (reportsContainer && !reportsContainer.querySelector(".reports-error")) {

            const errorMessage = document.createElement("p");

            errorMessage.classList.add("empty-message", "reports-error");

            errorMessage.textContent =
                "Unable to load reports. Please check whether the server is running.";

            reportsContainer.prepend(errorMessage);

        }

    }

}


