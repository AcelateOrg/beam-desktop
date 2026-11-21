import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { GetAccent, GetCustomThemes, GetTheme, SetAccent, SetTheme } from '@wailsjs/go/handlers/SettingsHandler'
import type { Theme } from '@/types/api'
import {
  getAccentOverride,
  getSystemTheme,
  getThemeSnapshot,
  hydrateThemeFromBackend,
  initThemeController,
  setAccentOverride,
  setCustomThemes,
  setThemePreference,
  subscribeToTheme,
  type ThemePreference,
} from '@/themes/controller'

const getSnapshot = () => getThemeSnapshot()

let hydrationStarted = false

function ensureThemeHydration() {
  if (hydrationStarted) {
    return
  }

  hydrationStarted = true

  void (async () => {
    // Сначала реестр пользовательских тем: иначе ссылка "custom:<id>"
    // из настроек разрешилась бы в запасную тему.
    try {
      const custom = await GetCustomThemes()
      if (custom.success && Array.isArray(custom.data)) {
        setCustomThemes(custom.data)
      }
    } catch (error) {
      console.error('Failed to load custom themes:', error)
    }

    try {
      const accent = await GetAccent()
      if (accent.success) {
        setAccentOverride(accent.data || null)
      }
    } catch (error) {
      console.error('Failed to load accent:', error)
    }

    await hydrateThemeFromBackend(async () => {
      const result = await GetTheme()
      if (!result.success || !result.data) {
        return getThemeSnapshot().preference
      }

      return result.data as ThemePreference
    })
  })()
}

export function useTheme() {
  const snapshot = useSyncExternalStore(subscribeToTheme, getSnapshot, getSnapshot)

  useEffect(() => {
    initThemeController()
    ensureThemeHydration()
  }, [])

  const setTheme = useCallback(async (newTheme: Theme) => {
    const previousTheme = getThemeSnapshot().preference
    setThemePreference(newTheme)

    try {
      const result = await SetTheme(newTheme)
      if (!result.success) {
        setThemePreference(previousTheme)
        console.error('Failed to save theme:', result.error)
      }
    } catch (error) {
      setThemePreference(previousTheme)
      console.error('Failed to set theme:', error)
    }
  }, [])

  const setAccent = useCallback(async (color: string | null) => {
    const previous = getAccentOverride()
    setAccentOverride(color)

    try {
      const result = await SetAccent(color ?? '')
      if (!result.success) {
        setAccentOverride(previous)
        console.error('Failed to save accent:', result.error)
      }
    } catch (error) {
      setAccentOverride(previous)
      console.error('Failed to set accent:', error)
    }
  }, [])

  return {
    accent: snapshot.accent,
    accentApplies: snapshot.accentApplies,
    setAccent,
    theme: snapshot.preference,
    effectiveTheme: snapshot.resolved,
    themeBase: snapshot.base,
    customThemes: snapshot.customThemes,
    systemTheme: getSystemTheme(),
    setTheme,
    isLoading: false,
  }
}
