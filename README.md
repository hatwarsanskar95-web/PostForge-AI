# 🚀 PostForge AI 

PostForge AI is a futuristic, AI-powered LinkedIn content generation and personal branding platform. It uses advanced AI models to help professionals create high-quality, engaging content tailored to their unique career profiles, achievements, and case studies.

## ✨ Features

- **Futuristic Orbital Navigation**: A cutting-edge, physics-based interactive dashboard that rotates smoothly and elegantly highlights active features.
- **Secure Authentication**: Email/Password and Google OAuth authentication powered by Supabase, complete with email verification and password reset flows.
- **Creator Suite (6 Core AI Modules)**:
  - 📝 **Post Generator**: Create tailored LinkedIn posts from custom topics.
  - 📈 **Content Improver**: Refine and polish existing drafts for maximum engagement.
  - 🏆 **Achievement Gen**: Turn personal or professional milestones into compelling stories.
  - 💼 **Case Study Forge**: Transform project details into structured, in-depth case studies.
  - 📄 **Resume to Posts**: Extract key highlights from your resume and generate a series of posts.
  - 🖼️ **Image to Post**: Upload an image and generate a context-aware caption/story.
- **Profile Management**: Manage your personal brand identity, LinkedIn URL, and custom avatars.
- **History & Saved Posts**: Automatically track all your generated content, and bookmark your favorites for later use.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 💻 Running the Web Application Locally

Follow these steps to get the project running on your local machine.

### Prerequisites

1. **Node.js**: Ensure you have Node.js installed (v18 or higher recommended).
2. **Supabase Project**: You need a Supabase project set up for the database and authentication.

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd linkdin-genrator
```

### Step 2: Install Dependencies

Using npm:
```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env.local` file in the root of your project directory and add your Supabase connection keys:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4: Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application running. The page will automatically hot-reload as you make changes to the code.

---

## 📁 Project Structure

- `/app`: Next.js App Router pages, layouts, and server actions.
  - `/app/dashboard`: The main futuristic orbital dashboard.
  - `/app/login`: Authentication flows (Sign in, Sign up, Complete Profile).
  - `/app/update-password`: Secure password reset flow.
- `/components`: Reusable UI components.
  - `/components/ui`: Glassmorphism buttons, inputs, and interactive components like `creator-suite-interactive.tsx`.
- `/lib`: Helper utilities and configurations.
  - `/lib/supabase`: Supabase client configurations for browser, server, and middleware.

## 🔒 Security & Privacy

This project implements strict Row Level Security (RLS) policies in Supabase to ensure users can only access their own profiles, history, and saved posts. All authentication is handled securely via Supabase Auth.
