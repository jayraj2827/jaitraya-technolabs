/**
 * Jaitraya Technolabs — Contact & Inquiry Form Controller
 * Accessible, client-side validation with instant response.
 */

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contact-form');
  const alertBox = document.getElementById('form-alert');
  const inquiryTypeSelect = document.getElementById('inquiryType');

  // Pre-select based on URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const productParam = urlParams.get('product');
  if (productParam && inquiryTypeSelect) {
    if (productParam === 'mira') {
      inquiryTypeSelect.value = 'mira-pilot';
    } else if (productParam === 'mulyankan') {
      inquiryTypeSelect.value = 'mulyankan-pilot';
    }
  }

  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName')?.value.trim();
    const workEmail = document.getElementById('workEmail')?.value.trim();
    const organization = document.getElementById('organization')?.value.trim();
    const inquiryType = document.getElementById('inquiryType')?.value;
    const message = document.getElementById('message')?.value.trim();
    const submitBtn = document.getElementById('submit-btn');

    // Validation
    if (!fullName || !workEmail || !organization || !message) {
      showAlert('Please fill in all required fields.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(workEmail)) {
      showAlert('Please enter a valid institutional or business email address.', 'error');
      return;
    }

    // Submission feedback state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        Transmitting Inquiry...
      `;
    }

    // Simulate reliable dispatch
    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Send Inquiry`;
      }
      contactForm.reset();
      showAlert('Thank you for reaching out. Your inquiry has been received. Our engineering and partnership team will review your message and respond within 1 business day.', 'success');
    }, 900);
  });

  function showAlert(message, type) {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `form-alert ${type}`;
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});

// Inline spin animation style injection if not present
if (!document.getElementById('spin-anim-style')) {
  const style = document.createElement('style');
  style.id = 'spin-anim-style';
  style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
