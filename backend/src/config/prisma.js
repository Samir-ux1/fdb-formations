const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Vérifier si on utilise la base en ligne (Neon) ou locale (localhost)
const isOnlineDB = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech');

// Configurer la connexion à PostgreSQL avec l'adaptateur
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Activer le SSL uniquement si c'est la base de données en ligne
  ssl: isOnlineDB ? { rejectUnauthorized: false } : undefined 
});

const adapter = new PrismaPg(pool);

// Initialiser Prisma avec l'adaptateur
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
