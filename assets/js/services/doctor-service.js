/**
 * Veyora Doctor Practice & Schedule Management Service
 * Manages doctor profiles, weekly schedules, break times, unavailable dates,
 * leave requests, automatic slot generation, conflict detection, and admin approval workflows.
 */

class DoctorService {
  constructor() {
    this.SCHEDULES_KEY = 'veyora_doctor_schedules';
    this.PROFILES_OVERRIDE_KEY = 'veyora_doctor_profiles_override';
    this.APPROVALS_KEY = 'veyora_doctor_profile_approvals';
    this.CONFLICTS_KEY = 'veyora_schedule_conflicts';
    this.ACTIVITY_KEY = 'veyora_doctor_activity';

    this.initStorage();
  }

  /**
   * Seed default schedules and configurations if empty
   */
  initStorage() {
    if (!localStorage.getItem(this.SCHEDULES_KEY)) {
      const defaultSchedules = {
        doc_001: {
          doctorId: "doc_001",
          doctorName: "Dr. Alexander Wright",
          availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          startTime: "09:00",
          endTime: "17:00",
          slotDuration: 30, // in minutes
          breaks: [
            { id: "brk_1", name: "Lunch & Clinical Rounds", start: "13:00", end: "14:00" }
          ],
          unavailableDates: [],
          leaves: [
            {
              id: "lv_101",
              startDate: "2026-12-24",
              endDate: "2026-12-26",
              reason: "Christmas Holiday & Departmental Recess",
              type: "Holiday",
              status: "Approved",
              requestedAt: "2026-11-01T10:00:00.000Z"
            }
          ],
          updatedAt: new Date().toISOString()
        },
        doc_002: {
          doctorId: "doc_002",
          doctorName: "Dr. Eleanor Vance",
          availableDays: ["Tuesday", "Thursday", "Saturday"],
          startTime: "10:00",
          endTime: "16:00",
          slotDuration: 45,
          breaks: [
            { id: "brk_2", name: "Midday Break", start: "13:00", end: "14:00" }
          ],
          unavailableDates: [],
          leaves: [],
          updatedAt: new Date().toISOString()
        }
      };
      localStorage.setItem(this.SCHEDULES_KEY, JSON.stringify(defaultSchedules));
    }

    if (!localStorage.getItem(this.ACTIVITY_KEY)) {
      const initialLogs = [
        {
          id: "act_101",
          doctorId: "doc_001",
          action: "Schedule Synchronized",
          details: "Clinic schedule updated: Mon-Fri (09:00 AM – 05:00 PM)",
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: "act_102",
          doctorId: "doc_001",
          action: "Appointment Confirmed",
          details: "Confirmed cardiovascular consultation for Sarah Jenkins (Ref: MB-2026-8842)",
          timestamp: new Date(Date.now() - 3600000 * 8).toISOString()
        },
        {
          id: "act_103",
          doctorId: "doc_001",
          action: "Credential Verified",
          details: "Medical license MED-CA-884920 re-certified by Hospital Medical Board",
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ];
      localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(initialLogs));
    }
  }

  // =========================================================================
  // DOCTOR PROFILE MANAGEMENT & ADMIN APPROVAL WORKFLOW
  // =========================================================================

  /**
   * Retrieve doctor profile from Firestore or local data
   */
  async getDoctorProfile(doctorId) {
    const fb = window.VeyoraFirebase;

    // 1. Live Firestore query if configured
    if (fb && fb.isConfigured && fb.db) {
      try {
        const docRef = await fb.db.collection('doctors').doc(doctorId).get();
        if (docRef.exists) {
          const data = docRef.data();
          const pending = await this.getPendingApprovalRequest(doctorId);
          return { id: doctorId, ...data, pendingApproval: pending };
        }
      } catch (err) {
        console.warn('[DoctorService] Firestore fetch error, fallback to storage:', err);
      }
    }

    // 2. Local fallback
    const overrides = this.getProfileOverrides();
    const baseDoctor = (window.MEDIBOOK_DATA && window.MEDIBOOK_DATA.doctors) ?
      window.MEDIBOOK_DATA.doctors.find(d => d.id === doctorId) : null;

    let profile = baseDoctor ? { ...baseDoctor } : {
      id: doctorId,
      name: "Dr. Alexander Wright",
      qualification: "MD, FACC - Harvard Medical School",
      department: "Cardiology",
      specialization: "Cardiology",
      licenseNumber: "MED-CA-884920",
      experienceYears: 16,
      experience: "16 years exp.",
      consultationFee: 120,
      hospital: "Metropolitan Central Hospital",
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80",
      about: "Senior interventional cardiologist specializing in cardiovascular health.",
      languages: ["English", "Spanish"]
    };

    if (overrides[doctorId]) {
      profile = { ...profile, ...overrides[doctorId] };
    }

    const pending = await this.getPendingApprovalRequest(doctorId);
    profile.pendingApproval = pending;

    return profile;
  }

  getProfileOverrides() {
    try {
      const data = localStorage.getItem(this.PROFILES_OVERRIDE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  saveProfileOverrides(overrides) {
    localStorage.setItem(this.PROFILES_OVERRIDE_KEY, JSON.stringify(overrides));
  }

  /**
   * Update doctor profile.
   * Requirement 6: Require administrator approval for important profile changes
   * (qualifications, specialization, experience, consultation fee, license number).
   */
  async updateDoctorProfile(doctorId, updates) {
    const currentProfile = await this.getDoctorProfile(doctorId);

    // Identify critical fields requiring hospital administrator approval
    const criticalFields = ['qualification', 'specialization', 'department', 'experienceYears', 'consultationFee', 'licenseNumber'];
    const pendingChanges = {};
    const directUpdates = {};

    let hasCriticalChanges = false;

    Object.keys(updates).forEach(key => {
      if (criticalFields.includes(key)) {
        const currentVal = currentProfile[key];
        const newVal = updates[key];
        // If changed
        if (newVal !== undefined && String(newVal) !== String(currentVal)) {
          pendingChanges[key] = {
            previous: currentVal,
            requested: newVal
          };
          hasCriticalChanges = true;
        }
      } else {
        // Non-restricted fields: about, avatar, phone, languages, clinicAddress
        directUpdates[key] = updates[key];
      }
    });

    const fb = window.VeyoraFirebase;

    // Apply immediate non-critical updates if any
    if (Object.keys(directUpdates).length > 0) {
      if (fb && fb.isConfigured && fb.db) {
        try {
          await fb.db.collection('doctors').doc(doctorId).set(directUpdates, { merge: true });
        } catch (e) {
          console.warn('[DoctorService] Firestore profile update error:', e);
        }
      }

      const overrides = this.getProfileOverrides();
      overrides[doctorId] = { ...(overrides[doctorId] || {}), ...directUpdates };
      this.saveProfileOverrides(overrides);

      this.logDoctorActivity(doctorId, "Profile Updated", "Updated bio, contact, or profile photograph.");
    }

    // If critical fields were changed, create an Administrator Approval Request
    if (hasCriticalChanges) {
      const approvalRequest = {
        id: "req_" + Date.now(),
        doctorId,
        doctorName: currentProfile.name || "Doctor",
        hospital: currentProfile.hospital || "Metropolitan Health",
        requestedChanges: pendingChanges,
        status: "pending_review", // pending_review | approved | rejected
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        adminNotes: null
      };

      if (fb && fb.isConfigured && fb.db) {
        try {
          await fb.db.collection('profile_approval_requests').doc(approvalRequest.id).set(approvalRequest);
        } catch (e) {
          console.warn('[DoctorService] Firestore approval request error:', e);
        }
      }

      // Save locally
      const pendingMap = this.getAllPendingApprovalRequests();
      pendingMap[doctorId] = approvalRequest;
      localStorage.setItem(this.APPROVALS_KEY, JSON.stringify(pendingMap));

      this.logDoctorActivity(
        doctorId,
        "Credential Review Submitted",
        `Requested modifications to ${Object.keys(pendingChanges).join(', ')} submitted for Hospital Administrator Approval.`
      );

      return {
        success: true,
        hasPendingApproval: true,
        approvalRequest,
        message: "Important credential updates (Qualifications, Specialization, Consultation Fee) require Hospital Administrator Approval. Your request has been recorded and submitted for administrative review."
      };
    }

    return {
      success: true,
      hasPendingApproval: false,
      message: "Doctor profile successfully updated."
    };
  }

  getAllPendingApprovalRequests() {
    try {
      const data = localStorage.getItem(this.APPROVALS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  async getPendingApprovalRequest(doctorId) {
    const fb = window.VeyoraFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        const snap = await fb.db.collection('profile_approval_requests')
          .where('doctorId', '==', doctorId)
          .where('status', '==', 'pending_review')
          .limit(1)
          .get();
        if (!snap.empty) {
          return { id: snap.docs[0].id, ...snap.docs[0].data() };
        }
      } catch (e) {}
    }

    const pendingMap = this.getAllPendingApprovalRequests();
    return pendingMap[doctorId] && pendingMap[doctorId].status === 'pending_review' ? pendingMap[doctorId] : null;
  }

  // =========================================================================
  // SCHEDULE & AVAILABILITY MANAGEMENT
  // =========================================================================

  /**
   * Get doctor schedule settings
   */
  async getDoctorSchedule(doctorId) {
    const fb = window.VeyoraFirebase;

    if (fb && fb.isConfigured && fb.db) {
      try {
        const docRef = await fb.db.collection('schedules').doc(doctorId).get();
        if (docRef.exists) {
          return docRef.data();
        }
      } catch (err) {
        console.warn('[DoctorService] Firestore schedule fetch error:', err);
      }
    }

    const allSchedules = this.getAllSchedules();
    if (allSchedules[doctorId]) {
      return allSchedules[doctorId];
    }

    // Default template if no custom schedule exists yet
    const baseDoctor = (window.MEDIBOOK_DATA && window.MEDIBOOK_DATA.doctors) ?
      window.MEDIBOOK_DATA.doctors.find(d => d.id === doctorId) : null;

    const defaultSched = {
      doctorId,
      doctorName: baseDoctor ? baseDoctor.name : "Doctor",
      availableDays: baseDoctor && baseDoctor.availableDays ? baseDoctor.availableDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      breaks: [
        { id: "brk_1", name: "Lunch Break", start: "13:00", end: "14:00" }
      ],
      unavailableDates: [],
      leaves: [],
      updatedAt: new Date().toISOString()
    };

    allSchedules[doctorId] = defaultSched;
    this.saveAllSchedules(allSchedules);
    return defaultSched;
  }

  getAllSchedules() {
    try {
      const data = localStorage.getItem(this.SCHEDULES_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  saveAllSchedules(schedules) {
    localStorage.setItem(this.SCHEDULES_KEY, JSON.stringify(schedules));
  }

  /**
   * Save doctor schedule and check for conflicts with existing appointments.
   * Requirement 4: Changing availability must not silently delete existing appointments.
   * Notify the doctor and administrator about conflicts.
   */
  async saveDoctorSchedule(doctorId, scheduleData) {
    // Generate new slot list based on hours, duration, and breaks
    const generatedSlots = this.generateSlots(
      scheduleData.startTime,
      scheduleData.endTime,
      scheduleData.slotDuration,
      scheduleData.breaks || []
    );

    const fullSchedule = {
      ...scheduleData,
      doctorId,
      generatedSlots,
      updatedAt: new Date().toISOString()
    };

    // 1. Detect any conflicts with existing confirmed or pending appointments
    const conflicts = await this.detectScheduleConflicts(doctorId, fullSchedule);

    // 2. Persist to Firestore if configured
    const fb = window.VeyoraFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        await fb.db.collection('schedules').doc(doctorId).set(fullSchedule);
        // Also update doctor's availableSlots & availableDays in doctors collection
        await fb.db.collection('doctors').doc(doctorId).set({
          availableDays: fullSchedule.availableDays,
          availableDaysText: fullSchedule.availableDays.join(', '),
          availableSlots: generatedSlots
        }, { merge: true });

        // Record conflicts in Firestore if any
        if (conflicts.length > 0) {
          const conflictBatch = fb.db.batch();
          conflicts.forEach(c => {
            const ref = fb.db.collection('schedule_conflicts').doc(c.id);
            conflictBatch.set(ref, {
              ...c,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          });
          await conflictBatch.commit();
        }
      } catch (err) {
        console.warn('[DoctorService] Firestore schedule save error:', err);
      }
    }

    // 3. Persist to Local Storage
    const all = this.getAllSchedules();
    all[doctorId] = fullSchedule;
    this.saveAllSchedules(all);

    // Mirror to MEDIBOOK_DATA doctors array if present
    if (window.MEDIBOOK_DATA && window.MEDIBOOK_DATA.doctors) {
      const doc = window.MEDIBOOK_DATA.doctors.find(d => d.id === doctorId);
      if (doc) {
        doc.availableDays = fullSchedule.availableDays;
        doc.availableDaysText = fullSchedule.availableDays.join(', ');
        doc.availableSlots = generatedSlots;
      }
    }

    // Record local conflicts
    if (conflicts.length > 0) {
      this.recordConflicts(doctorId, conflicts);
    }

    this.logDoctorActivity(
      doctorId,
      "Schedule Saved",
      `Updated practice hours (${fullSchedule.startTime} - ${fullSchedule.endTime}) with ${generatedSlots.length} available slots/day.` +
      (conflicts.length > 0 ? ` WARNING: ${conflicts.length} appointment conflict(s) detected.` : "")
    );

    return {
      success: true,
      schedule: fullSchedule,
      generatedSlots,
      conflicts,
      hasConflicts: conflicts.length > 0
    };
  }

  /**
   * Automatic Appointment Slot Generator
   * Generates discrete time slots between startTime and endTime with slotDuration,
   * skipping any time range that overlaps with break intervals.
   */
  generateSlots(startTimeStr, endTimeStr, durationMinutes = 30, breaks = []) {
    if (!startTimeStr || !endTimeStr) return [];

    const duration = parseInt(durationMinutes, 10) || 30;

    const parseTimeToMinutes = (tStr) => {
      const parts = tStr.split(':');
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    };

    const formatMinutesTo12H = (mins) => {
      let hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 becomes 12
      const minFormatted = minutes < 10 ? '0' + minutes : minutes;
      const hrFormatted = hours < 10 ? '0' + hours : hours;
      return `${hrFormatted}:${minFormatted} ${ampm}`;
    };

    const startMin = parseTimeToMinutes(startTimeStr);
    const endMin = parseTimeToMinutes(endTimeStr);

    const breakIntervals = (breaks || []).map(b => ({
      start: parseTimeToMinutes(b.start),
      end: parseTimeToMinutes(b.end),
      name: b.name || "Break"
    }));

    const slots = [];
    let currentMin = startMin;

    while (currentMin + duration <= endMin) {
      const slotStart = currentMin;
      const slotEnd = currentMin + duration;

      // Check if this slot overlaps with ANY break interval
      const overlapsBreak = breakIntervals.some(b => {
        return slotStart < b.end && slotEnd > b.start;
      });

      if (!overlapsBreak) {
        slots.push(formatMinutesTo12H(slotStart));
      }

      currentMin += duration;
    }

    return slots;
  }

  /**
   * Conflict Detection Engine
   * Detects if an availability change creates conflicts with existing booked appointments
   */
  async detectScheduleConflicts(doctorId, newSchedule) {
    let appointments = [];
    if (window.AppointmentService) {
      appointments = await window.AppointmentService.getDoctorAppointments(doctorId);
    }

    // Only active appointments can have conflicts
    const activeAppointments = appointments.filter(a =>
      a.status === 'Confirmed' || a.status === 'Pending'
    );

    const conflicts = [];
    const unavailableSet = new Set(newSchedule.unavailableDates || []);
    const availableDaysSet = new Set(newSchedule.availableDays || []);
    const validSlotsSet = new Set(newSchedule.generatedSlots || []);

    const leaves = newSchedule.leaves || [];

    activeAppointments.forEach(apt => {
      const aptDate = apt.date; // "YYYY-MM-DD"
      const aptSlot = apt.timeSlot; // e.g. "10:30 AM"

      // 1. Check if date is marked as unavailable
      if (unavailableSet.has(aptDate)) {
        conflicts.push({
          id: `cnf_${apt.id}_date`,
          doctorId,
          appointmentId: apt.id,
          reference: apt.reference,
          patientName: apt.patientName,
          patientPhone: apt.patientPhone,
          date: aptDate,
          timeSlot: aptSlot,
          type: "Unavailable Date",
          reason: `Doctor has designated ${aptDate} as an unavailable date.`,
          detectedAt: new Date().toISOString(),
          status: "Unresolved"
        });
        return;
      }

      // 2. Check if date falls within any scheduled leave
      const matchingLeave = leaves.find(l => aptDate >= l.startDate && aptDate <= l.endDate);
      if (matchingLeave) {
        conflicts.push({
          id: `cnf_${apt.id}_leave`,
          doctorId,
          appointmentId: apt.id,
          reference: apt.reference,
          patientName: apt.patientName,
          patientPhone: apt.patientPhone,
          date: aptDate,
          timeSlot: aptSlot,
          type: "Doctor On Leave",
          reason: `Doctor is scheduled for leave (${matchingLeave.reason}) from ${matchingLeave.startDate} to ${matchingLeave.endDate}.`,
          detectedAt: new Date().toISOString(),
          status: "Unresolved"
        });
        return;
      }

      // 3. Check day of week
      const dateObj = new Date(aptDate + 'T00:00:00');
      const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      if (!availableDaysSet.has(weekday)) {
        conflicts.push({
          id: `cnf_${apt.id}_day`,
          doctorId,
          appointmentId: apt.id,
          reference: apt.reference,
          patientName: apt.patientName,
          patientPhone: apt.patientPhone,
          date: aptDate,
          timeSlot: aptSlot,
          type: "Clinic Day Closed",
          reason: `Doctor is no longer scheduled to see patients on ${weekday}s.`,
          detectedAt: new Date().toISOString(),
          status: "Unresolved"
        });
        return;
      }

      // 4. Check time slot (break time or outside working hours)
      if (validSlotsSet.size > 0 && !validSlotsSet.has(aptSlot)) {
        conflicts.push({
          id: `cnf_${apt.id}_slot`,
          doctorId,
          appointmentId: apt.id,
          reference: apt.reference,
          patientName: apt.patientName,
          patientPhone: apt.patientPhone,
          date: aptDate,
          timeSlot: aptSlot,
          type: "Slot Discontinued / In Break",
          reason: `Appointment time (${aptSlot}) now falls within a scheduled break or outside clinic hours.`,
          detectedAt: new Date().toISOString(),
          status: "Unresolved"
        });
      }
    });

    return conflicts;
  }

  recordConflicts(doctorId, conflicts) {
    try {
      const stored = localStorage.getItem(this.CONFLICTS_KEY);
      const allConflicts = stored ? JSON.parse(stored) : {};
      allConflicts[doctorId] = conflicts;
      localStorage.setItem(this.CONFLICTS_KEY, JSON.stringify(allConflicts));
    } catch (e) {}
  }

  getDoctorConflicts(doctorId) {
    try {
      const stored = localStorage.getItem(this.CONFLICTS_KEY);
      const allConflicts = stored ? JSON.parse(stored) : {};
      return allConflicts[doctorId] || [];
    } catch (e) {
      return [];
    }
  }

  resolveConflict(doctorId, conflictId) {
    try {
      const stored = localStorage.getItem(this.CONFLICTS_KEY);
      const allConflicts = stored ? JSON.parse(stored) : {};
      if (allConflicts[doctorId]) {
        allConflicts[doctorId] = allConflicts[doctorId].filter(c => c.id !== conflictId);
        localStorage.setItem(this.CONFLICTS_KEY, JSON.stringify(allConflicts));
      }
    } catch (e) {}
  }

  /**
   * Check if a doctor is available on a specific date and slot
   * Used by the appointment booking wizard to prevent booking during breaks, holidays, or leaves
   */
  async isDoctorAvailable(doctorId, dateString, timeSlot) {
    const schedule = await this.getDoctorSchedule(doctorId);

    // 1. Past date check
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateString < todayStr) {
      return { available: false, reason: "Cannot book appointments on past dates." };
    }

    // 2. Unavailable dates check
    if (schedule.unavailableDates && schedule.unavailableDates.includes(dateString)) {
      return { available: false, reason: "The doctor is unavailable on this date." };
    }

    // 3. Leave check
    if (schedule.leaves && schedule.leaves.length > 0) {
      const onLeave = schedule.leaves.find(l => dateString >= l.startDate && dateString <= l.endDate);
      if (onLeave) {
        return { available: false, reason: `The doctor is on scheduled leave on this date (${onLeave.reason}).` };
      }
    }

    // 4. Weekday check
    const dateObj = new Date(dateString + 'T00:00:00');
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    if (schedule.availableDays && !schedule.availableDays.includes(weekday)) {
      return { available: false, reason: `The doctor does not hold clinical hours on ${weekday}s.` };
    }

    // 5. Break times check
    if (schedule.breaks && schedule.breaks.length > 0 && timeSlot) {
      const parseTimeToMinutes = (tStr) => {
        // Handle "10:30 AM" or "14:00"
        let [time, modifier] = tStr.trim().split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };

      const slotMin = parseTimeToMinutes(timeSlot);
      const slotDuration = schedule.slotDuration || 30;

      for (const brk of schedule.breaks) {
        const brkParts = (t) => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
        };
        const brkStart = brkParts(brk.start);
        const brkEnd = brkParts(brk.end);

        if (slotMin < brkEnd && (slotMin + slotDuration) > brkStart) {
          return { available: false, reason: `This time falls within the doctor's scheduled ${brk.name || 'break'} (${brk.start} - ${brk.end}).` };
        }
      }
    }

    return { available: true };
  }

  // =========================================================================
  // LEAVE & UNAVAILABLE DATES MANAGEMENT
  // =========================================================================

  async addUnavailableDate(doctorId, dateString) {
    const schedule = await this.getDoctorSchedule(doctorId);
    if (!schedule.unavailableDates) schedule.unavailableDates = [];
    if (!schedule.unavailableDates.includes(dateString)) {
      schedule.unavailableDates.push(dateString);
      schedule.unavailableDates.sort();
      return this.saveDoctorSchedule(doctorId, schedule);
    }
    return { success: true, schedule };
  }

  async removeUnavailableDate(doctorId, dateString) {
    const schedule = await this.getDoctorSchedule(doctorId);
    if (schedule.unavailableDates) {
      schedule.unavailableDates = schedule.unavailableDates.filter(d => d !== dateString);
      return this.saveDoctorSchedule(doctorId, schedule);
    }
    return { success: true, schedule };
  }

  async addLeave(doctorId, leaveData) {
    const schedule = await this.getDoctorSchedule(doctorId);
    if (!schedule.leaves) schedule.leaves = [];
    const newLeave = {
      id: "lv_" + Date.now(),
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      reason: leaveData.reason || "Personal Leave",
      type: leaveData.type || "Annual Leave",
      status: "Approved", // Approved or Pending Admin Approval
      requestedAt: new Date().toISOString()
    };
    schedule.leaves.push(newLeave);
    schedule.leaves.sort((a, b) => a.startDate.localeCompare(b.startDate));
    return this.saveDoctorSchedule(doctorId, schedule);
  }

  async removeLeave(doctorId, leaveId) {
    const schedule = await this.getDoctorSchedule(doctorId);
    if (schedule.leaves) {
      schedule.leaves = schedule.leaves.filter(l => l.id !== leaveId);
      return this.saveDoctorSchedule(doctorId, schedule);
    }
    return { success: true, schedule };
  }

  // =========================================================================
  // ACTIVITY AUDIT LOGS
  // =========================================================================

  logDoctorActivity(doctorId, action, details) {
    try {
      const stored = localStorage.getItem(this.ACTIVITY_KEY);
      const logs = stored ? JSON.parse(stored) : [];
      const newEntry = {
        id: "act_" + Date.now(),
        doctorId,
        action,
        details,
        timestamp: new Date().toISOString()
      };
      logs.unshift(newEntry);
      // Keep recent 50
      if (logs.length > 50) logs.length = 50;
      localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(logs));

      const fb = window.VeyoraFirebase;
      if (fb && fb.isConfigured && fb.db) {
        fb.db.collection('doctor_activity').add(newEntry).catch(() => {});
      }
    } catch (e) {}
  }

  getDoctorActivityLogs(doctorId) {
    try {
      const stored = localStorage.getItem(this.ACTIVITY_KEY);
      const logs = stored ? JSON.parse(stored) : [];
      return logs.filter(l => l.doctorId === doctorId);
    } catch (e) {
      return [];
    }
  }
}

window.DoctorService = new DoctorService();
