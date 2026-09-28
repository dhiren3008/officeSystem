// ==========================================
// ADMIN — LEAVES MODULE
// Leave list, approve/reject, dashboard leaves preview, leave stats.
// ==========================================

// =========================
// Load Leaves
// =========================

async function loadLeaves() {

    try {

        // Fetch leaves

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
        // Leave Summary
        // =========================

        const pendingLeaves =
            leaves.filter(leave => {

                return leave.status === "pending";

            });


        const approvedLeaves =
            leaves.filter(leave => {

                return leave.status === "approved";

            });


        const rejectedLeaves =
            leaves.filter(leave => {

                return leave.status === "rejected";

            });


        document.getElementById(
            "pendingLeaveCount"
        ).textContent =
            pendingLeaves.length;


        document.getElementById(
            "approvedLeaveCount"
        ).textContent =
            approvedLeaves.length;


        document.getElementById(
            "rejectedLeaveCount"
        ).textContent =
            rejectedLeaves.length;


        // Fetch users

        const usersResponse =
            await fetch(`${API_URL}/users`);

        if (!usersResponse.ok) {

            throw new Error(
                "Failed to fetch users."
            );

        }

        const users =
            await usersResponse.json();


        // =========================
        // Leaves Container
        // =========================

        const leavesContainer =
            document.getElementById(
                "leavesContainer"
            );


        // Clear previous leaves

        leavesContainer.innerHTML = "";


        // =========================
        // No Leaves
        // =========================

        if (leaves.length === 0) {

            leavesContainer.innerHTML =
                `<p class="empty-message">
                    No leave requests found.
                </p>`;

            return;

        }


        // =========================
        // Display Leaves
        // =========================

        leaves.forEach(leave => {

            // Find employee

            const employee =
                users.find(user => {

                    return String(user.id) ===
                           String(leave.employeeId);

                });


            const employeeName =
                employee
                    ? escapeHtml(employee.name)
                    : "Unknown Employee";


            // Create leave card

            const leaveCard =
                document.createElement("div");


            leaveCard.classList.add(
                "leave-card"
            );


            leaveCard.innerHTML = `

                <div class="leave-info">

                    <h3>
                        ${employeeName}
                    </h3>

                    <p>
                        Start Date:
                        ${escapeHtml(leave.startDate)}
                    </p>

                    <p>
                        End Date:
                        ${escapeHtml(leave.endDate)}
                    </p>

                    <p>
                        Reason:
                        ${escapeHtml(leave.reason)}
                    </p>

                </div>


                <div class="leave-status">

                    <p>
                        Status:
                        ${escapeHtml(leave.status)}
                    </p>

                    ${
                        leave.status === "rejected" && leave.rejectionReason
                        ? `
                            <p class="rejection-reason">
                                Rejection Reason:
                                ${escapeHtml(leave.rejectionReason)}
                            </p>
                        `
                        : ""
                    }


                    ${
                        leave.status === "pending"
                        ? `
                            <button
                                class="approve-leave-button"
                                data-id="${escapeHtml(leave.id)}"
                            >
                                Approve
                            </button>

                            <button
                                class="reject-leave-button"
                                data-id="${escapeHtml(leave.id)}"
                            >
                                Reject
                            </button>

                            <div class="reject-reason-panel" id="rejectPanel-${escapeHtml(leave.id)}">

                                <textarea
                                    class="reject-reason-input"
                                    id="rejectReason-${escapeHtml(leave.id)}"
                                    placeholder="Enter reason for rejection"
                                ></textarea>

                                <div class="reject-reason-actions">

                                    <button
                                        type="button"
                                        class="confirm-reject-button danger-button"
                                        data-id="${escapeHtml(leave.id)}"
                                    >
                                        Confirm Reject
                                    </button>

                                    <button
                                        type="button"
                                        class="cancel-reject-button secondary-button"
                                        data-id="${escapeHtml(leave.id)}"
                                    >
                                        Cancel
                                    </button>

                                </div>

                            </div>
                        `
                        : ""
                    }

                </div>

            `;


            leavesContainer.appendChild(
                leaveCard
            );

        });

    }

    catch (error) {

        console.error(
            "Error loading leaves:",
            error
        );

        const leavesContainer =
            document.getElementById("leavesContainer");

        if (leavesContainer) {

            leavesContainer.innerHTML =
                `<p class="empty-message">
                    Unable to load leave requests. Please check whether the server is running.
                </p>`;

        }

    }

}

// =========================
// Approve / Reject Leave
// =========================

document.getElementById("leavesContainer").addEventListener(
    "click",
    async function (event) {

        // =========================
        // Approve Leave
        // =========================

        if (
            event.target.classList.contains(
                "approve-leave-button"
            )
        ) {

            const leaveId =
                event.target.dataset.id;


            try {

                const response =
                    await fetch(
                        `${API_URL}/leaves/${leaveId}`,
                        {
                            method: "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                status: "approved",
                                rejectionReason: ""
                            })
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        "Failed to approve leave."
                    );

                }


                // Reload leaves in place (no section switch).

                await loadLeaves();

                await loadLeaveStats();

                await loadDashboardLeaves();

                if (typeof loadReports === "function") {
                    await loadReports();
                }

            }

            catch (error) {

                console.error(
                    "Error approving leave:",
                    error
                );

                alert("Unable to approve leave. Please try again.");

            }

        }


                // =========================
        // Toggle Reject Panel
        // =========================

        if (
            event.target.classList.contains(
                "reject-leave-button"
            )
        ) {

            const leaveId =
                event.target.dataset.id;

            const panel =
                document.getElementById(
                    `rejectPanel-${leaveId}`
                );

            if (panel) {

                panel.classList.toggle("active");

            }

        }


        // =========================
        // Cancel Reject
        // =========================

        if (
            event.target.classList.contains(
                "cancel-reject-button"
            )
        ) {

            const leaveId =
                event.target.dataset.id;

            const panel =
                document.getElementById(
                    `rejectPanel-${leaveId}`
                );

            if (panel) {

                panel.classList.remove("active");

            }

        }

        // =========================
        // Confirm Reject (with reason)
        // =========================

        if (
            event.target.classList.contains(
                "confirm-reject-button"
            )
        ) {

            const leaveId =
                event.target.dataset.id;

            const reasonInput =
                document.getElementById(
                    `rejectReason-${leaveId}`
                );

            const rejectionReason =
                reasonInput
                    ? reasonInput.value.trim()
                    : "";

            if (!rejectionReason) {
                alert("Please enter a reason for rejection.");
                return;
            }

            try {

                const response =
                    await fetch(
                        `${API_URL}/leaves/${leaveId}`,
                        {
                            method: "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                status: "rejected",
                                rejectionReason: rejectionReason
                            })
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        "Failed to reject leave."
                    );

                }


                // Reload leaves in place (no section switch).

                await loadLeaves();

                await loadLeaveStats();

                await loadDashboardLeaves();

                if (typeof loadReports === "function") {
                    await loadReports();
                }

            }

            catch (error) {

                console.error(
                    "Error rejecting leave:",
                    error
                );

                alert("Unable to reject leave. Please try again.");

            }

        }

    }
);

 // =========================
 // Dashboard Leaves Preview
 // =========================

async function loadDashboardLeaves() {

    try {

        const leavesResponse =
            await fetch(`${API_URL}/leaves`);

        if (!leavesResponse.ok) {

            throw new Error(
                "Failed to fetch leaves."
            );

        }

        const leaves =
            await leavesResponse.json();


        const usersResponse =
            await fetch(`${API_URL}/users`);

        if (!usersResponse.ok) {

            throw new Error(
                "Failed to fetch users."
            );

        }

        const users =
            await usersResponse.json();


        // Show latest 4 leaves

        const recentLeaves =
            leaves.slice(-4).reverse();


        const dashboardLeaves =
            document.getElementById(
                "dashboardLeaves"
            );


        // Clear previous content

        dashboardLeaves.innerHTML = "";


        // No leaves

        if (recentLeaves.length === 0) {

            dashboardLeaves.innerHTML =
                `<p class="empty-message">
                    No leave requests found.
                </p>`;

            return;

        }


        // Display leaves

        recentLeaves.forEach(leave => {

            const employee =
                users.find(user => {

                    return String(user.id) ===
                           String(leave.employeeId);

                });


            const employeeName =
                employee
                    ? escapeHtml(employee.name)
                    : "Unknown Employee";


            const leaveItem =
                document.createElement("div");


            leaveItem.classList.add(
                "dashboard-preview-item"
            );


            leaveItem.innerHTML = `

                <h4>
                    ${employeeName}
                </h4>

                <p>
                    ${escapeHtml(leave.startDate)}
                    -
                    ${escapeHtml(leave.endDate)}
                </p>

                <p>
                    Status:
                    ${escapeHtml(leave.status)}
                </p>

            `;


            dashboardLeaves.appendChild(
                leaveItem
            );

        });

    }

    catch (error) {

        console.error(
            "Error loading dashboard leaves:",
            error
        );

    }

}


// =========================
// Dashboard Stat: Pending Leaves
// =========================

async function loadLeaveStats() {

    try {

        const response =
            await fetch(`${API_URL}/leaves`);

        if (!response.ok) {

            throw new Error(
                "Failed to fetch leaves."
            );

        }

        const leaves =
            await response.json();


        const pendingLeaves =
            leaves.filter(leave => {

                return leave.status === "pending";

            });


        document.getElementById(
            "pendingLeaves"
        ).textContent =
            pendingLeaves.length;

    }

    catch (error) {

        console.error(
            "Error loading leave stats:",
            error
        );

    }

}


