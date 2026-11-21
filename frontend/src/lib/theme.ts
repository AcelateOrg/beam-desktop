import { t } from '@/i18n'
import {
  getSystemTheme,
  initThemeController,
  readStoredThemePreference,
  resolveTheme,
  setThemePreference,
  syncWindowTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/themes/controller'
import {
  BUILTIN_THEME_IDS,
  builtinPalette,
  paletteGradient,
  splitGradient,
  type BuiltinThemeId,
  type ThemePalette,
} from '@/themes/palette'

export type AppTheme = ThemePreference

export type ThemePreviewColors = {
  background: string
  sidebar: string
  /** Готовый CSS-градиент для плитки выбора темы. */
  gradient: string
}

export type ThemeOption = {
  value: 'system' | BuiltinThemeId
  label: string
  description: string
  preview: ThemePreviewColors
}

// Геттеры, а не значения: подпись берётся из текущей локали при каждом рендере.
function themeOption(value: ThemeOption['value'], preview: ThemePreviewColors): ThemeOption {
  return {
    value,
    preview,
    get label() {
      return t(`settings.appearance.themes.builtin.${value}.label`)
    },
    get description() {
      return t(`settings.appearance.themes.builtin.${value}.description`)
    },
  }
}


export function themePreviewColors(palette: ThemePalette): ThemePreviewColors {
  return {
    background: palette['--background'],
    sidebar: palette['--sidebar'],
    gradient: paletteGradient(palette),
  }
}

function systemPreview(): ThemePreviewColors {
  const light = builtinPalette('light')
  const dark = builtinPalette('dark')
  return {
    background: light['--background'],
    sidebar: dark['--sidebar'],
    gradient: splitGradient(light, dark),
  }
}

export const THEME_OPTIONS: ThemeOption[] = [
  themeOption('system', systemPreview()),
  ...BUILTIN_THEME_IDS.map((id) => themeOption(id, themePreviewColors(builtinPalette(id)))),
]

export function getStoredTheme(): AppTheme | null {
  return readStoredThemePreference()
}

export function applyTheme(theme: AppTheme, persist = true) {
  initThemeController()
  setThemePreference(theme, { persist, syncWindow: false })
}

export function applyAndSyncTheme(theme: AppTheme, persist = true) {
  initThemeController()
  setThemePreference(theme, { persist, syncWindow: true })
}

export { getSystemTheme, resolveTheme, syncWindowTheme, THEME_STORAGE_KEY }
