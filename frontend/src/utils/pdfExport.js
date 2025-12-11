import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * PDF Export Utility for Sendroli Factory Management System
 * Provides reusable functions for exporting tables and reports to PDF
 * 
 * IMPORTANT: jspdf-autotable must be imported to extend jsPDF with autoTable() method
 * This is a side-effect import that adds the method to the jsPDF prototype
 */

/**
 * Format currency for PDF display
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

/**
 * Format date for PDF display
 */
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Add header to PDF with company logo and title
 */
const addPDFHeader = (doc, title, subtitle = '') => {
  // Add company name
  doc.setFontSize(20);
  doc.setTextColor(0, 206, 209); // Sendroli theme color
  doc.text('Sendroli Factory', 14, 20);
  
  // Add report title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 32);
  
  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 39);
  }
  
  // Add date
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString('en-US')}`, 14, 45);
  
  // Add line separator
  doc.setDrawColor(0, 206, 209);
  doc.setLineWidth(0.5);
  doc.line(14, 48, doc.internal.pageSize.width - 14, 48);
  
  return 55; // Return Y position after header
};

/**
 * Add footer to PDF with page numbers
 */
const addPDFFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    // Add page number
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    
    // Add company info
    doc.text(
      'Sendroli Factory Management System',
      14,
      doc.internal.pageSize.height - 10
    );
  }
};

/**
 * Export client report to PDF
 */
export const exportClientReportToPDF = (reportData) => {
  const doc = new jsPDF();
  
  // Add header
  let yPos = addPDFHeader(
    doc,
    'Client Financial Report',
    `${reportData.client.name}${reportData.client.factoryName ? ' - ' + reportData.client.factoryName : ''}`
  );
  
  // Add client information
  yPos += 5;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Client Information:', 14, yPos);
  yPos += 6;
  
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  if (reportData.client.phone) {
    doc.text(`Phone: ${reportData.client.phone}`, 14, yPos);
    yPos += 5;
  }
  if (reportData.client.address) {
    doc.text(`Address: ${reportData.client.address}`, 14, yPos);
    yPos += 5;
  }
  
  // Add summary statistics
  yPos += 5;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary Statistics:', 14, yPos);
  yPos += 8;
  
  const summaryData = [
    ['Metric', 'Value'],
    ['Total Orders', reportData.summary.totalOrders.toString()],
    ['Total Invoices', reportData.summary.totalInvoices.toString()],
    ['Total Paid', `${formatCurrency(reportData.summary.totalPaid)} EGP`],
    ['Total Owed', `${formatCurrency(reportData.summary.totalOwed)} EGP`],
    ['Order Amount', `${formatCurrency(reportData.summary.totalOrderAmount)} EGP`],
    ['Invoice Amount', `${formatCurrency(reportData.summary.totalInvoiceAmount)} EGP`],
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [0, 206, 209] },
    margin: { left: 14, right: 14 },
  });
  
  // Add orders section
  if (reportData.orders.length > 0) {
    yPos = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(11);
    doc.text(`Orders (${reportData.orders.length})`, 14, yPos);
    
    const ordersData = reportData.orders.map(order => [
      formatDate(order.createdAt),
      order.type || order.material?.name || 'N/A',
      order.orderSize ? formatCurrency(order.orderSize) : 'N/A',
      formatCurrency(order.totalPrice),
      formatCurrency(order.deposit),
      formatCurrency(order.remainingAmount),
      order.orderState,
    ]);
    
    doc.autoTable({
      startY: yPos + 5,
      head: [['Date', 'Type', 'Size (m)', 'Total Price', 'Deposit', 'Remaining', 'Status']],
      body: ordersData,
      theme: 'striped',
      headStyles: { fillColor: [0, 206, 209] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 },
    });
  }
  
  // Add invoices section
  if (reportData.invoices.length > 0) {
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Check if we need a new page
    if (yPos > doc.internal.pageSize.height - 60) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.text(`Invoices (${reportData.invoices.length})`, 14, yPos);
    
    const invoicesData = reportData.invoices.map(invoice => [
      formatDate(invoice.invoiceDate || invoice.createdAt),
      formatCurrency(invoice.subtotal),
      formatCurrency(invoice.tax),
      formatCurrency(invoice.shipping),
      formatCurrency(invoice.discount),
      formatCurrency(invoice.total),
      formatCurrency(invoice.totalRemaining),
      invoice.status,
    ]);
    
    doc.autoTable({
      startY: yPos + 5,
      head: [['Date', 'Subtotal', 'Tax', 'Shipping', 'Discount', 'Total', 'Remaining', 'Status']],
      body: invoicesData,
      theme: 'striped',
      headStyles: { fillColor: [0, 206, 209] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 7 },
    });
  }
  
  // Add footer
  addPDFFooter(doc);
  
  // Save PDF
  doc.save(`Client_Report_${reportData.client.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export financial statistics to PDF
 */
export const exportFinancialStatsToPDF = (stats) => {
  const doc = new jsPDF();
  
  // Add header
  let yPos = addPDFHeader(doc, 'Financial Statistics Report', 'Overall Business Performance');
  
  // Add overall statistics
  yPos += 5;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Overall Statistics:', 14, yPos);
  yPos += 8;
  
  const overallData = [
    ['Metric', 'Value'],
    ['Total Orders', (stats.overall?.totalOrders || 0).toString()],
    ['Total Revenue', `${formatCurrency(stats.overall?.totalRevenue || 0)} EGP`],
    ['Total Deposits', `${formatCurrency(stats.overall?.totalDeposits || 0)} EGP`],
    ['Total Remaining', `${formatCurrency(stats.overall?.totalRemaining || 0)} EGP`],
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [overallData[0]],
    body: overallData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [0, 206, 209] },
    margin: { left: 14, right: 14 },
  });
  
  // Add orders by status
  if (stats.byState && stats.byState.length > 0) {
    yPos = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(11);
    doc.text('Orders by Status:', 14, yPos);
    
    const statusData = stats.byState.map(stat => [
      stat._id,
      stat.count.toString(),
      `${formatCurrency(stat.totalValue)} EGP`,
    ]);
    
    doc.autoTable({
      startY: yPos + 5,
      head: [['Status', 'Count', 'Total Value']],
      body: statusData,
      theme: 'striped',
      headStyles: { fillColor: [0, 206, 209] },
      margin: { left: 14, right: 14 },
    });
  }
  
  // Add footer
  addPDFFooter(doc);
  
  // Save PDF
  doc.save(`Financial_Statistics_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export comprehensive financial report to PDF
 */
export const exportFinancialReportToPDF = (reportData) => {
  const doc = new jsPDF();
  
  // Add header
  let yPos = addPDFHeader(doc, 'Comprehensive Financial Report', 'Complete Business Overview');
  
  // Add summary statistics
  yPos += 5;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Financial Summary:', 14, yPos);
  yPos += 8;
  
  const summaryData = [
    ['Metric', 'Value'],
    ['Total Revenue', `${formatCurrency(reportData.summary?.totalRevenue || 0)} EGP`],
    ['Total Paid', `${formatCurrency(reportData.summary?.totalPaid || 0)} EGP`],
    ['Total Outstanding', `${formatCurrency(reportData.summary?.totalOutstanding || 0)} EGP`],
    ['Total Orders', (reportData.summary?.totalOrders || 0).toString()],
    ['Total Invoices', (reportData.summary?.totalInvoices || 0).toString()],
    ['Active Clients', (reportData.summary?.activeClients || 0).toString()],
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [0, 206, 209] },
    margin: { left: 14, right: 14 },
  });
  
  // Add revenue breakdown by month
  if (reportData.revenueByMonth && reportData.revenueByMonth.length > 0) {
    yPos = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(11);
    doc.text('Revenue by Month:', 14, yPos);
    
    const monthData = reportData.revenueByMonth.map(item => [
      `${item.month}/${item.year}`,
      item.count.toString(),
      `${formatCurrency(item.totalRevenue)} EGP`,
      `${formatCurrency(item.totalPaid)} EGP`,
      `${formatCurrency(item.outstanding)} EGP`,
    ]);
    
    doc.autoTable({
      startY: yPos + 5,
      head: [['Month', 'Orders', 'Revenue', 'Paid', 'Outstanding']],
      body: monthData,
      theme: 'striped',
      headStyles: { fillColor: [0, 206, 209] },
      margin: { left: 14, right: 14 },
    });
  }
  
  // Add top clients
  if (reportData.topClients && reportData.topClients.length > 0) {
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Check if we need a new page
    if (yPos > doc.internal.pageSize.height - 60) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.text('Top Clients by Revenue:', 14, yPos);
    
    const clientData = reportData.topClients.map(client => [
      client.name,
      client.orderCount.toString(),
      `${formatCurrency(client.totalRevenue)} EGP`,
      `${formatCurrency(client.totalPaid)} EGP`,
      `${formatCurrency(client.outstanding)} EGP`,
    ]);
    
    doc.autoTable({
      startY: yPos + 5,
      head: [['Client Name', 'Orders', 'Revenue', 'Paid', 'Outstanding']],
      body: clientData,
      theme: 'striped',
      headStyles: { fillColor: [0, 206, 209] },
      margin: { left: 14, right: 14 },
    });
  }
  
  // Add order status distribution
  if (reportData.ordersByStatus && Object.keys(reportData.ordersByStatus).length > 0) {
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Check if we need a new page
    if (yPos > doc.internal.pageSize.height - 40) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.text('Orders by Status:', 14, yPos);
    
    const statusData = Object.entries(reportData.ordersByStatus).map(([status, count]) => [
      status.charAt(0).toUpperCase() + status.slice(1),
      count.toString(),
    ]);
    
    doc.autoTable({
      startY: yPos + 5,
      head: [['Status', 'Count']],
      body: statusData,
      theme: 'striped',
      headStyles: { fillColor: [0, 206, 209] },
      margin: { left: 14, right: 14 },
    });
  }
  
  // Add footer
  addPDFFooter(doc);
  
  // Save PDF
  doc.save(`Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export generic table to PDF
 */
export const exportTableToPDF = (title, headers, data, filename) => {
  const doc = new jsPDF();
  
  // Add header
  const yPos = addPDFHeader(doc, title);
  
  // Add table
  doc.autoTable({
    startY: yPos + 5,
    head: [headers],
    body: data,
    theme: 'striped',
    headStyles: { fillColor: [0, 206, 209] },
    margin: { left: 14, right: 14 },
  });
  
  // Add footer
  addPDFFooter(doc);
  
  // Save PDF
  const sanitizedFilename = filename || `Report_${new Date().toISOString().split('T')[0]}`;
  doc.save(`${sanitizedFilename}.pdf`);
};

/**
 * Export Client Analytics Report to PDF
 */
export const exportClientAnalyticsToPDF = (analyticsData) => {
  const doc = new jsPDF();
  
  // Add header
  let yPos = addPDFHeader(
    doc,
    'Client Analytics Report',
    `Generated on ${formatDate(new Date())}`
  );
  
  // Add overall statistics
  yPos += 5;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Overall Statistics', 14, yPos);
  yPos += 8;
  
  const overallStatsData = [
    ['Metric', 'Value'],
    ['Total Clients', analyticsData.overallStats.totalClients.toString()],
    ['Total Revenue', `${formatCurrency(analyticsData.overallStats.totalRevenue)} EGP`],
    ['Total Paid', `${formatCurrency(analyticsData.overallStats.totalPaid)} EGP`],
    ['Total Outstanding', `${formatCurrency(analyticsData.overallStats.totalOwed)} EGP`],
    ['Total Orders', analyticsData.overallStats.totalOrders.toString()],
    ['Total Invoices', analyticsData.overallStats.totalInvoices.toString()],
    ['Avg Orders per Client', analyticsData.overallStats.averageOrdersPerClient.toString()],
    ['Collection Rate', `${((analyticsData.overallStats.totalPaid / analyticsData.overallStats.totalRevenue) * 100).toFixed(1)}%`],
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [overallStatsData[0]],
    body: overallStatsData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [0, 206, 209] },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { cellWidth: 'auto' }
    }
  });
  
  // Add Top 5 Paying Clients
  yPos = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.text('Top 5 Paying Clients', 14, yPos);
  yPos += 8;
  
  const topClientsData = analyticsData.overallStats.topPayingClients.map((client, index) => [
    (index + 1).toString(),
    client.name,
    `${formatCurrency(client.totalValue)} EGP`,
    `${formatCurrency(client.totalPaid)} EGP`,
    `${((client.totalPaid / client.totalValue) * 100).toFixed(1)}%`,
  ]);
  
  doc.autoTable({
    startY: yPos,
    head: [['Rank', 'Client Name', 'Total Value', 'Total Paid', 'Payment Rate']],
    body: topClientsData,
    theme: 'striped',
    headStyles: { fillColor: [0, 206, 209] },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
    }
  });
  
  // Add Most Loyal Client
  if (analyticsData.overallStats.mostLoyalClient) {
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Check if we need a new page
    if (yPos > doc.internal.pageSize.height - 100) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.text('Most Loyal Client', 14, yPos);
    yPos += 8;
    
    const loyalClient = analyticsData.overallStats.mostLoyalClient;
    const loyalClientData = [
      ['Attribute', 'Value'],
      ['Name', loyalClient.name],
      ['Factory Name', loyalClient.factoryName || 'N/A'],
      ['Phone', loyalClient.phone],
      ['Loyalty Score', `${loyalClient.loyaltyScore}/100`],
      ['Loyalty Tier', loyalClient.loyaltyTier],
      ['Total Orders', loyalClient.totalOrders.toString()],
      ['Total Value', `${formatCurrency(loyalClient.totalValue)} EGP`],
      ['Payment Rate', `${loyalClient.paymentRate}%`],
      ['Client Since', `${loyalClient.clientAgeDays} days`],
    ];
    
    doc.autoTable({
      startY: yPos,
      head: [loyalClientData[0]],
      body: loyalClientData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [255, 215, 0] }, // Gold color for loyal client
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' }
      }
    });
  }
  
  // Add detailed client statistics table
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (yPos > doc.internal.pageSize.height - 60) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(12);
  doc.text('Detailed Client Statistics', 14, yPos);
  yPos += 8;
  
  const detailedClientsData = analyticsData.clients.map(client => [
    client.name,
    client.phone,
    client.statistics.totalOrders.toString(),
    `${formatCurrency(client.statistics.totalValue)} EGP`,
    `${formatCurrency(client.statistics.totalPaid)} EGP`,
    `${formatCurrency(client.statistics.totalOwed)} EGP`,
    `${client.statistics.paymentRate}%`,
    `${client.statistics.loyaltyScore} (${client.statistics.loyaltyTier})`,
  ]);
  
  doc.autoTable({
    startY: yPos,
    head: [['Client', 'Phone', 'Orders', 'Total Value', 'Paid', 'Outstanding', 'Payment Rate', 'Loyalty']],
    body: detailedClientsData,
    theme: 'striped',
    headStyles: { fillColor: [0, 206, 209] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 30 },
    }
  });
  
  // Add footer
  addPDFFooter(doc);
  
  // Save PDF
  const filename = `Client_Analytics_Report_${new Date().toISOString().split('T')[0]}`;
  doc.save(`${filename}.pdf`);
};

export default {
  exportClientReportToPDF,
  exportFinancialStatsToPDF,
  exportFinancialReportToPDF,
  exportTableToPDF,
  exportClientAnalyticsToPDF,
};
