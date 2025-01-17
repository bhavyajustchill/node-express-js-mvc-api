const express = require("express");
const router = express.Router();
const controller = require("../controllers/todo.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.post("/create", [authenticateToken], controller.createTodo);
router.get("/", [authenticateToken], controller.getTodos);
router.get("/:id", [authenticateToken], controller.getTodoById);
router.put("/:id", [authenticateToken], controller.updateTodo);
router.delete("/:id", [authenticateToken], controller.deleteTodo);

module.exports = router;
