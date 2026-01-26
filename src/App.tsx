import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pantry from './pages/Pantry';
import Recipes from './pages/Recipes';
import Shopping from './pages/Shopping';
import MealPlan from './pages/MealPlan';
import RecipeDetail from './pages/RecipeDetail';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="pantry" element={<Pantry />} />
            <Route path="recipes" element={<Recipes />} />
            <Route path="recipes/:id" element={<RecipeDetail />} />
            <Route path="shopping" element={<Shopping />} />
            <Route path="meal-plan" element={<MealPlan />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}

export default App;
