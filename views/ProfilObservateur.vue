<template>
  <div class="profil-page">
    <div>
      <router-link :to="{ name: isOwnProfile && isObserver ? 'AccueilObservateur' : 'Accueil' }">
        <button>Accueil</button>
      </router-link>
    </div>

    <div class="profile-header">
      <h1>{{ isOwnProfile ? 'Mon profil' : `Profil de ${userPseudo || 'utilisateur'}` }}</h1>
      <p class="subtitle">{{ userPseudo || 'utilisateur' }}</p>
      <router-link v-if="isOwnProfile" :to="{ name: 'Amis' }">
        <button class="add-friends-button">Ajouter des amis</button>
      </router-link>
    </div>

    <section class="profile-card info-card">
      <h2>Liste d'amis</h2>
      <div v-if="friends.length" class="friends-list">
        <div
            class="friend-chip"
            v-for="friend in friends"
            :key="friend.id"
            @click="handleFriendClick(friend)"
          >
            <span class="friend-name">{{ friend.pseudo }}</span>
            <span class="friend-meta">{{ friend.titre || 'Aucun titre' }}</span>
          </div>
      </div>
      <p v-else>Pas encore d'amis</p>
    </section>

    <section class="profile-card" v-if="isOwnProfile">
      <h2>Demandes d'amis en attente</h2>
      <div v-if="pendingRequests.length">
        <div class="friend-request" v-for="request in pendingRequests" :key="request.id">
          <span>{{ request.senderPseudo }}</span>
          <button @click="acceptFriend(request.id)">✅ Accepter</button>
          <button @click="declineFriend(request.id)">❌ Refuser</button>
        </div>
      </div>
      <p v-else>Aucune demande en attente</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../supabase.js'

const route = useRoute()
const router = useRouter()
const userId = route.params.id
const currentUserId = localStorage.getItem('playerId')
const isOwnProfile = computed(() => userId === currentUserId)
const isObserver = ref(true)
const userPseudo = ref('')
const friends = ref([])
const pendingRequests = ref([])
const currentUserFriendIds = ref([])

async function fetchObservateurProfile() {
  if (!userId) return

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('pseudo, observateur')
    .eq('id', userId)
    .single()

  if (sessionError) {
    console.error('Erreur chargement du profil observateur :', sessionError)
    return
  }

  if (!session) {
    console.warn('Profil observateur introuvable')
    return
  }

  if (!session.observateur) {
    router.push({ name: 'ProfilPublic', params: { id: userId } })
    return
  }

  userPseudo.value = session.pseudo
  await fetchFriends()
  if (isOwnProfile.value) {
    await fetchPendingRequests()
  }
}

async function fetchFriends() {
  const { data: amis1 } = await supabase
    .from('amis')
    .select('ami_id')
    .eq('user_id', userId)
    .eq('statut', 'accepté')

  const { data: amis2 } = await supabase
    .from('amis')
    .select('user_id')
    .eq('ami_id', userId)
    .eq('statut', 'accepté')

  const friendIds = [
    ...(amis1 || []).map((rel) => rel.ami_id),
    ...(amis2 || []).map((rel) => rel.user_id)
  ]

  if (friendIds.length === 0) {
    friends.value = []
    return
  }

  const { data: friendData, error: friendError } = await supabase
    .from('sessions')
    .select('id, pseudo, titre, observateur')
    .in('id', friendIds)

  if (friendError) {
    console.error('Erreur chargement amis :', friendError)
    friends.value = []
    return
  }

  friends.value = friendData || []
}

async function fetchCurrentUserFriends() {
  if (!currentUserId) return

  const { data: amis1 } = await supabase
    .from('amis')
    .select('ami_id')
    .eq('user_id', currentUserId)
    .eq('statut', 'accepté')

  const { data: amis2 } = await supabase
    .from('amis')
    .select('user_id')
    .eq('ami_id', currentUserId)
    .eq('statut', 'accepté')

  currentUserFriendIds.value = [
    ...(amis1 || []).map((rel) => String(rel.ami_id)),
    ...(amis2 || []).map((rel) => String(rel.user_id))
  ]
}

async function sendFriendRequest(amiId) {
  if (!currentUserId) {
    alert('Vous devez être connecté pour ajouter un ami.')
    return
  }

  const { data: existing1 } = await supabase
    .from('amis')
    .select('id')
    .eq('user_id', currentUserId)
    .eq('ami_id', amiId)

  const { data: existing2 } = await supabase
    .from('amis')
    .select('id')
    .eq('user_id', amiId)
    .eq('ami_id', currentUserId)

  if ((existing1 && existing1.length > 0) || (existing2 && existing2.length > 0)) {
    alert('Une relation existe déjà avec cet utilisateur.')
    return
  }

  const { error } = await supabase
    .from('amis')
    .insert({
      user_id: currentUserId,
      ami_id: amiId,
      statut: 'en_attente',
      date_creation: new Date().toISOString()
    })

  if (error) {
    console.error("Erreur lors de l'envoi de la demande d’ami :", error)
    alert('Impossible d’envoyer la demande pour le moment.');
    return;
  }

  alert('Demande d’ami envoyée !');
}

async function handleFriendClick(friend) {
  if (isOwnProfile.value) {
    return friend.observateur ? goToFriendProfileObservateur(friend.id) : goToFriendProfile(friend.id)
  }

  if (!currentUserId) {
    alert('Vous devez être connecté pour ajouter un ami.')
    return
  }

  const isFriend = currentUserFriendIds.value.includes(String(friend.id))

  if (isFriend) {
    return friend.observateur ? goToFriendProfileObservateur(friend.id) : goToFriendProfile(friend.id)
  }

  const confirmation = confirm(`Tu n'es pas ami avec ${friend.pseudo}. Veux-tu lui envoyer une demande d'ami ?`)
  if (!confirmation) return

  await sendFriendRequest(friend.id)
}

async function fetchPendingRequests() {
  const { data: pending, error } = await supabase
    .from('amis')
    .select('id, user_id')
    .eq('ami_id', userId)
    .eq('statut', 'en_attente')

  if (error) {
    console.error('Erreur chargement demandes :', error)
    pendingRequests.value = []
    return
  }

  const senderIds = (pending || []).map((item) => item.user_id)
  if (senderIds.length === 0) {
    pendingRequests.value = []
    return
  }

  const { data: senders } = await supabase
    .from('sessions')
    .select('id, pseudo')
    .in('id', senderIds)

  pendingRequests.value = (pending || []).map((req) => ({
    id: Number(req.id),
    senderId: req.user_id,
    senderPseudo: senders?.find((s) => s.id === req.user_id)?.pseudo || 'Inconnu'
  }))
}

async function acceptFriend(requestId) {
  const { error } = await supabase
    .from('amis')
    .update({ statut: 'accepté' })
    .eq('id', requestId)

  if (error) {
    console.error('Erreur acceptation demande :', error)
    return
  }

  await fetchFriends()
  await fetchPendingRequests()
}

async function declineFriend(requestId) {
  const { error } = await supabase
    .from('amis')
    .delete()
    .eq('id', requestId)

  if (error) {
    console.error('Erreur refus demande :', error)
    return
  }

  await fetchPendingRequests()
}

function goToFriendProfileObservateur(friendId) {
  router.push({ name: 'ProfilObservateur', params: { id: friendId } });
}

function goToFriendProfile(friendId) {
  router.push({ name: 'ProfilPublic', params: { id: friendId } });
}

onMounted(async () => {
  await fetchCurrentUserFriends()
  await fetchObservateurProfile()
})
</script>

<style src="./MonProfil.css" scoped></style>
