/**
 * ============================================================================
 * TechPulse Insight — Accessible Knowledge Portal & Article Reader
 * Universal WCAG 2.1 Level AA Accessibility Controller
 * ============================================================================
 *
 * Implements:
 * 1. Theme Contrast Manager (Dark, High Contrast, Light) with localStorage & radiogroup ARIA
 * 2. Typography Font Scaler (100%, 125%, 150%) with persistent state
 * 3. Dynamic Reading Progress Bar with synchronized ARIA progressbar attributes
 * 4. Inline Form Validation Engine with aria-invalid, aria-describedby & live announcements
 * 5. Clipboard Sharing Helpers with accessible feedback
 * 6. Skip-Link and Keyboard Focus Routing
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1. THEME CONTRAST MANAGER (WCAG 1.4.3 & 1.4.6)
     -------------------------------------------------------------------------- */
  class ThemeManager {
    constructor() {
      this.storageKey = 'techpulse_portal_theme';
      this.themeRadios = document.querySelectorAll('.theme-btn');
      this.root = document.documentElement;

      this.init();
    }

    init() {
      const savedTheme = localStorage.getItem(this.storageKey);
      const initialTheme = savedTheme || 'dark';
      this.setTheme(initialTheme, false);

      this.themeRadios.forEach((btn, index) => {
        btn.addEventListener('click', () => {
          const theme = btn.getAttribute('data-theme-val');
          this.setTheme(theme, true);
        });

        // WAI-ARIA Radio Group Keyboard Navigation (Arrow Keys)
        btn.addEventListener('keydown', (e) => {
          let targetIndex = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            targetIndex = (index + 1) % this.themeRadios.length;
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            targetIndex = (index - 1 + this.themeRadios.length) % this.themeRadios.length;
          }

          if (targetIndex !== null) {
            const targetBtn = this.themeRadios[targetIndex];
            targetBtn.focus();
            const theme = targetBtn.getAttribute('data-theme-val');
            this.setTheme(theme, true);
          }
        });
      });
    }

    setTheme(theme, save = true) {
      this.root.setAttribute('data-theme', theme);

      this.themeRadios.forEach((btn) => {
        const val = btn.getAttribute('data-theme-val');
        const isActive = val === theme;
        btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
        btn.classList.toggle('is-active', isActive);
      });

      if (save) {
        localStorage.setItem(this.storageKey, theme);
        this.announceChange(`Theme contrast changed to ${theme.replace('-', ' ')} mode.`);
      }
    }

    announceChange(msg) {
      const liveRegion = document.getElementById('form-status-message');
      if (liveRegion) {
        liveRegion.textContent = msg;
        setTimeout(() => {
          if (liveRegion.textContent === msg) {
            liveRegion.textContent = '';
          }
        }, 3000);
      }
    }
  }

  /* --------------------------------------------------------------------------
     2. FONT SIZING SCALER (WCAG 1.4.4 Resize Text)
     -------------------------------------------------------------------------- */
  class FontSizeManager {
    constructor() {
      this.storageKey = 'techpulse_font_size';
      this.fontButtons = document.querySelectorAll('.font-btn');
      this.root = document.documentElement;

      this.init();
    }

    init() {
      const savedSize = localStorage.getItem(this.storageKey) || 'normal';
      this.setSize(savedSize, false);

      this.fontButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const size = btn.getAttribute('data-font-size');
          this.setSize(size, true);
        });
      });
    }

    setSize(size, save = true) {
      this.root.setAttribute('data-font-size', size);

      this.fontButtons.forEach((btn) => {
        const val = btn.getAttribute('data-font-size');
        const isPressed = val === size;
        btn.setAttribute('aria-pressed', isPressed ? 'true' : 'false');
      });

      if (save) {
        localStorage.setItem(this.storageKey, size);
      }
    }
  }

  /* --------------------------------------------------------------------------
     3. READING PROGRESS BAR WITH ARIA SYNCHRONIZATION
     -------------------------------------------------------------------------- */
  class ReadingProgressTracker {
    constructor() {
      this.track = document.getElementById('reading-progress-bar');
      this.fill = document.getElementById('reading-progress-fill');
      this.article = document.getElementById('quantum-computing-article');

      if (!this.track || !this.fill) return;

      this.isUpdating = false;
      this.init();
    }

    init() {
      window.addEventListener('scroll', () => {
        if (!this.isUpdating) {
          window.requestAnimationFrame(() => {
            this.updateProgress();
            this.isUpdating = false;
          });
          this.isUpdating = true;
        }
      }, { passive: true });

      this.updateProgress();
    }

    updateProgress() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const progress = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));

      this.fill.style.width = `${progress}%`;
      this.track.setAttribute('aria-valuenow', Math.round(progress).toString());
    }
  }

  /* --------------------------------------------------------------------------
     4. ACCESSIBLE FORM VALIDATION (WCAG 3.3.1, 3.3.2, 3.3.3)
     -------------------------------------------------------------------------- */
  class AccessibleFormValidator {
    constructor() {
      this.form = document.getElementById('reader-feedback-form');
      if (!this.form) return;

      this.statusRegion = document.getElementById('form-status-message');
      this.inputs = {
        fullname: document.getElementById('input-fullname'),
        email: document.getElementById('input-email'),
        category: document.getElementById('select-category'),
        message: document.getElementById('textarea-message')
      };

      this.errors = {
        fullname: document.getElementById('fullname-error'),
        email: document.getElementById('email-error'),
        message: document.getElementById('message-error')
      };

      this.init();
    }

    init() {
      // Blur and Input real-time validation
      if (this.inputs.fullname) {
        this.inputs.fullname.addEventListener('blur', () => this.validateFullName());
        this.inputs.fullname.addEventListener('input', () => {
          if (this.inputs.fullname.getAttribute('aria-invalid') === 'true') {
            this.validateFullName();
          }
        });
      }

      if (this.inputs.email) {
        this.inputs.email.addEventListener('blur', () => this.validateEmail());
        this.inputs.email.addEventListener('input', () => {
          if (this.inputs.email.getAttribute('aria-invalid') === 'true') {
            this.validateEmail();
          }
        });
      }

      if (this.inputs.category) {
        this.inputs.category.addEventListener('change', () => this.validateCategory());
      }

      if (this.inputs.message) {
        this.inputs.message.addEventListener('blur', () => this.validateMessage());
        this.inputs.message.addEventListener('input', () => {
          if (this.inputs.message.getAttribute('aria-invalid') === 'true') {
            this.validateMessage();
          }
        });
      }

      // Submit handling
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    validateFullName() {
      const val = this.inputs.fullname.value.trim();
      if (!val) {
        this.setError(this.inputs.fullname, this.errors.fullname, 'Full name is required.');
        return false;
      }
      if (val.length < 3) {
        this.setError(this.inputs.fullname, this.errors.fullname, 'Full name must be at least 3 characters.');
        return false;
      }
      this.clearError(this.inputs.fullname, this.errors.fullname);
      return true;
    }

    validateEmail() {
      const val = this.inputs.email.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!val) {
        this.setError(this.inputs.email, this.errors.email, 'Email address is required.');
        return false;
      }
      if (!emailRegex.test(val)) {
        this.setError(this.inputs.email, this.errors.email, 'Please enter a valid email address (e.g., user@domain.com).');
        return false;
      }
      this.clearError(this.inputs.email, this.errors.email);
      return true;
    }

    validateCategory() {
      const val = this.inputs.category.value;
      if (!val) {
        this.inputs.category.setAttribute('aria-invalid', 'true');
        return false;
      }
      this.inputs.category.setAttribute('aria-invalid', 'false');
      return true;
    }

    validateMessage() {
      const val = this.inputs.message.value.trim();
      if (!val) {
        this.setError(this.inputs.message, this.errors.message, 'Feedback message is required.');
        return false;
      }
      if (val.length < 10) {
        this.setError(this.inputs.message, this.errors.message, 'Feedback message must be at least 10 characters.');
        return false;
      }
      this.clearError(this.inputs.message, this.errors.message);
      return true;
    }

    setError(input, errorSpan, message) {
      input.setAttribute('aria-invalid', 'true');
      if (errorSpan) {
        errorSpan.textContent = message;
      }
    }

    clearError(input, errorSpan) {
      input.setAttribute('aria-invalid', 'false');
      if (errorSpan) {
        errorSpan.textContent = '';
      }
    }

    handleSubmit(e) {
      e.preventDefault();

      const isNameValid = this.validateFullName();
      const isEmailValid = this.validateEmail();
      const isCategoryValid = this.validateCategory();
      const isMessageValid = this.validateMessage();

      if (!isNameValid || !isEmailValid || !isCategoryValid || !isMessageValid) {
        this.statusRegion.className = 'form-status-region status-error';
        this.statusRegion.textContent = 'Submission blocked: Please correct the highlighted errors above.';

        // Move keyboard focus to first invalid control
        if (!isNameValid) this.inputs.fullname.focus();
        else if (!isEmailValid) this.inputs.email.focus();
        else if (!isCategoryValid) this.inputs.category.focus();
        else if (!isMessageValid) this.inputs.message.focus();
        return;
      }

      // Form is valid: simulate submission
      const submitBtn = document.getElementById('btn-submit-feedback');
      if (submitBtn) submitBtn.disabled = true;

      const userName = this.inputs.fullname.value.trim();
      const categoryName = this.inputs.category.options[this.inputs.category.selectedIndex].text;

      this.statusRegion.className = 'form-status-region status-success';
      this.statusRegion.innerHTML = `✓ Thank you, <strong>${userName}</strong>! Your inquiry regarding <em>${categoryName}</em> has been securely submitted and logged.`;

      // Reset form fields
      setTimeout(() => {
        this.form.reset();
        this.inputs.fullname.setAttribute('aria-invalid', 'false');
        this.inputs.email.setAttribute('aria-invalid', 'false');
        this.inputs.category.setAttribute('aria-invalid', 'false');
        this.inputs.message.setAttribute('aria-invalid', 'false');
        if (submitBtn) submitBtn.disabled = false;
      }, 3500);
    }
  }

  /* --------------------------------------------------------------------------
     5. CLIPBOARD LINK COPY WITH SCREEN READER ANNOUNCEMENT
     -------------------------------------------------------------------------- */
  function initShareButtons() {
    const copyBtns = [
      document.getElementById('btn-copy-article-link')
    ].filter(Boolean);

    copyBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const url = window.location.href;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
          }
          const originalText = btn.innerHTML;
          btn.innerHTML = '<span aria-hidden="true">✓</span> Copied to Clipboard!';
          
          const statusRegion = document.getElementById('form-status-message');
          if (statusRegion) {
            statusRegion.textContent = 'Article link copied to clipboard successfully.';
          }

          setTimeout(() => {
            btn.innerHTML = originalText;
          }, 3000);
        } catch (err) {
          console.warn('Clipboard write failed:', err);
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     6. SKIP NAVIGATION FOCUS ROUTER
     -------------------------------------------------------------------------- */
  function initSkipLinks() {
    const skipLinks = document.querySelectorAll('.skip-link');
    skipLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href').slice(1);
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          if (!targetEl.hasAttribute('tabindex')) {
            targetEl.setAttribute('tabindex', '-1');
          }
          targetEl.focus();
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     DOM READY INITIALIZER
     -------------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new FontSizeManager();
    new ReadingProgressTracker();
    new AccessibleFormValidator();
    initShareButtons();
    initSkipLinks();

    console.log('✓ TechPulse Insight: Universal WCAG 2.1 Level AA Accessibility Controller Initialized.');
  });
})();
