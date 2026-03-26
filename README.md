# Développement d'un plugin cartographique pour le logiciel Apache Superset

## Contexte et Objectifs

### Le commanditaire

1Spatial est une entreprise ayant pour mission d’accompagner ses clients dans la gestion de leurs donn´ees
g´eolocalis´ees. Elle propose un ensemble de solutions logicielles et de services d’accompagnement personnalis´e
adapt´es selon les besoins. 1Spatial travaille avec des acteurs de multiples milieux (collectivit´es territoriales,
gouvernement, r´eseaux d’utilit´e publique, transport et infrastructure, etc). Leur rˆole est de simplifier pour
un public non-sp´ecialiste la lecture de donn´ees statistiques et g´eographiques pour mener leurs clients vers
une prise de d´ecision robuste et fiable.

### Apache Superset

Logiciel de visualisation de données "no code" permettant de représenter la data sous différents formats (heatmap, histogramme, camembert, diagramme de Gantt). La force de Superset réside dans ses Tableaux de bord qui condense dans un affichage ergonomique l'ensemble des graphiques produits sur le(s) jeu(x) de données. 

### Attentes

Explorer les possiblités cartographiques du logiciel en développant un plugin externe de visualisation cartographique. L'objectif principal est d'établir s'il est possible d'harmoniser les visualisations graphiques (histogrammes, camembert, heatmap, etc) avec les visualisations cartos. Si l'utilisateur bouge l'emprise de la carte sur la visualisation carto, alors les graphiques se mettent à jour en fonction des données visibles. 

## Processus de développement

### Configuration de l'environnement

Nous avons essayé plusieurs manières de configurer le logiciel en mode éditable (le mode dédie au développement de plugins externes), une n'a pas fonctionné (installation via un environnement virtuel Python), et une a fonctionné (installation via un docker).

--> git clone du github superset
--> dossier à part: génération de l'architecture avec yeoman
--> dans le frontend du git superset tu appelles le plugin dans le main-preset
--> puis tu link via les outils git
--> tu relances le docker de l'application qui ouvre Superset avec le plugin intégré

### Installation des bilbiothèques nécessaires

Les bibliothèques que l'on a dû installer pour installer Superset et développer le plugin sont les suivantes :

* Node.js - version 20.20.1
* npm - version 10.8.2
* Yeoman - version 8.1.2
* Yo - version 7.0.0
* Apache Superset - version 6.0.0

### Code

Les étapes pour installer votre programme....


## Déploiement

### Format des données en entrée

Le logiciel Apache Superset ne lit que des fichiers au format Geojson. Les données géographiques utilisées peuvent être en latitude longitude ou en Lambert93 (x,y). Le logiciel détecte automatiquement la manière dont les données doivent être chargées sur la carte.
Nous avons travaillé avec une BDD fournie par notre commanditaire 1Spatial.




format des données avec lesquelles on a travaillé : 

coordonnées en x,y en Lambert93
latitude longitude

format des données en entrée :

test OK avec Geojson

données= données d'évenèneen ts sir les routes avec des tavkettes

