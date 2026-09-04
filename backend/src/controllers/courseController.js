const prisma = require('../config/prisma');

// --- CRÉER UNE FORMATION ---
exports.createCourse = async (req, res) => {
  try {
    const { title, description, accessKey, imageUrl, passingScore, categoryId, level } = req.body; // <-- On récupère imageUrl et categoryId
    const instructorId = req.user.userId; 

    const newCourse = await prisma.course.create({
      data: {
        title,
        description,
        price: 0,
        accessKey: accessKey || "SECRET123",
        imageUrl: imageUrl || undefined, // <-- On l'envoie à Prisma
        categoryId: categoryId ? parseInt(categoryId) : null,
        level: level || 'Débutant',
        instructorId
      }
    });

    res.status(201).json({ message: "Formation créée !", course: newCourse });
  } catch (error) {
    res.status(500).json({ message: "Erreur.", error: error.message });
  }
};

// --- RÉCUPÉRER TOUTES LES FORMATIONS ---
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        // On inclut juste le nom du professeur associé à la formation
        instructor: {
          select: { name: true } },
          category: true
      }
    });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Erreur", error: error.message});
  }
};

// --- DÉBLOQUER UNE FORMATION (AVEC LA CLÉ) ---
exports.unlockCourse = async (req, res) => {
    console.log(req.body);
  try {
    const { courseId } = req.params;
    const { key } = req.body; // La clé envoyée par l'étudiant
    const userId = req.user.userId;

    // 1. Chercher la formation
    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) {
      return res.status(404).json({ message: "Formation introuvable." });
    }

    // 2. Vérifier la clé
    console.log("========== DEBUG ==========");
    console.log("Clé envoyée :", key);
    console.log("Clé enregistrée :", course.accessKey);
    console.log("Objet course :", course);
    console.log("===========================");
    if (course.accessKey !== key) {
      return res.status(403).json({ message: "Clé d'accès incorrecte !" });
    }

    // 3. Vérifier si l'étudiant n'est pas déjà inscrit
    const alreadyEnrolled = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId: course.id }
      }
    });

    if (alreadyEnrolled) {
      return res.status(400).json({ message: "Vous avez déjà débloqué cette formation." });
    }

    // 4. Inscrire l'étudiant (Créer l'Enrollment)
    await prisma.enrollment.create({
      data: {
        userId,
        courseId: course.id
      }
    });

    res.status(200).json({ message: "Succès ! Formation débloquée." });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- RÉCUPÉRER LES FORMATIONS DÉBLOQUÉES PAR L'ÉTUDIANT ---
// --- RÉCUPÉRER LES FORMATIONS DÉBLOQUÉES PAR L'ÉTUDIANT ---
exports.getMyCourses = async (req, res) => {
  try {
    const userId = req.user.userId;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }, // Trie de la plus récente à la plus ancienne
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
            // NOUVEAU : On inclut les leçons ET la progression pour calculer le pourcentage
            lessons: {
              include: {
                progresses: {
                  where: { userId: userId }
                }
              }
            }
          }
        }
      }
    });

    const myCourses = enrollments.map(enrollment => enrollment.course);
    res.status(200).json(myCourses);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- RÉCUPÉRER UN COURS COMPLET AVEC SES LEÇONS (SÉCURISÉ) ---
exports.getCourseById = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const userId = req.user.userId;

    // 1. SÉCURITÉ : L'utilisateur a-t-il le droit de voir ce cours ?
    const isEnrolled = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } }
    });

    if (!isEnrolled && req.user.role !== 'INSTRUCTOR') {
      return res.status(403).json({ message: "Accès refusé. Vous devez débloquer ce cours." });
    }

    // 2. On récupère le cours ET ses leçons (triées par ordre)
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            progresses: { where: { userId: userId } },
            questions: true // <-- NOUVEAU : On inclut les questions du quiz !
          }
        },
        instructor: { select: { name: true } },
        examQuestions: true // <-- NOUVEAU : On inclut les questions de l'examen !
      }
    });

    if (!course) {
      return // On renvoie le cours ET les infos de l'étudiant (pour savoir s'il a déjà validé)
    res.status(200).json({ 
      ...course, 
      enrollment: isEnrolled 
    });
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- RÉCUPÉRER LES COURS CRÉÉS PAR L'INSTRUCTEUR (AVEC STATISTIQUES DÉTAILLÉES) ---
exports.getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user.userId;

    const courses = await prisma.course.findMany({
      where: { instructorId },
      include: {
        _count: {
          select: { enrollments: true, lessons: true }
        },
        enrollments: {
          select: { status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const coursesWithStats = courses.map(course => {
      // On compte le nombre exact pour chaque statut
      const validatedCount = course.enrollments.filter(e => e.status === 'VALIDATED').length;
      const failedCount = course.enrollments.filter(e => e.status === 'FAILED').length;
      const inProgressCount = course.enrollments.filter(e => e.status === 'IN_PROGRESS').length; // Ceux en cours (non validés)

      const totalEvaluated = validatedCount + failedCount; // Ceux qui ont passé l'examen

      // Le taux de réussite en % (uniquement sur ceux qui ont passé l'examen)
      const successRate = totalEvaluated > 0 ? Math.round((validatedCount / totalEvaluated) * 100) : null;

      const { enrollments, ...courseData } = course;
      
      return {
        ...courseData,
        successRate,
        totalEvaluated,
        validatedCount,
        failedCount,
        inProgressCount // On envoie ça au frontend pour la bulle !
      };
    });

    res.status(200).json(coursesWithStats);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- MODIFIER UNE FORMATION ---
exports.updateCourse = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    // On récupère TOUTES les données, y compris categoryId et passingScore
    const { title, description, accessKey, imageUrl, passingScore, categoryId, level } = req.body;

    // 1. Vérifier que c'est bien l'auteur du cours
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.instructorId !== req.user.userId) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    // 2. Mettre à jour dans la base de données
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: { 
        title, 
        description, 
        accessKey, 
        imageUrl,
        passingScore: passingScore ? parseInt(passingScore) : 70, // Mise à jour du score
        categoryId: categoryId ? parseInt(categoryId) : null,      // Mise à jour de la branche
        level: level || 'Débutant' // Mise à jour du niveau
      }
    });

    res.status(200).json({ message: "Formation mise à jour !", course: updatedCourse });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la modification.", error: error.message });
  }
};

// --- SUPPRIMER UNE FORMATION ---
exports.deleteCourse = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);

    // 1. Vérifier la propriété
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.instructorId !== req.user.userId) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    // 2. Supprimer les inscriptions liées (pour éviter les erreurs de base de données)
    await prisma.enrollment.deleteMany({ where: { courseId } });
    
    // 3. Supprimer le cours (les leçons seront supprimées automatiquement)
    await prisma.course.delete({ where: { id: courseId } });

    res.status(200).json({ message: "Formation supprimée avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression.", error: error.message });
  }
};

// --- VALIDER LA FORMATION (CALCUL DU SCORE ET DE LA DURÉE) ---
exports.validateCourse = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const userId = req.user.userId;

    // 1. Récupérer l'inscription et le cours
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: { course: true }
    });

    if (!enrollment) return res.status(404).json({ message: "Inscription introuvable." });
    if (enrollment.status !== "IN_PROGRESS") {
      return res.status(400).json({ message: "Ce cours a déjà été évalué.", enrollment });
    }

    // 2. Récupérer les scores de toutes les leçons de ce cours pour cet étudiant
    const progresses = await prisma.lessonProgress.findMany({
      where: { 
        userId: userId,
        lesson: { courseId: courseId }
      }
    });

    // 3. Calculer le score final (Moyenne des quiz)
    // On additionne les scores (s'ils existent, sinon 0) et on divise par le nombre de leçons
    let totalScore = 0;
    progresses.forEach(p => {
      totalScore += (p.score || 0); // Si pas de quiz, ça compte comme 0 (ou on l'ignore selon ta logique)
    });
    
    // Évite la division par zéro s'il n'y a pas de leçons
    const finalScore = progresses.length > 0 ? (totalScore / progresses.length) : 0; 

    // 4. Calculer la durée d'apprentissage (Entre l'unlock et maintenant)
    const startDate = new Date(enrollment.createdAt);
    const endDate = new Date();
    const durationInHours = Math.round(Math.abs(endDate - startDate) / 36e5); // Différence en heures

    // 5. Appliquer la règle de validation (Le Seuil de l'instructeur)
    const isSuccess = finalScore >= enrollment.course.passingScore;
    const newStatus = isSuccess ? "VALIDATED" : "FAILED";

    // 6. Sauvegarder le résultat final dans la base de données
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: newStatus,
        finalScore: Math.round(finalScore),
        completedAt: endDate
      }
    });

    res.status(200).json({
      message: isSuccess ? "Félicitations, vous avez validé la formation !" : "Échec de la validation. Score trop bas.",
      result: {
        status: newStatus,
        score: Math.round(finalScore),
        requiredScore: enrollment.course.passingScore,
        durationHours: durationInHours
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la validation.", error: error.message });
  }
};

// --- RÉCUPÉRER LES ÉTUDIANTS D'UN COURS (AVEC DÉTAILS) ---
exports.getCourseStudents = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: { 
          select: { 
            id: true, name: true, email: true, avatarUrl: true,
            // On récupère le score de chaque leçon terminée par cet étudiant pour CE cours
            lessonProgresses: {
              where: { lesson: { courseId: courseId } },
              include: { lesson: { select: { title: true, order: true } } },
              orderBy: { lesson: { order: 'asc' } }
            }
          } 
        }
      }
    });
    res.status(200).json(enrollments);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- SOUMETTRE LES NOTES ET VALIDER LA FORMATION (SUR 20) ---
exports.submitGrades = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const userId = req.user.userId;
    const { quizScore, examScore } = req.body; // Les notes sont maintenant sur 20

    // Calcul de la note finale sur 20 (30% Quiz + 70% Examen)
    const finalGrade = parseFloat(((quizScore * 0.3) + (examScore * 0.7)).toFixed(2)); // toFixed(2) garde 2 chiffres après la virgule

    // L'étudiant valide s'il a au moins 10/20
    const isValidated = finalGrade >= 10;

    const updatedEnrollment = await prisma.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: {
        quizScore,
        examScore,
        finalGrade,
        isValidated,
        status: isValidated ? 'VALIDATED' : 'FAILED',
        completedAt: new Date() // Enregistre l'heure de fin
      }
    });

    res.status(200).json({ 
      message: isValidated ? "Validé !" : "Échec.",
      results: { quizScore, examScore, finalGrade, isValidated }
    });

  } catch (error) {
    res.status(500).json({ message: "Erreur de notation.", error: error.message });
  }
};

// --- RÉINITIALISER UN ÉTUDIANT (Correction du Bug) ---
exports.resetStudent = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const studentId = parseInt(req.params.studentId);

    // 1. Remettre l'inscription à zéro
    await prisma.enrollment.update({
      where: { userId_courseId: { userId: studentId, courseId } },
      data: { status: 'IN_PROGRESS', quizScore: null, examScore: null, finalGrade: null, isValidated: false, completedAt: null }
    });

    // 2. Trouver toutes les leçons de ce cours
    const lessons = await prisma.lesson.findMany({ where: { courseId } });
    const lessonIds = lessons.map(l => l.id);

    // 3. Supprimer de manière sécurisée la progression
    if (lessonIds.length > 0) {
      await prisma.lessonProgress.deleteMany({
        where: { userId: studentId, lessonId: { in: lessonIds } }
      });
    }

    res.status(200).json({ message: "Progression réinitialisée." });
  } catch (error) {
    res.status(500).json({ message: "Erreur.", error: error.message });
  }
};

// --- AJOUTER UNE QUESTION À L'EXAMEN FINAL ---
exports.addExamQuestion = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const { questionText, options, correctAnswer } = req.body;

    const newQuestion = await prisma.question.create({
      data: {
        questionText,
        options,
        correctAnswer: parseInt(correctAnswer),
        courseId
      }
    });
    res.status(201).json({ message: "Question ajoutée à l'examen !", question: newQuestion });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout.", error: error.message });
  }
};

// --- SUPPRIMER UNE QUESTION D'EXAMEN FINAL ---
exports.deleteExamQuestion = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const questionId = parseInt(req.params.questionId);

    // 1. Vérifier que c'est bien l'auteur du cours
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.instructorId !== req.user.userId) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    // 2. Supprimer la question
    await prisma.question.delete({
      where: { id: questionId }
    });

    res.status(200).json({ message: "Question supprimée avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression.", error: error.message });
  }
};

// --- FORCER LA VALIDATION OU L'ÉCHEC MANUELLEMENT ---
exports.overrideStudentStatus = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const studentId = parseInt(req.params.studentId);
    const { status } = req.body; // 'VALIDATED' ou 'FAILED'

    await prisma.enrollment.update({
      where: { userId_courseId: { userId: studentId, courseId } },
      data: { 
        status: status,
        isValidated: status === 'VALIDATED'
      }
    });
    res.status(200).json({ message: "Le statut de l'étudiant a été forcé manuellement." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la modification du statut.", error: error.message });
  }
};