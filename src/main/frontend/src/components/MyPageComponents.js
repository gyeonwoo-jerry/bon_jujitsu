// components/mypage/MyPageComponents.js
// 마이페이지 관련 모든 컴포넌트들

// 1. MyPageSummaryCard 컴포넌트 - 요약 정보 카드
const MyPageSummaryCard = ({
  label,
  value,
  description,
  color = "blue",
  icon = null,
  onClick = null,
  loading = false
}) => {
  const handleClick = () => {
    if (onClick && typeof onClick === 'function') {
      onClick();
    }
  };

  return (
      <div
          className={`mypage-summary-card ${color} ${onClick ? 'clickable' : ''} ${loading ? 'loading' : ''}`}
          onClick={handleClick}
      >
        <div className="card-header">
          <div className="card-header-content">
            {icon && <span className="card-icon">{icon}</span>}
            <h3 className="card-label">{label}</h3>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
              <div className="card-loading">
                <div className="loading-spinner"></div>
                <p className="loading-text">로딩 중...</p>
              </div>
          ) : (
              <>
                <div className="card-value">{value}</div>
                <p className="card-description">{description}</p>
              </>
          )}
        </div>
        {onClick && (
            <div className="card-hover-indicator">
              <span>자세히 보기 →</span>
            </div>
        )}
      </div>
  );
};

// 2. MyPageQuickLinkButton 컴포넌트 - 퀵링크 버튼
const MyPageQuickLinkButton = ({
  title,
  path,
  icon,
  description,
  disabled = false,
  badge = null,
  external = false
}) => {
  const handleClick = () => {
    if (disabled) return;

    if (external) {
      window.open(path, '_blank');
    } else {
      window.location.href = path;
    }
  };

  return (
      <button
          className={`mypage-quick-link-button ${disabled ? 'disabled' : ''}`}
          onClick={handleClick}
          disabled={disabled}
      >
        <div className="button-icon">
          {icon}
          {badge && <span className="button-badge">{badge}</span>}
        </div>
        <div className="button-content">
          <h4 className="button-title">
            {title}
            {external && <span className="external-icon">🔗</span>}
          </h4>
          <p className="button-description">{description}</p>
        </div>
        <div className="button-arrow">
          {disabled ? '🔒' : '→'}
        </div>
      </button>
  );
};

// 3. MyPageStatusBadge 컴포넌트 - 상태 표시 배지
const MyPageStatusBadge = ({
  status,
  text,
  size = "medium"
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'green';
      case 'warning': return 'yellow';
      case 'error': return 'red';
      case 'info': return 'blue';
      case 'pending': return 'orange';
      default: return 'gray';
    }
  };

  return (
      <span className={`status-badge ${getStatusColor(status)} ${size}`}>
      {text}
    </span>
  );
};

// 4. MyPageEmptyState 컴포넌트 - 빈 상태 표시
const MyPageEmptyState = ({
  icon = "📭",
  title = "데이터가 없습니다",
  description = "아직 내용이 없습니다.",
  actionText = null,
  actionHandler = null
}) => {
  return (
      <div className="mypage-empty-state">
        <div className="empty-icon">{icon}</div>
        <h3 className="empty-title">{title}</h3>
        <p className="empty-description">{description}</p>
        {actionText && actionHandler && (
            <button
                className="empty-action-button"
                onClick={actionHandler}
            >
              {actionText}
            </button>
        )}
      </div>
  );
};

// 5. MyPageLoadingSpinner 컴포넌트 - 로딩 표시
const MyPageLoadingSpinner = ({
  size = "medium",
  message = "로딩 중..."
}) => {
  return (
      <div className={`mypage-loading-spinner ${size}`}>
        <div className="spinner"></div>
        <p className="loading-message">{message}</p>
      </div>
  );
};

// 6. MyPageInfoCard 컴포넌트 - 정보 표시 카드
const MyPageInfoCard = ({
  title,
  items = [],
  variant = "default"
}) => {
  return (
      <div className={`mypage-info-card ${variant}`}>
        <h4 className="info-card-title">{title}</h4>
        <div className="info-card-content">
          {items.map((item, index) => (
              <div key={index} className="info-item">
                <span className="info-label">{item.label}:</span>
                <span className="info-value">{item.value}</span>
              </div>
          ))}
        </div>
      </div>
  );
};

// 7. MyPageProgressBar 컴포넌트 - 진행률 표시
const MyPageProgressBar = ({
  progress = 0,
  label = "",
  showPercentage = true,
  color = "blue"
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
      <div className="mypage-progress-bar">
        {label && (
            <div className="progress-header">
              <span className="progress-label">{label}</span>
              {showPercentage && (
                  <span className="progress-percentage">{clampedProgress}%</span>
              )}
            </div>
        )}
        <div className="progress-track">
          <div
              className={`progress-fill ${color}`}
              style={{ width: `${clampedProgress}%` }}
          ></div>
        </div>
      </div>
  );
};

// 8. MyPageAlert 컴포넌트 - 알림 메시지
const MyPageAlert = ({
  type = "info",
  title,
  message,
  closable = false,
  onClose = null
}) => {
  return (
      <div className={`mypage-alert ${type}`}>
        <div className="alert-icon">
          {type === 'success' && '✅'}
          {type === 'warning' && '⚠️'}
          {type === 'error' && '❌'}
          {type === 'info' && 'ℹ️'}
        </div>
        <div className="alert-content">
          {title && <h4 className="alert-title">{title}</h4>}
          <p className="alert-message">{message}</p>
        </div>
        {closable && (
            <button
                className="alert-close"
                onClick={onClose}
            >
              ✕
            </button>
        )}
      </div>
  );
};

// 모든 컴포넌트 export
export {
  MyPageSummaryCard,
  MyPageQuickLinkButton,
  MyPageStatusBadge,
  MyPageEmptyState,
  MyPageLoadingSpinner,
  MyPageInfoCard,
  MyPageProgressBar,
  MyPageAlert
};