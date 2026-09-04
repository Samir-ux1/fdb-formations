require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

// ============================================================
// CONFIGURATION
// ============================================================

const INSTRUCTOR_ID = 1;

// ============================================================
// PETITE FONCTION POUR CREER UNE QUESTION
// ============================================================

function question(questionText, options, correctAnswer) {
  return {
    questionText,
    options,
    correctAnswer,
  };
}

// ============================================================
// MODULE 1
// ============================================================

const module1 = {
  title: "Manutention, Sécurité et Technologies Toyota",

  description:
    "Formation technique consacrée à la manutention sécurisée, à la stabilité des chariots élévateurs, aux règles de sécurité et aux technologies Toyota telles que SAS et SEnS+.",

  price: 0,

  accessKey: "TOYOTA-MOD1",

  imageUrl:
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",

  passingScore: 70,

  lessons: [
    // ========================================================
    // CHAPITRE 1
    // ========================================================

    {
      title: "Introduction à la manutention",

      content:
        "Découverte des principes fondamentaux de la manutention et du rôle des chariots élévateurs dans les opérations logistiques.",

      order: 1,

      videoUrl: null,

      pdfUrl: null,

      questions: [
        question(
          "Quel est l'objectif principal de la manutention ?",
          [
            "Déplacer et stocker les charges efficacement et en sécurité",
            "Augmenter uniquement la vitesse du chariot",
            "Réduire la taille des entrepôts",
            "Remplacer tous les opérateurs",
          ],
          0
        ),

        question(
          "Quel équipement est principalement utilisé pour déplacer des palettes ?",
          [
            "Un ordinateur",
            "Un chariot élévateur",
            "Une imprimante",
            "Un compresseur",
          ],
          1
        ),

        question(
          "Avant de déplacer une charge, l'opérateur doit principalement vérifier :",
          [
            "La couleur du chariot",
            "La météo uniquement",
            "La stabilité et les caractéristiques de la charge",
            "Le nom du fabricant",
          ],
          2
        ),

        question(
          "Une mauvaise manutention peut provoquer :",
          [
            "Uniquement une baisse de productivité",
            "Des dommages matériels et des accidents",
            "Une augmentation automatique de la capacité",
            "Une diminution du poids de la charge",
          ],
          1
        ),

        question(
          "La sécurité en manutention dépend notamment :",
          [
            "Uniquement du chariot",
            "Uniquement du sol",
            "Uniquement de l'opérateur",
            "De l'opérateur, de l'équipement et de l'environnement",
          ],
          3
        ),
      ],
    },

    // ========================================================
    // CHAPITRE 2
    // ========================================================

    {
      title: "Types de chariots élévateurs",

      content:
        "Présentation des principales catégories de chariots élévateurs et de leurs applications dans les environnements industriels et logistiques.",

      order: 2,

      videoUrl: null,

      pdfUrl: null,

      questions: [
        question(
          "Quel chariot est généralement adapté au déplacement de palettes ?",
          [
            "Chariot élévateur",
            "Grue portuaire uniquement",
            "Tracteur agricole",
            "Voiture particulière",
          ],
          0
        ),

        question(
          "Les chariots électriques sont particulièrement adaptés :",
          [
            "À certains environnements intérieurs",
            "Uniquement aux routes publiques",
            "Aux opérations aériennes",
            "À la navigation maritime",
          ],
          0
        ),

        question(
          "Le choix d'un chariot dépend notamment :",
          [
            "De la charge et de l'environnement de travail",
            "Uniquement de sa couleur",
            "Uniquement de son prix",
            "Du nombre de sièges",
          ],
          0
        ),

        question(
          "Quel élément permet de soulever une charge ?",
          [
            "Le volant",
            "Les fourches et le système de levage",
            "Le siège",
            "Le klaxon",
          ],
          1
        ),

        question(
          "Un chariot doit être utilisé :",
          [
            "Pour n'importe quelle charge",
            "Uniquement dans les conditions prévues par le fabricant",
            "Sans inspection",
            "À la vitesse maximale en permanence",
          ],
          1
        ),
      ],
    },

    // ========================================================
    // CHAPITRE 3
    // ========================================================

    {
      title: "Sécurité de l'opérateur",

      content:
        "Apprentissage des principales règles de sécurité que l'opérateur doit respecter avant et pendant l'utilisation d'un chariot élévateur.",

      order: 3,

      videoUrl: null,

      pdfUrl: null,

      questions: [
        question(
          "Quelle est une mesure essentielle avant de conduire un chariot ?",
          [
            "Effectuer une inspection pré-opérationnelle",
            "Augmenter la vitesse",
            "Retirer la ceinture",
            "Désactiver les dispositifs de sécurité",
          ],
          0
        ),

        question(
          "L'opérateur doit-il respecter les limites de capacité du chariot ?",
          [
            "Non",
            "Seulement lorsqu'il pleut",
            "Oui",
            "Uniquement la nuit",
          ],
          2
        ),

        question(
          "Pendant la conduite, l'opérateur doit :",
          [
            "Rester attentif à son environnement",
            "Utiliser son téléphone",
            "Regarder uniquement la charge",
            "Conduire sans visibilité",
          ],
          0
        ),

        question(
          "La ceinture de sécurité doit être :",
          [
            "Retirée",
            "Utilisée conformément aux instructions du fabricant",
            "Utilisée uniquement lorsque le chariot est arrêté",
            "Remplacée par une corde",
          ],
          1
        ),

        question(
          "Que faire si un défaut de sécurité important est détecté ?",
          [
            "Continuer normalement",
            "Augmenter la vitesse",
            "Mettre le chariot hors service et signaler le problème",
            "Ignorer le problème",
          ],
          2
        ),
      ],
    },

    // ========================================================
    // CHAPITRE 4
    // ========================================================

    {
      title: "Stabilité et capacité de charge",

      content:
        "Comprendre le centre de gravité, le triangle de stabilité, la capacité nominale et les facteurs pouvant affecter la stabilité du chariot.",

      order: 4,

      videoUrl: "https://www.youtube.com/watch?v=tMrr7XRpA2o",

      pdfUrl:
        "https://cdn.toyotaforklift.com/wp-content/uploads/2018/10/10090932/Guide-to-Proven-Warehouse-Solutions-e-Book.pdf",

      questions: [
        question(
          "Quel élément influence directement la stabilité d'un chariot ?",
          [
            "La position du centre de gravité",
            "La couleur du chariot",
            "Le nom du fabricant",
            "La taille de l'écran",
          ],
          0
        ),

        question(
          "Que se passe-t-il lorsque le centre de gravité de la charge se déplace vers l'avant ?",
          [
            "La stabilité augmente toujours",
            "Le risque de basculement vers l'avant augmente",
            "Le chariot devient plus rapide",
            "La capacité augmente",
          ],
          1
        ),

        question(
          "La capacité nominale d'un chariot correspond :",
          [
            "Au poids du chariot vide",
            "À une capacité de charge définie dans certaines conditions",
            "À la vitesse maximale",
            "À la hauteur du siège",
          ],
          1
        ),

        question(
          "Une charge placée trop loin du tablier peut :",
          [
            "Réduire la capacité effective",
            "Augmenter automatiquement la stabilité",
            "Réduire le poids de la charge",
            "Augmenter la puissance du moteur",
          ],
          0
        ),

        question(
          "Pour préserver la stabilité, la charge doit généralement être :",
          [
            "Très haute",
            "Centrée et correctement positionnée",
            "Suspendue librement",
            "Placée sur une seule fourche",
          ],
          1
        ),
      ],
    },

    // ========================================================
    // CHAPITRE 5
    // ========================================================

    {
      title: "Toyota SAS — System of Active Stability",

      content:
        "Découverte du système Toyota SAS (System of Active Stability) et de son rôle dans la réduction de certains risques liés à la stabilité du chariot.",

      order: 5,

      videoUrl: "https://www.youtube.com/watch?v=y0B7gAwBe6o",

      pdfUrl: null,

      questions: [
        question(
          "Que signifie SAS chez Toyota ?",
          [
            "System of Active Stability",
            "Safety Automatic System",
            "Standard Access Service",
            "Smart Automotive Sensor",
          ],
          0
        ),

        question(
          "Le système SAS est principalement conçu pour :",
          [
            "Améliorer certains aspects de la stabilité",
            "Remplacer l'opérateur",
            "Augmenter uniquement la vitesse",
            "Supprimer les inspections",
          ],
          0
        ),

        question(
          "Le SAS remplace-t-il la responsabilité de l'opérateur ?",
          [
            "Oui",
            "Non",
            "Uniquement en intérieur",
            "Uniquement à faible vitesse",
          ],
          1
        ),

        question(
          "Les technologies de sécurité doivent être considérées comme :",
          [
            "Un remplacement de la formation",
            "Une aide complémentaire à une conduite sûre",
            "Une autorisation de dépasser les limites",
            "Une raison de supprimer les contrôles",
          ],
          1
        ),

        question(
          "La stabilité d'un chariot dépend notamment :",
          [
            "Uniquement du SAS",
            "De la charge, du chariot, du sol et de la conduite",
            "Uniquement de la batterie",
            "Uniquement des pneus",
          ],
          1
        ),
      ],
    },

    // ========================================================
    // CHAPITRE 6
    // ========================================================

    {
      title: "Manutention et transport des charges",

      content:
        "Apprendre les bonnes pratiques pour prendre, transporter et déposer une charge en toute sécurité.",

      order: 6,

      videoUrl: "https://www.youtube.com/watch?v=a-YR4nX5yns",

      pdfUrl:
        "https://cdn.toyotaforklift.com/wp-content/uploads/2018/10/10090932/Guide-to-Proven-Warehouse-Solutions-e-Book.pdf",

      questions: [
        question(
          "Avant de prendre une charge, l'opérateur doit vérifier :",
          [
            "Son poids et sa stabilité",
            "Uniquement sa couleur",
            "Le logo du fournisseur",
            "Le prix de la marchandise",
          ],
          0
        ),

        question(
          "Les fourches doivent normalement être :",
          [
            "Correctement positionnées sous la charge",
            "Placées à côté de la palette",
            "Une seule fourche sous la charge",
            "Très écartées sans raison",
          ],
          0
        ),

        question(
          "Pendant le transport, la charge doit être :",
          [
            "Transportée très haut",
            "Maintenue à une hauteur de transport sûre",
            "Suspendue librement",
            "Placée derrière l'opérateur",
          ],
          1
        ),

        question(
          "Une charge instable doit être :",
          [
            "Transportée rapidement",
            "Sécurisée ou réorganisée avant le transport",
            "Ignorée",
            "Placée sur une seule fourche",
          ],
          1
        ),

        question(
          "Lorsqu'il y a une mauvaise visibilité, l'opérateur doit :",
          [
            "Accélérer",
            "Prendre les mesures de sécurité appropriées",
            "Fermer les yeux",
            "Lever davantage la charge",
          ],
          1
        ),
      ],
    },

    // ========================================================
    // CHAPITRE 7
    // ========================================================

    {
      title: "Sécurité dans l'entrepôt",

      content:
        "Identifier les principaux risques présents dans un entrepôt et appliquer les règles de circulation et de sécurité.",

      order: 7,

      videoUrl: "https://www.youtube.com/watch?v=EvihU5QJG08",

      pdfUrl:
        "https://cdn.toyotaforklift.com/wp-content/uploads/2018/10/10090932/Guide-to-Proven-Warehouse-Solutions-e-Book.pdf",

      questions: [
        question(
          "Dans un entrepôt, les piétons doivent être :",
          [
            "Ignorés",
            "Pris en compte en permanence",
            "Toujours derrière le chariot",
            "Éloignés uniquement la nuit",
          ],
          1
        ),

        question(
          "Les voies de circulation doivent être :",
          [
            "Bloquées",
            "Claires et correctement identifiées",
            "Utilisées comme zones de stockage",
            "Sans signalisation",
          ],
          1
        ),

        question(
          "Aux intersections, l'opérateur doit :",
          [
            "Accélérer",
            "Être particulièrement vigilant",
            "Klaxonner uniquement après le passage",
            "Regarder uniquement derrière",
          ],
          1
        ),

        question(
          "Le stockage incorrect des marchandises peut provoquer :",
          [
            "Des chutes de charges",
            "Une meilleure stabilité",
            "Une augmentation de capacité",
            "Une réduction des risques",
          ],
          0
        ),

        question(
          "La sécurité d'un entrepôt nécessite notamment :",
          [
            "Une bonne organisation des flux",
            "La suppression des passages piétons",
            "L'absence de signalisation",
            "L'augmentation permanente de la vitesse",
          ],
          0
        ),
      ],
    },

    // ========================================================
    // CHAPITRE 8
    // ========================================================

    {
      title: "SEnS+ et technologies de sécurité",

      content:
        "Découvrir Toyota SEnS+ et les technologies destinées à aider l'opérateur à identifier certains risques dans son environnement de travail.",

      order: 8,

      videoUrl: "https://www.youtube.com/watch?v=Od2wdGV3o0s",

      pdfUrl: null,

      questions: [
        question(
          "SEnS+ est une technologie orientée principalement vers :",
          [
            "La sécurité",
            "La peinture",
            "Le confort uniquement",
            "La comptabilité",
          ],
          0
        ),

        question(
          "Une technologie de détection ne doit pas être considérée comme :",
          [
            "Une aide à l'opérateur",
            "Un remplacement de l'attention de l'opérateur",
            "Un dispositif de sécurité",
            "Une technologie complémentaire",
          ],
          1
        ),

        question(
          "L'objectif des technologies de sécurité est notamment de :",
          [
            "Réduire certains risques",
            "Autoriser toutes les manœuvres",
            "Supprimer la formation",
            "Supprimer les règles de circulation",
          ],
          0
        ),

        question(
          "L'opérateur doit continuer à :",
          [
            "Surveiller son environnement",
            "Ignorer les piétons",
            "Désactiver les systèmes",
            "Rouler sans visibilité",
          ],
          0
        ),

        question(
          "SEnS+ appartient à une approche visant à améliorer :",
          [
            "La sécurité des opérations",
            "La couleur des chariots",
            "La consommation d'eau",
            "La taille des entrepôts",
          ],
          0
        ),
      ],
    },
  ],

  // ============================================================
  // EXAMEN FINAL MODULE 1
  // ============================================================

  examQuestions: [
    question(
      "Quel est l'objectif principal de la formation à la manutention ?",
      [
        "Garantir des opérations efficaces et sûres",
        "Augmenter uniquement la vitesse",
        "Supprimer les inspections",
        "Remplacer les opérateurs",
      ],
      0
    ),

    question(
      "Quel élément est essentiel pour déterminer la stabilité d'une charge ?",
      [
        "Sa couleur",
        "Son centre de gravité",
        "Son fabricant",
        "Son emballage uniquement",
      ],
      1
    ),

    question(
      "Que doit faire l'opérateur avant chaque utilisation du chariot ?",
      [
        "Effectuer les vérifications prévues",
        "Augmenter la vitesse",
        "Retirer la ceinture",
        "Désactiver les systèmes de sécurité",
      ],
      0
    ),

    question(
      "Que signifie SAS chez Toyota ?",
      [
        "System of Active Stability",
        "Safety Access System",
        "Smart Automatic Service",
        "Standard Active Sensor",
      ],
      0
    ),

    question(
      "Le SAS permet-il à l'opérateur d'ignorer les règles de sécurité ?",
      [
        "Oui",
        "Non",
        "Seulement à faible vitesse",
        "Seulement en intérieur",
      ],
      1
    ),

    question(
      "Une charge trop éloignée du tablier peut :",
      [
        "Augmenter la stabilité",
        "Réduire la capacité effective et affecter la stabilité",
        "Réduire le poids",
        "Augmenter la vitesse",
      ],
      1
    ),

    question(
      "Comment doit être transportée une charge ?",
      [
        "À une hauteur de transport appropriée",
        "Le plus haut possible",
        "Au-dessus de la tête des piétons",
        "Sur une seule fourche",
      ],
      0
    ),

    question(
      "Que faire lorsqu'un défaut de sécurité important est détecté ?",
      [
        "Continuer",
        "Mettre le chariot hors service et signaler le problème",
        "Accélérer",
        "Ignorer le défaut",
      ],
      1
    ),

    question(
      "Dans un entrepôt, les voies de circulation doivent être :",
      [
        "Bloquées",
        "Claires et organisées",
        "Utilisées pour stocker les palettes",
        "Sans marquage",
      ],
      1
    ),

    question(
      "Quel est le rôle général des technologies Toyota de sécurité ?",
      [
        "Aider à réduire certains risques",
        "Remplacer complètement l'opérateur",
        "Supprimer la formation",
        "Augmenter uniquement la vitesse",
      ],
      0
    ),

    question(
      "Lors d'une intersection, l'opérateur doit :",
      [
        "Accélérer",
        "Être vigilant et contrôler son environnement",
        "Regarder uniquement devant",
        "Ignorer les piétons",
      ],
      1
    ),

    question(
      "Une charge instable doit être :",
      [
        "Transportée rapidement",
        "Sécurisée avant le déplacement",
        "Placée sur une seule fourche",
        "Transportée très haut",
      ],
      1
    ),

    question(
      "Que signifie la capacité nominale d'un chariot ?",
      [
        "Le poids du chariot",
        "Une capacité maximale définie dans certaines conditions",
        "La puissance du moteur",
        "La vitesse maximale",
      ],
      1
    ),

    question(
      "SEnS+ est associé principalement à :",
      [
        "Des technologies de sécurité",
        "La peinture",
        "La comptabilité",
        "La gestion des salaires",
      ],
      0
    ),

    question(
      "La ceinture de sécurité doit être :",
      [
        "Utilisée conformément aux consignes",
        "Retirée",
        "Utilisée uniquement en cas d'urgence",
        "Remplacée par une corde",
      ],
      0
    ),

    question(
      "Le choix d'un chariot dépend notamment :",
      [
        "De la charge et de l'environnement",
        "Uniquement de la couleur",
        "Uniquement du prix",
        "Du nombre de sièges",
      ],
      0
    ),

    question(
      "Les piétons dans un entrepôt doivent être :",
      [
        "Pris en compte par l'opérateur",
        "Ignorés",
        "Toujours derrière le chariot",
        "Éloignés uniquement la nuit",
      ],
      0
    ),

    question(
      "Une mauvaise manutention peut provoquer :",
      [
        "Des accidents et dommages matériels",
        "Une meilleure stabilité",
        "Une augmentation automatique de capacité",
        "Aucun risque",
      ],
      0
    ),

    question(
      "Une technologie de sécurité doit être considérée comme :",
      [
        "Un complément aux bonnes pratiques",
        "Un remplacement de l'opérateur",
        "Une autorisation de dépasser la capacité",
        "Une raison de supprimer les contrôles",
      ],
      0
    ),

    question(
      "Quel principe doit toujours rester prioritaire ?",
      [
        "La sécurité",
        "La vitesse",
        "La productivité à tout prix",
        "La réduction des contrôles",
      ],
      0
    ),
  ],
};

// ============================================================
// MODULE 2
// ============================================================

const module2 = {
  title: "Maintenance et Diagnostic des Chariots Élévateurs",

  description:
    "Formation consacrée à la maintenance préventive, aux inspections quotidiennes, aux systèmes mécaniques, hydrauliques et électriques, aux batteries lithium-ion et au diagnostic des pannes.",

  price: 0,

  accessKey: "TOYOTA-MOD2",

  imageUrl:
    "https://images.unsplash.com/photo-1531973576160-7125cd663d86?q=80&w=1200&auto=format&fit=crop",

  passingScore: 70,

  lessons: [
    // ========================================================
    // CHAPITRE 9
    // ========================================================

    {
      title: "Introduction à la maintenance",

      content:
        "Comprendre les objectifs de la maintenance et son importance pour la sécurité, la disponibilité et la durée de vie des chariots.",

      order: 9,

      videoUrl: "https://www.youtube.com/watch?v=_ZhmfwoKDcw",

      pdfUrl: null,

      questions: [
        question(
          "Quel est l'objectif principal de la maintenance préventive ?",
          [
            "Prévenir les défaillances",
            "Attendre toutes les pannes",
            "Augmenter uniquement la vitesse",
            "Supprimer les inspections",
          ],
          0
        ),

        question(
          "Une maintenance régulière permet notamment de :",
          [
            "Réduire certains risques de panne",
            "Supprimer toutes les réparations",
            "Augmenter automatiquement la charge",
            "Modifier le chariot",
          ],
          0
        ),

        question(
          "Qui doit effectuer une maintenance technique spécialisée ?",
          [
            "N'importe quel utilisateur",
            "Une personne qualifiée",
            "Un visiteur",
            "Un piéton",
          ],
          1
        ),

        question(
          "La maintenance contribue à améliorer :",
          [
            "La disponibilité de l'équipement",
            "Uniquement sa couleur",
            "Le nombre de sièges",
            "La hauteur de l'entrepôt",
          ],
          0
        ),

        question(
          "Les intervalles de maintenance doivent être déterminés notamment selon :",
          [
            "Les recommandations du fabricant et les conditions d'utilisation",
            "La couleur du chariot",
            "Le nom de l'opérateur",
            "La météo uniquement",
          ],
          0
        ),
      ],
    },

    // ========================================================
    // CHAPITRE 10
    // ========================================================

    {
      title: "Inspection quotidienne",

      content:
        "Apprendre à effectuer une inspection pré-opérationnelle afin d'identifier les anomalies avant l'utilisation du chariot.",

      order: 10,

      videoUrl: null,

      pdfUrl:
        "https://cdn.toyotaforklift.com/wp-content/uploads/2018/03/03132700/SF-Daily-Checklist-Electric-Class-1-1.pdf",

      questions: [
        question(
          "Quand une inspection pré-opérationnelle doit-elle être effectuée ?",
          [
            "Avant l'utilisation selon les procédures applicables",
            "Une fois par an uniquement",
            "Après une panne uniquement",
            "Jamais",
          ],
          0
        ),

        question(
          "Que faut-il rechercher lors d'une inspection ?",
          [
            "Des fuites et dommages visibles",
            "Uniquement la couleur",
            "Le prix du chariot",
            "Le nom de l'opérateur",
          ],
          0
        ),

        question(
          "Les fourches doivent être contrôlées pour détecter :",
          [
            "Des dommages ou déformations",
            "Leur couleur",
            "Leur marque uniquement",
            "Leur température uniquement",
          ],
          0
        ),

        question(
          "Que faire lorsqu'un défaut important est constaté ?",
          [
            "Utiliser quand même le chariot",
            "Le mettre hors service et signaler le défaut",
            "Accélérer",
            "Ignorer le défaut",
          ],
          1
        ),

        question(
          "Parmi ces éléments, lequel doit être vérifié ?",
          [
            "Le système de freinage",
            "La couleur du siège",
            "Le logo",
            "La marque des chaussures",
          ],
          0
        ),
      ],
    },

    // ========================================================
    // CHAPITRE 11
    // ========================================================

    {
      title: "Maintenance mécanique",

      content:
        "Découvrir les principaux composants mécaniques et les opérations de contrôle nécessaires pour maintenir le chariot en bon état.",

      order: 11,

      videoUrl: null,

      pdfUrl:
        "https://cdn.toyotaforklift.com/wp-content/uploads/2018/03/03132700/SF-Daily-Checklist-Electric-Class-1-1.pdf",

      questions: [
        question(
          "Quel élément fait partie des composants mécaniques d'un chariot ?",
          [
            "Les roues",
            "Le réseau Wi-Fi",
            "L'écran du smartphone",
            "L'imprimante",
          ],
          0
        ),

        question(
          "Pourquoi vérifier les fixations mécaniques ?",
          [
            "Pour détecter les éléments desserrés ou endommagés",
            "Pour changer la couleur",
            "Pour augmenter la vitesse",
            "Pour réduire le poids",
          ],
          0
        ),

        question(
          "Un bruit mécanique inhabituel peut indiquer :",
          [
            "Une anomalie potentielle",
            "Une augmentation de capacité",
            "Une meilleure stabilité",
            "Une économie automatique",
          ],
          0
        ),

        question(
          "Les éléments mécaniques doivent être entretenus :",
          [
            "Selon les procédures du fabricant",
            "Uniquement après une panne grave",
            "Jamais",
            "Seulement le week-end",
          ],
          0
        ),

        question(
          "Une pièce mécanique endommagée doit être :",
          [
            "Ignorée",
            "Contrôlée et remplacée/réparée selon les procédures",
            "Peinte",
            "Retirée sans procédure",
          ],
          1
        ),
      ],
    },

    // ========================================================
    // CHAPITRE 12
    // ========================================================

    {
      title: "Système hydraulique",

      content:
        "Comprendre le fonctionnement général du système hydraulique et identifier les principaux signes de dysfonctionnement.",

      order: 12,

      videoUrl: null,

      pdfUrl:
        "https://cdn.toyotaforklift.com/wp-content/uploads/2018/03/03132700/SF-Daily-Checklist-Electric-Class-1-1.pdf",

      questions: [
        question(
          "Le système hydraulique participe notamment :",
          [
            "Aux fonctions de levage et d'inclinaison",
            "À l'éclairage de l'entrepôt",
            "Au Wi-Fi",
            "À la climatisation du bâtiment",
          ],
          0
        ),

        question(
          "Une fuite hydraulique doit être :",
          [
            "Ignorée",
            "Signalée et traitée selon la procédure",
            "Nettoyée sans signalement",
            "Utilisée comme indicateur de niveau",
          ],
          1
        ),

        question(
          "Le liquide hydraulique doit être contrôlé :",
          [
            "Selon les recommandations du fabricant",
            "Uniquement tous les dix ans",
            "Jamais",
            "Uniquement après une collision",
          ],
          0
        ),

        question(
          "Un mouvement de levage anormal peut indiquer :",
          [
            "Un problème potentiel du système",
            "Une meilleure performance",
            "Une augmentation de capacité",
            "Une batterie plus chargée",
          ],
          0
        ),

        question(
          "Une intervention sur un système hydraulique doit être réalisée :",
          [
            "Avec les procédures et précautions appropriées",
            "Sans aucune précaution",
            "Par n'importe quel passant",
            "Pendant l'utilisation du chariot",
          ],
          0
        ),
      ],
    },

    // ========================================================
    // CHAPITRE 13
    // ========================================================

    {
      title: "Maintenance électrique",

      content:
        "Découvrir les principaux éléments électriques d'un chariot et les précautions nécessaires lors des contrôles.",

      order: 13,

      videoUrl: null,

      pdfUrl:
        "https://cdn.toyotaforklift.com/wp-content/uploads/2018/03/03132700/SF-Daily-Checklist-Electric-Class-1-1.pdf",

      questions: [
        question(
          "Quel élément fait partie du système électrique ?",
          [
            "Les câbles électriques",
            "Les palettes",
            "Les rayonnages",
            "Les portes",
          ],
          0
        ),

        question(
          "Un câble électrique endommagé doit être :",
          [
            "Ignoré",
            "Signalé et traité selon les procédures",
            "Peint",
            "Coupé immédiatement sans procédure",
          ],
          1
        ),

        question(
          "Avant une intervention électrique, il faut :",
          [
            "Respecter les procédures de sécurité applicables",
            "Mettre le chariot en marche",
            "Augmenter la tension",
            "Toucher les câbles pour vérifier",
          ],
          0
        ),

        question(
          "Les connecteurs électriques doivent être :",
          [
            "Contrôlés selon les procédures",
            "Arrachés",
            "Mouillés",
            "Ignorés",
          ],
          0
        ),

        question(
          "Une anomalie électrique peut entraîner :",
          [
            "Un risque de panne ou de sécurité",
            "Une augmentation automatique de capacité",
            "Une meilleure stabilité",
            "Aucun effet",
          ],
          0
        ),
      ],
    },

    // ========================================================
    // CHAPITRE 14
    // ========================================================

    {
      title: "Batteries Lithium-ion",

      content:
        "Découvrir les caractéristiques générales des batteries lithium-ion utilisées dans les équipements de manutention et les bonnes pratiques de sécurité.",

      order: 14,

      videoUrl: null,

      pdfUrl: null,

      questions: [
        question(
          "Quel est un avantage des batteries lithium-ion ?",
          [
            "Une recharge adaptée aux usages intensifs",
            "Elles ne nécessitent jamais aucune procédure",
            "Elles sont toujours sans danger",
            "Elles fonctionnent sans énergie",
          ],
          0
        ),

        question(
          "La batterie doit être utilisée :",
          [
            "Selon les instructions du fabricant",
            "Sans aucune précaution",
            "Avec n'importe quel chargeur",
            "À proximité de sources de chaleur",
          ],
          0
        ),

        question(
          "Un chargeur doit être :",
          [
            "Compatible avec la batterie",
            "Choisi au hasard",
            "Toujours plus puissant",
            "Modifié par l'opérateur",
          ],
          0
        ),

        question(
          "Une batterie présentant une anomalie doit être :",
          [
            "Utilisée normalement",
            "Signalée et traitée selon les procédures",
            "Percée",
            "Démontée par n'importe qui",
          ],
          1
        ),

        question(
          "La maintenance d'une batterie lithium-ion nécessite :",
          [
            "Le respect des procédures du fabricant",
            "Aucune règle",
            "L'utilisation d'outils métalliques au hasard",
            "Le démontage systématique",
          ],
          0
        ),
      ],
    },

    // ========================================================
    // CHAPITRE 15
    // ========================================================

    {
      title: "Diagnostic des pannes",

      content:
        "Apprendre à identifier les symptômes d'une panne, utiliser les informations disponibles et orienter correctement le diagnostic.",

      order: 15,

      videoUrl: null,

      pdfUrl: null,

      questions: [
        question(
          "La première étape d'un diagnostic est généralement :",
          [
            "Identifier précisément le symptôme",
            "Démonter immédiatement le chariot",
            "Changer toutes les pièces",
            "Ignorer le problème",
          ],
          0
        ),

        question(
          "Un code d'erreur doit être :",
          [
            "Interprété selon la documentation appropriée",
            "Effacé sans vérification",
            "Ignoré",
            "Modifié",
          ],
          0
        ),

        question(
          "Pourquoi documenter les pannes ?",
          [
            "Pour faciliter le suivi et le diagnostic",
            "Pour augmenter la vitesse",
            "Pour changer la couleur",
            "Pour supprimer les inspections",
          ],
          0
        ),

        question(
          "Si le diagnostic dépasse les compétences de l'opérateur :",
          [
            "Il faut faire intervenir une personne qualifiée",
            "Il faut continuer à utiliser le chariot",
            "Il faut démonter le moteur",
            "Il faut ignorer la panne",
          ],
          0
        ),

        question(
          "Un symptôme récurrent peut indiquer :",
          [
            "Une cause qui nécessite une investigation",
            "Une meilleure performance",
            "Une augmentation de capacité",
            "Une absence totale de problème",
          ],
          0
        ),
      ],
    },

    // ========================================================
    // CHAPITRE 16
    // ========================================================

    {
      title: "Maintenance préventive et gestion de flotte",

      content:
        "Comprendre la planification de la maintenance, le suivi des heures d'utilisation et la gestion d'une flotte de chariots.",

      order: 16,

      videoUrl: "https://www.youtube.com/watch?v=_ZhmfwoKDcw",

      pdfUrl: null,

      questions: [
        question(
          "La maintenance préventive vise principalement à :",
          [
            "Réduire les risques de défaillance",
            "Attendre les pannes",
            "Supprimer les contrôles",
            "Augmenter la vitesse",
          ],
          0
        ),

        question(
          "La gestion d'une flotte permet notamment de suivre :",
          [
            "L'utilisation et la maintenance des équipements",
            "Uniquement les couleurs",
            "Les vêtements des opérateurs",
            "La météo",
          ],
          0
        ),

        question(
          "Les heures d'utilisation peuvent servir à :",
          [
            "Planifier certaines opérations de maintenance",
            "Changer la couleur du chariot",
            "Calculer la taille des palettes",
            "Supprimer les inspections",
          ],
          0
        ),

        question(
          "Un historique de maintenance permet de :",
          [
            "Suivre les interventions réalisées",
            "Augmenter automatiquement la puissance",
            "Supprimer les réparations",
            "Remplacer les opérateurs",
          ],
          0
        ),

        question(
          "Une bonne gestion de flotte contribue à :",
          [
            "Améliorer la disponibilité et le suivi des équipements",
            "Augmenter les risques",
            "Supprimer les procédures",
            "Ignorer les pannes",
          ],
          0
        ),
      ],
    },
  ],

  // ============================================================
  // EXAMEN FINAL MODULE 2
  // ============================================================

  examQuestions: [
    question(
      "Quel est l'objectif de la maintenance préventive ?",
      [
        "Prévenir les défaillances",
        "Attendre les pannes",
        "Supprimer les contrôles",
        "Augmenter uniquement la vitesse",
      ],
      0
    ),

    question(
      "Quand effectuer une inspection pré-opérationnelle ?",
      [
        "Avant l'utilisation selon les procédures applicables",
        "Une fois par an",
        "Après chaque panne uniquement",
        "Jamais",
      ],
      0
    ),

    question(
      "Que faut-il rechercher pendant une inspection ?",
      [
        "Les anomalies, dommages et fuites",
        "Uniquement la couleur",
        "Le prix",
        "Le nom de l'opérateur",
      ],
      0
    ),

    question(
      "Que faire lorsqu'un défaut important est constaté ?",
      [
        "Continuer",
        "Mettre l'équipement hors service et signaler le problème",
        "Accélérer",
        "Ignorer",
      ],
      1
    ),

    question(
      "Le système hydraulique participe notamment :",
      [
        "Au levage et à l'inclinaison",
        "Au Wi-Fi",
        "À l'éclairage du bâtiment",
        "À l'impression",
      ],
      0
    ),

    question(
      "Une fuite hydraulique doit être :",
      [
        "Ignorée",
        "Signalée et traitée",
        "Utilisée normalement",
        "Nettoyée sans signalement",
      ],
      1
    ),

    question(
      "Quel élément appartient au système électrique ?",
      [
        "Les câbles",
        "Les palettes",
        "Les rayonnages",
        "Les portes",
      ],
      0
    ),

    question(
      "Un câble électrique endommagé doit être :",
      [
        "Ignoré",
        "Signalé et traité selon les procédures",
        "Peint",
        "Arraché",
      ],
      1
    ),

    question(
      "Un chargeur de batterie doit être :",
      [
        "Compatible avec la batterie",
        "Choisi au hasard",
        "Toujours plus puissant",
        "Modifié par l'opérateur",
      ],
      0
    ),

    question(
      "Une batterie présentant une anomalie doit être :",
      [
        "Utilisée normalement",
        "Signalée et traitée selon les procédures",
        "Percée",
        "Démontée par n'importe qui",
      ],
      1
    ),

    question(
      "Quelle est généralement la première étape d'un diagnostic ?",
      [
        "Identifier le symptôme",
        "Démonter immédiatement",
        "Changer toutes les pièces",
        "Ignorer la panne",
      ],
      0
    ),

    question(
      "Un code d'erreur doit être interprété à partir :",
      [
        "De la documentation appropriée",
        "De suppositions",
        "D'Internet uniquement",
        "Du bruit du moteur",
      ],
      0
    ),

    question(
      "Pourquoi conserver un historique de maintenance ?",
      [
        "Pour suivre les interventions et faciliter le suivi",
        "Pour augmenter la vitesse",
        "Pour changer la couleur",
        "Pour supprimer les inspections",
      ],
      0
    ),

    question(
      "Les heures d'utilisation permettent notamment :",
      [
        "De planifier certaines maintenances",
        "De changer le type de batterie automatiquement",
        "De supprimer les contrôles",
        "D'augmenter la capacité",
      ],
      0
    ),

    question(
      "Une intervention technique spécialisée doit être réalisée par :",
      [
        "Une personne qualifiée",
        "N'importe quel utilisateur",
        "Un visiteur",
        "Un piéton",
      ],
      0
    ),

    question(
      "La maintenance contribue notamment à :",
      [
        "Améliorer la disponibilité de l'équipement",
        "Supprimer tous les risques",
        "Augmenter automatiquement la charge",
        "Modifier le fabricant",
      ],
      0
    ),

    question(
      "Un bruit mécanique inhabituel peut être :",
      [
        "Un signe d'anomalie",
        "Une augmentation de capacité",
        "Une meilleure stabilité",
        "Une recharge de batterie",
      ],
      0
    ),

    question(
      "Le choix des intervalles de maintenance dépend notamment :",
      [
        "Des recommandations du fabricant et des conditions d'utilisation",
        "De la couleur",
        "Du prénom de l'opérateur",
        "De la météo uniquement",
      ],
      0
    ),

    question(
      "Une bonne gestion de flotte permet notamment de :",
      [
        "Suivre l'utilisation et la maintenance des équipements",
        "Supprimer les inspections",
        "Ignorer les pannes",
        "Augmenter les risques",
      ],
      0
    ),

    question(
      "Quel principe est prioritaire lors d'une intervention de maintenance ?",
      [
        "Respecter les procédures de sécurité",
        "Aller le plus vite possible",
        "Ignorer les anomalies",
        "Utiliser n'importe quel outil",
      ],
      0
    ),
  ],
};

// ============================================================
// FONCTION DE CREATION D'UN MODULE
// ============================================================

async function seedModule(moduleData) {
  console.log(`\n📦 Traitement du module : ${moduleData.title}`);

  // ----------------------------------------------------------
  // Chercher si le module existe déjà
  // ----------------------------------------------------------

  let course = await prisma.course.findFirst({
    where: {
      accessKey: moduleData.accessKey,
    },
  });

  // ----------------------------------------------------------
  // Créer le module s'il n'existe pas
  // ----------------------------------------------------------

  if (!course) {
    course = await prisma.course.create({
      data: {
        title: moduleData.title,
        description: moduleData.description,
        price: moduleData.price,
        accessKey: moduleData.accessKey,
        imageUrl: moduleData.imageUrl,
        passingScore: moduleData.passingScore,

        instructor: {
          connect: {
            id: INSTRUCTOR_ID,
          },
        },
      },
    });

    console.log(`✅ Module créé : ID ${course.id}`);
  } else {
    console.log(`ℹ️ Module déjà existant : ID ${course.id}`);
  }

  // ----------------------------------------------------------
  // Création des chapitres
  // ----------------------------------------------------------

  for (const lessonData of moduleData.lessons) {
    let lesson = await prisma.lesson.findFirst({
      where: {
        courseId: course.id,
        order: lessonData.order,
      },
    });

    if (!lesson) {
      lesson = await prisma.lesson.create({
        data: {
          title: lessonData.title,
          content: lessonData.content,
          videoUrl: lessonData.videoUrl,
          pdfUrl: lessonData.pdfUrl,
          order: lessonData.order,
          courseId: course.id,
        },
      });

      console.log(`   📚 Chapitre créé : ${lessonData.title}`);
    } else {
      console.log(`   ℹ️ Chapitre déjà existant : ${lessonData.title}`);
    }

    // --------------------------------------------------------
    // Questions du quiz du chapitre
    // --------------------------------------------------------

    const existingQuestions = await prisma.question.count({
      where: {
        lessonId: lesson.id,
      },
    });

    if (existingQuestions === 0) {
      for (const q of lessonData.questions) {
        await prisma.question.create({
          data: {
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            lessonId: lesson.id,
          },
        });
      }

      console.log(
        `      📝 ${lessonData.questions.length} questions ajoutées`
      );
    } else {
      console.log(
        `      ℹ️ Quiz déjà présent (${existingQuestions} questions)`
      );
    }
  }

  // ----------------------------------------------------------
  // EXAMEN FINAL
  // ----------------------------------------------------------

  const existingExamQuestions = await prisma.question.count({
    where: {
      courseId: course.id,
    },
  });

  if (existingExamQuestions === 0) {
    for (const q of moduleData.examQuestions) {
      await prisma.question.create({
        data: {
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          courseId: course.id,
        },
      });
    }

    console.log(
      `   🎓 ${moduleData.examQuestions.length} questions d'examen ajoutées`
    );
  } else {
    console.log(
      `   ℹ️ Examen déjà présent (${existingExamQuestions} questions)`
    );
  }

  return course;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log("==========================================");
  console.log("🚀 DÉMARRAGE DU SEED TOYOTA");
  console.log("==========================================");

  // ----------------------------------------------------------
  // Vérifier l'instructor
  // ----------------------------------------------------------

  const instructor = await prisma.user.findUnique({
    where: {
      id: INSTRUCTOR_ID,
    },
  });

  if (!instructor) {
    throw new Error(
      `❌ L'utilisateur avec l'ID ${INSTRUCTOR_ID} n'existe pas.`
    );
  }

  console.log(
    `👨‍🏫 Instructor trouvé : ${instructor.name} (ID ${instructor.id})`
  );

  // ----------------------------------------------------------
  // Créer les modules
  // ----------------------------------------------------------

  const course1 = await seedModule(module1);

  const course2 = await seedModule(module2);

  // ----------------------------------------------------------
  // Résumé
  // ----------------------------------------------------------

  console.log("\n==========================================");
  console.log("✅ SEED TERMINÉ AVEC SUCCÈS");
  console.log("==========================================");

  console.log("\n📦 MODULE 1");
  console.log(`ID       : ${course1.id}`);
  console.log(`Titre    : ${course1.title}`);
  console.log(`Access   : ${course1.accessKey}`);

  console.log("\n📦 MODULE 2");
  console.log(`ID       : ${course2.id}`);
  console.log(`Titre    : ${course2.title}`);
  console.log(`Access   : ${course2.accessKey}`);

  console.log("\n📊 Contenu :");
  console.log("Module 1 → 8 chapitres + 40 quiz + 20 examen");
  console.log("Module 2 → 8 chapitres + 40 quiz + 20 examen");
}

// ============================================================
// EXECUTION
// ============================================================

main()
  .catch((error) => {
    console.error("\n❌ ERREUR SEED :");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });