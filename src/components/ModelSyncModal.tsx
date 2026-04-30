// src/components/ModelSyncModal.tsx
import { useState } from 'react'
import { runSync, getLastChecked } from '../lib/modelSync'
import type { SyncReport } from '../lib/modelSync'

type Props = {
  onClose: () => void
}

function fmt(ts: number) {
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

export function ModelSyncModal({ onClose }: Props) {
  const [report, setReport]   = useState<SyncReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const lastChecked           = getLastChecked()

  const check = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await runSync()
      setReport(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check failed')
    }
    setLoading(false)
  }

  const okStyle:      React.CSSProperties = { color: '#4ade80', fontWeight: 700 }
  const missingStyle: React.CSSProperties = { color: '#f87171', fontWeight: 700 }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        padding: 32, maxWidth: 480, width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700 }}>Model Sync</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        {lastChecked && !report && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>
            Last checked: {fmt(lastChecked)}
          </div>
        )}

        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 20, lineHeight: 1.6 }}>
          Checks OpenRouter's live model catalog and disables any models that are no longer available.
          Generators automatically hide disabled models.
        </p>

        <button className="btn-primary" onClick={check} disabled={loading} style={{ marginBottom: 24 }}>
          {loading ? 'Checking…' : '↻ Check OpenRouter Now'}
        </button>

        {error && (
          <div style={{ color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</div>
        )}

        {report && (
          <>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>
              Checked at {fmt(report.checkedAt)}
            </div>

            <div className="strategy-box" style={{ marginBottom: 16 }}>
              <div className="tactic-label" style={{ marginBottom: 10 }}>Image Models</div>
              {report.imageModels.map(m => (
                <div key={m.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span>{m.label} <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{m.orId}</span></span>
                  <span style={m.status === 'ok' ? okStyle : missingStyle}>
                    {m.status === 'ok' ? '✓ OK' : '✗ Removed'}
                  </span>
                </div>
              ))}
            </div>

            <div className="strategy-box" style={{ marginBottom: 16 }}>
              <div className="tactic-label" style={{ marginBottom: 10 }}>Free Text Models (OpenRouter)</div>
              {report.textModels.map(m => (
                <div key={m.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span>{m.label} <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{m.orId}</span></span>
                  <span style={m.status === 'ok' ? okStyle : missingStyle}>
                    {m.status === 'ok' ? '✓ OK' : '✗ Removed'}
                  </span>
                </div>
              ))}
            </div>

            {report.newImageCandidates.length > 0 && (
              <div className="strategy-box">
                <div className="tactic-label" style={{ marginBottom: 10 }}>🆕 New Image Models on OR</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>
                  Not yet in AVATOOL — requires a code update to add:
                </div>
                {report.newImageCandidates.map(id => (
                  <div key={id} style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-dim)', marginBottom: 4 }}>
                    {id}
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 16 }}>
              Disabled models are hidden automatically until the next successful sync marks them as available again.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
