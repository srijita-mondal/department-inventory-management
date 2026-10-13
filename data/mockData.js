// ============================================================
// NFSU InventoryHub – Mock / Demo Data
// ============================================================
// In a production build this file is replaced by Supabase
// queries (with RLS).  Role assignments are enforced by the
// database; no secret is kept on the client.
// ============================================================

import { addDays, subDays, format } from 'date-fns';

const TODAY = new Date('2026-10-13');

// ------------------------------------------------------------------
// USERS  (hashed_password would be stored server-side; demo only)
// ------------------------------------------------------------------
export const DEMO_USERS = [
  {
    id: 'u-admin-1',
    email: 'coordinator@nfsu.ac.in',
    password: 'Admin@123',      // Demo only – never store plaintext
    role: 'admin',
    name: 'Dr. Priya Sharma',
    display: 'Inventory Coordinator',
  },
  {
    id: 'u-admin-2',
    email: 'lab@nfsu.ac.in',
    password: 'Lab@123',
    role: 'admin',
    name: 'Mr. Ramesh Patel',
    display: 'Lab Manager',
  },
  {
    id: 'u-stu-1',
    email: 'student1@nfsu.ac.in',
    password: 'Student@123',
    role: 'student',
    name: 'Aarav Mehta',
    studentId: 'stu-1',
  },
  {
    id: 'u-stu-2',
    email: 'student2@nfsu.ac.in',
    password: 'Student@123',
    role: 'student',
    name: 'Sneha Joshi',
    studentId: 'stu-2',
  },
  {
    id: 'u-stu-3',
    email: 'student3@nfsu.ac.in',
    password: 'Student@123',
    role: 'student',
    name: 'Rohan Verma',
    studentId: 'stu-3',
  },
];

// ------------------------------------------------------------------
// LOCATIONS
// ------------------------------------------------------------------
export const locations = [
  { id: 'loc-1', name: 'Digital Forensics Lab', room: 'Block A, Room 101' },
  { id: 'loc-2', name: 'Cyber Lab', room: 'Block B, Room 202' },
  { id: 'loc-3', name: 'Main Store', room: 'Block C, Room 001' },
  { id: 'loc-4', name: 'Network Lab', room: 'Block D, Room 305' },
];

// ------------------------------------------------------------------
// STUDENTS
// ------------------------------------------------------------------
export const students = [
  {
    id: 'stu-1',
    userId: 'u-stu-1',
    name: 'Aarav Mehta',
    enrollmentNo: 'NFSU2024001',
    programme: 'B.Tech Cyber Security',
    semester: 5,
    status: 'active',
    email: 'student1@nfsu.ac.in',
  },
  {
    id: 'stu-2',
    userId: 'u-stu-2',
    name: 'Sneha Joshi',
    enrollmentNo: 'NFSU2024002',
    programme: 'M.Sc Digital Forensics',
    semester: 3,
    status: 'active',
    email: 'student2@nfsu.ac.in',
  },
  {
    id: 'stu-3',
    userId: 'u-stu-3',
    name: 'Rohan Verma',
    enrollmentNo: 'NFSU2023015',
    programme: 'B.Tech Cyber Security',
    semester: 7,
    status: 'active',
    email: 'student3@nfsu.ac.in',
  },
  {
    id: 'stu-4',
    userId: null,
    name: 'Kavya Singh',
    enrollmentNo: 'NFSU2024008',
    programme: 'M.Sc Forensic Science',
    semester: 1,
    status: 'active',
    email: 'kavya.singh@nfsu.ac.in',
  },
];

// ------------------------------------------------------------------
// INVENTORY ITEMS
// ------------------------------------------------------------------
export const inventoryItems = [
  {
    id: 'inv-1',
    itemCode: 'NFSU-LAP-001',
    name: 'Dell Inspiron Laptop',
    category: 'Equipment',
    description: '15.6" i5 11th Gen, 16GB RAM, 512GB SSD',
    make: 'Dell',
    model: 'Inspiron 15 3511',
    trackingType: 'individual',
    totalQty: 5,
    availableQty: 3,
    locationId: 'loc-1',
    condition: 'usable',
  },
  {
    id: 'inv-2',
    itemCode: 'NFSU-CAB-USB',
    name: 'USB-A to USB-C Cable (1m)',
    category: 'Cable',
    description: 'Data + charging cable, braided',
    make: 'Generic',
    model: '1m Braided',
    trackingType: 'quantity',
    totalQty: 30,
    availableQty: 22,
    locationId: 'loc-3',
    condition: 'usable',
  },
  {
    id: 'inv-3',
    itemCode: 'NFSU-RPIKIT-001',
    name: 'Raspberry Pi 4 Kit',
    category: 'Equipment',
    description: 'RPi 4B 4GB + power adapter + case + SD card',
    make: 'Raspberry Pi Foundation',
    model: 'Pi 4 Model B',
    trackingType: 'individual',
    totalQty: 8,
    availableQty: 6,
    locationId: 'loc-2',
    condition: 'usable',
  },
  {
    id: 'inv-4',
    itemCode: 'NFSU-HDMI-001',
    name: 'HDMI Cable (2m)',
    category: 'Cable',
    description: 'Full HD 4K HDMI 2.0 cable',
    make: 'Generic',
    model: '2m HDMI 2.0',
    trackingType: 'quantity',
    totalQty: 15,
    availableQty: 11,
    locationId: 'loc-3',
    condition: 'usable',
  },
  {
    id: 'inv-5',
    itemCode: 'NFSU-WLANUSB-001',
    name: 'USB WiFi Adapter',
    category: 'Adapter',
    description: 'Dual-band 802.11ac USB 3.0 adapter',
    make: 'TP-Link',
    model: 'Archer T3U',
    trackingType: 'quantity',
    totalQty: 20,
    availableQty: 14,
    locationId: 'loc-4',
    condition: 'usable',
  },
  {
    id: 'inv-6',
    itemCode: 'NFSU-KBD-001',
    name: 'Mechanical Keyboard',
    category: 'Equipment',
    description: 'Wired USB mechanical keyboard, TKL layout',
    make: 'Keychron',
    model: 'K2 Pro',
    trackingType: 'individual',
    totalQty: 4,
    availableQty: 2,
    locationId: 'loc-1',
    condition: 'usable',
  },
  {
    id: 'inv-7',
    itemCode: 'NFSU-EXT-HDD',
    name: 'External HDD 1TB',
    category: 'Equipment',
    description: 'USB 3.0 portable hard drive for forensic imaging',
    make: 'Seagate',
    model: 'Expansion 1TB',
    trackingType: 'individual',
    totalQty: 6,
    availableQty: 3,
    locationId: 'loc-1',
    condition: 'usable',
  },
];

// ------------------------------------------------------------------
// INDIVIDUAL ASSETS  (only for trackingType = 'individual')
// ------------------------------------------------------------------
export const assets = [
  { id: 'ast-1', itemId: 'inv-1', assetTag: 'NFSU-LAP-001-A', serial: 'DL2024001', condition: 'usable', status: 'issued', locationId: 'loc-1' },
  { id: 'ast-2', itemId: 'inv-1', assetTag: 'NFSU-LAP-001-B', serial: 'DL2024002', condition: 'usable', status: 'issued', locationId: 'loc-1' },
  { id: 'ast-3', itemId: 'inv-1', assetTag: 'NFSU-LAP-001-C', serial: 'DL2024003', condition: 'usable', status: 'available', locationId: 'loc-1' },
  { id: 'ast-4', itemId: 'inv-1', assetTag: 'NFSU-LAP-001-D', serial: 'DL2024004', condition: 'usable', status: 'available', locationId: 'loc-1' },
  { id: 'ast-5', itemId: 'inv-1', assetTag: 'NFSU-LAP-001-E', serial: 'DL2024005', condition: 'usable', status: 'available', locationId: 'loc-1' },
  { id: 'ast-6', itemId: 'inv-3', assetTag: 'NFSU-RPI-001-A', serial: 'RPI4B-001', condition: 'usable', status: 'issued', locationId: 'loc-2' },
  { id: 'ast-7', itemId: 'inv-3', assetTag: 'NFSU-RPI-001-B', serial: 'RPI4B-002', condition: 'usable', status: 'issued', locationId: 'loc-2' },
  { id: 'ast-8', itemId: 'inv-3', assetTag: 'NFSU-RPI-001-C', serial: 'RPI4B-003', condition: 'usable', status: 'available', locationId: 'loc-2' },
  { id: 'ast-9', itemId: 'inv-3', assetTag: 'NFSU-RPI-001-D', serial: 'RPI4B-004', condition: 'usable', status: 'available', locationId: 'loc-2' },
  { id: 'ast-10', itemId: 'inv-3', assetTag: 'NFSU-RPI-001-E', serial: 'RPI4B-005', condition: 'usable', status: 'available', locationId: 'loc-2' },
  { id: 'ast-11', itemId: 'inv-3', assetTag: 'NFSU-RPI-001-F', serial: 'RPI4B-006', condition: 'usable', status: 'available', locationId: 'loc-2' },
  { id: 'ast-12', itemId: 'inv-3', assetTag: 'NFSU-RPI-001-G', serial: 'RPI4B-007', condition: 'damaged', status: 'damaged', locationId: 'loc-2' },
  { id: 'ast-13', itemId: 'inv-3', assetTag: 'NFSU-RPI-001-H', serial: 'RPI4B-008', condition: 'damaged', status: 'damaged', locationId: 'loc-2' },
  { id: 'ast-14', itemId: 'inv-6', assetTag: 'NFSU-KBD-001-A', serial: 'KC-K2P-001', condition: 'usable', status: 'issued', locationId: 'loc-1' },
  { id: 'ast-15', itemId: 'inv-6', assetTag: 'NFSU-KBD-001-B', serial: 'KC-K2P-002', condition: 'usable', status: 'issued', locationId: 'loc-1' },
  { id: 'ast-16', itemId: 'inv-6', assetTag: 'NFSU-KBD-001-C', serial: 'KC-K2P-003', condition: 'usable', status: 'available', locationId: 'loc-1' },
  { id: 'ast-17', itemId: 'inv-6', assetTag: 'NFSU-KBD-001-D', serial: 'KC-K2P-004', condition: 'usable', status: 'available', locationId: 'loc-1' },
  { id: 'ast-18', itemId: 'inv-7', assetTag: 'NFSU-EHD-001-A', serial: 'SGT-EXP-001', condition: 'usable', status: 'issued', locationId: 'loc-1' },
  { id: 'ast-19', itemId: 'inv-7', assetTag: 'NFSU-EHD-001-B', serial: 'SGT-EXP-002', condition: 'usable', status: 'issued', locationId: 'loc-1' },
  { id: 'ast-20', itemId: 'inv-7', assetTag: 'NFSU-EHD-001-C', serial: 'SGT-EXP-003', condition: 'usable', status: 'issued', locationId: 'loc-1' },
  { id: 'ast-21', itemId: 'inv-7', assetTag: 'NFSU-EHD-001-D', serial: 'SGT-EXP-004', condition: 'usable', status: 'available', locationId: 'loc-1' },
  { id: 'ast-22', itemId: 'inv-7', assetTag: 'NFSU-EHD-001-E', serial: 'SGT-EXP-005', condition: 'usable', status: 'available', locationId: 'loc-1' },
  { id: 'ast-23', itemId: 'inv-7', assetTag: 'NFSU-EHD-001-F', serial: 'SGT-EXP-006', condition: 'usable', status: 'available', locationId: 'loc-1' },
];

// ------------------------------------------------------------------
// ISSUES
// ------------------------------------------------------------------
const d = (daysAgo) => format(subDays(TODAY, daysAgo), 'yyyy-MM-dd');
const due = (issueDate, extra = 0) => format(addDays(new Date(issueDate), 15 + extra), 'yyyy-MM-dd');

export const issues = [
  {
    id: 'iss-1',
    studentId: 'stu-1',
    issuedBy: 'u-admin-1',
    issueDate: d(20),
    dueDate: due(d(20)),  // overdue
    status: 'overdue',
    purpose: 'Final Year Project – Network Forensics',
    lines: [
      { id: 'il-1', issueId: 'iss-1', itemId: 'inv-1', assetId: 'ast-1', qtyIssued: 1, qtyReturned: 0, qtyOutstanding: 1 },
    ],
  },
  {
    id: 'iss-2',
    studentId: 'stu-1',
    issuedBy: 'u-admin-1',
    issueDate: d(18),
    dueDate: due(d(18)),  // overdue
    status: 'overdue',
    purpose: 'Lab practical – cables',
    lines: [
      { id: 'il-2', issueId: 'iss-2', itemId: 'inv-2', assetId: null, qtyIssued: 3, qtyReturned: 1, qtyOutstanding: 2 },
    ],
  },
  {
    id: 'iss-3',
    studentId: 'stu-2',
    issuedBy: 'u-admin-2',
    issueDate: d(10),
    dueDate: due(d(10)),
    status: 'active',
    purpose: 'M.Sc Dissertation – Embedded Security',
    lines: [
      { id: 'il-3', issueId: 'iss-3', itemId: 'inv-3', assetId: 'ast-6', qtyIssued: 1, qtyReturned: 0, qtyOutstanding: 1 },
      { id: 'il-4', issueId: 'iss-3', itemId: 'inv-2', assetId: null, qtyIssued: 2, qtyReturned: 0, qtyOutstanding: 2 },
    ],
  },
  {
    id: 'iss-4',
    studentId: 'stu-3',
    issuedBy: 'u-admin-1',
    issueDate: d(5),
    dueDate: due(d(5)),
    status: 'active',
    purpose: 'Seminar Presentation Setup',
    lines: [
      { id: 'il-5', issueId: 'iss-4', itemId: 'inv-1', assetId: 'ast-2', qtyIssued: 1, qtyReturned: 0, qtyOutstanding: 1 },
      { id: 'il-6', issueId: 'iss-4', itemId: 'inv-4', assetId: null, qtyIssued: 1, qtyReturned: 0, qtyOutstanding: 1 },
    ],
  },
  {
    id: 'iss-5',
    studentId: 'stu-2',
    issuedBy: 'u-admin-2',
    issueDate: d(3),
    dueDate: due(d(3)),
    status: 'active',
    purpose: 'Forensic Imaging Exercise',
    lines: [
      { id: 'il-7', issueId: 'iss-5', itemId: 'inv-7', assetId: 'ast-18', qtyIssued: 1, qtyReturned: 0, qtyOutstanding: 1 },
    ],
  },
  {
    id: 'iss-6',
    studentId: 'stu-3',
    issuedBy: 'u-admin-1',
    issueDate: d(30),
    dueDate: due(d(30), 15), // renewed once
    status: 'active',
    purpose: 'Long-term project – keyboard for coding lab',
    lines: [
      { id: 'il-8', issueId: 'iss-6', itemId: 'inv-6', assetId: 'ast-14', qtyIssued: 1, qtyReturned: 0, qtyOutstanding: 1 },
    ],
  },
];

// ------------------------------------------------------------------
// RENEWALS
// ------------------------------------------------------------------
export const renewals = [
  {
    id: 'ren-1',
    issueId: 'iss-1',
    studentId: 'stu-1',
    requestDate: d(5),
    status: 'pending',
    decisionBy: null,
    decisionDate: null,
    remarks: null,
    currentDueDate: due(d(20)),
    proposedDueDate: due(due(d(20))),
  },
  {
    id: 'ren-2',
    issueId: 'iss-6',
    studentId: 'stu-3',
    requestDate: d(16),
    status: 'approved',
    decisionBy: 'u-admin-1',
    decisionDate: d(15),
    remarks: 'Approved for project extension.',
    currentDueDate: due(d(30)),
    proposedDueDate: due(d(30), 15),
  },
  {
    id: 'ren-3',
    issueId: 'iss-2',
    studentId: 'stu-1',
    requestDate: d(3),
    status: 'rejected',
    decisionBy: 'u-admin-1',
    decisionDate: d(2),
    remarks: 'Item required for another student. Please return immediately.',
    currentDueDate: due(d(18)),
    proposedDueDate: due(due(d(18))),
  },
];

// ------------------------------------------------------------------
// RETURNS
// ------------------------------------------------------------------
export const returns = [
  {
    id: 'ret-1',
    issueId: 'iss-2',
    issueLine: 'il-2',
    returnDate: d(16),
    qtyReturned: 1,
    condition: 'usable',
    receivedBy: 'u-admin-1',
    remarks: 'Cable in good condition.',
  },
];

// ------------------------------------------------------------------
// TRANSACTIONS  (audit log)
// ------------------------------------------------------------------
let txCounter = 1;
const tx = (type, actorId, details, date, targetId = null) => ({
  id: `tx-${txCounter++}`,
  type,
  actorId,
  targetId,
  details,
  timestamp: `${date}T10:00:00`,
});

export const transactions = [
  tx('ISSUE', 'u-admin-1', 'Issued Dell Laptop (ast-1) to Aarav Mehta (iss-1)', d(20), 'iss-1'),
  tx('ISSUE', 'u-admin-1', 'Issued 3× USB-C Cable to Aarav Mehta (iss-2)', d(18), 'iss-2'),
  tx('ISSUE', 'u-admin-2', 'Issued RPi Kit (ast-6) + 2× USB-C Cable to Sneha Joshi (iss-3)', d(10), 'iss-3'),
  tx('RETURN', 'u-admin-1', 'Partial return: 1× USB-C Cable from Aarav Mehta (iss-2)', d(16), 'ret-1'),
  tx('RENEWAL_REQUEST', 'u-stu-1', 'Renewal request submitted for iss-1', d(5), 'ren-1'),
  tx('RENEWAL_REQUEST', 'u-stu-3', 'Renewal request submitted for iss-6', d(16), 'ren-2'),
  tx('RENEWAL_APPROVED', 'u-admin-1', 'Renewal approved for iss-6 (Rohan Verma). Due extended by 15 days.', d(15), 'ren-2'),
  tx('RENEWAL_REJECTED', 'u-admin-1', 'Renewal rejected for iss-2 (Aarav Mehta). Item required.', d(2), 'ren-3'),
  tx('ISSUE', 'u-admin-1', 'Issued Dell Laptop (ast-2) + 1× HDMI Cable to Rohan Verma (iss-4)', d(5), 'iss-4'),
  tx('ISSUE', 'u-admin-2', 'Issued External HDD (ast-18) to Sneha Joshi (iss-5)', d(3), 'iss-5'),
  tx('ISSUE', 'u-admin-1', 'Issued Keyboard (ast-14) to Rohan Verma (iss-6)', d(30), 'iss-6'),
];

// ------------------------------------------------------------------
// STOCK ADJUSTMENTS
// ------------------------------------------------------------------
export const stockAdjustments = [
  {
    id: 'adj-1',
    itemId: 'inv-3',
    assetId: 'ast-12',
    type: 'condition_change',
    date: d(25),
    reason: 'PCB burned during lab session.',
    qtyAdjusted: null,
    newCondition: 'damaged',
    actorId: 'u-admin-2',
  },
  {
    id: 'adj-2',
    itemId: 'inv-3',
    assetId: 'ast-13',
    type: 'condition_change',
    date: d(25),
    reason: 'Dropped; SD card slot broken.',
    qtyAdjusted: null,
    newCondition: 'damaged',
    actorId: 'u-admin-2',
  },
];
