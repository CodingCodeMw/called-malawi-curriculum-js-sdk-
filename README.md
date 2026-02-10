# Malawi Curriculum API - JavaScript SDK 🇲🇼

A simple, typed client for accessing the Malawi Curriculum API.

## Installation

```bash
npm install malawi-curriculum-api
```

## Usage

### Initialization

```javascript
import { MalawiCurriculumClient } from 'malawi-curriculum-api';

const client = new MalawiCurriculumClient({
  apiKey: 'YOUR_API_KEY',
  // Optional: Override base URL for local development
  // baseUrl: 'http://localhost:3000/api/v1' 
});
```

### Fetch Resources

```javascript
// Get all Form 4 Mathematics past papers from 2023
const resources = await client.getResources({
  level: 'MSCE',
  subject: 'Mathematics',
  type: 'past_paper',
  year: 2023
});

console.log(resources);
```

### Download a Resource (Paid Plans)

```javascript
try {
  const url = await client.downloadResource(123);
  console.log('Download URL:', url);
} catch (error) {
  console.error('Download failed:', error.message);
}
```

### Get Subjects & Levels

```javascript
const subjects = await client.getSubjects('MSCE');
const levels = await client.getLevels();
```

## License

ISC
