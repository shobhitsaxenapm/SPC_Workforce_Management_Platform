
const pages: Record<string, string> = {
  '/': 'Dashboard', '/clients': 'Clients', '/projects': 'Projects', '/job-desk': 'Jobs',
  '/candidates': 'Candidates', '/interviews': 'Interviews', '/offers': 'Offers',
  '/onboarding': 'Onboarding', '/employees': 'Employees', '/deployments': 'Deployments',
  '/attendance': 'Attendance', '/billing': 'Billing', '/offboarding': 'Offboarding',
  '/settings': 'Settings', '/users': 'Users', '/careers-page': 'Careers administration',
};

export const actionNames = {
  navigate: 'Viewed page', createClient: 'Created client', createCandidate: 'Created candidate',
  createJob: 'Created job', updateJob: 'Updated job',
} as const;
export type Activity = {
  action: string; timestamp: string; page: string; module: string;
  outcome: 'Success' | 'Failure' | 'Unknown'; source: 'Captured';
};
export type Reporter = { id: string; name: string; role: string };
export type TechnicalContext = {
  page: string; module: string;
  capturedAt: string; activity: Activity[];
};

// Only known route prefixes and templates leave this boundary. Never retain URLs or IDs.
export function pageContext(pathname: string) {
  const path = pathname.split(/[?#]/)[0];
  const base = '/' + (path.split('/')[1] || '');
  return pages[base]
    ? { page: base + (path !== base && path !== '/' ? '/:id' : ''), module: pages[base] }
    : { page: '(other page)', module: 'SPC' };
}

let history: Activity[] = [];
let sessionUser: string | null = null;
export function setActivityUser(id: string | null) {
  if (sessionUser !== id) history = [];
  sessionUser = id;
}
export function trackAction(action: keyof typeof actionNames, outcome: Activity['outcome'] = 'Unknown', pathname = window.location.pathname) {
  if (!sessionUser || !Object.hasOwn(actionNames, action)) return;
  history = [...history, {
    action: actionNames[action], timestamp: new Date().toISOString(), ...pageContext(pathname),
    outcome, source: 'Captured' as const,
  }].slice(-30);
}

// Deliberately accepts no event payload: arguments, return data and error text are never logged.
export function trackOperation<T>(action: Exclude<keyof typeof actionNames, 'navigate'>, operation: () => T): T {
  try {
    const result = operation();
    const failed = result && typeof result === 'object' && 'success' in result && result.success === false;
    trackAction(action, failed ? 'Failure' : 'Success');
    return result;
  } catch (error) {
    trackAction(action, 'Failure');
    throw error;
  }
}

export function captureContext(user: Reporter, pathname: string): TechnicalContext {
  return {
    ...pageContext(pathname), capturedAt: new Date().toISOString(),
    activity: history.map(item => ({ ...item })),
  };
}
