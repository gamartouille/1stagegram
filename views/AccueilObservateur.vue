<template>
  <div id="app-content">
    <h1>Accueil Observateur</h1>

    <router-link :to="{ name: 'Carte' }">
      <button>Carte des stages</button>
    </router-link>

    <!-- Barre de recherche de profils -->
    <div class="search-bar">
      <input
        v-model="searchPseudo"
        placeholder="Rechercher un pseudo..."
        @keyup.enter="searchUser"
      />
      <button @click="searchUser">🔍 Rechercher</button>
    </div>

    <div v-if="searchResults.length" class="search-results">
      <div v-for="user in searchResults" :key="user.id" class="user-result">
        <p>{{ user.pseudo }}</p>
        <router-link v-if="user.isAlreadyFriend" :to="{ name: 'ProfilPublic', params: { id: user.id } }">
          <button class="profile-btn">👤 Voir le profil</button>
        </router-link>
        <button v-else @click="addFriend(user.id)">Ajouter en ami</button>
      </div>
    </div>

    <div class="posts-container">
      <div v-for="post in posts" :key="post.id" class="post">
        <div class="post-header">
          <p class="post-author">Posté par : <strong>{{ post.pseudo || 'Inconnu' }}</strong></p>
          <p class="post-date">{{ formatDate(post.date) }}</p>
        </div>
        <div class="post-content">
          <div class="post-photos">
            <img
              v-for="(photo, index) in normalizePhotos(post.photos)"
              :key="index"
              :src="photo"
              alt="Photo du post"
              class="photo-img"
            />
          </div>
          <div class="post-text">
            <p class="post-description">{{ post.description }}</p>
            <router-link :to="{ name: 'ProfilPublic', params: { id: post.session_id } }">
              <button class="profile-btn">👤 Voir le profil</button>
            </router-link>
          </div>
        </div>
        <div class="post-comments" v-if="post.commentaires && post.commentaires.length">
          <p v-for="(comment, idx) in post.commentaires" :key="idx" class="comment">
            <strong>{{ comment.auteur || 'Inconnu' }}</strong> : {{ comment.contenu }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase.js'

export default {
  data() {
    return {
      posts: [],
      userPseudo: '',
      searchPseudo: '',
      searchResults: []
    }
  },
  async mounted() {
    await this.fetchPosts()
    await this.fetchUserPseudo()
  },
  methods: {
    async fetchPosts() {
      const playerId = localStorage.getItem('playerId')
      if (!playerId) return

      const { data: amis1, error: amisError1 } = await supabase
        .from('amis')
        .select('ami_id')
        .eq('user_id', playerId)
        .eq('statut', 'accepté')

      const { data: amis2, error: amisError2 } = await supabase
        .from('amis')
        .select('user_id')
        .eq('ami_id', playerId)
        .eq('statut', 'accepté')

      if (amisError1 || amisError2) {
        console.error('Erreur lors de la récupération des amis :', amisError1 || amisError2)
        return
      }

      const amisIds = [
        ...(amis1 || []).map(a => a.ami_id),
        ...(amis2 || []).map(a => a.user_id),
        playerId
      ]

      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('session_id', amisIds)
        .order('id', { ascending: false })

      if (postsError) {
        console.error('Erreur lors de la récupération des posts :', postsError)
        return
      }

      this.posts = await Promise.all((posts || []).map(async (post) => {
        const { data: comments } = await supabase
          .from('commentaires')
          .select('*')
          .eq('post_id', post.id)

        const { data: author } = await supabase
          .from('sessions')
          .select('pseudo')
          .eq('id', post.session_id)
          .single()

        return {
          ...post,
          pseudo: author?.pseudo || 'Inconnu',
          commentaires: comments || []
        }
      }))
    },

    async fetchUserPseudo() {
      const playerId = localStorage.getItem('playerId')
      if (!playerId) return

      const { data, error } = await supabase
        .from('sessions')
        .select('pseudo')
        .eq('id', playerId)
        .single()

      if (!error && data) {
        this.userPseudo = data.pseudo
      }
    },

    normalizePhotos(photos) {
      if (!photos) return []
      if (Array.isArray(photos)) return photos
      if (typeof photos === 'string') {
        return photos
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      }
      return []
    },

    formatDate(value) {
      if (!value) return 'Date inconnue'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return 'Date inconnue'
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },

    async searchUser() {
      if (!this.searchPseudo.trim()) return

      const { data, error } = await supabase
        .from('sessions')
        .select('id, pseudo')
        .ilike('pseudo', `%${this.searchPseudo.trim()}%`)

      if (error) {
        console.error('Erreur lors de la recherche :', error)
      } else {
        this.searchResults = await Promise.all(
          (data || []).map(async (user) => ({
            ...user,
            isAlreadyFriend: await this.isAlreadyFriend(user.id)
          }))
        )
      }
    },

    async addFriend(amiId) {
      const playerId = localStorage.getItem('playerId')
      if (!playerId) {
        alert('Vous devez être connecté pour ajouter un ami.')
        return
      }

      const { data: existing1 } = await supabase
        .from('amis')
        .select('id')
        .eq('user_id', playerId)
        .eq('ami_id', amiId)

      const { data: existing2 } = await supabase
        .from('amis')
        .select('id')
        .eq('user_id', amiId)
        .eq('ami_id', playerId)

      if ((existing1 && existing1.length > 0) || (existing2 && existing2.length > 0)) {
        alert('Une demande d\'ami existe déjà.')
        return
      }

      const { error } = await supabase
        .from('amis')
        .insert({
          user_id: playerId,
          ami_id: amiId,
          statut: 'en_attente',
          date_creation: new Date().toISOString()
        })

      if (error) {
        console.error('Erreur lors de l\'ajout d\'ami :', error)
        alert('Erreur lors de l\'envoi de la demande d\'ami.')
      } else {
        alert('Demande d\'ami envoyée avec succès !')
        this.searchResults = []
      }
    },

    async isAlreadyFriend(userId) {
      const playerId = localStorage.getItem('playerId')
      if (!playerId) return false

      const { data: friendship1 } = await supabase
        .from('amis')
        .select('*')
        .eq('user_id', playerId)
        .eq('ami_id', userId)

      const { data: friendship2 } = await supabase
        .from('amis')
        .select('*')
        .eq('user_id', userId)
        .eq('ami_id', playerId)

      return (friendship1 && friendship1.length > 0) || (friendship2 && friendship2.length > 0)
    }
  }
}
</script>

<style src="./Accueil.css"></style>
