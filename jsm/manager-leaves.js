// ==========================================
// MANAGER — LEAVES MODULE
// Submit leave, my leaves list, dashboard leaves preview.
// ==========================================

// =========================
// LEAVES
// =========================

// Leave Elements

const applyLeaveButton =
    document.getElementById("applyLeaveButton");

const leaveFormContainer =
    document.getElementById("leaveFormContainer");

const leaveForm =
    document.getElementById("leaveForm");

const cancelLeaveButton =
    document.getElementById("cancelLeaveButton");

const leaveFormMessage =
    document.getElementById("leaveFormMessage");

const leavesContainer =
    document.getElementById("leavesContainer");


// =========================
// OPEN LEAVE FORM
// =========================

if (applyLeaveButton) {

    applyLeaveButton.addEventListener(
        "click",
        function() {

            leaveFormContainer.classList.add("active");

            leaveFormMessage.textContent = "";

        }
    );

}


// =========================
// CANCEL LEAVE FORM
// =========================

if (cancelLeaveButton) {

    cancelLeaveButton.addEventListener(
        "click",
        function() {

            leaveForm.reset();

            leaveFormContainer.classList.remove("active");

            leaveFormMessage.textContent = "";

        }
    );

}

// =========================
// SUBMIT LEAVE
// =========================

if (leaveForm) {

    // Hard guard: the form must never navigate (whole-page white flash).

    leaveForm.setAttribute("action", "javascript:void(0);");

    leaveForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

        },
        true
    );

    leaveForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const startDate =
                document.getElementById(
                    "leaveStartDate"
                ).value;

            const endDate =
                document.getElementById(
                    "leaveEndDate"
                ).value;

            const reason =
                document.getElementById(
                    "leaveReason"
                ).value.trim();


            // =========================
            // VALIDATION
            // =========================

            if (
                !startDate ||
                !endDate ||
                !reason
            ) {

                leaveFormMessage.textContent =
                    "Please fill all fields.";

                return;

            }


            // End date cannot be before start date

            if (endDate < startDate) {

                leaveFormMessage.textContent =
                    "End date cannot be before start date.";

                return;

            }


            try {

                document.getElementById(
                    "leaveSubmitButton"
                ).disabled = true;


                // =========================
                // LEAVE DATA
                // =========================

                const leaveData = {

                    id: await getNextId("leaves"),

                    employeeId:
                        String(loggedInUser.id),

                    startDate:
                        startDate,

                    endDate:
                        endDate,

                    reason:
                        reason,

                    status:
                        "pending"

                };


                // =========================
                // SAVE LEAVE
                // =========================

                const response =
                    await fetch(
                        `${API_URL}/leaves`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    leaveData
                                )
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        "Failed to submit leave"
                    );

                }


                // =========================
                // SUCCESS
                // =========================

                leaveFormMessage.textContent =
                    "Leave request submitted successfully.";


                // In-place refresh (no reload, no section switch).

                const leavesScrollY = window.scrollY;

                await loadMyLeaves();

                await loadDashboardLeaves();


                // Stay on Leaves (no dashboard jump).

                persistManagerSection("leaves");

                window.scrollTo(0, leavesScrollY);


                document.getElementById(
                    "leaveSubmitButton"
                ).disabled = false;


                // Keep the message visible, then close in place.

                setTimeout(() => {

                    const leavesScrollY = window.scrollY;

                    leaveForm.reset();

                    syncCustomWidgetsIn(leaveForm);

                    leaveFormMessage.textContent = "";

                    if (leaveFormContainer) {
                        leaveFormContainer.classList.remove("active");
                    }

                    persistManagerSection("leaves");

                    window.scrollTo(0, leavesScrollY);

                }, 1200);


            } catch (error) {

                console.error(
                    "Leave submission error:",
                    error
                );

                leaveFormMessage.textContent =
                    "Unable to submit leave request.";

                document.getElementById(
                    "leaveSubmitButton"
                ).disabled = false;

            }

        }
    );

}

// =========================
// LOAD MY LEAVES
// =========================

async function loadMyLeaves() {

    try {

        const response =
            await fetch(`${API_URL}/leaves`);


        if (!response.ok) {

            throw new Error(
                "Failed to fetch leaves"
            );

        }


        const leaves =
            await response.json();


        // =========================
        // FILTER MY LEAVES
        // =========================

        const myLeaves =
            leaves.filter(leave => {

                return String(
                    leave.employeeId
                ) === String(
                    loggedInUser.id
                );

            });


        // =========================
        // NO LEAVES
        // =========================

        if (myLeaves.length === 0) {

            leavesContainer.innerHTML = `
                <p class="empty-message">
                    No leave requests found.
                </p>
            `;

            return;

        }


        // =========================
        // DISPLAY LEAVES
        // =========================

            leavesContainer.innerHTML = myLeaves.map(leave => {
                return `
                    <div class="leave-card">

                        <div>

                            <h3>
                                Leave Request
                            </h3>

                            <p>
                                <strong>Start Date:</strong>
                                ${leave.startDate}
                            </p>

                            <p>
                                <strong>End Date:</strong>
                                ${leave.endDate}
                            </p>

                            <p>
                                <strong>Reason:</strong>
                                ${escapeHtml(leave.reason)}
                            </p>

                            ${
                                leave.status === "rejected" && leave.rejectionReason
                                ? `
                                    <p class="rejection-reason">
                                        <strong>Admin's Note:</strong>
                                        ${escapeHtml(leave.rejectionReason)}
                                    </p>
                                `
                                : ""
                            }

                        </div>


                        <div>

                            <p>
                                <strong>Status:</strong>
                                ${leave.status}
                            </p>

                        </div>

                    </div>
                `;

            }).join("");


    } catch (error) {

        console.error(
            "Error loading leaves:",
            error
        );


        leavesContainer.innerHTML = `
            <p class="empty-message">
                Unable to load leave requests.
            </p>
        `;

    }

}


// =========================
// LOAD DASHBOARD LEAVES
// =========================

async function loadDashboardLeaves() {

    const dashboardLeaves =
        document.getElementById("dashboardLeaves");

    if (!dashboardLeaves) {
        return;
    }

    try {

        const response =
            await fetch(`${API_URL}/leaves`);

        if (!response.ok) {

            throw new Error(
                "Failed to fetch leaves"
            );

        }

        const leaves =
            await response.json();


        // =========================
        // FILTER MY LEAVES
        // =========================

        const myLeaves =
            leaves.filter(leave => {

                return String(
                    leave.employeeId
                ) === String(
                    loggedInUser.id
                );

            });


        // =========================
        // NO LEAVES
        // =========================

        if (myLeaves.length === 0) {

            dashboardLeaves.innerHTML = `
                <p class="empty-message">
                    No leave requests found.
                </p>
            `;

            return;

        }


        // Show latest 3 requests

        const previewLeaves =
            myLeaves.slice(-3).reverse();


        dashboardLeaves.innerHTML =
            previewLeaves.map(leave => {

                return `
                    <div class="preview-item">

                        <h4>
                            Leave Request
                        </h4>

                        <p>
                            ${leave.startDate}
                            to
                            ${leave.endDate}
                        </p>

                        <p>
                            Status:
                            ${leave.status}
                        </p>

                    </div>
                `;

            }).join("");


    } catch (error) {

        console.error(
            "Dashboard leaves error:",
            error
        );

        dashboardLeaves.innerHTML = `
            <p class="empty-message">
                Unable to load leaves.
            </p>
        `;

    }

}


