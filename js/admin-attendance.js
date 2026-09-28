// ==========================================
// ADMIN — ATTENDANCE MODULE
// Attendance list, edit form, dashboard attendance preview.
// ==========================================

// =========================
// Load Attendance
// =========================

// =========================
// Selected Date (filter defaults to today)
// =========================

function getSelectedAttendanceDate() {

    const filter = document.getElementById("attendanceDateFilter");

    if (filter && filter.value) {
        return filter.value;
    }

    const now = new Date();

    return `${now.getFullYear()}-` +
        `${String(now.getMonth() + 1).padStart(2, "0")}-` +
        `${String(now.getDate()).padStart(2, "0")}`;

}


function initAttendanceDateFilter() {

    const filter = document.getElementById("attendanceDateFilter");

    if (!filter) {
        return;
    }

    const today = getSelectedAttendanceDate();

    if (!filter.value) {
        filter.value = today;
    }

    filter.max = today;

    if (!filter.dataset.wired) {

        filter.dataset.wired = "true";

        filter.addEventListener("change", loadAttendance);

    }

}


async function loadAttendance() {

    try {

        initAttendanceDateFilter();

        const selectedDate = getSelectedAttendanceDate();

        // Fetch attendance, users, and leaves together.

        const [attendanceResponse, usersResponse, leavesResponse] =
            await Promise.all([
                fetch(`${API_URL}/attendance`),
                fetch(`${API_URL}/users`),
                fetch(`${API_URL}/leaves`)
            ]);

        if (!attendanceResponse.ok) {

            throw new Error(
                "Failed to fetch attendance."
            );

        }

        if (!usersResponse.ok) {

            throw new Error(
                "Failed to fetch users."
            );

        }

        const attendance =
            await attendanceResponse.json();

        const users =
            await usersResponse.json();

        const leaves =
            leavesResponse.ok ? await leavesResponse.json() : [];


        // =========================
        // Date-Specific Summary
        // Present = record that date, On Leave = approved leave
        // covering that date, otherwise Absent (active staff).
        // =========================

        const summary = computeAttendanceSummary(
            users,
            attendance,
            leaves,
            selectedDate
        );


        document.getElementById("attendanceTotalEmployees").textContent = summary.total;

        document.getElementById(
            "attendancePresent"
        ).textContent =
            summary.present;


        document.getElementById(
            "attendanceAbsent"
        ).textContent =
            summary.absent;


        document.getElementById(
            "attendanceOnLeave"
        ).textContent =
            summary.onLeave;


        // =========================
        // Attendance Container (one row per active employee
        // for the selected date)
        // =========================

        const attendanceContainer =
            document.getElementById(
                "attendanceContainer"
            );


        if (summary.rows.length === 0) {

            attendanceContainer.innerHTML =
                `<p class="empty-message">
                    No active employees found.
                </p>`;

            return;

        }


        const attendanceByEmployee = {};

        attendance.forEach(record => {

            if (String(record.date) !== String(selectedDate)) {
                return;
            }

            const recordUserId =
                record.employeeId ?? record.userId;

            attendanceByEmployee[String(recordUserId)] = record;

        });


        attendanceContainer.innerHTML =
            summary.rows.map(row => {

                const record =
                    attendanceByEmployee[String(row.employee.id)] || null;

                const recordId =
                    record ? escapeHtml(record.id) : "";

                return `

                <div class="attendance-card">

                    <div class="attendance-info">

                        <h3>
                            ${escapeHtml(row.employee.name)}
                        </h3>

                        <p>
                            Date: ${escapeHtml(selectedDate)}
                        </p>

                        <p>
                            Check In:
                            ${escapeHtml((record && record.checkIn) || "Not checked in")}
                        </p>

                        <p>
                            Check Out:
                            ${escapeHtml((record && record.checkOut) || "Not checked out")}
                        </p>

                    </div>


                    <div class="attendance-status">

                        <p>
                            Status:
                            ${escapeHtml(row.status)}
                        </p>

                        ${record ? `
                        ` : ""}

                    </div>

                </div>

            `;

            }).join("");

    }

    catch (error) {

        console.error(
            "Error loading attendance:",
            error
        );

        const attendanceContainer =
            document.getElementById("attendanceContainer");

        if (attendanceContainer) {

            attendanceContainer.innerHTML =
                `<p class="empty-message">
                    Unable to load attendance. Please check whether the server is running.
                </p>`;

        }

    }

}

// =========================
// Attendance Edit
// =========================

const attendanceFormContainer =
    document.getElementById(
        "attendanceFormContainer"
    );

const attendanceForm =
    document.getElementById(
        "attendanceForm"
    );

const cancelAttendanceButton =
    document.getElementById(
        "cancelAttendanceButton"
    );

const attendanceFormMessage =
    document.getElementById(
        "attendanceFormMessage"
    );

let editingAttendanceId = null;

// =========================
// Cancel Attendance Edit
// =========================

cancelAttendanceButton.addEventListener("click", function () {

    editingAttendanceId = null;

    attendanceForm.reset();

    attendanceFormMessage.textContent = "";

    attendanceFormContainer.classList.remove("active");

}); 

// =========================
// Edit Attendance Button
// =========================

document.getElementById("attendanceContainer").addEventListener("click",async function (event) {
    if (
            event.target.classList.contains(
                "edit-attendance-button"
            )
        ) {

            const attendanceId =
                event.target.dataset.id;


            try {

                const response =
                    await fetch(
                        `${API_URL}/attendance/${attendanceId}`
                    );


                if (!response.ok) {

                    throw new Error(
                        "Failed to fetch attendance."
                    );

                }


                const record =
                    await response.json();


                editingAttendanceId =
                    record.id;


                // Fill form

                document.getElementById(
                    "attendanceDate"
                ).value =
                    record.date || "";


                document.getElementById(
                    "attendanceCheckIn"
                ).value =
                    toTimeInputValue(record.checkIn);


                document.getElementById(
                    "attendanceCheckOut"
                ).value =
                    toTimeInputValue(record.checkOut);


                document.getElementById(
                    "attendanceStatus"
                ).value =
                    record.status || "Present";


                attendanceFormMessage.textContent =
                    "";


                // Open form

                attendanceFormContainer.classList.add(
                    "active"
                );

            }

            catch (error) {

                console.error(
                    "Error loading attendance:",
                    error
                );

                attendanceFormMessage.textContent =
                    "Unable to load attendance record. Please check whether the server is running.";

                attendanceFormMessage.style.color = "#dc2626";

            }

        }

    }
); 

async function getAttendanceEmployeeId(
    attendanceId
) {

    const response =
        await fetch(
            `${API_URL}/attendance/${attendanceId}`
        );

    const record =
        await response.json();

    return String(record.employeeId ?? record.userId ?? "");

}
// =========================
// Update Attendance
// =========================

attendanceForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (!editingAttendanceId) {

            attendanceFormMessage.textContent =
                "Select a record to edit first.";

            return;

        }

        const keptEmployeeId =
            await getAttendanceEmployeeId(
                editingAttendanceId
            );

        const updatedAttendance = {

            employeeId: keptEmployeeId,

            userId: keptEmployeeId,

            date:
                document.getElementById(
                    "attendanceDate"
                ).value,

            checkIn:
                document.getElementById(
                    "attendanceCheckIn"
                ).value,

            checkOut:
                document.getElementById(
                    "attendanceCheckOut"
                ).value,

            status:
                document.getElementById(
                    "attendanceStatus"
                ).value

        };


        try {

            const response =
                await fetch(
                    `${API_URL}/attendance/${editingAttendanceId}`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                updatedAttendance
                            )
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to update attendance."
                );

            }


            attendanceFormMessage.textContent =
                "Attendance updated successfully.";

            attendanceFormMessage.style.color = "#16a34a";


            // In-place refresh (no section switch, no scroll jump).

            await loadAttendance();

            await loadDashboardAttendance();

            if (typeof loadReports === "function") {
                await loadReports();
            }

            editingAttendanceId = null;


            // Keep the message visible, then close.

            setTimeout(() => {

                attendanceForm.reset();

                attendanceFormMessage.textContent = "";

                attendanceFormContainer.classList.remove(
                    "active"
                );

            }, 1200);

        }

        catch (error) {

            console.error(
                "Error updating attendance:",
                error
            );

            attendanceFormMessage.textContent =
                "Unable to save attendance. Please check whether the server is running.";

            attendanceFormMessage.style.color = "#dc2626";

        }

    }
);


// =========================
// Dashboard Attendance Preview
// =========================

async function loadDashboardAttendance() {

    try {

        const attendanceResponse =
            await fetch(`${API_URL}/attendance`);

        if (!attendanceResponse.ok) {

            throw new Error(
                "Failed to fetch attendance."
            );

        }

        const attendance =
            await attendanceResponse.json();


        const usersResponse =
            await fetch(`${API_URL}/users`);

        if (!usersResponse.ok) {

            throw new Error(
                "Failed to fetch users."
            );

        }

        const users =
            await usersResponse.json();


        // Today's date (local, matching stored check-in dates).

        const now = new Date();

        const today =
            `${now.getFullYear()}-` +
            `${String(now.getMonth() + 1).padStart(2, "0")}-` +
            `${String(now.getDate()).padStart(2, "0")}`;


        const isActiveUser = user =>
            String(user.status || "").trim().toLowerCase() ===
            "active";


        const findUser = record => {

            const recordId =
                record.employeeId ?? record.userId;

            return users.find(user =>
                String(user.id) === String(recordId)
            );

        };


        // Today's records for active staff only.

        const recentAttendance = attendance
            .filter(record => {

                if (record.date !== today) {
                    return false;
                }

                const user = findUser(record);

                return !user || isActiveUser(user);

            })
            .slice(-4)
            .reverse();


        const dashboardAttendance =
            document.getElementById(
                "dashboardAttendance"
            );


        // Clear previous content

        dashboardAttendance.innerHTML = "";


        // No records

        if (recentAttendance.length === 0) {

            dashboardAttendance.innerHTML =
                `<p class="empty-message">
                    No attendance records for today.
                </p>`;

            return;

        }


        // Display records

        recentAttendance.forEach(record => {

            const employee = users.find(user => {

                const recordId =
                    record.employeeId ?? record.userId;

                return String(user.id) ===
                       String(recordId);

            });


            const employeeName = employee
                ? escapeHtml(employee.name)
                : escapeHtml(record.name || "Unknown Employee");


            const attendanceItem =
                document.createElement("div");


            attendanceItem.classList.add(
                "dashboard-preview-item"
            );


            attendanceItem.innerHTML = `

                <h4>
                    ${employeeName}
                </h4>

                <p>
                    Date:
                    ${escapeHtml(record.date)}
                </p>

                <p>
                    Status:
                    ${escapeHtml(record.status)}
                </p>

            `;


            dashboardAttendance.appendChild(
                attendanceItem
            );

        });

    }

    catch (error) {

        console.error(
            "Error loading dashboard attendance:",
            error
        );

    }

}


