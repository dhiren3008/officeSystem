// ==========================================
// ADMIN CORE
// Auth check, sidebar navigation, section switching,
// logout, shared filter state, and filter dropdown wiring.
// Must load FIRST (before every other admin-*.js file).
// ==========================================

const API_URL = "https://office-backend-c183.onrender.com";
// =========================
// Check Logged-in User (safe parse — corrupted storage redirects)
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


// Check if user is logged in

if (!loggedInUser) {
    
    window.location.href = "index.html";
    
}

// Check if user is Admin

else if (loggedInUser.role !== "admin") {
    
    window.location.href = "index.html";
    
}
// If user is Admin
else {

    document.getElementById("adminName").textContent = loggedInUser.name;

    document.getElementById("adminDisplayName").textContent = loggedInUser.name;

    document.getElementById("profileName").textContent = loggedInUser.name;

    document.getElementById("profileEmail").textContent = loggedInUser.email;

    document.getElementById("profileRole").textContent = "Admin";

    setProfileAvatar("profileAvatar", loggedInUser.name);

    setProfileStatus("profileStatus", loggedInUser.status || "active");

    loadAdminProfileDetails();

}

// Fill department / designation / phone / joining from DB
// so Admin gets the same full card as the other panels.
async function loadAdminProfileDetails() {

    try {

        const response =
            await fetch(`${API_URL}/users`);

        if (!response.ok) {
            return;
        }

        const users =
            await response.json();

        const user =
            users.find(item => {

                return String(item.id) ===
                       String(loggedInUser.id);

            });

        if (!user) {
            return;
        }

        document.getElementById("profileDepartment").textContent =
            user.department || "-";

        document.getElementById("profileDesignation").textContent =
            user.designation || "-";

        document.getElementById("profilePhone").textContent =
            user.phone || "-";

        document.getElementById("profileJoiningDate").textContent =
            user.joiningDate || "-";

        setProfileAvatar("profileAvatar", user.name);

        setProfileStatus("profileStatus", user.status || "active");

    } catch (error) {

        console.error(
            "Error loading admin profile details:",
            error
        );

    }

}

// Shared helpers — avatar initials + status pill.
// Same helpers exist in employee / manager profile modules.
function getProfileInitials(name) {

    if (!name) {
        return "-";
    }

    const parts =
        String(name).trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();

}

function setProfileAvatar(elementId, name) {

    const avatar =
        document.getElementById(elementId);

    if (!avatar) {
        return;
    }

    avatar.textContent =
        getProfileInitials(name);

}

function setProfileStatus(elementId, status) {

    const badge =
        document.getElementById(elementId);

    if (!badge) {
        return;
    }

    const normalized =
        String(status || "active").toLowerCase();

    badge.textContent =
        normalized === "inactive" ? "Inactive" : "Active";

    badge.classList.remove("active", "inactive");

    badge.classList.add(
        normalized === "inactive" ? "inactive" : "active"
    );

}

// =========================
// Section Navigation
// =========================

const navLinks = document.querySelectorAll(".nav-link");

const sections = document.querySelectorAll(".dashboard-section");

// =========================
// Auto-Scroll to Any Form When Opened
// =========================

const formContainerIds = [
    "projectFormContainer",
    "employeeFormContainer",
    "taskFormContainer",
    "attendanceFormContainer",
    "leaveFormContainer"
];

formContainerIds.forEach(id => {

    const container = document.getElementById(id);

    if (!container) return;

    const observer = new MutationObserver(() => {

        if (container.classList.contains("active")) {

            container.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    });

    observer.observe(container, {
        attributes: true,
        attributeFilter: ["class"]
    });

});

// =========================
// Current Section
// =========================

let currentSection = null;


// =========================
// Show Section Function
// =========================

function showSection(sectionId) {
    
    if (currentSection === sectionId) {
        return; // already on this section, don't re-toggle everything
    }

    currentSection = sectionId;

    // Remember current section
    sessionStorage.setItem(
        "adminCurrentSection",
        sectionId
    );


    // Hide all sections
    sections.forEach(section => {

        section.style.display = "none";

    });


    // Show selected section
    const selectedSection =
        document.getElementById(sectionId);

    if (selectedSection) {

        selectedSection.style.display = "block";

    }


    // Remove active from all sidebar links
    navLinks.forEach(navLink => {

        navLink.classList.remove("active");

    });


    // Find matching sidebar link
    const activeNavLink =
        document.querySelector(
            `.nav-link[href="#${sectionId}"]`
        );


    // Add active class
    if (activeNavLink) {

        activeNavLink.classList.add("active");

    }

}

// =========================
// Sidebar Click
// =========================

navLinks.forEach(link => {

    link.addEventListener("click", function (event) {

        if (this.classList.contains("logout-link")) {

            return;

        }

        event.preventDefault();


        const sectionId =
            this.getAttribute("href").substring(1);


        showSection(sectionId);

    });

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

    sessionStorage.removeItem("adminCurrentSection");

    window.location.href = "index.html";

});

// =========================
// Default Section on Page Load
// =========================

// showSection("dashboard");

const savedSection =
    sessionStorage.getItem("adminCurrentSection");

showSection(savedSection || "dashboard");


// Active / inactive list filter ("all" shows everyone).

let employeeStatusFilter = "active";

// Project status filter ("all" shows every status).

let projectStatusFilter = "all";

// Task status / priority filters ("all" shows everything).

let taskStatusFilter = "all";

let taskPriorityFilter = "all";

// =========================
// Dashboard View All Buttons
// =========================

const viewAllButtons = document.querySelectorAll(".view-all-button");

viewAllButtons.forEach(button => {

    button.addEventListener("click", function () {

        const sectionId =
            this.dataset.section;

        showSection(sectionId);

    });

});


// =========================
// Employee Status Filter
// =========================

document.getElementById("employeeStatusFilter")?.addEventListener("change", function (event) {

    employeeStatusFilter = event.target.value;

    loadEmployees();

});


document.getElementById("projectStatusFilter")?.addEventListener("change", function (event) {

    projectStatusFilter = event.target.value;

    loadProjects();

});


document.getElementById("taskStatusFilter")?.addEventListener("change", function (event) {

    taskStatusFilter = event.target.value;

    loadTasks();

});


document.getElementById("taskPriorityFilter")?.addEventListener("change", function (event) {

    taskPriorityFilter = event.target.value;

    loadTasks();

});



