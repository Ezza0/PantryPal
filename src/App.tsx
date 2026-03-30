import { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Plus, 
  X, 
  ChefHat, 
  Clock, 
  BarChart, 
  Utensils, 
  Search, 
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Heart,
  ChevronLeft,
  BookOpen,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Recipe {
  id: string;
  title: string;
  time: string;
  difficulty: 'beginner' | 'intermediate';
  ingredientsUsed: string[];
  missingIngredients: string[];
  briefInstructions: string;
  fullInstructions: string[];
  servings: string;
  calories?: string;
}

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo', 'Nut-Free'
];

export default function App() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [filters, setFilters] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'discover' | 'saved'>('discover');

  // Load saved recipes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pantrypal_saved');
    if (saved) {
      try {
        setSavedRecipes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved recipes", e);
      }
    }
  }, []);

  // Persist saved recipes
  useEffect(() => {
    localStorage.setItem('pantrypal_saved', JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  const addIngredient = () => {
    if (inputValue.trim() && !ingredients.includes(inputValue.trim().toLowerCase())) {
      setIngredients([...ingredients, inputValue.trim().toLowerCase()]);
      setInputValue('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const toggleFilter = (filter: string) => {
    setFilters(prev => 
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const toggleSaveRecipe = (recipe: Recipe) => {
    setSavedRecipes(prev => {
      const isSaved = prev.some(r => r.id === recipe.id);
      if (isSaved) {
        return prev.filter(r => r.id !== recipe.id);
      } else {
        return [...prev, recipe];
      }
    });
  };

  const generateRecipes = async () => {
    if (ingredients.length === 0) {
      setError("Please add at least one ingredient.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveTab('discover');

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Suggest 6 recipes based on these ingredients: ${ingredients.join(', ')}. 
        Dietary filters: ${filters.join(', ') || 'None'}. 
        
        CRITICAL: Provide a mix of 3 "beginner" and 3 "intermediate" difficulty recipes.
        
        For each recipe, provide: 
        - id (unique string)
        - title
        - time (e.g., 20 mins)
        - difficulty (beginner or intermediate)
        - ingredientsUsed (from my list)
        - missingIngredients (max 3)
        - briefInstructions (1 sentence summary)
        - fullInstructions (array of detailed steps)
        - servings (e.g., 2 people)
        - calories (optional estimate)
        
        Suggest recipes even if 1-3 items are missing from my list.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                time: { type: Type.STRING },
                difficulty: { type: Type.STRING, enum: ['beginner', 'intermediate'] },
                ingredientsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
                missingIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                briefInstructions: { type: Type.STRING },
                fullInstructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                servings: { type: Type.STRING },
                calories: { type: Type.STRING },
              },
              required: ['id', 'title', 'time', 'difficulty', 'ingredientsUsed', 'missingIngredients', 'briefInstructions', 'fullInstructions', 'servings'],
            },
          },
        },
      });

      const data = JSON.parse(response.text || '[]');
      setRecipes(data);
    } catch (err) {
      console.error("Error generating recipes:", err);
      setError("Failed to generate recipes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isRecipeSaved = (id: string) => savedRecipes.some(r => r.id === id);

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#2D2926] font-sans selection:bg-[#FFD700]/30">
      {/* Header */}
      <header className="border-b border-[#E5E1DA] bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedRecipe(null); setActiveTab('discover'); }}>
            <div className="bg-[#FF6B35] p-2 rounded-xl shadow-sm">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
              Pantry<span className="text-[#FF6B35]">Pal</span>
            </h1>
          </div>
          
          <nav className="flex items-center gap-6">
            <button 
              onClick={() => { setActiveTab('discover'); setSelectedRecipe(null); }}
              className={`text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'discover' ? 'text-[#FF6B35]' : 'text-[#9B9690] hover:text-[#1A1A1A]'}`}
            >
              Discover
            </button>
            <button 
              onClick={() => { setActiveTab('saved'); setSelectedRecipe(null); }}
              className={`text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${activeTab === 'saved' ? 'text-[#FF6B35]' : 'text-[#9B9690] hover:text-[#1A1A1A]'}`}
            >
              Saved
              {savedRecipes.length > 0 && (
                <span className="bg-[#FF6B35] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {savedRecipes.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {selectedRecipe ? (
            <motion.div
              key="recipe-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <button 
                onClick={() => setSelectedRecipe(null)}
                className="flex items-center gap-2 text-[#6B6661] hover:text-[#1A1A1A] font-bold transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to results
              </button>

              <div className="bg-white rounded-[2.5rem] border border-[#E5E1DA] shadow-xl overflow-hidden">
                <div className="p-8 md:p-12 space-y-10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          selectedRecipe.difficulty === 'beginner' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {selectedRecipe.difficulty}
                        </span>
                        <span className="text-sm font-medium text-[#9B9690] flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {selectedRecipe.time}
                        </span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] leading-tight">
                        {selectedRecipe.title}
                      </h2>
                      <p className="text-lg text-[#6B6661] italic">
                        {selectedRecipe.briefInstructions}
                      </p>
                    </div>
                    <button 
                      onClick={() => toggleSaveRecipe(selectedRecipe)}
                      className={`p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                        isRecipeSaved(selectedRecipe.id) 
                          ? 'bg-[#FF6B35] border-[#FF6B35] text-white shadow-lg' 
                          : 'bg-white border-[#E5E1DA] text-[#6B6661] hover:border-[#FF6B35]'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${isRecipeSaved(selectedRecipe.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-[#F5F2ED]">
                    <div className="space-y-6">
                      <div className="bg-[#FDFCFB] p-6 rounded-3xl border border-[#F5F2ED]">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#FF6B35] mb-4 flex items-center gap-2">
                          <Utensils className="w-4 h-4" />
                          Ingredients
                        </h3>
                        <ul className="space-y-3">
                          {selectedRecipe.ingredientsUsed.map((ing, i) => (
                            <li key={i} className="text-sm font-medium flex items-start gap-2 text-[#4A4540]">
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                              {ing}
                            </li>
                          ))}
                          {selectedRecipe.missingIngredients.map((ing, i) => (
                            <li key={i} className="text-sm font-medium flex items-start gap-2 text-[#9B9690] italic">
                              <Plus className="w-4 h-4 text-[#FF6B35] shrink-0 mt-0.5" />
                              {ing} (Need to buy)
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-1 bg-[#F5F2ED] p-4 rounded-2xl text-center">
                          <p className="text-[10px] font-black uppercase text-[#9B9690] mb-1">Servings</p>
                          <p className="font-bold text-[#1A1A1A]">{selectedRecipe.servings}</p>
                        </div>
                        {selectedRecipe.calories && (
                          <div className="flex-1 bg-[#F5F2ED] p-4 rounded-2xl text-center">
                            <p className="text-[10px] font-black uppercase text-[#9B9690] mb-1">Calories</p>
                            <p className="font-bold text-[#1A1A1A] flex items-center justify-center gap-1">
                              <Flame className="w-3 h-3 text-[#FF6B35]" />
                              {selectedRecipe.calories}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                      <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#FF6B35]" />
                        Instructions
                      </h3>
                      <div className="space-y-6">
                        {selectedRecipe.fullInstructions.map((step, i) => (
                          <div key={i} className="flex gap-6 group">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {i + 1}
                              </div>
                              {i < selectedRecipe.fullInstructions.length - 1 && (
                                <div className="w-0.5 h-full bg-[#F5F2ED] my-2" />
                              )}
                            </div>
                            <p className="text-[#4A4540] leading-relaxed pt-1 group-hover:text-[#1A1A1A] transition-colors">
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'saved' ? (
            <motion.div
              key="saved-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-[#1A1A1A]">Your Saved Recipes</h2>
                <button 
                  onClick={() => setActiveTab('discover')}
                  className="text-sm font-bold text-[#FF6B35] hover:underline"
                >
                  Find more recipes
                </button>
              </div>

              {savedRecipes.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-[#F5F2ED] rounded-3xl border-2 border-dashed border-[#E5E1DA]">
                  <Heart className="w-12 h-12 text-[#FF6B35] opacity-20 mb-4" />
                  <h3 className="text-xl font-bold mb-2">No saved recipes yet</h3>
                  <p className="text-[#6B6661] max-w-xs">
                    When you find a recipe you like, click the heart icon to save it here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedRecipes.map((recipe, idx: number) => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe} 
                      onView={() => setSelectedRecipe(recipe)}
                      onToggleSave={() => toggleSaveRecipe(recipe)}
                      isSaved={true}
                      idx={idx}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="discover-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
              {/* Left Column: Input */}
              <div className="lg:col-span-5 space-y-10">
                <section>
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-[#FF6B35]" />
                    What's in your pantry?
                  </h2>
                  
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                      placeholder="Add ingredient (e.g. Eggs, Spinach)"
                      className="flex-1 bg-white border-2 border-[#E5E1DA] rounded-xl px-4 py-3 focus:outline-none focus:border-[#FF6B35] transition-colors shadow-sm"
                    />
                    <button
                      onClick={addIngredient}
                      className="bg-[#FF6B35] hover:bg-[#E85A2A] text-white p-3 rounded-xl transition-all shadow-md active:scale-95"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-[#F5F2ED] rounded-2xl border-2 border-dashed border-[#E5E1DA]">
                    <AnimatePresence>
                      {ingredients.length === 0 && (
                        <p className="text-[#9B9690] text-sm italic m-auto">No ingredients added yet.</p>
                      )}
                      {ingredients.map((ing) => (
                        <motion.span
                          key={ing}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="bg-white border border-[#E5E1DA] px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm"
                        >
                          {ing}
                          <button onClick={() => removeIngredient(ing)} className="hover:text-[#FF6B35]">
                            <X className="w-4 h-4" />
                          </button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-[#FF6B35]" />
                    Dietary Preferences
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map((option) => (
                      <button
                        key={option}
                        onClick={() => toggleFilter(option)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                          filters.includes(option)
                            ? 'bg-[#FF6B35] border-[#FF6B35] text-white shadow-md'
                            : 'bg-white border-[#E5E1DA] text-[#6B6661] hover:border-[#FF6B35]/50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </section>

                <button
                  onClick={generateRecipes}
                  disabled={isLoading || ingredients.length === 0}
                  className="w-full bg-[#1A1A1A] hover:bg-black text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Finding Recipes...
                    </>
                  ) : (
                    <>
                      <Search className="w-6 h-6" />
                      Find Recipes
                    </>
                  )}
                </button>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              {/* Right Column: Results */}
              <div className="lg:col-span-7">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-[#1A1A1A]">Suggested Recipes</h2>
                  {recipes.length > 0 && (
                    <span className="text-sm font-medium text-[#6B6661] bg-[#F5F2ED] px-3 py-1 rounded-full">
                      {recipes.length} results found
                    </span>
                  )}
                </div>

                {recipes.length === 0 && !isLoading ? (
                  <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-[#F5F2ED] rounded-3xl border-2 border-dashed border-[#E5E1DA]">
                    <div className="bg-white p-6 rounded-full shadow-sm mb-6">
                      <ChefHat className="w-12 h-12 text-[#FF6B35] opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Ready to cook?</h3>
                    <p className="text-[#6B6661] max-w-xs">
                      Add your ingredients and preferences to see what you can make today.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recipes.map((recipe, idx: number) => (
                      <RecipeCard 
                        key={recipe.id} 
                        recipe={recipe} 
                        onView={() => setSelectedRecipe(recipe)}
                        onToggleSave={() => toggleSaveRecipe(recipe)}
                        isSaved={isRecipeSaved(recipe.id)}
                        idx={idx}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-[#E5E1DA] mt-12 text-center">
        <p className="text-sm text-[#9B9690]">
          © 2026 PantryPal • Made for beginner cooks everywhere.
        </p>
      </footer>
    </div>
  );
}

function RecipeCard({ recipe, onView, onToggleSave, isSaved, idx = 0 }: { 
  recipe: Recipe, 
  onView: () => void, 
  onToggleSave: () => void, 
  isSaved: boolean,
  idx?: number,
  key?: string | number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="bg-white border border-[#E5E1DA] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group border-b-4 border-b-[#FF6B35]/20 flex flex-col"
    >
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-lg font-bold leading-tight group-hover:text-[#FF6B35] transition-colors line-clamp-2">
            {recipe.title}
          </h3>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
            className={`p-2 rounded-xl border transition-all active:scale-90 ${
              isSaved ? 'bg-[#FF6B35] border-[#FF6B35] text-white' : 'bg-white border-[#E5E1DA] text-[#9B9690] hover:text-[#FF6B35]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
        
        <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-[#9B9690]">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {recipe.time}
          </div>
          <div className={`flex items-center gap-1 ${recipe.difficulty === 'beginner' ? 'text-green-600' : 'text-blue-600'}`}>
            <BarChart className="w-3.5 h-3.5" />
            {recipe.difficulty}
          </div>
        </div>

        <div className="space-y-3 flex-1">
          <div>
            <p className="text-[10px] font-black uppercase text-[#FF6B35] mb-1.5 tracking-widest">In your pantry</p>
            <div className="flex flex-wrap gap-1.5">
              {recipe.ingredientsUsed.slice(0, 3).map((ing, i) => (
                <span key={i} className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {ing}
                </span>
              ))}
              {recipe.ingredientsUsed.length > 3 && (
                <span className="text-[11px] text-[#9B9690]">+{recipe.ingredientsUsed.length - 3} more</span>
              )}
            </div>
          </div>

          {recipe.missingIngredients.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase text-[#6B6661] mb-1.5 tracking-widest">Missing</p>
              <div className="flex flex-wrap gap-1.5">
                {recipe.missingIngredients.map((ing, i) => (
                  <span key={i} className="text-[11px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md border border-gray-100 italic">
                    + {ing}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[#F5F2ED] mt-auto">
          <p className="text-sm text-[#4A4540] italic leading-relaxed line-clamp-2">
            "{recipe.briefInstructions}"
          </p>
        </div>

        <button 
          onClick={onView}
          className="w-full mt-4 py-2.5 rounded-xl border border-[#E5E1DA] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-all"
        >
          View Full Recipe
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
