export const REPORT_TARGET_TYPES = ["product", "store", "support"];
export const REPORT_STATUSES = ["open", "reviewing", "resolved", "dismissed"];

export const REPORT_REASONS = {
  product: ["counterfeit", "prohibited_item", "misleading", "inappropriate", "suspected_scam", "other"],
  store: ["fake_store", "suspected_scam", "counterfeit_goods", "abusive_behavior", "other"],
  support: ["order_issue", "payment_refund", "account_access", "seller_help", "technical_problem", "other"],
};

export const REASON_LABELS = {
  counterfeit: "Counterfeit or fake item",
  prohibited_item: "Prohibited item",
  misleading: "Misleading listing",
  inappropriate: "Inappropriate content",
  suspected_scam: "Suspected scam",
  fake_store: "Fake or impersonating store",
  counterfeit_goods: "Sells counterfeit goods",
  abusive_behavior: "Abusive behavior",
  order_issue: "Order issue",
  payment_refund: "Payment or refund",
  account_access: "Account access",
  seller_help: "Selling help",
  technical_problem: "Technical problem",
  other: "Something else",
};