import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const getRandomPreset = () => {
  const presets = ['smile', 'heart', 'star', 'zap', 'moon', 'sun', 'music', 'coffee', 'camera', 'book', 'palette', 'rocket', 'sparkles', 'cloud', 'crown', 'flame', 'leaf', 'mountain', 'trophy', 'gift', 'umbrella', 'anchor', 'compass', 'feather', 'globe', 'key', 'target', 'puzzle', 'lightbulb'];
  return presets[Math.floor(Math.random() * presets.length)];
};

const getRandomTheme = () => {
  const themes = ['ocean-blue', 'sunset-orange', 'purple-glow', 'mint-green', 'midnight-dark', 'gold-shine', 'soft-pink', 'sky-gradient'];
  return themes[Math.floor(Math.random() * themes.length)];
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all users
    const users = await base44.asServiceRole.entities.User.list();
    
    const usersToUpdate = users.filter(u => 
      !u.avatar_preset_id || !u.avatar_theme || !u.avatar_type || u.avatar_type === 'initials'
    );

    const updated = [];
    for (const user of usersToUpdate) {
      const preset = user.avatar_preset_id || getRandomPreset();
      const theme = user.avatar_theme || getRandomTheme();
      const type = user.avatar_url ? 'photo' : 'avatar';

      await base44.asServiceRole.entities.User.update(user.id, {
        avatar_type: type,
        avatar_preset_id: preset,
        avatar_theme: theme
      });

      updated.push({
        id: user.id,
        name: user.display_name || user.full_name,
        preset,
        theme,
        type
      });
    }

    return Response.json({ 
      success: true, 
      total_users: users.length,
      updated_count: updated.length,
      updated_users: updated
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});