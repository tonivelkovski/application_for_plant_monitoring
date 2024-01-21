const currentUrl = window.location.href;
const urlParts = currentUrl.split('/');
const typeId = parseInt(urlParts.pop(), 10);
let formAction;
let currentPlantId;

localStorage.setItem('typeId', typeId);

function setFormAction(action) {
    formAction = action;
}

function getFormAction() {
    return formAction;
}

let plants;

document.addEventListener('DOMContentLoaded', function () {
    fetchData();
    setupDatePicker();
});

function fetchData() {
    fetch(`http://localhost:3000/plantType/${typeId}`)
        .then(response => response.json())
        .then(data => {
            plants = data.plants || [];
            showData(plants);
            setupPage(plants);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function setupPage(plants) {
    document.querySelector('#pageTitle').textContent = `Vrsta biljaka: ${plants[0].naziv_vrste}`;
}

function showData(plants) {
    const tableBody = document.querySelector('#vrstaTable tbody');
    tableBody.innerHTML = '';

    plants.forEach(plant => {
        const row = document.createElement('tr');
        if (plant.id !== null) {
            row.innerHTML = `
            <td>${plant.id}</td>
            <td>${plant.naziv}</td>
            <td>${formatDate(plant.datum_sadnje)}</td>
            <td>${formatDate(plant.datum_zadnjeg_zadatka)}</td>
            <td>${plant.broj_slika}</td>
            <td>${plant.broj_zadataka}</td>
            <td><a href="#" onclick="setFormAction('edit'); openForm('edit', ${plant.id})">Uredi</a></td>
            <td class="delete-btn" onclick="deletePlant(${plant.id})">Obriši</td>
            <td><a href="/image_gallery?plantId=${plant.id}&typeId=${typeId}">Galerija slika</a></td>
            <td><a href="/task_list?plantId=${plant.id}">Popis zadataka</a></td>
        `;
        }
        tableBody.appendChild(row);
    });

}

function closeForm() {
    document.getElementById('addEditForm').style.display = 'none';
    document.querySelector('.overlay').style.display = 'none';
}

function openForm(action, plantId) {
    console.log('Opening form for plantId:', plantId);
    const formTitle = document.querySelector('#formTitle');
    const plantForm = document.querySelector('#plantForm');

    setFormAction(action);

    if (action === 'add') {
        formTitle.textContent = 'Dodaj Biljku';
        plantForm.reset();
    } else if (action === 'edit') {
        formTitle.textContent = 'Uredi Biljku';
        currentPlantId = plantId;

        fetch(`http://localhost:3000/plant/${plantId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                document.getElementById('name').value = data.plant.naziv;
                document.getElementById('plantingDate').value = formatDate(data.plant.datum_sadnje);
            })
            .catch(error => {
                console.error('Error fetching plant data:', error);
            });
    }

    document.getElementById('addEditForm').style.display = 'block';
    document.querySelector('.overlay').style.display = 'block';
}

function submitForm(action) {
    const name = document.getElementById('name').value;
    const plantingDate = document.getElementById('plantingDate').value;

    if (name && plantingDate) {
        const id_vrste = typeId;
        const broj_slika = 0;

        const newPlant = {
            naziv: name,
            datum_sadnje: new Date(plantingDate).toISOString(),  
            id_vrste,
            broj_slika
        };
        let url;

        if (action === 'add') {
            url = 'http://localhost:3000/plant';
        } else if (action === 'edit') {
            url = `http://localhost:3000/plant/${currentPlantId}`;
        }

        fetch(url, {
            method: action === 'add' ? 'POST' : 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newPlant),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }

                if (action === 'add') {
                    plants.push(data);
                } else if (action === 'edit') {
                    const updatedPlantIndex = plants.findIndex(biljka => biljka.id === currentPlantId);
                    plants[updatedPlantIndex] = data;
                }
                showData(plants);
                closeForm();
            })
            .catch(error => {
                console.error('Error adding/updating plant:', error.message);
            });
    }
}

function deletePlant(plantId) {
    fetch(`http://localhost:3000/biljke/${plantId}`, {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(() => {
            const updatedData = plants && plants.length > 0 ? plants.filter(plant => plant.id != plantId) : [];
            plants = updatedData;
            showData(plants);
        })
        .catch(error => {
            console.error('Error deleting plant:', error);
        });
}


function setupDatePicker() {
    $('.datepicker').datepicker({
        dateFormat: 'yy-mm-dd',
        changeMonth: true,
        changeYear: true,
    });
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}
