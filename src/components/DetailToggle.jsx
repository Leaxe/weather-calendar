export default function DetailToggle({ showDetails, onToggle }) {
  return (
    <button
      className={`detail-toggle ${showDetails ? 'detail-toggle--active' : ''}`}
      onClick={onToggle}
      title={showDetails ? 'Hide weather details' : 'Show weather details'}
    >
      <span className="detail-toggle__icon">🌡️</span>
      <span className="detail-toggle__label">
        {showDetails ? 'Hide Details' : 'Weather Details'}
      </span>
    </button>
  );
}
