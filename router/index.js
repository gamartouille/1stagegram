import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import { supabase } from '../supabase.js'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/accueil', name: 'Accueil', component: () => import('../views/Accueil.vue'), meta: { requiresAuth: true } },
  { path: '/accueil-observateur', name: 'AccueilObservateur', component: () => import('../views/AccueilObservateur.vue'), meta: { requiresAuth: true } },
  { path: '/information', name: 'Information', component: () => import('../views/Information.vue'), meta: { requiresAuth: true } },
  { path: '/carte', name: 'Carte', component: () => import('../views/Carte.vue'), meta: { requiresAuth: true } },
  { path: '/post', name: 'Post', component: () => import('../views/Post.vue'), meta: { requiresAuth: true } },
  { path: '/monprofil', name: 'MonProfil', component: () => import('../views/MonProfil.vue'), meta: { requiresAuth: true } },
  { path: '/amis', name: 'Amis', component: () => import('../views/Amis.vue'), meta: { requiresAuth: true } },
  { path: '/profil-public/:id', name: 'ProfilPublic', component: () => import('../views/ProfilPublic.vue'), meta: { requiresAuth: true } },
  { path: '/profil-observateur/:id', name: 'ProfilObservateur', component: () => import('../views/ProfilObservateur.vue'), meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Garde de navigation pour vérifier l'authentification
router.beforeEach(async (to, from, next) => {
  const playerId = localStorage.getItem('playerId')
  const { data: { session } } = await supabase.auth.getSession()
  
  const isAuthenticated = playerId !== null && session !== null
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Rediriger vers la page d'accueil (login) si non authentifié
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
