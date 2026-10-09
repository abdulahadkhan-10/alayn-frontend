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
3. **Smart Inventory**: Recipe-based stock deduction when orders complete, minimum levels, expiry alerts, and one-click restock purchase orders.
4. **Waste Management**: Waste logged per item with a reason, loss totals and trends, and high-waste alerts.
5. **Workforce**: Shift scheduling, staff-requested shift swaps with manager approval, leave approvals, and a tablet clock-in kiosk.
6. **Multi-Outlet Management**: Every outlet from one login, each with its own orders, stock and staff.
7. **Ask Alayn AI**: Plain-language questions about sales, stock, staffing and menu performance.

## Developer & API Integration
- API Documentation: https://alaynai.com/api-docs
- Multi-Tenant Scoping Header: \`x-outlet-id\`
- Authentication: log in at \`POST /api/v1/auth/login\`, then send \`Authorization: Bearer <accessToken>\`.

## Contact & Demos
- Book a Demonstration: https://alaynai.com/contact
- General Inquiries: info@alaynai.com
- Sales: sales@alaynai.com

## Machine-Readable Resources
- LLM Index: https://alaynai.com/llms.txt
- Full LLM Context: https://alaynai.com/llms-full.txt
- Sitemap: https://alaynai.com/sitemap.xml
`,

  "/about": `# About Alayn AI

> An intelligent operating system engineered to bring complete clarity to modern hospitality operations.

## 1. Executive Summary & Vision
Alayn AI is the dedicated hospitality technology company within **BRAHM Global Holdings**. We build software that replaces fragmented point solutions—disjointed POS systems, paper kitchen tickets, manual inventory spreadsheets, and WhatsApp shift scheduling—with one unified, real-time operating platform.

## 2. The Four Pillars of Alayn AI
1. **Real-Time Floor & Kitchen Sync**: Orders reach the kitchen display the moment they're placed, and the floor is notified when they're ready.
2. **Inventory & Waste**: Recipe-based stock deduction, minimum levels, expiry alerts and a waste ledger with reasons, to cut waste and emergency stockouts.
3. **Workforce Matrix Optimization**: Intelligent shift rosters, attendance kiosks, and leave management designed for high-turnover hospitality teams.
4. **Multi-Outlet Enterprise Scalability**: Multi-tenant architecture designed to scale seamlessly from single independent venues to multi-city restaurant groups.

## 3. Corporate Backing & Governance
Alayn AI is backed by **BRAHM Global Holdings Ltd**, a British venture builder and holding company headquartered in London, United Kingdom.

- **Website**: https://alaynai.com
- **Contact**: info@alaynai.com
`,

  "/contact": `# Contact & Book a Demonstration — Alayn AI

> Connect with our enterprise sales and operator support teams.

## Departmental Routing

### 1. Book a Demonstration & Sales
To arrange a tailored platform walkthrough for your restaurant or hospitality group:
- **Email**: sales@alaynai.com
- **Subject**: Demonstration Request — [Venue / Group Name]
- **Response Time**: Within 24 hours

### 2. Enterprise & Multi-Outlet Partnerships
For multi-location restaurant chains, hotel groups, and enterprise franchise operations:
- **Email**: sales@alaynai.com
- **Subject**: Enterprise Partnership Inquiry

### 3. Operator Support & Client Care
For existing restaurant partners requiring technical or account assistance:
- **Email**: info@alaynai.com
- **Response Time**: Same day priority support

## Corporate Headquarters
- **Entity**: Alayn AI (A BRAHM Global Holdings Company)
- **Location**: London, United Kingdom
- **Primary Website**: https://alaynai.com
`,

  "/privacy": `# Privacy Policy & Data Protection Notice — Alayn AI

> Last Updated: January 2026 | Alayn AI (BRAHM Global Holdings)

Alayn AI is committed to safeguarding the privacy, confidentiality, and integrity of data collected from hospitality operators, staff, and guests.

## 1. Data Controller
- **Entity**: Alayn AI (BRAHM Global Holdings Ltd)
- **Privacy Contact**: info@alaynai.com
- **Registered Location**: London, United Kingdom

## 2. Data Processing Principles
- **Operator Data**: Stored in isolated multi-tenant databases with encrypted backups.
- **Guest Data**: Collected strictly for order fulfillment, digital receipts, and loyalty programs. No data is sold to third-party brokers.
- **Compliance**: Fully compliant with UK GDPR and global data protection standards.
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

export function getAgent404Markdown(requestedPath: string): string {
  return `# 404 - Resource Not Found

> The requested path \`${requestedPath}\` does not exist on Alayn AI.

## Agent Recovery Directory
If you are an autonomous AI crawler or LLM agent, use the canonical resources below:

- **Home**: https://alaynai.com/
- **About Alayn AI**: https://alaynai.com/about
- **Contact & Sales**: https://alaynai.com/contact
- **Developer API Documentation**: https://alaynai.com/api-docs
- **Privacy Policy**: https://alaynai.com/legal/privacy
- **Terms of Service**: https://alaynai.com/legal/terms
- **LLM Agent Index (llms.txt)**: https://alaynai.com/llms.txt
- **Full LLM Context (llms-full.txt)**: https://alaynai.com/llms-full.txt
- **XML Sitemap**: https://alaynai.com/sitemap.xml
`;
}
