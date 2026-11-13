/**
 * Veyora Pharmacy & Dispensary Management Service
 * Provides comprehensive medicine inventory management, patient availability enquiries,
 * prescription request verification workflows, stock audit ledger, and pharmacy settings.
 */

class PharmacyService {
  constructor() {
    this.MEDICINES_KEY = 'veyora_pharmacy_medicines';
    this.ENQUIRIES_KEY = 'veyora_pharmacy_enquiries';
    this.PRESCRIPTIONS_KEY = 'veyora_pharmacy_prescriptions';
    this.SETTINGS_KEY = 'veyora_pharmacy_settings';
    this.STOCK_HISTORY_KEY = 'veyora_pharmacy_stock_history';
    this.VERSION_KEY = 'veyora_pharmacy_v1_initialized';

    this.initStorage();
  }

  /**
   * Seed realistic clinical dispensary inventory, prescriptions, enquiries, and settings
   */
  initStorage() {
    const isInit = localStorage.getItem(this.VERSION_KEY);
    const existingMeds = localStorage.getItem(this.MEDICINES_KEY);

    if (!existingMeds || !isInit) {
      const now = new Date();
      const futureDate = (months) => {
        const d = new Date(now);
        d.setMonth(d.getMonth() + months);
        return d.toISOString().split('T')[0];
      };
      const pastDate = (days) => {
        const d = new Date(now);
        d.setDate(d.getDate() - days);
        return d.toISOString().split('T')[0];
      };

      // 1. Initial Medicine Catalog
      const initialMedicines = [
        {
          id: "med_101",
          name: "Amoxicillin 500mg Capsules",
          brand: "GlaxoSmithKline (GSK)",
          category: "Antibiotics",
          description: "Broad-spectrum bactericidal antibiotic for respiratory and ENT infections. 21 capsules pack.",
          price: 18.50,
          stock: 65,
          lowStockThreshold: 15,
          expiryDate: futureDate(14),
          prescriptionRequired: true,
          isAvailable: true,
          dosageForm: "Capsules",
          strength: "500mg",
          batchNumber: "AMX-2026-09A",
          createdAt: new Date().toISOString()
        },
        {
          id: "med_102",
          name: "Atorvastatin 20mg Tablets",
          brand: "Pfizer / Lipitor",
          category: "Cardiovascular",
          description: "HMG-CoA reductase inhibitor for hypercholesterolemia and cardiovascular risk reduction. 30 tablets.",
          price: 24.00,
          stock: 48,
          lowStockThreshold: 15,
          expiryDate: futureDate(18),
          prescriptionRequired: true,
          isAvailable: true,
          dosageForm: "Tablets",
          strength: "20mg",
          batchNumber: "ATV-2026-44B",
          createdAt: new Date().toISOString()
        },
        {
          id: "med_103",
          name: "Metformin HCl 500mg ER",
          brand: "Merck / Glucophage",
          category: "Diabetes",
          description: "Biguanide antihyperglycemic oral medication for Type 2 diabetes management. 60 extended-release tablets.",
          price: 15.00,
          stock: 80,
          lowStockThreshold: 20,
          expiryDate: futureDate(22),
          prescriptionRequired: true,
          isAvailable: true,
          dosageForm: "Extended-Release Tablets",
          strength: "500mg",
          batchNumber: "MET-2026-12C",
          createdAt: new Date().toISOString()
        },
        {
          id: "med_104",
          name: "Lisinopril 10mg Tablets",
          brand: "AstraZeneca / Zestril",
          category: "Cardiovascular",
          description: "ACE inhibitor indicated for essential hypertension and congestive heart failure. 30 tablets.",
          price: 16.50,
          stock: 55,
          lowStockThreshold: 15,
          expiryDate: futureDate(16),
          prescriptionRequired: true,
          isAvailable: true,
          dosageForm: "Tablets",
          strength: "10mg",
          batchNumber: "LIS-2026-31F",
          createdAt: new Date().toISOString()
        },
        {
          id: "med_105",
          name: "Paracetamol 500mg Extra",
          brand: "Panadol / Haleon",
          category: "Pain Relief",
          description: "Fast-acting analgesic and antipyretic for mild-to-moderate pain, headaches, and fever. 24 caplets.",
          price: 6.25,
          stock: 140,
          lowStockThreshold: 25,
          expiryDate: futureDate(24),
          prescriptionRequired: false,
          isAvailable: true,
          dosageForm: "Caplets",
          strength: "500mg",
          batchNumber: "PAR-2026-88G",
          createdAt: new Date().toISOString()
        },
        {
          id: "med_106",
          name: "Ibuprofen 400mg Softgels",
          brand: "Advil / Haleon",
          category: "Pain Relief",
          description: "Non-steroidal anti-inflammatory drug (NSAID) for muscle ache, joint pain, and inflammation. 30 softgels.",
          price: 9.75,
          stock: 92,
          lowStockThreshold: 20,
          expiryDate: futureDate(20),
          prescriptionRequired: false,
          isAvailable: true,
          dosageForm: "Liquid Softgels",
          strength: "400mg",
          batchNumber: "IBU-2026-15K",
          createdAt: new Date().toISOString()
        },
        {
          id: "med_107",
          name: "Salbutamol / Albuterol Inhaler 100mcg",
          brand: "Ventolin / GSK",
          category: "Respiratory",
          description: "Short-acting beta-2 agonist bronchodilator for asthma relief and acute bronchospasm. 200 metered doses.",
          price: 28.00,
          stock: 35,
          lowStockThreshold: 12,
          expiryDate: futureDate(15),
          prescriptionRequired: true,
          isAvailable: true,
          dosageForm: "Metered Dose Inhaler",
          strength: "100mcg/actuation",
          batchNumber: "SAL-2026-72M",
          createdAt: new Date().toISOString()
        },
        {
          id: "med_108",
          name: "Omeprazole 20mg Delayed-Release",
          brand: "Prilosec / AstraZeneca",
          category: "Gastrointestinal",
          description: "Proton pump inhibitor (PPI) for gastric acid reflux, GERD, and peptic ulcer prophylaxis. 28 capsules.",
          price: 19.50,
          stock: 50,
          lowStockThreshold: 15,
          expiryDate: futureDate(19),
          prescriptionRequired: false,
          isAvailable: true,
          dosageForm: "Delayed-Release Capsules",
          strength: "20mg",
          batchNumber: "OMP-2026-03P",
          createdAt: new Date().toISOString()
        },
        {
          id: "med_109",
          name: "Cetirizine HCl 10mg Tablets",
          brand: "Zyrtec / J&J",
          category: "Allergy",
          description: "Second-generation antihistamine for seasonal allergic rhinitis, hives, and pruritus. 30 tablets.",
          price: 14.00,
          stock: 75,
          lowStockThreshold: 20,
          expiryDate: futureDate(26),
          prescriptionRequired: false,
          isAvailable: true,
          dosageForm: "Tablets",
          strength: "10mg",
          batchNumber: "CET-2026-61Q",
          createdAt: new Date().toISOString()
        },
        {
          id: "med_110",
          name: "Hydrocortisone 1% Topical Cream",
          brand: "Cortizone-10 / Sanofi",
          category: "Dermatology",
          description: "Mild topical corticosteroid for acute eczema, allergic contact dermatitis, and insect bites. 30g tube.",
          price: 8.50,
          stock: 42,
          lowStockThreshold: 10,
          expiryDate: futureDate(12),
          prescriptionRequired: false,
          isAvailable: true,
          dosageForm: "Topical Cream",
          strength: "1% w/w",
          batchNumber: "HYD-2026-29T",
          createdAt: new Date().toISOString()
        },
        // Low Stock Items for Demonstration
        {
          id: "med_111",
          name: "Azithromycin 250mg Z-Pak",
          brand: "Pfizer / Zithromax",
          category: "Antibiotics",
          description: "Macrolide antibiotic 6-tablet blister regimen for acute bacterial exacerbations. Low stock.",
          price: 22.00,
          stock: 4, // Below lowStockThreshold (15)
          lowStockThreshold: 15,
          expiryDate: futureDate(8),
          prescriptionRequired: true,
          isAvailable: true,
          dosageForm: "Tablets",
          strength: "250mg",
          batchNumber: "AZM-2026-04L",
          createdAt: new Date().toISOString()
        },
        {
          id: "med_112",
          name: "Insulin Glargine 100 U/mL SoloStar",
          brand: "Lantus / Sanofi",
          category: "Diabetes",
          description: "Long-acting basal insulin analog for glycemic control in diabetes mellitus. 5 x 3mL pre-filled pens. Low stock.",
          price: 95.00,
          stock: 3, // Below lowStockThreshold (10)
          lowStockThreshold: 10,
          expiryDate: futureDate(5),
          prescriptionRequired: true,
          isAvailable: true,
          dosageForm: "Subcutaneous Solution",
          strength: "100 units/mL",
          batchNumber: "INS-2026-99S",
          createdAt: new Date().toISOString()
        },
        // Out of Stock Item for Demonstration
        {
          id: "med_113",
          name: "Doxycycline Hyclate 100mg",
          brand: "Vibramycin / Pfizer",
          category: "Antibiotics",
          description: "Tetracycline class broad-spectrum antibiotic for atypical pneumonia, Lyme disease, and severe acne. Currently Out of Stock.",
          price: 21.00,
          stock: 0, // Out of stock
          lowStockThreshold: 15,
          expiryDate: futureDate(11),
          prescriptionRequired: true,
          isAvailable: false,
          dosageForm: "Capsules",
          strength: "100mg",
          batchNumber: "DOX-2026-17D",
          createdAt: new Date().toISOString()
        },
        // Expiring Soon Item for Demonstration
        {
          id: "med_114",
          name: "Tobramycin 0.3% Ophthalmic Solution",
          brand: "Tobrex / Novartis",
          category: "Ophthalmic",
          description: "Topical aminoglycoside antibiotic drops for external ocular infections. 5mL sterile dropper bottle.",
          price: 16.00,
          stock: 12,
          lowStockThreshold: 10,
          expiryDate: futureDate(1), // Expiring in 1 month (30 days)
          prescriptionRequired: true,
          isAvailable: true,
          dosageForm: "Eye Drops",
          strength: "0.3%",
          batchNumber: "TOB-2025-90E",
          createdAt: new Date().toISOString()
        },
        {
          id: "med_115",
          name: "Daily Complete Multivitamin & Minerals",
          brand: "Centrum / Haleon",
          category: "Vitamins",
          description: "Balanced essential micronutrients, Vitamin D3, B-Complex, and Zinc for adult immunity support. 100 tablets.",
          price: 14.50,
          stock: 85,
          lowStockThreshold: 15,
          expiryDate: futureDate(28),
          prescriptionRequired: false,
          isAvailable: true,
          dosageForm: "Tablets",
          strength: "Daily Formula",
          batchNumber: "VIT-2026-55V",
          createdAt: new Date().toISOString()
        }
      ];

      localStorage.setItem(this.MEDICINES_KEY, JSON.stringify(initialMedicines));

      // 2. Initial Prescription Requests with all 6 statuses
      const initialPrescriptions = [
        {
          id: "rx_1001",
          reference: "RX-2026-8842",
          patientName: "Sarah Jenkins",
          patientEmail: "patient@veyora.com",
          patientPhone: "+1 (555) 234-5678",
          doctorName: "Dr. Alexander Wright",
          doctorDepartment: "Cardiology",
          medicineRequested: "Atorvastatin 20mg & Lisinopril 10mg",
          quantity: "30-day supply (30 tablets each)",
          status: "Pending Review",
          rejectionReason: null,
          staffNotes: "Patient uploaded cardiology outpatient script. Verification pending with pharmacy dispensary staff.",
          prescriptionFileUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
          fileName: "Rx_Jenkins_Cardiology_Nov2026.pdf",
          fileType: "application/pdf",
          preferredCollectionTime: "Today at 04:30 PM",
          submittedAt: pastDate(0) + "T10:15:00.000Z",
          updatedAt: pastDate(0) + "T10:15:00.000Z"
        },
        {
          id: "rx_1002",
          reference: "RX-2026-7731",
          patientName: "Robert Davenport",
          patientEmail: "robert.davenport@example.com",
          patientPhone: "+1 (555) 888-4321",
          doctorName: "Dr. Claire Sterling",
          doctorDepartment: "General Medicine",
          medicineRequested: "Amoxicillin 500mg Capsules",
          quantity: "21 capsules (7-day course)",
          status: "Under Review",
          rejectionReason: null,
          staffNotes: "Pharmacist reviewing drug allergy flags (confirmed no penicillin allergy on record).",
          prescriptionFileUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
          fileName: "Amoxicillin_Script_Davenport.png",
          fileType: "image/png",
          preferredCollectionTime: "Tomorrow Morning (09:00 AM - 12:00 PM)",
          submittedAt: pastDate(1) + "T14:30:00.000Z",
          updatedAt: pastDate(0) + "T09:00:00.000Z"
        },
        {
          id: "rx_1003",
          reference: "RX-2026-6519",
          patientName: "Emily Watson",
          patientEmail: "emily.watson@example.com",
          patientPhone: "+1 (555) 876-1234",
          doctorName: "Dr. Jonathan Ross",
          doctorDepartment: "Cardiology",
          medicineRequested: "Metformin HCl 500mg ER",
          quantity: "60 tablets (2-month supply)",
          status: "Approved",
          rejectionReason: null,
          staffNotes: "Prescription verified with Dr. Ross's office. Ready for dispensing packaging.",
          prescriptionFileUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
          fileName: "Watson_Metformin_Rx.pdf",
          fileType: "application/pdf",
          preferredCollectionTime: "Today at 02:00 PM",
          submittedAt: pastDate(1) + "T11:00:00.000Z",
          updatedAt: pastDate(0) + "T11:45:00.000Z"
        },
        {
          id: "rx_1004",
          reference: "RX-2026-5412",
          patientName: "Michael Chang",
          patientEmail: "michael.chang@example.com",
          patientPhone: "+1 (555) 345-9871",
          doctorName: "Dr. Marcus Chen",
          doctorDepartment: "Pediatrics & Pulmonology",
          medicineRequested: "Salbutamol Inhaler 100mcg",
          quantity: "2 Inhaler canisters",
          status: "Ready for Collection",
          rejectionReason: null,
          staffNotes: "Dispensed and verified. Bagged at Outpatient Dispensary Counter B (Ref #5412).",
          prescriptionFileUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
          fileName: "Ventolin_Chang_Pediatric.jpg",
          fileType: "image/jpeg",
          preferredCollectionTime: "Today at 05:00 PM",
          submittedAt: pastDate(2) + "T09:15:00.000Z",
          updatedAt: pastDate(0) + "T13:20:00.000Z"
        },
        {
          id: "rx_1005",
          reference: "RX-2026-4190",
          patientName: "Amanda Brooks",
          patientEmail: "amanda.brooks@example.com",
          patientPhone: "+1 (555) 789-0123",
          doctorName: "Dr. Eleanor Vance",
          doctorDepartment: "Neurology",
          medicineRequested: "Omeprazole 20mg Delayed-Release",
          quantity: "28 capsules",
          status: "Completed",
          rejectionReason: null,
          staffNotes: "Medication collected by patient. Counseling provided on taking 30 mins before breakfast.",
          prescriptionFileUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
          fileName: "Vance_Omeprazole_Discharge.pdf",
          fileType: "application/pdf",
          preferredCollectionTime: "Completed",
          submittedAt: pastDate(4) + "T16:00:00.000Z",
          updatedAt: pastDate(3) + "T17:30:00.000Z"
        },
        {
          id: "rx_1006",
          reference: "RX-2026-3021",
          patientName: "Lucas Gray",
          patientEmail: "lucas.gray@example.com",
          patientPhone: "+1 (555) 901-2345",
          doctorName: "Unknown Clinic / External Provider",
          doctorDepartment: "External",
          medicineRequested: "Doxycycline 100mg Capsules",
          quantity: "20 capsules",
          status: "Rejected",
          rejectionReason: "Prescription image is severely blurred and physician medical license signature cannot be authenticated. In addition, Doxycycline is currently out of stock. Please obtain a freshly scanned digital script.",
          staffNotes: "Rejected due to illegibility and unauthenticated physician signature.",
          prescriptionFileUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
          fileName: "Blurry_Scan_Document.jpg",
          fileType: "image/jpeg",
          preferredCollectionTime: "Cancelled",
          submittedAt: pastDate(3) + "T08:45:00.000Z",
          updatedAt: pastDate(2) + "T10:10:00.000Z"
        }
      ];

      localStorage.setItem(this.PRESCRIPTIONS_KEY, JSON.stringify(initialPrescriptions));

      // 3. Initial Medicine Enquiries
      const initialEnquiries = [
        {
          id: "enq_201",
          patientName: "Sarah Jenkins",
          patientEmail: "patient@veyora.com",
          patientPhone: "+1 (555) 234-5678",
          medicineName: "Azithromycin 250mg Z-Pak",
          quantityRequested: "1 pack (6 tablets)",
          urgency: "Standard",
          message: "My physician recommended a Z-Pak for bacterial sinusitis. Is this in stock for same-day counter collection?",
          status: "Pending Response",
          staffResponse: null,
          submittedAt: pastDate(0) + "T09:30:00.000Z"
        },
        {
          id: "enq_202",
          patientName: "David Miller",
          patientEmail: "david.miller@example.com",
          patientPhone: "+1 (555) 456-7890",
          medicineName: "Insulin Glargine 100 U/mL SoloStar",
          quantityRequested: "2 boxes (10 pens)",
          urgency: "Urgent",
          message: "Checking stock levels before driving to the outpatient pharmacy. Do you have 2 boxes remaining in cold storage?",
          status: "Responded",
          staffResponse: "We currently have 3 pens in stock. We have reserved 1 box for you at Counter A. Additional shipment arriving tomorrow at 10 AM.",
          submittedAt: pastDate(1) + "T15:00:00.000Z",
          respondedAt: pastDate(0) + "T11:00:00.000Z"
        },
        {
          id: "enq_203",
          patientName: "Amanda Brooks",
          patientEmail: "amanda.brooks@example.com",
          patientPhone: "+1 (555) 789-0123",
          medicineName: "Cetirizine HCl 10mg Tablets",
          quantityRequested: "1 bottle (90 tablets)",
          urgency: "Standard",
          message: "Can I purchase the 90-tablet economy pack over-the-counter without a doctor script?",
          status: "Responded",
          staffResponse: "Yes, Cetirizine 10mg is classified as Over-The-Counter (OTC). You can pick it up directly from the dispensary counter without a prescription.",
          submittedAt: pastDate(2) + "T14:20:00.000Z",
          respondedAt: pastDate(2) + "T16:45:00.000Z"
        }
      ];

      localStorage.setItem(this.ENQUIRIES_KEY, JSON.stringify(initialEnquiries));

      // 4. Initial Stock Movement History Ledger
      const initialStockHistory = [
        {
          id: "stk_301",
          medicineId: "med_101",
          medicineName: "Amoxicillin 500mg Capsules",
          changeAmount: 50,
          previousQuantity: 15,
          newQuantity: 65,
          reason: "Warehouse Delivery Receipt (PO #9042)",
          performedBy: "James Carter, RPh",
          timestamp: pastDate(2) + "T08:30:00.000Z"
        },
        {
          id: "stk_302",
          medicineId: "med_107",
          medicineName: "Salbutamol / Albuterol Inhaler 100mcg",
          changeAmount: -2,
          previousQuantity: 37,
          newQuantity: 35,
          reason: "Prescription Dispensed (Ref: RX-2026-5412)",
          performedBy: "James Carter, RPh",
          timestamp: pastDate(0) + "T13:20:00.000Z"
        },
        {
          id: "stk_303",
          medicineId: "med_111",
          medicineName: "Azithromycin 250mg Z-Pak",
          changeAmount: -10,
          previousQuantity: 14,
          newQuantity: 4,
          reason: "Batch Dispensing to Inpatient Ward C",
          performedBy: "James Carter, RPh",
          timestamp: pastDate(1) + "T17:00:00.000Z"
        },
        {
          id: "stk_304",
          medicineId: "med_113",
          medicineName: "Doxycycline Hyclate 100mg",
          changeAmount: -8,
          previousQuantity: 8,
          newQuantity: 0,
          reason: "Stock Depleted - Reorder Dispatched to Supplier",
          performedBy: "James Carter, RPh",
          timestamp: pastDate(3) + "T11:15:00.000Z"
        }
      ];

      localStorage.setItem(this.STOCK_HISTORY_KEY, JSON.stringify(initialStockHistory));

      // 5. Initial Pharmacy Settings
      const initialSettings = {
        name: "Veyora Central Outpatient Pharmacy",
        brandTagline: "Licensed Clinical Pharmacy & Dispensary Services",
        logoIcon: "pill",
        address: "Building C, Ground Floor Outpatient Pavilion, 500 Healthcare Blvd, San Francisco, CA",
        contactNumber: "+1 (555) 345-6789",
        email: "pharmacy@veyora.com",
        operatingHours: "Monday – Saturday: 08:00 AM – 09:00 PM | Sunday: 09:00 AM – 05:00 PM",
        collectionAvailability: "Counter Pickup Window • Drive-Thru Collection • 30-Minute Priority Prescription Dispense",
        pharmacistInCharge: "James Carter, RPh (License #RPH-CA-409182)",
        disclaimerNotice: "Stock availability listed online is updated periodically by dispensary staff and must be confirmed upon physical presentation. Prescription-required medications mandate a verified, authentic medical prescription prior to dispensing. Veyora does not provide automated drug substitution or patient self-prescription.",
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(initialSettings));
      localStorage.setItem(this.VERSION_KEY, "true");
    }
  }

  // =========================================================================
  // 1. MEDICINE MANAGEMENT
  // =========================================================================

  getMedicinesFromStorage() {
    try {
      const data = localStorage.getItem(this.MEDICINES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[PharmacyService] Error reading medicines', e);
      return [];
    }
  }

  saveMedicinesToStorage(medicines) {
    localStorage.setItem(this.MEDICINES_KEY, JSON.stringify(medicines));
  }

  /**
   * Retrieve medicine products with optional filtering
   */
  async getMedicines(filter = {}) {
    const fb = window.VeyoraFirebase;
    let medicines = [];

    if (fb && fb.isConfigured && fb.db) {
      try {
        const snap = await fb.db.collection('pharmacy_medicines').get();
        if (!snap.empty) {
          snap.forEach(doc => medicines.push({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn('[PharmacyService] Firestore fetch fallback:', e);
      }
    }

    if (medicines.length === 0) {
      medicines = this.getMedicinesFromStorage();
    }

    // Apply Filters
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      medicines = medicines.filter(m =>
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.brand && m.brand.toLowerCase().includes(q)) ||
        (m.category && m.category.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q))
      );
    }

    if (filter.category && filter.category !== 'all') {
      medicines = medicines.filter(m => m.category.toLowerCase() === filter.category.toLowerCase());
    }

    if (filter.stockStatus) {
      if (filter.stockStatus === 'available') {
        medicines = medicines.filter(m => m.stock > (m.lowStockThreshold || 10) && m.isAvailable !== false);
      } else if (filter.stockStatus === 'low_stock') {
        medicines = medicines.filter(m => m.stock > 0 && m.stock <= (m.lowStockThreshold || 10) && m.isAvailable !== false);
      } else if (filter.stockStatus === 'out_of_stock') {
        medicines = medicines.filter(m => m.stock === 0 || m.isAvailable === false);
      }
    }

    if (filter.prescriptionRequired !== undefined && filter.prescriptionRequired !== 'all') {
      const req = filter.prescriptionRequired === true || filter.prescriptionRequired === 'true';
      medicines = medicines.filter(m => Boolean(m.prescriptionRequired) === req);
    }

    return medicines;
  }

  /**
   * Get single medicine by ID
   */
  async getMedicineById(medicineId) {
    const medicines = await this.getMedicines();
    return medicines.find(m => m.id === medicineId) || null;
  }

  /**
   * Add a new medicine product to pharmacy inventory
   */
  async addMedicine(medicineData) {
    const {
      name,
      brand,
      category,
      description,
      price,
      stock,
      lowStockThreshold,
      expiryDate,
      prescriptionRequired,
      dosageForm,
      strength,
      batchNumber
    } = medicineData;

    if (!name || !category || price === undefined || stock === undefined || !expiryDate) {
      return { success: false, error: "Please complete all mandatory medicine fields (Name, Category, Price, Stock, Expiry Date)." };
    }

    const medId = "med_" + Date.now();
    const parsedStock = parseInt(stock, 10) || 0;
    const parsedPrice = parseFloat(price) || 0.0;
    const parsedThreshold = parseInt(lowStockThreshold, 10) || 15;

    const newMed = {
      id: medId,
      name: name.trim(),
      brand: (brand || "Generic Manufacturer").trim(),
      category: category.trim(),
      description: (description || "").trim(),
      price: parsedPrice,
      stock: parsedStock,
      lowStockThreshold: parsedThreshold,
      expiryDate,
      prescriptionRequired: Boolean(prescriptionRequired),
      isAvailable: parsedStock > 0,
      dosageForm: dosageForm || "Oral Medication",
      strength: strength || "Standard",
      batchNumber: batchNumber || ("BAT-" + Math.floor(1000 + Math.random() * 9000)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Live Firestore save
    const fb = window.VeyoraFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        await fb.db.collection('pharmacy_medicines').doc(medId).set(newMed);
      } catch (e) {
        console.warn('Firestore add medicine error:', e);
      }
    }

    // Storage save
    const list = this.getMedicinesFromStorage();
    list.unshift(newMed);
    this.saveMedicinesToStorage(list);

    // Record initial stock movement
    this.logStockMovement({
      medicineId: medId,
      medicineName: newMed.name,
      changeAmount: parsedStock,
      previousQuantity: 0,
      newQuantity: parsedStock,
      reason: "Initial Product Creation & Stock Inward",
      performedBy: "Pharmacy Dispensary Staff"
    });

    return { success: true, medicine: newMed };
  }

  /**
   * Edit existing medicine product
   */
  async updateMedicine(medicineId, updates) {
    const list = this.getMedicinesFromStorage();
    const index = list.findIndex(m => m.id === medicineId);

    if (index === -1) {
      return { success: false, error: "Medicine product not found in inventory." };
    }

    const current = list[index];
    const prevStock = current.stock;

    const updatedMed = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Maintain availability flag consistent with stock
    if (updatedMed.stock <= 0) {
      updatedMed.isAvailable = false;
    } else if (updates.isAvailable !== undefined) {
      updatedMed.isAvailable = Boolean(updates.isAvailable);
    }

    list[index] = updatedMed;
    this.saveMedicinesToStorage(list);

    // Firestore update
    const fb = window.VeyoraFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        await fb.db.collection('pharmacy_medicines').doc(medicineId).set(updatedMed, { merge: true });
      } catch (e) {}
    }

    // Check if stock quantity changed
    if (updates.stock !== undefined && updates.stock !== prevStock) {
      const diff = updates.stock - prevStock;
      this.logStockMovement({
        medicineId,
        medicineName: updatedMed.name,
        changeAmount: diff,
        previousQuantity: prevStock,
        newQuantity: updates.stock,
        reason: updates.stockReason || "Manual Inventory Stock Update",
        performedBy: "Pharmacy Dispensary Staff"
      });
    }

    return { success: true, medicine: updatedMed };
  }

  /**
   * Quick update stock quantity
   */
  async updateStockQuantity(medicineId, newQuantity, reason = "Manual Inventory Adjustment", staffName = "Dispensary Staff") {
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      return { success: false, error: "Stock quantity must be a non-negative whole number." };
    }

    return this.updateMedicine(medicineId, {
      stock: qty,
      isAvailable: qty > 0,
      stockReason: reason
    });
  }

  /**
   * Set medicine product availability (mark available / unavailable)
   */
  async setMedicineAvailability(medicineId, isAvailable) {
    return this.updateMedicine(medicineId, {
      isAvailable: Boolean(isAvailable)
    });
  }

  /**
   * Delete medicine item
   */
  async deleteMedicine(medicineId) {
    const list = this.getMedicinesFromStorage();
    const filtered = list.filter(m => m.id !== medicineId);

    if (filtered.length === list.length) {
      return { success: false, error: "Medicine not found." };
    }

    this.saveMedicinesToStorage(filtered);

    const fb = window.VeyoraFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        await fb.db.collection('pharmacy_medicines').doc(medicineId).delete();
      } catch (e) {}
    }

    return { success: true };
  }

  // =========================================================================
  // 2. MEDICINE ENQUIRY (PATIENT & PHARMACY STAFF)
  // Requirement 3: Search, check availability, submit enquiry, contact pharmacy.
  // Display disclaimer that listed stock availability must be confirmed by staff.
  // =========================================================================

  getEnquiriesFromStorage() {
    try {
      const data = localStorage.getItem(this.ENQUIRIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveEnquiriesToStorage(enquiries) {
    localStorage.setItem(this.ENQUIRIES_KEY, JSON.stringify(enquiries));
  }

  /**
   * Patient submits medicine availability enquiry
   */
  async submitEnquiry(enquiryData) {
    const {
      patientName,
      patientEmail,
      patientPhone,
      medicineName,
      quantityRequested,
      urgency,
      message
    } = enquiryData;

    if (!patientName || !patientEmail || !medicineName) {
      return { success: false, error: "Please enter your name, email, and the medicine name requested." };
    }

    const enqId = "enq_" + Date.now();
    const newEnquiry = {
      id: enqId,
      patientName: patientName.trim(),
      patientEmail: patientEmail.trim(),
      patientPhone: (patientPhone || "").trim(),
      medicineName: medicineName.trim(),
      quantityRequested: quantityRequested || "Standard Unit",
      urgency: urgency || "Standard",
      message: (message || "").trim(),
      status: "Pending Response",
      staffResponse: null,
      submittedAt: new Date().toISOString(),
      respondedAt: null
    };

    const fb = window.VeyoraFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        await fb.db.collection('pharmacy_enquiries').doc(enqId).set(newEnquiry);
      } catch (e) {}
    }

    const list = this.getEnquiriesFromStorage();
    list.unshift(newEnquiry);
    this.saveEnquiriesToStorage(list);

    return {
      success: true,
      enquiry: newEnquiry,
      message: "Your medicine availability enquiry has been dispatched to the pharmacy staff. A pharmacist will review stock and follow up with you."
    };
  }

  /**
   * Pharmacy staff fetches patient enquiries
   */
  async getEnquiries(statusFilter = null) {
    const fb = window.VeyoraFirebase;
    let enquiries = [];

    if (fb && fb.isConfigured && fb.db) {
      try {
        const snap = await fb.db.collection('pharmacy_enquiries').get();
        if (!snap.empty) {
          snap.forEach(d => enquiries.push({ id: d.id, ...d.data() }));
        }
      } catch (e) {}
    }

    if (enquiries.length === 0) {
      enquiries = this.getEnquiriesFromStorage();
    }

    if (statusFilter && statusFilter !== 'all') {
      enquiries = enquiries.filter(e => e.status.toLowerCase() === statusFilter.toLowerCase());
    }

    enquiries.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return enquiries;
  }

  /**
   * Pharmacy staff responds to enquiry
   */
  async respondToEnquiry(enquiryId, responseNotes, staffName = "James Carter, RPh") {
    if (!responseNotes || !responseNotes.trim()) {
      return { success: false, error: "Response message cannot be empty." };
    }

    const list = this.getEnquiriesFromStorage();
    const index = list.findIndex(e => e.id === enquiryId);

    if (index === -1) {
      return { success: false, error: "Enquiry record not found." };
    }

    const item = list[index];
    item.status = "Responded";
    item.staffResponse = responseNotes.trim();
    item.respondedBy = staffName;
    item.respondedAt = new Date().toISOString();

    list[index] = item;
    this.saveEnquiriesToStorage(list);

    const fb = window.VeyoraFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        await fb.db.collection('pharmacy_enquiries').doc(enquiryId).set(item, { merge: true });
      } catch (e) {}
    }

    return { success: true, enquiry: item };
  }

  // =========================================================================
  // 3. PRESCRIPTION REQUEST MANAGEMENT
  // Requirement 4: Allow patients to upload prescription image or PDF.
  // Pharmacy staff can view, review, accept/reject with reason.
  // Statuses: Pending Review, Under Review, Approved, Rejected, Ready for Collection, Completed.
  // Only authorized staff should access prescription uploads.
  // =========================================================================

  getPrescriptionsFromStorage() {
    try {
      const data = localStorage.getItem(this.PRESCRIPTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  savePrescriptionsToStorage(prescriptions) {
    localStorage.setItem(this.PRESCRIPTIONS_KEY, JSON.stringify(prescriptions));
  }

  /**
   * Patient submits a prescription upload request
   */
  async submitPrescriptionRequest(requestData) {
    const {
      patientName,
      patientEmail,
      patientPhone,
      doctorName,
      doctorDepartment,
      medicineRequested,
      quantity,
      prescriptionFileUrl,
      fileName,
      fileType,
      preferredCollectionTime,
      patientNotes
    } = requestData;

    if (!patientName || !patientEmail || (!prescriptionFileUrl && !fileName)) {
      return { success: false, error: "Please provide your patient name, contact details, and a clear prescription upload document." };
    }

    const uniqueRef = "RX-2026-" + Math.floor(1000 + Math.random() * 9000);
    const reqId = "rx_" + Date.now();

    const newRequest = {
      id: reqId,
      reference: uniqueRef,
      patientName: patientName.trim(),
      patientEmail: patientEmail.trim(),
      patientPhone: (patientPhone || "").trim(),
      doctorName: (doctorName || "Licensed Attending Physician").trim(),
      doctorDepartment: doctorDepartment || "Clinical Outpatient",
      medicineRequested: (medicineRequested || "Prescription item as written by physician").trim(),
      quantity: quantity || "As prescribed",
      status: "Pending Review", // Mandatory Initial Status
      rejectionReason: null,
      staffNotes: null,
      prescriptionFileUrl: prescriptionFileUrl || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
      fileName: fileName || "Doctor_Prescription_Scan.pdf",
      fileType: fileType || "application/pdf",
      preferredCollectionTime: preferredCollectionTime || "Standard dispensary turnaround",
      patientNotes: (patientNotes || "").trim(),
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const fb = window.VeyoraFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        await fb.db.collection('pharmacy_prescriptions').doc(reqId).set(newRequest);
      } catch (e) {}
    }

    const list = this.getPrescriptionsFromStorage();
    list.unshift(newRequest);
    this.savePrescriptionsToStorage(list);

    return {
      success: true,
      prescription: newRequest,
      reference: uniqueRef,
      message: `Prescription uploaded successfully (Ref: ${uniqueRef}). Our clinical pharmacy staff will review and prepare your medications.`
    };
  }

  /**
   * Retrieve prescription requests (restricted to authorized pharmacy staff or patient by email)
   */
  async getPrescriptionRequests(statusFilter = null, patientEmail = null) {
    const fb = window.VeyoraFirebase;
    let prescriptions = [];

    if (fb && fb.isConfigured && fb.db) {
      try {
        let query = fb.db.collection('pharmacy_prescriptions');
        if (patientEmail) {
          query = query.where('patientEmail', '==', patientEmail);
        }
        const snap = await query.get();
        if (!snap.empty) {
          snap.forEach(d => prescriptions.push({ id: d.id, ...d.data() }));
        }
      } catch (e) {}
    }

    if (prescriptions.length === 0) {
      prescriptions = this.getPrescriptionsFromStorage();
      if (patientEmail) {
        prescriptions = prescriptions.filter(p => p.patientEmail.toLowerCase() === patientEmail.toLowerCase());
      }
    }

    if (statusFilter && statusFilter !== 'all') {
      prescriptions = prescriptions.filter(p => p.status.toLowerCase() === statusFilter.toLowerCase());
    }

    prescriptions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return prescriptions;
  }

  async getPrescriptionRequestById(id) {
    const list = this.getPrescriptionsFromStorage();
    return list.find(p => p.id === id || p.reference === id) || null;
  }

  /**
   * Update prescription request status
   * Allowed statuses: Pending Review, Under Review, Approved, Rejected, Ready for Collection, Completed
   */
  async updatePrescriptionStatus(requestId, newStatus, staffNotes = '', rejectionReason = '') {
    const validStatuses = [
      "Pending Review",
      "Under Review",
      "Approved",
      "Rejected",
      "Ready for Collection",
      "Completed"
    ];

    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: `Invalid status: "${newStatus}". Must be one of: ${validStatuses.join(', ')}` };
    }

    if (newStatus === 'Rejected' && (!rejectionReason || !rejectionReason.trim())) {
      return { success: false, error: "A rejection reason must be provided when rejecting a prescription request." };
    }

    const list = this.getPrescriptionsFromStorage();
    const index = list.findIndex(p => p.id === requestId);

    if (index === -1) {
      return { success: false, error: "Prescription request record not found." };
    }

    const item = list[index];
    item.status = newStatus;
    item.updatedAt = new Date().toISOString();

    if (staffNotes) item.staffNotes = staffNotes.trim();
    if (newStatus === 'Rejected') {
      item.rejectionReason = rejectionReason.trim();
    } else if (newStatus === 'Approved') {
      item.rejectionReason = null;
    }

    list[index] = item;
    this.savePrescriptionsToStorage(list);

    const fb = window.VeyoraFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        await fb.db.collection('pharmacy_prescriptions').doc(requestId).set(item, { merge: true });
      } catch (e) {}
    }

    return { success: true, prescription: item };
  }

  /**
   * Reject prescription request helper
   */
  async rejectPrescriptionRequest(requestId, rejectionReason, staffNotes = '') {
    return this.updatePrescriptionStatus(requestId, "Rejected", staffNotes, rejectionReason);
  }

  // =========================================================================
  // 4. INVENTORY MANAGEMENT, AUDIT TRAIL & ALERTS
  // Requirement 5: Stock quantity updates, Low-stock alerts, Expiry date warnings,
  // Stock movement history. Do not recommend substitute medicines or self-prescription.
  // =========================================================================

  getStockHistoryFromStorage() {
    try {
      const data = localStorage.getItem(this.STOCK_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveStockHistoryToStorage(history) {
    localStorage.setItem(this.STOCK_HISTORY_KEY, JSON.stringify(history));
  }

  logStockMovement(entry) {
    const history = this.getStockHistoryFromStorage();
    const logItem = {
      id: "stk_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      ...entry
    };

    history.unshift(logItem);
    if (history.length > 200) history.length = 200; // retain 200 logs
    this.saveStockHistoryToStorage(history);

    const fb = window.VeyoraFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        fb.db.collection('pharmacy_stock_history').doc(logItem.id).set(logItem);
      } catch (e) {}
    }

    return logItem;
  }

  async getStockHistory(medicineId = null) {
    let history = this.getStockHistoryFromStorage();
    if (medicineId) {
      history = history.filter(h => h.medicineId === medicineId);
    }
    return history;
  }

  /**
   * Compute comprehensive inventory and pharmacy metrics
   * Requirement 1: Total medicine products, Available stock items,
   * Low-stock items, Out-of-stock items, Pending prescription requests, Recent medicine enquiries.
   */
  async getPharmacyMetrics() {
    const medicines = await this.getMedicines();
    const prescriptions = await this.getPrescriptionRequests();
    const enquiries = await this.getEnquiries();

    const todayStr = new Date().toISOString().split('T')[0];
    const in60Days = new Date();
    in60Days.setDate(in60Days.getDate() + 60);
    const in60DaysStr = in60Days.toISOString().split('T')[0];

    let totalProducts = medicines.length;
    let availableCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiredCount = 0;
    let expiringSoonCount = 0;

    medicines.forEach(m => {
      const threshold = m.lowStockThreshold || 10;
      if (m.stock === 0 || m.isAvailable === false) {
        outOfStockCount++;
      } else if (m.stock <= threshold) {
        lowStockCount++;
      } else {
        availableCount++;
      }

      if (m.expiryDate) {
        if (m.expiryDate < todayStr) {
          expiredCount++;
        } else if (m.expiryDate <= in60DaysStr) {
          expiringSoonCount++;
        }
      }
    });

    const pendingPrescriptionsCount = prescriptions.filter(p =>
      p.status === 'Pending Review' || p.status === 'Under Review'
    ).length;

    const recentEnquiriesCount = enquiries.filter(e =>
      e.status === 'Pending Response'
    ).length;

    return {
      totalProducts,
      availableCount,
      lowStockCount,
      outOfStockCount,
      expiredCount,
      expiringSoonCount,
      pendingPrescriptionsCount,
      recentEnquiriesCount,
      totalPrescriptions: prescriptions.length,
      totalEnquiries: enquiries.length
    };
  }

  async getLowStockAlerts() {
    const medicines = await this.getMedicines();
    return medicines.filter(m => m.stock > 0 && m.stock <= (m.lowStockThreshold || 10) && m.isAvailable !== false);
  }

  async getExpiryAlerts(daysThreshold = 60) {
    const medicines = await this.getMedicines();
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysThreshold);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    return medicines.filter(m => m.expiryDate && m.expiryDate <= targetDateStr);
  }

  // =========================================================================
  // 5. PHARMACY SETTINGS
  // Requirement 6: Pharmacy name, logo, address, contact number,
  // operating hours, collection availability.
  // =========================================================================

  getPharmacySettingsFromStorage() {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  async getPharmacySettings() {
    const fb = window.VeyoraFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        const doc = await fb.db.collection('pharmacy_settings').doc('general').get();
        if (doc.exists) {
          return doc.data();
        }
      } catch (e) {}
    }

    const localSettings = this.getPharmacySettingsFromStorage();
    if (localSettings && localSettings.name) {
      return localSettings;
    }

    return {
      name: "Veyora Central Outpatient Pharmacy",
      brandTagline: "Licensed Clinical Pharmacy & Dispensary Services",
      logoIcon: "pill",
      address: "Building C, Ground Floor Outpatient Pavilion, 500 Healthcare Blvd, San Francisco, CA",
      contactNumber: "+1 (555) 345-6789",
      email: "pharmacy@veyora.com",
      operatingHours: "Monday – Saturday: 08:00 AM – 09:00 PM | Sunday: 09:00 AM – 05:00 PM",
      collectionAvailability: "Counter Pickup Window • Drive-Thru Collection • 30-Minute Priority Prescription Dispense",
      pharmacistInCharge: "James Carter, RPh (License #RPH-CA-409182)",
      disclaimerNotice: "Stock availability listed online is updated periodically by dispensary staff and must be confirmed upon physical presentation. Prescription-required medications mandate a verified, authentic medical prescription prior to dispensing. Veyora does not provide automated drug substitution or patient self-prescription.",
      updatedAt: new Date().toISOString()
    };
  }

  async updatePharmacySettings(newSettings) {
    const current = await this.getPharmacySettings();
    const updated = {
      ...current,
      ...newSettings,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));

    const fb = window.VeyoraFirebase;
    if (fb && fb.isConfigured && fb.db) {
      try {
        await fb.db.collection('pharmacy_settings').doc('general').set(updated, { merge: true });
      } catch (e) {}
    }

    return { success: true, settings: updated };
  }
}

window.PharmacyService = new PharmacyService();
