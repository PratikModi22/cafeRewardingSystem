# ☕ Cozy Café Loyalty & WhatsApp Marketing Portal
<img width="1303" height="858" alt="image" src="https://github.com/user-attachments/assets/c66d1c94-3952-47c6-984f-37bebd66cbdf" />

Welcome to the **Cozy Café Loyalty & WhatsApp Marketing Portal**, a boutique customer relationship management (CRM) and rewards system designed for modern independent coffee shops. 

Built with a warm, aesthetic color palette of **Pista Green, Cream Beige, and Elegant Gold**, this web portal lets café merchants reward customer visits, manage menus, and drive repeat visits via automated outreach campaigns.

---

## 🎨 Design System & Aesthetic Theme

The user interface is designed to reflect the organic, cozy, and high-end feel of boutique specialty coffee houses:
*   **Warm Beige Backgrounds** (`#f7f5ee`): Gentle on the eyes, replacing generic dark themes with a cozy bookstore/café vibe.
*   **Aesthetic Forest Green Sidebar** (`#273c2f`): A rich forest green menu board with light pistachio text highlights.
*   **Gold Accents** (`#b89349`): Elegant metallic gold active indicators, milestones, and primary buttons.
*   **Hand-Drawn Cafe Doodles:** Cute sketches of coffee mugs, croissants, and indoor plants integrated into split-screen banners.

---

## 🚀 Core Features

### 1. WhatsApp Template Marketing Tab

<img width="1880" height="1027" alt="image" src="https://github.com/user-attachments/assets/9d546104-4ee4-4dfa-8f5f-f741e81d88c7" />

A complete suite for customer re-engagement:
*   **Audience List Segmenter:** Create target customer groups based on manual selections or pre-built smart filters (e.g., *Active regulars*, *Inactive users*, *Eligible for rewards*).
*   **Template Manager:** Compose template messages with simple variable insertion triggers like `{list.name}`, `{current_progress}`, `{reward_name}`, and `{cafe_name}`.
*   **Live Mobile Preview:** A CSS-styled mockup of a smartphone displaying your formatted text in a WhatsApp chat bubble, resolving variables dynamically in real-time.
*   **Campaign Wizard:** Input campaign details and launch message broadcasts. Displays a live progress meter and a real-time terminal log showing dispatch success or failures.
*   **Meta Cloud API Integration:** Sends messages directly via the WhatsApp Business API when credentials are provided.
*   **Simulated Sandbox Fallback:** Automatically falls back to using `localStorage` simulation if your database tables have not yet been migrated. This lets you test all marketing, template, and wizard flows immediately.

### 2. Cafe Secrets Setup (Settings Tab)
<img width="1875" height="727" alt="image" src="https://github.com/user-attachments/assets/a6337016-7a5a-4876-aa9d-ac2523a89bd9" />

Cafe owners can configure their Meta API details:
*   **Meta Graph API Token:** Masked password field for your System User Access Token.
*   **Sender Phone Number ID:** The source WhatsApp account ID.
*   **Business Account ID (Optional):** Meta Business Suite mapping.

### 3. Customer Directory & Loyalty Card Generator
<img width="1897" height="724" alt="image" src="https://github.com/user-attachments/assets/bfa49a3b-fc68-43df-9cc8-ab670c3f0b1b" />

*   **Loyalty Cards:** Generates a printable onboarding QR code and registration link for cafe counters.
*   **Check-in Log:** Automatically increments visit milestones, logs billing transactions, and records reward redemptions.

### 4. Interactive Menu Builder
<img width="1892" height="658" alt="image" src="https://github.com/user-attachments/assets/4ea4b607-3d34-49d8-9809-09ce9684f06e" />

*   Interactive panel to customize food & beverage categories and individual items (name, description, pricing) shown to customers.

---

## 🛠️ Technology Stack

*   **Frontend Library:** React 19 (SPA)
*   **Language:** TypeScript
*   **Bundler & Dev Server:** Vite
*   **Styling:** Tailwind CSS v4 & custom HSL CSS color systems
*   **Backend Database & Auth:** Supabase (Auth, RLS Policies, SQL Queries)
*   **Icons:** Lucide React

---

## 📂 Project Structure

```bash
├── whatsapp_marketing_tables.sql  # SQL Database Migrations
├── web-ordering/                  # React Front-end Workspace
│   ├── public/                    # Static Assets (Doodle images, icons)
│   ├── src/
│   │   ├── components/            # Shared layouts, Sidebar navigations
│   │   ├── hooks/                 # Auth contexts and helpers
│   │   ├── pages/                 # Marketing, Settings, Customers, Menu
│   │   ├── services/              # Supabase Client initializations
│   │   ├── types/                 # TypeScript interfaces
│   │   ├── main.tsx
│   │   └── index.css              # Color theme styles & Tailwind overrides
│   ├── package.json
│   └── vite.config.ts
└── README.md                      # Documentation
```

---

## 💻 How to Get Started

### 1. Database Schema Migration
To support templates, segments, campaigns, and campaign logs, run the SQL script on your Supabase instance:
1. Open your **Supabase Dashboard**.
2. Go to the **SQL Editor** tab.
3. Paste the contents of [`whatsapp_marketing_tables.sql`](file:///d:/Cafe%20Rewarding%20System/whatsapp_marketing_tables.sql).
4. Click **Run**.

*(Note: If you run the frontend without migrating the database, the portal will automatically activate **Sandbox Mode** using local storage fallback).*

### 2. Setup the Web Application
Navigate to the frontend directory and install dependencies:
```bash
cd web-ordering
npm install
```

### 3. Run the Development Server
Start the local server to run the application in the dev environment:
```bash
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** (or the alternative port printed in the terminal) in your browser.

---


