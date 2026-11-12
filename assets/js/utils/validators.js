/**
 * MediBook Form Validation Utilities
 */

const FormValidator = {
  // Regex patterns
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE_REGEX: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,

  validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return this.EMAIL_REGEX.test(email.trim());
  },

  validatePassword(password, minLength = 6) {
    return Boolean(password && password.length >= minLength);
  },

  validatePhone(phone) {
    if (!phone) return true; // Optional if not required
    return this.PHONE_REGEX.test(phone.trim());
  },

  validateRequired(val) {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return true;
  },

  evaluatePasswordStrength(password) {
    if (!password) return { score: 0, level: 'none' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, level: 'weak', label: 'Weak password' };
    if (score <= 3) return { score: 2, level: 'medium', label: 'Moderate strength' };
    return { score: 3, level: 'strong', label: 'Strong password' };
  },

  showError(inputElement, message) {
    if (!inputElement) return;
    inputElement.classList.add('is-invalid');
    inputElement.classList.remove('is-valid');

    // Find or create feedback container
    let parent = inputElement.closest('.form-group') || inputElement.parentElement;
    let feedback = parent.querySelector('.form-feedback.error');
    
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'form-feedback error';
      parent.appendChild(feedback);
    }
    
    feedback.innerHTML = `<i data-lucide="alert-circle"></i> <span>${message}</span>`;
    feedback.style.display = 'flex';
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  clearError(inputElement) {
    if (!inputElement) return;
    inputElement.classList.remove('is-invalid');
    inputElement.classList.add('is-valid');

    let parent = inputElement.closest('.form-group') || inputElement.parentElement;
    let feedback = parent.querySelector('.form-feedback.error');
    if (feedback) {
      feedback.style.display = 'none';
    }
  },

  clearAllErrors(formElement) {
    if (!formElement) return;
    const inputs = formElement.querySelectorAll('.is-invalid, .is-valid');
    inputs.forEach(el => {
      el.classList.remove('is-invalid', 'is-valid');
    });
    const feedbacks = formElement.querySelectorAll('.form-feedback.error');
    feedbacks.forEach(el => {
      el.style.display = 'none';
    });
  }
};

window.FormValidator = FormValidator;
