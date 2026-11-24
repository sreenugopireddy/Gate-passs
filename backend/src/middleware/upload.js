const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.fieldname === 'file') {
    const allowed = ['.csv', '.xlsx'];
    if (allowed.includes(ext)) return cb(null, true);
    return cb(new Error('Invalid file type for bulk import. Only CSV and XLSX are allowed.'), false);
  }

  if (file.fieldname === 'signature') {
    const allowed = ['.jpeg', '.jpg', '.png', '.pdf'];
    if (allowed.includes(ext)) return cb(null, true);
    return cb(new Error('Invalid signature file type. Only JPEG, PNG, and PDF are allowed.'), false);
  }

  // Fallback allow images and PDFs for other uploads
  const allowed = ['.jpeg', '.jpg', '.png', '.pdf'];
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Invalid file type'), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

module.exports = upload;
