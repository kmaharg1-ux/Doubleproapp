let map, originNorthing = 0, originEasting = 0;
let targetCorner = null;
let knownCorners = {};
let markers = [];

function parseDistance(val) {
  if (!val) return 5280;
  val = val.toLowerCase().trim();
  if (val.includes("ch")) return parseFloat(val) * 66;
  if (val.includes("chain")) return parseFloat(val) * 66;
  return parseFloat(val);
}

function getGridDistances() {
  const cols = [...Array(6)].map((_, i) => parseDistance(document.getElementById("col" + i).value));
  const rows = [...Array(6)].map((_, i) => parseDistance(document.getElementById("row" + i).value));
  return { cols, rows };
}

function generateGrid() {
  originNorthing = parseFloat(document.getElementById("originNorthing").value);
  originEasting = parseFloat(document.getElementById("originEasting").value);
  const originSection = parseInt(document.getElementById("originSection").value);
  const originCorner = document.getElementById("originCorner").value;
  const { cols, rows } = getGridDistances();

  if (isNaN(originNorthing) || isNaN(originEasting)) {
    alert("Please enter valid origin coordinates.");
    return;
  }

  if (map) map.remove();
  map = L.map('map', {
    center: [originNorthing / 100000, originEasting / 100000],
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

  markers = [];
  knownCorners = {};
  targetCorner = null;
  updateCornerDisplay();

  let originRow = Math.floor((originSection - 1) / 6);
  let originCol = (originRow % 2 === 0)
    ? 6 - ((originSection - 1) % 6) - 1
    : (originSection - 1) % 6;

  let offsetN = rows.slice(0, originRow).reduce((a, b) => a + b, 0);
  let offsetE = cols.slice(0, originCol).reduce((a, b) => a + b, 0);

  const baseNorthing = originNorthing - offsetN;
  const baseEasting = originEasting - offsetE;

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const secNum = 6 * row + (row % 2 === 0 ? 6 - col : col + 1);
      const northOffset = rows.slice(0, row).reduce((a, b) => a + b, 0);
      const eastOffset = cols.slice(0, col).reduce((a, b) => a + b, 0);
      const secN = baseNorthing + (5 * 5280 - northOffset);
      const secE = baseEasting + eastOffset;
      const w = cols[col], h = rows[row];

      const corners = {
        "NW": [secN + h, secE],
        "NE": [secN + h, secE + w],
        "SW": [secN, secE],
        "SE": [secN, secE + w],
        "N¼": [secN + h, secE + w / 2],
        "S¼": [secN, secE + w / 2],
        "E¼": [secN + h / 2, secE + w],
        "W¼": [secN + h / 2, secE],
        "C":   [secN + h / 2, secE + w / 2]
      };

      for (const [label, coords] of Object.entries(corners)) {
        const marker = L.circleMarker([coords[0] / 100000, coords[1] / 100000], {
          radius: 5, color: 'blue', fillOpacity: 0.7
        }).addTo(map);
        marker.bindPopup(`Sec ${secNum} ${label}`);
        marker.on('click', () => handleCornerClick(`S${secNum}_${label}`, coords));
        markers.push(marker);

        if (secNum === originSection && label === originCorner) {
          L.marker([coords[0] / 100000, coords[1] / 100000], {
            title: "Origin Corner"
          }).addTo(map).bindPopup(`Origin: Section ${secNum} ${label}`).openPopup();
        }
      }
    }
  }
}

function handleCornerClick(id, coords) {
  if (!targetCorner) {
    targetCorner = { id, coords };
    updateCornerDisplay();
  } else if (!knownCorners[id]) {
    knownCorners[id] = coords;
    updateCornerDisplay();
  }
}

function updateCornerDisplay() {
  document.getElementById("targetLabel").innerText = targetCorner ? targetCorner.id : "None";
  const known = Object.keys(knownCorners);
  document.getElementById("knownList").innerText = known.length ? known.join(", ") : "None";
}

function weightedProportion(r1, r2, m1, m2) {
  const totalR = r1 + r2, totalM = m1 + m2;
  return (r1 / totalR + m1 / totalM) / 2;
}

function restoreCorner() {
  if (!targetCorner || Object.keys(knownCorners).length < 4) {
    alert("Please select a target corner and at least 4 known corners.");
    return;
  }

  const r = {
    west: parseDistance(document.getElementById("recordW").value),
    east: parseDistance(document.getElementById("recordE").value),
    south: parseDistance(document.getElementById("recordS").value),
    north: parseDistance(document.getElementById("recordN").value)
  };
  const m = {
    west: parseFloat(document.getElementById("measuredW").value),
    east: parseFloat(document.getElementById("measuredE").value),
    south: parseFloat(document.getElementById("measuredS").value),
    north: parseFloat(document.getElementById("measuredN").value)
  };

  if (Object.values(r).some(isNaN) || Object.values(m).some(isNaN)) {
    alert("Please enter all record and measured distances.");
    return;
  }

  const [SW, SE, NW, NE] = ["SW", "SE", "NW", "NE"].map(dir =>
    Object.entries(knownCorners).find(([id]) => id.includes(`_${dir}`))?.[1]
  );

  if (!SW || !SE || !NW || !NE) {
    alert("You must select known SW, SE, NW, and NE corners.");
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
    `<strong>${targetCorner.id}</strong><br>` +
    `Northing: ${finalN.toFixed(3)} ft<br>` +
    `Easting: ${finalE.toFixed(3)} ft`;

  L.marker([finalN / 100000, finalE / 100000], {
    title: "Restored Corner"
  }).addTo(map).bindPopup(`Restored: ${targetCorner.id}`).openPopup();
}
