import React, { useEffect, useRef, useState } from 'react';
import { Bug, Lightbulb, CheckCircle2, Loader2 } from 'lucide-react';
import type { TechnicalContext } from './activity';
import { feedbackTypes } from './model';
import type { FeedbackService, FeedbackType, Screenshot } from './model';
import { feedbackService } from './service';
import { readScreenshot } from './screenshot';
import { FeedbackDialog, fieldClass, primaryClass, secondaryClass } from './ui';
import './feedback.css';

export default function FeedbackPanel({ context, onClose, service = feedbackService }: { context: TechnicalContext; onClose: () => void; service?: FeedbackService }) {
  const [type, setType] = useState<FeedbackType>('Report an issue');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<Screenshot>();
  const [attachmentError, setAttachmentError] = useState('');
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const sendingRef = useRef(false);
  const attachmentVersion = useRef(0);
  const successRef = useRef<HTMLHeadingElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = !!(title || description || screenshot || type !== 'Report an issue');
  useEffect(() => { if (submitted) successRef.current?.focus(); }, [submitted]);
  useEffect(() => () => { attachmentVersion.current++; }, []);
  useEffect(() => {
    if (!dirty || submitted) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty, submitted]);
  const requestClose = () => {
    if (sendingRef.current || reading) return;
    if (!submitted && dirty && !window.confirm('Discard this feedback?')) return;
    onClose();
  };
  const attach = async (file?: File) => {
    if (!file) return;
    const version = ++attachmentVersion.current;
    setReading(true); setAttachmentError('');
    try {
      const image = await readScreenshot(file);
      if (version === attachmentVersion.current) setScreenshot(image);
    } catch (failure) {
      if (version === attachmentVersion.current) setAttachmentError(failure instanceof Error ? failure.message : 'Choose another image.');
    } finally {
      if (version === attachmentVersion.current) { setReading(false); if (fileRef.current) fileRef.current.value = ''; }
    }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sendingRef.current || reading) return;
    setInvalid(true);
    if (!title.trim()) { titleRef.current?.focus(); return; }
    if (!description.trim()) { descriptionRef.current?.focus(); return; }
    sendingRef.current = true; setSending(true); setError('');
    try { await service.submit({ type, title, description, screenshot, context }); setSubmitted(true); }
    catch { setError('Feedback could not be submitted. Please try again.'); }
    finally { sendingRef.current = false; setSending(false); }
  };
  return <FeedbackDialog title="Share feedback" onClose={requestClose} busy={sending || reading}>
    {submitted ? <div className="space-y-5 py-4 text-center">
      <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
      <h3 ref={successRef} tabIndex={-1} className="text-lg font-semibold outline-none">Thank you for your feedback.</h3>
      <p role="status" className="text-sm text-slate-600">Feedback submitted.</p>
      <button className={primaryClass} onClick={onClose}>Done</button>
    </div> : <form onSubmit={submit} noValidate className="flex min-h-full flex-col gap-6" aria-busy={sending}>
      <fieldset disabled={sending} className="min-w-0 space-y-5">
        <fieldset><legend className="mb-3 text-sm font-medium">What would you like to share?</legend>
          <div className="grid gap-3 sm:grid-cols-2">{feedbackTypes.map(value => {
            const issue = value === 'Report an issue';
            const Icon = issue ? Bug : Lightbulb;
            return <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${type === value ? 'border-blue-500 bg-blue-50/70' : 'border-slate-200 hover:bg-slate-50'}`}>
              <input type="radio" name="feedback-type" value={value} checked={type === value} onChange={() => setType(value)} className="mt-1 accent-blue-600" />
              <span><Icon className="mb-2 h-5 w-5 text-slate-500" aria-hidden="true" /><span className="block text-sm font-medium">{value}</span><span className="mt-1 block text-xs leading-relaxed text-slate-500">{issue ? "Something isn't working" : 'I have a suggestion'}</span></span>
            </label>;
          })}</div>
        </fieldset>
        <div><label className="block text-sm font-medium" htmlFor="feedback-title">Title</label><input id="feedback-title" ref={titleRef} autoFocus required maxLength={140} aria-invalid={invalid && !title.trim()} aria-describedby={invalid && !title.trim() ? 'feedback-title-error' : undefined} className={`${fieldClass} mt-2 ${invalid && !title.trim() ? 'border-red-500' : ''}`} placeholder="A short summary" value={title} onChange={e => setTitle(e.target.value)} />{invalid && !title.trim() && <p id="feedback-title-error" className="mt-1 text-sm text-red-700">Enter a title.</p>}</div>
        <div><label className="block text-sm font-medium" htmlFor="feedback-description">{type === 'Report an issue' ? 'What happened?' : 'What would you like to improve?'}</label><textarea id="feedback-description" ref={descriptionRef} required maxLength={5000} rows={6} aria-label="Description" placeholder={type === 'Report an issue' ? 'Tell us what you were doing and what happened.' : 'Tell us what would make your work easier.'} aria-invalid={invalid && !description.trim()} aria-describedby={invalid && !description.trim() ? 'feedback-description-error' : undefined} className={`${fieldClass} mt-2 resize-y ${invalid && !description.trim() ? 'border-red-500' : ''}`} value={description} onChange={e => setDescription(e.target.value)} />{invalid && !description.trim() && <p id="feedback-description-error" className="mt-1 text-sm text-red-700">Enter a description.</p>}</div>
        <div><label htmlFor="feedback-screenshot" className="block text-sm font-medium">Screenshot <span className="font-normal text-slate-500">(optional)</span></label><input id="feedback-screenshot" ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" disabled={reading} aria-describedby={attachmentError ? 'feedback-image-error' : undefined} className="mt-2 block w-full min-w-0 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm file:text-slate-700" onChange={e => void attach(e.target.files?.[0])} />
          {reading && <p role="status" className="mt-2 text-sm text-slate-500">Attaching screenshot...</p>}
          {screenshot && <div className="mt-3 flex items-center gap-3"><img src={screenshot.dataUrl} alt="Attached screenshot" className="h-16 w-20 rounded-lg border border-slate-200 object-contain" /><span className="min-w-0 flex-1 break-all text-xs text-slate-600">{screenshot.name}</span><button type="button" disabled={reading} className={secondaryClass} onClick={() => { setScreenshot(undefined); setAttachmentError(''); }}>Remove</button></div>}
          {attachmentError && <p id="feedback-image-error" role="alert" className="mt-2 text-sm text-red-700">{attachmentError}</p>}
        </div>
      </fieldset>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="sticky -bottom-6 mt-auto flex justify-end gap-3 border-t border-slate-200 bg-white py-4"><button type="button" disabled={sending || reading} onClick={requestClose} className={secondaryClass}>Cancel</button><button type="submit" disabled={sending || reading} className={primaryClass}>{sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{sending ? 'Submitting...' : 'Submit'}</button></div>
    </form>}
  </FeedbackDialog>;
}
