const fs = require('fs');
const path = require('path');

const rootDir = path.resolve('.');
const htmlFiles = [
  'index.html',
  'about.html',
  'solutions.html',
  'products.html',
  'mulyankan-ai.html',
  'mira.html',
  'technology.html',
  'projects.html',
  'contact.html',
  'legal/compliance.html',
  'legal/privacy.html',
  'legal/terms.html',
  'legal/cookies.html'
];

let totalErrors = 0;
let totalChecks = 0;
let totalAnchorsChecked = 0;

console.log('--- STARTING VERIFICATION AUDIT ---');

// Cache file contents to avoid redundant disk I/O when verifying cross-page anchors
const fileContentCache = new Map();
function getCachedContent(absPath) {
  if (!fileContentCache.has(absPath)) {
    if (fs.existsSync(absPath)) {
      fileContentCache.set(absPath, fs.readFileSync(absPath, 'utf8'));
    } else {
      return null;
    }
  }
  return fileContentCache.get(absPath);
}

function escapeRegex(str) {
  return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

htmlFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] File missing: ${file}`);
    totalErrors++;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  fileContentCache.set(filePath, content);
  const fileDir = path.dirname(filePath);

  // Check internal and anchor href links (support single and double quotes)
  const hrefMatches = content.matchAll(/href=["']([^"']+)["']/g);
  for (const match of hrefMatches) {
    totalChecks++;
    const rawHref = match[1].trim();

    // Skip protocol, phone, mailto, and script links
    if (rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) {
      continue;
    }
    if (rawHref.startsWith('http://') || rawHref.startsWith('https://')) {
      continue;
    }

    // Parse href into path and hash components
    const [pathWithQuery, hash] = rawHref.split('#');
    const pathOnly = (pathWithQuery || '').split('?')[0].trim();

    // Determine target file path
    const resolvedPath = pathOnly === '' ? filePath : path.resolve(fileDir, pathOnly);

    // Verify file existence
    if (!fs.existsSync(resolvedPath)) {
      console.error(`[BROKEN LINK] in ${file}: href="${rawHref}" -> ${resolvedPath} not found!`);
      totalErrors++;
      continue;
    }

    // If anchor hash is present, verify target element exists in destination file
    if (typeof hash === 'string') {
      const trimmedHash = hash.trim();
      if (trimmedHash.length > 0) {
        totalAnchorsChecked++;
        const targetContent = getCachedContent(resolvedPath);
        if (!targetContent) {
          console.error(`[BROKEN ANCHOR] in ${file}: Cannot read target file ${resolvedPath} for anchor #${trimmedHash}`);
          totalErrors++;
        } else {
          // Look for id="hash" or name="hash" attribute
          const anchorRegex = new RegExp(`(?:id|name)=["']${escapeRegex(trimmedHash)}["']`, 'i');
          if (!anchorRegex.test(targetContent)) {
            console.error(`[BROKEN ANCHOR] in ${file}: href="${rawHref}" -> element with id/name="${trimmedHash}" not found in ${path.relative(rootDir, resolvedPath)}!`);
            totalErrors++;
          }
        }
      }
    }
  }

  // Check img src and script src
  const srcMatches = content.matchAll(/src=["']([^"']+)["']/g);
  for (const match of srcMatches) {
    totalChecks++;
    let target = match[1].trim();

    // Skip data URIs and external scripts/images
    if (target.startsWith('data:') || target.startsWith('http://') || target.startsWith('https://')) {
      continue;
    }

    target = target.split('?')[0].split('#')[0].trim();
    const resolvedPath = path.resolve(fileDir, target);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`[BROKEN SRC] in ${file}: src="${match[1]}" -> ${resolvedPath} not found!`);
      totalErrors++;
    }
  }
});

console.log(`--- AUDIT FINISHED: Checked ${totalChecks} assets & links (${totalAnchorsChecked} anchor targets) across ${htmlFiles.length} pages. Errors: ${totalErrors} ---`);
if (totalErrors > 0) {
  process.exit(1);
} else {
  console.log('✅ ALL PAGES, IMAGES, STYLESHEETS, SCRIPTS, AND ANCHOR TARGETS VERIFIED SUCCESSFULLY!');
}
