// ==========================================
// EMPLOYEE — PROFILE MODULE
// Loads and displays the employee's own profile.
// ==========================================

// =========================
// Load Employee Profile
// =========================

async function loadEmployeeProfile() {

    try {

        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();

        const user = users.find(item => {
            return String(item.id) === String(loggedInUser.id);
        });

        if (!user) {
            console.error("Logged-in user not found in users");
            return;
        }

        document.getElementById("profileName").textContent =
            user.name || "--";

        document.getElementById("profileEmail").textContent =
            user.email || "--";

        document.getElementById("profileRole").textContent =
            user.role === "project_manager" ? "Project Manager" : "Employee";

        document.getElementById("profileDepartment").textContent =
            user.department || "--";

        document.getElementById("profileDesignation").textContent =
            user.designation || "--";

        document.getElementById("profilePhone").textContent =
            user.phone || "--";

        document.getElementById("profileJoiningDate").textContent =
            user.joiningDate || "--";

        setProfileAvatar("profileAvatar", user.name);

        setProfileStatus("profileStatus", user.status || "active");

    } catch (error) {

        console.error("Error loading employee profile:", error);

    }

}

function getProfileInitials(name) {

    if (!name) {
        return "--";
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

