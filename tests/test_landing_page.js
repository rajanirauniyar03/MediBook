/**
 * MediBook+ Homepage Test Suite
 * Validates DOM elements, branding, symptom matcher, specialty links,
 * featured doctor loading, value pillars, 3-step workflow, and chatbot bridge.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('='.repeat(80));
console.log('MEDIBOOK+ HOMEPAGE VERIFICATION TEST SUITE');
console.log('='.repeat(80));

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

let passCount = 0;
function test(description, assertion) {
  try {
    assertion();
    console.log(`  ✓ ${description}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    process.exit(1);
  }
}

console.log('\n[1. BRANDING & METADATA TESTS]');
test('Page title contains MediBook+', () => {
  assert(html.includes('<title>MediBook+ – Online Doctor Appointment & Healthcare Management Platform</title>'));
});

test('Header logo displays MediBook+ with brand-plus badge', () => {
  assert(html.includes('<span>Medi<span class="brand-highlight">Book</span><span class="brand-plus">+</span></span>'));
});

test('Footer logo displays MediBook+ with brand-plus badge', () => {
  assert(html.includes('<span>Medi<span class="brand-highlight" style="color: var(--primary-400);">Book</span><span class="brand-plus">+</span></span>'));
});

console.log('\n[2. NAVIGATION BAR TESTS]');
test('Navigation includes Find Doctors link', () => {
  assert(html.includes('<li><a href="find-doctors.html" class="nav-link">Find Doctors</a></li>'));
});

test('Navigation includes Specialties link', () => {
  assert(html.includes('<li><a href="#specialties" class="nav-link">Specialties</a></li>'));
});

test('Navigation includes My Appointments link', () => {
  assert(html.includes('<li><a href="portal/patient/appointments.html" class="nav-link">My Appointments</a></li>'));
});

test('Navigation includes About Us link', () => {
  assert(html.includes('<li><a href="about.html" class="nav-link">About Us</a></li>'));
});

test('Desktop actions include Login and Get Started', () => {
  assert(html.includes('<a href="auth/login.html" class="btn btn-ghost">Login</a>'));
  assert(html.includes('<span>Get Started</span>'));
});

test('Mobile drawer includes all primary navigation links', () => {
  assert(html.includes('<li><a href="find-doctors.html" class="mobile-nav-link"><i data-lucide="user-search"></i> Find Doctors</a></li>'));
  assert(html.includes('<li><a href="#specialties" class="mobile-nav-link"><i data-lucide="layers"></i> Specialties</a></li>'));
  assert(html.includes('<li><a href="portal/patient/appointments.html" class="mobile-nav-link"><i data-lucide="calendar"></i> My Appointments</a></li>'));
  assert(html.includes('<li><a href="about.html" class="mobile-nav-link"><i data-lucide="info"></i> About Us</a></li>'));
});

console.log('\n[3. HERO SECTION & SMART SYMPTOM MATCHER TESTS]');
test('Hero background has radial gradient styled class', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'assets', 'css', 'landing.css'), 'utf8');
  assert(css.includes('radial-gradient(circle at 50% 20%, rgba(37, 99, 235, 0.08) 0%, rgba(248, 250, 252, 0) 70%)'));
});

test('Hero badge pill displays AI-Powered Health Matcher', () => {
  assert(html.includes('AI-Powered Health Matcher &bull; Instant Booking'));
});

test('Hero main headline matches specification', () => {
  assert(html.includes('Your health, simplified.'));
  assert(html.includes('Tell us what hurts</span>, we\'ll find the expert.'));
});

test('Hero supporting text matches specification', () => {
  assert(html.includes('Finding the right doctor shouldn\'t be complicated. Describe what you\'re experiencing or search for a specialist, and let MediBook+ guide you.'));
});

test('Smart Symptom Matcher search input exists with requested placeholder', () => {
  assert(html.includes('id="hero-symptom-input"'));
  assert(html.includes('placeholder="e.g. Sharp pain in my knee after running, frequent headaches, or I need a cardiologist..."'));
});

test('Coral action button "Find My Doctor" with sparkle icon exists', () => {
  assert(html.includes('class="btn-coral hero-symptom-btn"'));
  assert(html.includes('<span>Find My Doctor</span>'));
});

test('Helper link "Not sure where to start? Our AI assistant will guide you →" exists', () => {
  assert(html.includes('id="ai-assistant-guide-link"'));
  assert(html.includes('Not sure where to start? Our AI assistant will guide you &rarr;'));
});

test('Popular symptom chips exist', () => {
  assert(html.includes('data-symptom="I have frequent headaches and migraine"'));
  assert(html.includes('data-symptom="Sharp pain in my knee after running"'));
  assert(html.includes('data-symptom="Severe stomach ache after meals"'));
  assert(html.includes('data-symptom="Red itchy skin rash on arm"'));
  assert(html.includes('data-symptom="I need a cardiologist for chest checkup"'));
});

test('Trust badges exist in Hero', () => {
  assert(html.includes('100% Verified Specialists'));
  assert(html.includes('Instant 30-Sec Booking'));
  assert(html.includes('HIPAA Encrypted & Private'));
});

console.log('\n[4. SPECIALTIES & FEATURED DOCTORS TESTS]');
test('Specialties section has id "specialties"', () => {
  assert(html.includes('id="specialties"'));
  assert(html.includes('id="specialties-grid"'));
});

test('Featured Doctors section heading matches specification', () => {
  assert(html.includes('<h2 class="section-title">Meet Our Trusted Specialists</h2>'));
  assert(html.includes('id="featured-doctors-grid"'));
});

console.log('\n[5. WHY CHOOSE MEDIBOOK+ (4 PILLARS) TESTS]');
test('Contains 4 specific benefit pillars', () => {
  assert(html.includes('<h3>Easy Appointment Booking</h3>'));
  assert(html.includes('<h3>AI-Powered Doctor Discovery</h3>'));
  assert(html.includes('<h3>Trusted Healthcare Professionals</h3>'));
  assert(html.includes('<h3>Manage Your Appointments</h3>'));
});

console.log('\n[6. HOW IT WORKS (3 STEPS) TESTS]');
test('Contains 3 horizontal numbered steps matching specification', () => {
  assert(html.includes('<h3>1. Find Your Specialist</h3>'));
  assert(html.includes('<h3>2. Choose Your Appointment</h3>'));
  assert(html.includes('<h3>3. Get Confirmed</h3>'));
});

console.log('\n[7. CALL TO ACTION & FOOTER TESTS]');
test('CTA banner headline and supporting text match specification', () => {
  assert(html.includes('<h2 class="cta-title">Your health deserves the right care.</h2>'));
  assert(html.includes('Start your healthcare journey with MediBook+ today.'));
  assert(html.includes('<span>Find a Doctor</span>'));
  assert(html.includes('<span>Get Started</span>'));
});

test('Footer contains multi-column sections with requested categories', () => {
  assert(html.includes('<h4 class="footer-heading">Quick Links</h4>'));
  assert(html.includes('<h4 class="footer-heading">For Professionals</h4>'));
  assert(html.includes('<h4 class="footer-heading">Support</h4>'));
  assert(html.includes('Doctor Login'));
  assert(html.includes('Hospital Login'));
  assert(html.includes('Join MediBook+'));
  assert(html.includes('Contact Us'));
  assert(html.includes('&copy; 2026 MediBook+ Healthcare Systems Inc. All rights reserved.'));
});

console.log('\n[8. DIRECT DOCTOR MATCHING & CONSULTATION FEE TESTS]');
// Load landing page controller logic in testing context
const landingJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'pages', 'landing.js'), 'utf8');
const demoDataJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'data', 'demo-data.js'), 'utf8');

global.window = {};
global.document = {
  addEventListener: () => {},
  getElementById: () => null,
  querySelectorAll: () => []
};
eval(demoDataJs.replace('const MEDIBOOK_DATA', 'global.MEDIBOOK_DATA = window.MEDIBOOK_DATA'));
eval(landingJs);

test('Smart Matcher finds Orthopedics doctor with price for knee pain', () => {
  const res = window.findMatchingDoctors('Sharp pain in my knee after running');
  assert(res.doctors.length > 0);
  assert(res.doctors.some(d => d.specialization === 'Orthopedics'));
  const orthoDoc = res.doctors.find(d => d.specialization === 'Orthopedics');
  assert.strictEqual(orthoDoc.consultationFee, 150);
});

test('Smart Matcher finds Neurology & General Medicine doctors with fees for headache', () => {
  const res = window.findMatchingDoctors('I have frequent headaches');
  assert(res.doctors.length >= 2);
  const neuroDoc = res.doctors.find(d => d.specialization === 'Neurology');
  const genDoc = res.doctors.find(d => d.specialization === 'General Medicine');
  assert(neuroDoc && neuroDoc.consultationFee === 140);
  assert(genDoc && genDoc.consultationFee === 90);
});

test('Smart Matcher finds Dermatology doctor with price for rash', () => {
  const res = window.findMatchingDoctors('Red itchy skin rash on arm');
  assert(res.doctors.length > 0);
  const dermDoc = res.doctors.find(d => d.specialization === 'Dermatology');
  assert(dermDoc && dermDoc.consultationFee === 110);
});

test('Direct search results section and price grid exist in HTML markup', () => {
  assert(html.includes('id="search-results-section"'));
  assert(html.includes('id="search-results-grid"'));
  assert(html.includes('id="clear-search-results-btn"'));
  assert(html.includes('id="results-heading"'));
});

console.log('\n[9. RESPONSIVE DESIGN & MOBILE COMPATIBILITY TESTS]');
const landingCss = fs.readFileSync(path.join(__dirname, '..', 'assets', 'css', 'landing.css'), 'utf8');
const layoutCss = fs.readFileSync(path.join(__dirname, '..', 'assets', 'css', 'layout.css'), 'utf8');
const chatbotCss = fs.readFileSync(path.join(__dirname, '..', 'assets', 'css', 'chatbot.css'), 'utf8');

test('Viewport meta tag properly configured for mobile devices', () => {
  assert(html.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0">'));
});

test('Mobile navigation hamburger toggle and drawer markup present', () => {
  assert(html.includes('id="mobile-nav-toggle"'));
  assert(html.includes('id="mobile-drawer"'));
  assert(html.includes('class="mobile-drawer-content"'));
});

test('Landing CSS includes 1024px tablet breakpoint rules', () => {
  assert(landingCss.includes('@media (max-width: 1024px)'));
  assert(landingCss.includes('.hero-visual {\n    display: none;\n  }'));
});

test('Landing CSS includes 767px small tablet / phablet breakpoint rules', () => {
  assert(landingCss.includes('@media (max-width: 767px)'));
  assert(landingCss.includes('.desktop-only {\n    display: none;\n  }'));
});

test('Landing CSS includes 579px mobile phone breakpoint rules', () => {
  assert(landingCss.includes('@media (max-width: 579px)'));
  assert(landingCss.includes('grid-template-columns: auto 1fr;'));
});

test('Landing CSS includes 360px extra-small mobile breakpoint rules', () => {
  assert(landingCss.includes('@media (max-width: 360px)'));
});

test('Doctor card bottom actions stack and become full-width on mobile', () => {
  assert(landingCss.includes('.doctor-card-bottom {\n    padding: 1rem;\n    flex-direction: column;\n    align-items: stretch;'));
});

test('CTA buttons stack vertically into full-width tap targets on mobile', () => {
  assert(landingCss.includes('.cta-buttons {\n    flex-direction: column;'));
});

test('Header logo and actions scale gracefully on small screens (<480px)', () => {
  assert(layoutCss.includes('@media (max-width: 480px)'));
  assert(layoutCss.includes('.header-container {\n    height: 64px;\n  }'));
});

test('Chatbot launcher collapses to compact touch icon on mobile (<640px)', () => {
  assert(chatbotCss.includes('.medibook-chat-launcher .launcher-label {\n    display: none;\n  }'));
});

console.log('\n' + '='.repeat(80));
console.log(`ALL HOMEPAGE TESTS PASSED: ${passCount} / ${passCount} assertions verified!`);
console.log('='.repeat(80));
