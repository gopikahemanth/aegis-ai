import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = ({ className, variant = 'primary', ...props }: ButtonProps) => (
  <button
    className={clsx(
      'px-4 py-2 rounded-md font-medium transition-all focus-visible:ring-2 ring-offset-2',
      variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-neutral-200 hover:bg-neutral-300',
      className
    )}
    {...props}
  />
);