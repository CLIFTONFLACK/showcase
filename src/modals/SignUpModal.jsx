import { useState } from 'react';
import { fmt } from '../state/dates.js';

export function SignUpModal({ pendingPoints, onComplete, onClose }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('Please enter a valid email.'); return; }
    if (!name.trim()) { setErr('What should we call you?'); return; }
    onComplete({ email, name: name.trim() });
  };
  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-head">
          <span className="eyebrow">Create account</span>
          <h2>Save your points.</h2>
          <p>We'll add <b style={{ color: 'var(--fg-brand-strong)' }}>{fmt(pendingPoints)}</b> to your new EPAVANCE account and unlock the rewards dashboard.</p>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <input placeholder="Your name" value={name} onChange={e => { setName(e.target.value); setErr(''); }} />
          </div>
          <div className="form-row">
            <input type="email" placeholder="you@example.com" value={email} onChange={e => { setEmail(e.target.value); setErr(''); }} />
          </div>
          {err && <div style={{ color: 'var(--danger)', fontSize: 12.5, marginTop: 8 }}>{err}</div>}
          <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 14, lineHeight: 1.55 }}>
            By continuing you agree to our terms. EPAVANCE is a Food for Special Medical Purposes and should be used under medical supervision.
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Not now</button>
          <button className="btn btn-primary" onClick={submit}>Create account &amp; save points</button>
        </div>
      </div>
    </div>
  );
}
