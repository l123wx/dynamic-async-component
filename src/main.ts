import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './style.css'
import 'element-plus/dist/index.css'

const app = createApp(App)
app.use(router).mount('#app')

export default app