<script lang="ts" setup>
import type { AttachmentResType } from 'nocodb-sdk'

interface Props {
  bannerImageUrl?: AttachmentResType
}
const { bannerImageUrl } = defineProps<Props>()

const { getPossibleAttachmentSrc } = useAttachment()

const getBannerImageSrc = computed(() => {
  return getPossibleAttachmentSrc(parseProp(bannerImageUrl))
})
</script>

<template>
  <div
    class="nc-form-banner-wrapper w-full mx-auto rounded-2xl overflow-hidden"
    :class="!bannerImageUrl ? 'shadow-sm' : ''"
    :style="{ aspectRatio: 4 / 1 }"
  >
    <LazyCellAttachmentPreviewImage
      v-if="bannerImageUrl"
      :srcs="getBannerImageSrc"
      class="nc-form-banner-image object-cover w-full"
      :is-cell-preview="false"
    />
    <div v-else class="h-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#4F46E5] to-[#06B6D4]">
      <!-- Background Abstract Shapes -->
      <svg class="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 200">
        <defs>
          <linearGradient id="banner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:white;stop-opacity:0.2" />
            <stop offset="100%" style="stop-color:white;stop-opacity:0" />
          </linearGradient>
        </defs>
        <circle cx="0" cy="0" r="150" fill="url(#banner-grad)" />
        <circle cx="800" cy="200" r="200" fill="url(#banner-grad)" />
        <path d="M-100 100 Q 200 0 400 100 T 900 100" stroke="white" stroke-width="2" fill="none" opacity="0.2" />
        <path d="M-100 150 Q 200 50 400 150 T 900 150" stroke="white" stroke-width="1" fill="none" opacity="0.1" />
      </svg>

      <!-- Center Logo Box -->
      <div class="z-10 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl flex items-center justify-center w-20 h-20 md:w-24 md:h-24">
        <img src="~/assets/img/brand/logo.svg" alt="星澜" class="w-full h-full object-contain" />
      </div>

      <!-- Branding Text (Optional, keeping it clean for now) -->
      <div class="absolute bottom-4 right-6 text-white/40 font-medium text-lg tracking-widest pointer-events-none select-none">
        星澜
      </div>
    </div>
  </div>
</template>
