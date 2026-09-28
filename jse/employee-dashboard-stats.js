// ==========================================
// EMPLOYEE — DASHBOARD STATS MODULE
// Aggregated dashboard counters (tasks/projects/leaves).
// ==========================================

// =========================
// Load Dashboard Statistics
// =========================

async function loadDashboardStats() {

    try {

        // Get tasks

        const tasksResponse =
            await fetch(`${API_URL}/tasks`);

        if (!tasksResponse.ok) {

            throw new Error(
                "Failed to fetch tasks."
            );

        }

        const tasks =
            await tasksResponse.json();


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


        // Get leaves

        const leavesResponse =
            await fetch(`${API_URL}/leaves`);

        if (!leavesResponse.ok) {

            throw new Error(
                "Failed to fetch leaves."
            );

        }

        const leaves =
            await leavesResponse.json();


        // =========================
        // My Tasks
        // =========================

        const myTasks =
            tasks.filter(task => {

                return getTaskAssigneeIds(task).includes(
                       String(loggedInUser.id));

            });


        // Pending Tasks

        const pendingTasks =
            myTasks.filter(task => {

                return task.status !== "completed";

            });


        // Completed Tasks

        const completedTasks =
            myTasks.filter(task => {

                return task.status === "completed";

            });


        // =========================
        // My Projects
        // =========================

        const myProjects =
            projects.filter(project => {

                return Array.isArray(project.assignedEmployees) &&
                    project.assignedEmployees.some(employeeId => {

                        return String(employeeId) ===
                            String(loggedInUser.id);

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
        // Update Dashboard
        // =========================

        document.getElementById(
            "projectCount"
        ).textContent =
            myProjects.length;


        document.getElementById(
            "pendingTaskCount"
        ).textContent =
            pendingTasks.length;


        document.getElementById(
            "completedTaskCount"
        ).textContent =
            completedTasks.length;


        document.getElementById(
            "leaveRequestCount"
        ).textContent =
            myLeaves.length;

    }

    catch (error) {

        console.error(
            "Error loading dashboard statistics:",
            error
        );

    }

}


