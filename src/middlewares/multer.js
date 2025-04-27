import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3 } from '../databases/s3.js';
import { AWS_BUCKET_NAME, NODE_ENV } from '../constants/constants.js';

// Configuración de almacenamiento para pruebas y producción
const storage = NODE_ENV === 'test'
  ? multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads'); // Usar directorio local para pruebas
    },
    filename: function (req, file, cb) {
      cb(null, `documents/${Date.now()}_${file.originalname}`); // Nombre único para cada archivo
    },
  })
  : multerS3({
    s3: s3,
    bucket: AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, `documents/${Date.now()}_${file.originalname}`);
    },
  });

// Middleware to upload PDF files
export const uploadPDF = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDFs are allowed'), false);
    }
  },
});

// Middleware to upload profile pictures
export const uploadProfilePic = multer({
  storage: NODE_ENV === 'test' // Local storage for tests
    ? multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, './uploads'); // Usar directorio local para pruebas
      },
      filename: function (req, file, cb) {
        cb(null, `profiles/${Date.now()}_${file.originalname}`);
      },
    })
    : multerS3({
      s3: s3,
      bucket: AWS_BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        cb(null, `profiles/${Date.now()}_${file.originalname}`);
      },
    }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});
