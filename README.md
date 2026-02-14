# Malawi Curriculum API - JavaScript SDK

[![npm version](https://img.shields.io/npm/v/malawi-curriculum-api.svg)](https://www.npmjs.com/package/malawi-curriculum-api)
[![npm downloads](https://img.shields.io/npm/dm/malawi-curriculum-api.svg)](https://www.npmjs.com/package/malawi-curriculum-api)
[![license](https://img.shields.io/npm/l/malawi-curriculum-api.svg)](LICENSE)
[![contributors](https://img.shields.io/github/contributors/CodingCodeMw/called-malawi-curriculum-js-sdk-.svg)](https://github.com/CodingCodeMw/called-malawi-curriculum-js-sdk-/graphs/contributors)
[![GitHub stars](https://img.shields.io/github/stars/CodingCodeMw/called-malawi-curriculum-js-sdk-.svg?style=social)](https://github.com/CodingCodeMw/called-malawi-curriculum-js-sdk-)
[![Built for Malawi](https://img.shields.io/badge/Built%20for-Malawi%20%F0%9F%87%B2%F0%9F%87%BC-000000.svg)](#)

The official SDK for accessing the Malawi Curriculum API.

## Installation

```bash
npm install malawi-curriculum-api
```

### Authentication

Initialize the client with your API Key and optional Firebase ID Token for user-specific access (subscriptions/purchases).

```javascript
import { MalawiCurriculumClient } from 'malawi-curriculum-api';

const client = new MalawiCurriculumClient({ 
  apiKey: 'YOUR_API_KEY',
  firebaseToken: 'USER_FIREBASE_ID_TOKEN' // Optional: for accessing paid resources
});

// Update token later (e.g., on user login/refresh)
client.setFirebaseToken('NEW_TOKEN');
```

### Search Resources

Search with powerful filtering options. Access to filters depends on your API Key plan tier.

```javascript
const results = await client.search({
    q: 'mathematics',
    level: 'MSCE',       // Basic+ Plan
    year: 2023,          // Pro+ Plan
    type: 'past_paper',  // Pro+ Plan
    limit: 10
});
```

### Secure Downloads

Request a secure, short-lived download URL. This flow enforces entitlements (subscriptions/purchases).

```javascript
try {
    // 1. Get signed URL (handles payment checks automatically)
    const url = await client.download(123, 'download');
    
    // 2. Open or download
    window.location.href = url;
} catch (error) {
    if (error.message.includes('402')) {
        console.error('Payment Required');
    }
}
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
      "level": "MSCE",
      "price_mwk": 500,
      "is_free": false
    }
  ]
}
```

> **Pricing Information:** The `price_mwk` and `is_free` fields show the cost set by you for this resource. Use these to display price tags or "Free" badges in your app.

---

### Download Resource (Secure Token Flow)

Downloads use a two-step token flow for security. Requires a paid subscription (Basic, Pro, or Enterprise).

#### Request a Download Token

```javascript
// Purpose can be 'view' or 'download' (default)
const tokenData = await client.requestDownload(101, 'view');

if (tokenData.access_level === 'preview') {
  console.log('Restriction: View only first', tokenData.pages_allowed, 'page(s)');
}
```

**Request:**
- Method: `POST`
- Endpoint: `/downloads/request`
- Headers: `Authorization: Bearer API_KEY`
- Body:
  - `resourceId`: 101
  - `purpose` (optional): `"view"` or `"download"` (default: `"download"`)

**Response:**
```json
{
  "success": true,
  "token": "a1b2c3d4e5f6...",
  "expires_in_seconds": 900,
  "download_url": "/api/v1/downloads/a1b2c3d4e5f6...",
  "access_level": "preview",
  "pages_allowed": 1
}
```

> **Subscribers Content:** For subscribers, `purpose: "view"` returns `access_level: "full"`. For non-subscribers, it returns `"preview"`. For downloads, subscribers receive a **40% discount** automatically.

#### Redeem the Token

```javascript
const download = await client.redeemDownload(tokenData.token);
console.log('File URL:', download.download_url);
// URL is valid for 5 minutes, max 2 attempts per token
```

**Request:**
- Method: `GET`
- Endpoint: `/downloads/{token}`
- No API key required (token is the authentication)

**Response:**
```json
{
  "success": true,
  "download_url": "https://storage.googleapis.com/...",
  "expires_in_seconds": 300,
  "attempts_remaining": 1
}
```

**Error Responses:**
```json
// Free Tier
{ "error": "Free tier cannot download files.", "code": "PLAN_INSUFFICIENT" }

// Limit Exceeded
{ "error": "Daily download limit exceeded (100/day).", "code": "DOWNLOAD_LIMIT_EXCEEDED" }

// Token Expired
{ "error": "Download token has expired.", "code": "TOKEN_EXPIRED" }

// Max Attempts
{ "error": "Maximum download attempts reached (2).", "code": "TOKEN_MAX_ATTEMPTS" }
```

> **Security:** Tokens expire after 15 minutes, allow max 2 download attempts, and are stored as SHA-256 hashes in the database. The signed download URL is only valid for 5 minutes.

---

### Resource Pricing

Set custom prices on resources or mark them as free. Each developer's pricing is independent, identified by their API key.

#### Set a Price

```javascript
// Mark a resource as paid (500 MWK)
const pricing = await client.setPrice({
  resourceId: 101,
  price: 500,
  isFree: false
});
console.log(pricing);
// { resource_id: 101, price_mwk: 500, is_free: false }

// Mark a resource as free
await client.setPrice({ resourceId: 101, isFree: true });
```

**Request:**
- Method: `POST`
- Endpoint: `/pricing/set`
- Headers: `Authorization: Bearer API_KEY`
- Body:
  - `resourceId` (required): Resource ID
  - `price` (optional): Price in MWK (ignored if `isFree` is true)
  - `isFree` (optional): Set to `true` for free access

**Response:**
```json
{
  "success": true,
  "data": {
    "resource_id": 101,
    "price_mwk": 500,
    "is_free": false
  }
}
```

#### Get a Price

```javascript
const pricing = await client.getPrice(101);
console.log(pricing.is_free);  // true or false
console.log(pricing.price_mwk); // price in MWK
```

**Request:**
- Method: `GET`
- Endpoint: `/pricing/{resourceId}`
- Headers: `Authorization: Bearer API_KEY`

**Response:**
```json
{
  "success": true,
  "data": {
    "resource_id": 101,
    "price_mwk": 0,
    "is_free": true
  }
}
```

If no price has been set, the resource defaults to free.

**Download Enforcement:**

When a resource has been priced (not free), download requests return `402 Payment Required`:

```json
{
  "error": "This resource requires purchase before downloading.",
  "code": "PAYMENT_REQUIRED",
  "price_mwk": 500
}
```

---

### Related Resources

Get resources similar to a given resource (same subject/level), prioritising the same year.

```javascript
const related = await client.getRelatedResources(101);
console.log(related);
// Up to 5 resources from the same subject and level
```

**Request:**
- Method: `GET`
- Endpoint: `/resources/{id}/related`
- Headers: `Authorization: Bearer API_KEY`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 102,
      "title": "MSCE Mathematics Paper 2 2023",
      "type": "past_paper",
      "year": 2023,
      "subject": "Mathematics",
      "level": "MSCE",
      "price_mwk": 500,
      "is_free": false
    }
  ]
}
```

---

### Bookmarks

Save resources for quick access later.

#### List Bookmarks

```javascript
const bookmarks = await client.getBookmarks({ limit: 20 });
```

**Request:**
- Method: `GET`
- Endpoint: `/bookmarks`
- Headers: `Authorization: Bearer API_KEY`
- Query Parameters:
  - `limit` (optional): Max results (1-100, default: 50)
  - `offset` (optional): Pagination offset

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "resource_id": 101,
      "title": "MSCE Mathematics Paper 1 2023",
      "type": "past_paper",
      "year": 2023,
      "subject": "Mathematics",
      "level": "MSCE",
      "price_mwk": 500,
      "is_free": false,
      "bookmarked_at": "2026-02-14T00:00:00.000Z"
    }
  ]
}
```

#### Add Bookmark

```javascript
const bookmark = await client.addBookmark(101);
console.log(bookmark);
// { id: 1, resource_id: 101, created_at: "..." }
```

**Request:**
- Method: `POST`
- Endpoint: `/bookmarks`
- Body: `{ "resource_id": 101 }`

#### Remove Bookmark

```javascript
await client.removeBookmark(101);
```

**Request:**
- Method: `DELETE`
- Endpoint: `/bookmarks/{resourceId}`

---

### Search Resources

Search across all curriculum resources. Results and filter capabilities depend on your plan tier.

```javascript
const results = await client.search({
  q: 'biology past paper',
  level: 'MSCE',        // Basic+ plans
  type: 'past_paper',   // Pro+ plans
  year: 2024            // Pro+ plans
});
```

**Request:**
- Method: `GET`
- Endpoint: `/search`
- Headers: `Authorization: Bearer API_KEY`
- Query Parameters:
  - `q` (required): Search query (min 2 characters)
  - `level` (optional): Filter by level -- Basic+ plans only
  - `subject` (optional): Filter by subject -- Basic+ plans only
  - `type` (optional): Filter by resource type -- Pro+ plans only
  - `year` (optional): Filter by year -- Pro+ plans only
  - `limit` (optional): Max results (capped by plan tier)
  - `offset` (optional): Pagination offset
  - `sort` (optional): Sort order -- Enterprise only (`relevance`, `newest`, `oldest`, `title`)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total_count": 23,
  "tier": "basic",
  "tier_info": "Title & description search with basic filters.",
  "data": [
    {
      "id": 101,
      "title": "MSCE Biology Paper 1 2024",
      "type": "past_paper",
      "year": 2024,
      "subject": "Biology",
      "level": "MSCE",
      "relevance": 0.8721
    }
  ]
}
```

**Search Tier Limits:**

| Feature | Free | Basic | Pro | Enterprise |
|---|---|---|---|---|
| Search fields | Title only | Title + Description | Title + Description | Title + Description |
| Max results | 10 | 50 | 100 | 500 |
| Filters | None | Level, Subject | All | All + Sorting |
```

## Error Handling

All methods may throw errors for various reasons:

```javascript
try {
  const resources = await client.getResources({ level: 'MSCE', subject: 'Math' });
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Invalid API key');
  } else if (error.response?.status === 402) {
    console.error('Payment required for this resource');
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
- `402` - Payment Required (resource has a price set)
- `403` - Forbidden (subscription expired or insufficient permissions)
- `404` - Resource not found
- `429` - Rate limit exceeded

## Rate Limits & Plans

Different subscription tiers provide varying levels of access. Visit the [developer portal](https://test-d449f.web.app/) for current pricing.

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

MIT
