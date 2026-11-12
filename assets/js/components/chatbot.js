/**
 * MediBook AI Healthcare Assistant Chatbot Controller
 * Provides floating interactive conversational assistant with rich clinical widgets,
 * doctor discovery, multi-step booking, appointment tracking, hospital FAQ,
 * and medical safety guardrails.
 */

class MediBookChatbot {
  constructor() {
    this.STORAGE_KEY = 'medibook_chat_history';
    this.bookingState = {
      active: false,
      step: null,
      department: null,
      doctorId: null,
      doctorName: null,
      consultationFee: 100,
      date: null,
      timeSlot: null,
      mode: 'in-person'
    };
    this.messages = this.loadHistory();
    this.isOpen = false;
    this.isTyping = false;
    this.init();
  }

  loadHistory() {
    try {
      const data = sessionStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveHistory() {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.messages));
    } catch (e) {}
  }

  init() {
    // Inject CSS if not already present
    if (!document.getElementById('medibook-chatbot-css')) {
      const link = document.createElement('link');
      link.id = 'medibook-chatbot-css';
      link.rel = 'stylesheet';
      // Compute relative path to assets/css/chatbot.css
      const isPortal = window.location.pathname.includes('/portal/');
      const isAuth = window.location.pathname.includes('/auth/');
      const prefix = isPortal ? '../../' : (isAuth ? '../' : '');
      link.href = `${prefix}assets/css/chatbot.css`;
      document.head.appendChild(link);
    }

    // Build DOM Elements
    this.createDOM();
    this.bindEvents();

    // Render Initial Welcome if chat is empty
    if (this.messages.length === 0) {
      this.addMessage('bot', "Hello! I'm **MediBook Assistant**. How can I help you today?", {
        suggestions: [
          "Find a doctor",
          "Book an appointment",
          "Check my appointment",
          "Emergency hospitals (<30 mins)",
          "Hospital information",
          "Pharmacy enquiries"
        ]
      });
    } else {
      this.renderAllMessages();
    }
  }

  createDOM() {
    // Remove any existing instance
    const oldLauncher = document.getElementById('medibook-chat-launcher');
    const oldWindow = document.getElementById('medibook-chat-window');
    if (oldLauncher) oldLauncher.remove();
    if (oldWindow) oldWindow.remove();

    // 1. Floating Launcher Button
    const launcher = document.createElement('button');
    launcher.id = 'medibook-chat-launcher';
    launcher.className = 'medibook-chat-launcher';
    launcher.setAttribute('aria-label', 'Open MediBook Healthcare Assistant');
    launcher.innerHTML = `
      <div class="launcher-icon-wrap" id="launcher-icon">
        <i data-lucide="bot"></i>
        <span class="launcher-pulse-dot"></span>
      </div>
      <div class="launcher-label">
        <span>MediBook AI</span>
        <span class="launcher-sublabel">Healthcare Guide</span>
      </div>
    `;
    document.body.appendChild(launcher);

    // 2. Chat Window Container
    const win = document.createElement('div');
    win.id = 'medibook-chat-window';
    win.className = 'medibook-chat-window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', 'Healthcare AI Assistant Window');
    win.innerHTML = `
      <!-- Header -->
      <div class="chat-header">
        <div class="chat-header-info">
          <div class="chat-bot-avatar">
            <i data-lucide="cross"></i>
            <span class="chat-bot-online-indicator"></span>
          </div>
          <div>
            <h3 class="chat-header-title">MediBook Assistant</h3>
            <div class="chat-header-status">
              <i data-lucide="sparkles" style="width: 11px; height: 11px;"></i>
              <span>AI Clinical Navigator</span>
            </div>
          </div>
        </div>
        <div class="chat-header-actions">
          <button class="chat-header-btn" id="btn-chat-clear" title="Clear Conversation">
            <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
          </button>
          <button class="chat-header-btn" id="btn-chat-minimize" title="Minimize Chat">
            <i data-lucide="minus" style="width: 15px; height: 15px;"></i>
          </button>
          <button class="chat-header-btn" id="btn-chat-close" title="Close Chat">
            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>

      <!-- Messages Body -->
      <div class="chat-body" id="chat-messages-body">
        <!-- Rendered messages -->
      </div>

      <!-- Footer / Input Bar -->
      <div class="chat-footer">
        <form class="chat-input-form" id="chat-input-form">
          <input type="text" id="chat-input-field" class="chat-input-field" 
                 placeholder="Ask about doctors, booking, hospital hours..." autocomplete="off" />
          <button type="submit" id="chat-send-btn" class="chat-send-btn" aria-label="Send message">
            <i data-lucide="send" style="width: 16px; height: 16px;"></i>
          </button>
        </form>
        <div class="chat-disclaimer">
          MediBook AI provides scheduling & administrative guidance, not medical diagnosis. Call 911 in emergencies.
        </div>
      </div>
    `;
    document.body.appendChild(win);

    if (window.lucide) window.lucide.createIcons();
  }

  bindEvents() {
    const launcher = document.getElementById('medibook-chat-launcher');
    const win = document.getElementById('medibook-chat-window');
    const closeBtn = document.getElementById('btn-chat-close');
    const minBtn = document.getElementById('btn-chat-minimize');
    const clearBtn = document.getElementById('btn-chat-clear');
    const form = document.getElementById('chat-input-form');
    const input = document.getElementById('chat-input-field');

    // Toggle Open / Close
    if (launcher) launcher.addEventListener('click', () => this.toggleChat());
    if (closeBtn) closeBtn.addEventListener('click', () => this.toggleChat(false));
    if (minBtn) minBtn.addEventListener('click', () => this.toggleChat(false));

    // Clear Chat
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.messages = [];
        this.bookingState = { active: false, step: null };
        sessionStorage.removeItem(this.STORAGE_KEY);
        const body = document.getElementById('chat-messages-body');
        if (body) body.innerHTML = '';
        this.addMessage('bot', "Conversation cleared. Hello! I'm **MediBook Assistant**. How can I help you today?", {
          suggestions: ["Find a doctor", "Book an appointment", "Check my appointment", "Hospital information", "Pharmacy enquiries"]
        });
      });
    }

    // Form Submit
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input ? input.value.trim() : '';
        if (!text || this.isTyping) return;
        if (input) input.value = '';
        this.handleUserMessage(text);
      });
    }
  }

  toggleChat(forceState = null) {
    const win = document.getElementById('medibook-chat-window');
    const launcher = document.getElementById('medibook-chat-launcher');
    const icon = document.getElementById('launcher-icon');

    this.isOpen = (forceState !== null) ? forceState : !this.isOpen;

    if (this.isOpen) {
      win.classList.add('open');
      icon.innerHTML = '<i data-lucide="chevron-down"></i>';
      setTimeout(() => {
        document.getElementById('chat-input-field')?.focus();
        this.scrollToBottom();
      }, 100);
    } else {
      win.classList.remove('open');
      icon.innerHTML = '<i data-lucide="bot"></i><span class="launcher-pulse-dot"></span>';
    }

    if (window.lucide) window.lucide.createIcons();
  }

  scrollToBottom() {
    const body = document.getElementById('chat-messages-body');
    if (body) {
      body.scrollTop = body.scrollHeight;
    }
  }

  showTyping() {
    this.isTyping = true;
    const body = document.getElementById('chat-messages-body');
    const indicator = document.createElement('div');
    indicator.id = 'chat-typing-row';
    indicator.className = 'chat-message-row';
    indicator.innerHTML = `
      <div class="chat-msg-avatar bot"><i data-lucide="bot" style="width: 14px; height: 14px;"></i></div>
      <div class="chat-typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    body.appendChild(indicator);
    if (window.lucide) window.lucide.createIcons();
    this.scrollToBottom();
  }

  hideTyping() {
    this.isTyping = false;
    const indicator = document.getElementById('chat-typing-row');
    if (indicator) indicator.remove();
  }

  formatMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: var(--primary-600); font-weight: 600; text-decoration: underline;">$1</a>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  addMessage(sender, text, extra = {}) {
    const msg = {
      id: 'msg_' + Date.now() + Math.random().toString(36).substr(2, 4),
      sender,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...extra
    };
    this.messages.push(msg);
    this.saveHistory();
    this.renderMessage(msg);
    this.scrollToBottom();
  }

  renderAllMessages() {
    const body = document.getElementById('chat-messages-body');
    body.innerHTML = '';
    this.messages.forEach(msg => this.renderMessage(msg));
    this.scrollToBottom();
  }

  renderMessage(msg) {
    const body = document.getElementById('chat-messages-body');
    const row = document.createElement('div');
    row.className = `chat-message-row ${msg.sender}`;

    const isBot = msg.sender === 'bot';
    const avatarHtml = isBot
      ? `<div class="chat-msg-avatar bot"><i data-lucide="bot" style="width: 14px; height: 14px;"></i></div>`
      : `<div class="chat-msg-avatar user"><i data-lucide="user" style="width: 14px; height: 14px;"></i></div>`;

    let contentHtml = `<div class="chat-bubble ${msg.sender}">${this.formatMarkdown(msg.text)}</div>`;

    // 1. Render Suggested Question Chips
    if (msg.suggestions && msg.suggestions.length > 0) {
      contentHtml += `
        <div class="chat-suggestions-container">
          ${msg.suggestions.map(s => `
            <button class="chat-suggestion-chip" onclick="window.MediBookChat.sendSuggestion('${s.replace(/'/g, "\\'")}')">
              <i data-lucide="corner-down-right" style="width: 12px; height: 12px;"></i>
              <span>${s}</span>
            </button>
          `).join('')}
        </div>
      `;
    }

    // 2. Render Doctor Cards
    if (msg.doctors && msg.doctors.length > 0) {
      contentHtml += msg.doctors.map(doc => `
        <div class="chat-doctor-card">
          <div class="chat-doctor-header">
            <img src="${doc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=2563eb&color=fff`}" 
                 class="chat-doctor-avatar" alt="${doc.name}" />
            <div class="chat-doctor-info">
              <div class="chat-doctor-name">${doc.name}</div>
              <div class="chat-doctor-dept">${doc.department || 'General Medicine'}</div>
            </div>
          </div>
          <div class="chat-doctor-details">
            <span class="chat-doctor-fee-badge">
              <i data-lucide="tag" style="width: 12px; height: 12px;"></i>
              <strong>$${doc.consultationFee || doc.fee || 100}</strong> / visit
            </span>
            <span>${doc.experienceYears || 5}+ yrs exp</span>
            <span style="color: #f59e0b; font-weight: 700;">★ ${doc.rating || 4.9}</span>
          </div>
          <div class="chat-doctor-actions">
            <button class="btn btn-primary btn-sm" onclick="window.MediBookChat.startDoctorBooking('${doc.id}', '${encodeURIComponent(doc.name)}', '${doc.department || 'General'}', ${doc.consultationFee || doc.fee || 100})">
              <i data-lucide="calendar-plus"></i> Book
            </button>
            <a href="doctor-profile.html?id=${doc.id}" target="_blank" class="btn btn-outline btn-sm">
              Profile
            </a>
          </div>
        </div>
      `).join('');
    }

    // 3. Render Department Option Pills
    if (msg.departmentOptions && msg.departmentOptions.length > 0) {
      contentHtml += `
        <div class="chat-options-grid">
          ${msg.departmentOptions.map(dept => `
            <button class="chat-option-btn" onclick="window.MediBookChat.selectDepartment('${dept.replace(/'/g, "\\'")}')">
              <i data-lucide="check" style="width: 12px; height: 12px;"></i>
              <span>${dept}</span>
            </button>
          `).join('')}
        </div>
      `;
    }

    // 4. Render Date Selection Chips
    if (msg.dateOptions && msg.dateOptions.length > 0) {
      contentHtml += `
        <div class="chat-options-grid">
          ${msg.dateOptions.map(d => `
            <button class="chat-option-btn" onclick="window.MediBookChat.selectDate('${d.dateStr}', '${d.displayLabel}')">
              <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
              <span>${d.displayLabel}</span>
            </button>
          `).join('')}
        </div>
      `;
    }

    // 5. Render Time Slot Chips
    if (msg.slotOptions && msg.slotOptions.length > 0) {
      contentHtml += `
        <div class="chat-options-grid slots">
          ${msg.slotOptions.map(slot => `
            <button class="chat-option-btn" onclick="window.MediBookChat.selectSlot('${slot}')">
              <i data-lucide="clock" style="width: 11px; height: 11px;"></i>
              <span>${slot}</span>
            </button>
          `).join('')}
        </div>
      `;
    }

    // 6. Render Confirmation Card
    if (msg.bookingConfirmation) {
      const conf = msg.bookingConfirmation;
      contentHtml += `
        <div class="chat-confirmation-box">
          <div class="chat-conf-title">
            <i data-lucide="shield-check" style="color: var(--primary-600);"></i>
            <span>Confirm Your Consultation</span>
          </div>
          <div class="chat-conf-row">
            <span>Doctor:</span>
            <strong>${conf.doctorName}</strong>
          </div>
          <div class="chat-conf-row">
            <span>Department:</span>
            <strong>${conf.department}</strong>
          </div>
          <div class="chat-conf-row">
            <span>Date & Time:</span>
            <strong>${conf.date} at ${conf.timeSlot}</strong>
          </div>
          <div class="chat-conf-row">
            <span>Consultation Fee:</span>
            <strong style="color: var(--primary-700); font-size: 0.95rem;">$${conf.consultationFee}</strong>
          </div>
          <div class="chat-conf-actions">
            <button class="btn btn-primary btn-sm" id="chat-btn-confirm-booking" onclick="window.MediBookChat.confirmAppointmentBooking()">
              <i data-lucide="check-circle-2"></i> Confirm Booking
            </button>
            <button class="btn btn-outline btn-sm" onclick="window.MediBookChat.cancelBookingFlow()">
              Cancel
            </button>
          </div>
        </div>
      `;
    }

    // 7. Render Appointment Tracking Cards
    if (msg.appointments && msg.appointments.length > 0) {
      contentHtml += msg.appointments.map(apt => `
        <div class="chat-confirmation-box" style="margin-top: 0.5rem;">
          <div class="flex justify-between items-center" style="margin-bottom: 0.4rem;">
            <span style="font-family: var(--font-mono); font-weight: 700; color: var(--primary-700); font-size: 0.8rem;">
              ${apt.reference || apt.id}
            </span>
            <span class="badge ${apt.status === 'Confirmed' ? 'badge-success' : (apt.status === 'Cancelled' ? 'badge-danger' : 'badge-neutral')} text-xs">
              ${apt.status}
            </span>
          </div>
          <div class="chat-conf-row">
            <span>Physician:</span>
            <strong>${apt.doctorName}</strong>
          </div>
          <div class="chat-conf-row">
            <span>Date & Time:</span>
            <strong>${apt.date} at ${apt.timeSlot}</strong>
          </div>
          ${apt.status === 'Confirmed' || apt.status === 'Pending' ? `
            <div style="margin-top: 0.65rem; border-top: 1px solid var(--slate-100); padding-top: 0.5rem;">
              <button class="btn btn-outline btn-xs text-danger" onclick="window.MediBookChat.promptCancelAppointment('${apt.id}', '${apt.reference || apt.id}')">
                <i data-lucide="x-circle"></i> Cancel Appointment
              </button>
            </div>
          ` : ''}
        </div>
      `).join('');
    }

    // 8. Render Emergency Alert Banner
    if (msg.isEmergency) {
      contentHtml += `
        <div class="chat-emergency-banner">
          <div class="chat-emergency-header">
            <i data-lucide="alert-octagon" style="width: 18px; height: 18px;"></i>
            <span>Life-Threatening Symptoms Detected</span>
          </div>
          <div>Please seek urgent clinical intervention immediately. Call emergency dispatch or our 24/7 hospital helpline:</div>
          <div class="flex gap-2">
            <a href="tel:911" class="chat-emergency-btn">
              <i data-lucide="phone-call" style="width: 14px; height: 14px;"></i> Call 911
            </a>
            <a href="tel:+18004329911" class="chat-emergency-btn" style="background: #b91c1c;">
              <i data-lucide="hospital" style="width: 14px; height: 14px;"></i> +1 (800) 432-9911
            </a>
          </div>
          <div style="margin-top: 0.65rem; border-top: 1px solid #fecaca; padding-top: 0.5rem;">
            <button class="btn btn-sm" style="width: 100%; background: #991b1b; color: #fff; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.45rem; border-radius: var(--radius-md);" onclick="window.MediBookChat.locateEmergencyHospitals()">
              <i data-lucide="navigation" style="width: 14px; height: 14px;"></i> Locate Nearby Emergency Hospitals (< 30 min)
            </button>
          </div>
        </div>
      `;
    }

    // 9. Render Emergency Facility Cards (< 30 min radius)
    if (msg.emergencyFacilities && msg.emergencyFacilities.length > 0) {
      contentHtml += msg.emergencyFacilities.map(fac => `
        <div class="chat-emergency-facility-card">
          <div class="chat-facility-header">
            <div>
              <div class="chat-facility-name">${fac.name}</div>
              <div class="chat-facility-type">${fac.type}</div>
            </div>
          </div>
          <div class="chat-facility-metrics">
            <span class="chat-metric-pill drive">
              <i data-lucide="navigation" style="width: 11px; height: 11px;"></i>
              ${fac.driveTimeMins} min drive (${fac.distanceMiles} mi)
            </span>
            <span class="chat-metric-pill wait">
              <i data-lucide="clock" style="width: 11px; height: 11px;"></i>
              Est. ${fac.waitTimeMins} min wait
            </span>
            <span class="chat-metric-pill open">
              <i data-lucide="activity" style="width: 11px; height: 11px;"></i>
              24/7 ER Active
            </span>
          </div>
          <div class="chat-facility-meta">
            <div><strong>Address:</strong> ${fac.address}</div>
            <div><strong>On-Duty Emergency Lead:</strong> ${fac.onDutyLead}</div>
            <div><strong>Critical Services:</strong> ${(fac.services || []).join(' • ')}</div>
          </div>
          <div class="chat-facility-actions">
            <a href="tel:${(fac.phone || '').replace(/[^0-9+]/g, '')}" class="btn btn-primary btn-sm" style="background: #dc2626; border-color: #dc2626; color: #fff;">
              <i data-lucide="phone-call" style="width: 13px; height: 13px;"></i> Call 24/7 ER
            </a>
            <a href="${fac.mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">
              <i data-lucide="map-pin" style="width: 13px; height: 13px;"></i> Get Directions
            </a>
          </div>
        </div>
      `).join('');
    }

    row.innerHTML = `
      ${avatarHtml}
      <div class="chat-msg-bubble-wrap">
        ${contentHtml}
        <div class="chat-timestamp">${msg.time}</div>
      </div>
    `;

    body.appendChild(row);
    if (window.lucide) window.lucide.createIcons();
  }

  // =========================================================================
  // Core Conversation & AI Engine Handling
  // =========================================================================
  async handleUserMessage(userText) {
    this.addMessage('user', userText);
    this.showTyping();

    // 1. Safety Emergency Triage Check
    const emergencyRegex = /\b(chest pain|heart attack|can't breathe|cannot breathe|difficulty breathing|stroke|loss of consciousness|heavy bleeding|poison|choking|severe trauma|suicide|overdose)\b/i;
    if (emergencyRegex.test(userText)) {
      setTimeout(() => {
        this.hideTyping();
        this.addMessage('bot', "⚠️ **URGENT MEDICAL NOTICE:** If you or someone you are with is experiencing potentially life-threatening symptoms, please call emergency services immediately (**911**) or proceed to the nearest emergency room.\n\nAs an AI assistant, I am not authorized to evaluate emergency medical conditions or provide clinical triage.", {
          isEmergency: true
        });
      }, 400);
      return;
    }

    // 2. Active Conversational Booking State Machine
    if (this.bookingState.active) {
      await this.processBookingStep(userText);
      return;
    }

    // Check if user specifically requested a doctor by name (e.g. "Book Dr. Eleanor Vance")
    const lowerText = userText.toLowerCase();
    const allDoctors = this.findDoctors();
    const matchedDoc = allDoctors.find(d => {
      const bareName = d.name.toLowerCase().replace(/^dr\.?\s+/i, '');
      return lowerText.includes(d.name.toLowerCase()) || lowerText.includes(bareName);
    });
    if (matchedDoc && (lowerText.includes('book') || lowerText.includes('select') || lowerText.includes('choose'))) {
      setTimeout(() => {
        this.hideTyping();
        this.startDoctorBooking(matchedDoc.id, encodeURIComponent(matchedDoc.name), matchedDoc.department, matchedDoc.consultationFee || matchedDoc.fee || 100);
      }, 350);
      return;
    }

    // 3. Delegate to /api/chat Backend (with Local NLP Fallback)
    const currentUser = window.AuthService ? window.AuthService.getCurrentUser() : null;
    let responseData = null;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: this.messages.slice(-6),
          user: currentUser,
          context: {
            page: window.location.pathname,
            hospital: window.AdminService ? window.AdminService.getHospitalSettings().hospitalName : 'Metropolitan Central Hospital'
          }
        })
      });

      if (res.ok) {
        responseData = await res.json();
      }
    } catch (netErr) {
      // Backend not running on this port (e.g. static python server), use client NLP engine
    }

    if (!responseData) {
      responseData = this.localNLPEngine(userText, currentUser);
    }

    setTimeout(() => {
      this.hideTyping();
      this.handleActionResponse(responseData);
    }, 450);
  }

  handleActionResponse(res) {
    if (res.action === 'show_doctors') {
      const doctors = this.findDoctors(res.filter || {});
      this.addMessage('bot', res.reply, {
        doctors: doctors.slice(0, 3),
        suggestions: ["Book an appointment", "Other departments", "Hospital information"]
      });
    } else if (res.action === 'show_departments' || res.intent === 'booking_flow') {
      this.bookingState = { active: true, step: 'awaiting_department' };
      const depts = this.getAvailableDepartments();
      this.addMessage('bot', res.reply, {
        departmentOptions: depts
      });
    } else if (res.action === 'show_my_appointments') {
      const apts = this.getCurrentUserAppointments();
      if (apts.length === 0) {
        this.addMessage('bot', "You do not currently have any scheduled appointments on file. Would you like to book one today?", {
          suggestions: ["Book an appointment", "Find a doctor", "Hospital information"]
        });
      } else {
        this.addMessage('bot', res.reply, {
          appointments: apts.slice(0, 4),
          suggestions: ["Book another appointment", "Hospital contact", "Clear chat"]
        });
      }
    } else if (res.action === 'show_emergency_hospitals' || res.intent === 'emergency_locator') {
      const facilities = res.emergencyFacilities || this.getEmergencyFacilities();
      this.addMessage('bot', res.reply, {
        emergencyFacilities: facilities,
        suggestions: ["Call 911 dispatch", "Check another symptom", "Hospital information"]
      });
    } else if (res.action === 'show_cancellable_appointments') {
      const apts = this.getCurrentUserAppointments().filter(a => a.status === 'Confirmed' || a.status === 'Pending');
      if (apts.length === 0) {
        this.addMessage('bot', "You do not have any active or confirmed appointments eligible for cancellation.");
      } else {
        this.addMessage('bot', res.reply, {
          appointments: apts
        });
      }
    } else {
      this.addMessage('bot', res.reply, {
        suggestions: res.suggestions || ["Find a doctor", "Book an appointment", "Hospital information", "Pharmacy enquiries"]
      });
    }
  }

  // =========================================================================
  // Symptom Analysis & Clinical Specialty Recommendation Engine
  // =========================================================================
  detectSymptomAndRecommend(text) {
    const lower = text.toLowerCase();

    // 1. Headache / Migraine / Neurological
    if (/\b(headache|headaches|head\s*ache|head\s*aches|migraine|migraines|head\s*pain|throbbing\s*head|dizziness|vertigo|nerve\s*pain|numbness|tingling|seizure|seizures|brain\s*fog|concussion)\b/i.test(lower)) {
      return {
        symptom: "Headache / Neurological Discomfort",
        recommendedDepts: ["Neurology", "General Medicine"],
        rationale: "Headaches and chronic migraines are best evaluated by our **Neurology** faculty to examine neurovascular causes and pain management. For primary screening or tension headaches, a **General Medicine** physician can also conduct an initial assessment."
      };
    }

    // 2. Stomach / Abdominal / Digestive
    if (/\b(stomach|stomac|abdomen|abdominal|belly|tummy|gut)\s*(pain|ache|hurt|hurts|cramp|cramps|upset|burning|discomfort)?\b|\b(gastric|gastritis|acidity|acid\s*reflux|heartburn|indigestion|bloating|nausea|vomiting|vomit|diarrhea|diarrhoea|loose\s*motion|constipation|food\s*poisoning)\b/i.test(lower)) {
      return {
        symptom: "Stomach Pain / Digestive & Abdominal Discomfort",
        recommendedDepts: ["General Medicine"],
        rationale: "For stomach pain, gastritis, acid reflux, or abdominal distress, our **General Medicine** (Internal Medicine) specialists are best equipped to perform clinical abdominal exams, run digestive diagnostics, and prescribe targeted medical care."
      };
    }

    // 3. Skin / Hair / Dermatology
    if (/\b(skin\s*rash|rash|rashes|acne|pimple|pimples|eczema|psoriasis|itching|itchy|hives|skin\s*allergy|mole|moles|hair\s*fall|hair\s*loss|dandruff|scalp|dermatitis|skin\s*infection|dry\s*skin)\b/i.test(lower)) {
      return {
        symptom: "Skin Eruptions / Dermatological Symptoms",
        recommendedDepts: ["Dermatology"],
        rationale: "For skin rashes, acne, eczema, or scalp conditions, our board-certified **Dermatology** faculty provides clinical dermoscopy, allergy assessments, and tailored dermatological therapies."
      };
    }

    // 4. Bones / Joints / Musculoskeletal (Orthopedics)
    if (/\b(back\s*pain|lower\s*back|spine\s*pain|neck\s*pain|knee\s*pain|joint\s*pain|shoulder\s*pain|hip\s*pain|ankle\s*pain|wrist\s*pain|arthritis|sprain|strain|fracture|broken\s*bone|bone\s*pain|swollen\s*joint|swollen\s*knee|ligament|muscle\s*tear|sports\s*injury)\b/i.test(lower)) {
      return {
        symptom: "Joint, Spine & Musculoskeletal Pain",
        recommendedDepts: ["Orthopedics"],
        rationale: "For back pain, knee issues, joint stiffness, or sports injuries, our **Orthopedics & Sports Medicine** specialists evaluate joint mobility, review musculoskeletal imaging, and formulate rehabilitation plans."
      };
    }

    // 5. Non-Emergency Cardiac / Heart
    if (/\b(palpitations|heart\s*racing|racing\s*pulse|rapid\s*heart|high\s*blood\s*pressure|hypertension|high\s*cholesterol|irregular\s*heartbeat|fluttering\s*heart)\b/i.test(lower)) {
      return {
        symptom: "Cardiovascular & Heart Rhythm Symptoms",
        recommendedDepts: ["Cardiology"],
        rationale: "For heart palpitations, blood pressure irregularities, or cardiac risk reviews, consultation with a **Cardiologist** is recommended for ECG, echocardiograms, and preventative heart care."
      };
    }

    // 6. Dental / Teeth
    if (/\b(toothache|tooth\s*ache|tooth\s*pain|teeth\s*pain|cavity|cavities|gum\s*bleed|bleeding\s*gums|swollen\s*gum|wisdom\s*tooth|broken\s*tooth|jaw\s*pain|dental\s*pain|sensitive\s*teeth|teeth\s*cleaning)\b/i.test(lower)) {
      return {
        symptom: "Dental Pain & Oral Health",
        recommendedDepts: ["Dentistry"],
        rationale: "For toothaches, gum inflammation, or oral pain, our **Dentistry** faculty offers comprehensive restorative care, digital dental imaging, and pain-relief procedures."
      };
    }

    // 7. Pediatrics / Child Illness
    if (/\b(child|baby|infant|toddler|kid|newborn)\b.*\b(fever|sick|cough|cold|vomit|pain|rash|unwell|vaccination|checkup)\b|\b(pediatric|pediatrician)\b/i.test(lower)) {
      return {
        symptom: "Pediatric & Child Health Concern",
        recommendedDepts: ["Pediatrics"],
        rationale: "For illnesses, infections, or developmental concerns affecting infants and children, our **Pediatrics** department offers gentle, specialized clinical care."
      };
    }

    // 8. Women's Health / Gynecology
    if (/\b(period\s*pain|menstrual\s*cramps|missed\s*period|irregular\s*period|pregnancy|pregnant|prenatal|pcos|pelvic\s*pain|vaginal|yeast\s*infection|hot\s*flashes|menopause|fertility)\b/i.test(lower)) {
      return {
        symptom: "Women's Health & Gynecological Symptoms",
        recommendedDepts: ["Gynecology"],
        rationale: "For menstrual irregularities, pelvic pain, or prenatal health, consultation with a board-certified **Gynecologist & Obstetrician (OB/GYN)** is recommended."
      };
    }

    // 9. General Fever / Cold / Infection
    if (/\b(fever|high\s*fever|cold|cough|flu|sore\s*throat|throat\s*pain|runny\s*nose|fatigue|body\s*ache|weakness|chills|infection|feeling\s*sick|unwell)\b/i.test(lower)) {
      return {
        symptom: "Fever, Cold / Flu & General Malaise",
        recommendedDepts: ["General Medicine"],
        rationale: "For fever, coughs, viral infections, or general body fatigue, our **General Medicine** physicians conduct clinical examinations, order lab diagnostics, and prescribe recovery treatment."
      };
    }

    // 10. Eye / Vision
    if (/\b(eye\s*pain|blurred\s*vision|blurry\s*vision|red\s*eye|pink\s*eye|eye\s*irritation)\b/i.test(lower)) {
      return {
        symptom: "Eye & Vision Discomfort",
        recommendedDepts: ["General Medicine"],
        rationale: "For acute eye discomfort or visual changes, an initial evaluation with a **General Medicine** clinician is recommended for primary screening and ophthalmology referral."
      };
    }

    return null;
  }

  // =========================================================================
  // Client-Side Intelligent NLP Engine (When backend proxy is unreachable)
  // =========================================================================
  localNLPEngine(text, user) {
    const lower = text.toLowerCase();

    // 1. Cancellation intent
    if (lower.includes('cancel') && (lower.includes('appointment') || lower.includes('booking') || lower.includes('visit'))) {
      if (!user) {
        return {
          reply: "Please log in to your patient account to manage and cancel bookings: [Patient Login](auth/login.html).",
          intent: 'auth_required'
        };
      }
      return {
        reply: "You can cancel any confirmed appointment if notice is provided in accordance with hospital policy (minimum 24 hours notice). Here are your active bookings:",
        intent: 'cancellation_request',
        action: 'show_cancellable_appointments'
      };
    }

    // 2. Appointment tracking
    if (lower.includes('my appointment') || lower.includes('check appointment') || lower.includes('my bookings') || 
        (lower.includes('status') && (lower.includes('appointment') || lower.includes('booking')))) {
      if (!user) {
        return {
          reply: "To inspect your appointment history or check a booking's status, please sign in to your MediBook account: [Patient Login](auth/login.html).",
          intent: 'auth_required'
        };
      }
      return {
        reply: `Here are your consultations on record, **${user.displayName || 'Patient'}**:`,
        intent: 'appointment_tracking',
        action: 'show_my_appointments'
      };
    }

    // 3. Emergency Hospital & 30-min Urgent Care Finder
    const is30MinQuery = /\b(30\s*min|30\s*minute|30\s*mins|30\s*minutes|thirty\s*min|within\s*30)\b/i.test(lower);
    const isNearbyQuery = /\b(near|nearby|near\s*by|closest|nearest|around\s*me|near\s*me)\b/i.test(lower);
    const isEmergencyFacility = /\b(emergency|urgent|urgent\s*care|er\b|trauma|ambulance)\b/i.test(lower);
    const isMedicalEntity = /\b(hospital|hospitals|clinic|clinics|doctor|doctors|doc|docs|center|centers|facility|facilities)\b/i.test(lower);

    if (is30MinQuery || (isEmergencyFacility && (isNearbyQuery || isMedicalEntity)) || (isNearbyQuery && isMedicalEntity)) {
      const facilities = this.getEmergencyFacilities();
      return {
        reply: "🚨 **Accredited 24/7 Emergency Hospitals & Urgent Care Centers (< 30 min drive)**\n\nHere are verified hospital emergency rooms within a 30-minute radius with live drive times, estimated ER wait times, on-duty emergency physicians, and 1-click turn-by-turn directions.\n\n*If you cannot travel safely, please call **911** immediately for emergency dispatch:*",
        intent: 'emergency_locator',
        action: 'show_emergency_hospitals',
        emergencyFacilities: facilities,
        suggestions: ["Call 911 dispatch", "Check symptoms", "Hospital information"]
      };
    }

    // 4. Symptom Analysis & Doctor Recommendation (Headache, Stomach pain, etc.)
    const symptomRec = this.detectSymptomAndRecommend(text);
    if (symptomRec) {
      const docs = this.findDoctors({ departments: symptomRec.recommendedDepts });
      const feeListText = docs.map(d => `• **${d.name}** (${d.department}, ${d.experienceYears || 5} yrs exp) – **$${d.consultationFee || d.fee || 100} / visit**`).join('\n');
      const deptsDisplay = symptomRec.recommendedDepts.join(' or ');

      return {
        reply: `Based on your described symptoms (**${symptomRec.symptom}**), our AI clinical navigator recommends consulting a specialist in **${deptsDisplay}**.\n\n${symptomRec.rationale}\n\nHere are the best matching doctors along with their consultation fees so you can compare and decide:\n${feeListText}\n\n*Review their profiles or select **Book** on any card below to schedule your consultation:*`,
        intent: 'symptom_recommendation',
        action: 'show_doctors',
        filter: { departments: symptomRec.recommendedDepts },
        symptom: symptomRec.symptom,
        suggestions: docs.slice(0, 2).map(d => `Book ${d.name}`).concat(["Check other symptoms", "Hospital information"])
      };
    }

    // 4. Booking flow
    if (lower.includes('book') || lower.includes('schedule') || lower.includes('make an appointment') || lower.includes('reserve')) {
      return {
        reply: "I'd be delighted to help you schedule a consultation! To get started, please select which medical department you require:",
        intent: 'booking_flow',
        action: 'show_departments'
      };
    }

    // 4. Doctor search
    if (lower.includes('doctor') || lower.includes('specialist') || lower.includes('cardiologist') || 
        lower.includes('dermatologist') || lower.includes('neurologist') || lower.includes('orthopedic') ||
        lower.includes('pediatrician') || lower.includes('dentist') || lower.includes('find') || lower.includes('search')) {
      
      let dept = null;
      if (lower.includes('cardio')) dept = 'Cardiology';
      else if (lower.includes('derma')) dept = 'Dermatology';
      else if (lower.includes('neuro')) dept = 'Neurology';
      else if (lower.includes('ortho')) dept = 'Orthopedics';
      else if (lower.includes('pedia') || lower.includes('child')) dept = 'Pediatrics';
      else if (lower.includes('dent')) dept = 'Dentistry';

      let maxFee = null;
      const feeMatch = lower.match(/(?:below|under|less than|\$)\s*(\d+)/i);
      if (feeMatch) maxFee = parseInt(feeMatch[1], 10);

      return {
        reply: dept 
          ? `Here are our verified specialists in **${dept}**${maxFee ? ` with fees under $${maxFee}` : ''}. You can view their credentials or book below:`
          : `We have accredited physicians across 8 clinical departments. Here are some of our top specialists:`,
        intent: 'doctor_search',
        action: 'show_doctors',
        filter: { department: dept, maxFee }
      };
    }

    // 5. Hospital FAQ
    if (lower.includes('hour') || lower.includes('timing') || lower.includes('open') || lower.includes('address') || 
        lower.includes('phone') || lower.includes('contact') || lower.includes('location')) {
      const s = window.AdminService ? window.AdminService.getHospitalSettings() : {};
      return {
        reply: `**${s.hospitalName || 'Metropolitan Central Hospital'}**\n\n• **Address:** ${s.address || '500 Healthcare Boulevard, Suite 400, San Francisco, CA'}\n• **General Inquiries:** ${s.phone || '+1 (800) 432-6334'}\n• **Emergency 24/7:** ${s.emergencyHotline || '+1 (800) 432-9911'}\n• **Hours:** ${s.workingHours || 'Mon – Sat: 08:00 AM – 08:00 PM'}\n• **Accreditations:** Joint Commission International (JCI), HIPAA Compliant.`,
        intent: 'hospital_faq'
      };
    }

    // 5. Pharmacy enquiries
    if (lower.includes('pharmacy') || lower.includes('medicine') || lower.includes('stock') || lower.includes('prescription')) {
      return {
        reply: `**MediBook Central Outpatient Pharmacy**\n\n• **Hours:** Monday – Saturday: 08:00 AM – 08:00 PM\n• **Prescriptions:** Upload orders directly via the [Pharmacy Portal](pharmacy.html) for rapid preparation.\n• **Safety:** I cannot recommend prescription dosages or advise altering medication. Would you like to check current medicine stock?`,
        intent: 'pharmacy_enquiry',
        suggestions: ["Find a doctor", "Hospital information", "Book an appointment"]
      };
    }

    // 6. Greetings
    if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
      return {
        reply: "Hello! I'm **MediBook Assistant**, your AI clinical and scheduling navigator. How may I assist you today?",
        suggestions: ["Find a doctor", "Book an appointment", "Check my appointment", "Hospital information", "Pharmacy enquiries"]
      };
    }

    return {
      reply: "I'm here to assist you with finding specialist doctors, scheduling appointments, checking your consultation records, or providing hospital details. How can I help you?",
      suggestions: ["Find a doctor", "Book an appointment", "Check my appointment", "Hospital information"]
    };
  }

  // =========================================================================
  // Multi-Step Conversational Booking Wizard
  // =========================================================================
  selectDepartment(dept) {
    this.addMessage('user', `I choose ${dept}`);
    this.bookingState.department = dept;
    this.bookingState.step = 'awaiting_doctor';
    this.showTyping();

    setTimeout(() => {
      this.hideTyping();
      const docs = this.findDoctors({ department: dept });
      if (docs.length === 0) {
        this.addMessage('bot', `Currently, no physicians are listed under ${dept}. Would you like to choose another department?`, {
          departmentOptions: this.getAvailableDepartments()
        });
      } else {
        this.addMessage('bot', `Here are the available specialists in **${dept}**. Please select a doctor:`, {
          doctors: docs
        });
      }
    }, 400);
  }

  startDoctorBooking(doctorId, encName, dept, fee) {
    const docName = decodeURIComponent(encName);
    this.bookingState.active = true;
    this.bookingState.doctorId = doctorId;
    this.bookingState.doctorName = docName;
    this.bookingState.department = dept;
    this.bookingState.consultationFee = fee;
    this.bookingState.step = 'awaiting_date';

    this.addMessage('user', `Select ${docName}`);
    this.showTyping();

    setTimeout(() => {
      this.hideTyping();
      const dates = this.getNextAvailableDates(doctorId);
      this.addMessage('bot', `Great! Dr. **${docName}** conducts consultations on the following dates. Which date would you prefer?`, {
        dateOptions: dates
      });
    }, 400);
  }

  selectDate(dateStr, displayLabel) {
    this.bookingState.date = dateStr;
    this.bookingState.step = 'awaiting_slot';
    this.addMessage('user', `Date: ${displayLabel}`);
    this.showTyping();

    setTimeout(() => {
      this.hideTyping();
      const slots = this.getAvailableSlots(this.bookingState.doctorId, dateStr);
      this.addMessage('bot', `Available consultation slots for **${displayLabel}**:`, {
        slotOptions: slots
      });
    }, 400);
  }

  selectSlot(slot) {
    this.bookingState.timeSlot = slot;
    this.bookingState.step = 'awaiting_confirmation';
    this.addMessage('user', `Time slot: ${slot}`);
    this.showTyping();

    setTimeout(() => {
      this.hideTyping();
      this.addMessage('bot', `Please review and confirm your consultation details:`, {
        bookingConfirmation: {
          doctorName: this.bookingState.doctorName,
          department: this.bookingState.department,
          date: this.bookingState.date,
          timeSlot: this.bookingState.timeSlot,
          consultationFee: this.bookingState.consultationFee
        }
      });
    }, 400);
  }

  async confirmAppointmentBooking() {
    const currentUser = window.AuthService ? window.AuthService.getCurrentUser() : null;

    if (!currentUser) {
      this.addMessage('bot', "⚠️ **Login Required:** To confirm your appointment in the hospital records, please sign in to your patient account or create one: [Sign In / Register](auth/login.html). Your selected slot will be held temporarily.");
      return;
    }

    this.showTyping();
    const btn = document.getElementById('chat-btn-confirm-booking');
    if (btn) btn.disabled = true;

    try {
      const res = await window.AppointmentService.bookAppointment({
        doctorId: this.bookingState.doctorId,
        doctorName: this.bookingState.doctorName,
        department: this.bookingState.department,
        consultationFee: this.bookingState.consultationFee,
        date: this.bookingState.date,
        timeSlot: this.bookingState.timeSlot,
        mode: this.bookingState.mode || 'in-person',
        patientName: currentUser.displayName || 'Patient',
        patientEmail: currentUser.email,
        patientPhone: currentUser.phone || '+1 (555) 000-0000',
        reason: 'Consultation requested via MediBook AI Assistant'
      });

      this.hideTyping();
      if (res.success) {
        const ref = res.appointment.reference || res.appointment.id;
        this.addMessage('bot', `🎉 **Appointment Confirmed!**\n\nYour consultation has been reserved successfully in the hospital ledger.\n\n• **Booking Reference:** \`${ref}\`\n• **Physician:** Dr. ${this.bookingState.doctorName}\n• **Date & Time:** ${this.bookingState.date} at ${this.bookingState.timeSlot}\n• **Department:** ${this.bookingState.department}\n• **Status:** Confirmed\n\nA confirmation has been synced with your Patient Portal.`, {
          suggestions: ["Check my appointment", "Find another doctor", "Hospital information"]
        });
        this.bookingState = { active: false, step: null };
      } else {
        this.addMessage('bot', `⚠️ Could not confirm appointment: ${res.error || 'The slot may have just been booked. Please choose an alternate slot.'}`, {
          suggestions: ["Book an appointment", "Find a doctor"]
        });
      }
    } catch (e) {
      this.hideTyping();
      this.addMessage('bot', "⚠️ An unexpected error occurred while reserving your slot. Please try again or use the online booking wizard: [Book Online](portal/patient/book-appointment.html).");
    }
  }

  cancelBookingFlow() {
    this.bookingState = { active: false, step: null };
    this.addMessage('user', "Cancel booking");
    this.addMessage('bot', "Booking cancelled. How else may I assist you today?", {
      suggestions: ["Find a doctor", "Book an appointment", "Hospital information"]
    });
  }

  promptCancelAppointment(aptId, ref) {
    if (confirm(`Are you sure you want to cancel appointment ${ref}? This will notify the physician and release the reserved time slot.`)) {
      this.executeCancellation(aptId, ref);
    }
  }

  async executeCancellation(aptId, ref) {
    this.showTyping();
    const res = await window.AppointmentService.cancelAppointment(aptId, "Cancelled via MediBook AI Assistant");
    this.hideTyping();

    if (res.success) {
      this.addMessage('bot', `✓ **Appointment Cancelled:** Consultation \`${ref}\` has been cancelled and removed from active schedules in compliance with hospital policy.`);
    } else {
      this.addMessage('bot', `⚠️ Could not cancel appointment: ${res.error || 'Notice policy violation or appointment already completed.'}`);
    }
  }

  locateEmergencyHospitals() {
    this.showTyping();
    const facilities = this.getEmergencyFacilities();

    setTimeout(() => {
      this.hideTyping();
      this.addMessage('bot', "🚨 **Accredited 24/7 Emergency Hospitals & Urgent Care Centers (< 30 min drive)**\n\nHere are verified hospital emergency rooms within a 30-minute radius with live drive times, estimated ER wait times, on-duty emergency physicians, and 1-click turn-by-turn directions.\n\n*If you cannot travel safely, please call **911** immediately for emergency dispatch:*", {
        emergencyFacilities: facilities,
        suggestions: ["Call 911 dispatch", "Check another symptom", "Hospital information"]
      });
    }, 400);
  }

  getEmergencyFacilities() {
    if (window.MEDIBOOK_DATA && window.MEDIBOOK_DATA.emergencyFacilities) {
      return window.MEDIBOOK_DATA.emergencyFacilities;
    }
    return [
      {
        id: "er_001",
        name: "Metropolitan Central Hospital & Level 1 Trauma Center",
        type: "Level 1 Emergency & Trauma Hospital",
        driveTimeMins: 12,
        distanceMiles: 3.2,
        address: "500 Healthcare Boulevard, Suite 100, San Francisco, CA 94107",
        phone: "+1 (800) 432-9911",
        directDispatch: "+1 (415) 555-0199",
        waitTimeMins: 8,
        isOpen247: true,
        onDutyLead: "Dr. Alexander Wright, MD (Trauma & Cardiac Care Lead)",
        services: ["24/7 Level 1 Trauma", "Emergency Cardiac Cath Lab", "Comprehensive Stroke Center", "ICU Resuscitation"],
        mapsUrl: "https://maps.google.com/?q=500+Healthcare+Blvd+San+Francisco+CA"
      },
      {
        id: "er_002",
        name: "St. Jude Neuroscience & Emergency Pavilion",
        type: "24/7 Comprehensive Emergency Center",
        driveTimeMins: 18,
        distanceMiles: 5.8,
        address: "720 Sutter Street, Level 1 ER, San Francisco, CA 94109",
        phone: "+1 (800) 432-9922",
        directDispatch: "+1 (415) 555-0144",
        waitTimeMins: 12,
        isOpen247: true,
        onDutyLead: "Dr. Eleanor Vance, MD, PhD (Neuro & Acute Care)",
        services: ["Acute Stroke Intervention", "Advanced CT/MRI Emergency Scans", "Pediatric Emergency Pod"],
        mapsUrl: "https://maps.google.com/?q=720+Sutter+Street+San+Francisco+CA"
      },
      {
        id: "er_003",
        name: "Bayview Urgent Care & Immediate Walk-in Center",
        type: "Acute Urgent Care (<30 min drive)",
        driveTimeMins: 24,
        distanceMiles: 8.1,
        address: "300 Olympic Boulevard, Pavilion 2B, San Jose / South Bay, CA",
        phone: "+1 (800) 432-9933",
        directDispatch: "+1 (408) 555-0188",
        waitTimeMins: 5,
        isOpen247: true,
        onDutyLead: "Dr. Rachel Adams, MD (Orthopedic & Laceration Trauma)",
        services: ["Walk-in Acute Illness", "Fracture Castings & Digital X-Ray", "Wound Suturing", "IV Hydration"],
        mapsUrl: "https://maps.google.com/?q=300+Olympic+Boulevard+San+Jose+CA"
      }
    ];
  }

  sendSuggestion(prompt) {
    const input = document.getElementById('chat-input-field');
    if (input) input.value = prompt;
    this.handleUserMessage(prompt);
  }

  // =========================================================================
  // Data Helpers
  // =========================================================================
  findDoctors(filters = {}) {
    let docs = [];
    if (window.AdminService) {
      docs = window.AdminService.getDoctors();
    } else if (window.MEDIBOOK_DATA) {
      docs = window.MEDIBOOK_DATA.doctors;
    }

    return docs.filter(d => {
      const active = d.status === 'Active' || !d.status;
      let deptMatch = true;
      if (filters.departments && Array.isArray(filters.departments)) {
        deptMatch = filters.departments.some(dept => dept.toLowerCase() === (d.department || '').toLowerCase());
      } else if (filters.department) {
        deptMatch = (d.department || '').toLowerCase() === filters.department.toLowerCase();
      }
      const fee = d.consultationFee || d.fee || 100;
      const feeMatch = !filters.maxFee || fee <= filters.maxFee;
      return active && deptMatch && feeMatch;
    });
  }

  getAvailableDepartments() {
    if (window.AdminService) {
      return window.AdminService.getDepartments().filter(d => d.status === 'Active').map(d => d.name);
    }
    return ["Cardiology", "Dermatology", "Neurology", "Orthopedics", "Pediatrics", "Dentistry", "General Medicine"];
  }

  getNextAvailableDates(doctorId) {
    const docs = this.findDoctors();
    const doc = docs.find(d => d.id === doctorId) || {};
    const days = doc.availableDays || ["Monday", "Wednesday", "Friday"];

    const dates = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const weekday = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
      
      if (days.includes(weekday)) {
        dates.push({
          dateStr,
          displayLabel: new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        });
        if (dates.length >= 4) break;
      }
    }
    return dates;
  }

  getAvailableSlots(doctorId, dateStr) {
    const docs = this.findDoctors();
    const doc = docs.find(d => d.id === doctorId) || {};
    const slots = doc.availableSlots || ["09:00 AM", "10:30 AM", "02:00 PM", "03:30 PM"];

    // Check against existing booked locks
    const appointments = window.AdminService ? window.AdminService.getAllAppointments() : [];
    const booked = appointments
      .filter(a => a.doctorId === doctorId && a.date === dateStr && a.status !== 'Cancelled' && a.status !== 'Rejected')
      .map(a => a.timeSlot);

    return slots.filter(s => !booked.includes(s));
  }

  getCurrentUserAppointments() {
    const user = window.AuthService ? window.AuthService.getCurrentUser() : null;
    if (!user) return [];

    if (window.AdminService) {
      return window.AdminService.getPatientAppointments(user.email, user.uid || user.id);
    }
    return [];
  }
}

// Export globally
window.MediBookChatbot = MediBookChatbot;

// Auto-instantiate when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.MediBookChat = new MediBookChatbot();
});
