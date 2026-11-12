/**
 * MediBook+ Landing Page Controller
 * Powers Direct Symptom-to-Doctor Matching with Consultation Fees,
 * Medical Specialties, Featured Doctors with Skeletons, and Platform Statistics.
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
 * 1. Smart Symptom Matcher & Direct Doctor Discovery
 * Directly evaluates patient symptoms or doctor queries, extracts matching specialists,
 * and immediately renders the doctors list with consultation prices directly on page.
 */
function setupSymptomMatcher() {
  const form = document.getElementById('symptom-matcher-form');
  const input = document.getElementById('hero-symptom-input');
  const aiGuideLink = document.getElementById('ai-assistant-guide-link');
  const chips = document.querySelectorAll('.symptom-chip');
  const clearBtn = document.getElementById('clear-search-results-btn');

  const executeDirectSearch = (rawQuery) => {
    const query = (rawQuery || (input ? input.value : '')).trim();
    if (!query) {
      if (input) input.focus();
      return;
    }

    renderDirectSearchResults(query);
  };

  // Form submit event (direct results, no chatbot redirect)
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      executeDirectSearch();
    });
  }

  // Quick symptom chips (1-click direct doctor list with prices)
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const symptomText = chip.getAttribute('data-symptom') || chip.textContent.trim();
      if (input) input.value = symptomText;
      executeDirectSearch(symptomText);
    });
  });

  // Clear search results button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const resultsSection = document.getElementById('search-results-section');
      if (resultsSection) {
        resultsSection.style.display = 'none';
      }
      if (input) {
        input.value = '';
        input.focus();
      }
      const hero = document.querySelector('.hero-section');
      if (hero) {
        hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // "Not sure where to start? Our AI assistant will guide you →" Link
  // Explicitly opens the conversational chatbot for patients desiring dialogue
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
}

/**
 * Intelligent Symptom, Specialty, and Doctor Matcher
 */
function findMatchingDoctors(rawQuery) {
  const q = (rawQuery || '').toLowerCase().trim();
  if (!q) return { doctors: [], matchedDept: null, isEmergency: false };

  // Emergency Safety Keywords
  const emergencyKeywords = ['chest pain', 'heart attack', 'cannot breathe', 'difficulty breathing', 'severe bleeding', 'unconscious', 'stroke', 'choking'];
  const isEmergency = emergencyKeywords.some(kw => q.includes(kw));

  // Roster source: AdminService or demo data
  let allDocs = [];
  if (window.AdminService) {
    allDocs = window.AdminService.getDoctors();
  }
  if (!allDocs || allDocs.length === 0) {
    allDocs = (window.MEDIBOOK_DATA && window.MEDIBOOK_DATA.doctors) ? window.MEDIBOOK_DATA.doctors : [];
  }
  const activeDocs = allDocs.filter(d => d.status === 'Active' || !d.status);

  // Symptom to Department classification map
  const symptomDeptMap = [
    {
      dept: 'Neurology',
      secondaryDept: 'General Medicine',
      keywords: ['headache', 'migraine', 'head pain', 'dizziness', 'vertigo', 'seizure', 'memory', 'numbness', 'brain', 'nerve']
    },
    {
      dept: 'Orthopedics',
      secondaryDept: 'General Medicine',
      keywords: ['knee', 'joint', 'back', 'spine', 'bone', 'fracture', 'shoulder', 'hip', 'ankle', 'wrist', 'sprain', 'running', 'arthritis', 'muscle']
    },
    {
      dept: 'Dermatology',
      secondaryDept: null,
      keywords: ['skin', 'rash', 'acne', 'itch', 'itchy', 'mole', 'eczema', 'psoriasis', 'hair', 'scalp', 'nail', 'dermal', 'red spot']
    },
    {
      dept: 'Dentistry',
      secondaryDept: null,
      keywords: ['tooth', 'teeth', 'dental', 'cavity', 'gum', 'dentist', 'oral', 'toothache', 'jaw', 'molar', 'bleeding gum']
    },
    {
      dept: 'Pediatrics',
      secondaryDept: 'General Medicine',
      keywords: ['child', 'kid', 'baby', 'infant', 'toddler', 'pediatric', 'pediatrician', 'vaccine', 'immunization', 'colic']
    },
    {
      dept: 'Cardiology',
      secondaryDept: 'General Medicine',
      keywords: ['heart', 'cardio', 'cardiologist', 'chest', 'palpitation', 'blood pressure', 'hypertension', 'cholesterol', 'ecg', 'cardiovascular']
    },
    {
      dept: 'Gynecology',
      secondaryDept: null,
      keywords: ['women', 'pregnancy', 'pregnant', 'period', 'menstrual', 'gynec', 'gynecologist', 'ovary', 'prenatal', 'fertility', 'cramp']
    },
    {
      dept: 'General Medicine',
      secondaryDept: null,
      keywords: ['stomach', 'belly', 'abdomen', 'abdominal', 'digestion', 'acid', 'nausea', 'vomit', 'diarrhea', 'cramp', 'fever', 'cough', 'cold', 'flu', 'weakness', 'fatigue', 'infection', 'general', 'checkup', 'physical', 'throat']
    }
  ];

  // 1. Direct doctor name match
  let matched = activeDocs.filter(doc => doc.name.toLowerCase().includes(q));
  if (matched.length > 0) {
    return { doctors: matched, matchedDept: matched[0].specialization, isEmergency };
  }

  // 2. Direct department / specialization match
  matched = activeDocs.filter(doc => 
    (doc.specialization && doc.specialization.toLowerCase().includes(q)) ||
    (doc.department && doc.department.toLowerCase().includes(q))
  );
  if (matched.length > 0) {
    return { doctors: matched, matchedDept: matched[0].specialization, isEmergency };
  }

  // 3. Symptom keyword matching
  let matchedEntry = symptomDeptMap.find(entry => 
    entry.keywords.some(kw => q.includes(kw))
  );

  if (matchedEntry) {
    let deptDocs = activeDocs.filter(d => 
      (d.specialization && d.specialization.toLowerCase() === matchedEntry.dept.toLowerCase()) ||
      (d.department && d.department.toLowerCase() === matchedEntry.dept.toLowerCase())
    );

    if (matchedEntry.secondaryDept) {
      const secondaryDocs = activeDocs.filter(d => 
        (d.specialization && d.specialization.toLowerCase() === matchedEntry.secondaryDept.toLowerCase()) ||
        (d.department && d.department.toLowerCase() === matchedEntry.secondaryDept.toLowerCase())
      );
      deptDocs = [...deptDocs, ...secondaryDocs];
    }

    if (deptDocs.length > 0) {
      return { doctors: deptDocs, matchedDept: matchedEntry.dept, isEmergency };
    }
  }

  // 4. Subspecialty / About keyword fallback
  matched = activeDocs.filter(doc => {
    const text = `${doc.subspecialty || ''} ${doc.about || ''} ${doc.hospital || ''} ${doc.qualification || ''}`.toLowerCase();
    return text.includes(q);
  });

  if (matched.length > 0) {
    return { doctors: matched, matchedDept: matched[0].specialization, isEmergency };
  }

  // 5. Default fallback: return top doctors
  return { doctors: activeDocs.slice(0, 3), matchedDept: 'All Specializations', isEmergency };
}

// Export for other scripts and tests
window.findMatchingDoctors = findMatchingDoctors;

/**
 * Direct Doctor Search Results Renderer
 * Displays matched doctors with prominent prices, ratings, and instant booking buttons
 */
function renderDirectSearchResults(query) {
  const resultsSection = document.getElementById('search-results-section');
  const grid = document.getElementById('search-results-grid');
  const countText = document.getElementById('results-count-text');
  const heading = document.getElementById('results-heading');
  const subtext = document.getElementById('results-subtext');
  const emergencyNotice = document.getElementById('results-emergency-notice');
  const viewAllBtn = document.getElementById('view-all-directory-btn');

  if (!resultsSection || !grid) return;

  const matchData = findMatchingDoctors(query);
  const doctors = matchData.doctors;

  // 1. Update Header Information
  if (countText) {
    countText.textContent = `${doctors.length} Specialist${doctors.length === 1 ? '' : 's'} Matched for "${query}"`;
  }
  if (heading) {
    heading.textContent = matchData.matchedDept && matchData.matchedDept !== 'All Specializations'
      ? `Doctors Available for ${matchData.matchedDept}`
      : `Doctors Available for Your Care`;
  }
  if (subtext) {
    const minFee = doctors.length > 0 ? Math.min(...doctors.map(d => d.consultationFee || d.fee || 90)) : 85;
    const maxFee = doctors.length > 0 ? Math.max(...doctors.map(d => d.consultationFee || d.fee || 120)) : 150;
    subtext.textContent = `Consultation fees: $${minFee} - $${maxFee}. Choose a verified specialist and book your visit instantly.`;
  }

  // 2. Emergency Alert Visibility
  if (emergencyNotice) {
    emergencyNotice.style.display = matchData.isEmergency ? 'flex' : 'none';
  }

  // 3. View All Link update
  if (viewAllBtn) {
    viewAllBtn.href = `find-doctors.html?q=${encodeURIComponent(query)}`;
  }

  // 4. Render Matched Doctor Cards with Fees & Direct Book Buttons
  if (doctors.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--slate-50); border-radius: var(--radius-xl); border: 1px dashed var(--slate-300);">
        <i data-lucide="user-search" style="width: 48px; height: 48px; color: var(--slate-400); margin: 0 auto 1rem;"></i>
        <h3 style="font-size: 1.25rem; color: var(--slate-800); margin-bottom: 0.5rem;">No exact doctor match found for "${query}"</h3>
        <p style="color: var(--slate-600); margin-bottom: 1.5rem;">Try searching another symptom, a doctor name, or browse our full clinical roster.</p>
        <a href="find-doctors.html" class="btn btn-primary">Browse All Specialists</a>
      </div>
    `;
  } else {
    grid.innerHTML = doctors.map((doc, idx) => {
      const fee = doc.consultationFee || doc.fee || 100;
      const daysText = doc.availableDaysText || (Array.isArray(doc.availableDays) ? doc.availableDays.slice(0, 3).map(d => d.slice(0, 3)).join(', ') : 'Mon, Wed, Fri');
      const experienceText = doc.experienceYears ? `${doc.experienceYears}+ years experience` : (doc.experience || 'Experienced Specialist');
      const bookUrl = `portal/patient/book-appointment.html?doc=${encodeURIComponent(doc.id)}`;
      const profileUrl = `doctor-profile.html?id=${encodeURIComponent(doc.id)}`;

      return `
        <div class="doctor-card-rich doctor-card-matched">
          ${idx === 0 ? `<div class="doctor-match-ribbon"><i data-lucide="sparkles"></i> Best Match</div>` : ''}
          <div class="doctor-card-body">
            <div class="doctor-card-top">
              <div class="doctor-avatar-box">
                <img src="${doc.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80'}" alt="${doc.name}" loading="lazy" />
                <div class="doctor-verified-check" title="Board-Certified Specialist">
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
                  <strong>${doc.rating || 4.9}</strong>
                  <span class="text-muted">(${doc.reviewCount || doc.reviews || 80} reviews)</span>
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
            <div class="doctor-price-highlight">
              <span class="price-label">Consultation Fee</span>
              <span class="price-value">$${fee}</span>
            </div>
            <div class="doctor-actions-row">
              <a href="${profileUrl}" class="btn btn-outline btn-sm">
                <span>Profile</span>
              </a>
              <a href="${bookUrl}" class="btn btn-coral btn-sm">
                <i data-lucide="calendar-plus"></i>
                <span>Book Visit</span>
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 5. Reveal section and smooth scroll
  resultsSection.style.display = 'block';
  if (window.lucide) {
    window.lucide.createIcons();
  }

  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
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

  setTimeout(() => {
    let doctors = [];
    if (window.AdminService) {
      doctors = window.AdminService.getDoctors();
    }
    if (!doctors || doctors.length === 0) {
      doctors = (window.MEDIBOOK_DATA && window.MEDIBOOK_DATA.doctors) ? window.MEDIBOOK_DATA.doctors : [];
    }

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
