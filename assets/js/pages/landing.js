/**
 * MediBook Landing Page Interaction Script
 */

document.addEventListener('DOMContentLoaded', () => {
  renderSpecialties();
  renderFeaturedDoctors();
  setupHeroSearch();
  setupDepartmentSelect();
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

/**
 * Render Medical Specialties
 */
function renderSpecialties() {
  const container = document.getElementById('specialties-grid');
  if (!container || !window.MEDIBOOK_DATA) return;

  const departments = window.MEDIBOOK_DATA.departments || [];
  
  container.innerHTML = departments.map(dept => `
    <a href="find-doctors.html?dept=${encodeURIComponent(dept.name)}" class="specialty-card">
      <div class="specialty-icon-box">
        <i data-lucide="${dept.icon || 'stethoscope'}"></i>
      </div>
      <h3>${dept.name}</h3>
      <p>${dept.doctorCount} Specialists Available</p>
    </a>
  `).join('');
}

/**
 * Render Featured Doctors
 */
function renderFeaturedDoctors() {
  const container = document.getElementById('featured-doctors-grid');
  if (!container || !window.MEDIBOOK_DATA) return;

  const doctors = (window.MEDIBOOK_DATA.doctors || []).slice(0, 3);

  container.innerHTML = doctors.map(doc => `
    <div class="doctor-card">
      <div>
        <div class="doctor-header">
          <div class="doctor-avatar-wrapper">
            <img src="${doc.avatar}" alt="${doc.name}" class="doctor-avatar" />
            <div class="doctor-verified-badge" title="Verified Specialist">
              <i data-lucide="check"></i>
            </div>
          </div>
          <div class="doctor-meta">
            <h3 class="doctor-name">${doc.name}</h3>
            <div class="doctor-spec">${doc.specialty}</div>
            <div class="doctor-rating">
              <i data-lucide="star"></i>
              <strong>${doc.rating}</strong>
              <span class="text-muted">(${doc.reviews} reviews)</span>
            </div>
          </div>
        </div>

        <div class="doctor-details-list">
          <div class="doctor-detail-item">
            <i data-lucide="building-2"></i>
            <span>${doc.hospital}</span>
          </div>
          <div class="doctor-detail-item">
            <i data-lucide="briefcase"></i>
            <span>${doc.experience}</span>
          </div>
          <div class="doctor-detail-item">
            <i data-lucide="clock"></i>
            <span style="color: var(--accent-700); font-weight: 600;">Next: ${doc.nextAvailable}</span>
          </div>
        </div>
      </div>

      <div class="doctor-card-footer">
        <div class="doctor-fee-box">
          <span class="doctor-fee-label">Consultation</span>
          <span class="doctor-fee-value">${window.Formatters ? window.Formatters.formatCurrency(doc.fee) : '$' + doc.fee}</span>
        </div>
        <a href="find-doctors.html?doctor=${encodeURIComponent(doc.id)}" class="btn btn-primary btn-sm">
          <span>Book Visit</span>
          <i data-lucide="chevron-right"></i>
        </a>
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
    const locationSelect = document.getElementById('hero-location-select');

    const params = new URLSearchParams();
    if (queryInput && queryInput.value.trim()) {
      params.append('q', queryInput.value.trim());
    }
    if (deptSelect && deptSelect.value) {
      params.append('dept', deptSelect.value);
    }
    if (locationSelect && locationSelect.value) {
      params.append('loc', locationSelect.value);
    }

    window.location.href = `find-doctors.html?${params.toString()}`;
  });
}
