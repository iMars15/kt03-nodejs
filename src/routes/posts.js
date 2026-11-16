const express = require('express');
const { prisma, buildMeta, isPostgres } = require('../config');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

const postInclude = {
  author: { select: { id: true, name: true, email: true } },
  tags: true,
};

// ['a','b','a'] -> [{ where: {name:'a'}, create: {name:'a'} }, ...]
function toConnectOrCreate(tags) {
  return [...new Set(tags)].map((name) => ({ where: { name }, create: { name } }));
}

// GET /api/posts?search=&published=&authorId=&page=&limit=
router.get('/', validate(schemas.postListQuery, 'query'), async (req, res, next) => {
  try {
    const { search, published, authorId, page, limit } = req.valid.query;

    const where = {};
    if (search) {
      where.title = { contains: search, ...(isPostgres && { mode: 'insensitive' }) };
    }
    if (published !== undefined) where.published = published;
    if (authorId !== undefined) where.authorId = authorId;

    const [total, data] = await prisma.$transaction([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        include: postInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    res.json({ data, meta: buildMeta(total, page, limit) });
  } catch (e) {
    next(e);
  }
});

// GET /api/posts/:id — пост с автором и тегами
router.get('/:id', validate(schemas.idParams, 'params'), async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.valid.params.id },
      include: postInclude,
    });
    if (!post) return res.status(404).json({ error: 'Пост не найден' });
    res.json(post);
  } catch (e) {
    next(e);
  }
});

// POST /api/posts
router.post('/', validate(schemas.postCreate), async (req, res, next) => {
  try {
    const { title, content, published, authorId, tags } = req.valid.body;
    const post = await prisma.post.create({
      data: {
        title,
        content,
        published,
        authorId,
        tags: { connectOrCreate: toConnectOrCreate(tags) },
      },
      include: postInclude,
    });
    res.status(201).json(post);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/posts/:id — если передан tags, список тегов заменяется
router.patch(
  '/:id',
  validate(schemas.idParams, 'params'),
  validate(schemas.postPatch),
  async (req, res, next) => {
    try {
      const { tags, ...fields } = req.valid.body;
      const data = { ...fields };
      if (tags) data.tags = { set: [], connectOrCreate: toConnectOrCreate(tags) };

      const post = await prisma.post.update({
        where: { id: req.valid.params.id },
        data,
        include: postInclude,
      });
      res.json(post);
    } catch (e) {
      next(e);
    }
  }
);

// DELETE /api/posts/:id
router.delete('/:id', validate(schemas.idParams, 'params'), async (req, res, next) => {
  try {
    await prisma.post.delete({ where: { id: req.valid.params.id } });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
