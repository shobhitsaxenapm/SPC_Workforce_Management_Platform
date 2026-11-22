// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createMemoryStorage = (): Storage => {
  let store: Record<string, string> = {};
  return {
    get length() { return Object.keys(store).length; },
    clear() { store = {}; },
    getItem(k: string) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    key(i: number) { return Object.keys(store)[i] ?? null; },
    removeItem(k: string) { delete store[k]; },
    setItem(k: string, v: string) { store[k] = String(v); },
  };
};
if (typeof globalThis.localStorage?.clear !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', { value: createMemoryStorage(), configurable: true, writable: true });
}
if (typeof globalThis.sessionStorage?.clear !== 'function') {
  Object.defineProperty(globalThis, 'sessionStorage', { value: createMemoryStorage(), configurable: true, writable: true });
}
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import FeedbackPanel from './FeedbackPanel';
import FeedbackAdmin from './FeedbackAdmin';
import { createMockFeedbackAuth, DEV_LOGIN_ID, DEV_PASSWORD } from './auth';
import { captureContext, pageContext, setActivityUser, trackAction, trackOperation } from './activity';
import { createLocalFeedbackStorage, createMockFeedbackService, FEEDBACK_STORAGE_KEY } from './service';
import { FeedbackProvider, FeedbackButton } from './FeedbackProvider';
import { MAX_SCREENSHOT_BYTES, readScreenshot } from './screenshot';

vi.mock('../context/AppContext', () => ({ useApp: () => ({ currentUser: { id: 'tester', name: 'Tester', role: 'RECRUITER' } }) }));
const reporter = { id: 'tester', name: 'Tester', role: 'RECRUITER' };
const context = () => captureContext(reporter, '/candidates/private-id?token=secret');
const draft = () => ({ type: 'Report an issue' as const, title: 'Filter resets', description: 'The filter clears when returning to the list.', context: context() });
const mount = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);
const service = () => createMockFeedbackService(createLocalFeedbackStorage(() => localStorage), 0);
const png = new File(['image bytes'], 'screen.png', { type: 'image/png' });
const fill = () => {
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: draft().title } });
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: draft().description } });
};
async function login() {
  fireEvent.change(screen.getByLabelText('Login ID'), { target: { value: DEV_LOGIN_ID } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: DEV_PASSWORD } });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
  await screen.findByText('Liam Parker');
}
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); setActivityUser(null); setActivityUser(reporter.id);
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function () { this.setAttribute('open', ''); } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function () { this.removeAttribute('open'); } });
  vi.stubGlobal('Image', class { naturalWidth = 10; naturalHeight = 10; onload = () => {}; set src(_: string) { queueMicrotask(() => this.onload()); } });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Feedback frontend prototype', () => {
  it('bounds private activity, freezes snapshots and clears across sessions', () => {
    for (let i = 0; i < 35; i++) trackAction('navigate', 'Success', `/candidates/person-${i}?password=secret#token`);
    const snapshot = context();
    expect(snapshot.activity).toHaveLength(30);
    expect(JSON.stringify(snapshot)).not.toMatch(/person-|password|secret|private-id|reporter|browser/);
    trackOperation('createClient', () => ({ success: false, error: 'secret typed value' }));
    expect(context().activity.at(-1)?.outcome).toBe('Failure');
    expect(snapshot.activity.at(-1)?.outcome).toBe('Success');
    expect(JSON.stringify(context())).not.toContain('secret typed value');
    setActivityUser(null); expect(context().activity).toHaveLength(0);
    expect(pageContext('/interview-feedback/private-token').page).toBe('(other page)');
  });
  it('keeps SPC work mounted and exposes only the requested form', () => {
    mount(<FeedbackProvider><FeedbackButton /><input aria-label="Unsaved work" defaultValue="draft remains" /></FeedbackProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Share feedback');
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText(/Screenshot/)).toBeInTheDocument();
    expect(screen.getByRole('dialog').textContent).not.toMatch(/demo|beta|technical|activity|JSON|walkthrough|expected/i);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByLabelText('Unsaved work')).toHaveValue('draft remains');
  });
  it('validates whitespace, supports both types, and protects dirty drafts', () => {
    const close = vi.fn();
    mount(<FeedbackPanel context={context()} onClose={close} service={service()} />);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Enter a title.')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveFocus();
    fireEvent.click(screen.getByRole('radio', { name: /Suggest an improvement/ }));
    expect(screen.getByRole('radio', { name: /Suggest an improvement/ })).toBeChecked();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(close).not.toHaveBeenCalled();
  });
  it('preserves text and screenshot on a failed save, prevents duplicates and persists retry into dashboard', async () => {
    const store = createLocalFeedbackStorage();
    const write = vi.spyOn(store, 'write').mockImplementationOnce(() => { throw new Error('Quota'); });
    const local = createMockFeedbackService(store, 20);
    const panel = mount(<FeedbackPanel context={context()} onClose={vi.fn()} service={local} />);
    fill();
    fireEvent.change(screen.getByLabelText(/Screenshot/), { target: { files: [png] } });
    await screen.findByAltText('Attached screenshot');
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled();
    await screen.findByRole('alert');
    expect(local.getSnapshot().reports).toHaveLength(0);
    expect(screen.getByLabelText('Title')).toHaveValue(draft().title);
    expect(screen.getByLabelText('Description')).toHaveValue(draft().description);
    expect(screen.getByAltText('Attached screenshot')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await screen.findByText('Feedback submitted.');
    expect(screen.queryByText(/FB-\d+/)).not.toBeInTheDocument();
    expect(write).toHaveBeenCalledTimes(2);
    expect(local.getSnapshot().reports).toHaveLength(1);
    panel.unmount();
    const reloaded = service();
    mount(<FeedbackAdmin service={reloaded} auth={createMockFeedbackAuth()} />);
    await login();
    fireEvent.click(screen.getByRole('button', { name: /Filter resets/ }));
    expect(screen.getByText(draft().description)).toBeInTheDocument();
    expect(screen.getByText('FB-00001')).toBeInTheDocument();
    expect(screen.getByText('Issue / Bug')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mark as closed' }));
    await screen.findByText('Closed');
    expect(service().getSnapshot().reports[0].status).toBe('Closed');
    fireEvent.click(screen.getByRole('button', { name: 'Reopen' }));
    await screen.findByText('Open');
    expect(screen.getByAltText('Feedback screenshot')).toHaveAttribute('src', reloaded.getSnapshot().reports[0].screenshot!.dataUrl);
    expect(screen.queryByText(/technical|demo/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to feedback' }));
    expect(screen.getByRole('button', { name: /Filter resets/ })).toBeInTheDocument();
  });
  it('starts empty, rejects wrong login, persists mock session and logs out', async () => {
    const auth = createMockFeedbackAuth();
    await expect(auth.login('wrong@example.invalid', 'wrong')).rejects.toThrow();
    expect(auth.getAccount()).toBeNull();
    mount(<FeedbackAdmin service={service()} auth={auth} />);
    expect(screen.queryByText(DEV_LOGIN_ID)).not.toBeInTheDocument();
    await login();
    expect(screen.getByText('No feedback yet')).toBeInTheDocument();
    expect(createMockFeedbackAuth().getAccount()?.name).toBe('Liam Parker');
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(screen.getByRole('heading', { name: 'Team login' })).toBeInTheDocument();
    expect(createMockFeedbackAuth().getAccount()).toBeNull();
  });
  it('rejects invalid, empty, oversized and unreadable images; supports removal', async () => {
    await expect(readScreenshot(new File(['svg'], 'x.svg', { type: 'image/svg+xml' }))).rejects.toThrow(/PNG/);
    await expect(readScreenshot(new File([], 'x.png', { type: 'image/png' }))).rejects.toThrow(/2 MB/);
    await expect(readScreenshot(new File([new Uint8Array(MAX_SCREENSHOT_BYTES + 1)], 'x.png', { type: 'image/png' }))).rejects.toThrow(/2 MB/);
    mount(<FeedbackPanel context={context()} onClose={vi.fn()} service={service()} />);
    fireEvent.change(screen.getByLabelText(/Screenshot/), { target: { files: [png] } });
    await screen.findByAltText('Attached screenshot');
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.queryByAltText('Attached screenshot')).not.toBeInTheDocument();
    vi.stubGlobal('Image', class { onerror = () => {}; set src(_: string) { queueMicrotask(() => this.onerror()); } });
    await expect(readScreenshot(png)).rejects.toThrow(/could not be read/);
  });
  it('does not overwrite malformed storage or report false success when storage is blocked', async () => {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, '{broken');
    const local = service();
    expect(local.getSnapshot().error).toBeTruthy();
    await expect(local.submit(draft())).rejects.toThrow();
    expect(localStorage.getItem(FEEDBACK_STORAGE_KEY)).toBe('{broken');
    const blocked = createMockFeedbackService(createLocalFeedbackStorage(() => { throw new Error('Blocked'); }), 0);
    await expect(blocked.submit(draft())).rejects.toThrow();
    expect(blocked.getSnapshot().reports).toHaveLength(0);
  });
  it('migrates missing status and preserves state when status writes fail', async () => {
    const store = createLocalFeedbackStorage();
    const local = createMockFeedbackService(store, 0);
    const report = await local.submit(draft());
    const legacy = JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY)!);
    delete legacy.reports[0].status;
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(legacy));
    expect(service().getSnapshot().reports[0].status).toBe('Open');
    vi.spyOn(store, 'write').mockImplementationOnce(() => { throw new Error('Quota'); });
    await expect(local.setStatus(report.reference, 'Closed')).rejects.toThrow();
    expect(local.getSnapshot().reports[0].status).toBe('Open');
    await local.setStatus(report.reference, 'Closed');
    expect(service().getSnapshot().reports[0].status).toBe('Closed');
  });
  it('allocates stable admin IDs and migrates existing reports without changing UUIDs', async () => {
    const local = service();
    const first = await local.submit(draft());
    const second = await local.submit(draft());
    expect([first.adminId, second.adminId]).toEqual(['FB-00001', 'FB-00002']);
    const saved = JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY)!);
    saved.reports.forEach((report: { adminId?: string }) => delete report.adminId);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(saved));
    const reloaded = service();
    expect(reloaded.getSnapshot().reports.map(r => [r.reference, r.adminId])).toEqual([[second.reference, 'FB-00002'], [first.reference, 'FB-00001']]);
    expect(service().getSnapshot().reports).toEqual(reloaded.getSnapshot().reports);
    expect((await reloaded.submit(draft())).adminId).toBe('FB-00003');
  });
  it('shows saved actions and combines filters with persistent admin categories', async () => {
    trackAction('navigate', 'Success', '/candidates/private?token=secret');
    trackOperation('createCandidate', () => ({ success: false, error: 'typed secret' }));
    const local = service();
    const issue = await local.submit(draft());
    const idea = await local.submit({ ...draft(), type: 'Suggest an improvement', title: 'Improve search' });
    await local.setCategory(idea.reference, 'AI');
    await local.setStatus(idea.reference, 'Closed');
    mount(<FeedbackAdmin service={local} auth={createMockFeedbackAuth()} />);
    await login();
    fireEvent.change(screen.getByLabelText('Search feedback'), { target: { value: issue.adminId } });
    expect(screen.queryByRole('button', { name: /Improve search/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Filter resets/ }));
    expect(screen.getByText('Viewed page')).toBeInTheDocument();
    expect(screen.getByText('Created candidate')).toBeInTheDocument();
    expect(screen.getByText('Failure')).toBeInTheDocument();
    expect(screen.getByText('No screenshot attached.')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/private|token=|typed secret/);
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Engineering' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save category' }));
    await screen.findByText('Category saved.');
    expect(service().getSnapshot().reports.find(r => r.reference === issue.reference)?.category).toBe('Engineering');
    fireEvent.click(screen.getByRole('button', { name: 'Back to feedback' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'Suggest an improvement' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'Closed' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'AI' } });
    expect(screen.getByRole('button', { name: /Improve search/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Filter resets/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Product' } });
    expect(screen.getByText('No matching feedback')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByRole('button', { name: /Filter resets/ })).toBeInTheDocument();
  });
  it('defaults legacy categories and retains category after failed writes', async () => {
    const store = createLocalFeedbackStorage();
    const local = createMockFeedbackService(store, 0);
    const report = await local.submit(draft());
    const legacy = JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY)!);
    delete legacy.reports[0].category;
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(legacy));
    expect(service().getSnapshot().reports[0].category).toBe('Unclassified');
    vi.spyOn(store, 'write').mockImplementationOnce(() => { throw new Error('Quota'); });
    await expect(local.setCategory(report.reference, 'Product')).rejects.toThrow();
    expect(local.getSnapshot().reports[0].category).toBe('Unclassified');
    await local.setCategory(report.reference, 'Product');
    expect(service().getSnapshot().reports[0].category).toBe('Product');
  });
  it('reloads submissions when the dashboard receives a storage event', async () => {
    const local = service();
    mount(<FeedbackAdmin service={local} auth={createMockFeedbackAuth()} />);
    await login();
    await service().submit({ ...draft(), type: 'Suggest an improvement' });
    fireEvent(window, new Event('storage'));
    await waitFor(() => expect(screen.getByRole('button', { name: /Filter resets/ })).toBeInTheDocument());
  });
});
