let map;
let anchors = {};
let restoredMarker = null;

function initMap() {
  map = L.map('map', {
    center: [46.6, -112.0],
    zoom: 14,
    zoomControl: true,
    attributionControl: false
  });

  // Blank base layer (no streets)
  const blank = L.tileLayer('', { attribution: '' });
  blank.addTo(map);
}

function parseDistance(val) {
  if (!val) return 0;
  val = val.toLowerCase().trim();
  if (val.includes("ch")) return parseFloat(val) * 66;
  return parseFloat(val);
}

function setAnchors() {
  const northA = parseFloat(document.getElementById("northA").value);
  const northB = parseFloat(document.getElementById("northB").value);
  const eastC = parseFloat(document.getElementById("eastC").value);
  const eastD = parseFloat(document.getElementById("eastD").value);

  if ([northA, northB, eastC, eastD].some(isNaN)) {
    alert("Please enter valid coordinates for all four anchor points.");
    return;
  }

  anchors = {
    A: { northing: northA, easting: (eastC + eastD) / 2 },
    B: { northing: northB, easting: (eastC + eastD) / 2 },
    C: { northing: (northA + northB) / 2, easting: eastC },
    D: { northing: (northA + northB) / 2, easting: eastD }
  };

  drawAnchors();
}

function drawAnchors() {
  map.eachLayer(layer => map.removeLayer(layer));

  const points = {};
  for (const [label, { northing, easting }] of Object.entries(anchors)) {
    const lat = northing / 100000;
    const lng = easting / 100000;
    points[label] = [lat, lng];

    L.circleMarker([lat, lng], {
      radius: 6,
      color: 'blue',
      fillOpacity: 0.7
    }).addTo(map).bindPopup(`Point ${label}`).openPopup();
  }

  const bounds = L.latLngBounds(Object.values(points));
  map.fitBounds(bounds.pad(0.2));
}

function restoreCorner() {
  if (!anchors.A || !anchors.B || !anchors.C || !anchors.D) {
    alert("Please define all four anchor points first.");
    return;
  }

  const recordNS = parseDistance(document.getElementById("recordNS").value);
  const measuredNS = parseFloat(document.getElementById("measuredNS").value);
  const recordEW = parseDistance(document.getElementById("recordEW").value);
  const measuredEW = parseFloat(document.getElementById("measuredEW").value);

  if ([recordNS, measuredNS, recordEW, measuredEW].some(isNaN)) {
    alert("Please enter valid record and measured distances.");
    return;
  }

  const propNS = (recordNS / (recordNS + recordNS) + measuredNS / (measuredNS + measuredNS)) / 2;
  const propEW = (recordEW / (recordEW + recordEW) + measuredEW / (measuredEW + measuredEW)) / 2;

  const northing = anchors.B.northing + propNS * (anchors.A.northing - anchors.B.northing);
  const easting = anchors.D.easting + propEW * (anchors.C.easting - anchors.D.easting);

  const lat = northing / 100000;
  const lng = easting / 100000;

  if (restoredMarker) map.removeLayer(restoredMarker);

  restoredMarker = L.marker([lat, lng], {
    title: "Restored Corner"
  }).addTo(map).bindPopup(`Restored Corner<br>Northing: ${northing.toFixed(3)}<br>Easting: ${easting.toFixed(3)}`).openPopup();

  document.getElementById("output").innerHTML =
    `<strong>Restored Corner</strong><br>` +
    `Northing: ${northing.toFixed(3)} ft<br>` +
    `Easting: ${easting.toFixed(3)} ft`;
}

window.onload = initMap;
