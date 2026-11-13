/**
 * Veyora Comprehensive End-to-End Functional Test Suite
 * Tests all 4 roles and end-to-end workflows:
 * - Patient: Auth, Doctor Search, Slot Reservation, Double-booking lock, Cancellation, Profile Update
 * - Doctor: Auth, Schedule View, Confirm/Reject, Complete Visit, Availability Update
 * - Admin: Auth, Doctor Credentialing, Patient Audit, Department CRUD, Report Aggregation, CSV Export
 * - Pharmacy: Stock Management, Prescription Processing, Availability Enquiries
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Setup mock browser window environment
const localStorageData = {};
const mockLocalStorage = {
  getItem: (key) => localStorageData[key] || null,
  setItem: (key, val) => { localStorageData[key] = String(val); },
  removeItem: (key) => { delete localStorageData[key]; },
  clear: () => { for (const k in localStorageData) delete localStorageData[k]; }
};

const mockDocument = {
  addEventListener: () => {},
  body: {
    appendChild: () => {},
    removeChild: () => {}
  },
  createElement: (tag) => ({
    setAttribute: () => {},
    click: () => {}
  })
};

const mockWindow = {
  location: { pathname: '/index.html', href: 'http://localhost/index.html' },
  localStorage: mockLocalStorage,
  document: mockDocument,
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (id) => clearInterval(id),
  Blob: class { constructor(parts) { this.parts = parts; } },
  URL: { createObjectURL: () => 'blob:mock-url' },
  console: console
};
mockWindow.window = mockWindow;

const context = vm.createContext(mockWindow);

function loadScript(relPath) {
  const fullPath = path.join(__dirname, '..', relPath);
  const code = fs.readFileSync(fullPath, 'utf8');
  vm.runInContext(code, context, { filename: relPath });
}

console.log("===============================================================================");
console.log("MEDIBOOK PART 7 COMPREHENSIVE FUNCTIONAL & SECURITY TEST SUITE");
console.log("===============================================================================\n");

// 1. Load Core Dependencies
loadScript('assets/js/data/demo-data.js');
loadScript('assets/js/utils/validators.js');
loadScript('assets/js/utils/formatters.js');
loadScript('assets/js/config/firebase-config.js');
loadScript('assets/js/services/auth-service.js');
loadScript('assets/js/services/appointment-service.js');
loadScript('assets/js/services/doctor-service.js');
loadScript('assets/js/services/admin-service.js');
loadScript('assets/js/services/pharmacy-service.js');

console.log("✓ All Veyora core scripts & services loaded into testing context.\n");

async function runTests() {
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (!condition) {
      console.error(`  FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    passedTests++;
    console.log(`  ✓ ${message}`);
  }

  // =========================================================================
  // SCENARIO 1: PATIENT WORKFLOWS
  // =========================================================================
  console.log("[1. PATIENT WORKFLOW TESTS]");

  // 1.1 Patient Registration
  const authService = context.AuthService;
  const regResult = await authService.register({
    displayName: "Test Patient Jane",
    email: "jane.test@example.com",
    password: "SecurePass123!",
    phone: "+1 (555) 777-8899",
    role: "patient",
    bloodGroup: "A+"
  });
  assert(regResult.success === true, "Patient registration succeeds with valid data");
  assert(authService.getCurrentUser().displayName === "Test Patient Jane", "Active session set upon registration");

  // 1.2 Prevent privileged registration
  const rogueAdminReg = await authService.register({
    displayName: "Fake Admin",
    email: "hacker@test.com",
    password: "pass",
    phone: "+1 000",
    role: "admin"
  });
  assert(rogueAdminReg.success === false, "Public registration prohibits admin role creation");

  // 1.3 Patient Login with Demo Account
  await authService.logout();
  assert(authService.getCurrentUser() === null, "Logout clears session");
  const loginRes = await authService.login("patient@veyora.com", "password123", "patient");
  assert(loginRes.success === true, "Patient demo login succeeds");
  assert(loginRes.user.role === "patient", "Patient has role 'patient'");

  // 1.4 Doctor Search & Department Discovery
  const doctors = context.MEDIBOOK_DATA.doctors;
  assert(doctors.length >= 6, `Doctors roster contains ${doctors.length} doctors`);
  const cardioDocs = doctors.filter(d => d.department === "Cardiology");
  assert(cardioDocs.length >= 1, "Cardiology department doctors discoverable");

  // Helper: Find next date matching physician's working days
  function getNextAvailableDate(availableDays = ["Monday", "Wednesday", "Friday"]) {
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const weekday = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
      if (availableDays.includes(weekday)) {
        return dateStr;
      }
    }
    return "2026-11-16";
  }

  // 1.5 Multi-step Appointment Booking
  const targetDoc = cardioDocs[0];
  const apptService = context.AppointmentService;
  const targetDateStr = getNextAvailableDate(targetDoc.availableDays || ["Monday", "Wednesday", "Friday"]);

  const bookRes = await apptService.bookAppointment({
    doctorId: targetDoc.id,
    doctorName: targetDoc.name,
    department: targetDoc.department,
    consultationFee: targetDoc.consultationFee || targetDoc.fee,
    date: targetDateStr,
    timeSlot: "09:00 AM",
    mode: "in-person",
    patientName: "Sarah Jenkins",
    patientEmail: "patient@veyora.com",
    patientPhone: "+1 (555) 234-5678",
    reason: "Annual cardiac checkup"
  });
  console.log("DEBUG bookRes:", bookRes, "for date:", targetDateStr);
  assert(bookRes.success === true, `Appointment booking confirmed with ref ${bookRes.appointment ? bookRes.appointment.reference : 'N/A'}`);

  // 1.6 Double-Booking Prevention (Atomic Reservation Mechanism)
  const duplicateRes = await apptService.bookAppointment({
    doctorId: targetDoc.id,
    doctorName: targetDoc.name,
    department: targetDoc.department,
    consultationFee: targetDoc.consultationFee || targetDoc.fee,
    date: targetDateStr,
    timeSlot: "09:00 AM",
    mode: "in-person",
    patientName: "Another Patient",
    patientEmail: "another@example.com",
    patientPhone: "+1 (555) 999-0000",
    reason: "Conflicting appointment"
  });
  assert(duplicateRes.success === false, "Duplicate booking on same date & time slot correctly blocked");

  // 1.7 Appointment Cancellation with Policy
  const cancelRes = await apptService.cancelAppointment(bookRes.appointment.id, "Personal schedule conflict");
  assert(cancelRes.success === true, "Patient appointment cancellation succeeded");
  const cancelledApt = await apptService.getAppointmentById(bookRes.appointment.id);
  assert(cancelledApt.status === "Cancelled", "Appointment marked as Cancelled");

  // 1.8 Profile Update
  const updateProfileRes = await authService.updateProfile({
    phone: "+1 (555) 999-8888",
    bloodGroup: "O+"
  });
  assert(updateProfileRes.success === true, "Patient profile updated successfully");
  assert(authService.getCurrentUser().phone === "+1 (555) 999-8888", "Session reflects updated phone");

  console.log("  => All Patient scenarios passed!\n");

  // =========================================================================
  // SCENARIO 2: DOCTOR WORKFLOWS
  // =========================================================================
  console.log("[2. DOCTOR WORKFLOW TESTS]");

  // 2.1 Doctor Login
  await authService.logout();
  const docLogin = await authService.login("doctor@veyora.com", "password123", "doctor");
  assert(docLogin.success === true, "Doctor login succeeds with demo credentials");
  assert(docLogin.user.role === "doctor", "Doctor session verified");

  // 2.2 View Doctor Appointments
  const docService = context.DoctorService;
  const docAppointments = await apptService.getDoctorAppointments(docLogin.user.id);
  assert(Array.isArray(docAppointments), "Doctor appointment list is accessible");

  // 2.3 Confirm / Reject / Complete appointment
  const docAptDateStr = getNextAvailableDate(["Monday", "Wednesday", "Friday"]);

  const pendingApt = await apptService.bookAppointment({
    doctorId: docLogin.user.id,
    doctorName: docLogin.user.displayName,
    department: docLogin.user.department || "Cardiology",
    consultationFee: 150,
    date: docAptDateStr,
    timeSlot: "10:30 AM",
    mode: "video",
    patientName: "Patient for Doctor",
    patientEmail: "patient@veyora.com",
    reason: "Prescription consultation"
  });
  if (!pendingApt.success) console.error("DEBUG pendingApt error:", pendingApt.error);
  assert(pendingApt.success === true, "Test appointment created for physician");

  // Confirm
  const confirmRes = await apptService.confirmAppointment(pendingApt.appointment.id, "Confirmed by Dr. Wright");
  assert(confirmRes.success === true, "Doctor confirmed the appointment");

  // Complete consultation with notes
  const completeRes = await apptService.completeAppointment(pendingApt.appointment.id, "Patient vital signs normal. Advised hydration.", "Atorvastatin 20mg");
  assert(completeRes.success === true, "Doctor completed consultation with clinical notes and prescription");

  // 2.4 Update Availability
  const availRes = await docService.saveDoctorSchedule(docLogin.user.id, {
    availableDays: ["Monday", "Wednesday", "Friday"],
    availableSlots: ["09:00 AM", "11:00 AM", "03:00 PM"]
  });
  assert(availRes.success === true, "Doctor updated schedule availability");

  console.log("  => All Doctor scenarios passed!\n");

  // =========================================================================
  // SCENARIO 3: ADMIN WORKFLOWS
  // =========================================================================
  console.log("[3. HOSPITAL ADMINISTRATOR WORKFLOW TESTS]");

  // 3.1 Admin Login
  await authService.logout();
  const adminLogin = await authService.login("admin@veyora.com", "password123", "admin");
  assert(adminLogin.success === true, "Hospital administrator authenticated");
  assert(adminLogin.user.role === "admin", "Admin role confirmed");

  const adminService = context.AdminService;

  // 3.2 Add Doctor
  const addDocRes = await adminService.addDoctor({
    name: "Dr. Jonathan Davis",
    qualification: "MD, FACS",
    department: "Neurology",
    consultationFee: 175,
    experienceYears: 12,
    email: "j.davis@veyora.com",
    phone: "+1 (555) 444-1234",
    availableDays: ["Tuesday", "Thursday"]
  });
  assert(addDocRes.success === true, "Admin registered new physician on hospital roster");

  // 3.3 Manage Patients & Appointment History
  const patientRoster = adminService.getPatients();
  assert(patientRoster.length >= 2, `Admin retrieved ${patientRoster.length} registered patient accounts`);
  const patientHistory = adminService.getPatientAppointments("patient@veyora.com");
  assert(Array.isArray(patientHistory), "Admin retrieved patient consultation history");

  // 3.4 Manage Departments
  const addDeptRes = await adminService.addDepartment({
    name: "Ophthalmology",
    headDoctor: "Dr. Jonathan Davis",
    roomLocation: "Clinic Wing C, Room 204",
    doctorCount: 3,
    icon: "eye",
    shortDesc: "Comprehensive vision testing and corneal surgery."
  });
  assert(addDeptRes.success === true, "Admin added Ophthalmology department");
  const toggleDept = await adminService.toggleDepartmentStatus(addDeptRes.department.id);
  assert(toggleDept.success === true, "Admin toggled department status");

  // 3.5 Administrative Appointment Override / Cancel
  const adminDocDateStr = getNextAvailableDate(addDocRes.doctor.availableDays || ["Tuesday", "Thursday"]);
  const overrideApt = await apptService.bookAppointment({
    doctorId: addDocRes.doctor.id,
    doctorName: addDocRes.doctor.name,
    department: "Neurology",
    consultationFee: 175,
    date: adminDocDateStr,
    timeSlot: "02:00 PM",
    mode: "in-person",
    patientName: "Audit Patient",
    patientEmail: "audit@veyora.com",
    reason: "Admin override test"
  });
  const adminCancelRes = await adminService.adminCancelAppointment(overrideApt.appointment.id, "Hospital unit renovation");
  assert(adminCancelRes.success === true, "Admin successfully executed administrative cancellation");

  // 3.6 Reports Aggregation & CSV Export
  const stats = adminService.getPlatformStats();
  assert(stats.totalAppointments >= 1, `Real-time stats aggregated (${stats.totalAppointments} appointments)`);
  const chartData = adminService.getChartData();
  assert(chartData.months.labels.length > 0, "Monthly trend chart data prepared");
  assert(chartData.departments.labels.length > 0, "Department breakdown chart data prepared");
  const csvRes = adminService.exportAppointmentsCSV();
  assert(csvRes.success === true, `CSV Report generated with ${csvRes.count} rows`);

  console.log("  => All Admin scenarios passed!\n");

  // =========================================================================
  // SCENARIO 4: PHARMACY WORKFLOWS
  // =========================================================================
  console.log("[4. PHARMACY WORKFLOW TESTS]");

  // 4.1 Pharmacy Login
  await authService.logout();
  const pharmLogin = await authService.login("pharmacist@veyora.com", "password123", "pharmacist");
  assert(pharmLogin.success === true, "Pharmacist authenticated");
  assert(pharmLogin.user.role === "pharmacy" || pharmLogin.user.role === "pharmacist", "Pharmacy staff verified");

  const pharmacyService = context.PharmacyService;

  // 4.2 Add Medicine to Catalogue
  const addMedRes = await pharmacyService.addMedicine({
    name: "Atorvastatin Calcium 20mg",
    genericName: "Atorvastatin",
    brand: "Lipitor",
    category: "Cardiovascular",
    price: 24.50,
    stock: 120,
    unit: "30 Tablets",
    expiryDate: "2027-12-31",
    prescriptionRequired: true,
    manufacturer: "Pfizer Labs",
    description: "Cholesterol-lowering HMG-CoA reductase inhibitor."
  });
  assert(addMedRes.success === true, "Pharmacist added medicine to catalogue");

  // 4.3 Update Stock
  const stockUpdateRes = await pharmacyService.updateStockQuantity(addMedRes.medicine.id, 150, "Restock from distributor shipment", pharmLogin.user.displayName);
  assert(stockUpdateRes.success === true, "Pharmacist updated stock levels");
  const med = await pharmacyService.getMedicineById(addMedRes.medicine.id);
  assert(med.stock === 150, "Stock balance verified at 150 units");

  // 4.4 Submit Prescription Request
  const rxRes = await pharmacyService.submitPrescriptionRequest({
    patientName: "Eleanor Vance",
    patientEmail: "eleanor.vance@example.com",
    patientPhone: "+1 (555) 888-2233",
    doctorName: "Dr. Jennifer Hayes",
    fileName: "rx_scan_001.pdf",
    prescriptionFileUrl: "https://example.com/rx_scan_001.pdf",
    patientNotes: "Please dispense generic version if available"
  });
  assert(rxRes.success === true, `Prescription request ${rxRes.prescription.id} accepted`);

  // 4.5 Pharmacist Reviews & Updates Status
  const rxStatusRes = await pharmacyService.updatePrescriptionStatus(
    rxRes.prescription.id,
    "Approved",
    "Prescription verified with Dr. Hayes. Dispensed 30-day supply with instructions."
  );
  assert(rxStatusRes.success === true, "Pharmacist marked prescription as Approved");

  // 4.6 Medicine Availability Enquiry
  const enquiryRes = await pharmacyService.submitEnquiry({
    patientName: "Customer Dave",
    patientEmail: "dave@example.com",
    patientPhone: "+1 (555) 123-4567",
    medicineName: "Atorvastatin 20mg",
    question: "Do you have 90-day supplies in stock?"
  });
  assert(enquiryRes.success === true, "Customer enquiry received by pharmacy");

  console.log("  => All Pharmacy scenarios passed!\n");

  console.log("===============================================================================");
  console.log(`ALL TESTS PASSED: ${passedTests} / ${totalTests} functional assertions succeeded!`);
  console.log("===============================================================================");
}

runTests().catch(err => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
