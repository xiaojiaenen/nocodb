<script lang="ts" setup>
const supportedDocs = [] as {
  title: string
  href: string
}[]
</script>

<template>
  <NcModalSupportedDocs v-if="supportedDocs.length" :docs="supportedDocs">
    <template #title>
      {{ $t('title.relevantDocumentation') }}
    </template>
  </NcModalSupportedDocs>
</template>
