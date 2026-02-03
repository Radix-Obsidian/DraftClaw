import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { User, Subscription } from "../db/schema.js";
import type { UsageSummary } from "../usage/service.js";
import type { PlanLimits } from "../db/schema.js";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface PortalState {
  auth: AuthState;
  subscription: Subscription | null;
  usage: UsageSummary | null;
  planLimits: PlanLimits | null;
  loading: boolean;
  error: string | null;
  currentView: "login" | "register" | "dashboard" | "subscription" | "settings" | "forgot-password";
}

const API_BASE = "/api";

@customElement("portal-app")
export class PortalApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
      --primary-color: #6366f1;
      --primary-hover: #4f46e5;
      --success-color: #10b981;
      --warning-color: #f59e0b;
      --danger-color: #ef4444;
      --bg-color: #f8fafc;
      --card-bg: #ffffff;
      --text-primary: #1e293b;
      --text-secondary: #64748b;
      --border-color: #e2e8f0;
    }

    :host([data-theme="dark"]) {
      --bg-color: #0f172a;
      --card-bg: #1e293b;
      --text-primary: #f1f5f9;
      --text-secondary: #94a3b8;
      --border-color: #334155;
    }

    * {
      box-sizing: border-box;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      min-height: 100vh;
      background: var(--bg-color);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .nav {
      display: flex;
      gap: 1rem;
    }

    .nav-link {
      padding: 0.5rem 1rem;
      color: var(--text-secondary);
      text-decoration: none;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nav-link:hover,
    .nav-link.active {
      background: var(--primary-color);
      color: white;
    }

    .card {
      background: var(--card-bg);
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 1.5rem;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-hover);
    }

    .btn-secondary {
      background: var(--border-color);
      color: var(--text-primary);
    }

    .btn-danger {
      background: var(--danger-color);
      color: white;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error {
      color: var(--danger-color);
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .success {
      color: var(--success-color);
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .auth-container {
      max-width: 400px;
      margin: 4rem auto;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      text-align: center;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .stat-label {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .progress-bar {
      height: 8px;
      background: var(--border-color);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary-color);
      transition: width 0.3s;
    }

    .progress-fill.warning {
      background: var(--warning-color);
    }

    .progress-fill.danger {
      background: var(--danger-color);
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge-success {
      background: #d1fae5;
      color: #065f46;
    }

    .badge-warning {
      background: #fef3c7;
      color: #92400e;
    }

    .badge-danger {
      background: #fee2e2;
      color: #991b1b;
    }

    .badge-info {
      background: #dbeafe;
      color: #1e40af;
    }

    .plan-card {
      border: 2px solid var(--border-color);
      transition: border-color 0.2s;
    }

    .plan-card.current {
      border-color: var(--primary-color);
    }

    .plan-price {
      font-size: 2rem;
      font-weight: 700;
    }

    .plan-price span {
      font-size: 1rem;
      color: var(--text-secondary);
    }

    .plan-features {
      list-style: none;
      padding: 0;
      margin: 1rem 0;
    }

    .plan-features li {
      padding: 0.5rem 0;
      color: var(--text-secondary);
    }

    .plan-features li::before {
      content: "✓";
      color: var(--success-color);
      margin-right: 0.5rem;
    }

    .link {
      color: var(--primary-color);
      cursor: pointer;
      text-decoration: none;
    }

    .link:hover {
      text-decoration: underline;
    }

    .whatsapp-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--bg-color);
      border-radius: 0.5rem;
    }

    .whatsapp-status.linked {
      background: #d1fae5;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
  `;

  @state()
  private state: PortalState = {
    auth: {
      user: null,
      accessToken: null,
      refreshToken: null,
    },
    subscription: null,
    usage: null,
    planLimits: null,
    loading: false,
    error: null,
    currentView: "login",
  };

  @state()
  private formData: Record<string, string> = {};

  @state()
  private theme: 'light' | 'dark' = 'light';

  connectedCallback() {
    super.connectedCallback();
    this.loadAuthState();
    this.loadTheme();
  }

  private loadTheme() {
    const stored = localStorage.getItem('draftclaw_theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = stored || (prefersDark ? 'dark' : 'light');
    
    this.theme = initialTheme;
    this.updateThemeAttribute();
  }

  private toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('draftclaw_theme', this.theme);
    this.updateThemeAttribute();
  }

  private updateThemeAttribute() {
    if (this.theme === 'dark') {
      this.setAttribute('data-theme', 'dark');
    } else {
      this.removeAttribute('data-theme');
    }
  }

  private loadAuthState() {
    const stored = localStorage.getItem("draftclaw_auth");
    if (stored) {
      try {
        const auth = JSON.parse(stored) as AuthState;
        if (auth.accessToken) {
          this.state = { ...this.state, auth, currentView: "dashboard" };
          this.loadUserData();
        }
      } catch {
        localStorage.removeItem("draftclaw_auth");
      }
    }
  }

  private saveAuthState(auth: AuthState) {
    localStorage.setItem("draftclaw_auth", JSON.stringify(auth));
    this.state = { ...this.state, auth };
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.state.auth.accessToken) {
      headers.Authorization = `Bearer ${this.state.auth.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data as T;
  }

  private async loadUserData() {
    this.state = { ...this.state, loading: true, error: null };

    try {
      const profile = await this.apiRequest<{
        user: User;
        subscription: Subscription;
        planLimits: PlanLimits;
      }>("/user/profile");

      const usage = await this.apiRequest<{ usage: UsageSummary }>("/user/usage");

      this.state = {
        ...this.state,
        auth: { ...this.state.auth, user: profile.user },
        subscription: profile.subscription,
        planLimits: profile.planLimits,
        usage: usage.usage,
        loading: false,
      };
    } catch (error) {
      this.state = {
        ...this.state,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load data",
      };
    }
  }

  private async handleLogin(e: Event) {
    e.preventDefault();
    this.state = { ...this.state, loading: true, error: null };

    try {
      const result = await this.apiRequest<{
        user: User;
        tokens: { accessToken: string; refreshToken: string };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: this.formData.email,
          password: this.formData.password,
        }),
      });

      this.saveAuthState({
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      });

      this.formData = {};
      this.state = { ...this.state, currentView: "dashboard", loading: false };
      this.loadUserData();
    } catch (error) {
      this.state = {
        ...this.state,
        loading: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }

  private async handleRegister(e: Event) {
    e.preventDefault();
    this.state = { ...this.state, loading: true, error: null };

    try {
      const result = await this.apiRequest<{
        user: User;
        tokens: { accessToken: string; refreshToken: string };
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: this.formData.email,
          password: this.formData.password,
          phone: this.formData.phone,
        }),
      });

      this.saveAuthState({
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      });

      this.formData = {};
      this.state = { ...this.state, currentView: "dashboard", loading: false };
      this.loadUserData();
    } catch (error) {
      this.state = {
        ...this.state,
        loading: false,
        error: error instanceof Error ? error.message : "Registration failed",
      };
    }
  }

  private handleLogout() {
    localStorage.removeItem("draftclaw_auth");
    this.state = {
      auth: { user: null, accessToken: null, refreshToken: null },
      subscription: null,
      usage: null,
      planLimits: null,
      loading: false,
      error: null,
      currentView: "login",
    };
  }

  private async handleUpgrade(planId: string) {
    this.state = { ...this.state, loading: true, error: null };

    try {
      const result = await this.apiRequest<{ checkoutUrl: string }>("/user/subscription/checkout", {
        method: "POST",
        body: JSON.stringify({ planId }),
      });

      window.location.href = result.checkoutUrl;
    } catch (error) {
      this.state = {
        ...this.state,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to start checkout",
      };
    }
  }

  private async handleManageBilling() {
    this.state = { ...this.state, loading: true, error: null };

    try {
      const result = await this.apiRequest<{ portalUrl: string }>("/user/subscription/portal", {
        method: "POST",
      });

      window.location.href = result.portalUrl;
    } catch (error) {
      this.state = {
        ...this.state,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to open billing portal",
      };
    }
  }

  private setView(view: PortalState["currentView"]) {
    this.state = { ...this.state, currentView: view, error: null };
  }

  private updateFormData(field: string, value: string) {
    this.formData = { ...this.formData, [field]: value };
  }

  private renderLogin() {
    return html`
      <div class="auth-container">
        <div class="card">
          <h2 class="card-title">Sign In to DraftClaw</h2>
          <form @submit=${this.handleLogin}>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input
                type="email"
                class="form-input"
                .value=${this.formData.email || ""}
                @input=${(e: InputEvent) => this.updateFormData("email", (e.target as HTMLInputElement).value)}
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input
                type="password"
                class="form-input"
                .value=${this.formData.password || ""}
                @input=${(e: InputEvent) => this.updateFormData("password", (e.target as HTMLInputElement).value)}
                required
              />
            </div>
            ${this.state.error ? html`<p class="error">${this.state.error}</p>` : ""}
            <button type="submit" class="btn btn-primary" style="width: 100%" ?disabled=${this.state.loading}>
              ${this.state.loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p style="margin-top: 1rem; text-align: center">
            <span class="link" @click=${() => this.setView("forgot-password")}>Forgot password?</span>
          </p>
          <p style="margin-top: 1rem; text-align: center">
            Don't have an account? <span class="link" @click=${() => this.setView("register")}>Sign up</span>
          </p>
        </div>
      </div>
    `;
  }

  private renderRegister() {
    return html`
      <div class="auth-container">
        <div class="card">
          <h2 class="card-title">Create Your Account</h2>
          <form @submit=${this.handleRegister}>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input
                type="email"
                class="form-input"
                .value=${this.formData.email || ""}
                @input=${(e: InputEvent) => this.updateFormData("email", (e.target as HTMLInputElement).value)}
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Phone (optional)</label>
              <input
                type="tel"
                class="form-input"
                .value=${this.formData.phone || ""}
                @input=${(e: InputEvent) => this.updateFormData("phone", (e.target as HTMLInputElement).value)}
              />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input
                type="password"
                class="form-input"
                .value=${this.formData.password || ""}
                @input=${(e: InputEvent) => this.updateFormData("password", (e.target as HTMLInputElement).value)}
                required
              />
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem">
                Min 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>
            ${this.state.error ? html`<p class="error">${this.state.error}</p>` : ""}
            <button type="submit" class="btn btn-primary" style="width: 100%" ?disabled=${this.state.loading}>
              ${this.state.loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p style="margin-top: 1rem; text-align: center">
            Already have an account? <span class="link" @click=${() => this.setView("login")}>Sign in</span>
          </p>
        </div>
      </div>
    `;
  }

  private renderDashboard() {
    const { user } = this.state.auth;
    const { subscription, usage, planLimits } = this.state;

    if (!user) return html`<p>Loading...</p>`;

    const getUsagePercent = (current: number, limit: number) => {
      if (limit === -1) return 0;
      return Math.min(100, (current / limit) * 100);
    };

    const getProgressClass = (percent: number) => {
      if (percent >= 90) return "danger";
      if (percent >= 75) return "warning";
      return "";
    };

    return html`
      <div class="header">
        <div class="logo"><img src="/logo.png" alt="DraftClaw" style="height: 32px; width: auto; vertical-align: middle; margin-right: 8px;">DraftClaw</div>
        <div class="nav">
          <span class="nav-link active" @click=${() => this.setView("dashboard")}>Dashboard</span>
          <span class="nav-link" @click=${() => this.setView("subscription")}>Subscription</span>
          <span class="nav-link" @click=${() => this.setView("settings")}>Settings</span>
          <button class="nav-link" @click=${this.toggleTheme} style="border: none; background: none; cursor: pointer;">
            ${this.theme === 'light' ? '🌙' : '☀️'}
          </button>
          <span class="nav-link" @click=${this.handleLogout}>Logout</span>
        </div>
      </div>

      <h1 class="section-title">Welcome back, ${user.email.split("@")[0]}!</h1>

      <div class="grid">
        <div class="card">
          <h3 class="card-title">Current Plan</h3>
          <div style="display: flex; justify-content: space-between; align-items: center">
            <div>
              <span class="badge ${subscription?.planId === "free" ? "badge-info" : "badge-success"}">
                ${subscription?.planId?.replace("_", " ").toUpperCase() || "FREE"}
              </span>
              <p style="margin-top: 0.5rem; color: var(--text-secondary)">
                ${subscription?.status === "active" ? "Active" : subscription?.status || "Active"}
              </p>
            </div>
            ${subscription?.planId === "free"
              ? html`<button class="btn btn-primary" @click=${() => this.setView("subscription")}>Upgrade</button>`
              : html`<button class="btn btn-secondary" @click=${this.handleManageBilling}>Manage Billing</button>`}
          </div>
        </div>

        <div class="card">
          <h3 class="card-title">WhatsApp Status</h3>
          <div class="whatsapp-status ${user.whatsappLinked ? "linked" : ""}">
            <span>${user.whatsappLinked ? "✓ Connected" : "○ Not connected"}</span>
            ${user.whatsappJid ? html`<span style="color: var(--text-secondary)">${user.whatsappJid}</span>` : ""}
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">Usage This Month</h3>
        <div class="grid">
          ${this.renderUsageStat("API Calls", usage?.apiCalls || 0, planLimits?.apiCallsPerMonth || 0)}
          ${this.renderUsageStat("Messages Sent", usage?.messagesSent || 0, planLimits?.messagesPerMonth || 0)}
          ${this.renderUsageStat("AI Tokens", usage?.aiTokens || 0, planLimits?.aiTokensPerMonth || 0)}
          ${this.renderUsageStat("Media Uploads", usage?.mediaUploads || 0, planLimits?.mediaUploadsMb || 0)}
        </div>
      </div>
    `;
  }

  private renderUsageStat(label: string, current: number, limit: number) {
    const percent = limit === -1 ? 0 : Math.min(100, (current / limit) * 100);
    const progressClass = percent >= 90 ? "danger" : percent >= 75 ? "warning" : "";

    return html`
      <div class="stat-card">
        <div class="stat-value">${this.formatNumber(current)}</div>
        <div class="stat-label">${label}</div>
        <div style="font-size: 0.75rem; color: var(--text-secondary)">
          of ${limit === -1 ? "Unlimited" : this.formatNumber(limit)}
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${progressClass}" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  private renderSubscription() {
    return html`
      <div class="header">
        <div class="logo"><img src="/logo.png" alt="DraftClaw" style="height: 32px; width: auto; vertical-align: middle; margin-right: 8px;">DraftClaw</div>
        <div class="nav">
          <span class="nav-link" @click=${() => this.setView("dashboard")}>Dashboard</span>
          <span class="nav-link active" @click=${() => this.setView("subscription")}>Subscription</span>
          <span class="nav-link" @click=${() => this.setView("settings")}>Settings</span>
          <button class="nav-link" @click=${this.toggleTheme} style="border: none; background: none; cursor: pointer;">
            ${this.theme === 'light' ? '🌙' : '☀️'}
          </button>
          <span class="nav-link" @click=${this.handleLogout}>Logout</span>
        </div>
      </div>

      <h1 class="section-title">Choose Your Plan</h1>
      ${this.state.error ? html`<p class="error">${this.state.error}</p>` : ""}

      <div class="grid">
        ${this.renderPlanCard("free", "Free", 0, [
          "1,000 API calls/month",
          "500 messages/month",
          "50K AI tokens/month",
          "1 WhatsApp account",
          "Community support",
        ])}
        ${this.renderPlanCard("pro_monthly", "Pro", 29, [
          "50,000 API calls/month",
          "10,000 messages/month",
          "1M AI tokens/month",
          "5 WhatsApp accounts",
          "Priority support",
          "Custom branding",
        ])}
        ${this.renderPlanCard("goat_monthly", "GOAT", 99, [
          "Unlimited API calls",
          "Unlimited messages",
          "Unlimited AI tokens",
          "Unlimited WhatsApp accounts",
          "Dedicated support",
          "Custom integrations",
          "SLA guarantee",
        ])}
      </div>
    `;
  }

  private renderPlanCard(planId: string, name: string, price: number, features: string[]) {
    const isCurrent = this.state.subscription?.planId === planId || 
      (planId === "free" && !this.state.subscription?.planId);

    return html`
      <div class="card plan-card ${isCurrent ? "current" : ""}">
        <h3 class="card-title">${name}</h3>
        <div class="plan-price">
          $${price}<span>/month</span>
        </div>
        <ul class="plan-features">
          ${features.map((f) => html`<li>${f}</li>`)}
        </ul>
        ${isCurrent
          ? html`<button class="btn btn-secondary" disabled style="width: 100%">Current Plan</button>`
          : planId === "free"
            ? html`<button class="btn btn-secondary" disabled style="width: 100%">Downgrade via Billing</button>`
            : html`<button
                class="btn btn-primary"
                style="width: 100%"
                @click=${() => this.handleUpgrade(planId)}
                ?disabled=${this.state.loading}
              >
                ${this.state.loading ? "Loading..." : "Upgrade"}
              </button>`}
      </div>
    `;
  }

  private renderSettings() {
    const { user } = this.state.auth;
    if (!user) return html`<p>Loading...</p>`;

    return html`
      <div class="header">
        <div class="logo"><img src="/logo.png" alt="DraftClaw" style="height: 32px; width: auto; vertical-align: middle; margin-right: 8px;">DraftClaw</div>
        <div class="nav">
          <span class="nav-link" @click=${() => this.setView("dashboard")}>Dashboard</span>
          <span class="nav-link" @click=${() => this.setView("subscription")}>Subscription</span>
          <span class="nav-link active" @click=${() => this.setView("settings")}>Settings</span>
          <button class="nav-link" @click=${this.toggleTheme} style="border: none; background: none; cursor: pointer;">
            ${this.theme === 'light' ? '🌙' : '☀️'}
          </button>
          <span class="nav-link" @click=${this.handleLogout}>Logout</span>
        </div>
      </div>

      <h1 class="section-title">Account Settings</h1>

      <div class="card">
        <h3 class="card-title">Profile Information</h3>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" .value=${user.email} disabled />
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input type="tel" class="form-input" .value=${user.phone || ""} placeholder="Not set" />
        </div>
        <button class="btn btn-primary">Save Changes</button>
      </div>

      <div class="card">
        <h3 class="card-title">WhatsApp Connection</h3>
        <p style="color: var(--text-secondary); margin-bottom: 1rem">
          Connect your WhatsApp account to enable messaging features.
        </p>
        <div class="whatsapp-status ${user.whatsappLinked ? "linked" : ""}">
          ${user.whatsappLinked
            ? html`
                <span>✓ Connected: ${user.whatsappJid}</span>
                <button class="btn btn-secondary" style="margin-left: auto">Disconnect</button>
              `
            : html`
                <span>Not connected</span>
                <button class="btn btn-primary" style="margin-left: auto">Connect WhatsApp</button>
              `}
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">Security</h3>
        <button class="btn btn-secondary">Change Password</button>
      </div>

      <div class="card" style="border-color: var(--danger-color)">
        <h3 class="card-title" style="color: var(--danger-color)">Danger Zone</h3>
        <p style="color: var(--text-secondary); margin-bottom: 1rem">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button class="btn btn-danger">Delete Account</button>
      </div>
    `;
  }

  render() {
    const { currentView } = this.state;

    return html`
      <div class="container">
        ${currentView === "login" ? this.renderLogin() : ""}
        ${currentView === "register" ? this.renderRegister() : ""}
        ${currentView === "dashboard" ? this.renderDashboard() : ""}
        ${currentView === "subscription" ? this.renderSubscription() : ""}
        ${currentView === "settings" ? this.renderSettings() : ""}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "portal-app": PortalApp;
  }
}
