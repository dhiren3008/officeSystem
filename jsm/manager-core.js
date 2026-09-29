// ==========================================
// MANAGER CORE
// API_URL, logged-in user check, auth/role check, manager info,
// sidebar navigation, section switching, logout, view-all buttons.
// Must load FIRST (before every other manager-*.js file).
// ==========================================

// =========================
// API URL
// =========================

const API_URL = "http://localhost:3000";


// =========================
// LOGGED IN USER (safe parse)
// =========================

let loggedInUser = null;

try {
    loggedInUser = JSON.parse(
        localStorage.getItem("loggedInUser")
    );
} catch (parseError) {
    console.error("Corrupted session, redirecting to login:", parseError);
    localStorage.removeItem("loggedInUser");
    loggedInUser = null;
}


// =========================
// AUTHENTICATION CHECK
// =========================

if (!loggedInUser) {

    window.location.href = "index.html";

}


// =========================
// ROLE CHECK
// =========================

if (
    loggedInUser &&
    loggedInUser.role !== "project_manager"
) {

    window.location.href = "index.html";

}


// =========================
// MANAGER INFORMATION
// =========================

if (loggedInUser) {

    const managerName =
        document.getElementById("managerName");

    const managerDisplayName =
        document.getElementById("managerDisplayName");


    if (managerName) {

        managerName.textContent =
            loggedInUser.name;

    }


    if (managerDisplayName) {

        managerDisplayName.textContent =
            loggedInUser.name;

    }


    const earlyAvatar =
        document.getElementById("profileAvatar");

    if (earlyAvatar && loggedInUser.name) {

        const parts =
            String(loggedInUser.name).trim().split(/\s+/);

        earlyAvatar.textContent =
            parts.length === 1
                ? parts[0].slice(0, 2).toUpperCase()
                : (parts[0][0] + parts[1][0]).toUpperCase();

    }

}


// =========================
// NAVIGATION
// =========================

const navLinks =
    document.querySelectorAll(".nav-link");

const dashboardSections =
    document.querySelectorAll(".dashboard-section");


// =========================
// CURRENT SECTION (persisted so CRUD / reload stays in place)
// =========================

let managerCurrentSection = null;


function getPersistedManagerSection() {

    try {

        return sessionStorage.getItem(
            "managerCurrentSection"
        );

    } catch (storageError) {

        return null;

    }

}


function persistManagerSection(sectionId) {

    try {

        sessionStorage.setItem(
            "managerCurrentSection",
            sectionId
        );

    } catch (storageError) {

        // Storage unavailable (private mode) — stay on section anyway.

    }

}


// Re-sync custom select/date triggers after form.reset().
// Native reset() bypasses the value-setter interceptors in
// custom-select.js / custom-date.js, so re-assign the value
// to force their syncTrigger() to run.

function syncCustomWidgetsIn(form) {

    if (!form || !form.querySelectorAll) {

        return;

    }

    form.querySelectorAll(
        'select[data-enhanced="true"], input[data-enhanced="true"]'
    ).forEach(control => {

        try {

            control.value = control.value;

        } catch (syncError) {

            // Ignore — native control still holds the right value.

        }

    });

}


// =========================
// SHOW SECTION
// =========================

function showSection(sectionId) {

    if (
        !sectionId ||
        managerCurrentSection === sectionId
    ) {

        // Already here — still refresh lazy sections so
        // re-clicking Attendance / Leaves never looks stale.

        if (sectionId === "attendance" && typeof loadAttendance === "function") {

            loadAttendance();

        }

        if (sectionId === "leaves" && typeof loadMyLeaves === "function") {

            loadMyLeaves();

        }

        if (sectionId === "profile" && typeof loadProfile === "function") {

            loadProfile();

        }

        return;

    }


    managerCurrentSection = sectionId;


    persistManagerSection(sectionId);

    // Hide all sections

    dashboardSections.forEach(section => {

        section.style.display = "none";

    });


    // Show selected section

    const selectedSection =
        document.getElementById(sectionId);


    if (selectedSection) {

        selectedSection.style.display =
            "block";

    }


    // Remove active class

    navLinks.forEach(link => {

        link.classList.remove("active");

    });


    // Add active class

    const activeLink =
        document.querySelector(
            `.nav-link[href="#${sectionId}"]`
        );


    if (activeLink) {

        activeLink.classList.add("active");

    }


    // =========================
    // LOAD ATTENDANCE
    // =========================

    if (sectionId === "attendance") {

        loadAttendance();

    }

    if (sectionId === "leaves") {
        loadMyLeaves();
    }

    if (sectionId === "profile") {

    loadProfile();

}
}


// =========================
// NAVIGATION CLICK
// =========================

navLinks.forEach(link => {

    link.addEventListener(
        "click",
        function(event) {

            const href =
                this.getAttribute("href");


            // Do not handle Logout

            if (href === "index.html") {

                return;

            }


            event.preventDefault();


            const sectionId =
                href.substring(1);


            showSection(sectionId);

        }
    );

});

// =========================
// Logout Confirmation
// =========================

const logoutLink = document.querySelector(".logout-link");

logoutLink.addEventListener("click", function (event) {

    event.preventDefault();

    const confirmLogout =
        confirm("Are you sure you want to logout?");

    if (!confirmLogout) {
        return;
    }

    localStorage.removeItem("loggedInUser");

    try {

        sessionStorage.removeItem("managerCurrentSection");

    } catch (storageError) {

        // Ignore.

    }

    sessionStorage.removeItem("adminCurrentSection");

    window.location.href = "index.html";

});


// =========================
// DASHBOARD VIEW ALL BUTTONS
// =========================

const viewAllButtons =
    document.querySelectorAll(
        ".view-all-button"
    );


viewAllButtons.forEach(button => {

    button.addEventListener(
        "click",
        function() {

            const sectionId =
                this.getAttribute(
                    "data-section"
                );


            showSection(sectionId);

        }
    );

});



