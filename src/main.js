import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Fonts (self-hosted Google Fonts via Fontsource, so they work offline in the PWA)
import '@fontsource/anton/400.css'
import '@fontsource-variable/dm-sans/index.css'

// Leaflet's base styles, needed for the map to render correctly
import 'leaflet/dist/leaflet.css'
import './style.css'

createApp(App).use(createPinia()).use(router).mount('#app')
