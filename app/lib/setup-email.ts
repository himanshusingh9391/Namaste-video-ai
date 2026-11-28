import 'server-only';

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM);
}

export async function sendSetupEmail({ email, token }: { email: string; token: string }) {
  if (!emailConfigured()) throw new Error('Email delivery is unavailable.');
  const link = new URL('/sign-in/confirm', process.env.BETTER_AUTH_URL);
  link.hash = new URLSearchParams({ token }).toString();
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM, to: [email], subject: 'Set up your Namaste Video account',
      text: 'Open this link within 15 minutes to verify your email and set up your account.\n\n' + link.href
    }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Email delivery failed.');
}
