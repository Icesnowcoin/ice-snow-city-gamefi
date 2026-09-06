import type { HTMLAttributes, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** Official ISC token mark. Keep this URL as the single source of truth. */
export const ISC_LOGO_URL = '/manus-storage/isc_token_icon_256_ed4ff47d.png';

export type ISCLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<ISCLogoSize, string> = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
  xl: 'h-10 w-10',
};

export interface ISCLogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'children'> {
  size?: ISCLogoSize;
  label?: string;
}

/** Official ISC snowflake logo used for every in-game token presentation. */
export function ISCLogo({ size = 'md', label = 'ISC', className, alt, ...props }: ISCLogoProps) {
  return (
    <img
      src={ISC_LOGO_URL}
      alt={alt ?? label}
      title={label}
      loading="lazy"
      decoding="async"
      className={cn('inline-block shrink-0 object-contain', sizeClasses[size], className)}
      {...props}
    />
  );
}

export interface ISCAmountProps extends HTMLAttributes<HTMLSpanElement> {
  amount: string | number;
  size?: ISCLogoSize;
  label?: string;
}

/** Consistent amount + official mark treatment for balances, fees and prices. */
export function ISCAmount({ amount, size = 'sm', label = 'ISC', className, ...props }: ISCAmountProps) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)} {...props}>
      <ISCLogo size={size} label={label} aria-hidden="true" />
      <span>{amount}</span>
      <span className="sr-only">ISC</span>
    </span>
  );
}
