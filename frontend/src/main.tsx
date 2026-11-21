import React from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import '@/i18n'
import App from './App'
import { initThemeController } from '@/themes/controller'
import { initAppearance } from '@/hooks/useAppearance'
import { installTitleBarDoubleClick } from '@/lib/titlebar-dblclick'

initThemeController()
initAppearance()
installTitleBarDoubleClick()

window.addEventListener(
    'wheel',
    (event) => {
        if (event.ctrlKey) {
            event.preventDefault()
        }
    },
    { passive: false, capture: true }
)

const container = document.getElementById('root')
const root = createRoot(container!)

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
