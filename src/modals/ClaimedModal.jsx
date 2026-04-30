export function ClaimedModal({ tier, onClose }) {
  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-head">
          <span className="eyebrow">Reward redeemed</span>
          <h2>{tier.title}</h2>
          <p>{tier.desc}. We've emailed the code to your inbox — it will also apply automatically at checkout on your next EPAVANCE order.</p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-primary btn-block" onClick={onClose}>Back to game</button>
        </div>
      </div>
    </div>
  );
}
