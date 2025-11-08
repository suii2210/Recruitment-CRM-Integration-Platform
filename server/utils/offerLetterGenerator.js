import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

const sanitizeValue = (value, fallback = '') =>
  (value || fallback || '').toString().trim();

const buildTemplateData = (data = {}) => ({
  name: sanitizeValue(data.name, 'Candidate'),
  role: sanitizeValue(data.role, 'Team Member'),
  duration: sanitizeValue(data.duration, '3 Months'),
  date: sanitizeValue(
    data.date ||
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
  ),
});

const addParagraph = (doc, text, options = {}) => {
  doc.moveDown(options.moveDown ?? 0.5);
  doc.font('Helvetica').fontSize(options.size || 11).fillColor(options.color || '#111827');
  doc.text(text, { align: options.align || 'left' });
};

const addHeading = (doc, text) => {
  doc
    .moveDown(0.8)
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#111827')
    .text(text, { align: 'left' });
};

const addList = (doc, items) => {
  items.forEach((item) => {
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').text(`${item.title}`, { continued: true });
    doc.font('Helvetica').text(` ${item.value}`);
    if (item.children) {
      item.children.forEach((child, idx) => {
        doc.moveDown(0.2);
        doc
          .font('Helvetica')
          .text(`${String.fromCharCode(97 + idx)}. ${child}`, { indent: 20 });
      });
    }
  });
};

export const generateOfferLetterBuffer = async (data = {}) => {
  const templateData = buildTemplateData(data);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = new PassThrough();
  doc.pipe(stream);
  const chunks = [];
  const bufferPromise = new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });

  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor('#111827')
    .text('Internship Offer Letter', { align: 'center' });

  doc.moveTo(50, doc.y + 8).lineTo(545, doc.y + 8).strokeColor('#fbbf24').stroke();

  addParagraph(doc, `Date: ${templateData.date}`, { moveDown: 1 });
  addParagraph(doc, 'The ProEducator\nPrashant Kumar LTD\nEL, 9A AC, London, UK, HA2 6DP', {
    moveDown: 0.1,
  });

  addParagraph(doc, `Dear ${templateData.name},`, { moveDown: 1 });
  addParagraph(
    doc,
    `We are delighted to offer you the position of ${templateData.role} Intern at Prashant Kumar LTD, starting ${templateData.date}. Your passion, dedication, and enthusiasm during the selection process truly impressed us, and we are excited to welcome you aboard.`
  );
  addParagraph(
    doc,
    'This internship is an unpaid opportunity designed to provide you with practical, real-world experience in a dynamic and mission-driven environment. Upon successful completion of the program, and based on your performance, you will receive an official Certificate of Completion.'
  );

  addHeading(doc, 'Terms and Conditions:');
  addList(doc, [
    {
      title: '1. Confidentiality:',
      value: 'During your internship, you may have access to sensitive and confidential company information.',
      children: [
        'You agree to maintain the confidentiality of all such information and not use or disclose it outside the organization.',
      ],
    },
    {
      title: '2. Task Submission:',
      value: 'You are expected to complete all assigned tasks and responsibilities within the given deadlines.',
      children: [
        'Maintain consistent communication with your supervisor regarding progress and blockers.',
      ],
    },
    {
      title: '3. Professional Conduct:',
      value:
        'We expect you to uphold a high standard of professionalism, integrity, and commitment throughout your internship term.',
    },
  ]);

  addParagraph(
    doc,
    'Please confirm your acceptance of this offer by replying to this email with a signed copy of the declaration below.',
    { moveDown: 1 }
  );
  addParagraph(doc, 'We look forward to having you as part of our team and wish you a rewarding learning experience with us.');
  addParagraph(doc, 'Warm regards,', { moveDown: 1 });
  addParagraph(doc, 'Prashant Kumar\nFounder & Director\nThe ProEducator', { moveDown: 1 });

  doc
    .moveDown(1)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Internship Acceptance Declaration');

  addParagraph(
    doc,
    `I, ${templateData.name}, accept the above internship offer for the position of ${templateData.role} Intern at Prashant Kumar LTD and confirm my start date as ${templateData.date}. I have read, understood, and agree to abide by the terms and conditions outlined in the offer letter.`
  );

  doc.moveDown(1);
  doc.text('Date: ____________________');
  doc.moveDown(0.5);
  doc.text('Place: ____________________');
  doc.moveDown(0.5);
  doc.text('Signed: ____________________');

  doc.end();
  return bufferPromise;
};

export default generateOfferLetterBuffer;
