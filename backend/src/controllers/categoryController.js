const prisma = require('../config/prisma');

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { courses: true } } } // Compte les cours dans chaque branche
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Erreur", error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, imageUrl } = req.body;
    const newCategory = await prisma.category.create({ data: { name, imageUrl } });
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: "Erreur", error: error.message });
  }
};

// --- MODIFIER UNE BRANCHE ---
exports.updateCategory = async (req, res) => {
  try {
    const { name, imageUrl } = req.body;
    const updated = await prisma.category.update({
      where: { id: parseInt(req.params.id) },
      data: { name, imageUrl }
    });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Erreur", error: error.message });
  }
};

// --- SUPPRIMER UNE BRANCHE ---
exports.deleteCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // 1. On détache les cours de cette branche (ils iront dans "Autres")
    await prisma.course.updateMany({
      where: { categoryId: id },
      data: { categoryId: null }
    });
    // 2. On supprime la branche
    await prisma.category.delete({ where: { id } });
    res.status(200).json({ message: "Branche supprimée" });
  } catch (error) {
    res.status(500).json({ message: "Erreur", error: error.message });
  }
};