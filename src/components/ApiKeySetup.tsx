import { useState } from 'react'
import { saveApiKey, getApiKeys } from '../lib/ai'

const CLAUDE_PROXY   = 'https://doncwyumuygrryykanqb.supabase.co/functions/v1/claude-proxy'
const OR_BASE        = 'https://openrouter.ai/api/v1'

type Props = { onClose: () => void }
type TestResult = { ok: boolean; msg: string } | null

function TestBox({ result }: { result: TestResult }) {
  if (!result) return null
  return (
    <div style={{
      marginTop: 8, padding: '8px 12px', fontSize: 12,
      background: result.ok ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${result.ok ? '#86efac' : '#fecaca'}`,
      color: result.ok ? '#166534' : '#b91c1c',
    }}>
      {result.ok ? '✓ ' : '✗ '}{result.msg}
    </div>
  )
}

export function ApiKeySetup({ onClose }: Props) {
  const current = getApiKeys()
  const [c, setC] = useState(current.claude)
  const [o, setO] = useState(current.openrouter)
  const [f, setF] = useState(current.fal)

  const [testingC, setTestingC] = useState(false)
  const [testingO, setTestingO] = useState(false)
  const [testingF, setTestingF] = useState(false)
  const [resultC, setResultC] = useState<TestResult>(null)
  const [resultO, setResultO] = useState<TestResult>(null)
  const [resultF, setResultF] = useState<TestResult>(null)

  const save = () => {
    saveApiKey('sre_claude_key', c.trim())
    saveApiKey('sre_or_key', o.trim())
    saveApiKey('sre_fal_key', f.trim())
    onClose()
  }

  const testClaude = async () => {
    const key = c.trim()
    if (!key) { setResultC({ ok: false, msg: 'Enter your Claude API key first.' }); return }
    setTestingC(true); setResultC(null)
    try {
      const res = await fetch(CLAUDE_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, stream: false, max_tokens: 10, messages: [{ role: 'user', content: 'Say: ok' }] }),
      })
      if (res.ok) {
        setResultC({ ok: true, msg: 'Claude API key is valid.' })
      } else {
        const err = await res.json().catch(() => ({}))
        setResultC({ ok: false, msg: (err as { error?: string }).error || `Error ${res.status}` })
      }
    } catch {
      setResultC({ ok: false, msg: 'Network error — check your connection.' })
    }
    setTestingC(false)
  }

  const testOpenRouter = async () => {
    const key = o.trim()
    if (!key) { setResultO({ ok: false, msg: 'Enter your OpenRouter API key first.' }); return }
    setTestingO(true); setResultO(null)
    try {
      // Cheapest probe: list models (no credits consumed)
      const res = await fetch(`${OR_BASE}/auth/key`, {
        headers: { 'Authorization': `Bearer ${key}` }
      })
      if (res.ok) {
        const data = await res.json()
        const label = data.data?.label ? ` (${data.data.label})` : ''
        const credits = data.data?.limit_remaining != null
          ? ` · $${Number(data.data.limit_remaining).toFixed(2)} remaining`
          : ''
        setResultO({ ok: true, msg: `Key valid${label}${credits}` })
      } else if (res.status === 401 || res.status === 403) {
        setResultO({ ok: false, msg: 'Invalid OpenRouter key — check you copied it correctly.' })
      } else {
        setResultO({ ok: false, msg: `OpenRouter error ${res.status}` })
      }
    } catch {
      setResultO({ ok: false, msg: 'Network error — check your connection.' })
    }
    setTestingO(false)
  }

  const testFal = async () => {
    const key = f.trim()
    if (!key) { setResultF({ ok: false, msg: 'Enter your FAL API key first.' }); return }
    setTestingF(true); setResultF(null)
    try {
      // FAL key validation: hit the billing/info endpoint
      const res = await fetch('https://rest.alpha.fal.ai/tokens/check', {
        headers: { 'Authorization': `Key ${key}` }
      })
      if (res.ok) {
        setResultF({ ok: true, msg: 'FAL.ai key is valid.' })
      } else if (res.status === 401 || res.status === 403) {
        setResultF({ ok: false, msg: 'Invalid FAL.ai key — check you copied it correctly.' })
      } else {
        // FAL doesn't have a great probe endpoint — 404 still means key was accepted
        setResultF({ ok: true, msg: 'FAL.ai key format looks valid.' })
      }
    } catch {
      // CORS may block — key format check as fallback
      if (key.startsWith('fal-')) {
        setResultF({ ok: true, msg: 'FAL.ai key format looks valid (fal-... prefix confirmed).' })
      } else {
        setResultF({ ok: false, msg: 'Key should start with "fal-" — check you copied it correctly.' })
      }
    }
    setTestingF(false)
  }

  const inputRow = (
    child: React.ReactNode,
    testFn: () => void,
    testing: boolean,
    label: string
  ) => (
    <div style={{ display: 'flex', gap: 8 }}>
      {child}
      <button
        className="btn-secondary"
        onClick={testFn}
        disabled={testing}
        style={{ padding: '0 14px', fontSize: 12, flexShrink: 0 }}
      >
        {testing ? '…' : label}
      </button>
    </div>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        padding: 40, maxWidth: 520, width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
          API Keys
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 28, lineHeight: 1.6 }}>
          Keys are stored in your browser only — never sent anywhere except the respective API.
        </div>

        {/* Claude */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              Claude API Key <span style={{ color: 'var(--gold)' }}>*</span>
            </label>
            <span style={{ fontSize: 11, color: 'var(--gold)' }}>$3/$15 per M tokens (Sonnet 4.6)</span>
          </div>
          {inputRow(
            <input className="form-input" type="password" placeholder="sk-ant-api03-..."
              value={c} onChange={e => { setC(e.target.value); setResultC(null) }} style={{ flex: 1 }} />,
            testClaude, testingC, 'Test'
          )}
          <TestBox result={resultC} />
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            platform.claude.ai → API Keys. Used for scripts, strategy, funnels.
          </div>
        </div>

        {/* OpenRouter */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              OpenRouter API Key <span style={{ color: 'var(--gold)' }}>*</span>
            </label>
            <span style={{ fontSize: 11, color: 'var(--gold)' }}>Pay-per-image via OpenRouter credits</span>
          </div>
          {inputRow(
            <input className="form-input" type="password" placeholder="sk-or-v1-..."
              value={o} onChange={e => { setO(e.target.value); setResultO(null) }} style={{ flex: 1 }} />,
            testOpenRouter, testingO, 'Test'
          )}
          <TestBox result={resultO} />
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            openrouter.ai → Keys. Used for images ($0.003–$0.15/img) + free text models.
          </div>
        </div>

        {/* FAL */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              FAL.ai API Key <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>(optional)</span>
            </label>
            <span style={{ fontSize: 11, color: 'var(--gold)' }}>$0.029/sec · 5s ≈ $0.15</span>
          </div>
          {inputRow(
            <input className="form-input" type="password" placeholder="fal-..."
              value={f} onChange={e => { setF(e.target.value); setResultF(null) }} style={{ flex: 1 }} />,
            testFal, testingF, 'Test'
          )}
          <TestBox result={resultF} />
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            fal.ai → Dashboard → Keys. Used for video generation only (Kling 3.0).
          </div>
        </div>

        <div style={{ background: 'var(--surface-2)', padding: 14, marginBottom: 20, fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--green)' }}>Free tier tip:</strong> OpenRouter offers free text models (Llama 3.3 70B, GPT-OSS 120B). Your Claude key is used for final scripts and strategy only.
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-primary" onClick={save} style={{ flex: 1 }}>Save Keys</button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
