<template>
  <div id="app-content">
    <router-link :to="{ name: 'Carte' }">
      <button>Carte des stages</button>
    </router-link>
    <router-link :to="{ name: 'Post' }">
      <button>Poster des nouvelles</button>
    </router-link>
    <router-link :to="{ name: 'Profil' }">
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
        <button @click="addFriend(user.id)">Ajouter en ami</button>
      </div>
    </div>

    <!-- Section pour afficher les posts -->
    <div class="posts-container">
      <!-- ... (votre code existant pour les posts) ... -->
    </div>
  </div>
</template>

<style scoped>
#app-content {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow-y: auto;
}
</style>

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
      const playerId = localStorage.getItem('playerId');
      if (!playerId) return;

      // Récupérer la liste des amis
      const { data: amis, error: amisError } = await supabase
        .from('amis')
        .select('ami_id, user_id')
        .or(`and(user_id.eq.'${playerId}',statut.eq.accepté),and(ami_id.eq.'${playerId}',statut.eq.accepté)`);

      if (amisError) {
        console.error("Erreur lors de la récupération des amis :", amisError);
        return;
      }

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
        .in('user_id', amisIds);

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
      const playerId = localStorage.getItem('playerId');
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
        this.searchResults = data;
      }
    },

    async addFriend(amiId) {
      const playerId = localStorage.getItem('playerId');
      if (!playerId) {
        alert("Vous devez être connecté pour ajouter un ami.");
        return;
      }

      // Vérifier si une demande d'ami existe déjà
      const { data: existingFriendship, error: checkError } = await supabase
        .from('amis')
        .select('*')
        .or(`and(user_id.eq.'${playerId}',ami_id.eq.'${amiId}'),and(user_id.eq.'${amiId}',ami_id.eq.'${playerId}')`);

      if (checkError) {
        console.error("Erreur lors de la vérification de l'amitié :", checkError);
        return;
      }

      if (existingFriendship.length > 0) {
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
    }
  },
};
</script>

<style src="./Accueil.css" scoped></style>