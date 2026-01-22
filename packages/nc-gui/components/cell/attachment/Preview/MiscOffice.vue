<script setup lang="ts">
interface Props {
  src: string[]
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="props.class" class="flex flex-col text-white gap-2 items-center justify-center">
    <GeneralIcon class="w-28 h-28" icon="pdfFile" />
  </div>
</template>
