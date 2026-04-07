import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const routes = [
  { path: '/', name: 'home', component: HomeView },
  {
    path: '/flow-a',
    name: 'flow-a',
    component: () => import('../views/FlowAView.vue'),
  },
  {
    path: '/flow-b',
    name: 'flow-b',
    component: () => import('../views/FlowBView.vue'),
  },
  {
    path: '/summary',
    name: 'summary',
    component: () => import('../views/SummaryView.vue'),
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
