# Bid2Buy 🛒 – Intelligent Auction Platform

**Bid2Buy** is an intelligent digital reselling and auction platform that leverages **Machine Learning**, **predictive bidding models**, and **sentiment analysis** to enhance user experience and improve market efficiency. Users can upload items, bid in real-time, and ensure product authenticity via video verification.

---

## 🚀 Features

- 🎥 Video upload for item verification
- 📊 Real-time bidding using WebSockets
- 🔐 Secure login and authentication (NextAuth)
- 🌐 Custom dashboards for users and admins
- 🧠 ML-driven bidding and sentiment scoring (planned)
- 📱 Responsive UI with filters and real-time feedback

---

## 🛠️ Installation & Setup

### 🧩 Prerequisites

- Node.js (v16+)
- PostgreSQL (or other supported DB)
- Git

---

### 🧱 Step-by-Step Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/bid2buy.git
cd bid2buy
2. Install Dependencies
bash
Copy
Edit
npm install
3. Add .env File
Create a .env file in the root directory with the following variables:

env
Copy
Edit
NEXTAUTH_SECRET=your_secret_here
NODE_ENV=development
DATABASE_URL=your_database_url_here
4. Setup Prisma (Database ORM)
bash
Copy
Edit
npx prisma generate
npx prisma migrate dev --name init
This sets up the database schema and generates the Prisma client.

5. Start the Development Server
bash
Copy
Edit
npm run dev
The app should now be running at http://localhost:3000 (or specified port).

