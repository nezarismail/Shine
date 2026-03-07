const express = require("express");
const prisma = require("../prisma");
const router = express.Router();

// Get notifications for user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark as read
router.post("/:userId/read/:notificationId", async (req, res) => {
  const { notificationId } = req.params;
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark notification" });
  }
});

module.exports = router;
