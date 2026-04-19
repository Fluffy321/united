import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { action, report_id, content_type, content_id, target_user_id, community_id, ban_days, reason } = await req.json();

    const now = new Date().toISOString();
    const auditEntry = {
      admin_id: user.id,
      admin_name: user.full_name || user.email,
      action,
      report_id: report_id || null,
      content_type: content_type || null,
      content_id: content_id || null,
      target_user_id: target_user_id || null,
      community_id: community_id || null,
      reason: reason || '',
      performed_at: now,
    };

    // Execute the action
    if (action === 'dismiss') {
      if (report_id) {
        await base44.asServiceRole.entities.Report.update(report_id, { resolved: true, resolved_at: now });
      }
    } else if (action === 'remove_content') {
      if (content_type === 'post' || content_type === 'unified_post') {
        await base44.asServiceRole.entities.UnifiedPost.update(content_id, { is_removed: true, removed_by: user.id, removed_at: now });
      } else if (content_type === 'comment') {
        await base44.asServiceRole.entities.Comment.update(content_id, { is_removed: true });
      } else if (content_type === 'community_post') {
        await base44.asServiceRole.entities.CommunityPost.update(content_id, { is_removed: true });
      }
      if (report_id) {
        await base44.asServiceRole.entities.Report.update(report_id, { resolved: true, resolved_at: now });
      }
    } else if (action === 'warn_user') {
      if (target_user_id) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: target_user_id,
          type: 'announcement',
          actor_id: user.id,
          actor_name: 'Moderation Team',
          message: `Your content was flagged and may violate community guidelines. Reason: ${reason || 'Community standards'}. Repeated violations may result in suspension.`,
          is_read: false,
        });
      }
      if (report_id) {
        await base44.asServiceRole.entities.Report.update(report_id, { resolved: true, resolved_at: now });
      }
    } else if (action === 'temp_ban' || action === 'perm_ban') {
      if (!target_user_id) return Response.json({ error: 'target_user_id required' }, { status: 400 });
      const banUntil = action === 'temp_ban' && ban_days
        ? new Date(Date.now() + ban_days * 24 * 60 * 60 * 1000).toISOString()
        : null;
      await base44.asServiceRole.entities.User.update(target_user_id, {
        ban_status: action === 'perm_ban' ? 'permanent' : 'temporary',
        ban_until: banUntil,
        ban_reason: reason || '',
        banned_by: user.id,
        banned_at: now,
      });
      // Notify user
      await base44.asServiceRole.entities.Notification.create({
        user_id: target_user_id,
        type: 'announcement',
        actor_id: user.id,
        actor_name: 'Moderation Team',
        message: action === 'perm_ban'
          ? `Your account has been permanently suspended. Reason: ${reason || 'Violation of community standards'}.`
          : `Your account has been temporarily suspended for ${ban_days} days. Reason: ${reason || 'Violation of community standards'}.`,
        is_read: false,
      });
      if (report_id) {
        await base44.asServiceRole.entities.Report.update(report_id, { resolved: true, resolved_at: now });
      }
    } else if (action === 'shadow_ban') {
      if (!target_user_id) return Response.json({ error: 'target_user_id required' }, { status: 400 });
      await base44.asServiceRole.entities.User.update(target_user_id, {
        ban_status: 'shadow',
        ban_reason: reason || 'Shadow banned for spam',
        banned_by: user.id,
        banned_at: now,
      });
      if (report_id) {
        await base44.asServiceRole.entities.Report.update(report_id, { resolved: true, resolved_at: now });
      }
    } else if (action === 'community_ban') {
      if (!target_user_id || !community_id) return Response.json({ error: 'target_user_id and community_id required' }, { status: 400 });
      // Remove from community
      const memberships = await base44.asServiceRole.entities.UserCommunity.filter({ user_id: target_user_id, community_id });
      for (const m of memberships) await base44.asServiceRole.entities.UserCommunity.delete(m.id);
      const follows = await base44.asServiceRole.entities.CommunityFollow.filter({ user_id: target_user_id, community_id });
      for (const f of follows) await base44.asServiceRole.entities.CommunityFollow.delete(f.id);
      if (report_id) {
        await base44.asServiceRole.entities.Report.update(report_id, { resolved: true, resolved_at: now });
      }
    }

    // Write audit log
    await base44.asServiceRole.entities.ModerationAuditLog.create(auditEntry);

    console.log(`Moderation action: ${action} by ${user.email} on report ${report_id}`);
    return Response.json({ success: true });

  } catch (err) {
    console.error('moderationAction error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});