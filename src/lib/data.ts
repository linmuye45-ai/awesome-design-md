/** Country & currency reference data used in onboarding and settings. */

/** Country display names render via i18n key `country.<code>`. */
export const COUNTRIES: { code: string; currency: string }[] = [
  { code: "CN", currency: "CNY" },
  { code: "TW", currency: "TWD" },
  { code: "US", currency: "USD" },
  { code: "JP", currency: "JPY" },
  { code: "KR", currency: "KRW" },
  { code: "MX", currency: "MXN" },
  { code: "BR", currency: "BRL" },
  { code: "IN", currency: "INR" },
  { code: "ID", currency: "IDR" },
  { code: "TH", currency: "THB" },
  { code: "VN", currency: "VND" },
  { code: "AE", currency: "AED" },
  { code: "SA", currency: "SAR" },
  { code: "GB", currency: "GBP" },
  { code: "SG", currency: "SGD" },
];

export const CURRENCIES = [
  "CNY",
  "TWD",
  "USD",
  "JPY",
  "KRW",
  "MXN",
  "BRL",
  "INR",
  "IDR",
  "THB",
  "VND",
  "AED",
  "SAR",
  "GBP",
  "SGD",
  "EUR",
];

export const INCOME_CATEGORIES = ["sales", "service", "prepayment", "other_income"] as const;

export const EXPENSE_CATEGORIES = [
  "raw_materials",
  "rent",
  "payroll",
  "utilities",
  "logistics",
  "marketing",
  "platform_commission",
  "tax",
  "other_expense",
] as const;

export const PAYMENT_METHODS = ["cash", "card", "bank", "wallet", "other"] as const;

export const EMPLOYEE_RANGES = ["1-5", "6-15", "16-30", "31-50", "50+"] as const;

export const BUSINESS_TYPES = [
  "restaurant",
  "retail",
  "beauty",
  "education",
  "local_service",
  "freelance",
  "other",
] as const;
