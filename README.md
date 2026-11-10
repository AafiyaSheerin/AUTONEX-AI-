# 🛡️ Hermora — Autonomous Agentic Commerce Platform
### *The Trust & Logistics Layer for Agentic Commerce, PayPal Payments & Multi-Merchant Logistics*

> **"AI agents can shop for you, but they can't spend beyond your rules or deliver without logistics."**

---

## 📑 Table of Contents
1. [What is Hermora?](#1-what-is-hermora)
2. [Sponsored Technology Implementations (6 Sponsors)](#2-sponsored-technology-implementations-6-sponsors)
3. [Dual-Role Architecture & Experience](#3-dual-role-architecture--experience)
4. [Security Vault & PIN Protection](#4-security-vault--pin-protection)
5. [Delivery & Fulfillment Logistics](#5-delivery--fulfillment-logistics)
6. [Step-by-Step Installation & Runbook](#6-step-by-step-installation--runbook)
7. [Judges' Demonstration Walkthrough](#7-judges-demonstration-walkthrough)
8. [API Reference](#8-api-reference)

---

## 1. What is Hermora?
**Hermora** is an agentic-commerce platform designed for the **PayPal Agentic Commerce & AI Payments Hackathon**. 

It allows users to delegate shopping tasks to an **autonomous AI Buyer Agent** (powered by Google Gemini), while enforcing strict financial and security guardrails:
* **Delegated Monthly Spending Allowance** (default: \$500.00 USD/month with automatic 1st-of-the-month calendar revival).
* **Autonomous Micro-Limit** (\$15.00 USD): Small, everyday items can be purchased automatically without bothering the user.
* **4-Digit Security PIN Authorization (`2007`)**: Any purchase above \$15.00 automatically pauses and requires human PIN authorization before funds are captured.
* **100% PayPal Sandbox Integration**: Executes real server-to-server Order Creation (`/v2/checkout/orders`) and Payment Capture (`/capture`) via PayPal's official REST APIs and Smart Buttons.
* **Live Channel3 Multi-Merchant Discovery**: Connects directly to `https://api.trychannel3.com/v1/search` with live product feeds and merchant stores.
* **Bryntum Logistics & Gantt Hub**: Post-purchase fulfillment dependency planning and courier fleet resource scheduling.
* **Explainable Decision Invoices**: Generates a clean cryptographic invoice explaining *why* an item was selected, payment gateway IDs, and the exact verified **Ship To / Delivery Destination**.

---

## 2. Sponsored Technology Implementations (6 Sponsors)

Hermora integrates **6 official hackathon sponsor tools** to build an enterprise-grade agentic commerce architecture:

| Sponsor Tool | Role & Integration in Hermora | Where to Find It |
| :--- | :--- | :--- |
| **1. PayPal Sandbox** | **Primary Financial Rail**: Connects to PayPal Sandbox v2 Orders & Capture APIs and embeds official PayPal Smart Buttons with vaulted shipping address transmission. | AI Buyer Drawer & Checkout |
| **2. AG Grid** | **Enterprise Financial Ledger**: High-performance interactive data grid rendering all live merchant orders, customer accounts, capture IDs, and 1-click CSV export. | Merchant Hub &rarr; Tab 1 |
| **3. Channel3** | **Live Multi-Merchant Feed**: Live AI agent discovery engine connecting to `api.trychannel3.com/v1/search` with real brands (Adidas, Society of Cloth), live prices, CDN photos, and store links. | Merchant Hub &rarr; Tab 5 |
| **4. Bryntum** | **Gantt & Courier Scheduler**: 5-stage task dependency timeline with automatic cascading delay calculations + multi-courier resource fleet scheduling (DHL, FedEx, Drone). | Merchant Hub &rarr; Tab 6 |
| **5. Elastic** | **Security Observability & Catalog Indexing**: Ingests real-time security events, PIN verification logs, fraud scores, and provides typo-tolerant full-text search. | Merchant Hub &rarr; Tab 4 |
| **6. Zapier** | **Post-Purchase Automation Webhooks**: Automatically dispatches live webhook payloads on PayPal capture to trigger customer email receipts (Gmail), Discord alerts, or Google Sheets rows. | Merchant Hub &rarr; Tab 3 |

---

## 3. Dual-Role Architecture & Experience

### A. 🛍️ Client Boutique & AI Personal Shopper
* **Curated Storefront**: Artisan modest fashion (Abayas 🧕), everyday clothing (Clothes 👕), fine fragrance (🌸), luxury bags, and jewelry.
* **"Shop with AI" Drawer**: Powered by Gemini. Give any prompt (e.g. *"Find me a pure linen shirt under $35 delivered in 2 days."*).
* **Delivery Destination Card**: Shows the pre-authorized vault destination with an inline **`✏️ Change Address`** button to customize delivery for any order.
* **Security PIN & Limits Page**: Set your monthly allowance gauge ($150–$1,000) and change your 4-digit Security PIN (`2007`).

### B. 💼 Merchant Operations Hub
* **Financial Overview**: Live KPI metric cards for Gross Revenue, Instant PayPal Sandbox Payouts, PIN Verification Rate (100%), and active catalog count.
* **AG Grid Ledger**: Full sortable/filterable transaction ledger with CSV export.
* **Inventory Manager**: Add new boutique products directly to the live catalog and search index, with preset category chips and custom emoji/image uploads.
* **Zapier Automations**: Inspect webhook dispatches and test live catch hooks.
* **Elastic Security Logs**: Real-time fraud and payment authorization audit trail.
* **Channel3 Feed**: Live federated multi-merchant discovery feed powered by `trychannel3.com`.
* **Bryntum Logistics Hub**: Gantt task dependency pipeline and multi-courier fleet resource booking.

---

## 4. Security Vault & PIN Protection

Hermora replaces vulnerable or intrusive biometric scanners with a clean, bank-grade **4-Digit Security PIN**:

* **Default PIN:** `2007` (Pre-configured for `demo@hermora.com`).
* **Vault Allowance:** `$500.00 USD` monthly budget with real-time remaining balance tracking.
* **Automatic Monthly Revival:** On the 1st of every month, the spent amount automatically resets to `$0.00` and the full allowance is restored without requiring manual admin intervention.
* **Dynamic Spending Limits:** Users can reconfigure their monthly allowance or update their PIN anytime inside the Security Vault page.

---

## 5. Delivery & Fulfillment Logistics

In autonomous commerce, users do not fill out long shipping forms. Instead:
1. **Pre-Authorized Vault Destination:** The user's registered delivery address is loaded directly from their profile:
   * **Recipient:** `Aafiya Sheerin`
   * **Address:** `42 Luxury Promenade, Suite 4B, Dubai Marina`
   * **Phone:** `+971 50 123 4567`
2. **In-Drawer Customization:** In the AI Buyer Drawer, users can click **`✏️ Change Address`** to enter a custom destination for any specific order.
3. **PayPal Vault Integration:** The verified shipping address is attached to the PayPal transaction payload so merchants can print shipping labels automatically.
4. **Clean Invoice Printing:** The decision receipt modal prints an official invoice containing the item details, payment gateway reference, and **Ship To / Delivery Destination**.

---

## 6. Step-by-Step Installation & Runbook

### Prerequisites
* **Python:** 3.10 or higher
* **Node.js:** v18 or higher (with npm)
* **OS:** Windows / macOS / Linux

### Environment Setup (`.env`)
Ensure `.env` in the project root contains:
```env
# PayPal Sandbox Credentials
PAYPAL_CLIENT_ID=BAA21NIAHiC0yfZ1O-7kestyMCNZUkkbtXq530D7FpEvManBb9IdYd2m5-wtwLyK4HDhD_ZTseoGKEBTzc
PAYPAL_CLIENT_SECRET=EI0pTyMduLSScdcg94kzzVOq9Q_kVQVAt3zzrBHSCs8wq1ogwhRywU9gJFij6A9KgIAlYWwB7_a_cd_Q
PAYPAL_MODE=sandbox

# Gemini AI Key
GEMINI_API_KEY=your_gemini_api_key

# Channel3 Live API Key
CHANNEL3_API_KEY=m9e7BYShHw1XySZyN2Ssc7pnLDpDSOkG5ESSnubf

# Zapier Webhook (Optional)
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/29381166/49ncwqi/
```

### Launching the Application

1. **Start Backend Server:**
   ```powershell
   cd c:\Hermora\aegiscart-ai-main
   python -m uvicorn backend.main:app --port 8086 --reload
   ```
   *Runs on `http://127.0.0.1:8086` (Swagger docs at `http://127.0.0.1:8086/docs`)*

2. **Start Frontend Client:**
   ```powershell
   cd c:\Hermora\aegiscart-ai-main\frontend
   npm run dev
   ```
   *Runs on `http://localhost:5173`*

---

## 7. Judges' Demonstration Walkthrough

Follow these steps for a complete evaluation:

1. **Storefront & Catalog:**
   * Open `http://localhost:5173/`.
   * Click the **`👕 Clothes`** category chip and inspect items like the *Classic Linen Shirt ($28.00)*.
2. **AI Buyer Delegation & PIN Check:**
   * Click **"✨ Ask AI to Buy"** on any item.
   * View the **📍 Delivery Destination** card and click **`✏️ Change Address`** to see inline address customization.
   * Click **"Enter PIN to Authorize"** ➔ enter `2007`.
   * Complete payment using the PayPal Sandbox Smart Button.
   * Click **"📄 View Agent Decision Receipt"** to view the clean invoice with the delivery destination.
3. **Merchant Operations & AG Grid:**
   * Click **"💼 Merchant Hub"** in the top navbar.
   * Tab 1 (**AG Grid Financial Ledger**): Sort by amount, filter rows, and click **"Export AG Grid CSV"**.
4. **Channel3 Live Multi-Merchant API:**
   * Tab 5 (**Channel3 AI Shopping Feed**): See the green **`🟢 Live API Active`** badge and search `running shoes` or `saree` to inspect live external items from Adidas, Society of Cloth, etc.
5. **Bryntum Logistics Hub:**
   * Tab 6 (**Bryntum Logistics Hub**):
     * **Gantt View:** Click **`⚡ Simulate +1 Day Artisan Delay`** to demonstrate automatic cascading dependency shifts across downstream courier and delivery dates.
     * **Scheduler View:** Click **`🚚 Courier Resource Scheduler`** and reassign an order to the **Same-Day Drone** fleet.

---

## 8. API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/catalog` | `GET` | Returns all boutique products with categories and emojis |
| `/merchant/products` | `POST` | Adds a new luxury item to catalog and indexes in Elastic |
| `/merchant/transactions` | `GET` | Fetches settled order records for the AG Grid ledger |
| `/merchant/bryntum-logistics` | `GET` | Supplies Gantt tasks, dependencies, and courier resources |
| `/channel3/discover?q=` | `GET` | Queries Channel3 live multi-merchant product feed |
| `/channel3/status` | `GET` | Returns Channel3 configuration and API health |
| `/channel3/config` | `POST` | Dynamically updates the Channel3 API key |
| `/elastic/search?q=` | `GET` | Fuzzy full-text search across catalog |
| `/elastic/security-events` | `GET` | Retrieves real-time security audit events |
| `/zapier/test-webhook` | `POST` | Triggers a test payload to Zapier webhook |
| `/auth/verify-pin` | `POST` | Validates user 4-digit Security PIN (`2007`) |
| `/payment/create` | `POST` | Initiates PayPal Sandbox order capture |
| `/payment/verify` | `POST` | Finalizes PayPal payment and updates user allowance |
