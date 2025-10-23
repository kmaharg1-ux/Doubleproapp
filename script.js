const grid = document.getElementById("grid");

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

function getCornerOffset(corner) {
  const offset = {
    NW: [10, 10],
    NE: [90, 10],
    SW: [10, 90],
    SE: [90, 90],
    N:  [50, 10],
    S:  [50, 90],
    E:  [90, 50],
    W:  [10, 50],
    C:  [50, 50]
  };
  return offset[corner] || [50, 50];
}

function getGridPosition(section, corner) {
  const cell = [...grid.children].find(c => c.dataset.section == section);
  if (!cell) return null;

  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const [dx, dy] = getCornerOffset(corner);

  return { x: col * 100 + dx, y: row * 100 + dy };
}

function placePinAtGridXY(x, y, label, color = "green") {
  const pin = document.createElement("div");
  pin.className = `pin ${color}`;
  pin.style.left = `${x - 5}px`;
  pin.style.top = `${y - 5}px`;
  pin.title = `${label}`;
  grid.appendChild(pin);
}

function placePin(section, corner, label, color = "red") {
  const cell = [...grid.children].find(c => c.dataset.section == section);
  if (!cell) return;

  const [x, y] = getCornerOffset(corner);
  const pin = document.createElement("div");
  pin.className = `pin ${color}`;
  pin.style.left = `${x - 5}px`;
  pin.style.top = `${y - 5}px`;
  pin.title = `${label}: Sec ${section} ${corner}`;
  cell.appendChild(pin);
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
    line.setAttribute("stroke", i === 2 ? "green" : "gray");
    line.setAttribute("stroke-width", 2);
    svg.appendChild(line);
  });
}

function updateAnchors() {
  buildGrid();

  const A = getGridPosition(document.getElementById("sectionA").value, document.getElementById("cornerA").value);
  const B = getGridPosition(document.getElementById("sectionB").value, document.getElementById("cornerB").value);
  const C = getGridPosition(document.getElementById("sectionC").value, document.getElementById("cornerC").value);
  const D = getGridPosition(document.getElementById("sectionD").value, document.getElementById("cornerD").value);

  if (A) placePin(document.getElementById("sectionA").value, document.getElementById("cornerA").value, "A", "red");
  if (B) placePin(document.getElementById("sectionB").value, document.getElementById("cornerB").value, "B", "red");
  if (C) placePin(document.getElementById("sectionC").value, document.getElementById("cornerC").value, "C", "red");
  if (D) placePin(document.getElementById("sectionD").value, document.getElementById("cornerD").value, "D", "red");

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
  ) return;

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
  buildGrid();
}

buildGrid();
