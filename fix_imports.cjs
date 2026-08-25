const fs = require('fs');
const path = require('path');

const walk = (dir, callback) => {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
};

const processFile = (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  const srcDirs = ['components', 'config', 'context', 'data', 'hooks', 'icons', 'layout', 'services', 'types', 'utils', 'firebaseConfig'];
  
  srcDirs.forEach(dir => {
    const regex = new RegExp(`from\\s+['"](\\.\\/|\\.\\.\\/)+${dir}(?:\\/(.*?))?['"]`, 'g');
    content = content.replace(regex, (match, p1, p2) => {
      return `from "@/${dir}${p2 ? '/' + p2 : ''}"`;
    });
    
    const regex2 = new RegExp(`import\\(['"](\\.\\/|\\.\\.\\/)+${dir}(?:\\/(.*?))?['"]\\)`, 'g');
    content = content.replace(regex2, (match, p1, p2) => {
      return `import("@/${dir}${p2 ? '/' + p2 : ''}")`;
    });
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed imports: ${filePath}`);
  }
};

walk('./app', processFile);
walk('./src', processFile);
