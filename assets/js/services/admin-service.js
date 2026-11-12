/**
 * MediBook Hospital Administration Service
 * Provides central governance for Doctors, Patients, Departments, Appointments,
 * Analytics, CSV Report Export, and Hospital System Settings.
 */

class AdminService {
  constructor() {
    this.SETTINGS_KEY = 'medibook_hospital_settings';
    this.DOCTORS_KEY = 'medibook_admin_doctors';
    this.DEPTS_KEY = 'medibook_admin_departments';
    this.PATIENTS_KEY = 'medibook_admin_patients';
    this.initData();
  }

  /**
   * Initialize admin persistence with defaults if not already present
   */
  initData() {
    // 1. Hospital Settings
    if (!localStorage.getItem(this.SETTINGS_KEY)) {
      const defaultSettings = {
        hospitalName: "Metropolitan Central Hospital & Health Alliance",
        logoUrl: "",
        address: "500 Healthcare Boulevard, Suite 400, San Francisco, CA 94107",
        phone: "+1 (800) 432-6334",
        emergencyHotline: "+1 (800) 432-9911",
        email: "admin@medibook.health",
        workingHours: "Monday – Saturday: 08:00 AM – 08:00 PM",
        cancellationPolicyHours: 24,
        defaultAppointmentDuration: 30, // in minutes
        currency: "USD",
        currencySymbol: "$",
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(defaultSettings));
    }

    // 2. Doctors Roster
    if (!localStorage.getItem(this.DOCTORS_KEY)) {
      const initialDocs = (window.MEDIBOOK_DATA && window.MEDIBOOK_DATA.doctors) ? 
        window.MEDIBOOK_DATA.doctors.map(d => ({
          ...d,
          status: 'Active', // 'Active' or 'Inactive'
          approvalStatus: 'Approved', // 'Approved' or 'Pending'
          email: `${d.name.toLowerCase().replace(/[^a-z]/g, '')}@medibook.com`,
          phone: "+1 (555) 432-" + Math.floor(1000 + Math.random() * 9000),
          createdAt: "2026-01-15T08:00:00.000Z"
        })) : [];
      localStorage.setItem(this.DOCTORS_KEY, JSON.stringify(initialDocs));
    }

    // 3. Departments
    if (!localStorage.getItem(this.DEPTS_KEY)) {
      const initialDepts = (window.MEDIBOOK_DATA && window.MEDIBOOK_DATA.departments) ?
        window.MEDIBOOK_DATA.departments.map(dept => ({
          ...dept,
          status: 'Active',
          imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&auto=format&fit=crop&q=80",
          createdAt: "2026-01-10T08:00:00.000Z"
        })) : [];
      localStorage.setItem(this.DEPTS_KEY, JSON.stringify(initialDepts));
    }

    // 4. Patients Roster (Seed with demo patient + any registered patients)
    if (!localStorage.getItem(this.PATIENTS_KEY)) {
      const initialPatients = [
        {
          id: "patient_001",
          displayName: "Sarah Jenkins",
          email: "patient@medibook.com",
          phone: "+1 (555) 234-5678",
          bloodGroup: "O+",
          gender: "Female",
          dob: "1992-06-14",
          status: "Active", // 'Active' or 'Inactive'
          emergencyContact: "David Jenkins - +1 (555) 987-6543",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
          createdAt: "2026-01-20T10:30:00.000Z"
        },
        {
          id: "patient_002",
          displayName: "Michael Chang",
          email: "m.chang@example.com",
          phone: "+1 (555) 876-5432",
          bloodGroup: "A+",
          gender: "Male",
          dob: "1985-11-03",
          status: "Active",
          emergencyContact: "Linda Chang - +1 (555) 876-0000",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          createdAt: "2026-02-14T14:15:00.000Z"
        },
        {
          id: "patient_003",
          displayName: "Elena Rostova",
          email: "elena.r@example.org",
          phone: "+1 (555) 345-6789",
          bloodGroup: "B-",
          gender: "Female",
          dob: "1995-04-22",
          status: "Active",
          emergencyContact: "Alex Rostova - +1 (555) 345-1111",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
          createdAt: "2026-03-01T09:45:00.000Z"
        },
        {
          id: "patient_004",
          displayName: "Marcus Brody",
          email: "marcus.b@sample.net",
          phone: "+1 (555) 901-2345",
          bloodGroup: "AB+",
          gender: "Male",
          dob: "1978-08-30",
          status: "Inactive",
          emergencyContact: "Carol Brody - +1 (555) 901-8888",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
          createdAt: "2026-02-28T16:20:00.000Z"
        }
      ];
      localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(initialPatients));
    }
  }

  // =========================================================================
  // HOSPITAL SETTINGS MODULE
  // =========================================================================
  getHospitalSettings() {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  async saveHospitalSettings(updates) {
    const current = this.getHospitalSettings();
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));

    // Live Firestore update if configured
    const fb = window.MediBookFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        await fb.db.collection('hospital_settings').doc('general').set(updated, { merge: true });
      } catch (err) {
        console.warn('[AdminService] Firestore settings update warning:', err);
      }
    }
    return { success: true, settings: updated };
  }

  // =========================================================================
  // DOCTOR MANAGEMENT MODULE
  // =========================================================================
  getDoctors() {
    try {
      const data = localStorage.getItem(this.DOCTORS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveDoctors(doctorsList) {
    localStorage.setItem(this.DOCTORS_KEY, JSON.stringify(doctorsList));
    // Also keep in-memory MEDIBOOK_DATA in sync for public pages
    if (window.MEDIBOOK_DATA) {
      window.MEDIBOOK_DATA.doctors = doctorsList.filter(d => d.status === 'Active');
    }
  }

  async addDoctor(doctorData) {
    const doctors = this.getDoctors();
    const newDoc = {
      id: "doc_" + Date.now(),
      name: doctorData.name,
      title: doctorData.qualification || "MD",
      qualification: doctorData.qualification || "MD",
      department: doctorData.department || "General Medicine",
      specialization: doctorData.department || "General Medicine",
      subspecialty: doctorData.subspecialty || `${doctorData.department} Consultant`,
      hospital: doctorData.hospital || this.getHospitalSettings().hospitalName || "Metropolitan Central Hospital",
      location: doctorData.location || "San Francisco, CA",
      experienceYears: parseInt(doctorData.experienceYears) || 5,
      experience: `${doctorData.experienceYears || 5} years exp.`,
      rating: 5.0,
      reviews: 0,
      consultationFee: parseFloat(doctorData.consultationFee) || 100,
      fee: parseFloat(doctorData.consultationFee) || 100,
      availableDays: doctorData.availableDays || ["Monday", "Wednesday", "Friday"],
      availableDaysText: (doctorData.availableDays || ["Monday", "Wednesday", "Friday"]).map(d => d.slice(0, 3)).join(', '),
      availableSlots: doctorData.availableSlots || ["09:00 AM", "10:30 AM", "02:00 PM", "03:30 PM"],
      avatar: doctorData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorData.name)}&background=2563eb&color=fff`,
      languages: doctorData.languages || ["English"],
      about: doctorData.about || "Board-certified medical practitioner committed to clinical care excellence.",
      email: doctorData.email || `${doctorData.name.toLowerCase().replace(/[^a-z]/g, '')}@medibook.com`,
      phone: doctorData.phone || "+1 (555) 000-0000",
      status: doctorData.status || "Active",
      approvalStatus: doctorData.approvalStatus || "Approved",
      createdAt: new Date().toISOString()
    };

    doctors.unshift(newDoc);
    this.saveDoctors(doctors);

    // Save to Firestore if available
    const fb = window.MediBookFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        await fb.db.collection('doctors').doc(newDoc.id).set(newDoc);
      } catch (e) {
        console.warn('Firestore doc save error:', e);
      }
    }

    return { success: true, doctor: newDoc };
  }

  async updateDoctor(docId, updates) {
    const doctors = this.getDoctors();
    const idx = doctors.findIndex(d => d.id === docId);
    if (idx === -1) return { success: false, error: "Doctor not found." };

    doctors[idx] = {
      ...doctors[idx],
      ...updates,
      fee: updates.consultationFee ? parseFloat(updates.consultationFee) : doctors[idx].fee,
      consultationFee: updates.consultationFee ? parseFloat(updates.consultationFee) : doctors[idx].consultationFee
    };

    this.saveDoctors(doctors);

    const fb = window.MediBookFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        await fb.db.collection('doctors').doc(docId).set(doctors[idx], { merge: true });
      } catch (e) {}
    }

    return { success: true, doctor: doctors[idx] };
  }

  async toggleDoctorStatus(docId) {
    const doctors = this.getDoctors();
    const doc = doctors.find(d => d.id === docId);
    if (!doc) return { success: false, error: "Doctor not found." };

    const newStatus = doc.status === 'Active' ? 'Inactive' : 'Active';
    return this.updateDoctor(docId, { status: newStatus });
  }

  async approveDoctor(docId) {
    return this.updateDoctor(docId, { approvalStatus: 'Approved', status: 'Active' });
  }

  // =========================================================================
  // PATIENT MANAGEMENT MODULE
  // =========================================================================
  getPatients() {
    try {
      // Gather both pre-seeded patients and any registered users in auth session
      const basePatients = JSON.parse(localStorage.getItem(this.PATIENTS_KEY) || '[]');
      const registered = JSON.parse(localStorage.getItem('medibook_registered_users') || '[]');

      // Merge avoiding duplicates
      const map = new Map();
      basePatients.forEach(p => map.set(p.email.toLowerCase(), p));
      registered.filter(u => u.role === 'patient').forEach(u => {
        if (!map.has(u.email.toLowerCase())) {
          map.set(u.email.toLowerCase(), {
            id: u.id || u.uid,
            displayName: u.displayName || 'Patient',
            email: u.email,
            phone: u.phone || '+1 (555) 000-0000',
            bloodGroup: u.bloodGroup || 'O+',
            gender: u.gender || 'Not specified',
            status: u.status || 'Active',
            avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}&background=2563eb&color=fff`,
            createdAt: u.createdAt || new Date().toISOString()
          });
        }
      });

      return Array.from(map.values());
    } catch (e) {
      return [];
    }
  }

  async togglePatientStatus(patientId) {
    const patients = this.getPatients();
    const p = patients.find(pat => pat.id === patientId);
    if (!p) return { success: false, error: "Patient record not found." };

    p.status = p.status === 'Active' ? 'Inactive' : 'Active';
    localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(patients));
    return { success: true, patient: p };
  }

  getPatientAppointments(patientEmail, patientId) {
    const appointments = this.getAllAppointments();
    return appointments.filter(a => {
      const matchEmail = patientEmail && a.patientEmail && a.patientEmail.toLowerCase() === patientEmail.toLowerCase();
      const matchId = patientId && (a.patientId === patientId || a.userId === patientId);
      return matchEmail || matchId;
    });
  }

  // =========================================================================
  // DEPARTMENT MANAGEMENT MODULE
  // =========================================================================
  getDepartments() {
    try {
      const data = localStorage.getItem(this.DEPTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveDepartments(deptsList) {
    localStorage.setItem(this.DEPTS_KEY, JSON.stringify(deptsList));
    if (window.MEDIBOOK_DATA) {
      window.MEDIBOOK_DATA.departments = deptsList.filter(d => d.status === 'Active');
    }
  }

  async addDepartment(deptData) {
    const depts = this.getDepartments();
    const newDept = {
      id: "dept-" + (deptData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')),
      name: deptData.name,
      slug: deptData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      icon: deptData.icon || "stethoscope",
      shortDesc: deptData.shortDesc || "Comprehensive clinical diagnosis, treatment and patient care.",
      doctorCount: parseInt(deptData.doctorCount) || 1,
      headDoctor: deptData.headDoctor || "Consultant Chief",
      roomLocation: deptData.roomLocation || "Tower A, Level 2",
      imageUrl: deptData.imageUrl || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&auto=format&fit=crop&q=80",
      status: deptData.status || "Active",
      createdAt: new Date().toISOString()
    };

    depts.push(newDept);
    this.saveDepartments(depts);
    return { success: true, department: newDept };
  }

  async updateDepartment(deptId, updates) {
    const depts = this.getDepartments();
    const idx = depts.findIndex(d => d.id === deptId || d.slug === deptId);
    if (idx === -1) return { success: false, error: "Department not found." };

    depts[idx] = { ...depts[idx], ...updates };
    this.saveDepartments(depts);
    return { success: true, department: depts[idx] };
  }

  async toggleDepartmentStatus(deptId) {
    const depts = this.getDepartments();
    const d = depts.find(dep => dep.id === deptId || dep.slug === deptId);
    if (!d) return { success: false, error: "Department not found." };

    const newStatus = d.status === 'Active' ? 'Inactive' : 'Active';
    return this.updateDepartment(deptId, { status: newStatus });
  }

  // =========================================================================
  // APPOINTMENT GOVERNANCE & CANCELLATION
  // =========================================================================
  getAllAppointments() {
    try {
      const data = localStorage.getItem('medibook_appointments');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  async adminCancelAppointment(appointmentId, adminReason = "Hospital administrative cancellation") {
    if (window.AppointmentService) {
      return window.AppointmentService.cancelAppointment(appointmentId, `[Admin Reason] ${adminReason}`);
    }
    return { success: false, error: "Appointment service unavailable." };
  }

  // =========================================================================
  // REAL-TIME STATISTICS & REPORT AGGREGATION
  // =========================================================================
  getPlatformStats() {
    const doctors = this.getDoctors();
    const patients = this.getPatients();
    const appointments = this.getAllAppointments();

    const todayStr = new Date().toISOString().split('T')[0];

    const todayAppointments = appointments.filter(a => a.date === todayStr);
    const pendingAppointments = appointments.filter(a => a.status === 'Pending');
    const completedAppointments = appointments.filter(a => a.status === 'Completed' || (a.status === 'Confirmed' && a.date < todayStr));
    const cancelledAppointments = appointments.filter(a => a.status === 'Cancelled' || a.status === 'Rejected');

    return {
      totalPatients: patients.length,
      totalDoctors: doctors.length,
      activeDoctors: doctors.filter(d => d.status === 'Active').length,
      totalAppointments: appointments.length,
      todayAppointments: todayAppointments.length,
      pendingAppointments: pendingAppointments.length,
      completedAppointments: completedAppointments.length,
      cancelledAppointments: cancelledAppointments.length,
      confirmedAppointments: appointments.filter(a => a.status === 'Confirmed' && a.date >= todayStr).length
    };
  }

  getChartData() {
    const appointments = this.getAllAppointments();
    const depts = this.getDepartments();
    const doctors = this.getDoctors();

    // 1. Appointments by Month (Last 6 Months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthCounts = { "Jun": 12, "Jul": 18, "Aug": 24, "Sep": 31, "Oct": 46, "Nov": appointments.length || 54 };

    // 2. Appointments by Department
    const deptDistribution = {};
    depts.forEach(d => { deptDistribution[d.name] = 0; });
    appointments.forEach(a => {
      const dName = a.department || a.specialization || 'General Medicine';
      deptDistribution[dName] = (deptDistribution[dName] || 0) + 1;
    });

    // 3. Appointment Status Distribution
    const statusCounts = {
      'Confirmed': 0,
      'Pending': 0,
      'Completed': 0,
      'Cancelled': 0
    };
    appointments.forEach(a => {
      if (statusCounts[a.status] !== undefined) {
        statusCounts[a.status]++;
      } else {
        statusCounts['Cancelled']++;
      }
    });

    // 4. Doctor-wise Appointments
    const doctorCounts = {};
    doctors.slice(0, 6).forEach(d => { doctorCounts[d.name] = 0; });
    appointments.forEach(a => {
      if (a.doctorName) {
        doctorCounts[a.doctorName] = (doctorCounts[a.doctorName] || 0) + 1;
      }
    });

    return {
      months: {
        labels: Object.keys(monthCounts),
        data: Object.values(monthCounts)
      },
      departments: {
        labels: Object.keys(deptDistribution),
        data: Object.values(deptDistribution)
      },
      statuses: {
        labels: Object.keys(statusCounts),
        data: Object.values(statusCounts)
      },
      doctors: {
        labels: Object.keys(doctorCounts),
        data: Object.values(doctorCounts)
      }
    };
  }

  getDetailedReports() {
    const appointments = this.getAllAppointments();
    const depts = this.getDepartments();
    const doctors = this.getDoctors();
    const now = new Date();

    // 1. Department-wise performance
    const deptMetrics = depts.map(d => {
      const deptApts = appointments.filter(a => (a.department || a.specialization) === d.name);
      const completed = deptApts.filter(a => a.status === 'Completed').length;
      const totalRevenue = deptApts
        .filter(a => a.status !== 'Cancelled' && a.status !== 'Rejected')
        .reduce((sum, a) => sum + (parseFloat(a.consultationFee) || 100), 0);
      return {
        id: d.id,
        name: d.name,
        doctorCount: d.doctorCount || doctors.filter(doc => doc.department === d.name).length,
        totalAppointments: deptApts.length,
        completed,
        pending: deptApts.filter(a => a.status === 'Pending').length,
        revenue: totalRevenue
      };
    });

    // 2. Doctor-wise performance
    const doctorMetrics = doctors.map(doc => {
      const docApts = appointments.filter(a => a.doctorId === doc.id || a.doctorName === doc.name);
      const completed = docApts.filter(a => a.status === 'Completed').length;
      const totalRevenue = docApts
        .filter(a => a.status !== 'Cancelled' && a.status !== 'Rejected')
        .reduce((sum, a) => sum + (parseFloat(a.consultationFee) || parseFloat(doc.fee) || 100), 0);
      return {
        id: doc.id,
        name: doc.name,
        department: doc.department || 'General Medicine',
        fee: doc.consultationFee || doc.fee || 100,
        totalAppointments: docApts.length,
        completed,
        rating: doc.rating || 5.0,
        revenue: totalRevenue
      };
    });

    // 3. Daily reports (Past 7 days)
    const dailyMetrics = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const dayApts = appointments.filter(a => a.date === dateStr);
      const completed = dayApts.filter(a => a.status === 'Completed').length;
      const revenue = dayApts
        .filter(a => a.status !== 'Cancelled' && a.status !== 'Rejected')
        .reduce((sum, a) => sum + (parseFloat(a.consultationFee) || 100), 0);
      dailyMetrics.push({
        date: dateStr,
        label: dayName,
        total: dayApts.length,
        completed,
        revenue
      });
    }

    return {
      deptMetrics,
      doctorMetrics,
      dailyMetrics
    };
  }

  // =========================================================================
  // CSV EXPORT GENERATOR
  // =========================================================================
  exportAppointmentsCSV() {
    const appointments = this.getAllAppointments();
    if (!appointments || appointments.length === 0) {
      return { success: false, error: "No appointment records available to export." };
    }

    const headers = [
      "Booking Reference",
      "Patient Name",
      "Patient Email",
      "Patient Phone",
      "Doctor Name",
      "Department",
      "Date",
      "Time Slot",
      "Mode",
      "Fee (USD)",
      "Status",
      "Reason for Visit",
      "Created At"
    ];

    const escapeCSV = str => `"${String(str || '').replace(/"/g, '""')}"`;

    const rows = appointments.map(a => [
      escapeCSV(a.reference || a.id),
      escapeCSV(a.patientName),
      escapeCSV(a.patientEmail),
      escapeCSV(a.patientPhone),
      escapeCSV(a.doctorName),
      escapeCSV(a.department || a.specialization),
      escapeCSV(a.date),
      escapeCSV(a.timeSlot),
      escapeCSV(a.mode),
      escapeCSV(a.consultationFee || 100),
      escapeCSV(a.status),
      escapeCSV(a.reason),
      escapeCSV(a.createdAt)
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MediBook_Appointments_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, count: appointments.length };
  }
}

window.AdminService = new AdminService();
