let map;
let anchors = {};
let restoredMarker = null;
let lastInputs = {};
let fieldMode = false;

function initMap() {
  map = L.map('map', {
    center: [46.6, -112.0],
    zoom: 14,
    zoomControl: true,
    attributionControl: false
  });
  L.tileLayer('', { attribution: '' }).addTo(map);
  attachInputListeners();
}

function attachInputListeners() {
  const fields = ["northA", "northB", "eastC", "eastD", "recordNS", "measuredNS", "recordEW", "measuredEW"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener("input", () => {
      lastInputs[id] = el.value;
      setAnchors();
      showProportions();
    });
  });
}

function parseDistance(val) {
  if (!val) return 0;
  val = val.toLowerCase().trim();
  if (val.includes("ch")) return parseFloat(val) * 66;
  return parseFloat(val);
}

function getGridPosition(role, baseLat, baseLng, sectionSize = 0.05) {
  const half = sectionSize / 2;
  switch (role) {
    case "NE": return [baseLat + sectionSize, baseLng + sectionSize];
    case "NW": return [baseLat + sectionSize, baseLng];
    case "SE": return [baseLat, baseLng + sectionSize];
    case "SW": return [baseLat, baseLng];
    case "N":  return [baseLat + sectionSize, baseLng + half];
    case "S":  return [baseLat, baseLng + half];
    case "E":  return [baseLat + half, baseLng + sectionSize];
    case "W":  return [baseLat + half, baseLng];
    default:   return [baseLat + half, baseLng + half];
  }
}

function setAnchors() {
  const northA = parseFloat(document.getElementById("northA").value);
  const northB = parseFloat(document.getElementById("northB").value);
  const eastC = parseFloat(document.getElementById("eastC").value);
  const eastD = parseFloat(document.getElementById("eastD").value);

  if ([northA, northB, eastC, eastD].some(isNaN)) return;

  const sharedEasting = (eastC + eastD) / 2;
  const sharedNorthing = (northA + northB) / 2;

  anchors = {
    A: { northing: northA, easting: sharedEasting },
    B: { northing: northB, easting: sharedEasting },
    C: { northing: sharedNorthing, easting: eastC },
    D: { northing: sharedNorthing, easting: eastD }
  };

  drawAnchors();
  drawGrid();
}

function drawAnchors() {
  map.eachLayer(layer => map.removeLayer(layer));

  const baseLat = anchors.B.northing / 100000;
  const baseLng = anchors.D.easting / 100000;
  const roles = {
    A: document.getElementById("roleA").value,
    B: document.getElementById("roleB").value,
    C: document.getElementById("roleC").value,
    D: document.getElementById("roleD").value
  };

  for (const label of ["A", "B", "C", "D"]) {
    const [lat, lng] = getGridPosition(roles[label], baseLat, baseLng);

    L.circleMarker([lat, lng], {
      radius: 6,
      color: 'red',
      fillColor: 'red',
      fillOpacity: 0.8,
      className: 'drop-pin'
    }).addTo(map)
      .bindTooltip(`Point ${label} (${roles[label]})`, { direction: "top" })
      .bindPopup(`Point ${label}<br>Role: ${roles[label]}<br>Lat: ${lat.toFixed(5)}<br>Lng: ${lng.toFixed(5)}`);
  }

  const bounds = L.latLngBounds(Object.values(anchors).map(p => [p.northing / 100000, p.easting / 100000]));
  map.fitBounds(bounds.pad(0.3));
}

function drawGrid() {
  const baseLat = anchors.B.northing / 100000;
  const baseLng = anchors.D.easting / 100000;
  const sectionSize = 0.05;

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col
