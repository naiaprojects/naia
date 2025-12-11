// components/FAQ.js
"use client";

import { useState } from 'react';

const FAQ = ({ data = [] }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="text-slate-600 py-12 max-w-7xl mx-auto">
      <div className="container flex flex-col justify-center p-4 mx-auto md:p-8">
        <div className="faqSection">
          <h1 className="max-w-2xl mx-auto text-center font-manrope font-bold text-4xl text-primarys mb-5 md:text-6xl leading-[50px]">
            Frequently Asked Questions
          </h1>
          <p className="sm:max-w-2xl sm:mx-auto text-center text-base font-normal leading-7 text-gray-500 mb-9">
            Have a question? Check here first! The answer might already be here!
          </p>
        </div>
        <div className="sm:mt-12 flex flex-col divide-y px-6 divide-slate-100 font-bold">
          {data.map((item, index) => (
            <div key={item.id} className="faq-item">
              <button
                className="py-4 outline-none cursor-pointer focus:text-primary w-full text-left flex justify-between items-center"
                onClick={() => toggleAccordion(index)}
              >
                <span>{item.question}</span>
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${activeIndex === index ? 'transform rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${activeIndex === index ? 'max-h-96' : 'max-h-0'}`}
              >
                <div className="px-4 pb-4 font-medium">
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;