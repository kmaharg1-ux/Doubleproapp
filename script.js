function calculate() {
  // Grab inputs
  const aN = parseFloat(document.getElementById("aNorthing").value);
  const bN = parseFloat(document.getElementById("bNorthing").value);
  const cE = parseFloat(document.getElementById("cEasting").value);
  const dE = parseFloat(document.getElementById("dEasting").value);
  const rAB = parseFloat(document.getElementById("recordAB").value);
  const mAB = parseFloat(document.getElementById("measuredAB").value);
  const rCD = parseFloat(document.getElementById("recordCD").value);
  const mCD = parseFloat(document.getElementById("measuredCD").value);

  // Calculate ratios
  const nsRatio = mAB / rAB;
  const ewRatio = mCD / rCD;

  // Calculate restored coordinates
  const restoredNorthing = bN + nsRatio * rAB;
  const restoredEasting = cE + ewRatio * rCD;

  // Section span validation
  const nsSpan = Math.abs(aN - bN);
  const ewSpan = Math.abs(dE - cE);
  const buffer = 300;
  const validSpans = [2640, 5280, 7920, 10560, 13200, 15840, 18480, 21120, 23760, 26400];

  const feedback = [];
  const math = [];

  // Directional validation
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

  // Section span checks
  const nsValid = validSpans.some(span => Math.abs(nsSpan - span) <= buffer);
  const ewValid = validSpans.some(span => Math.abs(ewSpan - span) <= buffer);

  feedback.push(nsValid
    ? `✅ NS span (${nsSpan} ft) is within ±${buffer} ft of a valid section multiple.`
    : `⚠️ NS span (${nsSpan} ft) is not near a valid section multiple.`);

  feedback.push(ewValid
    ? `✅ EW span (${ewSpan} ft) is within ±${buffer} ft of a valid section multiple.`
    : `⚠️ EW span (${ewSpan} ft) is not near a valid section multiple.`);

  // Math preview
  math.push(`NS Ratio = ${mAB} / ${rAB} = ${nsRatio.toFixed(4)}`);
  math.push(`EW Ratio = ${mCD} / ${rCD} = ${ewRatio.toFixed(4)}`);
  math.push(`Restored Northing = ${bN} + ${nsRatio.toFixed(4)} × ${rAB} = ${restoredNorthing.toFixed(2)}`);
  math.push(`Restored Easting = ${cE} + ${ewRatio.toFixed(4)} × ${rCD} = ${restoredEasting.toFixed(2)}`);
  math.push(`📍 Final Restored Corner: (${restoredNorthing.toFixed(2)}, ${restoredEasting.toFixed(2)})`);

  // Output
  document.getElementById("feedback").innerHTML = feedback.map(f => `<div>${f}</div>`).join("");
  document.getElementById("mathPreview").innerHTML = math.join("<br/>");
}
