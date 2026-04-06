# SupportStream - Ticketing System

SupportStream is a comprehensive Customer Support Ticketing System built with the MERN stack (MongoDB, Express, React, Node.js). It features a robust priority engine, ticket status escalation logic, and a dynamic dashboard tailored for efficient support operations.

## Features Let’s Check Against Expected Criteria!

- **Ticket Management (Basic CRUD)**: Create, View, Update, and Delete support tickets effortlessly.
- **Dynamic Counters**: Instantly visualizes Total Tickets, Pending status, and Resolved items.
- **Priority Engine & Highlights**: `Billing` issues marked with `High` urgency are instantly pinned to the top of the table and highlighted with an actionable soft-red background row.
- **Agent Assignment System**: Dedicated interface section on the backend and frontend to lock-in an agent name which automatically switches the status to `Assigned`.
- **Locking Mechanism**: Resolved tickets are hardened. They display a visual lock-warning and strictly prevent accidental edits / reassignments.
- **Automatic Escalation Logic**: Overdue items (> 24 hours) bypass the standard status flow, dynamically flag as `Escalated` inside the database, and trigger a prominent UI warning badge.
- **Timeline Tracker**: Human-readable `"Created 10 minutes ago"` integration utilizing `date-fns`.
- **Responsive Vanilla CSS (Premium Look)**: Built strictly with dynamic Vanilla CSS to generate clean cards, glassy input borders, clear typography, and color-coded status badges preventing generic looks!

## Tech Stack Used
- **Frontend**: React.js with Vite
- **Styling**: Vanilla CSS (No Tailwind)
- **Backend / API**: Node.js, Express.js
- **Database**: MongoDB (Mongoose schemas)

## Setup Steps

### 1. Prerequisites
Ensure you have the following installed on your machine:
- Node.js (v16+)
- MongoDB running locally or a MongoDB Atlas URI

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the backend server (ensure MongoDB is running on port 27017):
   ```bash
   node server.js
   ```
   *The server will start on http://localhost:5000*

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   *The app will launch on http://localhost:5173*

## 4. DB Import (Optional)
We provided a `dump.json` containing the Mongoose Ticket structures. If needed, import it using standard MongoDB GUI tools (like MongoDB Compass) directly into a collection named `tickets` under the `supportstream` database.

## Assumptions Made
1. **Escalation Timeline**: Based on the instruction options, we decided to trigger the escalation status if a ticket remains unresolved for > 24 hours.
2. **Current User / Agent**: For ease of testing, the assignment doesn't require a full login flow, so Admins can manually type any Agent name string to fulfill Assignment tasks.
3. **Database Local**: Our backend defaults to a simple local MongoDB connection URL: `mongodb://127.0.0.1:27017/supportstream`. You can switch it by putting `MONGO_URI` in an `.env` file.
