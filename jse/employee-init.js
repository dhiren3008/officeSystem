// ==========================================
// EMPLOYEE INIT
// Initial page-load calls.
// NOTE: in the original employee.js this block sat in the MIDDLE
// of the file (line 1756), calling loadDashboardPreviews() and
// loadEmployeeProfile() before those functions were textually
// defined further down. That only worked because function
// declarations are hoisted within a single script. Once split
// into separate files, that no longer holds, so this block had
// to be MOVED here (last-loading file) rather than just copied —
// this is the one place where relocation, not just extraction,
// was necessary. Behavior is unchanged: same calls, same order.
// Must load LAST (after every other employee-*.js file).
// ==========================================

// =========================
// Load Employee Data
// =========================
loadMyProjects();

loadMyTasks();

loadDashboardStats();

loadMyLeaves();

loadMyAttendance();

loadAttendanceHistory();

loadDashboardAttendance();

loadDashboardPreviews();

loadEmployeeProfile();

