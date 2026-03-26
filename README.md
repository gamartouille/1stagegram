# Développement d'un plugin cartographique pour le logiciel Apache Superset
_(juste en dessous des badges sympatiques à placer)_

[![forthebadge](http://forthebadge.com/images/badges/built-with-love.svg)](http://forthebadge.com)  [![forthebadge](http://forthebadge.com/images/badges/powered-by-electricity.svg)](http://forthebadge.com)

Exploration pour l'entreprise 1Spatial des possibilités de représentations cartographiques de données dans le logiciel Apache Superset.

## Apache Superset

Logiciel de visualisation de données "no code" permettant de représenter la data sous différents formats (heatmap, histogramme, camembert, diagramme de Gantt). La force de Superset réside dans ses Tableaux de bord qui condense dans un affichage ergonomique l'ensemble des graphiques produits sur le(s) jeu(x) de données. 

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

* Node.js 

### Code

Les étapes pour installer votre programme....

Dites ce qu'il faut faire...

_exemple_: Executez la commande ``telnet mapscii.me`` pour commencer ensuite [...]


Ensuite vous pouvez montrer ce que vous obtenez au final...

## Déploiement



installation qu'on a faites : 

Node.Js version 20.20.1
NPM version 10.8.2
yeoman-generator version 8.1.2
yo version 7.0.0
Apache Superset version 6.0.0


format des données avec lesquelles on a travaillé : 

coordonnées en x,y en Lambert93
latitude longitude

format des données en entrée :

test OK avec Geojson

données= données d'évenèneen ts sir les routes avec des tavkettes

