// =========================
// Sequential Numeric IDs
// Shared helper (loaded before page scripts).
// json-server generates string IDs when POST has no id,
// so each create call must attach id: await getNextId("<collection>").
// =========================

// =========================
// Time Format Helpers
// Check-ins historically stored mixed formats ("11:37 AM",
// "11:38", "14:30"). Edit inputs need 24h "HH:MM".
// =========================

function toTimeInputValue(stored) {

    if (!stored) {
        return "";
    }

    const text = String(stored).trim();

    // Already 24h "HH:MM" (or "HH:MM:SS").

    const match24 = text.match(/^(\d{1,2}):(\d{2})/);

    if (match24 && !/[AP]M/i.test(text)) {

        const hours = String(match24[1]).padStart(2, "0");

        return `${hours}:${match24[2]}`;

    }

    // 12h "h:MM AM/PM".

    const match12 = text.match(/(\d{1,2}):(\d{2})\s*([AP])M/i);

    if (match12) {

        let hours = parseInt(match12[1], 10);

        const isPM = match12[3].toUpperCase() === "P";

        if (isPM && hours < 12) {
            hours += 12;
        }

        if (!isPM && hours === 12) {
            hours = 0;
        }

        return `${String(hours).padStart(2, "0")}:${match12[2]}`;

    }

    return "";

}

// =========================
// HTML Escaping
// All list renderers use innerHTML. Escape user-controlled
// fields (names, descriptions, reasons) to prevent stored XSS.
// =========================

function escapeHtml(value) {

    return String(value ?? "").replace(/[&<>"']/g, function (char) {

        switch (char) {
            case "&": return "&amp;";
            case "<": return "&lt;";
            case ">": return "&gt;";
            case '"': return "&quot;";
            case "'": return "&#39;";
            default: return char;
        }

    });

}

async function getNextId(collection) {

    const base =
        typeof API_URL === "string" && API_URL
            ? API_URL
            : "https://office-backend-c183.onrender.com";

    const response = await fetch(`${base}/${collection}`);

    if (!response.ok) {
        throw new Error(
            `Failed to fetch ${collection} for ID generation.`
        );
    }

    const records = await response.json();

    // IDs are never reused: previously used IDs stay reserved even
    // after their record is deleted (old attendance / leave / project
    // rows still reference them). Generate a random ID and retry on
    // the (extremely unlikely) event of a collision.

    const usedIds = new Set(
        records.map(record => String(record.id))
    );

    let candidate = "";

    do {

        candidate =
            Date.now().toString(36) +
            Math.random().toString(36).slice(2, 8);

    } while (usedIds.has(candidate));

    return candidate;

}

// =========================
// Attendance Summary (date-specific, shared by Admin Attendance + Reports)
// Active staff only. For the selected date:
// - attendance/check-in record that date -> Present
// - approved leave covering that date -> On Leave
// - otherwise -> Absent
// =========================

function isDateCoveredByLeave(leave, dateStr) {

    if (!leave || !dateStr) {
        return false;
    }

    if (String(leave.status || "").trim().toLowerCase() !== "approved") {
        return false;
    }

    const start = String(leave.startDate || "");
    const end = String(leave.endDate || start);

    return start !== "" && start <= dateStr && dateStr <= end;

}


function computeAttendanceSummary(users, attendanceRecords, leaves, dateStr) {

    const staff = (users || []).filter(user => {

        const isStaff =
            user.role === "employee" ||
            user.role === "project_manager";

        const isActive =
            String(user.status || "").trim().toLowerCase() ===
            "active";

        return isStaff && isActive;

    });

    let present = 0;
    let onLeave = 0;
    let absent = 0;

    const perEmployee = staff.map(employee => {

        const hasRecord = (attendanceRecords || []).some(record => {

            const recordUserId =
                record.employeeId ?? record.userId;

            return String(recordUserId) === String(employee.id) &&
                String(record.date) === String(dateStr);

        });

        if (hasRecord) {

            present++;

            return { employee: employee, status: "Present" };

        }

        const leaveCover = (leaves || []).some(leave =>
            String(leave.employeeId) === String(employee.id) &&
            isDateCoveredByLeave(leave, dateStr)
        );

        if (leaveCover) {

            onLeave++;

            return { employee: employee, status: "On Leave" };

        }

        absent++;

        return { employee: employee, status: "Absent" };

    });

    return {
        total: staff.length,
        present: present,
        onLeave: onLeave,
        absent: absent,
        rows: perEmployee
    };

}
// =========================
// Task Assignees (multi-assign)
// New tasks store assignedEmployees: string[] and keep assignedTo
// as the first id for legacy readers. Old tasks only have assignedTo.
// =========================

function getTaskAssigneeIds(task) {

    if (!task) {
        return [];
    }

    if (Array.isArray(task.assignedEmployees)) {
        return task.assignedEmployees.map(id => String(id));
    }

    if (task.assignedTo !== undefined && task.assignedTo !== null && task.assignedTo !== "") {
        return [String(task.assignedTo)];
    }

    return [];

}
