import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
};

export function Button({ className = '', variant = 'default', size = 'default', ...props }: ButtonProps) {
  const variantClass =
    variant === 'secondary'
      ? 'bg-zinc-700 text-white hover:bg-zinc-600'
      : variant === 'outline'
      ? 'border border-white/30 bg-transparent text-white hover:bg-white/10'
      : 'bg-[#ffc300] text-black hover:bg-[#ffd24d]';

  const sizeClass =
    size === 'sm' ? 'h-8 px-3 text-xs' : size === 'lg' ? 'h-11 px-5 text-base' : 'h-10 px-4 text-sm';

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClass} ${sizeClass} ${className}`}
      {...props}
    />
  );
}
