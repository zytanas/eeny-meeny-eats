import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { useLocationStore } from '@/stores/location'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  {
    path: '/explore',
    name: 'explore',
    component: () => import('@/views/ExploreView.vue'),
    meta: { requiresLocation: true },
  },
  {
    path: '/place/:id',
    name: 'place',
    component: () => import('@/views/PlaceView.vue'),
    props: true,
    meta: { requiresLocation: true },
  },
  {
    path: '/pick/:id',
    name: 'pick',
    component: () => import('@/views/RandomPickView.vue'),
    props: true,
    meta: { requiresLocation: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => saved || { top: 0 },
})

// Send users back to the location prompt if we don't know where they are yet
router.beforeEach((to) => {
  if (to.meta.requiresLocation && !useLocationStore().hasLocation) {
    return { name: 'home' }
  }
})

export default router
