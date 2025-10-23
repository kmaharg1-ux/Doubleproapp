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

  // ✅ Blank tile layer — no streets
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
    for (let col = 0; col < 6; col++) {
      const sectionNum = row % 2 === 0 ? 6 * row + (6 - col) : 6 * row + (col + 1);
      const sw = [baseLat + row * sectionSize, baseLng + col * sectionSize];
      const ne = [sw[0] + sectionSize, sw[1] + sectionSize];

      L.rectangle([sw, ne], {
        color: '#333',
        weight: 2,
        fill: false
      }).addTo(map);

      const center = [(sw[0] + ne[0]) / 2, (sw[1] + ne[1]) / 2];
      L.marker(center, {
        icon: L.divIcon({
          className: 'section-label',
          html: `<div style="font-size:12px;color:#000;">${sectionNum}</div>`
        })
      }).addTo(map);
    }
  }
}

function showProportions() {
  const recordNS = parseDistance(document.getElementById("recordNS").value);
  const measuredNS = parseFloat(document.getElementById("measuredNS").value);
  const recordEW = parseDistance(document.getElementById("recordEW").value);
  const measuredEW = parseFloat(document.getElementById("measuredEW").value);

  if ([recordNS, measuredNS, recordEW, measuredEW].some(isNaN)) return;

  const propNS = measuredNS / recordNS;
  const propEW = measuredEW / recordEW;

  document.getElementById("output").innerHTML =
    `<strong>Proportion Preview</strong><br>` +
    `NS Proportion: ${propNS.toFixed(3)} (Measured: ${measuredNS}, Record: ${recordNS})<br>` +
    `EW Proportion: ${propEW.toFixed(3)} (Measured: ${measuredEW}, Record: ${recordEW})`;
}

function restoreCorner() {
  if (!anchors.A || !anchors.B || !anchors.C || !anchors.D) return;

  const recordNS = parseDistance(document.getElementById("recordNS").value);
  const measuredNS = parseFloat(document.getElementById("measuredNS").value);
  const recordEW = parseDistance(document.getElementById("recordEW").value);
  const measuredEW = parseFloat(document.getElementById("measuredEW").value);

  if ([recordNS, measuredNS, recordEW, measuredEW].some(isNaN)) {
    alert("Please enter valid record and measured distances.");
    return;
  }

  const validNS = anchors.A.easting === anchors.B.easting;
  const validEW = anchors.C.northing === anchors.D.northing;

  if (!validNS || !validEW) {
    document.getElementById("output").innerHTML =
      `<strong>⚠️ Restoration Failed</strong><br>` +
      `A and B must share the same easting (NS line).<br>` +
      `C and D must share the same northing (EW line).<br>` +
      `Try single proportioning or check corner type.`;
    return;
  }

  const propNS = measuredNS / recordNS;
  const propEW = measuredEW / recordEW;

  const northing = anchors.B.northing + propNS * (anchors.A.northing - anchors.B.northing);
  const easting = anchors.D.easting + propEW * (anchors.C.easting - anchors.D.easting);

  const lat = northing / 100000;
  const lng = easting / 100000;

  if (restoredMarker) map.removeLayer(restoredMarker);

  restoredMarker = L.circleMarker([lat, lng], {
    radius: 6,
    color: 'green',
    fillColor: 'green',
    fillOpacity: 0.8,
    className: 'restored'
  }).addTo(map)
    .bindTooltip("Restored Corner", { direction: "top" })
    .bindPopup(`Restored Corner<br>Northing: ${northing.toFixed(3)}<br>Easting: ${easting.toFixed(3)}<br>NS Proportion: ${propNS.toFixed(3)}<br>EW Proportion: ${propEW.to
