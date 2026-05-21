import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/event/:id', name: 'event-detail', component: () => import('@/views/EventDetailView.vue') },
  { path: '/event/create', name: 'event-create', component: () => import('@/views/EventFormView.vue') },
  { path: '/leads/public', name: 'leads-public', component: () => import('@/views/LeadPublicView.vue') },
  { path: '/leads/personal', name: 'leads-personal', component: () => import('@/views/LeadPersonalView.vue') },
  { path: '/contacts', name: 'contacts', component: () => import('@/views/ContactsView.vue') },
  { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
  { path: '/submit/:id', name: 'submit-form', component: () => import('@/views/SubmitFormView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
