const TodoModel = require("../models/todo.model");
const { todoValidation } = require("../validations/todo.validation");

const createTodo = async (req, res) => {
  try {
    const validated = await todoValidation.validateAsync(req.body);

    const todoData = validated;

    const todo = new TodoModel(todoData);

    const savedTodo = await todo.save();

    res.status(201).json(savedTodo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTodos = async (req, res) => {
  try {
    const todos = await TodoModel.find();
    res.status(200).json(todos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTodoById = async (req, res) => {
  const { id } = req.params;
  try {
    const todo = await TodoModel.findById(id);
    if (!todo) {
      res.status(404).json({ message: "Todo not found!" });
      return;
    }
    res.status(200).json(todo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateTodo = async (req, res) => {
  const { id } = req.params;
  try {
    const validated = await todoValidation.validateAsync(req.body);
    const updatedTodo = await TodoModel.findByIdAndUpdate(id, validated, { new: true });
    if (!updatedTodo) {
      res.status(404).json({ message: "Todo not found." });
      return;
    }
    res.status(200).json({
      message: "Todo Updated successfully!",
      updatedTodo,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteTodo = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedTodo = await TodoModel.findByIdAndDelete(id);
    if (!deletedTodo) {
      res.status(404).json({ message: "Todo not found or already deleted." });
      return;
    }
    res.status(200).json({
      message: "Todo deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createTodo, getTodos, getTodoById, updateTodo, deleteTodo };
