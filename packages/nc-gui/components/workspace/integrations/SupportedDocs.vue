<script lang="ts" setup>
const { activeIntegrationItem } = useIntegrationStore()

const supportedDocs = computed(() => {
  return [] as {
    title: string
    href: string
  }[]
})
</script>

<template>
  <NcModalSupportedDocs v-if="supportedDocs.length" :docs="supportedDocs">
    <template #title> {{ $t('title.relevantDocumentation') }} </template>
  </NcModalSupportedDocs>
</template>
