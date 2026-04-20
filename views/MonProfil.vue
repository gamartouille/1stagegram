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
      <router-link :to="{ name: 'Amis' }">
        <button class="add-friends-button">Ajouter des amis</button>
      </router-link>
    </div>

    <section class="profile-card info-card">
      <div class="info-header">
        <div>
          <h2 style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">{{ titre }}</h2>
          <p class="info-subtitle">Je fais mon stage a : <strong style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">{{ ville || 'Non précisée' }}</strong></p>
        </div>
        <button class="edit-button" @click="goToEditInfo">Editer</button>
      </div>
      <p>Je travaille pour : <strong style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">{{ institut || 'Non précisé' }}</strong></p>
      <p>Mon sujet est : <strong style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">{{ sujet || 'Non précisé' }}</strong></p>
      <p style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">{{ bio}}</p>
    </section>

    <div class="profile-grid">
      <section class="profile-card friends-card">
        <h2>Mes amis</h2>
        <div v-if="friends.length" class="friends-list">
          <div
            class="friend-chip"
            v-for="friend in friends"
            :key="friend.id"
            @click="friend.observateur ? goToFriendProfileObservateur(friend.id) : goToFriendProfile(friend.id)"
          >
            <span class="friend-name">{{ friend.pseudo }}</span>
            <span class="friend-meta" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              {{ friend.titre || 'Aucun titre' }}
            </span>
          </div>
        </div>
        <p v-else>Tu n'as pas encore d'amis dans ta liste.</p>
      </section>

      <section class="profile-card countdown-card">
        <h2>Temps restant</h2>
        <div v-if="daysRemaining !== null">
          <div class="stage-dates">
            <span class="date-arrivee">Arrivee : {{ formatDate(stageStartDate) }}</span>
            <span class="date-retour">Retour : {{ formatDate(stageEndDate) }}</span>
          </div>
          <div class="countdown">{{ daysRemaining >= 0 ? daysRemaining : 0 }}</div>
          <p>{{ daysRemaining >= 0 ? 'jours restants avant la fin du stage' : 'Stage termine' }}</p>
        </div>
        <p v-else>Ajoute les dates de ton stage pour voir le decompte.</p>
      </section>
    </div>

    <!-- Demandes d'amis en attente -->
    <section class="profile-card" v-if="pendingRequests.length">
      <h2>Demandes d'amis en attente</h2>
      <div v-for="req in pendingRequests" :key="req.id" class="friend-request">
        <span>{{ req.senderPseudo }}</span>
        <button @click="acceptFriend(req.id)">Accepter</button>
        <button @click="declineFriend(req.id)">Refuser</button>
      </div>
    </section>

    <section class="profile-card posts-card">
      <div class="section-title">
        <h2>Historique de mes posts</h2>
        <span class="posts-count">{{ posts.length }} post{{ posts.length > 1 ? 's' : '' }}</span>
      </div>

      <div v-if="posts.length" class="history-list">
        <article class="history-item" v-for="post in posts" :key="post.id">
          <div class="history-item-head">
            <span class="history-date">Post #{{ post.id }}</span>
            <span class="history-meta">{{ formatDate(post.created_at || post.date) }}</span>
            <div class="post-actions">
              <button class="edit-post-btn" @click="editPost(post)">Modifier</button>
              <button class="delete-post-btn" @click="deletePost(post.id)">Supprimer</button>
            </div>
          </div>
          <p class="history-description" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            {{ post.description || 'Aucune description' }}
          </p>
          <div v-if="post.photos.length" class="history-photos">
            <img v-for="(photo, index) in post.photos" :key="index" :src="photo" alt="Photo du post" />
          </div>
        </article>
      </div>

      <p v-else>Tu n'as pas encore publie de post.</p>
    </section>

    <!-- Modal d'édition de post -->
    <div v-if="editingPost" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <h3>Modifier le post</h3>
        <label>Description :</label>
        <textarea v-model="editDescription" placeholder="Description du post"></textarea>
        <label>Photos (URLs separees par des virgules) :</label>
        <textarea v-model="editPhotos" placeholder="URLs des photos"></textarea>
        <button @click="savePostEdit">Enregistrer</button>
        <button @click="closeEditModal">Annuler</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase.js'

const router = useRouter()
const userPseudo = ref('')
const ville = ref('')
const institut = ref('')
const sujet = ref('')
const titre = ref('')
const bio = ref('')
const friends = ref([])
const posts = ref([])
const stageStartDate = ref(null)
const stageEndDate = ref(null)
const pendingRequests = ref([])
const editingPost = ref(null)
const editDescription = ref('')
const editPhotos = ref('')

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
    return photos.split(',').map(i => i.trim()).filter(Boolean)
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

  // Profil
  const { data: session } = await supabase
    .from('sessions')
    .select('pseudo, date_debut, date_retour, ville, institut, sujet, titre, bio')
    .eq('id', playerId)
    .single()

  if (session) {
    userPseudo.value = session.pseudo
    stageStartDate.value = session.date_debut
    stageEndDate.value = session.date_retour
    ville.value = session.ville || ''
    institut.value = session.institut || ''
    sujet.value = session.sujet || ''
    titre.value = session.titre || ''
    bio.value = session.bio || ''
  }

  // Amis acceptés (dans les deux sens)
  const { data: amis1 } = await supabase
    .from('amis')
    .select('ami_id')
    .eq('user_id', playerId)
    .eq('statut', 'accepté')

  const { data: amis2 } = await supabase
    .from('amis')
    .select('user_id')
    .eq('ami_id', playerId)
    .eq('statut', 'accepté')

  const friendIds = [
    ...(amis1 || []).map(a => a.ami_id),
    ...(amis2 || []).map(a => a.user_id)
  ]

  if (friendIds.length > 0) {
    const { data: friendData } = await supabase
      .from('sessions')
      .select('id, pseudo, titre, observateur')
      .in('id', friendIds)
    friends.value = friendData || []
  } else {
    friends.value = []
  }

  // Demandes en attente reçues par moi
  const { data: pending, error: pendingError } = await supabase
    .from('amis')
    .select('id, user_id')
    .eq('ami_id', playerId)
    .eq('statut', 'en_attente')

  console.log('Demandes en attente brutes :', pending, pendingError)

  if (pending && pending.length > 0) {
    const senderIds = pending.map(p => p.user_id)
    const { data: senders } = await supabase
      .from('sessions')
      .select('id, pseudo')
      .in('id', senderIds)

    pendingRequests.value = pending.map(req => ({
      // int8 Supabase retourne un string en JS → on force en Number pour le filtre .eq()
      id: Number(req.id),
      senderId: req.user_id,
      senderPseudo: senders?.find(s => s.id === req.user_id)?.pseudo || 'Inconnu'
    }))
  } else {
    pendingRequests.value = []
  }

  console.log('pendingRequests construits :', pendingRequests.value)

  // Posts de l'utilisateur
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('session_id', playerId)
    .order('id', { ascending: false })

  if (!postError && postData) {
    posts.value = postData.map(post => ({
      ...post,
      photos: normalizePhotos(post.photos)
    }))
  } else {
    console.error('Erreur posts :', postError)
  }
}

function goToFriendProfileObservateur(friendId) {
  router.push({ name: 'ProfilObservateur', params: { id: friendId } });
}

function goToFriendProfile(friendId) {
  router.push({ name: 'ProfilPublic', params: { id: friendId } });
}

function goToEditInfo() {
  router.push({ name: 'Information', query: { from: 'edit' } })
}

async function acceptFriend(amiRelationId) {
  console.log('Accepter - id :', amiRelationId, '| type :', typeof amiRelationId)

  const { data, error } = await supabase
    .from('amis')
    .update({ statut: 'accepté' })
    .eq('id', Number(amiRelationId))

  console.log('Update résultat :', data, '| erreur :', error)

  if (error) {
    console.error("Erreur lors de l'acceptation :", error)
    alert("Erreur : " + error.message)
  } else {
    await fetchProfileData()
  }
}

async function declineFriend(amiRelationId) {
  console.log('Refuser - id :', amiRelationId, '| type :', typeof amiRelationId)

  const { data, error } = await supabase
    .from('amis')
    .delete()
    .eq('id', Number(amiRelationId))

  console.log('Delete résultat :', data, '| erreur :', error)

  if (error) {
    console.error('Erreur lors du refus :', error)
    alert("Erreur : " + error.message)
  } else {
    await fetchProfileData()
  }
}

function editPost(post) {
  editingPost.value = post
  editDescription.value = post.description || ''
  editPhotos.value = Array.isArray(post.photos) ? post.photos.join(', ') : post.photos || ''
}

function closeEditModal() {
  editingPost.value = null
  editDescription.value = ''
  editPhotos.value = ''
}

async function savePostEdit() {
  if (!editingPost.value) return

  const photosArray = editPhotos.value.split(',').map(p => p.trim()).filter(p => p)

  const { error } = await supabase
    .from('posts')
    .update({
      description: editDescription.value,
      photos: photosArray.length > 0 ? photosArray.join(',') : null
    })
    .eq('id', editingPost.value.id)

  if (error) {
    console.error('Erreur lors de la modification du post :', error)
    alert('Erreur lors de la modification du post.')
  } else {
    alert('Post modifié avec succès !')
    closeEditModal()
    await fetchProfileData()
  }
}

async function deletePost(postId) {
  const confirmation = confirm('Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.')
  if (!confirmation) return

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (error) {
    console.error('Erreur lors de la suppression du post :', error)
    alert('Erreur lors de la suppression du post.')
  } else {
    alert('Post supprimé avec succès !')
    await fetchProfileData()
  }
}

onMounted(fetchProfileData)
</script>

<style src="./MonProfil.css" scoped></style>