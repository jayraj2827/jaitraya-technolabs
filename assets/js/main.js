/**
 * Jaitraya Technolabs — Core Interactions & Software Simulators
 * Apple-grade responsive JavaScript architecture
 * Clean, robust, zero gimmicks
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. Subtle Hairline Scroll Progress Bar (2px, zero neon glow)
  // ==========================================================================
  const progressBar = document.getElementById('scroll-progress');
  const updateScrollProgress = () => {
    if (!progressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${scrollPercent}%`;
  };
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress, { passive: true });
  updateScrollProgress();

  // ==========================================================================
  // 2. Sticky Header Elevation on Scroll (Full-Bleed Hero Aware)
  // ==========================================================================
  const header = document.querySelector('.site-header');
  const heroSection = document.querySelector('.hero-fullbleed-section') || document.querySelector('.hero-inner-dark');
  const handleHeaderScroll = () => {
    if (!header) return;
    const isHeroOverlay = header.classList.contains('header-hero-overlay') && heroSection;
    const threshold = isHeroOverlay ? (heroSection.offsetHeight - 72) : 20;

    const brandLogo = header.querySelector('.brand-logo-img');

    if (window.scrollY > threshold && window.scrollY > 20) {
      header.classList.add('scrolled');
      document.documentElement.classList.add('scrolled-page');
      if (brandLogo && isHeroOverlay && brandLogo.getAttribute('src') !== 'assets/images/logos/jaitraya-logo-light.png') {
        brandLogo.src = 'assets/images/logos/jaitraya-logo-light.png';
      }
    } else {
      header.classList.remove('scrolled');
      document.documentElement.classList.remove('scrolled-page');
      if (brandLogo && isHeroOverlay && brandLogo.getAttribute('src') !== 'assets/images/logos/jaitraya-logo-darkmode-horizontal.png') {
        brandLogo.src = 'assets/images/logos/jaitraya-logo-darkmode-horizontal.png';
      }
    }
  };
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  window.addEventListener('resize', handleHeaderScroll, { passive: true });
  handleHeaderScroll();

  // ==========================================================================
  // 2B. Hero Crossfade Background Slider (OLED Multi-Lab Campus)
  // ==========================================================================
  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroDots = document.querySelectorAll('.hero-dot');
  if (heroSlides.length > 1) {
    let currentSlide = 0;
    let slideTimer = null;

    const showSlide = (index) => {
      heroSlides.forEach((s, idx) => s.classList.toggle('active', idx === index));
      heroDots.forEach((d, idx) => d.classList.toggle('active', idx === index));
      currentSlide = index;
    };

    const nextSlide = () => {
      const next = (currentSlide + 1) % heroSlides.length;
      showSlide(next);
    };

    const startTimer = () => {
      stopTimer();
      slideTimer = setInterval(nextSlide, 7000);
    };

    const stopTimer = () => {
      if (slideTimer) clearInterval(slideTimer);
    };

    heroDots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        const slideIdx = parseInt(e.currentTarget.getAttribute('data-slide'), 10);
        showSlide(slideIdx);
        startTimer();
      });
    });

    if (heroSection) {
      heroSection.addEventListener('mouseenter', stopTimer);
      heroSection.addEventListener('mouseleave', startTimer);
    }

    startTimer();
  }

  // ==========================================================================
  // 3. Cascading Scroll-Reveal System
  // ==========================================================================
  const revealElements = document.querySelectorAll('[data-reveal]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion && 'IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.08,
      rootMargin: '0px 0px -20px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('is-revealed'));
  }

  // ==========================================================================
  // 4. Smooth Animated Stat Counters
  // ==========================================================================
  const counterElements = document.querySelectorAll('[data-count-to]');
  if ('IntersectionObserver' in window && counterElements.length > 0) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.getAttribute('data-count-to'));
          const suffix = el.getAttribute('data-count-suffix') || '';
          const decimals = parseInt(el.getAttribute('data-count-decimals') || '0', 10);
          const duration = 1800;
          const startTime = performance.now();

          const animateCount = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentVal = (target * easeOut).toFixed(decimals);
            el.textContent = `${currentVal}${suffix}`;

            if (progress < 1) {
              requestAnimationFrame(animateCount);
            } else {
              el.textContent = `${target.toFixed(decimals)}${suffix}`;
            }
          };

          requestAnimationFrame(animateCount);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.15 });

    counterElements.forEach(el => counterObserver.observe(el));
  }

  // ==========================================================================
  // 5. Interactive Before/After Examination Slider (Mulyankan AI)
  //    Supports data-view="raw"|"split"|"ai" AND data-preset-pos="100"|"50"|"0"
  // ==========================================================================
  const sliderFrames = document.querySelectorAll('.exam-showcase-frame');
  sliderFrames.forEach(frame => {
    const container = frame.querySelector('.exam-slider-container');
    const handle = frame.querySelector('.exam-slider-handle');
    const aiPane = frame.querySelector('.exam-pane-ai');
    if (!container || !handle || !aiPane) return;

    let isDragging = false;

    const setSliderPosition = (percentage) => {
      const clamped = Math.max(0, Math.min(100, percentage));
      container.style.setProperty('--slider-pos', `${clamped}%`);
      handle.style.left = `${clamped}%`;
      aiPane.style.clipPath = `inset(0 0 0 ${clamped}%)`;
    };

    const handleMove = (clientX) => {
      const rect = container.getBoundingClientRect();
      const offsetX = clientX - rect.left;
      const percentage = (offsetX / rect.width) * 100;
      setSliderPosition(percentage);
    };

    // Pointer events for drag on container and handle
    const startDrag = (e) => {
      isDragging = true;
      handleMove(e.clientX);
    };

    const onDrag = (e) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    };

    const stopDrag = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', startDrag);
    window.addEventListener('pointermove', onDrag);
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);

    // Support Preset Buttons (handles data-view and data-preset-pos seamlessly)
    const presetBtns = frame.querySelectorAll('.preset-btn, [data-view], [data-preset-pos]');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const view = btn.getAttribute('data-view');
        const presetPos = btn.getAttribute('data-preset-pos');

        if (presetPos !== null && presetPos !== '') {
          setSliderPosition(parseFloat(presetPos));
        } else if (view === 'raw') {
          setSliderPosition(100);
        } else if (view === 'split') {
          setSliderPosition(50);
        } else if (view === 'ai') {
          setSliderPosition(0);
        }
      });
    });
  });

  // ==========================================================================
  // 6. Interactive Rubric & Evaluation Rigor Playground (Mulyankan AI)
  // ==========================================================================
  const playgrounds = document.querySelectorAll('.playground-container');
  playgrounds.forEach(playground => {
    const rigorBtns = playground.querySelectorAll('.rigor-btn');
    const semanticSlider = playground.querySelector('#semantic-tolerance-slider');
    const semanticValTag = playground.querySelector('#semantic-val-tag');
    const teacherOverrideBtn = playground.querySelector('#teacher-override-btn');

    const scoreHero = playground.querySelector('#playground-score-hero');
    const scoreLabel = playground.querySelector('#playground-score-mode-label');
    const step1Score = playground.querySelector('#step1-score');
    const step2Score = playground.querySelector('#step2-score');
    const step3Score = playground.querySelector('#step3-score');
    const auditStatus = playground.querySelector('#playground-audit-status');

    let currentMode = 'balanced';
    let teacherOverridden = false;

    const updatePlaygroundUI = () => {
      const tolerance = semanticSlider ? parseInt(semanticSlider.value, 10) : 85;
      if (semanticValTag) semanticValTag.textContent = `${tolerance}%`;

      let step1 = '3.0 / 3.0 Marks';
      let step2 = '';
      let step3 = '';
      let modeName = '';
      let auditText = '';
      let auditClass = 'badge-active';
      let finalScore = 0;

      if (currentMode === 'balanced') {
        modeName = 'Balanced Academic Rigor';
        step2 = '3.5 / 4.0 Marks';
        if (teacherOverridden) {
          step3 = '2.5 / 3.0 Marks (Faculty Override: +0.5)';
          finalScore = 9.0;
        } else {
          step3 = '2.0 / 3.0 Marks';
          finalScore = 8.5;
        }
        auditText = teacherOverridden ? '✓ Verified by Dr. Verma (Manual Override)' : '✓ Certified Instant Pass (98.4% Confidence)';
        auditClass = 'badge-active';
      } else if (currentMode === 'strict') {
        modeName = 'Strict STEM & Proof Rigor';
        if (tolerance > 90) {
          step2 = '2.0 / 4.0 Marks (Strict AST: Incomplete induction)';
          if (teacherOverridden) {
            step3 = '1.5 / 3.0 Marks (Faculty Override: +0.5)';
            finalScore = 6.5;
          } else {
            step3 = '1.0 / 3.0 Marks (Deduction: Missing constant)';
            finalScore = 6.0;
          }
        } else {
          step2 = '2.5 / 4.0 Marks (Deduction: Incomplete induction)';
          if (teacherOverridden) {
            step3 = '1.5 / 3.0 Marks (Faculty Override: +0.5)';
            finalScore = 7.0;
          } else {
            step3 = '1.0 / 3.0 Marks (Deduction: Missing constant)';
            finalScore = 6.5;
          }
        }
        auditText = teacherOverridden ? '✓ Verified by Dr. Verma (Manual Override)' : '⚠ Escalated for Faculty Audit Review';
        auditClass = teacherOverridden ? 'badge-active' : 'badge';
      } else if (currentMode === 'lenient') {
        modeName = 'Formative Assessment (Lenient)';
        step2 = '4.0 / 4.0 Marks (Full Step Credit)';
        if (teacherOverridden || tolerance < 80) {
          step3 = teacherOverridden ? '3.0 / 3.0 Marks (Faculty Override: Full Credit)' : '3.0 / 3.0 Marks (Full Step Credit)';
          finalScore = 10.0;
        } else {
          step3 = '2.5 / 3.0 Marks (Conceptual Attempt Credit)';
          finalScore = 9.5;
        }
        auditText = teacherOverridden ? '✓ Verified by Dr. Verma (Manual Override)' : '✓ Direct Release with Formative Notes';
        auditClass = 'badge-active';
      }

      if (scoreHero) scoreHero.textContent = `${finalScore.toFixed(1)} / 10`;
      if (scoreLabel) scoreLabel.textContent = modeName + (teacherOverridden ? ' • Moderation Overridden (+0.5)' : '');
      if (step1Score) step1Score.textContent = step1;
      if (step2Score) step2Score.textContent = step2;
      if (step3Score) step3Score.textContent = step3;

      if (auditStatus) {
        auditStatus.textContent = auditText;
        auditStatus.className = `badge ${auditClass}`;
      }
    };

    rigorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        rigorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.getAttribute('data-rigor');
        updatePlaygroundUI();
      });
    });

    if (semanticSlider) {
      semanticSlider.addEventListener('input', () => {
        updatePlaygroundUI();
      });
    }

    if (teacherOverrideBtn) {
      teacherOverrideBtn.addEventListener('click', () => {
        teacherOverridden = !teacherOverridden;
        teacherOverrideBtn.textContent = teacherOverridden ? 'Reset Grader Override' : 'Simulate Faculty Override (+0.5)';
        updatePlaygroundUI();
      });
    }

    updatePlaygroundUI();
  });

  // ==========================================================================
  // 7. Dual-Product Hero Showcase Switcher (Homepage)
  // ==========================================================================
  const heroSwitchBtns = document.querySelectorAll('.hero-switch-btn');
  const heroPanelMulyankan = document.getElementById('hero-panel-mulyankan');
  const heroPanelMira = document.getElementById('hero-panel-mira');

  heroSwitchBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPillar = btn.getAttribute('data-target-pillar');
      heroSwitchBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (targetPillar === 'mira') {
        if (heroPanelMulyankan) heroPanelMulyankan.style.display = 'none';
        if (heroPanelMira) heroPanelMira.style.display = 'block';
      } else {
        if (heroPanelMira) heroPanelMira.style.display = 'none';
        if (heroPanelMulyankan) heroPanelMulyankan.style.display = 'block';
      }
    });
  });

  // ==========================================================================
  // 8. MIRA Multimodal Search Simulator (Apple Pro Workstation Terminal)
  // ==========================================================================
  const miraSimulators = document.querySelectorAll('.mira-simulator-box');
  const sampleData = {
    perovskite: {
      query: "Perovskite solar cell degradation mechanisms under thermal stress",
      docSnippet: "Section 4.2 indicates that lattice strain at 85°C induces iodide phase segregation, reducing power conversion efficiency from 22.4% to 17.1% over 500 hours.",
      docCitation: "Solar_Energy_Materials_2026.pdf (Page 14, ¶3)",
      docScore: "99.1% Vector Match",
      imgSnippet: "Figure 3B: In-situ XRD peak shift at 2θ = 14.1° confirming cubic-to-tetragonal phase transition under thermal bias.",
      imgCitation: "Fig_3B_PhaseShift_TEM.png (Bounding Region: x=140, y=320, w=480, h=260)",
      imgScore: "96.4% Cross-Modal Alignment",
      audioSnippet: "“...notice how the passivation layer prevents ion migration until temperatures cross roughly 358 Kelvin...”",
      audioCitation: "Symposium_Keynote_DrGupta.wav (Timestamp: 18:42 - 19:15)",
      audioScore: "97.8% Speech-to-Text Transcription"
    },
    quantum: {
      query: "Quantum dot bandgap calculation and photoluminescence peak shift",
      docSnippet: "Effective mass approximation yields Eg(r) = Eg(bulk) + (ℏ²π²)/(2mr²). At 4.2nm diameter, blue shift exceeds 340 meV compared to bulk lead-sulfide.",
      docCitation: "Nano_Optics_Quarterly_v12.pdf (Page 29, Eq 14)",
      docScore: "98.7% Vector Match",
      imgSnippet: "Absorption & emission spectra overlay demonstrating Stokes shift of 42 meV with sharp excitonic absorption peak.",
      imgCitation: "PL_Spectra_Graph_Run09.png (Vector Region: [0.12, 0.44, 0.78, 0.92])",
      imgScore: "95.2% Cross-Modal Alignment",
      audioSnippet: "“...if we synthesize the shell with zinc sulfide, the quantum yield jumps immediately above eighty-five percent...”",
      audioCitation: "Lab_Discussion_ColloidalQuantumDots.mp3 (Timestamp: 06:14 - 06:50)",
      audioScore: "96.5% Speech-to-Text Transcription"
    },
    battery: {
      query: "Solid-state electrolyte lithium dendrite suppression techniques",
      docSnippet: "Application of a 15nm amorphous carbon interlayer reduced interfacial resistance from 120 Ω·cm² to 14 Ω·cm², suppressing dendrite nucleation up to 8 mA/cm².",
      docCitation: "Solid_State_Ionics_Review.pdf (Page 8, §2.1)",
      docScore: "99.4% Vector Match",
      imgSnippet: "Cross-sectional FIB-SEM showing pristine electrolyte-electrode interface after 1,000 deep charge-discharge cycles without void formation.",
      imgCitation: "FIB_SEM_Interface_1000Cycles.png (High-Res 2048x1536)",
      imgScore: "97.1% Cross-Modal Alignment",
      audioSnippet: "“...the mechanical pressure must be maintained at precisely five megapascals during initial formation cycles...”",
      audioCitation: "Battery_Tech_Symposium_Panel.wav (Timestamp: 42:10 - 42:55)",
      audioScore: "98.2% Speech-to-Text Transcription"
    }
  };

  miraSimulators.forEach(box => {
    const searchInput = box.querySelector('.mira-search-input');
    const chips = box.querySelectorAll('.mira-chip');

    const docText = box.querySelector('#mira-doc-text');
    const docCit = box.querySelector('#mira-doc-cit');
    const docScore = box.querySelector('#mira-doc-score');

    const imgText = box.querySelector('#mira-img-text');
    const imgCit = box.querySelector('#mira-img-cit');
    const imgScore = box.querySelector('#mira-img-score');

    const audioText = box.querySelector('#mira-audio-text');
    const audioCit = box.querySelector('#mira-audio-cit');
    const audioScore = box.querySelector('#mira-audio-score');

    const updateResults = (key) => {
      const data = sampleData[key] || sampleData.perovskite;
      if (searchInput) searchInput.value = data.query;

      if (docText) docText.textContent = data.docSnippet;
      if (docCit) docCit.textContent = data.docCitation;
      if (docScore) docScore.textContent = data.docScore;

      if (imgText) imgText.textContent = data.imgSnippet;
      if (imgCit) imgCit.textContent = data.imgCitation;
      if (imgScore) imgScore.textContent = data.imgScore;

      if (audioText) audioText.textContent = data.audioSnippet;
      if (audioCit) audioCit.textContent = data.audioCitation;
      if (audioScore) audioScore.textContent = data.audioScore;
    };

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const key = chip.getAttribute('data-sample-key');
        updateResults(key);
      });
    });

    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = searchInput.value.toLowerCase();
          if (val.includes('quantum') || val.includes('bandgap')) {
            updateResults('quantum');
          } else if (val.includes('battery') || val.includes('lithium') || val.includes('dendrite')) {
            updateResults('battery');
          } else {
            updateResults('perovskite');
          }
        }
      });
    }

    // Audio preview simulation button
    const playBtns = box.querySelectorAll('.audio-play-btn');
    playBtns.forEach(btn => {
      let isPlaying = false;
      let interval = null;
      btn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        btn.innerHTML = isPlaying 
          ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>' 
          : '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
        
        const waveBars = box.querySelectorAll('.wave-bar');
        if (isPlaying) {
          interval = setInterval(() => {
            waveBars.forEach(bar => {
              const h = Math.floor(Math.random() * 16) + 4;
              bar.style.height = `${h}px`;
              bar.classList.add('active');
            });
          }, 120);
        } else {
          clearInterval(interval);
          waveBars.forEach(bar => {
            bar.classList.remove('active');
            bar.style.height = '';
          });
        }
      });
    });
  });

  // ==========================================================================
  // 9. MIRA Phase Visualizer Tabs
  // ==========================================================================
  const phaseTabs = document.querySelectorAll('.phase-tab-btn');
  phaseTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPhase = tab.getAttribute('data-phase');
      phaseTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const panels = document.querySelectorAll('.phase-panel');
      panels.forEach(panel => {
        if (panel.id === `phase-panel-${targetPhase}` || panel.getAttribute('data-phase') === targetPhase) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });

  // ==========================================================================
  // 10. Mobile Drawer Navigation
  // ==========================================================================
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  const drawerOverlay = document.querySelector('.mobile-drawer-overlay');
  const drawerClose = document.querySelector('.drawer-close');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  const openDrawer = () => {
    if (mobileDrawer) mobileDrawer.classList.add('active');
    if (drawerOverlay) drawerOverlay.classList.add('active');
    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    if (mobileDrawer) mobileDrawer.classList.remove('active');
    if (drawerOverlay) drawerOverlay.classList.remove('active');
    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  if (mobileToggle) mobileToggle.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeDrawer();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileDrawer && mobileDrawer.classList.contains('active')) {
      closeDrawer();
    }
  });

  // ==========================================================================
  // 11. 3D Card Tilt Physics & Hover Parallax
  // ==========================================================================
  const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!isReducedMotion) {
    const cards3d = document.querySelectorAll('.card-3d, .card-hover, .service-pillar-card');
    cards3d.forEach(card => {
      let bounds = null;

      const onMouseEnter = () => {
        bounds = card.getBoundingClientRect();
      };

      const onMouseMove = (e) => {
        if (!bounds) bounds = card.getBoundingClientRect();
        const mouseX = e.clientX - bounds.left;
        const mouseY = e.clientY - bounds.top;
        const xPct = (mouseX / bounds.width) - 0.5;
        const yPct = (mouseY / bounds.height) - 0.5;

        const rotateX = -(yPct * 7).toFixed(2);
        const rotateY = (xPct * 7).toFixed(2);

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(6px)`;
      };

      const onMouseLeave = () => {
        bounds = null;
        card.style.transform = '';
      };

      card.addEventListener('mouseenter', onMouseEnter, { passive: true });
      card.addEventListener('mousemove', onMouseMove, { passive: true });
      card.addEventListener('mouseleave', onMouseLeave, { passive: true });
    });
  }
});
