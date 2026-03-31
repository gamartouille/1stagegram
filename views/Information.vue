<template>
    <div class="info-page">
        <div v-if="mode === 'signup'" class="auth-form">
            <button class="btn-back" @click="mode = 'choice'">← Retour</button>
            <h2>Avant tout quelques informations sur ton stage</h2>
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
import { ref } from 'vue'
import { supabase } from '../supabase.js'
import { useRouter } from 'vue-router'

const router = useRouter()

// Par défaut, afficher le formulaire d'informations dès l'arrivée sur la page.
const mode = ref('signup')
const loading = ref(false)
const error = ref('')

const infoForm = ref({
  titre: '',
  ville: '',
  institut: '',
  sujet: '',
  dateArrivee: '',
  dateRetour: '',
  bio: ''
})

async function Enregistrer() {
  error.value = ''

  // Validation
  if (!infoForm.value.ville.trim()) {
    error.value = 'Indique ta ville pour la carte des stages'
    return
  }

  const dateArrivee = infoForm.value.dateArrivee
  const dateRetour = infoForm.value.dateRetour

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateArrivee) || !/^\d{4}-\d{2}-\d{2}$/.test(dateRetour)) {
    error.value = 'Format de date invalide. Utilise YYYY-MM-DD.'
    return
  }

  if (new Date(dateRetour) < new Date(dateArrivee)) {
    error.value = 'La date de retour doit être après la date d’arrivée'
    return
  }

  loading.value = true

  try {
    const titre = infoForm.value.titre.trim()
    const ville = infoForm.value.ville.trim()
    const institut = infoForm.value.institut.trim()
    const sujet = infoForm.value.sujet.trim()
    const bio = infoForm.value.bio.trim()

    // Créer le compte
    const { data, error: insertError } = await supabase
      .from('sessions')
      .insert([
        {
          titre: titre,
          ville: ville,
          institut: institut,
          sujet: sujet,
          date_debut: dateArrivee,
          date_retour: dateRetour,
          bio: bio
        }
      ])
      .select()
      .single()

    if (insertError) throw insertError

      // Afficher le message de succès et revenir au menu
    router.push({ name: 'Accueil' })

    // Réinitialiser le formulaire
    infoForm.value = {
      titre: '',
      ville: '',
      institut: '',
      sujet: '',
      dateArrivee: '',
      dateRetour: '',
      bio: ''
    }
  } catch (err) {
    error.value = 'Erreur : ' + (err.message || String(err))
  } finally {
    loading.value = false
  }
}

</script>


<style src="../Information.css" scoped></style>
