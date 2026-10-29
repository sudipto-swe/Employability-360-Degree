# Employability 360°

> AI-Powered Job Portal for Bangladesh — Built with Next.js 16, Supabase, Prisma 6, Google Gemini AI, and SSLCommerz.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in your Supabase, Google, and SSLCommerz credentials

# 3. Generate Prisma client
npx prisma generate

# 4. Push schema to database
npx prisma db push

# 5. Seed initial data (job categories)
npm run db:seed

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗 Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router, Turbopack) |
| **UI** | shadcn/ui + Tailwind CSS 4 |
| **Database** | Supabase PostgreSQL + pgvector |
| **ORM** | Prisma 6 |
| **Auth** | NextAuth v5 (JWT, Edge-compatible) |
| **AI** | Google Gemini 2.0 Flash + text-embedding-004 |
| **Payments** | SSLCommerz (BDT) |
| **Validation** | Zod |

---

## 📄 Pages (20)

### Public
- `/` — Landing page
- `/login` — Authentication
- `/register` — Role-based registration
- `/jobs` — Job browsing with search/filters
- `/jobs/[id]` — Job detail

### Job Seeker Dashboard
- Dashboard, Applications, CV Builder (AI), Interview Coach (AI), Profile, Saved Jobs, Messages

### Recruiter Dashboard
- Dashboard, Post Job, My Jobs, Candidates, Pipeline, Messages, Analytics, Subscription

---

## 🔌 API Routes (16)

- **Auth**: NextAuth + credentials registration
- **Jobs**: Full CRUD with search/filter/pagination
- **Applications**: Apply, check status, toggle save
- **AI**: Resume parsing, CV generation, interview questions + evaluation
- **Payments**: SSLCommerz session init + callbacks
- **Profile**: Upsert for both roles

---

## 🤖 AI Features

| Feature | Model | Description |
|---------|-------|-------------|
| Resume Parser | Gemini 2.0 Flash | Extracts skills, experience, education from PDFs |
| CV Builder | Gemini 2.0 Flash | Generates professional summaries and bullet points |
| Interview Coach | Gemini 2.0 Flash | Role-specific questions + answer evaluation with scoring |
| Job Matching | text-embedding-004 | pgvector cosine similarity for AI-powered job recommendations |

---

## 💳 Payment (SSLCommerz)

- **Free**: 3 jobs, basic features
- **Premium** (৳999/mo): 25 jobs, AI matching, featured listings
- **Enterprise** (৳2,499/mo): Unlimited, API access, team collaboration

---

## 🛠 Scripts

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build
npm run lint       # ESLint
npm run type-check # TypeScript check
npm run db:push    # Push schema to DB
npm run db:seed    # Seed categories
npm run db:studio  # Prisma Studio GUI
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (main)/         # Main layout (public + dashboard)
│   │   ├── dashboard/  # Role-based dashboards
│   │   └── jobs/       # Job listing & detail
│   ├── api/            # API routes
│   ├── login/          # Auth pages
│   └── register/
├── components/
│   ├── layout/         # Sidebar, Topbar
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── ai/             # Gemini integration
│   ├── payments/       # SSLCommerz
│   ├── auth.ts         # NextAuth config
│   ├── prisma.ts       # DB client
│   └── validators.ts   # Zod schemas
└── middleware.ts       # Route protection
```

---

## 📜 License

MIT © Employability 360°
