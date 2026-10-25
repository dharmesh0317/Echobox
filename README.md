# EchoBox

EchoBox is a full-stack campus community platform built with MongoDB, Express, React, and Node.js. Students and campus staff can share actionable feedback, ideas, discussions, and campus moments, then support, comment on, and follow the posts that matter to them.

## Features

- Anonymous-style campus feedback posts across categories like `Student Life`, `Teacher`, `Event`, and `Facility`
- User registration and login
- Campus registration details (role, department/program, and student year)
- Signed-in user and administrator permissions enforced by the backend
- Account profile photo saved to the user's account
- Profile email and password editing
- Upvotes, downvotes, comments, and reporting
- Up to five resized JPEG images attached to a feedback post
- Authors can edit their own feedback and attached images; administrators can edit any post
- Four post types: actionable feedback, ideas, discussions, and campus moments
- Admin progress statuses appear only on actionable feedback and ideas
- Dedicated polls and optional idea polls with anonymous voting, community reactions, and comments
- Anonymous, campus-alias, or profile attribution per post
- Topic tags, topic follows with notifications, and saved posts
- Feed filters by post type and topic, plus weekly community highlights
- Feedback progress labels (submitted, under review, planned, resolved) with a public update history
- Public administrator replies and updates on feedback
- Followed suggestions with in-app notifications for status changes, replies, and comments
- Feed sorting by newest, oldest, most upvoted, or most discussed
- Persistent light and dark themes
- Keyboard-friendly controls, visible focus states, and reduced-motion support
- Custom EchoBox logo and matching browser icon
- Updated sign-in and registration forms with accessible labels and password visibility control
- Report reasons and moderation review history
- Admin report queue with status/reason filters, per-report reject/actioned decisions, and moderation history
- Admin feedback search and category filters, with six-month activity trends
- Responsive mobile category navigation and explicit loading, error, and empty states
- Backend validation tests using Node's built-in test runner
- Automatic backend seeding for starter feedback data and a default admin user

## Project Structure

```text
EchoBox/
|-- backend/
|   |-- models/
|   |-- routes/
|   |-- seed.js
|   |-- seedAdmin.js
|   `-- server.js
|-- frontend/
|   |-- src/
|   `-- package.json
`-- README.md
```

## Prerequisites

- For local development: Node.js 20.19 or newer (or Node.js 22.12 or newer), npm, and MongoDB
- For Docker Compose: Docker Desktop or Docker Engine with the Compose plugin

## Run with Docker Compose

Docker Compose runs MongoDB, the Express API, and a production-built React frontend served by Nginx. The frontend proxies `/api` requests to the backend, so the browser uses the same origin for the app and API.

1. Install Docker Desktop (or Docker Engine with the Compose plugin).
2. Create the root `.env` file from the example:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Edit `.env` and replace `JWT_SECRET` with a private random secret of at least 32 bytes and `ADMIN_PASSWORD` with a strong password.
4. From the project root, build and start the services:

   ```bash
   docker compose up --build
   ```

Open the app at `http://localhost:8080`. The API is also available directly at `http://localhost:5000/api`. MongoDB data is persisted in the `mongo_data` Docker volume. Stop the services with `docker compose down`; the volume is kept for the next run.

The first backend start creates the configured admin account and seeds starter feedback if the posts collection is empty. Change `ADMIN_PASSWORD` before the first run. If the admin account already exists, changing the environment variable does not change its existing password.

The root `.env` is only used by Compose. For the local non-container setup below, configure `backend/.env` as described there.

## Setup

### 1. Install backend dependencies

```bash
cd backend
npm install
```

Create `backend/.env` from `backend/.env.example`, then set `MONGO_URI`, a private `JWT_SECRET`, and a private `ADMIN_PASSWORD`. Use a random `JWT_SECRET` of at least 32 bytes. The development fallback secret changes when the backend restarts, which signs out existing sessions.

In PowerShell, copy the example with:

```powershell
Copy-Item .env.example .env
```

### 2. Install frontend dependencies

```bash
cd ../frontend
npm install
```

## Running Locally

The backend is also the API server. Start it before the frontend, and keep both processes running in separate terminals from the project root. The Vite development server proxies frontend `/api` requests to the backend API at `http://localhost:5000` by default.

### Terminal 1: Start the backend and API

From the project root:

```bash
cd backend
npm start
```

The backend and API run on `http://localhost:5000`.

The API base URL for local development is:

```text
http://localhost:5000/api
```

For example, the public posts endpoint is available at `http://localhost:5000/api/posts` when the backend is running.

### Terminal 2: Start the frontend

From the project root:

```bash
cd frontend
npm run dev
```

Vite prints the frontend URL in the terminal (usually `http://localhost:5173`).

Open the frontend URL in a browser. Requests made by the frontend to `/api` are forwarded to the backend API automatically. To use a different backend locally, set `VITE_BACKEND_URL` in `frontend/.env`. For a separately hosted API, set `VITE_API_URL` to its API base URL and add the frontend origin to `CORS_ORIGINS` in `backend/.env`.

When the backend starts, it will:

- connect to MongoDB
- create the default admin user if it does not already exist
- insert starter feedback posts only if the posts collection is empty
- hash passwords and issue seven-day signed login tokens

If `ADMIN_PASSWORD` is not set, the local development admin uses:

- Username: `admin`
- Password: `password`

Set `ADMIN_PASSWORD` before the first backend start to choose a different admin password. Existing plain-text account passwords are upgraded to hashes at backend startup, and users can continue signing in with their current passwords.

## Manual Seeding

If you ever want to run the seed files directly from the `backend` folder:

```bash
node seed.js
node seedAdmin.js
```

These scripts are safe to rerun:

- `seed.js` skips inserting posts if posts already exist
- `seedAdmin.js` skips creating the admin user if it already exists

Admin APIs verify the signed token and admin role on the backend. Report reasons and review decisions are kept with the feedback for administrators; reporter details are hidden from the public feed.

## Available Scripts

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

### Backend

```bash
npm start
npm test
node seed.js
node seedAdmin.js
```

## Admin Panel Notes

- The `Total Users` card is populated from backend user data
- The `Total Feedback` card is based on stored posts
- `Most Active Category` is calculated from the current posts list
- System notifications are fetched from the backend notifications endpoint

## Tech Stack

- React
- Vite
- React Router
- Axios
- Node.js
- Express
- MongoDB
- Mongoose
- Vanilla CSS
