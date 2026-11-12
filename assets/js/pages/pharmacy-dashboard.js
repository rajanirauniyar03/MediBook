/**
 * MediBook Pharmacy Staff Dashboard Controller
 * Implements medicine catalog CRUD, stock adjustments, prescription review workflows (6 statuses),
 * enquiry handling, inventory audit history, and pharmacy settings management.
 */

document.addEventListener('DOMContentLoaded', async () => {
  await initPharmacyDashboard();
});

let currentPharmacist = null;
let currentTab = 'overview';
let activeMedicines = [];
let activePrescriptions = [];
let activeEnquiries = [];

async function initPharmacyDashboard() {
  if (!window.AuthService) {
    console.error("AuthService not loaded.");
    return;
  }

  // 1. Authenticate Pharmacy Staff
  let user = window.AuthService.getCurrentUser();
  if (!user) {
    window.location.href = '../../auth/login.html?role=pharmacist';
    return;
  }

  if (user.role !== 'pharmacist' && user.role !== 'pharmacy' && user.role !== 'admin') {
    alert(`Access Restricted: You are signed in as a ${user.role.toUpperCase()}. Switching to Pharmacy Portal requires a pharmacy staff or administrator account.`);
    window.location.href = window.AuthService.getPortalUrl(user.role);
    return;
  }

  currentPharmacist = user;
  renderStaffIdentity();

  // 2. Wire Navigation
  setupNavigation();

  // 3. Logout
  document.getElementById('pharmacy-logout-btn')?.addEventListener('click', async () => {
    await window.AuthService.logout();
    window.location.href = '../../index.html';
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.querySelector('.dashboard-sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });

    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('mobile-open') &&
          !sidebar.contains(e.target) &&
          !mobileToggle.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
      }
    });
  }

  // 4. Initial Data Load
  await refreshPharmacyDashboard();

  // 5. Setup Action Listeners
  setupMedicineManagementListeners();
  setupPrescriptionsTabListeners();
  setupEnquiriesTabListeners();
  setupInventoryListeners();
  setupSettingsListeners();

  if (window.lucide) window.lucide.createIcons();
}

function renderStaffIdentity() {
  const nameEl = document.getElementById('sidebar-staff-name');
  const titleEl = document.getElementById('sidebar-staff-title');
  const headerNameEl = document.getElementById('header-staff-name');
  const headerDateEl = document.getElementById('header-live-date');

  if (nameEl) nameEl.textContent = currentPharmacist.displayName || "James Carter, RPh";
  if (titleEl) titleEl.textContent = currentPharmacist.title || "Chief Clinical Pharmacist";
  if (headerNameEl) headerNameEl.textContent = currentPharmacist.displayName || "James Carter, RPh";

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

function setupNavigation() {
  const navItems = document.querySelectorAll('.dash-nav-item[data-tab]');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = item.getAttribute('data-tab');
      switchTab(targetTab);
      document.querySelector('.dashboard-sidebar')?.classList.remove('mobile-open');
    });
  });
}

function switchTab(tabId) {
  currentTab = tabId;

  document.querySelectorAll('.dash-nav-item[data-tab]').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  const activePanel = document.getElementById(`tab-${tabId}`);
  if (activePanel) {
    activePanel.classList.add('active');
  }

  if (tabId === 'medicines') renderMedicinesTable();
  else if (tabId === 'prescriptions') renderPrescriptionsTable();
  else if (tabId === 'enquiries') renderEnquiriesTable();
  else if (tabId === 'inventory') renderInventoryAudit();
  else if (tabId === 'settings') loadSettingsIntoUI();

  if (window.lucide) window.lucide.createIcons();
}

async function refreshPharmacyDashboard() {
  if (!window.PharmacyService) return;

  const metrics = await window.PharmacyService.getPharmacyMetrics();
  activeMedicines = await window.PharmacyService.getMedicines();
  activePrescriptions = await window.PharmacyService.getPrescriptionRequests();
  activeEnquiries = await window.PharmacyService.getEnquiries();

  // Update KPI counters
  const totalMedsEl = document.getElementById('kpi-total-meds');
  const availStockEl = document.getElementById('kpi-avail-stock');
  const lowStockEl = document.getElementById('kpi-low-stock');
  const outStockEl = document.getElementById('kpi-out-stock');
  const pendingRxEl = document.getElementById('kpi-pending-rx');
  const recentEnqEl = document.getElementById('kpi-recent-enq');

  if (totalMedsEl) totalMedsEl.textContent = metrics.totalProducts;
  if (availStockEl) availStockEl.textContent = metrics.availableCount;
  if (lowStockEl) lowStockEl.textContent = metrics.lowStockCount;
  if (outStockEl) outStockEl.textContent = metrics.outOfStockCount;
  if (pendingRxEl) pendingRxEl.textContent = metrics.pendingPrescriptionsCount;
  if (recentEnqEl) recentEnqEl.textContent = metrics.recentEnquiriesCount;

  // Sidebar badges
  const rxBadge = document.getElementById('sidebar-rx-badge');
  const enqBadge = document.getElementById('sidebar-enq-badge');
  const lowStockBadge = document.getElementById('sidebar-lowstock-badge');

  if (rxBadge) rxBadge.textContent = `${metrics.pendingPrescriptionsCount} New`;
  if (enqBadge) enqBadge.textContent = `${metrics.recentEnquiriesCount} New`;
  if (lowStockBadge) lowStockBadge.textContent = `${metrics.lowStockCount} Low`;

  // Topbar low stock warning pill
  const lowStockPill = document.getElementById('topbar-lowstock-pill');
  const lowStockPillCount = document.getElementById('topbar-lowstock-count');
  if (lowStockPill && lowStockPillCount) {
    if (metrics.lowStockCount > 0) {
      lowStockPill.style.display = 'inline-flex';
      lowStockPillCount.textContent = metrics.lowStockCount;
    } else {
      lowStockPill.style.display = 'none';
    }
  }

  // Render overview queues
  renderOverviewPrescriptionsQueue();
  renderOverviewStockAlerts();
  renderOverviewEnquiriesQueue();

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Overview Section 1: Pending Prescriptions Queue
 */
function renderOverviewPrescriptionsQueue() {
  const container = document.getElementById('overview-prescriptions-queue');
  if (!container) return;

  const pending = activePrescriptions.filter(p =>
    p.status === 'Pending Review' || p.status === 'Under Review'
  );

  if (pending.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--slate-400);">
        <i data-lucide="check-circle" style="width: 40px; height: 40px; margin: 0 auto 0.5rem; color: var(--success-500); display: block;"></i>
        <h4 style="font-size: 0.95rem; color: var(--slate-700); margin: 0 0 0.25rem;">Prescription Review Queue Clear</h4>
        <p style="font-size: 0.825rem; margin: 0;">All patient prescription requests have been reviewed.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = pending.slice(0, 4).map(rx => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; border: 1px solid var(--slate-200); border-radius: var(--radius-md); margin-bottom: 0.65rem; background: #ffffff;">
      <div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-family: var(--font-mono); font-size: 0.78rem; font-weight: 700; color: var(--primary-700);">${rx.reference}</span>
          <strong style="color: var(--slate-900); font-size: 0.9rem;">${rx.patientName}</strong>
          <span class="badge ${rx.status === 'Pending Review' ? 'badge-warning' : 'badge-primary'} text-xs">${rx.status}</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--slate-600); margin-top: 0.2rem;">
          <strong>Rx:</strong> ${rx.medicineRequested} • <strong>Dr:</strong> ${rx.doctorName || 'Attending'}
        </div>
      </div>
      <div>
        <button class="btn btn-outline btn-sm review-rx-btn" data-rx-id="${rx.id}">
          <i data-lucide="eye"></i> Review
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.review-rx-btn').forEach(btn => {
    btn.onclick = () => {
      const rxId = btn.getAttribute('data-rx-id');
      const rx = activePrescriptions.find(p => p.id === rxId);
      if (rx) openPrescriptionReviewModal(rx);
    };
  });
}

/**
 * Overview Section 2: Low-Stock & Expiry Alerts
 */
function renderOverviewStockAlerts() {
  const container = document.getElementById('overview-stock-alerts');
  if (!container) return;

  const lowStock = activeMedicines.filter(m => m.stock > 0 && m.stock <= (m.lowStockThreshold || 10));
  const outStock = activeMedicines.filter(m => m.stock === 0 || m.isAvailable === false);

  const alerts = [...outStock.map(m => ({ ...m, type: 'Out of Stock' })), ...lowStock.map(m => ({ ...m, type: 'Low Stock' }))];

  if (alerts.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem; color: var(--slate-400);">
        <i data-lucide="shield-check" style="width: 36px; height: 36px; color: var(--success-500); margin: 0 auto 0.5rem; display: block;"></i>
        <h4 style="font-size: 0.95rem; color: var(--slate-700); margin: 0;">Dispensary Stock Healthy</h4>
        <p style="font-size: 0.825rem; margin: 0.25rem 0 0;">All medicine inventory levels are above reorder thresholds.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = alerts.slice(0, 4).map(m => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0.95rem; border: 1px solid ${m.type === 'Out of Stock' ? '#fecdd3' : '#fde68a'}; border-radius: var(--radius-md); margin-bottom: 0.5rem; background: ${m.type === 'Out of Stock' ? '#fef2f2' : '#fffbeb'};">
      <div>
        <strong style="color: var(--slate-900); font-size: 0.885rem;">${m.name}</strong>
        <div style="font-size: 0.78rem; color: var(--slate-600); margin-top: 0.15rem;">
          ${m.brand} • <span style="font-weight: 700; color: ${m.type === 'Out of Stock' ? 'var(--danger-700)' : 'var(--warning-700)'};">${m.stock} units remaining</span>
        </div>
      </div>
      <div>
        <button class="btn btn-outline btn-sm quick-restock-btn" data-med-id="${m.id}" data-med-name="${m.name}" data-current-stock="${m.stock}">
          <i data-lucide="plus"></i> Restock
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.quick-restock-btn').forEach(btn => {
    btn.onclick = () => {
      openQuickStockModal(
        btn.getAttribute('data-med-id'),
        btn.getAttribute('data-med-name'),
        btn.getAttribute('data-current-stock')
      );
    };
  });
}

/**
 * Overview Section 3: Recent Enquiries
 */
function renderOverviewEnquiriesQueue() {
  const container = document.getElementById('overview-enquiries-queue');
  if (!container) return;

  if (activeEnquiries.length === 0) {
    container.innerHTML = `<p class="text-muted" style="font-size: 0.85rem; margin: 0;">No medicine enquiries submitted.</p>`;
    return;
  }

  container.innerHTML = activeEnquiries.slice(0, 3).map(enq => `
    <div style="padding: 0.85rem 1rem; border: 1px solid var(--slate-200); border-radius: var(--radius-md); margin-bottom: 0.65rem; background: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem;">
        <div>
          <strong style="color: var(--slate-900); font-size: 0.9rem;">${enq.patientName}</strong>
          <span style="font-size: 0.78rem; color: var(--slate-500); margin-left: 0.5rem;">(${enq.patientPhone || enq.patientEmail})</span>
        </div>
        <span class="badge ${enq.status === 'Pending Response' ? 'badge-warning' : 'badge-success'} text-xs">${enq.status}</span>
      </div>
      <div style="font-size: 0.835rem; color: var(--slate-700); margin-bottom: 0.35rem;">
        <strong>Medicine:</strong> ${enq.medicineName} (${enq.quantityRequested || '1 pack'})
      </div>
      <p style="font-size: 0.8rem; color: var(--slate-600); margin: 0 0 0.5rem; font-style: italic;">"${enq.message || 'No additional note'}"</p>
      <div style="display: flex; justify-content: flex-end;">
        <button class="btn btn-outline btn-sm respond-enquiry-btn" data-enq-id="${enq.id}">
          <i data-lucide="message-square"></i> Respond
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.respond-enquiry-btn').forEach(btn => {
    btn.onclick = () => {
      const enqId = btn.getAttribute('data-enq-id');
      const enq = activeEnquiries.find(e => e.id === enqId);
      if (enq) openEnquiryResponseModal(enq);
    };
  });
}

// =========================================================================
// TAB 2: MEDICINE MANAGEMENT
// Requirement 2: Add medicines, edit medicine info, update stock quantity,
// set categories, set selling price, set expiry date, mark unavailable.
// =========================================================================

let medicineSearchQuery = '';
let medicineCategoryFilter = 'all';
let medicineStockFilter = 'all';

function setupMedicineManagementListeners() {
  document.getElementById('med-search-input')?.addEventListener('input', (e) => {
    medicineSearchQuery = e.target.value.toLowerCase().trim();
    renderMedicinesTable();
  });

  document.getElementById('med-category-filter')?.addEventListener('change', (e) => {
    medicineCategoryFilter = e.target.value;
    renderMedicinesTable();
  });

  document.getElementById('med-stock-filter')?.addEventListener('change', (e) => {
    medicineStockFilter = e.target.value;
    renderMedicinesTable();
  });

  document.getElementById('open-add-medicine-btn')?.addEventListener('click', () => {
    openAddMedicineModal();
  });

  // Submit Add Medicine
  document.getElementById('add-medicine-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleAddMedicine();
  });

  // Submit Edit Medicine
  document.getElementById('edit-medicine-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleEditMedicine();
  });

  // Submit Quick Stock
  document.getElementById('quick-stock-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleQuickStockSubmit();
  });
}

async function renderMedicinesTable() {
  const container = document.getElementById('medicines-table-body');
  const countEl = document.getElementById('medicines-table-count');
  if (!container) return;

  let list = await window.PharmacyService.getMedicines();

  if (medicineSearchQuery) {
    list = list.filter(m =>
      (m.name && m.name.toLowerCase().includes(medicineSearchQuery)) ||
      (m.brand && m.brand.toLowerCase().includes(medicineSearchQuery)) ||
      (m.category && m.category.toLowerCase().includes(medicineSearchQuery))
    );
  }

  if (medicineCategoryFilter && medicineCategoryFilter !== 'all') {
    list = list.filter(m => m.category.toLowerCase() === medicineCategoryFilter.toLowerCase());
  }

  if (medicineStockFilter && medicineStockFilter !== 'all') {
    if (medicineStockFilter === 'available') {
      list = list.filter(m => m.stock > (m.lowStockThreshold || 10) && m.isAvailable !== false);
    } else if (medicineStockFilter === 'low_stock') {
      list = list.filter(m => m.stock > 0 && m.stock <= (m.lowStockThreshold || 10) && m.isAvailable !== false);
    } else if (medicineStockFilter === 'out_of_stock') {
      list = list.filter(m => m.stock === 0 || m.isAvailable === false);
    }
  }

  if (countEl) countEl.textContent = `${list.length} medicine${list.length !== 1 ? 's' : ''}`;

  if (list.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3rem 1rem; color: var(--slate-400);">
          <i data-lucide="package-search" style="width: 42px; height: 42px; margin: 0 auto 0.5rem; color: var(--slate-300); display: block;"></i>
          <h4 style="font-size: 1rem; color: var(--slate-700); margin: 0 0 0.25rem;">No Medicines Found</h4>
          <p style="font-size: 0.85rem; margin: 0;">Try adjusting your filter options or add a new medicine product.</p>
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = list.map(m => {
    const isLow = m.stock > 0 && m.stock <= (m.lowStockThreshold || 10);
    const isOut = m.stock === 0 || m.isAvailable === false;

    let stockBadge = `<span class="badge badge-success text-xs">${m.stock} In Stock</span>`;
    if (isOut) {
      stockBadge = `<span class="badge badge-danger text-xs">Out of Stock (0)</span>`;
    } else if (isLow) {
      stockBadge = `<span class="badge badge-warning text-xs">Low Stock (${m.stock})</span>`;
    }

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--slate-900); font-size: 0.925rem;">${m.name}</div>
          <div style="font-size: 0.78rem; color: var(--slate-500);">${m.brand} • ${m.dosageForm || 'Oral'}</div>
        </td>
        <td>
          <span class="badge badge-neutral text-xs">${m.category}</span>
        </td>
        <td>
          <strong style="color: var(--slate-900); font-size: 0.95rem;">$${parseFloat(m.price).toFixed(2)}</strong>
        </td>
        <td>
          ${stockBadge}
        </td>
        <td>
          <span style="font-size: 0.85rem; color: ${m.expiryDate < new Date().toISOString().split('T')[0] ? 'var(--danger-600); font-weight:700;' : 'var(--slate-700);'}">
            ${m.expiryDate}
          </span>
        </td>
        <td>
          ${m.prescriptionRequired ?
            `<span class="badge badge-danger text-xs"><i data-lucide="lock"></i> Rx Required</span>` :
            `<span class="badge badge-teal text-xs"><i data-lucide="check"></i> OTC</span>`
          }
        </td>
        <td>
          <button class="btn ${m.isAvailable !== false && m.stock > 0 ? 'btn-ghost' : 'btn-outline'} btn-sm toggle-avail-btn" data-med-id="${m.id}" data-current-avail="${m.isAvailable !== false}">
            ${m.isAvailable !== false && m.stock > 0 ?
              '<span style="color: var(--success-700); font-weight:700;"><i data-lucide="check-circle-2"></i> Active</span>' :
              '<span style="color: var(--danger-600); font-weight:700;"><i data-lucide="slash"></i> Unavailable</span>'
            }
          </button>
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem; align-items: center;">
            <button class="btn btn-outline btn-sm quick-stock-btn" data-med-id="${m.id}" data-med-name="${m.name}" data-current-stock="${m.stock}" title="Adjust Stock">
              <i data-lucide="boxes"></i> Stock
            </button>
            <button class="btn btn-outline btn-sm edit-med-btn" data-med-id="${m.id}" title="Edit Medicine Details">
              <i data-lucide="edit"></i>
            </button>
            <button class="btn btn-ghost btn-sm delete-med-btn" data-med-id="${m.id}" data-med-name="${m.name}" style="color: var(--danger-500);" title="Delete Product">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach action handlers
  container.querySelectorAll('.quick-stock-btn').forEach(btn => {
    btn.onclick = () => {
      openQuickStockModal(
        btn.getAttribute('data-med-id'),
        btn.getAttribute('data-med-name'),
        btn.getAttribute('data-current-stock')
      );
    };
  });

  container.querySelectorAll('.edit-med-btn').forEach(btn => {
    btn.onclick = () => {
      const medId = btn.getAttribute('data-med-id');
      const med = list.find(m => m.id === medId);
      if (med) openEditMedicineModal(med);
    };
  });

  container.querySelectorAll('.toggle-avail-btn').forEach(btn => {
    btn.onclick = async () => {
      const medId = btn.getAttribute('data-med-id');
      const curr = btn.getAttribute('data-current-avail') === 'true';
      await window.PharmacyService.setMedicineAvailability(medId, !curr);
      if (window.Toast) window.Toast.info(`Product marked as ${!curr ? 'Available' : 'Unavailable'}.`);
      await refreshPharmacyDashboard();
      renderMedicinesTable();
    };
  });

  container.querySelectorAll('.delete-med-btn').forEach(btn => {
    btn.onclick = async () => {
      const medId = btn.getAttribute('data-med-id');
      const medName = btn.getAttribute('data-med-name');
      if (confirm(`Are you sure you want to remove "${medName}" from the pharmacy inventory?`)) {
        await window.PharmacyService.deleteMedicine(medId);
        if (window.Toast) window.Toast.info(`Removed ${medName}`);
        await refreshPharmacyDashboard();
        renderMedicinesTable();
      }
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

function openAddMedicineModal() {
  const form = document.getElementById('add-medicine-form');
  if (form) form.reset();
  openModal('add-medicine-modal');
}

async function handleAddMedicine() {
  const getVal = (id) => document.getElementById(id)?.value.trim() || '';

  const payload = {
    name: getVal('add-med-name'),
    brand: getVal('add-med-brand'),
    category: getVal('add-med-category'),
    description: getVal('add-med-description'),
    dosageForm: getVal('add-med-dosage'),
    price: parseFloat(getVal('add-med-price')),
    stock: parseInt(getVal('add-med-stock'), 10),
    lowStockThreshold: parseInt(getVal('add-med-threshold'), 10) || 15,
    expiryDate: getVal('add-med-expiry'),
    prescriptionRequired: document.getElementById('add-med-rx')?.checked || false
  };

  const res = await window.PharmacyService.addMedicine(payload);
  if (res.success) {
    closeModal('add-medicine-modal');
    if (window.Toast) window.Toast.success(`Added ${res.medicine.name} to pharmacy inventory.`, 'Medicine Added');
    await refreshPharmacyDashboard();
    renderMedicinesTable();
  } else {
    alert(res.error);
  }
}

function openEditMedicineModal(med) {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  };

  setVal('edit-med-id', med.id);
  setVal('edit-med-name', med.name);
  setVal('edit-med-brand', med.brand);
  setVal('edit-med-category', med.category);
  setVal('edit-med-description', med.description);
  setVal('edit-med-dosage', med.dosageForm || 'Tablets');
  setVal('edit-med-price', med.price);
  setVal('edit-med-stock', med.stock);
  setVal('edit-med-threshold', med.lowStockThreshold || 15);
  setVal('edit-med-expiry', med.expiryDate);

  const rxCheck = document.getElementById('edit-med-rx');
  if (rxCheck) rxCheck.checked = Boolean(med.prescriptionRequired);

  openModal('edit-medicine-modal');
}

async function handleEditMedicine() {
  const getVal = (id) => document.getElementById(id)?.value.trim() || '';
  const medId = getVal('edit-med-id');

  const updates = {
    name: getVal('edit-med-name'),
    brand: getVal('edit-med-brand'),
    category: getVal('edit-med-category'),
    description: getVal('edit-med-description'),
    dosageForm: getVal('edit-med-dosage'),
    price: parseFloat(getVal('edit-med-price')),
    stock: parseInt(getVal('edit-med-stock'), 10),
    lowStockThreshold: parseInt(getVal('edit-med-threshold'), 10) || 15,
    expiryDate: getVal('edit-med-expiry'),
    prescriptionRequired: document.getElementById('edit-med-rx')?.checked || false
  };

  const res = await window.PharmacyService.updateMedicine(medId, updates);
  if (res.success) {
    closeModal('edit-medicine-modal');
    if (window.Toast) window.Toast.success(`Updated ${res.medicine.name}.`, 'Medicine Updated');
    await refreshPharmacyDashboard();
    renderMedicinesTable();
  } else {
    alert(res.error);
  }
}

function openQuickStockModal(medId, medName, currentStock) {
  const idEl = document.getElementById('quick-stock-med-id');
  const nameEl = document.getElementById('quick-stock-med-name');
  const qtyEl = document.getElementById('quick-stock-qty');
  const reasonEl = document.getElementById('quick-stock-reason');

  if (idEl) idEl.value = medId;
  if (nameEl) nameEl.textContent = medName;
  if (qtyEl) qtyEl.value = currentStock;
  if (reasonEl) reasonEl.value = 'Warehouse Re-Supply Shipment';

  openModal('quick-stock-modal');
}

async function handleQuickStockSubmit() {
  const medId = document.getElementById('quick-stock-med-id')?.value;
  const newQty = document.getElementById('quick-stock-qty')?.value;
  const reason = document.getElementById('quick-stock-reason')?.value.trim();

  const res = await window.PharmacyService.updateStockQuantity(medId, newQty, reason);
  if (res.success) {
    closeModal('quick-stock-modal');
    if (window.Toast) window.Toast.success(`Stock updated to ${newQty} units.`, 'Stock Updated');
    await refreshPharmacyDashboard();
    renderMedicinesTable();
  } else {
    alert(res.error);
  }
}

// =========================================================================
// TAB 3: PRESCRIPTION REQUESTS REVIEW
// Requirement 4: View prescription requests, review uploaded prescriptions,
// accept or reject requests, add rejection reason, update request status.
// Statuses: Pending Review, Under Review, Approved, Rejected, Ready for Collection, Completed.
// =========================================================================

let rxFilterStatus = 'all';
let rxSearchQuery = '';

function setupPrescriptionsTabListeners() {
  document.querySelectorAll('.rx-status-filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rx-status-filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rxFilterStatus = btn.getAttribute('data-status');
      renderPrescriptionsTable();
    });
  });

  document.getElementById('rx-table-search')?.addEventListener('input', (e) => {
    rxSearchQuery = e.target.value.toLowerCase().trim();
    renderPrescriptionsTable();
  });
}

async function renderPrescriptionsTable() {
  const container = document.getElementById('prescriptions-table-body');
  const countEl = document.getElementById('prescriptions-table-count');
  if (!container) return;

  let list = await window.PharmacyService.getPrescriptionRequests();

  if (rxFilterStatus && rxFilterStatus !== 'all') {
    list = list.filter(p => p.status.toLowerCase() === rxFilterStatus.toLowerCase());
  }

  if (rxSearchQuery) {
    list = list.filter(p =>
      (p.patientName && p.patientName.toLowerCase().includes(rxSearchQuery)) ||
      (p.patientPhone && p.patientPhone.toLowerCase().includes(rxSearchQuery)) ||
      (p.reference && p.reference.toLowerCase().includes(rxSearchQuery)) ||
      (p.medicineRequested && p.medicineRequested.toLowerCase().includes(rxSearchQuery))
    );
  }

  if (countEl) countEl.textContent = `${list.length} request${list.length !== 1 ? 's' : ''}`;

  if (list.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: var(--slate-400);">
          <i data-lucide="file-check" style="width: 42px; height: 42px; margin: 0 auto 0.5rem; color: var(--slate-300); display: block;"></i>
          <h4 style="font-size: 1rem; color: var(--slate-700); margin: 0 0 0.25rem;">No Prescription Requests Found</h4>
          <p style="font-size: 0.85rem; margin: 0;">No prescription records match the selected status filter.</p>
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = list.map(rx => {
    let badgeClass = 'status-under-review';
    if (rx.status === 'Approved') badgeClass = 'status-approved';
    else if (rx.status === 'Rejected') badgeClass = 'status-rejected';
    else if (rx.status === 'Ready for Collection') badgeClass = 'status-ready-collection';
    else if (rx.status === 'Completed') badgeClass = 'status-completed';
    else if (rx.status === 'Pending Review') badgeClass = 'status-pending-review';

    return `
      <tr>
        <td>
          <span style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700; color: var(--primary-700);">${rx.reference}</span>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--slate-900); font-size: 0.925rem;">${rx.patientName}</div>
          <div style="font-size: 0.78rem; color: var(--slate-500);">${rx.patientPhone}</div>
        </td>
        <td>
          <div style="font-size: 0.85rem; color: var(--slate-800); font-weight: 600;">${rx.doctorName || 'Attending Physician'}</div>
          <div style="font-size: 0.78rem; color: var(--slate-500);">${rx.doctorDepartment || 'Outpatient Clinic'}</div>
        </td>
        <td style="max-width: 220px;">
          <span style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${rx.medicineRequested}">
            ${rx.medicineRequested}
          </span>
        </td>
        <td>
          <span class="badge ${badgeClass}" style="font-size: 0.8rem; font-weight: 700;">${rx.status}</span>
        </td>
        <td>
          <span style="font-size: 0.825rem; color: var(--slate-600);">${new Date(rx.submittedAt).toLocaleDateString()}</span>
        </td>
        <td>
          <button class="btn btn-primary btn-sm review-rx-btn" data-rx-id="${rx.id}">
            <i data-lucide="eye"></i> Review & Update
          </button>
        </td>
      </tr>
    `;
  }).join('');

  container.querySelectorAll('.review-rx-btn').forEach(btn => {
    btn.onclick = () => {
      const rxId = btn.getAttribute('data-rx-id');
      const rx = list.find(p => p.id === rxId);
      if (rx) openPrescriptionReviewModal(rx);
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Open Prescription Review & Status Transition Modal
 */
function openPrescriptionReviewModal(rx) {
  const content = document.getElementById('rx-review-modal-content');
  if (!content) return;

  const validStatuses = [
    "Pending Review",
    "Under Review",
    "Approved",
    "Rejected",
    "Ready for Collection",
    "Completed"
  ];

  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;">
      <div>
        <span style="font-family: var(--font-mono); font-size: 0.825rem; font-weight: 700; color: var(--primary-600);">REF: ${rx.reference}</span>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--slate-900); margin: 0.2rem 0 0;">${rx.patientName}</h3>
      </div>
      <div>
        <span class="badge status-${rx.status.toLowerCase().replace(/\s+/g, '-')}" style="font-size: 0.85rem; padding: 0.35rem 0.75rem;">${rx.status}</span>
      </div>
    </div>

    <!-- Uploaded Prescription Viewer -->
    <div class="prescription-doc-viewer">
      <div style="margin-bottom: 0.5rem; font-size: 0.825rem; color: var(--slate-500); font-weight: 600;">
        <i data-lucide="file-text" style="width: 14px; height: 14px; display: inline; vertical-align: middle;"></i> Uploaded Document: <strong>${rx.fileName || 'Doctor_Prescription.pdf'}</strong>
      </div>
      <img src="${rx.prescriptionFileUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80'}" alt="Prescription Document Preview" class="prescription-preview-img">
    </div>

    <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem; font-size: 0.85rem; line-height: 1.6;">
      <div><strong>Patient Contact:</strong> ${rx.patientPhone} • ${rx.patientEmail}</div>
      <div><strong>Prescribing Physician:</strong> ${rx.doctorName || 'Licensed Physician'} (${rx.doctorDepartment || 'Outpatient Clinic'})</div>
      <div><strong>Medicines Prescribed:</strong> ${rx.medicineRequested}</div>
      <div><strong>Target Collection Window:</strong> ${rx.preferredCollectionTime || 'Standard'}</div>
      ${rx.patientNotes ? `<div><strong>Patient Pre-Intake Notes:</strong> ${rx.patientNotes}</div>` : ''}
    </div>

    <!-- Status Transition Control -->
    <form id="rx-update-status-form">
      <input type="hidden" id="rx-review-id" value="${rx.id}">
      
      <div class="form-group">
        <label for="rx-status-select" class="form-label">Update Request Status <span class="required">*</span></label>
        <select id="rx-status-select" class="form-control" style="font-weight: 700;">
          ${validStatuses.map(st => `
            <option value="${st}" ${st === rx.status ? 'selected' : ''}>${st}</option>
          `).join('')}
        </select>
      </div>

      <!-- Rejection Reason (Mandatory if status is Rejected) -->
      <div id="rx-rejection-reason-group" class="form-group" style="display: ${rx.status === 'Rejected' ? 'block' : 'none'};">
        <label for="rx-rejection-reason" class="form-label" style="color: var(--danger-700);">Rejection Reason <span class="required">*</span></label>
        <textarea id="rx-rejection-reason" class="form-control" rows="2" placeholder="Specify clinical/regulatory reason (e.g. illegible scan, unauthorized provider, medicine out of stock)...">${rx.rejectionReason || ''}</textarea>
      </div>

      <div class="form-group">
        <label for="rx-staff-notes" class="form-label">Pharmacist Instructions / Clinical Notes for Patient</label>
        <textarea id="rx-staff-notes" class="form-control" rows="2" placeholder="e.g. Verified with Dr. Wright. Pick up at Dispensary Counter B with photo ID...">${rx.staffNotes || ''}</textarea>
      </div>

      <div class="modal-footer-custom" style="padding: 1rem 0 0; background: none; border-top: 1px solid var(--slate-100);">
        <button type="button" class="btn btn-outline" onclick="closeModal('prescription-review-modal')">Close</button>
        <button type="submit" class="btn btn-primary">
          <i data-lucide="check"></i> Save Status Update
        </button>
      </div>
    </form>
  `;

  // Toggle rejection reason visibility
  const statusSelect = document.getElementById('rx-status-select');
  const rejectGroup = document.getElementById('rx-rejection-reason-group');
  if (statusSelect && rejectGroup) {
    statusSelect.addEventListener('change', () => {
      rejectGroup.style.display = (statusSelect.value === 'Rejected') ? 'block' : 'none';
    });
  }

  // Handle Form Submit
  const form = document.getElementById('rx-update-status-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newStatus = statusSelect.value;
      const staffNotes = document.getElementById('rx-staff-notes')?.value || '';
      const rejectionReason = document.getElementById('rx-rejection-reason')?.value || '';

      const res = await window.PharmacyService.updatePrescriptionStatus(
        rx.id,
        newStatus,
        staffNotes,
        rejectionReason
      );

      if (res.success) {
        closeModal('prescription-review-modal');
        if (window.Toast) window.Toast.success(`Prescription ${rx.reference} updated to "${newStatus}".`, 'Status Updated');
        await refreshPharmacyDashboard();
        renderPrescriptionsTable();
      } else {
        alert(res.error);
      }
    });
  }

  openModal('prescription-review-modal');
  if (window.lucide) window.lucide.createIcons();
}

// =========================================================================
// TAB 4: MEDICINE ENQUIRIES
// =========================================================================

let enqFilterStatus = 'all';

function setupEnquiriesTabListeners() {
  document.querySelectorAll('.enq-filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.enq-filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      enqFilterStatus = btn.getAttribute('data-status');
      renderEnquiriesTable();
    });
  });
}

async function renderEnquiriesTable() {
  const container = document.getElementById('enquiries-table-body');
  const countEl = document.getElementById('enquiries-table-count');
  if (!container) return;

  let list = await window.PharmacyService.getEnquiries();

  if (enqFilterStatus && enqFilterStatus !== 'all') {
    list = list.filter(e => e.status.toLowerCase() === enqFilterStatus.toLowerCase());
  }

  if (countEl) countEl.textContent = `${list.length} enquiry/enquiries`;

  if (list.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem 1rem; color: var(--slate-400);">
          <i data-lucide="message-square" style="width: 42px; height: 42px; margin: 0 auto 0.5rem; color: var(--slate-300); display: block;"></i>
          <h4 style="font-size: 1rem; color: var(--slate-700); margin: 0 0 0.25rem;">No Enquiries Found</h4>
          <p style="font-size: 0.85rem; margin: 0;">No patient medicine enquiries match the filter.</p>
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = list.map(enq => `
    <tr>
      <td>
        <div style="font-weight: 700; color: var(--slate-900);">${enq.patientName}</div>
        <div style="font-size: 0.78rem; color: var(--slate-500);">${enq.patientEmail} • ${enq.patientPhone}</div>
      </td>
      <td>
        <strong>${enq.medicineName}</strong>
        <div style="font-size: 0.78rem; color: var(--slate-500);">Qty: ${enq.quantityRequested || '1'}</div>
      </td>
      <td>
        <span class="badge ${enq.urgency === 'Urgent' ? 'badge-danger' : 'badge-neutral'} text-xs">${enq.urgency || 'Standard'}</span>
      </td>
      <td style="max-width: 260px;">
        <span style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${enq.message}">
          ${enq.message || 'Availability inquiry'}
        </span>
      </td>
      <td>
        <span class="badge ${enq.status === 'Pending Response' ? 'badge-warning' : 'badge-success'} text-xs">${enq.status}</span>
      </td>
      <td>
        <button class="btn btn-outline btn-sm respond-enquiry-btn" data-enq-id="${enq.id}">
          <i data-lucide="message-circle"></i> Respond
        </button>
      </td>
    </tr>
  `).join('');

  container.querySelectorAll('.respond-enquiry-btn').forEach(btn => {
    btn.onclick = () => {
      const enqId = btn.getAttribute('data-enq-id');
      const enq = list.find(e => e.id === enqId);
      if (enq) openEnquiryResponseModal(enq);
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

function openEnquiryResponseModal(enq) {
  const content = document.getElementById('enquiry-response-modal-content');
  if (!content) return;

  content.innerHTML = `
    <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem; font-size: 0.85rem; line-height: 1.6;">
      <div><strong>Patient:</strong> ${enq.patientName} (${enq.patientEmail} • ${enq.patientPhone})</div>
      <div><strong>Medicine:</strong> ${enq.medicineName} (Requested: ${enq.quantityRequested})</div>
      <div><strong>Inquiry Message:</strong> "${enq.message}"</div>
      <div><strong>Submitted:</strong> ${new Date(enq.submittedAt).toLocaleString()}</div>
    </div>

    ${enq.staffResponse ? `
      <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.85rem;">
        <strong style="color: var(--accent-800);">Previous Staff Response:</strong>
        <p style="margin: 0.25rem 0 0; color: var(--slate-700);">${enq.staffResponse}</p>
        <span style="font-size: 0.75rem; color: var(--slate-400);">Responded at: ${new Date(enq.respondedAt).toLocaleString()}</span>
      </div>
    ` : ''}

    <form id="respond-enquiry-form">
      <div class="form-group">
        <label for="enquiry-reply-text" class="form-label">Pharmacist Response Message <span class="required">*</span></label>
        <textarea id="enquiry-reply-text" class="form-control" rows="4" required placeholder="Write clinical stock confirmation or collection instructions for the patient...">${enq.staffResponse || ''}</textarea>
      </div>

      <div class="modal-footer-custom" style="padding: 1rem 0 0; background: none; border-top: 1px solid var(--slate-100);">
        <button type="button" class="btn btn-outline" onclick="closeModal('enquiry-response-modal')">Close</button>
        <button type="submit" class="btn btn-primary">
          <i data-lucide="send"></i> Dispatch Response to Patient
        </button>
      </div>
    </form>
  `;

  document.getElementById('respond-enquiry-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const reply = document.getElementById('enquiry-reply-text')?.value.trim();
    const res = await window.PharmacyService.respondToEnquiry(enq.id, reply, currentPharmacist.displayName);
    if (res.success) {
      closeModal('enquiry-response-modal');
      if (window.Toast) window.Toast.success("Response recorded and sent to patient.", "Enquiry Responded");
      await refreshPharmacyDashboard();
      renderEnquiriesTable();
    } else {
      alert(res.error);
    }
  });

  openModal('enquiry-response-modal');
  if (window.lucide) window.lucide.createIcons();
}

// =========================================================================
// TAB 5: INVENTORY & STOCK AUDIT HISTORY
// Requirement 5: Low-stock alerts, expiry date warnings, stock movement history.
// =========================================================================

function setupInventoryListeners() {
  // Inventory refresh
}

async function renderInventoryAudit() {
  const alertsContainer = document.getElementById('inventory-low-stock-grid');
  const expiryContainer = document.getElementById('inventory-expiry-grid');
  const historyContainer = document.getElementById('inventory-stock-history-body');

  if (!alertsContainer || !expiryContainer || !historyContainer) return;

  // 1. Low stock alerts
  const lowStock = await window.PharmacyService.getLowStockAlerts();
  if (lowStock.length === 0) {
    alertsContainer.innerHTML = `<p class="text-muted" style="font-size: 0.85rem; padding: 1rem 0; margin: 0;">No low stock alerts. All items above threshold.</p>`;
  } else {
    alertsContainer.innerHTML = lowStock.map(m => `
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid var(--warning-500); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: var(--slate-900); font-size: 0.9rem;">${m.name}</strong>
          <div style="font-size: 0.78rem; color: var(--slate-600); margin-top: 0.15rem;">
            Current Stock: <strong style="color: var(--warning-700);">${m.stock}</strong> (Threshold: ${m.lowStockThreshold || 10})
          </div>
        </div>
        <button class="btn btn-outline btn-sm quick-restock-btn" data-med-id="${m.id}" data-med-name="${m.name}" data-current-stock="${m.stock}">
          Restock
        </button>
      </div>
    `).join('');
  }

  // 2. Expiry warnings (within 60 days)
  const expiring = await window.PharmacyService.getExpiryAlerts(60);
  if (expiring.length === 0) {
    expiryContainer.innerHTML = `<p class="text-muted" style="font-size: 0.85rem; padding: 1rem 0; margin: 0;">No items expiring within the next 60 days.</p>`;
  } else {
    expiryContainer.innerHTML = expiring.map(m => `
      <div style="background: #fef2f2; border: 1px solid #fecdd3; border-left: 4px solid var(--danger-500); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: var(--slate-900); font-size: 0.9rem;">${m.name}</strong>
          <div style="font-size: 0.78rem; color: var(--danger-700); margin-top: 0.15rem;">
            Expires: <strong>${m.expiryDate}</strong> • Batch: ${m.batchNumber || 'N/A'}
          </div>
        </div>
        <span class="badge badge-danger text-xs">Expiring Soon</span>
      </div>
    `).join('');
  }

  // 3. Stock Movement Ledger
  const history = await window.PharmacyService.getStockHistory();
  if (history.length === 0) {
    historyContainer.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--slate-400); padding: 2rem;">No stock movement records logged.</td></tr>`;
  } else {
    historyContainer.innerHTML = history.slice(0, 30).map(h => {
      const isPositive = h.changeAmount > 0;
      return `
        <tr>
          <td><span style="font-size: 0.825rem; color: var(--slate-600);">${new Date(h.timestamp).toLocaleString()}</span></td>
          <td><strong style="color: var(--slate-900); font-size: 0.885rem;">${h.medicineName}</strong></td>
          <td>
            <span style="font-weight: 800; font-size: 0.95rem; color: ${isPositive ? 'var(--success-600)' : 'var(--danger-600)'};">
              ${isPositive ? '+' : ''}${h.changeAmount}
            </span>
          </td>
          <td>
            <span style="font-size: 0.85rem; color: var(--slate-700);">${h.previousQuantity} &rarr; <strong>${h.newQuantity}</strong></span>
          </td>
          <td><span style="font-size: 0.85rem; color: var(--slate-600);">${h.reason}</span></td>
          <td><span style="font-size: 0.78rem; color: var(--slate-500);">${h.performedBy || 'Staff'}</span></td>
        </tr>
      `;
    }).join('');
  }

  alertsContainer.querySelectorAll('.quick-restock-btn').forEach(btn => {
    btn.onclick = () => {
      openQuickStockModal(
        btn.getAttribute('data-med-id'),
        btn.getAttribute('data-med-name'),
        btn.getAttribute('data-current-stock')
      );
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

// =========================================================================
// TAB 6: PHARMACY SETTINGS
// Requirement 6: Pharmacy name, logo, address, contact number,
// operating hours, collection availability.
// =========================================================================

function setupSettingsListeners() {
  document.getElementById('pharmacy-settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const getVal = (id) => document.getElementById(id)?.value.trim() || '';

    const payload = {
      name: getVal('set-pharmacy-name'),
      brandTagline: getVal('set-pharmacy-tagline'),
      address: getVal('set-pharmacy-address'),
      contactNumber: getVal('set-pharmacy-phone'),
      email: getVal('set-pharmacy-email'),
      operatingHours: getVal('set-pharmacy-hours'),
      collectionAvailability: getVal('set-pharmacy-collection'),
      disclaimerNotice: getVal('set-pharmacy-disclaimer')
    };

    const res = await window.PharmacyService.updatePharmacySettings(payload);
    if (res.success) {
      if (window.Toast) window.Toast.success("Pharmacy settings and dispensary notices saved.", "Settings Saved");
      alert("Pharmacy settings updated successfully.");
      await loadSettingsIntoUI();
    }
  });
}

async function loadSettingsIntoUI() {
  const settings = await window.PharmacyService.getPharmacySettings();
  if (!settings) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  };

  setVal('set-pharmacy-name', settings.name);
  setVal('set-pharmacy-tagline', settings.brandTagline);
  setVal('set-pharmacy-address', settings.address);
  setVal('set-pharmacy-phone', settings.contactNumber);
  setVal('set-pharmacy-email', settings.email);
  setVal('set-pharmacy-hours', settings.operatingHours);
  setVal('set-pharmacy-collection', settings.collectionAvailability);
  setVal('set-pharmacy-disclaimer', settings.disclaimerNotice);
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
