# Retro Diary OS 💾

A private, lightning-fast personal diary web app styled as a nostalgic desktop file system.

## Features

- **Retro Desktop Environment**: Classic personal-computer UI with 3D bevels, window frames, titlebars, and taskbar with start menu and live clock.
- **Home Screen (Last 7 Days Only)**: Shows diary entries from the last 7 calendar days as desktop icons using the daily doodle artwork as thumbnails. Days without entries are skipped (no blank placeholders). Only queries the 7-day window from Firestore for maximum speed.
- **File Explorer Archive**: Hierarchical lazy-loaded browser:
  ```text
  Diary
  └── 2026
      ├── January
      │   ├── 2026-01-03
      │   ├── 2026-01-08
      │   └── ...
      ├── February
      └── ...
  ```
  Entries in each month are sorted chronologically.
- **Personal Entry Viewer**: Minimalist reading experience styled like personal journal stationery, optimized for readability on mobile and desktop.
- **Rapid Admin Editor**:
  - Drag-and-drop doodle image upload directly from desktop (plus standard file picker fallback).
  - Client-side canvas image resizing and WebP/JPEG compression before upload.
  - Automatic cleanup of old doodles when replaced or when an entry is deleted.
- **Cryptographic Security & Custom Claims**:
  - Unauthenticated users cannot read or write any diary entries.
  - Non-admin authenticated users have read-only access.
  - Admin write permissions are strictly enforced at the database and storage level via Firebase Security Rules inspecting `request.auth.token.admin == true`.
  - Zero admin credentials exposed to the client.

---

## Tech Stack

- **Vite** (Bundler & dev server)
- **TypeScript**
- **Plain CSS** (Zero UI or animation libraries, custom retro design system)
- **Firebase Authentication** (Google Sign-In)
- **Firebase Firestore** (Date-indexed `entries/{YYYY-MM-DD}` documents)
- **Firebase Storage** (Doodle uploads under `doodles/`)

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Firebase project configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

> **Note:** If `.env` is omitted or unconfigured, the app will run in **Interactive Demo Mode** with pre-populated sample entries so you can test the desktop, file explorer, entry viewer, and editor immediately!

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

---

## Setting Up Admin Authorization

1. Download your Firebase Service Account Key JSON from the [Firebase Console](https://console.firebase.google.com/):
   - **Project Settings** → **Service Accounts** → **Generate new private key**.
2. Save the downloaded file as `firebase/serviceAccountKey.json` (this file is ignored by git).
3. Run the admin setup script with the admin user's Google email:

```bash
node firebase/set-admin.js admin@example.com
```

4. Deploy your Firestore and Storage security rules:

```bash
firebase deploy --only firestore:rules,storage:rules
```
