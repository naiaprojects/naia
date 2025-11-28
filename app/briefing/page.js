// app/briefing/page.js
import { Suspense } from 'react';
import BriefingForm from './BriefingForm';

export default function BriefingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BriefingForm />
    </Suspense>
  );
}