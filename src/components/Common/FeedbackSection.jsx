import React from 'react';
import Feedback from './Feedback';
import Founder from './Founder';

export default function FeedbackSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 lg:px-8 py-12 transition-colors duration-200">
      <div className="flex flex-col md:flex-row gap-8 items-start w-full">
        <div className="w-full md:w-[60%] lg:w-[65%] shrink-0">
          <Feedback />
        </div>
        <div className="w-full md:w-[40%] lg:w-[35%] shrink-0">
          <Founder />
        </div>
      </div>
    </section>
  );
}
