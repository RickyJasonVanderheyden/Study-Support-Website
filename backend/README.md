# LMSDB Backend

Simple Express backend for LMS subjects and MCQ quiz scoring.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

or

```bash
npm start
```

Server runs on `http://localhost:5000` by default.

## API Endpoints

- `GET /api/health`
- `GET /api/subjects`
- `GET /api/subjects/:slug/questions`
- `POST /api/subjects/:slug/submit`

### Submit payload example

```json
{
  "answers": [1, 2, 0, 3, 1, 2, 0, 0, 1, 2]
}
```
