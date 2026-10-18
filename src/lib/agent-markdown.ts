/**
 * Markdown generators for Accept-Markdown content negotiation (acceptmarkdown.com compliant) for Alayn AI.
 */

export const MARKDOWN_PAGES: Record<string, string> = {
  "/": `# Alayn AI — The Intelligent Operating System for Hospitality

> Orders, inventory, staffing, and operations—unified in one intelligent platform with real-time visibility across every location.

Alayn AI is an enterprise-grade, multi-tenant operating system built for restaurant chains, hospitality groups, cloud kitchens, cafes, and dining establishments. Backed by BRAHM Global Holdings.

## Core Capabilities
1. **Counter & Table POS**: Counter and table billing with UPI, card and cash, plus printed KOTs and receipts.
2. **Kitchen Display System (KDS)**: Orders appear on the kitchen board in real time; cancellations are flagged to the kitchen.
3. **Smart Inventory**: Stock levels, minimum levels, expiry alerts, and one-click restock purchase orders.
4. **Waste Management**: Waste logged per item with a reason, loss totals and trends, and high-waste alerts.
5. **Workforce**: Shift scheduling, staff-requested shift swaps with manager approval, leave approvals, and a tablet clock-in kiosk.
6. **Multi-Outlet Management**: Every outlet from one login, each with its own orders, stock and staff.
7. **Ask Alayn AI**: Plain-language questions about sales, stock, staffing and menu performance.

## Pricing
₹1,999 per outlet per month + 18% GST, with every feature included. Details: https://alaynai.com/pricing

Full feature list: https://alaynai.com/features

## Developer & API Integration
- API Documentation: https://alaynai.com/api-docs
- Multi-Tenant Scoping Header: \`x-outlet-id\`
- Authentication: log in at \`POST /api/v1/auth/login\`, then send \`Authorization: Bearer <accessToken>\`.

## Contact & Demos
- Book a Demonstration: https://alaynai.com/contact
- General inquiries, sales and demos: info@alaynai.com

## Machine-Readable Resources
- LLM Index: https://alaynai.com/llms.txt
- Full LLM Context: https://alaynai.com/llms-full.txt
- Sitemap: https://alaynai.com/sitemap.xml
`,

  // Keep in step with src/app/features/page.tsx.
  "/features": `# Alayn AI Features

> Everything a restaurant, café or cloud kitchen runs on during service, in one platform.

Alayn AI is a restaurant operating system for restaurants, cafés, cloud kitchens and multi-outlet hospitality groups in India. Every feature below is included in one per-outlet subscription (see https://alaynai.com/pricing).

## Point of Sale
- Counter and table billing with UPI, card and cash.
- Printed KOTs and thermal receipts.
- Table QR codes that open the menu on the guest's phone.
- Unlimited POS terminals per outlet.

## Kitchen Display System (KDS)
- Orders reach the kitchen screen the moment they are placed.
- Cancellations are flagged to the kitchen.
- The floor is notified when an order is ready.

## Inventory
- Stock levels with minimum levels and low-stock alerts.
- Batch and expiry tracking, used first-expiring-first-out (FEFO).
- Suppliers and one-click restock purchase orders.

## Waste Tracking
- Waste logged per item with a reason.
- Loss totals, trends and high-waste alerts.

## Workforce
- Weekly shift rosters.
- Staff-requested shift swaps with manager approval.
- Leave requests and approvals.
- Tablet clock-in kiosk and geofenced attendance.

## Multi-Outlet Management
- Every outlet from one login, each with its own orders, stock and staff.
- Outlet-level prices and GST (CGST/SGST) settings.

## Analytics and Ask Alayn AI
- Sales dashboards, top and bottom sellers and outlet comparisons.
- Ask plain-language questions about sales, stock, staffing and menu performance.

## REST API
- JWT login, outlet-scoped requests and an OpenAPI 3.0 spec: https://alaynai.com/api-docs

## Next Steps
- Pricing: https://alaynai.com/pricing
- Book a demonstration: https://alaynai.com/contact
`,

  // Keep in step with src/app/pricing/page.tsx and the fee in
  // src/components/subscription/SubscriptionMonthSelector.tsx.
  "/pricing": `# Alayn AI Pricing

> One plan, priced per outlet: ₹1,999 per month + 18% GST (₹2,358.82 per month in total).

## What's Included
Every feature, for every outlet on the plan:
- Unlimited POS terminals and table QR menus
- Live kitchen display system (KDS)
- Batch inventory with expiry tracking and purchase orders
- Waste tracking with AI menu and wastage insights
- Staff rosters, shift swaps, leave and geofenced attendance
- Sales and P&L analytics, and Ask Alayn AI
- REST API access

## How Billing Works
- Each outlet has its own subscription.
- Pay for 1 to 36 months at a time.
- Payments are processed by Cashfree.
- Refunds and cancellations: https://alaynai.com/legal/refund

## Multi-Outlet Groups
Groups with many outlets can ask about volume pricing: info@alaynai.com or https://alaynai.com/contact

## Next Steps
- Features: https://alaynai.com/features
- Book a demonstration: https://alaynai.com/contact
- Sign up: https://alaynai.com/signup
`,

  "/about": `# About Alayn AI

> An intelligent operating system engineered to bring complete clarity to modern hospitality operations.

## 1. Executive Summary & Vision
Alayn AI is the dedicated hospitality technology company within **BRAHM Global Holdings**. We build software that replaces fragmented point solutions—disjointed POS systems, paper kitchen tickets, manual inventory spreadsheets, and WhatsApp shift scheduling—with one unified, real-time operating platform.

## 2. The Four Pillars of Alayn AI
1. **Real-Time Floor & Kitchen Sync**: Orders reach the kitchen display the moment they're placed, and the floor is notified when they're ready.
2. **Inventory & Waste**: Stock levels, minimum levels, expiry alerts and a waste ledger with reasons, to cut waste and emergency stockouts.
3. **Workforce Matrix Optimization**: Intelligent shift rosters, attendance kiosks, and leave management designed for high-turnover hospitality teams.
4. **Multi-Outlet Enterprise Scalability**: Multi-tenant architecture designed to scale seamlessly from single independent venues to multi-city restaurant groups.

## 3. Corporate Backing & Governance
Alayn AI is built and operated by **BRAHM Global Holdings**, a sole proprietorship based in Mumbai, India.

- **Website**: https://alaynai.com
- **Contact**: info@alaynai.com
`,

  "/contact": `# Contact & Book a Demonstration — Alayn AI

> Connect with our enterprise sales and operator support teams.

## Departmental Routing

### 1. Book a Demonstration & Sales
To arrange a tailored platform walkthrough for your restaurant or hospitality group:
- **Email**: info@alaynai.com
- **Subject**: Demonstration Request — [Venue / Group Name]
- **Response Time**: Within 24 hours

### 2. Enterprise & Multi-Outlet Partnerships
For multi-location restaurant chains, hotel groups, and enterprise franchise operations:
- **Email**: info@alaynai.com
- **Subject**: Enterprise Partnership Inquiry

### 3. Operator Support & Client Care
For existing restaurant partners requiring technical or account assistance:
- **Email**: info@alaynai.com
- **Response Time**: Same day priority support

## Corporate Headquarters
- **Entity**: Alayn AI (A BRAHM Global Holdings Company)
- **Location**: Mumbai, India
- **Primary Website**: https://alaynai.com
`,

  // Summary only; the HTML page is the policy. Keep the dates and claims here
  // in step with src/app/legal/privacy/page.tsx when the policy changes.
  "/legal/privacy": `# Privacy Policy — Alayn AI

> Effective and last updated: 14 August 2026
> Full policy: https://alaynai.com/legal/privacy

This is a short summary for agents. The full policy at the link above is the authoritative version.

- **Framework**: Written with reference to India's Digital Personal Data Protection (DPDP) Act. Rights and mechanisms under the DPDP framework apply as its provisions commence.
- **Selling data**: Alayn does not sell personal data as a commercial product.
- **Retention**: Personal data is kept only for as long as reasonably necessary for the purposes described in the policy.
- **Third parties**: Some features use third-party services, such as payment service providers, which are governed by their own privacy policies.
- **Contact (including privacy and grievances)**: info@alaynai.com
`,

  "/api-docs": `# Alayn AI — Developer API & Integration Documentation

> Build, connect, and automate hospitality workflows using the Alayn AI API.

## Base URL
\`https://api.alaynai.com/api/v1\`

## Authentication
Log in with an Alayn account at \`POST /api/v1/auth/login\` and send the returned access token:
\`\`\`http
Authorization: Bearer <accessToken>
\`\`\`
Refresh it with \`POST /api/v1/auth/refresh\`. There are no separate API keys yet.

## Outlet Scoping
Send the outlet ID in the \`x-outlet-id\` header. Without it, the API uses the first outlet on the account.

## Responses
Success: \`{ "success": true, "data": … }\` (lists add \`meta\` with limit, offset, total).
Error: \`{ "success": false, "error": { "code": "…", "message": "…" } }\`.

## Rate Limits
Every response carries \`RateLimit-Limit\`, \`RateLimit-Remaining\` and \`RateLimit-Reset\` headers. The API allows 1,000 requests per minute per IP, with stricter limits on login, QR menus and feedback. A 429 response includes \`Retry-After\`.

## Versioning and Deprecation
The version is in the path (\`/api/v1\`). Breaking changes ship as a new version. A deprecated version keeps working for at least 6 months after its deprecation is announced at https://alaynai.com/api-docs#versioning.

## Main Endpoint Groups
- \`/orders\` — Orders, status changes and payments.
- \`/kitchen\` — Kitchen display tickets.
- \`/menu\` — Menu, categories and items.
- \`/inventory/items\` — Stock items and adjustments.
- \`/purchase-orders\` — Purchase orders and deliveries.
- \`/waste-logs\` — Waste entries and summaries.
- \`/shifts\`, \`/attendance\`, \`/leave-requests\` — Workforce.
- \`/analytics\` — Daily summaries and reports.

## Reference
- Interactive reference: https://api.alaynai.com/api/docs
- OpenAPI: https://alaynai.com/openapi.json
- There are no webhooks, SDK or CLI yet.
`
};
