// ==========================================
// EMPLOYEE — ATTENDANCE MODULE
// Today's attendance, dashboard attendance preview,
// attendance history, check-in, check-out.
// ==========================================

// =========================
// Employee Attendance
// =========================

const checkInBtn = document.getElementById("checkInBtn");

const checkOutBtn = document.getElementById("checkOutBtn");

const checkInTime = document.getElementById("checkInTime");

const checkOutTime = document.getElementById("checkOutTime");

const attendanceStatus = document.getElementById("attendanceStatus");


// =========================
// Load Today's Attendance
// =========================

async function loadMyAttendance() {

    try {

        const response =
            await fetch(`${API_URL}/attendance`);

        if (!response.ok) {

            throw new Error(
                "Failed to fetch attendance."
            );

        }

        const attendance =
            await response.json();


        // Get today's date (local, matching stored check-in dates).

        const now = new Date();

        const today =
            `${now.getFullYear()}-` +
            `${String(now.getMonth() + 1).padStart(2, "0")}-` +
            `${String(now.getDate()).padStart(2, "0")}`;


        // Find today's attendance for logged-in employee

        const todayAttendance =
            attendance.find(record => {

                return String(record.employeeId) ===
                    String(loggedInUser.id) &&
                    record.date === today;

            });


        // No attendance record yet

        if (!todayAttendance) {

            checkInTime.textContent = "--";

            checkOutTime.textContent = "--";

            attendanceStatus.textContent =
                "Not checked in";

            checkInBtn.disabled = false;

            checkOutBtn.disabled = true;

            return;

        }


        // Display check-in time

        checkInTime.textContent =
            todayAttendance.checkIn || "--";


        // Display check-out time

        checkOutTime.textContent =
            todayAttendance.checkOut || "--";


        // If already checked out

        if (todayAttendance.checkOut) {

            attendanceStatus.textContent =
                "Attendance completed";

            checkInBtn.disabled = true;

            checkOutBtn.disabled = true;

        }

        // If checked in but not checked out

        else {

            attendanceStatus.textContent =
                "Currently checked in";

            checkInBtn.disabled = true;

            checkOutBtn.disabled = false;

        }

    }

    catch (error) {

        console.error(
            "Error loading attendance:",
            error
        );

        if (typeof attendanceStatus !== "undefined" && attendanceStatus) {
            attendanceStatus.textContent =
                "Unable to load attendance. Please check whether the server is running.";
        }

    }

}

// =========================
// Load Dashboard Attendance
// =========================

async function loadDashboardAttendance() {

    try {

        const response =
            await fetch(`${API_URL}/attendance`);

        if (!response.ok) {

            throw new Error(
                "Failed to fetch attendance."
            );

        }

        const attendance =
            await response.json();


        // Today's date (local, matching stored check-in dates).

        const now = new Date();

        const today =
            `${now.getFullYear()}-` +
            `${String(now.getMonth() + 1).padStart(2, "0")}-` +
            `${String(now.getDate()).padStart(2, "0")}`;


        // Find today's attendance

        const todayAttendance =
            attendance.find(record => {

                return String(record.employeeId) ===
                    String(loggedInUser.id) &&
                    record.date === today;

            });


        const status =
            document.getElementById(
                "dashboardAttendanceStatus"
            );

        const checkIn =
            document.getElementById(
                "dashboardCheckInTime"
            );

        const checkOut =
            document.getElementById(
                "dashboardCheckOutTime"
            );


        // No attendance yet

        if (!todayAttendance) {

            status.textContent =
                "Not checked in";

            checkIn.textContent =
                "--";

            checkOut.textContent =
                "--";

            return;

        }


        // Check in

        checkIn.textContent =
            todayAttendance.checkIn || "--";


        // Check out

        checkOut.textContent =
            todayAttendance.checkOut || "--";


        // Status

        if (todayAttendance.checkOut) {

            status.textContent =
                "Attendance completed";

        } else {

            status.textContent =
                "Currently checked in";

        }

    }

    catch (error) {

        console.error(
            "Error loading dashboard attendance:",
            error
        );

    }

}

// =========================
// Load Attendance History
// =========================

async function loadAttendanceHistory() {

    try {

        const response =
            await fetch(`${API_URL}/attendance`);

        if (!response.ok) {

            throw new Error(
                "Failed to fetch attendance history."
            );

        }

        const attendance =
            await response.json();


        // Get current employee's attendance

        const myAttendance =
            attendance.filter(record => {

                return String(record.employeeId) ===
                       String(loggedInUser.id);

            });


        const historyContainer =
            document.getElementById(
                "attendanceHistoryContainer"
            );


        // Clear old content

        historyContainer.innerHTML = "";


        // No records

        if (myAttendance.length === 0) {

            historyContainer.innerHTML =
                `<p class="empty-message">
                    No attendance records found.
                </p>`;

            return;

        }


        // Display attendance records

        myAttendance.forEach(record => {

            const attendanceCard =
                document.createElement("div");

            attendanceCard.classList.add(
                "attendance-card"
            );


            attendanceCard.innerHTML = `

                <div>
                    <strong>
                        Date
                    </strong>

                    <span>
                        ${escapeHtml(record.date)}
                    </span>
                </div>


                <div>
                    <strong>
                        Check In
                    </strong>

                    <span>
                        ${escapeHtml(record.checkIn || "--")}
                    </span>
                </div>


                <div>
                    <strong>
                        Check Out
                    </strong>

                    <span>
                        ${escapeHtml(record.checkOut || "--")}
                    </span>
                </div>


                <div>
                    <strong>
                        Status
                    </strong>

                    <span>
                        ${escapeHtml(record.status || "--")}
                    </span>
                </div>

            `;


            historyContainer.appendChild(
                attendanceCard
            );

        });

    }

    catch (error) {

        console.error(
            "Error loading attendance history:",
            error
        );

    }

}

// =========================
// Check In
// =========================

checkInBtn.addEventListener(
    "click",
    async function () {

        try {

            const now = new Date();

            const today =
                `${now.getFullYear()}-` +
                `${String(now.getMonth() + 1).padStart(2, "0")}-` +
                `${String(now.getDate()).padStart(2, "0")}`;


            // Guard: one record per day (same as manager panel).

            const existingResponse =
                await fetch(`${API_URL}/attendance`);

            if (existingResponse.ok) {

                const existingRecords =
                    await existingResponse.json();

                const alreadyCheckedIn = existingRecords.some(record =>
                    String(record.employeeId) === String(loggedInUser.id) &&
                    record.date === today
                );

                if (alreadyCheckedIn) {

                    alert("You have already checked in today.");

                    loadMyAttendance();

                    return;

                }

            }


            const currentTime =
                new Date().toLocaleTimeString(
                    "en-IN",
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                    }
                );


            // Create attendance record

            const attendanceData = {

                id: await getNextId("attendance"),

                employeeId: String(loggedInUser.id),

                userId: String(loggedInUser.id),

                date: today,

                checkIn: currentTime,

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
                    "Failed to check in."
                );

            }


            const savedAttendance =
                await response.json();


            // Reload attendance

            loadMyAttendance();

            loadAttendanceHistory();

            loadDashboardPreviews();

        }

        catch (error) {

            console.error(
                "Error checking in:",
                error
            );

            alert("Unable to check in. Please check whether the server is running.");

        }

    }
);

// =========================
// Check Out
// =========================

checkOutBtn.addEventListener(
    "click",
    async function () {

        try {

            const response =
                await fetch(
                    `${API_URL}/attendance`
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to fetch attendance."
                );

            }


            const attendance =
                await response.json();


            const now = new Date();

            const today =
                `${now.getFullYear()}-` +
                `${String(now.getMonth() + 1).padStart(2, "0")}-` +
                `${String(now.getDate()).padStart(2, "0")}`;


            // Find today's attendance

            const todayAttendance =
                attendance.find(record => {

                    return String(record.employeeId) ===
                        String(loggedInUser.id) &&
                        record.date === today;

                });


            if (!todayAttendance) {

                return;

            }


            // Current time

            const currentTime =
                new Date().toLocaleTimeString(
                    "en-IN",
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                    }
                );


            // Update attendance

            const updateData = {

                checkOut: currentTime,

                status: "Present"

            };


            const updateResponse =
                await fetch(
                    `${API_URL}/attendance/${todayAttendance.id}`,
                    {

                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                updateData
                            )

                    }
                );


            if (!updateResponse.ok) {

                throw new Error(
                    "Failed to check out."
                );

            }


            const updatedAttendance =
                await updateResponse.json();


            // Reload attendance

        loadMyAttendance();

        loadAttendanceHistory();

        loadDashboardPreviews();

        }

        catch (error) {

            console.error(
                "Error checking out:",
                error
            );

            alert("Unable to check out. Please check whether the server is running.");

        }

    }
);


