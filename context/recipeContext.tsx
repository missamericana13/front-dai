import React, { createContext, useState, useContext, ReactNode } from 'react';

type Recipe = {
  name: string;
  image: string | null;
  ingredients: string[];
  instructions: string;
  servings: string;
  tags: string;
};

type RecipeContextType = {
  recipes: Recipe[];
  addRecipe: (recipe: Recipe) => void;
  removeRecipe: (name: string) => void;
};

const RecipeContext = createContext<RecipeContextType | null>(null);

export const RecipeProvider = ({ children }: { children: ReactNode }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      name: 'milanesas con puré',
      image: null,
      ingredients: ['2 papas', '1 huevo', '4 milanesas'],
      instructions:
        'Hervir las papas hasta que estén blandas y hacer puré. Freír las milanesas y servir junto al puré.',
      servings: '2',
      tags: 'fácil, clásico, económico',
    },
  ]);

  const addRecipe = (recipe: Recipe) => {
    setRecipes((prev) => [...prev, recipe]);
  };

  const removeRecipe = (name: string) => {
    const lowerName = name.trim().toLowerCase();
    setRecipes((prev) =>
      prev.filter((recipe) => recipe.name.trim().toLowerCase() !== lowerName)
    );
  };

  return (
    <RecipeContext.Provider value={{ recipes, addRecipe, removeRecipe }}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};
