let obtenerHoraLocal = () => {
  var fechaHora = new Date();
  var horas = fechaHora.getHours();
  var minutos = fechaHora.getMinutes();
  minutos = minutos < 10 ? '0' + minutos : minutos;
  var horaLocal = horas + ':' + minutos;
  let elementoHora = document.getElementById("hora");
  elementoHora.innerHTML=horaLocal;
}

setTimeout(() => {
  setInterval(() => {
    obtenerHoraLocal();
  }, 60000);
  obtenerHoraLocal();
}, (60 - new Date().getSeconds()) * 1000);


let crearConfig = (tipoGrafico, lbl1, lblDataset, data) => {
  let config = {
    type: tipoGrafico,
    data: {
      labels: lbl1,
      datasets: [
        {
          label: lblDataset,
          data: data,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  };
  return config;
}
let crearConfigMaxMin = (tipoGrafico, lbl1, lblMax,dataMax, lblMin, dataMin) => {
  let config = {
    type: tipoGrafico,
    data: {
      labels: lbl1,
      datasets: [
        {
          label: lblMax,
          data: dataMax,
        },
        {
          label: lblMin,
          data: dataMin,
        }
      ],
    },
  };
  return config;
}

// 17/11/2023, 21:00:53
let cargarValoresActuales = (horas,temperatura,precipitaciones) => {
  let indice = horas.indexOf(obtenerHoraFormateada());
  document.getElementById("precipitacionValue").innerHTML = precipitaciones[indice].toString()+"%";
  document.getElementById("temperaturaValue").innerHTML = Math.round(temperatura[indice]).toString()+"°C";
}

let obtenerHoraFormateada = () =>{
  let fechaHora = new Date().toLocaleString().split(",");
  let ddmmaa = fechaHora[0].split("/");
  let hora = fechaHora[1].trim().split(":");
  let horaABuscar= ddmmaa[2]+"-"+ddmmaa[1]+"-"+ddmmaa[0]+"T"+hora[0]+":00";
  console.log(horaABuscar);
  return horaABuscar;
}
let cargarOpenMeteo = () => {
  //URL que responde con la respuesta a cargar
  let URL =
    "https://api.open-meteo.com/v1/forecast?latitude=-2.1962&longitude=-79.8862&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code&timezone=auto";

  fetch(URL)
    .then((responseText) => responseText.json())
    .then((responseJSON) => {

      let plotRef = document.getElementById("plot1");
      let plotRef2 = document.getElementById("plot2");

    
      let horas = responseJSON.hourly.time;
      let temperatura = responseJSON.hourly.temperature_2m;
      let precipitaciones = responseJSON.hourly.precipitation_probability;

      let dias = [];
      let tempsMin = [];
      let tempsMax = [];
      let precipitacionMax = [];

      cargarValoresActuales(horas,temperatura,precipitaciones);

      for (let i = 0; i <= 6; i++) {
        dias.push(horas[0+(24*i)].split("T")[0]);
        let tempxDiaAscendente = temperatura.slice(0+(24*i),24+(24*i)).sort();
        let precipitacionesxDiaAscendente = precipitaciones.slice(0+(24*i),24+(24*i)).sort();
        tempsMin.push(tempxDiaAscendente[0]);
        tempsMax.push(tempxDiaAscendente[23]);
        precipitacionMax.push(precipitacionesxDiaAscendente[23]);
      }

      const temperaturasMaximas = tempsMax.map(temp => parseFloat(temp));
      const temperaturasMinimas = tempsMin.map(temp => parseFloat(temp));
      let config = crearConfigMaxMin("line", dias, "Temperatura Máxima", temperaturasMaximas,"Temperatura Mínima",temperaturasMinimas);
      let config2 = crearConfig("bar", dias, "Probabilidad de precipitación %", precipitacionMax);

      let chart1 = new Chart(plotRef, config);
      let chart2 = new Chart(plotRef2, config2);
    })
    .catch(console.error);
};

let parseXML = (responseText) => {
  // Parsing XML
  const parser = new DOMParser();
  const xml = parser.parseFromString(responseText, "application/xml");
  return xml;
};

let renderizarPlantilla = (xml) =>{
  // Referencia al elemento `#forecastbody` del documento HTML
  let forecastElement = document.querySelector("#forecastbody");
  forecastElement.innerHTML = "";

  // Procesamiento de los elementos con etiqueta `<time>` del objeto xml
  let timeArr = xml.querySelectorAll("time");
  timeArr.forEach((time) => {
    let template = procesarTimeConPlantilla(time);
    //Renderizando la plantilla en el elemento HTML
    forecastElement.innerHTML += template;
  });
}

let procesarTimeConPlantilla = (time) => {
  let from = time.getAttribute("from").replace("T", " ");
  let humidity = time.querySelector("humidity").getAttribute("value");
  let windSpeed = time.querySelector("windSpeed").getAttribute("mps");
  let precipitation = time.querySelector("precipitation").getAttribute("probability");
  let pressure = time.querySelector("pressure").getAttribute("value");
  let cloud = time.querySelector("clouds").getAttribute("all");
  return llenarPlantilla(from, humidity, windSpeed, precipitation, pressure, cloud);
}

let llenarPlantilla = (from, humidity, windSpeed, precipitation, pressure, cloud) => {
  let template = `
  <tr>
      <td>${from}</td>
      <td>${humidity}</td>
      <td>${windSpeed}</td>
      <td>${precipitation}</td>
      <td>${pressure}</td>
      <td>${cloud}</td>
  </tr>
  `;
  return template;
}

//Callback
let selectListener = async (event) => {
  let selectedCity = event.target.value;
  // Lea la entrada de almacenamiento local
  let cityStorage = localStorage.getItem(selectedCity);

  if (cityStorage == null) {
    cargarInfoApi(selectedCity);
  } else {

    // Procese un valor previo
    renderizarPlantilla(parseXML(cityStorage));
  }
  console.log(selectedCity);
};

let cargarInfoApi = async (selectedCity) => {
  try {
    //API key
    let APIkey = "44457df64ddd105950bfee6608efb1d2";
    let url = `https://api.openweathermap.org/data/2.5/forecast?q=${selectedCity}&mode=xml&appid=${APIkey}`;

    let response = await fetch(url);
    let responseText = await response.text();

    await renderizarPlantilla(parseXML(responseText));
    // Guarde la entrada de almacenamiento local
    await localStorage.setItem(selectedCity, responseText);
  } catch (error) {

  }
};

let loadForecastByCity = () => {
  //Handling event
  let selectElement = document.querySelector("select");
  selectElement.addEventListener("change", selectListener);
};


let loadExternalTable = async () => {
  //Requerimiento asíncrono
  let proxyURL = 'https://cors-anywhere.herokuapp.com/'
  let endpoint = proxyURL + 'https://www.gestionderiesgos.gob.ec/monitoreo-de-inundaciones/'
  let response = await fetch(endpoint);
  let responseText = await response.text();
  let parser = new DOMParser();
  let doc = parser.parseFromString(responseText, 'text/html');
  let table = doc.querySelector('#postcontent table');
  let monitoreo = document.getElementById('monitoreo');
  monitoreo.innerHTML = table.outerHTML
};

//cargarFechaActual();
//cargarPrecipitacion();
cargarOpenMeteo();
loadForecastByCity();
loadExternalTable();
obtenerHoraLocal();
