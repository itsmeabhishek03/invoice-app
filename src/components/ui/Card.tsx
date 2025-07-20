import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
}

export function Card({ children }: CardProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      {children}
    </div>
  );
}
