const multer = require('multer');
const path = require('path');

// Configure where and how uploaded files get stored on disk
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // All uploaded files go into the /uploads folder we created earlier
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Build a unique filename: fieldname-timestamp.extension
    // e.g. "shopLogo-1721234567890.png" - prevents overwriting files with the same original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Only allow specific file types (images and PDFs, common for CNIC/logo/certificates)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowedTypes.test(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpeg, .jpg, .png, and .pdf files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max file size
});

module.exports = upload;