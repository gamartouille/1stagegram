<template>
  <div class="profil-page">
    <div>
    <router-link :to="{ name: isObserver ? 'AccueilObservateur' : 'Accueil' }">
      <button>Accueil</button>
    </router-link>
    </div>
    <div class="profile-header">
      <h1>{{ titre || 'non précisé' }}</h1>
      <p class="subtitle">{{ userPseudo || 'utilisateur' }}</p>
    </div>

    <section class="profile-card info-card">
      <div class="info-header">
        <div>
          <p class="info-subtitle">{{ isOwnProfile ? 'Je fais mon stage à :' : 'Fait son stage à :' }} <strong>{{ ville || 'non précisée' }}</strong></p>
        </div>
        <button v-if="isOwnProfile" class="edit-button" @click="goToEditInfo">Éditer</button>
      </div>
      <p>{{ isOwnProfile ? 'Je travaille pour :' : 'Travaille pour :' }} <strong>{{ institut || 'non précisé' }}</strong></p>
      <p>{{ isOwnProfile ? 'Mon sujet est :' : 'Son sujet est :' }} <strong>{{ sujet || 'non précisé' }}</strong></p>
      <p>{{ bio}}</p>    
    </section>

    <div class="profile-grid">
      <section class="profile-card friends-card">
        <h2>Ami avec...</h2>
        <div v-if="friends.length" class="friends-list">
          <div class="friend-chip" v-for="friend in friends" :key="friend.id">
            <span class="friend-name">{{ friend.pseudo }}</span>
            <span class="friend-meta">{{ friend.titre || 'Aucun titre' }}</span>
          </div>
        </div>
        <p v-else>Aucun ami</p>
      </section>

      <section class="profile-card countdown-card">
        <h2>Temps restant</h2>
        <div v-if="daysRemaining !== null">
          <div class="countdown">{{ daysRemaining >= 0 ? daysRemaining : 0 }}</div>
          <p>{{ daysRemaining >= 0 ? 'jours restants avant la fin de son stage' : 'Stage terminé' }}</p>
        </div>
        <p v-else>Iel n'a pas ajoute les dates de son stage</p>
      </section>
    </div>

    <section class="profile-card posts-card">
      <div class="section-title">
        <h2>¨Posts</h2>
        <span class="posts-count">{{ posts.length }} post{{ posts.length > 1 ? 's' : '' }}</span>
      </div>

      <div v-if="posts.length" class="history-list">
        <article class="history-item" v-for="post in posts" :key="post.id">
          <div class="history-item-head">
            <span class="history-date">Post #{{ post.id }}</span>
            <span class="history-meta">{{ formatDate(post.created_at || post.date_creation) }}</span>
          </div>
          <p class="history-description">{{ post.description || 'Aucune description' }}</p>
          <div v-if="post.photos.length" class="history-photos">
            <img v-for="(photo, index) in post.photos" :key="index" :src="photo" alt="Photo du post" />
          </div>
        </article>
      </div>

      <p v-else>Aucune publication</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../supabase.js'

const route = useRoute()
const router = useRouter()
const userPseudo = ref('')
const ville = ref('')
const institut = ref('')
const sujet = ref('')
const titre = ref('')
const bio = ref('')
const friends = ref([])
const posts = ref([])
const stageEndDate = ref(null)
const isObserver = ref(false)
const isOwnProfile = computed(() => route.params.id === localStorage.getItem('playerId'))

const daysRemaining = computed(() => {
  if (!stageEndDate.value) return null
  const today = new Date()
  const endDate = new Date(stageEndDate.value)
  const diffMs = new Date(endDate.setHours(0, 0, 0, 0)) - new Date(today.setHours(0, 0, 0, 0))
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
})

function normalizePhotos(photos) {
  if (!photos) return []
  if (Array.isArray(photos)) return photos
  if (typeof photos === 'string') {
    return photos
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

function formatDate(value) {
  if (!value) return 'Date inconnue'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date inconnue'
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

async function fetchProfileData() {
  const userId = route.params.id
  if (!userId) return

  // Charger le statut observateur de l'utilisateur courant
  const playerId = localStorage.getItem('playerId')
  if (playerId) {
    const { data: currentUser } = await supabase
      .from('sessions')
      .select('observateur')
      .eq('id', playerId)
      .single()
    
    if (currentUser) {
      isObserver.value = currentUser.observateur === true
    }
  }

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('pseudo, date_retour, date_debut, ville, institut, sujet, titre, bio')
    .eq('id', userId)
    .single()

  if (!sessionError && session) {
    userPseudo.value = session.pseudo
    stageEndDate.value = session.date_retour
    ville.value = session.ville || ''
    institut.value = session.institut || ''
    sujet.value = session.sujet || ''
    titre.value = session.titre || ''
    bio.value = session.bio || ''
  }

  const { data: friendData, error: friendError } = await supabase
    .from('sessions')
    .select('id, pseudo, titre')
    .neq('id', userId)
    .limit(8)

  if (!friendError && friendData) {
    friends.value = friendData
  }

  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('session_id', userId)
    .order('id', { ascending: false })

  if (!postError && postData) {
    posts.value = postData.map((post) => ({
      ...post,
      photos: normalizePhotos(post.photos)
    }))
  }
}

function goToEditInfo() {
  router.push({ name: 'Information', query: { from: 'edit' } })
}

onMounted(fetchProfileData)
</script>

<style src="./MonProfil.css" scoped></style>