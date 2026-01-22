<script lang="ts" setup>
const isMiniSidebar = inject(IsMiniSidebarInj, undefined)

const { appInfo } = useGlobal()
</script>

<template>
  <div v-if="isMiniSidebar" class="nc-mini-sidebar-btn-full-width">
    <div data-testid="nc-workspace-menu" class="nc-workspace-menu nc-mini-sidebar-ws-item">
      <nuxt-link to="/">
        <NcTooltip :disabled="!appInfo?.version || isEeUI" placement="right" hide-on-click>
          <template #title>{{ appInfo?.version }}</template>
          <img
            alt="星澜 (XingLan)"
            src="~/assets/img/brand/logo.svg"
            class="flex-none border-1 border-nc-border-gray-medium rounded-md"
            width="32"
            height="32"
          />
        </NcTooltip>
      </nuxt-link>
    </div>
  </div>
  <div v-else class="flex flex-row flex-grow pl-0.5 pr-1 py-0.5 rounded-md w-full" style="max-width: calc(100% - 2.5rem)">
    <div class="flex-grow min-w-20">
      <div
        data-testid="nc-workspace-menu"
        class="flex items-center nc-workspace-menu overflow-hidden py-1.25 pr-0.25 justify-center w-full ml-2"
      >
        <a
          class="transition-all duration-200 transform w-24 min-w-10"
          @click.prevent="navigateTo('/')"
        >
          <NcTooltip :disabled="!appInfo?.version || isEeUI">
            <template #title>{{ appInfo?.version }}</template>
            <img alt="星澜 (XingLan)" src="~/assets/img/brand/full-logo.svg" />
          </NcTooltip>
        </a>
        <div class="flex flex-grow"></div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.nc-workspace-menu-item {
  @apply flex items-center pl-2 py-2 gap-2 text-sm hover:text-nc-content-gray-extreme;
}
</style>
