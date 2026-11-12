/**
 * MediBook Appointment Booking & Management Service
 * Implements atomic slot reservation, cancellation rules, doctor schedule validation,
 * doctor-specific queries, status transitions (confirm, reject, complete), and Firestore / LocalStore bridge.
 */

class AppointmentService {
  constructor() {
    this.STORAGE_KEY = 'medibook_appointments';
    this.LOCK_KEY = 'medibook_slot_locks';
    this.VERSION_KEY = 'medibook_appointments_v4_doctor_ready';
    this.initStorage();
  }

  /**
   * Initialize local dataset with realistic patient records if empty or outdated
   */
  initStorage() {
    const isVersioned = localStorage.getItem(this.VERSION_KEY);
    const existing = localStorage.getItem(this.STORAGE_KEY);

    if (!existing || !isVersioned) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const makeDate = (offsetDays) => {
        const d = new Date(now);
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().split('T')[0];
      };

      const initialAppointments = [
        // --- TODAY'S APPOINTMENTS FOR DR. ALEXANDER WRIGHT (doc_001) ---
        {
          id: "apt_1010",
          reference: "MB-2026-9011",
          patientId: "patient_001",
          patientName: "Sarah Jenkins",
          patientEmail: "patient@medibook.com",
          patientPhone: "+1 (555) 234-5678",
          doctorId: "doc_001",
          doctorName: "Dr. Alexander Wright",
          doctorAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
          specialization: "Cardiology",
          department: "Cardiology",
          hospital: "Metropolitan Central Hospital",
          clinicLocation: "Tower A, 3rd Floor, Suite 302",
          date: todayStr,
          timeSlot: "09:00 AM",
          consultationFee: 120,
          mode: "in-person",
          reason: "Routine cardiovascular checkup and ECG review",
          notes: "Patient reports occasional mild palpitations after cardio workouts.",
          status: "Confirmed",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: "apt_1011",
          reference: "MB-2026-9012",
          patientId: "patient_002",
          patientName: "Michael Chang",
          patientEmail: "michael.chang@example.com",
          patientPhone: "+1 (555) 345-9871",
          doctorId: "doc_001",
          doctorName: "Dr. Alexander Wright",
          doctorAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
          specialization: "Cardiology",
          department: "Cardiology",
          hospital: "Metropolitan Central Hospital",
          clinicLocation: "Tower A, 3rd Floor, Suite 302",
          date: todayStr,
          timeSlot: "11:30 AM",
          consultationFee: 120,
          mode: "in-person",
          reason: "Hypertension management & ACE inhibitor titration",
          notes: "Blood pressure reading last week averaged 142/88 mmHg.",
          status: "Confirmed",
          createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
        },
        {
          id: "apt_1012",
          reference: "MB-2026-9013",
          patientId: "patient_003",
          patientName: "Emily Watson",
          patientEmail: "emily.watson@example.com",
          patientPhone: "+1 (555) 876-1234",
          doctorId: "doc_001",
          doctorName: "Dr. Alexander Wright",
          doctorAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
          specialization: "Cardiology",
          department: "Cardiology",
          hospital: "Metropolitan Central Hospital",
          clinicLocation: "Tower A, 3rd Floor, Suite 302",
          date: todayStr,
          timeSlot: "02:30 PM",
          consultationFee: 120,
          mode: "video",
          reason: "Mild chest tightness upon climbing stairs",
          notes: "Patient requests telehealth evaluation before in-person stress test.",
          status: "Pending",
          createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
        },
        {
          id: "apt_1013",
          reference: "MB-2026-9014",
          patientId: "patient_004",
          patientName: "David Miller",
          patientEmail: "david.miller@example.com",
          patientPhone: "+1 (555) 456-7890",
          doctorId: "doc_001",
          doctorName: "Dr. Alexander Wright",
          doctorAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
          specialization: "Cardiology",
          department: "Cardiology",
          hospital: "Metropolitan Central Hospital",
          clinicLocation: "Tower A, 3rd Floor, Suite 302",
          date: todayStr,
          timeSlot: "04:00 PM",
          consultationFee: 120,
          mode: "in-person",
          reason: "Annual executive cardiac risk screening",
          notes: "Family history of coronary artery disease.",
          status: "Confirmed",
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
        },

        // --- UPCOMING APPOINTMENTS FOR DR. ALEXANDER WRIGHT ---
        {
          id: "apt_1001",
          reference: "MB-2026-8842",
          patientId: "patient_001",
          patientName: "Sarah Jenkins",
          patientEmail: "patient@medibook.com",
          patientPhone: "+1 (555) 234-5678",
          doctorId: "doc_001",
          doctorName: "Dr. Alexander Wright",
          doctorAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
          specialization: "Cardiology",
          department: "Cardiology",
          hospital: "Metropolitan Central Hospital",
          clinicLocation: "Tower A, 3rd Floor, Suite 302",
          date: makeDate(1),
          timeSlot: "10:30 AM",
          consultationFee: 120,
          mode: "in-person",
          reason: "Echocardiogram follow-up consultation",
          notes: "Review echo doppler imaging results.",
          status: "Confirmed",
          createdAt: new Date(Date.now() - 3600000 * 30).toISOString()
        },
        {
          id: "apt_1014",
          reference: "MB-2026-9015",
          patientId: "patient_005",
          patientName: "Robert Henderson",
          patientEmail: "robert.henderson@example.com",
          patientPhone: "+1 (555) 654-3210",
          doctorId: "doc_001",
          doctorName: "Dr. Alexander Wright",
          doctorAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
          specialization: "Cardiology",
          department: "Cardiology",
          hospital: "Metropolitan Central Hospital",
          clinicLocation: "Tower A, 3rd Floor, Suite 302",
          date: makeDate(2),
          timeSlot: "09:30 AM",
          consultationFee: 120,
          mode: "in-person",
          reason: "24-Hour Holter monitor review",
          notes: "Holter completed on Monday. Patient feels occasional skipped beats.",
          status: "Pending",
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
          id: "apt_1015",
          reference: "MB-2026-9016",
          patientId: "patient_006",
          patientName: "Amanda Brooks",
          patientEmail: "amanda.brooks@example.com",
          patientPhone: "+1 (555) 789-0123",
          doctorId: "doc_001",
          doctorName: "Dr. Alexander Wright",
          doctorAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
          specialization: "Cardiology",
          department: "Cardiology",
          hospital: "Metropolitan Central Hospital",
          clinicLocation: "Tower A, 3rd Floor, Suite 302",
          date: makeDate(4),
          timeSlot: "03:00 PM",
          consultationFee: 120,
          mode: "video",
          reason: "Telemetry review and preventative counseling",
          notes: "Follow up after lifestyle diet modification.",
          status: "Confirmed",
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
        },
        {
          id: "apt_1016",
          reference: "MB-2026-9017",
          patientId: "patient_007",
          patientName: "James Wilson",
          patientEmail: "james.wilson@example.com",
          patientPhone: "+1 (555) 890-1234",
          doctorId: "doc_001",
          doctorName: "Dr. Alexander Wright",
          doctorAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
          specialization: "Cardiology",
          department: "Cardiology",
          hospital: "Metropolitan Central Hospital",
          clinicLocation: "Tower A, 3rd Floor, Suite 302",
          date: makeDate(7),
          timeSlot: "11:00 AM",
          consultationFee: 120,
          mode: "in-person",
          reason: "Post-stent 6-month angiogram evaluation",
          notes: "Doing well, no angina, walking 3 miles daily.",
          status: "Confirmed",
          createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
        },

        // --- COMPLETED CONSULTATIONS FOR DR. ALEXANDER WRIGHT ---
        {
          id: "apt_1003",
          reference: "MB-2026-4190",
          patientId: "patient_008",
          patientName: "Robert M. Davenport",
          patientEmail: "robert.davenport@example.com",
          patientPhone: "+1 (555) 234-5678",
          doctorId: "doc_001",
          doctorName: "Dr. Alexander Wright",
          doctorAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
          specialization: "Cardiology",
          department: "Cardiology",
          hospital: "Metropolitan Central Hospital",
          clinicLocation: "Tower A, 3rd Floor, Suite 302",
          date: makeDate(-3),
          timeSlot: "10:00 AM",
          consultationFee: 120,
          mode: "in-person",
          reason: "Routine cardiovascular checkup and ECG review",
          notes: "Comprehensive vitals check and lipid profile assessment.",
          clinicalNotes: "Resting ECG demonstrates normal sinus rhythm at 68 bpm. Blood pressure 124/78 mmHg. Ejection fraction stable at 60%. Prescribed continuation of Atorvastatin 20mg.",
          prescription: "Atorvastatin 20mg once daily at bedtime; Low-sodium Mediterranean diet.",
          status: "Completed",
          completedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
        },
        {
          id: "apt_1017",
          reference: "MB-2026-9018",
          patientId: "patient_009",
          patientName: "Patricia Taylor",
          patientEmail: "patricia.taylor@example.com",
          patientPhone: "+1 (555) 321-7654",
          doctorId: "doc_001",
          doctorName: "Dr. Alexander Wright",
          doctorAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
          specialization: "Cardiology",
          department: "Cardiology",
          hospital: "Metropolitan Central Hospital",
          clinicLocation: "Tower A, 3rd Floor, Suite 302",
          date: makeDate(-7),
          timeSlot: "02:00 PM",
          consultationFee: 120,
          mode: "video",
          reason: "Lipid panel consultation & cholesterol counseling",
          notes: "Total cholesterol: 215, LDL: 130.",
          clinicalNotes: "Patient advised on aerobic exercise 150 mins/week and dietary fiber. Recheck fasting lipid panel in 90 days.",
          prescription: "Dietary optimization protocol; Follow-up lipid panel in 3 months.",
          status: "Completed",
          completedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
        },
        {
          id: "apt_1018",
          reference: "MB-2026-9019",
          patientId: "patient_010",
          patientName: "Thomas Martinez",
          patientEmail: "thomas.martinez@example.com",
          patientPhone: "+1 (555) 432-9876",
          doctorId: "doc_001",
          doctorName: "Dr. Alexander Wright",
          doctorAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
          specialization: "Cardiology",
          department: "Cardiology",
          hospital: "Metropolitan Central Hospital",
          clinicLocation: "Tower A, 3rd Floor, Suite 302",
          date: makeDate(-12),
          timeSlot: "11:30 AM",
          consultationFee: 120,
          mode: "in-person",
          reason: "Treadmill stress test evaluation",
          notes: "Exercise tolerance evaluation.",
          clinicalNotes: "Bruce protocol completed to Stage 4 (12 METs). No ischemic ST-segment changes. Excellent functional capacity.",
          prescription: "Cleared for unrestricted vigorous athletic activities.",
          status: "Completed",
          completedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
          createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
        },

        // --- CANCELLED & REJECTED APPOINTMENTS FOR DR. ALEXANDER WRIGHT ---
        {
          id: "apt_1019",
          reference: "MB-2026-9020",
          patientId: "patient_011",
          patientName: "Lucas Gray",
          patientEmail: "lucas.gray@example.com",
          patientPhone: "+1 (555) 901-2345",
          doctorId: "doc_001",
          doctorName: "Dr. Alexander Wright",
          doctorAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
          specialization: "Cardiology",
          department: "Cardiology",
          hospital: "Metropolitan Central Hospital",
          clinicLocation: "Tower A, 3rd Floor, Suite 302",
          date: makeDate(-2),
          timeSlot: "03:30 PM",
          consultationFee: 120,
          mode: "in-person",
          reason: "Pre-operative cardiac clearance request",
          notes: "Urgent clearance requested for minor orthopedic surgery.",
          status: "Rejected",
          rejectionReason: "Emergency cardiovascular bypass surgery scheduled at hospital during requested consultation hour.",
          rejectedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
        },
        {
          id: "apt_1020",
          reference: "MB-2026-9021",
          patientId: "patient_012",
          patientName: "Karen White",
          patientEmail: "karen.white@example.com",
          patientPhone: "+1 (555) 012-3456",
          doctorId: "doc_001",
          doctorName: "Dr. Alexander Wright",
          doctorAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
          specialization: "Cardiology",
          department: "Cardiology",
          hospital: "Metropolitan Central Hospital",
          clinicLocation: "Tower A, 3rd Floor, Suite 302",
          date: makeDate(-5),
          timeSlot: "01:30 PM",
          consultationFee: 120,
          mode: "video",
          reason: "Second opinion on arrhythmia treatment options",
          notes: "Patient seeking alternatives to catheter ablation.",
          status: "Cancelled",
          cancellationReason: "Patient had out-of-town travel conflict; rescheduled for next month.",
          cancelledAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
        },

        // --- APPOINTMENTS FOR OTHER DOCTORS (Ensuring strict role and doctor isolation testing) ---
        {
          id: "apt_1002",
          reference: "MB-2026-7219",
          patientId: "patient_001",
          patientName: "Sarah Jenkins",
          patientEmail: "patient@medibook.com",
          patientPhone: "+1 (555) 234-5678",
          doctorId: "doc_005",
          doctorName: "Dr. Sanjay Patel",
          doctorAvatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80",
          specialization: "Dermatology",
          department: "Dermatology",
          hospital: "Dermal Care Specialists",
          clinicLocation: "Outpatient Clinic 102",
          date: makeDate(5),
          timeSlot: "02:15 PM",
          consultationFee: 110,
          mode: "video",
          reason: "Annual skin and mole examination follow-up",
          notes: "Virtual consultation via MediBook Telehealth.",
          status: "Pending",
          createdAt: new Date().toISOString()
        },
        {
          id: "apt_1021",
          reference: "MB-2026-9022",
          patientId: "patient_013",
          patientName: "Lucas Montgomery",
          patientEmail: "lucas.montgomery@example.com",
          patientPhone: "+1 (555) 999-1122",
          doctorId: "doc_002",
          doctorName: "Dr. Eleanor Vance",
          doctorAvatar: "https://images.unsplash.com/photo-1594824813511-1335b2e979d4?w=200&auto=format&fit=crop&q=80",
          specialization: "Neurology",
          department: "Neurology",
          hospital: "St. Jude Neuroscience Center",
          clinicLocation: "Tower B, Level 4",
          date: todayStr,
          timeSlot: "10:00 AM",
          consultationFee: 140,
          mode: "in-person",
          reason: "Chronic migraine protocol evaluation",
          notes: "Severe aura reported twice this week.",
          status: "Confirmed",
          createdAt: new Date().toISOString()
        }
      ];

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialAppointments));
      localStorage.setItem(this.VERSION_KEY, "true");

      // Pre-seed atomic lock map
      const initialLocks = {};
      initialAppointments.forEach(apt => {
        if (apt.status === 'Confirmed' || apt.status === 'Pending') {
          const lockKey = `${apt.doctorId}_${apt.date}_${apt.timeSlot}`;
          initialLocks[lockKey] = apt.id;
        }
      });
      localStorage.setItem(this.LOCK_KEY, JSON.stringify(initialLocks));
    }
  }

  getAppointmentsFromStorage() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[AppointmentService] Error reading appointments', e);
      return [];
    }
  }

  saveAppointmentsToStorage(appointments) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(appointments));
  }

  getSlotLocks() {
    try {
      const data = localStorage.getItem(this.LOCK_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  saveSlotLocks(locks) {
    localStorage.setItem(this.LOCK_KEY, JSON.stringify(locks));
  }

  /**
   * Check which time slots are already booked for a doctor on a specific date
   */
  async getBookedSlotsForDoctor(doctorId, dateString) {
    const fb = window.MediBookFirebase;

    if (fb && fb.isConfigured && fb.db) {
      try {
        const snapshot = await fb.db.collection('appointments')
          .where('doctorId', '==', doctorId)
          .where('date', '==', dateString)
          .where('status', 'in', ['Confirmed', 'Pending'])
          .get();

        const booked = [];
        snapshot.forEach(doc => {
          booked.push(doc.data().timeSlot);
        });
        return booked;
      } catch (err) {
        console.warn('[AppointmentService] Firestore query fallback to storage:', err);
      }
    }

    const appointments = this.getAppointmentsFromStorage();
    return appointments
      .filter(apt => apt.doctorId === doctorId &&
                     apt.date === dateString &&
                     (apt.status === 'Confirmed' || apt.status === 'Pending'))
      .map(apt => apt.timeSlot);
  }

  // =========================================================================
  // DOCTOR PORTAL ACCESS (Strict Doctor Scoping)
  // Requirement 3: Doctors must only access appointments assigned to them.
  // =========================================================================

  /**
   * Retrieve appointments assigned STRICTLY to the specified doctor
   */
  async getDoctorAppointments(doctorId, filterType = null) {
    if (!doctorId) return [];

    const fb = window.MediBookFirebase;
    let appointments = [];

    // 1. Live Firestore query if configured
    if (fb && fb.isConfigured && fb.db) {
      try {
        const snapshot = await fb.db.collection('appointments')
          .where('doctorId', '==', doctorId)
          .get();

        if (!snapshot.empty) {
          snapshot.forEach(d => appointments.push({ id: d.id, ...d.data() }));
        }
      } catch (err) {
        console.warn('[AppointmentService] Firestore fetch error, fallback to storage:', err);
      }
    }

    // 2. Storage fallback if empty or offline
    if (appointments.length === 0) {
      const all = this.getAppointmentsFromStorage();
      // Strict doctor scoping: only matches assigned doctorId
      appointments = all.filter(a => a.doctorId === doctorId);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Filter according to category if requested
    if (filterType === 'today') {
      appointments = appointments.filter(a => a.date === todayStr);
    } else if (filterType === 'upcoming') {
      appointments = appointments.filter(a => a.date >= todayStr && (a.status === 'Confirmed' || a.status === 'Pending'));
    } else if (filterType === 'pending') {
      appointments = appointments.filter(a => a.status === 'Pending');
    } else if (filterType === 'completed') {
      appointments = appointments.filter(a => a.status === 'Completed');
    } else if (filterType === 'cancelled' || filterType === 'cancellation_history') {
      appointments = appointments.filter(a => a.status === 'Cancelled' || a.status === 'Rejected');
    }

    // Sort chronologically (date ascending for upcoming, date descending for history)
    if (filterType === 'completed' || filterType === 'cancelled') {
      appointments.sort((a, b) => new Date(b.date + 'T' + (b.timeSlot || '00:00')) - new Date(a.date + 'T' + (a.timeSlot || '00:00')));
    } else {
      appointments.sort((a, b) => new Date(a.date + 'T' + (a.timeSlot || '00:00')) - new Date(b.date + 'T' + (b.timeSlot || '00:00')));
    }

    return appointments;
  }

  /**
   * Get single appointment by ID (with doctor ownership check)
   */
  async getAppointmentById(appointmentId, doctorId = null) {
    const appointments = this.getAppointmentsFromStorage();
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return null;

    if (doctorId && apt.doctorId !== doctorId) {
      console.warn(`[AppointmentService] Unauthorized doctor access blocked for appointment ${appointmentId}`);
      return null;
    }

    return apt;
  }

  /**
   * Confirm a pending appointment
   * Requirement 3: Confirm pending appointments.
   */
  async confirmAppointment(appointmentId, doctorNotes = '') {
    const appointments = this.getAppointmentsFromStorage();
    const index = appointments.findIndex(a => a.id === appointmentId);

    if (index === -1) {
      return { success: false, error: "Appointment record not found." };
    }

    const apt = appointments[index];
    if (apt.status === 'Cancelled' || apt.status === 'Rejected') {
      return { success: false, error: "Cannot confirm a cancelled or rejected appointment." };
    }
    if (apt.status === 'Completed') {
      return { success: false, error: "This consultation has already been completed." };
    }

    apt.status = 'Confirmed';
    apt.confirmedAt = new Date().toISOString();
    if (doctorNotes) {
      apt.doctorNotes = doctorNotes;
    }

    appointments[index] = apt;
    this.saveAppointmentsToStorage(appointments);

    // Live Firebase update if configured
    const fb = window.MediBookFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        await fb.db.collection('appointments').doc(appointmentId).update({
          status: 'Confirmed',
          confirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
          doctorNotes: doctorNotes || null
        });
      } catch (err) {
        console.warn('Firebase confirm error:', err);
      }
    }

    if (window.DoctorService) {
      window.DoctorService.logDoctorActivity(
        apt.doctorId,
        "Appointment Confirmed",
        `Confirmed appointment for ${apt.patientName} on ${apt.date} at ${apt.timeSlot} (Ref: ${apt.reference}).`
      );
    }

    return { success: true, appointment: apt };
  }

  /**
   * Reject an appointment with a reason
   * Requirement 3: Reject appointments with a reason.
   */
  async rejectAppointment(appointmentId, reason) {
    if (!reason || !reason.trim()) {
      return { success: false, error: "A clinical or scheduling reason must be provided to reject an appointment." };
    }

    const appointments = this.getAppointmentsFromStorage();
    const index = appointments.findIndex(a => a.id === appointmentId);

    if (index === -1) {
      return { success: false, error: "Appointment record not found." };
    }

    const apt = appointments[index];
    if (apt.status === 'Completed') {
      return { success: false, error: "Cannot reject a consultation that has already taken place." };
    }

    apt.status = 'Rejected';
    apt.rejectionReason = reason.trim();
    apt.rejectedAt = new Date().toISOString();

    appointments[index] = apt;
    this.saveAppointmentsToStorage(appointments);

    // Release slot lock so slot becomes available if needed
    const locks = this.getSlotLocks();
    const lockKey = `${apt.doctorId}_${apt.date}_${apt.timeSlot}`;
    if (locks[lockKey]) {
      delete locks[lockKey];
      this.saveSlotLocks(locks);
    }

    // Live Firebase update if configured
    const fb = window.MediBookFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        await fb.db.collection('appointments').doc(appointmentId).update({
          status: 'Rejected',
          rejectionReason: reason.trim(),
          rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        await fb.db.collection('slot_locks').doc(lockKey).delete();
      } catch (err) {
        console.warn('Firebase reject error:', err);
      }
    }

    if (window.DoctorService) {
      window.DoctorService.logDoctorActivity(
        apt.doctorId,
        "Appointment Rejected",
        `Rejected appointment with ${apt.patientName} on ${apt.date}. Reason: ${reason}`
      );
    }

    return { success: true, appointment: apt };
  }

  /**
   * Mark appointment as completed
   * Requirement 3: Mark appointments as completed.
   */
  async completeAppointment(appointmentId, clinicalNotes = '', prescription = '') {
    const appointments = this.getAppointmentsFromStorage();
    const index = appointments.findIndex(a => a.id === appointmentId);

    if (index === -1) {
      return { success: false, error: "Appointment record not found." };
    }

    const apt = appointments[index];
    if (apt.status === 'Cancelled' || apt.status === 'Rejected') {
      return { success: false, error: "Cannot complete an appointment that was cancelled or rejected." };
    }

    apt.status = 'Completed';
    apt.completedAt = new Date().toISOString();
    if (clinicalNotes) apt.clinicalNotes = clinicalNotes.trim();
    if (prescription) apt.prescription = prescription.trim();

    appointments[index] = apt;
    this.saveAppointmentsToStorage(appointments);

    // Live Firebase update if configured
    const fb = window.MediBookFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        await fb.db.collection('appointments').doc(appointmentId).update({
          status: 'Completed',
          completedAt: firebase.firestore.FieldValue.serverTimestamp(),
          clinicalNotes: clinicalNotes.trim() || null,
          prescription: prescription.trim() || null
        });
      } catch (err) {
        console.warn('Firebase complete error:', err);
      }
    }

    if (window.DoctorService) {
      window.DoctorService.logDoctorActivity(
        apt.doctorId,
        "Consultation Completed",
        `Marked visit with ${apt.patientName} as Completed.` + (clinicalNotes ? ` Clinical notes recorded.` : '')
      );
    }

    return { success: true, appointment: apt };
  }

  /**
   * Compute comprehensive dashboard metric tallies for the doctor
   * Requirement 2: Display Total, Today's, Upcoming, Completed, Cancelled appointments.
   * Add sections: Today's schedule, Upcoming patient appointments, Recent appointment activity, Weekly appointment statistics.
   */
  async getDoctorMetrics(doctorId) {
    const appointments = await this.getDoctorAppointments(doctorId);
    const todayStr = new Date().toISOString().split('T')[0];

    let total = appointments.length;
    let todayCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    const todaySchedule = [];
    const upcomingList = [];

    // Weekly statistics tracking (Monday - Sunday)
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weeklyStats = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0
    };

    appointments.forEach(a => {
      // Weekly count
      const dObj = new Date(a.date + 'T00:00:00');
      const dayName = dayNames[dObj.getDay()];
      if (weeklyStats[dayName] !== undefined) {
        weeklyStats[dayName]++;
      }

      if (a.date === todayStr) {
        todayCount++;
        todaySchedule.push(a);
      }

      if (a.date >= todayStr && (a.status === 'Confirmed' || a.status === 'Pending')) {
        upcomingCount++;
        if (a.date > todayStr) {
          upcomingList.push(a);
        }
      } else if (a.status === 'Completed' || (a.status === 'Confirmed' && a.date < todayStr)) {
        completedCount++;
      } else if (a.status === 'Cancelled' || a.status === 'Rejected') {
        cancelledCount++;
      }
    });

    // Sort today's schedule by timeSlot
    todaySchedule.sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
    // Sort upcoming by date then timeSlot
    upcomingList.sort((a, b) => new Date(a.date + 'T' + (a.timeSlot || '00:00')) - new Date(b.date + 'T' + (b.timeSlot || '00:00')));

    // Get recent doctor activity logs
    let activity = [];
    if (window.DoctorService) {
      activity = window.DoctorService.getDoctorActivityLogs(doctorId);
    }

    return {
      total,
      today: todayCount,
      upcoming: upcomingCount,
      completed: completedCount,
      cancelled: cancelledCount,
      todaySchedule,
      upcomingAppointments: upcomingList.slice(0, 5),
      weeklyStats,
      recentActivity: activity.slice(0, 6)
    };
  }

  /**
   * Retrieve distinct patient records for assigned doctor
   * Requirement 5: Doctors should be able to view the minimum necessary patient information
   * for their assigned appointments: Patient name, phone number, appointment date, consultation reason,
   * appointment history where authorized. Do not expose patient information to unrelated doctors.
   */
  async getDoctorPatients(doctorId) {
    const appointments = await this.getDoctorAppointments(doctorId);

    // Group appointments by patient email or ID
    const patientMap = {};

    appointments.forEach(apt => {
      const key = (apt.patientEmail || apt.patientId || apt.patientName).toLowerCase();
      if (!patientMap[key]) {
        patientMap[key] = {
          patientId: apt.patientId || key,
          patientName: apt.patientName,
          patientEmail: apt.patientEmail,
          patientPhone: apt.patientPhone || "N/A",
          totalVisits: 0,
          lastAppointmentDate: apt.date,
          latestReason: apt.reason,
          reasons: [],
          history: []
        };
      }

      const p = patientMap[key];
      p.totalVisits++;
      if (apt.date > p.lastAppointmentDate) {
        p.lastAppointmentDate = apt.date;
        p.latestReason = apt.reason;
      }
      if (apt.reason && !p.reasons.includes(apt.reason)) {
        p.reasons.push(apt.reason);
      }

      // Authorized visit history with this doctor
      p.history.push({
        id: apt.id,
        reference: apt.reference,
        date: apt.date,
        timeSlot: apt.timeSlot,
        mode: apt.mode,
        reason: apt.reason,
        status: apt.status,
        clinicalNotes: apt.clinicalNotes || null,
        prescription: apt.prescription || null,
        rejectionReason: apt.rejectionReason || null
      });
    });

    // Sort history chronologically descending for each patient
    Object.values(patientMap).forEach(p => {
      p.history.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    return Object.values(patientMap);
  }

  // =========================================================================
  // ATOMIC APPOINTMENT BOOKING WITH DOCTOR SCHEDULE INTEGRATION
  // =========================================================================

  /**
   * Atomic Appointment Booking
   * Validates doctor availability, checks break times, holidays, slot conflicts, and saves record.
   */
  async bookAppointment(bookingData) {
    const {
      doctorId,
      doctorName,
      doctorAvatar,
      specialization,
      department,
      hospital,
      date,
      timeSlot,
      consultationFee,
      mode,
      patientId,
      patientName,
      patientEmail,
      patientPhone,
      reason,
      notes
    } = bookingData;

    // 1. Validate mandatory fields
    if (!doctorId || !date || !timeSlot || !patientName || !patientEmail) {
      return { success: false, error: "Please complete all required appointment fields." };
    }

    // 2. Verify date is not in the past
    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      return { success: false, error: "Cannot book appointments on past dates." };
    }

    // 3. Verify doctor availability (Weekdays, Break times, Unavailable dates, Leaves)
    if (window.DoctorService) {
      const availCheck = await window.DoctorService.isDoctorAvailable(doctorId, date, timeSlot);
      if (!availCheck.available) {
        return { success: false, error: availCheck.reason };
      }
    }

    const uniqueRef = "MB-2026-" + Math.floor(1000 + Math.random() * 9000);
    const appointmentId = "apt_" + Date.now();
    const lockKey = `${doctorId}_${date}_${timeSlot}`;

    const doctorObj = (window.MEDIBOOK_DATA && window.MEDIBOOK_DATA.doctors) ?
      window.MEDIBOOK_DATA.doctors.find(d => d.id === doctorId) : null;

    const newAppointment = {
      id: appointmentId,
      reference: uniqueRef,
      patientId: patientId || "patient_001",
      patientName,
      patientEmail,
      patientPhone: patientPhone || "",
      doctorId,
      doctorName,
      doctorAvatar: doctorAvatar || (doctorObj ? doctorObj.avatar : "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200"),
      specialization: specialization || department || (doctorObj ? doctorObj.specialization : "General"),
      department: department || specialization || (doctorObj ? doctorObj.department : "General"),
      hospital: hospital || (doctorObj ? doctorObj.hospital : "Metropolitan Health Central"),
      clinicLocation: doctorObj ? (doctorObj.clinicAddress || doctorObj.hospital) : "Central Hospital Outpatient Clinic",
      date,
      timeSlot,
      consultationFee: consultationFee || (doctorObj ? doctorObj.consultationFee : 100),
      mode: mode || "in-person",
      reason: reason || "General Medical Consultation",
      notes: notes || "",
      status: "Confirmed",
      createdAt: new Date().toISOString()
    };

    const fb = window.MediBookFirebase;

    // A. Live Firebase Firestore Transaction
    if (fb && fb.isConfigured && fb.db) {
      try {
        const slotLockRef = fb.db.collection('slot_locks').doc(lockKey);
        const appointmentRef = fb.db.collection('appointments').doc(appointmentId);

        await fb.db.runTransaction(async (transaction) => {
          const lockDoc = await transaction.get(slotLockRef);
          if (lockDoc.exists && lockDoc.data().active) {
            throw new Error(`The slot on ${date} at ${timeSlot} has just been reserved by another patient. Please select an alternate slot.`);
          }

          transaction.set(slotLockRef, {
            active: true,
            doctorId,
            date,
            timeSlot,
            appointmentId,
            lockedAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          transaction.set(appointmentRef, {
            ...newAppointment,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });

        // Mirror to local session
        const stored = this.getAppointmentsFromStorage();
        stored.unshift(newAppointment);
        this.saveAppointmentsToStorage(stored);

        return { success: true, appointment: newAppointment };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // B. Local Simulation Atomic Reservation Mechanism
    await new Promise(r => setTimeout(r, 400));

    const locks = this.getSlotLocks();
    if (locks[lockKey]) {
      return {
        success: false,
        error: `Slot Conflict: ${doctorName} is already booked on ${date} at ${timeSlot}. Please select another time.`
      };
    }

    // Acquire lock and persist
    locks[lockKey] = appointmentId;
    this.saveSlotLocks(locks);

    const appointments = this.getAppointmentsFromStorage();
    appointments.unshift(newAppointment);
    this.saveAppointmentsToStorage(appointments);

    return { success: true, appointment: newAppointment };
  }

  /**
   * Cancel an appointment with strict rule enforcement
   */
  async cancelAppointment(appointmentId, reason = "Patient requested cancellation") {
    const appointments = this.getAppointmentsFromStorage();
    const index = appointments.findIndex(a => a.id === appointmentId);

    if (index === -1) {
      return { success: false, error: "Appointment record not found." };
    }

    const apt = appointments[index];

    if (apt.status === 'Cancelled' || apt.status === 'Rejected') {
      return { success: false, error: "This appointment has already been cancelled or rejected." };
    }
    if (apt.status === 'Completed') {
      return { success: false, error: "Cannot cancel a completed consultation." };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (apt.date < todayStr) {
      return { success: false, error: "Cannot cancel appointments that have already occurred." };
    }

    const fb = window.MediBookFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        const lockKey = `${apt.doctorId}_${apt.date}_${apt.timeSlot}`;
        await fb.db.collection('appointments').doc(appointmentId).update({
          status: 'Cancelled',
          cancellationReason: reason,
          cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        await fb.db.collection('slot_locks').doc(lockKey).delete();
      } catch (err) {
        console.warn('Firebase cancel error:', err);
      }
    }

    apt.status = 'Cancelled';
    apt.cancellationReason = reason;
    apt.cancelledAt = new Date().toISOString();
    appointments[index] = apt;
    this.saveAppointmentsToStorage(appointments);

    const locks = this.getSlotLocks();
    const lockKey = `${apt.doctorId}_${apt.date}_${apt.timeSlot}`;
    if (locks[lockKey]) {
      delete locks[lockKey];
      this.saveSlotLocks(locks);
    }

    return { success: true, appointment: apt };
  }

  /**
   * Retrieve appointments for the logged in patient
   */
  async getPatientAppointments(patientId, patientEmail) {
    const fb = window.MediBookFirebase;

    if (fb && fb.isConfigured && fb.db && (patientId || patientEmail)) {
      try {
        let query = fb.db.collection('appointments');
        if (patientId) {
          query = query.where('patientId', '==', patientId);
        } else if (patientEmail) {
          query = query.where('patientEmail', '==', patientEmail);
        }
        const snapshot = await query.get();
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
          list.sort((a, b) => new Date(b.date) - new Date(a.date));
          return list;
        }
      } catch (err) {
        console.warn('Firestore fetch fallback:', err);
      }
    }

    const list = this.getAppointmentsFromStorage();
    const filtered = list.filter(a => {
      if (patientId && a.patientId === patientId) return true;
      if (patientEmail && a.patientEmail.toLowerCase() === patientEmail.toLowerCase()) return true;
      return a.patientEmail === 'patient@medibook.com';
    });

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    return filtered;
  }

  /**
   * Compute dashboard metric tallies for the patient
   */
  async getPatientMetrics(patientId, patientEmail) {
    const appointments = await this.getPatientAppointments(patientId, patientEmail);
    const todayStr = new Date().toISOString().split('T')[0];

    let upcoming = 0;
    let completed = 0;
    let cancelled = 0;
    let nextAppointment = null;

    const upcomingList = appointments
      .filter(a => (a.status === 'Confirmed' || a.status === 'Pending') && a.date >= todayStr)
      .sort((a, b) => new Date(a.date + 'T' + (a.timeSlot || '00:00')) - new Date(b.date + 'T' + (b.timeSlot || '00:00')));

    if (upcomingList.length > 0) {
      nextAppointment = upcomingList[0];
    }

    appointments.forEach(a => {
      if ((a.status === 'Confirmed' || a.status === 'Pending') && a.date >= todayStr) {
        upcoming++;
      } else if (a.status === 'Completed' || (a.status === 'Confirmed' && a.date < todayStr)) {
        completed++;
      } else if (a.status === 'Cancelled' || a.status === 'Rejected') {
        cancelled++;
      }
    });

    return {
      total: appointments.length,
      upcoming,
      completed,
      cancelled,
      nextAppointment,
      recent: appointments.slice(0, 5)
    };
  }
}

window.AppointmentService = new AppointmentService();
