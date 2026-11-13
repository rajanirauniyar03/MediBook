/**
 * Veyora Part 9 AI Healthcare Assistant Chatbot Comprehensive Test Suite
 * Tests all requirements:
 * 1. UI initialization & welcome message with suggested prompts
 * 2. Emergency triage detection & high-priority warning banner
 * 3. Doctor discovery with natural language filtering (specialty, max fee)
 * 4. Conversational multi-step booking flow (Dept -> Doc -> Date -> Slot -> Review -> Commit)
 * 5. Appointment tracking & policy-compliant cancellation
 * 6. Hospital FAQ & Outpatient Pharmacy enquiries
 * 7. Server /api/chat endpoint validation
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const http = require('http');

// Setup mock browser DOM environment
const localStorageData = {};
const sessionStorageData = {};

const mockLocalStorage = {
  getItem: (key) => localStorageData[key] || null,
  setItem: (key, val) => { localStorageData[key] = String(val); },
  removeItem: (key) => { delete localStorageData[key]; },
  clear: () => { for (const k in localStorageData) delete localStorageData[k]; }
};

const mockSessionStorage = {
  getItem: (key) => sessionStorageData[key] || null,
  setItem: (key, val) => { sessionStorageData[key] = String(val); },
  removeItem: (key) => { delete sessionStorageData[key]; },
  clear: () => { for (const k in sessionStorageData) delete sessionStorageData[k]; }
};

const elements = new Map();

function createMockElement(tag, id = '') {
  let innerHtmlVal = '';
  const el = {
    tagName: tag.toUpperCase(),
    id: id,
    className: '',
    value: '',
    disabled: false,
    style: {},
    attributes: {},
    get innerHTML() {
      return innerHtmlVal;
    },
    set innerHTML(val) {
      innerHtmlVal = val;
      // Parse ids
      const idMatches = val.matchAll(/id="([^"]+)"/g);
      for (const match of idMatches) {
        const childId = match[1];
        if (!elements.has(childId)) {
          elements.set(childId, createMockElement('div', childId));
        }
      }
    },
    classList: {
      add: (c) => { el.className = (el.className + ' ' + c).trim(); },
      remove: (c) => { el.className = el.className.split(' ').filter(x => x !== c).join(' '); },
      toggle: (c) => {
        if (el.className.includes(c)) el.classList.remove(c);
        else el.classList.add(c);
      },
      contains: (c) => el.className.includes(c)
    },
    setAttribute: (k, v) => { el.attributes[k] = v; },
    getAttribute: (k) => el.attributes[k],
    addEventListener: (evt, handler) => {
      el._listeners = el._listeners || {};
      el._listeners[evt] = el._listeners[evt] || [];
      el._listeners[evt].push(handler);
    },
    removeEventListener: () => {},
    appendChild: (child) => {
      el._children = el._children || [];
      el._children.push(child);
      if (child.id) elements.set(child.id, child);
      return child;
    },
    remove: () => {
      if (el.id) elements.delete(el.id);
    },
    focus: () => {},
    reset: () => { el.value = ''; }
  };
  if (id) elements.set(id, el);
  return el;
}

const mockDocument = {
  createElement: (tag) => createMockElement(tag),
  getElementById: (id) => elements.get(id) || null,
  head: createMockElement('head', 'head'),
  body: createMockElement('body', 'body'),
  addEventListener: () => {}
};

const mockWindow = {
  location: { pathname: '/index.html', href: 'http://localhost/index.html' },
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  document: mockDocument,
  confirm: (msg) => true,
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (id) => clearInterval(id),
  console: console,
  lucide: { createIcons: () => {} }
};
mockWindow.window = mockWindow;

const context = vm.createContext(mockWindow);

function loadScript(relPath) {
  const fullPath = path.join(__dirname, '..', relPath);
  const code = fs.readFileSync(fullPath, 'utf8');
  vm.runInContext(code, context, { filename: relPath });
}

console.log("===============================================================================");
console.log("MEDIBOOK PART 9 AI HEALTHCARE ASSISTANT CHATBOT TEST SUITE");
console.log("===============================================================================\n");

// 1. Load Core Services
loadScript('assets/js/data/demo-data.js');
loadScript('assets/js/utils/validators.js');
loadScript('assets/js/utils/formatters.js');
loadScript('assets/js/config/firebase-config.js');
loadScript('assets/js/services/auth-service.js');
loadScript('assets/js/services/appointment-service.js');
loadScript('assets/js/services/doctor-service.js');
loadScript('assets/js/services/admin-service.js');
loadScript('assets/js/services/pharmacy-service.js');
loadScript('assets/js/components/chatbot.js');

console.log("✓ Core services and Chatbot controller loaded into testing context.\n");

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

  // Instantiate Chatbot
  const bot = new context.VeyoraChatbot();
  context.VeyoraChat = bot;

  // =========================================================================
  // 1. CHATBOT UI & INITIALIZATION TESTS
  // =========================================================================
  console.log("[1. CHATBOT INITIALIZATION & UI TESTS]");
  assert(bot !== null && typeof bot === 'object', "Chatbot controller instantiates successfully");
  assert(bot.messages.length >= 1, "Initial welcome message is generated on startup");
  
  const initialMsg = bot.messages[0];
  assert(initialMsg.text.includes("Hello! I'm **Veyora Assistant**"), "Welcome message matches specification");
  assert(Array.isArray(initialMsg.suggestions) && initialMsg.suggestions.length >= 5, "Suggested prompt buttons are provided");
  assert(initialMsg.suggestions.includes("Find a doctor"), "Includes 'Find a doctor' suggested prompt");
  assert(initialMsg.suggestions.includes("Book an appointment"), "Includes 'Book an appointment' suggested prompt");
  assert(initialMsg.suggestions.includes("Check my appointment"), "Includes 'Check my appointment' suggested prompt");
  assert(initialMsg.suggestions.includes("Hospital information"), "Includes 'Hospital information' suggested prompt");
  assert(initialMsg.suggestions.includes("Pharmacy enquiries"), "Includes 'Pharmacy enquiries' suggested prompt");

  // Toggle Chat
  bot.toggleChat(true);
  assert(bot.isOpen === true, "Chatbot window opens when toggled");
  bot.toggleChat(false);
  assert(bot.isOpen === false, "Chatbot window closes when toggled off");

  // =========================================================================
  // 2. CLINICAL SAFETY & EMERGENCY TRIAGE GUARDRAILS
  // =========================================================================
  console.log("\n[2. CLINICAL SAFETY & EMERGENCY TRIAGE TESTS]");
  
  // Test Emergency Symptom Trigger
  await bot.handleUserMessage("I have acute chest pain and difficulty breathing");
  await new Promise(r => setTimeout(r, 600));

  const emergencyReply = bot.messages[bot.messages.length - 1];
  assert(emergencyReply.isEmergency === true, "Life-threatening symptoms flagged with isEmergency: true");
  assert(emergencyReply.text.includes("URGENT MEDICAL NOTICE"), "Emergency notice text is prominently displayed");
  assert(emergencyReply.text.includes("911"), "Directs patient to call emergency services (911)");
  assert(emergencyReply.text.includes("not authorized to evaluate emergency medical conditions"), "Enforces clinical disclaimer prohibiting unverified triage");

  // Test 2.1 Nearby Emergency Facility Locator Method
  const erFacilities = bot.getEmergencyFacilities();
  assert(Array.isArray(erFacilities) && erFacilities.length === 3, "Returns 3 verified 24/7 emergency facilities");
  assert(erFacilities.every(f => f.driveTimeMins <= 30), "All facilities are strictly within a 30-minute drive time");
  assert(erFacilities[0].name.includes("Metropolitan Central Hospital"), "Includes Level 1 Trauma Center");
  assert(erFacilities[0].driveTimeMins === 12, "Metropolitan Central Hospital is 12 min drive");
  assert(erFacilities[0].waitTimeMins === 8, "Displays estimated ER wait time (8 mins)");

  // Test 2.2 locateEmergencyHospitals() execution
  bot.locateEmergencyHospitals();
  await new Promise(r => setTimeout(r, 600));
  const erLocateMsg = bot.messages[bot.messages.length - 1];
  assert(erLocateMsg.emergencyFacilities && erLocateMsg.emergencyFacilities.length === 3, "Attaches emergency facility cards to message");
  assert(erLocateMsg.text.includes("< 30 min"), "States 30-minute radius in response message");

  // =========================================================================
  // 3. DOCTOR DISCOVERY VIA CONVERSATIONAL NLP
  // =========================================================================
  console.log("\n[3. DOCTOR DISCOVERY & SPECIALTY SEARCH TESTS]");
  
  // Test Cardiology Search
  const nlpCardio = bot.localNLPEngine("Can you find me a good cardiologist?", null);
  assert(nlpCardio.action === 'show_doctors', "Cardiology query triggers 'show_doctors' action");
  assert(nlpCardio.filter.department === 'Cardiology', "Identifies 'Cardiology' department filter");

  const cardioDocs = bot.findDoctors(nlpCardio.filter);
  assert(cardioDocs.length > 0, "Finds at least one active cardiologist in database");
  assert(cardioDocs.every(d => d.department === 'Cardiology'), "All returned physicians belong to Cardiology");

  // Test Fee Limit Search
  const nlpFee = bot.localNLPEngine("Find a doctor under $120", null);
  assert(nlpFee.action === 'show_doctors', "Fee query triggers 'show_doctors' action");
  assert(nlpFee.filter.maxFee === 120, "Extracts maximum consultation fee ($120)");
  const feeDocs = bot.findDoctors(nlpFee.filter);
  assert(feeDocs.every(d => (d.consultationFee || d.fee || 100) <= 120), "All returned physicians are within budget");

  // =========================================================================
  // 3.5 SYMPTOM INTELLIGENCE & DOCTOR RECOMMENDATION TESTS
  // =========================================================================
  console.log("\n[3.5 SYMPTOM-TO-SPECIALIST RECOMMENDATION TESTS]");

  // 3.5.1 Headache / Migraine
  const nlpHeadache = bot.localNLPEngine("i have a severe headache and migraine", null);
  assert(nlpHeadache.intent === 'symptom_recommendation', "Headache query triggers symptom_recommendation intent");
  assert(nlpHeadache.action === 'show_doctors', "Headache query sets action to show_doctors");
  assert(nlpHeadache.symptom === 'Headache / Neurological Discomfort', "Identifies headache symptom category");
  assert(nlpHeadache.reply.includes("Neurology"), "Recommends Neurology department for headache");
  assert(nlpHeadache.reply.includes("Dr. Eleanor Vance") && nlpHeadache.reply.includes("$140"), "Lists Dr. Eleanor Vance with $140 fee");
  assert(nlpHeadache.reply.includes("Dr. Claire Sterling") && nlpHeadache.reply.includes("$90"), "Lists Dr. Claire Sterling with $90 fee");

  // 3.5.2 Stomach Pain (with typo "stomac pain")
  const nlpStomach = bot.localNLPEngine("i have stomac pain and gastric trouble", null);
  assert(nlpStomach.intent === 'symptom_recommendation', "Stomach query with typo triggers symptom_recommendation intent");
  assert(nlpStomach.reply.includes("General Medicine"), "Recommends General Medicine for stomach pain");
  assert(nlpStomach.reply.includes("Dr. Claire Sterling") && nlpStomach.reply.includes("$90"), "Lists Dr. Claire Sterling with $90 consultation fee");

  // 3.5.3 Musculoskeletal / Knee & Back Pain
  const nlpOrtho = bot.localNLPEngine("my knee and lower back hurt", null);
  assert(nlpOrtho.intent === 'symptom_recommendation', "Joint/Back query triggers symptom_recommendation");
  assert(nlpOrtho.reply.includes("Orthopedics"), "Recommends Orthopedics for knee/back pain");
  assert(nlpOrtho.reply.includes("Dr. Rachel Adams") && nlpOrtho.reply.includes("$150"), "Lists Dr. Rachel Adams with $150 fee");

  // 3.5.4 Skin Rash / Dermatological
  const nlpSkin = bot.localNLPEngine("I developed a skin rash and itchy pimples", null);
  assert(nlpSkin.reply.includes("Dermatology"), "Recommends Dermatology for skin rash");
  assert(nlpSkin.reply.includes("Dr. Sanjay Patel") && nlpSkin.reply.includes("$110"), "Lists Dr. Sanjay Patel with $110 fee");

  // 3.5.5 Toothache / Dental
  const nlpDental = bot.localNLPEngine("I have a painful toothache and cavity", null);
  assert(nlpDental.reply.includes("Dentistry"), "Recommends Dentistry for toothache");
  assert(nlpDental.reply.includes("Dr. Laura Bennett") && nlpDental.reply.includes("$85"), "Lists Dr. Laura Bennett with $85 fee");

  // 3.5.6 Pediatric Child Illness
  const nlpPedia = bot.localNLPEngine("my 3 year old baby has a fever and cough", null);
  assert(nlpPedia.reply.includes("Pediatrics"), "Recommends Pediatrics for infant/child symptoms");
  assert(nlpPedia.reply.includes("Dr. Marcus Chen") && nlpPedia.reply.includes("$95"), "Lists Dr. Marcus Chen with $95 fee");

  // =========================================================================
  // 3.6 EMERGENCY HOSPITALS & ON-DUTY DOCS (<30 MIN RADIUS) TESTS
  // =========================================================================
  console.log("\n[3.6 EMERGENCY 30-MIN HOSPITALS & DOCS LOCATOR TESTS]");

  // 3.6.1 "find near by 30 min hospitals"
  const nlpNear30 = bot.localNLPEngine("find near by 30 min hospitals", null);
  assert(nlpNear30.intent === 'emergency_locator', "Identifies emergency_locator intent for 30 min hospitals");
  assert(nlpNear30.action === 'show_emergency_hospitals', "Sets action to show_emergency_hospitals");
  assert(nlpNear30.emergencyFacilities.length === 3, "Returns 3 emergency hospital facilities");
  assert(nlpNear30.emergencyFacilities[0].name.includes("Metropolitan Central Hospital"), "Includes Metropolitan Level 1 Trauma");

  // 3.6.2 "emergency hospital near me"
  const nlpNearMe = bot.localNLPEngine("emergency hospital near me", null);
  assert(nlpNearMe.intent === 'emergency_locator', "Identifies emergency hospital near me query");

  // 3.6.3 "docs for emergency situation within 30 min"
  const nlpDocEmerg = bot.localNLPEngine("docs for emergency situation within 30 minutes", null);
  assert(nlpDocEmerg.intent === 'emergency_locator', "Identifies docs for emergency situation within 30 minutes");
  assert(nlpDocEmerg.emergencyFacilities.some(f => f.onDutyLead.includes("Dr. Alexander Wright")), "Includes on-duty trauma lead doctor");

  // =========================================================================
  // 4. MULTI-STEP CONVERSATIONAL APPOINTMENT BOOKING WIZARD
  // =========================================================================
  console.log("\n[4. MULTI-STEP CONVERSATIONAL BOOKING FLOW TESTS]");

  // Step 1: User says "Book an appointment"
  const nlpBooking = bot.localNLPEngine("I want to book an appointment with a doctor", null);
  assert(nlpBooking.action === 'show_departments', "Booking intent triggers department selection");
  bot.handleActionResponse(nlpBooking);
  assert(bot.bookingState.active === true, "Booking state machine activated");
  assert(bot.bookingState.step === 'awaiting_department', "Booking state set to 'awaiting_department'");

  // Step 2: User selects Department "Cardiology"
  bot.selectDepartment("Cardiology");
  await new Promise(r => setTimeout(r, 600));
  assert(bot.bookingState.department === "Cardiology", "Department stored in booking state");
  assert(bot.bookingState.step === 'awaiting_doctor', "Booking state advanced to 'awaiting_doctor'");

  // Step 3: Select Doctor
  const testDoc = cardioDocs[0];
  bot.startDoctorBooking(testDoc.id, encodeURIComponent(testDoc.name), testDoc.department, testDoc.consultationFee || 150);
  await new Promise(r => setTimeout(r, 600));
  assert(bot.bookingState.doctorId === testDoc.id, "Doctor ID recorded in booking state");
  assert(bot.bookingState.doctorName === testDoc.name, "Doctor Name recorded in booking state");
  assert(bot.bookingState.step === 'awaiting_date', "Booking state advanced to 'awaiting_date'");

  // Step 4: Available Dates
  const availableDates = bot.getNextAvailableDates(testDoc.id);
  assert(availableDates.length > 0, "Calculates available dates matching doctor schedule");
  const chosenDate = availableDates[0];
  bot.selectDate(chosenDate.dateStr, chosenDate.displayLabel);
  await new Promise(r => setTimeout(r, 600));
  assert(bot.bookingState.date === chosenDate.dateStr, "Selected date recorded");
  assert(bot.bookingState.step === 'awaiting_slot', "Booking state advanced to 'awaiting_slot'");

  // Step 5: Time Slots
  const availableSlots = bot.getAvailableSlots(testDoc.id, chosenDate.dateStr);
  assert(availableSlots.length > 0, "Retrieves available time slots for chosen date");
  const chosenSlot = availableSlots[0];
  bot.selectSlot(chosenSlot);
  await new Promise(r => setTimeout(r, 600));
  assert(bot.bookingState.timeSlot === chosenSlot, "Selected time slot recorded");
  assert(bot.bookingState.step === 'awaiting_confirmation', "Booking state advanced to 'awaiting_confirmation'");

  // Verify Confirmation Card in last message
  const confMsg = bot.messages[bot.messages.length - 1];
  assert(confMsg.bookingConfirmation !== undefined, "Confirmation card details attached to message");
  assert(confMsg.bookingConfirmation.doctorName === testDoc.name, "Confirmation reflects chosen doctor");
  assert(confMsg.bookingConfirmation.date === chosenDate.dateStr, "Confirmation reflects chosen date");
  assert(confMsg.bookingConfirmation.timeSlot === chosenSlot, "Confirmation reflects chosen slot");

  // Step 6: Confirmation Execution (Authenticate Demo Patient)
  await context.AuthService.login("patient@veyora.com", "password123", "patient");
  const currentUser = context.AuthService.getCurrentUser();
  assert(currentUser && currentUser.role === 'patient', "Authenticated as patient for booking confirmation");

  await bot.confirmAppointmentBooking();
  const confirmedMsg = bot.messages[bot.messages.length - 1];
  assert(confirmedMsg.text.includes("Appointment Confirmed!"), "Booking confirmed successfully in hospital ledger");
  assert(bot.bookingState.active === false, "Booking state machine reset upon successful completion");

  // Verify appointment exists in AppointmentService
  const patientAppointments = await context.AppointmentService.getPatientAppointments(currentUser.uid, currentUser.email);
  const foundApt = patientAppointments.find(a => a.doctorId === testDoc.id && a.date === chosenDate.dateStr && a.timeSlot === chosenSlot);
  assert(foundApt !== undefined, "Confirmed appointment persisted in patient's appointment records");
  assert(foundApt.status === 'Confirmed', "Appointment created with 'Confirmed' status");

  // =========================================================================
  // 5. APPOINTMENT TRACKING & CANCELLATION VIA CHATBOT
  // =========================================================================
  console.log("\n[5. APPOINTMENT TRACKING & CANCELLATION TESTS]");

  // 5.1 Track Appointments (Authenticated)
  const trackResponse = bot.localNLPEngine("Check my appointment status", currentUser);
  assert(trackResponse.action === 'show_my_appointments', "Triggers 'show_my_appointments' for logged in user");
  const myApts = bot.getCurrentUserAppointments();
  assert(myApts.length > 0, "Chatbot retrieves current user's appointments");

  // 5.2 Track Appointments (Unauthenticated)
  const unauthTrack = bot.localNLPEngine("Check my appointment status", null);
  assert(unauthTrack.intent === 'auth_required', "Prompts login when unauthenticated guest asks for appointment status");

  // 5.3 Cancel Appointment
  const aptToCancel = foundApt;
  await bot.executeCancellation(aptToCancel.id, aptToCancel.reference || aptToCancel.id);
  const cancelResultMsg = bot.messages[bot.messages.length - 1];
  assert(cancelResultMsg.text.includes("Appointment Cancelled"), "Cancellation executed and confirmed in chat");

  // Verify in database that appointment is now Cancelled
  const updatedApt = await context.AppointmentService.getAppointmentById(aptToCancel.id);
  assert(updatedApt.status === 'Cancelled', "Appointment status updated to 'Cancelled' in hospital database");

  // =========================================================================
  // 6. HOSPITAL FAQ & PHARMACY MODULE INTEGRATION
  // =========================================================================
  console.log("\n[6. HOSPITAL FAQ & PHARMACY INTEGRATION TESTS]");

  // 6.1 Hospital Hours & Location
  const faqHours = bot.localNLPEngine("What are your hospital operating hours and phone number?", null);
  assert(faqHours.intent === 'hospital_faq', "Hospital FAQ intent identified");
  assert(faqHours.reply.includes("Address:"), "Provides physical hospital address");
  assert(faqHours.reply.includes("General Inquiries:"), "Provides general inquiries phone number");
  assert(faqHours.reply.includes("Emergency 24/7:"), "Provides 24/7 emergency hotline");

  // 6.2 Pharmacy Enquiries
  const rxEnquiry = bot.localNLPEngine("Tell me about the pharmacy and medicines", null);
  assert(rxEnquiry.intent === 'pharmacy_enquiry', "Pharmacy enquiry intent identified");
  assert(rxEnquiry.reply.includes("Pharmacy"), "Returns outpatient pharmacy information");
  assert(rxEnquiry.reply.includes("cannot recommend prescription dosages"), "Enforces pharmaceutical safety disclaimer");

  // =========================================================================
  // 7. BACKEND SERVER /api/chat ENDPOINT TEST
  // =========================================================================
  console.log("\n[7. BACKEND SERVER /api/chat ENDPOINT TESTS]");

  const EventEmitter = require('events');
  const serverModule = require('../server.js');

  function invokeChatAPI(payload) {
    return new Promise((resolve) => {
      const req = new EventEmitter();
      req.connection = { destroy: () => {} };
      let resHeaders = {};
      let statusCode = 200;
      let resBody = '';
      const res = {
        writeHead: (code, headers) => { statusCode = code; resHeaders = headers; },
        end: (chunk) => {
          if (chunk) resBody += chunk;
          resolve({ status: statusCode, headers: resHeaders, data: JSON.parse(resBody) });
        }
      };

      serverModule.handleChatAPI(req, res);
      req.emit('data', JSON.stringify(payload));
      req.emit('end');
    });
  }

  // Test 7.1 Emergency Keyword via /api/chat
  const resEmergency = await invokeChatAPI({ message: "Patient has chest pain and cannot breathe" });
  assert(resEmergency.status === 200, "POST /api/chat returns HTTP 200");
  assert(resEmergency.data.isEmergency === true, "/api/chat detects emergency symptom via API");
  assert(resEmergency.data.action === 'emergency_alert', "/api/chat sets action to emergency_alert");

  // Test 7.2 Doctor Search via /api/chat
  const resDoctor = await invokeChatAPI({ message: "Find a dermatologist" });
  assert(resDoctor.status === 200, "POST /api/chat handles doctor discovery query");
  assert(resDoctor.data.intent === 'doctor_search', "/api/chat returns doctor_search intent");
  assert(resDoctor.data.filter.department === 'Dermatology', "/api/chat extracts Dermatology filter");

  // Test 7.3 Hospital Info via /api/chat
  const resHospital = await invokeChatAPI({ message: "Where is the hospital located?" });
  assert(resHospital.status === 200, "POST /api/chat handles hospital information query");
  assert(resHospital.data.intent === 'hospital_faq', "/api/chat returns hospital_faq intent");

  // Test 7.4 Symptom-to-Doctor Recommendation via /api/chat
  const resStomach = await invokeChatAPI({ message: "i have stomac pain and indigestion" });
  assert(resStomach.status === 200, "POST /api/chat handles stomach pain symptom");
  assert(resStomach.data.intent === 'symptom_recommendation', "/api/chat classifies symptom_recommendation intent");
  assert(resStomach.data.action === 'show_doctors', "/api/chat triggers show_doctors action");
  assert(resStomach.data.reply.includes("General Medicine"), "/api/chat recommends General Medicine for stomach pain");
  assert(resStomach.data.reply.includes("$90"), "/api/chat includes $90 consultation fee in response");

  // Test 7.5 Headache Recommendation via /api/chat
  const resHeadache = await invokeChatAPI({ message: "i have headache and migraine" });
  assert(resHeadache.status === 200, "POST /api/chat handles headache symptom");
  assert(resHeadache.data.reply.includes("Neurology"), "/api/chat recommends Neurology for headache");
  assert(resHeadache.data.reply.includes("$140"), "/api/chat includes Dr. Eleanor Vance $140 fee");

  // Test 7.6 Nearby Emergency Facilities via /api/chat
  const resEmergNear = await invokeChatAPI({ message: "find near by 30 min hospitals or docs for emergency" });
  assert(resEmergNear.status === 200, "POST /api/chat handles nearby emergency hospital request");
  assert(resEmergNear.data.intent === 'emergency_locator', "/api/chat returns emergency_locator intent");
  assert(resEmergNear.data.action === 'show_emergency_hospitals', "/api/chat returns show_emergency_hospitals action");
  assert(resEmergNear.data.emergencyFacilities.length === 3, "/api/chat provides 3 emergency hospital facilities");
  assert(resEmergNear.data.reply.includes("Metropolitan Central Hospital"), "/api/chat mentions Metropolitan Central Hospital in reply");

  console.log(`\n===============================================================================`);
  console.log(`ALL TESTS PASSED: ${passedTests} / ${totalTests} assertions verified!`);
  console.log(`===============================================================================\n`);

  process.exit(0);
}

runTests().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
