let map;
let knownCorners = {};
let targetCorner = null;

function initMap() {
  map = L.map('map', {
    center: [46.6, -112.0], // Default center (Montana)
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

  const lat = northing / 100000;
  const lng = easting / 100000;

  L.marker([lat, lng], { title: id })
    .addTo(map)
    .bindPopup(`Known: ${id}`)
    .openPopup();

  const dropdown = document.getElementById("recordFromCorner");
  const option = document.createElement("option");
  option.value = id;
  option.text = id;
  dropdown.appendChild(option);
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
  const section = document.getElementById("targetSection").value;
  const type = document.getElementById("targetCornerType").value;
  if (!section || !type) {
    alert("Please select a lost corner.");
    return;
  }

  const targetId = `S${section}_${type}`;
  targetCorner = targetId;

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
    `<strong>${targetId}</strong><br>` +
    `Northing: ${finalN.toFixed(3)} ft<br>` +
    `Easting: ${finalE.toFixed(3)} ft`;

  L.marker([finalN / 100000, finalE / 100000], {
    title: "Restored Corner"
  }).addTo(map).bindPopup(`Restored: ${targetId}`).openPopup();
}

window.onload = initMap;
