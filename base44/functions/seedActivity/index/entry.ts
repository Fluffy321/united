import { createClientFromRequest } from "npm:@base44/sdk";

const AVATAR_URLS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1502767089025-6572583495f9?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1557862921-37829c790f19?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=200&h=200&fit=crop",
];

const AVATAR_PRESETS = ['smile', 'heart', 'star', 'zap', 'moon', 'sun', 'music', 'coffee', 'camera', 'book', 'palette', 'rocket', 'sparkles', 'cloud', 'crown', 'flame', 'leaf', 'mountain', 'trophy', 'gift', 'umbrella', 'anchor', 'compass', 'feather', 'globe', 'key', 'target', 'puzzle', 'lightbulb'];

const AVATAR_THEMES = ['ocean-blue', 'sunset-orange', 'purple-glow', 'mint-green', 'midnight-dark', 'gold-shine', 'soft-pink', 'sky-gradient'];

const SAMPLE_USERS = [
  { id: "seed_user_1", name: "Sarah Miller", age_range: "18+", avatar_type: "avatar", avatar_preset_id: "heart", avatar_theme: "soft-pink" },
  { id: "seed_user_2", name: "David Cohen", age_range: "18+", avatar_type: "avatar", avatar_preset_id: "rocket", avatar_theme: "ocean-blue" },
  { id: "seed_user_3", name: "Rachel Goldstein", age_range: "18+", avatar_type: "avatar", avatar_preset_id: "sparkles", avatar_theme: "purple-glow" },
  { id: "seed_user_4", name: "Michael Schwartz", age_range: "18+", avatar_type: "avatar", avatar_preset_id: "coffee", avatar_theme: "sunset-orange" },
  { id: "seed_user_5", name: "Emma Levine", age_range: "18+", avatar_type: "avatar", avatar_preset_id: "star", avatar_theme: "gold-shine" },
  { id: "seed_user_6", name: "Jake Friedman", age_range: "18+", avatar_type: "avatar", avatar_preset_id: "music", avatar_theme: "mint-green" },
  { id: "seed_user_7", name: "Leah Shapiro", age_range: "18+", avatar_type: "avatar", avatar_preset_id: "palette", avatar_theme: "sky-gradient" },
  { id: "seed_user_8", name: "Noah Kaplan", age_range: "18+", avatar_type: "avatar", avatar_preset_id: "trophy", avatar_theme: "midnight-dark" },
];

const FEED_POSTS = [
  "Just finished making the most amazing challah! The house smells incredible 🍞",
  "Anyone know a good place for Shabbat lunch takeout in Five Towns?",
  "Beautiful sunset tonight. Grateful for moments like these 🌅",
  "Found the cutest kosher bakery today! Had to share",
  "Quick question: best place to get tefillin repaired?",
  "Loving the community energy lately. So blessed to be here!",
  "Anyone else excited for the upcoming chagim? Planning mode activated!",
  "Just saw the most beautiful chuppah setup. Mazal tov to the couple! 💙",
  "Coffee recommendations needed! What's everyone's go-to spot?",
  "The weather today is perfect for a walk around the neighborhood",
  "Grateful for this amazing community. You all inspire me daily!",
  "Looking for book recommendations - fiction or non-fiction, I'm open!",
  "Just organized my whole kitchen. Feels so good! ✨",
  "Best falafel in town? I need to know!",
  "Saw someone do the most thoughtful chesed today. Faith in humanity restored",
];

const COMMENT_TEMPLATES = [
  "This is so true!",
  "Love this! 💙",
  "Same here!",
  "Thanks for sharing!",
  "Couldn't agree more",
  "This made my day",
  "So relatable",
  "Appreciate this post",
  "Well said!",
  "Exactly what I needed to see today",
  "Beautiful!",
  "This resonates",
  "Thank you!",
  "Love it",
  "So good!",
  "Facts",
  "Needed this reminder",
  "Perfect timing",
];

const PROMPT_REPLIES = [
  "I'm grateful for my family and friends who always have my back",
  "Today was challenging but I learned a lot about myself",
  "The small moments of kindness I witnessed today really touched me",
  "Feeling blessed for the opportunities that came my way",
  "I'm thankful for this supportive community",
  "Taking time to appreciate the simple things today",
  "Growth happens outside our comfort zone - embracing that today",
  "The connections I made this week mean everything",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSample<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // Check real activity in last 72 hours
    const threeDaysAgo = new Date();
    threeDaysAgo.setHours(threeDaysAgo.getHours() - 72);

    const recentPosts = await base44.asServiceRole.entities.UnifiedPost.filter({
      created_date: { $gte: threeDaysAgo.toISOString() },
      is_seeded: { $ne: true }
    });

    // Only seed if real posts < 10
    if (recentPosts.length >= 10) {
      return Response.json({
        status: "skipped",
        reason: "Sufficient real activity",
        real_posts_count: recentPosts.length
      });
    }

    const seededContent = {
      posts: 0,
      comments: 0,
      likes: 0,
      prompt_replies: 0
    };

    // 1. Generate 6-10 feed posts
    const postCount = randomInt(6, 10);
    const selectedPosts = randomSample(FEED_POSTS, postCount);

    for (let i = 0; i < postCount; i++) {
      const user = randomChoice(SAMPLE_USERS);
      const hoursAgo = randomInt(1, 72);
      const postDate = new Date();
      postDate.setHours(postDate.getHours() - hoursAgo);

      await base44.asServiceRole.entities.UnifiedPost.create({
        user_id: user.id,
        user_name: user.name,
        user_age_range: user.age_range,
        avatar_type: user.avatar_type,
        avatar_preset_id: user.avatar_preset_id,
        avatar_theme: user.avatar_theme,
        type: "feed",
        board: "feed",
        body: selectedPosts[i],
        is_seeded: true,
        likes_count: randomInt(0, 5),
        comments_count: 0,
        created_date: postDate.toISOString()
      });
      seededContent.posts++;
    }

    // 2. Generate 8-12 comments across existing posts
    const allPosts = await base44.asServiceRole.entities.UnifiedPost.list('-created_date', 50);
    if (allPosts.length > 0) {
      const commentCount = randomInt(8, 12);
      
      for (let i = 0; i < commentCount; i++) {
        const post = randomChoice(allPosts);
        const user = randomChoice(SAMPLE_USERS);
        const comment = randomChoice(COMMENT_TEMPLATES);
        const hoursAgo = randomInt(1, 48);
        const commentDate = new Date();
        commentDate.setHours(commentDate.getHours() - hoursAgo);

        await base44.asServiceRole.entities.Comment.create({
          post_id: post.id,
          body: comment,
          author_id: user.id,
          author_name: user.name,
          author_age_range: user.age_range,
          avatar_type: user.avatar_type,
          avatar_preset_id: user.avatar_preset_id,
          avatar_theme: user.avatar_theme,
          is_seeded: true,
          created_date: commentDate.toISOString()
        });

        // Update comment count
        await base44.asServiceRole.entities.UnifiedPost.update(post.id, {
          comments_count: (post.comments_count || 0) + 1
        });

        seededContent.comments++;
      }
    }

    // 3. Generate 5-8 likes across recent posts
    const likeCount = randomInt(5, 8);
    const recentPostsForLikes = await base44.asServiceRole.entities.UnifiedPost.list('-created_date', 30);
    
    if (recentPostsForLikes.length > 0) {
      const postsToLike = randomSample(recentPostsForLikes, Math.min(likeCount, recentPostsForLikes.length));
      
      for (const post of postsToLike) {
        const user = randomChoice(SAMPLE_USERS);
        
        // Check if like already exists
        const existingLikes = await base44.asServiceRole.entities.Like.filter({
          post_id: post.id,
          user_id: user.id
        });

        if (existingLikes.length === 0) {
          await base44.asServiceRole.entities.Like.create({
            post_id: post.id,
            user_id: user.id,
            is_seeded: true
          });

          // Update like count
          await base44.asServiceRole.entities.UnifiedPost.update(post.id, {
            likes_count: (post.likes_count || 0) + 1
          });

          seededContent.likes++;
        }
      }
    }

    // 4. Generate 3-5 prompt replies
    const prompts = await base44.asServiceRole.entities.DailyPrompt.list('-created_date', 5);
    if (prompts.length > 0) {
      const replyCount = randomInt(3, 5);
      const selectedReplies = randomSample(PROMPT_REPLIES, replyCount);
      const selectedReplyUsers = randomSample(SAMPLE_USERS, replyCount);
      
      for (let i = 0; i < replyCount; i++) {
        const prompt = randomChoice(prompts);
        const user = selectedReplyUsers[i];
        const hoursAgo = randomInt(1, 48);
        const replyDate = new Date();
        replyDate.setHours(replyDate.getHours() - hoursAgo);

        await base44.asServiceRole.entities.UnifiedPost.create({
          user_id: user.id,
          user_name: user.name,
          user_age_range: user.age_range,
          avatar_type: user.avatar_type,
          avatar_preset_id: user.avatar_preset_id,
          avatar_theme: user.avatar_theme,
          type: "prompt_reply",
          board: "feed",
          body: selectedReplies[i],
          prompt_id: prompt.id,
          prompt_text: prompt.question,
          is_seeded: true,
          likes_count: randomInt(0, 3),
          comments_count: 0,
          created_date: replyDate.toISOString()
        });

        // Update prompt reply count
        await base44.asServiceRole.entities.DailyPrompt.update(prompt.id, {
          replies_count: (prompt.replies_count || 0) + 1
        });

        seededContent.prompt_replies++;
      }
    }

    return Response.json({
      status: "success",
      real_posts_in_last_72h: recentPosts.length,
      seeded_content: seededContent,
      message: "Activity seeded successfully"
    });

  } catch (error) {
    return Response.json({
      status: "error",
      error: error.message
    }, { status: 500 });
  }
});