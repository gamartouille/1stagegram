<template>
  <div class="accueil-button">
    <router-link :to="{ name: 'Accueil' }">
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
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://komsplwinybifzsmjecu.supabase.co';
const supabaseKey = 'sb_publishable_RjquiQjx5rJ1Xj-fp4ou1g_aKmy9Iia';
const supabase = createClient(supabaseUrl, supabaseKey);

export default {
  data() {
    return {
      selectedFiles: [],
      caption: '',
    };
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    handleFileUpload(event) {
      const files = event.target.files;
      if (files.length > 0) {
        this.selectedFiles = Array.from(files);
        this.uploadMedias();
      }
    },

    getObjectURL(file) {
      return URL.createObjectURL(file);
    },

    async uploadMedias() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert("Tu dois être connecté !");
        return;
      }

      const user = session.user;
      const mediaUrls = [];

      for (const file of this.selectedFiles) {
        const fileName = `${user.id}/${Date.now()}_${file.name}`;

        const { error } = await supabase.storage
          .from('post_images')
          .upload(fileName, file);

        if (error) {
          console.error(error);
          alert(error.message);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post_images')
          .getPublicUrl(fileName);

        mediaUrls.push(publicUrl);
      }

      // Sauvegarde le post avec la description
      const { error } = await supabase
        .from('posts')
        .insert([{
          photos: mediaUrls,
          description: this.caption, // Ajoute cette ligne
          session_id: user.id,
        }]);

      if (error) {
        console.error(error);
      } else {
        alert("Post créé !");
        this.selectedFiles = [];
        this.caption = ''; // Réinitialise le textarea
      }
    }
  },
};
</script>