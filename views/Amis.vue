<template>
  <div class="amis-page">
    <div>
      <router-link :to="{ name: isObserver ? 'AccueilObservateur' : 'Accueil' }">
        <button>Accueil</button>
      </router-link>
    </div>

    <div class="page-header">
      <h1>Ajouter des amis</h1>
      <p class="subtitle">Découvrez et ajoutez de nouveaux amis stagiaires</p>
    </div>

    <div class="search-section">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher par pseudo..."
        class="search-input"
      >
    </div>

    <div class="users-grid">
      <div
        v-for="user in filteredUsers"
        :key="user.id"
        class="user-card"
      >
        <div class="user-info">
          <div class="user-header">
            <h3>{{ user.pseudo }}</h3>
            <span v-if="user.observateur" class="observer-badge">Observateur</span>
          </div>
          <p class="user-bio">{{ user.bio || 'Aucune bio' }}</p>
          <div class="user-details">
            <span v-if="user.titre" class="user-title">{{ user.titre }}</span>
            <span v-if="user.ville" class="user-city">📍 {{ user.ville }}</span>
          </div>
        </div>

        <div class="user-actions">
          <button
            v-if="friendshipStatus[user.id] === 'accepted'"
            class="friend-button accepted"
            disabled
          >
            ✅ Ami
          </button>
          <button
            v-else-if="friendshipStatus[user.id] === 'pending'"
            class="friend-button pending"
            disabled
          >
            ⏳ En attente
          </button>
          <button
            v-else
            class="friend-button add"
            @click="addFriend(user.id)"
          >
            ➕ Ajouter
          </button>
        </div>
      </div>
    </div>

    <div v-if="filteredUsers.length === 0" class="no-results">
      <p>Aucun utilisateur trouvé</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase.js'

const router = useRouter()
const searchQuery = ref('')
const users = ref([])
const friendshipStatus = ref({})
const currentUserId = localStorage.getItem('playerId')
const isObserver = ref(false)

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return users.value
  return users.value.filter(user =>
    user.pseudo.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

async function fetchUsers() {
  if (!currentUserId) return

  // Récupérer le statut observateur de l'utilisateur courant
  const { data: currentUser } = await supabase
    .from('sessions')
    .select('observateur')
    .eq('id', currentUserId)
    .single()

  if (currentUser) {
    isObserver.value = currentUser.observateur === true
  }

  // Récupérer tous les utilisateurs sauf l'utilisateur courant
  const { data: allUsers, error } = await supabase
    .from('sessions')
    .select('id, pseudo, bio, titre, ville, observateur')
    .neq('id', currentUserId)

  if (error) {
    console.error('Erreur lors de la récupération des utilisateurs :', error)
    return
  }

  users.value = allUsers || []

  // Récupérer les statuts d'amitié pour tous les utilisateurs
  await fetchFriendshipStatuses()
}

async function fetchFriendshipStatuses() {
  if (!currentUserId || users.value.length === 0) return

  const userIds = users.value.map(user => user.id)

  // Récupérer les relations d'amitié sortantes
  const { data: outgoing } = await supabase
    .from('amis')
    .select('ami_id, statut')
    .eq('user_id', currentUserId)
    .in('ami_id', userIds)

  // Récupérer les relations d'amitié entrantes
  const { data: incoming } = await supabase
    .from('amis')
    .select('user_id, statut')
    .eq('ami_id', currentUserId)
    .in('user_id', userIds)

  // Initialiser tous les statuts à 'none'
  const statuses = {}
  userIds.forEach(id => statuses[id] = 'none')

  // Mettre à jour avec les relations sortantes
  if (outgoing) {
    outgoing.forEach(rel => {
      statuses[rel.ami_id] = rel.statut
    })
  }

  // Mettre à jour avec les relations entrantes
  if (incoming) {
    incoming.forEach(rel => {
      if (statuses[rel.user_id] === 'none') {
        statuses[rel.user_id] = rel.statut
      }
    })
  }

  friendshipStatus.value = statuses
}

async function addFriend(amiId) {
  if (!currentUserId) {
    alert('Vous devez être connecté pour ajouter un ami.')
    return
  }

  // Vérifier s'il n'y a pas déjà une relation
  if (friendshipStatus.value[amiId] !== 'none') {
    alert('Une demande existe déjà avec cet utilisateur.')
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
    console.error('Erreur lors de l\'ajout d\'ami :', error)
    alert('Erreur lors de l\'envoi de la demande d\'ami.')
    return
  }

  // Mettre à jour le statut localement
  friendshipStatus.value[amiId] = 'en_attente'
  alert('Demande d\'ami envoyée avec succès !')
}

onMounted(fetchUsers)
</script>

<style scoped>
.amis-page {
  min-height: 100vh;
  padding: 50px 20px;
  box-sizing: border-box;
  font-family: "myFont2", cursive;
  background-color: rgb(255, 153, 216);
  color: #333;
}

.page-header {
  max-width: 1200px;
  margin: 0 auto 40px;
  text-align: center;
  color: rgb(148, 193, 30);
}

.page-header h1 {
  font-size: 2.8rem;
  margin-bottom: 12px;
  font-weight: 600;
}

.page-header .subtitle {
  font-size: 1.3rem;
  color: #555;
}

.search-section {
  max-width: 600px;
  margin: 0 auto 40px;
}

.search-input {
  width: 100%;
  padding: 15px 20px;
  border: 2px solid rgb(148, 193, 30);
  border-radius: 25px;
  font-size: 1.1rem;
  font-family: "myFont2", cursive;
  background: white;
  color: #333;
  outline: none;
}

.search-input::placeholder {
  color: #999;
}

.search-input:focus {
  border-color: rgb(148, 193, 30);
  box-shadow: 0 0 10px rgba(148, 193, 30, 0.3);
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.user-card {
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid #ddd;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 200px;
}

.user-info {
  flex-grow: 1;
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-header h3 {
  margin: 0;
  color: rgb(148, 193, 30);
  font-size: 1.4rem;
}

.observer-badge {
  background: rgb(148, 193, 30);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.user-bio {
  color: #555;
  margin: 12px 0;
  line-height: 1.5;
  font-style: italic;
}

.user-details {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.user-title,
.user-city {
  font-size: 0.9rem;
  color: #777;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 8px;
}

.user-actions {
  margin-top: 20px;
  text-align: center;
}

.friend-button {
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-family: "myFont2", cursive;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
}

.friend-button.add {
  background: rgb(148, 193, 30);
  color: white;
}

.friend-button.add:hover {
  background: rgb(120, 160, 25);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.friend-button.accepted {
  background: #4CAF50;
  color: white;
  cursor: default;
}

.friend-button.pending {
  background: #FF9800;
  color: white;
  cursor: default;
}

.no-results {
  text-align: center;
  margin-top: 60px;
  color: #777;
  font-size: 1.2rem;
}

button {
  font-family: "myFont2", cursive;
  font-size: 1.1em;
  background-color: white;
  color: rgb(148, 193, 30);
  border: 1px solid rgb(148, 193, 30);
  border-radius: 10px;
  padding: 12px 24px;
  margin: 10px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

button:hover {
  background: #f0f7eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .users-grid {
    grid-template-columns: 1fr;
  }

  .user-card {
    min-height: auto;
  }
}
</style>