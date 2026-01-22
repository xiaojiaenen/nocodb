<script lang="ts" setup>
const props = defineProps<{
  workspaceId?: string
}>()

const navigateHome = () => {
  navigateTo('/')
}
</script>

<template>
  <div class="flex items-center justify-between w-full border-b-1 border-nc-gray-medium py-2 px-4 h-[56px]">
    <img
      src="~/assets/img/brand/logo.svg"
      alt="星澜 (XingLan)"
      class="w-8 h-8 cursor-pointer"
      @click.stop="navigateHome"
    />
    <DashboardTopbarUserInfo />
  </div>
</template>
