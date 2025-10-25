// Correct PLSS serpentine grid layout using sectionMap
const gridContainer = document.getElementById("grid");
let selectedSection = null;

const sectionMap = [
  [6, 5, 4, 3, 2, 1],
  [7, 8, 9, 10, 11, 12],
  [18, 17, 16, 15, 14, 13],
  [19, 20, 21, 22, 23, 24],
  [30, 29, 28, 27, 26, 25],
  [31, 32, 33, 34, 35, 36]
];

for (let row = 0; row < 6; row++) {
  for (let col = 0; col < 6; col++) {
    let sectionNum = sectionMap[row][col];
    const cell = document.createElement("div");
    cell.textContent = sectionNum;
    cell.dataset.section = sectionNum;
    cell.onclick = () => {
      selectedSection = sectionNum;
      document.querySelectorAll("#grid div").forEach(d => d.classList.remove("selected"));
      cell.classList.add("selected");
      updateSelectedInfo();
    };
    gridContainer.appendChild(cell);
  }
}

function updateSelectedInfo() {
  const corner = document.getElementById("cornerSelect").value;
  document.getElementById("selectedInfo").textContent =
    `Restoring ${corner} corner of Section ${selectedSection}`;
}

function drawGridAndPoints(aN, bN, cE, dE, restoredN, restoredE) {
  const canvas = document.getElementById("gridCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const spacing = canvas.width / 6;
  ctx.strokeStyle = "#ccc";
  for (let i = 0; i <= 6; i++) {
    ctx.beginPath();
    ctx.moveTo(i * spacing, 0);
    ctx.lineTo(i * spacing, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * spacing);
    ctx.lineTo(canvas.width, i * spacing);
    ctx.stroke();
  }

  function drawPoint(x, y, label) {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#333";
    ctx.font = "12px sans-serif";
    ctx.fillText(label, x + 6, y - 6);
  }

  function normalize(n, min, max) {
    return ((n - min) / (max - min)) * canvas.width;
  }

  const allN = [aN, bN, restoredN].filter(n => !isNaN(n));
  const allE = [cE, dE, restoredE].filter(e => !isNaN(e));
  const minN = Math.min(...allN);
  const maxN = Math.max(...allN);
  const minE = Math.min(...allE);
  const maxE = Math.max(...allE);

  if (allN.length && allE.length) {
    drawPoint(normalize(cE, minE, maxE), canvas.height - normalize(aN, minN, maxN), "A");
    drawPoint(normalize(cE, minE, maxE), canvas.height - normalize(bN, minN, maxN), "B");
    drawPoint(normalize(cE, minE, maxE), canvas.height - normalize(bN, minN, maxN), "C");
    drawPoint(normalize(dE, minE, maxE), canvas.height - normalize(bN, minN, maxN), "D");
    drawPoint(normalize(restoredE, minE, maxE), canvas.height - normalize(restoredN, minN, maxN), "Restored");
  }
}

function calculate() {
  const aN = parseFloat(document.getElementById("aNorthing").value);
  const bN = parseFloat(document.getElementById("bNorthing").value);
  const cE = parseFloat(document.getElementById("cEasting").value);
  const dE = parseFloat(document.getElementById("dEasting").value);
  const rAB = parseFloat(document.getElementById("recordAB").value);
  const mAB = parseFloat(document.getElementById("measuredAB").value);
  const rCD = parseFloat(document.getElementById("recordCD").value);
  const mCD = parseFloat(document.getElementById("measuredCD").value);

  const nsRatio = mAB / rAB;
  const ewRatio = mCD / rCD;

  const restoredNorthing = bN + nsRatio * rAB;
  const restoredEasting = cE + ewRatio * rCD;

  const nsSpan = Math.abs(aN - bN);
  const ewSpan = Math.abs(dE - cE);
  const buffer = 300;
  const validSpans = [2640, 5280, 7920, 10560, 13200, 15840, 18480, 21120, 23760, 26400];

  const feedback = [];
  const math = [];

  if (aN > bN && aN > restoredNorthing) {
    feedback.push("✅ A is north of B and the restored corner.");
  } else {
    feedback.push("⚠️ A should be north of B and the restored corner.");
  }

  if (bN < aN && bN < restoredNorthing) {
    feedback.push("✅ B is south of A and the restored corner.");
  } else {
    feedback.push("⚠️ B should be south of A and the restored corner.");
  }

  if (dE > cE && dE > restoredEasting) {
    feedback.push("✅ D is east of C and the restored corner.");
  } else {
    feedback.push("⚠️ D should be east of C and the restored corner.");
  }

  if (cE < dE && cE < restoredEasting) {
    feedback.push("✅ C is west of D and the restored corner.");
  } else {
    feedback.push("⚠️ C should be west of D and the restored corner.");
  }

  const nsValid = validSpans.some(span => Math.abs(nsSpan - span) <= buffer);
  const ewValid = validSpans.some(span => Math.abs(ewSpan - span) <= buffer);

  feedback.push(nsValid
    ? `✅ NS span (${nsSpan} ft) is within ±${buffer} ft of a valid section multiple.`
    : `⚠️ NS span (${nsSpan} ft) is not near a valid section multiple.`);

  feedback.push(ewValid
    ? `✅ EW span (${ewSpan} ft) is within ±${buffer} ft of a valid section multiple.`
    : `⚠️ EW span (${ewSpan} ft) is not near a valid section multiple.`);

  math.push(`NS Ratio = ${mAB} / ${rAB} = ${nsRatio.toFixed(4)}`);
  math.push(`EW Ratio = ${mCD} / ${rCD} = ${ewRatio.toFixed(4)}`);
  math.push(`Restored Northing = ${bN} + ${nsRatio.toFixed(4)} × ${rAB} = ${restoredNorthing.toFixed(2)}`);
  math.push(`Restored Easting = ${cE} + ${ewRatio.toFixed(4)} × ${rCD} = ${restoredEasting.toFixed(2)}`);
  math.push(`📍 Final Restored Corner: (${restoredNorthing.toFixed(2)}, ${restoredEasting.toFixed(2)})`);

  document.getElementById("feedback").innerHTML = feedback.map(f => `<div>${f}</div>`).join("");
  document.getElementById("mathPreview").innerHTML = math.join("<br/>");

  drawGridAndPoints(aN, bN, cE, dE, restoredNorthing, restoredEasting);
}

document.getElementById("cornerSelect").onchange = updateSelectedInfo;
