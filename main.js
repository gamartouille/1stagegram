import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { supabase } from './supabase.js'

// Écouter les changements d'état d'authentification
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || !session) {
    // Supprimer les données locales si la session Supabase est perdue
    localStorage.removeItem('playerId')
    // Rediriger vers la page d'accueil si on n'y est pas déjà
    if (router.currentRoute.value.name !== 'Home') {
      router.push({ name: 'Home' })
    }
  }
})

createApp(App).use(router).mount('#app')