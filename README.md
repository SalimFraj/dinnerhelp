# DinnerHelp 🍽️

A premium Progressive Web App (PWA) for smart dinner planning. Built with React, TypeScript, and AI-powered recipe suggestions.

## Features

### 🥬 Pantry Management
- **Manual Entry**: Add ingredients with quantity, unit, and expiration dates
- **Voice Input**: Add ingredients using voice commands
- **Barcode Scanning**: Scan product barcodes to quickly add items
- **Receipt OCR**: Take photos of grocery receipts to extract items
- **Smart Categorization**: Ingredients are automatically categorized

### 🍳 Recipe Discovery
- **AI-Powered Suggestions**: Get recipe ideas based on your pantry contents using Groq AI
- **TheMealDB Integration**: Browse thousands of curated recipes
- **Smart Matching**: See which recipes match your available ingredients
- **Favorites & Ratings**: Save and rate your favorite recipes

### 🛒 Shopping Lists
- **Auto-Generate**: Create lists from missing recipe ingredients
- **Smart Categories**: Items organized by store section
- **Progress Tracking**: Check items off as you shop
- **Share Lists**: Copy lists to share with others

### 📅 Meal Planning
- **Weekly Calendar**: Plan meals for the week ahead
- **AI Generation**: Auto-generate weekly meal plans
- **Simple & Calendar Views**: Choose your preferred layout
- **Quick Add**: Add recipes to any meal slot

### 🎤 Voice Commands
- "Add chicken to pantry"
- "Search for pasta recipes"
- "Go to shopping list"

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Custom CSS with design tokens, Framer Motion animations
- **State**: Zustand with persistence
- **PWA**: Vite PWA plugin with offline support
- **AI**: Groq API (free tier - 6000 requests/day)
- **APIs**: TheMealDB, Open Food Facts (barcode lookup)
- **OCR**: Tesseract.js for receipt scanning

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dinnerhelp.git
cd dinnerhelp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Groq API key
```

### Get a Groq API Key (Free)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Create an API key
4. Add it to your `.env` file:
   ```
   VITE_GROQ_API_KEY=your_api_key_here
   ```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx          # Main app layout with navigation
│   ├── pantry/             # Pantry-related components
│   │   ├── AddIngredientModal.tsx
│   │   ├── BarcodeScanner.tsx
│   │   └── ReceiptScanner.tsx
│   ├── recipes/            # Recipe components
│   │   ├── RecipeCard.tsx
│   │   └── FilterModal.tsx
│   ├── ui/                 # Reusable UI components
│   │   └── Toast.tsx
│   └── voice/              # Voice command components
│       └── VoiceModal.tsx
├── pages/
│   ├── Dashboard.tsx       # Home page
│   ├── Pantry.tsx          # Pantry management
│   ├── Recipes.tsx         # Recipe discovery
│   ├── RecipeDetail.tsx    # Single recipe view
│   ├── Shopping.tsx        # Shopping lists
│   └── MealPlan.tsx        # Weekly planning
├── stores/                 # Zustand state stores
│   ├── pantryStore.ts
│   ├── recipeStore.ts
│   ├── shoppingStore.ts
│   ├── mealPlanStore.ts
│   └── uiStore.ts
├── services/
│   └── recipeService.ts    # API integrations
├── types/
│   └── index.ts            # TypeScript definitions
├── App.tsx
├── main.tsx
└── index.css               # Design system
```

## Design Decisions

- **Dark Theme**: Modern, eye-friendly dark interface with glassmorphism
- **Mobile-First**: Bottom navigation for easy thumb access
- **Warm Accents**: Orange primary color for appetite appeal
- **Smooth Animations**: Framer Motion for premium feel
- **Local Storage**: All data persisted locally for offline access

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial use.
