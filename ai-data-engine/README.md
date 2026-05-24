# AI-Powered Data Engine

A React application that lets you chat with your datasets using Claude AI.

## Features
- Chat with your data using natural language
- View raw data in a clean table
- Auto-computed numeric stats (sum, avg, max)
- Two built-in sample datasets (Sales & Customer)
- Suggested query chips
- Dark mode support

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up your Anthropic API key
The app calls the Anthropic API directly from the browser.
Open `src/App.jsx` and ensure your environment/proxy handles the API key,
or add it temporarily for local testing:

```js
headers: {
  "Content-Type": "application/json",
  "x-api-key": "YOUR_API_KEY_HERE",   // add this line
  "anthropic-version": "2023-06-01",   // add this line
},
```

> ⚠️ Never expose your API key in production. Use a backend proxy instead.

### 3. Run the app
```bash
npm run dev
```

Open http://localhost:3000

## Build for production
```bash
npm run build
```

## Tech Stack
- React 18
- Vite
- Anthropic Claude API (claude-sonnet-4-20250514)
- Tabler Icons
