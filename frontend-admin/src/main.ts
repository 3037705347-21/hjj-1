import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { setupPermissionDirectives } from '@/directives/permission'

const app = createApp(App)

app.use(router)

setupPermissionDirectives(app)

app.mount('#app')
