import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BuildIDE — Browser IDE + AI Agent',
  description: 'Build apps in your browser with an AI agent that writes, runs, and deploys code. Bring your own API key. $15/mo.',
  keywords: ['browser IDE', 'AI code IDE', 'web IDE', 'AI coding agent', 'build app with AI', 'BYOK IDE'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
