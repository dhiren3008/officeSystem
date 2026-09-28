// ==========================================
// EMPLOYEE — LEAVES MODULE
// Apply for leave, load my leave requests.
// ==========================================

// =========================
// Leave Management
// =========================

const leaveForm = document.getElementById("leaveForm");

const leaveFormMessage = document.getElementById("leaveFormMessage");
// =========================
// Apply Leave
// =========================

leaveForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    // Get form values

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


    // Check date

    if (endDate < startDate) {

        leaveFormMessage.textContent =
            "End date cannot be before start date.";

        leaveFormMessage.style.color =
            "#dc2626";

        return;

    }


    // Create leave object (ID generation inside try so a
    // stopped server shows a message instead of hanging)

    let leaveData = null;

    try {

        leaveData = {

            id: await getNextId("leaves"),

            employeeId: String(loggedInUser.id),

            startDate: startDate,

            endDate: endDate,

            reason: reason,

            status: "pending"

        };

        document.getElementById(
            "leaveSubmitButton"
        ).disabled = true;

        const response =
            await fetch(`${API_URL}/leaves`, {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(leaveData)

            });


        if (!response.ok) {

            throw new Error(
                "Failed to apply for leave."
            );

        }


        const savedLeave =
            await response.json();


        // Success message

        leaveFormMessage.textContent =
            "Leave request submitted successfully.";

        leaveFormMessage.style.color =
            "#16a34a";


        // In-place refresh (no reload, no section switch).

        await loadMyLeaves();

        await loadDashboardStats();

        if (typeof loadDashboardPreviews === "function") {
            await loadDashboardPreviews();
        }

        document.getElementById(
            "leaveSubmitButton"
        ).disabled = false;


        // Keep the message visible, then close in place.

        setTimeout(() => {

            leaveForm.reset();

            leaveFormMessage.textContent = "";

            const container =
                document.getElementById("leaveFormContainer");

            if (container) {
                container.classList.remove("active");
            }

        }, 1200);

    }

    catch (error) {

        console.error(
            "Error applying for leave:",
            error
        );


        leaveFormMessage.textContent =
            "Unable to submit leave request.";

        leaveFormMessage.style.color =
            "#dc2626";

        document.getElementById(
            "leaveSubmitButton"
        ).disabled = false;

    }

});

const applyLeaveButton = document.getElementById("applyLeaveButton");
const leaveFormContainer = document.getElementById("leaveFormContainer");
const cancelLeaveButton = document.getElementById("cancelLeaveButton");

// Open leave form
if (applyLeaveButton) {
    applyLeaveButton.addEventListener("click", function () {
        leaveFormContainer.classList.add("active");
        leaveFormMessage.textContent = "";
    });
}

// Cancel leave form
if (cancelLeaveButton) {
    cancelLeaveButton.addEventListener("click", function () {
        leaveForm.reset();
        leaveFormContainer.classList.remove("active");
        leaveFormMessage.textContent = "";
    });
}

// =========================
// Load My Leave Requests
// =========================

async function loadMyLeaves() {

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


        // Get only current employee's leaves

        const myLeaves =
            leaves.filter(leave => {

                return String(leave.employeeId) ===
                       String(loggedInUser.id);

            });


        const leavesContainer =
            document.getElementById(
                "leavesContainer"
            );


        // Clear container

        leavesContainer.innerHTML = "";


        // No leaves

        if (myLeaves.length === 0) {

            leavesContainer.innerHTML =
                `<p class="empty-message">
                    No leave requests found.
                </p>`;

            return;

        }


        // Display leave requests

        myLeaves.forEach(leave => {

            const leaveCard =
                document.createElement("div");

            leaveCard.classList.add(
                "leave-card"
            );


            leaveCard.innerHTML = `

                <div class="leave-info">

                    <h4>
                        Leave Request
                    </h4>

                    <p>
                        Start Date:
                        ${leave.startDate}
                    </p>

                    <p>
                        End Date:
                        ${leave.endDate}
                    </p>

                    <p>
                        Reason:
                        ${escapeHtml(leave.reason)}
                    </p>

                    ${
                        leave.status === "rejected" && leave.rejectionReason
                        ? `
                            <p class="rejection-reason">
                                Admin's Note:
                                ${escapeHtml(leave.rejectionReason)}
                            </p>
                          `
                        : ""
                    }

                </div>


                <div class="leave-details">

                    <p>
                        Status:
                    </p>

                    <span class="leave-status-badge ${leave.status}">
                        ${leave.status}
                    </span>

                </div>

            `;


            leavesContainer.appendChild(
                leaveCard
            );

        });

    }

    catch (error) {

        console.error(
            "Error loading leave requests:",
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


