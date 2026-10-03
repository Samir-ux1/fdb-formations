const prisma = require('../config/prisma');
const emailService = require('../utils/emailService');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const shuffle = items => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const selectQuestions = (bank, counts = {}, legacyCount = 0) => {
  const requestedTotal = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (!requestedTotal) {
    const shuffled = shuffle(bank);
    return { questions: legacyCount > 0 ? shuffled.slice(0, legacyCount) : shuffled };
  }

  const selected = [];
  for (const [difficulty, count] of Object.entries(counts)) {
    if (!count) continue;
    const pool = bank.filter(question => question.difficulty === difficulty);
    if (pool.length < count) {
      return { error: `La banque contient ${pool.length} question(s) ${difficulty.toLowerCase()} mais ${count} sont demandées.` };
    }
    selected.push(...shuffle(pool).slice(0, count));
  }
  return { questions: shuffle(selected) };
};

const createAssessmentToken = async (claims, res) => {
  if (!process.env.JWT_SECRET) {
    res.status(500).json({ message: 'La configuration de sécurité du serveur est incomplète.' });
    return null;
  }
  const attemptId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 45 * 60 * 1000);
  await prisma.assessmentAttempt.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await prisma.assessmentAttempt.create({
    data: {
      id: attemptId,
      type: claims.type,
      userId: claims.userId,
      courseId: claims.courseId,
      lessonId: claims.lessonId,
      questionIds: claims.questionIds,
      expiresAt
    }
  });
  return jwt.sign({
    type: claims.type,
    userId: claims.userId,
    courseId: claims.courseId,
    lessonId: claims.lessonId,
    attemptId
  }, process.env.JWT_SECRET, { expiresIn: '45m' });
};

const verifyAssessmentToken = (token, type, userId, courseId) => {
  if (!process.env.JWT_SECRET || typeof token !== 'string') return null;
  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    if (claims.type !== type || claims.userId !== userId || claims.courseId !== courseId || typeof claims.attemptId !== 'string') return null;
    return claims;
  } catch {
    return null;
  }
};

const validateAnswers = (answers, questions) => {
  if (!Array.isArray(answers) || answers.length !== questions.length) return false;
  const validIds = new Set(questions.map(question => question.id));
  const submittedIds = new Set();
  return answers.every(answer => {
    const question = questions.find(item => item.id === Number(answer?.questionId));
    const selectedOption = Number(answer?.selectedOption);
    if (!question || !validIds.has(question.id) || submittedIds.has(question.id) ||
      !Number.isInteger(selectedOption) || selectedOption < 0 || selectedOption >= question.options.length) return false;
    submittedIds.add(question.id);
    return true;
  });
};

const calculateScore = (answers, questions) => {
  const answerByQuestion = new Map(answers.map(answer => [Number(answer.questionId), Number(answer.selectedOption)]));
  const correct = questions.reduce((sum, question) => sum + (answerByQuestion.get(question.id) === question.correctAnswer ? 1 : 0), 0);
  return Math.round((correct / questions.length) * 20);
};

exports.createCourse = async (req, res) => {
  console.log("👉 Création du cours demandée :", req.body.title);
  try {
    const { title, description, accessKey, imageUrl, categoryId, level, duration } = req.body;

    // 1. On sécurise les nombres (pour éviter le crash NaN)
    const safeCategoryId = categoryId ? parseInt(categoryId) : null;
    const safeDuration = duration ? parseInt(duration) : 60;

    // 2. On vérifie l'ID du formateur (selon comment votre middleware l'appelle : req.user.id ou req.userId)
    const instructorId = req.user.id; // ⚠️ Modifiez par req.userId si c'est ce que vous utilisez d'habitude !

    // 3. On enregistre
    const newCourse = await prisma.course.create({
      data: {
        title,
        description,
        accessKey,
        imageUrl: imageUrl || null,
        categoryId: safeCategoryId,
        level: level || "Débutant",
        duration: safeDuration,
        instructorId: instructorId
      }
    });

    console.log("✅ Cours créé !");
    return res.status(201).json(newCourse);

  } catch (error) {
    console.error("🔥 ERREUR CRÉATION COURS :", error);
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// --- RÉCUPÉRER TOUTES LES FORMATIONS ---
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true, title: true, description: true, imageUrl: true, price: true,
        level: true, duration: true, timeLimitDays: true, passingScore: true,
        createdAt: true, categoryId: true, instructorId: true,
        instructor: { select: { name: true } },
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
    if (typeof key !== 'string' || course.accessKey !== key.trim()) {
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

    const myCourses = enrollments.map(enrollment => ({
      ...enrollment.course,
      accessKey: undefined,
      learningTimeSeconds: enrollment.learningTimeSeconds
    }));
    res.status(200).json(myCourses);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- ENREGISTRER LE TEMPS DE FORMATION EFFECTIVEMENT PASSÉ DANS LE LECTEUR ---
exports.recordLearningTime = async (req, res) => {
  try {
    const courseId = Number.parseInt(req.params.courseId, 10);
    const seconds = Number.parseInt(req.body.seconds, 10);
    const userId = req.user.userId;

    if (!Number.isInteger(courseId) || courseId < 1 || !Number.isInteger(seconds) || seconds < 1 || seconds > 60) {
      return res.status(400).json({ message: "Durée de suivi invalide." });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true, status: true }
    });

    if (!enrollment) return res.status(404).json({ message: "Inscription introuvable." });
    if (enrollment.status !== 'IN_PROGRESS') {
      return res.status(400).json({ message: "Le suivi est terminé pour cette formation." });
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { learningTimeSeconds: { increment: seconds } },
      select: { learningTimeSeconds: true }
    });

    return res.status(200).json(updatedEnrollment);
  } catch (error) {
    return res.status(500).json({ message: "Impossible d'enregistrer le temps d'apprentissage." });
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

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            progresses: { where: { userId } },
            questions: true
          }
        },
        instructor: { select: { name: true } },
        examQuestions: true
      }
    });

    if (!course) return res.status(404).json({ message: "Formation introuvable." });
    if (req.user.role === 'INSTRUCTOR' && course.instructorId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: "Accès refusé." });
    }
    if (!isEnrolled && req.user.role !== 'INSTRUCTOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: "Accès refusé. Vous devez débloquer ce cours." });
    }

    const canManageCourse = req.user.role === 'ADMIN' ||
      (req.user.role === 'INSTRUCTOR' && course.instructorId === userId);
    const courseForLearner = canManageCourse ? course : {
      ...course,
      accessKey: undefined,
      examQuestions: course.examQuestions.map(({ correctAnswer, ...question }) => question),
      lessons: course.lessons.map(lesson => ({
        ...lesson,
        questions: lesson.questions.map(({ correctAnswer, ...question }) => question)
      }))
    };

    if (!canManageCourse && req.user.role === 'STUDENT') {
      const attempts = await prisma.assessmentAttempt.groupBy({
        by: ['lessonId'],
        where: { userId, courseId, type: 'LESSON_QUIZ', consumedAt: { not: null } },
        _count: { _all: true }
      });
      const attemptsByLesson = new Map(attempts.map(item => [item.lessonId, item._count._all]));
      courseForLearner.lessons = courseForLearner.lessons.map(lesson => ({
        ...lesson,
        quizAttemptsUsed: attemptsByLesson.get(lesson.id) || 0
      }));
    }

    res.status(200).json({ ...courseForLearner, enrollment: isEnrolled });
    
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
    const { title, description, accessKey, imageUrl, passingScore, categoryId, level, timeLimitDays } = req.body;

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
        passingScore: passingScore ? parseInt(passingScore) : 10, // Mise à jour du score
        categoryId: categoryId ? parseInt(categoryId) : null,      // Mise à jour de la branche
        level: level || 'Débutant', // Mise à jour du niveau
        timeLimitDays: timeLimitDays ? parseInt(timeLimitDays) : null // Mise à jour de la limite de temps
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
    await prisma.assessmentAttempt.deleteMany({ where: { courseId } });
    
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
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });
    if (!course) return res.status(404).json({ message: 'Formation introuvable.' });
    if (req.user.role !== 'ADMIN' && course.instructorId !== req.user.userId) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        course: { select: { title: true, timeLimitDays: true } },
        user: { 
          select: { 
            id: true, name: true, email: true, avatarUrl: true,
            sector: true,
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
    res.status(200).json(enrollments.map(enrollment => ({
      ...enrollment,
      courseTitle: enrollment.course.title,
      timeLimitDays: enrollment.course.timeLimitDays
    })));
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- SOUMETTRE LES NOTES ET VALIDER LA FORMATION (SUR 20) ---
exports.submitGrades = async (req, res) => {
  try {
    const courseId = Number.parseInt(req.params.courseId, 10);
    const userId = req.user.userId;
    const claims = verifyAssessmentToken(req.body?.attemptToken, 'FINAL_EXAM', userId, courseId);
    if (!claims) return res.status(400).json({ message: 'Cette tentative d’examen est invalide ou expirée.' });

    const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: claims.attemptId } });
    if (!attempt || attempt.type !== 'FINAL_EXAM' || attempt.userId !== userId || attempt.courseId !== courseId || attempt.consumedAt || attempt.expiresAt <= new Date()) {
      return res.status(409).json({ message: 'Cette tentative d’examen a expiré ou a déjà été utilisée.' });
    }

    const [enrollment, lessonCount, progresses, questions] = await Promise.all([
      prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } }),
      prisma.lesson.count({ where: { courseId } }),
      prisma.lessonProgress.findMany({ where: { userId, lesson: { courseId } }, select: { score: true } }),
      prisma.question.findMany({ where: { id: { in: attempt.questionIds }, courseId } })
    ]);
    if (!enrollment) return res.status(404).json({ message: 'Inscription introuvable.' });
    if (enrollment.status !== 'IN_PROGRESS') {
      return res.status(400).json({ message: 'Cette formation a déjà été évaluée.' });
    }
    if (progresses.length < lessonCount) return res.status(400).json({ message: 'Terminez tous les chapitres avant de soumettre l’examen.' });
    if (!questions.length || questions.length !== attempt.questionIds.length || !validateAnswers(req.body?.answers, questions)) {
      return res.status(400).json({ message: 'Les réponses envoyées ne correspondent pas à cette tentative.' });
    }

    const quizScore = progresses.length
      ? Number((progresses.reduce((total, progress) => total + (progress.score ?? 0), 0) / progresses.length).toFixed(2))
      : 0;
    const examScore = calculateScore(req.body.answers, questions);

    let finalGrade = 0;
    if (enrollment.fieldGrade !== null) {
      // S'il y a une note de terrain : Quiz(20%) + Exam(50%) + Terrain(30%)
      finalGrade = parseFloat(((quizScore * 0.2) + (examScore * 0.5) + (enrollment.fieldGrade * 0.3)).toFixed(2));
    } else {
      // Sinon, on garde l'ancien système : Quiz(30%) + Exam(70%)
      finalGrade = parseFloat(((quizScore * 0.3) + (examScore * 0.7)).toFixed(2));
    }

    const isValidated = finalGrade >= 10; // Moyenne sur 20

    await prisma.$transaction(async transaction => {
      const consumed = await transaction.assessmentAttempt.updateMany({
        where: { id: attempt.id, consumedAt: null, expiresAt: { gt: new Date() } },
        data: { consumedAt: new Date() }
      });
      if (consumed.count !== 1) throw new Error('ASSESSMENT_ATTEMPT_ALREADY_USED');
      const updated = await transaction.enrollment.updateMany({
        where: { userId, courseId, status: 'IN_PROGRESS' },
        data: {
          quizScore,
          examScore,
          finalGrade,
          isValidated,
          status: isValidated ? 'VALIDATED' : 'FAILED',
          completedAt: new Date()
        }
      });
      if (updated.count !== 1) throw new Error('ENROLLMENT_ALREADY_EVALUATED');
    }, { isolationLevel: 'Serializable' });

    return res.status(200).json({
      message: isValidated ? "Validé !" : "Échec.",
      results: { quizScore, examScore, finalGrade, isValidated }
    });

  } catch (error) {
    if (error.message === 'ASSESSMENT_ATTEMPT_ALREADY_USED' || error.message === 'ENROLLMENT_ALREADY_EVALUATED') {
      return res.status(409).json({ message: 'Cette tentative d’examen a déjà été utilisée.' });
    }
    res.status(500).json({ message: "Erreur de notation.", error: error.message });
  }
};

// --- RÉINITIALISER UN ÉTUDIANT (Correction du Bug) ---
exports.resetStudent = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const studentId = parseInt(req.params.studentId);

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: studentId, courseId } },
      select: { course: { select: { instructorId: true } } }
    });
    if (!enrollment) return res.status(404).json({ message: 'Inscription introuvable.' });
    if (req.user.role !== 'ADMIN' && enrollment.course.instructorId !== req.user.userId) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    await prisma.assessmentAttempt.deleteMany({ where: { userId: studentId, courseId } });

    // 1. Remettre l'inscription à zéro
    await prisma.enrollment.update({
      where: { userId_courseId: { userId: studentId, courseId } },
      data: { status: 'IN_PROGRESS', createdAt: new Date(), quizScore: null, examScore: null, finalGrade: null, isValidated: false, completedAt: null, learningTimeSeconds: 0, reminderSentAt: null }
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
    const { questionText, options, correctAnswer, difficulty = 'MOYEN' } = req.body;
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { instructorId: true } });
    if (!course || (req.user.role !== 'ADMIN' && course.instructorId !== req.user.userId)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    if (!['FACILE', 'MOYEN', 'DIFFICILE'].includes(difficulty)) {
      return res.status(400).json({ message: 'Niveau de difficulté invalide.' });
    }
    if (!questionText?.trim() || !Array.isArray(options) || options.length < 2 || options.some(option => typeof option !== 'string' || !option.trim()) || !Number.isInteger(Number(correctAnswer)) || Number(correctAnswer) < 0 || Number(correctAnswer) >= options.length) {
      return res.status(400).json({ message: 'Question, options et réponse correcte invalides.' });
    }

    const newQuestion = await prisma.question.create({
      data: {
        questionText,
        options,
        correctAnswer: parseInt(correctAnswer),
        difficulty,
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
    if (!course || (req.user.role !== 'ADMIN' && course.instructorId !== req.user.userId)) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    const question = await prisma.question.findFirst({ where: { id: questionId, courseId } });
    if (!question) return res.status(404).json({ message: 'Question introuvable.' });
    await prisma.question.delete({ where: { id: questionId } });

    res.status(200).json({ message: "Question supprimée avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression.", error: error.message });
  }
};

exports.sendDeadlineReminder = async (req, res) => {
  try {
    const courseId = Number.parseInt(req.params.courseId, 10);
    const studentId = Number.parseInt(req.params.studentId, 10);
    if (!Number.isInteger(courseId) || !Number.isInteger(studentId)) {
      return res.status(400).json({ message: 'Identifiants invalides.' });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: studentId, courseId } },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { id: true, title: true, timeLimitDays: true, instructorId: true } }
      }
    });
    if (!enrollment) return res.status(404).json({ message: 'Inscription introuvable.' });
    if (req.user.role !== 'ADMIN' && enrollment.course.instructorId !== req.user.userId) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    if (enrollment.status !== 'IN_PROGRESS') {
      return res.status(400).json({ message: 'Seules les formations en cours peuvent être relancées.' });
    }
    if (!enrollment.course.timeLimitDays) {
      return res.status(400).json({ message: 'Aucun délai n’est défini pour cette formation.' });
    }

    const deadline = new Date(enrollment.createdAt.getTime() + enrollment.course.timeLimitDays * 86400000);
    await emailService.sendReminderEmail(
      enrollment.user.email,
      enrollment.user.name,
      enrollment.course.title,
      deadline,
      courseId,
      deadline <= new Date()
    );
    return res.status(200).json({ message: `Email de relance envoyé à ${enrollment.user.email}.` });
  } catch (error) {
    console.error('Erreur lors de la relance de la formation :', error);
    return res.status(500).json({ message: 'Impossible d’envoyer la relance.' });
  }
};

// Tirage et correction des quiz de chapitre effectués côté serveur.
exports.startLessonQuiz = async (req, res) => {
  try {
    const courseId = Number.parseInt(req.params.courseId, 10);
    const lessonId = Number.parseInt(req.params.lessonId, 10);
    const userId = req.user.userId;
    const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, courseId } });
    if (!lesson) return res.status(404).json({ message: 'Chapitre introuvable.' });

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true }
    });
    if (!enrollment || enrollment.status !== 'IN_PROGRESS') {
      return res.status(403).json({ message: 'Cette formation ne peut pas être évaluée avec ce compte.' });
    }

    const existingProgress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: { score: true }
    });
    if (existingProgress?.score >= 10) {
      return res.status(409).json({ message: 'Ce chapitre est déjà validé.' });
    }
    const attemptsUsed = await prisma.assessmentAttempt.count({
      where: { userId, lessonId, type: 'LESSON_QUIZ', consumedAt: { not: null } }
    });
    if (attemptsUsed >= 2) return res.status(409).json({ message: 'Les deux tentatives de ce quiz ont été utilisées.' });

    const bank = await prisma.question.findMany({ where: { lessonId }, select: { id: true, questionText: true, options: true, difficulty: true, correctAnswer: true } });
    const selection = selectQuestions(bank, {
      FACILE: lesson.quizEasyQuestionCount,
      MOYEN: lesson.quizMediumQuestionCount,
      DIFFICILE: lesson.quizHardQuestionCount
    }, lesson.quizQuestionCount);
    if (selection.error) return res.status(400).json({ message: selection.error });
    if (!selection.questions.length) return res.status(400).json({ message: 'Aucune question n’est configurée pour ce chapitre.' });

    const attemptToken = await createAssessmentToken({
      type: 'LESSON_QUIZ', userId, courseId, lessonId,
      questionIds: selection.questions.map(question => question.id)
    }, res);
    if (!attemptToken) return;

    return res.json({
      attemptToken,
      attemptNumber: attemptsUsed + 1,
      questions: selection.questions.map(({ id, questionText, options, difficulty }) => ({ id, questionText, options, difficulty }))
    });
  } catch (error) {
    console.error('Erreur au démarrage du quiz :', error);
    return res.status(500).json({ message: 'Impossible de préparer le quiz.' });
  }
};

exports.submitLessonQuiz = async (req, res) => {
  try {
    const courseId = Number.parseInt(req.params.courseId, 10);
    const lessonId = Number.parseInt(req.params.lessonId, 10);
    const userId = req.user.userId;
    const claims = verifyAssessmentToken(req.body?.attemptToken, 'LESSON_QUIZ', userId, courseId);
    if (!claims || claims.lessonId !== lessonId) return res.status(400).json({ message: 'Cette tentative de quiz est invalide ou expirée.' });

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true }
    });
    if (!enrollment || enrollment.status !== 'IN_PROGRESS') return res.status(403).json({ message: 'Cette formation ne peut plus être évaluée.' });

    const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: claims.attemptId } });
    if (!attempt || attempt.type !== 'LESSON_QUIZ' || attempt.userId !== userId || attempt.courseId !== courseId || attempt.lessonId !== lessonId || attempt.consumedAt || attempt.expiresAt <= new Date()) {
      return res.status(409).json({ message: 'Cette tentative de quiz a expiré ou a déjà été utilisée.' });
    }
    const questions = await prisma.question.findMany({ where: { id: { in: attempt.questionIds }, lessonId } });
    if (questions.length !== attempt.questionIds.length || !validateAnswers(req.body?.answers, questions)) {
      return res.status(400).json({ message: 'Les réponses envoyées ne correspondent pas à cette tentative.' });
    }

    const score = calculateScore(req.body.answers, questions);
    let chapterCompleted = false;
    let attemptsUsed = 0;
    await prisma.$transaction(async transaction => {
      const consumed = await transaction.assessmentAttempt.updateMany({
        where: { id: attempt.id, consumedAt: null, expiresAt: { gt: new Date() } },
        data: { consumedAt: new Date() }
      });
      if (consumed.count !== 1) throw new Error('ASSESSMENT_ATTEMPT_ALREADY_USED');
      attemptsUsed = await transaction.assessmentAttempt.count({
        where: { userId, lessonId, type: 'LESSON_QUIZ', consumedAt: { not: null } }
      });
      if (attemptsUsed > 2) throw new Error('ASSESSMENT_ATTEMPT_LIMIT_REACHED');
      const savedProgress = await transaction.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
        select: { score: true }
      });
      if (savedProgress?.score >= 10) throw new Error('CHAPTER_ALREADY_PASSED');
      chapterCompleted = score >= 10 || attemptsUsed >= 2;
      if (chapterCompleted) {
        await transaction.lessonProgress.upsert({
          where: { userId_lessonId: { userId, lessonId } },
          create: { userId, lessonId, score },
          update: { score }
        });
      }
    }, { isolationLevel: 'Serializable' });
    return res.json({ completed: chapterCompleted, score, attemptsUsed });
  } catch (error) {
    if (error.message === 'ASSESSMENT_ATTEMPT_ALREADY_USED') return res.status(409).json({ message: 'Cette tentative a déjà été utilisée.' });
    if (error.message === 'ASSESSMENT_ATTEMPT_LIMIT_REACHED') return res.status(409).json({ message: 'Les deux tentatives de ce quiz ont été utilisées.' });
    if (error.message === 'CHAPTER_ALREADY_PASSED') return res.status(409).json({ message: 'Ce chapitre est déjà validé.' });
    console.error('Erreur de correction du quiz :', error);
    return res.status(500).json({ message: 'Impossible de corriger le quiz.' });
  }
};

exports.startFinalExam = async (req, res) => {
  try {
    const courseId = Number.parseInt(req.params.courseId, 10);
    const userId = req.user.userId;
    const [course, enrollment, lessonCount, completedLessons] = await Promise.all([
      prisma.course.findUnique({ where: { id: courseId }, select: { examEasyQuestionCount: true, examMediumQuestionCount: true, examHardQuestionCount: true } }),
      prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } }, select: { status: true } }),
      prisma.lesson.count({ where: { courseId } }),
      prisma.lessonProgress.count({ where: { userId, lesson: { courseId } } })
    ]);
    if (!course) return res.status(404).json({ message: 'Formation introuvable.' });
    if (!enrollment || enrollment.status !== 'IN_PROGRESS') return res.status(403).json({ message: 'Cette formation ne peut pas être évaluée avec ce compte.' });
    if (completedLessons < lessonCount) return res.status(400).json({ message: 'Terminez tous les chapitres avant de passer l’examen.' });

    const bank = await prisma.question.findMany({ where: { courseId }, select: { id: true, questionText: true, options: true, difficulty: true, correctAnswer: true } });
    const selection = selectQuestions(bank, {
      FACILE: course.examEasyQuestionCount,
      MOYEN: course.examMediumQuestionCount,
      DIFFICILE: course.examHardQuestionCount
    });
    if (selection.error) return res.status(400).json({ message: selection.error });
    if (!selection.questions.length) return res.status(400).json({ message: 'Aucune question n’est configurée pour cet examen.' });

    const attemptToken = await createAssessmentToken({
      type: 'FINAL_EXAM', userId, courseId,
      questionIds: selection.questions.map(question => question.id)
    }, res);
    if (!attemptToken) return;
    return res.json({
      attemptToken,
      questions: selection.questions.map(({ id, questionText, options, difficulty }) => ({ id, questionText, options, difficulty }))
    });
  } catch (error) {
    console.error('Erreur au démarrage de l’examen :', error);
    return res.status(500).json({ message: 'Impossible de préparer l’examen.' });
  }
};

exports.updateExamQuestionCounts = async (req, res) => {
  try {
    const courseId = Number.parseInt(req.params.courseId, 10);
    const counts = ['examEasyQuestionCount', 'examMediumQuestionCount', 'examHardQuestionCount'];
    const data = {};
    for (const field of counts) {
      const value = Number.parseInt(req.body[field], 10);
      if (!Number.isInteger(value) || value < 0) {
        return res.status(400).json({ message: 'Chaque nombre de questions doit être un entier positif ou nul.' });
      }
      data[field] = value;
    }

    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { instructorId: true } });
    if (!course || (req.user.role !== 'ADMIN' && course.instructorId !== req.user.userId)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const updated = await prisma.course.update({ where: { id: courseId }, data, select: {
      examEasyQuestionCount: true, examMediumQuestionCount: true, examHardQuestionCount: true
    } });
    return res.status(200).json({ message: 'Répartition de l’examen enregistrée.', counts: updated });
  } catch (error) {
    console.error('Erreur de configuration de l’examen :', error);
    return res.status(500).json({ message: 'Impossible d’enregistrer la répartition de l’examen.' });
  }
};

// --- FORCER LA VALIDATION OU L'ÉCHEC MANUELLEMENT ---
exports.overrideStudentStatus = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const studentId = parseInt(req.params.studentId);
    const { status } = req.body; // 'VALIDATED' ou 'FAILED'

    if (!['VALIDATED', 'FAILED'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: studentId, courseId } },
      select: { course: { select: { instructorId: true } } }
    });
    if (!enrollment) return res.status(404).json({ message: 'Inscription introuvable.' });
    if (req.user.role !== 'ADMIN' && enrollment.course.instructorId !== req.user.userId) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    await prisma.enrollment.update({
      where: { userId_courseId: { userId: studentId, courseId } },
      data: { 
        status: status,
        isValidated: status === 'VALIDATED',
        completedAt: new Date()
      }
    });
    res.status(200).json({ message: "Le statut de l'étudiant a été forcé manuellement." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la modification du statut.", error: error.message });
  }
};

// --- METTRE À JOUR LA NOTE DE TERRAIN (Recalcule la moyenne automatiquement) ---
exports.updateFieldGrade = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const studentId = parseInt(req.params.studentId);
    const fieldGrade = parseFloat(req.body.fieldGrade);

    if (!Number.isFinite(fieldGrade) || fieldGrade < 0 || fieldGrade > 20) {
      return res.status(400).json({ message: 'La note doit être comprise entre 0 et 20.' });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: studentId, courseId } },
      include: { course: { select: { instructorId: true } } }
    });
    if (!enrollment) return res.status(404).json({ message: 'Inscription introuvable.' });
    if (req.user.role !== 'ADMIN' && enrollment.course.instructorId !== req.user.userId) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    
    let finalGrade = enrollment.finalGrade;
    let isValidated = enrollment.isValidated;

    // Si l'étudiant a DÉJÀ passé l'examen, on RECALCULE sa note finale !
    if (enrollment.quizScore !== null && enrollment.examScore !== null) {
      finalGrade = parseFloat(((enrollment.quizScore * 0.2) + (enrollment.examScore * 0.5) + (fieldGrade * 0.3)).toFixed(2));
      isValidated = finalGrade >= 10;
    }
    

    await prisma.enrollment.update({
      where: { userId_courseId: { userId: studentId, courseId } },
      data: { fieldGrade, finalGrade, isValidated, status: isValidated ? 'VALIDATED' : enrollment.status }
    });
    
    res.status(200).json({ message: "Note de terrain enregistrée !" });
  } catch (error) {
    res.status(500).json({ message: "Erreur.", error: error.message });
  }
};

// --- RÉCUPÉRER TOUS LES ÉTUDIANTS (VUE GLOBALE RH) ---
exports.getAllInstructorStudents = async (req, res) => {
  try {
    const instructorId = req.user.userId;

    const enrollments = await prisma.enrollment.findMany({
      where: { 
        course: { instructorId: instructorId } 
      },
      include: {
        // NOUVEAU : On récupère le SECTEUR du technicien
        user: { select: { id: true, name: true, email: true, avatarUrl: true, sector: true } },
        // NOUVEAU : On récupère le TEMPS LIMITE du cours
        course: { select: { title: true, timeLimitDays: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedEnrollments = enrollments.map(e => ({
      ...e,
      courseTitle: e.course.title,
      timeLimitDays: e.course.timeLimitDays
    }));

    res.status(200).json(formattedEnrollments);
  } catch (error) {
    res.status(500).json({ message: "Erreur.", error: error.message });
  }
};
