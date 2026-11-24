// utils/pdfUtil.js - SMVEC Official Digital Gate Pass (Single Page)
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const axios = require("axios");

// ── Palette ──────────────────────────────────────────────────────────────────
const NAVY       = "#0b2447";
const GOLD       = "#b8902f";
const GOLD_LIGHT = "#d9b35c";
const INK        = "#1c1c1c";
const SLATE      = "#5b6472";
const RULE       = "#c9ccd2";
const PAPER      = "#fafaf8";
const PANEL      = "#f2f0ea";
const GREEN      = "#1a6e42";
const RED        = "#a32626";
const AMBER      = "#a36a12";
const WHITE      = "#ffffff";

const COLLEGE_LOGO_URL = "https://smvec.ac.in/webchat/IMG_20240503_090818-removebg-preview.png";

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(s = "") {
  const v = s.toLowerCase();
  if (v.includes("reject") || v.includes("denied")) return RED;
  if (v.includes("pending")) return AMBER;
  return GREEN;
}
function statusLabel(s = "") {
  const v = s.toLowerCase();
  if (v.includes("reject") || v.includes("denied")) return "REJECTED";
  if (v.includes("pending")) return "PENDING";
  return "APPROVED";
}

function hairline(doc, x, y, w, color = RULE, lw = 0.6) {
  doc.moveTo(x, y).lineTo(x + w, y).lineWidth(lw).stroke(color);
}

function doubleRule(doc, x, y, w) {
  doc.moveTo(x, y    ).lineTo(x + w, y    ).lineWidth(1.2).stroke(GOLD);
  doc.moveTo(x, y + 3).lineTo(x + w, y + 3).lineWidth(0.4).stroke(GOLD_LIGHT);
}

/** Section label with left gold bar */
function sectionHead(doc, x, y, w, label) {
  doc.rect(x, y, 3, 11).fill(GOLD);
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(8.5)
     .text(label, x + 9, y + 0.5, { characterSpacing: 0.5 });
  hairline(doc, x, y + 14, w, RULE, 0.6);
}

/** Two-column data row */
function row(doc, x, y, w, label, value, lw = 100) {
  doc.fillColor(SLATE).font("Helvetica-Bold").fontSize(7)
     .text(label.toUpperCase(), x, y, { width: lw, characterSpacing: 0.2 });
  doc.fillColor(INK).font("Helvetica").fontSize(8.5)
     .text(value || "N/A", x + lw, y - 0.5, { width: w - lw });
}

/** Diagonal watermark tiles */
function watermark(doc, pw, ph) {
  doc.save();
  doc.opacity(0.035);
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(26);
  for (let yy = -80; yy < ph + 80; yy += 120) {
    for (let xx = -80; xx < pw + 80; xx += 200) {
      doc.save(); doc.translate(xx, yy); doc.rotate(-30);
      doc.text("SMVEC", 0, 0);
      doc.restore();
    }
  }
  doc.opacity(1); doc.restore();
}

/** Circular seal */
function seal(doc, cx, cy, r) {
  doc.save(); doc.opacity(0.88);
  doc.circle(cx, cy, r    ).lineWidth(1.1).stroke(NAVY);
  doc.circle(cx, cy, r - 4).lineWidth(0.5).stroke(NAVY);

  const arcText  = "SRI MANAKULA VINAYAGAR ENGINEERING COLLEGE";
  const sa = Math.PI * 1.14, ea = Math.PI * 1.86;
  const tr = r - 10;
  for (let i = 0; i < arcText.length; i++) {
    const t  = sa + (ea - sa) * (i / (arcText.length - 1));
    const px = cx + tr * Math.cos(t);
    const py = cy + tr * Math.sin(t);
    doc.save(); doc.translate(px, py); doc.rotate((t * 180) / Math.PI + 90);
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(4.2).text(arcText[i], -1.5, -1.5);
    doc.restore();
  }
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(7)
     .text("VERIFIED", cx - r + 4, cy - 7, { width: (r - 4) * 2, align: "center" });
  doc.fillColor(NAVY).font("Helvetica").fontSize(5)
     .text("GATE PASS", cx - r + 4, cy + 3, { width: (r - 4) * 2, align: "center" });
  doc.opacity(1); doc.restore();
}

// ── Main export ───────────────────────────────────────────────────────────────

exports.generateGatePassPDFBuffer = async (gp) => {
  return new Promise(async (resolve, reject) => {
    try {
      const buffers = [];
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        layout: "portrait",
        info: {
          Title:   `Gate Pass – ${gp.passId}`,
          Author:  "Sri Manakula Vinayagar Engineering College",
          Subject: "Digital Gate Pass",
        },
      });
      doc.on("data", (c) => buffers.push(c));
      doc.on("end",  ()  => resolve(Buffer.concat(buffers)));

      const PW = doc.page.width;   // 595.28
      const PH = doc.page.height;  // 841.89
      const MX = 32;               // horizontal margin
      const CW = PW - MX * 2;     // content width ≈ 531

      // ── Background & outer frame ─────────────────────────────────────────
      doc.rect(0, 0, PW, PH).fill(PAPER);
      watermark(doc, PW, PH);
      doc.rect(16, 16, PW - 32, PH - 32).lineWidth(1.2).stroke(NAVY);
      doc.rect(20, 20, PW - 40, PH - 40).lineWidth(0.5).stroke(GOLD);

      let y = 30;

      // ── 1. Header ────────────────────────────────────────────────────────
      
      // Fetch and display college logo on top right
      let logoBuffer = null;
      try {
        const response = await axios.get(COLLEGE_LOGO_URL, {
          responseType: "arraybuffer",
          timeout: 10000,
        });
        logoBuffer = Buffer.from(response.data, "binary");
      } catch (error) {
        console.warn("⚠️ Could not fetch college logo:", error.message);
      }

      // Position logo at top right
      const logoSize = 50;
      const logoX = MX + CW - logoSize;
      const logoY = y;

      if (logoBuffer) {
        try {
          doc.image(logoBuffer, logoX, logoY, {
            fit: [logoSize, logoSize],
            align: "center",
            valign: "center",
          });
        } catch (error) {
          console.warn("⚠️ Could not render logo image:", error.message);
        }
      }

      // Left gold accent bar
      doc.rect(MX, y, 4, 62).fill(GOLD);

      // Institution name block (with reduced width to accommodate logo)
      const textWidth = CW - logoSize - 20;

      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(13.5)
         .text("SRI MANAKULA VINAYAGAR ENGINEERING COLLEGE",
               MX + 14, y + 2, { width: textWidth });

      doc.fillColor(SLATE).font("Helvetica").fontSize(7.2)
         .text(
           "Autonomous Institution  |  Affiliated to Pondicherry University  |  NAAC 'A' Grade  |  NBA Accredited",
           MX + 14, y + 20, { width: textWidth }
         );
      doc.fillColor(SLATE).font("Helvetica").fontSize(7)
         .text(
           "Established 1999  •  Silver Jubilee Institution  •  TCS Accredited",
           MX + 14, y + 32, { width: textWidth }
         );
      doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(7.5)
         .text("OFFICE OF STUDENT AFFAIRS", MX + 14, y + 46,
               { characterSpacing: 0.6, width: textWidth });

      y += 72;
      doubleRule(doc, MX, y, CW);
      y += 10;

      // ── 2. Pass ID + Status strip ────────────────────────────────────────
      const stripH = 26;
      doc.rect(MX, y, CW, stripH).fill(PANEL);
      doc.rect(MX, y, CW, stripH).lineWidth(0.6).stroke(RULE);
      doc.rect(MX, y, 3, stripH).fill(NAVY);

      doc.fillColor(SLATE).font("Helvetica-Bold").fontSize(6.5)
         .text("PASS NO.", MX + 12, y + 4);
      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11.5)
         .text(gp.passId || "N/A", MX + 12, y + 12);

      const sc = statusColor(gp.status);
      const sl = statusLabel(gp.status);
      const sbW = 100, sbX = MX + CW - sbW - 10;
      doc.roundedRect(sbX, y + 5, sbW, stripH - 10, 2).lineWidth(1).stroke(sc);
      doc.fillColor(sc).font("Helvetica-Bold").fontSize(8.5)
         .text(sl, sbX, y + 9, { width: sbW, align: "center" });

      y += stripH + 14;

      // ── 3. Two-column body (Student Info | Pass Details) ──────────────────
      const colGap = 14;
      const half   = (CW - colGap) / 2;

      // Left column — Student Info
      sectionHead(doc, MX, y, half, "STUDENT INFORMATION");
      let ly = y + 19;
      const sInfo = [
        ["Student Name",   gp.student?.name        || "N/A"],
        ["Student ID",     gp.student?.studentId   || "N/A"],
        ["Department",     gp.department           || "N/A"],
        ["Year / Section", `${gp.student?.year || "N/A"}  ·  ${gp.student?.section || "N/A"}`],
        ["Mobile",         gp.student?.mobile      || "N/A"],
      ];
      sInfo.forEach(([l, v]) => { row(doc, MX, ly, half, l, v, 90); ly += 16; });

      // Right column — Pass Details
      const rx = MX + half + colGap;
      sectionHead(doc, rx, y, half, "PASS DETAILS");
      let ry = y + 19;
      const pInfo = [
        ["Reason for Exit",  gp.reason      || "N/A"],
        ["Destination",      gp.destination || "N/A"],
        ["Out Time",         gp.outTime        ? new Date(gp.outTime).toLocaleString("en-IN") : "N/A"],
        ["Expected Return",  gp.expectedReturnTime ? new Date(gp.expectedReturnTime).toLocaleString("en-IN") : "N/A"],
        ["Emergency Pass",   gp.emergency ? "YES – URGENT" : "No"],
      ];
      pInfo.forEach(([l, v]) => { row(doc, rx, ry, half, l, v, 90); ry += 16; });

      y = Math.max(ly, ry) + 12;
      hairline(doc, MX, y, CW, GOLD_LIGHT, 0.8);
      y += 14;

      // ── 4. Approval block (left) + QR (right) ────────────────────────────
      const qrW    = 108;
      const leftW  = CW - qrW - 16;

      sectionHead(doc, MX, y, leftW, "APPROVAL & VERIFICATION");
      y += 20;

      const apY = y;
      const apInfo = [
        ["Approved By", gp.approalBy      || "HOD"],
        ["Approved On", gp.approvalAt ? new Date(gp.approvalAt).toLocaleString("en-IN") : "N/A"],
        ["Remarks",     gp.approvalRemarks || "Approved"],
      ];
      apInfo.forEach(([l, v]) => { row(doc, MX, y, leftW, l, v, 85); y += 15; });

      y += 6;
      doc.fillColor(SLATE).font("Helvetica-Bold").fontSize(6.5)
         .text("AUTHORIZED SIGNATORY", MX, y);
      y += 14;

      // Signature
      if (gp.approvalSignatureUrl) {
        try {
          const res = await axios.get(gp.approvalSignatureUrl, { responseType: "arraybuffer", timeout: 4000 });
          doc.image(Buffer.from(res.data, "binary"), MX, y - 14, { fit: [110, 20] });
        } catch {
          doc.fillColor(SLATE).font("Helvetica-Oblique").fontSize(7)
             .text("(Signature on file)", MX, y - 8);
        }
      } else {
        doc.fillColor(SLATE).font("Helvetica-Oblique").fontSize(7)
           .text("(Signature on file)", MX, y - 8);
      }

      hairline(doc, MX, y, leftW * 0.55);
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(7.5)
         .text(gp.apprvalBy || "Head of Department", MX, y + 3);

      // QR card
      const qrCardX = MX + leftW + 16;
      const qrCardY = apY - 6;
      const qrCardH = 118;

      doc.rect(qrCardX, qrCardY, qrW, qrCardH).lineWidth(0.6).stroke(RULE);
      doc.rect(qrCardX, qrCardY, qrW, 14).fill(NAVY);
      doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(6)
         .text("SCAN TO VERIFY", qrCardX, qrCardY + 4, { width: qrW, align: "center", characterSpacing: 0.5 });

      const qrSize = qrW - 20;
      const qrData = await QRCode.toDataURL(gp.qrPayload || gp.passId || "SMVEC-GATEPASS", {
        width: 280, margin: 0, color: { dark: NAVY, light: WHITE },
      });
      doc.image(
        Buffer.from(qrData.replace(/^data:image\/png;base64,/, ""), "base64"),
        qrCardX + 10, qrCardY + 20, { fit: [qrSize, qrSize] }
      );
      doc.fillColor(SLATE).font("Helvetica").fontSize(5.5)
         .text(gp.passId || "", qrCardX, qrCardY + qrSize + 26, { width: qrW, align: "center" });

      y = Math.max(y + 18, qrCardY + qrCardH) + 14;

      // ── 5. Seal + disclaimer ──────────────────────────────────────────────
      hairline(doc, MX, y, CW, RULE, 0.6);
      y += 10;

      const sealR  = 34;
      const sealCX = MX + CW - sealR - 4;
      const sealCY = y + sealR + 2;

      seal(doc, sealCX, sealCY, sealR);

      doc.fillColor(SLATE).font("Helvetica-Oblique").fontSize(7)
         .text(
           "This pass bears the digital seal of SMVEC and is valid without a physical stamp. " +
           "Present this document along with your College ID Card at the gate.",
           MX, y + 10, { width: CW - sealR * 2 - 18, lineGap: 2 }
         );

      y = sealCY + sealR + 14;

      // ── 6. Terms ──────────────────────────────────────────────────────────
      hairline(doc, MX, y, CW, RULE, 0.6);
      y += 8;

      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(7.5)
         .text("TERMS & CONDITIONS", MX, y, { characterSpacing: 0.3 });
      y += 12;

      const terms = [
        "Valid only for the date and period specified above.",
        "Carry your SMVEC ID Card with this pass at all times.",
        "Non-transferable — strictly personal use only.",
        "QR code is subject to verification at the gate by security personnel.",
        "Misuse or forgery will invite immediate disciplinary action.",
      ];
      const tCols = 2, tColW = (CW - 10) / tCols;
      terms.forEach((t, i) => {
        const cx = MX + (i % tCols) * (tColW + 10);
        const cy = y + Math.floor(i / tCols) * 11;
        doc.fillColor(SLATE).font("Helvetica").fontSize(6.8)
           .text(`• ${t}`, cx, cy, { width: tColW });
      });

      y += (Math.ceil(terms.length / tCols)) * 11 + 10;

      // ── 7. Footer ─────────────────────────────────────────────────────────
      hairline(doc, MX, y, CW, GOLD_LIGHT, 0.9);
      y += 7;

      doc.fillColor(SLATE).font("Helvetica").fontSize(6.5)
         .text(
           "Generated: " + new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
           MX, y, { width: CW / 2 }
         );
      doc.fillColor(SLATE).font("Helvetica").fontSize(6.5)
         .text("SMVEC Digital Gate Pass System", MX + CW / 2, y, { width: CW / 2, align: "right" });

      y += 11;
      doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(6)
         .text(
           "SRI MANAKULA VINAYAGAR ENGINEERING COLLEGE — OFFICIAL DOCUMENT — PONDICHERRY",
           MX, y, { width: CW, align: "center", characterSpacing: 0.4 }
         );

      console.log("✅ SMVEC gate pass generated:", gp.passId);
      doc.end();
    } catch (err) {
      console.error("PDF Generation Error:", err);
      reject(err);
    }
  });
};