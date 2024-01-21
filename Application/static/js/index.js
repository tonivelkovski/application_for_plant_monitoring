document.addEventListener('DOMContentLoaded', function () {
    fetchPlantTypes();

    const typeForm = document.getElementById('typeForm');
    typeForm.addEventListener('submit', handleTypeFormSubmit);
    updateDropdownOptions();
});

function updateDropdownOptions() {
    fetch('/allTypes')
        .then(response => response.json())
        .then(data => {
            const deleteTypeDropdown = document.getElementById('deleteTypeDropdown');

            deleteTypeDropdown.innerHTML = '<option value="">---</option>';

            data.types.forEach(type => {
                const option = document.createElement('option');
                option.value = type.id;
                option.textContent = type.naziv;
                deleteTypeDropdown.appendChild(option);
            });
        })
        .catch(error => console.error(error));
}

function fetchPlantTypes() {
    const plantTypeContainer = document.getElementById('plantTypes');

    plantTypeContainer.innerHTML = '';
    fetch('/fetchLastAddedImage')
        .then(response => response.json())
        .then(plantTypes => {
            const plantTypeContainer = document.getElementById('plantTypes');
            const carouselInner = document.querySelector('.carousel-inner');

            plantTypes.forEach(image => {
                const plantTypeElement = document.createElement('div');
                plantTypeElement.classList.add('col-md-3', 'mb-4');

                let imageElement = '';
                if (image.slika) {
                    imageElement = `<img src="data:image/png;base64,${image.slika}" class="card-img-top" alt="Slika 
                    ${image.vrsta}" style="width: 253px; height: 197.65px;">`;
                }

                const card = `
                            <div class="card">
                                <div class="card-body p-0">
                                    <a href="/type/${image.id}" class="vrsta-link">
                                        <h5 class="card-title">${image.vrsta}</h5>
                                    </a>
                                ${imageElement}
                                </div>
                            </div>`;


                plantTypeElement.innerHTML = card;
                plantTypeContainer.appendChild(plantTypeElement);
            });

            $('#carouselExampleControls').carousel({
                interval: 3000,
                wrap: true,
                keyboard: true
            });
        })
        .catch(error => console.error(error));
}

function handleTypeFormSubmit(event) {
    event.preventDefault();
    const typeName = document.getElementById('typeName').value;
    
    fetch('/addPlantType', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ typeName }),
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                fetchPlantTypes();
                updateDropdownOptions();
                document.getElementById('typeName').value = '';
            } else {
                console.error('Greška prilikom dodavanja vrste:', result.error);
            }
        })
        .catch(error => console.error(error));
}

function handleTypeDeletion() {
    const deleteTypeDropdown = document.getElementById('deleteTypeDropdown');
    const selectedTypeId = deleteTypeDropdown.value;

    if (!selectedTypeId) {
        console.error('Molimo odaberite vrstu za brisanje.');
        return;
    }

    fetch(`/deletePlantType/${selectedTypeId}`, {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                fetchPlantTypes();
                updateDropdownOptions();
            } else {
                console.error('Greška prilikom brisanja vrste:', result.error);
            }
        })
        .catch(error => console.error(error));
}