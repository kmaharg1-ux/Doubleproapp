document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("townshipCanvas");
  const ctx = canvas.getContext("2d");
  const panzoom = Panzoom(document.getElementById("canvasWrapper"), {
    maxScale: 5,
    minScale: 0.5,
    contain: 'outside',
  });

  let clickedPoints = [];
  let originEasting = null;
  let originNorthing = null;
  const CHAIN = 66;
  const SECTION_WIDTH = 80 * CHAIN;

  function setAnchor() {
    originEasting = parseFloat(document.getElementById("eA").value);
    originNorthing = parseFloat(document.getElementById("nA").value);
    if (isNaN(originEasting) || isNaN(originNorthing)) {
      alert("Please enter valid coordinates for Point A.");
      return;
    }
    document.getElementById("stepPrompts").style.display = "block";
    drawGrid();
  }

  function drawGrid() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "12px Arial";

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        let x = col * 100;
        let y = row * 100;
        ctx.strokeRect(x, y, 100, 100);
        let sectionNum = row % 2 === 0 ? row * 6 + col + 1 : row * 6 + (5 - col) + 1;
        ctx.fillText(`Sec. ${sectionNum}`, x + 30, y + 15);
        drawCorners(x, y);
      }
    }

    drawFractionals();
    drawClickedPoints();
  }

  function drawFractionals() {
    ctx.strokeStyle = "#ccc";
    for (let i = 0; i <= 600; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 600);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(600, i);
      ctx.stroke();
    }
    ctx.strokeStyle = "#000";
  }

  function drawCorners(x, y) {
    const points = [
      [x, y], [x + 100, y], [x, y + 100], [x + 100, y + 100],
      [x + 50, y], [x + 50, y + 100], [x, y + 50], [x + 100, y + 50]
    ];
    points.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "black";
      ctx.fill();
    });
  }

  canvas.addEventListener("mousemove", function (event) {
    if (originEasting === null || originNorthing === null) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const easting = originEasting + (x / 100) * SECTION_WIDTH;
    const northing = originNorthing - (y / 100) * SECTION_WIDTH;
    document.getElementById("liveCoords").innerText =
      `Live Coordinates → Easting: ${easting.toFixed(2)}, Northing: ${northing.toFixed(2)}`;
  });

  canvas.addEventListener("click", function (event) {
    const rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    let label = `Point ${String.fromCharCode(65 + clickedPoints.length)}`;
    const snap = getSnapSuggestion(x, y);
    if (snap) {
      if (confirm(`Snap to ${snap.label}?`)) {
        x = snap.x;
        y = snap.y;
        label = snap.label;
      }
    }

    clickedPoints.push({ x, y, label });
    updatePointLabels();
    drawGrid();
  });

  function getSnapSuggestion(x, y) {
    const corners = [
      { x: 0, y: 0, label: "NW corner" },
      { x: 600, y: 0, label: "NE corner" },
      { x: 0, y: 600, label: "SW corner" },
      { x: 600, y: 600, label: "SE corner" },
      { x: 300, y: 0, label: "North ¼ corner" },
      { x: 300, y: 600, label: "South ¼ corner" },
      { x: 0, y: 300, label: "West ¼ corner" },
      { x: 600, y: 300, label: "East ¼ corner" }
    ];
    for (let pt of corners) {
      const dist = Math.hypot(x - pt.x, y - pt.y);
      if (dist < 20) return pt;
    }
    return null;
  }

  function updatePointLabels() {
    let text = clickedPoints.map(pt => pt.label).join("\n");
    document.getElementById("pointLabels").innerText = text;
  }

  function validateDistance(d, label) {
    if (d > 80.9) {
      alert(`⚠️ ${label} distance exceeds 80.9 chains. Confirm if this is correct for a fractional section.`);
    }
  }

  function restoreLostCorner() {
    const eA = parseFloat(document.getElementById("eA").value);
    const nA = parseFloat(document.getElementById("nA").value);
    const eB = parseFloat(document.getElementById("eB").value);
    const nB = parseFloat(document.getElementById("nB").value);
    const eC = parseFloat(document.getElementById("eC").value);
    const nC = parseFloat(document.getElementById("nC").value);
    const eD = parseFloat(document.getElementById("eD").value);
    const nD = parseFloat(document.getElementById("nD").value);
    const dA = parseFloat(document.getElementById("dA").value);
    const dB = parseFloat(document.getElementById("dB").value);
    const dC = parseFloat(document.getElementById("dC").value);
    const dD = parseFloat(document.getElementById("dD").value);

    if ([eA,nA,eB,nB,eC,nC,eD,nD,dA,dB,dC,dD].some(isNaN)) {
      alert("Please fill out all coordinates and distances.");
      return;
    }

    validateDistance(dA, "A→Lost");
    validateDistance(dB, "B→Lost");
    validateDistance(dC, "C→Lost");
    validateDistance(dD, "D→Lost");

    const totalNS = dA + dB;
    const propNS = dA / totalNS;
    const restoredN = nA + propNS * (nB - nA);

    const totalEW = dC + dD;
    const propEW = dC / totalEW;
    const restoredE = eC + propEW * (eD - eC);

    const canvasX = (restoredE - originEasting) / SECTION_WIDTH * 100;
    const canvasY = (originNorthing - restoredN) / SECTION_WIDTH * 100;

    clickedPoints.push({
      x: canvasX,
      y: canvasY,
      label: "Restored Lost Corner"
    });

    updatePointLabels();
    drawGrid();
    document.getElementById("result").innerText =
      `Restored Coordinates:\nEasting: ${restoredE.toFixed(2)}, Northing: ${restoredN.toFixed(2)}`;
  }

  function undoLast() {
    if (clickedPoints.length > 0) {
      clickedPoints.pop();
      updatePointLabels();
      drawGrid();
    }
  }

  function resetAll() {
    clickedPoints = [];
    originEasting = null;
    originNorthing = null;
    document.getElementById("stepPrompts").style.display = "none";
    document.getElementById("result").innerText = "";
    document.getElementById("pointLabels").innerText = "";
    document.getElementById("liveCoords").innerText = "";
    ["eA","nA","eB","nB","eC","nC","eD","nD","dA","dB","dC","dD"].forEach(id => document.getElementById(id).value = "");
  }
    ["eA","nA","eB","nB","eC","nC","eD","nD","dA","dB","dC","dD"].forEach(id => {
      document.getElementById(id).value = "";
    });
  }
});
