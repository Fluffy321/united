import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNavigationStack } from '@/lib/useNavigationStack';

export default function BackButton({ fallbackTo = '/Feed', className = '' }) {
  const navigate = useNavigate();
  const { canGoBack, goBack } = useNavigationStack();

  if (!canGoBack && !fallbackTo) return null;

  const handleBack = () => {
    if (canGoBack) {
      goBack();
      return;
    }
    navigate(fallbackTo);
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleBack}
      aria-label="Go back"
      className={`text-slate-500 hover:text-slate-700 hover:bg-slate-100 ${className}`}
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  );
}
