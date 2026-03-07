const express = require("express");
const router = express.Router();
const prisma = require("../prisma");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ================== UPLOAD SETUP ==================
const uploadDir = "public/uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ================== ROUTES ==================

/**
 * GET All Communities (For Feed/Discovery)
 */
router.get("/", async (req, res) => {
  try {
    const communities = await prisma.community.findMany({
      include: {
        _count: { select: { communityMembers: true } },
      },
      orderBy: { name: "asc" },
    });
    res.json(communities);
  } catch (err) {
    console.error("Fetch Communities Error:", err);
    res.status(500).json({ error: "Failed to fetch communities" });
  }
});

/**
 * GET Communities by User ID (Required for Profile Page)
 * Path: /api/communities/user/:userId
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const memberships = await prisma.communityMember.findMany({
      where: { userId: userId },
      include: {
        community: {
          include: {
            _count: { select: { communityMembers: true } },
          },
        },
      },
    });

    const communities = memberships.map((m) => ({
      ...m.community,
      memberCount: m.community._count.communityMembers,
    }));

    res.json(communities);
  } catch (err) {
    console.error("Fetch User Communities Error:", err);
    res.status(500).json({ error: "Failed to fetch user communities" });
  }
});

/**
 * GET Community By ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        _count: { select: { communityMembers: true } },
      },
    });

    if (!community) return res.status(404).json({ message: "Community not found" });
    res.json(community);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch community" });
  }
});

/**
 * CREATE Community
 */
router.post(
  "/",
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, slogan, discription, privacy, adminId } = req.body;

      if (!adminId || adminId === "undefined") {
        return res.status(400).json({ message: "Valid adminId (userId) is required" });
      }

      const iconPath = req.files?.["icon"] ? `/uploads/${req.files["icon"][0].filename}` : null;
      const bannerPath = req.files?.["banner"] ? `/uploads/${req.files["banner"][0].filename}` : null;

      const newCommunity = await prisma.community.create({
        data: {
          name,
          slogan,
          discription, // Matches your schema
          icon: iconPath,
          banner: bannerPath,
          status: privacy?.toUpperCase() === "PRIVATE" ? "PRIVATE" : "PUBLIC",
          creatorId: adminId,
          communityMembers: {
            create: [{ userId: adminId, role: "ADMIN" }],
          },
        },
      });

      res.status(201).json(newCommunity);
    } catch (err) {
      console.error("CREATE ERROR:", err);
      res.status(500).json({ error: "Failed to create" });
    }
  }
);

/**
 * GET Membership Status
 */
router.get("/:id/membership/:userId", async (req, res) => {
  try {
    const { id, userId } = req.params;
    const member = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId, communityId: id } },
    });
    res.json({ isMember: !!member });
  } catch (err) {
    res.status(500).json({ error: "Failed to check membership" });
  }
});

/**
 * JOIN Community
 */
router.post("/:id/join", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const community = await prisma.community.findUnique({ where: { id } });
    if (!community) return res.status(404).json({ message: "Community not found" });

    if (community.status === "PRIVATE") {
      return res.status(403).json({ message: "Private community." });
    }

    await prisma.communityMember.upsert({
      where: { userId_communityId: { userId, communityId: id } },
      update: {},
      create: { userId, communityId: id },
    });

    res.json({ message: "Joined successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to join" });
  }
});

/**
 * LEAVE Community
 */
router.post("/:id/leave", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    await prisma.communityMember.delete({
      where: { userId_communityId: { userId, communityId: id } },
    });

    res.json({ message: "Left successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to leave" });
  }
});

/**
 * GET Community Posts
 */
router.get("/:id/posts", async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      where: { communityId: id },
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalPosts = await prisma.post.count({ where: { communityId: id } });

    res.json({
      posts,
      pagination: {
        total: totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        currentPage: page,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

module.exports = router;