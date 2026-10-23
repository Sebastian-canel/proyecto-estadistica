var clasesGlobales = [];
var totalDatosGlobal = 0;
var chartInstances = {};
var listaDatosGlobales = [];

// 1. Función para cambiar de pestaña y manejar los historiales separados
function cambiarPestana(tipo, elementoBtn) {
    var tabTabla = document.getElementById('tabTabla'); 
    var tabGraficas = document.getElementById('tabGraficas'); 
    var tabHistorial = document.getElementById('historial');
    var bloqueTarjetas = document.getElementById('bloque-historial-desplegable');

    if (tipo === 'tarjetas') {
        if (bloqueTarjetas) {
            bloqueTarjetas.style.display = (bloqueTarjetas.style.display === 'block') ? 'none' : 'block';
        }
        return;
    }

    if (elementoBtn && elementoBtn.classList) {
        var buttons = document.getElementsByClassName('tab-btn');
        for (var j = 0; j < buttons.length; j++) {
            buttons[j].classList.remove('active');
        }
        elementoBtn.classList.add('active');
    }

    if (tabTabla) tabTabla.classList.remove('active');
    if (tabGraficas) tabGraficas.classList.remove('active');
    if (tabHistorial) tabHistorial.classList.remove('active');

    if (tipo === 'tabTabla' && tabTabla) {
        tabTabla.classList.add('active');
    } 
    else if (tipo === 'tabGraficas' && tabGraficas) {
        tabGraficas.classList.add('active');
    } 
    else if (tipo === 'historial' && tabHistorial) {
        tabHistorial.classList.add('active');
        if (typeof cargarHistorialTabla === 'function') {
            cargarHistorialTabla();
        }
    }
}

// 2. Cargar historial de tarjetas con los 3 botones bien estilizados (Editar en Verde, Cargar en Azul)
function cargarHistorial() {
    fetch('http://localhost:5000/api/historial')
        .then(response => response.json())
        .then(registros => {
            var contenedor = document.getElementById('lista-historial');
            if (!contenedor) return;
            
            if (!registros || registros.length === 0) {
                contenedor.innerHTML = '<p style="color: #666; font-size: 14px;">No hay ejercicios guardados todavía.</p>';
                return;
            }

            let html = '<ul style="list-style-type: none; padding: 0;">';
            registros.forEach(row => {
               html += `
                <li style="background: white; margin-bottom: 12px; padding: 12px; border-radius: 6px; border-left: 4px solid #007bff; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="margin-bottom: 10px;">
                        <strong>Nombre:</strong> ${row.nombre || 'Sin nombre'} <br>
                        <strong>Fecha:</strong> ${new Date(row.fecha).toLocaleString()} <br>
                        <strong>Datos:</strong> ${row.datos_ingresados} <br>
                        <strong>Total de datos:</strong> ${row.total_datos}
                    </div>
                    
                    <!-- Fila de botones uniformes (Editar Verde, Eliminar Rojo, Cargar Azul) -->
                    <div style="display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid #f1f5f9; padding-top: 8px;">
                        <button onclick="editarEjercicio(${row.id}, '${row.nombre || ''}', '${row.datos_ingresados}', event)" style="background-color: #22c55e; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">✏️ Editar</button>
                        <button onclick="eliminarEjercicio(${row.id}, event)" style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">🗑️ Eliminar</button>
                        <button onclick="cargarEjercicioSeleccionado('${row.datos_ingresados}')" style="background-color: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">📂 Cargar análisis</button>
                    </div>
                </li>
               `;
            });
            html += '</ul>';
            contenedor.innerHTML = html;
        })
        .catch(error => {
            console.error('Error al cargar el historial:', error);
        });
}

window.addEventListener('DOMContentLoaded', () => {
    cargarHistorial();
});

// 3. Función para ELIMINAR conectado a la base de datos
function eliminarEjercicio(id, event) {
    if (event) event.stopPropagation();

    if (!confirm("¿Estás seguro de que deseas eliminar este ejercicio de la base de datos?")) {
        return;
    }

    fetch(`http://localhost:5000/api/historial/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        console.log("Registro eliminado:", data);
        cargarHistorial();
        if (typeof cargarHistorialTabla === 'function') cargarHistorialTabla();
    })
    .catch(error => {
        console.error('Error al eliminar:', error);
        alert("No se pudo conectar con el servidor para eliminar el registro.");
    });
}

// 4. Función para EDITAR conectado a la base de datos
function editarEjercicio(id, nombreActual, datosActuales, event) {
    if (event) event.stopPropagation();

    var nuevoNombre = prompt("Modificar Nombre del Ejercicio:", nombreActual);
    if (nuevoNombre === null) return; 

    var nuevosDatos = prompt("Modificar Datos (separados por comas o espacios):", datosActuales);
    if (nuevosDatos === null) return; 

    var arregloTexto = nuevosDatos.split(/[\s,]+/);
    var listaDatos = [];
    for (var i = 0; i < arregloTexto.length; i++) {
        var num = parseFloat(arregloTexto[i]);
        if (!isNaN(num)) listaDatos.push(num);
    }

    if (listaDatos.length === 0) {
        alert("Los datos ingresados no son válidos.");
        return;
    }

    fetch(`http://localhost:5000/api/historial/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre.trim() || "Sin nombre", datos: listaDatos })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Registro actualizado:", data);
        cargarHistorial();
        if (typeof cargarHistorialTabla === 'function') cargarHistorialTabla();
    })
    .catch(error => {
        console.error('Error al actualizar:', error);
        alert("No se pudo conectar con el servidor para actualizar el registro.");
    });
}

// 5. Botón procesar y guardar análisis
function procesarYGuardarAnalisis() {
    var nombreEjercicio = document.getElementById('nombreEjercicio').value.trim() || "Sin nombre";
    var textoEntrada = document.getElementById('inputDatos').value;
    var arregloTexto = textoEntrada.split(/[\s,]+/);
    var listaDatos = [];

    for (var i = 0; i < arregloTexto.length; i++) {
        var num = parseFloat(arregloTexto[i]);
        if (!isNaN(num)) {
            listaDatos.push(num);
        }
    }

    if (listaDatos.length === 0) {
        alert("Por favor ingrese al menos un conjunto de datos válidos.");
        return;
    }

    listaDatos.sort(function(a, b) { return a - b; });
    listaDatosGlobales = listaDatos;

    fetch('http://localhost:5000/api/estadistica/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreEjercicio, datos: listaDatos })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Datos guardados:", data);
        cargarHistorial(); 
    })
    .catch(error => {
        console.error("Error al guardar:", error);
    });

    ejecutarCalculosEstadisticos(listaDatos);
}

// 6. Botón reiniciar
function reiniciarAnalisis() {
    document.getElementById('nombreEjercicio').value = '';
    document.getElementById('inputDatos').value = '';
    document.getElementById('vistaDatosOrdenados').style.display = 'none';
    document.getElementById('seccionPestañas').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 7. Cálculos Estadísticos y Gráficas
function ejecutarCalculosEstadisticos(listaDatos) {
    document.getElementById('listaOrdenadaTexto').innerText = listaDatos.join(', ');
    document.getElementById('vistaDatosOrdenados').style.display = 'block';

    var totalDatos = listaDatos.length;
    totalDatosGlobal = totalDatos;
    var valorMin = listaDatos[0];
    var valorMax = listaDatos[totalDatos - 1];
    var rango = valorMax - valorMin;
    var rangoMedio = (valorMax + valorMin) / 2;

    var kCalculado = 1 + (3.322 * Math.log10(totalDatos));
    var k = Math.round(kCalculado); 
    var amplitud = Math.ceil(rango / kCalculado); 

    var cuerpoHTML = "";
    var limiteInferiorActual = valorMin;
    var faAcumulada = 0;
    var sumaFXm = 0;
    var sumaFr = 0;
    var sumaFs = 0;
    clasesGlobales = [];

    var arrayXm = [];
    var arrayF = [];
    var arrayFs = [];
    var arrayFr = [];

    for (var idx = 0; idx < k; idx++) {
        var ii = limiteInferiorActual;
        var is = ii + amplitud - 1;
        
        var f = 0;
        for (var d = 0; d < totalDatos; d++) {
            if (idx === k - 1) {
                if (listaDatos[d] >= ii && listaDatos[d] <= is + 1) f++;
            } else {
                if (listaDatos[d] >= ii && listaDatos[d] <= is) f++;
            }
        }

        faAcumulada += f;
        var fr = (f / totalDatos) * 100;
        sumaFr += fr;

        var xm = (ii + is) / 2;
        var Li = ii - 0.5;
        var Ls = is + 0.5;
        var fXm = f * xm;
        sumaFXm += fXm;

        var fs = (fr * 0.15) + (f * 0.85); 
        sumaFs += fs;

        arrayXm.push(xm);
        arrayF.push(f);
        arrayFs.push(parseFloat(fs.toFixed(2)));
        arrayFr.push(parseFloat(fr.toFixed(2)));

        clasesGlobales.push({ ii: ii, is: is, f: f, fa: faAcumulada, xm: xm, Li: Li, Ls: Ls, A: amplitud });

        cuerpoHTML += "<tr><td>" + ii + "</td><td>" + is + "</td><td>" + f + "</td><td>" + faAcumulada + "</td><td>" + fr.toFixed(2) + "%</td><td>" + fs.toFixed(2) + "</td><td>" + xm + "</td><td>" + Li.toFixed(1) + "</td><td>" + Ls.toFixed(1) + "</td><td>" + fXm + "</td></tr>";
        limiteInferiorActual = is + 1;
    }

    document.getElementById('cuerpoTabla').innerHTML = cuerpoHTML;
    var pieHTML = "<tr><td colspan='2'>TOTALES</td><td>" + totalDatos + "</td><td>-</td><td>" + Math.round(sumaFr) + "%</td><td>" + sumaFs.toFixed(0) + "</td><td>-</td><td>-</td><td>-</td><td>" + sumaFXm + "</td></tr>";
    document.getElementById('pieTabla').innerHTML = pieHTML;

    var mediaAgrupada = sumaFXm / totalDatos;
    var posicionMediana = totalDatos / 2;
    var medianaAgrupada = calcularCuantilGenerico(posicionMediana);

    var maxF = -1;
    var idxModal = 0;
    for (var m = 0; m < clasesGlobales.length; m++) {
        if (clasesGlobales[m].f > maxF) {
            maxF = clasesGlobales[m].f;
            idxModal = m;
        }
    }

    var cModal = clasesGlobales[idxModal];
    var fModal = cModal.f;
    var fAnt = idxModal > 0 ? clasesGlobales[idxModal - 1].f : 0;
    var fSig = idxModal < clasesGlobales.length - 1 ? clasesGlobales[idxModal + 1].f : 0;
    var d1 = fModal - fAnt;
    var d2 = fModal - fSig;
    
    var modaAgrupada = cModal.Li;
    if ((d1 + d2) !== 0) {
        modaAgrupada = cModal.Li + (d1 / (d1 + d2)) * cModal.A;
    }

    var sumaCuadrados = 0;
    for (var v = 0; v < clasesGlobales.length; v++) {
        var diff = clasesGlobales[v].xm - mediaAgrupada;
        sumaCuadrados += clasesGlobales[v].f * (diff * diff);
    }

    var varianza = totalDatos > 1 ? (sumaCuadrados / (totalDatos - 1)) : 0;
    var desviacionEstandar = Math.sqrt(varianza);
    var coeficienteVariacion = mediaAgrupada !== 0 ? (desviacionEstandar / mediaAgrupada) * 100 : 0;

    var q1 = calcularCuantilGenerico(totalDatos * 0.25);
    var q3 = calcularCuantilGenerico(totalDatos * 0.75);

    document.getElementById('valN').innerText = totalDatos;
    document.getElementById('valMin').innerText = valorMin;
    document.getElementById('valMax').innerText = valorMax;
    document.getElementById('valRango').innerText = rango;
    document.getElementById('valRangoMedio').innerText = rangoMedio.toFixed(2);
    document.getElementById('valK').innerText = k + " (" + kCalculado.toFixed(2) + ")";
    document.getElementById('valA').innerText = amplitud;

    document.getElementById('valMedia').innerText = mediaAgrupada.toFixed(2);
    document.getElementById('valMediana').innerText = medianaAgrupada.toFixed(2);
    document.getElementById('valModa').innerText = modaAgrupada.toFixed(2);

    document.getElementById('valVarianza').innerText = varianza.toFixed(2);
    document.getElementById('valDesviacion').innerText = desviacionEstandar.toFixed(2);
    document.getElementById('valCV').innerText = coeficienteVariacion.toFixed(2) + "%";

    calcularCuantiles();
    renderizarGraficas(arrayXm, arrayF, arrayFs, arrayFr, valorMin, q1, medianaAgrupada, q3, valorMax);

    document.getElementById('seccionPestañas').style.display = 'block';
    cambiarPestana('tabTabla', document.querySelector('.nav-tabs button'));
}

function calcularCuantilGenerico(posicion) {
    var idxClase = 0;
    for (var i = 0; i < clasesGlobales.length; i++) {
        if (clasesGlobales[i].fa >= posicion) {
            idxClase = i;
            break;
        }
    }
    var clase = clasesGlobales[idxClase];
    var faAnterior = idxClase > 0 ? clasesGlobales[idxClase - 1].fa : 0;
    var fi = clase.f;
    if (fi === 0) return clase.Li;
    return clase.Li + ((posicion - faAnterior) / fi) * clase.A;
}

function calcularCuantiles() {
    if (totalDatosGlobal === 0 || clasesGlobales.length === 0) return;
    var kQ = parseInt(document.getElementById('inputQ').value) || 1;
    var kD = parseInt(document.getElementById('inputD').value) || 5;
    var kP = parseInt(document.getElementById('inputP').value) || 50;

    var valQ = calcularCuantilGenerico((kQ * totalDatosGlobal) / 4);
    var valD = calcularCuantilGenerico((kD * totalDatosGlobal) / 10);
    var valP = calcularCuantilGenerico((kP * totalDatosGlobal) / 100);

    document.getElementById('valCuartil').innerText = "Q" + kQ + " = " + valQ.toFixed(2);
    document.getElementById('valDecil').innerText = "D" + kD + " = " + valD.toFixed(2);
    document.getElementById('valPercentil').innerText = "P" + kP + " = " + valP.toFixed(2);
}

function renderizarGraficas(labelsXm, arrayF, arrayFs, arrayFr, min, q1, mediana, q3, max) {
    if (chartInstances.c1) chartInstances.c1.destroy();
    if (chartInstances.c2) chartInstances.c2.destroy();
    if (chartInstances.c3) chartInstances.c3.destroy();

    chartInstances.c1 = new Chart(document.getElementById('chart1'), {
        type: 'bar',
        data: { labels: labelsXm, datasets: [{ type: 'line', label: 'Polígono (f)', data: arrayF, borderColor: '#e53e3e', borderWidth: 2, fill: false }, { type: 'bar', label: 'Histograma (f)', data: arrayF, backgroundColor: '#319795' }] },
        options: { responsive: true }
    });

    chartInstances.c2 = new Chart(document.getElementById('chart2'), {
        type: 'line',
        data: { labels: labelsXm, datasets: [{ label: 'Frecuencia (f)', data: arrayF, borderColor: '#2b6cb0', borderWidth: 2, fill: false }, { label: 'Suavizado (fs)', data: arrayFs, borderColor: '#dd6b20', borderWidth: 2, fill: false }] },
        options: { responsive: true }
    });

    chartInstances.c3 = new Chart(document.getElementById('chart3'), {
        type: 'bar',
        data: { labels: labelsXm, datasets: [{ type: 'line', label: 'Tendencia Porcentual', data: arrayFr, borderColor: '#2b6cb0', borderDash: [5, 5], fill: false }, { type: 'bar', label: 'Frecuencia Relativa (%)', data: arrayFr, backgroundColor: '#48bb78' }] },
        options: { responsive: true }
    });

    dibujarBoxPlotSVG(min, q1, mediana, q3, max);
}

function dibujarBoxPlotSVG(min, q1, me, q3, max) {
    var svgContainer = document.getElementById('boxPlotSvg');
    var width = 360, height = 220;
    var rangoTotal = max - min || 1;
    function getY(val) {
        return height - 30 - (((val - min) / rangoTotal) * (height - 60));
    }
    var yMin = getY(min), yQ1 = getY(q1), yMe = getY(me), yQ3 = getY(q3), yMax = getY(max);
    var xCenter = 180, boxWidth = 90;

    svgContainer.innerHTML = `
        <svg width="${width}" height="${height}" style="background:#f7fafc; border-radius:6px;">
            <line x1="${xCenter}" y1="${yMin}" x2="${xCenter}" y2="${yQ1}" stroke="#2b6cb0" stroke-width="2" />
            <line x1="${xCenter - 20}" y1="${yMin}" x2="${xCenter + 20}" y2="${yMin}" stroke="#2b6cb0" stroke-width="2" />
            <text x="${xCenter + 30}" y="${yMin + 4}" font-size="11" fill="#4a5568">Mín: ${min}</text>
            <rect x="${xCenter - (boxWidth/2)}" y="${yQ3}" width="${boxWidth}" height="${yQ1 - yQ3}" fill="#63b3ed" stroke="#2b6cb0" stroke-width="2" />
            <text x="${xCenter + (boxWidth/2) + 10}" y="${yQ1 + 4}" font-size="11" fill="#4a5568">Q1: ${q1.toFixed(2)}</text>
            <text x="${xCenter + (boxWidth/2) + 10}" y="${yQ3 + 4}" font-size="11" fill="#4a5568">Q3: ${q3.toFixed(2)}</text>
            <line x1="${xCenter - (boxWidth/2)}" y1="${yMe}" x2="${xCenter + (boxWidth/2)}" y2="${yMe}" stroke="#c53030" stroke-width="3" />
            <text x="${xCenter - (boxWidth/2) - 65}" y="${yMe + 4}" font-size="11" fill="#c53030" font-weight="bold">Me: ${me.toFixed(2)}</text>
            <line x1="${xCenter}" y1="${yQ3}" x2="${xCenter}" y2="${yMax}" stroke="#2b6cb0" stroke-width="2" />
            <line x1="${xCenter - 20}" y1="${yMax}" x2="${xCenter + 20}" y2="${yMax}" stroke="#2b6cb0" stroke-width="2" />
            <text x="${xCenter + 30}" y="${yMax + 4}" font-size="11" fill="#4a5568">Máx: ${max}</text>
        </svg>
    `;
}

function toggleChat() {
    var chatBox = document.getElementById('chat-box');
    if (chatBox) {
        chatBox.style.display = (chatBox.style.display === 'none' || chatBox.style.display === '') ? 'flex' : 'none';
    }
}

function enviarPreguntaIA(e) {
    e.preventDefault();
    var inputEl = document.getElementById('chat-input');
    var pregunta = inputEl.value.trim();
    if (!pregunta) return;
    var messagesContainer = document.getElementById('chat-messages');

    messagesContainer.innerHTML += `<div style="background-color: #2563eb; color: white; padding: 8px 12px; border-radius: 8px; max-width: 85%; align-self: flex-end; font-size: 14px; margin-bottom: 8px;">${pregunta}</div>`;
    inputEl.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    fetch('http://localhost:5000/api/estadistica/analizar-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultadosEstadísticos: listaDatosGlobales, pregunta: pregunta })
    })
    .then(response => response.json())
    .then(data => {
        var textoRespuesta = data.analisis || data.respuesta || JSON.stringify(data);
        messagesContainer.innerHTML += `<div style="background-color: #e5e7eb; padding: 8px 12px; border-radius: 8px; max-width: 85%; align-self: flex-start; font-size: 14px; color: #1f2937; margin-bottom: 8px;">${textoRespuesta}</div>`;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    })
    .catch(() => {
        messagesContainer.innerHTML += `<div style="background-color: #fee2e2; color: #991b1b; padding: 8px 12px; border-radius: 8px; max-width: 85%; align-self: flex-start; font-size: 14px; margin-bottom: 8px;">Error al conectar con la IA.</div>`;
    });
}

function cargarEjercicioSeleccionado(datosTexto) {
    const inputDatos = document.getElementById('inputDatos');
    if (inputDatos) {
        inputDatos.value = datosTexto;
        const botones = document.querySelectorAll('button');
        botones.forEach(btn => {
            if (btn.textContent.includes('Procesar')) {
                btn.click();
            }
        });
    }
}

async function cargarHistorialTabla() {
    try {
        const respuesta = await fetch('http://localhost:5000/api/historial');
        const registros = await respuesta.json();
        const tbody = document.getElementById('tablaHistorialBody');
        if (!tbody) return;

        if (registros.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 15px; color: #666;">No hay ejercicios guardados.</td></tr>';
            return;
        }

        let html = '';
        registros.forEach(row => {
            html += `
                <tr style="cursor: pointer;">
                    <td onclick="cargarEjercicioSeleccionado('${row.datos_ingresados}')" style="padding: 8px; text-align: center;">${row.id}</td>
                    <td onclick="cargarEjercicioSeleccionado('${row.datos_ingresados}')" style="padding: 8px; font-weight: bold; color: #2563eb;">${row.nombre || 'Sin nombre'}</td>
                    <td onclick="cargarEjercicioSeleccionado('${row.datos_ingresados}')" style="padding: 8px;">${row.datos_ingresados}</td>
                    <td onclick="cargarEjercicioSeleccionado('${row.datos_ingresados}')" style="padding: 8px; text-align: center;">${row.total_datos}</td>
                    <td onclick="cargarEjercicioSeleccionado('${row.datos_ingresados}')" style="padding: 8px; text-align: center;">${new Date(row.fecha).toLocaleString()}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar el historial en la tabla:', error);
    }
}

function filtrarTablaHistorial() {
    var input = document.getElementById('inputBusquedaTabla');
    var filtro = input.value.toLowerCase();
    var tbody = document.getElementById('tablaHistorialBody');
    var filas = tbody.getElementsByTagName('tr');

    for (var i = 0; i < filas.length; i++) {
        var fila = filas[i];
        var textoFila = fila.textContent || fila.innerText;
        
        if (textoFila.toLowerCase().indexOf(filtro) > -1) {
            fila.style.display = ""; // Muestra la fila si coincide con la búsqueda
        } else {
            fila.style.display = "none"; // Oculta la fila si no coincide
        }
    }
}

// 1. FUNCIÓN DE EXCEL 
// ==========================================
function exportarAExcel() {
    var elemento = document.getElementById("tabTabla");
    if (!elemento || elemento.innerHTML.trim() === "") {
        alert("No hay datos para exportar a Excel.");
        return;
    }

    function getVal(ids) {
        for (var i = 0; i < ids.length; i++) {
            var el = document.getElementById(ids[i]) || elemento.querySelector("." + ids[i]) || elemento.querySelector("#" + ids[i]);
            if (el && el.innerText.trim() !== "") {
                return el.innerText.trim();
            }
        }
        return "-";
    }

    var valN = getVal(["valN", "n", "totalN"]);
    var valMin = getVal(["valMin", "xmin", "minimo"]);
    var valMax = getVal(["valMax", "xmax", "maximo"]);
    var valRango = getVal(["valRango", "rango"]);
    var valRangoMedio = getVal(["valRangoMedio", "rangomedio"]);
    var valK = getVal(["valK", "intervalos"]);
    var valA = getVal(["valA", "amplitud"]);

    var valMedia = getVal(["valMedia", "media", "mean"]);
    var valMediana = getVal(["valMediana", "mediana", "median"]);
    var valModa = getVal(["valModa", "moda", "mode"]);

    var valVarianza = getVal(["valVarianza", "varianza", "variance"]);
    var valDesviacion = getVal(["valDesviacion", "desviacion", "std"]);
    var valCV = getVal(["valCV", "cv", "coeficiente"]);

    var valQ = getVal(["valQ", "valCuartil", "cuartil", "q1"]);
    var valD = getVal(["valD", "valDecil", "decil", "d5"]);
    var valP = getVal(["valP", "valPercentil", "percentil", "p50"]);

    // Tomamos la tabla de frecuencias original tal cual
    var tablaFrecuencias = elemento.querySelector("table");
    var htmlTablaFrecuencias = tablaFrecuencias ? tablaFrecuencias.outerHTML : "";

    var contenidoExcel = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; }
                h2 { color: #1f4e78; font-size: 13pt; margin-top: 25px; border-bottom: 2px solid #1f4e78; padding-bottom: 4px; }
                table { border-collapse: collapse; margin-bottom: 15px; width: 100%; }
                th, td { border: 1px solid #1f4e78; padding: 6px 10px; text-align: center; font-size: 11pt; }
                th { background-color: #1f4e78; color: white; font-weight: bold; }
                .label { font-weight: bold; background-color: #f2f5f9; color: #333; text-align: left; width: 40%; }
            </style>
        </head>
        <body>
            <h1 style="text-align: center; color: #1f4e78;">Reporte de Análisis Estadístico Completo</h1>

            <h2>1. Generalidades y Regla de Sturges</h2>
            <table>
                <tr><td class="label">Total de datos (n)</td><td>${valN}</td></tr>
                <tr><td class="label">Valor Mínimo (Xmín)</td><td>${valMin}</td></tr>
                <tr><td class="label">Valor Máximo (Xmáx)</td><td>${valMax}</td></tr>
                <tr><td class="label">Rango (R)</td><td>${valRango}</td></tr>
                <tr><td class="label">Rango Medio</td><td>${valRangoMedio}</td></tr>
                <tr><td class="label">Intervalos (k)</td><td>${valK}</td></tr>
                <tr><td class="label">Amplitud (A)</td><td>${valA}</td></tr>
            </table>

            <h2>2. Tabla de Frecuencias Agrupada</h2>
            ${htmlTablaFrecuencias}

            <h2>3. Medidas de Tendencia Central</h2>
            <table>
                <tr><td class="label">Media (x̄)</td><td>${valMedia}</td></tr>
                <tr><td class="label">Mediana (Me)</td><td>${valMediana}</td></tr>
                <tr><td class="label">Moda (Mo)</td><td>${valModa}</td></tr>
            </table>

            <h2>4. Medidas de Dispersión</h2>
            <table>
                <tr><td class="label">Varianza Muestral (s²)</td><td>${valVarianza}</td></tr>
                <tr><td class="label">Desviación Estándar (s)</td><td>${valDesviacion}</td></tr>
                <tr><td class="label">Coeficiente de Variación (CV)</td><td>${valCV}</td></tr>
            </table>

            <h2>5. Medidas de Posición (Cuantiles)</h2>
            <table>
                <tr><td class="label">Cuartil Calculado</td><td>${valQ}</td></tr>
                <tr><td class="label">Decil Calculado</td><td>${valD}</td></tr>
                <tr><td class="label">Percentil Calculado</td><td>${valP}</td></tr>
            </table>

        </body>
        </html>
    `;

    var blob = new Blob(['\ufeff' + contenidoExcel], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Reporte_Estadistico_Completo.xls";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// 2. FUNCIÓN DE PDF 
// ==========================================
function exportarAPDF() {
    var elemento = document.getElementById("tabTabla");
    if (!elemento || elemento.innerHTML.trim() === "") {
        alert("No hay datos en el reporte para exportar.");
        return;
    }

    var ventana = window.open('', '_blank', 'width=900,height=700');
    ventana.document.write(`
        <html>
        <head>
            <title>Reporte Estadístico</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                h2, h3 { color: #1f4e78; border-bottom: 2px solid #1f4e78; padding-bottom: 5px; margin-top: 20px; }
                table { border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 20px; }
                th, td { border: 1px solid #333; padding: 8px; text-align: center; }
                th { background-color: #f2f2f2; }
                .box-container { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; }
                .box { border: 1px solid #1f4e78; padding: 10px; border-radius: 5px; min-width: 120px; background: #f9f9f9; }
                .box span { font-weight: bold; display: block; font-size: 12px; }
                .box p { margin: 5px 0 0 0; font-size: 14px; }
            </style>
        </head>
        <body>
            ${elemento.innerHTML}
        </body>
        </html>
    `);
    ventana.document.close();
    ventana.focus();
    setTimeout(function() {
        ventana.print();
        ventana.close();
    }, 250);
}

// Función para guardar un nuevo cálculo en el historial persistente
function guardarEnHistorial(nombreEjercicio, totalDatos) {
    let historial = JSON.parse(localStorage.getItem('historial_estadistica')) || [];
    
    let nuevoRegistro = {
        id: historial.length + 1,
        nombre: nombreEjercicio || "Análisis Estadístico",
        total: totalDatos,
        fecha: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
    };
    
    historial.unshift(nuevoRegistro); // Lo agrega al inicio
    localStorage.setItem('historial_estadistica', JSON.stringify(historial));
    cargarHistorialEnTabla();
}

// Función para cargar los datos en tu tabla <tbody id="tablaHistorialBody">
function cargarHistorialEnTabla() {
    let tbody = document.getElementById('tablaHistorialBody');
    if (!tbody) return;
    
    let historial = JSON.parse(localStorage.getItem('historial_estadistica')) || [];
    
    if (historial.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 15px; color: #666;">No hay ejercicios guardados todavía. ¡Procesa uno nuevo!</td></tr>`;
        return;
    }
    
    tbody.innerHTML = '';
    historial.forEach(item => {
        let fila = `<tr>
            <td style="padding: 8px;">${item.id}</td>
            <td style="padding: 8px;">${item.nombre}</td>
            <td style="padding: 8px;">${item.total}</td>
            <td style="padding: 8px;">${item.fecha}</td>
        </tr>`;
        tbody.innerHTML += fila;
    });
}

// Cargar el historial automáticamente al abrir la página
window.onload = function() {
    cargarHistorialEnTabla();
};