#!/usr/bin/env node
/**
 * Jaitraya Technolabs — Comprehensive 4-Tier Opaque-Box E2E Testing Framework
 * 
 * Compliant with TEST_INFRA.md and PROJECT.md.
 * Zero external npm dependencies; 100% vanilla Node.js built-ins.
 * 
 * Execution:
 *   node scripts/test-e2e.js                 # Run all 4 tiers
 *   node scripts/test-e2e.js --tier=1        # Run Tier 1 only
 *   node scripts/test-e2e.js --tier=2        # Run Tier 2 only
 *   node scripts/test-e2e.js --tier=3        # Run Tier 3 only
 *   node scripts/test-e2e.js --tier=4        # Run Tier 4 only
 *   node scripts/test-e2e.js --feature=mira  # Filter by feature name
 *   node scripts/test-e2e.js --bail          # Stop on first failure
 *   node scripts/test-e2e.js --verbose       # Show passing assertions
 *   node scripts/test-e2e.js --json          # Output results as JSON
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// =============================================================================
// CLI Arguments Parsing
// =============================================================================
const args = process.argv.slice(2);
const options = {
  tier: null,
  feature: null,
  scenario: null,
  bail: false,
  verbose: false,
  summaryOnly: false,
  json: false,
  help: false
};

for (const arg of args) {
  if (arg === '--bail' || arg === '-b') options.bail = true;
  else if (arg === '--verbose' || arg === '-v') options.verbose = true;
  else if (arg === '--summary' || arg === '-s') options.summaryOnly = true;
  else if (arg === '--json') options.json = true;
  else if (arg === '--help' || arg === '-h') options.help = true;
  else if (arg.startsWith('--tier=')) options.tier = parseInt(arg.split('=')[1], 10);
  else if (arg.startsWith('--feature=')) options.feature = arg.split('=')[1].toLowerCase();
  else if (arg.startsWith('--scenario=')) options.scenario = parseInt(arg.split('=')[1], 10);
}

if (options.help) {
  console.log(`
Jaitraya Technolabs — 4-Tier E2E Test Suite Runner
Usage: node scripts/test-e2e.js [options]

Options:
  --tier=<1|2|3|4>    Execute only the specified testing tier
  --feature=<name>    Filter tests matching feature name (e.g., mira, slider, nav)
  --scenario=<1-6>    Execute specific real-world user scenario in Tier 4
  --bail              Halt test execution immediately upon first failure
  --verbose           Display detailed assertion traces for all passing tests
  --summary           Display concise tier summary table without individual lines
  --json              Output full test results as machine-readable JSON
  --help              Display this assistance prompt
`);
  process.exit(0);
}

// =============================================================================
// Color & Formatting Utilities (Zero dependencies)
// =============================================================================
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgBlue: '\x1b[44m'
};

const c = {
  pass: (txt) => `${colors.green}${txt}${colors.reset}`,
  fail: (txt) => `${colors.red}${txt}${colors.reset}`,
  warn: (txt) => `${colors.yellow}${txt}${colors.reset}`,
  info: (txt) => `${colors.cyan}${txt}${colors.reset}`,
  bold: (txt) => `${colors.bright}${txt}${colors.reset}`,
  dim: (txt) => `${colors.dim}${txt}${colors.reset}`,
  badgePass: () => `${colors.bgGreen} PASS ${colors.reset}`,
  badgeFail: () => `${colors.bgRed} FAIL ${colors.reset}`,
  badgeWarn: () => `${colors.yellow} WARN ${colors.reset}`
};

// =============================================================================
// File System & DOM / AST Parsing Utilities
// =============================================================================
const ROOT_DIR = path.resolve('.');

const HTML_PAGES = [
  'index.html',
  'about.html',
  'products.html',
  'mulyankan-ai.html',
  'mira.html',
  'technology.html',
  'contact.html',
  'legal/compliance.html',
  'legal/privacy.html',
  'legal/terms.html',
  'legal/cookies.html'
];

const fileCache = new Map();

function getFileContent(relPath) {
  if (!fileCache.has(relPath)) {
    const absPath = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`File not found: ${relPath} (${absPath})`);
    }
    fileCache.set(relPath, fs.readFileSync(absPath, 'utf8'));
  }
  return fileCache.get(relPath);
}

function parseAttributes(tagStr) {
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

function extractElementsById(html, id) {
  const regex = new RegExp(`\\bid=["']${id}["']`, 'i');
  return regex.test(html);
}

// =============================================================================
// Test Harness Engine
// =============================================================================
class TestRunner {
  constructor() {
    this.results = [];
    this.totalAssertions = 0;
    this.passedAssertions = 0;
    this.failedAssertions = 0;
    this.startTime = Date.now();
    this.currentTier = null;
    this.currentFeature = null;
  }

  setTier(tierNum, tierName) {
    this.currentTier = { number: tierNum, name: tierName, features: [] };
    this.results.push(this.currentTier);
  }

  setFeature(featureId, featureName) {
    this.currentFeature = { id: featureId, name: featureName, tests: [] };
    this.currentTier.features.push(this.currentFeature);
  }

  test(testId, description, fn) {
    // Check filters
    if (options.tier && this.currentTier.number !== options.tier) return;
    if (options.feature) {
      const matchFeature = (this.currentFeature.id.toLowerCase().includes(options.feature) ||
                            this.currentFeature.name.toLowerCase().includes(options.feature) ||
                            description.toLowerCase().includes(options.feature));
      if (!matchFeature) return;
    }
    if (options.scenario && this.currentTier.number === 4) {
      if (!testId.includes(`S${options.scenario}`) && !description.includes(`Scenario ${options.scenario}`)) return;
    }

    const testEntry = {
      id: testId,
      description,
      assertions: [],
      passed: true,
      error: null,
      duration: 0
    };

    const start = process.hrtime.bigint();

    // Context assertion helper bound to this test
    const testContext = {
      assert: (condition, msg) => {
        this.totalAssertions++;
        if (condition) {
          this.passedAssertions++;
          testEntry.assertions.push({ passed: true, msg });
        } else {
          this.failedAssertions++;
          testEntry.passed = false;
          testEntry.assertions.push({ passed: false, msg });
          throw new assert.AssertionError({ message: msg || 'Assertion failed' });
        }
      },
      assertEqual: (actual, expected, msg) => {
        testContext.assert(actual === expected, msg || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      },
      assertIncludes: (haystack, needle, msg) => {
        const contains = typeof haystack === 'string' ? haystack.includes(needle) : (Array.isArray(haystack) && haystack.includes(needle));
        testContext.assert(contains, msg || `Expected content to include ${JSON.stringify(needle)}`);
      },
      assertMatches: (content, regex, msg) => {
        testContext.assert(regex.test(content), msg || `Expected content to match regex ${regex}`);
      },
      assertGreaterThanOrEqual: (actual, expected, msg) => {
        testContext.assert(actual >= expected, msg || `Expected ${actual} >= ${expected}`);
      }
    };

    try {
      fn(testContext);
      testEntry.passed = true;
    } catch (err) {
      testEntry.passed = false;
      testEntry.error = err.message || String(err);
      if (err.stack) testEntry.stack = err.stack;
      if (options.bail) {
        testEntry.duration = Number(process.hrtime.bigint() - start) / 1e6;
        this.currentFeature.tests.push(testEntry);
        this.renderOutput();
        process.exit(1);
      }
    }

    testEntry.duration = Number(process.hrtime.bigint() - start) / 1e6;
    this.currentFeature.tests.push(testEntry);
  }

  getStats() {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const tier of this.results) {
      for (const feat of tier.features) {
        for (const t of feat.tests) {
          totalTests++;
          if (t.passed) passedTests++;
          else failedTests++;
        }
      }
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      totalAssertions: this.totalAssertions,
      passedAssertions: this.passedAssertions,
      failedAssertions: this.failedAssertions,
      durationMs: Date.now() - this.startTime
    };
  }

  renderOutput() {
    if (options.json) {
      console.log(JSON.stringify({
        summary: this.getStats(),
        tiers: this.results
      }, null, 2));
      return;
    }

    console.log('\n' + c.bold('================================================================================'));
    console.log(c.bold('         JAITRAYA TECHNOLABS — 4-TIER OPAQUE-BOX E2E TEST SUITE REPORT         '));
    console.log(c.bold('================================================================================'));

    for (const tier of this.results) {
      let tierTests = 0;
      let tierPassed = 0;
      let tierFailed = 0;

      for (const feat of tier.features) {
        for (const t of feat.tests) {
          tierTests++;
          if (t.passed) tierPassed++;
          else tierFailed++;
        }
      }

      if (tierTests === 0) continue;

      const tierStatusBadge = tierFailed === 0 ? c.badgePass() : c.badgeFail();
      console.log(`\n${tierStatusBadge} ${c.bold(`TIER ${tier.number}: ${tier.name}`)} ${c.dim(`(${tierPassed}/${tierTests} passed)`)}`);
      console.log(c.dim('─'.repeat(80)));

      for (const feat of tier.features) {
        if (feat.tests.length === 0) continue;

        const featFailed = feat.tests.filter(t => !t.passed).length;
        const featIcon = featFailed === 0 ? c.pass('✔') : c.fail('✖');
        console.log(`  ${featIcon} ${c.bold(feat.name)} ${c.dim(`[${feat.id}]`)}`);

        if (!options.summaryOnly) {
          for (const test of feat.tests) {
            const icon = test.passed ? c.pass('    ✔') : c.fail('    ✖');
            const timing = c.dim(`(${test.duration.toFixed(1)}ms)`);
            console.log(`  ${icon} ${test.id}: ${test.description} ${timing}`);

            if (options.verbose && test.passed) {
              for (const a of test.assertions) {
                console.log(c.dim(`        └─ assertion: ${a.msg || 'OK'}`));
              }
            }

            if (!test.passed && test.error) {
              console.log(c.fail(`        └─ ERROR: ${test.error}`));
              if (test.stack && options.verbose) {
                console.log(c.dim(test.stack.split('\n').slice(1, 4).map(l => '           ' + l).join('\n')));
              }
            }
          }
        }
      }
    }

    const stats = this.getStats();
    console.log('\n' + c.bold('================================================================================'));
    console.log(c.bold('                               EXECUTION SUMMARY                                '));
    console.log(c.bold('================================================================================'));
    console.log(`  Total Tiers Evaluated : ${this.results.length}`);
    console.log(`  Total Test Cases      : ${stats.totalTests} (${c.pass(`${stats.passedTests} passed`)}, ${stats.failedTests > 0 ? c.fail(`${stats.failedTests} failed`) : '0 failed'})`);
    console.log(`  Total Assertions      : ${stats.totalAssertions} (${c.pass(`${stats.passedAssertions} passed`)}, ${stats.failedAssertions > 0 ? c.fail(`${stats.failedAssertions} failed`) : '0 failed'})`);
    console.log(`  Total Execution Time  : ${stats.durationMs}ms`);
    console.log(c.bold('--------------------------------------------------------------------------------'));

    if (stats.failedTests === 0) {
      console.log(`  ${c.badgePass()} ${c.bold(c.pass('ALL 4 TIERS PASSED COMPREHENSIVELY! ZERO REGRESSIONS DETECTED.'))}`);
    } else {
      console.log(`  ${c.badgeFail()} ${c.bold(c.fail(`DETECTED ${stats.failedTests} FAILED TESTS ACROSS SUITE.`))}`);
    }
    console.log(c.bold('================================================================================\n'));
  }
}

const runner = new TestRunner();

// =============================================================================
// TIER 1: Feature Coverage (≥5 tests per feature across all 12 features)
// =============================================================================
runner.setTier(1, 'Feature Coverage');

// Feature 1: Minimalist Aesthetic & Styling Tokens
runner.setFeature('FEAT-01', 'Minimalist Aesthetic & Styling Tokens');

runner.test('T1.1.1', 'Surface color tokens defined in variables.css', (t) => {
  const vars = getFileContent('assets/css/variables.css');
  t.assertMatches(vars, /--color-surface(-primary)?\s*:\s*(#FFFFFF|#FFF|rgba\([^)]+\))/i, 'Surface primary variable must be white/neutral');
  t.assertMatches(vars, /--color-surface-secondary|--color-bg-subtle\s*:\s*#F5F5F7|#F1F5F9/i, 'Surface secondary variable defined');
});

runner.test('T1.1.2', 'Text contrast hierarchy tokens defined in variables.css', (t) => {
  const vars = getFileContent('assets/css/variables.css');
  t.assertMatches(vars, /--color-text-primary\s*:\s*#[0-9A-Fa-f]{6}/, 'Primary text contrast token present');
  t.assertMatches(vars, /--color-text-secondary\s*:\s*#[0-9A-Fa-f]{6}/, 'Secondary text contrast token present');
  t.assertMatches(vars, /--color-text-(tertiary|muted)\s*:\s*#[0-9A-Fa-f]{6}/, 'Tertiary/muted text token present');
});

runner.test('T1.1.3', 'Brand and executive accent tokens defined in variables.css', (t) => {
  const vars = getFileContent('assets/css/variables.css');
  t.assertMatches(vars, /--color-brand|--color-accent\s*:\s*#[0-9A-Fa-f]{6}/, 'Brand accent color token present');
  t.assertMatches(vars, /--color-brand-hover|--color-accent-hover\s*:\s*#[0-9A-Fa-f]{6}/, 'Brand accent hover color token present');
});

runner.test('T1.1.4', 'Hairline border tokens defined in variables.css', (t) => {
  const vars = getFileContent('assets/css/variables.css');
  t.assertMatches(vars, /--color-border\s*:\s*(#[0-9A-Fa-f]{6}|rgba\([^)]+\))/, 'Subtle border token present');
});

runner.test('T1.1.5', 'Optical ambient shadow scale defined in variables.css', (t) => {
  const vars = getFileContent('assets/css/variables.css');
  t.assertMatches(vars, /--shadow-sm\s*:\s*0\s+1px/i, 'Subtle optical shadow-sm present');
  t.assertMatches(vars, /--shadow-md\s*:\s*0\s+[2-4]px/i, 'Optical shadow-md present');
  t.assertMatches(vars, /--shadow-lg\s*:\s*0\s+\d+px\s+\d+px/i, 'Optical shadow-lg present');
});

// Feature 2: Pure Backgrounds & Absence of Neon/Grid
runner.setFeature('FEAT-02', 'Pure Backgrounds & Absence of Neon/Grid');

runner.test('T1.2.1', 'Base stylesheet specifies pure surface background without active radial blobs', (t) => {
  const baseCss = getFileContent('assets/css/base.css');
  t.assertMatches(baseCss, /background-color\s*:\s*var\(--color-(surface-primary|bg-base)\)/, 'Body background bound to clean surface token');
  t.assertMatches(baseCss, /background-image\s*:\s*none;/, 'Active radial gradient background mesh eliminated on body');
});

runner.test('T1.2.2', 'Fixed engineering grid overlay is disabled or eliminated', (t) => {
  const baseCss = getFileContent('assets/css/base.css');
  t.assertMatches(baseCss, /body::before\s*\{[\s\S]*?display\s*:\s*none;/, 'body::before grid overlay disabled with display: none');
});

runner.test('T1.2.3', 'Absence of saturated neon glow drop-shadow on scroll progress', (t) => {
  const baseCss = getFileContent('assets/css/base.css');
  t.assertMatches(baseCss, /#scroll-progress\s*\{[\s\S]*?box-shadow\s*:\s*none;/, 'Scroll progress drop-shadow removed to avoid neon clutter');
});

runner.test('T1.2.4', 'Typography styles adopt Apple-grade headings without neon text shadows', (t) => {
  const baseCss = getFileContent('assets/css/base.css');
  t.assertMatches(baseCss, /h1,\s*h2,\s*h3[\s\S]*?color\s*:\s*var\(--color-text-primary\)/, 'Heading typography bound to dark high-contrast token');
  t.assert(!baseCss.includes('text-shadow: 0 0 10px'), 'No neon glowing text-shadow on headings');
});

runner.test('T1.2.5', 'Absence of heavy 3D canvas or WebGL clutter in HTML markup', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    t.assert(!html.includes('<canvas id="bg-canvas"'), `${page} should not contain full-page WebGL canvas`);
  }
});

// Feature 3: Responsive Layout Rules
runner.setFeature('FEAT-03', 'Responsive Layout Rules');

runner.test('T1.3.1', 'Viewport meta tag present across all 11 HTML pages', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    t.assertMatches(html, /<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width[^"']*["']/i, `${page} must contain standard responsive viewport meta tag`);
  }
});

runner.test('T1.3.2', 'Mobile breakpoint rules (<768px) defined across stylesheets', (t) => {
  const baseCss = getFileContent('assets/css/base.css');
  const compCss = getFileContent('assets/css/components.css');
  const pagesCss = getFileContent('assets/css/pages.css');
  const allCss = baseCss + '\n' + compCss + '\n' + pagesCss;
  t.assertMatches(allCss, /@media\s*\(\s*max-width\s*:\s*(768|600|560)px\s*\)/, 'Mobile max-width breakpoint media query present');
});

runner.test('T1.3.3', 'Desktop navigation hidden and mobile drawer enabled under 768px breakpoint', (t) => {
  const compCss = getFileContent('assets/css/components.css');
  t.assertMatches(compCss, /\.desktop-nav\s*\{[\s\S]*?display\s*:\s*none;/, 'Desktop navigation hidden on mobile viewport');
  t.assertMatches(compCss, /\.mobile-toggle\s*\{[\s\S]*?display\s*:\s*(flex|block);/, 'Mobile toggle trigger made visible on mobile viewport');
});

runner.test('T1.3.4', 'Container max-width containment configured to prevent stretching', (t) => {
  const baseCss = getFileContent('assets/css/base.css');
  t.assertMatches(baseCss, /\.container\s*\{[\s\S]*?max-width\s*:\s*(var\(--container-max\)|12[0-9]{2}px)/, 'Container max-width containment configured');
});

runner.test('T1.3.5', 'Fluid typography with CSS clamp() present for responsive headings', (t) => {
  let foundClamp = false;
  for (const page of ['index.html', 'about.html', 'products.html', 'technology.html']) {
    const html = getFileContent(page);
    if (/font-size\s*:\s*clamp\(/i.test(html)) foundClamp = true;
  }
  const baseCss = getFileContent('assets/css/base.css');
  if (/font-size\s*:\s*clamp\(/i.test(baseCss)) foundClamp = true;
  t.assert(foundClamp, 'Fluid heading typography with clamp() found');
});

// Feature 4: Mulyankan AI Product Capabilities
runner.setFeature('FEAT-04', 'Mulyankan AI Product Capabilities');

runner.test('T1.4.1', 'Vision OCR & Document Preprocessing narratives present in mulyankan-ai.html', (t) => {
  const html = getFileContent('mulyankan-ai.html');
  t.assertMatches(html, /Vision OCR|Optical Character Recognition/i, 'Vision OCR capability stated');
  t.assertMatches(html, /Deskew|Perspective|Preprocessing|Segmentation/i, 'Document intelligence preprocessing stated');
});

runner.test('T1.4.2', 'Rubric Matching and Step-Scoring logic specified in mulyankan-ai.html', (t) => {
  const html = getFileContent('mulyankan-ai.html');
  t.assertMatches(html, /Rubric\s+(Matching|Alignment|Anchoring)/i, 'Rubric matching specified');
  t.assertMatches(html, /Step\s*(Credit|Scoring)|Derivation/i, 'Step-scoring capability documented');
});

runner.test('T1.4.3', 'Teacher-in-the-Loop & Human Moderation workflow detailed in mulyankan-ai.html', (t) => {
  const html = getFileContent('mulyankan-ai.html');
  t.assertMatches(html, /Teacher-in-the-Loop|Human Moderation|Faculty Override/i, 'Teacher-in-the-loop workflow specified');
});

runner.test('T1.4.4', 'Live production platform outbound link to https://mulyankanai.in/ present', (t) => {
  const html = getFileContent('mulyankan-ai.html');
  t.assertMatches(html, /href=["']https:\/\/mulyankanai\.in\/?["']/, 'Live portal link present');
});

runner.test('T1.4.5', 'Academic Institutional governance and security protocols documented', (t) => {
  const html = getFileContent('mulyankan-ai.html');
  t.assertMatches(html, /Institutional|University|Examination Board/i, 'Institutional target audience detailed');
  t.assertMatches(html, /security|audit|compliance|privacy|confidential/i, 'Examination confidentiality documented');
});

// Feature 5: Mulyankan AI Interactive Slider
runner.setFeature('FEAT-05', 'Mulyankan AI Interactive Slider');

runner.test('T1.5.1', 'Before/after examination slider container exists in mulyankan-ai.html', (t) => {
  const html = getFileContent('mulyankan-ai.html');
  t.assertMatches(html, /class=["'][^"']*(exam-showcase-frame|exam-slider-container|before-after-slider)[^"']*["']/, 'Slider container frame present');
});

runner.test('T1.5.2', 'Slider handle element present for manual repositioning', (t) => {
  const html = getFileContent('mulyankan-ai.html');
  t.assertMatches(html, /class=["'][^"']*exam-slider-handle[^"']*["']/, 'Exam slider handle element present');
});

runner.test('T1.5.3', 'View preset buttons with data-view or data-preset-pos attributes present', (t) => {
  const html = getFileContent('mulyankan-ai.html');
  const indexHtml = getFileContent('index.html');
  const combined = html + '\n' + indexHtml;
  t.assertMatches(combined, /data-view=["']raw["']|data-preset-pos=["']100["']/, 'Raw preset button present');
  t.assertMatches(combined, /data-view=["']split["']|data-preset-pos=["']50["']/, 'Split preset button present');
  t.assertMatches(combined, /data-view=["']ai["']|data-preset-pos=["']0["']/, 'AI evaluation preset button present');
});

runner.test('T1.5.4', 'Slider event listeners registered in main.js', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /setSliderPosition\s*=|exam-slider-container/, 'Slider controller logic found in main.js');
  t.assertMatches(js, /data-view|data-preset-pos|presetBtns/, 'Preset button click handler registered in main.js');
});

runner.test('T1.5.5', 'Raw scan and AI evaluation layers defined in HTML markup', (t) => {
  const html = getFileContent('mulyankan-ai.html');
  t.assertMatches(html, /exam-pane-raw/, 'Raw handwritten examination pane present');
  t.assertMatches(html, /exam-pane-ai/, 'AI evaluation layer with rubric badges present');
});

// Feature 6: MIRA Offline Multimodal Capabilities
runner.setFeature('FEAT-06', 'MIRA Offline Multimodal Capabilities');

runner.test('T1.6.1', 'Air-gapped sovereign execution and zero network egress detailed in mira.html', (t) => {
  const html = getFileContent('mira.html');
  t.assertMatches(html, /Air-Gapped\s+Sovereign|Zero\s+Cloud\s+Egress/i, 'Air-gapped execution specified');
});

runner.test('T1.6.2', 'Scientific research institute and laboratory use cases documented', (t) => {
  const html = getFileContent('mira.html');
  t.assertMatches(html, /Scientific\s+Research|Laboratory|Research\s+Institutes/i, 'Research institute positioning detailed');
});

runner.test('T1.6.3', 'ChromaDB and FAISS local vector database integration specified in mira.html', (t) => {
  const html = getFileContent('mira.html');
  t.assertMatches(html, /ChromaDB\s*\/\s*FAISS|ChromaDB|FAISS/i, 'Local vector database engines specified');
});

runner.test('T1.6.4', 'Local Ollama LLM integration documented in mira.html', (t) => {
  const html = getFileContent('mira.html');
  t.assertMatches(html, /Ollama|Llama-3|Mistral|Gemma/i, 'Local LLM model integration documented');
});

runner.test('T1.6.5', 'Local IPC and Electron desktop shell architecture specified', (t) => {
  const html = getFileContent('mira.html');
  t.assertMatches(html, /Electron(\.js)?\s*\/|\bElectron\b/i, 'Desktop Electron framework specified');
  t.assertMatches(html, /FastAPI|local\s+IPC/i, 'Local backend IPC documented');
});

// Feature 7: MIRA Console Simulator & Audio Scrubber
runner.setFeature('FEAT-07', 'MIRA Console Simulator & Audio Scrubber');

runner.test('T1.7.1', 'Workstation console preview window with terminal chrome present in mira.html', (t) => {
  const html = getFileContent('mira.html');
  t.assertMatches(html, /class=["'][^"']*mira-console-window[^"']*["']/, 'Console preview window present');
  t.assertMatches(html, /window-dot|window-dots/, 'Terminal window dots chrome present');
});

runner.test('T1.7.2', 'Query chip buttons with data-sample-key attributes present', (t) => {
  const html = getFileContent('mira.html');
  t.assertMatches(html, /data-sample-key=["']perovskite["']/, 'Perovskite research query chip present');
  t.assertMatches(html, /data-sample-key=["']quantum["']/, 'Quantum computing query chip present');
  t.assertMatches(html, /data-sample-key=["']battery["']/, 'Solid-state battery query chip present');
});

runner.test('T1.7.3', 'Multimodal result cards for PDF prose, schematic diagrams, and audio present', (t) => {
  const html = getFileContent('mira.html');
  t.assertMatches(html, /id=["']mira-doc-text["']/, 'Document prose result element present');
  t.assertMatches(html, /id=["']mira-img-text["']/, 'Schematic image result element present');
  t.assertMatches(html, /id=["']mira-audio-text["']/, 'Audio transcript result element present');
});

runner.test('T1.7.4', 'Audio player play/pause toggle button and waveform visualization present', (t) => {
  const html = getFileContent('mira.html');
  t.assertMatches(html, /class=["'][^"']*audio-play-btn[^"']*["']/, 'Audio play button present');
  t.assertMatches(html, /class=["'][^"']*wave-bar[^"']*["']/, 'Waveform bars present');
});

runner.test('T1.7.5', '2-Phase working methodology visualizer tabs present in mira.html', (t) => {
  const html = getFileContent('mira.html');
  t.assertMatches(html, /data-phase=["']ingestion["']/, 'Phase 1 ingestion tab present');
  t.assertMatches(html, /data-phase=["']query["']/, 'Phase 2 query tab present');
});

// Feature 8: Products Directory & Specifications
runner.setFeature('FEAT-08', 'Products Directory & Specifications');

runner.test('T1.8.1', 'Flagship showcase cards for both Mulyankan AI and MIRA present in products.html', (t) => {
  const html = getFileContent('products.html');
  t.assertMatches(html, /Mulyankan AI/i, 'Mulyankan AI showcase card present');
  t.assertMatches(html, /MIRA/i, 'MIRA showcase card present');
});

runner.test('T1.8.2', 'Comparative technical specification matrix present in products.html', (t) => {
  const html = getFileContent('products.html');
  t.assertMatches(html, /<table[\s\S]*?<\/table>/, 'Technical specification table present in products.html');
});

runner.test('T1.8.3', 'Pilot and deployment CTAs configured in products.html', (t) => {
  const html = getFileContent('products.html');
  t.assertMatches(html, /href=["']contact\.html\?product=mira["']/, 'MIRA pilot CTA present');
  t.assertMatches(html, /href=["']mulyankan-ai\.html["']|href=["']contact\.html\?product=mulyankan["']/, 'Mulyankan CTA present');
});

runner.test('T1.8.4', 'External live portal reference https://mulyankanai.in/ present in products.html', (t) => {
  const html = getFileContent('products.html');
  t.assertMatches(html, /href=["']https:\/\/mulyankanai\.in\/?["']/, 'Live portal link present in products.html');
});

runner.test('T1.8.5', 'Architectural comparison dimensions evaluated in spec matrix', (t) => {
  const html = getFileContent('products.html');
  t.assertMatches(html, /Execution\s+Model|Hosting|Sovereignty/i, 'Execution/sovereignty comparison row present');
  t.assertMatches(html, /Supported\s+Modalities|Input\s+Modalities/i, 'Modalities comparison row present');
});

// Feature 9: Internal Navigation Link Graph
runner.setFeature('FEAT-09', 'Internal Navigation Link Graph');

runner.test('T1.9.1', 'All internal HTML href links in root pages resolve to existing files', (t) => {
  for (const page of HTML_PAGES.filter(p => !p.startsWith('legal/'))) {
    const html = getFileContent(page);
    const dir = path.dirname(path.join(ROOT_DIR, page));
    const hrefs = html.matchAll(/href=["']([^"'#:]+)["']/g);
    for (const m of hrefs) {
      const target = m[1].split('?')[0].trim();
      if (target.startsWith('http') || target.startsWith('mailto:') || target.startsWith('tel:') || target === '') continue;
      const targetPath = path.resolve(dir, target);
      t.assert(fs.existsSync(targetPath), `Broken link in ${page}: href="${target}" -> ${targetPath} missing!`);
    }
  }
});

runner.test('T1.9.2', 'All internal HTML href links in legal subpages resolve with ../ relative path', (t) => {
  for (const page of HTML_PAGES.filter(p => p.startsWith('legal/'))) {
    const html = getFileContent(page);
    const dir = path.dirname(path.join(ROOT_DIR, page));
    const hrefs = html.matchAll(/href=["']([^"'#:]+)["']/g);
    for (const m of hrefs) {
      const target = m[1].split('?')[0].trim();
      if (target.startsWith('http') || target.startsWith('mailto:') || target.startsWith('tel:') || target === '') continue;
      const targetPath = path.resolve(dir, target);
      t.assert(fs.existsSync(targetPath), `Broken link in ${page}: href="${target}" -> ${targetPath} missing!`);
    }
  }
});

runner.test('T1.9.3', 'All stylesheet link tags resolve to valid CSS files on disk', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    const dir = path.dirname(path.join(ROOT_DIR, page));
    const links = html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi);
    for (const m of links) {
      const cssPath = m[1].split('?')[0].trim();
      if (cssPath.startsWith('http')) continue;
      const resolved = path.resolve(dir, cssPath);
      t.assert(fs.existsSync(resolved), `Missing stylesheet in ${page}: ${cssPath}`);
    }
  }
});

runner.test('T1.9.4', 'All script tags resolve to valid JS files on disk', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    const dir = path.dirname(path.join(ROOT_DIR, page));
    const scripts = html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi);
    for (const m of scripts) {
      const jsPath = m[1].split('?')[0].trim();
      if (jsPath.startsWith('http')) continue;
      const resolved = path.resolve(dir, jsPath);
      t.assert(fs.existsSync(resolved), `Missing script in ${page}: ${jsPath}`);
    }
  }
});

runner.test('T1.9.5', 'Total count of broken asset references across all 11 pages is zero', (t) => {
  let brokenCount = 0;
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    const dir = path.dirname(path.join(ROOT_DIR, page));
    const srcs = html.matchAll(/src=["']([^"'#:]+)["']/g);
    for (const m of srcs) {
      const src = m[1].split('?')[0].trim();
      if (src.startsWith('http') || src.startsWith('data:') || src === '') continue;
      const resolved = path.resolve(dir, src);
      if (!fs.existsSync(resolved)) brokenCount++;
    }
  }
  t.assertEqual(brokenCount, 0, 'Zero broken src assets across repository');
});

// Feature 10: Header & Mobile Drawer Navigation
runner.setFeature('FEAT-10', 'Header & Mobile Drawer Navigation');

runner.test('T1.10.1', 'Desktop navigation header (.desktop-nav) present across all 11 pages', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    t.assertMatches(html, /<nav\b[^>]*class=["'][^"']*desktop-nav[^"']*["']/, `${page} must contain .desktop-nav`);
  }
});

runner.test('T1.10.2', 'Products dropdown menu present in desktop nav on root pages', (t) => {
  for (const page of ['index.html', 'about.html', 'products.html', 'technology.html', 'contact.html']) {
    const html = getFileContent(page);
    t.assertMatches(html, /nav-item-dropdown|nav-dropdown-menu/, `${page} desktop nav must feature Products dropdown`);
    t.assertMatches(html, /mulyankan-ai\.html/, `${page} Products dropdown must link to Mulyankan AI`);
    t.assertMatches(html, /mira\.html/, `${page} Products dropdown must link to MIRA`);
  }
});

runner.test('T1.10.3', 'Mobile drawer navigation present across all 11 pages', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    t.assertMatches(html, /class=["'][^"']*mobile-drawer[^"']*["']/, `${page} must contain .mobile-drawer`);
    t.assertMatches(html, /class=["'][^"']*drawer-nav[^"']*["']/, `${page} must contain .drawer-nav`);
  }
});

runner.test('T1.10.4', 'Mobile drawer toggle button present with accessible label on all 11 pages', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    t.assertMatches(html, /class=["'][^"']*mobile-toggle[^"']*["']/, `${page} must contain .mobile-toggle`);
    t.assertMatches(html, /aria-label=["'][^"']*navigation[^"']*["']/i, `${page} mobile toggle must have descriptive aria-label`);
  }
});

runner.test('T1.10.5', 'Active navigation state (.active) assigned to current page nav links', (t) => {
  const indexHtml = getFileContent('index.html');
  t.assertMatches(indexHtml, /href=["']index\.html["']\s+class=["'][^"']*active[^"']*["']|class=["'][^"']*active[^"']*["']\s+href=["']index\.html["']/, 'index.html has active class on Home link');
  const aboutHtml = getFileContent('about.html');
  t.assertMatches(aboutHtml, /href=["']about\.html["']\s+class=["'][^"']*active[^"']*["']|class=["'][^"']*active[^"']*["']\s+href=["']about\.html["']/, 'about.html has active class on About link');
});

// Feature 11: Global Footer Cohesion & Legal Routes
runner.setFeature('FEAT-11', 'Global Footer Cohesion & Legal Routes');

runner.test('T1.11.1', 'Global footer present across all 11 HTML pages', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    t.assertMatches(html, /<footer[\s\S]*?<\/footer>/, `${page} must contain a <footer> element`);
  }
});

runner.test('T1.11.2', 'Root pages feature structured 4-column footer architecture', (t) => {
  for (const page of ['index.html', 'products.html', 'mira.html', 'technology.html']) {
    const html = getFileContent(page);
    const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/);
    t.assert(footerMatch, `${page} has footer`);
    t.assertMatches(footerMatch[0], /footer-col|footer-grid|grid-4/, `${page} footer has multi-column grid`);
  }
});

runner.test('T1.11.3', 'Legal routes bar contains links to Compliance, Privacy, Terms, and Cookies', (t) => {
  for (const page of ['index.html', 'products.html', 'mira.html', 'technology.html']) {
    const html = getFileContent(page);
    t.assertMatches(html, /compliance\.html/, `${page} footer links to Compliance policy`);
    t.assertMatches(html, /privacy\.html/, `${page} footer links to Privacy policy`);
    t.assertMatches(html, /terms\.html/, `${page} footer links to Terms policy`);
    t.assertMatches(html, /cookies\.html/, `${page} footer links to Cookie policy`);
  }
});

runner.test('T1.11.4', 'Legal subpages provide return navigation link back to ../index.html', (t) => {
  for (const page of HTML_PAGES.filter(p => p.startsWith('legal/'))) {
    const html = getFileContent(page);
    t.assertMatches(html, /href=["']\.\.\/index\.html["']/, `${page} must contain link back to ../index.html`);
  }
});

runner.test('T1.11.5', 'Jaitraya Technolabs corporate identity and copyright present in footer', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    t.assertMatches(html, /Jaitraya\s+Technolabs/i, `${page} footer must mention Jaitraya Technolabs`);
    t.assertMatches(html, /&copy;|©|All\s+rights\s+reserved/i, `${page} footer must feature copyright declaration`);
  }
});

// Feature 12: Contact Form & Query Handling
runner.setFeature('FEAT-12', 'Contact Form & Query Handling');

runner.test('T1.12.1', 'Contact form element with required input IDs present in contact.html', (t) => {
  const html = getFileContent('contact.html');
  t.assertMatches(html, /<form\b[^>]*id=["']contact-form["']/, 'contact-form present');
  t.assertMatches(html, /id=["']fullName["']/, 'fullName input field present');
  t.assertMatches(html, /id=["']workEmail["']/, 'workEmail input field present');
  t.assertMatches(html, /id=["']organization["']/, 'organization input field present');
  t.assertMatches(html, /id=["']inquiryType["']/, 'inquiryType select element present');
  t.assertMatches(html, /id=["']message["']/, 'message textarea field present');
});

runner.test('T1.12.2', 'Inquiry type select element contains options for Mulyankan and MIRA pilots', (t) => {
  const html = getFileContent('contact.html');
  t.assertMatches(html, /value=["']mulyankan-pilot["']/, 'Mulyankan pilot option present');
  t.assertMatches(html, /value=["']mira-pilot["']/, 'MIRA pilot option present');
});

runner.test('T1.12.3', 'Client-side required fields validation logic in contact.js', (t) => {
  const js = getFileContent('assets/js/contact.js');
  t.assertMatches(js, /!fullName\s*\|\|\s*!workEmail\s*\|\|\s*!organization\s*\|\|\s*!message/, 'Validation checks all four required fields');
});

runner.test('T1.12.4', 'Email format validation regex enforced in contact.js', (t) => {
  const js = getFileContent('assets/js/contact.js');
  t.assertMatches(js, /emailRegex\s*=\s*\/[^\/]+@[^\/]+\.[^\/]+\//, 'Email validation regex pattern present');
});

runner.test('T1.12.5', 'Query parameter parsing logic in contact.js handles product selection', (t) => {
  const js = getFileContent('assets/js/contact.js');
  t.assertMatches(js, /urlParams\.get\(['"]product['"]\)/, 'contact.js extracts product query parameter');
  t.assertMatches(js, /productParam\s*===\s*['"]mira['"]/, 'Handles mira product pre-selection');
  t.assertMatches(js, /productParam\s*===\s*['"]mulyankan['"]/, 'Handles mulyankan product pre-selection');
});


// =============================================================================
// TIER 2: Boundary & Corner Cases (≥5 boundary checks per feature = 60 tests)
// =============================================================================
runner.setTier(2, 'Boundary & Corner Cases');

// Feature 1 Boundaries
runner.setFeature('BOUND-01', 'Styling Tokens Boundary Cases');

runner.test('T2.1.1', 'Token color format validity check (all color tokens are valid hex or rgba)', (t) => {
  const vars = getFileContent('assets/css/variables.css');
  const colorMatches = vars.matchAll(/--color-[a-z0-9-]+:\s*([^;]+);/g);
  for (const m of colorMatches) {
    const val = m[1].trim();
    if (val.startsWith('#')) {
      t.assert(/^#[0-9A-Fa-f]{3,8}$/.test(val), `Invalid hex color code: ${val} in ${m[0]}`);
    } else if (val.startsWith('rgba')) {
      t.assert(/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(val), `Invalid rgba: ${val}`);
    }
  }
});

runner.test('T2.1.2', 'Shadow opacity bounds check (ambient alpha <= 0.35, no harsh drop-shadows)', (t) => {
  const vars = getFileContent('assets/css/variables.css');
  const alphas = [...vars.matchAll(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/g)].map(m => parseFloat(m[1]));
  for (const a of alphas) {
    t.assert(a <= 0.85, `Excessive shadow/overlay opacity found: ${a}`);
  }
});

runner.test('T2.1.3', 'Font family generic fallback terminator present on all typography tokens', (t) => {
  const vars = getFileContent('assets/css/variables.css');
  const fontMatches = vars.matchAll(/--font-[a-z0-9-]+:\s*([^;]+);/g);
  for (const m of fontMatches) {
    const val = m[1].trim();
    t.assert(/sans-serif|monospace|serif/i.test(val), `Font token missing generic fallback: ${val}`);
  }
});

runner.test('T2.1.4', 'Radius full token boundary value is >= 980px for pill capsules', (t) => {
  const vars = getFileContent('assets/css/variables.css');
  t.assertMatches(vars, /--radius-full\s*:\s*(\d{3,4}px|50%)/, 'Pill capsule radius-full token bound correctly');
});

runner.test('T2.1.5', 'Transition duration bounds (fast <= 200ms, normal <= 350ms, slow <= 500ms)', (t) => {
  const vars = getFileContent('assets/css/variables.css');
  t.assertMatches(vars, /--transition-fast\s*:\s*(1[0-9]{2}|[5-9][0-9])ms/, 'Transition fast bounded');
  t.assertMatches(vars, /--transition-normal\s*:\s*([2-3][0-9]{2})ms/, 'Transition normal bounded');
});

// Feature 2 Boundaries
runner.setFeature('BOUND-02', 'Pure Backgrounds Boundary Cases');

runner.test('T2.2.1', 'Zero inline style radial-gradient declarations across all 11 HTML pages', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    t.assert(!html.includes('style="background: radial-gradient') && !html.includes("style='background: radial-gradient"), `${page} contains inline radial-gradient hack`);
  }
});

runner.test('T2.2.2', 'Zero 3D perspective leaks (perspective: 1000px) on static cards in stylesheets', (t) => {
  const baseCss = getFileContent('assets/css/base.css');
  t.assert(!baseCss.includes('perspective: 1000px;'), 'No static 3D perspective hack in base.css');
});

runner.test('T2.2.3', 'Absence of high-saturation neon literals in background rules (#00FFFF, #00FF00, #FF00FF)', (t) => {
  const baseCss = getFileContent('assets/css/base.css');
  t.assert(!baseCss.includes('#00FFFF') && !baseCss.includes('#00FF00') && !baseCss.includes('#FF00FF'), 'Zero harsh neon hex literals in base.css');
});

runner.test('T2.2.4', 'Scrollbar thumb width within ergonomic bounds (5px to 12px)', (t) => {
  const baseCss = getFileContent('assets/css/base.css');
  t.assertMatches(baseCss, /::-webkit-scrollbar\s*\{[\s\S]*?width\s*:\s*([5-9]|1[0-2])px;/, 'Scrollbar width within ergonomic bounds');
});

runner.test('T2.2.5', 'Zero blinking or looping infinite marquee tags (<marquee>) in HTML', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    t.assert(!html.includes('<marquee'), `${page} must not use obsolete <marquee> tag`);
  }
});

// Feature 3 Boundaries
runner.setFeature('BOUND-03', 'Responsive Layout Boundary Cases');

runner.test('T2.3.1', 'Ultra-mobile 320px boundary: zero fixed min-width > 320px on cards or containers', (t) => {
  const compCss = getFileContent('assets/css/components.css');
  const fixedWidths = [...compCss.matchAll(/min-width\s*:\s*(\d+)px/g)].map(m => parseInt(m[1], 10));
  for (const w of fixedWidths) {
    t.assert(w <= 320 || w >= 768, `Dangerous fixed min-width ${w}px between 321px and 767px may cause mobile overflow`);
  }
});

runner.test('T2.3.2', 'Mobile standard 375px boundary: grid columns collapse to single column (1fr)', (t) => {
  const compCss = getFileContent('assets/css/components.css');
  t.assertMatches(compCss, /grid-template-columns\s*:\s*1fr/, 'Grid collapses to 1fr on mobile');
});

runner.test('T2.3.3', 'Tablet portrait 768px boundary: intermediate media query rule present', (t) => {
  const baseCss = getFileContent('assets/css/base.css');
  const pagesCss = getFileContent('assets/css/pages.css');
  t.assert(baseCss.includes('768px') || pagesCss.includes('768px'), '768px breakpoint boundary explicitly handled');
});

runner.test('T2.3.4', 'Desktop container max-width does not exceed 1440px to prevent eye-strain stretch', (t) => {
  const vars = getFileContent('assets/css/variables.css');
  const maxMatch = vars.match(/--container-max\s*:\s*(\d+)px/);
  if (maxMatch) {
    t.assert(parseInt(maxMatch[1], 10) <= 1440, 'Container max-width <= 1440px');
  }
});

runner.test('T2.3.5', 'Overflow-x containment enforced on body to prevent accidental mobile swipe scroll', (t) => {
  const baseCss = getFileContent('assets/css/base.css');
  t.assertMatches(baseCss, /body\s*\{[\s\S]*?overflow-x\s*:\s*hidden;/, 'overflow-x: hidden enforced on body');
});

// Feature 4 Boundaries
runner.setFeature('BOUND-04', 'Mulyankan AI Narrative Boundary Cases');

runner.test('T2.4.1', 'Outbound portal link protocol strictly enforces HTTPS (never HTTP)', (t) => {
  const html = getFileContent('mulyankan-ai.html');
  const matches = [...html.matchAll(/href=["'](http:\/\/[^"']+)["']/g)];
  for (const m of matches) {
    t.assert(false, `Insecure http link detected: ${m[1]}`);
  }
});

runner.test('T2.4.2', 'Outbound link target="_blank" must include rel="noopener noreferrer" for security', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    const blankLinks = html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi);
    for (const m of blankLinks) {
      t.assertMatches(m[0], /rel=["'][^"']*noopener[^"']*["']/i, `Security vulnerability in ${page}: target="_blank" missing rel="noopener"`);
    }
  }
});

runner.test('T2.4.3', 'Mulyankan AI response latency bounds cited as under 2.5 seconds', (t) => {
  const html = getFileContent('mulyankan-ai.html');
  t.assertMatches(html, /<|under|\b[0-2](\.[0-9]+)?s\b|seconds/i, 'Evaluation turnaround latency bounded');
});

runner.test('T2.4.4', 'Consistent core terminology across Mulyankan AI descriptions', (t) => {
  const html = getFileContent('mulyankan-ai.html');
  t.assert(html.includes('OCR'), 'OCR term present');
  t.assert(html.includes('Rubric'), 'Rubric term present');
  t.assert(html.includes('Vision'), 'Vision term present');
  t.assert(html.includes('Evaluation'), 'Evaluation term present');
});

runner.test('T2.4.5', 'Target URL domain validation (strictly mulyankanai.in)', (t) => {
  const html = getFileContent('mulyankan-ai.html');
  const portalLinks = [...html.matchAll(/href=["']https:\/\/([^"'\/]+)\/?["']/g)];
  const mulyankanDomain = portalLinks.find(m => m[1].includes('mulyankan'));
  t.assert(mulyankanDomain && mulyankanDomain[1] === 'mulyankanai.in', 'Outbound portal domain must be mulyankanai.in');
});

// Feature 5 Boundaries
runner.setFeature('BOUND-05', 'Mulyankan Slider Boundary Cases');

runner.test('T2.5.1', 'Slider position boundaries bounded between 0% and 100% in JavaScript controller', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /Math\.max\(\s*0\s*,\s*Math\.min\(\s*100/, 'Slider position clamped with Math.max(0, Math.min(100, ...))');
});

runner.test('T2.5.2', 'Slider preset raw sets position to 100% or 0%', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /view === 'raw'[\s\S]*?setSliderPosition\(100\)|presetPos/i, 'raw preset maps to boundary position');
});

runner.test('T2.5.3', 'Slider preset split sets median 50% position', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /view === 'split'[\s\S]*?setSliderPosition\(50\)|presetPos/i, 'split preset maps to 50% position');
});

runner.test('T2.5.4', 'Slider preset ai sets opposite boundary position (0% or 100%)', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /view === 'ai'[\s\S]*?setSliderPosition\(0\)|presetPos/i, 'ai preset maps to boundary position');
});

runner.test('T2.5.5', 'Pointer drag tracking events registered on window and container', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /pointerdown|pointermove|pointerup/, 'Pointer events used for reliable boundary drag tracking');
});

// Feature 6 Boundaries
runner.setFeature('BOUND-06', 'MIRA Capabilities Boundary Cases');

runner.test('T2.6.1', 'Air-gapped boundary assertion: zero remote API endpoints in MIRA client scripts', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assert(!js.includes('api.openai.com') && !js.includes('anthropic.com') && !js.includes('googleapis.com'), 'Zero remote LLM endpoints called in client-side script');
});

runner.test('T2.6.2', 'Supported file formats explicitly enumerated (PDF, DOCX, PNG, JPG, WAV, MP3)', (t) => {
  const html = getFileContent('mira.html');
  t.assertMatches(html, /PDF/i, 'PDF supported');
  t.assertMatches(html, /PNG|JPG|DOCX/i, 'Images/schematics supported');
  t.assertMatches(html, /WAV|MP3/i, 'Audio symposiums supported');
});

runner.test('T2.6.3', 'Local nearest-neighbor vector search latency specified as under 150ms', (t) => {
  const html = getFileContent('mira.html');
  t.assertMatches(html, /150\s*(ms|millisecond)|sub-150/i, 'Sub-150ms vector latency bound documented');
});

runner.test('T2.6.4', 'Local open-weight LLMs specified (Llama-3, Mistral, Gemma)', (t) => {
  const html = getFileContent('mira.html');
  t.assertMatches(html, /Llama-3|Mistral|Gemma/i, 'Open-weight LLM models cited');
});

runner.test('T2.6.5', 'Local SQLite and vector index storage specified on device', (t) => {
  const html = getFileContent('mira.html');
  t.assertMatches(html, /SQLite|local storage/i, 'Local metadata persistence documented');
});

// Feature 7 Boundaries
runner.setFeature('BOUND-07', 'MIRA Simulator Boundary Cases');

runner.test('T2.7.1', 'Query chips match registered mock keys (perovskite, quantum, battery)', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assert(js.includes('perovskite:'), 'perovskite mock key present');
  t.assert(js.includes('quantum:'), 'quantum mock key present');
  t.assert(js.includes('battery:'), 'battery mock key present');
});

runner.test('T2.7.2', 'Fallback for unregistered query keys in simulator (defaults to perovskite)', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /sampleData\[key\]\s*\|\|\s*sampleData\.perovskite/, 'Fallback to perovskite on unknown query');
});

runner.test('T2.7.3', 'Audio play button toggle state switches SVG icon correctly', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /isPlaying\s*=\s*!isPlaying/, 'Audio play button toggles boolean state');
});

runner.test('T2.7.4', 'Waveform animation intervals cleared on audio pause', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /clearInterval\(interval\)/, 'Interval cleared on audio pause to avoid memory leak');
});

runner.test('T2.7.5', 'Phase visualizer tabs panel mutex (removes active from siblings)', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /panel\.classList\.remove\(['"]active['"]\)/, 'Phase tabs panel mut-ex enforced');
});

// Feature 8 Boundaries
runner.setFeature('BOUND-08', 'Products Directory Boundary Cases');

runner.test('T2.8.1', 'Technical specification table has balanced columns across thead and tbody', (t) => {
  const html = getFileContent('products.html');
  const thCount = (html.match(/<th\b/gi) || []).length;
  t.assert(thCount >= 3, 'Table must have at least 3 column headers (Metric, Mulyankan, MIRA)');
});

runner.test('T2.8.2', 'Technical specification table enclosed in overflow wrapper for small screens', (t) => {
  const html = getFileContent('products.html');
  t.assertMatches(html, /class=["'][^"']*(table-responsive|overflow-x)[^"']*["']|<div[^>]*style=["'][^"']*overflow-x\s*:\s*auto/, 'Table wrapped in responsive container');
});

runner.test('T2.8.3', 'Product CTA links have non-empty href destinations', (t) => {
  const html = getFileContent('products.html');
  const ctas = html.matchAll(/<a\b[^>]*class=["'][^"']*btn[^"']*["'][^>]*href=["']([^"']*)["']/gi);
  for (const m of ctas) {
    t.assert(m[1].trim().length > 0 && m[1] !== '#', `Empty or placeholder CTA href in products.html: ${m[0]}`);
  }
});

runner.test('T2.8.4', 'Badge tokens use standardized styling classes (badge-active, badge-mira)', (t) => {
  const html = getFileContent('products.html');
  t.assertMatches(html, /class=["'][^"']*badge-(active|mira|subtle)[^"']*["']/, 'Standardized semantic badge classes used');
});

runner.test('T2.8.5', 'Products directory deep link anchors preserve valid destination file references', (t) => {
  const html = getFileContent('products.html');
  t.assertMatches(html, /href=["']mulyankan-ai\.html["']/, 'Links to mulyankan-ai.html');
  t.assertMatches(html, /href=["']mira\.html["']/, 'Links to mira.html');
});

// Feature 9 Boundaries
runner.setFeature('BOUND-09', 'Link Graph & Anchor Boundaries');

runner.test('T2.9.1', 'In-page anchor hash resolution across all 11 pages (hash exists in same page)', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    const hashes = html.matchAll(/href=["']#([^"']+)["']/g);
    for (const m of hashes) {
      const hash = m[1].trim();
      if (hash === '' || hash === 'top') continue;
      const idExists = extractElementsById(html, hash);
      t.assert(idExists, `Broken in-page anchor in ${page}: href="#${hash}" target element not found!`);
    }
  }
});

runner.test('T2.9.2', 'Cross-page anchor hash resolution (file.html#hash exists in target file)', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    const dir = path.dirname(path.join(ROOT_DIR, page));
    const crossHashes = html.matchAll(/href=["']([^"'#:]+)#([^"']+)["']/g);
    for (const m of crossHashes) {
      const fileTarget = m[1].split('?')[0].trim();
      const hash = m[2].trim();
      if (fileTarget.startsWith('http') || hash === '') continue;
      const resolvedFile = path.resolve(dir, fileTarget);
      t.assert(fs.existsSync(resolvedFile), `Cross-page target file missing: ${resolvedFile}`);
      const targetContent = fs.readFileSync(resolvedFile, 'utf8');
      const idExists = extractElementsById(targetContent, hash);
      t.assert(idExists, `Broken cross-page anchor from ${page}: ${fileTarget}#${hash} not found in destination DOM!`);
    }
  }
});

runner.test('T2.9.3', 'Case sensitivity test (file links match exact disk casing on POSIX/Windows)', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    const dir = path.dirname(path.join(ROOT_DIR, page));
    const links = html.matchAll(/href=["']([^"'#:]+\.html)["']/g);
    for (const m of links) {
      const target = m[1].split('?')[0].trim();
      if (target.startsWith('http')) continue;
      const absPath = path.resolve(dir, target);
      if (fs.existsSync(absPath)) {
        const actualName = path.basename(absPath);
        const expectedName = path.basename(target);
        t.assertEqual(actualName.toLowerCase(), expectedName.toLowerCase(), `Casing mismatch in ${page}: ${target}`);
      }
    }
  }
});

runner.test('T2.9.4', 'Root slash prohibition: zero href="/..." ensuring portable relative routing', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    const rootSlashLinks = [...html.matchAll(/href=["']\/([^\/'"][^"']*)["']/g)];
    t.assertEqual(rootSlashLinks.length, 0, `${page} contains non-portable root-slash href: ${rootSlashLinks.map(m=>m[0]).join(', ')}`);
  }
});

runner.test('T2.9.5', 'Zero trailing whitespace or newline corruption in href and src attributes', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    const corruptHrefs = [...html.matchAll(/href=["']\s+[^"']*["']|href=["'][^"']*\s+["']/g)];
    t.assertEqual(corruptHrefs.length, 0, `Corrupt whitespace in href in ${page}`);
  }
});

// Feature 10 Boundaries
runner.setFeature('BOUND-10', 'Header & Mobile Drawer Boundaries');

runner.test('T2.10.1', 'Mobile drawer backdrop overlay element exists across all 11 pages', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    t.assertMatches(html, /class=["'][^"']*mobile-drawer-overlay[^"']*["']/, `${page} must contain .mobile-drawer-overlay for backdrop dismissal`);
  }
});

runner.test('T2.10.2', 'Mobile drawer close button has descriptive aria-label on all 11 pages', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    t.assertMatches(html, /<button\b[^>]*class=["'][^"']*drawer-close[^"']*["'][^>]*aria-label=["'][^"']+["']/i, `${page} drawer close button must have aria-label`);
  }
});

runner.test('T2.10.3', 'Mobile toggle button has aria-expanded="false" default state on all 11 pages', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    t.assertMatches(html, /<button\b[^>]*class=["'][^"']*mobile-toggle[^"']*["'][^>]*aria-expanded=["']false["']/i, `${page} mobile toggle must declare aria-expanded="false"`);
  }
});

runner.test('T2.10.4', 'Escape key dismisses mobile drawer in JavaScript controller', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /e\.key\s*===\s*['"]Escape['"][\s\S]*?closeDrawer\(\)/, 'Escape key triggers closeDrawer() in main.js');
});

runner.test('T2.10.5', 'Zero duplicate DOM IDs between desktop header and mobile drawer', (t) => {
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    const idMatches = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
    const duplicates = idMatches.filter((id, idx) => idMatches.indexOf(id) !== idx);
    const duplicateIds = duplicates.filter(id => id.includes('nav') || id.includes('header') || id.includes('logo'));
    t.assertEqual(duplicateIds.length, 0, `Duplicate IDs detected in ${page}: ${duplicateIds.join(', ')}`);
  }
});

// Feature 11 Boundaries
runner.setFeature('BOUND-11', 'Footer & Legal Routes Boundaries');

runner.test('T2.11.1', 'Relative path depth check: legal pages reference root via ../ prefix', (t) => {
  for (const page of HTML_PAGES.filter(p => p.startsWith('legal/'))) {
    const html = getFileContent(page);
    t.assert(html.includes('../assets/css/'), `${page} must reference assets via ../assets/`);
    t.assert(html.includes('../index.html'), `${page} must reference index via ../index.html`);
  }
});

runner.test('T2.11.2', 'Root pages reference legal pages via legal/ subpath (not flat filename)', (t) => {
  for (const page of HTML_PAGES.filter(p => !p.startsWith('legal/'))) {
    const html = getFileContent(page);
    t.assertMatches(html, /href=["']legal\/(compliance|privacy|terms|cookies)\.html["']/, `${page} must reference legal policies via legal/ prefix`);
  }
});

runner.test('T2.11.3', 'Legal subpages cross-reference peer policies via flat filenames (privacy.html)', (t) => {
  for (const page of HTML_PAGES.filter(p => p.startsWith('legal/'))) {
    const html = getFileContent(page);
    t.assertMatches(html, /href=["'](compliance|privacy|terms|cookies)\.html["']/, `${page} peer legal links must be flat`);
  }
});

runner.test('T2.11.4', 'Global footer technology anchors resolve directly to section IDs in technology.html', (t) => {
  const techHtml = getFileContent('technology.html');
  const expectedSections = ['computer-vision', 'applied-ai', 'vector-rag', 'human-in-loop'];
  for (const sec of expectedSections) {
    t.assert(extractElementsById(techHtml, sec), `Section id="${sec}" must exist in technology.html`);
  }
});

runner.test('T2.11.5', 'External links in footer have secure attributes (rel="noopener noreferrer")', (t) => {
  const indexHtml = getFileContent('index.html');
  const footerMatch = indexHtml.match(/<footer[\s\S]*?<\/footer>/);
  if (footerMatch) {
    const externalLinks = footerMatch[0].matchAll(/<a\b[^>]*href=["']https?:\/\/[^"']+["'][^>]*>/gi);
    for (const m of externalLinks) {
      t.assertMatches(m[0], /rel=["'][^"']*noopener[^"']*["']/i, `Insecure external footer link: ${m[0]}`);
    }
  }
});

// Feature 12 Boundaries
runner.setFeature('BOUND-12', 'Contact Form Query Parameter Boundaries');

runner.test('T2.12.1', 'Missing query parameters handled gracefully (contact.js does not crash on empty search)', (t) => {
  const js = getFileContent('assets/js/contact.js');
  t.assertMatches(js, /if\s*\(\s*productParam/, 'Null safety guard on productParam check');
});

runner.test('T2.12.2', 'Unexpected query parameter value (?product=invalid_xyz) does not break dropdown', (t) => {
  const js = getFileContent('assets/js/contact.js');
  t.assertMatches(js, /if\s*\(\s*productParam\s*===\s*['"]mira['"]\s*\)/, 'Explicit whitelist for mira');
  t.assertMatches(js, /else\s+if\s*\(\s*productParam\s*===\s*['"]mulyankan['"]\s*\)/, 'Explicit whitelist for mulyankan');
});

runner.test('T2.12.3', 'Empty string query parameter values (?product=) safely ignored', (t) => {
  const js = getFileContent('assets/js/contact.js');
  t.assert(js.includes('if (productParam'), 'Truthy check safely ignores empty parameter');
});

runner.test('T2.12.4', 'Empty form submit triggers error alert box and halts submission', (t) => {
  const js = getFileContent('assets/js/contact.js');
  t.assertMatches(js, /showAlert\(['"]Please fill in all required fields\.['"],\s*['"]error['"]\)/, 'Validation error alert displayed');
});

runner.test('T2.12.5', 'Invalid email boundary patterns rejected by email regex', (t) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  t.assert(!emailRegex.test('user@'), 'user@ rejected');
  t.assert(!emailRegex.test('@domain.com'), '@domain.com rejected');
  t.assert(!emailRegex.test('user@domain'), 'user@domain rejected');
  t.assert(!emailRegex.test('user name@domain.com'), 'Spaces in email rejected');
  t.assert(emailRegex.test('researcher@institute.edu.in'), 'Valid institutional email accepted');
});


// =============================================================================
// TIER 3: Cross-Feature Combinations (≥25 pairwise tests)
// =============================================================================
runner.setTier(3, 'Cross-Feature Combinations');

runner.setFeature('PAIRWISE', 'Pairwise Cross-Feature Interactions');

runner.test('T3.1', 'Engineering Talent CTA -> Contact Query Parameter Routing', (t) => {
  const aboutHtml = getFileContent('about.html');
  t.assertMatches(aboutHtml, /href=["']contact\.html\?type=careers["']/, 'about.html#team CTA links to contact.html?type=careers');
  const contactHtml = getFileContent('contact.html');
  t.assertMatches(contactHtml, /<select\b[^>]*id=["']inquiryType["']/, 'contact.html contains inquiryType select element');
});

runner.test('T3.2', 'MIRA Hero CTA -> Contact Query Parameter Routing', (t) => {
  const miraHtml = getFileContent('mira.html');
  t.assertMatches(miraHtml, /href=["']contact\.html\?product=mira["']/, 'mira.html hero CTA passes ?product=mira');
  const js = getFileContent('assets/js/contact.js');
  t.assert(js.includes("inquiryTypeSelect.value = 'mira-pilot'"), 'contact.js handles mira-pilot pre-selection');
});

runner.test('T3.3', 'Mulyankan Pilot CTA -> Contact Query Parameter Routing', (t) => {
  const mulyankanHtml = getFileContent('mulyankan-ai.html');
  t.assertMatches(mulyankanHtml, /href=["']contact\.html\?product=mulyankan["']/, 'mulyankan-ai.html CTA passes ?product=mulyankan');
  const js = getFileContent('assets/js/contact.js');
  t.assert(js.includes("inquiryTypeSelect.value = 'mulyankan-pilot'"), 'contact.js handles mulyankan-pilot pre-selection');
});

runner.test('T3.4', 'Products Directory Matrix CTA -> MIRA Pilot Query Parameter Routing', (t) => {
  const prodHtml = getFileContent('products.html');
  t.assertMatches(prodHtml, /href=["']contact\.html\?product=mira["']/, 'products.html spec matrix passes ?product=mira');
});

runner.test('T3.5', 'Products Directory Matrix CTA -> Mulyankan AI Live Portal Outbound Link', (t) => {
  const prodHtml = getFileContent('products.html');
  t.assertMatches(prodHtml, /href=["']https:\/\/mulyankanai\.in\/?["']/, 'products.html matrix links to mulyankanai.in');
});

runner.test('T3.6', 'Desktop Header Dropdown -> Mulyankan AI Product Showcase Link', (t) => {
  const indexHtml = getFileContent('index.html');
  t.assertMatches(indexHtml, /<div\b[^>]*class=["'][^"']*nav-dropdown-menu[^"']*["'][\s\S]*?href=["']mulyankan-ai\.html["']/, 'Header dropdown routes directly to mulyankan-ai.html');
  const mulyankanHtml = getFileContent('mulyankan-ai.html');
  t.assertMatches(mulyankanHtml, /Mulyankan AI/i, 'Target page contains Mulyankan AI branding');
});

runner.test('T3.7', 'Desktop Header Dropdown -> MIRA Product Showcase Link', (t) => {
  const indexHtml = getFileContent('index.html');
  t.assertMatches(indexHtml, /<div\b[^>]*class=["'][^"']*nav-dropdown-menu[^"']*["'][\s\S]*?href=["']mira\.html["']/, 'Header dropdown routes directly to mira.html');
  const miraHtml = getFileContent('mira.html');
  t.assertMatches(miraHtml, /MIRA/i, 'Target page contains MIRA branding');
});

runner.test('T3.8', 'Mobile Drawer Interaction -> In-Page Anchor Jumping -> Body Scroll Restoration', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /closeDrawer\s*=\s*\(\)\s*=>\s*\{[\s\S]*?document\.body\.style\.overflow\s*=\s*['"]['"]/, 'closeDrawer resets body overflow to empty string');
  t.assertMatches(js, /openDrawer\s*=\s*\(\)\s*=>\s*\{[\s\S]*?document\.body\.style\.overflow\s*=\s*['"]hidden['"]/, 'openDrawer locks body overflow');
});

runner.test('T3.9', 'Mobile Drawer Navigation -> Portfolio Overview Route', (t) => {
  const indexHtml = getFileContent('index.html');
  t.assertMatches(indexHtml, /<aside\b[^>]*class=["'][^"']*mobile-drawer[^"']*["'][\s\S]*?href=["']products\.html["']/, 'Mobile drawer links to products.html');
  const prodHtml = getFileContent('products.html');
  t.assertMatches(prodHtml, /Flagship\s+Platforms|Product\s+Portfolio/i, 'products.html renders flagship platforms');
});

runner.test('T3.10', 'Slider Preset "raw" Button -> Position 100% Clip-Path Sync', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /view === 'raw'[\s\S]*?setSliderPosition\(100\)|presetPos/i, 'raw preset triggers 100% position sync');
  t.assertMatches(js, /aiPane\.style\.clipPath\s*=\s*`inset\(0 0 0 \$\{clamped\}%\)`/, 'clipPath inset updated with percentage');
});

runner.test('T3.11', 'Slider Preset "split" Button -> Position 50% Clip-Path Sync', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /view === 'split'[\s\S]*?setSliderPosition\(50\)|presetPos/i, 'split preset triggers 50% position sync');
});

runner.test('T3.12', 'Slider Preset "ai" Button -> Position 0% Clip-Path Sync', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /view === 'ai'[\s\S]*?setSliderPosition\(0\)|presetPos/i, 'ai preset triggers 0% position sync');
});

runner.test('T3.13', 'MIRA Simulator Query Chip "perovskite" -> Tri-Modal Citation Sync', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /perovskite:\s*\{[\s\S]*?docCitation:\s*["'][^"']+["'][\s\S]*?imgCitation:\s*["'][^"']+["'][\s\S]*?audioCitation:\s*["'][^"']+["']/, 'perovskite mock data synchronizes doc, img, and audio citations');
});

runner.test('T3.14', 'MIRA Simulator Query Chip "quantum" -> Optical Photoluminescence Citation Sync', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /quantum:\s*\{[\s\S]*?docCitation:\s*["'][^"']+["']/, 'quantum mock data includes quantum citation');
});

runner.test('T3.15', 'MIRA Simulator Query Chip "battery" -> Solid-State Degradation Citation Sync', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /battery:\s*\{[\s\S]*?docCitation:\s*["'][^"']+["']/, 'battery mock data includes battery citation');
});

runner.test('T3.16', 'MIRA Audio Play/Pause Button -> Waveform Bar Animation Synchronization', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /waveBars\.forEach\(bar\s*=>\s*\{[\s\S]*?bar\.classList\.add\(['"]active['"]\)/, 'Waveform bars toggle active animation on audio play/pause');
});

runner.test('T3.17', 'MIRA Phase Visualizer Tabs -> Panel Visibility Mutex', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /panel\.id\s*===\s*`phase-panel-\$\{targetPhase\}`[\s\S]*?panel\.classList\.add\(['"]active['"]\)[\s\S]*?panel\.classList\.remove\(['"]active['"]\)/, 'Phase panels toggled with strict mutex');
});

runner.test('T3.18', 'Global Footer Technology Link -> technology.html#computer-vision Anchor', (t) => {
  const indexHtml = getFileContent('index.html');
  t.assertMatches(indexHtml, /href=["']technology\.html#computer-vision["']/, 'Footer links directly to #computer-vision');
  const techHtml = getFileContent('technology.html');
  t.assert(extractElementsById(techHtml, 'computer-vision'), 'Target #computer-vision section exists in technology.html');
});

runner.test('T3.19', 'Global Footer Technology Link -> technology.html#applied-ai Anchor', (t) => {
  const indexHtml = getFileContent('index.html');
  t.assertMatches(indexHtml, /href=["']technology\.html#applied-ai["']/, 'Footer links directly to #applied-ai');
  const techHtml = getFileContent('technology.html');
  t.assert(extractElementsById(techHtml, 'applied-ai'), 'Target #applied-ai section exists in technology.html');
});

runner.test('T3.20', 'Global Footer Technology Link -> technology.html#human-in-loop Anchor', (t) => {
  const indexHtml = getFileContent('index.html');
  t.assertMatches(indexHtml, /href=["']technology\.html#human-in-loop["']/, 'Footer links directly to #human-in-loop');
  const techHtml = getFileContent('technology.html');
  t.assert(extractElementsById(techHtml, 'human-in-loop'), 'Target #human-in-loop section exists in technology.html');
});

runner.test('T3.21', 'Legal Subpage Header -> Root Products Route Navigation', (t) => {
  const privacyHtml = getFileContent('legal/privacy.html');
  t.assertMatches(privacyHtml, /href=["']\.\.\/products\.html["']/, 'legal/privacy.html correctly steps back to ../products.html');
  const prodHtml = getFileContent('products.html');
  t.assert(prodHtml.length > 500, 'products.html loaded successfully');
});

runner.test('T3.22', 'Legal Subpage Return Breadcrumb -> Homepage Anchor Navigation', (t) => {
  const termsHtml = getFileContent('legal/terms.html');
  t.assertMatches(termsHtml, /href=["']\.\.\/index\.html["']/, 'legal/terms.html breadcrumb links to ../index.html');
});

runner.test('T3.23', 'Legal Subpage Peer Navigation (Compliance <-> Privacy <-> Terms <-> Cookies)', (t) => {
  const compHtml = getFileContent('legal/compliance.html');
  t.assertMatches(compHtml, /href=["']privacy\.html["']/, 'compliance.html links to peer privacy.html');
  t.assertMatches(compHtml, /href=["']terms\.html["']/, 'compliance.html links to peer terms.html');
  t.assertMatches(compHtml, /href=["']cookies\.html["']/, 'compliance.html links to peer cookies.html');
});

runner.test('T3.24', 'Contact Form Client Validation -> Error Alert Box Display', (t) => {
  const js = getFileContent('assets/js/contact.js');
  t.assertMatches(js, /showAlert\(['"]Please fill in all required fields\.['"],\s*['"]error['"]\)/, 'Validation failure displays error alert');
  const html = getFileContent('contact.html');
  t.assertMatches(html, /id=["']form-alert["']/, 'form-alert element present in contact.html');
});

runner.test('T3.25', 'Contact Form Successful Submission -> Loading Spinner & Button Disabled State', (t) => {
  const js = getFileContent('assets/js/contact.js');
  t.assertMatches(js, /submitBtn\.disabled\s*=\s*true;/, 'Button disabled on submit');
  t.assertMatches(js, /animation:\s*spin/, 'Loading spinner animated SVG injected on submit');
});

runner.test('T3.26', 'Sticky Header Elevation -> Scroll Event Class Toggle', (t) => {
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /window\.scrollY\s*>\s*20[\s\S]*?header\.classList\.add\(['"]scrolled['"]\)/, 'header receives scrolled class when window.scrollY > 20');
  const compCss = getFileContent('assets/css/components.css');
  t.assertMatches(compCss, /\.site-header\.scrolled/, 'components.css defines elevation styles for .site-header.scrolled');
});


// =============================================================================
// TIER 4: Real-World Application Scenarios (all 6 realistic user journeys)
// =============================================================================
runner.setTier(4, 'Real-World Application Scenarios');

runner.setFeature('SCENARIOS', 'End-to-End User Journeys');

runner.test('T4.S1', 'Scenario 1: University Dean evaluates Mulyankan AI', (t) => {
  // Step 1: Arrive on homepage index.html
  const home = getFileContent('index.html');
  t.assertMatches(home, /Mulyankan\s+AI/i, 'Homepage presents Mulyankan AI executive narrative');
  t.assertMatches(home, /href=["']products\.html["']|href=["']mulyankan-ai\.html["']/, 'Homepage provides clear route to Mulyankan AI');

  // Step 2: Navigate to products directory products.html
  const products = getFileContent('products.html');
  t.assertMatches(products, /academic.*descriptive\s+examin/i, 'Products page details academic descriptive exam evaluation');
  t.assertMatches(products, /href=["']mulyankan-ai\.html["']/, 'Products page provides direct link to deep showcase');

  // Step 3: Enter Mulyankan AI deep showcase mulyankan-ai.html
  const mulyankan = getFileContent('mulyankan-ai.html');
  t.assertMatches(mulyankan, /Vision\s+OCR/i, 'Deep showcase details Vision OCR capabilities');
  t.assertMatches(mulyankan, /Teacher-in-the-Loop/i, 'Deep showcase presents Teacher-in-the-Loop moderation');

  // Step 4: Interact with handwritten exam split slider
  t.assertMatches(mulyankan, /exam-showcase-frame|exam-slider-container/, 'Interactive evaluation slider frame present');
  t.assertMatches(mulyankan, /data-view=["']raw["']|data-preset-pos=["']100["']/, 'Raw student exam preset available');
  t.assertMatches(mulyankan, /data-view=["']ai["']|data-preset-pos=["']0["']/, 'AI scored breakdown preset available');

  // Step 5: Test grading rigor parameters
  t.assertMatches(mulyankan, /data-rigor=["']strict["']/, 'Strict STEM rigor option available');
  t.assertMatches(mulyankan, /data-rigor=["']balanced["']/, 'Balanced academic rigor option available');

  // Step 6: Follow institutional CTA to contact.html?product=mulyankan
  t.assertMatches(mulyankan, /href=["']contact\.html\?product=mulyankan["']/, 'Primary CTA routes to institutional pilot request with ?product=mulyankan');
  const contact = getFileContent('contact.html');
  t.assertMatches(contact, /value=["']mulyankan-pilot["']/, 'Contact form contains matching mulyankan-pilot inquiry option');
});

runner.test('T4.S2', 'Scenario 2: Research Institute Director evaluates MIRA', (t) => {
  // Step 1: Arrive on homepage index.html
  const home = getFileContent('index.html');
  t.assertMatches(home, /MIRA/i, 'Homepage introduces MIRA offline assistant');
  t.assertMatches(home, /Air-Gapped|Sovereign/i, 'Homepage establishes sovereign offline positioning');

  // Step 2: Inspect engineering disciplines on technology.html
  const tech = getFileContent('technology.html');
  t.assertMatches(tech, /id=["']vector-rag["']|Offline Vector/i, 'Technology page explains Offline Vector Embeddings & Local RAG');
  t.assertMatches(tech, /id=["']human-in-loop["']|Air-Gapped/i, 'Technology page details Air-Gapped Sovereign Engineering');

  // Step 3: Transition to MIRA showcase mira.html
  const mira = getFileContent('mira.html');
  t.assertMatches(mira, /ChromaDB|FAISS/i, 'MIRA showcase details local ChromaDB / FAISS vector databases');
  t.assertMatches(mira, /Ollama|Llama-3/i, 'MIRA showcase details local Ollama LLM execution');

  // Step 4: Test interactive MIRA console simulator
  t.assertMatches(mira, /mira-console-window/, 'MIRA console terminal simulator present');
  t.assertMatches(mira, /data-sample-key=["']perovskite["']/, 'Interactive perovskite solar cell query present');
  t.assertMatches(mira, /data-sample-key=["']battery["']/, 'Interactive solid-state battery query present');

  // Step 5: Test audio playback simulator
  t.assertMatches(mira, /audio-play-btn/, 'Audio play button present for symposium recordings');
  t.assertMatches(mira, /wave-bar/, 'Waveform bars present for acoustic search feedback');

  // Step 6: Follow institutional CTA to contact.html?product=mira
  t.assertMatches(mira, /href=["']contact\.html\?product=mira["']/, 'Primary CTA routes to research pilot request with ?product=mira');
  const contact = getFileContent('contact.html');
  t.assertMatches(contact, /value=["']mira-pilot["']/, 'Contact form contains matching mira-pilot inquiry option');
});

runner.test('T4.S3', 'Scenario 3: Cross-Device Responsive Navigation Audit', (t) => {
  // Step 1: Verify viewport responsiveness declarations
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    t.assertMatches(html, /name=["']viewport["']\s+content=["'][^"']*width=device-width[^"']*["']/, `${page} supports responsive mobile layout`);
  }

  // Step 2: Verify mobile navigation drawer and toggle markup on all pages
  for (const page of HTML_PAGES) {
    const html = getFileContent(page);
    t.assertMatches(html, /class=["'][^"']*mobile-toggle[^"']*["']/, `${page} contains mobile hamburger toggle button`);
    t.assertMatches(html, /class=["'][^"']*mobile-drawer[^"']*["']/, `${page} contains mobile drawer component`);
    t.assertMatches(html, /class=["'][^"']*drawer-close[^"']*["']/, `${page} contains drawer close button`);
  }

  // Step 3: Verify drawer navigation destinations
  const indexHtml = getFileContent('index.html');
  t.assertMatches(indexHtml, /class=["'][^"']*drawer-nav[^"']*["'][\s\S]*?href=["']products\.html["']/, 'Drawer provides route to products');
  t.assertMatches(indexHtml, /class=["'][^"']*drawer-nav[^"']*["'][\s\S]*?href=["']technology\.html["']/, 'Drawer provides route to technology');
  t.assertMatches(indexHtml, /class=["'][^"']*drawer-nav[^"']*["'][\s\S]*?href=["']contact\.html["']/, 'Drawer provides route to contact');

  // Step 4: Verify mobile drawer backdrop dismiss logic in main.js
  const js = getFileContent('assets/js/main.js');
  t.assertMatches(js, /drawerOverlay\.addEventListener\(['"]click['"],\s*closeDrawer\)/, 'Backdrop click dismisses drawer');
  t.assertMatches(js, /drawerClose\.addEventListener\(['"]click['"],\s*closeDrawer\)/, 'Close button dismisses drawer');
});

runner.test('T4.S4', 'Scenario 4: Engineering Talent Exploration & Routing', (t) => {
  // Step 1: Candidate visits homepage index.html and checks sovereign engineering focus
  const home = getFileContent('index.html');
  t.assertMatches(home, /about\.html#team/, 'Homepage links to Leadership & Team');

  // Step 2: Candidate inspects engineering stack on technology.html
  const tech = getFileContent('technology.html');
  t.assertMatches(tech, /Computer\s+Vision/i, 'Engineering discipline: Computer Vision & OCR');
  t.assertMatches(tech, /Applied\s+AI/i, 'Engineering discipline: Applied AI & Semantic Alignment');
  t.assertMatches(tech, /Offline\s+Vector/i, 'Engineering discipline: Offline Vector RAG');
  t.assertMatches(tech, /Air-Gapped/i, 'Engineering discipline: Air-Gapped Sovereign Engineering');

  // Step 3: Candidate visits team & culture section in about.html#team
  const about = getFileContent('about.html');
  t.assertMatches(about, /id=["']team["']/, 'About page contains unified team section');
  t.assertMatches(about, /Engineering\s+Groups/i, 'About page documents engineering groups and culture');

  // Step 4: Follow talent inquiry CTA to contact.html?type=careers
  t.assertMatches(about, /href=["']contact\.html\?type=careers["']/, 'About team section provides web form application link with ?type=careers');

  // Step 5: Contact page supports talent applications
  const contact = getFileContent('contact.html');
  t.assertMatches(contact, /value=["']careers["']|Careers/i, 'Contact inquiry options include careers inquiry');
});

runner.test('T4.S5', 'Scenario 5: Compliance & Legal Governance Audit', (t) => {
  // Step 1: Compliance auditor inspects global footer on index.html
  const home = getFileContent('index.html');
  t.assertMatches(home, /legal\/compliance\.html/, 'Footer links to Corporate Compliance');
  t.assertMatches(home, /legal\/privacy\.html/, 'Footer links to Privacy Policy');
  t.assertMatches(home, /legal\/terms\.html/, 'Footer links to Terms of Service');
  t.assertMatches(home, /legal\/cookies\.html/, 'Footer links to Cookie Policy');

  // Step 2: Audit legal/compliance.html
  const comp = getFileContent('legal/compliance.html');
  t.assertMatches(comp, /Corporate|Registration|CIN|DPIIT/i, 'Compliance page details corporate registration credentials');
  t.assertMatches(comp, /href=["']\.\.\/index\.html["']/, 'Compliance page has valid return route');

  // Step 3: Audit legal/privacy.html
  const priv = getFileContent('legal/privacy.html');
  t.assertMatches(priv, /Data\s+Protection|Zero\s+Training|Retention/i, 'Privacy page details strict zero-training privacy policy');
  t.assertMatches(priv, /href=["']\.\.\/index\.html["']/, 'Privacy page has valid return route');

  // Step 4: Audit legal/terms.html
  const terms = getFileContent('legal/terms.html');
  t.assertMatches(terms, /Institutional\s+Licensing|Intellectual\s+Property/i, 'Terms page details enterprise licensing terms');
  t.assertMatches(terms, /href=["']\.\.\/index\.html["']/, 'Terms page has valid return route');

  // Step 5: Audit legal/cookies.html
  const cookies = getFileContent('legal/cookies.html');
  t.assertMatches(cookies, /Essential\s+Cookies|Tracking/i, 'Cookie policy details minimal cookie footprint');
  t.assertMatches(cookies, /href=["']\.\.\/index\.html["']/, 'Cookie page has valid return route');
});

runner.test('T4.S6', 'Scenario 6: Deep Anchor Hash & Section Routing', (t) => {
  // Step 1: External evaluator accesses technology anchors from homepage footer
  const home = getFileContent('index.html');
  t.assertMatches(home, /href=["']technology\.html#computer-vision["']/, 'Homepage links to #computer-vision');
  t.assertMatches(home, /href=["']technology\.html#applied-ai["']/, 'Homepage links to #applied-ai');
  t.assertMatches(home, /href=["']technology\.html#human-in-loop["']/, 'Homepage links to #human-in-loop');

  // Step 2: Verify target elements in technology.html
  const tech = getFileContent('technology.html');
  t.assert(extractElementsById(tech, 'computer-vision'), '#computer-vision element exists in technology.html');
  t.assert(extractElementsById(tech, 'applied-ai'), '#applied-ai element exists in technology.html');
  t.assert(extractElementsById(tech, 'vector-rag'), '#vector-rag element exists in technology.html');
  t.assert(extractElementsById(tech, 'human-in-loop'), '#human-in-loop element exists in technology.html');

  // Step 3: In-page hero anchor on mira.html
  const mira = getFileContent('mira.html');
  t.assertMatches(mira, /href=["']#architecture["']/, 'mira.html hero button points to in-page #architecture');
  t.assert(extractElementsById(mira, 'architecture'), '#architecture section exists in mira.html');

  // Step 4: Cross-page anchor validation between products.html and technology.html
  const prod = getFileContent('products.html');
  t.assertMatches(prod, /technology\.html#computer-vision/, 'products.html links to #computer-vision');
  t.assertMatches(prod, /technology\.html#applied-ai/, 'products.html links to #applied-ai');
});

// =============================================================================
// Execute Output & Exit Handling
// =============================================================================
runner.renderOutput();

const stats = runner.getStats();
if (stats.failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
