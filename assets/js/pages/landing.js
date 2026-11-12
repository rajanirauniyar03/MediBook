/**
 * MediBook Landing Page Controller
 * Powers dynamic statistics, specializations, featured doctors, and testimonials
 */

document.addEventListener('DOMContentLoaded', () => {
  renderPlatformStats();
  renderSpecializations();
  renderFeaturedDoctors();
  renderTestimonials();
  setupHeroSearch();
  setupDepartmentSelect();
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

/**
 * 1. Render Configurable Platform Statistics
 * Configurable metrics clearly identified with Demo Mode indicator
 */
function renderPlatformStats() {
  const container = document.getElementById('platform-stats-grid');
  if (!container || !window.MEDIBOOK_DATA) return;

  const stats = window.MEDIBOOK_DATA.stats;
  if (!stats) return;

  const items = [
    {
      value: stats.registeredDoctors.value,
      label: stats.registeredDoctors.label,
      note: stats.registeredDoctors.note,
      icon: "users"
    },
    {
      value: stats.medicalSpecializations.value,
      label: stats.medicalSpecializations.label,
      note: stats.medicalSpecializations.note,
      icon: "activity"
    },
    {
      value: stats.appointmentsCompleted.value,
      label: stats.appointmentsCompleted.label,
      note: stats.appointmentsCompleted.note,
      icon: "calendar-check-2"
    },
    {
      value: stats.patientSatisfaction.value,
      label: stats.patientSatisfaction.label,
      note: stats.patientSatisfaction.note,
      icon: "heart"
    }
  ];

  container.innerHTML = items.map(item => `
    <div class="stat-card">
      <div class="stat-card-icon">
        <i data-lucide="${item.icon}"></i>
      </div>
      <div class="stat-value">${item.value}</div>
      <div class="stat-label">${item.label}</div>
      <div class="stat-note">${item.note}</div>
    </div>
  `).join('');
}

/**
 * 2. Render Specializations (Exact 8 Disciplines from Specification)
 * Cardiology, Dermatology, Neurology, Orthopedics, Pediatrics, Dentistry, General Medicine, Gynecology
 */
function renderSpecializations() {
  const container = document.getElementById('specialties-grid');
  if (!container || !window.MEDIBOOK_DATA) return;

  const departments = window.MEDIBOOK_DATA.departments || [];

  container.innerHTML = departments.map(dept => `
    <div class="specialty-card-full">
      <div>
        <div class="specialty-card-icon">
          <i data-lucide="${dept.icon || 'stethoscope'}"></i>
        </div>
        <h3>${dept.name}</h3>
        <p class="specialty-card-desc">${dept.shortDesc}</p>
      </div>
      <div>
        <a href="find-doctors.html?dept=${encodeURIComponent(dept.name)}" class="specialty-explore-link">
          <span>Explore Doctors</span>
          <i data-lucide="arrow-right"></i>
        </a>
      </div>
    </div>
  `).join('');
}

/**
 * 3. Render Featured Doctors
 * Includes photo, name, qualification, specialization, experience, fee, available days, and Book button
 */
function renderFeaturedDoctors() {
  const container = document.getElementById('featured-doctors-grid');
  if (!container || !window.MEDIBOOK_DATA) return;

  const doctors = (window.MEDIBOOK_DATA.doctors || []).slice(0, 3);

  container.innerHTML = doctors.map(doc => `
    <div class="doctor-card-rich">
      <div class="doctor-card-body">
        <div class="doctor-card-top">
          <div class="doctor-avatar-box">
            <img src="${doc.avatar}" alt="${doc.name}" />
            <div class="doctor-verified-check" title="Board-Certified Specialist">
              <i data-lucide="check"></i>
            </div>
          </div>
          <div class="doctor-info-col">
            <h3 class="doctor-card-name">
              <a href="doctor-profile.html?id=${encodeURIComponent(doc.id)}" style="color: inherit; text-decoration: none;">
                ${doc.name}
              </a>
            </h3>
            <div class="doctor-card-qualification">${doc.qualification}</div>
            <span class="doctor-spec-pill">${doc.specialization}</span>
            <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.825rem; color: var(--slate-600);">
              <i data-lucide="star" style="width: 14px; height: 14px; color: #f59e0b; fill: #f59e0b;"></i>
              <strong>${doc.rating}</strong>
              <span class="text-muted">(${doc.reviews} reviews)</span>
            </div>
          </div>
        </div>

        <div class="doctor-specs-list">
          <div class="doctor-spec-item">
            <i data-lucide="building-2"></i>
            <span>${doc.hospital}</span>
          </div>
          <div class="doctor-spec-item">
            <i data-lucide="briefcase"></i>
            <span>${doc.experience}</span>
          </div>
          <div class="doctor-spec-item">
            <i data-lucide="calendar"></i>
            <span style="color: var(--primary-700); font-weight: 600;">Available: ${doc.availableDaysText || doc.availableDays.join(', ')}</span>
          </div>
        </div>
      </div>

      <div class="doctor-card-bottom">
        <div class="doctor-price-tag">
          <span class="label">Consultation Fee</span>
          <span class="amount">$${doc.consultationFee}</span>
        </div>
        <div class="doctor-actions-row">
          <a href="doctor-profile.html?id=${encodeURIComponent(doc.id)}" class="btn btn-outline btn-sm">
            <span>Profile</span>
          </a>
          <a href="doctor-profile.html?id=${encodeURIComponent(doc.id)}#book-now" class="btn btn-primary btn-sm">
            <i data-lucide="calendar-plus"></i>
            <span>Book Visit</span>
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * 4. Render Testimonials
 * Identified as sample demo reviews
 */
function renderTestimonials() {
  const container = document.getElementById('testimonials-grid');
  if (!container || !window.MEDIBOOK_DATA) return;

  const testimonials = window.MEDIBOOK_DATA.testimonials || [];

  container.innerHTML = testimonials.map(item => `
    <div class="testimonial-card-rich">
      <div class="testimonial-demo-badge">Demo Review</div>
      <div>
        <div class="testimonial-stars">
          <i data-lucide="star"></i>
          <i data-lucide="star"></i>
          <i data-lucide="star"></i>
          <i data-lucide="star"></i>
          <i data-lucide="star"></i>
        </div>
        <p class="testimonial-quote-text">"${item.quote}"</p>
      </div>

      <div class="testimonial-profile">
        <img src="${item.avatar}" alt="${item.name}" />
        <div>
          <div class="testimonial-profile-name">${item.name}</div>
          <div class="testimonial-profile-role">${item.role}</div>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Populate Specialty dropdown in Hero Search
 */
function setupDepartmentSelect() {
  const select = document.getElementById('hero-dept-select');
  if (!select || !window.MEDIBOOK_DATA) return;

  const departments = window.MEDIBOOK_DATA.departments || [];
  departments.forEach(dept => {
    const opt = document.createElement('option');
    opt.value = dept.name;
    opt.textContent = dept.name;
    select.appendChild(opt);
  });
}

/**
 * Hero Search Form Handling
 */
function setupHeroSearch() {
  const form = document.getElementById('hero-search-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const queryInput = document.getElementById('hero-search-query');
    const deptSelect = document.getElementById('hero-dept-select');

    const params = new URLSearchParams();
    if (queryInput && queryInput.value.trim()) {
      params.append('q', queryInput.value.trim());
    }
    if (deptSelect && deptSelect.value) {
      params.append('dept', deptSelect.value);
    }

    window.location.href = `find-doctors.html?${params.toString()}`;
  });
}
