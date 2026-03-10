const prisma = require("../prisma");

class MessengerService {
  // Get Inbox: Lists chats, includes the other user's info and the latest message
  async getInbox(userId) {
    return await prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: {
          where: { NOT: { userId: userId } },
          include: { user: { select: { id: true, username: true, name: true, image: true } } }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  // Get or Create: Prevents duplicate DM channels
  async getOrCreateConversation(currentUserId, targetUserId) {
    if (currentUserId === targetUserId) throw new Error("You cannot chat with yourself.");

    // Check if DM exists
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: currentUserId } } },
          { members: { some: { userId: targetUserId } } }
        ]
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, image: true } } }
        }
      }
    });

    if (existing) return existing;

    // Create new if none exists
    return await prisma.conversation.create({
      data: {
        members: {
          create: [{ userId: currentUserId }, { userId: targetUserId }]
        }
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, image: true } } }
        }
      }
    });
  }

  async getChatHistory(conversationId) {
    return await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, username: true, image: true } } }
    });
  }

  async sendMessage(senderId, conversationId, text) {
    return await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: { text, senderId, conversationId },
        include: { sender: { select: { id: true, username: true, image: true } } }
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });
      return message;
    });
  }

  async searchUsers(query, currentUserId) {
    return await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ],
        NOT: { id: currentUserId }
      },
      select: { id: true, username: true, name: true, image: true },
      take: 8
    });
  }
}

module.exports = new MessengerService();