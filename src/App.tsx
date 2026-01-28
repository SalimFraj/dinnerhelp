import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pantry from './pages/Pantry';
import Recipes from './pages/Recipes';
import Shopping from './pages/Shopping';
import MealPlan from './pages/MealPlan';
import RecipeDetail from './pages/RecipeDetail';
import Chat from './pages/Chat';
import Auth from './pages/Auth';
import FamilySettings from './pages/FamilySettings';
import { useAuthStore } from './stores/authStore';
import './index.css';

// Component to handle first-visit auth redirect
function AuthGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, isInitialized } = useAuthStore();

  // Check if user has seen the app before (guest mode)
  const hasSeenApp = localStorage.getItem('dinnerhelp-has-visited');

  // Don't redirect while initializing auth state
  if (!isInitialized) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
      </div>
    );
  }

  // First-time visitors go to auth (unless already on auth page)
  if (!user && !hasSeenApp && location.pathname !== '/auth') {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// Wrapper to mark user as having visited
function MarkVisited({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    localStorage.setItem('dinnerhelp-has-visited', 'true');
  }, []);
  return <>{children}</>;
}

function App() {
  const { initialize } = useAuthStore();

  // Initialize auth listener on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <AuthGate>
                <MarkVisited>
                  <Layout />
                </MarkVisited>
              </AuthGate>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="pantry" element={<Pantry />} />
            <Route path="recipes" element={<Recipes />} />
            <Route path="recipes/:id" element={<RecipeDetail />} />
            <Route path="shopping" element={<Shopping />} />
            <Route path="meal-plan" element={<MealPlan />} />
            <Route path="chat" element={<Chat />} />
            <Route path="family" element={<FamilySettings />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}

export default App;
