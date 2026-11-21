import { useCallback } from 'react'
import { toast } from 'sonner'
import { DeleteCustomTheme, SaveCustomTheme } from '@wailsjs/go/handlers/SettingsHandler'
import { settings } from '@wailsjs/go/models'

import { useTheme } from '@/hooks/useTheme'
import {
  customThemePreference,
  getCustomThemes,
  getThemeSnapshot,
  setCustomThemes,
  setThemePreference,
  type CustomTheme,
} from '@/themes/controller'
import { t } from "@/i18n"

export type CustomThemeDraft = Omit<CustomTheme, 'id'> & { id?: string }

function upsert(themes: readonly CustomTheme[], theme: CustomTheme): CustomTheme[] {
  const index = themes.findIndex((t) => t.id === theme.id)
  if (index === -1) {
    return [...themes, theme]
  }
  const next = [...themes]
  next[index] = theme
  return next
}

async function persistTheme(draft: CustomThemeDraft): Promise<CustomTheme | null> {
  try {
    const result = await SaveCustomTheme(settings.CustomTheme.createFrom({ ...draft, id: draft.id ?? '' }))
    if (!result.success || !result.data) {
      toast.error(t("settings.appearance.toast.themeSaveFailed"), { description: result.error })
      return null
    }
    const saved = result.data as CustomTheme
    setCustomThemes(upsert(getCustomThemes(), saved))
    return saved
  } catch (error) {
    toast.error(t("settings.appearance.toast.themeSaveFailed"), { description: String(error) })
    return null
  }
}

export function useCustomThemes() {
  const { customThemes, setTheme } = useTheme()

  /** Создаёт или обновляет тему. Новая тема сразу становится активной. */
  const saveTheme = useCallback(async (draft: CustomThemeDraft) => {
    const isNew = !draft.id
    const saved = await persistTheme(draft)
    if (saved && isNew) {
      await setTheme(customThemePreference(saved.id))
    }
    return saved
  }, [setTheme])

  const deleteTheme = useCallback(async (theme: CustomTheme) => {
    const preference = customThemePreference(theme.id)
    const wasActive = getThemeSnapshot().preference === preference

    try {
      const result = await DeleteCustomTheme(theme.id)
      if (!result.success) {
        toast.error(t("settings.appearance.toast.themeDeleteFailed"), { description: result.error })
        return
      }
    } catch (error) {
      toast.error(t("settings.appearance.toast.themeDeleteFailed"), { description: String(error) })
      return
    }

    // Бэкенд уже переключил активную тему на тёмную — синхронизируем UI.
    setCustomThemes(getCustomThemes().filter((t) => t.id !== theme.id))
    if (wasActive) {
      setThemePreference('dark')
    }

    toast(t("settings.appearance.toast.themeDeleted", { name: theme.name }), {
      action: {
        label: t("settings.appearance.toast.undo"),
        onClick: () => {
          void (async () => {
            const restored = await persistTheme(theme)
            if (restored && wasActive) {
              await setTheme(preference)
            }
          })()
        },
      },
    })
  }, [setTheme])

  return { customThemes, saveTheme, deleteTheme }
}
