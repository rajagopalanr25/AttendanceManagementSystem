import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

/**
 * Exports JSON data to a CSV file
 */
export const exportToCSV = (data, filename = 'report.csv') => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
      const escaped = val.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exports JSON data to Excel (.xlsx) file
 */
export const exportToExcel = (data, filename = 'report.xlsx', sheetName = 'Report') => {
  if (!data || !data.length) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};

/**
 * Exports structured table data to PDF with professional styling
 */
export const exportToPDF = ({
  title = 'Student Attendance Report',
  subtitle = 'Apex Institute of Technology & Science',
  headers = [],
  rows = [],
  filename = 'attendance_report.pdf'
}) => {
  const doc = new jsPDF('p', 'pt', 'a4');

  // Header Title
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(title, 40, 45);

  // Subtitle & Date
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`${subtitle} | Generated on ${dayjs().format('MMMM DD, YYYY hh:mm A')}`, 40, 62);

  // Draw separator line
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(1);
  doc.line(40, 72, 555, 72);

  // Table
  autoTable(doc, {
    startY: 85,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235], // Blue-600
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 8,
      cellPadding: 5,
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate-50
    },
    margin: { left: 40, right: 40 }
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
};
