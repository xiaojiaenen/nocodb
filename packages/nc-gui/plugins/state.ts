import { loadLocaleMessages, setI18nLanguage } from '~/plugins/a.i18n'

/**
 * Initialize global state and watches for changes
 *
 * @example
 * ```js
 *
 *
 * const { $state } = useNuxtApp()
 *
 * console.log($state.lang.value) // 'en'
 * ```
 */
const statePlugin = async (_nuxtApp) => {
  const state = useGlobal()

  const { api } = useApi({ useGlobalInstance: true })

  let currentLang = state.lang.value

  /** force simplified Chinese only */
  state.lang.value = currentLang = 'zh-Hans'

  /** force load initial locale messages */
  await loadLocaleMessages(currentLang)

  /** set i18n locale to stored language */
  await setI18nLanguage(currentLang)

  try {
    state.appInfo.value = await api.utils.appInfo()
  } catch (e) {
    console.error(e)
  }
}

export default defineNuxtPlugin(async function (nuxtApp) {
  if (!isEeUI) return await statePlugin(nuxtApp)
})

export { statePlugin }
