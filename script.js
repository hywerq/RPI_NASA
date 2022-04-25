const datePicker = document.getElementById('date-picker');
const notificationHolder = document.querySelector('#notify');

async function getData(url) {
    const response = await axios(`${url}`);

    if(Math.floor(response.status / 100) !== 2) {
        throw new Error(`Couldn't fetch ${url}, status: ${response.status}`);
    }

    return response;
}

function customHttp() {
    return {
        get(url, cb) {
            getData(url)
                .then(response => { cb(null, response.data) })
                .catch(error => cb(error))
        },
    };
}

const http = customHttp();

const nasaService = (function() {
    const url = 'https://api.nasa.gov/planetary/apod?';
    const api_key = 'api_key=gOtT61jj844yLTungiRyO4qZWmKxTVDxMgpX8g73';

    return {
        todayPicture(cb) {
            http.get(url + api_key, cb);
        },
        monthPictures(start_date, end_date, cb) {
            http.get(url + api_key + start_date + end_date, cb);
        },
    };
})();

Date.prototype.monthDays = function() {
    const d = new Date(this.getFullYear(), this.getMonth() + 1, 0);
    return d.getDate();
}

function onGetResponse(err, res) {
    removePreloader();

    if (err) {
        showAlert(err.message, 'rounded red');
        return;
    }

    renderNasa(res);
    showAlert('Enjoy!');
}

function loadPictures() {
    showPreloader();

    if (!datePicker.value) {
        nasaService.todayPicture(onGetResponse);
        return;
    }

    const dateNow = new Date().toISOString().slice(0, 7);
    const dateSelected = datePicker.value.toString();
    let days = new Date(datePicker.value).monthDays();

    localStorage.setItem('selectedDate', datePicker.value);

    if (dateNow === dateSelected) {
        days = new Date().getDate();
    }

    const start_date = '&start_date=' + datePicker.value + '-01';
    const end_date = '&end_date=' + datePicker.value + '-' + days;

    nasaService.monthPictures(start_date, end_date, onGetResponse);
}

function renderNasa(elements) {
    const nasaContainer = document.querySelector('.grid-row');
    if (nasaContainer.children.length) {
        clearContainer(nasaContainer);
    }

    let fragment = ``;
    if(Array.isArray(elements)) {
        elements.forEach(nasaItem => {
            const el = getNasaTemplate(nasaItem);
            fragment += el;
        });
    }
    else {
        fragment = getNasaTemplate(elements);
    }

    nasaContainer.insertAdjacentHTML('afterbegin', fragment);
}

function getNasaTemplate({ title, explanation, date, url, hdurl, media_type}) {
    if(media_type === 'image') {
        return `
        <div class="card">
            <div class="card-top">
                <img src="${url}" alt="Picture of the Day">
            </div>
            <div class="card-info">
                <h2>${title}</h2>
                <span class="date">${date}</span>
                <p class="explanation">${explanation}</p>
            </div>
            <div class="card-bottom">
                <a href="${hdurl}" class="get-picture">See Full Size Picture</a>
            </div>
        </div>
       `;
    }

    return `
        <div class="card">
            <div class="card-top">
                <video
                    src="${url}"
                    title="YouTube video"
                ></video>
            </div>
            <div class="card-info">
                <h2>${title}</h2>
                <span class="date">${date}</span>
                <p class="explanation">${explanation}</p>
            </div>
            <div class="card-bottom">
                <a href="${hdurl}" class="get-picture">See Full Size Picture</a>
            </div>
        </div>
    `;
}

function clearContainer(container) {
    let child = container.lastElementChild;
    while (child) {
        container.removeChild(child);
        child = container.lastElementChild;
    }
}

function showAlert(msg, type = 'success') {
    document.dispatchEvent(new CustomEvent('notify', {
        detail: { msg: msg, type: type }
    }));

    setTimeout(() => {
        notificationHolder.innerHTML = '';
    }, 2500);
}

function showPreloader() {
    const nasaContainer = document.querySelector('.grid-row');
    if (nasaContainer.children.length) {
        clearContainer(nasaContainer);
    }

    const preloader = document.querySelector('.planet-loader');
    if (preloader) {
        return;
    }

    document.querySelector('body').insertAdjacentHTML(
        'afterbegin',
        `<div class="planet-container">
                <div class="planet-loader"></div>
              </div>`
    );
}

function removePreloader() {
    const preloader = document.querySelector('.planet-container');

    if (preloader) {
        preloader.remove();
    }
}

datePicker.addEventListener('change', (e) => {
    e.preventDefault();
    loadPictures();
});

document.addEventListener('notify', (e) => {
    const container = document.createElement('div');

    container.classList.add('notification-container');
    container.innerHTML = e.detail.msg;

    notificationHolder.insertAdjacentElement('beforeend', container);
});

document.addEventListener('DOMContentLoaded', function() {
    datePicker.value = localStorage.selectedDate;
    loadPictures();
});