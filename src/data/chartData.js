// Sample data for the Dashboard preview charts + tables.
// `revenue` drives the large area chart, `value` the device pie,
// and `sparkData` powers the tiny KPI sparklines.

export const revenueData = [
  { name: "Jan", revenue: 42000, target: 38000 },
  { name: "Feb", revenue: 39500, target: 40000 },
  { name: "Mar", revenue: 51200, target: 44000 },
  { name: "Apr", revenue: 48900, target: 47000 },
  { name: "May", revenue: 63400, target: 52000 },
  { name: "Jun", revenue: 71800, target: 58000 },
  { name: "Jul", revenue: 82300, target: 64000 },
];

export const deviceData = [
  { name: "Desktop", value: 5240 },
  { name: "Mobile", value: 3810 },
  { name: "Tablet", value: 1290 },
  { name: "Other", value: 460 },
];

// Tiny 7-point series for the KPI sparklines.
export const sparkRevenue = [
  { v: 30 }, { v: 34 }, { v: 31 }, { v: 42 }, { v: 46 }, { v: 55 }, { v: 62 },
];
export const sparkUsers = [
  { v: 48 }, { v: 45 }, { v: 51 }, { v: 49 }, { v: 58 }, { v: 61 }, { v: 67 },
];
export const sparkOrders = [
  { v: 22 }, { v: 26 }, { v: 24 }, { v: 21 }, { v: 19 }, { v: 20 }, { v: 18 },
];
export const sparkConversion = [
  { v: 12 }, { v: 13 }, { v: 12 }, { v: 15 }, { v: 16 }, { v: 18 }, { v: 21 },
];

// Recent activity table rows.
export const activityRows = [
  { name: "Row label A", email: "supporting.text@example.com", status: "Paid", amount: "€ 1 240", date: "Jul 6" },
  { name: "Row label B", email: "supporting.text@example.com", status: "Pending", amount: "€ 620", date: "Jul 6" },
  { name: "Row label C", email: "supporting.text@example.com", status: "Paid", amount: "€ 3 180", date: "Jul 5" },
  { name: "Row label D", email: "supporting.text@example.com", status: "Refunded", amount: "€ 90", date: "Jul 5" },
  { name: "Row label E", email: "supporting.text@example.com", status: "Paid", amount: "€ 2 050", date: "Jul 4" },
];
