/**
 * MediBook Authentication & Role Management Service
 * Provides seamless bridge between Firebase Auth and Demo Simulation
 */

class AuthService {
  constructor() {
    this.SESSION_KEY = 'medibook_active_session';
    this.CUSTOM_USERS_KEY = 'medibook_registered_users';
    this.currentUser = this.loadStoredSession();
    this.authListeners = [];

    // Listen for storage events (multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === this.SESSION_KEY) {
        this.currentUser = this.loadStoredSession();
        this.notifyListeners();
      }
    });

    // If Firebase is configured, wire up Firebase auth state
    this.initFirebaseAuthListener();
  }

  loadStoredSession() {
    try {
      const data = localStorage.getItem(this.SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('[AuthService] Error reading session', e);
      return null;
    }
  }

  saveSession(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.SESSION_KEY);
    }
    this.notifyListeners();
  }

  initFirebaseAuthListener() {
    const fb = window.MediBookFirebase;
    if (fb && fb.isConfigured && fb.auth) {
      fb.auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Fetch extra profile data from Firestore
            const doc = await fb.db.collection('users').doc(firebaseUser.uid).get();
            const profile = doc.exists ? doc.data() : {};
            const userObj = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: profile.displayName || firebaseUser.displayName || 'User',
              role: profile.role || 'patient',
              avatar: profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              ...profile
            };
            this.saveSession(userObj);
          } catch (err) {
            console.error('[AuthService] Error fetching Firestore user record:', err);
          }
        }
      });
    }
  }

  onAuthStateChanged(callback) {
    this.authListeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.authListeners = this.authListeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.authListeners.forEach(cb => {
      try {
        cb(this.currentUser);
      } catch (err) {
        console.error('[AuthService] Error in auth listener callback:', err);
      }
    });
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return Boolean(this.currentUser);
  }

  getUserRole() {
    return this.currentUser ? this.currentUser.role : null;
  }

  /**
   * Login with email, password, and expected role
   */
  async login(email, password, role = 'patient') {
    const fb = window.MediBookFirebase;

    // 1. Live Firebase Auth if configured
    if (fb && fb.isConfigured && fb.auth) {
      try {
        const userCredential = await fb.auth.signInWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;
        const userDoc = await fb.db.collection('users').doc(uid).get();
        
        if (!userDoc.exists) {
          throw new Error('User profile record not found in hospital database.');
        }

        const profileData = userDoc.data();
        if (role && profileData.role !== role) {
          // Sign out immediately if role mismatch
          await fb.auth.signOut();
          throw new Error(`This account is registered as a ${profileData.role.toUpperCase()}, not a ${role.toUpperCase()}.`);
        }

        const user = {
          uid,
          email: userCredential.user.email,
          ...profileData
        };
        this.saveSession(user);
        return { success: true, user };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // 2. Fallback Demo & Local Simulation Mode
    await new Promise(r => setTimeout(r, 600)); // Realistic network latency simulation

    // Check predefined demo accounts
    const demoAccounts = window.MEDIBOOK_DATA ? window.MEDIBOOK_DATA.users : {};
    for (const [key, demoUser] of Object.entries(demoAccounts)) {
      if (demoUser.email.toLowerCase() === email.toLowerCase()) {
        if (password !== demoUser.password && password !== 'password123') {
          return { success: false, error: 'Invalid password. (For demo accounts, use password123)' };
        }
        if (role && demoUser.role !== role) {
          return { success: false, error: `Account belongs to role "${demoUser.role}". Please switch to the ${demoUser.role} tab.` };
        }
        this.saveSession(demoUser);
        return { success: true, user: demoUser };
      }
    }

    // Check custom registered users in localStorage
    try {
      const stored = localStorage.getItem(this.CUSTOM_USERS_KEY);
      const customUsers = stored ? JSON.parse(stored) : [];
      const found = customUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (found) {
        if (found.password !== password) {
          return { success: false, error: 'Incorrect password entered.' };
        }
        if (role && found.role !== role) {
          return { success: false, error: `Account is registered as ${found.role}.` };
        }
        this.saveSession(found);
        return { success: true, user: found };
      }
    } catch (e) {
      console.error(e);
    }

    return { 
      success: false, 
      error: 'No account found with this email. Please check your credentials or click a Demo account preset below.' 
    };
  }

  /**
   * Register a new user
   */
  async register(userData) {
    const fb = window.MediBookFirebase;

    // 1. Live Firebase Registration
    if (fb && fb.isConfigured && fb.auth) {
      try {
        const cred = await fb.auth.createUserWithEmailAndPassword(userData.email, userData.password);
        const uid = cred.user.uid;
        
        const profile = {
          uid,
          email: userData.email,
          displayName: userData.displayName,
          phone: userData.phone || '',
          role: userData.role || 'patient',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          department: userData.department || null,
          licenseNumber: userData.licenseNumber || null,
          hospital: userData.hospital || 'MediBook Central Hospital',
          avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName)}&background=2563eb&color=fff`
        };

        await fb.db.collection('users').doc(uid).set(profile);
        this.saveSession(profile);
        return { success: true, user: profile };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // 2. Demo Simulation Registration
    await new Promise(r => setTimeout(r, 600));

    try {
      const stored = localStorage.getItem(this.CUSTOM_USERS_KEY);
      const customUsers = stored ? JSON.parse(stored) : [];

      if (customUsers.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
        return { success: false, error: 'An account with this email address already exists.' };
      }

      const newUser = {
        id: 'usr_' + Date.now(),
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        phone: userData.phone || '',
        role: userData.role || 'patient',
        department: userData.department || null,
        licenseNumber: userData.licenseNumber || null,
        hospital: userData.hospital || 'Metropolitan Health Network',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName)}&background=2563eb&color=fff`,
        createdAt: new Date().toISOString()
      };

      customUsers.push(newUser);
      localStorage.setItem(this.CUSTOM_USERS_KEY, JSON.stringify(customUsers));
      this.saveSession(newUser);
      return { success: true, user: newUser };
    } catch (e) {
      return { success: false, error: 'Failed to save local registration.' };
    }
  }

  /**
   * One-click demo login helper
   */
  async loginWithDemo(role = 'patient') {
    const demo = window.MEDIBOOK_DATA ? window.MEDIBOOK_DATA.users[role] : null;
    if (!demo) {
      return { success: false, error: `Demo account for ${role} not found.` };
    }
    return this.login(demo.email, demo.password, role);
  }

  /**
   * Sign out
   */
  async logout() {
    const fb = window.MediBookFirebase;
    if (fb && fb.isConfigured && fb.auth) {
      try {
        await fb.auth.signOut();
      } catch (e) {
        console.error('Firebase sign out error', e);
      }
    }
    this.saveSession(null);
  }

  /**
   * Route helper according to user's assigned role
   */
  getPortalUrl(role) {
    // Calculate path relative to current URL
    const isInsideAuth = window.location.pathname.includes('/auth/');
    const isInsidePortal = window.location.pathname.includes('/portal/');
    
    let prefix = '';
    if (isInsideAuth) {
      prefix = '../portal/';
    } else if (isInsidePortal) {
      prefix = '../';
    } else {
      prefix = 'portal/';
    }

    switch (role) {
      case 'doctor':
        return `${prefix}doctor/dashboard.html`;
      case 'admin':
        return `${prefix}admin/dashboard.html`;
      case 'patient':
      default:
        return `${prefix}patient/dashboard.html`;
    }
  }

  /**
   * Protect dashboard pages: Redirects if not logged in or wrong role
   */
  requireAuth(allowedRoles = []) {
    const user = this.getCurrentUser();
    if (!user) {
      const isInsidePortal = window.location.pathname.includes('/portal/');
      const loginUrl = isInsidePortal ? '../../auth/login.html' : 'auth/login.html';
      window.location.href = `${loginUrl}?redirect=${encodeURIComponent(window.location.href)}`;
      return false;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      alert(`Access Restricted: This page requires ${allowedRoles.join(' or ')} privileges.`);
      window.location.href = this.getPortalUrl(user.role);
      return false;
    }

    return true;
  }
}

window.AuthService = new AuthService();
