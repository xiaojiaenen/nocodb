export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('report', (_error: Error) => {})
})
