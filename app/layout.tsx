import type { Metadata } from 'next';
import './workspace.css';


export const metadata: Metadata = { title: 'Namaste Video | Workspace', description: 'Create narrated educational videos.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
