import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/accueil', name: 'Accueil', component: () => import('../views/Accueil.vue') },
  { path: '/accueil-observateur', name: 'AccueilObservateur', component: () => import('../views/AccueilObservateur.vue') },
  { path: '/information', name: 'Information', component: () => import('../views/Information.vue') },
  { path: '/carte', name: 'Carte', component: () => import('../views/Carte.vue') },
  { path: '/post', name: 'Post', component: () => import('../views/Post.vue') },
  { path: '/monprofil', name: 'MonProfil', component: () => import('../views/MonProfil.vue') },
  { path: '/amis', name: 'Amis', component: () => import('../views/Amis.vue') },
  { path: '/profil-public/:id', name: 'ProfilPublic', component: () => import('../views/ProfilPublic.vue') },
  { path: '/profil-observateur/:id', name: 'ProfilObservateur', component: () => import('../views/ProfilObservateur.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
