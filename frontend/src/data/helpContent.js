// Set this to a response time you can actually keep, or set it to "" to hide it.
export const SUPPORT_RESPONSE_TIME = "1 to 2 business days";

export const HELP_CATEGORIES = [
  { id: "orders", title: "Orders & shipping", blurb: "Tracking, statuses and delivery.", icon: "package" },
  { id: "payments", title: "Payments & refunds", blurb: "Cards, charges and money back.", icon: "card" },
  { id: "account", title: "Account & security", blurb: "Passwords, profile and privacy.", icon: "user" },
  { id: "selling", title: "Selling", blurb: "Verification, listings and approvals.", icon: "store" },
  { id: "safety", title: "Safety & reporting", blurb: "Report products, stores and problems.", icon: "shield" },
];

export const FAQS = [
  { id: "o1", category: "orders", q: "How do I track my order?", a: "Open My Orders from your dashboard. Each order shows its status. Click an order to see its items, the seller and your shipping address.", link: { to: "/customer/orders", label: "Go to My Orders" } },
  { id: "o2", category: "orders", q: "What do the order statuses mean?", a: "Awaiting payment: the order exists but the payment has not completed. Processing: payment received and the seller is preparing it. Shipped: the seller has sent it. Delivered: it was marked as delivered. Cancelled: the order was cancelled, and a paid order is refunded." },
  { id: "o3", category: "orders", q: "Why did one checkout create more than one order?", a: "Each seller fulfils their own items, so a checkout with products from several sellers becomes one order per seller. You still pay once, for the full total." },
  { id: "o4", category: "orders", q: "My order says Awaiting payment. What now?", a: "Open the order and use the Repayment button to finish paying. If a payment is not completed for about 30 minutes, the order is cancelled automatically and the items go back into stock." },
  { id: "o5", category: "orders", q: "Can I cancel an order?", a: "Once an order is paid, the seller handles cancellations, and a cancelled paid order is refunded automatically. If you need an order cancelled, send us a message below with your order ID (the 6-character code on your orders page)." },
  { id: "p1", category: "payments", q: "Which payment methods can I use?", a: "Payments are made by card and processed securely by Stripe." },
  { id: "p2", category: "payments", q: "Is my card information safe?", a: "Card details are entered into Stripe's secure form and sent directly to Stripe. They never touch our servers and we never store them." },
  { id: "p3", category: "payments", q: "How do refunds work?", a: "When a seller cancels a paid order, the amount for that order is refunded automatically to your original payment method. Banks can take several business days to show it." },
  { id: "p4", category: "payments", q: "Why was I charged one amount for several sellers?", a: "Your checkout is a single payment covering every item. Each seller's order shows only their own part of the total." },
  { id: "a1", category: "account", q: "I forgot my password.", a: "Choose Forgot password on the sign-in page. We email you a link that works for one hour. Resetting your password signs you out of every device.", link: { to: "/forgot-password", label: "Reset my password" } },
  { id: "a2", category: "account", q: "How do I change my password or profile?", a: "Open Settings. Profile has your name, phone and photo, and Security has Change password. Changing your password signs out your other devices." },
  { id: "a3", category: "account", q: "Can I change my email address?", a: "Not at the moment. Your email is tied to signing in and verification, so it is locked." },
  { id: "a4", category: "account", q: "I think someone else is using my account.", a: "Change your password right away in Settings, then Security. That signs out every other device. Then send us a message below so we can look into it." },
  { id: "a5", category: "account", q: "How do I delete my account?", a: "Go to Settings, then Account, then Delete account. It is permanent, and it is blocked while any order is still in progress. Past orders stay on file for the other party." },
  { id: "s1", category: "selling", q: "How do I become a seller?", a: "Create an account and choose Seller. Then complete seller verification with your identity, business details and documents. You can add products once our team approves it.", link: { to: "/register", label: "Create a seller account" } },
  { id: "s2", category: "selling", q: "Why is my product still pending?", a: "Every product is reviewed by our team before it goes live. You get a notification when it is approved or rejected." },
  { id: "s3", category: "selling", q: "My product was rejected. What can I do?", a: "The reason is in your notification, your email and on the product page. Edit the product to fix the problem and it is sent for review again." },
  { id: "f1", category: "safety", q: "How do I report a product or a store?", a: "Tap the flag button on a product page or a store page, choose a reason and send it. You need to be signed in." },
  { id: "f2", category: "safety", q: "What happens after I report something?", a: "Our team reviews it. A product or store is not hidden automatically. If we find a problem, we take action. You get a notification when the review is finished." },
  { id: "f3", category: "safety", q: "Will the seller know I reported them?", a: "No. Reports are only visible to our team." },
];