import { type ReactNode } from 'react';

type BadgeVariant = 'default' | 'gold' | 'teal' | 'outline';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-text-primary',
  gold: 'bg-accent-gold/20 text-accent-gold',
  teal: 'bg-accent-teal/20 text-accent-teal-light',
  outline: 'border border-accent-gold/50 text-accent-gold bg-transparent',
};

export function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
