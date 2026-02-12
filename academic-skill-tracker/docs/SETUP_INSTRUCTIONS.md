# Setup Instructions

## Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (free tier)
- Google Gemini API key (free)

## Initial Setup

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd academic-skill-tracker
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and add your credentials:
- MongoDB URI from MongoDB Atlas
- JWT Secret (generate random string)
- Gemini API key from Google AI Studio

Start backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
```

Start frontend:
```bash
npm start
```

### 4. Test
- Backend: http://localhost:5000/api/health
- Frontend: http://localhost:3000

## Team Workflow

Each member should:
1. Create their feature branch
2. Work only in their module folders
3. Commit regularly with clear messages
4. Create pull requests for review
