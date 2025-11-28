// app/briefing/page.js
import { Suspense } from 'react';
import BriefingForm from './BriefingForm';
import Loading from './loading';

export default function BriefingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BriefingForm />
    </Suspense>
  );
}