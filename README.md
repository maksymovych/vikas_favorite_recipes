# Vika's Recipes 🍲

A responsive recipe site (phone, tablet, desktop) built with Vite, React, TypeScript and Tailwind CSS.

- English / Українська language switch and light / dark theme (both remembered per browser)
- Search by recipe name or ingredient (works in both languages)
- Categories: course, main ingredient (chicken, beef, pork, seafood…), cooking method (oven, air fryer, casserole…) and diet
- Filters: season / occasion (Christmas, Easter, Summer…), cuisine, and ingredients
- Recipe view with a real photo, ingredient checklist and numbered steps

## Run locally

```bash
npm install
npm run dev
```

## Add a recipe

1. `src/data/recipes.ts` — copy an existing recipe, give it a unique `id` and fill in the fields.
   Categories, cuisines and seasons are listed in `src/types.ts`.
2. `src/data/recipes.uk.ts` — add the Ukrainian title, description and steps under the same `id`.
   New ingredient names or notes go in `src/i18n.tsx` (`ingredientUk` / `noteUk`).
3. Photo (optional): put a `.jpg` in `public/images/` named after the `id`, and add it to `src/data/photos.ts`.
   Without a photo the card shows the recipe emoji.

## Photos

Recipe photos come from [Wikimedia Commons](https://commons.wikimedia.org) under free licenses
(CC0, CC BY, CC BY-SA, public domain). Each recipe page credits the author and license with a link to the original.

## Deploy

1. Create an empty repository on GitHub, then:
   ```bash
   git remote add origin https://github.com/<your-user>/vikas-favorite-recipes.git
   git push -u origin main
   ```
2. On [vercel.com](https://vercel.com) choose **Add New → Project**, import the repository and click **Deploy**.
   Vercel detects Vite automatically (build: `npm run build`, output: `dist`).
