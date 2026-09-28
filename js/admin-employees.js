// ==========================================
// ADMIN — EMPLOYEES MODULE
// Employee stats, employee list + filter, department dropdown,
// dashboard employee preview, employee add/edit/delete.
// ==========================================

// =========================
// Load User Statistics
// =========================

async function loadUserStats() {
    
    try {
        
        const response = await fetch(`${API_URL}/users`);
        
        const users = await response.json();
        
        // Count Employees (active only)

        const employees = users.filter(user => {

            const isStaff =
                user.role === "employee" ||
                user.role === "project_manager";

            const isActive =
                String(user.status || "").trim().toLowerCase() ===
                "active";

            return isStaff && isActive;

        });
        
        
        // Update Total Employees

        document.getElementById("totalEmployees").textContent =
        employees.length;

    }catch (error) {
        
        console.error(
            "Error loading user statistics:",
            error
        );
        
    }

}
// =========================
// Load Employees
// =========================



async function loadEmployees() {
    
    try {
        
        const response = await fetch(`${API_URL}/users`);
        
        const users = await response.json();
        
        // Get Employees and Project Managers
        // (honour the status filter)

        const employees = users.filter(user => {

            const isStaff =
                user.role === "employee" ||
                user.role === "project_manager";

            if (!isStaff) {
                return false;
            }

            if (employeeStatusFilter === "all") {
                return true;
            }

            return String(user.status || "").trim().toLowerCase() ===
                employeeStatusFilter;

        });
        
        const employeesContainer = document.getElementById("employeesContainer");
        
        
        // Clear Container
        
        employeesContainer.innerHTML = "";
        
        
        // Check if no employees exist
        
        if (employees.length === 0) {

            employeesContainer.innerHTML =
            `<p class="empty-message">No employees found.</p>`;
            
            return;
            
        }


        // Display Employees
        
        employees.forEach(user => {
            
            const employeeCard =
            document.createElement("div");
            
            employeeCard.classList.add(
                "employee-card"
            );
            
            
            employeeCard.innerHTML = `
            
            <div class="employee-info">
            
            <h3>${escapeHtml(user.name)}</h3>
            
            <p>${escapeHtml(user.email)}</p>
            
            <p>
            Department: ${escapeHtml(user.department)}
            </p>
            
            <p>
            Designation: ${escapeHtml(user.designation)}
            </p>
            
            <p>
            Phone: ${escapeHtml(user.phone)}
            </p>
            
            <p>
            Joining Date: ${escapeHtml(user.joiningDate)}
            </p>
            
            </div>
            
            
            <div class="employee-role">
            
            <p>
            Role: ${user.role}
            </p>
            
            <p>
            Status:
            <span class="employee-status-badge ${(user.status || "active").toString().trim().toLowerCase()}">${user.status}</span>
            </p>
            
            <button 
            class="edit-employee-button"
            data-id="${user.id}">
            Edit
            </button>
            
            <button 
            class="delete-employee-button"
            data-id="${user.id}">
                        Delete
                        </button>
                        
                        </div>
                        
                        `;
                        
                        
                        employeesContainer.appendChild(
                            employeeCard
                        );

        });

    }
    
    catch (error) {

        console.error(
            "Error loading employees:",
            error
        );

        const employeesContainer = document.getElementById("employeesContainer");

        if (employeesContainer) {

            employeesContainer.innerHTML =
                `<p class="empty-message">
                    Unable to load employees. Please check whether the server is running.
                </p>`;

        }

    }
    
}

// =========================
// Dashboard Employees Preview
// =========================

async function loadDashboardEmployees() {

    try {

        const response = await fetch(`${API_URL}/users`);

        if (!response.ok) {
            throw new Error("Failed to fetch employees.");
        }

        const users = await response.json();


        // Get active employees and project managers

        const employees = users.filter(user => {

            const isStaff =
                user.role === "employee" ||
                user.role === "project_manager";

            const isActive =
                String(user.status || "").trim().toLowerCase() ===
                "active";

            return isStaff && isActive;

        });


        // Get only first 4 employees

        const recentEmployees = employees.slice(0, 4);


        const dashboardEmployees =
            document.getElementById("dashboardEmployees");


        // Clear previous content

        dashboardEmployees.innerHTML = "";


        // Check if there are no employees

        if (recentEmployees.length === 0) {

            dashboardEmployees.innerHTML =
                `<p class="empty-message">
                    No employees found.
                </p>`;

            return;

        }


        // Display employees

        recentEmployees.forEach(user => {

            const employeeItem =
                document.createElement("div");

            employeeItem.classList.add(
                "dashboard-preview-item"
            );


            employeeItem.innerHTML = `

                <h4>
                    ${escapeHtml(user.name)}
                </h4>

                <p>
                    ${escapeHtml(user.designation)}
                </p>

                <p>
                    Role: ${
                        user.role === "project_manager"
                            ? "Project Manager"
                            : "Employee"
                    }
                </p>

            `;


            dashboardEmployees.appendChild(
                employeeItem
            );

        });

    }

    catch (error) {

        console.error(
            "Error loading dashboard employees:",
            error
        );

    }

}


// =========================
// Load Departments
// =========================

async function loadDepartments() {

    try {

        const response =
            await fetch(`${API_URL}/departments`);

        if (!response.ok) {

            throw new Error(
                "Failed to fetch departments."
            );

        }

        const departments =
            await response.json();


        const employeeDepartment =
            document.getElementById("employeeDepartment");


        // Reset dropdown

        employeeDepartment.innerHTML = `
            <option value="">
                Select Department
            </option>
        `;


        // Add departments

        departments.forEach(department => {

            const option =
                document.createElement("option");

            option.value = department.name;

            option.textContent = department.name;

            employeeDepartment.appendChild(option);

        });

    }

    catch (error) {

        console.error(
            "Error loading departments:",
            error
        );

    }

}



const addEmployeeButton = document.getElementById("addEmployeeButton");
const employeeFormContainer = document.getElementById("employeeFormContainer");
const cancelEmployeeButton = document.getElementById("cancelEmployeeButton");


// Open form
addEmployeeButton.addEventListener("click", function () {

    // Reset edit mode

    editingEmployeeId = null;
    
    
    // Reset form
    
    employeeForm.reset();
    
    
    // Clear previous message
    
    employeeFormMessage.textContent = "";


    // Change form back to Add mode

    document.getElementById("employeeFormTitle").textContent =
    "Add Employee";
    
    document.getElementById("employeeSubmitButton").textContent =
    "Save Employee";
    
    
    // Open form
    
    employeeFormContainer.classList.add("active");


    // Load departments into dropdown

    loadDepartments();
    
});


// Close form
cancelEmployeeButton.addEventListener("click", function () {
    
    employeeFormContainer.classList.remove("active");
    
});

// =========================
// Add Employee
// =========================

const employeeForm = document.getElementById("employeeForm");

const employeeFormMessage =
document.getElementById("employeeFormMessage");

const employeeSubmitButton =
document.getElementById("employeeSubmitButton");

// Employee currently being edited

let editingEmployeeId = null;

employeeForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    
    
    // Get form values
    
    const name =
    document.getElementById("employeeName").value.trim();
    
    const email =
    document.getElementById("employeeEmail").value.trim();
    
    const password =
    document.getElementById("employeePassword").value.trim();
    
    const phone =
    document.getElementById("employeePhone").value.trim();
        
    const department =
    document.getElementById("employeeDepartment").value.trim();
        
    const designation =
    document.getElementById("employeeDesignation").value.trim();
    
    const joiningDate =
    document.getElementById("employeeJoiningDate").value;
    
    const role =
    document.getElementById("employeeRole").value;

    const status =
    document.getElementById("employeeStatus").value;
    
    
    // Basic validation beyond required attributes.

    if (!/^[0-9]{10,12}$/.test(phone)) {
        employeeFormMessage.textContent =
        "Phone must be 10-12 digits.";
        employeeFormMessage.style.color = "#dc2626";
        return;
    }

    if (editingEmployeeId === null && !password) {
        employeeFormMessage.textContent =
        "Password is required for new employees.";
        employeeFormMessage.style.color = "#dc2626";
        return;
    }

    // Create employee object (password optional on edit — keeps old
    // password when left blank).

    const newEmployee = {

        name: name,
        email: email,
        role: role,
        phone: phone,
        department: department,
        designation: designation,
        joiningDate: joiningDate,
        status: status

    };

    if (password) {
        newEmployee.password = password;
    } else if (editingEmployeeId === null) {
        newEmployee.password = "";
    }
    
    // =========================
    // Check Duplicate Email (inside try so a stopped
    // server shows a message instead of hanging)
    // =========================

    try {

        const usersResponse = await fetch(`${API_URL}/users`);

        if (!usersResponse.ok) {

            throw new Error("Failed to verify email.");

        }

        const users = await usersResponse.json();

        const emailExists = users.some(user => {

            // While editing, ignore the current employee
            if (
                editingEmployeeId !== null &&
                String(user.id) === String(editingEmployeeId)
            ) {
                return false;
            }

            return String(user.email || "").toLowerCase() === email.toLowerCase();

        });

        if (emailExists) {

            employeeFormMessage.textContent =
            "This email is already registered.";

            employeeFormMessage.style.color = "#dc2626";

            return;

        }

        employeeSubmitButton.disabled = true;

        let response;


        // =========================
        // Add Employee
        // =========================
        
        if (editingEmployeeId === null) {

            newEmployee.id = await getNextId("users");

            response = await fetch(`${API_URL}/users`, {
                
                method: "POST",
                
                headers: {
                    "Content-Type": "application/json"
                },
                
                body: JSON.stringify(newEmployee)
                
            });
            
        }
        
        // =========================
        // Edit Employee
        // =========================
        
        else {
            
            response = await fetch(
                `${API_URL}/users/${editingEmployeeId}`,
                {
                    
                    method: "PATCH",
                    
                    headers: {
                        "Content-Type": "application/json"
                    },
                    
                    body: JSON.stringify(newEmployee)
                    
                }
            );
            
        }
        
        if (!response.ok) {
            
            throw new Error("Failed to save employee.");
            
        }
        
        
        const savedEmployee = await response.json();
        
        // =========================
        // Success Message
        // =========================
        
        if (editingEmployeeId === null) {
            
            employeeFormMessage.textContent =
            "Employee added successfully.";
            
        }
        
        else {
            
            employeeFormMessage.textContent =
            "Employee updated successfully.";
            
        }
        
        employeeFormMessage.style.color = "#16a34a";


        // In-place refresh (no page reload, no section switch,
        // no scroll jump). Await so the list updates before
        // the form closes and the message stays visible.

        await loadEmployees();

        await loadUserStats();

        await loadDashboardEmployees();

        if (typeof loadReports === "function") {
            await loadReports();
        }

        employeeSubmitButton.disabled = false;


        // Keep the success message visible, then close
        // without touching the current section or scroll.

        setTimeout(() => {

            employeeForm.reset();

            employeeFormMessage.textContent = "";

            employeeFormContainer.classList.remove("active");

            document.getElementById("employeeFormTitle").textContent =
            "Add Employee";

            document.getElementById("employeeSubmitButton").textContent =
            "Save Employee";

        }, 1200);


        // Reset edit mode

        editingEmployeeId = null;

    }


    catch (error) {

        console.error(
            "Error saving employee:",
            error
        );

        employeeFormMessage.textContent =
        "Unable to save employee.";

        employeeFormMessage.style.color = "#dc2626";

        employeeSubmitButton.disabled = false;

    }
    
});

// =========================
// Edit Employee Button
// =========================

document.getElementById("employeesContainer").addEventListener("click", async function (event) {
    
    if (event.target.classList.contains("edit-employee-button")) {
        
        const employeeId = event.target.dataset.id;
        
        editingEmployeeId = employeeId;
        
        try {
            
                const response =
                await fetch(`${API_URL}/users/${employeeId}`);
                
                if (!response.ok) {
                    throw new Error("Failed to fetch employee.");
                }
                
                const employee = await response.json();
                
                // Load departments before filling the value

                await loadDepartments();               
                
                // Fill form with employee data
                
                document.getElementById("employeeName").value =
                employee.name;
                
                document.getElementById("employeeEmail").value =
                employee.email;
                
                document.getElementById("employeePassword").value =
                employee.password;
                
                document.getElementById("employeePhone").value =
                employee.phone;
                
                document.getElementById("employeeDepartment").value =
                employee.department;
                
                document.getElementById("employeeDesignation").value =
                employee.designation;
                
                document.getElementById("employeeJoiningDate").value =
                employee.joiningDate;
                
                document.getElementById("employeeRole").value =
                employee.role;

                document.getElementById("employeeStatus").value =
                employee.status;
                
                
                // Change form to Edit mode

                document.getElementById("employeeFormTitle").textContent =
                "Edit Employee";
                
                document.getElementById("employeeSubmitButton").textContent =
                "Update Employee";
                
                
                // Open employee form
                
                employeeFormContainer.classList.add("active");
                
            }
            
            catch (error) {

                console.error(
                    "Error fetching employee:",
                    error
                );

                employeeFormMessage.textContent =
                    "Unable to load employee. Please check whether the server is running.";

                employeeFormMessage.style.color = "#dc2626";

            }
            
        } else if (event.target.classList.contains("delete-employee-button")) {
            
            const employeeId = event.target.dataset.id;
            
            // Count linked records across every relationship so the
            // confirm blocks deletes that would orphan history.
            // IDs are never reused, but dangling references would
            // still corrupt project/team/attendance/leave views.

            let linkedProjects = 0;

            let linkedTasks = 0;

            let linkedMemberships = 0;

            let linkedAttendance = 0;

            let linkedLeaves = 0;

            try {

                const [
                    projectsResponse,
                    tasksResponse,
                    attendanceResponse,
                    leavesResponse
                ] = await Promise.all([
                    fetch(`${API_URL}/projects`),
                    fetch(`${API_URL}/tasks`),
                    fetch(`${API_URL}/attendance`),
                    fetch(`${API_URL}/leaves`)
                ]);

                if (projectsResponse.ok) {

                    const allProjects =
                        await projectsResponse.json();

                    linkedProjects = allProjects.filter(project =>
                        String(project.projectManagerId) === String(employeeId)
                    ).length;

                    linkedMemberships = allProjects.filter(project =>
                        (project.assignedEmployees || []).map(id => String(id)).includes(String(employeeId))
                    ).length;

                }

                if (tasksResponse.ok) {

                    const allTasks =
                        await tasksResponse.json();

                    linkedTasks = allTasks.filter(task =>
                        getTaskAssigneeIds(task).includes(String(employeeId))
                    ).length;

                }

                if (attendanceResponse.ok) {

                    const allAttendance =
                        await attendanceResponse.json();

                    linkedAttendance = allAttendance.filter(record =>
                        String(record.employeeId ?? record.userId ?? "") === String(employeeId)
                    ).length;

                }

                if (leavesResponse.ok) {

                    const allLeaves =
                        await leavesResponse.json();

                    linkedLeaves = allLeaves.filter(leave =>
                        String(leave.employeeId) === String(employeeId)
                    ).length;

                }

            }

            catch (countError) {

                console.error(
                    "Error counting linked records:",
                    countError
                );

            }


            // Block delete when any linked records exist — deactivating
            // preserves history instead of leaving dangling references.

            const linkedTotal =
                linkedProjects +
                linkedTasks +
                linkedMemberships +
                linkedAttendance +
                linkedLeaves;

            if (linkedTotal > 0) {
                alert(
                    `Cannot delete: this employee has ${linkedProjects} managed project(s), ${linkedMemberships} team membership(s), ${linkedTasks} assigned task(s), ${linkedAttendance} attendance record(s) and ${linkedLeaves} leave record(s). Set status to Inactive instead.`
                );
                return;
            }

            const confirmDelete = confirm(
                "Are you sure you want to delete this employee?"
            );
            
            if (!confirmDelete) {
                return;
            }
            
            
            try {
                
                const response = await fetch(
                    `${API_URL}/users/${employeeId}`,
                    {
                        method: "DELETE"
                    }
                );

                
                if (!response.ok) {
                    
                    throw new Error("Failed to delete employee.");
                    
                }
                
                
                // Reload employee list in place (no section switch).

                await loadEmployees();


                // Reload dashboard statistics

                await loadUserStats();

                await loadDashboardEmployees();

                if (typeof loadReports === "function") {
                    await loadReports();
                }
                
            }
            
            catch (error) {

                console.error(
                    "Error deleting employee:",
                    error
                );

                alert("Unable to delete employee. Please try again.");

            }
            
        }
});


