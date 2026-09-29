// =========================
// Date Restrictions
// Prevents choosing illogical dates:
// - due dates / end dates can't be before today
// - "end" dates can't be before their linked "start" date
// - attendance can't be marked for a future date
// =========================

function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
}

document.addEventListener("DOMContentLoaded", function () {

    applyCreateModeDateMins();

    // Project end date must be >= project start date
    linkStartEnd("projectStartDate", "projectEndDate");

    // Leave end date must be >= leave start date
    linkStartEnd("leaveStartDate", "leaveEndDate");
});

// =========================
// Create mode: past dates restricted (today as minimum).
// Called on page load and whenever an Add form is opened.
// =========================

function refreshDateWidget(el) {
    if (!el) return;
    // Re-assigning value runs the custom-date.js value interceptor,
    // which calls syncTrigger() -> renderGrid() so new min/max
    // disabled states paint immediately.
    try {
        if (el.dataset && el.dataset.enhanced === "true") {
            el.value = el.value;
        }
    } catch (refreshError) {
        // Ignore — calendar re-renders on next open anyway.
    }
}

function applyCreateModeDateMins() {
    // Due dates / deadlines: never in the past
    ["taskDueDate", "projectStartDate", "leaveStartDate"].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.min = todayStr(); refreshDateWidget(el); }
    });

    // Joining date: never in the future
    const joiningEl = document.getElementById("employeeJoiningDate");
    if (joiningEl) { joiningEl.max = todayStr(); refreshDateWidget(joiningEl); }

    // Attendance: never in the future
    const attendanceDate = document.getElementById("attendanceDate");
    if (attendanceDate) { attendanceDate.max = todayStr(); refreshDateWidget(attendanceDate); }

    // End dates default to today as well until a start is picked.
    const projectEnd = document.getElementById("projectEndDate");
    if (projectEnd && !projectEnd.value) { projectEnd.min = todayStr(); refreshDateWidget(projectEnd); }
    const leaveEnd = document.getElementById("leaveEndDate");
    if (leaveEnd && !leaveEnd.value) { leaveEnd.min = todayStr(); refreshDateWidget(leaveEnd); }
}

// =========================
// Edit mode: the saved date stays valid even if it is in the past.
// Relaxes min down to the saved value so native validation and the
// custom date picker accept the existing record. New picks are still
// validated logically (end >= start) in each form's submit handler.
// =========================

function relaxDateMinForEdit(inputId, savedValue) {
    const el = document.getElementById(inputId);
    if (!el || !savedValue) return;
    const saved = String(savedValue);
    if (saved !== "" && (!el.min || saved < el.min)) {
        el.min = saved;
        refreshDateWidget(el);
    }
}

function linkStartEnd(startId, endId) {
    const startEl = document.getElementById(startId);
    const endEl = document.getElementById(endId);
    if (!startEl || !endEl) return;

    // Initial default: end can't be before today either
    endEl.min = startEl.value || todayStr();

    startEl.addEventListener("change", function () {
        endEl.min = startEl.value || todayStr();
        // if the already-picked end date is now invalid, clear it
        if (endEl.value && endEl.value < endEl.min) {
            endEl.value = "";
        }
        refreshDateWidget(endEl);
    });
}