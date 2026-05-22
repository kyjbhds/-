import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportReportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  
  const imgX = (pdfWidth - imgWidth * ratio) / 2;
  let imgY = 10;
  
  const scaledHeight = imgHeight * ratio;
  
  if (scaledHeight > pdfHeight - 20) {
    let heightLeft = scaledHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', imgX, imgY, pdfWidth - 20, scaledHeight);
    heightLeft -= pdfHeight;
    
    while (heightLeft > 0) {
      position = heightLeft - scaledHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', imgX, position, pdfWidth - 20, scaledHeight);
      heightLeft -= pdfHeight;
    }
  } else {
    pdf.addImage(imgData, 'PNG', imgX, imgY, pdfWidth - 20, scaledHeight);
  }
  
  pdf.save(`${filename}.pdf`);
}
