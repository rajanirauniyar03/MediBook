/**
 * MediBook Realistic Healthcare Demo Dataset
 * Used for public discovery, doctor profiles, filtering, testing, and fallback presentation
 */

const MEDIBOOK_DATA = {
  // Demo Platform Statistics (Clearly labeled as sample figures for demo presentation)
  stats: {
    isDemo: true,
    label: "Platform Demo Metrics",
    registeredDoctors: { value: "180+", label: "Registered Doctors", note: "Across 8 flagship clinical faculties" },
    medicalSpecializations: { value: "24+", label: "Medical Specializations", note: "Cardiology, Neurology, Pediatrics & more" },
    appointmentsCompleted: { value: "85,000+", label: "Appointments Completed", note: "In-clinic and telehealth consultations" },
    patientSatisfaction: { value: "99.4%", label: "Patient Satisfaction", note: "Based on verified post-consultation surveys" }
  },

  // Demo Users for Instant Evaluation
  users: {
    patient: {
      id: "patient_001",
      email: "patient@medibook.com",
      password: "password123",
      role: "patient",
      displayName: "Sarah Jenkins",
      phone: "+1 (555) 234-5678",
      dob: "1992-06-14",
      bloodGroup: "O+",
      gender: "Female",
      allergies: ["Penicillin", "Dust mites"],
      emergencyContact: "David Jenkins - +1 (555) 987-6543",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
    },
    doctor: {
      id: "doc_001",
      email: "doctor@medibook.com",
      password: "password123",
      role: "doctor",
      displayName: "Dr. Alexander Wright",
      title: "MD, FACC - Senior Interventional Cardiologist",
      department: "Cardiology",
      licenseNumber: "MED-CA-884920",
      phone: "+1 (555) 432-8765",
      experienceYears: 16,
      rating: 4.9,
      reviewCount: 142,
      consultationFee: 120,
      hospital: "Metropolitan Central Hospital",
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80"
    },
    admin: {
      id: "admin_001",
      email: "admin@medibook.com",
      password: "password123",
      role: "admin",
      displayName: "Hospital Administrator (Central)",
      hospitalName: "Metropolitan Healthcare Alliance",
      phone: "+1 (555) 111-2233",
      department: "Hospital Operations & IT",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
    }
  },

  // 8 Core Medical Specializations (Exact match to specification)
  departments: [
    {
      id: "dept-cardiology",
      name: "Cardiology",
      slug: "cardiology",
      icon: "heart-pulse",
      shortDesc: "Comprehensive cardiac assessment, preventative heart care, ECG diagnostics, and hypertension management.",
      doctorCount: 14,
      headDoctor: "Dr. Alexander Wright",
      roomLocation: "Tower A, 3rd Floor"
    },
    {
      id: "dept-dermatology",
      name: "Dermatology",
      slug: "dermatology",
      icon: "sparkles",
      shortDesc: "Expert clinical dermatology, mole mapping, eczema, psoriasis care, and procedural skincare.",
      doctorCount: 10,
      headDoctor: "Dr. Sanjay Patel",
      roomLocation: "Outpatient Clinic 102"
    },
    {
      id: "dept-neurology",
      name: "Neurology",
      slug: "neurology",
      icon: "brain",
      shortDesc: "State-of-the-art neurology focusing on chronic migraines, cognitive health, stroke rehab, and nerve disorders.",
      doctorCount: 9,
      headDoctor: "Dr. Eleanor Vance",
      roomLocation: "Tower B, 4th Floor"
    },
    {
      id: "dept-orthopedics",
      name: "Orthopedics",
      slug: "orthopedics",
      icon: "bone",
      shortDesc: "Sports injury treatment, minimally invasive joint arthroscopy, spine health, and fracture rehabilitation.",
      doctorCount: 12,
      headDoctor: "Dr. Rachel Adams",
      roomLocation: "Surgical Pavilion, 2nd Floor"
    },
    {
      id: "dept-pediatrics",
      name: "Pediatrics",
      slug: "pediatrics",
      icon: "baby",
      shortDesc: "Gentle, compassionate primary care, childhood immunizations, developmental milestones, and adolescent wellness.",
      doctorCount: 18,
      headDoctor: "Dr. Marcus Chen",
      roomLocation: "Maternal & Child Wing, 1st Floor"
    },
    {
      id: "dept-dentistry",
      name: "Dentistry",
      slug: "dentistry",
      icon: "smile",
      shortDesc: "Comprehensive oral hygiene, restorative dentistry, orthodontic aligners, root canals, and cosmetic smiles.",
      doctorCount: 8,
      headDoctor: "Dr. Laura Bennett",
      roomLocation: "Dental Suite 204"
    },
    {
      id: "dept-general",
      name: "General Medicine",
      slug: "general-medicine",
      icon: "stethoscope",
      shortDesc: "Primary healthcare, annual comprehensive physical checkups, diabetic management, and family medicine.",
      doctorCount: 22,
      headDoctor: "Dr. Claire Sterling",
      roomLocation: "Main Medical Pavilion"
    },
    {
      id: "dept-gynecology",
      name: "Gynecology",
      slug: "gynecology",
      icon: "activity",
      shortDesc: "Women's reproductive health, prenatal monitoring, obstetric ultrasound, fertility planning, and hormonal balance.",
      doctorCount: 15,
      headDoctor: "Dr. Sophia Thorne",
      roomLocation: "Women's Health Pavilion, 2nd Floor"
    }
  ],

  // Full Roster of Verified Doctors with Complete Schedules & Slots
  doctors: [
    {
      id: "doc_001",
      name: "Dr. Alexander Wright",
      qualification: "MD, FACC - Harvard Medical School",
      department: "Cardiology",
      specialization: "Cardiology",
      subspecialty: "Interventional Cardiology & Coronary Health",
      hospital: "Metropolitan Central Hospital",
      location: "San Francisco, CA",
      experienceYears: 16,
      experience: "16 years exp.",
      rating: 4.9,
      reviews: 142,
      consultationFee: 120,
      fee: 120,
      availableDays: ["Monday", "Wednesday", "Friday"],
      availableDaysText: "Mon, Wed, Fri",
      availableSlots: ["09:00 AM", "10:30 AM", "02:00 PM", "03:30 PM", "05:00 PM"],
      nextAvailable: "Today at 03:30 PM",
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80",
      languages: ["English", "Spanish"],
      about: "Dr. Alexander Wright is a board-certified senior interventional cardiologist with over 16 years of clinical leadership. He completed his fellowship at Harvard Medical School and has conducted over 2,400 successful catheterization procedures. He focuses on preventative heart wellness, hypertension control, and patient-first cardiovascular recovery.",
      education: [
        "MD – Harvard Medical School, Boston",
        "Residency in Internal Medicine – Johns Hopkins Hospital",
        "Fellowship in Interventional Cardiology – Brigham and Women's Hospital",
        "Fellow, American College of Cardiology (FACC)"
      ],
      clinicAddress: "Suite 302, Metropolitan Health Pavilion, 500 Healthcare Blvd, San Francisco, CA"
    },
    {
      id: "doc_002",
      name: "Dr. Eleanor Vance",
      qualification: "MD, PhD - Johns Hopkins University",
      department: "Neurology",
      specialization: "Neurology",
      subspecialty: "Cognitive Neurosciences & Migraine Management",
      hospital: "St. Jude Neuroscience Center",
      location: "San Francisco, CA",
      experienceYears: 12,
      experience: "12 years exp.",
      rating: 4.95,
      reviews: 98,
      consultationFee: 140,
      fee: 140,
      availableDays: ["Tuesday", "Thursday", "Saturday"],
      availableDaysText: "Tue, Thu, Sat",
      availableSlots: ["10:00 AM", "11:30 AM", "02:00 PM", "04:00 PM"],
      nextAvailable: "Tomorrow at 10:00 AM",
      avatar: "https://images.unsplash.com/photo-1594824813511-1335b2e979d4?w=300&auto=format&fit=crop&q=80",
      languages: ["English", "French"],
      about: "Dr. Eleanor Vance is an internationally recognized consultant neurologist specializing in chronic migraine syndromes, post-stroke cognitive recovery, and neuro-inflammatory conditions. She holds a dual MD-PhD from Johns Hopkins and directs clinical trials in non-invasive neuro-stimulation.",
      education: [
        "MD & PhD – Johns Hopkins School of Medicine",
        "Neurology Residency – Massachusetts General Hospital",
        "Neurophysiology Fellowship – UCSF Medical Center"
      ],
      clinicAddress: "Tower B, Level 4, St. Jude Neuroscience Institute, San Francisco, CA"
    },
    {
      id: "doc_003",
      name: "Dr. Marcus Chen",
      qualification: "MD, FAAP - Stanford University School of Medicine",
      department: "Pediatrics",
      specialization: "Pediatrics",
      subspecialty: "Primary Pediatric Care & Neonatology",
      hospital: "Children's Regional Health Center",
      location: "Oakland, CA",
      experienceYears: 14,
      experience: "14 years exp.",
      rating: 4.88,
      reviews: 215,
      consultationFee: 95,
      fee: 95,
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      availableDaysText: "Mon – Fri",
      availableSlots: ["08:30 AM", "10:00 AM", "01:00 PM", "03:30 PM", "05:00 PM"],
      nextAvailable: "Today at 05:00 PM",
      avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80",
      languages: ["English", "Mandarin"],
      about: "Dr. Marcus Chen is dedicated to nurturing child wellness from birth through adolescence. Known for his compassionate and reassuring bedside manner, Dr. Chen partners with parents on developmental milestones, nutritional support, childhood asthma management, and immunization schedules.",
      education: [
        "MD – Stanford University School of Medicine",
        "Pediatric Residency – Lucile Packard Children's Hospital",
        "Fellow, American Academy of Pediatrics (FAAP)"
      ],
      clinicAddress: "Maternal & Child Wing, Suite 101, Children's Health Center, Oakland, CA"
    },
    {
      id: "doc_004",
      name: "Dr. Rachel Adams",
      qualification: "MD, FAAOS - Columbia University",
      department: "Orthopedics",
      specialization: "Orthopedics",
      subspecialty: "Sports Medicine & Arthroscopic Surgery",
      hospital: "Sports Medicine & Spine Pavilion",
      location: "San Jose, CA",
      experienceYears: 18,
      experience: "18 years exp.",
      rating: 4.92,
      reviews: 176,
      consultationFee: 150,
      fee: 150,
      availableDays: ["Monday", "Wednesday", "Thursday"],
      availableDaysText: "Mon, Wed, Thu",
      availableSlots: ["09:30 AM", "11:30 AM", "02:30 PM", "04:30 PM"],
      nextAvailable: "Wednesday at 11:30 AM",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80",
      languages: ["English"],
      about: "Dr. Rachel Adams is a senior orthopedic surgeon specializing in knee and shoulder arthroscopy, ACL reconstructions, and joint preservation. She has served as consulting physician for collegiate athletic teams and champions minimally invasive surgical techniques that shorten rehabilitation times.",
      education: [
        "MD – Columbia University College of Physicians & Surgeons",
        "Orthopedic Surgery Residency – Hospital for Special Surgery, NYC",
        "Sports Medicine Fellowship – Steadman Clinic, Colorado"
      ],
      clinicAddress: "Surgical Pavilion 2B, 300 Olympic Boulevard, San Jose, CA"
    },
    {
      id: "doc_005",
      name: "Dr. Sanjay Patel",
      qualification: "MD, FAAD - University of Pennsylvania",
      department: "Dermatology",
      specialization: "Dermatology",
      subspecialty: "Clinical Dermatology & Mohs Micrographic Surgery",
      hospital: "Dermal Care Specialists Center",
      location: "San Francisco, CA",
      experienceYears: 10,
      experience: "10 years exp.",
      rating: 4.85,
      reviews: 130,
      consultationFee: 110,
      fee: 110,
      availableDays: ["Monday", "Tuesday", "Thursday", "Friday"],
      availableDaysText: "Mon, Tue, Thu, Fri",
      availableSlots: ["09:00 AM", "11:00 AM", "02:15 PM", "03:45 PM"],
      nextAvailable: "Tomorrow at 02:15 PM",
      avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80",
      languages: ["English", "Hindi"],
      about: "Dr. Sanjay Patel provides cutting-edge clinical dermatology for chronic conditions including eczema, severe acne, and psoriasis, as well as digital dermoscopy for early melanoma detection. He believes in personalized patient treatment plans backed by evidence-based medicine.",
      education: [
        "MD – Perelman School of Medicine at UPenn",
        "Dermatology Residency – NYU Langone Medical Center",
        "Fellow, American Academy of Dermatology (FAAD)"
      ],
      clinicAddress: "Outpatient Suite 102, 720 Sutter Street, San Francisco, CA"
    },
    {
      id: "doc_006",
      name: "Dr. Sophia Thorne",
      qualification: "MD, FACOG - Yale School of Medicine",
      department: "Gynecology",
      specialization: "Gynecology",
      subspecialty: "Obstetrics, Prenatal Care & Gynecologic Surgery",
      hospital: "Metropolitan Women's Hospital",
      location: "San Francisco, CA",
      experienceYears: 15,
      experience: "15 years exp.",
      rating: 4.97,
      reviews: 189,
      consultationFee: 130,
      fee: 130,
      availableDays: ["Monday", "Tuesday", "Thursday"],
      availableDaysText: "Mon, Tue, Thu",
      availableSlots: ["09:00 AM", "10:30 AM", "01:30 PM", "03:00 PM"],
      nextAvailable: "Thursday at 09:00 AM",
      avatar: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&auto=format&fit=crop&q=80",
      languages: ["English"],
      about: "Dr. Sophia Thorne provides holistic, patient-centered women's healthcare through every stage of life. Her clinical expertise covers high-risk pregnancy management, comprehensive prenatal health, fertility guidance, and minimally invasive laparoscopic gynecologic surgery.",
      education: [
        "MD – Yale School of Medicine",
        "OB/GYN Residency – Yale New Haven Hospital",
        "Fellow, American College of Obstetricians and Gynecologists (FACOG)"
      ],
      clinicAddress: "Women's Health Pavilion, Level 2, 500 Healthcare Blvd, San Francisco, CA"
    },
    {
      id: "doc_007",
      name: "Dr. Laura Bennett",
      qualification: "DDS, MS - UCSF School of Dentistry",
      department: "Dentistry",
      specialization: "Dentistry",
      subspecialty: "Restorative Dentistry & Orthodontics",
      hospital: "Modern Smile & Oral Surgery Clinic",
      location: "San Francisco, CA",
      experienceYears: 11,
      experience: "11 years exp.",
      rating: 4.91,
      reviews: 164,
      consultationFee: 85,
      fee: 85,
      availableDays: ["Monday", "Wednesday", "Friday", "Saturday"],
      availableDaysText: "Mon, Wed, Fri, Sat",
      availableSlots: ["08:30 AM", "10:00 AM", "11:30 AM", "02:00 PM", "04:00 PM"],
      nextAvailable: "Tomorrow at 11:30 AM",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80",
      languages: ["English", "German"],
      about: "Dr. Laura Bennett brings gentle precision and aesthetic expertise to comprehensive oral healthcare. She specializes in painless preventative cleanings, clear aligner orthodontic therapy, crown restorations, and dental implant prosthetics.",
      education: [
        "DDS – University of California San Francisco (UCSF)",
        "MS in Oral Biology – UCSF School of Dentistry",
        "Member, American Dental Association (ADA)"
      ],
      clinicAddress: "Dental Suite 204, 880 Market Street, San Francisco, CA"
    },
    {
      id: "doc_008",
      name: "Dr. Claire Sterling",
      qualification: "MD, FACP - Northwestern Feinberg School of Medicine",
      department: "General Medicine",
      specialization: "General Medicine",
      subspecialty: "Internal Medicine & Preventative Health",
      hospital: "Metropolitan Central Hospital",
      location: "San Francisco, CA",
      experienceYears: 17,
      experience: "17 years exp.",
      rating: 4.89,
      reviews: 208,
      consultationFee: 90,
      fee: 90,
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      availableDaysText: "Mon – Fri",
      availableSlots: ["09:00 AM", "10:00 AM", "11:30 AM", "01:30 PM", "03:30 PM"],
      nextAvailable: "Today at 01:30 PM",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
      languages: ["English"],
      about: "Dr. Claire Sterling has served as a dedicated primary care internist for over 17 years. She focuses on long-term preventative health assessments, cardiovascular risk reduction, diabetes education, and evidence-guided management of chronic complex conditions.",
      education: [
        "MD – Northwestern University Feinberg School of Medicine",
        "Internal Medicine Residency – Northwestern Memorial Hospital",
        "Fellow, American College of Physicians (FACP)"
      ],
      clinicAddress: "Main Medical Pavilion, Floor 1, 500 Healthcare Blvd, San Francisco, CA"
    },
    {
      id: "doc_009",
      name: "Dr. Jonathan Ross",
      qualification: "MD, FACS - UCLA David Geffen School of Medicine",
      department: "Cardiology",
      specialization: "Cardiology",
      subspecialty: "Electrophysiology & Heart Rhythm Disorders",
      hospital: "St. Jude Metropolitan Hospital",
      location: "San Francisco, CA",
      experienceYears: 13,
      experience: "13 years exp.",
      rating: 4.87,
      reviews: 112,
      consultationFee: 125,
      fee: 125,
      availableDays: ["Tuesday", "Thursday", "Friday"],
      availableDaysText: "Tue, Thu, Fri",
      availableSlots: ["10:00 AM", "11:30 AM", "02:30 PM", "04:00 PM"],
      nextAvailable: "Friday at 10:00 AM",
      avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80",
      languages: ["English"],
      about: "Dr. Jonathan Ross specializes in cardiac electrophysiology, arrhythmias, catheter ablations, and pacemaker implantation. He has authored over 20 peer-reviewed papers on ventricular rhythm therapies.",
      education: [
        "MD – UCLA David Geffen School of Medicine",
        "Internal Medicine Residency – Cedars-Sinai Medical Center",
        "Electrophysiology Fellowship – Stanford Hospital"
      ],
      clinicAddress: "Tower A, 3rd Floor, St. Jude Metropolitan Hospital, San Francisco, CA"
    }
  ],

  // Patient Testimonials (Identified as Demo Content per guidelines)
  testimonials: [
    {
      id: "test_001",
      quote: "Booking an urgent cardiology consultation took literally 45 seconds on MediBook. The automated calendar sync and SMS reminders made our experience completely stress-free.",
      name: "Robert M. Davenport",
      role: "Cardiology Patient (Demo Review)",
      department: "Cardiology",
      rating: 5,
      date: "October 2026",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
    },
    {
      id: "test_002",
      quote: "As a busy working mother of two, having verified pediatric appointment slots and direct clinic access in one clean portal saved our family hours of phone hold queues.",
      name: "Jessica Hall-Vance",
      role: "Parent & Regular Patient (Demo Review)",
      department: "Pediatrics",
      rating: 5,
      date: "September 2026",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80"
    },
    {
      id: "test_003",
      quote: "From our hospital network perspective, MediBook reduced patient no-shows by 42%. Doctor schedule updates are immediate and patient intake is remarkably streamlined.",
      name: "Dr. Evelyn Reed",
      role: "Clinical Operations Director (Demo Review)",
      department: "Metropolitan Healthcare",
      rating: 5,
      date: "November 2026",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
    }
  ]
};

window.MEDIBOOK_DATA = MEDIBOOK_DATA;
