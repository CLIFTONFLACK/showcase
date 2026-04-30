export function Toasts({ items }) {
  return (
    <div className="toast-stack">
      {items.map((t) => (
        <div className={`toast${t.style ? ' toast-' + t.style : ''}`} key={t.id}>
          {t.text} {t.amt != null && <span className="amt">+{t.amt}</span>}
        </div>
      ))}
    </div>
  );
}
