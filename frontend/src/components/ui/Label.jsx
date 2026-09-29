import { cn } from '../../lib/cn';

export function Label({ className, ...props }) {
  return <label className={cn('text-xs font-medium text-neutral-600', className)} {...props} />;
}
