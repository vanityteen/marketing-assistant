import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView/HomeView.vue') },
  { path: '/event/:id', name: 'event-detail', component: () => import('@/views/EventDetailView/EventDetailView.vue') },
  { path: '/event/create', name: 'event-create', component: () => import('@/views/EventFormView/EventFormView.vue') },
  { path: '/event/:id/edit', name: 'event-edit', component: () => import('@/views/EventFormView/EventFormView.vue') },
  { path: '/leads/public', name: 'leads-public', component: () => import('@/views/LeadPublicView/LeadPublicView.vue') },
  { path: '/leads/personal', name: 'leads-personal', component: () => import('@/views/LeadPersonalView/LeadPersonalView.vue') },
  { path: '/contacts', name: 'contacts', component: () => import('@/views/ContactsView/ContactsView.vue') },
  { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView/SettingsView.vue') },
  { path: '/submit/:id', name: 'submit-form', component: () => import('@/views/SubmitFormView/SubmitFormView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
