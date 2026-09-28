const API_URL = "https://office-backend-c183.onrender.com/users";;


// =========================
// Password Show / Hide
// =========================

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");


// =========================
// Block Spaces in Password
// =========================

// Stops the space key from being typed at all
passwordInput.addEventListener("keydown", function (event) {

    if (event.key === " " || event.code === "Space") {
        event.preventDefault();
    }

});

// Strips any space that slips in via paste/autofill/drag-drop
passwordInput.addEventListener("input", function () {

    if (passwordInput.value.includes(" ")) {
        passwordInput.value = passwordInput.value.replace(/\s/g, "");
    }

});

togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";
        togglePassword.textContent = "🙈";

    } else {

        passwordInput.type = "password";
        togglePassword.textContent = "👁";

    }

});


// =========================
// Login Form
// =========================

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    // Get form values
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const loginMessage = document.getElementById("loginMessage");
    const successMessage = document.getElementById("successMessage");
    const loginButton = document.getElementById("loginButton");
    const loginLoader = document.getElementById("loginLoader");


    // Clear previous messages
    loginMessage.textContent = "";
    successMessage.textContent = "";


    // =========================
    // Form Validation
    // =========================

    // Check email
    if (email === "") {

        loginMessage.textContent = "Please enter your email.";
        return;

    }

    // Check password
    if (password === "") {

        loginMessage.textContent = "Please enter your password.";
        return;

    }


    // Check password length
    if (password.length < 6) {

        loginMessage.textContent =
            "Password must be at least 6 characters.";

        return;

    }

    // Check for spaces (backup check — keydown/input listeners
    // handle this at entry time, but autofill or disabled JS
    // could still slip a space through)
    if (/\s/.test(password)) {

        loginMessage.textContent =
            "Password must not contain spaces.";

        return;

    }


    // =========================
    // Fetch Users
    // =========================

    loginLoader?.classList.add("active");

    if (loginButton) {
        loginButton.disabled = true;
    }


    try {

        const response = await fetch(API_URL);


        // Check if server response is successful
        if (!response.ok) {

            throw new Error("Failed to fetch users.");

        }


        // Convert JSON response into JavaScript data
        const users = await response.json();

        // =========================
        // Find Matching User
        // =========================

        const user = users.find(function (user) {

            return String(user.email || "").trim().toLowerCase() === email.toLowerCase() &&
                   user.password === password;

        });

        // =========================
        // Invalid Login
        // =========================
        
        if (!user) {

            loginMessage.textContent =
                "Invalid email or password.";

            loginLoader?.classList.remove("active");

            if (loginButton) {
                loginButton.disabled = false;
            }

            return;

        }

        // =========================
        // Blocked: Inactive Account
        // =========================

        if (
            String(user.status || "").trim().toLowerCase() ===
            "inactive"
        ) {

            loginMessage.textContent =
                "Your account is deactivated. Contact admin.";

            loginLoader?.classList.remove("active");

            if (loginButton) {
                loginButton.disabled = false;
            }

            return;

        }


        // =========================
        // Save Logged-in User
        // =========================

        // We intentionally do NOT save the password.
        localStorage.setItem(
            "loggedInUser",
            JSON.stringify({
                id: String(user.id),
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status || "active",
                joiningDate: user.joiningDate || ""
            })
        );

        // Clear stale per-panel section memory on user switch.
        sessionStorage.removeItem("adminCurrentSection");
        sessionStorage.removeItem("managerCurrentSection");
        sessionStorage.removeItem("employeeCurrentSection");


        // =========================
        // Successful Login
        // =========================

        successMessage.textContent = "Login successful!";


        // Clear the login form
        loginForm.reset();

        // =========================
        // Role-based Redirection
        // =========================

        const role = String(user.role || "").trim().toLowerCase();

        if (role === "admin") {

            window.location.href = "admin.html";

        }

        else if (role === "project_manager") {

            window.location.href = "manager.html";

        }

        else if (role === "employee") {

            window.location.href = "employee.html";

        }

        else {

            loginMessage.textContent = "Invalid user role.";

            loginLoader?.classList.remove("active");

            if (loginButton) {
                loginButton.disabled = false;
            }

        }

    }


    // =========================
    // Server / Fetch Error
    // =========================

    catch (error) {

        console.error("Login error:", error);

        loginMessage.textContent =
            "Unable to connect to server.";

        loginLoader?.classList.remove("active");

        if (loginButton) {
            loginButton.disabled = false;
        }

    }

});