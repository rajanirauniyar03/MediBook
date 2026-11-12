/**
 * MediBook Production Node.js Server & Secure AI Proxy
 * Zero-dependency native HTTP server serving static files and protected /api/chat endpoint.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load environment variables from .env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  });
}

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.rules': 'text/plain; charset=utf-8'
};

const SYSTEM_HEALTHCARE_PROMPT = `
You are the MediBook AI Healthcare Assistant for Metropolitan Central Hospital & Health Alliance.
Your mission is to help patients discover doctors, guide them through appointment booking, check existing appointments, provide accurate hospital facility information, and answer pharmacy stock enquiries.

CRITICAL HEALTHCARE SAFETY RULES:
1. You are an administrative and operational assistant, NOT a doctor.
2. NEVER diagnose medical conditions or give clinical treatment plans.
3. NEVER prescribe medications or suggest dosage alterations.
4. If a user describes emergency symptoms (e.g., severe chest pain, sudden numbness, difficulty breathing, profuse bleeding, signs of stroke):
   - You MUST immediately advise calling 911 or the hospital emergency hotline (+1 800 432-9911).
   - Advise them to proceed to the nearest emergency department immediately.
5. If answering about doctors, fees, departments, hospital hours, or pharmacy stock, rely strictly on verified hospital data. Do not invent doctor names or hospital policies.
6. SYMPTOM-TO-SPECIALIST RECOMMENDATION:
   When a user describes symptoms (such as headache, stomach pain, back pain, knee pain, rash, toothache, child fever, palpitations, period cramps):
   - Analyze the symptom and identify the best-suited medical department/specialty (e.g. Headache -> Neurology or General Medicine; Stomach pain -> General Medicine; Back/Knee pain -> Orthopedics; Rash -> Dermatology; Toothache -> Dentistry; Child symptoms -> Pediatrics; Period/Pelvic pain -> Gynecology; Fever/Cold -> General Medicine).
   - In your response, clearly state which specialist department is recommended and explain why in 1-2 empathetic sentences.
   - List the relevant verified doctors and their consultation fees (e.g. Dr. Eleanor Vance - $140 / visit, Dr. Claire Sterling - $90 / visit) so the patient can compare fees and make an informed decision.
   - Always include a brief disclaimer that this is clinical scheduling guidance, not a medical diagnosis.
`;

/**
 * Handle AI Chat Request
 */
async function handleChatAPI(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 50000) {
      req.connection.destroy(); // Prevent payload exhaustion
    }
  });

  req.on('end', async () => {
    try {
      const parsed = JSON.parse(body || '{}');
      const userMessage = (parsed.message || '').trim();
      const history = parsed.history || [];
      const user = parsed.user || null;
      const contextData = parsed.context || {};

      if (!userMessage) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Message cannot be empty.' }));
      }

      // Check for Life-Threatening Emergency Keywords First
      const emergencyRegex = /\b(chest pain|heart attack|can't breathe|cannot breathe|shortness of breath|stroke|unconscious|heavy bleeding|suicide|overdose|choking|severe burn)\b/i;
      if (emergencyRegex.test(userMessage)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          reply: "⚠️ **URGENT MEDICAL NOTICE:** If you or someone you are with is experiencing potentially life-threatening symptoms, please call emergency services immediately (**911**) or contact our 24/7 Emergency Hotline at **+1 (800) 432-9911**.\n\nAs an AI assistant, I am not authorized to evaluate emergency medical conditions or provide clinical triage. Please proceed to the nearest emergency room immediately.",
          isEmergency: true,
          action: 'emergency_alert'
        }));
      }

      // 1. Call Gemini API if Key is Configured
      if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
          
          const promptParts = [
            { text: SYSTEM_HEALTHCARE_PROMPT },
            { text: `Current Context: ${JSON.stringify(contextData)}` },
            { text: `Authenticated User: ${user ? `${user.displayName} (${user.email}, Role: ${user.role})` : 'Anonymous Guest'}` }
          ];

          history.slice(-6).forEach(h => {
            promptParts.push({ text: `${h.sender === 'user' ? 'Patient' : 'Assistant'}: ${h.text}` });
          });
          promptParts.push({ text: `Patient: ${userMessage}` });

          const aiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: promptParts }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 800
              }
            })
          });

          if (aiResponse.ok) {
            const data = await aiResponse.json();
            const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({
                reply: candidateText,
                source: 'gemini-1.5-flash'
              }));
            }
          }
        } catch (apiErr) {
          console.warn('[MediBook Server] Gemini API error, engaging fallback NLP engine:', apiErr.message);
        }
      }

      // 2. Intelligent Built-in Medical NLP Engine (Fallback / Offline / Local)
      const nlpResult = processNLPFallback(userMessage, history, contextData, user);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(nlpResult));

    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error processing chat request.' }));
    }
  });
}

/**
 * Symptom Analysis & Clinical Specialty Recommendation
 */
function detectSymptomAndRecommend(text) {
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

/**
 * Intelligent Healthcare NLP Engine
 * Understands intents: doctor_search, book_appointment, check_appointment,
 * cancel_appointment, hospital_info, pharmacy_enquiry, greeting, medical_disclaimer
 */
function processNLPFallback(msg, history, context, user) {
  const lower = msg.toLowerCase();

  // 1. Cancellation Intent
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

  // 2. Appointment Tracking
  if (lower.includes('my appointment') || lower.includes('check appointment') || lower.includes('next appointment') || 
      lower.includes('my bookings') || (lower.includes('status') && (lower.includes('appointment') || lower.includes('booking')))) {
    if (!user) {
      return {
        reply: "To review or track your personal consultations, please sign in to your MediBook account. You can log in securely here: [Patient Login](auth/login.html).",
        intent: 'auth_required',
        action: 'prompt_login'
      };
    }
    return {
      reply: `Here are your recent appointment records on file, **${user.displayName || 'Patient'}**:`,
      intent: 'appointment_tracking',
      action: 'show_my_appointments'
    };
  }

  // 3. Symptom Analysis & Doctor Recommendation
  const symptomRec = detectSymptomAndRecommend(msg);
  if (symptomRec) {
    const demoDocs = [
      { name: "Dr. Alexander Wright", department: "Cardiology", fee: 120, exp: 16 },
      { name: "Dr. Eleanor Vance", department: "Neurology", fee: 140, exp: 12 },
      { name: "Dr. Marcus Chen", department: "Pediatrics", fee: 95, exp: 14 },
      { name: "Dr. Rachel Adams", department: "Orthopedics", fee: 150, exp: 18 },
      { name: "Dr. Sanjay Patel", department: "Dermatology", fee: 110, exp: 10 },
      { name: "Dr. Sophia Thorne", department: "Gynecology", fee: 130, exp: 15 },
      { name: "Dr. Laura Bennett", department: "Dentistry", fee: 85, exp: 11 },
      { name: "Dr. Claire Sterling", department: "General Medicine", fee: 90, exp: 17 },
      { name: "Dr. Jonathan Ross", department: "Cardiology", fee: 135, exp: 13 }
    ];

    const matched = demoDocs.filter(d => symptomRec.recommendedDepts.includes(d.department));
    const feeText = matched.map(d => `• **${d.name}** (${d.department}, ${d.exp} yrs exp) – **$${d.fee} / visit**`).join('\n');
    const deptsDisplay = symptomRec.recommendedDepts.join(' or ');

    return {
      reply: `Based on your described symptoms (**${symptomRec.symptom}**), our AI clinical navigator recommends consulting a specialist in **${deptsDisplay}**.\n\n${symptomRec.rationale}\n\nHere are our accredited physicians along with their consultation fees so you can compare and decide:\n${feeText}\n\n*Review their profiles or select **Book** on any card below to schedule your consultation:*`,
      intent: 'symptom_recommendation',
      action: 'show_doctors',
      filter: { departments: symptomRec.recommendedDepts },
      symptom: symptomRec.symptom
    };
  }

  // 4. Booking Intent
  if (lower.includes('book') || lower.includes('schedule') || lower.includes('make an appointment') || lower.includes('see a doctor') || lower.includes('reserve')) {
    return {
      reply: "I'd be glad to help you schedule a consultation! To get started, please select which medical department you require:",
      intent: 'booking_flow',
      step: 'select_department',
      action: 'show_departments'
    };
  }

  // 4. Doctor Discovery
  if (lower.includes('doctor') || lower.includes('specialist') || lower.includes('cardiologist') || 
      lower.includes('dermatologist') || lower.includes('neurologist') || lower.includes('pediatrician') ||
      lower.includes('orthopedic') || lower.includes('dentist') || lower.includes('find') || lower.includes('search')) {
    
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
        ? `Here are our verified specialists in **${dept}**${maxFee ? ` with consultation fees under $${maxFee}` : ''}. You can view their credentials or book an appointment directly below:`
        : `We have board-certified physicians across 8 medical departments. Which department would you like to explore?`,
      intent: 'doctor_search',
      filter: { department: dept, maxFee },
      action: 'show_doctors'
    };
  }

  // 5. Hospital Facility & Contact FAQ
  if (lower.includes('hour') || lower.includes('timing') || lower.includes('open') || lower.includes('address') || 
      lower.includes('location') || lower.includes('phone') || lower.includes('contact') || lower.includes('hospital') ||
      lower.includes('emergency')) {
    return {
      reply: `**Metropolitan Central Hospital & Health Alliance**\n\n• **Address:** 500 Healthcare Boulevard, Suite 400, San Francisco, CA 94107\n• **General Inquiries:** +1 (800) 432-6334\n• **24/7 Emergency Department:** +1 (800) 432-9911\n• **Clinical Outpatient Hours:** Monday – Saturday: 08:00 AM – 08:00 PM (Emergency 24/7)\n• **Services:** Outpatient Clinics, Diagnostic Imaging, Inpatient Surgery, ICU & 24/7 Pharmacy.`,
      intent: 'hospital_faq',
      action: 'hospital_info'
    };
  }

  // 6. Pharmacy Enquiries
  if (lower.includes('pharmacy') || lower.includes('medicine') || lower.includes('drug') || lower.includes('prescription') || 
      lower.includes('stock') || lower.includes('medication')) {
    return {
      reply: `Our Outpatient Pharmacy carries a wide range of cardiovascular, diabetic, antibiotic, and wellness medications.\n\n• **Pharmacy Hours:** Mon – Sat: 08:00 AM – 08:00 PM\n• **Prescription Uploads:** You can upload physician prescriptions on our [Pharmacy Portal](pharmacy.html) for fast pickup or delivery preparation.\n• **Safety Policy:** Please note that I cannot prescribe medicines or suggest changes to your prescribed treatment. Would you like to search our medicine catalogue?`,
      intent: 'pharmacy_enquiry',
      action: 'show_pharmacy_options'
    };
  }

  // 7. General Greetings & Help
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('help')) {
    return {
      reply: "Hello! I'm **MediBook Assistant**, your AI clinical and scheduling navigator. I can help you find specialists, guide you through booking appointments, check your visit status, or provide hospital and pharmacy information. How can I assist you today?",
      intent: 'greeting',
      action: 'show_suggestions'
    };
  }

  // Default Fallback
  return {
    reply: "I understand! I can help you discover accredited physicians, schedule or manage appointments, or check hospital information. Could you please specify which service or department you're interested in?",
    intent: 'general_query',
    action: 'show_suggestions'
  };
}

/**
 * Main HTTP Server Request Router
 */
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // API Endpoints
  if (pathname === '/api/chat' && req.method === 'POST') {
    return handleChatAPI(req, res);
  }

  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
  }

  // Static File Serving
  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = 'index.html';
  if (safePath.startsWith('/') || safePath.startsWith('\\')) safePath = safePath.substring(1);

  const fullPath = path.join(__dirname, safePath);

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`<h1>404 Not Found</h1><p>The requested file <code>${pathname}</code> was not found.</p>`);
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff'
    });

    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`MediBook Healthcare Platform running at http://localhost:${PORT}`);
    console.log(`AI Chat API active at /api/chat (Gemini/NLP Engine)`);
    console.log(`================================================================`);
  });
}

module.exports = {
  server,
  handleChatAPI,
  processNLPFallback
};
