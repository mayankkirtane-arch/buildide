import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 80 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Build<span style={{ color: '#7c5cff' }}>IDE</span></div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="#features" style={{ color: '#a0a0b0' }}>Features</a>
          <a href="#pricing" style={{ color: '#a0a0b0' }}>Pricing</a>
          <Link href="/builder" style={{ background: '#7c5cff', padding: '10px 18px', borderRadius: 8, fontWeight: 600 }}>Launch IDE →</Link>
        </div>
      </nav>

      <section style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 90px' }}>
        <div style={{ display: 'inline-block', border: '1px solid #7c5cff', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: '#b9a9ff', marginBottom: 24 }}>
          Browser IDE + AI coding agent · Bring your own API key
        </div>
        <h1 style={{ fontSize: 58, lineHeight: 1.1, margin: '0 0 24px', fontWeight: 800 }}>
          Build apps in your browser with an <span style={{ color: '#7c5cff' }}>AI agent</span>
        </h1>
        <p style={{ fontSize: 20, color: '#a8a8bb', lineHeight: 1.6, marginBottom: 32 }}>
          Describe what you want. The agent writes real files, runs them instantly in a WebContainer, and shows a live preview — all in your browser. Use your own API key, so you never pay token markup.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/builder" style={{ background: '#7c5cff', padding: '15px 28px', borderRadius: 10, fontWeight: 700, fontSize: 17 }}>Start building free →</Link>
          <a href="#pricing" style={{ border: '1px solid #333', padding: '15px 28px', borderRadius: 10, fontWeight: 600, fontSize: 17 }}>See pricing</a>
        </div>
        <p style={{ color: '#6a6a80', fontSize: 14, marginTop: 18 }}>No install · No credit card · Works on Chromebook, iPad, any browser</p>
      </section>

      <section id="features" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 20, marginBottom: 90 }}>
        {[
          ['💬', 'AI Agent', 'Chat-driven. The agent reads, writes, and runs your files.'],
          ['⚡', 'Instant Preview', 'WebContainers run your app in-browser. Zero server cost.'],
          ['🔑', 'Bring Your Key', 'Use your OpenRouter key. Pay providers directly, no markup.'],
          ['🧠', 'Smart Routing', 'Free model for small edits, frontier model for big builds.'],
          ['📁', 'Real Filesystem', 'Monaco editor + file tree + terminal. A true IDE, in-browser.'],
          ['🚀', 'Deploy Ready', 'Export or push to GitHub when you are done.'],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ background: '#12121a', border: '1px solid #262633', borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 30, marginBottom: 12 }}>{icon}</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{title}</h3>
            <p style={{ color: '#9090a5', margin: 0, lineHeight: 1.6, fontSize: 14 }}>{desc}</p>
          </div>
        ))}
      </section>

      <section id="pricing" style={{ textAlign: 'center', marginBottom: 90 }}>
        <h2 style={{ fontSize: 38, marginBottom: 12 }}>Simple pricing</h2>
        <p style={{ color: '#9090a5', marginBottom: 40 }}>Start free. Upgrade when you need more.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24, maxWidth: 720, margin: '0 auto' }}>
          <div style={{ background: '#12121a', border: '1px solid #262633', borderRadius: 16, padding: 32 }}>
            <h3 style={{ margin: 0 }}>Free</h3>
            <div style={{ fontSize: 44, fontWeight: 800, margin: '16px 0' }}>$0</div>
            <p style={{ color: '#9090a5' }}>10 prompts/day · Your own key · All core features</p>
            <Link href="/builder" style={{ display: 'block', marginTop: 24, border: '1px solid #333', padding: 12, borderRadius: 8, textAlign: 'center' }}>Get started</Link>
          </div>
          <div style={{ background: '#12121a', border: '2px solid #7c5cff', borderRadius: 16, padding: 32 }}>
            <h3 style={{ margin: 0 }}>Pro</h3>
            <div style={{ fontSize: 44, fontWeight: 800, margin: '16px 0' }}>$15<span style={{ fontSize: 16, color: '#9090a5' }}>/mo</span></div>
            <p style={{ color: '#9090a5' }}>Unlimited prompts · Priority routing · Team workspaces · Deploy</p>
            <Link href="/builder" style={{ display: 'block', marginTop: 24, background: '#7c5cff', padding: 12, borderRadius: 8, textAlign: 'center', fontWeight: 700 }}>Go Pro</Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #262633', paddingTop: 32, color: '#6a6a80', fontSize: 14, display: 'flex', gap: 24 }}>
        <span>© {new Date().getFullYear()} BuildIDE</span>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </footer>
    </main>
  );
}
