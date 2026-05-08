import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchModal({ open, onOpenChange }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    onOpenChange?.(false);
    navigate('/search');
  }, [open, onOpenChange, navigate]);

  return null;
}
