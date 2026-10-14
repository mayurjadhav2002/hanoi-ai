# Project Submission & Overview

Hey there! Thanks for taking the time to review this project.

Here is the complete collaborative document editor built to mirror the core Google Docs experience with real-time multiplayer editing, permission hierarchies, attachments, commenting, file imports, and document exports.

---

## 1. The Source Code & Repository Structure

The project is structured as a full-stack monorepo:

```
assessment/
├── gdocs/                   # Next.js 16 (Turbopack) frontend
│   ├── app/                 # App Router (dashboard, editor, auth, invitations)
│   ├── components/          # TipTap editor, live cursors, comments, avatars, attachments
│   └── lib/                 # API client, Liveblocks client configurations
├── backend/                 # Node.js + Express + TypeScript backend
│   ├── prisma/              # Prisma schema & database migrations (PostgreSQL)
│   └── src/                 # REST endpoints, Liveblocks auth, file conversion & mailer
├── ARCHITECTURE.md          # System architecture and technical breakdown
├── AI_WORKFLOW.md           # Engineering process, AI collaboration, and testing story
├── SUBMISSION.md            # Manifest of included items & deliverables
├── WALKTHROUGH.txt          # Video walkthrough URL and demo guide
└── README.md                # Local setup, environment config, and quick-start guide
```

- **Repository**: [https://github.com/mayurjadhav2002/gdoc-web](https://github.com/mayurjadhav2002/gdoc-web)

---

## 2. README with Local Setup and Run Instructions

The complete step-by-step setup guide is documented in [`README.md`](file:///Users/mayur/Desktop/assessment/README.md).

### Quick Summary:
- **Prerequisites**: Node.js 20+, npm/pnpm.
- **Frontend**: Configured with Next.js 16 (Turbopack), Clerk authentication, and Liveblocks React components. Run `npm install` and `npm run dev` (starts on `http://localhost:3000`).
- **Backend**: Configured with Express, Prisma ORM, Supabase Storage, and Liveblocks Node SDK. Run `npm install`, `npx prisma generate`, and `npm run dev` (starts on `http://localhost:8000`).
- **Database & Storage**: Remote PostgreSQL (Supabase pooler) and Supabase Storage bucket (`attachments`).

---

## 3. Short Architecture Note

The complete architecture specification is available in [`ARCHITECTURE.md`](file:///Users/mayur/Desktop/assessment/ARCHITECTURE.md).

### Highlights:
- **Real-Time Multiplayer Engine**: Liveblocks Yjs provider synchronizing TipTap ProseMirror states with conflict-free replicated data types (CRDTs).
- **Presence & Ephemeral State**: Live presence cursors (`LiveCursors`), real-time `AvatarStack` with connection indicators, and live title broadcast events.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions (`OWNER`, `EDITOR`, `COMMENTER`, `VIEWER`) enforced both in UI toolbar states and at the Express middleware layer.
- **File Conversion & Export Engine**:
  - **Import**: Multi-format converter parsing `.docx` (via Mammoth), `.md`, and `.txt` into editable document nodes.
  - **Export**: Dynamic binary exporters producing formatted `.pdf` (via PDFKit), `.docx` (via docx), and `.md`.
- **Hybrid Invite Delivery**: Real email delivery via Resend with auto-fallback to Ethereal/Nodemailer preview links and direct 1-click shareable invitation links.

---

## 4. AI Workflow Note

Detailed notes on how AI was utilized throughout the build are documented in [`AI_WORKFLOW.md`](file:///Users/mayur/Desktop/assessment/AI_WORKFLOW.md).

### Summary:
- **Architecture Planning**: AI assisted in scoping the dual-tier collaboration system (Yjs document tree for content, Liveblocks room events for ephemeral presence and title sync).
- **Bug Discovery & Rapid Prototyping**: Uncovered nuances with Resend sandbox testing restrictions, Supabase storage bucket auto-provisioning, and TipTap collaborative cursor extensions.
- **Refactoring & Polish**: Integrated loading states, pending operation skeletons, and click-outside dismissal UX across all modals and drawers.

---

## 5. SUBMISSION.md File

A dedicated checklist and deliverables breakdown is available in [`SUBMISSION.md`](file:///Users/mayur/Desktop/assessment/SUBMISSION.md).

---

## 6. Live Product URL

- **Production Deployment**: `https://hanoi-ai-editor.vercel.app` *(or your local host at `http://localhost:3000`)*
- **API Server**: `http://localhost:8000` *(proxied automatically via Next.js rewrites)*

---

## 7. Walkthrough Video URL

A walkthrough video covering the editor in action (creating docs, real-time typing, live cursors, commenting, file imports, folder organization, and exporting) is recorded and linked in:

- [`WALKTHROUGH.txt`](file:///Users/mayur/Desktop/assessment/WALKTHROUGH.txt)

---

## 8. Demo GIF & Setup Screenshots

If you prefer a quick visual walkthrough before launching locally, screenshots and reference assets are organized in the repository:

- **Collaborative Editor**: TipTap editor with floating comment composers, anchored threads, and presence avatars.
- **Export Options**: 1-click downloads for PDF, DOCX, and Markdown formats.
- **Attachments & Sidebar**: Upload drawer with real-time percentage progress bars and download actions.
- **Folder Organization**: Dashboard categorization and folder filtering.
