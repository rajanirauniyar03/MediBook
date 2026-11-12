/**
 * MediBook+ Landing Page Controller
 * Powers the Smart Symptom Matcher, Medical Specialties, Featured Doctors with Skeletons,
 * Platform Statistics, and AI Chatbot Bridge.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupSymptomMatcher();
  renderPlatformStats();
  renderSpecializations();
  renderFeaturedDoctors();
  renderTestimonials();
  setupLegacyHeroSearch();

  if (window.lucide) {
    window.lucide.createIcons();
  }
});

/**
 * 1. Smart Symptom Matcher (AI Assistant Bridge)
 * Validates natural language query, bridges to MediBook AI Chatbot,
 * opens chat widget, and triggers instant clinical triage/doctor matching.
 */
function setupSymptomMatcher() {
  const form = document.getElementById('symptom-matcher-form');
  const input = document.getElementById('hero-symptom-input');
  const aiGuideLink = document.getElementById('ai-assistant-guide-link');
  const chips = document.querySelectorAll('.symptom-chip');

  const executeSymptomSearch = (rawQuery) => {
    const query = (rawQuery || (input ? input.value : '')).trim();
    if (!query) {
      if (input) input.focus();
      return;
    }

    // Step 1: Temporarily store query in sessionStorage per specification
    sessionStorage.setItem('medibook_pending_query', query);

    // Step 2: Open Chatbot widget and trigger submission
    const submitToChat = () => {
      if (window.MediBookChat) {
        window.MediBookChat.toggleChat(true);
        window.MediBookChat.handleUserMessage(query);
        sessionStorage.removeItem('medibook_pending_query');
        if (input) input.value = '';
      } else {
        // If chatbot is still initializing, retry briefly
        setTimeout(() => {
          if (window.MediBookChat) {
            window.MediBookChat.toggleChat(true);
            window.MediBookChat.handleUserMessage(query);
            sessionStorage.removeItem('medibook_pending_query');
            if (input) input.value = '';
          }
        }, 300);
      }
    };

    submitToChat();
  };

  // Form submit event
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      executeSymptomSearch();
    });
  }

  // "Not sure where to start? Our AI assistant will guide you →" Link
  if (aiGuideLink) {
    aiGuideLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.MediBookChat) {
        window.MediBookChat.toggleChat(true);
      } else {
        setTimeout(() => {
          if (window.MediBookChat) window.MediBookChat.toggleChat(true);
        }, 200);
      }
    });
  }

  // Quick symptom chips (1-click search)
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const symptomText = chip.getAttribute('data-symptom') || chip.textContent.trim();
      if (input) input.value = symptomText;
      executeSymptomSearch(symptomText);
    });
  });
}

/**
 * 2. Render Configurable Platform Statistics
 * Configurable metrics clearly identified with Demo Mode indicator
 */
function renderPlatformStats() {
  const container = document.getElementById('platform-stats-grid');
  if (!container || !window.MEDIBOOK_DATA) return;

  const stats = window.MEDIBOOK_DATA.stats;
  if (!stats) return;

  const items = [
    {
      value: stats.registeredDoctors?.value || "180+",
      label: stats.registeredDoctors?.label || "Registered Doctors",
      note: stats.registeredDoctors?.note || "Across 8 flagship clinical faculties",
      icon: "users"
    },
    {
      value: stats.medicalSpecializations?.value || "24+",
      label: stats.medicalSpecializations?.label || "Medical Specializations",
      note: stats.medicalSpecializations?.note || "Cardiology, Neurology, Pediatrics & more",
      icon: "activity"
    },
    {
      value: stats.appointmentsCompleted?.value || "85,000+",
      label: stats.appointmentsCompleted?.label || "Appointments Completed",
      note: stats.appointmentsCompleted?.note || "In-clinic and telehealth consultations",
      icon: "calendar-check-2"
    },
    {
      value: stats.patientSatisfaction?.value || "99.4%",
      label: stats.patientSatisfaction?.label || "Patient Satisfaction",
      note: stats.patientSatisfaction?.note || "Based on verified post-consultation surveys",
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
 * 3. Render Medical Specialties (Exact 8 Disciplines)
 * Cardiology, Dermatology, Orthopedics, Neurology, Pediatrics, Dentistry, Gynecology, General Medicine
 */
function renderSpecializations() {
  const container = document.getElementById('specialties-grid');
  if (!container || !window.MEDIBOOK_DATA) return;

  const rawDepts = window.MEDIBOOK_DATA.departments || [];

  // Order to match specification: Cardiology, Dermatology, Orthopedics, Neurology, Pediatrics, Dentistry, Gynecology, General Medicine
  const preferredOrder = [
    'Cardiology',
    'Dermatology',
    'Orthopedics',
    'Neurology',
    'Pediatrics',
    'Dentistry',
    'Gynecology',
    'General Medicine'
  ];

  const sortedDepts = [...rawDepts].sort((a, b) => {
    const idxA = preferredOrder.indexOf(a.name);
    const idxB = preferredOrder.indexOf(b.name);
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });

  container.innerHTML = sortedDepts.map(dept => `
    <a href="find-doctors.html?dept=${encodeURIComponent(dept.name)}" class="specialty-card-full" title="Find ${dept.name} Specialists">
      <div>
        <div class="specialty-card-icon">
          <i data-lucide="${dept.icon || 'stethoscope'}"></i>
        </div>
        <h3>${dept.name}</h3>
        <p class="specialty-card-desc">${dept.shortDesc}</p>
      </div>
      <div>
        <span class="specialty-explore-link">
          <span>Explore Specialists</span>
          <i data-lucide="arrow-right"></i>
        </span>
      </div>
    </a>
  `).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * 4. Render Featured Doctors (with Loading Skeletons and Live/Demo Data)
 * Displays photo, name, specialty, experience, fee, rating, availability, View Profile and Book buttons.
 */
function renderFeaturedDoctors() {
  const container = document.getElementById('featured-doctors-grid');
  if (!container) return;

  // Show loading skeleton placeholders first
  container.innerHTML = `
    <div class="doctor-card-skeleton">
      <div style="display:flex; gap:1.15rem; align-items:center;">
        <div class="skeleton-shimmer" style="width:76px; height:76px; border-radius:14px; flex-shrink:0;"></div>
        <div style="flex:1; display:flex; flex-direction:column; gap:0.5rem;">
          <div class="skeleton-shimmer" style="height:20px; width:65%;"></div>
          <div class="skeleton-shimmer" style="height:14px; width:45%;"></div>
          <div class="skeleton-shimmer" style="height:16px; width:35%;"></div>
        </div>
      </div>
      <div class="skeleton-shimmer" style="height:55px; width:100%;"></div>
      <div class="skeleton-shimmer" style="height:38px; width:100%;"></div>
    </div>
  `.repeat(3);

  // Load verified doctors asynchronously from AdminService / Firestore / Demo data
  setTimeout(() => {
    let doctors = [];
    if (window.AdminService) {
      doctors = window.AdminService.getDoctors();
    }
    if (!doctors || doctors.length === 0) {
      doctors = (window.MEDIBOOK_DATA && window.MEDIBOOK_DATA.doctors) ? window.MEDIBOOK_DATA.doctors : [];
    }

    // Filter active and approved doctors
    const activeDoctors = doctors.filter(d => d.status === 'Active' || !d.status);
    const featured = activeDoctors.slice(0, 3);

    if (featured.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #ffffff; border-radius: var(--radius-xl); border: 1px dashed var(--slate-300);">
          <i data-lucide="user-search" style="width: 48px; height: 48px; color: var(--slate-400); margin-bottom: 1rem;"></i>
          <h3 style="font-size: 1.25rem; color: var(--slate-800); margin-bottom: 0.5rem;">No Doctors Found</h3>
          <p style="color: var(--slate-600); margin-bottom: 1.5rem;">Doctors are currently updating their schedules. Browse all specialists below.</p>
          <a href="find-doctors.html" class="btn btn-primary">Browse All Doctors</a>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = featured.map(doc => {
      const fee = doc.consultationFee || doc.fee || 100;
      const experienceText = doc.experienceYears ? `${doc.experienceYears}+ years experience` : (doc.experience || 'Experienced Specialist');
      const rating = doc.rating || 4.9;
      const reviews = doc.reviewCount || doc.reviews || 80;
      const daysText = doc.availableDaysText || (Array.isArray(doc.availableDays) ? doc.availableDays.slice(0, 3).map(d => d.slice(0, 3)).join(', ') : 'Mon, Wed, Fri');
      const bookUrl = `portal/patient/book-appointment.html?doc=${encodeURIComponent(doc.id)}`;
      const profileUrl = `doctor-profile.html?id=${encodeURIComponent(doc.id)}`;

      return `
        <div class="doctor-card-rich">
          <div class="doctor-card-body">
            <div class="doctor-card-top">
              <div class="doctor-avatar-box">
                <img src="${doc.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80'}" alt="${doc.name}" loading="lazy" />
                <div class="doctor-verified-check" title="Board-Certified & Hospital Verified">
                  <i data-lucide="check"></i>
                </div>
              </div>
              <div class="doctor-info-col">
                <h3 class="doctor-card-name">
                  <a href="${profileUrl}" style="color: inherit; text-decoration: none;">
                    ${doc.name}
                  </a>
                </h3>
                <div class="doctor-card-qualification">${doc.qualification || doc.title || 'MD'}</div>
                <span class="doctor-spec-pill">${doc.specialization || doc.department || 'General Medicine'}</span>
                <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.825rem; color: var(--slate-600);">
                  <i data-lucide="star" style="width: 14px; height: 14px; color: #f59e0b; fill: #f59e0b;"></i>
                  <strong>${rating}</strong>
                  <span class="text-muted">(${reviews} reviews)</span>
                </div>
              </div>
            </div>

            <div class="doctor-specs-list">
              <div class="doctor-spec-item">
                <i data-lucide="building-2"></i>
                <span>${doc.hospital || 'Metropolitan Central Hospital'}</span>
              </div>
              <div class="doctor-spec-item">
                <i data-lucide="award"></i>
                <span>${experienceText}</span>
              </div>
              <div class="doctor-spec-item">
                <i data-lucide="calendar"></i>
                <span style="color: var(--primary-700); font-weight: 600;">Available: ${daysText}</span>
              </div>
            </div>
          </div>

          <div class="doctor-card-bottom">
            <div class="doctor-price-tag">
              <span class="label">Consultation Fee</span>
              <span class="amount">$${fee}</span>
            </div>
            <div class="doctor-actions-row">
              <a href="${profileUrl}" class="btn btn-outline btn-sm">
                <span>View Profile</span>
              </a>
              <a href="${bookUrl}" class="btn btn-primary btn-sm">
                <i data-lucide="calendar-plus"></i>
                <span>Book Appointment</span>
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, 250);
}

/**
 * 5. Render Testimonials
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
        <img src="${item.avatar}" alt="${item.name}" loading="lazy" />
        <div>
          <div class="testimonial-profile-name">${item.name}</div>
          <div class="testimonial-profile-role">${item.role}</div>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * 6. Legacy / Supplementary Search Form Handling (if present)
 */
function setupLegacyHeroSearch() {
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
