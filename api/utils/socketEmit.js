export const emitToUser = (userId, event, data) => {
  try {
    if (!global.io || !userId) return;
    global.io.to(`user_${userId}`).emit(event, data);
  } catch (error) {
    console.error('emitToUser error:', error);
  }
};

export const emitToConversation = (conversationId, event, data) => {
  try {
    if (!global.io || !conversationId) return;
    global.io.to(`conversation_${conversationId}`).emit(event, data);
  } catch (error) {
    console.error('emitToConversation error:', error);
  }
};
