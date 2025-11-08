import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';
import cors from 'cors';
import { fileURLToPath } from 'url';
import JobApplication from '../models/JobApplication.js';
import { ensureCandidateAccount } from '../utils/candidateAccount.js';

const router = express.Router();

router.use(
  cors({
    origin: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '../../uploads');
const uploadsDir = path.join(uploadsRoot, 'candidate-docs');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName = file.originalname.replace(/[^a-z0-9.\-_]+/gi, '_');
    cb(null, `${uniqueSuffix}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
});

const renderPage = (title, body) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fb; color: #1f2933; padding: 48px 16px; }
      .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 36px; box-shadow: 0 30px 80px rgba(15, 23, 42, 0.12); border: 1px solid #e2e8f0; }
      h1 { margin-bottom: 16px; color: #111827; font-size: 28px; }
      a, button { background: linear-gradient(135deg, #60a5fa, #3b82f6); color: #ffffff; padding: 12px 20px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 16px; }
      p { line-height: 1.7; }
      form { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
      input[type="file"] { padding: 12px; background: #f1f5f9; border: 1px solid #cbd5f5; border-radius: 12px; color: #1f2933; }
      button { border: none; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; }
      button:hover, a:hover { transform: translateY(-1px); box-shadow: 0 12px 24px rgba(59, 130, 246, 0.2); }
      .muted { color: #6b7280; font-size: 14px; }
      .success { color: #16a34a; }
      .error { color: #dc2626; }
    </style>
  </head>
  <body>
    <div class="card">
      ${body}
    </div>
  </body>
</html>`;

const renderLetterPage = (title, description, downloadUrl) =>
  renderPage(
    title,
    `
      <h1>${title}</h1>
      <p>${description}</p>
      ${
        downloadUrl
          ? `<p><a href="${downloadUrl}" style="display:inline-block;margin-top:12px;">Download offer letter</a></p>`
          : ''
      }
    `
  );

const findApplicationByToken = async (token, type) => {
  if (!token) return null;
  const query = {};
  if (type === 'shortlist') query['shortlist.token'] = token;
  if (type === 'documents') query['document_request.token'] = token;
  if (type === 'offer') query['offer.token'] = token;
  return JobApplication.findOne(query);
};

const resolveLetterAbsolutePath = (letterPath) => {
  if (!letterPath) return null;
  const sanitized = letterPath.replace(/^\/*/, '');
  const absolute = path.join(__dirname, '../../', sanitized);
  if (!absolute.startsWith(uploadsRoot)) {
    throw new Error('Letter path must stay inside uploads directory.');
  }
  if (!fs.existsSync(absolute)) {
    throw new Error('Offer letter file is missing.');
  }
  return absolute;
};

const appendTimeline = (application, note) => {
  application.timeline = application.timeline || [];
  application.timeline.push({
    status: application.status,
    note,
    changed_at: new Date(),
  });
};

router.get('/respond/:token/:decision', async (req, res) => {
  try {
    const { token, decision } = req.params;
    const application = await findApplicationByToken(token, 'shortlist');

    if (!application) {
      return res
        .status(404)
        .send(
          renderPage(
            'Link expired',
            '<h1>Link expired</h1><p>This shortlist confirmation link is no longer valid.</p>'
          )
        );
    }

    if (!['accept', 'decline'].includes(decision)) {
      return res
        .status(400)
        .send(
          renderPage(
            'Invalid action',
            '<h1>Invalid action</h1><p>Please use the provided buttons in your email.</p>'
          )
        );
    }

    if (application.shortlist?.response_status !== 'pending') {
      return res.send(
        renderPage(
          'Already responded',
          `<h1>Already responded</h1><p>We have already received your response on <strong>${application.shortlist.responded_at?.toLocaleString() || 'a previous date'}</strong>. Thank you!</p>`
        )
      );
    }

    const accepted = decision === 'accept';
    application.shortlist.response_status = accepted ? 'accepted' : 'declined';
    application.shortlist.responded_at = new Date();
    application.onboarding_status = accepted ? 'documents-requested' : 'declined';
    application.status = accepted ? 'in_review' : 'rejected';

    appendTimeline(
      application,
      accepted
        ? 'Candidate accepted the shortlist invitation.'
        : 'Candidate declined the shortlist invitation.'
    );

    await application.save();

    res.send(
      renderPage(
        accepted ? 'Thank you!' : 'Response recorded',
        accepted
          ? '<h1 class="success">Thank you!</h1><p>We\'re excited to move forward. Our HR team will reach out with the next steps shortly.</p>'
          : '<h1 class="error">Response recorded</h1><p>Thank you for letting us know. We wish you all the best in your future endeavours.</p>'
      )
    );
  } catch (error) {
    console.error('Shortlist response error:', error);
    res
      .status(500)
      .send(
        renderPage(
          'Server error',
          '<h1>Something went wrong</h1><p>We were unable to record your response. Please contact HR.</p>'
        )
      );
  }
});

router.get('/documents/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const application = await findApplicationByToken(token, 'documents');

    if (!application) {
      return res
        .status(404)
        .send(
          renderPage(
            'Link expired',
            '<h1>Link expired</h1><p>This document upload link is no longer valid.</p>'
          )
        );
    }

    return res.send(
      renderPage(
        'Upload your documents',
        `<h1>Upload your documents</h1>
         <p>Please upload clear scans or photos of your government-issued identification. You can add up to 5 files, each no larger than 10MB.</p>
         ${application.document_request?.completed_at ? '<p class="muted">You have already uploaded documents. Submitting again will replace the previous files.</p>' : ''}
         <form method="post" enctype="multipart/form-data">
           <input type="file" name="documents" accept=".pdf,.png,.jpg,.jpeg" multiple required />
           <button type="submit">Upload files</button>
         </form>
         <p class="muted">Supported formats: PDF, JPG, PNG</p>`
      )
    );
  } catch (error) {
    console.error('Document upload page error:', error);
    res
      .status(500)
      .send(
        renderPage(
          'Server error',
          '<h1>Something went wrong</h1><p>We were unable to open the upload page. Please contact HR.</p>'
        )
      );
  }
});

router.post('/documents/:token', upload.array('documents', 5), async (req, res) => {
  try {
    const { token } = req.params;
    const application = await findApplicationByToken(token, 'documents');

    if (!application) {
      return res
        .status(404)
        .send(
          renderPage(
            'Link expired',
            '<h1>Link expired</h1><p>This document upload link is no longer valid.</p>'
          )
        );
    }

    if (!req.files || req.files.length === 0) {
      return res.send(
        renderPage(
          'No files uploaded',
          '<h1>No files uploaded</h1><p>Please select at least one document to upload.</p>'
        )
      );
    }

    application.document_uploads = application.document_uploads || [];
    req.files.forEach((file) => {
      application.document_uploads.push({
        filename: file.filename,
        label: file.originalname,
        url: `/uploads/candidate-docs/${file.filename}`,
        uploaded_at: new Date(),
        uploaded_by_candidate: true,
      });
    });

    application.document_request = application.document_request || {};
    application.document_request.completed_at = new Date();
    application.onboarding_status = 'documents-requested';

    appendTimeline(
      application,
      `Candidate uploaded ${req.files.length} document(s).`
    );

    await application.save();

    res.send(
      renderPage(
        'Documents received',
        '<h1 class="success">Documents received</h1><p>Thank you for submitting your documents. Our HR team will review them and reach out with the next steps.</p>'
      )
    );
  } catch (error) {
    console.error('Document upload error:', error);
    res
      .status(500)
      .send(
        renderPage(
          'Upload failed',
          '<h1>Upload failed</h1><p>We could not process your files. Please try again later or contact HR for assistance.</p>'
        )
      );
  }
});

router.get('/offer-letter/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const application = await findApplicationByToken(token, 'offer');

    if (!application) {
      return res
        .status(404)
        .send(
          renderPage(
            'Link expired',
            '<h1>Link expired</h1><p>This offer link is no longer valid.</p>'
          )
        );
    }

    const letter = application.offer?.letter;
    if (!letter?.path) {
      return res
        .status(404)
        .send(
          renderPage(
            'Offer letter unavailable',
            '<h1>Offer letter unavailable</h1><p>The offer document could not be located. Please contact HR.</p>'
          )
        );
    }

    const downloadUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}/offer-letter/${token}/download`;
    res.send(
      renderLetterPage(
        'Download your offer letter',
        `Hi ${application.applicant_name || 'there'}, your offer for ${
          application.job_title || 'this role'
        } is ready. Use the button below to download a copy.`,
        downloadUrl
      )
    );
  } catch (error) {
    console.error('Offer letter view error:', error);
    res
      .status(500)
      .send(
        renderPage(
          'Server error',
          '<h1>Unable to load</h1><p>We could not load your offer letter. Please try again later.</p>'
        )
      );
  }
});

router.get('/offer-letter/:token/download', async (req, res) => {
  try {
    const { token } = req.params;
    const application = await findApplicationByToken(token, 'offer');
    if (!application) {
      return res.status(404).send('Offer not found.');
    }
    const letter = application.offer?.letter;
    if (!letter?.path) {
      return res.status(404).send('Offer letter unavailable.');
    }
    const absolutePath = resolveLetterAbsolutePath(letter.path);
    const safeName =
      letter.filename ||
      `${(application.applicant_name || 'Offer').replace(/[^\w.-]+/g, '_')}.${letter.format || 'pptx'}`;
    res.download(absolutePath, safeName);
  } catch (error) {
    console.error('Offer letter download error:', error);
    res.status(500).send('Failed to download offer letter.');
  }
});

router.get('/offer/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const application = await findApplicationByToken(token, 'offer');

    if (!application) {
      return res
        .status(404)
        .send(renderPage('Link expired', '<h1>Link expired</h1><p>This offer link is no longer valid.</p>'));
    }

    if (application.offer?.response_status !== 'pending') {
      return res.send(
        renderPage(
          'Decision already recorded',
          `<h1>Thank you</h1><p>We already received your response on <strong>${
            application.offer.responded_at?.toLocaleString() || 'a previous date'
          }</strong>.</p>`
        )
      );
    }

    const letter = application.offer?.letter;
    if (!letter?.path) {
      return res.send(
        renderPage(
          'Offer letter unavailable',
          '<h1>Offer letter unavailable</h1><p>The document could not be located. Please contact HR for assistance.</p>'
        )
      );
    }

    const downloadUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}/offer-letter/${token}/download`;
    const acceptUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}/offer/${token}/accept`;
    const declineUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}/offer/${token}/decline`;

    const body = `
      <h1>Review your offer</h1>
      <p>Hi ${application.applicant_name || 'there'}, congratulations! Your offer for <strong>${
        application.job_title || 'the role'
      }</strong> is ready.</p>
      <div style="margin:16px 0;padding:16px;border-radius:12px;border:1px solid #dbeafe;background:#eff6ff;">
        <p style="margin:0 0 8px 0;">Download and read the full offer letter:</p>
        <a href="${downloadUrl}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Download offer letter
        </a>
      </div>
      <div style="margin-top:24px;">
        <p style="margin-bottom:12px;font-weight:600;">When you’re ready, let us know your decision:</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <a href="${acceptUrl}" style="flex:1;min-width:160px;text-align:center;padding:12px 16px;background:#16a34a;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;">
            ✅ Accept the offer
          </a>
          <a href="${declineUrl}" style="flex:1;min-width:160px;text-align:center;padding:12px 16px;background:#ef4444;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;">
            ❌ Decline the offer
          </a>
        </div>
      </div>
    `;

    return res.send(renderPage('Review your offer', body));
  } catch (error) {
    console.error('Offer review error:', error);
    res
      .status(500)
      .send(
        renderPage(
          'Server error',
          '<h1>Something went wrong</h1><p>We were unable to load your offer. Please try again later.</p>'
        )
      );
  }
});

router.get('/offer/:token/:decision', async (req, res) => {
  try {
    const { token, decision } = req.params;
    const application = await findApplicationByToken(token, 'offer');

    if (!application) {
      return res
        .status(404)
        .send(
          renderPage(
            'Link expired',
            '<h1>Link expired</h1><p>This offer link is no longer valid.</p>'
          )
        );
    }

    if (!['accept', 'decline'].includes(decision)) {
      return res
        .status(400)
        .send(
          renderPage(
            'Invalid action',
            '<h1>Invalid action</h1><p>Please use the buttons provided in your email.</p>'
          )
        );
    }

    if (application.offer?.response_status !== 'pending') {
      return res.send(
        renderPage(
          'Already responded',
          `<h1>Already responded</h1><p>We have already received your decision on <strong>${application.offer.responded_at?.toLocaleString() || 'a previous date'}</strong>. Thank you!</p>`
        )
      );
    }

    const accepted = decision === 'accept';
    application.offer.response_status = accepted ? 'accepted' : 'declined';
    application.offer.responded_at = new Date();
    application.onboarding_status = accepted ? 'hired' : 'declined';
    application.status = accepted ? 'hired' : 'rejected';

    if (accepted) {
      await ensureCandidateAccount(application);
      if (!application.offer.start_date) {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 3);
        application.offer.start_date = startDate;
        application.offer.end_date = endDate;
      }
      appendTimeline(application, 'Candidate accepted the offer. User profile created.');
    } else {
      appendTimeline(application, 'Candidate declined the offer.');
    }

    await application.save();

    res.send(
      renderPage(
        accepted ? 'Welcome aboard!' : 'Thank you',
        accepted
          ? '<h1 class="success">Welcome aboard!</h1><p>Thank you for accepting our offer. Our HR team will contact you shortly with onboarding details.</p>'
          : '<h1 class="error">Response recorded</h1><p>Thank you for letting us know. We appreciate your time and wish you every success ahead.</p>'
      )
    );
  } catch (error) {
    console.error('Offer response error:', error);
    res
      .status(500)
      .send(
        renderPage(
          'Server error',
          '<h1>Something went wrong</h1><p>We were unable to record your decision. Please contact HR.</p>'
        )
      );
  }
});

export default router;
