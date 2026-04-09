<template>
  <div class="profil-page">
    <div>
    <router-link :to="{ name: 'Accueil' }">
      <button>Accueil</button>
    </router-link>
    </div>
    <div class="profile-header">
      <h1>Mon profil</h1>
      <p class="subtitle">Bienvenue, {{ userPseudo || 'utilisateur' }}</p>
    </div>

    <div class="profile-grid">
      <section class="profile-card friends-card">
        <h2>Mes amis</h2>
        <div v-if="friends.length" class="friends-list">
          <div class="friend-chip" v-for="friend in friends" :key="friend.id">
            <span class="friend-name">{{ friend.pseudo }}</span>
            <span class="friend-meta">{{ friend.titre || 'Aucun titre' }}</span>
          </div>
        </div>
        <p v-else>Tu n'as pas encore d'amis dans ta liste.</p>
      </section>

      <section class="profile-card countdown-card">
        <h2>Temps restant</h2>
        <div v-if="daysRemaining !== null">
          <div class="countdown">{{ daysRemaining >= 0 ? daysRemaining : 0 }}</div>
          <p>{{ daysRemaining >= 0 ? 'jours restants avant la fin du stage' : 'Stage terminé' }}</p>
        </div>
        <p v-else>Ajoute les dates de ton stage pour voir le décompte.</p>
      </section>
    </div>

    <section class="profile-card posts-card">
      <div class="section-title">
        <h2>Historique de mes posts</h2>
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

      <p v-else>Tu n'as pas encore publie de post.</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase.js'

const userPseudo = ref('')
const friends = ref([])
const posts = ref([])
const stageEndDate = ref(null)

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
  const playerId = localStorage.getItem('playerId')
  if (!playerId) return

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('pseudo, date_retour, date_debut')
    .eq('id', playerId)
    .single()

  if (!sessionError && session) {
    userPseudo.value = session.pseudo
    stageEndDate.value = session.date_retour
  }

  const { data: friendData, error: friendError } = await supabase
    .from('sessions')
    .select('id, pseudo, titre')
    .neq('id', playerId)
    .limit(8)

  if (!friendError && friendData) {
    friends.value = friendData
  }

  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('session_id', playerId)
    .order('id', { ascending: false })

  if (!postError && postData) {
    posts.value = postData.map((post) => ({
      ...post,
      photos: normalizePhotos(post.photos)
    }))
  }
}

onMounted(fetchProfileData)
</script>

<style src="./MonProfil.css" scoped></style>