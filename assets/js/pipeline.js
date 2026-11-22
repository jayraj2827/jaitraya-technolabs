/**
 * Mulyankan AI — Interactive 4-Stage Workflow Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.pipeline-tab-btn');
  const tabContents = document.querySelectorAll('.pipeline-tab-content');

  if (tabButtons.length === 0 || tabContents.length === 0) return;

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetStep = btn.getAttribute('data-step');
      if (!targetStep) return;

      // Update button states
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Update content states
      tabContents.forEach((content) => {
        if (content.getAttribute('id') === `step-content-${targetStep}`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });
});
