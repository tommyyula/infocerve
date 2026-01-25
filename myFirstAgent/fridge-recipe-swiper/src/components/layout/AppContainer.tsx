import { ReactNode } from 'react';

interface AppContainerProps {
  children: ReactNode;
}

export function AppContainer({ children }: AppContainerProps) {
  return (
    <div className="w-full max-w-[400px] h-screen max-h-[800px] bg-gray-50 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {children}
    </div>
  );
}
