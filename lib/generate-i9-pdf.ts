import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateI9PDF(i9Data: any, candidateName: string): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let yPosition = 750;
  const lineHeight = 20;
  const margin = 50;
  
  // Title
  page.drawText('I-9 Employment Eligibility Verification', {
    x: margin,
    y: yPosition,
    size: 18,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= lineHeight * 2;
  
  // Section 1: Employee Information
  page.drawText('Section 1. Employee Information and Attestation', {
    x: margin,
    y: yPosition,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= lineHeight * 1.5;
  
  // Personal Information
  const drawField = (label: string, value: string, y: number) => {
    page.drawText(`${label}:`, {
      x: margin,
      y: y,
      size: 11,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(value || 'N/A', {
      x: margin + 150,
      y: y,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
  };
  
  drawField('Legal Name', `${i9Data.legalName?.firstName || ''} ${i9Data.legalName?.middleName || ''} ${i9Data.legalName?.lastName || ''}`.trim(), yPosition);
  yPosition -= lineHeight;
  
  drawField('Date of Birth', i9Data.dateOfBirth || '', yPosition);
  yPosition -= lineHeight;
  
  drawField('Social Security Number', i9Data.socialSecurityNumber ? '***-**-' + i9Data.socialSecurityNumber.slice(-4) : 'N/A', yPosition);
  yPosition -= lineHeight;
  
  drawField('Email', i9Data.emergencyContact?.email || '', yPosition);
  yPosition -= lineHeight;
  
  drawField('Phone', i9Data.emergencyContact?.phone || '', yPosition);
  yPosition -= lineHeight * 1.5;
  
  // Address
  page.drawText('Current Address:', {
    x: margin,
    y: yPosition,
    size: 11,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;
  
  const address = i9Data.currentAddress;
  if (address) {
    page.drawText(`${address.street || ''}`, {
      x: margin + 20,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight * 0.8;
    
    page.drawText(`${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}`, {
      x: margin + 20,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight * 1.5;
  }
  
  // Work Authorization
  page.drawText('Work Authorization Status:', {
    x: margin,
    y: yPosition,
    size: 11,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  const authStatus = i9Data.workAuthorization?.status;
  let authText = 'Not specified';
  if (authStatus === 'citizen') authText = 'U.S. Citizen';
  else if (authStatus === 'permanent_resident') authText = 'Permanent Resident';
  else if (authStatus === 'authorized_alien') authText = 'Authorized Alien';
  
  page.drawText(authText, {
    x: margin + 170,
    y: yPosition,
    size: 11,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight * 2;
  
  // Documents Provided
  page.drawText('Documents Provided:', {
    x: margin,
    y: yPosition,
    size: 11,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;
  
  const docs = i9Data.documentVerification;
  if (docs?.listADocument) {
    page.drawText(`List A: ${docs.listADocument.type}`, {
      x: margin + 20,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
  }
  
  if (docs?.listBDocument) {
    page.drawText(`List B: ${docs.listBDocument.type}`, {
      x: margin + 20,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
  }
  
  if (docs?.listCDocument) {
    page.drawText(`List C: ${docs.listCDocument.type}`, {
      x: margin + 20,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
  }
  
  // Emergency Contact
  yPosition -= lineHeight;
  page.drawText('Emergency Contact:', {
    x: margin,
    y: yPosition,
    size: 11,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;
  
  if (i9Data.emergencyContact) {
    page.drawText(`${i9Data.emergencyContact.name} (${i9Data.emergencyContact.relationship})`, {
      x: margin + 20,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight * 0.8;
    
    page.drawText(`Phone: ${i9Data.emergencyContact.phone || 'N/A'}`, {
      x: margin + 20,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
  }
  
  // Footer
  yPosition = 50;
  page.drawText(`Generated on ${new Date().toLocaleDateString()} for ${candidateName}`, {
    x: margin,
    y: yPosition,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
} 