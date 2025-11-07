import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';
import cors from 'cors';
import { fileURLToPath } from 'url';
import JobApplication from '../models/JobApplication.js';
import Role from '../models/Role.js';
import User from '../models/User.js';

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
const uploadsDir = path.join(__dirname, '../../uploads/candidate-docs');

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
      body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 32px; }
      .card { max-width: 640px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 24px 60px rgba(15,23,42,0.45); }
      h1 { margin-bottom: 16px; color: #38bdf8; }
      a, button { background: #38bdf8; color: #0f172a; padding: 12px 18px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 16px; }
      p { line-height: 1.6; }
      form { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
      input[type="file"] { padding: 12px; background: #0f172a; border: 1px solid #334155; border-radius: 12px; color: #e2e8f0; }
      button { border: none; cursor: pointer; transition: transform 0.2s ease; }
      button:hover, a:hover { transform: translateY(-1px); }
      .muted { color: #94a3b8; font-size: 14px; }
      .success { color: #4ade80; }
      .error { color: #f87171; }
    </style>
  </head>
  <body>
    <div class="card">
      ${body}
    </div>
  </body>
</html>`;

const findApplicationByToken = async (token, type) => {
  if (!token) return null;
  const query = {};
  if (type === 'shortlist') query['shortlist.token'] = token;
  if (type === 'documents') query['document_request.token'] = token;
  if (type === 'offer') query['offer.token'] = token;
  return JobApplication.findOne(query);
};

const appendTimeline = (application, note) => {
  application.timeline = application.timeline || [];
  application.timeline.push({
    status: application.status,
    note,
    changed_at: new Date(),
  });
};

const ensureUserForApplication = async (application) => {
  if (!application.email) return null;

  let user = null;
  if (application.offer?.user) {
    user = await User.findById(application.offer.user);
  }
  if (!user) {
    user = await User.findOne({ email: application.email });
  }

  if (!user) {
    const defaultRole =
      (await Role.findOne({ name: 'Viewer' })) || (await Role.findOne({}));
    const roleId = defaultRole?._id;
    const roleName = defaultRole?.name || 'Viewer';

    const tempPassword = crypto.randomBytes(10).toString('hex');
    user = new User({
      name: application.applicant_name,
      email: application.email,
      password: tempPassword,
      role: roleName,
      roleId,
      status: 'active',
    });

    await user.save();
  }

  application.offer = application.offer || {};
  application.offer.user = user._id;

  return user;
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
      await ensureUserForApplication(application);
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
