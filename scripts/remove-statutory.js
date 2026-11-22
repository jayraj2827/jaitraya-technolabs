const fs = require('fs');
const path = require('path');

const htmlFiles = [
  'index.html',
  'about.html',
  'products.html',
  'mulyankan-ai.html',
  'technology.html',
  'team.html',
  'careers.html',
  'contact.html',
  'legal/compliance.html',
  'legal/privacy.html',
  'legal/terms.html',
  'legal/cookies.html'
];

htmlFiles.forEach(relPath => {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. Remove footer-legal-notice block
  content = content.replace(/\s*<div class="footer-legal-notice">[\s\S]*?<\/div>/g, '');

  // 2. Remove statutory-notice-card block from about.html, contact.html, team.html, etc.
  content = content.replace(/\s*<!-- Statutory Notice.*?-->\s*<div class="statutory-notice-card"[\s\S]*?<\/div>/gi, '');
  content = content.replace(/\s*<div class="statutory-notice-card"[\s\S]*?<\/div>/gi, '');

  // 3. Remove "DRAFT FOR STATUTORY REVIEW &middot; " or similar
  content = content.replace(/DRAFT FOR STATUTORY REVIEW &middot; /gi, '');
  content = content.replace(/DRAFT FOR STATUTORY REVIEW \/\/ /gi, '');

  // 4. In team.html, remove placeholder notes regarding MCA registry confirmation
  content = content.replace(/\s*<div style="font-size: 0\.78rem; color: var\(--color-text-muted\);">\s*\[Biographical profile and verified LinkedIn link will be published upon final MCA registry confirmation\]\s*<\/div>/g, '');
  content = content.replace(/Statutory Leadership/g, 'Executive Leadership');
  content = content.replace(/Statutory leadership aligned with the proposed JAITRAYA TECHNOLABS LLP governance structure\./g, 'Product architects and systems engineering leadership directing core technology platforms.');

  // 5. In contact.html, check if any statutory comments remain
  content = content.replace(/<!-- Statutory Notice -->/g, '');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Cleaned:', relPath);
});

console.log('Statutory removal complete.');
