const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const pool = require('./db');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors({
  origin: ['http://127.0.0.1:5500','http://localhost:5500'],
  credentials: true
}));
app.use(express.json()); // ✅ This parses incoming JSON
app.use(express.urlencoded({ extended: true }));

const sessionStore = new MySQLStore({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'login_details'
});

app.use(session({
  key: 'session_cookie_name',
  secret: 'supersecretkey',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'lax', // required for cross-origin cookies
    secure: false,    // set true only if using HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 // 1 hour
  }  
}));

app.use('/storage', auth, express.static(path.join(__dirname, 'storage')));
app.use('/icons', auth, express.static(path.join(__dirname, 'icons')));
app.get('/', auth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

/*function auth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth'); // redirect to login/signup page
  }
  next();
}*/

// storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'storage/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

function auth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

// upload endpoint
/*app.post('/upload', auth, upload.array('files', 10), async (req, res) => {
  const files = req.files;

  const response = [];

  for (const file of files) {
    // Determine file category
    let categoryFolder = 'documents';
    if (file.mimetype.startsWith('image')) categoryFolder = 'photos';
    else if (file.mimetype.startsWith('video')) categoryFolder = 'videos';

    // Move file
    const oldPath = file.path;
    const newPath = path.join('storage', categoryFolder, file.filename);

    // ensure folder exists
    if (!fs.existsSync(path.join('storage', categoryFolder))) {
      fs.mkdirSync(path.join('storage', categoryFolder), { recursive: true });
    }

    fs.renameSync(oldPath, newPath);

    if (categoryFolder === 'videos') {
      const videoPath = newPath;
const outputPath = videoPath.replace(path.extname(videoPath), '.mp4');
const finalFilename = path.basename(outputPath);

const videoThumbPath = path.join('storage', 'videos', 'thumbnails');
if (!fs.existsSync(videoThumbPath)) {
  fs.mkdirSync(videoThumbPath, { recursive: true });
}

// 🚀 Run in background (NO await)
ffmpeg(videoPath)
  .output(outputPath)
  .on('end', () => {
    console.log('✅ Video converted to MP4');

    fs.unlinkSync(videoPath);

    // create thumbnail AFTER conversion
    ffmpeg(outputPath)
      .on('end', () => {
        console.log('✅ Thumbnail created:', finalFilename);
      })
      .on('error', err => console.error(err))
      .screenshots({
        count: 1,
        folder: videoThumbPath,
        size: '320x240',
        filename: finalFilename + '.png'
      });
  })
  .on('error', err => console.error(err))
  .run();

  // ✅ IMPORTANT: push UPDATED filename
  response.push({
    originalName: file.originalname,
    storedName: finalFilename,
    category: categoryFolder,
    path: outputPath
  });

  continue; // skip normal flow
}
    // =====================
    // CREATE THUMBNAILS
    // =====================

    if (categoryFolder === 'photos') {
      const thumbPath = path.join('storage', categoryFolder, 'thumbnails');

      if (!fs.existsSync(thumbPath)) {
        fs.mkdirSync(thumbPath, { recursive: true });
      }

      await sharp(newPath)
        .resize(200)
        .toFile(path.join(thumbPath, file.filename));
    }

    /*if (categoryFolder === 'videos') {
      const videoThumbPath = path.join('storage', categoryFolder, 'thumbnails');

    if (!fs.existsSync(videoThumbPath)) {
      fs.mkdirSync(videoThumbPath, { recursive: true });
    }

  ffmpeg(newPath)
    .on('start', (cmd) => {
      console.log('FFmpeg started:', cmd);
    })
    .on('end', () => {
      console.log('✅ Thumbnail created for video:', file.filename);
    })
    .on('error', (err) => {
      console.error('❌ FFmpeg error:', err.message);
    })
    .screenshots({
      count: 1,
      folder: videoThumbPath,
      size: '320x240',
      filename: file.filename + '.png'
    });
}

    response.push({
      originalName: file.originalname,
      storedName: file.filename,
      category: categoryFolder,
      path: newPath
    });
  }

  res.json({
    message: 'Files uploaded and categorized successfully',
    files: response
  });
});*/

app.post('/upload', auth, upload.array('files', 10), async (req, res) => {
  const files = req.files;
  const response = [];

  for (const file of files) {
    let categoryFolder = 'documents';
    if (file.mimetype.startsWith('image')) categoryFolder = 'photos';
    else if (file.mimetype.startsWith('video')) categoryFolder = 'videos';

    const oldPath = file.path;
    const newPath = path.join('storage', categoryFolder, file.filename);

    if (!fs.existsSync(path.join('storage', categoryFolder))) {
      fs.mkdirSync(path.join('storage', categoryFolder), { recursive: true });
    }

    fs.renameSync(oldPath, newPath);

    if (categoryFolder === 'videos') {
      const videoThumbPath = path.join('storage', 'videos', 'thumbnails');
      if (!fs.existsSync(videoThumbPath)) {
        fs.mkdirSync(videoThumbPath, { recursive: true });
      }

      const outputPath = newPath.replace(path.extname(newPath), '.mp4');
      const finalFilename = path.basename(outputPath);

      // ✅ Respond immediately with original file, convert in background
      response.push({
        originalName: file.originalname,
        storedName: file.filename,
        category: categoryFolder,
        path: newPath
      });

      // 🚀 Background conversion - does NOT block response
      setImmediate(() => {
        ffmpeg(newPath)
          .output(outputPath)
          .on('end', () => {
            console.log(`✅ Converted to MP4: ${finalFilename}`);
            // Delete original only after successful conversion
            if (fs.existsSync(newPath)) fs.unlinkSync(newPath);

            // Generate thumbnail after conversion
            ffmpeg(outputPath)
              .screenshots({
                count: 1,
                folder: videoThumbPath,
                size: '320x240',
                filename: finalFilename + '.png'
              })
              .on('end', () => console.log(`✅ Thumbnail created: ${finalFilename}`))
              .on('error', err => console.error('Thumbnail error:', err.message));
          })
          .on('error', err => console.error('FFmpeg conversion error:', err.message))
          .run();
      });

      continue;
    }

    if (categoryFolder === 'photos') {
      const thumbPath = path.join('storage', categoryFolder, 'thumbnails');
      if (!fs.existsSync(thumbPath)) {
        fs.mkdirSync(thumbPath, { recursive: true });
      }
      await sharp(newPath).resize(200).toFile(path.join(thumbPath, file.filename));
    }

    response.push({
      originalName: file.originalname,
      storedName: file.filename,
      category: categoryFolder,
      path: newPath
    });
  }

  res.json({
    message: 'Files uploaded successfully. Videos are being converted in the background.',
    files: response
  });
});

//get all files
app.get('/files', (req, res) => {
  const categories = ['photos', 'videos', 'documents'];
  const { category, search } = req.query; // optional filters
  const result = {};

  categories.forEach(cat => {
    if (category && category !== cat) return; // skip if filtering

    const folderPath = `storage/${cat}`;
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

    let files = fs.readdirSync(folderPath).filter(f => {
      const fullPath = path.join(folderPath, f);
      return fs.statSync(fullPath).isFile(); // only keep files
    });

    // filter by search keyword if provided
    if (search) {
      files = files.filter(f => f.toLowerCase().includes(search.toLowerCase()));
    }

    // map to include metadata
    const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
    const filesWithMeta = files.map(f => {
      const filePath = path.join(folderPath, f);
      const stats = fs.statSync(filePath);
       // Determine category icon
  let iconFile = 'default.png';
  if (cat === 'documents') {
    const ext = path.extname(f).toLowerCase();
    switch(ext) {
      case '.pdf': iconFile = 'pdf.png'; break;
      case '.doc': iconFile = 'doc.png'; break;
      case '.docx': iconFile = 'docx.png'; break;
      case '.xls': iconFile = 'xls.png'; break;
      case '.xlsx': iconFile = 'xlsx.png'; break;
      case '.ppt': iconFile = 'ppt.png'; break;
      case '.pptx': iconFile = 'pptx.png'; break;
      case '.txt': iconFile = 'txt.png'; break;
    }
  }

  return {
    name: f,
    uploaded: stats.birthtime.toISOString(),
    size: stats.size,
    url: `${BASE_URL}/storage/${cat}/${f}`,
    downloadUrl: `${BASE_URL}/files/${f}?download=true`,
    thumbnailUrl: cat === 'documents' 
                  ? `${BASE_URL}/icons/${iconFile}`
                  :  cat === 'videos'
                    ? `${BASE_URL}/storage/${cat}/thumbnails/${f}.png`//videos
                    : `${BASE_URL}/storage/${cat}/thumbnails/${f}`//photos
  };
});   

    result[cat] = filesWithMeta;
  });

  res.json(result);
});

// get specific file (download or view)
app.get('/files/:filename', auth, (req, res) => {
  const filename = req.params.filename;
  const download = req.query.download === 'true';
  const categories = ['photos', 'videos', 'documents'];

  let filepath = null;
  let categoryFolder = null;

  // find the file in any category folder
  for (const cat of categories) {
    const possiblePath = path.join('storage', cat, filename);
    if (fs.existsSync(possiblePath)) {
      filepath = possiblePath;
      categoryFolder = cat;
      break;
    }
  }

  if (!filepath) {
    return res.status(404).json({ error: 'File not found' });
  }

  if (download) {
    // download the file
    res.download(filepath, filename, (err) => {
      if (err) res.status(500).json({ error: 'Error downloading file' });
    });
  } else {
    // view the file in browser
    res.sendFile(path.join(__dirname, filepath));
  }
});

// delete file
app.delete('/files/:filename', auth, (req, res) => {
  const filename = req.params.filename;
  const categories = ['photos', 'videos', 'documents'];

  let filepath = null;
  let categoryFolder = null;

  // find the file in any category folder
  for (const cat of categories) {
    const possiblePath = path.join('storage', cat, filename);
    if (fs.existsSync(possiblePath)) {
      filepath = possiblePath;
      categoryFolder = cat;
      break;
    }
  }

  if (!filepath) {
    return res.status(404).json({ error: 'File not found' });
  }

  // delete the file
  fs.unlinkSync(filepath);

  // also delete thumbnail if photos or videos
  if (categoryFolder === 'photos' || categoryFolder === 'videos') {
    const thumbPath = path.join('storage', categoryFolder, 'thumbnails', filename);
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
  }

  res.json({ message: 'File and associated thumbnail (if any) deleted successfully' });
});

//login logic
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    req.session.user = { id: user.id, username: user.username, email: user.email };

    // ✅ Wait for session to be saved to MySQL BEFORE responding
    req.session.save((err) => {
      if (err) return res.status(500).json({ error: 'Session save failed' });
      res.json({ message: 'Login successful' });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

//signup logic
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.json({ message: 'User created' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

//logout logic
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

app.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.json({ loggedIn: false });
  }

  res.json({
    loggedIn: true,
    user: req.session.user
  });
});

//activate port for server testing
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});