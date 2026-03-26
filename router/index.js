import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/accueil', name: 'Accueil', component: () => import('../views/Accueil.vue') },
  { path: '/information', name: 'Information', component: () => import('../views/Information.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
