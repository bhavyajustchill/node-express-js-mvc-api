const Joi = require("joi");

const todoValidation = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  completed: Joi.boolean(),
});

module.exports = { todoValidation };
