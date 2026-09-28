// ==========================================
// MANAGER — PROFILE MODULE
// Loads and displays the manager's own profile info.
// ==========================================

// =========================
// LOAD PROFILE
// =========================

async function loadProfile() {

    try {

        if (!loggedInUser) {
            return;
        }


        // Get all users

        const response =
            await fetch(`${API_URL}/users`);


        if (!response.ok) {

            throw new Error(
                "Failed to fetch users"
            );

        }


        const users =
            await response.json();


        // Find logged-in manager

        const user =
            users.find(item => {

                return String(item.id) ===
                       String(loggedInUser.id);

            });


        if (!user) {

            console.error(
                "Logged-in user not found in users"
            );

            return;
        }


        // =========================
        // DISPLAY PROFILE
        // =========================

        document.getElementById("profileName").textContent =
            user.name || "-";


        document.getElementById("profileEmail").textContent =
            user.email || "-";


        document.getElementById("profileRole").textContent =
            user.role === "project_manager"
                ? "Project Manager"
                : user.role || "-";


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
            "Error loading profile:",
            error
        );

    }

}

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



