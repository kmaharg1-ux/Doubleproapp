let map;
let restoredMarker = null;

function initMap() {
  map = L.map('map', {
    center: [46.6, -112.0],
    zoom: 14,
    zoomControl: true,
    attributionControl: false
  });

  L.tileLayer('', { attribution: '' }).addTo(map);
  drawGrid();

  ["sectionA", "cornerA", "sectionB", "cornerB", "sectionC", "cornerC", "sectionD", "cornerD",
   "recordNS", "measuredNS", "recordEW", "measuredEW"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      drawAnchors();
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
    case "C":  return [baseLat + half, baseLng + half];
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

function drawGrid() {
  const baseLat = 46.6;
  const baseLng = -112.0;
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

function drawAnchors() {
  const baseLat = 46.6;
  const baseLng = -112.0;

  const sectionMap = {
    A: {
      section: parseInt(document.getElementById("sectionA").value),
      corner: document.getElementById("cornerA").value
    },
    B: {
      section: parseInt(document.getElementById("sectionB").value),
      corner: document.getElementById("cornerB").value
    },
    C: {
      section: parseInt(document.getElementById("sectionC").value),
      corner: document.getElementById("cornerC").value
    },
    D: {
      section: parseInt(document.getElementById("sectionD").value),
      corner: document.getElementById("cornerD").value
    }
  };

  ["A", "B", "C", "D"].forEach(label => {
    const { section, corner } = sectionMap[label];
    if (!section || !corner) return;

    const [lat, lng] = getSectionGridPosition(section, corner, baseLat, baseLng);

    L.circleMarker([lat, lng], {
      radius: 6,
      color: 'red',
      fillColor: 'red',
      fillOpacity: 0.8
    }).addTo(map)
      .bindTooltip(`Point ${label} (Sec ${section}, ${corner})`, { direction: "top" })
      .bindPopup(`Point ${label}<br>Section: ${section}<br>Corner: ${corner}`);
  });
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
  document.getElementById("output").innerHTML =
    `<strong>Restoration logic not yet wired to section-based anchors.</strong><br>` +
    `Once A–D are defined by section and corner, we’ll use their positions to calculate the restored corner.`;
}

function resetMap() {
  map.eachLayer(layer => map.removeLayer(layer));
  L.tileLayer('', { attribution: '' }).addTo(map);
  drawGrid();
}
