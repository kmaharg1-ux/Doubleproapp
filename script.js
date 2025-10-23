let map;
let anchors = {};
let restoredMarker = null;

const sectionMap = {
  A: { section: 1, corner: "NW" },
  B: { section: 6, corner: "NW" },
  C: { section: 31, corner: "NE" },
  D: { section: 36, corner: "NW" }
};

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
    document.getElementById(id).addEventListener("input", () => {
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

function getSectionGridPosition(sectionNum, corner, baseLat, baseLng, sectionSize = 0.05) {
  const row = Math.floor((sectionNum - 1) / 6);
  const col = (row % 2 === 0)
    ? 5 - ((sectionNum - 1) % 6)
    : (sectionNum - 1) % 6;

  const swLat = baseLat + row * sectionSize;
  const swLng = baseLng + col * sectionSize;

  return getGridPosition(corner, swLat, swLng, sectionSize);
}

function setAnchors() {
  const northA = parseFloat(document.getElementById("northA").value);
  const northB = parseFloat(document.getElementById("northB").value);
  const eastC = parseFloat(document.getElementById("eastC").value);
  const eastD = parseFloat(document.getElementById("eastD").value);

  if ([northA, northB, eastC, eastD].some(isNaN)) return;

  anchors = {
    A: { northing: northA, easting: eastC },
    B: { northing: northB, easting: eastC },
    C: { northing: northA, easting: eastD },
    D: { northing: northB, easting: eastD }
  };

  drawAnchors();
  drawGrid();
}

function drawAnchors() {
  map.eachLayer(layer => map.removeLayer(layer));
  L.tileLayer('', { attribution: '' }).addTo(map);

  const baseLat = anchors.B.northing / 100000;
  const baseLng = anchors.D.easting / 100000;

  for (const label of ["A", "B", "C", "D"]) {
    const { section, corner } = sectionMap[label];
    const [lat, lng] = getSectionGridPosition(section, corner, baseLat, baseLng);

    L.circleMarker([lat, lng], {
      radius: 6,
      color: 'red',
      fillColor: 'red',
      fillOpacity: 0.8
    }).addTo(map)
      .bindTooltip(`Point ${label} (Sec ${section}, ${corner})`, { direction: "top" })
      .bindPopup(`Point ${label}<br>Section: ${section}<br>Corner: ${corner}<br>Northing: ${(lat * 100000).toFixed(2)}<br>Easting: ${(lng * 100000).toFixed(2)}`);
  }
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
          html: `<div>${sectionNum}</div>`
        })
      }).addTo(map);

      const midpoints = [
        [(sw[0] + ne[0]) / 2, sw[1]],
        [(sw[0] + ne[0]) / 2, ne[1]],
        [sw[0], (sw[1] + ne[1]) / 2],
        [ne[0], (sw[1] + ne[1]) / 2],
        [(sw[0] + ne[0]) / 2, (sw[1] + ne[1]) / 2]
      ];

      midpoints.forEach(pt => {
        L.circleMarker(pt, {
          radius: 3,
          color: '#555',
          fillColor: '#ccc',
          fillOpacity: 0.6
        }).addTo(map);
      });
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
    .bindPopup(`Restored Corner<br>Northing: ${northing.toFixed(2)}<br>Easting: ${easting.toFixed(2)}`);
}

function resetMap() {
  anchors = {};
  restoredMarker = null;
  map.eachLayer(layer => map.removeLayer(layer));
  L.tileLayer('', { attribution: '' }).addTo(map);
}
