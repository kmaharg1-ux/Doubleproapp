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

function updateAnchors() {
  buildGrid();

  const points = ["A", "B", "C", "D"].map(label => {
    const section = document.getElementById(`section${label}`).value;
    const corner = document.getElementById(`corner${label}`).value;
    if (section && corner) {
      placePin(section, corner, label, "red");
      return getGridPosition(section, corner);
    }
    return null;
  });

  const [A, B, C, D] = points;
  if (!A || !B || !C || !D) return;

  const recordNS = parseFloat(document.getElementById("recordNS").value);
  const measuredNS = parseFloat(document.getElementById("measuredNS").value);
  const recordEW = parseFloat(document.getElementById("recordEW").value);
  const measuredEW = parseFloat(document.getElementById("measuredEW").value);
  if (!recordNS || !measuredNS || !recordEW || !measuredEW) return;

  const nsRatio = measuredNS / recordNS;
  const ewRatio = measuredEW / recordEW;

  const restoredX = C.x + ewRatio * (D.x - C.x);
  const restoredY = A.y + nsRatio * (B.y - A.y);

  const pin = document.createElement("div");
  pin.className = "pin green";
  pin.style.left = `${restoredX - 5}px`;
  pin.style.top = `${restoredY - 5}px`;
  pin.title = `Restored Corner`;
  grid.appendChild(pin);
}

function resetGrid() {
  ["sectionA", "sectionB", "sectionC", "sectionD", "recordNS", "measuredNS", "recordEW", "measuredEW"].forEach(id => {
    document.getElementById(id).value = "";
  });
  buildGrid();
}

buildGrid();
