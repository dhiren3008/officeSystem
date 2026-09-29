// =========================
// Custom Date Picker Component
// Wraps an existing <input type="date"> without removing it.
// Keeps native input as the source of truth so all existing
// .value / .addEventListener("change") code in admin.js and
// manager.js keeps working unchanged.
// =========================

function enhanceDateInput(inputElement) {

    if (!inputElement || inputElement.dataset.enhanced === "true") {
        return;
    }

    inputElement.dataset.enhanced = "true";


    const wrapper = document.createElement("div");
    wrapper.className = "custom-date-wrapper";

    inputElement.parentNode.insertBefore(wrapper, inputElement);
    wrapper.appendChild(inputElement);


    // Trigger

    const trigger = document.createElement("div");
    trigger.className = "custom-date-trigger";
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("role", "button");
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML = `
        <span class="placeholder">Select date</span>
        <svg class="custom-date-icon" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
    `;

    wrapper.appendChild(trigger);

    const triggerLabel = trigger.querySelector("span");


    // Popup

    const popup = document.createElement("div");
    popup.className = "custom-date-popup";
    popup.innerHTML = `
        <div class="custom-date-header">
            <button type="button" class="custom-date-nav" data-dir="-1">&#8249;</button>
            <strong class="custom-date-month-label"></strong>
            <button type="button" class="custom-date-nav" data-dir="1">&#8250;</button>
        </div>
        <div class="custom-date-weekdays">
            <span>S</span><span>M</span><span>T</span><span>W</span>
            <span>T</span><span>F</span><span>S</span>
        </div>
        <div class="custom-date-grid"></div>
        <div class="custom-date-footer">
            <button type="button" class="custom-date-today-btn">Today</button>
        </div>
    `;

    wrapper.appendChild(popup);

    const monthLabel = popup.querySelector(".custom-date-month-label");
    const grid = popup.querySelector(".custom-date-grid");
    const todayBtn = popup.querySelector(".custom-date-today-btn");


    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];


    let viewDate = new Date();


    function formatValue(date) {

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;

    }


    function formatDisplay(date) {

        return date.toLocaleDateString(undefined, {
            day: "numeric", month: "short", year: "numeric"
        });

    }


    function getSelectedDate() {

        if (!inputElement.value) return null;

        const parts = inputElement.value.split("-");

        return new Date(
            parseInt(parts[0]),
            parseInt(parts[1]) - 1,
            parseInt(parts[2])
        );

    }


    function isWithinBounds(date) {

        const dateStr = formatValue(date);

        if (inputElement.min && dateStr < inputElement.min) return false;
        if (inputElement.max && dateStr > inputElement.max) return false;

        return true;

    }


    function syncTrigger() {

        const selected = getSelectedDate();

        if (!selected) {

            triggerLabel.textContent = "Select date";
            triggerLabel.classList.add("placeholder");

        } else {

            triggerLabel.textContent = formatDisplay(selected);
            triggerLabel.classList.remove("placeholder");

            viewDate = new Date(selected);

        }

        renderGrid();

    }


    function renderGrid() {

        grid.innerHTML = "";

        monthLabel.textContent =
            `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const selected = getSelectedDate();
        const today = new Date();

        const cells = [];


        // Leading days from previous month

        for (let i = firstDayOfMonth - 1; i >= 0; i--) {

            cells.push({
                day: daysInPrevMonth - i,
                date: new Date(year, month - 1, daysInPrevMonth - i),
                outside: true
            });

        }


        // Current month days

        for (let day = 1; day <= daysInMonth; day++) {

            cells.push({
                day: day,
                date: new Date(year, month, day),
                outside: false
            });

        }


        // Trailing days to fill final week row

        let trailing = 1;

        while (cells.length % 7 !== 0) {

            cells.push({
                day: trailing,
                date: new Date(year, month + 1, trailing),
                outside: true
            });

            trailing++;

        }


        cells.forEach(cell => {

            const cellEl = document.createElement("div");

            cellEl.className = "custom-date-day";

            cellEl.textContent = cell.day;


            if (cell.outside) {
                cellEl.classList.add("outside");
            }

            if (
                cell.date.toDateString() === today.toDateString()
            ) {
                cellEl.classList.add("today");
            }

            if (
                selected &&
                cell.date.toDateString() === selected.toDateString()
            ) {
                cellEl.classList.add("selected");
            }

            if (!isWithinBounds(cell.date)) {
                cellEl.classList.add("disabled");
            }


            cellEl.addEventListener("click", function () {
                 if (!isWithinBounds(cell.date)) {
                    return; // date is outside min/max — do nothing
                }

                inputElement.value = formatValue(cell.date);

                inputElement.dispatchEvent(new Event("change", { bubbles: true }));
                inputElement.dispatchEvent(new Event("input", { bubbles: true }));

                syncTrigger();

                closePopup();

            });

            grid.appendChild(cellEl);

        });

    }


    function openPopup() {
        if (typeof window.closeAllCustomPopups === "function") {
            window.closeAllCustomPopups(wrapper);
        }
        wrapper.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
        renderGrid();
    }

    function closePopup() {
        wrapper.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
    }


    trigger.addEventListener("click", function (event) {

        event.stopPropagation();

        wrapper.classList.contains("open") ? closePopup() : openPopup();

    });

    trigger.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            wrapper.classList.contains("open") ? closePopup() : openPopup();
        } else if (event.key === "Escape") {
            closePopup();
            trigger.blur();
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!wrapper.classList.contains("open")) openPopup();
        }
    });


    popup.querySelectorAll(".custom-date-nav").forEach(button => {

        button.addEventListener("click", function (event) {

            event.stopPropagation();

            const dir = parseInt(this.dataset.dir);

            viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + dir, 1);

            renderGrid();

        });

    });


    todayBtn.addEventListener("click", function (event) {

        event.stopPropagation();

        const today = new Date();

        inputElement.value = formatValue(today);

        inputElement.dispatchEvent(new Event("change", { bubbles: true }));
        inputElement.dispatchEvent(new Event("input", { bubbles: true }));

        syncTrigger();

        closePopup();

    });


    document.addEventListener("click", function (event) {

        if (!wrapper.contains(event.target)) {
            closePopup();
        }

    });


    // Watch for the input's value being changed programmatically
    // (e.g. editTask() setting taskDueDate.value = task.dueDate,
    // or attendanceDate.value = getTodayDate())

    const originalDescriptor =
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");

    Object.defineProperty(inputElement, "value", {

        get() {
            return originalDescriptor.get.call(this);
        },

        set(newValue) {
            originalDescriptor.set.call(this, newValue);
            syncTrigger();
        }

    });


    syncTrigger();

}


// =========================
// Auto-enhance every date input on the page
// =========================

document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll('input[type="date"]').forEach(enhanceDateInput);

});