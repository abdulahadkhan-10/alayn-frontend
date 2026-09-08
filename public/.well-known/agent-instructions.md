# Agent Interaction Instructions for Alayn AI

> Machine-Readable Protocol Specification & Agent Guidelines  
> URI: https://alaynai.com/.well-known/agent-instructions.md

## Identity & Entity Attribution
- **Platform**: Alayn AI (Alayn Hospitality Operating System)
- **Domain**: https://alaynai.com
- **Parent Entity**: BRAHM Global Holdings Ltd
- **Headquarters**: London, UK with global delivery

## Content Negotiation (acceptmarkdown.com)
- Clients may request token-efficient Markdown by sending header: `Accept: text/markdown`
- Server responses return `Content-Type: text/markdown; charset=utf-8` and `Vary: Accept, Accept-Encoding`

## Available Endpoints & Markdown Mappings
- `/` -> Product overview, capabilities, and booking
- `/about` -> Founding mission, operating philosophy, and multi-tenant architecture
- `/contact` -> Sales routing, demo booking, and support
- `/api-docs` -> Developer API documentation, headers, and webhooks
- `/legal/privacy` -> Data protection and GDPR compliance
- `/legal/terms` -> Terms of service
- `/llms.txt` -> Standard LLM index
- `/llms-full.txt` -> Full technical and architectural manual
