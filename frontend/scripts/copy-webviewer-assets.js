// Copy WebViewer static assets from the @pdftron/webviewer package into public/webviewer
// so the app serves them locally without any external CDN.

const fs = require('fs');
const path = require('path');

const pkgAssetsPath = path.join(__dirname, '..', 'node_modules', '@pdftron', 'webviewer', 'public');
const destPath = path.join(__dirname, '..', 'public', 'webviewer');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcEntry = path.join(src, entry);
    const destEntry = path.join(dest, entry);
    const stat = fs.statSync(srcEntry);
    if (stat.isDirectory()) {
      copyDir(srcEntry, destEntry);
    } else {
      fs.copyFileSync(srcEntry, destEntry);
    }
  }
}

try {
  if (!fs.existsSync(pkgAssetsPath)) {
    console.log('WebViewer package assets not found yet. Install dependencies first.');
    process.exit(0);
  }
  copyDir(pkgAssetsPath, destPath);
  console.log('WebViewer assets copied to', destPath);
} catch (e) {
  console.error('Failed to copy WebViewer assets:', e.message);
  process.exit(0);
}
