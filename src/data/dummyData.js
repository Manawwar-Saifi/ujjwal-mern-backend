/**
 * DUMMY DATA FOR API TESTING
 * Ujjwal Dental Clinic Management System
 *
 * Usage:
 * - Import this file in your seed script or test files
 * - Use with MongoDB bulk operations or individual inserts
 *
 * Note: ObjectIds are placeholder strings - replace with actual ObjectIds when seeding
 */

// ============ USERS (Admin/Staff) ============
export const users = [
  {
    name: "Dr. Ujjwal Sharma",
    email: "admin@ujjwaldental.com",
    phone: "9876543210",
    password: "Admin@123",
    role: "admin",
    isActive: true,
  },
  {
    name: "Dr. Priya Verma",
    email: "priya@ujjwaldental.com",
    phone: "9876543211",
    password: "Doctor@123",
    role: "admin",
    isActive: true,
  },
  {
    name: "Rahul Kumar",
    email: "rahul@ujjwaldental.com",
    phone: "9876543212",
    password: "Staff@123",
    role: "admin",
    isActive: true,
  },
];

// ============ CLINICS ============
export const clinics = [
  {
    name: "Ujjwal Dental - Main Branch",
    address: {
      street: "123 Delhi Road",
      area: "Model Town",
      city: "Hisar",
      state: "Haryana",
      pincode: "125001",
    },
    phone: "01onal234567",
    isActive: true,
  },
  {
    name: "Ujjwal Dental - City Center",
    address: {
      street: "45 Red Square Market",
      area: "Sector 14",
      city: "Hisar",
      state: "Haryana",
      pincode: "125001",
    },
    phone: "01662345678",
    isActive: true,
  },
];

// ============ PATIENTS ============
export const patients = [
  {
    name: "Amit Sharma",
    phone: "9812345678",
    email: "amit.sharma@email.com",
    gender: "male",
    dateOfBirth: new Date("1990-05-15"),
    address: {
      street: "45 Sector 15",
      city: "Hisar",
      state: "Haryana",
      pincode: "125001",
    },
    bloodGroup: "B+",
    allergies: ["Penicillin"],
    medicalHistory: ["Diabetes"],
    emergencyContact: {
      name: "Sunita Sharma",
      phone: "9812345679",
      relation: "Wife",
    },
    isActive: true,
  },
  {
    name: "Priya Singh",
    phone: "9823456789",
    email: "priya.singh@email.com",
    gender: "female",
    dateOfBirth: new Date("1985-08-22"),
    address: {
      street: "78 Model Town",
      city: "Hisar",
      state: "Haryana",
      pincode: "125001",
    },
    bloodGroup: "O+",
    allergies: [],
    medicalHistory: [],
    emergencyContact: {
      name: "Rajesh Singh",
      phone: "9823456780",
      relation: "Husband",
    },
    isActive: true,
  },
  {
    name: "Rahul Gupta",
    phone: "9834567890",
    email: "rahul.gupta@email.com",
    gender: "male",
    dateOfBirth: new Date("1995-03-10"),
    address: {
      street: "12 Civil Lines",
      city: "Hisar",
      state: "Haryana",
      pincode: "125001",
    },
    bloodGroup: "A+",
    allergies: ["Sulfa drugs"],
    medicalHistory: ["Hypertension"],
    emergencyContact: {
      name: "Meena Gupta",
      phone: "9834567891",
      relation: "Mother",
    },
    isActive: true,
  },
  {
    name: "Neha Verma",
    phone: "9845678901",
    email: "neha.verma@email.com",
    gender: "female",
    dateOfBirth: new Date("2000-12-25"),
    address: {
      street: "56 Rajguru Colony",
      city: "Hisar",
      state: "Haryana",
      pincode: "125001",
    },
    bloodGroup: "AB+",
    allergies: [],
    medicalHistory: [],
    emergencyContact: {
      name: "Vikram Verma",
      phone: "9845678902",
      relation: "Father",
    },
    isActive: true,
  },
  {
    name: "Suresh Kumar",
    phone: "9856789012",
    email: "suresh.kumar@email.com",
    gender: "male",
    dateOfBirth: new Date("1978-07-04"),
    address: {
      street: "34 Urban Estate",
      city: "Hisar",
      state: "Haryana",
      pincode: "125001",
    },
    bloodGroup: "O-",
    allergies: ["Aspirin", "Ibuprofen"],
    medicalHistory: ["Heart Disease", "High Cholesterol"],
    emergencyContact: {
      name: "Kamla Devi",
      phone: "9856789013",
      relation: "Wife",
    },
    isActive: true,
  },
];

// ============ TREATMENT MASTER (Catalog) ============
export const treatmentMaster = [
  {
    name: "Dental Checkup",
    code: "CHK",
    category: "preventive",
    description: "Complete oral examination and consultation",
    price: 300,
    duration: 20,
    sessionsRequired: 1,
    isActive: true,
  },
  {
    name: "Dental Cleaning (Scaling)",
    code: "CLN",
    category: "preventive",
    description: "Professional teeth cleaning and polishing",
    price: 800,
    duration: 45,
    sessionsRequired: 1,
    isActive: true,
  },
  {
    name: "Tooth Filling (Composite)",
    code: "FLC",
    category: "restorative",
    description: "Tooth-colored composite filling",
    price: 1500,
    duration: 30,
    sessionsRequired: 1,
    isActive: true,
  },
  {
    name: "Tooth Filling (Amalgam)",
    code: "FLA",
    category: "restorative",
    description: "Silver amalgam filling",
    price: 800,
    duration: 30,
    sessionsRequired: 1,
    isActive: true,
  },
  {
    name: "Root Canal Treatment",
    code: "RCT",
    category: "endodontic",
    description: "Root canal treatment for infected tooth",
    price: 5000,
    duration: 60,
    sessionsRequired: 2,
    isActive: true,
  },
  {
    name: "Tooth Extraction (Simple)",
    code: "EXS",
    category: "surgical",
    description: "Simple tooth extraction",
    price: 500,
    duration: 30,
    sessionsRequired: 1,
    isActive: true,
  },
  {
    name: "Tooth Extraction (Surgical)",
    code: "EXW",
    category: "surgical",
    description: "Surgical extraction including wisdom teeth",
    price: 2500,
    duration: 45,
    sessionsRequired: 1,
    isActive: true,
  },
  {
    name: "Dental Crown (PFM)",
    code: "CRP",
    category: "prosthodontic",
    description: "Porcelain fused to metal crown",
    price: 5000,
    duration: 45,
    sessionsRequired: 2,
    isActive: true,
  },
  {
    name: "Dental Crown (Zirconia)",
    code: "CRZ",
    category: "prosthodontic",
    description: "Full zirconia crown",
    price: 12000,
    duration: 45,
    sessionsRequired: 2,
    isActive: true,
  },
  {
    name: "Dental Implant",
    code: "IMP",
    category: "prosthodontic",
    description: "Single tooth dental implant",
    price: 35000,
    duration: 90,
    sessionsRequired: 3,
    isActive: true,
  },
  {
    name: "Teeth Whitening",
    code: "WHT",
    category: "cosmetic",
    description: "Professional teeth whitening treatment",
    price: 8000,
    duration: 60,
    sessionsRequired: 1,
    isActive: true,
  },
  {
    name: "Braces (Metal)",
    code: "BRM",
    category: "orthodontic",
    description: "Traditional metal braces treatment",
    price: 35000,
    duration: 60,
    sessionsRequired: 24,
    isActive: true,
  },
  {
    name: "Braces (Ceramic)",
    code: "BRC",
    category: "orthodontic",
    description: "Tooth-colored ceramic braces",
    price: 50000,
    duration: 60,
    sessionsRequired: 24,
    isActive: true,
  },
  {
    name: "Gum Treatment (Deep Cleaning)",
    code: "GTD",
    category: "periodontic",
    description: "Deep cleaning for gum disease",
    price: 3000,
    duration: 60,
    sessionsRequired: 2,
    isActive: true,
  },
  {
    name: "Dental X-Ray (Single)",
    code: "XRS",
    category: "preventive",
    description: "Single tooth X-ray",
    price: 200,
    duration: 10,
    sessionsRequired: 1,
    isActive: true,
  },
  {
    name: "Dental X-Ray (OPG)",
    code: "XRO",
    category: "preventive",
    description: "Full mouth panoramic X-ray",
    price: 500,
    duration: 15,
    sessionsRequired: 1,
    isActive: true,
  },
];

// ============ MEMBERSHIP PLANS ============
export const membershipPlans = [
  {
    name: "Individual Silver",
    code: "IND-SLV",
    type: "individual",
    tier: "silver",
    description: "Basic membership for individuals with 10% discount on all treatments",
    price: 999,
    durationMonths: 12,
    discountPercentage: 10,
    maxMembers: 1,
    features: [
      "10% discount on all treatments",
      "Priority appointment booking",
      "Free dental checkup on enrollment",
    ],
    benefits: [
      { type: "discount", description: "10% off on all treatments", discountPercentage: 10 },
      { type: "priority_booking", description: "Priority appointment booking" },
    ],
    displayOrder: 1,
    isActive: true,
  },
  {
    name: "Individual Gold",
    code: "IND-GLD",
    type: "individual",
    tier: "gold",
    description: "Premium membership with 15% discount and 1 free cleaning",
    price: 1999,
    durationMonths: 12,
    discountPercentage: 15,
    maxMembers: 1,
    features: [
      "15% discount on all treatments",
      "1 free dental cleaning per year",
      "Priority appointment booking",
      "Free dental checkup on enrollment",
    ],
    benefits: [
      { type: "discount", description: "15% off on all treatments", discountPercentage: 15 },
      {
        type: "free_service",
        description: "1 free dental cleaning per year",
        freeService: { name: "Dental Cleaning", quantity: 1 },
      },
      { type: "priority_booking", description: "Priority appointment booking" },
    ],
    displayOrder: 2,
    isActive: true,
  },
  {
    name: "Individual Platinum",
    code: "IND-PLT",
    type: "individual",
    tier: "platinum",
    description: "Elite membership with 20% discount and 2 free cleanings",
    price: 2999,
    durationMonths: 12,
    discountPercentage: 20,
    maxMembers: 1,
    features: [
      "20% discount on all treatments",
      "2 free dental cleanings per year",
      "Priority appointment booking",
      "Free dental checkup on enrollment",
      "Free X-ray on enrollment",
    ],
    benefits: [
      { type: "discount", description: "20% off on all treatments", discountPercentage: 20 },
      {
        type: "free_service",
        description: "2 free dental cleanings per year",
        freeService: { name: "Dental Cleaning", quantity: 2 },
      },
      { type: "priority_booking", description: "Priority appointment booking" },
    ],
    displayOrder: 3,
    isActive: true,
  },
  {
    name: "Family Gold",
    code: "FAM-GLD",
    type: "family",
    tier: "gold",
    description: "Premium family membership with 15% discount and 2 free cleanings",
    price: 3499,
    durationMonths: 12,
    discountPercentage: 15,
    maxMembers: 4,
    features: [
      "15% discount on all treatments",
      "Coverage for up to 4 family members",
      "2 free dental cleanings per year (shared)",
      "Priority appointment booking",
      "Free dental checkup for all members",
    ],
    benefits: [
      { type: "discount", description: "15% off on all treatments", discountPercentage: 15 },
      {
        type: "free_service",
        description: "2 free dental cleanings per year",
        freeService: { name: "Dental Cleaning", quantity: 2 },
      },
      { type: "priority_booking", description: "Priority appointment booking" },
    ],
    displayOrder: 5,
    isActive: true,
  },
];

// ============ APPOINTMENTS ============
// Note: patient, clinic, and createdBy should be replaced with actual ObjectIds
export const appointments = [
  {
    // patient: "<PATIENT_ID>",
    // clinic: "<CLINIC_ID>",
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    timeSlot: "10:00",
    type: "regular",
    status: "scheduled",
    reason: "Routine dental checkup",
    opdFee: 300,
    opdFeePaid: false,
    source: "phone",
  },
  {
    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    timeSlot: "10:30",
    type: "regular",
    status: "scheduled",
    reason: "Tooth pain in lower right molar",
    opdFee: 300,
    opdFeePaid: false,
    source: "walk_in",
  },
  {
    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    timeSlot: "11:00",
    type: "follow_up",
    status: "confirmed",
    reason: "Follow-up after root canal",
    opdFee: 300,
    opdFeePaid: true,
    source: "online",
  },
  {
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    timeSlot: "09:30",
    type: "emergency",
    status: "scheduled",
    reason: "Severe tooth pain, possible abscess",
    opdFee: 500,
    opdFeePaid: false,
    source: "phone",
  },
  {
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    timeSlot: "14:00",
    type: "regular",
    status: "scheduled",
    reason: "Teeth cleaning",
    opdFee: 300,
    opdFeePaid: false,
    source: "app",
  },
];

// ============ TREATMENTS ============
// Note: patient, treatmentType, clinic should be replaced with actual ObjectIds
export const treatments = [
  {
    // patient: "<PATIENT_ID>",
    // treatmentType: "<TREATMENT_MASTER_ID>", // Root Canal
    // clinic: "<CLINIC_ID>",
    teeth: ["36"], // Lower left first molar
    status: "in_progress",
    price: 5000,
    discount: {
      percentage: 10,
      amount: 500,
      reason: "Membership discount",
    },
    totalSessions: 2,
    completedSessions: 1,
    diagnosis: "Irreversible pulpitis with periapical abscess",
    treatmentPlan: "Root canal treatment followed by crown",
    notes: "Patient has sensitivity to cold. Session 1 completed - pulp extirpation done.",
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    followUpRequired: true,
    followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  {
    teeth: ["11", "21"], // Upper front teeth
    status: "completed",
    price: 3000,
    discount: {
      percentage: 0,
      amount: 0,
    },
    totalSessions: 1,
    completedSessions: 1,
    diagnosis: "Dental caries on anterior teeth",
    treatmentPlan: "Composite filling on both teeth",
    notes: "Treatment completed successfully. Advised patient to avoid hard foods for 24 hours.",
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    completionDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    followUpRequired: false,
  },
  {
    teeth: ["48"], // Lower right wisdom tooth
    status: "planned",
    price: 2500,
    discount: {
      percentage: 15,
      amount: 375,
      reason: "Gold membership discount",
    },
    totalSessions: 1,
    completedSessions: 0,
    diagnosis: "Impacted wisdom tooth",
    treatmentPlan: "Surgical extraction under local anesthesia",
    notes: "Patient referred for OPG X-ray before procedure",
    followUpRequired: true,
  },
];

// ============ TEST TYPES (Master) ============
export const testMaster = [
  {
    name: "Intraoral Periapical X-Ray (IOPA)",
    code: "IOPA",
    category: "radiograph",
    description: "Single tooth X-ray for detailed view of tooth and surrounding bone",
    price: 200,
    isActive: true,
  },
  {
    name: "Orthopantomogram (OPG)",
    code: "OPG",
    category: "radiograph",
    description: "Full mouth panoramic X-ray showing all teeth and jaw",
    price: 500,
    isActive: true,
  },
  {
    name: "Lateral Cephalogram",
    code: "CEPH",
    category: "radiograph",
    description: "Side view X-ray for orthodontic treatment planning",
    price: 600,
    isActive: true,
  },
  {
    name: "CBCT Scan",
    code: "CBCT",
    category: "radiograph",
    description: "3D cone beam CT scan for implant planning",
    price: 3000,
    isActive: true,
  },
  {
    name: "Pulp Vitality Test",
    code: "PVT",
    category: "diagnostic",
    description: "Test to check if tooth pulp is alive",
    price: 100,
    isActive: true,
  },
];

// ============ INVOICES ============
export const invoices = [
  {
    // patient: "<PATIENT_ID>",
    // clinic: "<CLINIC_ID>",
    invoiceNumber: "INV-2601-0001",
    status: "paid",
    items: [
      {
        description: "Root Canal Treatment",
        quantity: 1,
        unitPrice: 5000,
        discount: 500,
        total: 4500,
      },
      {
        description: "Dental X-Ray (IOPA)",
        quantity: 2,
        unitPrice: 200,
        discount: 0,
        total: 400,
      },
    ],
    subtotal: 5400,
    discountTotal: 500,
    taxAmount: 0,
    grandTotal: 4900,
    paidAmount: 4900,
    dueAmount: 0,
    paymentStatus: "paid",
    issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    invoiceNumber: "INV-2601-0002",
    status: "issued",
    items: [
      {
        description: "Dental Cleaning",
        quantity: 1,
        unitPrice: 800,
        discount: 80,
        total: 720,
      },
      {
        description: "Dental Checkup",
        quantity: 1,
        unitPrice: 300,
        discount: 30,
        total: 270,
      },
    ],
    subtotal: 1100,
    discountTotal: 110,
    taxAmount: 0,
    grandTotal: 990,
    paidAmount: 0,
    dueAmount: 990,
    paymentStatus: "pending",
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
];

// ============ PAYMENTS ============
export const payments = [
  {
    // patient: "<PATIENT_ID>",
    // invoice: "<INVOICE_ID>",
    paymentNumber: "PAY-2601-0001",
    amount: 4900,
    paymentMethod: "cash",
    status: "completed",
    paymentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    notes: "Full payment received",
  },
  {
    paymentNumber: "PAY-2601-0002",
    amount: 2000,
    paymentMethod: "upi",
    status: "completed",
    transactionId: "UPI123456789",
    paymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    notes: "Partial payment for dental implant",
  },
  {
    paymentNumber: "PAY-2601-0003",
    amount: 35000,
    paymentMethod: "razorpay",
    status: "completed",
    transactionId: "pay_NxYz123AbCdEfG",
    razorpayOrderId: "order_NxYz123AbCdEfG",
    razorpayPaymentId: "pay_NxYz123AbCdEfG",
    paymentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    notes: "Online payment for braces treatment",
  },
];

// ============ NOTIFICATIONS ============
export const notifications = [
  {
    // recipient: "<USER_ID or PATIENT_ID>",
    recipientModel: "Patient",
    type: "appointment_reminder",
    title: "Appointment Reminder",
    message: "Your appointment is scheduled for tomorrow at 10:00 AM",
    priority: "normal",
    isRead: false,
    channels: ["sms", "app"],
  },
  {
    recipientModel: "Patient",
    type: "payment_due",
    title: "Payment Due",
    message: "You have a pending payment of Rs. 990 for your recent treatment",
    priority: "high",
    isRead: false,
    channels: ["sms"],
  },
  {
    recipientModel: "User",
    type: "system",
    title: "New Patient Registration",
    message: "A new patient Amit Sharma has been registered",
    priority: "low",
    isRead: true,
    channels: ["app"],
  },
];

// ============ AUTH TEST DATA ============
export const authTestData = {
  adminLogin: {
    email: "admin@ujjwaldental.com",
    password: "Admin@123",
  },
  patientLogin: {
    phone: "9812345678",
  },
  patientOtpVerify: {
    phone: "9812345678",
    otp: "123456", // Test OTP - actual OTP will be generated
  },
  forgotPassword: {
    email: "admin@ujjwaldental.com",
  },
};

// ============ API REQUEST SAMPLES ============
export const apiRequestSamples = {
  // Create Patient
  createPatient: {
    name: "Test Patient",
    phone: "9999888877",
    email: "test.patient@email.com",
    gender: "male",
    dateOfBirth: "1995-06-15",
    address: {
      street: "123 Test Street",
      city: "Hisar",
      state: "Haryana",
      pincode: "125001",
    },
    bloodGroup: "A+",
    allergies: ["None"],
    emergencyContact: {
      name: "Test Contact",
      phone: "9999888876",
      relation: "Spouse",
    },
  },

  // Book Appointment
  bookAppointment: {
    // patient: "<PATIENT_ID>",
    // clinic: "<CLINIC_ID>",
    date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split("T")[0],
    timeSlot: "11:30",
    type: "regular",
    reason: "General checkup and cleaning",
    source: "online",
  },

  // Add Treatment
  addTreatment: {
    // patient: "<PATIENT_ID>",
    // treatmentType: "<TREATMENT_MASTER_ID>",
    // clinic: "<CLINIC_ID>",
    teeth: ["16"],
    price: 1500,
    diagnosis: "Dental caries",
    treatmentPlan: "Composite filling",
    notes: "Moderate decay, single sitting treatment",
  },

  // Create Invoice
  createInvoice: {
    // patient: "<PATIENT_ID>",
    // clinic: "<CLINIC_ID>",
    items: [
      {
        description: "Dental Cleaning",
        quantity: 1,
        unitPrice: 800,
        discount: 0,
      },
    ],
  },

  // Record Payment
  recordPayment: {
    // patient: "<PATIENT_ID>",
    // invoice: "<INVOICE_ID>",
    amount: 800,
    paymentMethod: "cash",
    notes: "Full payment",
  },

  // Assign Membership
  assignMembership: {
    // patientId: "<PATIENT_ID>",
    // planId: "<MEMBERSHIP_PLAN_ID>",
    startDate: new Date().toISOString().split("T")[0],
  },
};

// ============ EXPORT ALL ============
export default {
  users,
  clinics,
  patients,
  treatmentMaster,
  membershipPlans,
  appointments,
  treatments,
  testMaster,
  invoices,
  payments,
  notifications,
  authTestData,
  apiRequestSamples,
};
