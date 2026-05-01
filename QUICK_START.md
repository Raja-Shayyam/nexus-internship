# 🚀 Quick Start Guide - Nexus Backend

## 5-Minute Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create Environment File
```bash
cp .env.example .env
```

### 3. Configure MongoDB
Edit `.env` and set:
```
MONGODB_URI=your_mongodb_connection_string
```

**Get MongoDB:**
- **Free Cloud**: Sign up at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
- **Local**: Install MongoDB and use `mongodb://localhost:27017/nexus-db`

### 4. Start Server
```bash
npm run dev
```

You should see:
```
[INFO] 2024-04-29... - Database connected successfully
[INFO] 2024-04-29... - Server running on port 5000
```

### 5. Test It Works
```bash
curl http://localhost:5000/health
```

Should return: `{ "status": "OK", "timestamp": "..." }`

## 🔧 Common Commands

```bash
# Start in development mode
npm run dev

# Start in production
npm start

# Check Node version (should be v18+)
node --version

# Install a new package
npm install package-name
```

## 📡 First API Calls

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "entrepreneur"
  }'
```

Response will include a JWT token.

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Current User
```bash
# Replace TOKEN_HERE with token from login
curl -X GET http://localhost:5000/api/auth/current-user \
  -H "Authorization: Bearer TOKEN_HERE"
```

## 🐛 Troubleshooting

### Port 5000 Already in Use
```bash
# Kill process on port 5000
lsof -i :5000
kill -9 <PID>
```

### MongoDB Connection Failed
- Verify `MONGODB_URI` in `.env`
- Check internet connection (for MongoDB Atlas)
- Ensure IP whitelist allows your IP (MongoDB Atlas)

### Module Not Found Error
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentation Files

- **`backend/README.md`** - Full API documentation
- **`BACKEND_IMPLEMENTATION.md`** - Implementation guide
- **`.env.example`** - Environment variables template

## 📱 Frontend Integration

In your React app, set the API base URL:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

Then use it for all API calls:

```javascript
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ email, password })
});
```

## 🎯 What's Ready to Use

✅ **Authentication**: Register, login, token validation
✅ **User Profiles**: Create profiles, follow users, search
✅ **Messaging**: Send and receive messages
✅ **Notifications**: Multiple notification types
✅ **Collaboration**: Request and manage collaborations
✅ **Deals**: Create and track investment deals
✅ **Documents**: Upload and share documents

## 📝 Project Structure

```
backend/
├── src/
│   ├── config/         → Environment & database config
│   ├── models/         → MongoDB schemas (6 models)
│   ├── routes/         → API endpoints (8 route files)
│   ├── controllers/    → Business logic (8 controllers)
│   ├── middleware/     → Auth, error handling
│   ├── services/       → Reusable services
│   └── utils/          → Helpers & validators
├── server.js           → Entry point
└── package.json        → Dependencies
```

## 🔐 Security

- ✅ Passwords hashed with bcryptjs
- ✅ JWT authentication on protected routes
- ✅ CORS enabled
- ✅ Environment variables for secrets
- ⚠️ **For production**: Update CORS, use HTTPS, rotate secrets

## 🚢 Next Steps

1. **Connect Frontend** - Update your React app API calls to use `http://localhost:5000/api`
2. **Test Endpoints** - Use Postman or curl to verify everything works
3. **Week 2** - Implement messaging and notifications UI
4. **Week 3** - Add Stripe integration for payments

## 📞 Need Help?

- Check `backend/README.md` for full API docs
- Review controller files for endpoint logic
- Check model files for data structure
- Look at middleware for auth logic

---

**Backend Status**: ✅ **READY FOR DEVELOPMENT**

Start building! 🎉
