import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { supabase } from './supabase.js'

// Flag pour tracker si l'app a démarré
let appInitialized = false

// Écouter les changements d'état d'authentification
supabase.auth.onAuthStateChange((event, session) => {
  // Seulement déconnecter si l'app a déjà démarré ET qu'on reçoit explicitement un SIGNED_OUT
  if (appInitialized && event === 'SIGNED_OUT') {
    localStorage.removeItem('playerId')
    // Rediriger vers la page d'accueil si on n'y est pas déjà
    if (router.currentRoute.value.name !== 'Home') {
      router.push({ name: 'Home' })
    }
  }
})

// Attendre que le router soit prêt avant de marquer l'app comme initialisée
router.isReady().then(() => {
  appInitialized = true
})

createApp(App).use(router).mount('#app')