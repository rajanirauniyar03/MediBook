/**
 * MediBook Toast Notification System
 */

class ToastService {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    this.container = container;
  }

  show({ title, message, type = 'info', duration = 4000 }) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose icon based on type
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle-2';
    if (type === 'error') iconName = 'alert-triangle';
    if (type === 'warning') iconName = 'alert-circle';

    toast.innerHTML = `
      <div class="toast-icon">
        <i data-lucide="${iconName}"></i>
      </div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close notification">
        <i data-lucide="x"></i>
      </button>
    `;

    this.container.appendChild(toast);

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    };

    closeBtn.addEventListener('click', dismiss);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }

    return toast;
  }

  success(message, title = 'Success') {
    return this.show({ title, message, type: 'success' });
  }

  error(message, title = 'Error') {
    return this.show({ title, message, type: 'error', duration: 5500 });
  }

  info(message, title = 'Notice') {
    return this.show({ title, message, type: 'info' });
  }

  warning(message, title = 'Warning') {
    return this.show({ title, message, type: 'warning' });
  }
}

window.Toast = new ToastService();
