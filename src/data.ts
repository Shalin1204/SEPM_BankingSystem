export type TxStatus = "Completed" | "Pending" | "Failed" | "Suspicious";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type AccountStatus = "Active" | "Frozen" | "Closed" | "Restricted";
export type InvStatus = "Open" | "Under Investigation" | "Resolved" | "Closed";
export type Priority = "Low" | "Medium" | "High" | "Critical";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountCount: number;
  totalTransactions: number;
  riskLevel: RiskLevel;
  status: AccountStatus;
  city: string;
  joinDate: string;
}

export interface Account {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  type: "Savings" | "Current" | "Salary" | "NRI";
  balance: number;
  status: AccountStatus;
  createdDate: string;
  lastTransaction: string;
  riskLevel: RiskLevel;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  accountId: string;
  accountNumber: string;
  dateTime: string;
  type: "UPI" | "NEFT" | "RTGS" | "IMPS" | "Card" | "ATM" | "SWIFT";
  merchant: string;
  amount: number;
  status: TxStatus;
  risk: RiskLevel;
  location: string;
  paymentMethod: string;
  riskScore: number;
  detectionRules: string[];
  detectionResult: "Clean" | "Flagged" | "Confirmed Fraud";
}

export interface FraudAlert {
  id: string;
  transactionId: string;
  riskLevel: RiskLevel;
  reason: string;
  time: string;
  customerName: string;
}

export interface FraudLog {
  id: string;
  transactionId: string;
  detectionRule: string;
  riskScore: number;
  fraudType: string;
  detectedDate: string;
  status: "New" | "Under Review" | "Confirmed" | "False Positive";
  investigator: string;
}

export interface Investigation {
  id: string;
  fraudLogId: string;
  customerId: string;
  customerName: string;
  transactionId: string;
  amount: number;
  assignedInvestigator: string;
  priority: Priority;
  status: InvStatus;
  createdDate: string;
  lastUpdated: string;
  notes: string[];
  evidence: string[];
}

export const customers: Customer[] = [
  { id: "C001", name: "Arjun Mehta", email: "arjun.mehta@gmail.com", phone: "+91 98201 34567", accountCount: 2, totalTransactions: 284, riskLevel: "Low", status: "Active", city: "Mumbai", joinDate: "2019-03-15" },
  { id: "C002", name: "Priya Sharma", email: "priya.sharma@yahoo.com", phone: "+91 99876 54321", accountCount: 1, totalTransactions: 412, riskLevel: "Medium", status: "Active", city: "Delhi", joinDate: "2018-07-22" },
  { id: "C003", name: "Rahul Verma", email: "rahul.v@outlook.com", phone: "+91 98765 12345", accountCount: 3, totalTransactions: 156, riskLevel: "High", status: "Restricted", city: "Bengaluru", joinDate: "2020-01-08" },
  { id: "C004", name: "Sunita Patel", email: "sunita.patel@gmail.com", phone: "+91 97654 23456", accountCount: 1, totalTransactions: 98, riskLevel: "Low", status: "Active", city: "Ahmedabad", joinDate: "2021-05-17" },
  { id: "C005", name: "Vikram Singh", email: "vikram.singh@gmail.com", phone: "+91 96543 34567", accountCount: 2, totalTransactions: 621, riskLevel: "Critical", status: "Frozen", city: "Jaipur", joinDate: "2017-11-30" },
  { id: "C006", name: "Anjali Nair", email: "anjali.nair@hotmail.com", phone: "+91 95432 45678", accountCount: 1, totalTransactions: 203, riskLevel: "Low", status: "Active", city: "Kochi", joinDate: "2020-09-04" },
  { id: "C007", name: "Deepak Gupta", email: "deepak.g@gmail.com", phone: "+91 94321 56789", accountCount: 2, totalTransactions: 341, riskLevel: "Medium", status: "Active", city: "Pune", joinDate: "2019-06-12" },
  { id: "C008", name: "Meera Krishnan", email: "meera.k@gmail.com", phone: "+91 93210 67890", accountCount: 1, totalTransactions: 178, riskLevel: "Low", status: "Active", city: "Chennai", joinDate: "2021-02-28" },
  { id: "C009", name: "Rohan Desai", email: "rohan.desai@gmail.com", phone: "+91 92109 78901", accountCount: 3, totalTransactions: 512, riskLevel: "High", status: "Active", city: "Mumbai", joinDate: "2018-04-19" },
  { id: "C010", name: "Kavya Reddy", email: "kavya.r@gmail.com", phone: "+91 91098 89012", accountCount: 1, totalTransactions: 89, riskLevel: "Low", status: "Active", city: "Hyderabad", joinDate: "2022-01-15" },
];

export const accounts: Account[] = [
  { id: "A001", number: "XXXX-XXXX-4521", customerId: "C001", customerName: "Arjun Mehta", type: "Savings", balance: 284500, status: "Active", createdDate: "2019-03-15", lastTransaction: "2026-08-26", riskLevel: "Low" },
  { id: "A002", number: "XXXX-XXXX-7832", customerId: "C001", customerName: "Arjun Mehta", type: "Current", balance: 1250000, status: "Active", createdDate: "2020-06-10", lastTransaction: "2026-08-25", riskLevel: "Low" },
  { id: "A003", number: "XXXX-XXXX-3914", customerId: "C002", customerName: "Priya Sharma", type: "Salary", balance: 94200, status: "Active", createdDate: "2018-07-22", lastTransaction: "2026-08-27", riskLevel: "Medium" },
  { id: "A004", number: "XXXX-XXXX-6173", customerId: "C003", customerName: "Rahul Verma", type: "Savings", balance: 12800, status: "Restricted", createdDate: "2020-01-08", lastTransaction: "2026-08-20", riskLevel: "High" },
  { id: "A005", number: "XXXX-XXXX-8824", customerId: "C004", customerName: "Sunita Patel", type: "Savings", balance: 156700, status: "Active", createdDate: "2021-05-17", lastTransaction: "2026-08-24", riskLevel: "Low" },
  { id: "A006", number: "XXXX-XXXX-2291", customerId: "C005", customerName: "Vikram Singh", type: "Current", balance: 0, status: "Frozen", createdDate: "2017-11-30", lastTransaction: "2026-08-15", riskLevel: "Critical" },
  { id: "A007", number: "XXXX-XXXX-5567", customerId: "C006", customerName: "Anjali Nair", type: "Savings", balance: 324100, status: "Active", createdDate: "2020-09-04", lastTransaction: "2026-08-26", riskLevel: "Low" },
  { id: "A008", number: "XXXX-XXXX-1183", customerId: "C007", customerName: "Deepak Gupta", type: "NRI", balance: 8940000, status: "Active", createdDate: "2019-06-12", lastTransaction: "2026-08-27", riskLevel: "Medium" },
  { id: "A009", number: "XXXX-XXXX-9945", customerId: "C008", customerName: "Meera Krishnan", type: "Salary", balance: 67800, status: "Active", createdDate: "2021-02-28", lastTransaction: "2026-08-26", riskLevel: "Low" },
  { id: "A010", number: "XXXX-XXXX-3302", customerId: "C009", customerName: "Rohan Desai", type: "Current", balance: 2150000, status: "Active", createdDate: "2018-04-19", lastTransaction: "2026-08-27", riskLevel: "High" },
];

export const transactions: Transaction[] = [
  { id: "TXN-2408-001", customerId: "C001", customerName: "Arjun Mehta", accountId: "A001", accountNumber: "XXXX-XXXX-4521", dateTime: "2026-08-27 09:14:32", type: "UPI", merchant: "Amazon India", amount: 4299, status: "Completed", risk: "Low", location: "Mumbai, MH", paymentMethod: "UPI / PhonePe", riskScore: 12, detectionRules: [], detectionResult: "Clean" },
  { id: "TXN-2408-002", customerId: "C002", customerName: "Priya Sharma", accountId: "A003", accountNumber: "XXXX-XXXX-3914", dateTime: "2026-08-27 09:32:18", type: "NEFT", merchant: "HDFC Bank", amount: 150000, status: "Completed", risk: "Low", location: "Delhi, DL", paymentMethod: "Net Banking", riskScore: 18, detectionRules: [], detectionResult: "Clean" },
  { id: "TXN-2408-003", customerId: "C003", customerName: "Rahul Verma", accountId: "A004", accountNumber: "XXXX-XXXX-6173", dateTime: "2026-08-27 10:05:44", type: "Card", merchant: "International Wire Transfer", amount: 850000, status: "Suspicious", risk: "Critical", location: "Lagos, NG", paymentMethod: "Debit Card", riskScore: 94, detectionRules: ["Unusual Geography", "High Amount", "Multiple Failed Attempts"], detectionResult: "Flagged" },
  { id: "TXN-2408-004", customerId: "C005", customerName: "Vikram Singh", accountId: "A006", accountNumber: "XXXX-XXXX-2291", dateTime: "2026-08-27 10:22:09", type: "IMPS", merchant: "Unknown Payee", amount: 490000, status: "Suspicious", risk: "High", location: "Jaipur, RJ", paymentMethod: "Mobile Banking", riskScore: 82, detectionRules: ["Structuring Pattern", "New Payee Large Amount"], detectionResult: "Flagged" },
  { id: "TXN-2408-005", customerId: "C004", customerName: "Sunita Patel", accountId: "A005", accountNumber: "XXXX-XXXX-8824", dateTime: "2026-08-27 10:48:55", type: "UPI", merchant: "Swiggy", amount: 648, status: "Completed", risk: "Low", location: "Ahmedabad, GJ", paymentMethod: "UPI / GPay", riskScore: 8, detectionRules: [], detectionResult: "Clean" },
  { id: "TXN-2408-006", customerId: "C007", customerName: "Deepak Gupta", accountId: "A008", accountNumber: "XXXX-XXXX-1183", dateTime: "2026-08-27 11:02:33", type: "RTGS", merchant: "Overseas Account", amount: 2500000, status: "Suspicious", risk: "High", location: "Pune, MH", paymentMethod: "Net Banking", riskScore: 78, detectionRules: ["Large RTGS Transfer", "NRI Account Unusual Activity"], detectionResult: "Flagged" },
  { id: "TXN-2408-007", customerId: "C006", customerName: "Anjali Nair", accountId: "A007", accountNumber: "XXXX-XXXX-5567", dateTime: "2026-08-27 11:18:47", type: "UPI", merchant: "Zomato", amount: 412, status: "Completed", risk: "Low", location: "Kochi, KL", paymentMethod: "UPI / BHIM", riskScore: 6, detectionRules: [], detectionResult: "Clean" },
  { id: "TXN-2408-008", customerId: "C009", customerName: "Rohan Desai", accountId: "A010", accountNumber: "XXXX-XXXX-3302", dateTime: "2026-08-27 11:35:12", type: "Card", merchant: "Dark Web Marketplace", amount: 38000, status: "Suspicious", risk: "Critical", location: "Unknown", paymentMethod: "Credit Card", riskScore: 97, detectionRules: ["Blacklisted Merchant", "Tor Network IP", "VPN Detected"], detectionResult: "Confirmed Fraud" },
  { id: "TXN-2408-009", customerId: "C008", customerName: "Meera Krishnan", accountId: "A009", accountNumber: "XXXX-XXXX-9945", dateTime: "2026-08-27 11:52:28", type: "ATM", merchant: "ATM Withdrawal", amount: 10000, status: "Completed", risk: "Low", location: "Chennai, TN", paymentMethod: "ATM Card", riskScore: 15, detectionRules: [], detectionResult: "Clean" },
  { id: "TXN-2408-010", customerId: "C002", customerName: "Priya Sharma", accountId: "A003", accountNumber: "XXXX-XXXX-3914", dateTime: "2026-08-27 12:10:44", type: "UPI", merchant: "Flipkart", amount: 2199, status: "Pending", risk: "Low", location: "Delhi, DL", paymentMethod: "UPI / Paytm", riskScore: 10, detectionRules: [], detectionResult: "Clean" },
  { id: "TXN-2408-011", customerId: "C005", customerName: "Vikram Singh", accountId: "A006", accountNumber: "XXXX-XXXX-2291", dateTime: "2026-08-26 22:14:03", type: "SWIFT", merchant: "Foreign Entity", amount: 1200000, status: "Suspicious", risk: "Critical", location: "Cayman Islands", paymentMethod: "SWIFT Transfer", riskScore: 96, detectionRules: ["Offshore Transfer", "Sanctioned Country", "Round Amount"], detectionResult: "Confirmed Fraud" },
  { id: "TXN-2408-012", customerId: "C001", customerName: "Arjun Mehta", accountId: "A001", accountNumber: "XXXX-XXXX-4521", dateTime: "2026-08-26 15:30:22", type: "NEFT", merchant: "LIC Premium", amount: 25000, status: "Completed", risk: "Low", location: "Mumbai, MH", paymentMethod: "Net Banking", riskScore: 9, detectionRules: [], detectionResult: "Clean" },
  { id: "TXN-2408-013", customerId: "C003", customerName: "Rahul Verma", accountId: "A004", accountNumber: "XXXX-XXXX-6173", dateTime: "2026-08-26 08:45:11", type: "ATM", merchant: "ATM Withdrawal", amount: 20000, status: "Failed", risk: "Medium", location: "Unknown ATM, RJ", paymentMethod: "ATM Card", riskScore: 55, detectionRules: ["Multiple Failed PIN", "Out of State ATM"], detectionResult: "Flagged" },
];

export const fraudAlerts: FraudAlert[] = [
  { id: "FA001", transactionId: "TXN-2408-008", riskLevel: "Critical", reason: "Blacklisted merchant + Tor network IP detected", time: "11:35 AM", customerName: "Rohan Desai" },
  { id: "FA002", transactionId: "TXN-2408-011", riskLevel: "Critical", reason: "Offshore SWIFT to sanctioned region", time: "10:14 PM", customerName: "Vikram Singh" },
  { id: "FA003", transactionId: "TXN-2408-003", riskLevel: "Critical", reason: "Card used from foreign country — Nigeria", time: "10:05 AM", customerName: "Rahul Verma" },
  { id: "FA004", transactionId: "TXN-2408-006", riskLevel: "High", reason: "Large RTGS to unverified overseas account", time: "11:02 AM", customerName: "Deepak Gupta" },
  { id: "FA005", transactionId: "TXN-2408-004", riskLevel: "High", reason: "Structuring pattern — split large transactions", time: "10:22 AM", customerName: "Vikram Singh" },
];

export const fraudLogs: FraudLog[] = [
  { id: "FL-2408-001", transactionId: "TXN-2408-008", detectionRule: "Blacklisted Merchant + Tor IP", riskScore: 97, fraudType: "Dark Web Transaction", detectedDate: "2026-08-27 11:35:12", status: "Confirmed", investigator: "Amit Joshi" },
  { id: "FL-2408-002", transactionId: "TXN-2408-011", detectionRule: "Offshore Transfer to Sanctioned Region", riskScore: 96, fraudType: "Money Laundering", detectedDate: "2026-08-26 22:14:03", status: "Confirmed", investigator: "Amit Joshi" },
  { id: "FL-2408-003", transactionId: "TXN-2408-003", detectionRule: "Unusual Geography + High Amount", riskScore: 94, fraudType: "Card Not Present Fraud", detectedDate: "2026-08-27 10:05:44", status: "Under Review", investigator: "Neha Tiwari" },
  { id: "FL-2408-004", transactionId: "TXN-2408-006", detectionRule: "Large NRI RTGS Transfer", riskScore: 78, fraudType: "Suspicious Wire Transfer", detectedDate: "2026-08-27 11:02:33", status: "Under Review", investigator: "Rajesh Kumar" },
  { id: "FL-2408-005", transactionId: "TXN-2408-004", detectionRule: "Structuring Pattern", riskScore: 82, fraudType: "Structuring / Smurfing", detectedDate: "2026-08-27 10:22:09", status: "New", investigator: "Unassigned" },
  { id: "FL-2408-006", transactionId: "TXN-2408-013", detectionRule: "Multiple Failed PIN + Out-of-State ATM", riskScore: 55, fraudType: "ATM Card Skimming", detectedDate: "2026-08-26 08:45:11", status: "False Positive", investigator: "Neha Tiwari" },
];

export const investigations: Investigation[] = [
  {
    id: "INV-2408-001",
    fraudLogId: "FL-2408-001",
    customerId: "C009",
    customerName: "Rohan Desai",
    transactionId: "TXN-2408-008",
    amount: 38000,
    assignedInvestigator: "Amit Joshi",
    priority: "Critical",
    status: "Under Investigation",
    createdDate: "2026-08-27",
    lastUpdated: "2026-08-27",
    notes: [
      "Transaction initiated from Tor exit node IP 185.220.101.23",
      "Merchant domain registered 3 days ago — highly suspicious",
      "Customer denies making this transaction — card cloning suspected",
    ],
    evidence: [
      "IP Geolocation Report — Tor exit node confirmed",
      "Merchant blacklist match — fraud database entry #48821",
      "Card usage pattern deviation — significant anomaly",
    ],
  },
  {
    id: "INV-2408-002",
    fraudLogId: "FL-2408-002",
    customerId: "C005",
    customerName: "Vikram Singh",
    transactionId: "TXN-2408-011",
    amount: 1200000,
    assignedInvestigator: "Amit Joshi",
    priority: "Critical",
    status: "Under Investigation",
    createdDate: "2026-08-27",
    lastUpdated: "2026-08-27",
    notes: [
      "Customer account under AML watch for 3 months",
      "SWIFT to Cayman Islands entity — shell company suspected",
      "Compliance team notified — SAR filing initiated",
    ],
    evidence: [
      "AML Watch List Hit — customer ID C005",
      "Receiving entity — shell company (registered 6 months ago)",
      "Transaction pattern analysis — 12 similar transfers in 30 days",
    ],
  },
  {
    id: "INV-2408-003",
    fraudLogId: "FL-2408-003",
    customerId: "C003",
    customerName: "Rahul Verma",
    transactionId: "TXN-2408-003",
    amount: 850000,
    assignedInvestigator: "Neha Tiwari",
    priority: "High",
    status: "Open",
    createdDate: "2026-08-27",
    lastUpdated: "2026-08-27",
    notes: ["Transaction from Nigeria — card possibly skimmed at ATM"],
    evidence: ["Geolocation mismatch — card last used in Bengaluru 2 hrs before Nigeria transaction"],
  },
  {
    id: "INV-2408-004",
    fraudLogId: "FL-2408-004",
    customerId: "C007",
    customerName: "Deepak Gupta",
    transactionId: "TXN-2408-006",
    amount: 2500000,
    assignedInvestigator: "Rajesh Kumar",
    priority: "High",
    status: "Open",
    createdDate: "2026-08-27",
    lastUpdated: "2026-08-27",
    notes: ["Awaiting customer verification call"],
    evidence: ["NRI account — first large RTGS in account history"],
  },
  {
    id: "INV-2407-001",
    fraudLogId: "FL-2407-003",
    customerId: "C002",
    customerName: "Priya Sharma",
    transactionId: "TXN-2407-041",
    amount: 124000,
    assignedInvestigator: "Neha Tiwari",
    priority: "Medium",
    status: "Resolved",
    createdDate: "2026-07-14",
    lastUpdated: "2026-07-18",
    notes: ["Customer confirmed transaction was legitimate — travel purchase", "Marked as false positive"],
    evidence: ["Customer travel itinerary submitted", "Transaction location matches airline booking"],
  },
];

export const chartData = {
  transactionVolume: [
    { date: "Aug 21", transactions: 1102, amount: 18.4 },
    { date: "Aug 22", transactions: 984, amount: 14.2 },
    { date: "Aug 23", transactions: 1234, amount: 21.8 },
    { date: "Aug 24", transactions: 876, amount: 12.5 },
    { date: "Aug 25", transactions: 1456, amount: 26.3 },
    { date: "Aug 26", transactions: 1301, amount: 22.1 },
    { date: "Aug 27", transactions: 1284, amount: 19.7 },
  ],
  fraudTrend: [
    { date: "Aug 21", suspicious: 28, confirmed: 5 },
    { date: "Aug 22", suspicious: 22, confirmed: 3 },
    { date: "Aug 23", suspicious: 41, confirmed: 7 },
    { date: "Aug 24", suspicious: 18, confirmed: 2 },
    { date: "Aug 25", suspicious: 35, confirmed: 6 },
    { date: "Aug 26", suspicious: 31, confirmed: 5 },
    { date: "Aug 27", suspicious: 37, confirmed: 8 },
  ],
  fraudByType: [
    { name: "Card Fraud", value: 34 },
    { name: "UPI Fraud", value: 28 },
    { name: "Account Takeover", value: 18 },
    { name: "Money Laundering", value: 12 },
    { name: "ATM Skimming", value: 8 },
  ],
  fraudByMerchant: [
    { merchant: "E-Commerce", count: 42 },
    { merchant: "Wire Transfer", count: 31 },
    { merchant: "ATM/Cash", count: 18 },
    { merchant: "Travel", count: 14 },
    { merchant: "Gambling", count: 11 },
    { merchant: "Crypto", count: 9 },
  ],
};
