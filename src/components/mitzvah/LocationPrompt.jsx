import React, { useState } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function LocationPrompt({ show, onDismiss, onLocationSet }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleEnableLocation = async () => {
    setIsLoading(true);
    try {
      if (!navigator.geolocation) {
        toast.error('Location not supported by your browser');
        setIsLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Update user location
          await base44.auth.updateMe({
            location_lat: latitude,
            location_lng: longitude,
            location_last_updated: new Date().toISOString()
          });

          localStorage.setItem('locationEnabled', 'true');
          toast.success('Location enabled');
          onLocationSet();
        },
        (error) => {
          console.error('Location error:', error);
          toast.error('Could not get location');
          setIsLoading(false);
        }
      );
    } catch (error) {
      toast.error('Failed to enable location');
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('locationPromptDismissed', 'true');
    onDismiss();
  };

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
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 mb-3">
                  Show mitzvahs near you?
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleEnableLocation}
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-sm h-8 px-4"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enable'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleDismiss}
                    className="text-sm h-8 px-3 text-slate-600"
                  >
                    Not Now
                  </Button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
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