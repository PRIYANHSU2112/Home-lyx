const PDFDocument = require("pdfkit");
const puppeteer = require("puppeteer");
const { Credentials } = require("aws-sdk");
const S3 = require("aws-sdk/clients/s3");
const logger = require("../../tmp/logger");

/**
 * Generate a PDF and upload to S3.
 *
 * Supports two modes:
 * 1) { data, code } → PDFKit invoice (new, no browser needed)
 * 2) { html, code } → Puppeteer HTML-to-PDF (legacy, for ID cards etc.)
 */
exports.generateAndSaveInvoice = async ({ data, html, code }) => {
  try {
    let pdfBuffer;

    if (data) {
      // ── New PDFKit path ───────────────────────────────────────────────
      pdfBuffer = await generateInvoicePDF(data);
    } else if (html) {
      // ── Legacy Puppeteer path (for ID cards, cancel invoices, etc.) ──
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setContent(html);
      pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
      await browser.close();
    } else {
      throw new Error("generateAndSaveInvoice requires either 'data' or 'html'");
    }

    // ── Upload to S3 ────────────────────────────────────────────────────
    const s3Client = new S3({
      region: process.env.LINODE_OBJECT_STORAGE_REGION || "sgp1",
      endpoint:
        process.env.LINODE_OBJECT_STORAGE_ENDPOINT ||
        "https://sgp1.digitaloceanspaces.com",
      sslEnabled: true,
      s3ForcePathStyle: false,
      credentials: new Credentials({
        accessKeyId:
          process.env.LINODE_OBJECT_STORAGE_ACCESS_KEY_ID || "DO00Z942D6M3HUV48DCM",
        secretAccessKey: "psMqLH/f+54S/fiZwewr2IM/ah8f8K+O5PzVjU8mCyw",
      }),
    });

    const params = {
      Bucket: "satyakabir-bucket",
      Key: `${process.env.BUCKET_FOLDER_PATH}${code}.pdf`,
      Body: pdfBuffer,
      ACL: "public-read",
      ContentType: "application/pdf",
    };

    const uploadResult = await s3Client.upload(params).promise();
    logger.info(`Invoice generated and saved successfully : ${uploadResult.Location}`);
    console.log("Upload Success:", uploadResult.Location);
    return uploadResult.Location;
  } catch (error) {
    console.error("Error:", error.message);
    logger.error(`Error: ${error.message}`);
  }
};

/**
 * Upload a pre-built PDF buffer to S3 (used by PDFKit ID card generator).
 */
exports.generateAndSaveIdCard = async ({ buffer, code }) => {
  try {
    const s3Client = new S3({
      region: process.env.LINODE_OBJECT_STORAGE_REGION || "sgp1",
      endpoint:
        process.env.LINODE_OBJECT_STORAGE_ENDPOINT ||
        "https://sgp1.digitaloceanspaces.com",
      sslEnabled: true,
      s3ForcePathStyle: false,
      credentials: new Credentials({
        accessKeyId:
          process.env.LINODE_OBJECT_STORAGE_ACCESS_KEY_ID || "DO00Z942D6M3HUV48DCM",
        secretAccessKey: "psMqLH/f+54S/fiZwewr2IM/ah8f8K+O5PzVjU8mCyw",
      }),
    });

    const params = {
      Bucket: "satyakabir-bucket",
      Key: `${process.env.BUCKET_FOLDER_PATH}${code}.pdf`,
      Body: buffer,
      ACL: "public-read",
      ContentType: "application/pdf",
    };

    const uploadResult = await s3Client.upload(params).promise();
    logger.info(`ID Card generated and saved successfully : ${uploadResult.Location}`);
    console.log("ID Card Upload Success:", uploadResult.Location);
    return uploadResult.Location;
  } catch (error) {
    console.error("ID Card Error:", error.message);
    logger.error(`ID Card Error: ${error.message}`);
  }
};



// ═══════════════════════════════════════════════════════════════════════════
//  PDFKit Invoice Generator
// ═══════════════════════════════════════════════════════════════════════════

function generateInvoicePDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      // ─── HEADER ──────────────────────────────────────────────────────
      doc
        .fillColor("#1a1a2e")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("Tax Invoice", margin, 40);

      // Orange accent line under title
      doc
        .moveTo(margin, 68)
        .lineTo(margin + 120, 68)
        .lineWidth(3)
        .strokeColor("#e67e22")
        .stroke();

      // Company info (top right)
      doc
        .fillColor("#444")
        .fontSize(9)
        .font("Helvetica")
        .text(`Sold By: ${data.soldBy}`, margin, 42, { align: "right" })
        .text(`GSTIN: ${data.gstin}`, { align: "right" })
        .text(data.shipFromAddress, { align: "right" })
        .text(`Phone: ${data.phone}`, { align: "right" })
        .text(`Email: ${data.email}`, { align: "right" });

      // ─── INVOICE META BOX ────────────────────────────────────────────
      const metaY = 110;
      doc
        .roundedRect(margin, metaY, contentWidth, 50, 6)
        .fillAndStroke("#f0f4ff", "#c0cfe8");

      doc
        .fillColor("#1a1a2e")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("Invoice Number:", margin + 12, metaY + 10)
        .font("Helvetica")
        .fillColor("#333")
        .text(data.invoiceNumber, margin + 95, metaY + 10);

      doc
        .fillColor("#1a1a2e")
        .font("Helvetica-Bold")
        .text("Order ID:", margin + 12, metaY + 26)
        .font("Helvetica")
        .fillColor("#333")
        .text(data.orderId, margin + 60, metaY + 26);

      doc
        .fillColor("#1a1a2e")
        .font("Helvetica-Bold")
        .text("Order Date:", pageWidth / 2, metaY + 10)
        .font("Helvetica")
        .fillColor("#333")
        .text(data.orderDate, pageWidth / 2 + 70, metaY + 10);

      doc
        .fillColor("#1a1a2e")
        .font("Helvetica-Bold")
        .text("Invoice Date:", pageWidth / 2, metaY + 26)
        .font("Helvetica")
        .fillColor("#333")
        .text(data.invoiceDate, pageWidth / 2 + 75, metaY + 26);

      // ─── BILL TO / SHIP TO ───────────────────────────────────────────
      const addrY = 178;
      const halfW = contentWidth / 2 - 6;

      // Bill To box
      doc.roundedRect(margin, addrY, halfW, 80, 6).fillAndStroke("#fff8f0", "#f0c080");
      doc
        .fillColor("#e67e22")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Bill To", margin + 12, addrY + 10);
      doc
        .fillColor("#333")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(data.billTo.name, margin + 12, addrY + 26);
      doc
        .font("Helvetica")
        .fillColor("#555")
        .text(data.billTo.address, margin + 12, addrY + 40, { width: halfW - 24 })
        .text(`Phone: ${data.billTo.phone}`, margin + 12, addrY + 64);

      // Ship To box
      const shipX = margin + halfW + 12;
      doc.roundedRect(shipX, addrY, halfW, 80, 6).fillAndStroke("#f0fff4", "#80c0a0");
      doc
        .fillColor("#27ae60")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Ship To", shipX + 12, addrY + 10);
      doc
        .fillColor("#333")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(data.shipTo.name, shipX + 12, addrY + 26);
      doc
        .font("Helvetica")
        .fillColor("#555")
        .text(data.shipTo.address, shipX + 12, addrY + 40, { width: halfW - 24 })
        .text(`Phone: ${data.shipTo.phone}`, shipX + 12, addrY + 64);

      // ─── ITEMS TABLE ─────────────────────────────────────────────────
      const tableY = 278;

      // Determine columns based on checkState (CGST+SGST vs IGST)
      let cols;
      let headers;

      if (data.checkState) {
        cols = {
          sno:      { x: margin,       w: 30  },
          title:    { x: margin + 30,  w: 140 },
          qty:      { x: margin + 170, w: 35  },
          gross:    { x: margin + 205, w: 55  },
          discount: { x: margin + 260, w: 55  },
          taxable:  { x: margin + 315, w: 55  },
          cgst:     { x: margin + 370, w: 45  },
          sgst:     { x: margin + 415, w: 45  },
          total:    { x: margin + 460, w: 55  },
        };
        headers = ["S.No", "Title", "Qty", "Gross (Rs)", "Disc (Rs)", "Taxable (Rs)", "CGST (Rs)", "SGST (Rs)", "Total (Rs)"];
      } else {
        cols = {
          sno:      { x: margin,       w: 30  },
          title:    { x: margin + 30,  w: 165 },
          qty:      { x: margin + 195, w: 35  },
          gross:    { x: margin + 230, w: 60  },
          discount: { x: margin + 290, w: 60  },
          taxable:  { x: margin + 350, w: 60  },
          igst:     { x: margin + 410, w: 50  },
          total:    { x: margin + 460, w: 55  },
        };
        headers = ["S.No", "Title", "Qty", "Gross (Rs)", "Disc (Rs)", "Taxable (Rs)", "IGST (Rs)", "Total (Rs)"];
      }

      const colKeys = Object.keys(cols);

      // Total items label
      doc
        .fillColor("#444")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(`Total Items: ${data.items.length}`, margin, tableY - 16);

      // Header row
      doc
        .roundedRect(margin, tableY, contentWidth, 24, 4)
        .fill("#1a1a2e");

      headers.forEach((h, i) => {
        const col = cols[colKeys[i]];
        doc
          .fillColor("#fff")
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text(h, col.x + 3, tableY + 8, { width: col.w - 6, align: "center" });
      });

      // Item rows
      let rowY = tableY + 24;
      data.items.forEach((item, idx) => {
        const bg = idx % 2 === 0 ? "#ffffff" : "#f7f9fc";
        doc.rect(margin, rowY, contentWidth, 22).fill(bg);

        let rowData;
        if (data.checkState) {
          rowData = [
            String(idx + 1),
            item.title,
            String(item.qty),
            fmtNum(item.gross),
            fmtNum(item.discount),
            fmtNum(item.taxable),
            fmtNum(item.cgst),
            fmtNum(item.sgst),
            fmtNum(item.total),
          ];
        } else {
          rowData = [
            String(idx + 1),
            item.title,
            String(item.qty),
            fmtNum(item.gross),
            fmtNum(item.discount),
            fmtNum(item.taxable),
            fmtNum(item.igst),
            fmtNum(item.total),
          ];
        }

        rowData.forEach((val, i) => {
          const col = cols[colKeys[i]];
          doc
            .fillColor("#333")
            .fontSize(8.5)
            .font(i === 1 ? "Helvetica-Bold" : "Helvetica")
            .text(val, col.x + 3, rowY + 7, {
              width: col.w - 6,
              align: i <= 1 ? "left" : "center",
            });
        });

        // Row border
        doc
          .moveTo(margin, rowY + 22)
          .lineTo(margin + contentWidth, rowY + 22)
          .lineWidth(0.3)
          .strokeColor("#ddd")
          .stroke();
        rowY += 22;
      });

      // Totals row
      doc.rect(margin, rowY, contentWidth, 24).fill("#e8edf5");

      const totals = data.items.reduce(
        (acc, item) => ({
          qty:      acc.qty + item.qty,
          gross:    acc.gross + item.gross,
          discount: acc.discount + item.discount,
          taxable:  acc.taxable + item.taxable,
          igst:     acc.igst + (item.igst || 0),
          cgst:     acc.cgst + (item.cgst || 0),
          sgst:     acc.sgst + (item.sgst || 0),
          total:    acc.total + item.total,
        }),
        { qty: 0, gross: 0, discount: 0, taxable: 0, igst: 0, cgst: 0, sgst: 0, total: 0 }
      );

      let totalRow;
      if (data.checkState) {
        totalRow = [
          "Total", "", String(totals.qty),
          fmtNum(totals.gross), fmtNum(totals.discount), fmtNum(totals.taxable),
          fmtNum(totals.cgst), fmtNum(totals.sgst), fmtNum(totals.total),
        ];
      } else {
        totalRow = [
          "Total", "", String(totals.qty),
          fmtNum(totals.gross), fmtNum(totals.discount), fmtNum(totals.taxable),
          fmtNum(totals.igst), fmtNum(totals.total),
        ];
      }

      totalRow.forEach((val, i) => {
        const col = cols[colKeys[i]];
        doc
          .fillColor("#1a1a2e")
          .fontSize(8.5)
          .font("Helvetica-Bold")
          .text(val, col.x + 3, rowY + 8, {
            width: col.w - 6,
            align: i <= 1 ? "left" : "center",
          });
      });

      // ─── GRAND TOTAL ─────────────────────────────────────────────────
      const grandY = rowY + 36;
      doc
        .roundedRect(margin + contentWidth - 200, grandY, 200, 32, 6)
        .fill("#1a1a2e");
      doc
        .fillColor("#fff")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(
          `Grand Total: Rs ${fmtNum(data.grandTotal)}`,
          margin + contentWidth - 196,
          grandY + 10,
          { width: 192, align: "center" }
        );

      // ─── SIGNATURE ───────────────────────────────────────────────────
      const sigY = grandY + 50;
      doc
        .moveTo(margin + contentWidth - 130, sigY + 28)
        .lineTo(margin + contentWidth, sigY + 28)
        .lineWidth(1)
        .strokeColor("#999")
        .stroke();

      doc
        .fillColor("#555")
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .text(data.soldBy, margin + contentWidth - 130, sigY + 32, {
          width: 130,
          align: "center",
        });
      doc
        .font("Helvetica")
        .fillColor("#777")
        .fontSize(8)
        .text("Authorized Signatory", margin + contentWidth - 130, sigY + 44, {
          width: 130,
          align: "center",
        });

      // ─── THANK YOU ───────────────────────────────────────────────────
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor("#e67e22")
        .text("Thank You! for shopping with us", margin, sigY + 10, {
          align: "center",
        });

      // ─── TERMS ───────────────────────────────────────────────────────
      const termsY = sigY + 70;
      doc
        .moveTo(margin, termsY)
        .lineTo(margin + contentWidth, termsY)
        .lineWidth(0.5)
        .strokeColor("#ccc")
        .stroke();

      doc
        .fillColor("#1a1a2e")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("Terms & Conditions:", margin, termsY + 10);

      const terms = data.terms || [
        "Goods once sold will not be taken back.",
        "Payment within 7 days from invoice date.",
        "Interest @18% p.a. applicable on delayed payment.",
        "Subject to jurisdiction.",
      ];

      terms.forEach((term, i) => {
        doc
          .fillColor("#555")
          .fontSize(8.5)
          .font("Helvetica")
          .text(`${i + 1}. ${term}`, margin + 10, termsY + 24 + i * 13);
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}


/** Format a number for display in invoice */
function fmtNum(n) {
  if (n === undefined || n === null) return "0";
  return Number(n).toLocaleString("en-IN");
}
