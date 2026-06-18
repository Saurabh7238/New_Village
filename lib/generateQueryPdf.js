import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { formatQueryDate, getSlaDeadline, maskMobile } from "./queryDisplay";

export async function generateAcknowledgmentPdf(query, domain) {
  const doc = new PDFDocument();
  const buffers = [];

  doc.on("data", (chunk) => buffers.push(chunk));
  doc.on("end", () => {});

  doc.fontSize(16).font("Helvetica-Bold").text("GRAM PANCHAYAT LUCKNOW", { align: "center" });
  doc.fontSize(10).font("Helvetica").text("ACKNOWLEDGEMENT SLIP", { align: "center" });
  doc.fontSize(10).text("RTI Act 2005 - Legal Proof of Receipt", { align: "center" });
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

  doc.moveDown(0.5);
  doc.fontSize(14).font("Helvetica-Bold").text(`Query ID: ${query.queryId}`, { align: "center" });
  doc.fontSize(9).font("Helvetica").text("System Generated - Valid as RTI Acknowledgment", { align: "center" });

  doc.moveDown(1);
  doc.fontSize(10).font("Helvetica-Bold").text("SUBMISSION DETAILS");
  doc.fontSize(9).font("Helvetica");
  doc.text(`Date & Time: ${formatQueryDate(query.createdAt)}`);
  doc.text(`Applicant Name: ${query.name}`);
  doc.text(`Mobile Number: ${maskMobile(query.mobile)}`);
  doc.text(`Ward/Village: Ward ${query.ward}`);
  doc.text(`Address: ${query.address || "Not provided"}`);

  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica-Bold").text("QUERY DETAILS");
  doc.fontSize(9).font("Helvetica");
  doc.text(`Category: ${query.category}`);
  doc.text(`Subject: ${query.subject}`);
  doc.text(`Description:`, { underline: true });
  doc.fontSize(8).text(query.description, { width: 500 });

  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica-Bold").text("ASSIGNMENT & SLA");
  doc.fontSize(9).font("Helvetica");
  doc.text(`Assigned To: ${query.assignedTo || "Pending"}`);
  doc.text(`Priority: ${query.priority}`);
  doc.text(`Status: ${query.status}`);

  const ackDeadline = getSlaDeadline(query.createdAt, query.category);
  doc.text(`Expected Resolution: ${formatQueryDate(ackDeadline)}`);

  doc.moveDown(0.5);
  doc.fontSize(9).font("Helvetica-Bold").text("TRACKING:", { underline: true });
  doc.fontSize(8).text(`Visit: ${domain}/track`);
  doc.text(`Use Query ID: ${query.queryId}`);

  if (query.photo) {
    try {
      const qrData = `${domain}/track?id=${query.queryId}`;
      const qrImage = await QRCode.toDataURL(qrData);
      doc.moveDown(0.5);
      doc.image(qrImage, 400, doc.y - 50, { width: 100 });
    } catch (e) {
      console.error("QR code error:", e);
    }
  }

  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.fontSize(7).font("Helvetica").text("This acknowledgement is legally valid under RTI Act 2005. Keep it safe.", { align: "center" });
  doc.fontSize(6).text("For any query related to this grievance, contact the Gram Panchayat Office.", { align: "center" });

  return new Promise((resolve, reject) => {
    doc.on("finish", () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on("error", reject);
    doc.end();
  });
}

export async function generateResolutionCertificatePdf(query, domain) {
  const doc = new PDFDocument();
  const buffers = [];

  doc.on("data", (chunk) => buffers.push(chunk));
  doc.on("end", () => {});

  doc.fontSize(16).font("Helvetica-Bold").text("GRAM PANCHAYAT LUCKNOW", { align: "center" });
  doc.fontSize(14).font("Helvetica-Bold").text("RESOLUTION CERTIFICATE", { align: "center" });
  doc.fontSize(10).text("RTI Act 2005", { align: "center" });
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

  doc.moveDown(1);
  doc.fontSize(12).font("Helvetica-Bold").text(`Query ID: ${query.queryId}`, { align: "center" });
  doc.fontSize(10).font("Helvetica").text("RESOLVED", { align: "center", color: "green" });

  doc.moveDown(1);
  doc.fontSize(10).font("Helvetica-Bold").text("RESOLUTION DETAILS");
  doc.fontSize(9).font("Helvetica");
  doc.text(`Submitted: ${formatQueryDate(query.createdAt)}`);
  doc.text(`Acknowledged: ${formatQueryDate(query.acknowledgedAt) || "Pending"}`);
  doc.text(`Resolved: ${formatQueryDate(query.resolvedAt)}`);
  doc.text(`Applicant: ${query.name}`);
  doc.text(`Category: ${query.category}`);
  doc.text(`Subject: ${query.subject}`);

  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica-Bold").text("RESOLUTION");
  doc.fontSize(9).font("Helvetica");
  doc.text(query.adminRemarks || "Work completed as per request", { width: 500 });

  doc.moveDown(1);
  doc.fontSize(9).font("Helvetica-Bold").text("Officer Signature: ________________");
  doc.text(`Date: ${formatQueryDate(new Date())}`);

  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.fontSize(7).text("This certificate is valid proof of query resolution under RTI Act 2005.", { align: "center" });

  return new Promise((resolve, reject) => {
    doc.on("finish", () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on("error", reject);
    doc.end();
  });
}
