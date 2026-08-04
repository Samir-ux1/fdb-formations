import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  // persist permet de sauvegarder automatiquement dans le localStorage !
  persist(
    (set) => ({
      // 1. Les variables (L'état initial)
      user: null,
      token: null,
      lastCourseId: null,

      // 2. Les actions (Les fonctions pour modifier les variables)
      login: (user, token) => set({ user: user, token: token }),
      
      logout: () => set({ user: null, token: null, lastCourseId: null }),
      
      setLastCourseId: (courseId) => set({ lastCourseId: courseId }),

      updateUser: (updatedUser) => set({ user: updatedUser })
    }),
    {
      name: 'fdb-auth-storage', // Le nom de la clé dans le navigateur
    }
  )
);