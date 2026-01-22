export default defineNuxtPlugin((nuxtApp) => {
  const tele = {
    emit(_event: string, _data: any) {},
  }

  nuxtApp.vueApp.directive('e', {})
  nuxtApp.provide('tele', tele)
  nuxtApp.provide('e', (_event: string, _data?: Record<string, any>, _rootProps?: Record<string, any>) => {})
})
