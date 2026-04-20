<template>
  <div class="post-page">
    <div class="accueil-button">
      <router-link :to="{ name: isObserver ? 'AccueilObservateur' : 'Accueil' }">
        <button class="btn btn-secondary">Accueil</button>
      </router-link>
      <button @click="refreshPage" class="refresh-button">🔄 Actualiser</button>
    </div>

    <div class="post-container">
      <div class="post-header">
        <h2>Poster des nouvelles</h2>
      </div>

      <form @submit.prevent="uploadMedias">
        <div class="form-section">
          <div class="form-group">
            <label for="caption">Description de ton post</label>
            <textarea
              id="caption"
              v-model="caption"
              placeholder="Dis nous tout..."
              required
              style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="post-date">Date du post (optionnel)</label>
            <input
              type="datetime-local"
              id="post-date"
              v-model="postDate"
            />
          </div>

          <div class="form-group">
            <label>Medias (images ou videos)</label>
            <button type="button" @click="triggerFileInput" class="btn btn-secondary">
              Importer des medias
            </button>
            <input
              type="file"
              ref="fileInput"
              @change="handleFileUpload"
              accept="image/*,video/*"
              style="display: none;"
              multiple
            />
            <p v-if="selectedFiles.length > 0" style="margin-top: 10px; color: #666;">
              {{ selectedFiles.length }} fichier(s) sélectionné(s)
            </p>
          </div>
        </div>

        <div class="button-group">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="selectedFiles.length === 0 || !caption.trim()"
          >
            Publier le post
          </button>
        </div>
      </form>

      <div v-if="selectedFiles.length > 0" class="preview-section">
        <h3 style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">Aperçu des médias (ça rend pas pareil après publication)</h3>
        <div class="media-grid">
          <div
            v-for="(file, index) in selectedFiles"
            :key="index"
            class="media-item"
          >
            <div v-if="file.type.startsWith('image/')">
              <img
                :src="getObjectURL(file)"
                alt="Aperçu"
              />
            </div>
            <div v-else-if="file.type.startsWith('video/')">
              <video
                :src="getObjectURL(file)"
                controls
              ></video>
            </div>
            <div class="media-caption">
              {{ file.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase.js'; // ← import unique, plus de createClient ici

export default {
  data() {
    return {
      selectedFiles: [],
      caption: '',
      postDate: '',
      isObserver: false
    };
  },
  mounted() {
    this.checkObserverStatus();
  },
  methods: {
    async checkObserverStatus() {
      const playerId = localStorage.getItem('playerId');
      if (!playerId) return;

      const { data: session } = await supabase
        .from('sessions')
        .select('observateur')
        .eq('id', playerId)
        .single();

      if (session) {
        this.isObserver = session.observateur === true;
      }
    },

    refreshPage() {
      location.reload();
    },

    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    handleFileUpload(event) {
      const files = event.target.files;
      if (files.length > 0) {
        this.selectedFiles = Array.from(files);
      }
    },

    getObjectURL(file) {
      return URL.createObjectURL(file);
    },

    async uploadMedias() {
      // Utilise localStorage comme partout ailleurs dans l'app
      const playerId = localStorage.getItem('playerId');

      if (!playerId) {
        alert("Tu dois être connecté !");
        return;
      }

      const mediaUrls = [];

      for (const file of this.selectedFiles) {
        const fileName = `${playerId}/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(fileName, file);

        if (uploadError) {
          console.error(uploadError);
          alert(uploadError.message);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post_images')
          .getPublicUrl(fileName);

        mediaUrls.push(publicUrl);
      }

      // postDate vide → null pour éviter l'erreur "invalid input syntax for timestamp"
      const dateToInsert = this.postDate ? this.postDate : null;

      const { error } = await supabase
        .from('posts')
        .insert([{
          photos: mediaUrls,
          description: this.caption,
          date: dateToInsert,
          session_id: playerId,
        }]);

      console.log("Post inséré avec session_id :", playerId);

      if (error) {
        console.error(error);
        alert("Erreur lors de la création du post : " + error.message);
      } else {
        alert("Post créé !");
        this.selectedFiles = [];
        this.caption = '';
        this.postDate = '';
      }
    }
  },
};
</script>

<style src="./Post.css" scoped></style>