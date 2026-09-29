// =========================
// Custom Select Component
// Wraps an existing <select> without removing it.
// Keeps native select as the source of truth so all
// existing .value / .addEventListener("change") code
// in admin.js and manager.js keeps working unchanged.
// =========================

// =========================
// Shared popup coordinator: only one custom widget stays open.
// Loaded before custom-date.js / members-picker code so every
// opener can call it. Safe to define twice (guarded).
// =========================

if (typeof window.closeAllCustomPopups !== "function") {
    window.closeAllCustomPopups = function (except) {
        document.querySelectorAll(
            ".custom-select-wrapper.open, .custom-date-wrapper.open, .members-picker.open"
        ).forEach(function (el) {
            if (el !== except) el.classList.remove("open");
        });
        document.querySelectorAll(
            ".custom-select-trigger[aria-expanded='true'], .custom-date-trigger[aria-expanded='true']"
        ).forEach(function (t) {
            if (!except || !except.contains(t)) t.setAttribute("aria-expanded", "false");
        });
    };

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") window.closeAllCustomPopups();
    });
}

function enhanceSelect(selectElement) {

    if (!selectElement || selectElement.dataset.enhanced === "true") {
        return;
    }

    // Opt out for controls with their own UI
    // (e.g. multi-select pickers): <select data-no-enhance>.

    if (selectElement.hasAttribute("data-no-enhance")) {
        return;
    }

    selectElement.dataset.enhanced = "true";


    // Wrap the select

    const wrapper = document.createElement("div");
    wrapper.className = "custom-select-wrapper";

    selectElement.parentNode.insertBefore(wrapper, selectElement);
    wrapper.appendChild(selectElement);


    // Trigger (the visible closed box)

    const trigger = document.createElement("div");
    trigger.className = "custom-select-trigger";
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("role", "combobox");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML = `
        <span class="placeholder">Select</span>
        <svg class="custom-select-arrow" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    `;

    wrapper.appendChild(trigger);

    const triggerLabel = trigger.querySelector("span");


    // Option list

    const list = document.createElement("div");
    list.className = "custom-select-list";
    wrapper.appendChild(list);


    // =========================
    // Sync the visible list from the real <select>
    // =========================

    function syncList() {

        list.innerHTML = "";

        Array.from(selectElement.options).forEach(option => {

            const item = document.createElement("div");

            item.className = "custom-select-option";

            item.textContent = option.textContent;

            if (option.disabled) {
                item.classList.add("disabled");
            }

            if (option.value === selectElement.value) {
                item.classList.add("selected");
            }

            item.addEventListener("click", function () {

                selectElement.value = option.value;

                selectElement.dispatchEvent(new Event("change", { bubbles: true }));

                syncTrigger();

                closeList();

            });

            list.appendChild(item);

        });

    }


    // =========================
    // Sync the closed trigger label
    // =========================

    function syncTrigger() {

        const selectedOption =
            selectElement.options[selectElement.selectedIndex];


        if (!selectedOption || selectedOption.value === "") {

            triggerLabel.textContent =
                selectedOption ? selectedOption.textContent : "Select";

            triggerLabel.classList.add("placeholder");

        } else {

            triggerLabel.textContent = selectedOption.textContent;

            triggerLabel.classList.remove("placeholder");

        }

        syncList();

    }


    function openList() {
        window.closeAllCustomPopups(wrapper);
        wrapper.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
    }

    function closeList() {
        wrapper.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
    }


    trigger.addEventListener("click", function (event) {

        event.stopPropagation();

        wrapper.classList.contains("open") ? closeList() : openList();

    });

    trigger.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            wrapper.classList.contains("open") ? closeList() : openList();
        } else if (event.key === "Escape") {
            closeList();
            trigger.blur();
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!wrapper.classList.contains("open")) openList();
        }
    });


    document.addEventListener("click", function (event) {

        if (!wrapper.contains(event.target)) {
            closeList();
        }

    });


    // =========================
    // Watch for options being added/removed dynamically
    // (taskProject, projectManager all
    // populate options after page load; task assignees now use a
    // members-picker instead of a single select)
    // =========================

    const observer = new MutationObserver(syncTrigger);

    observer.observe(selectElement, {
        childList: true
    });


    // Watch for the select's value being changed programmatically
    // (e.g. editTask() setting taskProject.value = task.projectId)

    const originalDescriptor =
        Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");

    Object.defineProperty(selectElement, "value", {

        get() {
            return originalDescriptor.get.call(this);
        },

        set(newValue) {
            originalDescriptor.set.call(this, newValue);
            syncTrigger();
        }

    });


    // Initial paint

    syncTrigger();

}


// =========================
// Auto-enhance every select on the page
// =========================

document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll("select").forEach(enhanceSelect);

});