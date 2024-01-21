const typeId = localStorage.getItem('typeId');
if (typeId) {
    const linkToPlantType = document.getElementById('linkToPlantType');
    linkToPlantType.href = `/type/${typeId}`;
}
const plantId = getQueryParameter('plantId');

let date = new Date();
let year = date.getFullYear();
let month = date.getMonth();

const day = document.querySelector(".calendar-dates");

const currdate = document.querySelector(".calendar-current-date");

const prenexIcons = document.querySelectorAll(".calendar-navigation span");

const months = ["Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj",
    "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac"];

const fetchTasks = async (month, year) => {
    try {
        const url = `http://localhost:3000/tasks?plantId=${plantId}&month=${month + 1}&year=${year}`;
        const response = await fetch(url);
        const data = await response.json();

        return data;
    } catch (error) {
        console.error('Greška prilikom dohvaćanja podataka iz backend-a:', error);
        throw error;
    }
};


document.addEventListener('click', async (event) => {
    const target = event.target;

    if (target.tagName === 'LI' && !target.classList.contains('inactive')) {
        const date = parseInt(target.innerText);
        const dialog = document.getElementById('taskDialog');
        const taskNameInput = document.getElementById('taskName');
        const taskDescriptionInput = document.getElementById('taskDescription');
        const saveButton = document.getElementById('saveButton');

        dialog.style.display = 'block';

        const selectedDate = new Date(year, month, date);
        const data = await fetchTasks(selectedDate.getMonth(), selectedDate.getFullYear());

        taskNameInput.value = data.name || '';
        taskDescriptionInput.value = data.description || '';

        saveButton.onclick = async () => {
            const name = taskNameInput.value;
            const description = taskDescriptionInput.value;
            const date = selectedDate;
            await addTask(name, description, date);
            await manipulate();
            closeDialog();
        };
    }
});

const currentDate = new Date();
let alreadyShownTasks = [];
let alreadyShownFinishedTasks = [];

function isTaskAlreadyShown(taskId) {
    return alreadyShownTasks.includes(taskId);
}

function isFinishedTaskAlreadyShown(taskId) {
    return alreadyShownFinishedTasks.includes(taskId);
}

function markTaskAsShown(taskId) {
    alreadyShownTasks.push(taskId);
}

const manipulate = async () => {
    let dayone = new Date(year, month, 1).getDay();
    let lastdate = new Date(year, month + 1, 0).getDate();
    let dayend = new Date(year, month, lastdate).getDay();
    let monthlastdate = new Date(year, month, 0).getDate();
    let lit = "";

    for (let i = dayone; i > 0; i--) {
        lit +=
            `<li class="inactive">${monthlastdate - i + 1}</li>`;
    }

    for (let i = 1; i <= lastdate; i++) {
        let isToday = i === date.getDate()
            && month === new Date().getMonth()
            && year === new Date().getFullYear()
            ? "active"
            : "";
        lit += `<li class="${isToday}">${i}</li>`;
    }

    for (let i = dayend; i < 6; i++) {
        lit += `<li class="inactive">${i - dayend + 1}</li>`
    }

    currdate.innerText = `${months[month]} ${year}`;
    day.innerHTML = lit;

    const data = await fetchTasks(month, year);

    data.allTasks.forEach(task => {
        const taskDay = new Date(task.datum).getDate();
        const elements = day.querySelectorAll(`li:not(.inactive)`);

        Array.from(elements).forEach(element => {
            if (parseInt(element.textContent) === taskDay) {
                element.dataset.taskId = task.id;

                if (!task.izvrsen) {
                    element.innerHTML += `<br>${task.naziv}`;
                }

                if (
                    new Date(task.datum).getDate() === currentDate.getDate() &&
                    new Date(task.datum).getMonth() === currentDate.getMonth() &&
                    new Date(task.datum).getFullYear() === currentDate.getFullYear()
                ) {
                    if (!isTaskAlreadyShown(task.id) && task.izvrsen !== true) {
                        showTasksForToday(task);
                        markTaskAsShown(task.id);
                    }
                }
            }
        });
    });
    await listOfCompletedTasks();
}

manipulate();

prenexIcons.forEach(icon => {
    icon.addEventListener("click", () => {
        month = icon.id === "calendar-prev" ? month - 1 : month + 1;

        if (month < 0 || month > 11) {
            date = new Date(year, month, new Date().getDate());
            year = date.getFullYear();
            month = date.getMonth();
        } else {
            date = new Date();
        }
        manipulate();
    });
});


async function addTask(name, description, date) {
    try {
        const response = await fetch('http://localhost:3000/task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                plantId: plantId,
                name: name,
                description: description,
                date: formatDate(date)
            }),
        });
        const data = await response.json();
    } catch (error) {
        console.error('Greška prilikom dodavanja zadatka:', error);
    }
}

function showTasksForToday(task) {
    console.log("DANAS", task);
    const taskList = document.getElementById('taskItems');
    const taskItem = document.createElement('li');
    taskItem.innerHTML = `<strong>${task.naziv}:</strong> ${task.opis}
    <button onclick="(async () => {await makeTaskCompleted(${task.id}); removeTaskItem(${task.id}) })()">Završi zadatak</button>`;
    taskItem.id = `taskItem_${task.id}`;
    taskList.appendChild(taskItem);
}

function removeTaskItem(taskId) {
    const taskItem = document.getElementById(`taskItem_${taskId}`);
    if (taskItem) {
        taskItem.remove();
    }
    manipulate();
}

async function makeTaskCompleted(taskId) {
    try {
        const response = await fetch(`http://localhost:3000/makeTaskCompleted/${taskId}`, {
            method: 'PUT',
        });
        const data = await response.json();
        showCompletedTasksForToday([data]);

    } catch (error) {
        console.error('Greška prilikom označavanja zadatka izvršenim:', error);
    }
}

function showCompletedTasksForToday(tasks) {
    const completedTasksList = document.getElementById('completedTaskItems');
    completedTasksList.innerHTML = '';

    tasks.forEach(task => {
        if (!isFinishedTaskAlreadyShown(task.id)) {
            const completedTaskItem = document.createElement('li');
            completedTaskItem.innerHTML = `<strong>${task.naziv}:</strong> ${task.opis}`;
            completedTaskItem.id = `completedTaskItem_${task.id}`;
            completedTasksList.appendChild(completedTaskItem);
        }

    });
}

async function listOfCompletedTasks() {
    const day = new Date().getDate();
    try {
        const url = `http://localhost:3000/listOfCompletedTasks?plantId=${plantId}&day=${day}`;

        const response = await fetch(url);
        const tasks = await response.json();

        showCompletedTasksForToday(tasks.tasks);
    } catch (error) {
        console.error('Greška prilikom dohvatanja izvršenih zadataka:', error);
    }
}

function closeDialog() {
    document.getElementById('taskDialog').style.display = 'none';
    document.querySelector('.overlay').style.display = 'none';
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function getQueryParameter(parameterName) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(parameterName);
}
