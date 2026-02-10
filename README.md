# Malawi Curriculum API - JavaScript SDK

A simple, typed client for accessing the Malawi Curriculum API.

## Installation

```bash
npm install malawi-curriculum-api
```

## Quick Start

```javascript
import { MalawiCurriculumClient } from 'malawi-curriculum-api';

const client = new MalawiCurriculumClient({
  apiKey: 'YOUR_API_KEY'
});

const resources = await client.getResources({
  level: 'MSCE',
  subject: 'Mathematics',
  type: 'past_paper'
});
```

## API Overview

The Malawi Curriculum API provides access to educational resources across various academic levels in Malawi. All endpoints require authentication via an API key.

### Base URL

```
https://malawi-curricular-api-production.up.railway.app/api/v1
```

### Authentication

Include your API key in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

## API Reference

### Get Levels

Retrieves all academic levels available in the Malawi curriculum.

```javascript
const levels = await client.getLevels();
```

**Request:**
- Method: `GET`
- Endpoint: `/levels`
- Headers: `Authorization: Bearer API_KEY`

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    { "id": 1, "name": "JCE" },
    { "id": 2, "name": "MSCE" },
    { "id": 3, "name": "Primary" }
  ]
}
```

---

### Get Subjects

Retrieves subjects, optionally filtered by academic level.

```javascript
const subjects = await client.getSubjects('MSCE');
```

**Request:**
- Method: `GET`
- Endpoint: `/subjects`
- Headers: `Authorization: Bearer API_KEY`
- Query Parameters:
  - `level` (optional): Filter by level name (e.g., "MSCE", "JCE")

**Response:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    { "id": 1, "name": "Mathematics", "level": "MSCE" },
    { "id": 2, "name": "Physics", "level": "MSCE" },
    { "id": 3, "name": "Chemistry", "level": "MSCE" }
  ]
}
```

---

### Get Resources

Retrieves curriculum resources with filtering options.

```javascript
const resources = await client.getResources({
  level: 'MSCE',
  subject: 'Mathematics',
  type: 'past_paper',
  year: 2023,
  limit: 10
});
```

**Request:**
- Method: `GET`
- Endpoint: `/resources`
- Headers: `Authorization: Bearer API_KEY`
- Query Parameters:
  - `level` (required): Academic level (e.g., "MSCE", "JCE")
  - `subject` (required): Subject name (e.g., "Mathematics")
  - `type` (optional): Resource type
    - `past_paper`
    - `marking_scheme`
    - `textbook`
    - `teacher_notes`
    - `student_notes`
    - `scheme_of_work`
  - `year` (optional): Year of the resource (integer)
  - `limit` (optional): Number of results (1-100, default: 50)
  - `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total_count": 47,
  "data": [
    {
      "id": 101,
      "title": "MSCE Mathematics Paper 1 2023",
      "type": "past_paper",
      "year": 2023,
      "description": "Main examination paper",
      "subject": "Mathematics",
      "level": "MSCE"
    }
  ]
}
```

---

### Download Resource

Generates a temporary signed URL to download a resource file. **Requires a paid subscription** (Basic, Pro, or Enterprise).

```javascript
try {
  const url = await client.downloadResource(101);
  console.log('Download URL:', url);
} catch (error) {
  console.error('Download failed:', error.message);
}
```

**Request:**
- Method: `GET`
- Endpoint: `/resources/:id/download`
- Headers: `Authorization: Bearer API_KEY`
- URL Parameters:
  - `id`: Resource ID (integer)

**Response (Success):**
```json
{
  "success": true,
  "download_url": "https://storage.googleapis.com/...",
  "expires_in_seconds": 300
}
```

**Response (Free Tier):**
```json
{
  "message": "Free tier cannot download files. Please upgrade to Basic or Pro."
}
```

**Response (Limit Exceeded):**
```json
{
  "message": "Daily download limit exceeded (100 downloads/day). Upgrade plan for more."
}
```

## Error Handling

All methods may throw errors for various reasons:

```javascript
try {
  const resources = await client.getResources({ level: 'MSCE', subject: 'Math' });
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Invalid API key');
  } else if (error.response?.status === 429) {
    console.error('Rate limit exceeded');
  } else {
    console.error('Error:', error.message);
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `401` - Unauthorized (invalid or missing API key)
- `403` - Forbidden (subscription expired or insufficient permissions)
- `404` - Resource not found
- `429` - Rate limit exceeded

## Rate Limits & Plans

Different subscription tiers provide varying levels of access. Visit the [developer portal](https://malawi-curricular-api-production.up.railway.app) for current pricing.

### Free Plan
- 100 requests/day
- Metadata access only
- No file downloads

### Basic Plan
- 1,000 requests/day
- 5 downloads/day
- Full API access

### Pro Plan
- 10,000 requests/day
- 100 downloads/day
- Priority support

### Enterprise Plan
- 100,000 requests/day
- 1,000 downloads/day
- 24/7 support

## License

ISC
