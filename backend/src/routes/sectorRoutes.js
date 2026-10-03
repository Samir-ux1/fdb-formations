const express = require('express');
const prisma = require('../config/prisma');
const { verifyToken, isInstructor } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(verifyToken, isInstructor);

router.get('/', async (req, res) => {
  try {
    const sectors = await prisma.sector.findMany({ orderBy: { name: 'asc' } });
    return res.json(sectors);
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de récupérer les secteurs.' });
  }
});

router.post('/', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) return res.status(400).json({ message: 'Le nom du secteur est obligatoire.' });

  try {
    const sector = await prisma.sector.create({ data: { name } });
    return res.status(201).json(sector);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Un secteur portant ce nom existe déjà.' });
    }
    console.error("Erreur lors de l'ajout du secteur :", error);
    return res.status(500).json({ message: "Impossible d'ajouter le secteur." });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: 'Identifiant invalide.' });

  try {
    await prisma.sector.delete({ where: { id } });
    return res.json({ message: 'Secteur supprimé.' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Secteur introuvable.' });
    return res.status(500).json({ message: 'Impossible de supprimer le secteur.' });
  }
});

module.exports = router;
