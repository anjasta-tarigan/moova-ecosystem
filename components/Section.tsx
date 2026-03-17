import React from 'react';
import { SectionProps } from '../types';

const Section: React.FC<SectionProps> = ({ 
  id, 
  tag, 
  headline, 
  subheadline, 
  children, 
  className = "",
  dark = false
}) => {
  return (
    <section 
      id={id} 
      className={`py-20 md:py-32 ${dark ? 'bg-primary-900 text-white' : 'bg-white text-slate-800'} ${className}`}
    >
      <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl">
        <div className="max-w-3xl mb-16">
          <span className={`inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest uppercase rounded-full ${dark ? 'bg-white/10 text-secondary-500' : 'bg-primary-50 text-primary-600'}`}>
            {tag}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {headline}
          </h2>
          <p className={`text-lg md:text-xl leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
            {subheadline}
          </p>
        </div>
        
        {children}
      </div>
    </section>
  );
};

export default Section;