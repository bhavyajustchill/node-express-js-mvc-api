const express = require("express");
const router = express.Router();
const controller = require("../controllers/todo.controller");

router.post("/create", controller.createTodo);
router.get("/", controller.getTodos);
router.get("/:id", controller.getTodoById);
router.put("/:id", controller.updateTodo);
router.delete("/:id", controller.deleteTodo);

module.exports = router;
