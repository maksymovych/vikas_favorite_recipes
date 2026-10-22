// Emails a short summary of each new contact-form submission, using Resend (https://resend.com).
// Needs RESEND_API_KEY and NOTIFY_EMAIL. If they're missing, nothing is sent and nothing breaks.

export interface NewSubmission {
  id: number
  name: string
  email: string
  message: string
  recipeName: string
  recipeDescription: string
  recipeIngredients: string
  recipeSteps: string
  photoCount: number
  lang: string
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const block = (label: string, value: string) =>
  value
    ? `<p style="margin:16px 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#0e8f95"><b>${label}</b></p>
       <div style="white-space:pre-wrap;color:#292524">${escape(value)}</div>`
    : ''

export async function notifyNewSubmission(s: NewSubmission, siteOrigin: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.NOTIFY_EMAIL
  if (!apiKey || !to) return

  const from = process.env.NOTIFY_FROM || 'Vika’s Recipes <onboarding@resend.dev>'
  const inbox = `${siteOrigin}/admin`
  const subject = s.recipeName
    ? `New recipe from ${s.name}: ${s.recipeName}`
    : `New message from ${s.name}`

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#292524">
    <h2 style="margin:0 0 4px;color:#0e8f95">${escape(subject)}</h2>
    <p style="margin:0;color:#78716c">${escape(s.name)} · <a href="mailto:${escape(s.email)}">${escape(s.email)}</a> · ${s.lang.toUpperCase()}</p>
    ${block('Message', s.message)}
    ${block('Recipe', s.recipeName)}
    ${block('Description', s.recipeDescription)}
    ${block('Ingredients', s.recipeIngredients)}
    ${block('Steps', s.recipeSteps)}
    ${s.photoCount ? `<p style="margin-top:16px">📷 ${s.photoCount} photo${s.photoCount === 1 ? '' : 's'} attached</p>` : ''}
    <p style="margin-top:28px">
      <a href="${inbox}" style="background:#0e8f95;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold">Open inbox</a>
    </p>
    <p style="margin-top:24px;font-size:12px;color:#a8a29e">Reply to this email to answer ${escape(s.name)} directly.</p>
  </div>`

  const text = [
    subject,
    `${s.name} <${s.email}>`,
    s.message && `\nMessage:\n${s.message}`,
    s.recipeName && `\nRecipe: ${s.recipeName}`,
    s.recipeDescription && `Description: ${s.recipeDescription}`,
    s.recipeIngredients && `\nIngredients:\n${s.recipeIngredients}`,
    s.recipeSteps && `\nSteps:\n${s.recipeSteps}`,
    s.photoCount && `\n${s.photoCount} photo(s) attached`,
    `\nOpen inbox: ${inbox}`,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: to.split(',').map((x) => x.trim()), reply_to: s.email, subject, html, text }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) console.error('notify: Resend error', res.status, await res.text())
  } catch (error) {
    console.error('notify: could not send email', error)
  }
}
