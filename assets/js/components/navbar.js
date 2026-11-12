/**
 * MediBook Header & Navigation Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
});

function initNavbar() {
  const header = document.querySelector('.site-header');
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const closeDrawerBtn = document.getElementById('close-mobile-drawer');

  // 1. Sticky Header Shadow on Scroll
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // 2. Mobile Drawer Controls
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    const closeDrawer = () => {
      mobileDrawer.classList.remove('open');
      document.body.style.overflow = '';
    };

    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', closeDrawer);
    }

    mobileDrawer.addEventListener('click', (e) => {
      if (e.target === mobileDrawer) {
        closeDrawer();
      }
    });
  }

  // 3. Highlight Active Nav Link
  highlightActiveNavLinks();

  // 4. Update Header Authentication Controls
  if (window.AuthService) {
    window.AuthService.onAuthStateChanged((user) => {
      updateNavbarAuthState(user);
    });
  }

  // 5. Initialize Lucide icons if available
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function highlightActiveNavLinks() {
  const currentPath = window.location.pathname.toLowerCase();
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Check match for root or specific filename
    const isHome = (href === 'index.html' || href === './index.html' || href === '/') && 
                   (currentPath.endsWith('/') || currentPath.endsWith('index.html') || currentPath === '');
    
    if (isHome || (href !== 'index.html' && href !== '/' && currentPath.includes(href.replace('./', '')))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function updateNavbarAuthState(user) {
  const headerActions = document.getElementById('header-auth-actions');
  const mobileDrawerActions = document.getElementById('mobile-drawer-auth-actions');
  const isInsideAuth = window.location.pathname.includes('/auth/');
  const rootPrefix = isInsideAuth ? '../' : '';

  if (!headerActions) return;

  if (user) {
    const portalUrl = window.AuthService.getPortalUrl(user.role);
    const roleCapitalized = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Patient';
    const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=2563eb&color=fff`;

    // Authenticated Desktop Menu
    headerActions.innerHTML = `
      <div class="user-account-menu" id="user-account-dropdown-wrapper">
        <button class="user-pill-btn" id="user-menu-trigger" aria-haspopup="true" aria-expanded="false">
          <img src="${avatarUrl}" alt="${user.displayName}" class="user-pill-avatar" />
          <span class="user-pill-name">${user.displayName || user.email}</span>
          <span class="badge badge-primary text-xs">${roleCapitalized}</span>
          <i data-lucide="chevron-down" style="width: 14px; height: 14px; color: var(--slate-400);"></i>
        </button>

        <div class="dropdown-menu" id="user-menu-dropdown">
          <div style="padding: 0.65rem 0.85rem; border-bottom: 1px solid var(--slate-100); margin-bottom: 0.35rem;">
            <div style="font-weight: 700; font-size: 0.885rem; color: var(--slate-900);">${user.displayName}</div>
            <div style="font-size: 0.775rem; color: var(--slate-500);">${user.email}</div>
          </div>
          <a href="${portalUrl}" class="dropdown-item">
            <i data-lucide="layout-dashboard" style="width: 16px; height: 16px; color: var(--primary-600);"></i>
            <span>${roleCapitalized} Dashboard</span>
          </a>
          <a href="${portalUrl.replace('dashboard.html', 'profile.html')}" class="dropdown-item">
            <i data-lucide="user" style="width: 16px; height: 16px;"></i>
            <span>My Profile</span>
          </a>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item danger" id="nav-logout-btn">
            <i data-lucide="log-out" style="width: 16px; height: 16px;"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    `;

    // Dropdown toggle logic
    const trigger = document.getElementById('user-menu-trigger');
    const dropdown = document.getElementById('user-menu-dropdown');
    if (trigger && dropdown) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('show');
      });
    }

    // Logout logic
    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await window.AuthService.logout();
        if (window.Toast) {
          window.Toast.info('You have been safely signed out.', 'Signed Out');
        }
        setTimeout(() => {
          window.location.reload();
        }, 400);
      });
    }

    // Authenticated Mobile Drawer
    if (mobileDrawerActions) {
      mobileDrawerActions.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--slate-50); border-radius: var(--radius-md); border: 1px solid var(--slate-200); margin-bottom: 0.5rem;">
          <img src="${avatarUrl}" style="width: 38px; height: 38px; border-radius: 50%;" />
          <div style="flex: 1; overflow: hidden;">
            <div style="font-weight: 700; font-size: 0.9rem; color: var(--slate-900);">${user.displayName}</div>
            <div style="font-size: 0.75rem; color: var(--slate-500); text-transform: capitalize;">${user.role} Portal</div>
          </div>
        </div>
        <a href="${portalUrl}" class="btn btn-primary btn-block">
          <i data-lucide="layout-dashboard"></i> Go to Dashboard
        </a>
        <button class="btn btn-outline btn-block text-danger" id="mobile-logout-btn">
          <i data-lucide="log-out"></i> Sign Out
        </button>
      `;

      const mobLogoutBtn = document.getElementById('mobile-logout-btn');
      if (mobLogoutBtn) {
        mobLogoutBtn.addEventListener('click', async () => {
          await window.AuthService.logout();
          window.location.reload();
        });
      }
    }
  } else {
    // Unauthenticated Desktop Menu
    const loginPath = isInsideAuth ? 'login.html' : 'auth/login.html';
    const registerPath = isInsideAuth ? 'register.html' : 'auth/register.html';
    const bookPath = isInsideAuth ? '../find-doctors.html' : 'find-doctors.html';

    headerActions.innerHTML = `
      <a href="${loginPath}" class="btn btn-ghost">Sign In</a>
      <a href="${bookPath}" class="btn btn-primary btn-book-nav">
        <i data-lucide="calendar-plus"></i>
        <span>Book Appointment</span>
      </a>
    `;

    // Unauthenticated Mobile Drawer
    if (mobileDrawerActions) {
      mobileDrawerActions.innerHTML = `
        <a href="${loginPath}" class="btn btn-outline btn-block">Sign In</a>
        <a href="${registerPath}" class="btn btn-primary btn-block">Create Free Account</a>
      `;
    }
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
