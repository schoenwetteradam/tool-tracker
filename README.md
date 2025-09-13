# 🔧 Tool Change Tracker

A Next.js and Supabase application for recording and analyzing CNC tool changes.

## 📦 Setup

1. **Install dependencies**
   ```bash
   npm install
   ```
   > If installation fails for scoped packages, ensure access to the public npm registry.

2. **Environment variables**
   Create a `.env.local` based on `.env.example` with your Supabase credentials.

   If you encounter authorization errors (HTTP 401) when saving a tool change, double-check that `NEXT_PUBLIC_SUPABASE_URL`
   and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly and the keys have the necessary permissions.

3. **Run locally**
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema
Run these SQL commands in Supabase to create tables:

```sql
-- Main tool changes table
CREATE TABLE tool_changes (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  shift INTEGER,
  operator VARCHAR(100),
  supervisor VARCHAR(100),
  work_center VARCHAR(50),
  machine_number VARCHAR(50),
  operation VARCHAR(100),
  part_number VARCHAR(100),
  job_number VARCHAR(100),
  tool_type VARCHAR(50),
  old_tool_id VARCHAR(100),
  new_tool_id VARCHAR(100),
  tool_position VARCHAR(50),
  insert_type VARCHAR(50),
  insert_grade VARCHAR(50),
  first_rougher_change_reason VARCHAR(100),
  finish_tool_change_reason VARCHAR(100),
  change_reason VARCHAR(100),
  old_tool_condition VARCHAR(50),
  pieces_produced INTEGER,
  cycle_time DECIMAL(10,2),
  dimension_check VARCHAR(100),
  surface_finish VARCHAR(100),
  notes TEXT
);
```

## 🚀 Deployment

The app is ready for deployment on Vercel. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your Vercel project settings.

## 📚 Advanced Features

API endpoints are provided for basic tool change operations and cost analysis. Additional utilities for predictive analytics are available in `lib/analytics.js`.

---

Legacy static files (`index.html`, `qr-generator.html`, `google-apps-script.js`) remain for reference.
