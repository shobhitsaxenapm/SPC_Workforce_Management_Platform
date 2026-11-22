import type { FeedbackAuth } from './model';

// Development placeholders only. Never put actual credentials in frontend code.
export const DEV_LOGIN_ID = 'Liam Parker';
export const DEV_PASSWORD = 'local-feedback-only';
const key = 'spc_feedback_mock_session_v2';
const account = { name: 'Liam Parker' };
export function createMockFeedbackAuth(): FeedbackAuth {
  let active = false;
  try { active = sessionStorage.getItem(key) === 'active'; } catch { /* session-only fallback */ }
  return {
    getAccount: () => active ? account : null,
    async login(loginId, password) {
      await new Promise(resolve => setTimeout(resolve, 250));
      if (loginId.trim().toLowerCase() !== DEV_LOGIN_ID.toLowerCase() || password !== DEV_PASSWORD) throw new Error('Login ID or password is incorrect.');
      active = true;
      try { sessionStorage.setItem(key, 'active'); } catch { /* session-only fallback */ }
      return account;
    },
    logout() {
      active = false;
      try { sessionStorage.removeItem(key); } catch { /* session-only fallback */ }
    },
  };
}
export const feedbackAuth = createMockFeedbackAuth();
