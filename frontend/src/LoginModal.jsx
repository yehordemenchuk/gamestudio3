export default function LoginModal({
  open,
  reason,
  strings,
  loading,
  error,
  mode,
  onModeChange,
  loginEmail,
  onLoginEmail,
  loginPassword,
  onLoginPassword,
  regUsername,
  onRegUsername,
  regEmail,
  onRegEmail,
  regPassword,
  onRegPassword,
  onSubmitLogin,
  onSubmitRegister,
  onClose
}) {
  if (!open) return null;

  const effectiveMode = reason === "expired" ? "login" : mode;
  const title = reason === "expired" ? strings.sessionExpiredTitle : strings.signInTitle;

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="auth-modal-shell">
        <div className="auth-modal-panel">
          <h2 id="auth-title">{title}</h2>
          <p className="auth-lead">{strings.authLead}</p>

          {reason !== "expired" ? (
            <div className="auth-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={effectiveMode === "login"}
                className={effectiveMode === "login" ? "active" : ""}
                onClick={() => onModeChange("login")}
              >
                {strings.tabLogin}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={effectiveMode === "register"}
                className={effectiveMode === "register" ? "active" : ""}
                onClick={() => onModeChange("register")}
              >
                {strings.tabRegister}
              </button>
            </div>
          ) : null}

          {error ? <div className="auth-error">{error}</div> : null}

          {effectiveMode === "login" ? (
            <form
              className="auth-form"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitLogin();
              }}
            >
              <label htmlFor="auth-in-email">{strings.email}</label>
              <input
                id="auth-in-email"
                type="email"
                autoComplete="username"
                value={loginEmail}
                onChange={(e) => onLoginEmail(e.target.value)}
                required
              />
              <label htmlFor="auth-in-password">{strings.password}</label>
              <input
                id="auth-in-password"
                type="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => onLoginPassword(e.target.value)}
                required
              />
              <div className="auth-actions">
                <button className="btn auth-btn-primary" type="submit" disabled={loading}>
                  {strings.signIn}
                </button>
                {reason !== "expired" ? (
                  <button type="button" className="btn auth-btn-secondary" onClick={onClose}>
                    {strings.cancel}
                  </button>
                ) : null}
              </div>
            </form>
          ) : (
            <form
              className="auth-form"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitRegister();
              }}
            >
              <label htmlFor="auth-reg-user">{strings.username}</label>
              <input id="auth-reg-user" value={regUsername} onChange={(e) => onRegUsername(e.target.value)} required />
              <label htmlFor="auth-reg-email">{strings.email}</label>
              <input
                id="auth-reg-email"
                type="email"
                autoComplete="email"
                value={regEmail}
                onChange={(e) => onRegEmail(e.target.value)}
                required
              />
              <label htmlFor="auth-reg-password">{strings.password}</label>
              <input
                id="auth-reg-password"
                type="password"
                autoComplete="new-password"
                value={regPassword}
                onChange={(e) => onRegPassword(e.target.value)}
                required
              />
              <div className="auth-actions">
                <button className="btn auth-btn-primary" type="submit" disabled={loading}>
                  {strings.register}
                </button>
                {reason !== "expired" ? (
                  <button type="button" className="btn auth-btn-secondary" onClick={() => onModeChange("login")}>
                    {strings.backToLogin}
                  </button>
                ) : null}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
