const BASE_URL = 'http://127.0.0.1:3000'; // backend URL

const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const filesContainer = document.getElementById('files-container');

// Fetch and display files
async function fetchFiles() {
  filesContainer.innerHTML = '';

  try {
    const res = await fetch(`${BASE_URL}/files`);
    const data = await res.json();

    Object.keys(data).forEach(category => {
      if (data[category].length === 0) return;

      const section = document.createElement('div');
      section.className = 'category';

      const title = document.createElement('h2');
      title.textContent = category.toUpperCase();

      const grid = document.createElement('div');
      grid.className = 'files-grid';

      data[category].forEach(file => {
        const card = document.createElement('div');
        card.className = 'file-card';

        // IMAGE / VIDEO / DOCUMENT thumbnail click
        const thumb = document.createElement('img');
        thumb.src = file.thumbnailUrl;
        thumb.style.cursor = 'pointer';
        thumb.onclick = () => previewFile(file);

        const name = document.createElement('p');
        name.textContent = file.name;

        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download';
        downloadBtn.className = 'download-btn';
        downloadBtn.onclick = () => downloadFile(file.name);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => deleteFile(file.name);

        card.appendChild(thumb);
        card.appendChild(name);
        card.appendChild(downloadBtn);
        card.appendChild(deleteBtn);
        grid.appendChild(card);
      });

      section.appendChild(title);
      section.appendChild(grid);
      filesContainer.appendChild(section);
    });
  } catch (err) {
    console.error('Error fetching files:', err);
  }
}

// Upload files
uploadBtn.addEventListener('click', async () => {
  const files = fileInput.files;
  if (!files.length) return alert('Select files first!');

  const formData = new FormData();
  for (const file of files) formData.append('files', file);

  try {
    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    const data = await res.json();
    console.log('Upload response:', data);
    fetchFiles(); // refresh list
  } catch (err) {
    console.error('Upload error:', err);
  }
});

// Delete file
async function deleteFile(filename) {
  if (!confirm(`Delete ${filename}?`)) return;

  try {
    const res = await fetch(`${BASE_URL}/files/${filename}`, { 
      method: 'DELETE',
      credentials: 'include', 
    });
    const data = await res.json();
    console.log(data);
    fetchFiles(); // refresh list
  } catch (err) {
    console.error('Delete error:', err);
  }
}

// Download file
function downloadFile(filename) {
  const link = document.createElement('a');
  link.href = `${BASE_URL}/files/${filename}?download=true`;
  link.download = filename;
  link.click();
}

//preview file function
async function previewFile(file) {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
  const codeExtensions = ['.c', '.cpp', '.js', '.py', '.java'];

  // IMAGE → open directly
  if (ext.match(/\.jpg|\.jpeg|\.png|\.webp|\.gif$/i)) {
    window.open(file.url, '_blank');
  }

  // VIDEO → open directly
  /*else if (ext.match(/\.mp4|\.webm|\.ogg$/i)) {
  const newTab = window.open();
  newTab.document.write(`
    <html>
      <head>
        <title>${file.name}</title>
        <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
        <style>
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          #player-container {
            height: 100%;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          video {
            max-height: 100%; //video fits inside window 
            max-width: 100%;
          }
        </style>
      </head>
      <body>
        <video id="player" controls>
          <source src="${file.url}" type="video/mp4" />
          <track src="captions.vtt" kind="captions" srclang="en" label="English captions" />
        </video>
        <script src="https://cdn.plyr.io/3.7.8/plyr.polyfilled.js"></script>
        <script>
          const player = new Plyr('#player', { 
            controls: ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'mute', 'volume', 'captions','pip', 'settings', 'fullscreen'] 
          });
        </script>        
      </body>      
    </html>
  `);
  newTab.document.close();
}*/
  else if (ext.match(/\.mp4|\.webm|\.ogg$/i)) {
    window.open(file.url, '_blank');
  }

  // PDF → open directly
  else if (ext === '.pdf') {
    window.open(file.url, '_blank');
  }

  // OFFICE FILES → Microsoft viewer
  else if (officeExtensions.includes(ext)) {
    const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`;
    window.open(viewerUrl, '_blank');
  }

  // CODE FILES → open as text with highlighting
else if (codeExtensions.includes(ext)) {
  const newTab = window.open();
  try {
    const res = await fetch(file.url,  {
  credentials: 'include'
});
    const codeText = await res.text();

    newTab.document.write(`
      <html>
        <head>
          <title>${file.name}</title>
          <link href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet"/>
          <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-clike.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-c.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-cpp.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-javascript.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-java.min.js"></script>
          <style>
            body { background: #1e1e1e; color: #f8f8f2; margin: 0; padding: 20px; font-family: 'Fira Code', monospace; }
            pre { white-space: pre-wrap; word-wrap: break-word; font-size: 14px; }
          </style>
        </head>
        <body>
          <pre><code class="language-${getPrismLanguage(ext)}">${escapeHtml(codeText)}</code></pre>
          <script>Prism.highlightAll();</script>
        </body>
      </html>
    `);

    newTab.document.close();

  } catch (err) {
    newTab.document.write(`
      <p>Failed to load code preview. <a href="${file.url}">Download instead</a></p>
    `);
  }
}

  // OTHER FILES → open directly (browser will download if unsupported)
  else {
    window.open(file.url, '_blank');
  }
}

// helper to map file extension to Prism language
function getPrismLanguage(ext) {
  switch(ext) {
    case '.c': return 'c';
    case '.cpp': return 'cpp';
    case '.js': return 'javascript';
    case '.java': return 'java';
    default: return 'clike';
  }
}

// Helper to escape HTML for code files
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

/*function previewFile(file) {
  const modal = document.getElementById('preview-modal');
  const content = document.getElementById('preview-content');

  content.innerHTML = ''; // clear previous

  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

  // IMAGE
  if (ext.match(/\.jpg|\.jpeg|\.png|\.webp|\.gif$/i)) {
    content.innerHTML = `<img src="${file.url}" style="max-width:100%; max-height:80vh;" />`;
  }

  // VIDEO
  else if (ext.match(/\.mp4|\.webm|\.ogg$/i)) {
    content.innerHTML = `
      <video controls autoplay style="max-width:100%; max-height:80vh;">
        <source src="${file.url}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    `;
  }

  // PDF
  else if (ext === '.pdf') {
    content.innerHTML = `
      <iframe src="${file.url}" width="100%" height="600px"></iframe>
    `;
  }

  // OFFICE FILES
  else if (officeExtensions.includes(ext)) {
    const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`;
    window.open(viewerUrl, '_blank'); // open in new tab
    return; // no need to show modal
  }

  // OTHER FILES
  else {
    content.innerHTML = `
      <p style="color:white;">Preview not supported</p>
      <a href="${file.downloadUrl}" style="color:lightblue;">Download instead</a>
    `;
  }

  modal.style.display = 'flex';
}*/

async function checkAuth() {
  try {
    const res = await fetch(`${BASE_URL}/me`, {
      credentials: 'include'
    });

    const data = await res.json();

    if (!data.loggedIn) {
      // ❌ Not logged in → go to login page
      window.location.href = 'auth.html';
    } else {
      document.getElementById('user-name').textContent = data.user.username;
      document.getElementById('user-email').textContent = data.user.email || '';
      // ✅ Show username
      //document.getElementById('user-info').textContent = `Welcome, ${data.user.username}`;
    }

  } catch (err) {
    console.error('Auth check failed:', err);
    window.location.href = 'auth.html';
  }
}

/*async function init() {
  try {
    const res = await fetch(`${BASE_URL}/me`, {
      credentials: 'include'
    });

    const data = await res.json();

    if (!data.loggedIn) {
      window.location.href = 'auth.html';
      return;
    }

    // ✅ User is authenticated → now load UI
    document.getElementById('user-name').textContent = data.user.username;
    document.getElementById('user-email').textContent = data.user.email || '';

    // ✅ NOW fetch files (no flash)
    fetchFiles();

  } catch (err) {
    console.error('Auth check failed:', err);
    window.location.href = 'auth.html';
  }
}*/

// run app
//init();

// Initial fetch
checkAuth();
fetchFiles();