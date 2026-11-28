import { auth, configured } from '../../../lib/auth';

async function handler(request: Request) {
  const path = new URL(request.url).pathname;
  const endpoints = ['/api/auth/sign-in/email', '/api/auth/reset-password', '/api/auth/sign-in/social', '/api/auth/callback/google', '/api/auth/get-session', '/api/auth/sign-out', '/api/auth/error'];
  if (!endpoints.includes(path)) return new Response(null, { status: 404 });
  if (!configured()) return Response.json({ message: 'Sign-in configuration is pending.' }, { status: 503 });
  return auth().handler(request);
}

export { handler as GET, handler as POST };
