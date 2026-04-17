<template>
  <div id="app-content">
    <router-link :to="{ name: 'Carte' }">
      <button>Carte des stages</button>
    </router-link>
    <router-link :to="{ name: 'Post' }">
      <button>Poster des nouvelles</button>
    </router-link>
    <router-link :to="{ name: 'MonProfil' }">
      <button class="profile-button">
        Mon profil
        <span v-if="pendingFriendRequestsCount > 0" class="notification-badge">{{ pendingFriendRequestsCount }}</span>
      </button>
    </router-link>
    <button @click="logout" class="logout-button">Deconnexion</button>

    <!-- Barre de recherche de profils -->
    <div class="search-bar">
      <input
        v-model="searchPseudo"
        placeholder="Rechercher un pseudo..."
        @keyup.enter="searchUser"
      />
      <button @click="searchUser">Rechercher des amis</button>
    </div>

    <!-- Résultats de la recherche -->
    <div v-if="searchResults.length" class="search-results">
      <div v-for="user in searchResults" :key="user.id" class="user-result">
        <p>{{ user.pseudo }}</p>
        <router-link v-if="user.isAcceptedFriend" :to="{ name: user.observateur ? 'ProfilObservateur' : 'ProfilPublic', params: { id: user.id } }">
          <button class="profile-btn">👤 Voir le profil</button>
        </router-link>
        <button v-else-if="user.isPendingFriend" disabled class="pending-btn">Demande envoyée</button>
        <button v-else @click="addFriend(user.id)">Ajouter en ami</button>
      </div>
    </div>

    <!-- Section pour afficher les posts -->
    <div class="posts-container">
      <div v-for="post in posts" :key="post.id" class="post">
        <div class="post-header">
          <p class="post-author">Poste par : <strong>{{ post.pseudo || 'Inconnu' }}</strong></p>
          <p class="post-date">{{ formatDate(post.date) }}</p>
        </div>
        <div class="post-content">
          <div class="post-photos">
            <img v-for="(photo, index) in normalizePhotos(post.photos)" :key="index" :src="photo" alt="Photo du post" class="photo-img" />
          </div>
          <div class="post-text">
            <p class="post-description">{{ post.description }}</p>
            <router-link :to="{ name: post.authorObservateur ? 'ProfilObservateur' : 'ProfilPublic', params: { id: post.session_id } }">
              <button class="profile-btn">👤 Voir le profil</button>
            </router-link>
            <button @click="toggleCommentForm(post.id)" class="add-comment-btn">💬 Ajouter un commentaire</button>
            <div v-if="commentForms[post.id]" class="modal-overlay" @click.self="toggleCommentForm(post.id)">
              <div class="modal-content">
                <h3>Ajouter un commentaire</h3>
                <textarea v-model="newComments[post.id]" placeholder="Votre commentaire"></textarea>
                <button @click="addComment(post.id)">Envoyer</button>
                <button @click="toggleCommentForm(post.id)">Annuler</button>
              </div>
            </div>
          </div>
        </div>
        <div class="post-comments" v-if="post.commentaires && post.commentaires.length">
          <p v-for="(comment, idx) in post.commentaires" :key="idx" class="comment">
            <strong>{{ comment.auteur || 'Inconnu' }}</strong> ({{ formatDate(comment.date_creation) }}) : {{ comment.contenu }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://komsplwinybifzsmjecu.supabase.co';
const supabaseKey = 'sb_publishable_RjquiQjx5rJ1Xj-fp4ou1g_aKmy9Iia';
const supabase = createClient(supabaseUrl, supabaseKey);

export default {
  data() {
    return {
      posts: [],
      commentForms: {},
      newComments: {},
      userPseudo: '',
      searchPseudo: '',
      searchResults: [],
      pendingFriendRequestsCount: 0
    };
  },
  async mounted() {
    await this.fetchPosts();
    await this.fetchUserPseudo();
    await this.fetchPendingFriendRequestsCount();
  },
  methods: {
    async fetchPosts() {
      // Utilisation de localStorage comme partout ailleurs dans l'app
      const playerId = localStorage.getItem('playerId');
      if (!playerId) return;

      // Récupérer les amis où l'utilisateur est user_id
      const { data: amis1, error: amisError1 } = await supabase
        .from('amis')
        .select('ami_id')
        .eq('user_id', playerId)
        .eq('statut', 'accepté');

      // Récupérer les amis où l'utilisateur est ami_id
      const { data: amis2, error: amisError2 } = await supabase
        .from('amis')
        .select('user_id')
        .eq('ami_id', playerId)
        .eq('statut', 'accepté');

      if (amisError1 || amisError2) {
        console.error("Erreur lors de la récupération des amis :", amisError1 || amisError2);
        return;
      }

      // Extraire les IDs des amis dans les deux sens
      const amisIds = [
        ...(amis1 || []).map(a => a.ami_id),
        ...(amis2 || []).map(a => a.user_id)
      ];

      // Ajouter l'ID de l'utilisateur actuel pour voir ses propres posts
      amisIds.push(playerId);

      // Récupérer les posts des amis + les siens
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('session_id', amisIds)
        .order('id', { ascending: false });

      if (postsError) {
        console.error("Erreur lors de la récupération des posts :", postsError);
        return;
      }

      // Récupérer les commentaires et le pseudo pour chaque post
      this.posts = await Promise.all((posts || []).map(async (post) => {
        const { data: comments } = await supabase
          .from('commentaires')
          .select('*')
          .eq('post_id', post.id);

        const { data: author } = await supabase
          .from('sessions')
          .select('pseudo, observateur')
          .eq('id', post.session_id)
          .single();

        return {
          ...post,
          pseudo: author?.pseudo || 'Inconnu',
          authorObservateur: author?.observateur || false,
          commentaires: comments || []
        };
      }));
    },

    async fetchUserPseudo() {
      const playerId = localStorage.getItem('playerId');
      if (!playerId) return;

      const { data, error } = await supabase
        .from('sessions')
        .select('pseudo')
        .eq('id', playerId)
        .single();

      if (!error && data) {
        this.userPseudo = data.pseudo;
      }
    },

    async fetchPendingFriendRequestsCount() {
      const playerId = localStorage.getItem('playerId');
      if (!playerId) return;

      const { data, error } = await supabase
        .from('amis')
        .select('id')
        .eq('ami_id', playerId)
        .eq('statut', 'en_attente');

      if (!error && data) {
        this.pendingFriendRequestsCount = data.length;
      }
    },

    logout() {
      localStorage.removeItem('playerId');
      this.$router.push({ name: 'Home' });
    },

    toggleCommentForm(postId) {
      this.commentForms = { ...this.commentForms, [postId]: !this.commentForms[postId] };
    },

    async addComment(postId) {
      const comment = this.newComments[postId];
      if (!comment || !comment.trim()) return;

      const { error } = await supabase
        .from('commentaires')
        .insert([
          {
            post_id: postId,
            auteur: this.userPseudo,
            contenu: comment.trim(),
            date_creation: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error("Erreur lors de l'ajout du commentaire :", error);
      } else {
        this.newComments[postId] = '';
        this.commentForms[postId] = false;
        await this.fetchPosts();
      }
    },

    async searchUser() {
      if (!this.searchPseudo.trim()) return;

      const { data, error } = await supabase
        .from('sessions')
        .select('id, pseudo, observateur')
        .ilike('pseudo', `%${this.searchPseudo.trim()}%`);

      if (error) {
        console.error("Erreur lors de la recherche :", error);
      } else {
        this.searchResults = await Promise.all(
          data.map(async (user) => {
            const status = await this.getFriendshipStatus(user.id)
            return {
              ...user,
              isAcceptedFriend: status.accepted,
              isPendingFriend: status.pending,
              isOutgoingRequest: status.outgoing,
              observateur: user.observateur
            }
          })
        );
      }
    },

    async addFriend(amiId) {
      const playerId = localStorage.getItem('playerId');
      if (!playerId) {
        alert("Vous devez être connecté pour ajouter un ami.");
        return;
      }

      // Vérifier si une relation existe déjà (dans les deux sens)
      const { data: existing1 } = await supabase
        .from('amis')
        .select('id')
        .eq('user_id', playerId)
        .eq('ami_id', amiId);

      const { data: existing2 } = await supabase
        .from('amis')
        .select('id')
        .eq('user_id', amiId)
        .eq('ami_id', playerId);

      if ((existing1 && existing1.length > 0) || (existing2 && existing2.length > 0)) {
        alert("Une demande d'ami existe déjà.");
        return;
      }

      const { error } = await supabase
        .from('amis')
        .insert({
          user_id: playerId,
          ami_id: amiId,
          statut: 'en_attente',
          date_creation: new Date().toISOString(),
        });

      if (error) {
        console.error("Erreur lors de l'ajout d'ami :", error);
        alert("Erreur lors de l'envoi de la demande d'ami.");
      } else {
        alert("Demande d'ami envoyée avec succès !");
        await this.fetchPendingFriendRequestsCount();
        await this.searchUser();
      }
    },

    normalizePhotos(photos) {
      if (!photos) return [];
      if (Array.isArray(photos)) return photos;
      if (typeof photos === 'string') {
        return photos
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }
      return [];
    },

    async getFriendshipStatus(userId) {
      const playerId = localStorage.getItem('playerId');
      if (!playerId) return { accepted: false, pending: false, outgoing: false };

      const { data: outgoing } = await supabase
        .from('amis')
        .select('id, statut')
        .eq('user_id', playerId)
        .eq('ami_id', userId)
        .maybeSingle();

      if (outgoing && outgoing.statut) {
        return {
          accepted: outgoing.statut === 'accepté',
          pending: outgoing.statut === 'en_attente',
          outgoing: true
        };
      }

      const { data: incoming } = await supabase
        .from('amis')
        .select('id, statut')
        .eq('user_id', userId)
        .eq('ami_id', playerId)
        .maybeSingle();

      if (incoming && incoming.statut) {
        return {
          accepted: incoming.statut === 'accepté',
          pending: incoming.statut === 'en_attente',
          outgoing: false
        };
      }

      return { accepted: false, pending: false, outgoing: false };
    },

    formatDate(dateString) {
      if (!dateString) return 'Date inconnue';
      const date = new Date(dateString);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },
};
</script>

<style src="./Accueil.css"></style>