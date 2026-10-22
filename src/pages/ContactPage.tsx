import { upload } from '@vercel/blob/client'
import { CheckCircle2, ChefHat, ImagePlus, Loader2, Mail, MessageCircleHeart, NotebookPen, X } from 'lucide-react'
import { useEffect, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useLang } from '../i18n'

const MAX_PHOTOS = 5
const MAX_DIMENSION = 2200 // big enough to read a handwritten recipe

interface Photo {
  id: string
  file: File
  preview: string
}

type Status = { kind: 'idle' } | { kind: 'uploading'; current: number; total: number } | { kind: 'sending' } | { kind: 'sent' }

/** Shrinks large photos before upload (phone photos are often 5–10 MB). Falls back to the original file. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
    return blob ?? file
  } catch {
    return file // e.g. HEIC in browsers that can't read it
  }
}

function safeName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'photo'
  )
}

const inputCls =
  'w-full rounded-xl border border-stone-200 bg-surface px-4 py-3 text-stone-800 shadow-sm outline-none placeholder:text-stone-400 focus:border-accent focus:ring-4 focus:ring-accent/15'

function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string
  hint?: string
  optional?: boolean
  children: ReactNode
}) {
  const { d } = useLang()
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-2 text-sm font-semibold text-stone-800">
        {label}
        {optional && <span className="text-xs font-normal text-stone-400">({d.t.fOptional})</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  )
}

export default function ContactPage() {
  const { d } = useLang()
  const t = d.t
  const fileInput = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // spam trap, hidden from people
  const [shareRecipe, setShareRecipe] = useState(false)
  const [recipeName, setRecipeName] = useState('')
  const [recipeDescription, setRecipeDescription] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [steps, setSteps] = useState('')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = `${t.contactTitle} · ${d.lang === 'uk' ? 'Рецепти Віки' : 'Vika’s Recipes'}`
  }, [t.contactTitle, d.lang])

  // Free preview memory when photos are removed or the page closes
  const photosRef = useRef(photos)
  photosRef.current = photos
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), [])

  const addFiles = (list: FileList | null) => {
    if (!list) return
    setError('')
    const images = [...list].filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
    if (images.length < list.length) setError(t.errNotImage)
    const room = MAX_PHOTOS - photos.length
    if (images.length > room) setError(t.errTooMany)
    const added = images.slice(0, Math.max(0, room)).map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotos((prev) => [...prev, ...added])
  }

  const removePhoto = (id: string) =>
    setPhotos((prev) => {
      const gone = prev.find((p) => p.id === id)
      if (gone) URL.revokeObjectURL(gone.preview)
      return prev.filter((p) => p.id !== id)
    })

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const reset = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.preview))
    setName('')
    setEmail('')
    setMessage('')
    setShareRecipe(false)
    setRecipeName('')
    setRecipeDescription('')
    setIngredients('')
    setSteps('')
    setPhotos([])
    setError('')
    setStatus({ kind: 'idle' })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError(t.errName)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError(t.errEmail)
    const hasRecipe = shareRecipe && (recipeName.trim() || photos.length > 0)
    if (!message.trim() && !hasRecipe) return setError(t.errEmpty)

    // 1. Upload photos
    const urls: string[] = []
    const toUpload = shareRecipe ? photos : []
    try {
      for (let i = 0; i < toUpload.length; i++) {
        setStatus({ kind: 'uploading', current: i + 1, total: toUpload.length })
        const blob = await shrink(toUpload[i].file)
        const ext = blob.type === 'image/jpeg' ? 'jpg' : (toUpload[i].file.name.split('.').pop() ?? 'jpg')
        const result = await upload(`submissions/${safeName(toUpload[i].file.name)}.${ext}`, blob, {
          access: 'private',
          handleUploadUrl: '/api/upload',
          contentType: blob.type || undefined,
        })
        urls.push(result.url)
      }
    } catch {
      setStatus({ kind: 'idle' })
      return setError(t.errUpload)
    }

    // 2. Save the message
    setStatus({ kind: 'sending' })
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          website,
          lang: d.lang,
          images: urls,
          recipe: shareRecipe
            ? { name: recipeName, description: recipeDescription, ingredients, steps }
            : undefined,
        }),
      })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !body.ok) {
        setStatus({ kind: 'idle' })
        const map: Record<string, string> = {
          name: t.errName,
          email: t.errEmail,
          empty: t.errEmpty,
          not_configured: t.errNotConfigured,
        }
        return setError(map[body.error ?? ''] ?? t.errGeneric)
      }
      setStatus({ kind: 'sent' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setStatus({ kind: 'idle' })
      setError(t.errGeneric)
    }
  }

  const busy = status.kind === 'uploading' || status.kind === 'sending'

  if (status.kind === 'sent') {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center sm:py-28">
        <CheckCircle2 size={64} className="mx-auto text-accent" strokeWidth={1.6} />
        <h1 className="font-display mt-5 text-4xl font-bold text-stone-900">{t.sentTitle}</h1>
        <p className="mt-3 text-lg text-stone-600">{t.sentText}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="rounded-2xl bg-accent px-6 py-3 font-semibold text-white shadow-md shadow-teal-700/20 hover:opacity-95"
          >
            {t.back}
          </Link>
          <button
            type="button"
            onClick={reset}
            className="rounded-2xl border border-stone-200 bg-surface px-6 py-3 font-semibold text-stone-800 hover:bg-stone-100"
          >
            {t.sendAnother}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1.35fr] lg:gap-14 lg:px-8">
      {/* Intro */}
      <section className="lg:pt-6">
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase sm:text-sm">{t.contactEyebrow}</p>
        <h1 className="font-display mt-3 text-4xl leading-tight font-extrabold text-stone-900 sm:text-5xl">
          {t.contactTitle}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-stone-600">{t.contactIntro}</p>
        <ul className="mt-8 space-y-4">
          {[
            [<MessageCircleHeart key="a" size={22} />, t.contactPoint1],
            [<ChefHat key="b" size={22} />, t.contactPoint2],
            [<NotebookPen key="c" size={22} />, t.contactPoint3],
          ].map(([icon, label], i) => (
            <li key={i} className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                {icon}
              </span>
              <span className="text-stone-700">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Form */}
      <form
        onSubmit={submit}
        noValidate
        className="space-y-5 rounded-3xl border border-stone-200/70 bg-surface p-5 shadow-xl shadow-teal-900/5 sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.fName}>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} required />
          </Field>
          <Field label={t.fEmail}>
            <input
              className={inputCls}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              maxLength={200}
              required
            />
          </Field>
        </div>

        <Field label={t.fMessage} hint={shareRecipe ? t.fMessageHint : undefined}>
          <textarea
            className={`${inputCls} min-h-28 resize-y`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={5000}
          />
        </Field>

        {/* Spam trap: hidden from people, bots fill it in */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
          aria-hidden
        />

        {/* Share a recipe toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={shareRecipe}
          onClick={() => setShareRecipe((v) => !v)}
          className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition ${
            shareRecipe ? 'border-accent bg-accent-soft' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
          }`}
        >
          <ChefHat size={22} className={shareRecipe ? 'text-accent' : 'text-stone-500'} />
          <span className="flex-1 font-semibold text-stone-900">{t.fShareRecipe}</span>
          <span
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${shareRecipe ? 'bg-accent' : 'bg-stone-300'}`}
            aria-hidden
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                shareRecipe ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </span>
        </button>

        {shareRecipe && (
          <div className="animate-slide-up space-y-5 rounded-2xl border border-dashed border-accent/40 p-4 sm:p-5">
            <Field label={t.fRecipeName} optional>
              <input className={inputCls} value={recipeName} onChange={(e) => setRecipeName(e.target.value)} maxLength={200} />
            </Field>
            <Field label={t.fRecipeDescription} optional>
              <input
                className={inputCls}
                value={recipeDescription}
                onChange={(e) => setRecipeDescription(e.target.value)}
                maxLength={2000}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t.fIngredients} hint={t.fIngredientsHint} optional>
                <textarea
                  className={`${inputCls} min-h-36 resize-y`}
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  maxLength={5000}
                />
              </Field>
              <Field label={t.fSteps} optional>
                <textarea
                  className={`${inputCls} min-h-36 resize-y`}
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  maxLength={8000}
                />
              </Field>
            </div>

            {/* Photos */}
            <div>
              <p className="mb-1.5 flex items-baseline gap-2 text-sm font-semibold text-stone-800">
                {t.fPhotos} <span className="text-xs font-normal text-stone-400">({t.fOptional})</span>
              </p>
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
                    dragging ? 'border-accent bg-accent-soft' : 'border-stone-300 hover:border-accent hover:bg-stone-50'
                  }`}
                >
                  <ImagePlus size={30} className="text-accent" />
                  <span className="font-medium text-stone-800">{t.fDrop}</span>
                  <span className="text-xs text-stone-500">{t.fPhotosHint}</span>
                </button>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files)
                  e.target.value = ''
                }}
              />
              {photos.length > 0 && (
                <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {photos.map((p) => (
                    <li key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-stone-100">
                      <img src={p.preview} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        aria-label={t.fRemovePhoto}
                        title={t.fRemovePhoto}
                        disabled={busy}
                        className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                      >
                        <X size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-4 font-semibold text-white shadow-md shadow-teal-700/20 transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:opacity-70 sm:w-auto"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
          {status.kind === 'uploading'
            ? t.fUploading(status.current, status.total)
            : status.kind === 'sending'
              ? t.fSending
              : t.fSend}
        </button>
      </form>
    </main>
  )
}
