<template>
  <div class="auth-page">
    <!-- Mode choix initial -->
    <div v-if="mode === 'choice'" class="auth-choice">
      <h1>1stageGram</h1>
      <p class="subtitle">Go partager son experience de stage</p>
      <div class="choice-buttons">
        <button class="btn btn-primary" @click="mode = 'signup'">Creer un compte</button>
        <button class="btn btn-secondary" @click="mode = 'login'">Se connecter</button>
      </div>
    </div>
    <!-- Mode créer un compte -->
    <div v-if="mode === 'signup'" class="auth-form">
      <button class="btn-back" @click="mode = 'choice'">← Retour</button>
      <h2>Creer un compte</h2>
      <form @submit.prevent="handleSignup">
        <div class="form-group">
          <label for="signup-pseudo">Pseudo</label>
          <input
            id="signup-pseudo"
            v-model="signupForm.pseudo"
            type="text"
            required
            maxlength="30"
            placeholder="ex: Neuille"
          />
        </div>

        <div class="form-group">
          <label for="signup-password">Mot de passe</label>
          <input
            id="signup-password"
            v-model="signupForm.code"
            type="password"
            required
            minlength="3"
            maxlength="50"
            placeholder="Minimum 3 caracteres"
          />
        </div>

        <div class="form-group">
          <label for="signup-confirm">Confirmer le mot de passe</label>
          <input
            id="signup-confirm"
            v-model="signupForm.confirm"
            type="password"
            required
            maxlength="50"
            placeholder="Confirme ton mot de passe"
          />
        </div>

        <div class="form-group">
          <label for="signup-title">Titre de ta page (optionnel)</label>
          <input
            id="signup-title"
            v-model="signupForm.titre"
            type="text"
            maxlength="100"
            placeholder="ex: Neuille au Costa Rica baby"
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Creation en cours...' : 'Creer mon compte' }}
        </button>
      </form>
    </div>

    <!-- Mode se connecter -->
    <div v-if="mode === 'login'" class="auth-form">
      <button class="btn-back" @click="mode = 'choice'">← Retour</button>
      <h2>Se connecter</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="login-pseudo">Pseudo</label>
          <input
            id="login-pseudo"
            v-model="loginForm.pseudo"
            type="text"
            required
            maxlength="30"
            placeholder="Ton pseudo"
          />
        </div>

        <div class="form-group">
          <label for="login-password">Mot de passe</label>
          <input
            id="login-password"
            v-model="loginForm.code"
            type="password"
            required
            maxlength="50"
            placeholder="Ton mot de passe"
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Connexion en cours...' : 'Se connecter' }}
        </button>
      </form>
    </div>

    <!-- Modal de succès (signup) -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="modal-content" @click.stop>
        <h3>Compte cree</h3>
        <p>Tu peux maintenant te connecter avec ton pseudo et ton mot de passe.</p>
        <button class="btn btn-primary" @click="closeSuccessModal">Retour au menu</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from './supabase.js'
import { useRouter } from 'vue-router'

const router = useRouter()

const mode = ref('choice')
const loading = ref(false)
const error = ref('')
const showSuccessModal = ref(false)

const signupForm = ref({
  pseudo: '',
  code: '',
  confirm: '',
  titre:''
})

const loginForm = ref({
  pseudo: '',
  code: ''
})

async function handleSignup() {
  error.value = ''

  // Validation
  if (!signupForm.value.pseudo.trim()) {
    error.value = 'Rentre un pseudo'
    return
  }
  if (signupForm.value.code.length < 3) {
    error.value = 'Le mot de passe doit faire au moins 3 caracteres'
    return
  }
  if (signupForm.value.code !== signupForm.value.confirm) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }

  loading.value = true

  try {
    const pseudo = signupForm.value.pseudo.trim()
    const newCode = signupForm.value.code.trim()
    const titre = signupForm.value.titre.trim()

    // Vérifier si le pseudo existe déjà
    const { data: existing, error: checkError } = await supabase
      .from('sessions')
      .select('id')
      .eq('pseudo', pseudo)
      .single()

    if (existing) {
      error.value = 'Ce pseudo existe déjà. Choisis-en un autre.'
      loading.value = false
      return
    }

    // Créer le compte
    const { data, error: insertError } = await supabase
      .from('sessions')
      .insert([
        {
          pseudo: pseudo,
          code: newCode,
          titre: titre,
        }
      ])
      .select()
      .single()

    if (insertError) throw insertError

      // Afficher le message de succès et revenir au menu
    showSuccessModal.value = true

    // Réinitialiser le formulaire
    signupForm.value = { pseudo: '', code: '', confirm: '', titre: '' }
  } catch (err) {
    error.value = 'Erreur : ' + (err.message || String(err))
  } finally {
    loading.value = false
  }
}

async function handleLogin() {
  error.value = ''

  if (!loginForm.value.pseudo.trim()) {
    error.value = 'Rentre ton pseudo'
    return
  }
  if (!loginForm.value.code) {
    error.value = 'Rentre ton mot de passe'
    return
  }

  loading.value = true

  try {
    const pseudo = loginForm.value.pseudo.trim()
    const pwd = loginForm.value.code

    // Chercher le joueur
    const { data, error: queryError } = await supabase
      .from('sessions')
      .select('*')
      .eq('pseudo', pseudo)
      .single()

    if (queryError && queryError.code !== 'PGRST116') throw queryError

    if (!data) {
      error.value = 'Pseudo ou mot de passe incorrect'
      loading.value = false
      return
    }

    // Vérifier le mot de passe
    if (data.code !== pwd) {
      error.value = 'Pseudo ou mot de passe incorrect'
      loading.value = false
      return
    }

    // Succès : sauvegarder et rediriger
    localStorage.setItem('nick', pseudo)
    localStorage.setItem('playerCode', data.code)
    localStorage.setItem('playerId', data.id)

    router.push({ name: 'Information', query: { nick: pseudo } })
  } catch (err) {
    error.value = 'Erreur : ' + (err.message || String(err))
  } finally {
    loading.value = false
  }
}

function closeSuccessModal() {
  showSuccessModal.value = false
  mode.value = 'choice'
}
</script>

<style src="./AuthPage.css" scoped></style>
