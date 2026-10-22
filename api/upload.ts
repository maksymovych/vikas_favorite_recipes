// Gives the browser a short-lived token to upload a photo straight to Vercel Blob.
// Needs the BLOB_READ_WRITE_TOKEN env var (added automatically when a Blob store is connected in Vercel).
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB per photo

export async function POST(request: Request): Promise<Response> {
  let body: HandleUploadBody
  try {
    body = (await request.json()) as HandleUploadBody
  } catch {
    return Response.json({ error: 'bad_json' }, { status: 400 })
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('submissions/')) throw new Error('Invalid upload path')
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        }
      },
    })
    return Response.json(result)
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 })
  }
}
