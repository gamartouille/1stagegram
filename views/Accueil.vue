<template>
  <div id="app-content">
    <router-link :to="{ name: 'Carte' }">
      <button>Carte des stages</button>
    </router-link>
    <router-link :to="{ name: 'Post' }">
      <button>Poster des nouvelles</button>
    </router-link>
    <router-link :to="{ name: 'MonProfil' }">
      <button>Mon profil</button>
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

    <!-- Résultats de la recherche -->
    <div v-if="searchResults.length" class="search-results">
      <div v-for="user in searchResults" :key="user.id" class="user-result">
        <p>{{ user.pseudo }}</p>
        <router-link v-if="user.isAlreadyFriend" :to="{ name: 'ProfilPublic', params: { id: user.id } }">
          <button class="profile-btn">👤 Voir le profil</button>
        </router-link>
        <button v-else @click="addFriend(user.id)">Ajouter en ami</button>
      </div>
    </div>

    <!-- Section pour afficher les posts -->
    <div class="posts-container">
      <div v-for="post in posts" :key="post.id" class="post">
        <div class="post-content">
          <div class="post-photos">
            <img v-for="(photo, index) in normalizePhotos(post.photos)" :key="index" :src="photo" alt="Photo du post" class="photo-img" />
          </div>
          <div class="post-text">
            <p class="post-description">{{ post.description }}</p>
            <router-link :to="{ name: 'ProfilPublic', params: { id: post.session_id } }">
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
          <p v-for="(comment, idx) in post.commentaires" :key="idx" class="comment"><strong>{{ comment.auteur }}:</strong> {{ comment.contenu }}</p>
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
      posts: [], // Stocke les posts
      commentForms: {}, // Pour afficher le formulaire de commentaire par post
      newComments: {}, // Pour stocker le nouveau commentaire par post
      userPseudo: '', // Pseudo de l'utilisateur connecté
      searchPseudo: '',
      searchResults: []
    };
  },
  async mounted() {
    await this.fetchPosts(); // Récupère les posts au chargement de la page
    await this.fetchUserPseudo(); // Récupère le pseudo de l'utilisateur
  },
  methods: {
    async fetchPosts() {
      const { data, error } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) return;
      const playerId = session.user.id;

      // Récupérer les amis où l'utilisateur est user_id
      const { data: amis1, error: amisError1 } = await supabase
        .from('amis')
        .select('ami_id, user_id')
        .eq('user_id', playerId)
        .eq('statut', 'accepté');

      // Récupérer les amis où l'utilisateur est ami_id
      const { data: amis2, error: amisError2 } = await supabase
        .from('amis')
        .select('ami_id, user_id')
        .eq('ami_id', playerId)
        .eq('statut', 'accepté');

      if (amisError1 || amisError2) {
        console.error("Erreur lors de la récupération des amis :", amisError1 || amisError2);
        return;
      }

      // Combiner les résultats
      const amis = [...amis1, ...amis2];

      // Extraire les IDs des amis
      const amisIds = amis.map((relation) =>
        relation.user_id === playerId ? relation.ami_id : relation.user_id
      );

      // Ajouter l'ID de l'utilisateur actuel pour voir ses propres posts
      amisIds.push(playerId);

      // Récupérer les posts des amis
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('session_id', amisIds);

      if (postsError) {
        console.error("Erreur lors de la récupération des posts :", postsError);
        return;
      }

      // Récupérer les commentaires pour chaque post
      this.posts = await Promise.all(posts.map(async (post) => {
        const { data: comments, error: commentsError } = await supabase
          .from('commentaires')
          .select('*')
          .eq('post_id', post.id);

        if (commentsError) {
          console.error(`Erreur lors de la récupération des commentaires pour le post ${post.id}:`, commentsError);
          return { ...post, commentaires: [] };
        }

        return { ...post, commentaires: comments };
      }));
    },

    async fetchUserPseudo() {
      const { data, error } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) return;
      const playerId = session.user.id;
      if (playerId) {
        const { data, error } = await supabase
          .from('sessions')
          .select('pseudo')
          .eq('id', playerId)
          .single();

        if (!error) {
          this.userPseudo = data.pseudo;
        }
      }
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
            auteur: this.userPseudo, // Utilise le pseudo de l'utilisateur connecté
            contenu: comment.trim(),
            date_creation: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error("Erreur lors de l'ajout du commentaire :", error);
      } else {
        this.newComments[postId] = '';
        this.commentForms[postId] = false;
        await this.fetchPosts(); // Rafraîchir les posts et commentaires
      }
    },

    async searchUser() {
      if (!this.searchPseudo.trim()) return;

      const { data, error } = await supabase
        .from('sessions')
        .select('id, pseudo')
        .ilike('pseudo', `%${this.searchPseudo.trim()}%`);

      if (error) {
        console.error("Erreur lors de la recherche :", error);
      } else {
        // Vérifier pour chaque utilisateur s'il est déjà ami
        this.searchResults = await Promise.all(
          data.map(async (user) => ({
            ...user,
            isAlreadyFriend: await this.isAlreadyFriend(user.id)
          }))
        );
      }
    },

    async addFriend(amiId) {
      const playerId = localStorage.getItem('playerId');
      if (!playerId) {
        alert("Vous devez être connecté pour ajouter un ami.");
        return;
      }

      // Vérifier si une demande d'ami existe déjà
      const { data: existingFriendship1, error: checkError1 } = await supabase
        .from('amis')
        .select('*')
        .eq('user_id', playerId)
        .eq('ami_id', amiId);

      const { data: existingFriendship2, error: checkError2 } = await supabase
        .from('amis')
        .select('*')
        .eq('user_id', amiId)
        .eq('ami_id', playerId);

      if (checkError1 || checkError2) {
        console.error("Erreur lors de la vérification de l'amitié :", checkError1 || checkError2);
        return;
      }

      if (existingFriendship1.length > 0 || existingFriendship2.length > 0) {
        alert("Une demande d'ami existe déjà.");
        return;
      }

      // Envoyer la demande d'ami
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
        this.searchResults = [];
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

    async isAlreadyFriend(userId) {
      const playerId = localStorage.getItem('playerId');
      if (!playerId) return false;

      const { data: friendship1 } = await supabase
        .from('amis')
        .select('*')
        .eq('user_id', playerId)
        .eq('ami_id', userId);

      const { data: friendship2 } = await supabase
        .from('amis')
        .select('*')
        .eq('user_id', userId)
        .eq('ami_id', playerId);

      return (friendship1 && friendship1.length > 0) || (friendship2 && friendship2.length > 0);
    }
  },
};
</script>

<style src="./Accueil.css"></style>