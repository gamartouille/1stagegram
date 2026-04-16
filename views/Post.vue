<template>
  <div class="accueil-button">
    <router-link :to="{ name: isObserver ? 'AccueilObservateur' : 'Accueil' }">
      <button>Accueil</button>
    </router-link>
  </div>
  <div>
    <button @click="triggerFileInput">
      Importer des médias
    </button>

    <input
      type="file"
      ref="fileInput"
      @change="handleFileUpload"
      accept="image/*,video/*"
      style="display: none;"
      multiple
    />

    <textarea
      v-model="caption"
      name="caption"
      id="caption"
      placeholder="Dis nous tout"
    ></textarea>

    <div>
      <label for="post-date">Date du post :</label>
      <input
        type="datetime-local"
        id="post-date"
        v-model="postDate"
      />
    </div>

    <button
      @click="uploadMedias"
      :disabled="selectedFiles.length === 0 || !caption"
    >
      Valider le post
    </button>

    <div v-if="selectedFiles.length > 0">
      <h3>Aperçu des médias :</h3>
      <div v-for="(file, index) in selectedFiles" :key="index">
        <div v-if="file.type.startsWith('image/')">
          <img
            :src="getObjectURL(file)"
            alt="Aperçu"
            style="max-width: 200px; max-height: 200px;"
          />
        </div>
        <div v-else-if="file.type.startsWith('video/')">
          <video
            :src="getObjectURL(file)"
            controls
            style="max-width: 200px; max-height: 200px;"
          />
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