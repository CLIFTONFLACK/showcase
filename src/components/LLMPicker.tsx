// src/components/LLMPicker.tsx
import type { TextModel } from '../lib/ai'
import { TEXT_MODELS } from '../lib/ai'
import { getActiveORTextModels } from '../lib/modelSync'
import { InfoTip } from './InfoTip'

type Props = {
  value: TextModel
  onChange: (m: TextModel) => void
}

export function LLMPicker({ value, onChange }: Props) {
  const isOr = TEXT_MODELS[value].provider === 'openrouter'
  const orModels = getActiveORTextModels()

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="form-label">
        AI Model
        <InfoTip text="Claude Sonnet gives the best output quality but requires a paid Anthropic key. OpenRouter free models (Llama 3.3, GPT-OSS, Qwen3) are free but slightly less polished. Good for testing or if you don't have a Claude key." />
      </div>

      {/* Provider toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          className={`chip ${!isOr ? 'active' : ''}`}
          onClick={() => onChange('claude-sonnet')}
          style={{ fontSize: 12, padding: '6px 12px' }}
        >
          Claude
        </button>
        <button
          className={`chip ${isOr ? 'active' : ''}`}
          onClick={() => !isOr && onChange(orModels[0])}
          style={{ fontSize: 12, padding: '6px 12px' }}
        >
          OpenRouter (Free)
        </button>
      </div>

      {/* OR model chips — only shown when OR is active */}
      {isOr && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {orModels.map(m => {
            const info = TEXT_MODELS[m]
            return (
              <button
                key={m}
                className={`chip ${value === m ? 'active' : ''}`}
                onClick={() => onChange(m)}
                style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {info.label}
                <span style={{ fontSize: 9, opacity: 0.7, fontWeight: 700 }}>{info.badge}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
