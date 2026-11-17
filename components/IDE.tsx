'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { WebContainer } from '@webcontainer/api';
import type { FileSystemTree } from '@webcontainer/api';

const Monaco = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type FileNode = { path: string; content: string };
type Msg = { role: 'user' | 'assistant'; content: string; model?: string };

const STARTER_FILES: FileNode[] = [
  {
    path: 'package.json',
    content: JSON.stringify({
      name: 'my-app', version: '1.0.0', type: 'module',
      scripts: { dev: 'vite --host 0.0.0.0', build: 'vite build' },
      dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
      devDependencies: { vite: '^5.4.10', '@vitejs/plugin-react': '^4.3.3' },
    }, null, 2),
  },
  { path: 'index.html', content: '<!doctype html><html><head><meta charset="UTF-8"><title>App</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>' },
  { path: 'src/main.jsx', content: `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App.jsx';\ncreateRoot(document.getElementById('root')).render(<App />);` },
  { path: 'src/App.jsx', content: `export default function App() {\n  return <div style={{fontFamily:'sans-serif',padding:40}}>\n    <h1>Hello from BuildIDE 👋</h1>\n    <p>Ask the agent on the left to build something.</p>\n  </div>;\n}` },
];

function toTree(files: FileNode[]): FileSystemTree {
  const root: any = {};
  for (const f of files) {
    const parts = f.path.split('/');
    let node = root;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) node[part] = { file: { contents: f.content } };
      else {
        if (!node[part]) node[part] = { directory: {} };
        node = node[part].directory;
      }
    });
  }
  return root as FileSystemTree;
}

export default function IDE() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [files, setFiles] = useState<FileNode[]>(STARTER_FILES);
  const [active, setActive] = useState('src/App.jsx');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [status, setStatus] = useState('Ready');
  const [saveState, setSaveState] = useState('Save');
  const containerRef = useRef<WebContainer | null>(null);
  const serverReady = useRef(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('buildide_key') : null;
    if (saved) setApiKey(saved);
  }, []);

  function saveKey(v: string) {
    setApiKey(v);
    if (typeof window !== 'undefined') localStorage.setItem('buildide_key', v);
  }

  async function bootContainer(): Promise<WebContainer> {
    if (containerRef.current) return containerRef.current;
    setStatus('Booting WebContainer…');
    const wc = await WebContainer.boot();
    await wc.mount(toTree(files));
    containerRef.current = wc;
    setStatus('Installing dependencies…');
    const install = await wc.spawn('npm', ['install']);
    await install.exit;
    setStatus('Starting dev server…');
    const dev = await wc.spawn('npm', ['run', 'dev']);
    const reader = dev.output.getReader();
    (async () => {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = value.replace(/\x1b\[[0-9;]*m/g, '');
        const match = text.match(/https?:\/\/[^\s]+/);
        if (match && !serverReady.current) {
          serverReady.current = true;
          setPreviewUrl(match[0]);
          setStatus('Preview live');
        }
      }
    })();
    return wc;
  }

  async function applyFiles(changed: FileNode[]) {
    setFiles((prev) => {
      const map = new Map(prev.map((f) => [f.path, f.content]));
      changed.forEach((f) => map.set(f.path, f.content));
      return Array.from(map, ([path, content]) => ({ path, content }));
    });
    const wc = containerRef.current;
    if (wc) {
      for (const f of changed) {
        const parts = f.path.split('/');
        let p = '';
        for (let i = 0; i < parts.length - 1; i++) {
          p += (p ? '/' : '') + parts[i];
          try { await wc.fs.mkdir(p, { recursive: true }); } catch {}
        }
        await wc.fs.writeFile(f.path, f.content);
      }
      if (changed.some((f) => /package\.json/.test(f.path))) {
        setStatus('Restarting for new deps…');
        const inst = await wc.spawn('npm', ['install']);
        await inst.exit;
        window.location.reload();
      }
    }
  }

  async function send() {
    if (!input.trim() || busy) return;
    if (!apiKey.startsWith('sk-or-')) {
      setMessages((m) => [...m, { role: 'assistant', content: '⚠️ Add your OpenRouter key above first (free at openrouter.ai/keys).' }]);
      return;
    }
    const userMsg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: userMsg }]);
    setBusy(true);
    setStatus('Agent working…');
    try {
      await bootContainer();
      const history = messages.map(({ role, content }) => ({ role, content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...history, { role: 'user', content: userMsg }], apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Request failed');
      let reply: string = data.content;
      const match = reply.match(/```files\s*([\s\S]*?)```/);
      if (match) {
        try {
          const changed = JSON.parse(match[1].trim());
          await applyFiles(changed);
          reply = reply.replace(match[0], `\n[Applied ${changed.length} file change(s) ✓]`);
        } catch {}
      }
      setMessages((m) => [...m, { role: 'assistant', content: reply, model: `${data.tier} · ${data.model}` }]);
      setStatus(previewUrl ? 'Preview live' : 'Ready');
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: `❌ ${e.message}` }]);
      setStatus('Error');
    } finally {
      setBusy(false);
    }
  }

  async function saveProject() {
    setSaveState('Saving…');
    try {
      let uid = localStorage.getItem('buildide_uid');
      if (!uid) { uid = crypto.randomUUID(); localStorage.setItem('buildide_uid', uid); }
      const name = active.split('/')[0] === 'src' ? 'My App' : active.split('/')[0];
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': uid },
        body: JSON.stringify({ name, files }),
      });
      const data = await res.json();
      setSaveState(res.ok ? 'Saved ✓' : `Error`);
      if (!res.ok) console.error(data.error);
    } catch {
      setSaveState('Error');
    } finally {
      setTimeout(() => setSaveState('Save'), 2000);
    }
  }

  const activeContent = files.find((f) => f.path === active)?.content ?? '';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0f' }}>
      <header style={{ height: 54, borderBottom: '1px solid #262633', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Build<span style={{ color: '#7c5cff' }}>IDE</span></div>
        <span style={{ fontSize: 12, color: '#6a6a80' }}>·</span>
        <input
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => saveKey(e.target.value)}
          placeholder="Paste OpenRouter key (sk-or-…)"
          style={{ flex: 1, maxWidth: 420, background: '#12121a', border: '1px solid #262633', color: '#e8e8f0', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}
        />
        <button onClick={() => setShowKey(!showKey)} style={{ background: 'none', border: '1px solid #262633', color: '#9090a5', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>{showKey ? 'Hide' : 'Show'}</button>
        <a href="https://openrouter.ai/keys" target="_blank" style={{ fontSize: 12, color: '#7c5cff' }}>Get free key</a>
        <button onClick={saveProject} style={{ background: '#262633', border: '1px solid #3a3a4d', color: '#e8e8f0', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>{saveState}</button>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6a6a80' }}>{status}</div>
      </header>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr 1fr', minHeight: 0 }}>
        {/* Chat */}
        <div style={{ borderRight: '1px solid #262633', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: 12, borderBottom: '1px solid #262633', fontWeight: 600, fontSize: 14 }}>💬 Agent</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && <p style={{ color: '#6a6a80', fontSize: 13 }}>Try: “Build a todo app with add/delete and local state”</p>}
            {messages.map((m, i) => (
              <div key={i} style={{ background: m.role === 'user' ? '#1c1733' : '#12121a', border: '1px solid #262633', borderRadius: 10, padding: 10, fontSize: 13, whiteSpace: 'pre-wrap' }}>
                <b style={{ color: m.role === 'user' ? '#b9a9ff' : '#7c5cff' }}>{m.role === 'user' ? 'You' : 'Agent'}</b>
                {m.model && <span style={{ color: '#6a6a80', marginLeft: 8, fontSize: 11 }}>{m.model}</span>}
                <div style={{ marginTop: 6, lineHeight: 1.5 }}>{m.content}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 12, borderTop: '1px solid #262633' }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Describe what to build…" style={{ width: '100%', height: 64, resize: 'none', background: '#12121a', border: '1px solid #262633', color: '#e8e8f0', borderRadius: 8, padding: 10, fontSize: 13 }} />
            <button onClick={send} disabled={busy} style={{ marginTop: 8, width: '100%', background: '#7c5cff', color: '#fff', border: 'none', borderRadius: 8, padding: 10, fontWeight: 700, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Working…' : 'Send ↵'}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: '1px solid #262633' }}>
          <div style={{ padding: 10, borderBottom: '1px solid #262633', fontSize: 12, overflowX: 'auto', whiteSpace: 'nowrap' }}>
            {files.map((f) => <button key={f.path} onClick={() => setActive(f.path)} style={{ background: 'none', border: 'none', color: active === f.path ? '#7c5cff' : '#6a6a80', cursor: 'pointer', padding: '4px 8px', fontSize: 12 }}>{f.path.split('/').pop()}</button>)}
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Monaco height="100%" language={active.endsWith('.json') ? 'json' : active.endsWith('.css') ? 'css' : 'javascript'} theme="vs-dark" value={activeContent}
              onChange={(v) => setFiles((prev) => prev.map((f) => f.path === active ? { ...f, content: v ?? '' } : f))} />
          </div>
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: 10, borderBottom: '1px solid #262633', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>👁 Live Preview</span>
            <button onClick={() => { if (previewUrl) window.open(previewUrl, '_blank'); }} style={{ background: 'none', border: '1px solid #262633', color: '#9090a5', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>Open ↗</button>
          </div>
          <div style={{ flex: 1, background: '#fff' }}>
            {previewUrl ? <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} /> :
              <div style={{ color: '#6a6a80', display: 'grid', placeItems: 'center', height: '100%', textAlign: 'center', padding: 20 }}>
                <div><div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div><p>Preview starts when you send your first prompt.<br />The agent boots a WebContainer and runs your app here.</p></div>
              </div>}
          </div>
        </div>
      </div>
    </div>
  );
}
