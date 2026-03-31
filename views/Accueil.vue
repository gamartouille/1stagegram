<template>
  <div id="app-content">
    Hello World
    <router-link :to="{ name: 'Carte' }">
      <button>Carte des stages</button>
    </router-link>
  </div>
</template>

<style scoped>
#app-content {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
