import { LoaderCircle } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  fullPage?: boolean;
}

export function LoadingSpinner({ size = 40, fullPage = false }: LoadingSpinnerProps) {
  if (fullPage) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <LoaderCircle className="animate-spin text-green-500" size={size} />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center p-10">
      <LoaderCircle className="animate-spin text-green-500" size={size} />
    </div>
  );
}
