# Department Inventory Management System

A role-based inventory management web application for managing departmental equipment, supplies, student issues, returns, and renewals. The project is built with React and Vite and currently uses browser local storage with seeded demo data.

## Features

### Administrator / Inventory Coordinator
- **Dashboard** — overview of inventory and issue activity.
- **Inventory management** — add, edit, search, and filter inventory items by category and tracking type.
- **Asset tracking** — manage individually tracked assets and their condition/status.
- **Student records** — maintain student inventory-borrowing records.
- **Issue and return workflow** — issue items to registered students and record full or partial returns.
- **Renewal approvals** — review and approve or reject student renewal requests.
- **Overdue tracking** — identify issues past their due dates.
- **Transactions and stock adjustments** — record inventory operations and changes with reasons.
- **Reports** — access inventory and circulation summaries.

### Student
- **Personal dashboard** — view current issues, returned items, overdue items, and renewal requests.
- **Issue details** — check issued items, outstanding quantities, and due dates.
- **Renewal requests** — request an extension for eligible active issues and track its status.

### Inventory rules
- Supports **quantity-based items** and **individually tracked assets**.
- Checks available stock before issuing items.
- Prevents duplicate item codes, asset tags, and student enrolment numbers.
- Tracks item condition, outstanding quantities, due dates, and transaction history.
- Uses role-protected routes for the administrator and student sections.

## Tech Stack

- **Frontend:** React
- **Build tool / development server:** Vite
- **Routing:** React Router
- **Icons:** Lucide React
- **Date utilities:** date-fns
- **State management:** React Context API
- **Demo persistence:** Browser `localStorage`

> **Note:** This repository currently contains a frontend demo using seeded mock data and local storage. It does not currently connect to a production database or authentication server. Client-side role checks are suitable for demonstrating the UI, but they are not a security boundary for a deployed system. A production deployment should use server-side authentication, authorization, and database policies (for example, Supabase with PostgreSQL and Row Level Security).

## Getting Started

### Prerequisites
- Node.js (a current LTS release is recommended)
- npm

### 1. Clone the repository

```bash
git clone https://github.com/srijita-mondal/department-inventory-management.git
cd department-inventory-management
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal (commonly `http://localhost:5173`).

### 4. Create a production build

```bash
npm run build
```

To preview the build locally:

```bash
npm run preview
```

## Project Structure

```text
department-inventory-management/
├── assets/                 # Static assets
├── components/
│   ├── admin/              # Admin dashboard and inventory workflows
│   ├── auth/               # Login page
│   ├── layout/             # Shared layout and protected routes
│   └── student/            # Student portal pages
├── context/
│   ├── AuthContext.jsx     # Demo authentication state
│   ├── StoreContext.jsx    # Inventory state and business rules
│   └── ToastContext.jsx    # Toast notifications
├── data/
│   └── mockData.js         # Seed/demo records
├── styles/
│   └── global.css          # Shared application styles
├── utils/
│   └── csv.js              # CSV utility functions
├── App.jsx                 # Routes and providers
├── App.css                 # App-specific styles
├── index.css               # Base styles
├── index.html              # HTML entry point
├── main.jsx                # React entry point
├── package.json
└── README.md
```

## Data and Persistence

The app initializes from sample records in `data/mockData.js`. Changes are stored in the browser's local storage under the key `nfsu_ih_store_v1`; therefore, the demo data is local to the browser and device. Clearing browser storage resets the app to the initial sample state.

No production credentials or environment variables are required for the current demo.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |

## Future Improvements

- Integrate a backend and PostgreSQL database.
- Add server-validated authentication and role-based authorization.
- Introduce database-level constraints and audit logging.
- Add automated tests for issue, return, and renewal workflows.
- Deploy the application and document demo access securely.

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes with a clear message.
4. Push the branch and open a pull request.

## Author

**Srijita Mondal**

- GitHub: [@srijita-mondal](https://github.com/srijita-mondal)

---

If you find this project useful, consider giving the repository a star.
