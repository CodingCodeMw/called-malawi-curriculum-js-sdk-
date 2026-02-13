# Malawi Curriculum API — JavaScript SDK 🇲🇼

[![npm version](https://img.shields.io/npm/v/malawi-curriculum-api.svg)](https://www.npmjs.com/package/malawi-curriculum-api)
[![npm downloads](https://img.shields.io/npm/dm/malawi-curriculum-api.svg)](https://www.npmjs.com/package/malawi-curriculum-api)
[![license](https://img.shields.io/npm/l/malawi-curriculum-api.svg)](LICENSE)
[![contributors](https://img.shields.io/github/contributors/CodingCodeMw/called-malawi-curriculum-js-sdk-.svg)](https://github.com/CodingCodeMw/called-malawi-curriculum-js-sdk-/graphs/contributors)
[![GitHub stars](https://img.shields.io/github/stars/CodingCodeMw/called-malawi-curriculum-js-sdk-.svg?style=social)](https://github.com/CodingCodeMw/called-malawi-curriculum-js-sdk-)
[![Built for Malawi](https://img.shields.io/badge/Built%20for-Malawi%20%F0%9F%87%B2%F0%9F%87%BC-000000.svg)](#)

The official JavaScript SDK for the **Malawi Curriculum API** — a structured, developer-ready way to search curriculum resources (past papers, notes, textbooks, marking schemes) across Malawi’s education levels.

- **Search and filter** curriculum resources with clean JSON responses
- **Secure downloads** via time-limited token flow
- **Pricing controls** per developer key (mark resources free/paid)

---

## Table of contents

- [Install](#install)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Core concepts](#core-concepts)
  - [Authentication](#authentication)
  - [Pagination](#pagination)
  - [Resource types](#resource-types)
- [Examples](#examples)
  - [List levels](#list-levels)
  - [List subjects](#list-subjects)
  - [Get resources](#get-resources)
  - [Search](#search)
  - [Download (secure token flow)](#download-secure-token-flow)
  - [Pricing (per developer key)](#pricing-per-developer-key)
- [Errors](#errors)
- [Rate limits and plans](#rate-limits-and-plans)
- [Support](#support)
- [License](#license)

---

## Install

```bash
npm install malawi-curriculum-api
Quick start
import { MalawiCurriculumClient } from "malawi-curriculum-api";

const client = new MalawiCurriculumClient({
  apiKey: process.env.MALAWI_CURRICULUM_API_KEY,
});

const resources = await client.getResources({
  level: "MSCE",
  subject: "Mathematics",
  type: "past_paper",
  limit: 10,
});

console.log(resources);
Configuration
Base URL
Default API base URL:

https://malawi-curricular-api-production.up.railway.app/api/v1
If your SDK supports overriding base URL (recommended for staging/dev), document it like:

const client = new MalawiCurriculumClient({
  apiKey: process.env.MALAWI_CURRICULUM_API_KEY,
  baseUrl: "https://malawi-curricular-api-production.up.railway.app/api/v1",
});
Core concepts
Authentication
All protected endpoints use a Bearer token API key:

Authorization: Bearer YOUR_API_KEY
Keep your API key server-side. If you must use it in a client app, use restricted keys and enforce quotas.

Pagination
Endpoints that return lists support:

limit (default: 50)

offset (default: 0)

Example:

const page1 = await client.search({ q: "biology", limit: 20, offset: 0 });
const page2 = await client.search({ q: "biology", limit: 20, offset: 20 });
Resource types
Common type values:

past_paper

marking_scheme

textbook

teacher_notes

student_notes

scheme_of_work

Examples
List levels
const levels = await client.getLevels();
console.log(levels);
HTTP

GET /levels

Example response

{
  "success": true,
  "count": 3,
  "data": [
    { "id": 1, "name": "JCE" },
    { "id": 2, "name": "MSCE" },
    { "id": 3, "name": "Primary" }
  ]
}
List subjects
const subjects = await client.getSubjects("MSCE");
console.log(subjects);
HTTP

GET /subjects?level=MSCE

Example response

{
  "success": true,
  "count": 12,
  "data": [
    { "id": 1, "name": "Mathematics", "level": "MSCE" },
    { "id": 2, "name": "Physics", "level": "MSCE" }
  ]
}
Get resources
const resources = await client.getResources({
  level: "MSCE",
  subject: "Mathematics",
  type: "past_paper",
  year: 2023,
  limit: 10,
  offset: 0,
});

console.log(resources);
HTTP

GET /resources

Query

level (required)

subject (required)

type (optional)

year (optional)

limit (optional)

offset (optional)

Example response

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
Search
const results = await client.search({
  q: "biology past paper",
  level: "MSCE",      // Basic+ plans
  type: "past_paper", // Pro+ plans
  year: 2024,         // Pro+ plans
  limit: 20,
  offset: 0,
});

console.log(results);
HTTP

GET /search?q=...

Query

q (required, min 2 chars)

level (optional, Basic+)

subject (optional, Basic+)

type (optional, Pro+)

year (optional, Pro+)

limit, offset (optional)

sort (optional, Enterprise: relevance, newest, oldest, title)

Example response

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
Tier limits

Feature	Free	Basic	Pro	Enterprise
Search fields	Title only	Title + Description	Title + Description	Title + Description
Max results	10	50	100	500
Filters	None	Level, Subject	All	All + Sorting
Download (secure token flow)
Downloads use a two-step token flow:

Request a download token (protected with API key)

Redeem the token (token acts as auth)

1) Request a download token
const tokenData = await client.requestDownload(101);

console.log("Token:", tokenData.token);
console.log("Expires:", tokenData.expires_in_seconds, "seconds");
console.log("Redeem URL:", tokenData.download_url);
HTTP

POST /downloads/request

Body: { "resourceId": 101 }

Example response

{
  "success": true,
  "token": "a1b2c3d4e5f6...",
  "expires_in_seconds": 900,
  "download_url": "/api/v1/downloads/a1b2c3d4e5f6..."
}
2) Redeem the token
const download = await client.redeemDownload(tokenData.token);

console.log("Signed URL:", download.download_url);
console.log("Signed URL expires in:", download.expires_in_seconds, "seconds");
HTTP

GET /downloads/{token}

No API key required (token is the authentication)

Example response

{
  "success": true,
  "download_url": "https://storage.googleapis.com/...",
  "expires_in_seconds": 300,
  "attempts_remaining": 1
}
Security notes

Token expires after 15 minutes

Max 2 attempts per token

Signed file URL typically valid for 5 minutes

Tokens are stored as SHA-256 hashes in the database

Pricing (per developer key)
Set custom prices per resource. Pricing is scoped to your API key, so different apps can set different pricing.

Set price
// Paid resource (MWK 500)
const pricing = await client.setPrice({
  resourceId: 101,
  price: 500,
  isFree: false,
});

console.log(pricing);

// Mark resource free
await client.setPrice({ resourceId: 101, isFree: true });
HTTP

POST /pricing/set

Body: { resourceId, price?, isFree? }

Example response

{
  "success": true,
  "data": {
    "resource_id": 101,
    "price_mwk": 500,
    "is_free": false
  }
}
Get price
const pricing = await client.getPrice(101);
console.log(pricing.is_free, pricing.price_mwk);
HTTP

GET /pricing/{resourceId}

If no price has been set, the resource defaults to free.

Download enforcement
Paid resources return 402 Payment Required on download request:

{
  "error": "This resource requires purchase before downloading.",
  "code": "PAYMENT_REQUIRED",
  "price_mwk": 500
}
Errors
All methods may throw errors.

try {
  const resources = await client.getResources({
    level: "MSCE",
    subject: "Mathematics",
  });
} catch (error) {
  const status = error.response?.status;

  if (status === 401) console.error("Invalid API key");
  else if (status === 402) console.error("Payment required");
  else if (status === 403) console.error("Forbidden / plan insufficient");
  else if (status === 404) console.error("Not found");
  else if (status === 429) console.error("Rate limit exceeded");
  else console.error("Error:", error.message);
}
Common HTTP status codes
200 Success

401 Unauthorized

402 Payment Required

403 Forbidden

404 Not Found

429 Too Many Requests

Rate limits and plans
Plan info and pricing are published on the developer portal:

Developer portal: https://test-d449f.web.app/

Free

100 requests/day

Metadata access only

No downloads

Basic

1,000 requests/day

5 downloads/day

Pro

10,000 requests/day

100 downloads/day

Priority support

Enterprise

100,000 requests/day

1,000 downloads/day

24/7 support

Support
Issues: use GitHub Issues in this repository

For partnerships / schools / large deployments: contact via the developer portal