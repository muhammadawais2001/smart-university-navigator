import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCampusData, useToast } from '../contexts/AppContexts';
import { feedbackSchema, type FeedbackForm } from '../utils/schemas';
import { Field } from '../components/common/ui';
import { api } from '../services/api';
import { FEEDBACK_LABEL } from '../utils/format';

export default function ReportPage() {
  const { locations } = useCampusData();
  const [sp] = useSearchParams();
  const { toast } = useToast();
  const [done, setDone] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema), defaultValues: { type: 'INCORRECT_LOCATION', locationId: sp.get('location') ?? '' },
  });
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Report incorrect or missing information</h1>
      {done ? <div className="card p-5"><p className="font-semibold">Thank you. Your report was submitted for review.</p><button className="btn-ghost mt-3" onClick={() => { setDone(false); reset(); }}>Submit another</button></div> :
        <form noValidate className="card space-y-4 p-5" onSubmit={handleSubmit(async (v) => {
          try {
            await api.submitFeedback({ ...v, locationId: v.locationId || null, contact: v.contact || null });
            setDone(true); toast('success', 'Report submitted');
          } catch (e) { toast('error', (e as Error).message); }
        })}>
          <Field label="Issue type" error={errors.type?.message}><select className="input" {...register('type')}>{Object.entries(FEEDBACK_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="Related location (optional)"><select className="input" {...register('locationId')}><option value="">None / not listed</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
          <Field label="What is wrong?" error={errors.description?.message}><textarea className="input min-h-[120px]" {...register('description')} /></Field>
          <Field label="Contact (optional, email or phone)" error={errors.contact?.message}><input className="input" {...register('contact')} /></Field>
          <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" {...register('website')} />
          <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit report'}</button>
        </form>}
    </div>
  );
}
