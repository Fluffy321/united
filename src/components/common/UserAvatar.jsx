import React from 'react';
import { Smile, Heart, Star, Zap, Moon, Sun, Music, Coffee, Camera, Book, Palette, Rocket, Sparkles, Cloud, Crown, Flame, Leaf, Mountain, Trophy, Gift, Umbrella, Anchor, Compass, Feather, Globe, Key, Target, Puzzle, Lightbulb } from 'lucide-react';

const AVATAR_PRESETS = {
  smile: Smile,
  heart: Heart,
  star: Star,
  zap: Zap,
  moon: Moon,
  sun: Sun,
  music: Music,
  coffee: Coffee,
  camera: Camera,
  book: Book,
  palette: Palette,
  rocket: Rocket,
  sparkles: Sparkles,
  cloud: Cloud,
  crown: Crown,
  flame: Flame,
  leaf: Leaf,
  mountain: Mountain,
  trophy: Trophy,
  gift: Gift,
  umbrella: Umbrella,
  anchor: Anchor,
  compass: Compass,
  feather: Feather,
  globe: Globe,
  key: Key,
  target: Target,
  puzzle: Puzzle,
  lightbulb: Lightbulb
};

const AVATAR_THEMES = {
  'ocean-blue': 'from-blue-500 to-cyan-400',
  'sunset-orange': 'from-orange-500 to-pink-500',
  'purple-glow': 'from-purple-600 to-indigo-500',
  'mint-green': 'from-green-400 to-emerald-500',
  'midnight-dark': 'from-slate-800 to-slate-600',
  'gold-shine': 'from-yellow-500 to-amber-600',
  'soft-pink': 'from-pink-400 to-rose-500',
  'sky-gradient': 'from-sky-400 to-blue-500'
};

export default function UserAvatar({ user, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-24 h-24 text-3xl'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-12 h-12'
  };

  const sizeClass = sizes[size] || sizes.md;
  const iconSize = iconSizes[size] || iconSizes.md;

  // Photo type
  if (user?.avatar_type === 'photo' && user?.avatar_url) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden border-2 border-slate-200 shadow-sm ${className}`}>
        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  // Avatar preset type
  if (user?.avatar_type === 'avatar' && user?.avatar_preset_id && user?.avatar_theme) {
    const Icon = AVATAR_PRESETS[user.avatar_preset_id];
    const gradient = AVATAR_THEMES[user.avatar_theme] || AVATAR_THEMES['ocean-blue'];
    
    if (Icon) {
      return (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md ${className}`}>
          <Icon className={iconSize} strokeWidth={2.5} />
        </div>
      );
    }
  }

  // Initials fallback
  const initials = user?.display_name?.charAt(0)?.toUpperCase() || 
                   user?.full_name?.charAt(0)?.toUpperCase() || 
                   user?.user_name?.charAt(0)?.toUpperCase() || '?';
  
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm ${className}`}>
      {initials}
    </div>
  );
}

export { AVATAR_PRESETS, AVATAR_THEMES };