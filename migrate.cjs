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

  // 1. Add "use client" if it has JSX or uses hooks, but for simplicity we can add it if not present
  if (filePath.endsWith('.tsx') && !content.startsWith('"use client"')) {
    content = '"use client";\n\n' + content;
  }

  // 2. Replace react-router Link with next/link
  if (content.includes('from "react-router"')) {
    content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]react-router['"];?/g, (match, imports) => {
      let parts = imports.split(',').map(i => i.trim()).filter(Boolean);
      let nextNavImports = [];
      let nextLink = false;
      let otherImports = [];

      parts.forEach(p => {
        if (p === 'Link') nextLink = true;
        else if (p === 'useNavigate') nextNavImports.push('useRouter');
        else if (p === 'useParams' || p === 'useLocation') nextNavImports.push(p === 'useLocation' ? 'usePathname' : p);
        else otherImports.push(p); // Outlet, Navigate, etc.
      });

      let replacements = [];
      if (nextLink) replacements.push('import Link from "next/link";');
      if (nextNavImports.length > 0) replacements.push(`import { ${nextNavImports.join(', ')} } from "next/navigation";`);
      
      // if there are leftover things we can't translate easily, just comment them or ignore them
      // for now, we just omit them since we're replacing them
      
      return replacements.join('\n');
    });
  }

  // Replace component usage
  content = content.replace(/<Link([^>]*)to=/g, '<Link$1href=');
  content = content.replace(/useNavigate\(\)/g, 'useRouter()');
  content = content.replace(/useLocation\(\)/g, 'usePathname()');
  content = content.replace(/const navigate =/g, 'const router =');
  content = content.replace(/navigate\(/g, 'router.push(');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
};

walk('./src', processFile);
