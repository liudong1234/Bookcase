import express from 'express';
import multer from 'multer';
import Mobi from 'mobi';
import EPub from 'epub-gen';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3001;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    // Preserve original filename but ensure it's safe
    const safeName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only accept MOBI files
    if (file.mimetype === 'application/x-mobipocket-ebook' || 
        path.extname(file.originalname).toLowerCase() === '.mobi') {
      cb(null, true);
    } else {
      cb(new Error('Only MOBI files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Promisify mobi.extract
const extractMobi = (filePath) => {
  return new Promise((resolve, reject) => {
    Mobi.extract(filePath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

// Endpoint to upload MOBI and convert to EPUB
app.post('/convert', upload.single('mobi'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No MOBI file uploaded.' });
    }

    // Create converted directory if it doesn't exist
    const convertedDir = path.join(__dirname, 'converted');
    await fs.mkdir(convertedDir, { recursive: true });

    const mobiFilePath = req.file.path;
    const epubFilePath = path.join(convertedDir, `${path.parse(req.file.originalname).name}.epub`);

    // Extract MOBI content
    const mobiData = await extractMobi(mobiFilePath);

    // Prepare content for EPUB
    const content = [];
    if (mobiData.content) {
      content.push({
        title: 'Main Content',
        data: mobiData.content
      });
    }

    // Generate EPUB
    const epubOptions = {
      title: mobiData.title || 'Converted Book',
      author: mobiData.author || 'Unknown Author',
      publisher: mobiData.publisher || 'Converted by MOBI to EPUB tool',
      content: content,
      cover: mobiData.cover, // If the MOBI file includes a cover
      css: `
        body {
          font-family: "Helvetica", "Arial", sans-serif;
          line-height: 1.6;
          padding: 1em;
        }
      `
    };

    await new EPub(epubOptions, epubFilePath).promise;

    // Clean up the uploaded MOBI file
    await fs.unlink(mobiFilePath);

    // Send success response with download path
    res.json({
      message: 'Conversion successful',
      epubPath: `/download/${path.basename(epubFilePath)}`
    });

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({
      error: 'Error during conversion process',
      details: error.message
    });
  }
});

// Endpoint to download converted EPUB files
app.get('/download/:filename', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'converted', req.params.filename);
    
    // Check if file exists
    await fs.access(filePath);
    
    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Error downloading file' });
      }
    });
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    details: err.message
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});