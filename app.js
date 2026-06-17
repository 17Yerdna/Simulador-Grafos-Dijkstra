const canvas = document.getElementById("canvasGrafo");
const ctx = canvas.getContext("2d");

const btnModoNodo = document.getElementById("btnModoNodo");
const btnModoSeleccionar = document.getElementById("btnModoSeleccionar");
const btnAgregarArco = document.getElementById("btnAgregarArco");
const btnCalcular = document.getElementById("btnCalcular");
const btnLimpiar = document.getElementById("btnLimpiar");
const btnEliminarNodo = document.getElementById("btnEliminarNodo");
const btnCargarPrueba = document.getElementById("btnCargarPrueba");

const txtOrigen = document.getElementById("txtOrigen");
const txtDestino = document.getElementById("txtDestino");
const txtPeso = document.getElementById("txtPeso");
const txtEliminarNodo = document.getElementById("txtEliminarNodo");
const cboAlgoritmo = document.getElementById("cboAlgoritmo");
const txtOrigenCamino = document.getElementById("txtOrigenCamino");
const txtDestinoCamino = document.getElementById("txtDestinoCamino");
const tablaResultados = document.getElementById("tablaResultados");
const tituloResultados = document.getElementById("tituloResultados");
const modoActual = document.getElementById("modoActual");
const ayudaCanvas = document.getElementById("ayudaCanvas");
const contenedorVisualizaciones = document.getElementById("contenedorVisualizaciones");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitulo = document.getElementById("modalTitulo");
const modalCuerpo = document.getElementById("modalCuerpo");
const modalPie = document.getElementById("modalPie");
const modalCerrar = document.getElementById("modalCerrar");

const RADIO_NODO = 24;
const INF = Number.POSITIVE_INFINITY;
const COLORES_CAMINOS = ["#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

let nodos = [];
let arcos = [];
let modo = "seleccionar";
let ultimoResultado = null;
let temporizadorRedimension = null;
let nodoArrastrado = null;
let desplazamiento = { x: 0, y: 0 };

function ajustarCanvas() {
  const rect = canvas.getBoundingClientRect();
  const escala = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * escala);
  canvas.height = Math.floor(rect.height * escala);
  ctx.setTransform(escala, 0, 0, escala, 0, 0);
  dibujarGrafo();
}

function cambiarModo(nuevoModo) {
  modo = nuevoModo;
  const agregando = modo === "agregarNodo";
  canvas.classList.toggle("add-node", agregando);
  modoActual.textContent = agregando ? "Modo: agregar nodo" : "Modo: seleccionar";
  ayudaCanvas.textContent = agregando
    ? "Haz clic en el área blanca para colocar un nuevo nodo."
    : "Arrastra para mover. Doble clic en un nodo o arco para editarlo.";
}

function mostrarMensaje(mensaje) {
  const anterior = document.querySelector(".toast");
  if (anterior) anterior.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = mensaje;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3200);
}

function obtenerPosicionCanvas(evento) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evento.clientX - rect.left,
    y: evento.clientY - rect.top
  };
}

function distancia(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function nodoEnPosicion(posicion) {
  for (let i = nodos.length - 1; i >= 0; i--) {
    if (distancia(nodos[i].posicion, posicion) <= RADIO_NODO) {
      return nodos[i];
    }
  }
  return null;
}

function existeNodo(id) {
  return nodos.some((nodo) => nodo.id === id);
}

function buscarNodo(id) {
  return nodos.find((nodo) => nodo.id === id);
}

function agregarNodo(posicion) {
  const ancho = canvas.getBoundingClientRect().width;
  const alto = canvas.getBoundingClientRect().height;

  if (
    posicion.x < RADIO_NODO ||
    posicion.y < RADIO_NODO ||
    posicion.x > ancho - RADIO_NODO ||
    posicion.y > alto - RADIO_NODO
  ) {
    mostrarMensaje("El nodo debe estar más alejado del borde.");
    return;
  }

  const demasiadoCerca = nodos.some((nodo) => distancia(nodo.posicion, posicion) < RADIO_NODO * 2);
  if (demasiadoCerca) {
    mostrarMensaje("El nodo está demasiado cerca de otro nodo.");
    return;
  }

  nodos.push({
    id: nodos.length + 1,
    posicion
  });

  ultimoResultado = null;
  limpiarTabla("Aún no hay resultados.");
  limpiarVisualizaciones("Calcule un algoritmo para generar los gráficos de caminos.");
  dibujarGrafo();
}

function eliminarNodo() {
  const idEliminar = Number(txtEliminarNodo.value);

  if (!Number.isInteger(idEliminar)) {
    mostrarMensaje("Ingrese el número del nodo que desea eliminar.");
    return;
  }

  if (!existeNodo(idEliminar)) {
    mostrarMensaje("El nodo indicado no existe.");
    return;
  }

  nodos = nodos.filter((nodo) => nodo.id !== idEliminar);
  arcos = arcos.filter((arco) => arco.origen !== idEliminar && arco.destino !== idEliminar);

  const mapaIds = new Map();
  nodos
    .sort((a, b) => a.id - b.id)
    .forEach((nodo, indice) => {
      const nuevoId = indice + 1;
      mapaIds.set(nodo.id, nuevoId);
      nodo.id = nuevoId;
    });

  arcos.forEach((arco) => {
    arco.origen = mapaIds.get(arco.origen);
    arco.destino = mapaIds.get(arco.destino);
  });

  txtEliminarNodo.value = "";
  ultimoResultado = null;
  limpiarTabla("Aún no hay resultados.");
  limpiarVisualizaciones("Calcule un algoritmo para generar los gráficos de caminos.");
  dibujarGrafo();
}

function agregarArco() {
  const origen = Number(txtOrigen.value);
  const destino = Number(txtDestino.value);
  const peso = Number(txtPeso.value);

  if (!Number.isInteger(origen) || !Number.isInteger(destino) || !Number.isInteger(peso)) {
    mostrarMensaje("Origen, destino y peso deben ser números enteros.");
    return;
  }

  if (peso <= 0) {
    mostrarMensaje("El peso debe ser positivo.");
    return;
  }

  if (!existeNodo(origen) || !existeNodo(destino)) {
    mostrarMensaje("Deben existir los nodos origen y destino.");
    return;
  }

  if (origen === destino) {
    mostrarMensaje("No se permiten arcos hacia el mismo nodo.");
    return;
  }

  const arcoExistente = arcos.find((arco) => arco.origen === origen && arco.destino === destino);
  if (arcoExistente) {
    arcoExistente.peso = peso;
  } else {
    arcos.push({ origen, destino, peso });
  }

  txtOrigen.value = "";
  txtDestino.value = "";
  txtPeso.value = "";
  ultimoResultado = null;
  limpiarTabla("Aún no hay resultados.");
  limpiarVisualizaciones("Calcule un algoritmo para generar los gráficos de caminos.");
  dibujarGrafo();
}

function dijkstra(nodoInicial) {
  const distancias = {};
  const anteriores = {};
  const visitados = new Set();

  nodos.forEach((nodo) => {
    distancias[nodo.id] = INF;
    anteriores[nodo.id] = null;
  });

  distancias[nodoInicial] = 0;

  while (visitados.size < nodos.length) {
    let actual = null;
    let menorDistancia = INF;

    nodos.forEach((nodo) => {
      if (!visitados.has(nodo.id) && distancias[nodo.id] < menorDistancia) {
        menorDistancia = distancias[nodo.id];
        actual = nodo.id;
      }
    });

    if (actual === null) break;

    visitados.add(actual);

    arcos
      .filter((arco) => arco.origen === actual)
      .forEach((arco) => {
        if (visitados.has(arco.destino)) return;

        const nuevaDistancia = distancias[actual] + arco.peso;
        if (nuevaDistancia < distancias[arco.destino]) {
          distancias[arco.destino] = nuevaDistancia;
          anteriores[arco.destino] = actual;
        }
      });
  }

  return { distancias, anteriores };
}

function floydWarshall() {
  const n = nodos.length;
  const distancias = {};
  const predecesores = {};

  nodos.forEach((nodo) => {
    distancias[nodo.id] = {};
    predecesores[nodo.id] = {};
    nodos.forEach((otro) => {
      if (nodo.id === otro.id) {
        distancias[nodo.id][otro.id] = 0;
        predecesores[nodo.id][otro.id] = null;
      } else {
        distancias[nodo.id][otro.id] = INF;
        predecesores[nodo.id][otro.id] = null;
      }
    });
  });

  arcos.forEach((arco) => {
    distancias[arco.origen][arco.destino] = arco.peso;
    predecesores[arco.origen][arco.destino] = arco.origen;
  });

  nodos.forEach((k) => {
    nodos.forEach((i) => {
      nodos.forEach((j) => {
        if (
          distancias[i.id][k.id] !== INF &&
          distancias[k.id][j.id] !== INF &&
          distancias[i.id][k.id] + distancias[k.id][j.id] < distancias[i.id][j.id]
        ) {
          distancias[i.id][j.id] = distancias[i.id][k.id] + distancias[k.id][j.id];
          predecesores[i.id][j.id] = predecesores[k.id][j.id];
        }
      });
    });
  });

  return { distancias, predecesores };
}

function reconstruirCaminoDijkstra(nodoInicial, destino, anteriores) {
  const camino = [];
  let actual = destino;

  while (actual !== null) {
    camino.push(actual);
    if (actual === nodoInicial) break;
    actual = anteriores[actual];
  }

  camino.reverse();
  return camino[0] === nodoInicial ? camino : null;
}

function reconstruirCaminoFloyd(nodoInicial, destino, predecesores) {
  const camino = [];
  let actual = destino;

  while (actual !== null) {
    camino.push(actual);
    if (actual === nodoInicial) break;
    actual = predecesores[nodoInicial][actual];
  }

  camino.reverse();
  return camino[0] === nodoInicial ? camino : null;
}

function enumerarCaminos(origen, destino) {
  const adjacency = {};
  nodos.forEach((n) => { adjacency[n.id] = []; });
  arcos.forEach((a) => {
    if (adjacency[a.origen]) {
      adjacency[a.origen].push({ destino: a.destino, peso: a.peso });
    }
  });

  const todos = [];
  const LIMITE = 200;

  function dfs(actual, visitados, caminoActual, pesoActual) {
    if (todos.length >= LIMITE) return;
    if (actual === destino) {
      todos.push({ camino: [...caminoActual], distancia: pesoActual });
      return;
    }
    const vecinos = adjacency[actual] || [];
    for (const v of vecinos) {
      if (visitados.has(v.destino)) continue;
      visitados.add(v.destino);
      caminoActual.push(v.destino);
      dfs(v.destino, visitados, caminoActual, pesoActual + v.peso);
      caminoActual.pop();
      visitados.delete(v.destino);
      if (todos.length >= LIMITE) return;
    }
  }

  dfs(origen, new Set([origen]), [origen], 0);
  return todos;
}

function calcularAlgoritmo() {
  if (nodos.length === 0) {
    mostrarMensaje("Agregue al menos un nodo.");
    return;
  }

  const origen = Number(txtOrigenCamino.value);
  const destino = Number(txtDestinoCamino.value);

  if (!Number.isInteger(origen) || !Number.isInteger(destino)) {
    mostrarMensaje("Origen y destino deben ser números enteros.");
    return;
  }

  if (origen === destino) {
    mostrarMensaje("El origen y el destino deben ser distintos.");
    return;
  }

  if (!existeNodo(origen) || !existeNodo(destino)) {
    mostrarMensaje("Los nodos origen y destino deben existir en el grafo.");
    return;
  }

  const algoritmo = cboAlgoritmo.value;
  const todosLosCaminos = enumerarCaminos(origen, destino);
  const nombreAlgoritmo = algoritmo === "dijkstra" ? "Dijkstra" : "Floyd-Warshall";

  tablaResultados.innerHTML = "";

  if (todosLosCaminos.length === 0) {
    mostrarMensaje(`No existe camino entre los nodos ${origen} e ${destino}.`);
    agregarFilaResultado(destino, "No alcanzable", "No alcanzable", false);
    tituloResultados.textContent = `Resultados ${nombreAlgoritmo}: nodo ${origen} → nodo ${destino}`;
    ultimoResultado = {
      nodoInicial: origen,
      nodoDestino: destino,
      caminosCalculados: [],
      algoritmo,
      coloresPorArco: new Map()
    };
    limpiarVisualizaciones("No hay caminos alcanzables para mostrar.");
    dibujarGrafo();
    return;
  }

  todosLosCaminos.sort((a, b) => a.distancia - b.distancia);
  const distanciaMinima = todosLosCaminos[0].distancia;
  const caminosCalculados = todosLosCaminos.map((c) => ({
    destino,
    distancia: c.distancia,
    camino: c.camino,
    esMinimo: c.distancia === distanciaMinima
  }));

  tituloResultados.textContent = `Resultados ${nombreAlgoritmo}: nodo ${origen} → nodo ${destino} (${caminosCalculados.length} camino${caminosCalculados.length === 1 ? "" : "s"})`;

  caminosCalculados.forEach((c) => {
    agregarFilaResultado(destino, c.distancia, c.camino.join(" → "), c.esMinimo);
  });

  const coloresPorArco = new Map();
  caminosCalculados.forEach((resultado, indice) => {
    const color = resultado.esMinimo
      ? "#f59e0b"
      : COLORES_CAMINOS[(indice + 2) % COLORES_CAMINOS.length];
    for (let i = 0; i < resultado.camino.length - 1; i++) {
      const clave = `${resultado.camino[i]}-${resultado.camino[i + 1]}`;
      if (!coloresPorArco.has(clave)) {
        coloresPorArco.set(clave, color);
      }
    }
  });

  ultimoResultado = {
    nodoInicial: origen,
    nodoDestino: destino,
    caminosCalculados,
    algoritmo,
    coloresPorArco
  };

  crearVisualizaciones(origen, destino, caminosCalculados, algoritmo);
  dibujarGrafo();
}

function agregarFilaResultado(destino, distancia, camino, esMinimo = false) {
  const fila = document.createElement("tr");
  if (esMinimo) fila.classList.add("fila-minimo");
  fila.innerHTML = `
    <td>${destino}</td>
    <td>${distancia}</td>
    <td>${camino}</td>
  `;
  tablaResultados.appendChild(fila);
}

function cargarGrafoPrueba() {
  const rect = canvas.getBoundingClientRect();
  const ancho = rect.width;
  const alto = rect.height;
  const margen = RADIO_NODO + 20;
  const col1 = margen + (ancho - margen * 2) * 0.05;
  const col2 = margen + (ancho - margen * 2) * 0.40;
  const col3 = margen + (ancho - margen * 2) * 0.65;
  const col4 = margen + (ancho - margen * 2) * 0.95;
  const filaSup = margen + (alto - margen * 2) * 0.15;
  const filaMed = margen + (alto - margen * 2) * 0.50;
  const filaInf = margen + (alto - margen * 2) * 0.85;

  const posiciones = {
    1: { x: col1, y: filaSup },
    2: { x: col2, y: filaSup },
    3: { x: col3, y: filaMed },
    4: { x: col4, y: filaMed },
    5: { x: col2, y: filaInf },
    6: { x: col3, y: filaInf },
    7: { x: col4, y: filaInf }
  };

  nodos = [1, 2, 3, 4, 5, 6, 7].map((id) => ({ id, posicion: posiciones[id] }));

  arcos = [
    { origen: 1, destino: 2, peso: 10 },
    { origen: 1, destino: 3, peso: 18 },
    { origen: 2, destino: 3, peso: 6 },
    { origen: 2, destino: 5, peso: 3 },
    { origen: 3, destino: 4, peso: 3 },
    { origen: 3, destino: 6, peso: 20 },
    { origen: 4, destino: 3, peso: 2 },
    { origen: 4, destino: 7, peso: 2 },
    { origen: 5, destino: 4, peso: 8 },
    { origen: 5, destino: 7, peso: 10 },
    { origen: 7, destino: 6, peso: 5 }
  ];

  ultimoResultado = null;
  txtOrigenCamino.value = "";
  txtDestinoCamino.value = "";
  limpiarTabla("Aún no hay resultados.");
  limpiarVisualizaciones("Calcule un algoritmo para generar los gráficos de caminos.");
  cambiarModo("seleccionar");
  dibujarGrafo();
}

function limpiarTodo() {
  nodos = [];
  arcos = [];
  txtOrigen.value = "";
  txtDestino.value = "";
  txtPeso.value = "";
  txtOrigenCamino.value = "";
  txtDestinoCamino.value = "";
  tituloResultados.textContent = "Resultados";
  ultimoResultado = null;
  limpiarTabla("Aún no hay resultados.");
  limpiarVisualizaciones("Calcule un algoritmo para generar los gráficos de caminos.");
  cambiarModo("seleccionar");
  dibujarGrafo();
}

function limpiarTabla(mensaje) {
  tituloResultados.textContent = "Resultados";
  tablaResultados.innerHTML = `<tr><td colspan="3" class="empty">${mensaje}</td></tr>`;
}

function limpiarVisualizaciones(mensaje) {
  contenedorVisualizaciones.innerHTML = `<div class="visual-empty">${mensaje}</div>`;
}

function crearVisualizaciones(nodoInicial, nodoDestino, caminosCalculados, algoritmo) {
  if (caminosCalculados.length === 0) {
    limpiarVisualizaciones("No hay caminos alcanzables para mostrar.");
    return;
  }

  contenedorVisualizaciones.innerHTML = "";

  const minimo = caminosCalculados.find((c) => c.esMinimo) || caminosCalculados[0];
  const nombreAlgoritmo = algoritmo === "dijkstra" ? "Dijkstra" : "Floyd-Warshall";
  const banner = document.createElement("div");
  banner.className = "camino-banner";
  banner.innerHTML = `
    <span class="camino-banner-label">${nombreAlgoritmo}: el camino más corto del nodo ${nodoInicial} al nodo ${minimo.destino}</span>
    <span class="camino-banner-camino">${minimo.camino.join(" → ")}</span>
    <span class="camino-banner-distancia">Distancia total: ${minimo.distancia}</span>
  `;
  contenedorVisualizaciones.appendChild(banner);

  if (caminosCalculados.length > 1) {
    const resumen = document.createElement("div");
    resumen.className = "caminos-resumen";
    resumen.innerHTML = `
      <span class="caminos-resumen-label">Se encontraron <strong>${caminosCalculados.length}</strong> caminos posibles. Mostrando todos ordenados de menor a mayor distancia.</span>
    `;
    contenedorVisualizaciones.appendChild(resumen);
  }

  const coloresPorArco = new Map();
  caminosCalculados.forEach((resultado, indice) => {
    const color = resultado.esMinimo
      ? "#f59e0b"
      : COLORES_CAMINOS[(indice + 2) % COLORES_CAMINOS.length];
    obtenerArcosDelCamino(resultado.camino).forEach((clave) => {
      if (!coloresPorArco.has(clave)) {
        coloresPorArco.set(clave, color);
      }
    });
  });

  const general = crearTarjetaVisual(
    "Vista general de todos los caminos",
    `Inicio: nodo ${nodoInicial} | Total: ${caminosCalculados.length}`,
    true
  );
  contenedorVisualizaciones.appendChild(general.card);
  dibujarMiniGrafo(general.canvas, {
    coloresPorArco,
    mostrarSoloResaltados: false
  });

  caminosCalculados.forEach((resultado, indice) => {
    const color = resultado.esMinimo
      ? "#f59e0b"
      : COLORES_CAMINOS[(indice + 2) % COLORES_CAMINOS.length];
    const arcosCamino = new Set(obtenerArcosDelCamino(resultado.camino));
    const etiqueta = resultado.esMinimo
      ? `Camino #${indice + 1} (MÍNIMO)`
      : `Camino #${indice + 1}`;
    const subtitulo = `Distancia: ${resultado.distancia} | ${resultado.camino.join(" → ")}`;
    const tarjeta = crearTarjetaVisual(etiqueta, subtitulo, false, resultado.esMinimo);
    contenedorVisualizaciones.appendChild(tarjeta.card);
    dibujarMiniGrafo(tarjeta.canvas, {
      arcosResaltados: arcosCamino,
      colorResaltado: color,
      mostrarSoloResaltados: true
    });
  });
}

function obtenerArcosDelCamino(camino) {
  const claves = [];
  for (let i = 0; i < camino.length - 1; i++) {
    claves.push(`${camino[i]}-${camino[i + 1]}`);
  }
  return claves;
}

function crearTarjetaVisual(titulo, subtitulo, general, destacado = false) {
  const card = document.createElement("article");
  let clases = "visual-card";
  if (general) clases += " general";
  if (destacado) clases += " destacado";
  card.className = clases;

  const encabezado = document.createElement("div");
  encabezado.className = "visual-title";
  encabezado.innerHTML = `${titulo}<span>${subtitulo}</span>`;

  const canvasVisual = document.createElement("canvas");
  card.appendChild(encabezado);
  card.appendChild(canvasVisual);

  return { card, canvas: canvasVisual };
}

function dibujarGrafo() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  const colores = ultimoResultado?.coloresPorArco;
  const idInicio = ultimoResultado?.nodoInicial;
  const idDestino = ultimoResultado?.nodoDestino;

  arcos.forEach((arco) => {
    const clave = `${arco.origen}-${arco.destino}`;
    const color = colores?.get(clave) || null;
    dibujarArco(arco, color);
  });

  nodos.forEach((nodo) => {
    dibujarNodo(nodo, {
      esInicio: nodo.id === idInicio,
      esDestino: nodo.id === idDestino
    });
  });
}

function puntoEnBorde(origen, destino) {
  const dx = destino.x - origen.x;
  const dy = destino.y - origen.y;
  const largo = Math.hypot(dx, dy);

  return {
    x: origen.x + (dx / largo) * RADIO_NODO,
    y: origen.y + (dy / largo) * RADIO_NODO
  };
}

function dibujarArco(arco, color = null) {
  const nodoOrigen = buscarNodo(arco.origen);
  const nodoDestino = buscarNodo(arco.destino);
  if (!nodoOrigen || !nodoDestino) return;

  const inicio = puntoEnBorde(nodoOrigen.posicion, nodoDestino.posicion);
  const fin = puntoEnBorde(nodoDestino.posicion, nodoOrigen.posicion);
  const tieneArcoOpuesto = arcos.some(
    (otro) => otro.origen === arco.destino && otro.destino === arco.origen
  );
  const control = obtenerPuntoControl(inicio, fin, tieneArcoOpuesto ? 42 : 0);

  const colorArco = color || "#57534e";
  const grosor = color ? 3.2 : 2.2;

  ctx.save();
  ctx.strokeStyle = colorArco;
  ctx.fillStyle = colorArco;
  ctx.lineWidth = grosor;

  ctx.beginPath();
  ctx.moveTo(inicio.x, inicio.y);
  if (tieneArcoOpuesto) {
    ctx.quadraticCurveTo(control.x, control.y, fin.x, fin.y);
  } else {
    ctx.lineTo(fin.x, fin.y);
  }
  ctx.stroke();

  dibujarFlecha(inicio, fin, Boolean(color), tieneArcoOpuesto ? control : null);
  dibujarPeso(arco.peso, inicio, fin, tieneArcoOpuesto ? control : null);
  ctx.restore();
}

function obtenerPuntoControl(inicio, fin, separacion) {
  const medioX = (inicio.x + fin.x) / 2;
  const medioY = (inicio.y + fin.y) / 2;
  const dx = fin.x - inicio.x;
  const dy = fin.y - inicio.y;
  const largo = Math.hypot(dx, dy) || 1;

  return {
    x: medioX + (-dy / largo) * separacion,
    y: medioY + (dx / largo) * separacion
  };
}

function puntoBezier(inicio, control, fin, t) {
  const unoMenosT = 1 - t;
  return {
    x: unoMenosT * unoMenosT * inicio.x + 2 * unoMenosT * t * control.x + t * t * fin.x,
    y: unoMenosT * unoMenosT * inicio.y + 2 * unoMenosT * t * control.y + t * t * fin.y
  };
}

function dibujarFlecha(inicio, fin, resaltado, control = null) {
  let angulo;
  if (control) {
    const puntoAntesDelFinal = puntoBezier(inicio, control, fin, 0.92);
    angulo = Math.atan2(fin.y - puntoAntesDelFinal.y, fin.x - puntoAntesDelFinal.x);
  } else {
    angulo = Math.atan2(fin.y - inicio.y, fin.x - inicio.x);
  }

  const largo = resaltado ? 16 : 13;

  ctx.beginPath();
  ctx.moveTo(fin.x, fin.y);
  ctx.lineTo(
    fin.x - largo * Math.cos(angulo - Math.PI / 6),
    fin.y - largo * Math.sin(angulo - Math.PI / 6)
  );
  ctx.lineTo(
    fin.x - largo * Math.cos(angulo + Math.PI / 6),
    fin.y - largo * Math.sin(angulo + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

function dibujarPeso(peso, inicio, fin, control = null) {
  const posicionPeso = control
    ? puntoBezier(inicio, control, fin, 0.5)
    : {
        x: (inicio.x + fin.x) / 2,
        y: (inicio.y + fin.y) / 2
      };

  const medioX = posicionPeso.x;
  const medioY = posicionPeso.y;
  const texto = String(peso);

  ctx.font = "700 14px Poppins";
  const anchoTexto = ctx.measureText(texto).width;

  ctx.fillStyle = "#fffdf7";
  ctx.strokeStyle = "#e2d9c8";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(medioX - anchoTexto / 2 - 8, medioY - 14, anchoTexto + 16, 26, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#27272a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texto, medioX, medioY);
}

function dibujarNodo(nodo, opciones = {}) {
  const { x, y } = nodo.posicion;
  const { esInicio = false, esDestino = false } = opciones;

  let relleno, borde, sombra;
  if (esInicio) {
    relleno = "#10b981";
    borde = "#059669";
    sombra = "rgba(16, 185, 129, 0.4)";
  } else if (esDestino) {
    relleno = "#f59e0b";
    borde = "#d97706";
    sombra = "rgba(245, 158, 11, 0.4)";
  } else {
    relleno = "#8b5cf6";
    borde = "#6d28d9";
    sombra = "rgba(139, 92, 246, 0.35)";
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, RADIO_NODO, 0, Math.PI * 2);
  ctx.fillStyle = relleno;
  ctx.shadowColor = sombra;
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 3;
  ctx.strokeStyle = borde;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 16px Poppins";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(nodo.id, x, y);
  ctx.restore();
}

function dibujarMiniGrafo(canvasVisual, opciones) {
  const contexto = canvasVisual.getContext("2d");
  const rect = canvasVisual.getBoundingClientRect();
  const escalaPantalla = window.devicePixelRatio || 1;

  canvasVisual.width = Math.floor(rect.width * escalaPantalla);
  canvasVisual.height = Math.floor(rect.height * escalaPantalla);
  contexto.setTransform(escalaPantalla, 0, 0, escalaPantalla, 0, 0);
  contexto.clearRect(0, 0, rect.width, rect.height);

  if (nodos.length === 0) return;

  const posiciones = calcularPosicionesMini(rect.width, rect.height);

  arcos.forEach((arco) => {
    const clave = `${arco.origen}-${arco.destino}`;
    const colorGeneral = opciones.coloresPorArco?.get(clave);
    const resaltadoIndividual = opciones.arcosResaltados?.has(clave);
    const estaResaltado = Boolean(colorGeneral || resaltadoIndividual);

    if (opciones.mostrarSoloResaltados && !estaResaltado) {
      dibujarMiniArco(contexto, posiciones, arco, {
        color: "#d6d3d1",
        grosor: 1.4,
        opacidad: 0.55
      });
      return;
    }

    dibujarMiniArco(contexto, posiciones, arco, {
      color: colorGeneral || opciones.colorResaltado || "#57534e",
      grosor: estaResaltado ? 4 : 1.7,
      opacidad: estaResaltado ? 1 : 0.45
    });
  });

  nodos.forEach((nodo) => {
    dibujarMiniNodo(contexto, posiciones.get(nodo.id), nodo.id);
  });
}

function calcularPosicionesMini(ancho, alto) {
  const margen = 54;
  const xs = nodos.map((nodo) => nodo.posicion.x);
  const ys = nodos.map((nodo) => nodo.posicion.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangoX = Math.max(1, maxX - minX);
  const rangoY = Math.max(1, maxY - minY);
  const escala = Math.min((ancho - margen * 2) / rangoX, (alto - margen * 2) / rangoY, 1.15);
  const contenidoAncho = rangoX * escala;
  const contenidoAlto = rangoY * escala;
  const offsetX = (ancho - contenidoAncho) / 2;
  const offsetY = (alto - contenidoAlto) / 2;
  const posiciones = new Map();

  nodos.forEach((nodo) => {
    posiciones.set(nodo.id, {
      x: offsetX + (nodo.posicion.x - minX) * escala,
      y: offsetY + (nodo.posicion.y - minY) * escala
    });
  });

  return posiciones;
}

function dibujarMiniArco(contexto, posiciones, arco, estilo) {
  const origen = posiciones.get(arco.origen);
  const destino = posiciones.get(arco.destino);
  if (!origen || !destino) return;

  const inicio = puntoEnBordeMini(origen, destino);
  const fin = puntoEnBordeMini(destino, origen);
  const tieneArcoOpuesto = arcos.some(
    (otro) => otro.origen === arco.destino && otro.destino === arco.origen
  );
  const control = obtenerPuntoControlMini(inicio, fin, tieneArcoOpuesto ? 34 : 0);

  contexto.save();
  contexto.globalAlpha = estilo.opacidad;
  contexto.strokeStyle = estilo.color;
  contexto.fillStyle = estilo.color;
  contexto.lineWidth = estilo.grosor;
  contexto.lineCap = "round";

  contexto.beginPath();
  contexto.moveTo(inicio.x, inicio.y);
  if (tieneArcoOpuesto) {
    contexto.quadraticCurveTo(control.x, control.y, fin.x, fin.y);
  } else {
    contexto.lineTo(fin.x, fin.y);
  }
  contexto.stroke();

  dibujarFlechaMini(contexto, inicio, fin, tieneArcoOpuesto ? control : null, estilo.grosor);

  if (estilo.opacidad > 0.8) {
    dibujarPesoMini(contexto, arco.peso, inicio, fin, tieneArcoOpuesto ? control : null);
  }

  contexto.restore();
}

function dibujarMiniNodo(contexto, posicion, id) {
  contexto.save();
  contexto.beginPath();
  contexto.arc(posicion.x, posicion.y, 19, 0, Math.PI * 2);
  contexto.fillStyle = "#8b5cf6";
  contexto.fill();
  contexto.lineWidth = 2.5;
  contexto.strokeStyle = "#6d28d9";
  contexto.stroke();

  contexto.fillStyle = "#ffffff";
  contexto.font = "800 13px Poppins";
  contexto.textAlign = "center";
  contexto.textBaseline = "middle";
  contexto.fillText(id, posicion.x, posicion.y);
  contexto.restore();
}

function puntoEnBordeMini(origen, destino) {
  const dx = destino.x - origen.x;
  const dy = destino.y - origen.y;
  const largo = Math.hypot(dx, dy) || 1;

  return {
    x: origen.x + (dx / largo) * 20,
    y: origen.y + (dy / largo) * 20
  };
}

function obtenerPuntoControlMini(inicio, fin, separacion) {
  const medioX = (inicio.x + fin.x) / 2;
  const medioY = (inicio.y + fin.y) / 2;
  const dx = fin.x - inicio.x;
  const dy = fin.y - inicio.y;
  const largo = Math.hypot(dx, dy) || 1;

  return {
    x: medioX + (-dy / largo) * separacion,
    y: medioY + (dx / largo) * separacion
  };
}

function puntoBezierMini(inicio, control, fin, t) {
  const unoMenosT = 1 - t;
  return {
    x: unoMenosT * unoMenosT * inicio.x + 2 * unoMenosT * t * control.x + t * t * fin.x,
    y: unoMenosT * unoMenosT * inicio.y + 2 * unoMenosT * t * control.y + t * t * fin.y
  };
}

function dibujarFlechaMini(contexto, inicio, fin, control, grosor) {
  let angulo;
  if (control) {
    const puntoAntesDelFinal = puntoBezierMini(inicio, control, fin, 0.92);
    angulo = Math.atan2(fin.y - puntoAntesDelFinal.y, fin.x - puntoAntesDelFinal.x);
  } else {
    angulo = Math.atan2(fin.y - inicio.y, fin.x - inicio.x);
  }

  const largo = grosor >= 4 ? 15 : 11;
  contexto.beginPath();
  contexto.moveTo(fin.x, fin.y);
  contexto.lineTo(
    fin.x - largo * Math.cos(angulo - Math.PI / 6),
    fin.y - largo * Math.sin(angulo - Math.PI / 6)
  );
  contexto.lineTo(
    fin.x - largo * Math.cos(angulo + Math.PI / 6),
    fin.y - largo * Math.sin(angulo + Math.PI / 6)
  );
  contexto.closePath();
  contexto.fill();
}

function dibujarPesoMini(contexto, peso, inicio, fin, control) {
  const posicion = control
    ? puntoBezierMini(inicio, control, fin, 0.5)
    : {
        x: (inicio.x + fin.x) / 2,
        y: (inicio.y + fin.y) / 2
      };
  const texto = String(peso);

  contexto.font = "800 12px Poppins";
  const anchoTexto = contexto.measureText(texto).width;
  contexto.globalAlpha = 1;
  contexto.fillStyle = "#fffdf7";
  contexto.strokeStyle = "#e2d9c8";
  contexto.lineWidth = 1;
  contexto.beginPath();
  contexto.roundRect(posicion.x - anchoTexto / 2 - 7, posicion.y - 12, anchoTexto + 14, 23, 6);
  contexto.fill();
  contexto.stroke();
  contexto.fillStyle = "#27272a";
  contexto.textAlign = "center";
  contexto.textBaseline = "middle";
  contexto.fillText(texto, posicion.x, posicion.y);
}

canvas.addEventListener("click", (evento) => {
  if (modo !== "agregarNodo") return;
  agregarNodo(obtenerPosicionCanvas(evento));
});

canvas.addEventListener("mousedown", (evento) => {
  if (modo !== "seleccionar") return;
  const pos = obtenerPosicionCanvas(evento);
  const nodo = nodoEnPosicion(pos);
  if (nodo) {
    nodoArrastrado = nodo;
    desplazamiento = {
      x: pos.x - nodo.posicion.x,
      y: pos.y - nodo.posicion.y
    };
    canvas.style.cursor = "grabbing";
    evento.preventDefault();
  }
});

canvas.addEventListener("mousemove", (evento) => {
  if (nodoArrastrado) {
    const pos = obtenerPosicionCanvas(evento);
    const rect = canvas.getBoundingClientRect();
    const nuevaX = Math.max(RADIO_NODO, Math.min(rect.width - RADIO_NODO, pos.x - desplazamiento.x));
    const nuevaY = Math.max(RADIO_NODO, Math.min(rect.height - RADIO_NODO, pos.y - desplazamiento.y));
    nodoArrastrado.posicion = { x: nuevaX, y: nuevaY };
    dibujarGrafo();
  } else if (modo === "seleccionar") {
    const pos = obtenerPosicionCanvas(evento);
    if (nodoEnPosicion(pos)) {
      canvas.style.cursor = "grab";
    } else if (arcoEnPosicion(pos)) {
      canvas.style.cursor = "pointer";
    } else {
      canvas.style.cursor = "default";
    }
  }
});

function finalizarArrastre() {
  if (!nodoArrastrado) return;
  nodoArrastrado = null;
  const sobreNodo = modo === "seleccionar";
  canvas.style.cursor = sobreNodo ? "default" : "";
}

canvas.addEventListener("mouseup", finalizarArrastre);
canvas.addEventListener("mouseleave", finalizarArrastre);

function arcoEnPosicion(pos) {
  for (let i = arcos.length - 1; i >= 0; i--) {
    const arco = arcos[i];
    const nodoOrigen = buscarNodo(arco.origen);
    const nodoDestino = buscarNodo(arco.destino);
    if (!nodoOrigen || !nodoDestino) continue;
    if (puntoCercaDeArco(pos, nodoOrigen.posicion, nodoDestino.posicion, RADIO_NODO + 6)) {
      return arco;
    }
  }
  return null;
}

function puntoCercaDeArco(p, a, b, tolerancia) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const longitudSq = dx * dx + dy * dy;
  if (longitudSq === 0) return Math.hypot(p.x - a.x, p.y - a.y) <= tolerancia;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / longitudSq;
  t = Math.max(0, Math.min(1, t));
  const proyX = a.x + t * dx;
  const proyY = a.y + t * dy;
  return Math.hypot(p.x - proyX, p.y - proyY) <= tolerancia;
}

function abrirModal(titulo, contenidoHTML, pieHTML) {
  modalTitulo.textContent = titulo;
  modalCuerpo.innerHTML = contenidoHTML;
  modalPie.innerHTML = pieHTML;
  modalOverlay.hidden = false;
  const input = modalCuerpo.querySelector("input");
  if (input) {
    setTimeout(() => {
      input.focus();
      input.select();
    }, 30);
  }
}

function cerrarModal() {
  modalOverlay.hidden = true;
  modalCuerpo.innerHTML = "";
  modalPie.innerHTML = "";
}

function aplicarCambiosTrasEdicion() {
  ultimoResultado = null;
  limpiarTabla("Aún no hay resultados.");
  limpiarVisualizaciones("Calcule un algoritmo para generar los gráficos de caminos.");
  dibujarGrafo();
}

function editarNodo(nodo) {
  abrirModal(
    "Editar nodo",
    `
      <div class="modal-info">Vas a editar el nodo <strong>${nodo.id}</strong>. Al cambiar su ID, todos los arcos conectados se actualizarán automáticamente.</div>
      <div class="modal-field">
        <label for="modalInput">Nuevo ID del nodo</label>
        <input id="modalInput" type="number" min="1" value="${nodo.id}" />
      </div>
      <div class="modal-error" id="modalError"></div>
    `,
    `
      <button class="btn-secondary" id="modalCancelar" type="button">Cancelar</button>
      <button class="btn-primary" id="modalAceptar" type="button">Guardar cambios</button>
    `
  );

  const input = document.getElementById("modalInput");
  const error = document.getElementById("modalError");

  const intentar = () => {
    error.textContent = "";
    input.classList.remove("input-error");
    const nuevoId = Number(input.value);
    if (!Number.isInteger(nuevoId) || nuevoId <= 0) {
      error.textContent = "El ID debe ser un entero positivo.";
      input.classList.add("input-error");
      input.focus();
      return;
    }
    if (nuevoId !== nodo.id && existeNodo(nuevoId)) {
      error.textContent = `Ya existe un nodo con ID ${nuevoId}.`;
      input.classList.add("input-error");
      input.focus();
      return;
    }
    const idAnterior = nodo.id;
    nodo.id = nuevoId;
    arcos.forEach((arco) => {
      if (arco.origen === idAnterior) arco.origen = nuevoId;
      if (arco.destino === idAnterior) arco.destino = nuevoId;
    });
    cerrarModal();
    aplicarCambiosTrasEdicion();
  };

  document.getElementById("modalAceptar").addEventListener("click", intentar);
  document.getElementById("modalCancelar").addEventListener("click", cerrarModal);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") intentar();
    if (e.key === "Escape") cerrarModal();
  });
}

function menuArco(arco) {
  abrirModal(
    `Arco ${arco.origen} → ${arco.destino}`,
    `
      <div class="modal-info">Selecciona una acción para el arco con peso <strong>${arco.peso}</strong>.</div>
      <div class="modal-opciones">
        <button class="btn-editar" type="button">
          <strong>Editar peso</strong>
          <div style="font-size: 12px; font-weight: 500; color: #78716c; margin-top: 2px;">Cambiar el valor numérico</div>
        </button>
        <button class="btn-eliminar" type="button">
          <strong>Eliminar arco</strong>
          <div style="font-size: 12px; font-weight: 500; color: #78716c; margin-top: 2px;">Quitar del grafo</div>
        </button>
      </div>
    `,
    `
      <button class="btn-secondary" id="modalCancelar" type="button">Cerrar</button>
    `
  );

  document.querySelector(".btn-editar").addEventListener("click", () => editarArco(arco));
  document.querySelector(".btn-eliminar").addEventListener("click", () => confirmarEliminarArco(arco));
  document.getElementById("modalCancelar").addEventListener("click", cerrarModal);
}

function editarArco(arco) {
  abrirModal(
    `Editar arco ${arco.origen} → ${arco.destino}`,
    `
      <div class="modal-info">Peso actual: <strong>${arco.peso}</strong>. Ingresa un nuevo peso entero positivo.</div>
      <div class="modal-field">
        <label for="modalInput">Nuevo peso</label>
        <input id="modalInput" type="number" min="1" value="${arco.peso}" />
      </div>
      <div class="modal-error" id="modalError"></div>
    `,
    `
      <button class="btn-secondary" id="modalCancelar" type="button">Cancelar</button>
      <button class="btn-primary" id="modalAceptar" type="button">Guardar cambios</button>
    `
  );

  const input = document.getElementById("modalInput");
  const error = document.getElementById("modalError");

  const intentar = () => {
    error.textContent = "";
    input.classList.remove("input-error");
    const nuevoPeso = Number(input.value);
    if (!Number.isInteger(nuevoPeso) || nuevoPeso <= 0) {
      error.textContent = "El peso debe ser un entero positivo.";
      input.classList.add("input-error");
      input.focus();
      return;
    }
    arco.peso = nuevoPeso;
    cerrarModal();
    aplicarCambiosTrasEdicion();
  };

  document.getElementById("modalAceptar").addEventListener("click", intentar);
  document.getElementById("modalCancelar").addEventListener("click", cerrarModal);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") intentar();
    if (e.key === "Escape") cerrarModal();
  });
}

function confirmarEliminarArco(arco) {
  abrirModal(
    "Eliminar arco",
    `
      <div class="modal-info">¿Seguro que quieres eliminar el arco <strong>${arco.origen} → ${arco.destino}</strong> con peso <strong>${arco.peso}</strong>? Esta acción no se puede deshacer.</div>
    `,
    `
      <button class="btn-secondary" id="modalCancelar" type="button">Cancelar</button>
      <button class="btn-danger" id="modalAceptar" type="button">Eliminar</button>
    `
  );

  document.getElementById("modalCancelar").addEventListener("click", cerrarModal);
  document.getElementById("modalAceptar").addEventListener("click", () => {
    arcos = arcos.filter((a) => a !== arco);
    cerrarModal();
    aplicarCambiosTrasEdicion();
  });
}

canvas.addEventListener("dblclick", (evento) => {
  if (modo !== "seleccionar") return;
  const pos = obtenerPosicionCanvas(evento);
  const nodo = nodoEnPosicion(pos);
  if (nodo) {
    editarNodo(nodo);
    return;
  }
  const arco = arcoEnPosicion(pos);
  if (arco) {
    menuArco(arco);
  }
});

function manejarRedimension() {
  ajustarCanvas();

  clearTimeout(temporizadorRedimension);
  temporizadorRedimension = setTimeout(() => {
    if (ultimoResultado) {
      crearVisualizaciones(
        ultimoResultado.nodoInicial,
        ultimoResultado.nodoDestino,
        ultimoResultado.caminosCalculados,
        ultimoResultado.algoritmo
      );
    }
  }, 120);
}

btnModoNodo.addEventListener("click", () => cambiarModo("agregarNodo"));
btnModoSeleccionar.addEventListener("click", () => cambiarModo("seleccionar"));
btnAgregarArco.addEventListener("click", agregarArco);
btnCalcular.addEventListener("click", calcularAlgoritmo);
btnLimpiar.addEventListener("click", limpiarTodo);
btnEliminarNodo.addEventListener("click", eliminarNodo);
btnCargarPrueba.addEventListener("click", cargarGrafoPrueba);
window.addEventListener("resize", manejarRedimension);

modalCerrar.addEventListener("click", cerrarModal);
modalOverlay.addEventListener("click", (evento) => {
  if (evento.target === modalOverlay) cerrarModal();
});
document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && !modalOverlay.hidden) cerrarModal();
});

ajustarCanvas();
cambiarModo("seleccionar");
