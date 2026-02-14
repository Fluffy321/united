import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuickPostPrompt({ show, onQuickPost, onDismiss }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 left-4 right-4 z-40 max-w-md mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 mb-3">
                  Share something small with the community?
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={onQuickPost}
                    className="bg-indigo-600 hover:bg-indigo-700 text-sm h-8 px-4"
                  >
                    Quick Post
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={onDismiss}
                    className="text-sm h-8 px-3 text-slate-600"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}