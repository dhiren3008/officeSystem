// ==========================================
// MANAGER INIT
// Default section, loadDashboard() aggregator, initial page-load calls.
// Must load LAST (after every other manager-*.js file).
// ==========================================

// =========================
// DEFAULT SECTION (restores last visited section so a reload
// after task / attendance / leave work never jumps to dashboard)
// =========================

showSection(getPersistedManagerSection() || "dashboard");


// =========================
// LOAD DASHBOARD
// =========================

async function loadDashboard() {

    // Batched so initial paint finishes in ~3 round-trips
    // instead of 12 sequential reflows (whole-page flash).

    await Promise.all([
        loadDashboardProjects(),
        loadProjectStatistics()
    ]);

    await Promise.all([
        loadMyProjectsSection(),
        loadMyTeamMembers()
    ]);

    await Promise.all([
        loadDashboardTeam(),
        loadTeamMembers()
    ]);

    await Promise.all([
        loadTaskStatistics(),
        loadTaskProjects()
    ]);

    await Promise.all([
        loadDashboardTasks(),
        loadMyTasks()
    ]);

    await Promise.all([
        loadDashboardAttendance(),
        loadDashboardLeaves()
    ]);

}


// =========================
// INITIAL LOAD
// =========================

loadDashboard();