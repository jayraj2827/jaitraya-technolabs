const fs = require('fs');
const path = require('path');

const rootDir = path.resolve('.');
const files = [
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

let errors = 0;
let totalNavLinksChecked = 0;

/**
 * Attribute parser resilient to attribute order, spacing, newlines, and quotes
 */
function parseTagAttributes(tagStr) {
  const attrs = {};
  const attrRegex = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let match;
  while ((match = attrRegex.exec(tagStr)) !== null) {
    const key = match[1].toLowerCase();
    const val = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : (match[4] !== undefined ? match[4] : ''));
    attrs[key] = val;
  }
  return attrs;
}

/**
 * Check if a class string contains a specific class token
 */
function hasClass(classAttr, className) {
  if (!classAttr) return false;
  return classAttr.split(/\s+/).includes(className);
}

files.forEach(f => {
  const filePath = path.join(rootDir, f);
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] File missing: ${f}`);
    errors++;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const fileDir = path.dirname(filePath);

  // 1. Check for legacy dark logo anywhere in the file
  if (content.includes('jaitraya-logo-dark.png')) {
    console.error(`[ERROR] ${f} references forbidden legacy dark logo (jaitraya-logo-dark.png)!`);
    errors++;
  }

  // 2. Validate Brand Logo in Header
  const headerMatch = content.match(/<header[\s\S]*?<\/header>/i);
  if (!headerMatch) {
    console.error(`[ERROR] ${f} is missing a <header> element!`);
    errors++;
  } else {
    const headerHtml = headerMatch[0];
    const imgMatches = headerHtml.matchAll(/<img\b([^>]*)>/gi);
    let foundBrandLogo = false;
    for (const imgMatch of imgMatches) {
      const attrs = parseTagAttributes(imgMatch[1]);
      if (attrs.src && attrs.src.includes('jaitraya-logo')) {
        foundBrandLogo = true;
        // Verify it is the light logo
        if (!attrs.src.includes('jaitraya-logo-light.png')) {
          console.error(`[ERROR] ${f} header logo does not use jaitraya-logo-light.png: src="${attrs.src}"`);
          errors++;
        }
        // Verify file exists
        const resolvedLogo = path.resolve(fileDir, attrs.src.split('?')[0]);
        if (!fs.existsSync(resolvedLogo)) {
          console.error(`[ERROR] ${f} header logo path does not exist on disk: ${resolvedLogo}`);
          errors++;
        }
      }
    }
    if (!foundBrandLogo) {
      console.warn(`[WARN] ${f} header does not contain an <img> with jaitraya-logo`);
    }
  }

  // 3. Robust Desktop Navigation Check
  const desktopNavMatch = content.match(/<nav\b[^>]*class=["'][^"']*\bdesktop-nav\b[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i);
  if (desktopNavMatch) {
    const desktopNavHtml = desktopNavMatch[0];
    // Exclude dropdown menus when checking top-level links
    const withoutDropdowns = desktopNavHtml.replace(/<div\b[^>]*class=["'][^"']*\bnav-dropdown-menu\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');
    const aTags = withoutDropdowns.matchAll(/<a\b([^>]*)>/gi);

    for (const aTag of aTags) {
      const attrs = parseTagAttributes(aTag[1]);
      const href = (attrs.href || '').trim();
      const isNavLink = hasClass(attrs.class, 'nav-link');

      if (isNavLink) {
        totalNavLinksChecked++;
        // Ensure mulyankan-ai is NOT a top-level nav link
        if (href === 'mulyankan-ai.html' || href === '../mulyankan-ai.html' || href.endsWith('/mulyankan-ai.html')) {
          console.error(`[ERROR] ${f} exposes mulyankan-ai.html as top-level nav-link in desktop-nav! Must be inside Products dropdown.`);
          errors++;
        }
        // Verify navigation link target exists on disk
        const targetClean = href.split('?')[0].split('#')[0];
        if (targetClean && !targetClean.startsWith('http') && !targetClean.startsWith('mailto:')) {
          const resolvedLink = path.resolve(fileDir, targetClean);
          if (!fs.existsSync(resolvedLink)) {
            console.error(`[ERROR] ${f} desktop nav-link points to missing file: ${href} -> ${resolvedLink}`);
            errors++;
          }
        }
      }
    }
  } else {
    console.error(`[ERROR] ${f} is missing .desktop-nav!`);
    errors++;
  }

  // 4. Robust Mobile Drawer Navigation Check
  const drawerNavMatch = content.match(/<nav\b[^>]*class=["'][^"']*\bdrawer-nav\b[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i);
  if (drawerNavMatch) {
    const drawerNavHtml = drawerNavMatch[0];
    const aTags = drawerNavHtml.matchAll(/<a\b([^>]*)>/gi);

    for (const aTag of aTags) {
      const attrs = parseTagAttributes(aTag[1]);
      const href = (attrs.href || '').trim();
      const isDrawerLink = hasClass(attrs.class, 'drawer-link');

      if (isDrawerLink) {
        totalNavLinksChecked++;
        // If mulyankan-ai is used directly with .drawer-link as top-level link replacing Products
        if ((href === 'mulyankan-ai.html' || href === '../mulyankan-ai.html') && !attrs['data-sublink']) {
          // Check if drawer also has products.html
          if (!drawerNavHtml.includes('products.html')) {
            console.error(`[ERROR] ${f} has mulyankan-ai.html replacing Products in drawer-nav!`);
            errors++;
          }
        }
        // Verify navigation link target exists on disk
        const targetClean = href.split('?')[0].split('#')[0];
        if (targetClean && !targetClean.startsWith('http') && !targetClean.startsWith('mailto:')) {
          const resolvedLink = path.resolve(fileDir, targetClean);
          if (!fs.existsSync(resolvedLink)) {
            console.error(`[ERROR] ${f} drawer link points to missing file: ${href} -> ${resolvedLink}`);
            errors++;
          }
        }
      }
    }
  } else {
    console.error(`[ERROR] ${f} is missing .drawer-nav!`);
    errors++;
  }
});

if (errors === 0) {
  console.log(`✅ All ${files.length} pages verified clean: Valid light logo, robust attribute handling, and proper navigation graph integrity (${totalNavLinksChecked} nav links checked)!`);
} else {
  console.error(`❌ Found ${errors} navbar/logo/graph errors.`);
  process.exit(1);
}
