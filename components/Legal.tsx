import Link from 'next/link';
export default function Legal({ title }: { title: string }) {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px', lineHeight: 1.7 }}>
      <Link href="/" style={{ color: '#7c5cff' }}>← Back</Link>
      <h1>{title}</h1>
      <p style={{ color: '#9090a5' }}>BuildIDE is a browser-based development tool. You bring your own AI API key; prompts are sent directly to the provider you choose. We do not store your API key on our servers — it stays in your browser. Generated code runs locally in your browser via WebContainers.</p>
      <p style={{ color: '#9090a5' }}>BuildIDE is provided "as is". You are responsible for code you generate and deploy. Contact: support@buildide.app</p>
      <p style={{ color: '#6a6a80', fontSize: 13 }}>Last updated: {new Date().getFullYear()}</p>
    </main>
  );
}
