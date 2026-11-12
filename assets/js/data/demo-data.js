/**
 * MediBook Realistic Healthcare Demo Dataset
 * Used for initial seeding, testing, and fallback presentation
 */

const MEDIBOOK_DATA = {
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
      hospital: "St. Jude Metropolitan Hospital",
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
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

  // Medical Specialties & Departments
  departments: [
    {
      id: "dept-cardiology",
      name: "Cardiology & Vascular",
      icon: "heart-pulse",
      shortDesc: "Comprehensive heart health, ECG diagnostics, and cardiac intervention.",
      doctorCount: 14,
      headDoctor: "Dr. Alexander Wright",
      roomLocation: "Tower A, 3rd Floor"
    },
    {
      id: "dept-neurology",
      name: "Neurology & Brain Care",
      icon: "brain",
      shortDesc: "Advanced treatment for neurovascular conditions, migraines, and nerve disorders.",
      doctorCount: 9,
      headDoctor: "Dr. Eleanor Vance",
      roomLocation: "Tower B, 4th Floor"
    },
    {
      id: "dept-pediatrics",
      name: "Pediatrics & Child Care",
      icon: "baby",
      shortDesc: "Compassionate primary care, immunizations, and developmental wellness for kids.",
      doctorCount: 18,
      headDoctor: "Dr. Marcus Chen",
      roomLocation: "Maternal Wing, 1st Floor"
    },
    {
      id: "dept-orthopedics",
      name: "Orthopedics & Joint Care",
      icon: "bone",
      shortDesc: "Sports injury rehab, arthroscopy, spine health, and joint replacement surgery.",
      doctorCount: 12,
      headDoctor: "Dr. Rachel Adams",
      roomLocation: "Surgical Pavilion, 2nd Floor"
    },
    {
      id: "dept-dermatology",
      name: "Dermatology & Skin",
      icon: "sparkles",
      shortDesc: "Clinical dermatology, melanoma screening, laser therapy, and chronic skin care.",
      doctorCount: 8,
      headDoctor: "Dr. Sanjay Patel",
      roomLocation: "Outpatient Clinic 102"
    },
    {
      id: "dept-gynecology",
      name: "Obstetrics & Gynecology",
      icon: "activity",
      shortDesc: "Women's wellness, prenatal care, fertility counseling, and minimally invasive surgery.",
      doctorCount: 15,
      headDoctor: "Dr. Sophia Thorne",
      roomLocation: "Women's Center, 2nd Floor"
    },
    {
      id: "dept-ophthalmology",
      name: "Ophthalmology & Eye Care",
      icon: "eye",
      shortDesc: "Cataract treatment, retinal health, pediatric vision, and laser vision correction.",
      doctorCount: 7,
      headDoctor: "Dr. Jonathan Ross",
      roomLocation: "Tower A, 1st Floor"
    },
    {
      id: "dept-general",
      name: "Internal & General Medicine",
      icon: "stethoscope",
      shortDesc: "Preventative checkups, chronic disease management, and family healthcare.",
      doctorCount: 22,
      headDoctor: "Dr. Claire Sterling",
      roomLocation: "Main Medical Pavilion"
    }
  ],

  // Top Verified Doctors
  doctors: [
    {
      id: "doc_001",
      name: "Dr. Alexander Wright",
      title: "MD, FACC",
      department: "Cardiology",
      specialty: "Interventional Cardiologist",
      hospital: "Metropolitan Central Hospital",
      location: "San Francisco, CA",
      experience: "16 years exp.",
      rating: 4.9,
      reviews: 142,
      fee: 120,
      nextAvailable: "Today at 03:30 PM",
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
      languages: ["English", "Spanish"],
      about: "Board-certified cardiologist specializing in coronary artery disease management, preventative cardiology, and state-of-the-art heart health monitoring."
    },
    {
      id: "doc_002",
      name: "Dr. Eleanor Vance",
      title: "MD, PhD",
      department: "Neurology",
      specialty: "Consultant Neurologist",
      hospital: "St. Jude Neuroscience Center",
      location: "San Francisco, CA",
      experience: "12 years exp.",
      rating: 4.95,
      reviews: 98,
      fee: 140,
      nextAvailable: "Tomorrow at 10:00 AM",
      avatar: "https://images.unsplash.com/photo-1594824813511-1335b2e979d4?w=200&auto=format&fit=crop&q=80",
      languages: ["English", "French"],
      about: "Renowned neurologist focusing on complex migraine disorders, stroke recovery, peripheral neuropathies, and cognitive neurological care."
    },
    {
      id: "doc_003",
      name: "Dr. Marcus Chen",
      title: "MD, FAAP",
      department: "Pediatrics",
      specialty: "Chief Pediatrician",
      hospital: "Children's Regional Health",
      location: "Oakland, CA",
      experience: "14 years exp.",
      rating: 4.88,
      reviews: 215,
      fee: 95,
      nextAvailable: "Today at 05:00 PM",
      avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=80",
      languages: ["English", "Mandarin"],
      about: "Dedicated to holistic child wellness, neonatal care, pediatric allergy treatments, and parental guidance from infancy through adolescence."
    },
    {
      id: "doc_004",
      name: "Dr. Rachel Adams",
      title: "MD, FAAOS",
      department: "Orthopedics",
      specialty: "Orthopedic Surgeon",
      hospital: "Sports Medicine & Spine Clinic",
      location: "San Jose, CA",
      experience: "18 years exp.",
      rating: 4.92,
      reviews: 176,
      fee: 150,
      nextAvailable: "Wednesday at 11:30 AM",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80",
      languages: ["English"],
      about: "Specialized in minimally invasive knee and shoulder arthroscopy, ACL reconstructions, and athletic rehabilitation programs."
    },
    {
      id: "doc_005",
      name: "Dr. Sanjay Patel",
      title: "MD, FAAD",
      department: "Dermatology",
      specialty: "Dermatologist & Dermatosurgeon",
      hospital: "Dermal Care Specialists",
      location: "San Francisco, CA",
      experience: "10 years exp.",
      rating: 4.85,
      reviews: 130,
      fee: 110,
      nextAvailable: "Tomorrow at 02:15 PM",
      avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80",
      languages: ["English", "Hindi"],
      about: "Clinical expert in early skin cancer detection, eczema management, psoriasis therapies, and cosmetic dermatology procedures."
    },
    {
      id: "doc_006",
      name: "Dr. Sophia Thorne",
      title: "MD, FACOG",
      department: "Obstetrics & Gynecology",
      specialty: "OB-GYN Consultant",
      hospital: "Metropolitan Women's Hospital",
      location: "San Francisco, CA",
      experience: "15 years exp.",
      rating: 4.97,
      reviews: 189,
      fee: 130,
      nextAvailable: "Thursday at 09:00 AM",
      avatar: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=200&auto=format&fit=crop&q=80",
      languages: ["English"],
      about: "Comprehensive gynecological care, high-risk pregnancy management, ultrasound monitoring, and reproductive endocrine health."
    }
  ],

  // Patient Testimonials
  testimonials: [
    {
      quote: "Booking an urgent cardiology consultation took literally 45 seconds on MediBook. The SMS reminder and instant calendar sync made the whole experience painless.",
      name: "Robert M. Davenport",
      role: "Cardiology Patient",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
    },
    {
      quote: "As a busy mother of two, having verified pediatric appointment slots and digital records in one portal saves our family hours of stressful phone queues.",
      name: "Jessica Hall-Vance",
      role: "Parent & Regular Patient",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
    },
    {
      quote: "From an administrator's standpoint, MediBook cut down no-shows by 42% in our hospital network. The doctor schedule management is intuitive and robust.",
      name: "Dr. Evelyn Reed",
      role: "Clinical Director, Metro Health",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
    }
  ],

  // Key Hospital Platform Metrics
  stats: {
    verifiedDoctors: "150+",
    satisfiedPatients: "120,000+",
    accreditedHospitals: "45+",
    appointmentSatisfaction: "99.4%"
  }
};

window.MEDIBOOK_DATA = MEDIBOOK_DATA;
