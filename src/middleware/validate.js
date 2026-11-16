const Joi = require('joi');

const roles = ['USER', 'ADMIN'];

const idParams = Joi.object({ id: Joi.number().integer().min(1).required() });

const pagination = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
};

// ---- users ----
const userFields = {
  email: Joi.string().email(),
  name: Joi.string().trim().min(1).max(100),
  role: Joi.string().valid(...roles),
};
const userCreate = Joi.object({
  email: userFields.email.required(),
  name: userFields.name.required(),
  role: userFields.role,
});
const userPatch = Joi.object(userFields).min(1);
const userListQuery = Joi.object({ ...pagination });

// ---- posts ----
const tagsField = Joi.array().items(Joi.string().trim().min(1).max(50));
const postCreate = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  content: Joi.string().allow('', null),
  published: Joi.boolean(),
  authorId: Joi.number().integer().min(1).required(),
  tags: tagsField.default([]),
});
const postPatch = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  content: Joi.string().allow('', null),
  published: Joi.boolean(),
  authorId: Joi.number().integer().min(1),
  tags: tagsField,
}).min(1);
const postListQuery = Joi.object({
  search: Joi.string().trim().allow(''),
  published: Joi.boolean(),
  authorId: Joi.number().integer().min(1),
  ...pagination,
});

// Результат валидации кладётся в req.valid[source]
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
      });
    }
    req.valid = req.valid || {};
    req.valid[source] = value;
    next();
  };
}

module.exports = {
  validate,
  schemas: { idParams, userCreate, userPatch, userListQuery, postCreate, postPatch, postListQuery },
};
