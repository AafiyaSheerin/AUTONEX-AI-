# 🚀 AUTONEX AI — Autonomous Agentic Commerce & PayPal Security Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Node 18+](https://img.shields.io/badge/Node-18%2B-green.svg)](https://nodejs.org/)
[![PayPal Sandbox](https://img.shields.io/badge/PayPal-Sandbox%20Orders%20v2-0079C1.svg)](https://developer.paypal.com/)
[![Render](https://img.shields.io/badge/Deployed-Render-46E3B7.svg)](https://autonex-backend-i28q.onrender.com)

> **"Authorize. Automate. Transact."**  
> *AUTONEX AI bridges autonomous AI agent procurement with institutional-grade financial guardrails, real-time PayPal Sandbox settlements, and end-to-end supply chain fulfillment.*

---

## 📑 Table of Contents
1. [Overview](#-overview)
2. [Approved OSI License](#-approved-osi-license)
3. [How PayPal is Used in AUTONEX](#-how-paypal-is-used-in-autonex)
4. [How AI is Used in AUTONEX](#-how-ai-is-used-in-autonex)
5. [Sponsor Integrations & Technologies](#-sponsor-integrations--technologies)
6. [System Architecture](#-system-architecture)
7. [Setup & Installation Instructions](#-setup--installation-instructions)
8. [Live Cloud Deployment Links](#-live-cloud-deployment-links)
9. [API Reference & Testing](#-api-reference--testing)

---

## 🌟 Overview

**AUTONEX AI** is an autonomous agentic commerce platform built for the **PayPal Agentic Commerce & AI Payments Hackathon**. It delegates routine and complex purchasing tasks to an autonomous AI agent while maintaining absolute user control over budgets, spending rules, and delivery logistics.

### Key Highlights
- **Autonomous Agentic Checkout**: Natural-language conversational procurement powered by Google Gemini.
- **Strict Financial Boundary Verification**: Dynamic monthly allowance quotas and human security authorization for higher-value transactions.
- **Server-to-Server PayPal Sandbox Capture**: Real-time order creation and verified payment capture via official PayPal v2 endpoints.
- **Enterprise Post-Purchase Logistics**: Interactive Gantt charts, scheduler timelines, and merchant courier dispatch confirmation.
- **Automated Omnichannel Webhooks**: Dynamic Zapier-powered buyer confirmation notifications.

---

## 📜 Approved OSI License

This project is licensed under the approved **[OSI MIT License](LICENSE)**. You are free to inspect, use, modify, and distribute this software in accordance with the license conditions.

```
MIT License
Copyright (c) 2026 Aafiya Sheerin
```

---

## 💳 How PayPal is Used in AUTONEX

PayPal serves as the core financial settlement rail across the entire platform:

1. **PayPal Sandbox Orders API v2 (`/v2/checkout/orders`)**:
   - The backend service securely exchanges OAuth 2.0 client credentials with PayPal's sandbox gateway to generate authorized server-side orders with exact itemization, currency codes, and custom reference IDs.
2. **PayPal Smart Buttons (`@paypal/react-paypal-js`)**:
   - Embedded directly inside the AI Buyer Checkout Drawer and storefront modals, providing familiar, frictionless, and secure payment initiation for both desktop and mobile users.
3. **Server-Side Payment Capture (`/v2/checkout/orders/{id}/capture`)**:
   - Once human authorization is confirmed, the server verifies and captures funds through PayPal's capture endpoint, validating captured status (`COMPLETED` / `APPROVED`), amount, and returning the unique PayPal Capture ID.
4. **Dynamic Monthly Allowance Deduction**:
   - On successful capture, the buyer's monthly delegated budget is automatically reduced by the exact captured amount, with automatic calendar-month revival on the first of each month.
5. **Audited Financial Settlement Records**:
   - Each completed transaction links the PayPal Order ID and PayPal Capture ID to an immutable ledger for reconciliation and merchant export.

---

## 🤖 How AI is Used in AUTONEX

AI is integrated at multiple levels of the user and merchant experience:

1. **Google Gemini Autonomous Shopping Agent**:
   - Interprets natural-language buyer prompts (e.g., *"Find a handcrafted luxury crimson item under $50 with priority delivery"*), queries multi-merchant catalogs, and selects the optimal item meeting quality, price, and delivery constraints.
2. **Deterministic Governance & Invariant Enforcement**:
   - An intelligent policy engine continuously monitors agent decisions against buyer constraints. Transactions within the autonomous limit execute smoothly, while purchases requiring human oversight pause safely until approved.
3. **Explainable Agent Decision Receipts**:
   - Generates transparent, cryptographic decision receipts explaining the agent's exact purchase rationale, selected merchant criteria, and policy check outcomes.
4. **Elasticsearch Vector & Full-Text Search**:
   - Powers fast, typo-tolerant full-text and semantic product search across diverse catalog inventory.

---

## 🛠️ Sponsor Integrations & Technologies

AUTONEX integrates a comprehensive suite of modern developer tools, cloud infrastructure, and hackathon sponsor technologies:

| Sponsor / Tool | Category | Role in AUTONEX |
| :--- | :--- | :--- |
| **PayPal** | Financial Gateway | Official Sandbox Orders v2 API, Smart Buttons, and instant payment capture. |
| **APIMatic** | API Tooling | Validates OpenAPI 3.0 specs, enforces API documentation standards, and validates server endpoint contracts. |
| **Postman / Astro** | API Quality | End-to-end API collection test suites, automated health-check testing, and endpoint contract validation. |
| **Render** | Cloud Hosting | Live production hosting of the containerized FastAPI backend service with automated GitHub CI/CD. |
| **Vercel** | Cloud Hosting | High-speed CDN hosting for the Vite/React single-page application. |
| **Zapier** | Automation | Post-purchase webhook integration sending dynamic order confirmation emails with customer names, addresses, and tracking details. |
| **Bryntum** | Logistics UI | Enterprise Gantt timeline and Scheduler for supply chain task dependencies and courier fleet resource allocation. |
| **Elasticsearch** | Observability | Real-time indexing of security logs, authorization events, and faceted catalog search. |
| **Supabase** | Database | Cloud PostgreSQL database persisting user profiles, transaction logs, and delivery destinations. |
| **Channel3** | Commerce AI | Multi-merchant inventory sourcing feed for live product discovery. |
| **AG Grid** | Data Grid | Enterprise interactive ledger rendering financial settlements with column filtering and CSV export. |

---

## 🏗️ System Architecture

```
[ Buyer / Client Browser ] ────────── [ React + Vite Single-Page App ]
                                                 │
                                 HTTPS REST / Webhooks
                                                 ▼
                                     [ FastAPI Backend API ]
                                                 │
        ┌───────────────────────┬────────────────┴───────────────────────┐
        ▼                       ▼                                        ▼
[ PayPal Sandbox v2 ]   [ Google Gemini AI ]                    [ Supabase Postgres ]
  • Create Order          • Autonomous Agent                      • User Accounts
  • Capture Payment       • Policy Invariants                     • Transactions
  • Smart Buttons         • Decision Receipts                     • Saved Addresses
        │
        ├───────────────────────┬────────────────────────────────────────┐
        ▼                       ▼                                        ▼
[ Zapier Webhooks ]     [ Bryntum Logistics ]                   [ Elastic Security ]
  • Dynamic Email Outbox  • Gantt Task Dependencies               • Fraud Observability
  • Courier Triggers      • Dispatch Confirmation                 • Catalog Indexing
```

---

## 🚀 Setup & Installation Instructions

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher
- **Package Managers**: `pip` and `npm`
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/AafiyaSheerin/AUTONEX-AI-.git
cd AUTONEX-AI-
```

---

### Step 2: Configure Environment Variables (`.env`)
Create a `.env` file in the project root:

```env
# PayPal Sandbox Credentials
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_MODE=sandbox

# AI Services
GEMINI_API_KEY=your_gemini_api_key

# Supabase (Optional for cloud database persistence)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Zapier Webhook
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/your_webhook_id/

# Channel3 Multi-Merchant API
CHANNEL3_API_KEY=your_channel3_api_key

# Server Port
PORT=8086
```

---

### Step 3: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn main:app --host 0.0.0.0 --port 8086 --reload
```
The backend API is now running at `http://127.0.0.1:8086`.  
Interactive Swagger documentation is available at `http://127.0.0.1:8086/docs`.

---

### Step 4: Frontend Setup
In a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev -- --port 5173
```
The frontend is now accessible at `http://localhost:5173`.

---

## 🌐 Live Cloud Deployment Links

- **Live Backend API (Render)**: [https://autonex-backend-i28q.onrender.com](https://autonex-backend-i28q.onrender.com)
- **API Documentation (Render Swagger)**: [https://autonex-backend-i28q.onrender.com/docs](https://autonex-backend-i28q.onrender.com/docs)
- **GitHub Repository**: [https://github.com/AafiyaSheerin/AUTONEX-AI-](https://github.com/AafiyaSheerin/AUTONEX-AI-)

---

## 🧪 API Reference & Testing

### Key Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status check. |
| `GET` | `/config` | Public PayPal Client ID & service status. |
| `POST` | `/checkout` | Executes AI agent procurement mission. |
| `POST` | `/payment/create` | Generates a verified PayPal Sandbox Order. |
| `POST` | `/payment/verify` | Captures funds and logs financial settlement. |
| `GET` | `/merchant/bryntum-logistics` | Retrieves Gantt dependency data and orders. |
| `POST` | `/merchant/dispatch-order` | Merchant confirms courier handover & tracking. |
| `GET` | `/zapier/outbox` | View dynamic customer email webhook dispatches. |
| `GET` | `/buyer/purchase-calendar` | Buyer's verified order history and delivery schedule. |

### Automated Testing
Run compliance and fetch route verification:
```bash
python check_fetch.py
```
Run frontend production build verification:
```bash
cd frontend && npm run build
```

---

## 👩‍💻 Author & Acknowledgements

Developed by **Aafiya Sheerin** for the **PayPal Agentic Commerce & AI Payments Hackathon**.  
Special thanks to PayPal, Google Gemini, Render, Zapier, Bryntum, Elastic, Channel3, and the hackathon sponsors for providing the developer tooling and APIs.
