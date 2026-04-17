<template>
  <div class="accueil-button">
    <router-link :to="{ name: isObserver ? 'AccueilObservateur' : 'Accueil' }">
      <button>Accueil</button>
    </router-link>
  </div>
  <div id="map" style="width: 100%; height: 100vh;"></div>
</template>

<script>
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from '@supabase/supabase-js';
import { ref, onMounted } from 'vue';

const supabaseUrl = 'https://komsplwinybifzsmjecu.supabase.co';
const supabaseKey = 'sb_publishable_RjquiQjx5rJ1Xj-fp4ou1g_aKmy9Iia';
const supabase = createClient(supabaseUrl, supabaseKey);

export default {
  setup() {
    const isObserver = ref(false);

    async function checkObserverStatus() {
      const playerId = localStorage.getItem('playerId');
      if (!playerId) return;

      const { data: session } = await supabase
        .from('sessions')
        .select('observateur')
        .eq('id', playerId)
        .single();

      if (session) {
        isObserver.value = session.observateur === true;
      }
    }

    onMounted(checkObserverStatus);

    return { isObserver };
  },
  async mounted() {
    // Fix icônes Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    const map = L.map("map").setView([46.603354, 1.888334], 6);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // 🔥 Requête Supabase (inchangée sauf si ta table/colonnes ont changé)
    const { data, error } = await supabase
      .from("sessions") // ⚠️ change ici si ta table a changé
      .select("ville, pseudo") // ⚠️ adapte si colonnes différentes
      .not("ville", "is", null);

    if (error) {
      console.error("Erreur Supabase :", error.message);
      return;
    }

    const villesMap = {};

    data.forEach((row) => {
      if (!villesMap[row.ville]) {
        villesMap[row.ville] = [];
      }
      villesMap[row.ville].push(row.pseudo);
    });

    // 🔥 Géocodage + affichage
    for (const ville in villesMap) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            ville
          )}&format=json&limit=1`,
          {
            headers: { "Accept-Language": "fr" },
          }
        );

        const results = await response.json();

        if (results.length > 0) {
          const { lat, lon } = results[0];
          const pseudos = villesMap[ville];

          L.circle([parseFloat(lat), parseFloat(lon)], {
            color: "red",
            fillColor: "#f03",
            fillOpacity: 0.3,
            radius: 10000,
          })
            .addTo(map)
            .bindTooltip(
                `<strong>${ville}</strong><br>${pseudos.join(", ")}`,
                {
                  permanent: false, // La tooltip disparaît quand on ne survole plus
                  direction: "auto", // La tooltip s'affiche intelligemment autour du curseur
                  sticky: true, // La tooltip reste visible tant que le curseur est sur l'élément
                }
              );
        } else {
          console.warn(`Ville introuvable : ${ville}`);
        }
      } catch (err) {
        console.error(`Erreur géocodage pour "${ville}" :`, err);
      }
    }
  },
};
</script>

<style src="./Carte.css" scoped></style>