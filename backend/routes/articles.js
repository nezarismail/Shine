const express = require("express");
const router = express.Router();
const prisma = require("../prisma");

/* =====================================================
    GET ALL ARTICLES (PAGINATED FEED)
    Query Params: ?page=1&limit=10&search=...
===================================================== */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [articles, totalArticles] = await Promise.all([
      prisma.article.findMany({
        where: where,
        skip: skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, username: true, name: true, image: true },
          },
          media: {
            take: 1,
            select: { url: true, type: true },
          },
          _count: {
            select: { likes: true, saves: true, views: true },
          },
        },
      }),
      prisma.article.count({ where: where }),
    ]);

    const totalPages = Math.ceil(totalArticles / limit);

    res.json({
      metadata: {
        totalArticles,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      articles,
    });
  } catch (err) {
    console.error("FEED FETCH ERROR:", err);
    res.status(500).json({
      error: "Internal server error fetching feed",
      details: err.message,
    });
  }
});

/* =====================================================
    LIKE TOGGLE (POST /api/articles/:id/like)
===================================================== */
router.post("/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const existingLike = await prisma.like.findFirst({
      where: { articleId: id, userId: userId },
    });

    let status;
    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      status = false;
    } else {
      await prisma.like.create({ data: { articleId: id, userId: userId } });
      status = true;
    }

    const likesCount = await prisma.like.count({ where: { articleId: id } });
    res.json({ status, likesCount });
  } catch (err) {
    console.error("LIKE ERROR:", err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

/* =====================================================
    SAVE TOGGLE (POST /api/articles/:id/save)
===================================================== */
router.post("/:id/save", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const existingSave = await prisma.save.findFirst({
      where: { articleId: id, userId: userId },
    });

    let status;
    if (existingSave) {
      await prisma.save.delete({ where: { id: existingSave.id } });
      status = false;
    } else {
      await prisma.save.create({ data: { articleId: id, userId: userId } });
      status = true;
    }

    const savesCount = await prisma.save.count({ where: { articleId: id } });
    res.json({ status, savesCount });
  } catch (err) {
    console.error("SAVE ERROR:", err);
    res.status(500).json({ error: "Failed to toggle save" });
  }
});

/* =====================================================
    STATUS CHECKS (GET /api/articles/:id/like-status)
===================================================== */
router.get("/:id/like-status", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    if (!userId) return res.json({ liked: false });
    const like = await prisma.like.findFirst({ where: { articleId: id, userId } });
    res.json({ liked: !!like });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch like status" });
  }
});

router.get("/:id/save-status", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    if (!userId) return res.json({ saved: false });
    const save = await prisma.save.findFirst({ where: { articleId: id, userId } });
    res.json({ saved: !!save });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch save status" });
  }
});

/* =====================================================
    GET SINGLE ARTICLE (Includes 1-View-Per-User Logic)
===================================================== */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    // 1. UNIQUE VIEW LOGIC
    if (userId && userId !== "undefined" && userId !== "anonymous") {
      try {
        await prisma.postView.create({
          data: {
            userId: userId,
            articleId: id,
          },
        });
      } catch (e) {
        // Catch P2002 (Unique Constraint) or any other view creation errors
        // Do nothing, as it means the view already exists or user is invalid
      }
    }

    // 2. FETCH ARTICLE DATA
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            description: true,
          },
        },
        media: true,
        sources: true,
        _count: {
          select: { likes: true, saves: true, views: true },
        },
      },
    });

    if (!article) return res.status(404).json({ error: "Article not found" });

    res.json(article);
  } catch (err) {
    console.error("ARTICLE DETAIL ERROR:", err);
    res.status(500).json({ error: "Could not retrieve article" });
  }
});

/* =====================================================
    CREATE ARTICLE
===================================================== */
router.post("/", async (req, res) => {
  try {
    const { title, content, authorId, media, sources } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const newArticle = await prisma.article.create({
      data: {
        title,
        content,
        authorId,
        media:
          media?.length > 0
            ? {
                create: media.map((item) => ({
                  url: item.url,
                  type: item.type || "image",
                  size: item.size || 0,
                  uploaderId: authorId,
                })),
              }
            : undefined,
        sources:
          sources?.length > 0
            ? {
                create: sources.map((s) => ({ name: s.name, link: s.link })),
              }
            : undefined,
      },
      include: {
        media: true,
        sources: true,
        author: {
          select: { id: true, username: true, name: true, image: true },
        },
      },
    });

    res.status(201).json(newArticle);
  } catch (err) {
    console.error("CREATE ARTICLE ERROR:", err);
    res.status(500).json({ error: "Failed to create article" });
  }
});

/* =====================================================
    GET ARTICLES BY USER
===================================================== */
router.get("/user/:userId", async (req, res) => {
  try {
    const articles = await prisma.article.findMany({
      where: { authorId: req.params.userId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, username: true, name: true, image: true },
        },
        media: { take: 1 },
        _count: { select: { likes: true, saves: true, views: true } },
      },
    });
    res.json(articles);
  } catch (err) {
    console.error("USER ARTICLES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch user articles" });
  }
});

module.exports = router;