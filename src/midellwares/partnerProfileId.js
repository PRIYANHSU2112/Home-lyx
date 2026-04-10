const PDFDocument = require("pdfkit");
const axios = require("axios");
const companyModel = require("../models/commpanyModel");
const { generateAndSaveIdCard } = require("../midellwares/pdfGenerator");
const partnerProfileModel = require("../models/partnerProfileModel");
const { deleteFileFromObjectStorage } = require("./multerMidellware");

// ─── Helper: strip HTML tags from a string ──────────────────────────────────
function stripHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Helper: fetch an image from URL and return a Buffer ────────────────────
async function fetchImageBuffer(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
    return Buffer.from(response.data);
  } catch {
    return null;
  }
}

// ─── Draw a quadratic bezier wave ───────────────────────────────────────────
function drawWave(doc, startX, startY, cpX, cpY, endX, endY) {
  doc.moveTo(startX, startY);
  doc.quadraticCurveTo(cpX, cpY, endX, endY);
}

// ─── Build the ID Card PDF using PDFKit ─────────────────────────────────────
exports.partnerIdCard = async (Data) => {
  const [data, company] = await Promise.all([
    partnerProfileModel.findOne({ userId: Data }).populate("cityId userId"),
    companyModel.findOne(),
  ]);

  if (data?.idCard) {
    deleteFileFromObjectStorage(data?.idCard);
  }

  // ── Fetch images in parallel ──
  const S3_BASE = "https://leadkart.in-maa-1.linodeobjects.com/";
  const [logoBuffer, selfieBuffer] = await Promise.all([
    company?.header_logo ? fetchImageBuffer(S3_BASE + company.header_logo) : null,
    data?.selfie?.image ? fetchImageBuffer(S3_BASE + data.selfie.image) : null,
  ]);

  // ── Generate PDF ──
  const code = "IdCard" + new Date().getTime();

  const pdfBuffer = await buildIdCardPDF({ data, company, logoBuffer, selfieBuffer });

  // Upload via the shared S3 uploader in pdfGenerator.js
  await generateAndSaveIdCard({ buffer: pdfBuffer, code });

  return code;
};

// ═════════════════════════════════════════════════════════════════════════════
//  PDFKit ID Card Builder
// ═════════════════════════════════════════════════════════════════════════════

function buildIdCardPDF({ data, company, logoBuffer, selfieBuffer }) {
  return new Promise((resolve, reject) => {
    try {
      const cardW = 360;
      const cardH = 640;

      const doc = new PDFDocument({
        size: [cardW, cardH],
        margin: 0,
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ─── Colors ───
      const DARK = "#0d1b2a";
      const DARK_MID = "#1a2535";
      const BLUE = "#29b6e8";
      const WHITE = "#ffffff";
      const LABEL_COLOR = "#1a2535";
      const VAL_COLOR = "#444444";
      const FOOTER_LABEL = "#8899bb";
      const FOOTER_VAL = "#d8e2ee";

      const padX = 24;

      // ═══════════════════════════════════════
      //  TOP DARK SECTION (gradient-like)
      // ═══════════════════════════════════════
      const topDarkH = 120;

      // Darker base
      doc.rect(0, 0, cardW, topDarkH + 40).fill(DARK);
      // Slightly lighter overlay at top
      doc.save();
      doc.rect(0, 0, cardW, topDarkH).fill(DARK_MID);
      doc.restore();

      // ── Company logo + name ──
      let brandTextX = padX;
      const logoY = 18;
      const logoSize = 28;

      if (logoBuffer) {
        try {
          doc.save();
          doc.roundedRect(padX, logoY, logoSize, logoSize, 5).clip();
          doc.image(logoBuffer, padX, logoY, { width: logoSize, height: logoSize });
          doc.restore();
          brandTextX = padX + logoSize + 10;
        } catch {
          brandTextX = padX;
        }
      }

      doc
        .fillColor(WHITE)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text((company?.site_name || "COMPANY").toUpperCase(), brandTextX, logoY + 7, {
          width: cardW - brandTextX - padX,
        });

      // ═══════════════════════════════════════
      //  TOP WAVE: dark → blue → white
      // ═══════════════════════════════════════
      const waveTopY = topDarkH;
      const waveH = 35;

      // Blue S-curve band
      doc.save();
      doc.moveTo(0, waveTopY);
      doc.lineTo(cardW, waveTopY);
      doc.lineTo(cardW, waveTopY + waveH * 0.55);
      doc.quadraticCurveTo(cardW * 0.75, waveTopY + waveH * 0.95, cardW * 0.5, waveTopY + waveH * 0.68);
      doc.quadraticCurveTo(cardW * 0.25, waveTopY + waveH * 0.4, 0, waveTopY + waveH * 0.82);
      doc.closePath();
      doc.fill(BLUE);
      doc.restore();

      // White fill below wave edge
      doc.save();
      doc.moveTo(0, waveTopY + waveH * 0.65);
      doc.quadraticCurveTo(cardW * 0.25, waveTopY + waveH * 0.38, cardW * 0.5, waveTopY + waveH * 0.68);
      doc.quadraticCurveTo(cardW * 0.75, waveTopY + waveH * 0.95, cardW, waveTopY + waveH * 0.55);
      doc.lineTo(cardW, waveTopY + waveH + 5);
      doc.lineTo(0, waveTopY + waveH + 5);
      doc.closePath();
      doc.fill(WHITE);
      doc.restore();

      // ═══════════════════════════════════════
      //  WHITE BODY
      // ═══════════════════════════════════════
      const bodyY = waveTopY + waveH;
      const bodyH = 275;
      doc.rect(0, bodyY, cardW, bodyH).fill(WHITE);

      // ═══════════════════════════════════════
      //  SELFIE PHOTO (overlapping dark & white)
      // ═══════════════════════════════════════
      const photoSize = 105;
      const photoX = (cardW - photoSize) / 2;
      const photoY = waveTopY - photoSize * 0.45; // Overlaps: ~45% in dark, ~55% into wave/white

      // Photo frame border (dark blue ring)
      doc.save();
      doc
        .roundedRect(photoX - 4, photoY - 4, photoSize + 8, photoSize + 8, 16)
        .fillAndStroke(DARK_MID, "#2a3a50");
      doc.restore();

      // Photo or placeholder
      if (selfieBuffer) {
        try {
          doc.save();
          doc.roundedRect(photoX, photoY, photoSize, photoSize, 13).clip();
          doc.image(selfieBuffer, photoX, photoY, {
            width: photoSize,
            height: photoSize,
            cover: [photoSize, photoSize],
          });
          doc.restore();
        } catch {
          drawPhotoPlaceholder(doc, photoX, photoY, photoSize, data?.name);
        }
      } else {
        drawPhotoPlaceholder(doc, photoX, photoY, photoSize, data?.name);
      }

      // ═══════════════════════════════════════
      //  NAME & SUBTITLE (below photo)
      // ═══════════════════════════════════════
      const nameY = photoY + photoSize + 10;

      doc
        .fillColor(LABEL_COLOR)
        .fontSize(19)
        .font("Helvetica-Bold")
        .text(data?.name || "Partner Name", 0, nameY, {
          width: cardW,
          align: "center",
        });

      doc
        .fillColor(BLUE)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(((company?.site_name || "") + " SERVICES").toUpperCase(), 0, nameY + 22, {
          width: cardW,
          align: "center",
          characterSpacing: 2.5,
        });

      // ═══════════════════════════════════════
      //  INFO ROWS
      // ═══════════════════════════════════════
      const infoStartY = nameY + 46;
      const rowGap = 30;
      const labelX = padX + 4;
      const sepX = labelX + 92;
      const valX = sepX + 14;
      const valW = cardW - valX - padX;

      const infoRows = [
        { label: "Partner id", value: String(data?._id || "") },
        { label: "Email", value: stripHtml(data?.email || "") },
        { label: "Phone Number", value: String(data?.phoneNumber || "") },
        { label: "Address", value: stripHtml(data?.address || "") },
        { label: "Pincode", value: stripHtml(data?.pincode || "") },
      ];

      infoRows.forEach((row, i) => {
        const y = infoStartY + i * rowGap;

        // Separator line between rows
        if (i > 0) {
          doc
            .moveTo(labelX, y - 8)
            .lineTo(cardW - padX, y - 8)
            .lineWidth(0.4)
            .strokeColor("#e8ecf0")
            .stroke();
        }

        // Label (bold)
        doc
          .fillColor(LABEL_COLOR)
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(row.label, labelX, y);

        // Colon separator
        doc
          .fillColor(LABEL_COLOR)
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(":", sepX, y);

        // Value
        doc
          .fillColor(VAL_COLOR)
          .fontSize(11)
          .font("Helvetica")
          .text(row.value, valX, y, { width: valW });
      });

      // ═══════════════════════════════════════
      //  BOTTOM WAVE: white → blue → dark
      // ═══════════════════════════════════════
      const bottomWaveY = bodyY + bodyH;
      const bottomWaveH = 35;

      // 1) Fill zone white first
      doc.rect(0, bottomWaveY, cardW, bottomWaveH).fill(WHITE);

      // 2) Dark bottom fill (mirror of top)
      doc.save();
      doc.moveTo(0, bottomWaveY + bottomWaveH * 0.45);
      doc.quadraticCurveTo(cardW * 0.25, bottomWaveY + bottomWaveH * 0.72, cardW * 0.5, bottomWaveY + bottomWaveH * 0.45);
      doc.quadraticCurveTo(cardW * 0.75, bottomWaveY + bottomWaveH * 0.18, cardW, bottomWaveY + bottomWaveH * 0.55);
      doc.lineTo(cardW, bottomWaveY + bottomWaveH);
      doc.lineTo(0, bottomWaveY + bottomWaveH);
      doc.closePath();
      doc.fill(DARK);
      doc.restore();

      // 3) Blue S-curve band (sits between white & dark)
      doc.save();
      // top edge of blue band
      doc.moveTo(0, bottomWaveY + bottomWaveH * 0.12);
      doc.quadraticCurveTo(cardW * 0.25, bottomWaveY + bottomWaveH * 0.4, cardW * 0.5, bottomWaveY + bottomWaveH * 0.15);
      doc.quadraticCurveTo(cardW * 0.75, bottomWaveY - bottomWaveH * 0.08, cardW, bottomWaveY + bottomWaveH * 0.22);
      // bottom edge of blue band
      doc.lineTo(cardW, bottomWaveY + bottomWaveH * 0.55);
      doc.quadraticCurveTo(cardW * 0.75, bottomWaveY + bottomWaveH * 0.18, cardW * 0.5, bottomWaveY + bottomWaveH * 0.45);
      doc.quadraticCurveTo(cardW * 0.25, bottomWaveY + bottomWaveH * 0.72, 0, bottomWaveY + bottomWaveH * 0.45);
      doc.closePath();
      doc.fill(BLUE);
      doc.restore();

      // ═══════════════════════════════════════
      //  DARK FOOTER
      // ═══════════════════════════════════════
      const footerY = bottomWaveY + bottomWaveH;
      const footerH = cardH - footerY;
      doc.rect(0, footerY, cardW, footerH).fill(DARK);

      // Footer info rows
      const footerPadY = footerY + 10;
      const footerRows = [
        { label: "Contact Us", value: stripHtml(String(company?.phone || "")) },
        { label: "Address", value: stripHtml(company?.address || "") },
      ];

      let footerRowY = footerPadY;
      footerRows.forEach((row) => {
        // Label
        doc
          .fillColor(FOOTER_LABEL)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(row.label, labelX, footerRowY);

        // Colon
        doc
          .fillColor(FOOTER_LABEL)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(":", sepX, footerRowY);

        // Value (may wrap multiple lines)
        doc
          .fillColor(FOOTER_VAL)
          .fontSize(10)
          .font("Helvetica");

        const textHeight = doc.heightOfString(row.value, { width: valW - 55 });
        doc.text(row.value, valX, footerRowY, { width: valW - 55 });
        footerRowY += Math.max(textHeight, 14) + 5;
      });

      // ═══════════════════════════════════════
      //  QR CODE (bottom-right, blue color)
      // ═══════════════════════════════════════
      const qrSize = 48;
      const qrX = cardW - padX - qrSize;
      const qrY = cardH - 18 - qrSize;

      // White rounded background
      doc.save();
      doc.roundedRect(qrX, qrY, qrSize, qrSize, 7).fill(WHITE);
      doc.restore();

      // QR-like pattern using BLUE color
      const s = 9;       // module size
      const g = 3;       // gap between modules
      const ox = qrX + 6;
      const oy = qrY + 6;

      // Top-left finder
      doc.rect(ox, oy, s, s).lineWidth(1.8).strokeColor(BLUE).stroke();
      doc.rect(ox + 2.5, oy + 2.5, s - 5, s - 5).fill(BLUE);

      // Top-right finder
      const trx = ox + s + g + s + g;
      doc.rect(trx, oy, s, s).lineWidth(1.8).strokeColor(BLUE).stroke();
      doc.rect(trx + 2.5, oy + 2.5, s - 5, s - 5).fill(BLUE);

      // Bottom-left finder
      const bly = oy + s + g + s + g;
      doc.rect(ox, bly, s, s).lineWidth(1.8).strokeColor(BLUE).stroke();
      doc.rect(ox + 2.5, bly + 2.5, s - 5, s - 5).fill(BLUE);

      // Center data dots
      const cx = ox + s + g;
      const cy = oy + s + g;
      doc.rect(cx, cy, 4, 4).fill(BLUE);
      doc.rect(cx + 6, cy, 4, 4).fill(BLUE);
      doc.rect(cx, cy + 6, 4, 4).fill(BLUE);
      doc.rect(cx + 6, cy + 6, 4, 4).fill(BLUE);

      // Bottom-right data bits
      doc.rect(trx, bly, 4, 4).fill(BLUE);
      doc.rect(trx + 6, bly, 4, 4).fill(BLUE);
      doc.rect(trx + 3, bly + 5, 4, 4).fill(BLUE);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─── Photo placeholder when selfie is not available ─────────────────────────
function drawPhotoPlaceholder(doc, x, y, size, name) {
  doc.save();
  doc.roundedRect(x, y, size, size, 13).fill("#0d1b2a");

  const initials = (name || "P")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  doc
    .fillColor("#29b6e8")
    .fontSize(34)
    .font("Helvetica-Bold")
    .text(initials, x, y + size / 2 - 17, {
      width: size,
      align: "center",
    });

  doc.restore();
}
