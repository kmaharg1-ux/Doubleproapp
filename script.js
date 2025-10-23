let map;
let knownCorners = {};
let targetCorner = null;
let cornerMarkers = {};

function initMap() {
  map = L.map('map', {
    center: [46.6, -112.0],
    zoom: 14,
    dragging: false,
    zoomControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
    touchZoom: false
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  generatePLSSGrid();
}

function generatePLSSGrid() {
  const baseNorthing = 100000;
  const baseEasting = 500000;
  const sectionSize = 5280;

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const secNum = 6 * row + (row % 2 === 0 ? 6 - col : col + 1);
      const northing = baseNorthing + (5 - row) * sectionSize;
      const easting = baseEasting + col * sectionSize;

      const corners = {
        "NW": [northing + sectionSize, easting],
        "NE": [northing + sectionSize, easting + sectionSize],
        "SW": [northing, easting],
        "SE": [northing, easting + sectionSize],
        "N¼": [northing + sectionSize, easting + sectionSize / 2],
        "S¼": [northing, easting + sectionSize / 2],
        "E¼": [northing + sectionSize / 2, easting + sectionSize],
        "W¼": [northing + sectionSize / 2, easting],
        "C":   [northing + sectionSize / 2, easting + sectionSize / 2]
      };

      for (const [label, coords] of Object.entries(corners)) {
        const lat = coords[0] / 100000;
        const lng = coords[1] / 100000;
        const id = `S${secNum}_${label}`;
        const marker = L.circleMarker([lat, lng], {
          radius: 4,
          color: 'gray',
          fillOpacity: 0.6
        }).addTo(map);
        marker.bindPopup(`${id}`);
        marker.on('click', () => selectTargetCorner(id));
        cornerMarkers[id] = marker;
      }

      const centerLat = (northing + sectionSize / 2) / 100000;
      const centerLng = (easting + sectionSize / 2) / 100000;
      L.marker([centerLat, centerLng], {
        icon: L.divIcon({
          className: 'section-label',
          html: `<div style="font-size:10px;font-weight:bold;">${secNum}</div>`,
          iconSize: [20, 20]
        })
      }).addTo(map);
    }
  }
}

function selectTargetCorner(id) {
  targetCorner = id;
  const [section, corner] = id.split("_");
  document.getElementById("targetSection").value = section.replace("S", "");
  document.getElementById("targetCornerType").value = corner;
  highlightCorner(id, 'red');
}

function highlightCorner(id, color) {
  Object.values(cornerMarkers).forEach(m => m.setStyle({ color: 'gray' }));
  if (cornerMarkers[id]) {
    cornerMarkers[id].setStyle({ color });
    cornerMarkers[id].bringToFront();
  }
}

function addKnownCorner() {
  const section = document.getElementById("knownSection").value;
  const type = document.getElementById("knownCornerType").value;
  const northing = parseFloat(document.getElementById("knownNorthing").value);
  const easting = parseFloat(document.getElementById("knownEasting").value);

  if (!section || !type || isNaN(northing) || isNaN(easting)) {
    alert("Please enter valid known corner data.");
    return;
  }

  const id = `S${section}_${type}`;
  knownCorners[id] = [northing, easting];
  highlightCorner(id, 'blue');

  const dropdown = document.getElementById("recordFromCorner");
  if (![...dropdown.options].some(opt => opt.value === id)) {
    const option = document.createElement("option");
    option.value = id;
    option.text = id;
    dropdown.appendChild(option);
  }

  L.marker([northing / 100000, easting / 100000], {
    title: id
  }).addTo(map).bindPopup(`Known: ${id}`);
}

function parseDistance(val) {
  if (!val) return 0;
  val = val.toLowerCase().trim();
  if (val.includes("ch")) return parseFloat(val) * 66;
  return parseFloat(val);
}

function weightedProportion(r1, r2, m1, m2) {
  const totalR = r1 + r2, totalM = m1 + m2;
  return (r1 / totalR + m1 / totalM) / 2;
}

function restoreCorner() {
  if (!targetCorner) {
    alert("Please select a lost corner.");
    return;
  }

  const fromId = document.getElementById("recordFromCorner").value;
  if (!knownCorners[fromId]) {
    alert("Please select a valid known corner to call from.");
    return;
  }

  const r = {
    north: parseDistance(document.getElementById("recordN").value),
    south: parseDistance(document.getElementById("recordS").value),
    east: parseDistance(document.getElementById("recordE").value),
    west: parseDistance(document.getElementById("recordW").value)
  };

  const m = {
    north: parseFloat(document.getElementById("measuredN").value),
    south: parseFloat(document.getElementById("measuredS").value),
    east: parseFloat(document.getElementById("measuredE").value),
    west: parseFloat(document.getElementById("measuredW").value)
  };

  if (Object.values(m).some(isNaN)) {
    alert("Please enter all measured distances.");
    return;
  }

  const [SW, SE, NW, NE] = ["SW", "SE", "NW", "NE"].map(dir =>
    Object.entries(knownCorners).find(([id]) => id.includes(`_${dir}`))?.[1]
  );

  if (!SW || !SE || !NW || !NE) {
    alert("You must add known SW, SE, NW, and NE corners.");
    return;
  }

  const propEW = weightedProportion(r.west, r.east, m.west, m.east);
  const propNS = weightedProportion(r.south, r.north, m.south, m.north);

  const northingW = SW[0] + propNS * (NW[0] - SW[0]);
  const northingE = SE[0] + propNS * (NE[0] - SE[0]);
  const finalN = northingW + propEW * (northingE - northingW);

  const eastingS = SW[1] + propEW * (SE[1] - SW[1]);
  const eastingN = NW[1] + propEW * (NE[1] - NW[1]);
  const finalE = eastingS + propNS * (eastingN - eastingS);

  document.getElementById("output").innerHTML =
    `<strong>${targetCorner}</strong><br>` +
    `Northing: ${finalN.toFixed(3)} ft<br>` +
    `Easting: ${finalE.toFixed(3)} ft`;

  L.marker([finalN / 100000, finalE / 100000], {
    title: "Restored Corner"
  }).addTo(map).bindPopup(`Restored: ${targetCorner}`).openPopup();
}

window.onload = initMap;
