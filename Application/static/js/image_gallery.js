document.addEventListener('DOMContentLoaded', function () {
    const plantId = getQueryParameter('plantId');
    const plantTypeId = getQueryParameter('typeId');

    if (plantId && !isNaN(plantId)) {
        document.querySelector('input[name="plant_id"]').value = plantId;

        getImage(plantId);
    } else {
        console.error('Invalid ID for biljke.');
    }

    const plantType = document.getElementById('plantType');

    if (plantTypeId) {
        plantType.href = `/type/${plantTypeId}`;
    } else {
        console.error('Invalid ID for vrsta.');
    }

});

document.getElementById('frmUploadImage').onsubmit = async function (event) {
    event.preventDefault();

    const description = document.getElementById('description').value;
    const plantId = getQueryParameter('plantId');
    const fileInput = document.getElementById('image');
    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append('plant_id', plantId);
    formData.append('description', description);
    formData.append('image', file);

    try {
        const response = await fetch('http://localhost:3000/uploadImage', {
            method: 'POST',
            body: formData,
        });

        const responseData = await response.json();

        if (responseData.success) {
            getImage(plantId);

            document.getElementById('frmUploadImage').reset();
        } else {
            console.error('Upload nije uspio.');
        }
    } catch (error) {
        console.error('Greška pri slanju slike:', error);
    }
};


function showImageGallery(slike) {
    const imageGalleryContainer = document.getElementById('imageGalleryContainer');
    imageGalleryContainer.innerHTML = '';

    slike.forEach(image => {
        const divCol = document.createElement('div');
        divCol.classList.add('col-md-3', 'mb-4', 'col-12');

        const card = `
            <div class="card">
                <img src="data:image/png;base64,${image.slika}" class="card-img-top" alt="Slika ${image.opis}" style="height: 200px;">
                <div class="card-body">
                    <h5 class="card-title">${image.opis}</h5>
                    <button type="button" class="btn btn-danger" onclick="obrisiSliku(${image.id})">Obriši sliku</button>
                </div>
            </div>`;

        divCol.innerHTML = card;

        imageGalleryContainer.appendChild(divCol);
    });
}

function getImage(plantId) {
    fetch(`http://localhost:3000/plantImage/${plantId}`)
        .then(response => response.json())
        .then(data => {
            showImageGallery(data.images);
        })
        .catch(error => {
            console.error('Error fetching images:', error);
        });
}

function obrisiSliku(plantId) {
    fetch(`http://localhost:3000/plantImage/${plantId}`, {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(() => {
            getImage(getQueryParameter('plantId'));
        })
        .catch(error => {
            console.error('Error deleting image:', error);
        });
}

function getQueryParameter(parameterName) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(parameterName);
}