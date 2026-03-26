import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();

    // Verify user is deleting their own account
    if (user.id !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete all user's posts
    const posts = await base44.asServiceRole.entities.UnifiedPost.filter({ user_id: userId }, '', 1000);
    for (const post of posts) {
      await base44.asServiceRole.entities.UnifiedPost.delete(post.id);
    }

    // Delete all user's comments
    const comments = await base44.asServiceRole.entities.Comment.filter({ author_id: userId }, '', 1000);
    for (const comment of comments) {
      await base44.asServiceRole.entities.Comment.delete(comment.id);
    }

    // Delete all user's likes
    const likes = await base44.asServiceRole.entities.Like.filter({ user_id: userId }, '', 1000);
    for (const like of likes) {
      await base44.asServiceRole.entities.Like.delete(like.id);
    }

    // Delete all user's conversations
    const conversations = await base44.asServiceRole.entities.Conversation.filter({ participant_ids: userId }, '', 1000);
    for (const conv of conversations) {
      await base44.asServiceRole.entities.Conversation.delete(conv.id);
    }

    // Delete all user's messages
    const messages = await base44.asServiceRole.entities.Message.filter({ sender_id: userId }, '', 1000);
    for (const msg of messages) {
      await base44.asServiceRole.entities.Message.delete(msg.id);
    }

    // Delete user's mitzvah logs
    const mitzvahLogs = await base44.asServiceRole.entities.MitzvahLog.filter({ user_id: userId }, '', 1000);
    for (const log of mitzvahLogs) {
      await base44.asServiceRole.entities.MitzvahLog.delete(log.id);
    }

    // Delete user from communities
    const communityMembers = await base44.asServiceRole.entities.CommunityFollow.filter({ user_id: userId }, '', 1000);
    for (const member of communityMembers) {
      await base44.asServiceRole.entities.CommunityFollow.delete(member.id);
    }

    // Delete user blocks/reports
    const blocks = await base44.asServiceRole.entities.Block.filter({ blocker_id: userId }, '', 1000);
    for (const block of blocks) {
      await base44.asServiceRole.entities.Block.delete(block.id);
    }

    const reports = await base44.asServiceRole.entities.Report.filter({ reporter_id: userId }, '', 1000);
    for (const report of reports) {
      await base44.asServiceRole.entities.Report.delete(report.id);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});