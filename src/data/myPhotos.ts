// Your own recipe photos. They replace the Wikimedia photos for those recipes.
//
// To add one:
//   1. Put the image in  public/images/my-photos/   (a .jpg about 1200–2000 px wide is ideal)
//   2. Add a line below:  'recipe-id': 'file-name.jpg',
//      (the recipe id is the `id` in src/data/recipes.ts, also the end of the recipe page link)

export const myPhotos: Record<string, string> = {
  'zuppa-toscana': 'zuppa-toscana.jpg',
}
