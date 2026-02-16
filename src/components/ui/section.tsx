import { type ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: 'section' | 'div' | 'article';
}

export function Section({
  children,
  className = '',
  id,
  as: Component = 'section',
}: SectionProps) {
  return (
    <Component
      id={id}
      className={`py-12 md:py-20 px-4 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </Component>
  );
}
