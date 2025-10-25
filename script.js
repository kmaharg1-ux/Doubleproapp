const grid = document.getElementById("grid");
const cornerSelect = document.getElementById("cornerSelect");
const cornerType = document.getElementById("cornerType");
const selectedInfo = document.getElementById("selectedInfo");
const feedback = document.getElementById("feedback");
const mathPreview = document.getElementById("mathPreview");

let selectedSection = null;

function createGrid() {
  for (let i = 36; i >= 1; i--) {
    const cell = document.createElement("div");
    cell.textContent = i;
    cell.onclick = () => selectSection(i, cell);
    grid.appendChild(cell);
  }
}

function selectSection(number, cell) {
  selectedSection = number;
  document.querySelectorAll("#grid div").forEach(div => div.classList.remove("selected"));
  cell.classList.add("selected");
  updateSelectedInfo();
}

function updateCornerOptions() {
  const type = cornerType.value;
  cornerSelect.innerHTML = "";
  const options = type === "Quarter"
    ? ["N", "S", "E", "W"]
    : ["NW", "NE", "SW", "SE"];
  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    cornerSelect.appendChild(option);
  });
  updateSelectedInfo();
}

function updateSelectedInfo() {
  if (selectedSection) {
    const type = cornerType.value;
    const dir = cornerSelect.value;
    selectedInfo.textContent = `Restoring ${dir} ${type} Corner of Section ${selectedSection}`;
  } else {
    selectedInfo.textContent = "";
  }
}

cornerType.onchange = updateCornerOptions;
cornerSelect.onchange = updateSelectedInfo;

function isNear2640Increment(value) {
  const base = 2640;
  const tolerance = 300;
  const ratio = value / base;
  const nearest = Math.round(ratio);
  const target = nearest * base;
  return Math.abs(value - target) <= tolerance;
}

function calculate() {
  feedback.textContent = "";
  mathPreview.textContent = "";

  const A = parseFloat(document.getElementById("aNorthing").value);
  const B = parseFloat(document.getElementById("bNorthing").value);
  const C = parseFloat(document.getElementById("cEasting").value);
  const D = parseFloat(document.getElementById("dEasting").value);
  const recordAB = parseFloat(document.getElementById("recordAB").value);
  const measuredAB = parseFloat(document.getElementById("measuredAB").value);
  const recordCD = parseFloat(document.getElementById("recordCD").value);
  const measuredCD = parseFloat(document.getElementById("measuredCD").value);

  if (isNaN(A) || isNaN(B) || isNaN(C) || isNaN(D) ||
      isNaN(recordAB) || isNaN(measuredAB) || isNaN(recordCD) || isNaN(measuredCD)) {
    feedback.textContent = "⚠️ Please fill in all fields with valid numbers.";
    return;
  }

  if (A >= B) feedback.textContent += "⚠️ Point A should be south of Point B.\n";
  if (C >= D) feedback.textContent += "⚠️ Point C should be west of Point D.\n";

  const inputs = [
    { label: "Record AB", value: recordAB },
    { label: "Measured AB", value: measuredAB },
    { label: "Record CD", value: recordCD },
    { label: "Measured CD", value: measuredCD }
  ];

  const badInputs = inputs.filter(input => !isNear2640Increment(input.value));
  if (badInputs.length > 0) {
    const badLabels = badInputs.map(i => i.label).join(", ");
    feedback.textContent += `⚠️ ${badLabels} are not within ±300 ft of a 2640-ft increment.\n`;
  }

  const nsRatio = measuredAB / recordAB;
  const ewRatio = measuredCD / recordCD;

  const restoredNorthing = B + (nsRatio * recordAB);
  const restoredEasting = D + (ewRatio * recordCD);

  mathPreview.textContent =
    `NS Ratio = ${measuredAB} ÷ ${recordAB} = ${nsRatio.toFixed(6)}\n` +
    `EW Ratio = ${measuredCD} ÷ ${recordCD} = ${ewRatio.toFixed(6)}\n\n` +
    `Restored Northing = ${B} + (${nsRatio.toFixed(6)} × ${recordAB}) = ${restoredNorthing.toFixed(2)}\n` +
    `Restored Easting = ${D} + (${ewRatio.toFixed(6)} × ${recordCD}) = ${restoredEasting.toFixed(2)}`;
}

createGrid();
updateCornerOptions();
