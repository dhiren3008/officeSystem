// ==========================================
// MANAGER — ATTENDANCE MODULE
// Check-in/out, my attendance status, team attendance,
// dashboard attendance preview.
// ==========================================

// =========================
// ATTENDANCE ELEMENTS
// =========================

const checkInButton =
    document.getElementById("checkInButton");

const checkOutButton =
    document.getElementById("checkOutButton");

const attendanceMessage =
    document.getElementById("attendanceMessage");

const attendanceContainer =
    document.getElementById("attendanceContainer");

const attendanceDate =
    document.getElementById("attendanceDate");

// =========================
// GET TODAY'S DATE
// =========================

function getTodayDate() {

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(today.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// =========================
// GET CURRENT TIME
// =========================

function getCurrentTime() {

    const now = new Date();

    // 24h "HH:MM" so stored values match <input type="time">.

    return now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
    });

}

// =========================
// GET MY TODAY ATTENDANCE
// =========================

async function getMyTodayAttendance() {

    try {

        const response =
            await fetch(`${API_URL}/attendance`);

        if (!response.ok) {

            throw new Error(
                "Failed to fetch attendance"
            );

        }

        const records =
            await response.json();

        const today =
            getTodayDate();

        const myAttendance =
            records.find(record => {

                const recordUserId =
                    record.userId ||
                    record.employeeId;

                return (
                    String(recordUserId) ===
                    String(loggedInUser.id)
                ) &&
                record.date === today;

            });

        return myAttendance || null;

    } catch (error) {

        console.error(
            "Error getting today's attendance:",
            error
        );

        return null;

    }

}
// =========================
// CHECK IN
// =========================

async function checkIn() {

    try {

        const existingAttendance =
            await getMyTodayAttendance();


        // Already checked in today

        if (existingAttendance) {

            attendanceMessage.textContent =
                "You have already checked in today.";

            return;

        }


        // Create attendance record

        const attendanceData = {

            id: await getNextId("attendance"),

            employeeId: String(loggedInUser.id),

            userId: String(loggedInUser.id),

            date: getTodayDate(),

            checkIn: getCurrentTime(),

            checkOut: "",

            status: "Present"

        };


        const response =
            await fetch(
                `${API_URL}/attendance`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            attendanceData
                        )
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to check in"
            );

        }


        attendanceMessage.textContent =
            `Checked in at ${attendanceData.checkIn}.`;


        // Refresh attendance status (stay on Attendance, no dashboard jump).

        const attendanceScrollY = window.scrollY;

        await loadMyAttendanceStatus();
        await loadTeamAttendance();

        persistManagerSection("attendance");

        window.scrollTo(0, attendanceScrollY);


    } catch (error) {

        console.error(
            "Check-in error:",
            error
        );

        attendanceMessage.textContent =
            "Unable to check in.";

    }

}

// =========================
// CHECK OUT
// =========================

async function checkOut() {

    try {

        const existingAttendance =
            await getMyTodayAttendance();


        // No check-in found

        if (!existingAttendance) {

            attendanceMessage.textContent =
                "Please check in first.";

            return;

        }


        // Already checked out

        if (existingAttendance.checkOut) {

            attendanceMessage.textContent =
                "You have already checked out today.";

            return;

        }


        // Update attendance record

        const response =
            await fetch(
                `${API_URL}/attendance/${existingAttendance.id}`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        checkOut:
                            getCurrentTime()

                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to check out"
            );

        }


        const updatedAttendance =
            await response.json();


        attendanceMessage.textContent =
            `Checked out at ${updatedAttendance.checkOut}.`;


        // Refresh status (stay on Attendance, no dashboard jump).

        const attendanceScrollY = window.scrollY;

        await loadMyAttendanceStatus();
        await loadTeamAttendance();

        persistManagerSection("attendance");

        window.scrollTo(0, attendanceScrollY);

    } catch (error) {

        console.error(
            "Check-out error:",
            error
        );

        attendanceMessage.textContent =
            "Unable to check out.";

    }

}

// =========================
// LOAD MY ATTENDANCE STATUS
// =========================

async function loadMyAttendanceStatus() {

    try {

        const attendance =
            await getMyTodayAttendance();


        // =========================
        // NOT CHECKED IN
        // =========================

        if (!attendance) {

            attendanceMessage.textContent =
                "You have not checked in today.";

            checkInButton.disabled = false;

            checkOutButton.disabled = true;

            return;

        }


        // =========================
        // CHECKED IN
        // =========================

        if (!attendance.checkOut) {

            attendanceMessage.textContent =
                `Checked in at ${attendance.checkIn}.`;

            checkInButton.disabled = true;

            checkOutButton.disabled = false;

            return;

        }


        // =========================
        // CHECKED OUT
        // =========================

        attendanceMessage.textContent =
            `Checked in at ${attendance.checkIn} and checked out at ${attendance.checkOut}.`;

        checkInButton.disabled = true;

        checkOutButton.disabled = true;


    } catch (error) {

        console.error(
            "Error loading attendance status:",
            error
        );

        if (typeof attendanceMessage !== "undefined" && attendanceMessage) {
            attendanceMessage.textContent =
                "Unable to load attendance. Please check whether the server is running.";
        }

    }

}
// =========================
// ATTENDANCE BUTTON EVENTS
// =========================

if (checkInButton) {

    checkInButton.addEventListener(
        "click",
        checkIn
    );

}


if (checkOutButton) {

    checkOutButton.addEventListener(
        "click",
        checkOut
    );

}

// =========================
// INITIAL ATTENDANCE STATUS
// =========================

loadMyAttendanceStatus();



// =========================
// LOAD TEAM ATTENDANCE
// =========================

async function loadTeamAttendance() {

    try {

        if (!attendanceContainer) {
            return;
        }


        // =========================
        // GET MANAGER PROJECTS
        // =========================

        const myProjects =
            await loadMyProjects();


        // =========================
        // GET EMPLOYEE IDS
        // =========================

        const employeeIds = [];


        myProjects.forEach(project => {

            if (
                project.assignedEmployees &&
                Array.isArray(project.assignedEmployees)
            ) {

                project.assignedEmployees.forEach(employeeId => {

                    employeeIds.push(
                        String(employeeId)
                    );

                });

            }

        });


        const uniqueEmployeeIds =
            [...new Set(employeeIds)];


        if (uniqueEmployeeIds.length === 0) {

            attendanceContainer.innerHTML = `
                <p class="empty-message">
                    No team members found.
                </p>
            `;

            return;
        }


        // =========================
        // GET USERS
        // =========================

        const usersResponse =
            await fetch(`${API_URL}/users`);


        if (!usersResponse.ok) {

            throw new Error(
                "Failed to fetch users"
            );

        }


        const users =
            await usersResponse.json();


        // =========================
        // GET TEAM MEMBERS
        // =========================

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

            attendanceContainer.innerHTML = `
                <p class="empty-message">
                    No employees found.
                </p>
            `;

            return;
        }


        // =========================
        // GET ATTENDANCE
        // =========================

        const attendanceResponse =
            await fetch(`${API_URL}/attendance`);


        if (!attendanceResponse.ok) {

            throw new Error(
                "Failed to fetch attendance"
            );

        }


        const attendanceRecords =
            await attendanceResponse.json();


        // =========================
        // SELECT DATE
        // =========================

        const selectedDate =
            attendanceDate &&
            attendanceDate.value
                ? attendanceDate.value
                : getTodayDate();


        // =========================
        // FILTER ATTENDANCE BY DATE
        // =========================

        const selectedDateAttendance =
            attendanceRecords.filter(record => {

                return String(record.date) ===
                       String(selectedDate);

            });


        // =========================
        // BUILD ROWS OFF-SCREEN, SWAP ONCE
        // (single paint — no whole-page reflow storm)
        // =========================

        const attendanceHtml = teamMembers.map(employee => {

            const attendance =
                selectedDateAttendance.find(record => {

                    const recordUserId =
                        record.userId ??
                        record.employeeId;

                    return String(recordUserId).trim() ===
                           String(employee.id).trim();

                });


            let status =
                "Not Checked In";

            let checkIn =
                "-";

            let checkOut =
                "-";


            if (attendance) {

                status =
                    attendance.status ||
                    "Present";

                checkIn =
                    attendance.checkIn ||
                    "-";

                checkOut =
                    attendance.checkOut ||
                    "-";

            }


            return `

                <div class="attendance-record">

                <div class="attendance-employee">

                    <strong>
                        ${escapeHtml(employee.name)}
                    </strong>

                    <span>
                        ${escapeHtml(employee.email)}
                    </span>

                </div>


                <div class="attendance-status">

                    <span>
                        ${escapeHtml(status)}
                    </span>

                </div>


                <div class="attendance-time">

                    <div>

                        <small>
                            Check In
                        </small>

                        <strong>
                            ${escapeHtml(checkIn)}
                        </strong>

                    </div>


                    <div>

                        <small>
                            Check Out
                        </small>

                        <strong>
                            ${escapeHtml(checkOut)}
                        </strong>

                    </div>

                </div>

                </div>

            `;

        }).join("");


        attendanceContainer.innerHTML = attendanceHtml;


    } catch (error) {

        console.error(
            "Team attendance error:",
            error
        );


        if (attendanceContainer) {

            attendanceContainer.innerHTML = `
                <p class="empty-message">
                    Unable to load team attendance.
                </p>
            `;

        }

    }

}


// =========================
// LOAD ATTENDANCE
// =========================

async function loadAttendance() {

    await loadMyAttendanceStatus();

    await loadTeamAttendance();

}

// =========================
// SET ATTENDANCE DATE
// =========================

if (attendanceDate) {

    attendanceDate.value =
        getTodayDate();

}

// =========================
// ATTENDANCE DATE CHANGE
// =========================

if (attendanceDate) {

    attendanceDate.addEventListener(
        "change",
        loadTeamAttendance
    );

}

// Button + date listeners already wired above (single registration).

// =========================
// LOAD DASHBOARD ATTENDANCE
// =========================

async function loadDashboardAttendance() {

    const dashboardAttendance =
        document.getElementById("dashboardAttendance");

    if (!dashboardAttendance) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/attendance`
            );

        if (!response.ok) {
            throw new Error(
                "Failed to fetch attendance"
            );
        }

        const attendanceRecords =
            await response.json();


        const [projectsResponse, usersResponse] =
            await Promise.all([
                fetch(`${API_URL}/projects`),
                fetch(`${API_URL}/users`)
            ]);


        const projects =
            projectsResponse.ok ? await projectsResponse.json() : [];

        const users =
            usersResponse.ok ? await usersResponse.json() : [];


        const today =
            getTodayDate();


        // Team = employees on my projects, plus myself.

        const teamIds = new Set([String(loggedInUser.id)]);

        projects
            .filter(project =>
                String(project.projectManagerId) ===
                String(loggedInUser.id)
            )
            .forEach(project =>
                (project.assignedEmployees || []).forEach(employeeId =>
                    teamIds.add(String(employeeId))
                )
            );


        const recordId = record =>
            String(record.employeeId ?? record.userId ?? "");


        const findUser = record =>
            users.find(user =>
                String(user.id) === recordId(record)
            );


        const isActiveUser = user =>
            String(user.status || "").trim().toLowerCase() ===
            "active";


        const todayAttendance =
            attendanceRecords.filter(record => {

                if (record.date !== today) {
                    return false;
                }

                if (!teamIds.has(recordId(record))) {
                    return false;
                }

                const user = findUser(record);

                return !user || isActiveUser(user);

            });


        if (todayAttendance.length === 0) {

            dashboardAttendance.innerHTML = `
                <p class="empty-message">
                    No attendance records for today.
                </p>
            `;

            return;
        }


        const previewAttendance =
            todayAttendance.slice(0, 3);


        dashboardAttendance.innerHTML =
            previewAttendance.map(record => {

                const user = users.find(user =>
                    String(user.id) ===
                    String(record.employeeId ?? record.userId ?? "")
                );

                const name = user
                    ? escapeHtml(user.name)
                    : escapeHtml(record.name || "Unknown Employee");

                return `
                    <div class="preview-item">

                        <h4>
                            ${name}
                        </h4>

                        <p>
                            Status:
                            ${record.status || "Present"}
                        </p>

                        <p>
                            Check In:
                            ${record.checkIn || "-"}
                        </p>

                        <p>
                            Check Out:
                            ${record.checkOut || "-"}
                        </p>

                    </div>
                `;

            }).join("");


    } catch (error) {

        console.error(
            "Dashboard attendance error:",
            error
        );

        dashboardAttendance.innerHTML = `
            <p class="empty-message">
                Unable to load attendance.
            </p>
        `;

    }

}


