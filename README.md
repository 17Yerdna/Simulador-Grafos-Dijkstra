# Simulador de Grafos - Algoritmos de Ruta Más Corta

Aplicación web interactiva para crear grafos dirigidos con pesos y visualizar el camino más corto entre dos nodos utilizando los algoritmos de **Dijkstra** y **Floyd-Warshall**. Todo el renderizado se realiza en un `<canvas>` HTML5 con JavaScript puro, sin dependencias externas.

---

## Características

- Crear nodos haciendo clic en el área de dibujo.
- Arrastrar y reubicar nodos en modo seleccionar.
- Agregar arcos dirigidos con peso entre nodos existentes.
- Eliminar nodos (con reasignación automática de IDs y limpieza de arcos asociados).
- Grafo de prueba precargado (7 nodos, 11 arcos) para experimentar de inmediato.
- Cálculo del camino más corto con **Dijkstra** (un origen, todos los destinos alcanzables).
- Cálculo del camino más corto con **Floyd-Warshall** (todos los pares de nodos).
- Visualización del camino resultante sobre el grafo original, más miniaturas por destino con colores diferenciados.
- Tabla de resultados con destino, distancia total y secuencia de nodos del camino.
- Interfaz responsiva con soporte para pantallas pequeñas.

---

## Manual de instalación

La aplicación es 100% cliente (HTML + CSS + JS). No requiere compilación, ni servidor backend, ni gestor de paquetes.

### Requisitos previos

- Un navegador web moderno (Chrome, Edge, Firefox, Brave, Safari, etc.).
- Opcional: cualquier servidor estático local (recomendado para evitar restricciones de `file://`). Ejemplos:
  - **Python 3**: `python -m http.server 8080`
  - **Node.js**: `npx serve`
  - **PHP**: `php -S localhost:8080`
  - **Visual Studio Code**: extensión *Live Server*.

### Opción 1 — Apertura directa

1. Descarga o clona este repositorio:
   ```bash
   git clone https://github.com/17Yerdna/Simulador-Grafos-Dijkstra.git
   ```
2. Entra a la carpeta del proyecto:
   ```bash
   cd Simulador-Grafos-Dijkstra
   ```
3. Haz doble clic en `index.html` para abrirlo en tu navegador.

### Opción 2 — Servidor local (recomendado)

1. Clona el repositorio como en la opción anterior.
2. Desde la raíz del proyecto ejecuta, según tu entorno:
   ```bash
   python -m http.server 8080
   ```
   o
   ```bash
   npx serve
   ```
3. Abre en el navegador: `http://localhost:8080`.

---

## Cómo usar

1. Pulsa **Agregar Nodo** y haz clic en el área blanca para colocar nodos. Vuelve a **Seleccionar** para arrastrarlos.
2. En el panel *Agregar Arco*, escribe el **origen**, el **destino** y el **peso** (enteros positivos), y confirma.
3. En el panel *Algoritmo*, elige **Dijkstra** o **Floyd-Warshall**, ingresa el nodo **origen** y **destino**, y pulsa **Calcular**.
4. Revisa la tabla de resultados y la sección *Visualización de Caminos*.
5. Usa **Limpiar** para reiniciar el grafo o **Cargar grafo de prueba** para una configuración de ejemplo.

---

## Estructura del proyecto

```
.
├── index.html        # Estructura de la interfaz
├── style.css         # Estilos (tema claro, tipografía Poppins)
├── app.js            # Lógica del grafo, algoritmos y renderizado en canvas
└── README.md         # Este archivo
```

---

## Algoritmos implementados

- **Dijkstra**: selecciona el nodo no visitado con menor distancia tentativa, lo marca como visitado y relaja los arcos salientes. Devuelve la menor distancia y el camino reconstruido por predecesores.
- **Floyd-Warshall**: programación dinámica de tres bucles anidados `k → i → j` que actualiza la matriz de distancias mínimas y la matriz de predecesores. Permite responder cualquier par origen-destino.

Ambos algoritmos solo soportan pesos **positivos** (requisito del enunciado original del proyecto académico).

---

## Autores

- **Andrey Fidel Mestanza Bazan**
- **Walter Josue Llontop Vivas**

---

## Licencia

Proyecto académico sin licencia específica asignada. Si planeas reutilizarlo, contacta a los autores.
