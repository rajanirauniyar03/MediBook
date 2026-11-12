# MediBook – Healthcare Appointment & Hospital Management Platform

MediBook is a modern, responsive, enterprise-grade healthcare SaaS platform connecting patients, accredited medical doctors, and hospital administrators.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Design System**: Custom CSS variables, responsive grid, flexbox, mobile drawer
- **Icons**: Lucide Icons
- **Typography**: Plus Jakarta Sans & Inter
- **Authentication**: Firebase Authentication (Email/Password) with automatic offline/demo simulation fallback
- **Database & Storage**: Cloud Firestore & Firebase Storage
- **Charts / Reports**: Chart.js (configured for upcoming admin/doctor portals)

---

## 📁 Project Architecture

```
MediBook/
├── index.html                   # Public Landing Page (Hero, Search, Specialties, Testimonials, CTA)
├── find-doctors.html            # Public Doctor Search & Filtering Directory
├── departments.html             # Clinical Departments & Specialization Catalog
├── about.html                   # About Us, Mission, Hospital Accreditations
├── contact.html                 # Contact Inquiries & 24/7 Emergency Hotline
├── auth/
│   ├── login.html               # Role-based Login (Patient, Doctor, Admin) + 1-Click Demo presets
│   └── register.html            # Registration with dynamic role-specific fields
├── portal/
│   ├── patient/
│   │   └── dashboard.html       # Patient Portal Dashboard
│   ├── doctor/
│   │   └── dashboard.html       # Doctor Schedule & Clinic Dashboard
│   └── admin/
│       └── dashboard.html       # Hospital Administration Console
├── assets/
│   ├── css/
│   │   ├── variables.css        # Design tokens: palette, typography, shadows, radii
│   │   ├── base.css             # CSS reset, typography, utilities, skeleton loaders
│   │   ├── components.css       # Buttons, cards, form controls, toast, modals
│   │   ├── layout.css           # Sticky header, desktop nav, mobile drawer, footer
│   │   ├── landing.css          # Hero search, pillars, feature sections, testimonials
│   │   └── auth.css             # Split-screen auth layout, tabs, password strength
│   └── js/
│       ├── config/
│       │   └── firebase-config.js # Firebase initialization & credentials loader
│       ├── data/
│       │   └── demo-data.js     # Doctors, departments, metrics, and demo user accounts
│       ├── utils/
│       │   ├── validators.js    # Client-side form validation & password strength evaluation
│       │   └── formatters.js    # Currency, dates, and status pill formatters
│       ├── components/
│       │   ├── toast.js         # Floating notification toast system
│       │   └── navbar.js        # Responsive nav, active state highlighter, auth state dropdown
│       ├── services/
│       │   └── auth-service.js  # Firebase Auth + Firestore profiles + offline simulation fallback
│       └── pages/
│           ├── landing.js       # Dynamic search submission & landing page renderers
│           └── auth.js          # Login & registration forms, role tabs, demo presets
└── README.md
```

---

## 🚀 How to Run the Project

No compilation or build step is required! You can open and serve the application using any local web server:

### Option A: Using Python (Built-in)
```bash
python -m http.server 3000
```
Then visit `http://localhost:3000` in your web browser.

### Option B: Using Node.js (npx serve)
```bash
npx serve . -p 3000
```

### Option C: VS Code Live Server
Right-click on `index.html` and choose **"Open with Live Server"**.

---

## 🔑 Firebase Configuration

To connect live Firebase Authentication and Cloud Firestore:

1. Open `assets/js/config/firebase-config.js`.
2. Replace the placeholder values in `firebaseConfig`:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_FIREBASE_API_KEY",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890"
   };
   ```
3. Enable **Email/Password** in Firebase Console -> Authentication -> Sign-in method.
4. Enable **Cloud Firestore** in test or production rules mode.

> **Zero Configuration Demo Mode:** If you do not provide Firebase keys immediately, MediBook automatically runs in **Interactive Demo Simulation Mode**, allowing instant 1-click login testing for Patient, Doctor, and Hospital Administrator accounts with simulated sessions and local registrations!
