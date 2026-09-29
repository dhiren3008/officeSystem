// ==========================================
// EMPLOYEE CORE
// Auth/role check, displaying employee info, sidebar navigation,
// section switching, logout, default section.
// Must load FIRST (before every other employee-*.js file).
// ==========================================

const API_URL = "http://localhost:3000";


// =========================
// Check Logged-in User (safe parse)
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
// Check Login
// =========================

if (!loggedInUser) {

    window.location.href = "index.html";

}

// =========================
// Check Employee Role
// =========================

else if (loggedInUser.role !== "employee" && loggedInUser.role !== "project_manager") {
    window.location.href = "index.html";

}

// =========================
// Display Employee Details
// =========================

else {

    document.getElementById("employeeName").textContent =
        loggedInUser.name;

    document.getElementById("topbarEmployeeName").textContent =
        loggedInUser.name;

    document.getElementById("employeeRole").textContent =
        loggedInUser.role === "project_manager"
            ? "Project Manager"
            : "Employee";


    document.getElementById("profileName").textContent =
        loggedInUser.name;

    document.getElementById("profileEmail").textContent =
        loggedInUser.email;

    document.getElementById("profileRole").textContent =
        loggedInUser.role === "project_manager"
            ? "Project Manager"
            : "Employee";


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
// Sidebar Navigation
// =========================

const navLinks = document.querySelectorAll(".nav-link");

const sections = document.querySelectorAll(".dashboard-section");


// =========================
// Dashboard View All Buttons
// =========================

const viewAllButtons = document.querySelectorAll(".view-all-button");

viewAllButtons.forEach(button => { 
    button.addEventListener("click", function () {

        const sectionId =
            this.getAttribute("data-section");

        showSection(sectionId);

    });

});

// =========================
// Current Section
// =========================

let currentSection = null;


// =========================
// Show Section
// =========================

function showSection(sectionId) {
    
    if (currentSection === sectionId) {
        return; // already on this section, don't re-toggle everything
    }

    currentSection = sectionId;

    // Remember current section
    sessionStorage.setItem(
        "employeeCurrentSection",
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

        // Don't handle logout here

        if (
            this.classList.contains("logout-link")
        ) {

            return;

        }


        event.preventDefault();


        const sectionId =
            this.getAttribute("href").substring(1);


        showSection(sectionId);

    });

});


// =========================
// Logout
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

    sessionStorage.removeItem("employeeCurrentSection");

    window.location.href = "index.html";

});

// =========================
// Default Section
// =========================

// showSection("dashboard");

const savedSection =
    sessionStorage.getItem("employeeCurrentSection");

showSection(savedSection || "dashboard");


// Task status filter ("all" shows everything).

let employeeTaskStatusFilter = "all";


document.getElementById("taskStatusFilter")?.addEventListener("change", function (event) {

    employeeTaskStatusFilter = event.target.value;

    loadMyTasks();

});


