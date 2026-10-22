# Vika's Recipes 🍲

A responsive recipe site (phone, tablet, desktop) built with Vite, React, TypeScript and Tailwind CSS.

- Search by recipe name or ingredient
- Filter by category (Pasta, Main, Soup, Salad, Baking, Dessert, Breakfast, Drinks)
- Filter by season / occasion (Christmas, New Year, Easter, Summer, …)
- Filter by ingredients (shows recipes that use all selected ingredients)
- Recipe view with an ingredient checklist and numbered steps

## Run locally

```bash
npm install
npm run dev
```

## Add a recipe

Open `src/data/recipes.ts`, copy an existing recipe object, give it a unique `id` and fill in the fields.
Categories and seasons are listed in `src/types.ts`.

## Deploy

1. Create an empty repository on GitHub, then:
   ```bash
   git remote add origin https://github.com/<your-user>/vikas-favorite-recipes.git
   git push -u origin main
   ```
2. On [vercel.com](https://vercel.com) choose **Add New → Project**, import the repository and click **Deploy**.
   Vercel detects Vite automatically (build: `npm run build`, output: `dist`).
