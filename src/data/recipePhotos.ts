// The photo shown for each recipe: your own photo if there is one, otherwise the Wikimedia photo.
import type { Photo } from '../types'
import { myPhotos } from './myPhotos'
import { photos as wikimediaPhotos } from './photos'

const own: Record<string, Photo> = Object.fromEntries(
  Object.entries(myPhotos).map(([id, file]) => [id, { src: `/images/my-photos/${file}`, author: '', license: '', sourceUrl: '' }]),
)

export const photos: Record<string, Photo> = { ...wikimediaPhotos, ...own }
