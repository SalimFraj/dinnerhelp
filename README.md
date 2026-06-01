# DinnerHelp

DinnerHelp is a production LLM-integrated Progressive Web App for meal planning, pantry management, and recipe discovery. It is built with React, TypeScript, Vite, Firebase, Zustand, and Groq-powered AI features.

This project demonstrates practical AI application work: structured model outputs, user-facing workflow design, async state management, API integration, and validation before rendering model-generated content.

## What It Shows

- LLM API integration for recipe and meal-plan generation
- Prompt design for consistent structured JSON outputs
- Firebase-backed app architecture with React 19 and TypeScript
- Pantry, recipe, shopping-list, and meal-planning workflows
- Barcode scanning, receipt/OCR-oriented grocery capture, and voice-command UX patterns
- Zustand state management with predictable client-side flows
- PWA setup for installable, mobile-first usage

## Tech Stack

- React 19
- TypeScript
- Vite
- Firebase
- Zustand
- Groq AI API
- React Router
- Recharts
- Vite PWA
- Vercel Analytics

## Why This Project Matters

DinnerHelp is not just a prompt demo. It is an AI-integrated product workflow where the model supports a real user task: deciding what to cook based on available ingredients, preferences, and planning constraints.

The important engineering work is around reliability: shaping inputs, requesting structured outputs, validating generated content, and keeping the UI stable while multiple services and async flows are involved.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Related Work

For a more governance-heavy AI Builder prototype, see ConsultIQ:

https://consultiq.vercel.app
