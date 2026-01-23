<script setup lang="ts">
interface Props {
  value: boolean
  token: MCPTokenExtendedType
  showRegenerateButton?: boolean
  showWorkspaceBaseInfo?: boolean
  isAccountLevel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showRegenerateButton: true,
  showWorkspaceBaseInfo: false,
  isAccountLevel: false,
})

const emits = defineEmits(['close', 'update:value', 'update:token'])

const modalVisible = useVModel(props, 'value')

const { appInfo } = useGlobal()

const { openedProject } = storeToRefs(useBases())

const token = useVModel(props, 'token')

const supportedDocs: SupportedDocsType[] = []

const { updateMcpToken } = useMcpSettings()

const regenerateToken = async () => {
  const newToken = await updateMcpToken(token.value, props.isAccountLevel)
  if (newToken) {
    token.value = newToken
  }
}

const closeModal = () => {
  emits('close')
  modalVisible.value = false
}

const activeTab = ref<'claude' | 'cursor' | 'windsurf' | 'antigravity'>('claude')

const serverName = computed(() => {
  let title = ''

  if (props.showWorkspaceBaseInfo) {
    title = isEeUI
      ? `星澜 ${token.value.workspace?.title || 'Workspace'} - ${token.value.base?.title || 'Base'}`
      : `星澜 - ${token.value.base?.title || 'Base'}`
  } else {
    title = `星澜 Base - ${openedProject.value?.title}`
  }

  if (activeTab.value === 'antigravity') {
    title = title.replaceAll(' ', '_').replaceAll('-', '')
  }

  return title
})

const code = computed(
  () => `
{
  "mcpServers": {
    "${serverName.value}": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "${appInfo.value.ncSiteUrl}/mcp/${token.value.id}",
        "--header",
        "xc-mcp-token: ${token.value?.token ?? 'xxxxxxxxxxxxxxxxxxxxxxxxxxx'}"
      ]
    }
  }
}
`,
)
</script>

<template>
  <NcModal v-model:visible="modalVisible" :show-separator="true" size="large" wrap-class-name="nc-modal-mcp-token-create-edit">
    <template #header>
      <div class="flex w-full items-center p-2 justify-between">
        <div class="flex items-center gap-3 pl-1 flex-1">
          <GeneralIcon class="text-nc-content-gray-emphasis h-5 w-5" icon="mcp" />
          <span class="text-nc-content-gray-emphasis truncate font-semibold text-xl">
            {{ token.title }}
          </span>
        </div>

        <div class="flex justify-end items-center gap-3 pr-0.5 flex-1">
          <NcButton type="text" size="small" data-testid="nc-close-webhook-modal" @click.stop="closeModal">
            <GeneralIcon icon="close" />
          </NcButton>
        </div>
      </div>
    </template>
    <div class="flex bg-nc-bg-default rounded-b-2xl h-[calc(100%_-_66px)]">
      <div
        ref="containerElem"
        class="h-full flex-1 flex flex-col overflow-y-auto scroll-smooth nc-scrollbar-thin px-24 py-6 mx-auto"
      >
        <div class="flex flex-col max-w-[640px] w-full mx-auto gap-3">
          <div class="text-nc-content-gray font-bold leading-6">
            {{ $t('labels.mcpSetup') }}
          </div>

          <!-- Workspace/Base Info (for account-level view) -->
          <div v-if="showWorkspaceBaseInfo" class="flex flex-col gap-2 p-4 bg-nc-bg-gray-extralight rounded-lg">
            <div v-if="isEeUI" class="flex items-center gap-2">
              <span class="text-sm font-semibold text-nc-content-gray-subtle">{{ $t('objects.workspace') }}:</span>
              <span class="text-sm text-nc-content-gray-subtle2">{{ token.workspace?.title || '-' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-nc-content-gray-subtle">{{ $t('objects.project') }}:</span>
              <span class="text-sm text-nc-content-gray-subtle2">{{ token.base?.title || '-' }}</span>
            </div>
          </div>

          <NcAlert type="info" class="mt-3 max-w-[640px] w-full mx-auto">
            <template #message>
              {{ $t('labels.mcpTokenVisibilityInfo') }}
            </template>
            <template #description>
              {{ $t('labels.mcpTokenVisibilityInfoDescription') }} <br />
              {{ $t('labels.mcpTokenVisibilityInfoDescription2') }}
            </template>
          </NcAlert>
          <NcTabs v-model:active-key="activeTab">
            <a-tab-pane key="claude" class="!h-full">
              <template #tab>
                <span
                  :class="{
                    'text-nc-content-brand font-medium': activeTab === 'claude',
                    'text-nc-content-gray-subtle': activeTab !== 'claude',
                  }"
                  class="text-sm"
                >
                  Claude
                </span>
              </template>
              <div class="relative flex flex-col leading-6 text-nc-content-gray-subtle2 gap-3 my-3">
                只需 3 个简单的步骤，即可开始在 Claude Desktop 中使用 星澜 MCP

                <ol class="list-decimal pl-5">
                  <li>从导航栏进入 Claude Desktop 设置。</li>
                  <li>转到 Develop 选项卡，然后点击 “Edit Config”。</li>
                  <li>将创建令牌后提供的 JSON 配置添加到 claude_desktop_config.json 中。</li>
                </ol>

                <NcButton
                  v-if="showRegenerateButton"
                  type="secondary"
                  class="w-39"
                  size="small"
                  :loading="token.loading"
                  @click="regenerateToken(token)"
                >
                  {{ $t('labels.regenerateToken') }}
                </NcButton>

                <DashboardSettingsBaseMCPCode :key="code" :code="code" />
              </div>
            </a-tab-pane>
            <a-tab-pane key="cursor" class="!h-full">
              <template #tab>
                <span
                  :class="{
                    'text-nc-content-brand font-medium': activeTab === 'cursor',
                    'text-nc-content-gray-subtle': activeTab !== 'cursor',
                  }"
                  class="text-sm"
                >
                  Cursor
                </span>
              </template>
              <div class="relative flex flex-col leading-6 text-nc-content-gray-subtle2 gap-3 my-3">
                只需 3 个简单的步骤，即可开始在 Cursor 中使用 星澜 MCP

                <ol class="list-decimal pl-5">
                  <li>打开 Cursor 设置（按 Shift+Cmd+J）。</li>
                  <li>选择 "MCP" 选项卡并点击 "Add Custom MCP"。</li>
                  <li>添加创建令牌后提供的 JSON 配置。</li>
                </ol>

                <NcButton
                  v-if="showRegenerateButton"
                  type="secondary"
                  class="w-44"
                  size="small"
                  :loading="token.loading"
                  @click="regenerateToken(token)"
                >
                  {{ $t('labels.regenerateToken') }}
                </NcButton>
                <DashboardSettingsBaseMCPCode :key="code" :code="code" />
              </div>
            </a-tab-pane>
            <a-tab-pane key="windsurf" class="!h-full">
              <template #tab>
                <span
                  :class="{
                    'text-nc-content-brand font-medium': activeTab === 'windsurf',
                    'text-nc-content-gray-subtle': activeTab !== 'windsurf',
                  }"
                  class="text-sm"
                >
                  Windsurf
                </span>
              </template>
              <div class="relative flex flex-col leading-6 text-nc-content-gray-subtle2 gap-3 my-3">
                只需 4 个简单的步骤，即可开始在 Windsurf 中使用 星澜 MCP

                <ol class="list-decimal pl-5">
                  <li>进入 Windsurf 设置并在左侧栏选择 Cascade 选项卡。</li>
                  <li>点击 Manage MCP。</li>
                  <li>现在点击 View raw config。</li>
                  <li>将创建令牌后提供的 JSON 配置粘贴到打开的文件中。</li>
                </ol>

                <NcButton
                  v-if="showRegenerateButton"
                  type="secondary"
                  class="w-44"
                  size="small"
                  :loading="token.loading"
                  @click="regenerateToken(token)"
                >
                  {{ $t('labels.regenerateToken') }}
                </NcButton>

                <DashboardSettingsBaseMCPCode :code="code" />
              </div>
            </a-tab-pane>
            <a-tab-pane key="antigravity" class="!h-full">
              <template #tab>
                <span
                  :class="{
                    'text-nc-content-brand font-medium': activeTab === 'antigravity',
                    'text-nc-content-gray-subtle': activeTab !== 'antigravity',
                  }"
                  class="text-sm"
                >
                  AntiGravity
                </span>
              </template>
              <div class="relative flex flex-col leading-6 text-nc-content-gray-subtle2 gap-3 my-3">
                只需 4 个简单的步骤，即可开始在 AntiGravity 中使用 星澜 MCP

                <ol class="list-decimal pl-5">
                  <li>点击代理窗口右上角的三个点，然后点击 "MCP Servers"。</li>
                  <li>点击 Manage MCP Servers。</li>
                  <li>现在点击 View raw config。</li>
                  <li>将创建令牌后提供的 JSON 配置粘贴到打开的文件中。</li>
                </ol>

                <NcButton
                  v-if="showRegenerateButton"
                  type="secondary"
                  class="w-44"
                  size="small"
                  :loading="token.loading"
                  @click="regenerateToken(token)"
                >
                  {{ $t('labels.regenerateToken') }}
                </NcButton>

                <DashboardSettingsBaseMCPCode :code="code" />
              </div>
            </a-tab-pane>
          </NcTabs>
        </div>
      </div>

    </div>
  </NcModal>
</template>

<style lang="scss">
.nc-modal-mcp-token-create-edit {
  z-index: 1050;
  a {
    @apply !no-underline !text-nc-content-gray-subtle !hover:text-primary;
  }
  .nc-modal {
    @apply !p-0;
    height: min(calc(100vh - 100px), 1024px);
    max-height: min(calc(100vh - 100px), 1024px) !important;
  }

  .nc-modal-header {
    @apply !mb-0 !pb-0;
  }

  .ant-tabs-nav {
    @apply !pl-0;
  }

  .ant-tabs-tab {
    @apply pt-1 pb-1.5;
  }
}
</style>
