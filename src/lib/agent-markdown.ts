/**
 * Markdown generators for Accept-Markdown content negotiation (acceptmarkdown.com compliant) for Alayn AI.
 */

export const MARKDOWN_PAGES: Record<string, string> = {
  "/": `# Alayn AI — The Intelligent Operating System for Hospitality

> Orders, inventory, staffing, and operations—unified in one intelligent platform with real-time visibility across every location.

Alayn AI is an enterprise-grade, multi-tenant operating system built for restaurant chains, hospitality groups, cloud kitchens, cafes, and dining establishments. Backed by BRAHM Global Holdings.

## Core Capabilities
1. **Counter & Table POS**: Offline-resilient point of sale with instant reconciliation and split billing.
2. **Kitchen Display System (KDS)**: Live KOT ticket synchronization between waitstaff handhelds and preparation stations with zero order drift.
3. **Smart Inventory & Batch Tracking**: Recipe-level FEFO/FIFO stock deductions with automated vendor PO procurement.
4. **Workforce & Matrix Rostering**: Shift scheduling, tablet clock-in kiosks, and peer-to-peer shift swaps.
5. **Multi-Outlet Management**: Centralized brand menu control with outlet-specific tax and operational schedules.

## Developer & API Integration
- API Documentation: https://alaynai.com/api-docs
- Multi-Tenant Scoping Header: \`x-outlet-id\`
- Authentication: JWT Bearer tokens and secure HTTP-only cookies.

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
1. **Real-Time Floor & Kitchen Sync**: Zero-drift communication between front-of-house staff, dining tables, and kitchen preparation stations.
2. **Precision Inventory & Waste Telemetry**: Recipe-level stock tracking based on FEFO (First Expired, First Out) to eliminate food waste and emergency stockouts.
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
\`https://api.alaynai.com/v1\`

## Authentication
Requests must authenticate via Bearer JWT token in the \`Authorization\` header:
\`\`\`http
Authorization: Bearer <your_api_token>
\`\`\`

## Multi-Tenant Outlet Scoping
Every outlet-specific request requires the \`x-outlet-id\` header to route data to the correct branch:
\`\`\`http
x-outlet-id: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
\`\`\`

## Core Endpoints
- \`GET /orders\` — Retrieve live orders.
- \`POST /orders\` — Create an order.
- \`GET /inventory/items\` — Fetch stock levels and batches.
- \`POST /inventory/purchase-orders\` — Dispatch supplier purchase orders.
- \`GET /workforce/roster\` — Retrieve employee shift roster.

## Webhooks
Subscribe to live events including \`order.created\`, \`order.completed\`, \`stock.low_alert\`, and \`attendance.clock_in\`.
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
