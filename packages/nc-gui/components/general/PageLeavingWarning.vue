<script lang="ts" setup>
const route = useRoute()

const router = useRouter()

const redirectUrl = computed(() => {
  return (route.query.ncRedirectUrl as string) ?? ''
})

const backUrl = computed(() => {
  return (route.query.ncBackUrl as string) ?? ''
})

if (!redirectUrl.value || !backUrl.value) {
  router.replace('/error/404')
}

const handleRedirect = (proceedToLink = false) => {
  const url = proceedToLink ? redirectUrl.value : backUrl.value

  if (isSameOriginUrl(url, true)) {
    window.history.pushState('object', document.title, url)
    window.location.reload()
  } else {
    window.location.href = url
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 max-w-[420px] mx-auto text-center">
    <div class="flex items-center justify-center bg-primary rounded-lg text-white font-bold w-14 h-14 text-xl">
      星澜
    </div>
    <div class="text-xl font-bold text-nc-content-gray">{{ $t('title.youAreLeavingXingLan') }}</div>
    <div class="text-sm font-weight-500 text-nc-content-gray-subtle2">{{ $t('title.onlyProceedIfYouTrustThisLink') }}</div>
    <a class="text-sm font-weight-500 text-nc-content-gray-subtle" :href="redirectUrl">{{ redirectUrl }}</a>
    <div class="flex items-center gap-3 mt-3">
      <NcButton type="secondary" size="small" @click="handleRedirect(false)">
        {{ $t('general.back') }}
      </NcButton>
      <NcButton size="small" @click="handleRedirect(true)">
        {{ $t('labels.proceedToLink') }}
      </NcButton>
    </div>
  </div>
</template>
