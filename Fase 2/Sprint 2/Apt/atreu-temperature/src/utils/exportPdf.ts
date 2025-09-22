// src/utils/exportPdf.ts
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportElementToPDF(elementId: string, fileName: string) {
  const el = document.getElementById(elementId);
  if (!el) throw new Error(`No se encontró #${elementId}`);
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#0f172a" }); // bg slate-900
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  // Ajuste manteniendo proporciones dentro de A4 landscape
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
  const imgW = canvas.width * ratio;
  const imgH = canvas.height * ratio;
  const x = (pageW - imgW) / 2;
  const y = (pageH - imgH) / 2;
  pdf.addImage(imgData, "PNG", x, y, imgW, imgH);
  pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}
