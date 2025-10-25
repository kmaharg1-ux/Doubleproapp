const grid = document.getElementById("grid");
const mathOutput = document.getElementById("mathOutput");
const restoredCoords = document.getElementById("restoredCoords");

function serpentineSection(row, col) {
  return row % 2 === 0 ? 6 * row + (6 - col) : 6 * row + (col + 1);
}

function buildGrid() {
  grid.innerHTML = "";
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const section = serpentineSection(row, col);
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.section = section;
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.innerText = section;
      grid.appendChild(cell);
    }
  }
}

function getGridPosition(section, corner) {
  const cell = [...grid.children].find(c => c.dataset.section == section);
  if (!cell) return null;

  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const x = col * 100;
  const y = row * 100;

  switch (corner) {
    case "NW": return { x, y };
    case "NE": return { x: x + 100, y };
    case "SW": return { x, y: y + 100 };
    case "SE": return { x: x + 100, y: y + 100 };
    case "N":  return { x: x + 50, y };
    case "S":  return { x: x + 50, y: y + 100 };
    case "E":  return { x: x + 100, y: y + 50 };
    case "W":  return { x, y: y + 50 };
    default:   return null;
  }
}

function placePinAtGridXY(x, y, label, color = "green") {
  const pin = document.createElement("div");
  pin.className = `pin ${color}`;
  pin.style.left = `${x - 8}px`;
  pin.style.top = `${y - 8}px`;
  pin.title = `${label}`;
  grid.appendChild(pin);
}

function drawOverlay(lines) {
  const svg = document.getElementById("overlay");
  svg.innerHTML = "";
  lines.forEach(([x1, y1, x2, y2], i) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", i === 2 ? "green" : "red");
    line.setAttribute("stroke-width", 2.5);
    svg.appendChild(line);
  });
}

let A, B, C, D;

function updateAnchors() {
  buildGrid();

  A = getGridPosition(document.getElementById("sectionA").value, document.getElementById("cornerA").value);
  B = getGridPosition(document.getElementById("sectionB").value, document.getElementById("cornerB").value);
  C = getGridPosition(document.getElementById("sectionC").value, document.getElementById("cornerC").value);
  D = getGridPosition(document.getElementById("sectionD").value, document.getElementById("cornerD").value);

  if (A) placePinAtGridXY(A.x, A.y, "A", "red");
  if (B) placePinAtGridXY(B.x, B.y, "B", "red");
  if (C) placePinAtGridXY(C.x, C.y, "C", "red");
  if (D) placePinAtGridXY(D.x, D.y, "D", "red");

  if (A && B && C && D) {
    drawOverlay([
      [A.x, A.y, B.x, B.y],
      [C.x, C.y, D.x, D.y]
    ]);
  }

  previewMath();
}

function previewMath() {
  const northingA = parseFloat(document.getElementById("northingA").value);
  const northingB = parseFloat(document.getElementById("northingB").value);
  const recordAB = parseFloat(document.getElementById("recordAB").value);
  const measuredAB = parseFloat(document.getElementById("measuredAB").value);

  const eastingC = parseFloat(document.getElementById("eastingC").value);
  const eastingD = parseFloat(document.getElementById("eastingD").value);
  const recordCD = parseFloat(document.getElementById("recordCD").value);
  const measuredCD = parseFloat(document.getElementById("measuredCD").value);

  if (
    isNaN(northingA) || isNaN(northingB) || isNaN(recordAB) || isNaN(measuredAB) ||
    isNaN(eastingC) || isNaN(eastingD) || isNaN(recordCD) || isNaN(measuredCD)
  ) {
    mathOutput.textContent = "Waiting for full inputs to preview math...";
    restoredCoords.textContent = "";
    return;
  }

  const nsRatio = measuredAB / recordAB;
  const ewRatio = measuredCD / recordCD;

  const restoredNorthing = northingA + nsRatio * (northingB - northingA);
  const restoredEasting = eastingC + ewRatio * (eastingD - eastingC);

  mathOutput.textContent = `
Live Math Preview:

1. NS Ratio = Measured AB / Record AB = ${measuredAB} / ${recordAB} = ${nsRatio.toFixed(4)}
2. EW Ratio = Measured CD / Record CD = ${measuredCD} / ${recordCD} = ${ewRatio.toFixed(4)}

3. Restored Northing = ${northingA} + ${nsRatio.toFixed(4)} × (${northingB} - ${northingA})
                     = ${restoredNorthing.toFixed(2)}

4. Restored Easting = ${eastingC} + ${ewRatio.toFixed(4)} × (${eastingD} - ${eastingC})
                    = ${restoredEasting.toFixed(2)}
`;

  restoredCoords.textContent = `Restored Corner:
Northing: ${restoredNorthing.toFixed(2)}
Easting: ${restoredEasting.toFixed(2)}`;
}

function calculateRestoredCorner() {
  previewMath();

  const restoredNorthing = parseFloat(restoredCoords.textContent.match(/Northing: ([\d.]+)/)?.[1]);
  const restoredEasting = parseFloat(restoredCoords.textContent.match(/Easting: ([\d.]+)/)?.[1]);

  if (isNaN(restoredNorthing) || isNaN(restoredEasting)) return;

  const gridX = (restoredEasting / 6000) * 600;
  const gridY = (restoredNorthing / 6000) * 600;

  placePinAtGridXY(gridX, gridY, "Restored Corner", "green");

  drawOverlay([
    [A.x, A.y, B.x, B.y],
    [C.x, C.y, D.x, D.y],
    [gridX, gridY, gridX, gridY]
  ]);
}

function resetGrid() {
  const ids = [
    "sectionA", "cornerA", "northingA",
    "sectionB", "cornerB", "northingB",
    "recordAB", "measuredAB",
    "sectionC", "cornerC", "eastingC",
    "sectionD", "cornerD", "eastingD",
    "recordCD", "measuredCD"
  ];
  ids.forEach(id => document.getElementById(id).value = "");
  document.getElementById("overlay").innerHTML = "";
  mathOutput.textContent = "Fill in inputs to preview restoration math...";
  restoredCoords.textContent = "";
  buildGrid();
}

function handleGridClick(event) {
  const cell = event.target.closest(".cell");
  if (!cell) return;

  const section = cell.dataset.section;
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const rect = cell.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  let corner = null;
  if (x < 33 && y < 33) corner = "NW";
  else if (x > 66 && y < 33) corner = "NE";
  else if (x < 33 && y > 66) corner = "SW";
  else if (x > 66 && y > 66) corner = "SE";
  else if (y < 33) corner = "N";
  else if (y > 66) corner = "S";
  else if (x < 33) corner = "W";
  else if (x > 66) corner = "E";
  else return; // center tap — ignore

  const slots = [
    { section: "sectionA", corner: "cornerA" },
    { section: "sectionB", corner: "cornerB" },
    { section: "sectionC", corner: "cornerC" },
    { section: "sectionD", corner: "cornerD" }
  ];

  for (const slot of slots) {
    const sectionInput = document.getElementById(slot.section);
    const cornerInput = document.getElementById(slot.corner);
    if (!sectionInput.value) {
      sectionInput.value = section;
      cornerInput.value = corner;
      break;
    }
  }

  updateAnchors();
}
buildGrid();
