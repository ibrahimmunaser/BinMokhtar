import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}

export function Container({ children, className, narrow = false }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8',
        narrow ? 'max-w-[1160px]' : 'max-w-[1440px]',
        className
      )}
    >
      {children}
    </div>
  );
}




