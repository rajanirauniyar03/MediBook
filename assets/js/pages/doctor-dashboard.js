/**
 * Veyora Doctor Practice Dashboard Controller
 * Implements dashboard metrics, today's schedule timeline, weekly stats,
 * appointment management (confirm, reject, complete), availability & schedule builder,
 * slot generation, conflict detection, patient records, and profile editing with admin approval.
 */

document.addEventListener('DOMContentLoaded', async () => {
  await initDoctorDashboard();
});

let currentDoctor = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedCalendarDate = null;
let currentTab = 'overview';
let activeAppointmentsList = [];
let activePatientsList = [];

async function initDoctorDashboard() {
  // 1. Authenticate Doctor Role
  if (!window.AuthService) {
    console.error("AuthService not loaded.");
    return;
  }

  let user = window.AuthService.getCurrentUser();

  // If not logged in, redirect to login
  if (!user) {
    window.location.href = '../../auth/login.html?role=doctor';
    return;
  }

  // If wrong role
  if (user.role !== 'doctor') {
    alert(`Access Restricted: You are signed in as a ${user.role.toUpperCase()}. Switching to Doctor Portal requires a doctor account.`);
    window.location.href = window.AuthService.getPortalUrl(user.role);
    return;
  }

  // If pending approval
  if (user.status === 'pending_approval') {
    alert("This doctor account is currently pending Hospital Administrator approval.");
    await window.AuthService.logout();
    window.location.href = '../../auth/login.html?role=doctor';
    return;
  }

  // Determine Doctor ID (doc_001 default for Dr. Alexander Wright)
  const doctorId = user.doctorId || user.id || "doc_001";
  currentDoctor = await window.DoctorService.getDoctorProfile(doctorId);

  // Sync display with user data if needed
  if (user.displayName && !currentDoctor.name) {
    currentDoctor.name = user.displayName;
  }

  // Render Doctor identity in sidebar and header
  renderDoctorIdentity();

  // Wire up sidebar navigation tabs
  setupNavigation();

  // Wire up doctor switcher for multi-doctor evaluation
  setupDoctorSwitcher();

  // Wire up logout button
  document.getElementById('doctor-logout-btn')?.addEventListener('click', async () => {
    await window.AuthService.logout();
    window.location.href = '../../index.html';
  });

  // Mobile menu drawer toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.querySelector('.dashboard-sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('mobile-open') &&
          !sidebar.contains(e.target) &&
          !mobileToggle.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
      }
    });
  }

  // Load and render initial dashboard state
  await refreshDashboardData();

  // Setup schedule tab event listeners
  setupScheduleBuilder();

  // Setup appointments tab event listeners
  setupAppointmentsTab();

  // Setup calendar navigation
  setupCalendarControls();

  // Setup profile tab event listeners
  setupProfileTab();

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Render Doctor identity elements in sidebar and header
 */
function renderDoctorIdentity() {
  const nameEl = document.getElementById('sidebar-doc-name');
  const deptEl = document.getElementById('sidebar-doc-dept');
  const avatarEl = document.getElementById('sidebar-doc-avatar');
  const headerNameEl = document.getElementById('header-doc-name');
  const headerSpecialtyEl = document.getElementById('header-doc-specialty');
  const headerDateEl = document.getElementById('header-live-date');

  if (nameEl) nameEl.textContent = currentDoctor.name || "Dr. Alexander Wright";
  if (deptEl) deptEl.textContent = `${currentDoctor.specialization || currentDoctor.department} • On Duty`;
  if (avatarEl && currentDoctor.avatar) avatarEl.src = currentDoctor.avatar;

  if (headerNameEl) headerNameEl.textContent = currentDoctor.name || "Doctor";
  if (headerSpecialtyEl) headerSpecialtyEl.textContent = currentDoctor.specialization || "Cardiology";

  if (headerDateEl) {
    const today = new Date();
    headerDateEl.textContent = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

/**
 * Doctor Switcher Setup (Enables testing multi-doctor isolation seamlessly)
 */
function setupDoctorSwitcher() {
  const select = document.getElementById('doctor-switcher-select');
  if (!select) return;

  const doctors = (window.MEDIBOOK_DATA && window.MEDIBOOK_DATA.doctors) ? window.MEDIBOOK_DATA.doctors : [];

  select.innerHTML = doctors.map(d => `
    <option value="${d.id}" ${d.id === currentDoctor.id ? 'selected' : ''}>
      ${d.name} (${d.department})
    </option>
  `).join('');

  select.addEventListener('change', async (e) => {
    const newDocId = e.target.value;
    const docObj = doctors.find(d => d.id === newDocId);
    if (docObj) {
      currentDoctor = await window.DoctorService.getDoctorProfile(newDocId);
      // Update session doctorId
      const user = window.AuthService.getCurrentUser();
      if (user) {
        user.doctorId = newDocId;
        user.displayName = docObj.name;
        user.role = 'doctor';
        window.AuthService.saveSession(user);
      }
      renderDoctorIdentity();
      await refreshDashboardData();
      if (window.Toast) {
        window.Toast.info(`Switched practice context to ${docObj.name}`, 'Doctor Switched');
      }
    }
  });
}

/**
 * Setup navigation tab switching
 */
function setupNavigation() {
  const navItems = document.querySelectorAll('.dash-nav-item[data-tab]');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = item.getAttribute('data-tab');
      switchTab(targetTab);

      // Close mobile drawer if open
      document.querySelector('.dashboard-sidebar')?.classList.remove('mobile-open');
    });
  });
}

function switchTab(tabId) {
  currentTab = tabId;

  // Update nav item active classes
  document.querySelectorAll('.dash-nav-item[data-tab]').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update tab panel active classes
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  const activePanel = document.getElementById(`tab-${tabId}`);
  if (activePanel) {
    activePanel.classList.add('active');
  }

  // Tab specific refreshes
  if (tabId === 'appointments') {
    renderAppointmentsTab();
  } else if (tabId === 'schedule') {
    loadScheduleDataIntoUI();
  } else if (tabId === 'patients') {
    renderPatientsTab();
  } else if (tabId === 'profile') {
    loadProfileDataIntoUI();
  }

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Fetch and render all data for the active doctor
 */
async function refreshDashboardData() {
  if (!currentDoctor) return;
  const docId = currentDoctor.id;

  // 1. Fetch metrics & appointments from Firestore/Storage
  const metrics = await window.AppointmentService.getDoctorMetrics(docId);
  activeAppointmentsList = await window.AppointmentService.getDoctorAppointments(docId);
  activePatientsList = await window.AppointmentService.getDoctorPatients(docId);

  // 2. Render KPI cards
  const totalEl = document.getElementById('kpi-total-val');
  const todayEl = document.getElementById('kpi-today-val');
  const upcomingEl = document.getElementById('kpi-upcoming-val');
  const completedEl = document.getElementById('kpi-completed-val');
  const cancelledEl = document.getElementById('kpi-cancelled-val');

  if (totalEl) totalEl.textContent = metrics.total;
  if (todayEl) todayEl.textContent = metrics.today;
  if (upcomingEl) upcomingEl.textContent = metrics.upcoming;
  if (completedEl) completedEl.textContent = metrics.completed;
  if (cancelledEl) cancelledEl.textContent = metrics.cancelled;

  // Update badge in sidebar for upcoming
  const navBadge = document.getElementById('sidebar-upcoming-badge');
  if (navBadge) {
    navBadge.textContent = metrics.today > 0 ? `${metrics.today} Today` : `${metrics.upcoming} Upcoming`;
  }

  // 3. Render Today's Schedule timeline
  renderTodaySchedule(metrics.todaySchedule);

  // 4. Render Weekly Statistics Chart
  renderWeeklyStatsChart(metrics.weeklyStats);

  // 5. Render Upcoming Appointments list in overview
  renderUpcomingOverview(metrics.upcomingAppointments);

  // 6. Render Recent Activity feed
  renderActivityFeed(metrics.recentActivity);

  // 7. Check for schedule conflicts
  checkAndRenderConflicts();

  // 8. Render calendar
  renderCalendar();

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Render Today's Schedule timeline
 */
function renderTodaySchedule(scheduleItems) {
  const container = document.getElementById('today-schedule-container');
  if (!container) return;

  if (!scheduleItems || scheduleItems.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--slate-400);">
        <i data-lucide="calendar-check" style="width: 42px; height: 42px; margin: 0 auto 0.75rem; color: var(--slate-300); display: block;"></i>
        <h4 style="font-size: 1rem; color: var(--slate-600); margin: 0 0 0.25rem;">No Consultations Scheduled Today</h4>
        <p style="font-size: 0.85rem; margin: 0;">You have no patient visits booked for today. Use the time for clinical prep or review upcoming records.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = scheduleItems.map(item => `
    <div class="timeline-slot-item">
      <div class="timeline-time-box">
        ${item.timeSlot}
      </div>

      <div class="timeline-patient-info">
        <div class="timeline-patient-name">
          <span>${item.patientName}</span>
          ${window.Formatters ? window.Formatters.formatStatusBadge(item.status) : `<span class="badge">${item.status}</span>`}
          <span class="badge ${item.mode === 'video' ? 'badge-teal' : 'badge-neutral'} text-xs">
            <i data-lucide="${item.mode === 'video' ? 'video' : 'map-pin'}"></i> ${item.mode === 'video' ? 'Telehealth' : 'In-Person'}
          </span>
        </div>
        <div class="timeline-reason">
          <strong>Reason:</strong> ${item.reason || 'General Clinical Consultation'} • <strong>Phone:</strong> ${item.patientPhone || 'N/A'}
        </div>
      </div>

      <div class="timeline-actions">
        ${item.status === 'Pending' ? `
          <button class="btn btn-success btn-sm quick-confirm-btn" data-apt-id="${item.id}" title="Confirm Appointment">
            <i data-lucide="check"></i> Confirm
          </button>
          <button class="btn btn-danger btn-sm quick-reject-btn" data-apt-id="${item.id}" title="Reject Appointment">
            <i data-lucide="x"></i> Reject
          </button>
        ` : ''}

        ${item.status === 'Confirmed' ? `
          <button class="btn btn-primary btn-sm quick-complete-btn" data-apt-id="${item.id}" title="Mark as Completed">
            <i data-lucide="check-circle-2"></i> Complete
          </button>
        ` : ''}

        <button class="btn btn-outline btn-sm view-detail-btn" data-apt-id="${item.id}" title="View Details">
          <i data-lucide="eye"></i> Details
        </button>
      </div>
    </div>
  `).join('');

  attachAppointmentActionHandlers(container);
}

/**
 * Render Weekly Statistics Bar Chart
 */
function renderWeeklyStatsChart(weeklyStats) {
  const container = document.getElementById('weekly-stats-chart');
  if (!container) return;

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const counts = days.map(d => weeklyStats[d] || 0);
  const maxCount = Math.max(...counts, 1);

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  container.innerHTML = days.map((day, idx) => {
    const count = counts[idx];
    const percentage = Math.max(Math.round((count / maxCount) * 100), 8);
    const isToday = (day === todayName);

    return `
      <div class="bar-chart-col">
        <div class="bar-track" title="${day}: ${count} appointments">
          <span class="bar-count-badge">${count}</span>
          <div class="bar-fill ${isToday ? 'active-day' : ''}" style="height: ${percentage}%;"></div>
        </div>
        <span class="bar-label" style="${isToday ? 'color: var(--primary-700); font-weight: 800;' : ''}">${day.slice(0, 3)}</span>
      </div>
    `;
  }).join('');
}

/**
 * Render Upcoming overview cards
 */
function renderUpcomingOverview(upcomingList) {
  const container = document.getElementById('upcoming-overview-container');
  if (!container) return;

  if (!upcomingList || upcomingList.length === 0) {
    container.innerHTML = `<p class="text-muted" style="font-size: 0.85rem; margin: 0;">No upcoming consultations booked in the next 7 days.</p>`;
    return;
  }

  container.innerHTML = upcomingList.map(item => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; border: 1px solid var(--slate-200); border-radius: var(--radius-md); margin-bottom: 0.65rem; background: #ffffff;">
      <div>
        <div style="font-weight: 700; font-size: 0.9rem; color: var(--slate-900);">${item.patientName}</div>
        <div style="font-size: 0.78rem; color: var(--slate-500); margin-top: 0.15rem;">
          <i data-lucide="calendar" style="width: 13px; height: 13px; display: inline; vertical-align: middle;"></i> ${item.date} at ${item.timeSlot} • ${item.reason}
        </div>
      </div>
      <div>
        <button class="btn btn-outline btn-sm view-detail-btn" data-apt-id="${item.id}">
          <i data-lucide="eye"></i>
        </button>
      </div>
    </div>
  `).join('');

  attachAppointmentActionHandlers(container);
}

/**
 * Render Activity Feed
 */
function renderActivityFeed(activities) {
  const container = document.getElementById('activity-feed-container');
  if (!container) return;

  if (!activities || activities.length === 0) {
    container.innerHTML = `<p class="text-muted" style="font-size: 0.85rem; margin: 0;">No recent activity logs recorded.</p>`;
    return;
  }

  container.innerHTML = activities.map(act => {
    let icon = "activity";
    if (act.action.includes("Confirm")) icon = "calendar-check";
    else if (act.action.includes("Reject")) icon = "x-circle";
    else if (act.action.includes("Complete")) icon = "check-circle-2";
    else if (act.action.includes("Schedule")) icon = "clock";
    else if (act.action.includes("Credential") || act.action.includes("Profile")) icon = "shield-check";

    const timeAgo = formatTimeAgo(act.timestamp);

    return `
      <div class="activity-item">
        <div class="activity-icon-node">
          <i data-lucide="${icon}"></i>
        </div>
        <div class="activity-info">
          <div class="activity-title">${act.action}</div>
          <div class="activity-detail">${act.details}</div>
          <div class="activity-timestamp">${timeAgo}</div>
        </div>
      </div>
    `;
  }).join('');
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * Check and render conflicts alert banner
 */
function checkAndRenderConflicts() {
  const banner = document.getElementById('conflict-alert-banner');
  const countEl = document.getElementById('conflict-count');
  const pill = document.getElementById('topbar-conflict-pill');
  const pillCount = document.getElementById('topbar-conflict-count');

  if (!window.DoctorService || !currentDoctor) return;
  const conflicts = window.DoctorService.getDoctorConflicts(currentDoctor.id);

  if (conflicts && conflicts.length > 0) {
    if (banner) banner.style.display = 'flex';
    if (countEl) countEl.textContent = conflicts.length;
    if (pill) pill.style.display = 'inline-flex';
    if (pillCount) pillCount.textContent = conflicts.length;

    // Attach click to open conflict modal
    document.querySelectorAll('.open-conflicts-btn').forEach(btn => {
      btn.onclick = () => openConflictsModal(conflicts);
    });
  } else {
    if (banner) banner.style.display = 'none';
    if (pill) pill.style.display = 'none';
  }
}

// =========================================================================
// APPOINTMENTS TAB MANAGEMENT
// =========================================================================

let appointmentFilter = 'all';
let appointmentSearchQuery = '';

function setupAppointmentsTab() {
  // Filter chips
  const filterBtns = document.querySelectorAll('.apt-filter-chip');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appointmentFilter = btn.getAttribute('data-filter');
      renderAppointmentsTab();
    });
  });

  // Search input
  const searchInput = document.getElementById('apt-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appointmentSearchQuery = e.target.value.toLowerCase().trim();
      renderAppointmentsTab();
    });
  }

  // Date filter
  const dateInput = document.getElementById('apt-date-filter');
  if (dateInput) {
    dateInput.addEventListener('change', (e) => {
      selectedCalendarDate = e.target.value;
      renderAppointmentsTab();
    });
  }

  // Clear date filter
  document.getElementById('clear-date-filter-btn')?.addEventListener('click', () => {
    if (dateInput) dateInput.value = '';
    selectedCalendarDate = null;
    renderAppointmentsTab();
  });
}

async function renderAppointmentsTab() {
  const container = document.getElementById('appointments-table-body');
  if (!container) return;

  let appointments = await window.AppointmentService.getDoctorAppointments(currentDoctor.id);
  const todayStr = new Date().toISOString().split('T')[0];

  // Apply Category Filter
  if (appointmentFilter === 'today') {
    appointments = appointments.filter(a => a.date === todayStr);
  } else if (appointmentFilter === 'upcoming') {
    appointments = appointments.filter(a => a.date >= todayStr && (a.status === 'Confirmed' || a.status === 'Pending'));
  } else if (appointmentFilter === 'pending') {
    appointments = appointments.filter(a => a.status === 'Pending');
  } else if (appointmentFilter === 'completed') {
    appointments = appointments.filter(a => a.status === 'Completed');
  } else if (appointmentFilter === 'cancelled') {
    appointments = appointments.filter(a => a.status === 'Cancelled' || a.status === 'Rejected');
  }

  // Apply Specific Date Filter if selected from calendar or picker
  if (selectedCalendarDate) {
    appointments = appointments.filter(a => a.date === selectedCalendarDate);
  }

  // Apply Search Query
  if (appointmentSearchQuery) {
    appointments = appointments.filter(a =>
      (a.patientName && a.patientName.toLowerCase().includes(appointmentSearchQuery)) ||
      (a.patientPhone && a.patientPhone.toLowerCase().includes(appointmentSearchQuery)) ||
      (a.reference && a.reference.toLowerCase().includes(appointmentSearchQuery)) ||
      (a.reason && a.reason.toLowerCase().includes(appointmentSearchQuery))
    );
  }

  const countBadge = document.getElementById('filtered-apt-count');
  if (countBadge) countBadge.textContent = `${appointments.length} record${appointments.length !== 1 ? 's' : ''}`;

  if (appointments.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: var(--slate-400);">
          <i data-lucide="inbox" style="width: 42px; height: 42px; margin: 0 auto 0.75rem; color: var(--slate-300); display: block;"></i>
          <h4 style="font-size: 1rem; color: var(--slate-700); margin: 0 0 0.25rem;">No Appointments Found</h4>
          <p style="font-size: 0.85rem; margin: 0;">No appointment records match the selected filter or search terms.</p>
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = appointments.map(a => `
    <tr>
      <td>
        <span style="font-family: var(--font-mono); font-size: 0.825rem; font-weight: 700; color: var(--slate-800);">${a.reference || a.id}</span>
      </td>
      <td>
        <div class="patient-cell">
          <div class="patient-initial-badge">
            ${(a.patientName || 'P').charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="patient-name-bold">${a.patientName}</div>
            <div class="patient-phone-sub">${a.patientPhone || 'No phone recorded'}</div>
          </div>
        </div>
      </td>
      <td>
        <div style="font-weight: 700; color: var(--slate-900);">${a.date}</div>
        <div style="font-size: 0.78rem; color: var(--primary-600); font-weight: 600;">${a.timeSlot}</div>
      </td>
      <td>
        <span class="badge ${a.mode === 'video' ? 'badge-teal' : 'badge-neutral'} text-xs">
          <i data-lucide="${a.mode === 'video' ? 'video' : 'map-pin'}"></i> ${a.mode === 'video' ? 'Telehealth' : 'In-Person'}
        </span>
      </td>
      <td style="max-width: 220px;">
        <span style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${a.reason}">
          ${a.reason || 'General Consultation'}
        </span>
      </td>
      <td>
        ${window.Formatters ? window.Formatters.formatStatusBadge(a.status) : `<span class="badge">${a.status}</span>`}
      </td>
      <td>
        <div style="display: flex; gap: 0.4rem; align-items: center;">
          <button class="btn btn-outline btn-sm view-detail-btn" data-apt-id="${a.id}" title="View Details">
            <i data-lucide="eye"></i> Details
          </button>

          ${a.status === 'Pending' ? `
            <button class="btn btn-success btn-sm quick-confirm-btn" data-apt-id="${a.id}" title="Confirm Appointment">
              <i data-lucide="check"></i> Confirm
            </button>
            <button class="btn btn-danger btn-sm quick-reject-btn" data-apt-id="${a.id}" title="Reject with Reason">
              <i data-lucide="x"></i> Reject
            </button>
          ` : ''}

          ${a.status === 'Confirmed' ? `
            <button class="btn btn-primary btn-sm quick-complete-btn" data-apt-id="${a.id}" title="Mark as Completed">
              <i data-lucide="check-circle-2"></i> Complete
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  attachAppointmentActionHandlers(container);
  if (window.lucide) window.lucide.createIcons();
}

/**
 * Attach action handlers for Confirm, Reject, Complete, and Details
 */
function attachAppointmentActionHandlers(parentEl) {
  if (!parentEl) return;

  // View Details
  parentEl.querySelectorAll('.view-detail-btn').forEach(btn => {
    btn.onclick = async () => {
      const aptId = btn.getAttribute('data-apt-id');
      const apt = await window.AppointmentService.getAppointmentById(aptId, currentDoctor.id);
      if (apt) openAppointmentDetailModal(apt);
    };
  });

  // Quick Confirm
  parentEl.querySelectorAll('.quick-confirm-btn').forEach(btn => {
    btn.onclick = async () => {
      const aptId = btn.getAttribute('data-apt-id');
      if (confirm('Confirm this appointment and send confirmation notification to the patient?')) {
        const res = await window.AppointmentService.confirmAppointment(aptId);
        if (res.success) {
          if (window.Toast) window.Toast.success('Appointment confirmed successfully.', 'Confirmed');
          await refreshDashboardData();
          if (currentTab === 'appointments') renderAppointmentsTab();
        } else {
          alert(res.error);
        }
      }
    };
  });

  // Quick Reject
  parentEl.querySelectorAll('.quick-reject-btn').forEach(btn => {
    btn.onclick = async () => {
      const aptId = btn.getAttribute('data-apt-id');
      const apt = await window.AppointmentService.getAppointmentById(aptId, currentDoctor.id);
      if (apt) openRejectModal(apt);
    };
  });

  // Quick Complete
  parentEl.querySelectorAll('.quick-complete-btn').forEach(btn => {
    btn.onclick = async () => {
      const aptId = btn.getAttribute('data-apt-id');
      const apt = await window.AppointmentService.getAppointmentById(aptId, currentDoctor.id);
      if (apt) openCompleteModal(apt);
    };
  });
}

// =========================================================================
// INTERACTIVE APPOINTMENT CALENDAR
// =========================================================================

function setupCalendarControls() {
  document.getElementById('cal-prev-btn')?.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });

  document.getElementById('cal-next-btn')?.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });

  document.getElementById('cal-today-btn')?.addEventListener('click', () => {
    const now = new Date();
    currentMonth = now.getMonth();
    currentYear = now.getFullYear();
    renderCalendar();
  });
}

function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const titleEl = document.getElementById('calendar-month-title');
  if (!grid || !titleEl) return;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  titleEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const today = new Date();
  const todayDateStr = today.toISOString().split('T')[0];

  // Map appointments to date strings for quick lookup
  const aptsByDate = {};
  activeAppointmentsList.forEach(a => {
    if (!aptsByDate[a.date]) aptsByDate[a.date] = [];
    aptsByDate[a.date].push(a);
  });

  let html = '';

  // Previous month padding days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    html += `<div class="calendar-cell other-month"><span class="calendar-cell-date">${d}</span></div>`;
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const monthFormatted = (currentMonth + 1 < 10) ? '0' + (currentMonth + 1) : (currentMonth + 1);
    const dayFormatted = (d < 10) ? '0' + d : d;
    const dateStr = `${currentYear}-${monthFormatted}-${dayFormatted}`;

    const isToday = (dateStr === todayDateStr);
    const dayApts = aptsByDate[dateStr] || [];
    const hasApts = dayApts.length > 0;
    const isSelected = (selectedCalendarDate === dateStr);

    html += `
      <div class="calendar-cell ${isToday ? 'today' : ''} ${hasApts ? 'has-appointments' : ''} ${isSelected ? 'selected-date' : ''}" data-date="${dateStr}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="calendar-cell-date">${d}</span>
          ${hasApts ? `<span class="badge badge-primary text-xs" style="padding: 1px 6px;">${dayApts.length}</span>` : ''}
        </div>
        ${hasApts ? `
          <div class="calendar-appointment-chips">
            ${dayApts.slice(0, 2).map(a => `
              <div class="cal-apt-chip" title="${a.timeSlot} - ${a.patientName} (${a.status})">
                ${a.timeSlot}: ${a.patientName}
              </div>
            `).join('')}
            ${dayApts.length > 2 ? `<div style="font-size: 0.65rem; color: var(--primary-600); font-weight: 700;">+${dayApts.length - 2} more</div>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  grid.innerHTML = html;

  // Click on date cell to filter appointments
  grid.querySelectorAll('.calendar-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      const clickedDate = cell.getAttribute('data-date');
      selectedCalendarDate = clickedDate;

      // Switch to appointments tab filtered by this date
      switchTab('appointments');
      const dateFilterInput = document.getElementById('apt-date-filter');
      if (dateFilterInput) dateFilterInput.value = clickedDate;
      renderAppointmentsTab();

      if (window.Toast) {
        window.Toast.info(`Showing consultations for ${clickedDate}`, 'Date Filter Applied');
      }
    });
  });
}

// =========================================================================
// AVAILABILITY & SCHEDULE BUILDER UI
// =========================================================================

let activeScheduleState = null;

function setupScheduleBuilder() {
  // Weekday toggle buttons
  const weekdayCards = document.querySelectorAll('.weekday-toggle-card');
  weekdayCards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('active');
      const statusSpan = card.querySelector('.day-status');
      const isActive = card.classList.contains('active');
      if (statusSpan) statusSpan.textContent = isActive ? 'Available' : 'Unavailable';
      updateLiveSlotPreview();
    });
  });

  // Time & Duration Inputs change listeners
  ['sched-start-time', 'sched-end-time', 'sched-slot-duration'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      updateLiveSlotPreview();
    });
  });

  // Add Break Time Button
  document.getElementById('add-break-btn')?.addEventListener('click', () => {
    const name = prompt("Enter Break Description (e.g., Lunch Break, Rounds):", "Lunch Break");
    if (!name) return;
    const start = prompt("Enter Start Time (HH:MM 24hr format, e.g. 13:00):", "13:00");
    if (!start) return;
    const end = prompt("Enter End Time (HH:MM 24hr format, e.g. 14:00):", "14:00");
    if (!end) return;

    if (!activeScheduleState.breaks) activeScheduleState.breaks = [];
    activeScheduleState.breaks.push({
      id: "brk_" + Date.now(),
      name,
      start,
      end
    });

    renderBreaksList();
    updateLiveSlotPreview();
  });

  // Add Unavailable Date Button
  document.getElementById('add-unavail-date-btn')?.addEventListener('click', async () => {
    const dateInput = document.getElementById('unavail-date-input');
    if (!dateInput || !dateInput.value) {
      alert("Please select a date to mark as unavailable.");
      return;
    }
    const val = dateInput.value;
    if (!activeScheduleState.unavailableDates) activeScheduleState.unavailableDates = [];
    if (!activeScheduleState.unavailableDates.includes(val)) {
      activeScheduleState.unavailableDates.push(val);
      activeScheduleState.unavailableDates.sort();
      renderUnavailableDatesList();
      dateInput.value = '';
    }
  });

  // Add Leave Request Form Submit
  const leaveForm = document.getElementById('add-leave-form');
  if (leaveForm) {
    leaveForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const start = document.getElementById('leave-start-date').value;
      const end = document.getElementById('leave-end-date').value;
      const reason = document.getElementById('leave-reason').value.trim();
      const type = document.getElementById('leave-type').value;

      if (!start || !end || !reason) {
        alert("Please complete start date, end date, and leave reason.");
        return;
      }

      if (end < start) {
        alert("Leave end date cannot precede start date.");
        return;
      }

      if (!activeScheduleState.leaves) activeScheduleState.leaves = [];
      activeScheduleState.leaves.push({
        id: "lv_" + Date.now(),
        startDate: start,
        endDate: end,
        reason,
        type,
        status: "Approved",
        requestedAt: new Date().toISOString()
      });

      renderLeavesList();
      leaveForm.reset();
      if (window.Toast) window.Toast.success("Scheduled leave period recorded.", "Leave Added");
    });
  }

  // Save Schedule Button
  document.getElementById('save-schedule-btn')?.addEventListener('click', async () => {
    await saveDoctorScheduleChanges();
  });
}

async function loadScheduleDataIntoUI() {
  if (!currentDoctor) return;
  const schedule = await window.DoctorService.getDoctorSchedule(currentDoctor.id);
  activeScheduleState = JSON.parse(JSON.stringify(schedule)); // Deep copy

  // Available days
  const activeDays = new Set(schedule.availableDays || []);
  document.querySelectorAll('.weekday-toggle-card').forEach(card => {
    const day = card.getAttribute('data-day');
    const isActive = activeDays.has(day);
    if (isActive) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
    const statusSpan = card.querySelector('.day-status');
    if (statusSpan) statusSpan.textContent = isActive ? 'Available' : 'Unavailable';
  });

  // Times & Duration
  const startEl = document.getElementById('sched-start-time');
  const endEl = document.getElementById('sched-end-time');
  const durEl = document.getElementById('sched-slot-duration');

  if (startEl) startEl.value = schedule.startTime || "09:00";
  if (endEl) endEl.value = schedule.endTime || "17:00";
  if (durEl) durEl.value = schedule.slotDuration || 30;

  renderBreaksList();
  renderUnavailableDatesList();
  renderLeavesList();
  updateLiveSlotPreview();
}

function renderBreaksList() {
  const container = document.getElementById('break-times-list');
  if (!container || !activeScheduleState) return;

  const breaks = activeScheduleState.breaks || [];
  if (breaks.length === 0) {
    container.innerHTML = `<p class="text-muted" style="font-size: 0.85rem; margin: 0;">No midday breaks configured. Consultations will run continuously.</p>`;
    return;
  }

  container.innerHTML = breaks.map((b, idx) => `
    <div class="break-item-card">
      <div>
        <strong style="color: var(--slate-900); font-size: 0.9rem;">${b.name || 'Break'}</strong>
        <div style="font-size: 0.8rem; color: var(--slate-500); margin-top: 0.15rem;">
          <i data-lucide="clock" style="width: 14px; height: 14px; display: inline; vertical-align: middle;"></i> ${b.start} – ${b.end}
        </div>
      </div>
      <button type="button" class="btn btn-ghost btn-sm remove-break-btn" data-idx="${idx}" style="color: var(--danger-500);">
        <i data-lucide="trash-2"></i> Remove
      </button>
    </div>
  `).join('');

  container.querySelectorAll('.remove-break-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      activeScheduleState.breaks.splice(idx, 1);
      renderBreaksList();
      updateLiveSlotPreview();
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

function renderUnavailableDatesList() {
  const container = document.getElementById('unavail-dates-chips');
  if (!container || !activeScheduleState) return;

  const dates = activeScheduleState.unavailableDates || [];
  if (dates.length === 0) {
    container.innerHTML = `<p class="text-muted" style="font-size: 0.825rem; margin: 0;">No specific blocked dates added.</p>`;
    return;
  }

  container.innerHTML = dates.map(d => `
    <span class="badge badge-neutral" style="padding: 0.4rem 0.65rem; font-size: 0.825rem;">
      <i data-lucide="calendar-x"></i> ${d}
      <button type="button" class="remove-date-btn" data-date="${d}" style="background: none; border: none; cursor: pointer; color: var(--danger-500); margin-left: 4px; padding: 0;">&times;</button>
    </span>
  `).join('');

  container.querySelectorAll('.remove-date-btn').forEach(btn => {
    btn.onclick = () => {
      const d = btn.getAttribute('data-date');
      activeScheduleState.unavailableDates = activeScheduleState.unavailableDates.filter(x => x !== d);
      renderUnavailableDatesList();
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

function renderLeavesList() {
  const container = document.getElementById('leaves-table-body');
  if (!container || !activeScheduleState) return;

  const leaves = activeScheduleState.leaves || [];
  if (leaves.length === 0) {
    container.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--slate-400); padding: 1.5rem;">No scheduled leaves recorded.</td></tr>`;
    return;
  }

  container.innerHTML = leaves.map(l => `
    <tr>
      <td><strong>${l.startDate}</strong> to <strong>${l.endDate}</strong></td>
      <td>${l.type || 'Annual Leave'}</td>
      <td>${l.reason}</td>
      <td><span class="badge badge-success">${l.status}</span></td>
      <td>
        <button type="button" class="btn btn-ghost btn-sm remove-leave-btn" data-id="${l.id}" style="color: var(--danger-500);">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    </tr>
  `).join('');

  container.querySelectorAll('.remove-leave-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      activeScheduleState.leaves = activeScheduleState.leaves.filter(x => x.id !== id);
      renderLeavesList();
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

function updateLiveSlotPreview() {
  const startEl = document.getElementById('sched-start-time');
  const endEl = document.getElementById('sched-end-time');
  const durEl = document.getElementById('sched-slot-duration');
  const container = document.getElementById('generated-slots-cloud');
  const countEl = document.getElementById('generated-slots-count');

  if (!startEl || !endEl || !durEl || !container) return;

  const startTime = startEl.value;
  const endTime = endEl.value;
  const duration = parseInt(durEl.value, 10);
  const breaks = (activeScheduleState && activeScheduleState.breaks) ? activeScheduleState.breaks : [];

  const slots = window.DoctorService.generateSlots(startTime, endTime, duration, breaks);

  if (countEl) countEl.textContent = `${slots.length} consultation slots per working day`;

  if (slots.length === 0) {
    container.innerHTML = `<p class="text-muted" style="font-size: 0.85rem;">No slots generated with the current hours and duration settings.</p>`;
    return;
  }

  container.innerHTML = slots.map(s => `
    <span class="generated-slot-pill">
      <i data-lucide="clock" style="width: 12px; height: 12px; display: inline; vertical-align: middle;"></i> ${s}
    </span>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Save schedule changes with conflict detection
 */
async function saveDoctorScheduleChanges() {
  const startEl = document.getElementById('sched-start-time');
  const endEl = document.getElementById('sched-end-time');
  const durEl = document.getElementById('sched-slot-duration');

  const selectedDays = [];
  document.querySelectorAll('.weekday-toggle-card.active').forEach(c => {
    selectedDays.push(c.getAttribute('data-day'));
  });

  if (selectedDays.length === 0) {
    alert("Please select at least one available working weekday.");
    return;
  }

  const scheduleData = {
    ...activeScheduleState,
    availableDays: selectedDays,
    startTime: startEl.value,
    endTime: endEl.value,
    slotDuration: parseInt(durEl.value, 10)
  };

  const saveBtn = document.getElementById('save-schedule-btn');
  const originalText = saveBtn ? saveBtn.innerHTML : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = 'Saving Schedule & Scanning Conflicts...';
  }

  const result = await window.DoctorService.saveDoctorSchedule(currentDoctor.id, scheduleData);

  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }

  if (result.success) {
    if (result.hasConflicts) {
      if (window.Toast) {
        window.Toast.warning(
          `Schedule saved, but ${result.conflicts.length} appointment conflict(s) were detected. Existing bookings were preserved.`,
          'Conflicts Detected'
        );
      }
      openConflictsModal(result.conflicts);
    } else {
      if (window.Toast) {
        window.Toast.success(
          `Schedule updated successfully! ${result.generatedSlots.length} daily appointment slots active.`,
          'Schedule Saved'
        );
      }
    }

    await refreshDashboardData();
  } else {
    alert(result.error || "Failed to update schedule.");
  }
}

// =========================================================================
// PATIENT DETAILS TAB
// Requirement 5: Patient name, phone number, appointment date,
// consultation reason, appointment history where authorized.
// Do not expose patient information to unrelated doctors.
// =========================================================================

function renderPatientsTab() {
  const container = document.getElementById('patients-table-body');
  const searchInput = document.getElementById('patients-search-input');
  const countEl = document.getElementById('patients-total-count');

  if (!container) return;

  let patients = [...activePatientsList];

  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
  if (q) {
    patients = patients.filter(p =>
      (p.patientName && p.patientName.toLowerCase().includes(q)) ||
      (p.patientPhone && p.patientPhone.toLowerCase().includes(q)) ||
      (p.patientEmail && p.patientEmail.toLowerCase().includes(q)) ||
      (p.latestReason && p.latestReason.toLowerCase().includes(q))
    );
  }

  if (countEl) countEl.textContent = `${patients.length} assigned patient${patients.length !== 1 ? 's' : ''}`;

  if (patients.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem 1rem; color: var(--slate-400);">
          <i data-lucide="users" style="width: 42px; height: 42px; margin: 0 auto 0.75rem; color: var(--slate-300); display: block;"></i>
          <h4 style="font-size: 1rem; color: var(--slate-700); margin: 0 0 0.25rem;">No Patients Found</h4>
          <p style="font-size: 0.85rem; margin: 0;">No patients assigned to your clinical roster match the search criteria.</p>
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = patients.map((p, idx) => `
    <tr>
      <td>
        <div class="patient-cell">
          <div class="patient-initial-badge">
            ${(p.patientName || 'P').charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="patient-name-bold">${p.patientName}</div>
            <div class="patient-phone-sub">${p.patientEmail || ''}</div>
          </div>
        </div>
      </td>
      <td>
        <a href="tel:${p.patientPhone}" style="color: var(--primary-600); font-weight: 600; text-decoration: none;">
          <i data-lucide="phone" style="width: 14px; height: 14px; display: inline; vertical-align: middle;"></i> ${p.patientPhone}
        </a>
      </td>
      <td>
        <strong>${p.lastAppointmentDate || 'N/A'}</strong>
      </td>
      <td>
        <span class="badge badge-primary">${p.totalVisits} visit${p.totalVisits !== 1 ? 's' : ''}</span>
      </td>
      <td style="max-width: 240px;">
        <span style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${p.latestReason || ''}">
          ${p.latestReason || 'Routine consultation'}
        </span>
      </td>
      <td>
        <button class="btn btn-outline btn-sm view-patient-history-btn" data-idx="${idx}">
          <i data-lucide="file-text"></i> Clinical History
        </button>
      </td>
    </tr>
  `).join('');

  container.querySelectorAll('.view-patient-history-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const patient = patients[idx];
      openPatientHistoryModal(patient);
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

// Search input listener for patients tab
document.getElementById('patients-search-input')?.addEventListener('input', () => {
  renderPatientsTab();
});

// =========================================================================
// DOCTOR PROFILE TAB & ADMIN APPROVAL
// Requirement 6: Profile photograph, qualifications, specialization,
// experience, consultation fee, about section.
// Require administrator approval for important profile changes.
// =========================================================================

function setupProfileTab() {
  const form = document.getElementById('doctor-profile-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleProfileUpdate();
    });
  }

  // Live avatar URL preview
  const avatarInput = document.getElementById('doc-profile-avatar-url');
  const avatarPreview = document.getElementById('doc-profile-avatar-preview');
  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener('input', () => {
      if (avatarInput.value.trim()) {
        avatarPreview.src = avatarInput.value.trim();
      }
    });
  }
}

async function loadProfileDataIntoUI() {
  if (!currentDoctor) return;
  const profile = await window.DoctorService.getDoctorProfile(currentDoctor.id);

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  };

  setVal('doc-profile-name', profile.name);
  setVal('doc-profile-qualification', profile.qualification);
  setVal('doc-profile-department', profile.department || profile.specialization);
  setVal('doc-profile-specialization', profile.subspecialty || profile.specialization);
  setVal('doc-profile-license', profile.licenseNumber);
  setVal('doc-profile-experience', profile.experienceYears || 10);
  setVal('doc-profile-fee', profile.consultationFee || profile.fee || 100);
  setVal('doc-profile-hospital', profile.hospital);
  setVal('doc-profile-languages', (profile.languages || ["English"]).join(', '));
  setVal('doc-profile-about', profile.about);
  setVal('doc-profile-avatar-url', profile.avatar);

  const avatarPreview = document.getElementById('doc-profile-avatar-preview');
  if (avatarPreview && profile.avatar) avatarPreview.src = profile.avatar;

  // Render pending approval status banner if active
  const approvalBanner = document.getElementById('profile-pending-approval-banner');
  if (approvalBanner) {
    if (profile.pendingApproval) {
      approvalBanner.style.display = 'block';
      const detailsEl = document.getElementById('pending-approval-details');
      if (detailsEl) {
        const req = profile.pendingApproval;
        const changes = req.requestedChanges || {};
        detailsEl.innerHTML = Object.entries(changes).map(([field, vals]) => `
          <li><strong>${field.toUpperCase()}:</strong> Current: "<em>${vals.previous || 'None'}</em>" &rarr; Requested: "<strong>${vals.requested}</strong>"</li>
        `).join('');
      }
    } else {
      approvalBanner.style.display = 'none';
    }
  }
}

async function handleProfileUpdate() {
  const getVal = (id) => document.getElementById(id)?.value.trim() || '';

  const updates = {
    name: getVal('doc-profile-name'),
    qualification: getVal('doc-profile-qualification'),
    department: getVal('doc-profile-department'),
    specialization: getVal('doc-profile-specialization'),
    licenseNumber: getVal('doc-profile-license'),
    experienceYears: parseInt(getVal('doc-profile-experience'), 10) || 10,
    consultationFee: parseInt(getVal('doc-profile-fee'), 10) || 100,
    hospital: getVal('doc-profile-hospital'),
    languages: getVal('doc-profile-languages').split(',').map(s => s.trim()).filter(Boolean),
    about: getVal('doc-profile-about'),
    avatar: getVal('doc-profile-avatar-url')
  };

  const submitBtn = document.getElementById('save-profile-btn');
  const originalText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting Profile Changes...';
  }

  const result = await window.DoctorService.updateDoctorProfile(currentDoctor.id, updates);

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }

  if (result.success) {
    if (result.hasPendingApproval) {
      if (window.Toast) {
        window.Toast.info(result.message, 'Pending Admin Approval');
      }
      alert(result.message);
    } else {
      if (window.Toast) {
        window.Toast.success(result.message, 'Profile Saved');
      }
    }

    currentDoctor = await window.DoctorService.getDoctorProfile(currentDoctor.id);
    renderDoctorIdentity();
    await loadProfileDataIntoUI();
  } else {
    alert(result.error || "Failed to update profile.");
  }
}

// =========================================================================
// MODAL DIALOGS
// =========================================================================

/**
 * Open Appointment Detail Modal
 * Requirement 5: Patient name, phone number, appointment date, consultation reason, authorized history
 */
function openAppointmentDetailModal(apt) {
  const modal = document.getElementById('appointment-detail-modal');
  if (!modal) return;

  const content = document.getElementById('appointment-modal-content');
  if (content) {
    content.innerHTML = `
      <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <div>
            <span style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; color: var(--slate-500);">REFERENCE: ${apt.reference || apt.id}</span>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--slate-900); margin: 0.25rem 0 0;">${apt.patientName}</h3>
          </div>
          <div>
            ${window.Formatters ? window.Formatters.formatStatusBadge(apt.status) : `<span class="badge">${apt.status}</span>`}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.85rem; font-size: 0.875rem;">
          <div>
            <strong style="color: var(--slate-500); font-size: 0.75rem; text-transform: uppercase;">Phone Number:</strong>
            <div><a href="tel:${apt.patientPhone}" style="color: var(--primary-600); font-weight: 600; text-decoration: none;">${apt.patientPhone || 'Not provided'}</a></div>
          </div>
          <div>
            <strong style="color: var(--slate-500); font-size: 0.75rem; text-transform: uppercase;">Patient Email:</strong>
            <div style="color: var(--slate-800);">${apt.patientEmail || 'Not provided'}</div>
          </div>
          <div>
            <strong style="color: var(--slate-500); font-size: 0.75rem; text-transform: uppercase;">Appointment Date:</strong>
            <div style="color: var(--slate-900); font-weight: 700;">${apt.date} (${apt.timeSlot})</div>
          </div>
          <div>
            <strong style="color: var(--slate-500); font-size: 0.75rem; text-transform: uppercase;">Consultation Mode:</strong>
            <div style="color: var(--slate-800); text-transform: capitalize;">${apt.mode === 'video' ? 'Telehealth Video' : 'In-Person Hospital Clinic'}</div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h5 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--slate-500); margin-bottom: 0.4rem;">Chief Complaint / Reason for Visit</h5>
        <div style="background: #ffffff; border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 0.85rem 1rem; font-size: 0.925rem; color: var(--slate-800);">
          ${apt.reason || 'General medical examination and clinical consultation.'}
        </div>
      </div>

      ${apt.notes ? `
        <div style="margin-bottom: 1.5rem;">
          <h5 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--slate-500); margin-bottom: 0.4rem;">Patient Pre-Intake Notes</h5>
          <div style="background: #ffffff; border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 0.85rem 1rem; font-size: 0.875rem; color: var(--slate-700);">
            ${apt.notes}
          </div>
        </div>
      ` : ''}

      ${apt.rejectionReason ? `
        <div style="background: #fef2f2; border: 1px solid #fecdd3; border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 1.5rem;">
          <strong style="color: var(--danger-700); font-size: 0.85rem; display: block; margin-bottom: 0.2rem;">Rejection / Cancellation Reason:</strong>
          <p style="font-size: 0.85rem; color: var(--slate-700); margin: 0;">${apt.rejectionReason}</p>
        </div>
      ` : ''}

      ${apt.clinicalNotes ? `
        <div style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 1.5rem;">
          <strong style="color: var(--accent-700); font-size: 0.85rem; display: block; margin-bottom: 0.2rem;">Doctor Clinical Observations & Notes:</strong>
          <p style="font-size: 0.875rem; color: var(--slate-800); margin: 0 0 0.5rem;">${apt.clinicalNotes}</p>
          ${apt.prescription ? `
            <strong style="color: var(--accent-700); font-size: 0.85rem; display: block; margin-bottom: 0.2rem;">Prescription / Recommendations:</strong>
            <p style="font-size: 0.875rem; color: var(--slate-800); margin: 0;">${apt.prescription}</p>
          ` : ''}
        </div>
      ` : ''}
    `;
  }

  // Setup modal action buttons
  const actionsContainer = document.getElementById('appointment-modal-actions');
  if (actionsContainer) {
    actionsContainer.innerHTML = `
      ${apt.status === 'Pending' ? `
        <button class="btn btn-success" id="modal-confirm-btn">
          <i data-lucide="check"></i> Confirm Appointment
        </button>
        <button class="btn btn-danger" id="modal-reject-btn">
          <i data-lucide="x"></i> Reject with Reason
        </button>
      ` : ''}

      ${apt.status === 'Confirmed' ? `
        <button class="btn btn-primary" id="modal-complete-btn">
          <i data-lucide="check-circle-2"></i> Mark Consultation Completed
        </button>
        <button class="btn btn-outline" id="modal-reject-btn" style="color: var(--danger-600); border-color: var(--danger-300);">
          <i data-lucide="x-circle"></i> Cancel / Reject
        </button>
      ` : ''}

      <button class="btn btn-outline" onclick="closeModal('appointment-detail-modal')">Close</button>
    `;

    document.getElementById('modal-confirm-btn')?.addEventListener('click', async () => {
      closeModal('appointment-detail-modal');
      const res = await window.AppointmentService.confirmAppointment(apt.id);
      if (res.success) {
        if (window.Toast) window.Toast.success('Appointment confirmed.', 'Confirmed');
        await refreshDashboardData();
        if (currentTab === 'appointments') renderAppointmentsTab();
      }
    });

    document.getElementById('modal-reject-btn')?.addEventListener('click', () => {
      closeModal('appointment-detail-modal');
      openRejectModal(apt);
    });

    document.getElementById('modal-complete-btn')?.addEventListener('click', () => {
      closeModal('appointment-detail-modal');
      openCompleteModal(apt);
    });
  }

  openModal('appointment-detail-modal');
  if (window.lucide) window.lucide.createIcons();
}

/**
 * Open Reject Modal with Reason Input
 * Requirement 3: Reject appointments with a reason.
 */
function openRejectModal(apt) {
  const modal = document.getElementById('reject-appointment-modal');
  if (!modal) return;

  const targetEl = document.getElementById('reject-modal-patient-name');
  if (targetEl) targetEl.textContent = `${apt.patientName} (${apt.date} at ${apt.timeSlot})`;

  const submitBtn = document.getElementById('confirm-reject-btn');
  if (submitBtn) {
    submitBtn.onclick = async () => {
      const select = document.getElementById('reject-reason-select');
      const customNotes = document.getElementById('reject-custom-notes');

      const preset = select ? select.value : '';
      const notes = customNotes ? customNotes.value.trim() : '';

      const fullReason = notes ? `${preset} – ${notes}` : preset;

      if (!fullReason) {
        alert("Please select or enter a rejection reason.");
        return;
      }

      submitBtn.disabled = true;
      const res = await window.AppointmentService.rejectAppointment(apt.id, fullReason);
      submitBtn.disabled = false;

      if (res.success) {
        if (window.Toast) window.Toast.info("Appointment rejected and reason recorded.", "Appointment Rejected");
        closeModal('reject-appointment-modal');
        await refreshDashboardData();
        if (currentTab === 'appointments') renderAppointmentsTab();
      } else {
        alert(res.error);
      }
    };
  }

  openModal('reject-appointment-modal');
}

/**
 * Open Complete Consultation Modal
 * Requirement 3: Mark appointments as completed.
 */
function openCompleteModal(apt) {
  const modal = document.getElementById('complete-appointment-modal');
  if (!modal) return;

  const nameEl = document.getElementById('complete-modal-patient-name');
  if (nameEl) nameEl.textContent = `${apt.patientName} (${apt.reference || apt.id})`;

  const notesEl = document.getElementById('complete-clinical-notes');
  const rxEl = document.getElementById('complete-prescription');
  if (notesEl) notesEl.value = '';
  if (rxEl) rxEl.value = '';

  const submitBtn = document.getElementById('confirm-complete-btn');
  if (submitBtn) {
    submitBtn.onclick = async () => {
      const notes = notesEl ? notesEl.value.trim() : '';
      const rx = rxEl ? rxEl.value.trim() : '';

      submitBtn.disabled = true;
      const res = await window.AppointmentService.completeAppointment(apt.id, notes, rx);
      submitBtn.disabled = false;

      if (res.success) {
        if (window.Toast) window.Toast.success("Consultation marked as Completed.", "Consultation Complete");
        closeModal('complete-appointment-modal');
        await refreshDashboardData();
        if (currentTab === 'appointments') renderAppointmentsTab();
      } else {
        alert(res.error);
      }
    };
  }

  openModal('complete-appointment-modal');
}

/**
 * Open Patient Authorized Clinical History Modal
 * Requirement 5: Patient details and appointment history where authorized.
 * Strict Doctor Scoping: No unrelated patients are ever shown.
 */
function openPatientHistoryModal(patient) {
  const modal = document.getElementById('patient-history-modal');
  if (!modal) return;

  const titleEl = document.getElementById('history-modal-patient-name');
  if (titleEl) titleEl.textContent = `${patient.patientName} – Clinical Consultation History`;

  const metaEl = document.getElementById('history-modal-patient-meta');
  if (metaEl) {
    metaEl.innerHTML = `
      <div><strong>Phone:</strong> ${patient.patientPhone}</div>
      <div><strong>Email:</strong> ${patient.patientEmail}</div>
      <div><strong>Total Consultations with ${currentDoctor.name}:</strong> ${patient.totalVisits}</div>
      <div><strong>Latest Visit:</strong> ${patient.lastAppointmentDate}</div>
    `;
  }

  const listEl = document.getElementById('history-modal-visits-list');
  if (listEl) {
    const history = patient.history || [];
    if (history.length === 0) {
      listEl.innerHTML = `<p class="text-muted" style="padding: 1rem 0;">No prior consultations on record.</p>`;
    } else {
      listEl.innerHTML = history.map(item => `
        <div style="border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.85rem; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <div>
              <strong style="color: var(--slate-900); font-size: 0.95rem;">${item.date} at ${item.timeSlot}</strong>
              <span style="font-size: 0.78rem; color: var(--slate-500); margin-left: 0.5rem;">(Ref: ${item.reference})</span>
            </div>
            <div>
              ${window.Formatters ? window.Formatters.formatStatusBadge(item.status) : `<span class="badge">${item.status}</span>`}
            </div>
          </div>
          <div style="font-size: 0.85rem; color: var(--slate-700); margin-bottom: 0.4rem;">
            <strong>Consultation Reason:</strong> ${item.reason}
          </div>
          ${item.clinicalNotes ? `
            <div style="font-size: 0.825rem; color: var(--slate-800); background: var(--slate-50); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); margin-bottom: 0.35rem;">
              <strong>Clinical Observations:</strong> ${item.clinicalNotes}
            </div>
          ` : ''}
          ${item.prescription ? `
            <div style="font-size: 0.825rem; color: var(--accent-800); background: var(--accent-50); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);">
              <strong>Prescribed Therapy:</strong> ${item.prescription}
            </div>
          ` : ''}
          ${item.rejectionReason ? `
            <div style="font-size: 0.825rem; color: var(--danger-800); background: var(--danger-50); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);">
              <strong>Rejection/Cancellation:</strong> ${item.rejectionReason}
            </div>
          ` : ''}
        </div>
      `).join('');
    }
  }

  openModal('patient-history-modal');
  if (window.lucide) window.lucide.createIcons();
}

/**
 * Open Conflicts Alert Modal
 * Requirement 4: Changing availability must not silently delete existing appointments.
 * Notify the doctor and administrator about conflicts.
 */
function openConflictsModal(conflicts) {
  const modal = document.getElementById('conflicts-detail-modal');
  if (!modal) return;

  const listEl = document.getElementById('conflicts-modal-list');
  if (listEl) {
    listEl.innerHTML = conflicts.map(c => `
      <div style="background: #ffffff; border: 1px solid #fecdd3; border-left: 4px solid var(--danger-500); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.85rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
          <div>
            <strong style="color: var(--slate-900); font-size: 0.95rem;">${c.patientName}</strong>
            <span style="font-size: 0.8rem; color: var(--slate-500); margin-left: 0.5rem;">(Ref: ${c.reference || c.appointmentId})</span>
          </div>
          <span class="badge badge-danger text-xs">${c.type}</span>
        </div>
        <div style="font-size: 0.85rem; color: var(--slate-700); margin-bottom: 0.35rem;">
          <strong>Date & Time:</strong> ${c.date} at ${c.timeSlot} • <strong>Phone:</strong> ${c.patientPhone || 'N/A'}
        </div>
        <div style="font-size: 0.825rem; color: var(--danger-700); background: #fef2f2; padding: 0.45rem 0.65rem; border-radius: var(--radius-sm);">
          <strong>Conflict Detail:</strong> ${c.reason}
        </div>
      </div>
    `).join('');
  }

  openModal('conflicts-detail-modal');
  if (window.lucide) window.lucide.createIcons();
}

// Modal helper functions
window.openModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('show');
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('show');
};
