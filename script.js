const grid = document.getElementById("grid");
const mathOutput = document.getElementById("mathOutput");

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
    case "C":  return { x: x + 50, y: y + 50 };
    default:   return { x: x + 50, y: y + 50 };
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
}

function calculateRestoredCorner() {
  const northingA = parseFloat(document.getElementById("northingA").value);
  const northingB = parseFloat(document.getElementById("northingB").value);
  const recordAB = parseFloat(document.getElementById("recordAB").value);
  const measuredAB = parseFloat(document.getElementById("measuredAB").value);

  const eastingC = parseFloat(document.getElementById("eastingC").value);
  const eastingD = parseFloat(document.getElementById("eastingD").value);
  const recordCD = parseFloat(document.getElementById("recordCD").value);
  const measuredCD = parseFloat(document.getElementById("measuredCD").value);

  if (
    !A || !B || !C || !D ||
    isNaN(northingA) || isNaN(northingB) || isNaN(recordAB) || isNaN(measuredAB) ||
    isNaN(eastingC) || isNaN(eastingD) || isNaN(recordCD) || isNaN(measuredCD)
  ) {
    mathOutput.textContent = "Please fill in all inputs before calculating.";
    return;
  }

  const nsRatio = measuredAB / recordAB;
  const ewRatio = measuredCD / recordCD;

  const restoredNorthing = northingA + nsRatio * (northingB - northingA);
  const restoredEasting = eastingC + ewRatio * (eastingD - eastingC);

  const gridX = (restoredEasting / 6000) * 600;
  const gridY = (restoredNorthing / 6000) * 600;

  placePinAtGridXY(gridX, gridY, "Restored Corner", "green");

  drawOverlay([
    [A.x, A.y, B.x, B.y],
    [C.x, C.y, D.x, D.y],
    [gridX, gridY, gridX, gridY]
  ]);

  mathOutput.textContent = `
Math Breakdown:

1. NS Ratio = Measured AB / Record AB = ${measuredAB} / ${recordAB} = ${nsRatio.toFixed(4)}
2. EW Ratio = Measured CD / Record CD = ${measuredCD} / ${recordCD} = ${ewRatio.toFixed(4)}

3. Restored Northing = A_northing + NS Ratio × (B_northing - A_northing)
                     = ${northingA} + ${nsRatio.toFixed(4)} × (${northingB} - ${northingA})
                     = ${restoredNorthing.toFixed(2)}

4. Restored Easting = C_easting + EW Ratio × (D_easting - C_easting)
                    = ${eastingC} + ${ewRatio.toFixed(4)} × (${eastingD} - ${eastingC})
                    = ${restoredEasting.toFixed(2)}
`;
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
  mathOutput.textContent = "Fill in inputs and click \"Calculate Restored Corner\" to see the math.";
  buildGrid();
}

buildGrid();
