/**
 * MediBook Authentication Controller
 * Drives Login, Register, Role Switching, and Password Reset Workflows
 */

document.addEventListener('DOMContentLoaded', () => {
  initAuthPage();
});

function initAuthPage() {
  let selectedRole = 'patient';

  // 1. Role Selection Tabs
  const roleTabs = document.querySelectorAll('.role-tab');
  const roleInput = document.getElementById('auth-role-input');
  const roleTitleSpan = document.getElementById('current-role-label');
  const doctorFields = document.getElementById('doctor-specific-fields');
  const adminFields = document.getElementById('admin-specific-fields');

  const updateRoleUI = (role) => {
    selectedRole = role;
    if (roleInput) roleInput.value = role;

    roleTabs.forEach(tab => {
      if (tab.getAttribute('data-role') === role) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    if (roleTitleSpan) {
      roleTitleSpan.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    }

    // Role specific form field toggles on Register page
    if (doctorFields) {
      doctorFields.style.display = (role === 'doctor') ? 'block' : 'none';
    }
    if (adminFields) {
      adminFields.style.display = (role === 'admin') ? 'block' : 'none';
    }

    // Role specific notice on Login page
    const doctorLoginNotice = document.getElementById('doctor-login-notice');
    if (doctorLoginNotice) {
      doctorLoginNotice.style.display = (role === 'doctor') ? 'block' : 'none';
    }

    const regSubmitBtn = document.getElementById('register-submit-btn');
    if (regSubmitBtn) {
      if (role === 'doctor') {
        regSubmitBtn.innerHTML = '<span>Submit for Administrator Approval</span> <i data-lucide="shield-check"></i>';
      } else if (role === 'admin') {
        regSubmitBtn.innerHTML = '<span>Register Admin Account</span> <i data-lucide="arrow-right"></i>';
      } else {
        regSubmitBtn.innerHTML = '<span>Create Patient Account</span> <i data-lucide="arrow-right"></i>';
      }
      if (window.lucide) window.lucide.createIcons();
    }
  };

  roleTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const role = tab.getAttribute('data-role');
      updateRoleUI(role);
    });
  });

  // Check URL query parameters for pre-selected role (e.g. ?role=doctor)
  const urlParams = new URLSearchParams(window.location.search);
  const paramRole = urlParams.get('role');
  if (paramRole && ['patient', 'doctor', 'admin', 'pharmacist', 'pharmacy'].includes(paramRole.toLowerCase())) {
    updateRoleUI(paramRole.toLowerCase());
  }

  // 2. Demo 1-Click Fill Buttons
  const demoChips = document.querySelectorAll('.demo-account-chip');
  demoChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const role = chip.getAttribute('data-demo-role');
      const demoData = window.MEDIBOOK_DATA ? window.MEDIBOOK_DATA.users[role] : null;
      if (demoData) {
        updateRoleUI(role);
        const emailInput = document.getElementById('email');
        const passInput = document.getElementById('password');
        if (emailInput) emailInput.value = demoData.email;
        if (passInput) passInput.value = demoData.password;

        if (window.Toast) {
          window.Toast.info(`Loaded demo credentials for ${role.toUpperCase()}`, 'Preset Applied');
        }
      }
    });
  });

  // 3. Password Show/Hide Toggle
  const togglePassBtns = document.querySelectorAll('.toggle-password-btn');
  togglePassBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.input-icon-wrapper').querySelector('input');
      if (input) {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.innerHTML = isPass ? '<i data-lucide="eye-off"></i>' : '<i data-lucide="eye"></i>';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  });

  // 4. Password Strength Meter (Register Page)
  const regPasswordInput = document.getElementById('reg-password');
  const strengthBar = document.getElementById('password-strength-bar');
  const strengthFill = document.getElementById('password-strength-fill');
  if (regPasswordInput && strengthBar && strengthFill) {
    regPasswordInput.addEventListener('input', () => {
      const val = regPasswordInput.value;
      if (!val) {
        strengthBar.style.display = 'none';
        return;
      }
      strengthBar.style.display = 'block';
      const strength = window.FormValidator.evaluatePasswordStrength(val);
      strengthFill.className = `password-strength-fill strength-${strength.level}`;
    });
  }

  // 5. Forgot Password Modal Logic
  const forgotTrigger = document.getElementById('trigger-forgot-password-btn');
  const forgotModal = document.getElementById('forgot-password-modal');
  const closeForgotModal = document.getElementById('close-forgot-modal');
  const forgotForm = document.getElementById('forgot-password-form');

  if (forgotTrigger && forgotModal) {
    forgotTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      forgotModal.classList.add('show');
    });

    const hideForgot = () => forgotModal.classList.remove('show');
    if (closeForgotModal) closeForgotModal.addEventListener('click', hideForgot);

    forgotModal.addEventListener('click', (e) => {
      if (e.target === forgotModal) hideForgot();
    });

    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('forgot-email');
        const submitBtn = document.getElementById('forgot-submit-btn');

        if (!emailInput || !window.FormValidator.validateEmail(emailInput.value)) {
          if (window.Toast) window.Toast.error('Please enter a valid email address.', 'Email Required');
          return;
        }

        const origText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending reset instructions...';

        const result = await window.AuthService.forgotPassword(emailInput.value.trim());
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;

        if (result.success) {
          if (window.Toast) window.Toast.success(result.message, 'Instructions Dispatched');
          hideForgot();
          forgotForm.reset();
        } else {
          if (window.Toast) window.Toast.error(result.error, 'Reset Failed');
        }
      });
    }
  }

  // 6. Login Form Submission
  const loginForm = document.getElementById('medibook-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      window.FormValidator.clearAllErrors(loginForm);

      const emailInput = document.getElementById('email');
      const passInput = document.getElementById('password');
      const submitBtn = document.getElementById('login-submit-btn');

      let isValid = true;
      if (!window.FormValidator.validateRequired(emailInput.value)) {
        window.FormValidator.showError(emailInput, 'Email address is required.');
        isValid = false;
      } else if (!window.FormValidator.validateEmail(emailInput.value)) {
        window.FormValidator.showError(emailInput, 'Please enter a valid email address.');
        isValid = false;
      }

      if (!window.FormValidator.validateRequired(passInput.value)) {
        window.FormValidator.showError(passInput, 'Password is required.');
        isValid = false;
      }

      if (!isValid) return;

      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner" style="display:inline-block; width:16px; height:16px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:8px;"></span> Authenticating...`;

      try {
        const result = await window.AuthService.login(emailInput.value, passInput.value, selectedRole);

        if (result.success) {
          if (window.Toast) {
            window.Toast.success(`Welcome back, ${result.user.displayName}!`, 'Signed In');
          }
          
          setTimeout(() => {
            const redirectUrl = urlParams.get('redirect');
            if (redirectUrl) {
              window.location.href = redirectUrl;
            } else {
              window.location.href = window.AuthService.getPortalUrl(result.user.role);
            }
          }, 700);
        } else {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          if (window.Toast) {
            window.Toast.error(result.error, 'Authentication Failed');
          }
          window.FormValidator.showError(passInput, result.error);
        }
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        if (window.Toast) {
          window.Toast.error(err.message || 'An unexpected error occurred.', 'Error');
        }
      }
    });
  }

  // 7. Registration Form Submission (With confirm password validation)
  const registerForm = document.getElementById('medibook-register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      window.FormValidator.clearAllErrors(registerForm);

      const nameInput = document.getElementById('reg-fullname');
      const emailInput = document.getElementById('reg-email');
      const phoneInput = document.getElementById('reg-phone');
      const passInput = document.getElementById('reg-password');
      const confirmPassInput = document.getElementById('reg-confirm-password');
      const termsCheck = document.getElementById('reg-terms');
      const submitBtn = document.getElementById('register-submit-btn');

      let isValid = true;

      // Validate Name
      if (!window.FormValidator.validateRequired(nameInput.value)) {
        window.FormValidator.showError(nameInput, 'Full legal name is required.');
        isValid = false;
      }

      // Validate Email
      if (!window.FormValidator.validateEmail(emailInput.value)) {
        window.FormValidator.showError(emailInput, 'A valid email address is required.');
        isValid = false;
      }

      // Validate Phone
      if (phoneInput && !window.FormValidator.validateRequired(phoneInput.value)) {
        window.FormValidator.showError(phoneInput, 'Phone number is required for SMS visit alerts.');
        isValid = false;
      }

      // Validate Password
      if (!window.FormValidator.validatePassword(passInput.value, 6)) {
        window.FormValidator.showError(passInput, 'Password must be at least 6 characters.');
        isValid = false;
      }

      // Validate Confirm Password
      if (confirmPassInput) {
        if (!window.FormValidator.validateRequired(confirmPassInput.value)) {
          window.FormValidator.showError(confirmPassInput, 'Please confirm your password.');
          isValid = false;
        } else if (confirmPassInput.value !== passInput.value) {
          window.FormValidator.showError(confirmPassInput, 'Passwords do not match. Please verify.');
          isValid = false;
        }
      }

      if (termsCheck && !termsCheck.checked) {
        alert('Please review and accept the healthcare terms and HIPAA privacy notice to proceed.');
        isValid = false;
      }

      // Check doctor specific fields
      let licenseNum = null;
      let doctorDept = null;
      if (selectedRole === 'doctor') {
        const licenseInput = document.getElementById('doc-license');
        const deptSelect = document.getElementById('doc-department');
        if (licenseInput && !window.FormValidator.validateRequired(licenseInput.value)) {
          window.FormValidator.showError(licenseInput, 'Medical license number is mandatory for provider registration.');
          isValid = false;
        } else if (licenseInput) {
          licenseNum = licenseInput.value;
        }
        if (deptSelect) doctorDept = deptSelect.value;
      }

      if (!isValid) return;

      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner" style="display:inline-block; width:16px; height:16px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:8px;"></span> Creating Account...`;

      try {
        const userData = {
          displayName: nameInput.value.trim(),
          email: emailInput.value.trim(),
          password: passInput.value,
          confirmPassword: confirmPassInput ? confirmPassInput.value : passInput.value,
          phone: phoneInput ? phoneInput.value.trim() : '',
          role: selectedRole,
          licenseNumber: licenseNum,
          department: doctorDept
        };

        const result = await window.AuthService.register(userData);

        if (result.success) {
          if (result.pendingApproval) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            if (window.Toast) {
              window.Toast.info(result.message, 'Submitted for Admin Approval');
            }
            alert("STAFF CREDENTIALING SUBMITTED:\n\nDoctor accounts cannot be activated automatically via public registration.\nYour credentials have been submitted for Hospital Administrator Review.\n\nOnce approved by the hospital administrator, you can log in with your assigned credentials.");
            window.location.href = "login.html?role=doctor";
            return;
          }

          if (window.Toast) {
            window.Toast.success(`Welcome to MediBook, ${result.user.displayName}!`, 'Account Created');
          }
          setTimeout(() => {
            window.location.href = window.AuthService.getPortalUrl(result.user.role);
          }, 800);
        } else {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          if (window.Toast) {
            window.Toast.error(result.error, 'Registration Failed');
          }
          window.FormValidator.showError(emailInput, result.error);
        }
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        if (window.Toast) {
          window.Toast.error(err.message, 'Error');
        }
      }
    });
  }
}
