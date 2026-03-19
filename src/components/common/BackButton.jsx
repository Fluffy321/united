import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigationStack } from '@/lib/useNavigationStack';

export default function BackButton() {
  const { canGoBack, goBack } = useNavigationStack();

  if (!canGoBack) return null;

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={goBack}
      className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  );
}