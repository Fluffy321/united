import dataService from './dataService';
import { notificationsService } from './notificationsService';

const localKey = (userId) => `junited-local-friends-${userId || 'guest'}`;

function readLocal(userId) {
  try {
    return JSON.parse(window.localStorage.getItem(localKey(userId)) || '[]');
  } catch {
    return [];
  }
}

function writeLocal(userId, records) {
  window.localStorage.setItem(localKey(userId), JSON.stringify(records));
}

export const friendsService = {
  async list(userId) {
    if (!userId) return [];
    try {
      return await dataService.entities.UserConnection.filter({ user_id: userId }, '-created_date', 200);
    } catch {
      return readLocal(userId);
    }
  },

  async count(userId) {
    const friends = await this.list(userId);
    return friends.length;
  },

  async isFriend(userId, friendId) {
    if (!userId || !friendId) return false;
    const existing = await this.list(userId);
    return existing.some((connection) => connection.connected_user_id === friendId);
  },

  async addFriend(currentUser, friendUser) {
    if (!currentUser?.id || !friendUser?.id || currentUser.id === friendUser.id) return null;
    const alreadyFriends = await this.isFriend(currentUser.id, friendUser.id);
    if (alreadyFriends) return null;

    const payload = {
      user_id: currentUser.id,
      connected_user_id: friendUser.id,
      connected_user_name: friendUser.display_name || friendUser.full_name || 'Friend',
      status: 'accepted',
    };
    const reciprocal = {
      user_id: friendUser.id,
      connected_user_id: currentUser.id,
      connected_user_name: currentUser.display_name || currentUser.full_name || 'Friend',
      status: 'accepted',
    };

    try {
      await Promise.all([
        dataService.entities.UserConnection.create(payload),
        dataService.entities.UserConnection.create(reciprocal),
      ]);
    } catch {
      const mine = readLocal(currentUser.id);
      const theirs = readLocal(friendUser.id);
      writeLocal(currentUser.id, [...mine, { id: `local-${Date.now()}`, ...payload }]);
      writeLocal(friendUser.id, [...theirs, { id: `local-${Date.now()}-r`, ...reciprocal }]);
    }

    notificationsService.create({
      userId: friendUser.id,
      actorId: currentUser.id,
      type: 'friend_added',
      title: 'New friend',
      body: `${currentUser.display_name || currentUser.full_name || 'Someone'} added you as a friend.`,
      linkUrl: `/PublicProfile?id=${currentUser.id}`,
      data: { friendship: true },
    }).catch(() => {});

    return payload;
  },

  async removeFriend(currentUserId, friendUserId) {
    if (!currentUserId || !friendUserId) return;
    try {
      const [mine, theirs] = await Promise.all([
        dataService.entities.UserConnection.filter({ user_id: currentUserId, connected_user_id: friendUserId }),
        dataService.entities.UserConnection.filter({ user_id: friendUserId, connected_user_id: currentUserId }),
      ]);
      await Promise.all([
        ...mine.map((record) => dataService.entities.UserConnection.delete(record.id)),
        ...theirs.map((record) => dataService.entities.UserConnection.delete(record.id)),
      ]);
    } catch {
      writeLocal(currentUserId, readLocal(currentUserId).filter((record) => record.connected_user_id !== friendUserId));
      writeLocal(friendUserId, readLocal(friendUserId).filter((record) => record.connected_user_id !== currentUserId));
    }
  },
};

export default friendsService;
