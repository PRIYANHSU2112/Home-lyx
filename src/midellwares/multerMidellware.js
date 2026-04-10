const { Credentials } = require("aws-sdk");
const S3 = require("aws-sdk/clients/s3");
const multer = require("multer");
const sharp = require("sharp");

const s3Client = new S3({
  region: process.env.LINODE_OBJECT_STORAGE_REGION || "sgp1",
  endpoint:
    process.env.LINODE_OBJECT_STORAGE_ENDPOINT ||
    "https://sgp1.digitaloceanspaces.com",
  sslEnabled: true,
  s3ForcePathStyle: false,
  credentials: new Credentials({
    accessKeyId:
      process.env.LINODE_OBJECT_STORAGE_ACCESS_KEY_ID || "DO00Z942D6M3HUV48DCM",
    secretAccessKey: "psMqLH/f+54S/fiZwewr2IM/ah8f8K+O5PzVjU8mCyw",
  }),
});

const BUCKET = "satyakabir-bucket";

// ─── Allowed MIME types ─────────────────────────────────────────────────────
const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
]);

const ALLOWED_MIMES = new Set([
  ...IMAGE_MIMES,
  "video/mp4",
  "application/pdf",
]);

// ─── Multer: store files in memory so we can compress before S3 upload ──────
function multerFilter(req, file, cb) {
  console.log(file.mimetype);
  if (ALLOWED_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error("Only JPEG, JPG, PNG, GIF, MP4 or PDF formats allowed!");
    error.status = 400;
    cb(error, false);
  }
}

const _multerUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: multerFilter,
});

/**
 * Wrap multer so that upload.single(), upload.fields(), upload.array()
 * automatically run compressAndUpload afterward.
 * This way NO route files need to be changed.
 */

exports.upload = {
  single: (fieldName) => [_multerUpload.single(fieldName), compressAndUpload],
  fields: (fields) => [_multerUpload.fields(fields), compressAndUpload],
  array: (fieldName, maxCount) => [_multerUpload.array(fieldName, maxCount), compressAndUpload],
  none: () => _multerUpload.none(),
};

// ─── Sharp compression + S3 upload middleware ───────────────────────────────
async function compressAndUpload(req, res, next) {
  try {
    // Process single file (req.file)
    if (req.file) {
      req.file = await processFile(req.file);
    }

    // Process multiple files (req.files)
    if (req.files) {
      // req.files can be { fieldName: [files] } (from upload.fields)
      // or [files] (from upload.array)
      if (Array.isArray(req.files)) {
        req.files = await Promise.all(req.files.map(processFile));
      } else {
        for (const fieldName of Object.keys(req.files)) {
          req.files[fieldName] = await Promise.all(
            req.files[fieldName].map(processFile)
          );
        }
      }
    }

    next();
  } catch (error) {
    console.error("compressAndUpload error:", error.message);
    return res.status(500).json({
      success: false,
      message: "File upload failed: " + error.message,
    });
  }
};

/**
 * Compress an image (if applicable) using sharp, then upload to S3.
 * Returns the file object with `key` and `location` set (same shape as multer-s3).
 */
async function processFile(file) {
  let buffer = file.buffer;
  let contentType = file.mimetype;

  // Only compress images (skip videos, PDFs, GIFs)
  if (IMAGE_MIMES.has(file.mimetype) && file.mimetype !== "image/gif") {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Resize if width > 1200px, maintain aspect ratio
    const maxWidth = 1200;
    if (metadata.width && metadata.width > maxWidth) {
      image.resize({ width: maxWidth, withoutEnlargement: true });
    }

    // Convert to WebP for best compression, fallback to JPEG
    if (file.mimetype === "image/png") {
      buffer = await image.webp({ quality: 80 }).toBuffer();
      contentType = "image/webp";
    } else {
      // JPEG → compress as JPEG
      buffer = await image.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      contentType = "image/jpeg";
    }

    console.log(
      `[sharp] ${file.originalname}: ${(file.size / 1024).toFixed(1)}KB → ${(buffer.length / 1024).toFixed(1)}KB (${Math.round((1 - buffer.length / file.size) * 100)}% saved)`
    );
  }

  // Build S3 key
  const ext = contentType === "image/webp" ? ".webp" : "";
  const key =
    (process.env.BUCKET_FOLDER_PATH || "") +
    Date.now().toString() +
    file.originalname +
    ext;

  // Upload to S3
  const uploadResult = await s3Client
    .upload({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ACL: "public-read",
      ContentType: contentType,
    })
    .promise();

  // Return file object with shape matching what controllers expect
  file.key = key;
  file.location = uploadResult.Location;
  file.mimetype = contentType;
  file.size = buffer.length;
  delete file.buffer; // free memory

  return file;
}

// ─── Validation middleware (unchanged) ──────────────────────────────────────
exports.imageValidetion = (req, res, next) => {
  try {
    if (req.fileValidationError) {
      return res
        .status(400)
        .json({ success: false, message: req.fileValidationError });
    } else {
      next();
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Delete file from S3 ───────────────────────────────────────────────────
exports.deleteFileFromObjectStorage = (path) => {
  const Key = path;
  const params = {
    Bucket: process.env.LINODE_OBJECT_BUCKET,
    Key,
  };
  console.log(s3Client.deleteObject(params).promise());
};
