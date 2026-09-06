# ProTask — Modern Full-Stack Kanban & Task Management Platform

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB / Mongoose](https://img.shields.io/badge/MongoDB-Mongoose%209-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-orange)](https://github.com/pmndrs/zustand)

**ProTask** is a production-ready, full-stack visual task management and workflow orchestration application built with React 19, TypeScript, Node.js, Express, and MongoDB. It provides an intuitive, high-performance Kanban experience featuring drag-and-drop columns, rich task cards with checklist subtasks, multi-board workspaces, instant productivity metrics, and secure JWT-based authentication.

---

## 📑 Table of Contents

- [Core Features](#-core-features)
- [System Architecture & Tech Stack](#-system-architecture--tech-stack)
- [Design Philosophy & UI/UX](#-design-philosophy--uiux)
- [Directory Structure](#-directory-structure)
- [REST API Reference](#-rest-api-reference)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Environment Configuration](#-environment-configuration)
- [Database Resilience Strategy](#-database-resilience-strategy)
- [Scripts Reference](#-scripts-reference)

---

## 🚀 Core Features

### 1. Interactive Drag-and-Drop Kanban Board
- **Smooth DnD Interactions**: Powered by `@hello-pangea/dnd` for fluid task reordering within the same column and cross-column transitions.
- **Optimistic State Updates**: UI updates instantly upon drop while persisting changes asynchronously to MongoDB in the background.
- **Dynamic Columns**: Add custom workflow stages (e.g., *Backlog*, *In Progress*, *Review*, *Completed*), rename column headers inline, and delete empty columns.

### 2. Multi-Board Workspace Switcher
- **Multiple Isolated Workspaces**: Create dedicated boards for different projects or teams.
- **Board Switcher Drawer**: A slide-out drawer accessible from the sidebar and header to quickly switch between boards, see task counts, or create new boards with starter templates.
- **Board Operations**: Inline board renaming, column customization, and protected deletion (with safeguard preventing accidental deletion of the last remaining board).

### 3. Rich Task Cards & Lifecycle Management
- **Priority Categorization**: Color-coded badges for **Urgent**, **High**, **Medium**, and **Low** priorities.
- **Due Dates & Deadlines**: Calendar picker with dynamic overdue warnings and formatted dates.
- **Custom Tags**: Color-coded tags (e.g., *Frontend*, *API*, *Bug*, *Feature*) for rapid categorization.
- **Detailed Task Modal**: Full editing dialog for title, description, priority, due date, tags, and checklist subtasks.

### 4. Interactive Subtask Checklists
- **Micro-Progress Tracking**: Add nested subtasks to any task card.
- **Dynamic Progress Bar**: Visual completion percentage calculated in real time.
- **Quick-Toggle**: Check off items directly from the task card or inside the task modal.

### 5. Instant Filtering & Sorting Controls
- **Real-Time Text Search**: Filter tasks by title or description as you type.
- **Priority Filtering**: Narrow down boards to specific priority tiers.
- **Tag Filtering**: Filter cards by specific labels.
- **Smart Sorting**: Order tasks by creation date, alphabetically, or by upcoming due date.

### 6. User Profile & Productivity Analytics
- **Personalized Metrics Modal**: View account details (name, email, member since date) alongside productivity statistics:
  - Total workspaces owned
  - Total tasks created
  - Completed tasks with completion rate (%)
  - In-progress tasks
  - Urgent/high-priority task tally
- **Live Profile Editor**: Update display name and email with validation.
- **Dedicated Sign-Out**: Clear separation between profile management and logout actions.

### 7. Dual-Mode Authentication & Demo Access
- **JWT & Bcrypt Security**: Industry-standard authentication flow with hashed passwords and Bearer tokens.
- **1-Click Instant Demo Login**: Test drive all features instantly with pre-seeded boards and demo data without manual registration.

---

## 🛠️ System Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                         │
│   React 19 + TypeScript + Tailwind CSS v4 + Zustand Store   │
│            @hello-pangea/dnd (Drag-and-Drop)                │
└──────────────────────────────┬──────────────────────────────┘
                               │  REST API (JSON / Bearer JWT)
┌──────────────────────────────▼──────────────────────────────┐
│                    Express Backend Server                   │
│   Vite Dev Middleware (Dev) / Static Dist Serving (Prod)    │
│   Auth Middleware (JWT Verify) + Input Validation           │
└──────────────────────────────┬──────────────────────────────┘
                               │  Mongoose ODM
┌──────────────────────────────▼──────────────────────────────┐
│                      MongoDB Database                       │
│     Real MongoDB Atlas / Local URI (Primary)                │
│     Automatic Fallback: In-Memory MongoDB Server (Zero-Conf)│
└─────────────────────────────────────────────────────────────┘
```

### Technology Breakdown

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 | Declarative, component-driven UI with modern hooks |
| **Language** | TypeScript 5.8 | End-to-end type safety across client and server |
| **Styling** | Tailwind CSS v4 | Modern, utility-first CSS engine with zero-runtime overhead |
| **State Management** | Zustand 5 | Lightweight, boilerplate-free state store with persistence |
| **Drag & Drop** | `@hello-pangea/dnd` | Accessible and touch-compatible drag-and-drop system |
| **Icons** | Lucide React | Clean, consistent SVG icon set |
| **Server Framework** | Express 4.21 | Robust Node.js web and API server |
| **Database & ODM** | MongoDB + Mongoose 9 | Document database with schema enforcement |
| **Security & Auth** | JSON Web Tokens & bcryptjs | Token-based auth with salted password hashing |
| **Bundler & Tooling** | Vite 6 + esbuild + tsx | Instant HMR development and optimized production bundles |

---

## 🎨 Design Philosophy & UI/UX

ProTask adheres to a **modern, high-contrast dark theme** engineered for deep focus and productivity:

- **Surface Palette**: Pure `#09090b` canvas with `#0d0d0f` and `#121216` layered surface cards, providing subtle depth without visual clutter.
- **Accent Glow**: Rich Indigo (`#4f46e5` / `#6366f1`) accents and ambient radial gradients for active states, badges, and focus rings.
- **Status Semantics**:
  - 🟢 **Emerald**: Completed status, healthy database connectivity, high completion rates.
  - 🟡 **Amber**: Medium priority, in-progress stages, pending tasks.
  - 🔴 **Rose**: Urgent/high priority, overdue deadlines, critical alerts.
  - 🔵 **Indigo / Sky**: Standard workflows, active boards, informational badges.
- **Typographic Hierarchy**: High-contrast, clean sans-serif typography with monospace accents for IDs and technical counters.
- **Responsive Layout**: Designed desktop-first for wide multi-column Kanban workflows, with collapsible sidebars and responsive touch targets for tablet and mobile devices.

---

## 📁 Directory Structure

```text
├── metadata.json              # App metadata and permissions
├── package.json               # Dependencies and build scripts
├── server.ts                  # Express server entry point & Vite middleware
├── tsconfig.json              # TypeScript root configuration
├── vite.config.ts             # Vite bundler configuration
│
├── src/                       # Frontend source code
│   ├── main.tsx               # Client React entry point
│   ├── App.tsx                # Main application frame & navigation
│   ├── index.css              # Global styles & Tailwind CSS v4 import
│   ├── components/
│   │   ├── LiveBoard.tsx      # Core Kanban board container with filter bar
│   │   ├── KanbanColumn.tsx   # Droppable column with task cards & inline add
│   │   ├── TaskCard.tsx       # Draggable task card with subtasks & badges
│   │   ├── TaskModal.tsx      # Comprehensive task creation & edit dialog
│   │   ├── BoardDrawer.tsx    # Slide-over multi-board switcher drawer
│   │   └── UserProfileModal.tsx # Profile editor & productivity statistics modal
│   ├── store/
│   │   └── kanbanStore.ts     # Central Zustand state store & API integrations
│   └── types/
│       └── kanban.ts          # Shared TypeScript interfaces (User, Board, Column, Task)
│
└── server/                    # Backend API & Database layer
    ├── db/
    │   └── connect.ts         # Mongoose connection with in-memory fallback
    ├── models/
    │   ├── User.ts            # Mongoose schema for user accounts
    │   ├── Board.ts           # Mongoose schema for boards
    │   ├── Column.tsx         # Mongoose schema for workflow columns
    │   └── Task.ts            # Mongoose schema for tasks & subtasks
    ├── middleware/
    │   └── auth.ts            # Bearer JWT verification middleware
    └── routes/
        ├── auth.routes.ts     # Auth endpoints (login, register, me, stats, profile)
        ├── board.routes.ts    # Board CRUD endpoints
        ├── column.routes.ts   # Column management and ordering endpoints
        └── task.routes.ts     # Task CRUD, move/reorder, and subtask routes
```

---

## 📡 REST API Reference

All protected endpoints require the `Authorization: Bearer <token>` header.

### 🔑 Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Create a new user account with default starter board | No |
| `POST` | `/api/auth/login` | Authenticate with email & password | No |
| `GET` | `/api/auth/me` | Fetch active user credentials and profile data | **Yes** |
| `PUT` | `/api/auth/profile` | Update user display name or email address | **Yes** |
| `GET` | `/api/auth/stats` | Fetch aggregated task & workspace productivity metrics | **Yes** |

### 📋 Boards (`/api/boards`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/boards` | List all boards owned by the authenticated user | **Yes** |
| `POST` | `/api/boards` | Create a new board (optional starter columns) | **Yes** |
| `GET` | `/api/boards/:id` | Fetch a board by ID with its columns and tasks | **Yes** |
| `PUT` | `/api/boards/:id` | Update board title or description | **Yes** |
| `DELETE` | `/api/boards/:id` | Delete a board and all associated columns and tasks | **Yes** |

### 🗂️ Columns (`/api/columns`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/columns` | Create a new column in a board | **Yes** |
| `PUT` | `/api/columns/:id` | Rename a column | **Yes** |
| `DELETE` | `/api/columns/:id` | Delete a column and its tasks | **Yes** |
| `PUT` | `/api/columns/reorder` | Update column display order | **Yes** |

### ✅ Tasks (`/api/tasks`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/tasks` | Create a new task in a specified column | **Yes** |
| `PUT` | `/api/tasks/:id` | Update task details (title, priority, due date, etc.) | **Yes** |
| `DELETE` | `/api/tasks/:id` | Delete a task | **Yes** |
| `PUT` | `/api/tasks/:id/move` | Move task to a different column or reorder positions | **Yes** |
| `POST` | `/api/tasks/:id/subtasks` | Add a new subtask checklist item | **Yes** |
| `PATCH` | `/api/tasks/:id/subtasks/:subtaskId` | Toggle subtask completion status | **Yes** |
| `DELETE` | `/api/tasks/:id/subtasks/:subtaskId` | Remove a subtask checklist item | **Yes** |

### 🩺 System Health (`/api/health`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Check API and MongoDB connection status | No |

---

## ⚡ Getting Started & Local Setup

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- *(Optional)* A running MongoDB instance or MongoDB Atlas connection string (an in-memory MongoDB fallback is built-in if no URI is supplied).

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd protask

# Install project dependencies
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):
```bash
cp .env.example .env
```

Set your configuration values:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here
MONGODB_URI=mongodb://localhost:27017/protask
```
> *Note: If `MONGODB_URI` is omitted or points to an unavailable server, ProTask will automatically spin up an embedded in-memory MongoDB instance for instant zero-configuration development.*

### 3. Start Development Server
```bash
npm run dev
```

The application will be accessible at:
- **Local Application:** [http://localhost:3000](http://localhost:3000)
- **API Health Endpoint:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 🔒 Database Resilience Strategy

ProTask is architected for zero-downtime development and resilience:

1. **Primary Connection**: Attempts connection to `process.env.MONGODB_URI` (such as MongoDB Atlas or local MongoDB).
2. **Automated Fallback**: If the URI is missing, unreachable, or times out, the backend automatically provisions an ephemeral in-memory database using `mongodb-memory-server`.
3. **Seed Reliability**: Automatically provisions starter boards and demo tasks so developers and users can start testing immediately without manual database setup.

---

## 📜 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| **`npm run dev`** | `tsx server.ts` | Starts the Express server with Vite middleware in development mode |
| **`npm run build`** | `vite build && esbuild server.ts ...` | Compiles client assets and bundles `server.ts` into `dist/server.cjs` |
| **`npm start`** | `node dist/server.cjs` | Runs the compiled production server |
| **`npm run lint`** | `tsc --noEmit` | Runs the TypeScript compiler to check for type errors |
| **`npm run clean`** | `rm -rf dist server.js` | Cleans up build output artifacts |

---

## 📄 License

This project is licensed under the MIT License. Feel free to use, modify, and distribute it for personal or commercial projects.
