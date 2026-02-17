import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import PostTypeSelector from './PostTypeSelector';

export default function QuickActions({ onAction }) {
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const handleSelectType = (type) => {
    onAction(type);
  };

  return (
    <>
      <Button
        onClick={() => setShowTypeSelector(true)}
        className="w-full bg-[#0F5ED7] hover:bg-[#0D4EB8] text-white font-semibold py-6 rounded-2xl text-base shadow-sm"
      >
        <Plus className="w-5 h-5 mr-2" />
        Create Post
      </Button>

      <PostTypeSelector 
        open={showTypeSelector}
        onOpenChange={setShowTypeSelector}
        onSelectType={handleSelectType}
      />
    </>
  );
}