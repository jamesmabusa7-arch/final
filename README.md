# LUCT Reporting Application - Submission Package

This package contains a ready-to-run skeleton for the Lecturer Reporting App requested in the assignment.
It includes a React frontend and a Node/Express backend with a MySQL schema suitable for XAMPP.

## Structure
- frontend/  -> React app (src, public, package.json)
- backend/   -> Express API (server.js, package.json, db_schema.sql)
- README.md  -> this file

## How to run (local / XAMPP)
1. Backend
   - Install Node.js and npm.
   - In the `backend` folder: `npm install`
   - Ensure XAMPP MySQL is running. Open phpMyAdmin or run the `db_schema.sql` to create the database and table.
   - Update DB credentials in `backend/server.js` if necessary (user/password).
   - Start server: `npm start` (runs on port 5000)

2. Frontend
   - In the `frontend` folder: `npm install`
   - Start the app: `npm start`
   - The frontend expects the backend to be available at `/api/*`. When running locally you may configure a proxy in `package.json` or use CORS.

## Notes & Next Steps
- The frontend is a minimal form that posts to `POST /api/reports`.
- Authentication (Login/Register) and user roles (Student, Lecturer, PRL, PL) are **not implemented** in this skeleton but the backend and frontend are structured so you can add them.
- You can expand the app by adding user tables, role-based access control, reports viewing UIs, monitoring pages, and rating systems.