const express = require('express');
const router = express.Router();
const messenger = require('../services/messenger.service');

// Get all active conversations for the current user
router.get('/inbox', async (req, res) => {
  try {
    const inbox = await messenger.getInbox(req.user.userId);
    res.json(inbox);
  } catch (err) {
    res.status(500).json({ error: "Failed to load inbox" });
  }
});

// Search for NEW users to chat with
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    const users = await messenger.searchUsers(query, req.user.userId);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

// Start a new chat or get an existing one
router.post('/chat', async (req, res) => {
  try {
    const { targetId } = req.body;
    const chat = await messenger.getOrCreateConversation(req.user.userId, targetId);
    res.json(chat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get messages for a specific conversation
router.get('/messages/:id', async (req, res) => {
  try {
    const messages = await messenger.getChatHistory(req.params.id);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// Send a message
router.post('/send', async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const message = await messenger.sendMessage(req.user.userId, conversationId, text);
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: "Failed to send" });
  }
});

module.exports = router;