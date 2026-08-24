var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// scripts/test-shim.cjs
var require_test_shim = __commonJS({
  "scripts/test-shim.cjs"(exports2, module2) {
    global.__testState = global.__testState || { passedCount: 0, failedCount: 0, testQueue: [] };
    var currentSuite = "";
    function describe8(name, fn) {
      const prev = currentSuite;
      currentSuite = currentSuite ? currentSuite + " > " + name : name;
      fn();
      currentSuite = prev;
    }
    function it8(name, fn) {
      const fullName = currentSuite + " > " + name;
      global.__testState.testQueue.push({ fullName, fn });
    }
    function expect8(actual) {
      return {
        toBe(expected) {
          if (actual !== expected) {
            throw new Error("Expected " + JSON.stringify(expected) + " but received " + JSON.stringify(actual));
          }
        },
        toEqual(expected) {
          if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error("Expected " + JSON.stringify(expected) + " but received " + JSON.stringify(actual));
          }
        },
        toHaveLength(expected) {
          if (!actual || actual.length !== expected) {
            throw new Error("Expected length " + expected + " but received " + (actual ? actual.length : "undefined"));
          }
        }
      };
    }
    module2.exports = { describe: describe8, it: it8, expect: expect8 };
  }
});

// src/data/dummy/accounts.ts
var DUMMY_ACCOUNTS;
var init_accounts = __esm({
  "src/data/dummy/accounts.ts"() {
    DUMMY_ACCOUNTS = [
      // ── Revenue ───────────────────────────────────────────────────────────────
      {
        id: "ACC-REV-001",
        name: "Sales Revenue",
        type: "revenue",
        subType: "sales"
      },
      {
        id: "ACC-REV-002",
        name: "Service Revenue",
        type: "revenue",
        subType: "services"
      },
      // ── Cost of Goods Sold ────────────────────────────────────────────────────
      {
        id: "ACC-COGS-001",
        name: "Cost of Goods Sold",
        type: "cogs"
      },
      // ── Operating Expenses ────────────────────────────────────────────────────
      {
        id: "ACC-EXP-001",
        name: "Rent Expense",
        type: "expense",
        subType: "operating"
      },
      {
        id: "ACC-EXP-002",
        name: "Salary Expense",
        type: "expense",
        subType: "operating"
      },
      {
        id: "ACC-EXP-003",
        name: "Electricity Expense",
        type: "expense",
        subType: "operating"
      },
      {
        id: "ACC-EXP-004",
        name: "Transportation Expense",
        type: "expense",
        subType: "operating"
      },
      {
        id: "ACC-EXP-005",
        name: "Office Expense",
        type: "expense",
        subType: "operating"
      },
      // ── Assets ────────────────────────────────────────────────────────────────
      {
        id: "ACC-AST-001",
        name: "Cash",
        type: "asset",
        subType: "current"
      },
      {
        id: "ACC-AST-002",
        name: "Bank",
        type: "asset",
        subType: "current"
      },
      {
        id: "ACC-AST-003",
        name: "Accounts Receivable",
        type: "asset",
        subType: "current"
      },
      // ── Liabilities ───────────────────────────────────────────────────────────
      {
        id: "ACC-LIA-001",
        name: "Accounts Payable",
        type: "liability",
        subType: "current"
      }
    ];
  }
});

// src/data/dummy/customers.ts
var DUMMY_CUSTOMERS;
var init_customers = __esm({
  "src/data/dummy/customers.ts"() {
    DUMMY_CUSTOMERS = [
      {
        id: "CUST-001",
        name: "Infosys Limited",
        email: "accounts@infosys.com",
        phone: "+91-80-2852-0261",
        address: "Electronics City, Bangalore, KA 560100"
      },
      {
        id: "CUST-002",
        name: "Tata Consultancy Services",
        email: "finance@tcs.com",
        phone: "+91-22-6778-9595",
        address: "TCS House, Raveline Street, Mumbai, MH 400001"
      },
      {
        id: "CUST-003",
        name: "Wipro Technologies",
        email: "ap@wipro.com",
        phone: "+91-80-2844-0011",
        address: "Doddakannelli, Sarjapur Road, Bangalore, KA 560035"
      },
      {
        id: "CUST-004",
        name: "HCL Technologies",
        email: "billing@hcl.com",
        phone: "+91-120-432-7000",
        address: "A-10/11, Sector 3, Noida, UP 201301"
      },
      {
        id: "CUST-005",
        name: "Reliance Industries",
        email: "procurement@ril.com",
        phone: "+91-22-3555-5000",
        address: "Maker Chambers IV, Nariman Point, Mumbai, MH 400021"
      },
      {
        id: "CUST-006",
        name: "Tech Mahindra",
        email: "accounts@techmahindra.com",
        phone: "+91-20-2542-3000",
        address: "Gateway Building, Apollo Bunder, Mumbai, MH 400001"
      }
    ];
  }
});

// src/data/dummy/vendors.ts
var DUMMY_VENDORS;
var init_vendors = __esm({
  "src/data/dummy/vendors.ts"() {
    DUMMY_VENDORS = [
      {
        id: "VEND-001",
        name: "Amazon Web Services India",
        email: "billing@aws.in",
        phone: "+91-1800-1082-266",
        address: "Brigade Gateway, Malleshwaram, Bangalore, KA 560055"
      },
      {
        id: "VEND-002",
        name: "Microsoft India",
        email: "invoices@microsoft.com",
        phone: "+91-22-6776-6776",
        address: "Signature Building, Gurgaon, HR 122002"
      },
      {
        id: "VEND-003",
        name: "National Real Estate Pvt Ltd",
        email: "leasing@nationalrealestate.in",
        phone: "+91-80-4163-2200",
        address: "Koramangala, Bangalore, KA 560034"
      },
      {
        id: "VEND-004",
        name: "Bluedart Express",
        email: "billing@bluedart.com",
        phone: "+91-22-6160-7070",
        address: "Blue Dart Centre, Marol, Andheri East, Mumbai, MH 400059"
      },
      {
        id: "VEND-005",
        name: "Stationery World Pvt Ltd",
        email: "orders@stationeryworld.in",
        phone: "+91-80-2553-4400",
        address: "Chickpet, Bangalore, KA 560053"
      },
      {
        id: "VEND-006",
        name: "BESCOM (Electricity Board)",
        email: "commercial@bescom.org",
        phone: "+91-80-2222-3777",
        address: "K.R. Circle, Bangalore, KA 560001"
      }
    ];
  }
});

// src/data/dummy/invoices.ts
var DUMMY_INVOICES;
var init_invoices = __esm({
  "src/data/dummy/invoices.ts"() {
    DUMMY_INVOICES = [
      // ── January 2026 ──────────────────────────────────────────────────────────
      {
        id: "INV-001",
        customerId: "CUST-001",
        date: "2026-01-05",
        dueDate: "2026-02-05",
        status: "paid",
        lines: [
          {
            id: "INV-001-L1",
            accountId: "ACC-REV-001",
            description: "Software licences Q1",
            quantity: 50,
            unitPrice: 4e3,
            amount: 2e5
          }
        ],
        totalAmount: 2e5
      },
      {
        id: "INV-002",
        customerId: "CUST-002",
        date: "2026-01-12",
        dueDate: "2026-02-12",
        status: "paid",
        lines: [
          {
            id: "INV-002-L1",
            accountId: "ACC-REV-002",
            description: "Implementation consulting \u2013 Jan",
            quantity: 80,
            unitPrice: 3500,
            amount: 28e4
          }
        ],
        totalAmount: 28e4
      },
      {
        id: "INV-003",
        customerId: "CUST-003",
        date: "2026-01-20",
        dueDate: "2026-02-20",
        status: "paid",
        lines: [
          {
            id: "INV-003-L1",
            accountId: "ACC-REV-001",
            description: "Hardware supply \u2013 batch A",
            quantity: 10,
            unitPrice: 15e3,
            amount: 15e4
          },
          {
            id: "INV-003-L2",
            accountId: "ACC-REV-002",
            description: "Installation services",
            quantity: 20,
            unitPrice: 2500,
            amount: 5e4
          }
        ],
        totalAmount: 2e5
      },
      // ── February 2026 ─────────────────────────────────────────────────────────
      {
        id: "INV-004",
        customerId: "CUST-004",
        date: "2026-02-03",
        dueDate: "2026-03-03",
        status: "paid",
        lines: [
          {
            id: "INV-004-L1",
            accountId: "ACC-REV-002",
            description: "Cloud migration consulting",
            quantity: 100,
            unitPrice: 4200,
            amount: 42e4
          }
        ],
        totalAmount: 42e4
      },
      {
        id: "INV-005",
        customerId: "CUST-005",
        date: "2026-02-18",
        dueDate: "2026-03-18",
        status: "paid",
        lines: [
          {
            id: "INV-005-L1",
            accountId: "ACC-REV-001",
            description: "ERP modules \u2013 Feb",
            quantity: 5,
            unitPrice: 6e4,
            amount: 3e5
          }
        ],
        totalAmount: 3e5
      },
      // ── March 2026 ────────────────────────────────────────────────────────────
      {
        id: "INV-006",
        customerId: "CUST-006",
        date: "2026-03-01",
        dueDate: "2026-03-31",
        status: "paid",
        lines: [
          {
            id: "INV-006-L1",
            accountId: "ACC-REV-002",
            description: "Training services \u2013 Mar",
            quantity: 60,
            unitPrice: 3e3,
            amount: 18e4
          }
        ],
        totalAmount: 18e4
      },
      {
        id: "INV-007",
        customerId: "CUST-001",
        date: "2026-03-15",
        dueDate: "2026-04-15",
        status: "paid",
        lines: [
          {
            id: "INV-007-L1",
            accountId: "ACC-REV-001",
            description: "Annual maintenance contract",
            quantity: 1,
            unitPrice: 35e4,
            amount: 35e4
          }
        ],
        totalAmount: 35e4
      },
      // ── April 2026 ────────────────────────────────────────────────────────────
      {
        id: "INV-008",
        customerId: "CUST-002",
        date: "2026-04-07",
        dueDate: "2026-05-07",
        status: "paid",
        lines: [
          {
            id: "INV-008-L1",
            accountId: "ACC-REV-002",
            description: "Managed services \u2013 Apr",
            quantity: 1,
            unitPrice: 25e4,
            amount: 25e4
          }
        ],
        totalAmount: 25e4
      },
      {
        id: "INV-009",
        customerId: "CUST-003",
        date: "2026-04-22",
        dueDate: "2026-05-22",
        status: "paid",
        lines: [
          {
            id: "INV-009-L1",
            accountId: "ACC-REV-001",
            description: "Hardware supply \u2013 batch B",
            quantity: 8,
            unitPrice: 18e3,
            amount: 144e3
          }
        ],
        totalAmount: 144e3
      },
      // ── May 2026 ──────────────────────────────────────────────────────────────
      {
        id: "INV-010",
        customerId: "CUST-004",
        date: "2026-05-05",
        dueDate: "2026-06-05",
        status: "paid",
        lines: [
          {
            id: "INV-010-L1",
            accountId: "ACC-REV-002",
            description: "DevOps consulting \u2013 May",
            quantity: 90,
            unitPrice: 3800,
            amount: 342e3
          }
        ],
        totalAmount: 342e3
      },
      {
        id: "INV-011",
        customerId: "CUST-005",
        date: "2026-05-20",
        dueDate: "2026-06-20",
        status: "sent",
        lines: [
          {
            id: "INV-011-L1",
            accountId: "ACC-REV-001",
            description: "ERP modules \u2013 May",
            quantity: 3,
            unitPrice: 6e4,
            amount: 18e4
          }
        ],
        totalAmount: 18e4
      },
      // ── June 2026 ─────────────────────────────────────────────────────────────
      {
        id: "INV-012",
        customerId: "CUST-006",
        date: "2026-06-10",
        dueDate: "2026-07-10",
        status: "paid",
        lines: [
          {
            id: "INV-012-L1",
            accountId: "ACC-REV-002",
            description: "Support & maintenance \u2013 Jun",
            quantity: 1,
            unitPrice: 22e4,
            amount: 22e4
          }
        ],
        totalAmount: 22e4
      },
      // ── July 2026 ─────────────────────────────────────────────────────────────
      {
        id: "INV-013",
        customerId: "CUST-001",
        date: "2026-07-08",
        dueDate: "2026-08-08",
        status: "paid",
        lines: [
          {
            id: "INV-013-L1",
            accountId: "ACC-REV-001",
            description: "Software licences Q3",
            quantity: 50,
            unitPrice: 4200,
            amount: 21e4
          }
        ],
        totalAmount: 21e4
      },
      {
        id: "INV-014",
        customerId: "CUST-002",
        date: "2026-07-25",
        dueDate: "2026-08-25",
        status: "sent",
        lines: [
          {
            id: "INV-014-L1",
            accountId: "ACC-REV-002",
            description: "Consulting retainer \u2013 Jul",
            quantity: 1,
            unitPrice: 3e5,
            amount: 3e5
          }
        ],
        totalAmount: 3e5
      },
      // ── August 2026 ───────────────────────────────────────────────────────────
      {
        id: "INV-015",
        customerId: "CUST-003",
        date: "2026-08-01",
        dueDate: "2026-09-01",
        status: "sent",
        lines: [
          {
            id: "INV-015-L1",
            accountId: "ACC-REV-001",
            description: "Hardware supply \u2013 batch C",
            quantity: 12,
            unitPrice: 16500,
            amount: 198e3
          }
        ],
        totalAmount: 198e3
      },
      {
        id: "INV-016",
        customerId: "CUST-004",
        date: "2026-08-15",
        dueDate: "2026-09-15",
        status: "draft",
        lines: [
          {
            id: "INV-016-L1",
            accountId: "ACC-REV-002",
            description: "AI/ML project kick-off",
            quantity: 40,
            unitPrice: 5e3,
            amount: 2e5
          }
        ],
        totalAmount: 2e5
      }
    ];
  }
});

// src/data/dummy/bills.ts
var DUMMY_BILLS;
var init_bills = __esm({
  "src/data/dummy/bills.ts"() {
    DUMMY_BILLS = [
      // ── January 2026 ──────────────────────────────────────────────────────────
      {
        id: "BILL-001",
        vendorId: "VEND-001",
        date: "2026-01-03",
        dueDate: "2026-02-03",
        status: "paid",
        lines: [
          {
            id: "BILL-001-L1",
            accountId: "ACC-COGS-001",
            description: "AWS infrastructure \u2013 Jan",
            quantity: 1,
            unitPrice: 85e3,
            amount: 85e3
          }
        ],
        totalAmount: 85e3
      },
      {
        id: "BILL-002",
        vendorId: "VEND-003",
        date: "2026-01-01",
        dueDate: "2026-01-31",
        status: "paid",
        lines: [
          {
            id: "BILL-002-L1",
            accountId: "ACC-EXP-001",
            description: "Office rent \u2013 Jan 2026",
            quantity: 1,
            unitPrice: 12e4,
            amount: 12e4
          }
        ],
        totalAmount: 12e4
      },
      {
        id: "BILL-003",
        vendorId: "VEND-006",
        date: "2026-01-15",
        dueDate: "2026-01-31",
        status: "paid",
        lines: [
          {
            id: "BILL-003-L1",
            accountId: "ACC-EXP-003",
            description: "Electricity \u2013 Jan 2026",
            quantity: 1,
            unitPrice: 18500,
            amount: 18500
          }
        ],
        totalAmount: 18500
      },
      // ── February 2026 ─────────────────────────────────────────────────────────
      {
        id: "BILL-004",
        vendorId: "VEND-001",
        date: "2026-02-03",
        dueDate: "2026-03-03",
        status: "paid",
        lines: [
          {
            id: "BILL-004-L1",
            accountId: "ACC-COGS-001",
            description: "AWS infrastructure \u2013 Feb",
            quantity: 1,
            unitPrice: 92e3,
            amount: 92e3
          }
        ],
        totalAmount: 92e3
      },
      {
        id: "BILL-005",
        vendorId: "VEND-003",
        date: "2026-02-01",
        dueDate: "2026-02-28",
        status: "paid",
        lines: [
          {
            id: "BILL-005-L1",
            accountId: "ACC-EXP-001",
            description: "Office rent \u2013 Feb 2026",
            quantity: 1,
            unitPrice: 12e4,
            amount: 12e4
          }
        ],
        totalAmount: 12e4
      },
      // ── March 2026 ────────────────────────────────────────────────────────────
      {
        id: "BILL-006",
        vendorId: "VEND-002",
        date: "2026-03-05",
        dueDate: "2026-04-05",
        status: "paid",
        lines: [
          {
            id: "BILL-006-L1",
            accountId: "ACC-COGS-001",
            description: "Microsoft Azure \u2013 Mar",
            quantity: 1,
            unitPrice: 45e3,
            amount: 45e3
          }
        ],
        totalAmount: 45e3
      },
      {
        id: "BILL-007",
        vendorId: "VEND-004",
        date: "2026-03-10",
        dueDate: "2026-04-10",
        status: "paid",
        lines: [
          {
            id: "BILL-007-L1",
            accountId: "ACC-EXP-004",
            description: "Courier & logistics \u2013 Q1",
            quantity: 1,
            unitPrice: 32e3,
            amount: 32e3
          }
        ],
        totalAmount: 32e3
      },
      // ── April 2026 ────────────────────────────────────────────────────────────
      {
        id: "BILL-008",
        vendorId: "VEND-001",
        date: "2026-04-03",
        dueDate: "2026-05-03",
        status: "paid",
        lines: [
          {
            id: "BILL-008-L1",
            accountId: "ACC-COGS-001",
            description: "AWS infrastructure \u2013 Apr",
            quantity: 1,
            unitPrice: 11e4,
            amount: 11e4
          }
        ],
        totalAmount: 11e4
      },
      {
        id: "BILL-009",
        vendorId: "VEND-005",
        date: "2026-04-15",
        dueDate: "2026-05-15",
        status: "paid",
        lines: [
          {
            id: "BILL-009-L1",
            accountId: "ACC-EXP-005",
            description: "Office stationery \u2013 Apr",
            quantity: 1,
            unitPrice: 15e3,
            amount: 15e3
          }
        ],
        totalAmount: 15e3
      },
      // ── May 2026 ──────────────────────────────────────────────────────────────
      {
        id: "BILL-010",
        vendorId: "VEND-001",
        date: "2026-05-03",
        dueDate: "2026-06-03",
        status: "paid",
        lines: [
          {
            id: "BILL-010-L1",
            accountId: "ACC-COGS-001",
            description: "AWS infrastructure \u2013 May",
            quantity: 1,
            unitPrice: 125e3,
            amount: 125e3
          }
        ],
        totalAmount: 125e3
      },
      // ── June 2026 ─────────────────────────────────────────────────────────────
      {
        id: "BILL-011",
        vendorId: "VEND-003",
        date: "2026-06-01",
        dueDate: "2026-06-30",
        status: "paid",
        lines: [
          {
            id: "BILL-011-L1",
            accountId: "ACC-EXP-001",
            description: "Office rent \u2013 Jun 2026",
            quantity: 1,
            unitPrice: 12e4,
            amount: 12e4
          }
        ],
        totalAmount: 12e4
      },
      // ── July 2026 ─────────────────────────────────────────────────────────────
      {
        id: "BILL-012",
        vendorId: "VEND-002",
        date: "2026-07-05",
        dueDate: "2026-08-05",
        status: "received",
        lines: [
          {
            id: "BILL-012-L1",
            accountId: "ACC-COGS-001",
            description: "Microsoft Azure + M365 \u2013 Jul",
            quantity: 1,
            unitPrice: 68e3,
            amount: 68e3
          }
        ],
        totalAmount: 68e3
      }
    ];
  }
});

// src/data/dummy/payments.ts
var init_payments = __esm({
  "src/data/dummy/payments.ts"() {
  }
});

// src/data/dummy/transactions.ts
function buildAccountMap(accounts) {
  return new Map(accounts.map((a) => [a.id, a]));
}
function invoicesToTransactions(invoices, accountMap2) {
  const transactions = [];
  for (const invoice of invoices) {
    if (invoice.status === "void") continue;
    for (const line of invoice.lines) {
      const account = accountMap2.get(line.accountId);
      if (!account) continue;
      transactions.push({
        id: `TXN-INV-${invoice.id}-${line.id}`,
        date: invoice.date,
        accountId: line.accountId,
        accountType: account.type,
        description: `${line.description} (${invoice.id})`,
        amount: line.amount,
        type: "credit",
        // Revenue — money earned
        sourceType: "invoice",
        sourceId: invoice.id
      });
    }
  }
  return transactions;
}
function billsToTransactions(bills, accountMap2) {
  const transactions = [];
  for (const bill of bills) {
    if (bill.status === "void") continue;
    for (const line of bill.lines) {
      const account = accountMap2.get(line.accountId);
      if (!account) continue;
      transactions.push({
        id: `TXN-BILL-${bill.id}-${line.id}`,
        date: bill.date,
        accountId: line.accountId,
        accountType: account.type,
        description: `${line.description} (${bill.id})`,
        amount: line.amount,
        type: "debit",
        // Expense/COGS — money spent
        sourceType: "bill",
        sourceId: bill.id
      });
    }
  }
  return transactions;
}
var accountMap, DUMMY_TRANSACTIONS;
var init_transactions = __esm({
  "src/data/dummy/transactions.ts"() {
    init_accounts();
    init_invoices();
    init_bills();
    accountMap = buildAccountMap(DUMMY_ACCOUNTS);
    DUMMY_TRANSACTIONS = [
      ...invoicesToTransactions(DUMMY_INVOICES, accountMap),
      ...billsToTransactions(DUMMY_BILLS, accountMap)
    ].sort((a, b) => a.date.localeCompare(b.date));
  }
});

// src/data/dummy/index.ts
var init_dummy = __esm({
  "src/data/dummy/index.ts"() {
    init_accounts();
    init_customers();
    init_vendors();
    init_invoices();
    init_bills();
    init_payments();
    init_transactions();
  }
});

// src/features/reports/utils/dateFilters.ts
function isInDateRange(date, fromDate, toDate) {
  return date >= fromDate && date <= toDate;
}
function filterByDateRange(items, fromDate, toDate) {
  return items.filter((item) => isInDateRange(item.date, fromDate, toDate));
}
var init_dateFilters = __esm({
  "src/features/reports/utils/dateFilters.ts"() {
  }
});

// src/features/reports/providers/dummy.provider.ts
var DummyDataProvider, dummyDataProvider;
var init_dummy_provider = __esm({
  "src/features/reports/providers/dummy.provider.ts"() {
    init_dummy();
    init_dateFilters();
    DummyDataProvider = class {
      /**
       * Retrieves transactions, optionally filtered by date range or accounts.
       */
      getTransactions(filter) {
        let results = DUMMY_TRANSACTIONS;
        if (filter?.fromDate && filter?.toDate) {
          results = filterByDateRange(results, filter.fromDate, filter.toDate);
        }
        if (filter?.accountIds && filter.accountIds.length > 0) {
          const idSet = new Set(filter.accountIds);
          results = results.filter((txn) => idSet.has(txn.accountId));
        }
        return results;
      }
      getAccounts() {
        return DUMMY_ACCOUNTS;
      }
      getInvoices() {
        return DUMMY_INVOICES;
      }
      getBills() {
        return DUMMY_BILLS;
      }
      getCustomers() {
        return DUMMY_CUSTOMERS;
      }
      getVendors() {
        return DUMMY_VENDORS;
      }
    };
    dummyDataProvider = new DummyDataProvider();
  }
});

// src/features/reports/services/profitAndLoss.service.ts
function aggregateByAccount(transactions) {
  const accountTotals = /* @__PURE__ */ new Map();
  for (const txn of transactions) {
    const existing = accountTotals.get(txn.accountId);
    if (existing) {
      existing.amount += txn.amount;
    } else {
      accountTotals.set(txn.accountId, {
        accountId: txn.accountId,
        accountName: txn.accountId,
        amount: txn.amount
      });
    }
  }
  return Array.from(accountTotals.values());
}
function generateProfitAndLoss(transactions, fromDate, toDate, periodLabel = `${fromDate} \u2013 ${toDate}`) {
  const filtered = filterByDateRange(transactions, fromDate, toDate);
  const revenueTxns = filtered.filter(
    (txn) => txn.accountType === "revenue" && txn.type === "credit"
  );
  const revenueLines = aggregateByAccount(revenueTxns);
  const totalRevenue = revenueLines.reduce((sum, line) => sum + line.amount, 0);
  const cogsTxns = filtered.filter(
    (txn) => txn.accountType === "cogs" && txn.type === "debit"
  );
  const cogsLines = aggregateByAccount(cogsTxns);
  const totalCogs = cogsLines.reduce((sum, line) => sum + line.amount, 0);
  const grossProfit = totalRevenue - totalCogs;
  const expenseTxns = filtered.filter(
    (txn) => txn.accountType === "expense" && txn.type === "debit"
  );
  const expenseLines = aggregateByAccount(expenseTxns);
  const totalExpenses = expenseLines.reduce((sum, line) => sum + line.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  return {
    reportType: "PROFIT_AND_LOSS",
    title: "Profit & Loss",
    periodLabel,
    fromDate,
    toDate,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    revenueLines,
    totalRevenue,
    cogsLines,
    totalCogs,
    grossProfit,
    expenseLines,
    totalExpenses,
    netProfit
  };
}
var ProfitAndLossService, profitAndLossService;
var init_profitAndLoss_service = __esm({
  "src/features/reports/services/profitAndLoss.service.ts"() {
    init_dateFilters();
    ProfitAndLossService = class {
      async generate(request, provider) {
        const transactions = await provider.getTransactions({
          fromDate: request.fromDate,
          toDate: request.toDate
        });
        const periodLabel = request.periodLabel || `${request.fromDate} \u2013 ${request.toDate}`;
        return generateProfitAndLoss(transactions, request.fromDate, request.toDate, periodLabel);
      }
      /** Synchronous generation for in-memory / local providers */
      generateSync(request, provider) {
        const transactions = provider.getTransactions({
          fromDate: request.fromDate,
          toDate: request.toDate
        });
        const periodLabel = request.periodLabel || `${request.fromDate} \u2013 ${request.toDate}`;
        return generateProfitAndLoss(transactions, request.fromDate, request.toDate, periodLabel);
      }
    };
    profitAndLossService = new ProfitAndLossService();
  }
});

// src/features/reports/providers/__tests__/dummy.provider.test.ts
var dummy_provider_test_exports = {};
var import_vitest;
var init_dummy_provider_test = __esm({
  "src/features/reports/providers/__tests__/dummy.provider.test.ts"() {
    import_vitest = __toESM(require_test_shim(), 1);
    init_dummy_provider();
    init_profitAndLoss_service();
    (0, import_vitest.describe)("DummyDataProvider", () => {
      const provider = new DummyDataProvider();
      (0, import_vitest.it)("retrieves all transactions when no filter is provided", () => {
        const transactions = provider.getTransactions();
        (0, import_vitest.expect)(transactions.length).toBe(29);
      });
      (0, import_vitest.it)("filters transactions by date range", () => {
        const janTxns = provider.getTransactions({
          fromDate: "2026-01-01",
          toDate: "2026-01-31"
        });
        (0, import_vitest.expect)(janTxns.length).toBe(7);
        janTxns.forEach((t) => {
          (0, import_vitest.expect)(t.date >= "2026-01-01" && t.date <= "2026-01-31").toBe(true);
        });
      });
      (0, import_vitest.it)("retrieves chart of accounts", () => {
        const accounts = provider.getAccounts();
        (0, import_vitest.expect)(accounts.length).toBe(12);
      });
      (0, import_vitest.it)("retrieves invoices and bills", () => {
        (0, import_vitest.expect)(provider.getInvoices().length).toBe(16);
        (0, import_vitest.expect)(provider.getBills().length).toBe(12);
      });
      (0, import_vitest.it)("retrieves customers and vendors", () => {
        (0, import_vitest.expect)(provider.getCustomers().length).toBe(6);
        (0, import_vitest.expect)(provider.getVendors().length).toBe(6);
      });
    });
    (0, import_vitest.describe)("ReportService with Custom Mock DataProvider (Demonstrating Swapability)", () => {
      (0, import_vitest.it)("generates P&L using a mock DataProvider without changing reporting logic", async () => {
        const mockTransactions = [
          {
            id: "MOCK-REV",
            date: "2026-05-10",
            accountId: "ACC-SALES",
            accountType: "revenue",
            description: "Direct sales",
            amount: 1e5,
            type: "credit"
          },
          {
            id: "MOCK-COGS",
            date: "2026-05-12",
            accountId: "ACC-COGS",
            accountType: "cogs",
            description: "Materials",
            amount: 4e4,
            type: "debit"
          },
          {
            id: "MOCK-EXP",
            date: "2026-05-15",
            accountId: "ACC-EXP",
            accountType: "expense",
            description: "Rent",
            amount: 2e4,
            type: "debit"
          }
        ];
        const customProvider = {
          getTransactions: (filter) => {
            if (filter?.fromDate && filter?.toDate) {
              return mockTransactions.filter(
                (t) => t.date >= filter.fromDate && t.date <= filter.toDate
              );
            }
            return mockTransactions;
          }
        };
        const report = await profitAndLossService.generate(
          {
            fromDate: "2026-05-01",
            toDate: "2026-05-31",
            periodLabel: "May 2026"
          },
          customProvider
        );
        (0, import_vitest.expect)(report.totalRevenue).toBe(1e5);
        (0, import_vitest.expect)(report.totalCogs).toBe(4e4);
        (0, import_vitest.expect)(report.grossProfit).toBe(6e4);
        (0, import_vitest.expect)(report.totalExpenses).toBe(2e4);
        (0, import_vitest.expect)(report.netProfit).toBe(4e4);
        (0, import_vitest.expect)(report.reportType).toBe("PROFIT_AND_LOSS");
      });
    });
  }
});

// src/features/reports/services/agingReport.service.ts
function calculateDaysPastDue(dueDate, asOfDate) {
  const due = (/* @__PURE__ */ new Date(dueDate + "T00:00:00")).getTime();
  const asOf = (/* @__PURE__ */ new Date(asOfDate + "T00:00:00")).getTime();
  return Math.floor((asOf - due) / (1e3 * 60 * 60 * 24));
}
function createEmptyBucket() {
  return {
    current: 0,
    days1_30: 0,
    days31_60: 0,
    days61_90: 0,
    over90: 0,
    total: 0
  };
}
function placeInBucket(bucket, amount, daysPastDue) {
  bucket.total += amount;
  if (daysPastDue <= 0) {
    bucket.current += amount;
  } else if (daysPastDue <= 30) {
    bucket.days1_30 += amount;
  } else if (daysPastDue <= 60) {
    bucket.days31_60 += amount;
  } else if (daysPastDue <= 90) {
    bucket.days61_90 += amount;
  } else {
    bucket.over90 += amount;
  }
}
function generateReceivablesAging(invoices, customers, asOfDate, periodLabel = `AR Aging as of ${asOfDate}`) {
  const customerMap = new Map(customers.map((c) => [c.id, c.name]));
  const outstandingInvoices = invoices.filter(
    (inv) => inv.date <= asOfDate && (inv.status === "sent" || inv.status === "overdue")
  );
  const summary = createEmptyBucket();
  const entityRowsMap = /* @__PURE__ */ new Map();
  for (const inv of outstandingInvoices) {
    const daysPastDue = calculateDaysPastDue(inv.dueDate, asOfDate);
    placeInBucket(summary, inv.totalAmount, daysPastDue);
    const entry = entityRowsMap.get(inv.customerId) || { bucket: createEmptyBucket(), count: 0 };
    entry.count += 1;
    placeInBucket(entry.bucket, inv.totalAmount, daysPastDue);
    entityRowsMap.set(inv.customerId, entry);
  }
  const rows = [];
  entityRowsMap.forEach((entry, customerId) => {
    rows.push({
      entityId: customerId,
      entityName: customerMap.get(customerId) || customerId,
      documentCount: entry.count,
      ...entry.bucket
    });
  });
  rows.sort((a, b) => b.total - a.total);
  return {
    reportType: "AR_AGING",
    title: "Accounts Receivable (AR) Aging Summary",
    agingType: "RECEIVABLES",
    periodLabel,
    fromDate: "1970-01-01",
    toDate: asOfDate,
    asOfDate,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    totalOutstanding: summary.total,
    summary,
    rows
  };
}
function generatePayablesAging(bills, vendors, asOfDate, periodLabel = `AP Aging as of ${asOfDate}`) {
  const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));
  const outstandingBills = bills.filter(
    (b) => b.date <= asOfDate && (b.status === "received" || b.status === "overdue")
  );
  const summary = createEmptyBucket();
  const entityRowsMap = /* @__PURE__ */ new Map();
  for (const bill of outstandingBills) {
    const daysPastDue = calculateDaysPastDue(bill.dueDate, asOfDate);
    placeInBucket(summary, bill.totalAmount, daysPastDue);
    const entry = entityRowsMap.get(bill.vendorId) || { bucket: createEmptyBucket(), count: 0 };
    entry.count += 1;
    placeInBucket(entry.bucket, bill.totalAmount, daysPastDue);
    entityRowsMap.set(bill.vendorId, entry);
  }
  const rows = [];
  entityRowsMap.forEach((entry, vendorId) => {
    rows.push({
      entityId: vendorId,
      entityName: vendorMap.get(vendorId) || vendorId,
      documentCount: entry.count,
      ...entry.bucket
    });
  });
  rows.sort((a, b) => b.total - a.total);
  return {
    reportType: "AP_AGING",
    title: "Accounts Payable (AP) Aging Summary",
    agingType: "PAYABLES",
    periodLabel,
    fromDate: "1970-01-01",
    toDate: asOfDate,
    asOfDate,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    totalOutstanding: summary.total,
    summary,
    rows
  };
}
var AgingReportService, agingReportService;
var init_agingReport_service = __esm({
  "src/features/reports/services/agingReport.service.ts"() {
    AgingReportService = class {
      async generate(request, provider) {
        if (request.agingType === "RECEIVABLES") {
          const invoices = provider.getInvoices ? await provider.getInvoices() : [];
          const customers = provider.getCustomers ? await provider.getCustomers() : [];
          return generateReceivablesAging(invoices, customers, request.asOfDate, request.periodLabel);
        } else {
          const bills = provider.getBills ? await provider.getBills() : [];
          const vendors = provider.getVendors ? await provider.getVendors() : [];
          return generatePayablesAging(bills, vendors, request.asOfDate, request.periodLabel);
        }
      }
      generateSync(request, provider) {
        if (request.agingType === "RECEIVABLES") {
          const invoices = provider.getInvoices ? provider.getInvoices() : [];
          const customers = provider.getCustomers ? provider.getCustomers() : [];
          return generateReceivablesAging(invoices, customers, request.asOfDate, request.periodLabel);
        } else {
          const bills = provider.getBills ? provider.getBills() : [];
          const vendors = provider.getVendors ? provider.getVendors() : [];
          return generatePayablesAging(bills, vendors, request.asOfDate, request.periodLabel);
        }
      }
    };
    agingReportService = new AgingReportService();
  }
});

// src/features/reports/services/__tests__/agingReport.service.test.ts
var agingReport_service_test_exports = {};
var import_vitest2;
var init_agingReport_service_test = __esm({
  "src/features/reports/services/__tests__/agingReport.service.test.ts"() {
    import_vitest2 = __toESM(require_test_shim(), 1);
    init_agingReport_service();
    (0, import_vitest2.describe)("AgingReportService", () => {
      const customers = [
        { id: "CUST-1", name: "Client A" },
        { id: "CUST-2", name: "Client B" }
      ];
      const vendors = [
        { id: "VEND-1", name: "Supplier X" }
      ];
      const invoices = [
        {
          id: "INV-1",
          customerId: "CUST-1",
          date: "2026-06-01",
          dueDate: "2026-07-01",
          // due in future relative to 2026-06-30 -> Current
          status: "sent",
          lines: [],
          totalAmount: 1e4
        },
        {
          id: "INV-2",
          customerId: "CUST-1",
          date: "2026-05-15",
          dueDate: "2026-06-15",
          // 15 days past due -> days1_30
          status: "sent",
          lines: [],
          totalAmount: 2e4
        },
        {
          id: "INV-3",
          customerId: "CUST-2",
          date: "2026-04-01",
          dueDate: "2026-05-01",
          // 60 days past due -> days31_60
          status: "sent",
          lines: [],
          totalAmount: 3e4
        },
        {
          id: "INV-4",
          customerId: "CUST-2",
          date: "2026-01-01",
          dueDate: "2026-02-01",
          // 149 days past due -> over90
          status: "sent",
          lines: [],
          totalAmount: 4e4
        }
      ];
      const bills = [
        {
          id: "BILL-1",
          vendorId: "VEND-1",
          date: "2026-05-10",
          dueDate: "2026-06-10",
          // 20 days past due -> days1_30
          status: "received",
          lines: [],
          totalAmount: 15e3
        }
      ];
      (0, import_vitest2.it)("correctly categorizes receivables into aging buckets", () => {
        const report = generateReceivablesAging(invoices, customers, "2026-06-30");
        (0, import_vitest2.expect)(report.reportType).toBe("AR_AGING");
        (0, import_vitest2.expect)(report.totalOutstanding).toBe(1e5);
        (0, import_vitest2.expect)(report.summary.current).toBe(1e4);
        (0, import_vitest2.expect)(report.summary.days1_30).toBe(2e4);
        (0, import_vitest2.expect)(report.summary.days31_60).toBe(3e4);
        (0, import_vitest2.expect)(report.summary.days61_90).toBe(0);
        (0, import_vitest2.expect)(report.summary.over90).toBe(4e4);
        (0, import_vitest2.expect)(report.rows.length).toBe(2);
      });
      (0, import_vitest2.it)("correctly categorizes payables into aging buckets", () => {
        const report = generatePayablesAging(bills, vendors, "2026-06-30");
        (0, import_vitest2.expect)(report.reportType).toBe("AP_AGING");
        (0, import_vitest2.expect)(report.totalOutstanding).toBe(15e3);
        (0, import_vitest2.expect)(report.summary.days1_30).toBe(15e3);
        (0, import_vitest2.expect)(report.rows.length).toBe(1);
      });
    });
  }
});

// src/features/reports/services/balanceSheet.service.ts
function generateBalanceSheet(transactions, invoices, bills, asOfDate, periodLabel = `As of ${asOfDate}`) {
  const effectiveInvoices = invoices.filter((inv) => inv.date <= asOfDate && inv.status !== "void");
  const accountsReceivableAmount = effectiveInvoices.filter((inv) => inv.status === "sent" || inv.status === "overdue").reduce((sum, inv) => sum + inv.totalAmount, 0);
  const effectiveBills = bills.filter((b) => b.date <= asOfDate && b.status !== "void");
  const accountsPayableAmount = effectiveBills.filter((b) => b.status === "received" || b.status === "overdue").reduce((sum, b) => sum + b.totalAmount, 0);
  const pnl = generateProfitAndLoss(transactions, "1970-01-01", asOfDate, periodLabel);
  const retainedEarnings = pnl.netProfit;
  const paidRevenue = effectiveInvoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidBills = effectiveBills.filter((b) => b.status === "paid").reduce((sum, b) => sum + b.totalAmount, 0);
  const totalCashAndBank = paidRevenue - paidBills;
  const cashAmount = Math.round(totalCashAndBank * 0.2);
  const bankAmount = totalCashAndBank - cashAmount;
  const assetItems = [
    { accountId: "ACC-AST-001", accountName: "Cash on Hand", amount: cashAmount },
    { accountId: "ACC-AST-002", accountName: "Operating Bank Account", amount: bankAmount },
    { accountId: "ACC-AST-003", accountName: "Accounts Receivable (AR)", amount: accountsReceivableAmount }
  ];
  const totalAssets = assetItems.reduce((sum, item) => sum + item.amount, 0);
  const currentAssets = {
    title: "Current Assets",
    items: assetItems,
    total: totalAssets
  };
  const liabilityItems = [
    { accountId: "ACC-LIA-001", accountName: "Accounts Payable (AP)", amount: accountsPayableAmount }
  ];
  const totalLiabilities = liabilityItems.reduce((sum, item) => sum + item.amount, 0);
  const currentLiabilities = {
    title: "Current Liabilities",
    items: liabilityItems,
    total: totalLiabilities
  };
  const equityItems = [
    { accountId: "ACC-EQU-001", accountName: "Retained Earnings (from P&L)", amount: retainedEarnings }
  ];
  const totalEquity = retainedEarnings;
  const equitySection = {
    title: "Equity",
    items: equityItems,
    total: totalEquity
  };
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1;
  return {
    reportType: "BALANCE_SHEET",
    title: "Balance Sheet",
    periodLabel,
    fromDate: "1970-01-01",
    toDate: asOfDate,
    asOfDate,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    currentAssets,
    totalAssets,
    currentLiabilities,
    totalLiabilities,
    equitySection,
    retainedEarnings,
    totalEquity,
    totalLiabilitiesAndEquity,
    isBalanced
  };
}
var BalanceSheetService, balanceSheetService;
var init_balanceSheet_service = __esm({
  "src/features/reports/services/balanceSheet.service.ts"() {
    init_profitAndLoss_service();
    BalanceSheetService = class {
      async generate(request, provider) {
        const transactions = await provider.getTransactions();
        const invoices = provider.getInvoices ? await provider.getInvoices() : [];
        const bills = provider.getBills ? await provider.getBills() : [];
        const periodLabel = request.periodLabel || `As of ${request.toDate}`;
        return generateBalanceSheet(transactions, invoices, bills, request.toDate, periodLabel);
      }
      generateSync(request, provider) {
        const transactions = provider.getTransactions();
        const invoices = provider.getInvoices ? provider.getInvoices() : [];
        const bills = provider.getBills ? provider.getBills() : [];
        const periodLabel = request.periodLabel || `As of ${request.toDate}`;
        return generateBalanceSheet(transactions, invoices, bills, request.toDate, periodLabel);
      }
    };
    balanceSheetService = new BalanceSheetService();
  }
});

// src/features/reports/services/__tests__/balanceSheet.service.test.ts
var balanceSheet_service_test_exports = {};
var import_vitest3;
var init_balanceSheet_service_test = __esm({
  "src/features/reports/services/__tests__/balanceSheet.service.test.ts"() {
    import_vitest3 = __toESM(require_test_shim(), 1);
    init_balanceSheet_service();
    (0, import_vitest3.describe)("BalanceSheetService", () => {
      const invoices = [
        {
          id: "INV-1",
          customerId: "CUST-1",
          date: "2026-01-10",
          dueDate: "2026-02-10",
          status: "paid",
          lines: [{ id: "L1", accountId: "ACC-REV-001", description: "Consulting", quantity: 1, unitPrice: 1e5, amount: 1e5 }],
          totalAmount: 1e5
        },
        {
          id: "INV-2",
          customerId: "CUST-2",
          date: "2026-01-20",
          dueDate: "2026-02-20",
          status: "sent",
          // unpaid -> AR
          lines: [{ id: "L2", accountId: "ACC-REV-001", description: "Support", quantity: 1, unitPrice: 5e4, amount: 5e4 }],
          totalAmount: 5e4
        }
      ];
      const bills = [
        {
          id: "BILL-1",
          vendorId: "VEND-1",
          date: "2026-01-05",
          dueDate: "2026-02-05",
          status: "paid",
          lines: [{ id: "BL1", accountId: "ACC-EXP-001", description: "Rent", quantity: 1, unitPrice: 2e4, amount: 2e4 }],
          totalAmount: 2e4
        },
        {
          id: "BILL-2",
          vendorId: "VEND-2",
          date: "2026-01-15",
          dueDate: "2026-02-15",
          status: "received",
          // unpaid -> AP
          lines: [{ id: "BL2", accountId: "ACC-EXP-001", description: "Electricity", quantity: 1, unitPrice: 1e4, amount: 1e4 }],
          totalAmount: 1e4
        }
      ];
      const transactions = [
        { id: "T-1", date: "2026-01-10", accountId: "ACC-REV-001", accountType: "revenue", description: "Inv 1", amount: 1e5, type: "credit" },
        { id: "T-2", date: "2026-01-20", accountId: "ACC-REV-001", accountType: "revenue", description: "Inv 2", amount: 5e4, type: "credit" },
        { id: "T-3", date: "2026-01-05", accountId: "ACC-EXP-001", accountType: "expense", description: "Bill 1", amount: 2e4, type: "debit" },
        { id: "T-4", date: "2026-01-15", accountId: "ACC-EXP-001", accountType: "expense", description: "Bill 2", amount: 1e4, type: "debit" }
      ];
      (0, import_vitest3.it)("calculates balanced balance sheet (Assets = Liabilities + Equity)", () => {
        const report = generateBalanceSheet(transactions, invoices, bills, "2026-01-31");
        (0, import_vitest3.expect)(report.reportType).toBe("BALANCE_SHEET");
        const arItem = report.currentAssets.items.find((i) => i.accountId === "ACC-AST-003");
        (0, import_vitest3.expect)(arItem?.amount).toBe(5e4);
        const apItem = report.currentLiabilities.items.find((i) => i.accountId === "ACC-LIA-001");
        (0, import_vitest3.expect)(apItem?.amount).toBe(1e4);
        (0, import_vitest3.expect)(report.retainedEarnings).toBe(12e4);
        (0, import_vitest3.expect)(report.totalAssets).toBe(13e4);
        (0, import_vitest3.expect)(report.totalLiabilitiesAndEquity).toBe(13e4);
        (0, import_vitest3.expect)(report.isBalanced).toBe(true);
      });
    });
  }
});

// src/features/reports/services/expenseReport.service.ts
function generateExpenseReport(bills, vendors, accounts, fromDate, toDate, periodLabel = `${fromDate} \u2013 ${toDate}`) {
  const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));
  const accountMap2 = new Map(accounts.map((a) => [a.id, a]));
  const periodBills = bills.filter(
    (b) => b.date >= fromDate && b.date <= toDate && b.status !== "void"
  );
  const totalExpenses = periodBills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalBills = periodBills.length;
  const paidExpenses = periodBills.filter((b) => b.status === "paid").reduce((sum, b) => sum + b.totalAmount, 0);
  const unpaidExpenses = totalExpenses - paidExpenses;
  let totalCOGS = 0;
  let totalOperatingExpenses = 0;
  const vendorTotals = /* @__PURE__ */ new Map();
  for (const bill of periodBills) {
    const existing = vendorTotals.get(bill.vendorId) || { count: 0, total: 0, paid: 0 };
    existing.count += 1;
    existing.total += bill.totalAmount;
    if (bill.status === "paid") {
      existing.paid += bill.totalAmount;
    }
    vendorTotals.set(bill.vendorId, existing);
  }
  const byVendor = [];
  vendorTotals.forEach((val, vendorId) => {
    byVendor.push({
      vendorId,
      vendorName: vendorMap.get(vendorId) || vendorId,
      billCount: val.count,
      totalAmount: val.total,
      paidAmount: val.paid,
      unpaidAmount: val.total - val.paid,
      percentageOfTotal: totalExpenses > 0 ? Number((val.total / totalExpenses * 100).toFixed(1)) : 0
    });
  });
  byVendor.sort((a, b) => b.totalAmount - a.totalAmount);
  const categoryTotals = /* @__PURE__ */ new Map();
  for (const bill of periodBills) {
    for (const line of bill.lines) {
      const acc = accountMap2.get(line.accountId);
      if (acc?.type === "cogs") {
        totalCOGS += line.amount;
      } else {
        totalOperatingExpenses += line.amount;
      }
      const existing = categoryTotals.get(line.accountId) || { total: 0 };
      existing.total += line.amount;
      categoryTotals.set(line.accountId, existing);
    }
  }
  const byCategory = [];
  categoryTotals.forEach((val, accountId) => {
    const acc = accountMap2.get(accountId);
    byCategory.push({
      accountId,
      accountName: acc?.name || accountId,
      accountType: acc?.type || "expense",
      totalAmount: val.total,
      percentageOfTotal: totalExpenses > 0 ? Number((val.total / totalExpenses * 100).toFixed(1)) : 0
    });
  });
  byCategory.sort((a, b) => b.totalAmount - a.totalAmount);
  return {
    reportType: "EXPENSE_REPORT",
    title: "Expenses Summary Report",
    periodLabel,
    fromDate,
    toDate,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    totalExpenses,
    totalCOGS,
    totalOperatingExpenses,
    totalBills,
    paidExpenses,
    unpaidExpenses,
    byVendor,
    byCategory
  };
}
var ExpenseReportService, expenseReportService;
var init_expenseReport_service = __esm({
  "src/features/reports/services/expenseReport.service.ts"() {
    ExpenseReportService = class {
      async generate(request, provider) {
        const bills = provider.getBills ? await provider.getBills() : [];
        const vendors = provider.getVendors ? await provider.getVendors() : [];
        const accounts = provider.getAccounts ? await provider.getAccounts() : [];
        const periodLabel = request.periodLabel || `${request.fromDate} \u2013 ${request.toDate}`;
        return generateExpenseReport(bills, vendors, accounts, request.fromDate, request.toDate, periodLabel);
      }
      generateSync(request, provider) {
        const bills = provider.getBills ? provider.getBills() : [];
        const vendors = provider.getVendors ? provider.getVendors() : [];
        const accounts = provider.getAccounts ? provider.getAccounts() : [];
        const periodLabel = request.periodLabel || `${request.fromDate} \u2013 ${request.toDate}`;
        return generateExpenseReport(bills, vendors, accounts, request.fromDate, request.toDate, periodLabel);
      }
    };
    expenseReportService = new ExpenseReportService();
  }
});

// src/features/reports/services/__tests__/expenseReport.service.test.ts
var expenseReport_service_test_exports = {};
var import_vitest4, testVendors, testAccounts, testBills;
var init_expenseReport_service_test = __esm({
  "src/features/reports/services/__tests__/expenseReport.service.test.ts"() {
    import_vitest4 = __toESM(require_test_shim(), 1);
    init_expenseReport_service();
    testVendors = [
      { id: "VEND-1", name: "Cloud Provider" },
      { id: "VEND-2", name: "Landlord Corp" }
    ];
    testAccounts = [
      { id: "ACC-COGS-001", name: "Hosting", type: "cogs" },
      { id: "ACC-EXP-001", name: "Rent", type: "expense" }
    ];
    testBills = [
      {
        id: "B-1",
        vendorId: "VEND-1",
        date: "2026-04-05",
        dueDate: "2026-05-05",
        status: "paid",
        lines: [{ id: "BL-1", accountId: "ACC-COGS-001", description: "Servers", quantity: 1, unitPrice: 3e4, amount: 3e4 }],
        totalAmount: 3e4
      },
      {
        id: "B-2",
        vendorId: "VEND-2",
        date: "2026-04-10",
        dueDate: "2026-05-10",
        status: "received",
        lines: [{ id: "BL-2", accountId: "ACC-EXP-001", description: "Rent Apr", quantity: 1, unitPrice: 5e4, amount: 5e4 }],
        totalAmount: 5e4
      }
    ];
    (0, import_vitest4.describe)("ExpenseReportService", () => {
      (0, import_vitest4.it)("aggregates expenses by vendor, category, and separates COGS vs OPEX", () => {
        const report = generateExpenseReport(testBills, testVendors, testAccounts, "2026-04-01", "2026-04-30", "Apr 2026");
        (0, import_vitest4.expect)(report.reportType).toBe("EXPENSE_REPORT");
        (0, import_vitest4.expect)(report.totalExpenses).toBe(8e4);
        (0, import_vitest4.expect)(report.totalCOGS).toBe(3e4);
        (0, import_vitest4.expect)(report.totalOperatingExpenses).toBe(5e4);
        (0, import_vitest4.expect)(report.paidExpenses).toBe(3e4);
        (0, import_vitest4.expect)(report.unpaidExpenses).toBe(5e4);
        (0, import_vitest4.expect)(report.byVendor.length).toBe(2);
        (0, import_vitest4.expect)(report.byVendor[0].vendorName).toBe("Landlord Corp");
        (0, import_vitest4.expect)(report.byVendor[0].totalAmount).toBe(5e4);
        (0, import_vitest4.expect)(report.byCategory.length).toBe(2);
        const rentCategory = report.byCategory.find((c) => c.accountId === "ACC-EXP-001");
        (0, import_vitest4.expect)(rentCategory?.totalAmount).toBe(5e4);
      });
    });
  }
});

// src/features/reports/services/generalLedger.service.ts
function generateGeneralLedger(transactions, accounts, fromDate, toDate, periodLabel = `${fromDate} \u2013 ${toDate}`) {
  const accountMap2 = new Map(accounts.map((a) => [a.id, a]));
  const openingTxns = transactions.filter((t) => t.date < fromDate);
  const periodTxns = transactions.filter((t) => t.date >= fromDate && t.date <= toDate);
  const accountGroupsMap = /* @__PURE__ */ new Map();
  accounts.forEach((acc) => {
    accountGroupsMap.set(acc.id, { openingBalance: 0, txns: [] });
  });
  for (const txn of openingTxns) {
    const acc = accountMap2.get(txn.accountId);
    const entry = accountGroupsMap.get(txn.accountId) || { openingBalance: 0, txns: [] };
    const isDebitNormal = acc?.type === "asset" || acc?.type === "expense" || acc?.type === "cogs";
    if (txn.type === "debit") {
      entry.openingBalance += isDebitNormal ? txn.amount : -txn.amount;
    } else {
      entry.openingBalance += isDebitNormal ? -txn.amount : txn.amount;
    }
    accountGroupsMap.set(txn.accountId, entry);
  }
  for (const txn of periodTxns) {
    const entry = accountGroupsMap.get(txn.accountId) || { openingBalance: 0, txns: [] };
    entry.txns.push(txn);
    accountGroupsMap.set(txn.accountId, entry);
  }
  let grandTotalDebits = 0;
  let grandTotalCredits = 0;
  const accountGroups = [];
  accountGroupsMap.forEach((entry, accountId) => {
    if (entry.txns.length === 0 && entry.openingBalance === 0) {
      return;
    }
    const acc = accountMap2.get(accountId);
    const accName = acc?.name || accountId;
    const accType = acc?.type || "expense";
    const isDebitNormal = accType === "asset" || accType === "expense" || accType === "cogs";
    let runningBalance = entry.openingBalance;
    let totalDebits = 0;
    let totalCredits = 0;
    entry.txns.sort((a, b) => a.date.localeCompare(b.date));
    const ledgerRows = entry.txns.map((txn) => {
      if (txn.type === "debit") {
        totalDebits += txn.amount;
        runningBalance += isDebitNormal ? txn.amount : -txn.amount;
      } else {
        totalCredits += txn.amount;
        runningBalance += isDebitNormal ? -txn.amount : txn.amount;
      }
      return {
        id: txn.id,
        date: txn.date,
        description: txn.description,
        type: txn.type,
        amount: txn.amount,
        sourceType: txn.sourceType,
        sourceId: txn.sourceId,
        runningBalance
      };
    });
    grandTotalDebits += totalDebits;
    grandTotalCredits += totalCredits;
    accountGroups.push({
      accountId,
      accountName: accName,
      accountType: accType,
      openingBalance: entry.openingBalance,
      totalDebits,
      totalCredits,
      closingBalance: runningBalance,
      transactions: ledgerRows
    });
  });
  accountGroups.sort((a, b) => a.accountId.localeCompare(b.accountId));
  return {
    reportType: "GENERAL_LEDGER",
    title: "General Ledger",
    periodLabel,
    fromDate,
    toDate,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    accounts: accountGroups,
    totalDebits: grandTotalDebits,
    totalCredits: grandTotalCredits,
    netChange: grandTotalCredits - grandTotalDebits
  };
}
var GeneralLedgerService, generalLedgerService;
var init_generalLedger_service = __esm({
  "src/features/reports/services/generalLedger.service.ts"() {
    GeneralLedgerService = class {
      async generate(request, provider) {
        const transactions = await provider.getTransactions();
        const accounts = provider.getAccounts ? await provider.getAccounts() : [];
        const periodLabel = request.periodLabel || `${request.fromDate} \u2013 ${request.toDate}`;
        return generateGeneralLedger(transactions, accounts, request.fromDate, request.toDate, periodLabel);
      }
      generateSync(request, provider) {
        const transactions = provider.getTransactions();
        const accounts = provider.getAccounts ? provider.getAccounts() : [];
        const periodLabel = request.periodLabel || `${request.fromDate} \u2013 ${request.toDate}`;
        return generateGeneralLedger(transactions, accounts, request.fromDate, request.toDate, periodLabel);
      }
    };
    generalLedgerService = new GeneralLedgerService();
  }
});

// src/features/reports/services/__tests__/generalLedger.service.test.ts
var generalLedger_service_test_exports = {};
var import_vitest5, testAccounts2, testTransactions;
var init_generalLedger_service_test = __esm({
  "src/features/reports/services/__tests__/generalLedger.service.test.ts"() {
    import_vitest5 = __toESM(require_test_shim(), 1);
    init_generalLedger_service();
    testAccounts2 = [
      { id: "ACC-REV-001", name: "Sales Revenue", type: "revenue" },
      { id: "ACC-EXP-001", name: "Rent Expense", type: "expense" },
      { id: "ACC-COGS-001", name: "Cloud Infra", type: "cogs" }
    ];
    testTransactions = [
      // Opening transaction (before 2026-02-01)
      {
        id: "T-OLD-1",
        date: "2026-01-15",
        accountId: "ACC-EXP-001",
        accountType: "expense",
        description: "Rent Jan",
        amount: 1e3,
        type: "debit"
      },
      // Period transactions (Feb 2026)
      {
        id: "T-FEB-1",
        date: "2026-02-05",
        accountId: "ACC-REV-001",
        accountType: "revenue",
        description: "Sale 1",
        amount: 5e3,
        type: "credit"
      },
      {
        id: "T-FEB-2",
        date: "2026-02-10",
        accountId: "ACC-EXP-001",
        accountType: "expense",
        description: "Rent Feb",
        amount: 1200,
        type: "debit"
      },
      {
        id: "T-FEB-3",
        date: "2026-02-20",
        accountId: "ACC-REV-001",
        accountType: "revenue",
        description: "Sale 2",
        amount: 3e3,
        type: "credit"
      }
    ];
    (0, import_vitest5.describe)("GeneralLedgerService", () => {
      (0, import_vitest5.it)("groups transactions by account and computes running balance", () => {
        const report = generateGeneralLedger(
          testTransactions,
          testAccounts2,
          "2026-02-01",
          "2026-02-28",
          "Feb 2026"
        );
        (0, import_vitest5.expect)(report.reportType).toBe("GENERAL_LEDGER");
        (0, import_vitest5.expect)(report.totalCredits).toBe(8e3);
        (0, import_vitest5.expect)(report.totalDebits).toBe(1200);
        const revGroup = report.accounts.find((a) => a.accountId === "ACC-REV-001");
        (0, import_vitest5.expect)(revGroup).toBeDefined();
        (0, import_vitest5.expect)(revGroup?.totalCredits).toBe(8e3);
        (0, import_vitest5.expect)(revGroup?.closingBalance).toBe(8e3);
        (0, import_vitest5.expect)(revGroup?.transactions.length).toBe(2);
        const expGroup = report.accounts.find((a) => a.accountId === "ACC-EXP-001");
        (0, import_vitest5.expect)(expGroup).toBeDefined();
        (0, import_vitest5.expect)(expGroup?.openingBalance).toBe(1e3);
        (0, import_vitest5.expect)(expGroup?.totalDebits).toBe(1200);
        (0, import_vitest5.expect)(expGroup?.closingBalance).toBe(2200);
      });
      (0, import_vitest5.it)("handles empty transactions gracefully", () => {
        const report = generateGeneralLedger([], testAccounts2, "2026-01-01", "2026-12-31");
        (0, import_vitest5.expect)(report.accounts.length).toBe(0);
        (0, import_vitest5.expect)(report.totalDebits).toBe(0);
        (0, import_vitest5.expect)(report.totalCredits).toBe(0);
      });
    });
  }
});

// src/features/reports/services/__tests__/profitAndLoss.service.test.ts
var profitAndLoss_service_test_exports = {};
var import_vitest6, baseTransactions;
var init_profitAndLoss_service_test = __esm({
  "src/features/reports/services/__tests__/profitAndLoss.service.test.ts"() {
    import_vitest6 = __toESM(require_test_shim(), 1);
    init_profitAndLoss_service();
    baseTransactions = [
      // Revenue
      {
        id: "T-REV-001",
        date: "2026-01-10",
        accountId: "ACC-REV-001",
        accountType: "revenue",
        description: "Sales revenue Jan",
        amount: 5e5,
        type: "credit"
      },
      {
        id: "T-REV-002",
        date: "2026-02-15",
        accountId: "ACC-REV-002",
        accountType: "revenue",
        description: "Service revenue Feb",
        amount: 3e5,
        type: "credit"
      },
      // COGS
      {
        id: "T-COGS-001",
        date: "2026-01-12",
        accountId: "ACC-COGS-001",
        accountType: "cogs",
        description: "AWS infra Jan",
        amount: 15e4,
        type: "debit"
      },
      {
        id: "T-COGS-002",
        date: "2026-02-12",
        accountId: "ACC-COGS-001",
        accountType: "cogs",
        description: "AWS infra Feb",
        amount: 1e5,
        type: "debit"
      },
      // Expenses
      {
        id: "T-EXP-001",
        date: "2026-01-01",
        accountId: "ACC-EXP-001",
        accountType: "expense",
        description: "Rent Jan",
        amount: 12e4,
        type: "debit"
      },
      {
        id: "T-EXP-002",
        date: "2026-02-01",
        accountId: "ACC-EXP-002",
        accountType: "expense",
        description: "Salary Feb",
        amount: 8e4,
        type: "debit"
      }
    ];
    (0, import_vitest6.describe)("generateProfitAndLoss", () => {
      (0, import_vitest6.describe)("1. Revenue calculation", () => {
        (0, import_vitest6.it)("sums all revenue credit transactions in range", () => {
          const report = generateProfitAndLoss(
            baseTransactions,
            "2026-01-01",
            "2026-12-31",
            "Full Year 2026"
          );
          (0, import_vitest6.expect)(report.totalRevenue).toBe(8e5);
        });
        (0, import_vitest6.it)("returns revenue line items per account", () => {
          const report = generateProfitAndLoss(
            baseTransactions,
            "2026-01-01",
            "2026-12-31",
            "Full Year 2026"
          );
          (0, import_vitest6.expect)(report.revenueLines).toHaveLength(2);
        });
        (0, import_vitest6.it)("does NOT include debit revenue transactions in revenue", () => {
          const txns = [
            {
              id: "T-REV-DEBIT",
              date: "2026-01-05",
              accountId: "ACC-REV-001",
              accountType: "revenue",
              description: "Revenue reversal",
              amount: 5e4,
              type: "debit"
              // should be excluded from revenue
            },
            ...baseTransactions
          ];
          const report = generateProfitAndLoss(txns, "2026-01-01", "2026-12-31", "Test");
          (0, import_vitest6.expect)(report.totalRevenue).toBe(8e5);
        });
      });
      (0, import_vitest6.describe)("2. COGS calculation", () => {
        (0, import_vitest6.it)("sums all COGS debit transactions in range", () => {
          const report = generateProfitAndLoss(
            baseTransactions,
            "2026-01-01",
            "2026-12-31",
            "Full Year 2026"
          );
          (0, import_vitest6.expect)(report.totalCogs).toBe(25e4);
        });
        (0, import_vitest6.it)("returns COGS line items per account", () => {
          const report = generateProfitAndLoss(
            baseTransactions,
            "2026-01-01",
            "2026-12-31",
            "Full Year 2026"
          );
          (0, import_vitest6.expect)(report.cogsLines).toHaveLength(1);
          (0, import_vitest6.expect)(report.cogsLines[0].amount).toBe(25e4);
        });
      });
      (0, import_vitest6.describe)("3. Gross profit calculation", () => {
        (0, import_vitest6.it)("calculates gross profit as revenue minus COGS", () => {
          const report = generateProfitAndLoss(
            baseTransactions,
            "2026-01-01",
            "2026-12-31",
            "Full Year 2026"
          );
          (0, import_vitest6.expect)(report.grossProfit).toBe(report.totalRevenue - report.totalCogs);
          (0, import_vitest6.expect)(report.grossProfit).toBe(55e4);
        });
        (0, import_vitest6.it)("is negative when COGS exceeds revenue", () => {
          const highCogsTxns = [
            {
              id: "T-REV-SMALL",
              date: "2026-01-10",
              accountId: "ACC-REV-001",
              accountType: "revenue",
              description: "Small revenue",
              amount: 1e4,
              type: "credit"
            },
            {
              id: "T-COGS-LARGE",
              date: "2026-01-12",
              accountId: "ACC-COGS-001",
              accountType: "cogs",
              description: "Large COGS",
              amount: 5e4,
              type: "debit"
            }
          ];
          const report = generateProfitAndLoss(highCogsTxns, "2026-01-01", "2026-12-31", "Test");
          (0, import_vitest6.expect)(report.grossProfit).toBe(-4e4);
        });
      });
      (0, import_vitest6.describe)("4. Expense calculation", () => {
        (0, import_vitest6.it)("sums all operating expense debit transactions in range", () => {
          const report = generateProfitAndLoss(
            baseTransactions,
            "2026-01-01",
            "2026-12-31",
            "Full Year 2026"
          );
          (0, import_vitest6.expect)(report.totalExpenses).toBe(2e5);
        });
        (0, import_vitest6.it)("returns expense line items per account", () => {
          const report = generateProfitAndLoss(
            baseTransactions,
            "2026-01-01",
            "2026-12-31",
            "Full Year 2026"
          );
          (0, import_vitest6.expect)(report.expenseLines).toHaveLength(2);
        });
      });
      (0, import_vitest6.describe)("5. Net profit calculation", () => {
        (0, import_vitest6.it)("calculates net profit as gross profit minus total expenses", () => {
          const report = generateProfitAndLoss(
            baseTransactions,
            "2026-01-01",
            "2026-12-31",
            "Full Year 2026"
          );
          (0, import_vitest6.expect)(report.netProfit).toBe(report.grossProfit - report.totalExpenses);
          (0, import_vitest6.expect)(report.netProfit).toBe(35e4);
        });
        (0, import_vitest6.it)("is negative when expenses exceed gross profit", () => {
          const heavyExpenseTxns = [
            {
              id: "T-REV",
              date: "2026-01-10",
              accountId: "ACC-REV-001",
              accountType: "revenue",
              description: "Revenue",
              amount: 1e5,
              type: "credit"
            },
            {
              id: "T-EXP",
              date: "2026-01-15",
              accountId: "ACC-EXP-001",
              accountType: "expense",
              description: "Heavy expense",
              amount: 2e5,
              type: "debit"
            }
          ];
          const report = generateProfitAndLoss(heavyExpenseTxns, "2026-01-01", "2026-12-31", "Test");
          (0, import_vitest6.expect)(report.netProfit).toBe(-1e5);
        });
      });
      (0, import_vitest6.describe)("6. Date filtering", () => {
        (0, import_vitest6.it)("only includes transactions within the specified date range", () => {
          const report = generateProfitAndLoss(
            baseTransactions,
            "2026-01-01",
            "2026-01-31",
            "January 2026"
          );
          (0, import_vitest6.expect)(report.totalRevenue).toBe(5e5);
          (0, import_vitest6.expect)(report.totalCogs).toBe(15e4);
          (0, import_vitest6.expect)(report.totalExpenses).toBe(12e4);
        });
        (0, import_vitest6.it)("includes transactions on the fromDate boundary", () => {
          const report = generateProfitAndLoss(
            baseTransactions,
            "2026-01-01",
            // exact boundary
            "2026-01-01",
            "Jan 1 only"
          );
          (0, import_vitest6.expect)(report.totalExpenses).toBe(12e4);
        });
        (0, import_vitest6.it)("includes transactions on the toDate boundary", () => {
          const report = generateProfitAndLoss(
            baseTransactions,
            "2026-02-15",
            "2026-02-15",
            // exact boundary
            "Feb 15 only"
          );
          (0, import_vitest6.expect)(report.totalRevenue).toBe(3e5);
        });
        (0, import_vitest6.it)("excludes transactions strictly outside the range", () => {
          const report = generateProfitAndLoss(
            baseTransactions,
            "2026-03-01",
            "2026-03-31",
            "March 2026"
          );
          (0, import_vitest6.expect)(report.totalRevenue).toBe(0);
          (0, import_vitest6.expect)(report.totalCogs).toBe(0);
          (0, import_vitest6.expect)(report.totalExpenses).toBe(0);
        });
      });
      (0, import_vitest6.describe)("7. Empty transaction data", () => {
        (0, import_vitest6.it)("returns all zeros when no transactions are provided", () => {
          const report = generateProfitAndLoss([], "2026-01-01", "2026-12-31", "Empty");
          (0, import_vitest6.expect)(report.totalRevenue).toBe(0);
          (0, import_vitest6.expect)(report.totalCogs).toBe(0);
          (0, import_vitest6.expect)(report.grossProfit).toBe(0);
          (0, import_vitest6.expect)(report.totalExpenses).toBe(0);
          (0, import_vitest6.expect)(report.netProfit).toBe(0);
        });
        (0, import_vitest6.it)("returns empty line item arrays when no transactions", () => {
          const report = generateProfitAndLoss([], "2026-01-01", "2026-12-31", "Empty");
          (0, import_vitest6.expect)(report.revenueLines).toHaveLength(0);
          (0, import_vitest6.expect)(report.cogsLines).toHaveLength(0);
          (0, import_vitest6.expect)(report.expenseLines).toHaveLength(0);
        });
      });
      (0, import_vitest6.describe)("8. Multiple transactions on the same date", () => {
        (0, import_vitest6.it)("sums multiple revenue transactions on the same date", () => {
          const sameDayTxns = [
            {
              id: "T-SAME-1",
              date: "2026-06-15",
              accountId: "ACC-REV-001",
              accountType: "revenue",
              description: "Sale A",
              amount: 1e5,
              type: "credit"
            },
            {
              id: "T-SAME-2",
              date: "2026-06-15",
              accountId: "ACC-REV-001",
              accountType: "revenue",
              description: "Sale B",
              amount: 2e5,
              type: "credit"
            },
            {
              id: "T-SAME-3",
              date: "2026-06-15",
              accountId: "ACC-REV-001",
              accountType: "revenue",
              description: "Sale C",
              amount: 5e4,
              type: "credit"
            }
          ];
          const report = generateProfitAndLoss(sameDayTxns, "2026-06-01", "2026-06-30", "June 2026");
          (0, import_vitest6.expect)(report.totalRevenue).toBe(35e4);
          (0, import_vitest6.expect)(report.revenueLines).toHaveLength(1);
          (0, import_vitest6.expect)(report.revenueLines[0].amount).toBe(35e4);
        });
        (0, import_vitest6.it)("sums multiple expense transactions on the same date", () => {
          const sameDayExpenses = [
            {
              id: "T-EXP-SAME-1",
              date: "2026-06-01",
              accountId: "ACC-EXP-001",
              accountType: "expense",
              description: "Expense A",
              amount: 3e4,
              type: "debit"
            },
            {
              id: "T-EXP-SAME-2",
              date: "2026-06-01",
              accountId: "ACC-EXP-002",
              accountType: "expense",
              description: "Expense B",
              amount: 45e3,
              type: "debit"
            }
          ];
          const report = generateProfitAndLoss(sameDayExpenses, "2026-06-01", "2026-06-30", "June 2026");
          (0, import_vitest6.expect)(report.totalExpenses).toBe(75e3);
          (0, import_vitest6.expect)(report.expenseLines).toHaveLength(2);
        });
      });
      (0, import_vitest6.describe)("Metadata", () => {
        (0, import_vitest6.it)("preserves fromDate, toDate, and periodLabel in the result", () => {
          const report = generateProfitAndLoss(
            baseTransactions,
            "2026-01-01",
            "2026-01-31",
            "January 2026"
          );
          (0, import_vitest6.expect)(report.fromDate).toBe("2026-01-01");
          (0, import_vitest6.expect)(report.toDate).toBe("2026-01-31");
          (0, import_vitest6.expect)(report.periodLabel).toBe("January 2026");
        });
      });
    });
  }
});

// src/features/reports/services/salesReport.service.ts
function generateSalesReport(invoices, customers, fromDate, toDate, periodLabel = `${fromDate} \u2013 ${toDate}`) {
  const customerMap = new Map(customers.map((c) => [c.id, c.name]));
  const periodInvoices = invoices.filter(
    (inv) => inv.date >= fromDate && inv.date <= toDate && inv.status !== "void"
  );
  const totalSales = periodInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalInvoices = periodInvoices.length;
  const paidSales = periodInvoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.totalAmount, 0);
  const unpaidSales = totalSales - paidSales;
  const averageInvoiceValue = totalInvoices > 0 ? Math.round(totalSales / totalInvoices) : 0;
  const customerTotals = /* @__PURE__ */ new Map();
  for (const inv of periodInvoices) {
    const existing = customerTotals.get(inv.customerId) || { count: 0, total: 0, paid: 0 };
    existing.count += 1;
    existing.total += inv.totalAmount;
    if (inv.status === "paid") {
      existing.paid += inv.totalAmount;
    }
    customerTotals.set(inv.customerId, existing);
  }
  const byCustomer = [];
  customerTotals.forEach((val, customerId) => {
    byCustomer.push({
      customerId,
      customerName: customerMap.get(customerId) || customerId,
      invoiceCount: val.count,
      totalAmount: val.total,
      paidAmount: val.paid,
      unpaidAmount: val.total - val.paid,
      percentageOfTotal: totalSales > 0 ? Number((val.total / totalSales * 100).toFixed(1)) : 0
    });
  });
  byCustomer.sort((a, b) => b.totalAmount - a.totalAmount);
  const itemTotals = /* @__PURE__ */ new Map();
  for (const inv of periodInvoices) {
    for (const line of inv.lines) {
      const key = `${line.accountId}-${line.description}`;
      const existing = itemTotals.get(key) || { description: line.description, quantity: 0, amount: 0 };
      existing.quantity += line.quantity;
      existing.amount += line.amount;
      itemTotals.set(key, existing);
    }
  }
  const byItem = [];
  itemTotals.forEach((val, key) => {
    const accountId = key.split("-")[0];
    byItem.push({
      accountId,
      description: val.description,
      quantity: val.quantity,
      totalAmount: val.amount,
      percentageOfTotal: totalSales > 0 ? Number((val.amount / totalSales * 100).toFixed(1)) : 0
    });
  });
  byItem.sort((a, b) => b.totalAmount - a.totalAmount);
  return {
    reportType: "SALES_REPORT",
    title: "Sales Summary Report",
    periodLabel,
    fromDate,
    toDate,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    totalSales,
    totalInvoices,
    paidSales,
    unpaidSales,
    averageInvoiceValue,
    byCustomer,
    byItem
  };
}
var SalesReportService, salesReportService;
var init_salesReport_service = __esm({
  "src/features/reports/services/salesReport.service.ts"() {
    SalesReportService = class {
      async generate(request, provider) {
        const invoices = provider.getInvoices ? await provider.getInvoices() : [];
        const customers = provider.getCustomers ? await provider.getCustomers() : [];
        const periodLabel = request.periodLabel || `${request.fromDate} \u2013 ${request.toDate}`;
        return generateSalesReport(invoices, customers, request.fromDate, request.toDate, periodLabel);
      }
      generateSync(request, provider) {
        const invoices = provider.getInvoices ? provider.getInvoices() : [];
        const customers = provider.getCustomers ? provider.getCustomers() : [];
        const periodLabel = request.periodLabel || `${request.fromDate} \u2013 ${request.toDate}`;
        return generateSalesReport(invoices, customers, request.fromDate, request.toDate, periodLabel);
      }
    };
    salesReportService = new SalesReportService();
  }
});

// src/features/reports/services/__tests__/salesReport.service.test.ts
var salesReport_service_test_exports = {};
var import_vitest7, testCustomers, testInvoices;
var init_salesReport_service_test = __esm({
  "src/features/reports/services/__tests__/salesReport.service.test.ts"() {
    import_vitest7 = __toESM(require_test_shim(), 1);
    init_salesReport_service();
    testCustomers = [
      { id: "CUST-1", name: "Alpha Corp" },
      { id: "CUST-2", name: "Beta Ltd" }
    ];
    testInvoices = [
      {
        id: "INV-1",
        customerId: "CUST-1",
        date: "2026-03-05",
        dueDate: "2026-04-05",
        status: "paid",
        lines: [
          { id: "L1", accountId: "ACC-REV-001", description: "Licences", quantity: 10, unitPrice: 2e3, amount: 2e4 },
          { id: "L2", accountId: "ACC-REV-002", description: "Support", quantity: 5, unitPrice: 1e3, amount: 5e3 }
        ],
        totalAmount: 25e3
      },
      {
        id: "INV-2",
        customerId: "CUST-2",
        date: "2026-03-12",
        dueDate: "2026-04-12",
        status: "sent",
        lines: [
          { id: "L3", accountId: "ACC-REV-001", description: "Licences", quantity: 5, unitPrice: 2e3, amount: 1e4 }
        ],
        totalAmount: 1e4
      }
    ];
    (0, import_vitest7.describe)("SalesReportService", () => {
      (0, import_vitest7.it)("aggregates sales by customer and service line", () => {
        const report = generateSalesReport(testInvoices, testCustomers, "2026-03-01", "2026-03-31", "March 2026");
        (0, import_vitest7.expect)(report.reportType).toBe("SALES_REPORT");
        (0, import_vitest7.expect)(report.totalSales).toBe(35e3);
        (0, import_vitest7.expect)(report.paidSales).toBe(25e3);
        (0, import_vitest7.expect)(report.unpaidSales).toBe(1e4);
        (0, import_vitest7.expect)(report.totalInvoices).toBe(2);
        (0, import_vitest7.expect)(report.averageInvoiceValue).toBe(17500);
        (0, import_vitest7.expect)(report.byCustomer.length).toBe(2);
        (0, import_vitest7.expect)(report.byCustomer[0].customerName).toBe("Alpha Corp");
        (0, import_vitest7.expect)(report.byCustomer[0].totalAmount).toBe(25e3);
        (0, import_vitest7.expect)(report.byCustomer[0].percentageOfTotal).toBe(71.4);
        (0, import_vitest7.expect)(report.byItem.length).toBe(2);
        const licenceItem = report.byItem.find((i) => i.description === "Licences");
        (0, import_vitest7.expect)(licenceItem?.totalAmount).toBe(3e4);
        (0, import_vitest7.expect)(licenceItem?.quantity).toBe(15);
      });
    });
  }
});

// scripts/test-entry.ts
init_dummy_provider_test();
init_agingReport_service_test();
init_balanceSheet_service_test();
init_expenseReport_service_test();
init_generalLedger_service_test();
init_profitAndLoss_service_test();
init_salesReport_service_test();
