const express = require('express');
const { prisma, buildMeta } = require('../config');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// GET /api/users — список с пагинацией
router.get('/', validate(schemas.userListQuery, 'query'), async (req, res, next) => {
  try {
    const { page, limit } = req.valid.query;
    const [total, data] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.findMany({
        orderBy: { id: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    res.json({ data, meta: buildMeta(total, page, limit) });
  } catch (e) {
    next(e);
  }
});

// GET /api/users/:id — пользователь с постами (новые сверху)
router.get('/:id', validate(schemas.idParams, 'params'), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.valid.params.id },
      include: { posts: { orderBy: { createdAt: 'desc' } } },
    });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

// POST /api/users
router.post('/', validate(schemas.userCreate), async (req, res, next) => {
  try {
    const user = await prisma.user.create({ data: req.valid.body });
    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/users/:id
router.patch(
  '/:id',
  validate(schemas.idParams, 'params'),
  validate(schemas.userPatch),
  async (req, res, next) => {
    try {
      const user = await prisma.user.update({
        where: { id: req.valid.params.id },
        data: req.valid.body,
      });
      res.json(user);
    } catch (e) {
      next(e);
    }
  }
);

// DELETE /api/users/:id — вместе с постами пользователя
router.delete('/:id', validate(schemas.idParams, 'params'), async (req, res, next) => {
  try {
    const id = req.valid.params.id;
    await prisma.$transaction([
      prisma.post.deleteMany({ where: { authorId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
