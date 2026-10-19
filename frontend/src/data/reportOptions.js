export const REPORT_REASONS = {
  product: [
    { value: "counterfeit", label: "Counterfeit or fake item", hint: "Pretends to be a brand it is not." },
    { value: "prohibited_item", label: "Prohibited item", hint: "Illegal, dangerous or not allowed for sale." },
    { value: "misleading", label: "Misleading listing", hint: "Photos, price or description do not match." },
    { value: "inappropriate", label: "Inappropriate content", hint: "Offensive text or images." },
    { value: "suspected_scam", label: "Suspected scam", hint: "Looks designed to take your money." },
    { value: "other", label: "Something else", hint: "Tell us what is wrong." },
  ],
  store: [
    { value: "fake_store", label: "Fake or impersonating store", hint: "Pretends to be another business or person." },
    { value: "suspected_scam", label: "Suspected scam", hint: "Looks designed to take your money." },
    { value: "counterfeit_goods", label: "Sells counterfeit goods", hint: "Fake or copied branded items." },
    { value: "abusive_behavior", label: "Abusive behavior", hint: "Harassment or threats." },
    { value: "other", label: "Something else", hint: "Tell us what is wrong." },
  ],
};

export const SUPPORT_CATEGORIES = [
  { value: "order_issue", label: "Order issue" },
  { value: "payment_refund", label: "Payment or refund" },
  { value: "account_access", label: "Account access" },
  { value: "seller_help", label: "Selling help" },
  { value: "technical_problem", label: "Technical problem" },
  { value: "other", label: "Something else" },
];

export const REASON_LABELS = Object.fromEntries(
  [...Object.values(REPORT_REASONS).flat(), ...SUPPORT_CATEGORIES].map((r) => [r.value, r.label])
);