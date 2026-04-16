<template>
    <div class="info-page">
        <div v-if="mode === 'signup'" class="auth-form">
            <button class="btn-back" @click="goBack">← Retour</button>
            <h2>{{ fromEdit ? 'Modifier mes informations de stage' : 'Avant tout quelques informations sur ton stage' }}</h2>
            <form @submit.prevent="Enregistrer">
                <div class="form-group">
                <label for="info-title">Titre de ta page</label>
                <input
                    id="info-title"
                    v-model="infoForm.titre"
                />
                </div>

                <div class="form-group">
                  <label for="info-city">Ville de stage (Obligatoire)</label>
                  <input
                    id="info-city"
                    v-model="infoForm.ville"
                  />
                </div>

                <div class="form-group">
                  <label for="info-institute">Institut de stage</label>
                  <input
                    id="info-institute"
                    v-model="infoForm.institut"
                  />
                </div>

                <div class="form-group">
                  <label for="info-subject">Sujet de stage grosso modo</label>
                  <input
                    id="info-subject"
                    v-model="infoForm.sujet"
                  />
                </div>

                <div class="form-group">
                  <label for="info-date-arrivee">Date d'arrivée</label>
                  <input
                    id="info-date-arrivee"
                    v-model="infoForm.dateArrivee"
                    type="date"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="info-date-retour">Date de retour</label>
                  <input
                    id="info-date-retour"
                    v-model="infoForm.dateRetour"
                    type="date"
                    required
                  />
                </div>

                <div class="form-group">
                    <label for="info-bio">Phrase de bio</label>
                    <input
                      id="info-bio"
                      v-model="infoForm.bio"
                    />
                </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Enregistrement en cours...' : 'Enregistrer' }}
        </button>

        </form>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase.js'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const mode = ref('signup')
const loading = ref(false)
const error = ref('')
const fromEdit = ref(route.query.from === 'edit')

const infoForm = ref({
  titre: '',
  ville: '',
  institut: '',
  sujet: '',
  dateArrivee: '',
  dateRetour: '',
  bio: ''
})

// 🔥 Charger TOUTES les données (pas juste titre)
onMounted(async () => {
  const playerId = localStorage.getItem('playerId')

  if (!playerId) return

  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', playerId)
      .single()

    if (error) throw error

    if (data) {
      infoForm.value = {
        titre: data.titre || '',
        ville: data.ville || '',
        institut: data.institut || '',
        sujet: data.sujet || '',
        dateArrivee: data.date_debut || '',
        dateRetour: data.date_retour || '',
        bio: data.bio || ''
      }
    }
  } catch (err) {
    console.error('Erreur chargement:', err.message)
  }
})

async function Enregistrer() {
  error.value = ''

  if (!infoForm.value.ville.trim()) {
    error.value = 'Indique ta ville pour la carte des stages'
    return
  }

  const { dateArrivee, dateRetour } = infoForm.value

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateArrivee) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateRetour)
  ) {
    error.value = 'Format de date invalide (YYYY-MM-DD)'
    return
  }

  if (new Date(dateRetour) < new Date(dateArrivee)) {
    error.value = 'La date de retour doit être après la date d’arrivée'
    return
  }

  loading.value = true

  try {
    const playerId = localStorage.getItem('playerId')

    if (!playerId) {
      throw new Error("Utilisateur non identifié")
    }

    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        titre: infoForm.value.titre.trim(),
        ville: infoForm.value.ville.trim(),
        institut: infoForm.value.institut.trim(),
        sujet: infoForm.value.sujet.trim(),
        date_debut: infoForm.value.dateArrivee,
        date_retour: infoForm.value.dateRetour,
        bio: infoForm.value.bio.trim()
      })
      .eq('id', playerId)

    if (updateError) throw updateError

    // Rediriger selon la provenance
    if (fromEdit.value) {
      router.push({ name: 'MonProfil' })
    } else {
      router.push({ name: 'Accueil' })
    }

  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function goBack() {
  if (fromEdit.value) {
    router.push({ name: 'MonProfil' })
  } else {
    router.push({ name: 'Accueil' })
  }
}
</script>


<style src="../Information.css" scoped></style>
