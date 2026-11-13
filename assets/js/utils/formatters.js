/**
 * Veyora Data Formatters & UI Presentation Helpers
 */

const Formatters = {
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  },

  formatDate(dateString, options = {}) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const defaultOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
  },

  formatStatusBadge(status) {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'confirmed':
      case 'active':
      case 'approved':
        return `<span class="badge badge-success"><i data-lucide="check-circle-2"></i> ${status}</span>`;
      case 'pending':
      case 'scheduled':
        return `<span class="badge badge-warning"><i data-lucide="clock"></i> ${status}</span>`;
      case 'cancelled':
      case 'rejected':
        return `<span class="badge badge-danger"><i data-lucide="x-circle"></i> ${status}</span>`;
      case 'completed':
        return `<span class="badge badge-primary"><i data-lucide="check"></i> ${status}</span>`;
      default:
        return `<span class="badge badge-neutral">${status}</span>`;
    }
  },

  formatRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let html = '';
    for (let i = 0; i < fullStars; i++) {
      html += `<i data-lucide="star" class="fill-current"></i>`;
    }
    if (hasHalf) {
      html += `<i data-lucide="star-half" class="fill-current"></i>`;
    }
    return html;
  }
};

window.Formatters = Formatters;
