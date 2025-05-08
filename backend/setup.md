# Backend Setup Guide

## Initial Setup

1. Make sure you have Node.js installed (v14 or higher)
2. Install MongoDB locally or use MongoDB Atlas
3. From the backend directory, install dependencies:
   ```
   npm install
   ```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/digitalmenu
JWT_SECRET=your_very_long_and_secure_jwt_secret_key
JWT_EXPIRE=24h
NODE_ENV=development
```

Replace `your_very_long_and_secure_jwt_secret_key` with a secure random string.

## Running the Server

To start the server in development mode with auto-restart:

```
npm run dev
```

To start the server in production mode:

```
npm start
```

## Initial Admin User

When the system first runs, it will check if any admin user exists. If not, it will create a default admin user with the following credentials:

- Username: `admin`
- Password: `admin123`

**Important:** Change these credentials immediately after your first login.

## Authentication Flow

1. Users authenticate through the `/api/auth/login` endpoint
2. Upon successful login, the server returns a JWT token
3. This token must be included in the Authorization header for subsequent requests
4. `Authorization: Bearer YOUR_TOKEN_HERE`

## Permissions

The system uses role-based permissions:

- **Admin**: Full access to all features
- **Editor**: Can view and edit content, but not manage users
- **Viewer**: Can only view content, no editing

## Database Collections

The system uses these MongoDB collections:

- **users**: Store user accounts and permissions
- **visitors**: Track website visitor data

## API Documentation

A complete API documentation is available in the README.md file.

## Security Considerations

- All passwords are hashed using bcrypt
- API endpoints are protected with JWT authentication
- Input validation is implemented to prevent security vulnerabilities
- API rate limiting is enabled to prevent brute force attacks 