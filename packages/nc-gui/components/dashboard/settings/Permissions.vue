<script setup lang="ts">
import {
  PermissionEntity,
  PermissionGrantedType,
  PermissionKey,
  PermissionOptionValue,
  PermissionRole,
  getPermissionLabel,
  type TableType,
} from 'nocodb-sdk'
import { getSourceIconColor } from '~/utils/treeviewUtils'

interface Props {
  state: string
  baseId: string
  reload?: boolean
}

const props = defineProps<Props>()

defineEmits(['update:state', 'update:reload'])

const { t } = useI18n()
const { api } = useApi()
const { $api } = useNuxtApp()
const { includeM2M } = useGlobal()
const basesStore = useBases()
const { bases } = storeToRefs(basesStore)

const base = computed(() => bases.value.get(props.baseId) ?? {})

const isLoading = ref(false)
const isSaving = ref(false)

const tables = ref<TableType[]>([])
const permissions = ref<any[]>([])

const searchInput = ref('')

const baseUsers = ref<any[]>([])
const baseUsersLoading = ref(false)

const edited = ref<
  Record<
    string,
    {
      value: PermissionOptionValue
      userIds?: string[]
    }
  >
>({})

const activeKey = ref<string[]>([])

const permissionColumns = [
  {
    key: PermissionKey.TABLE_VISIBILITY,
    title: t('general.visibility'),
    defaultValue: PermissionOptionValue.EVERYONE,
    options: [
      PermissionOptionValue.EVERYONE,
      PermissionOptionValue.VIEWERS_AND_UP,
      PermissionOptionValue.COMMENTERS_AND_UP,
      PermissionOptionValue.EDITORS_AND_UP,
      PermissionOptionValue.CREATORS_AND_UP,
      PermissionOptionValue.SPECIFIC_USERS,
    ],
  },
  {
    key: PermissionKey.TABLE_RECORD_ADD,
    title: t('general.create'),
    defaultValue: PermissionOptionValue.EDITORS_AND_UP,
    options: [
      PermissionOptionValue.EDITORS_AND_UP,
      PermissionOptionValue.CREATORS_AND_UP,
      PermissionOptionValue.EVERYONE,
      PermissionOptionValue.SPECIFIC_USERS,
      PermissionOptionValue.NOBODY,
    ],
  },
  {
    key: PermissionKey.RECORD_FIELD_EDIT,
    title: t('general.edit'),
    defaultValue: PermissionOptionValue.EDITORS_AND_UP,
    options: [
      PermissionOptionValue.EDITORS_AND_UP,
      PermissionOptionValue.CREATORS_AND_UP,
      PermissionOptionValue.EVERYONE,
      PermissionOptionValue.SPECIFIC_USERS,
      PermissionOptionValue.NOBODY,
    ],
  },
  {
    key: PermissionKey.TABLE_RECORD_DELETE,
    title: t('general.delete'),
    defaultValue: PermissionOptionValue.EDITORS_AND_UP,
    options: [
      PermissionOptionValue.EDITORS_AND_UP,
      PermissionOptionValue.CREATORS_AND_UP,
      PermissionOptionValue.EVERYONE,
      PermissionOptionValue.SPECIFIC_USERS,
      PermissionOptionValue.NOBODY,
    ],
  },
] as const

function permissionOptionLabel(opt: PermissionOptionValue) {
  const key = `objects.permissions.permissionOptions.${opt}`
  const translated = t(key)
  return translated === key ? getPermissionLabel(opt) : translated
}

function matchesSearch(table: TableType, q: string) {
  if (!q) return true
  const title = (table.title || '').toLowerCase()
  const tableName = ((table as any).table_name || '').toLowerCase()
  return title.includes(q) || tableName.includes(q)
}

const tableGroups = computed(() => {
  const sources = (((base.value as any)?.sources || []) as any[]).filter((s) => s && s.enabled !== false)
  const q = searchInput.value.trim().toLowerCase()

  const sourceIdsInOrder = sources.map((s) => s.id).filter(Boolean)
  const defaultSourceId = sourceIdsInOrder[0]

  const buckets = new Map<string, TableType[]>()
  const bucketKeyForTable = (table: TableType) => ((table as any).source_id as string | undefined) || defaultSourceId || 'unknown'

  for (const table of tables.value) {
    const k = bucketKeyForTable(table)
    const list = buckets.get(k)
    if (list) list.push(table)
    else buckets.set(k, [table])
  }

  const groups: Array<{
    key: string
    sourceId: string
    title: string
    iconColor?: string
    total: number
    filtered: number
    tables: TableType[]
    filteredTables: TableType[]
  }> = []

  const pushGroup = (sourceId: string, title: string, iconColor?: string, isDefault?: boolean) => {
    const list = buckets.get(sourceId) || []
    if (!list.length) return
    const filteredTables = q ? list.filter((t) => matchesSearch(t, q)) : list
    groups.push({
      key: isDefault ? 'default' : `collapse-${sourceId}`,
      sourceId,
      title,
      iconColor,
      total: list.length,
      filtered: filteredTables.length,
      tables: list,
      filteredTables,
    })
  }

  if (defaultSourceId) {
    pushGroup(defaultSourceId, t('general.default'), getSourceIconColor(sources[0]), true)
  }

  for (const source of sources.slice(1)) {
    if (!source?.id) continue
    pushGroup(source.id, source.alias || source.id, getSourceIconColor(source))
  }

  for (const [sourceId] of buckets.entries()) {
    if (sourceId === defaultSourceId) continue
    if (sourceIdsInOrder.includes(sourceId)) continue
    pushGroup(sourceId, sourceId)
  }

  return groups
})

watch(
  () => tableGroups.value.map((g) => g.sourceId).join(','),
  () => {
    if (activeKey.value.length) return
    activeKey.value = tableGroups.value.filter((g) => g.key !== 'default').map((g) => g.key)
  },
  { immediate: true },
)

function permissionKey(tableId: string, permission: PermissionKey) {
  return `${PermissionEntity.TABLE}:${tableId}:${permission}`
}

function optionFromPermissionRecord(permission: PermissionKey, record?: any): PermissionOptionValue {
  if (!record) {
    const col = permissionColumns.find((c) => c.key === permission)
    return col?.defaultValue ?? PermissionOptionValue.EDITORS_AND_UP
  }

  if (record.granted_type === PermissionGrantedType.NOBODY) return PermissionOptionValue.NOBODY
  if (record.granted_type === PermissionGrantedType.USER) return PermissionOptionValue.SPECIFIC_USERS

  const role = record.granted_role as PermissionRole
  if (permission !== PermissionKey.TABLE_VISIBILITY && role === PermissionRole.VIEWER) {
    return PermissionOptionValue.EVERYONE
  }

  if (role === PermissionRole.VIEWER) return PermissionOptionValue.VIEWERS_AND_UP
  if (role === PermissionRole.COMMENTER) return PermissionOptionValue.COMMENTERS_AND_UP
  if (role === PermissionRole.EDITOR) return PermissionOptionValue.EDITORS_AND_UP
  if (role === PermissionRole.CREATOR) return PermissionOptionValue.CREATORS_AND_UP

  return PermissionOptionValue.EDITORS_AND_UP
}

function getPermissionRecord(tableId: string, permission: PermissionKey) {
  return permissions.value.find(
    (p) => p.entity === PermissionEntity.TABLE && p.entity_id === tableId && p.permission === permission,
  )
}

function currentValue(tableId: string, permission: PermissionKey) {
  const key = permissionKey(tableId, permission)
  if (edited.value[key]) return edited.value[key].value
  return optionFromPermissionRecord(permission, getPermissionRecord(tableId, permission))
}

function currentUserIds(tableId: string, permission: PermissionKey) {
  const key = permissionKey(tableId, permission)
  if (edited.value[key]?.userIds) return edited.value[key].userIds
  const record = getPermissionRecord(tableId, permission)
  return (record?.subjects || [])
    .filter((s) => s.type === 'user')
    .map((s) => s.id)
}

function setEditedValue(tableId: string, permission: PermissionKey, value: PermissionOptionValue) {
  const key = permissionKey(tableId, permission)
  edited.value[key] = {
    value,
    userIds: value === PermissionOptionValue.SPECIFIC_USERS ? currentUserIds(tableId, permission) : [],
  }
}

function setEditedUserIds(tableId: string, permission: PermissionKey, userIds: string[]) {
  const key = permissionKey(tableId, permission)
  edited.value[key] = {
    value: PermissionOptionValue.SPECIFIC_USERS,
    userIds,
  }
}

const filteredTables = computed(() => {
  const q = searchInput.value.trim().toLowerCase()
  if (!q) return tables.value
  return tables.value.filter((t) => matchesSearch(t, q))
})

async function loadUsers() {
  try {
    baseUsersLoading.value = true
    const { users } = await basesStore.getBaseUsers({ baseId: props.baseId, force: true })
    baseUsers.value = users || []
  } finally {
    baseUsersLoading.value = false
  }
}

async function loadData() {
  try {
    isLoading.value = true
    const res: any = await api.dbTable.list(props.baseId, {
      includeM2M: includeM2M.value,
    })
    tables.value = res.list || []

    const perms = await $api.instance.get(`/api/v1/db/meta/projects/${props.baseId}/permissions`, {
      params: { entity: PermissionEntity.TABLE },
    })
    permissions.value = perms.data || []
  } catch (e: any) {
    message.error(await extractSdkResponseErrorMsg(e))
  } finally {
    isLoading.value = false
  }
}

async function reload() {
  await Promise.all([loadUsers(), loadData()])
}

async function save() {
  const items = Object.entries(edited.value).map(([k, v]) => {
    const [, entityId, permission] = k.split(':')
    return {
      entity: PermissionEntity.TABLE,
      entityId,
      permission,
      value: v.value,
      userIds: v.userIds,
    }
  })

  for (const item of items) {
    if (
      item.value === PermissionOptionValue.SPECIFIC_USERS &&
      (!item.userIds || item.userIds.length === 0)
    ) {
      const table = tables.value.find((t) => t.id === item.entityId)
      const tableName = table ? table.title || (table as any).table_name : item.entityId
      message.error(`${tableName}: ${t('error.someOfTheRequiredFieldsAreEmpty')}`)
      return
    }
  }

  if (!items.length) {
    message.info(t('msg.info.noChanges'))
    return
  }

  try {
    isSaving.value = true
    await $api.instance.post(`/api/v1/db/meta/projects/${props.baseId}/permissions`, items)
    edited.value = {}
    await loadData()
    message.success(t('msg.success.updated'))
  } catch (e: any) {
    message.error(await extractSdkResponseErrorMsg(e))
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadUsers(), loadData()])
})

const columns = computed(() => {
  return [
    {
      key: 'table',
      title: t('labels.tableName'),
      minWidth: 240,
      padding: '0px 12px',
      dataIndex: 'title',
    },
    ...permissionColumns.map((c) => ({
      key: c.key,
      title: c.title,
      width: 220,
      minWidth: 220,
      padding: '0px 12px',
    })),
  ] as NcTableColumnProps[]
})
</script>

<template>
  <div class="h-full w-full flex flex-col p-6 gap-4 min-h-0 overflow-auto">
    <div class="flex items-center justify-between">
      <div class="text-lg font-semibold text-nc-content-gray">{{ $t('general.permissions') }}</div>
      <div class="flex items-center gap-2">
        <NcButton type="text" size="small" class="!rounded-md" @click="reload">
          <div class="flex items-center gap-2 text-nc-content-gray-subtle2 font-light">
            <component
              :is="iconMap.reload"
              :class="{ 'animate-infinite animate-spin !text-success': isLoading || baseUsersLoading }"
            />
            {{ $t('general.reload') }}
          </div>
        </NcButton>
        <NcButton type="primary" size="small" class="!rounded-lg !px-2" :loading="isSaving" @click="save">
          <div class="flex flex-row items-center w-full gap-x-1">
            <component :is="iconMap.save" />
            <div class="flex">{{ $t('general.save') }}</div>
          </div>
        </NcButton>
      </div>
    </div>

    <div class="flex items-center gap-2 justify-between">
      <a-input
        v-model:value="searchInput"
        :placeholder="$t('placeholder.searchModels')"
        allow-clear
        class="nc-acl-search nc-input-border-on-value !w-[420px] nc-input-sm"
      >
        <template #prefix>
          <component :is="iconMap.search" class="text-nc-content-gray-subtle2" />
        </template>
      </a-input>
      <div class="text-nc-content-gray-subtle text-sm">
        {{ filteredTables.length }} / {{ tables.length }}
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <template v-if="tableGroups.length">
        <div class="rounded-lg border-1 border-nc-border-gray-medium bg-nc-bg-default overflow-hidden">
          <div class="flex items-center justify-between px-3 py-2 bg-nc-bg-gray-extralight">
            <div class="flex items-center gap-2 text-nc-content-gray">
              <GeneralBaseLogo class="flex-none min-w-4 w-4 text-sm" />
              <div class="font-semibold">{{ tableGroups[0].title }}</div>
            </div>
            <div class="text-xs text-nc-content-gray-subtle">
              {{ tableGroups[0].filtered }} / {{ tableGroups[0].total }}
            </div>
          </div>
          <NcTable
            :columns="columns"
            :data="tableGroups[0].filteredTables"
            :loading="isLoading"
            class="nc-acl-table"
            size="small"
            row-key="id"
            row-height="44px"
            header-row-height="44px"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'table'">
                <div class="flex items-center gap-2 max-w-full">
                  <div class="min-w-5 flex items-center justify-center">
                    <GeneralTableIcon size="xsmall" :meta="{ meta: {}, synced: record?.synced }" class="text-nc-content-gray-muted" />
                  </div>
                  <div class="flex flex-col min-w-0">
                    <NcTooltip class="truncate font-medium text-nc-content-gray" show-on-truncate-only>
                      <template #title>{{ record.title }}</template>
                      {{ record.title }}
                    </NcTooltip>
                    <NcTooltip class="truncate text-xs text-nc-content-gray-subtle" show-on-truncate-only>
                      <template #title>{{ record.table_name }}</template>
                      {{ record.table_name }}
                    </NcTooltip>
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="flex flex-col gap-2">
                  <a-select
                    class="w-full"
                    size="small"
                    :value="currentValue(record.id, column.key)"
                    @update:value="(v) => setEditedValue(record.id, column.key, v)"
                  >
                    <a-select-option
                      v-for="opt of permissionColumns.find((c) => c.key === column.key)?.options || []"
                      :key="opt"
                      :value="opt"
                    >
                      {{ permissionOptionLabel(opt) }}
                    </a-select-option>
                  </a-select>

                  <a-select
                    v-if="currentValue(record.id, column.key) === PermissionOptionValue.SPECIFIC_USERS"
                    mode="multiple"
                    size="small"
                    class="w-full"
                    :loading="baseUsersLoading"
                    :value="currentUserIds(record.id, column.key)"
                    :placeholder="$t('placeholder.selectUsers')"
                    @update:value="(v) => setEditedUserIds(record.id, column.key, v)"
                  >
                    <a-select-option v-for="u of baseUsers" :key="u.id" :value="u.id">
                      {{ u.email || u.display_name || u.id }}
                    </a-select-option>
                  </a-select>
                </div>
              </template>
            </template>
          </NcTable>
        </div>

        <a-collapse
          v-if="tableGroups.length > 1"
          v-model:active-key="activeKey"
          class="!mx-0 !px-0"
          expand-icon-position="right"
          :bordered="false"
          ghost
        >
          <a-collapse-panel v-for="g of tableGroups.slice(1)" :key="g.key">
            <template #header>
              <div class="w-full flex items-center justify-between pr-2">
                <div class="flex items-center gap-2 min-w-0">
                  <GeneralBaseLogo
                    v-if="g.iconColor"
                    :color="g.iconColor"
                    class="flex-none min-w-4 w-4 text-sm"
                  />
                  <GeneralBaseLogo v-else class="flex-none min-w-4 w-4 text-sm" />
                  <NcTooltip class="truncate font-semibold text-nc-content-gray" show-on-truncate-only>
                    <template #title>{{ g.title }}</template>
                    {{ g.title }}
                  </NcTooltip>
                </div>
                <div class="text-xs text-nc-content-gray-subtle flex-none">
                  {{ g.filtered }} / {{ g.total }}
                </div>
              </div>
            </template>

            <div class="rounded-lg border-1 border-nc-border-gray-medium bg-nc-bg-default overflow-hidden">
              <NcTable
                :columns="columns"
                :data="g.filteredTables"
                :loading="isLoading"
                class="nc-acl-table"
                size="small"
                row-key="id"
                row-height="44px"
                header-row-height="44px"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'table'">
                    <div class="flex items-center gap-2 max-w-full">
                      <div class="min-w-5 flex items-center justify-center">
                        <GeneralTableIcon
                          size="xsmall"
                          :meta="{ meta: {}, synced: record?.synced }"
                          class="text-nc-content-gray-muted"
                        />
                      </div>
                      <div class="flex flex-col min-w-0">
                        <NcTooltip class="truncate font-medium text-nc-content-gray" show-on-truncate-only>
                          <template #title>{{ record.title }}</template>
                          {{ record.title }}
                        </NcTooltip>
                        <NcTooltip class="truncate text-xs text-nc-content-gray-subtle" show-on-truncate-only>
                          <template #title>{{ record.table_name }}</template>
                          {{ record.table_name }}
                        </NcTooltip>
                      </div>
                    </div>
                  </template>

                  <template v-else>
                    <div class="flex flex-col gap-2">
                      <a-select
                        class="w-full"
                        size="small"
                        :value="currentValue(record.id, column.key)"
                        @update:value="(v) => setEditedValue(record.id, column.key, v)"
                      >
                        <a-select-option
                          v-for="opt of permissionColumns.find((c) => c.key === column.key)?.options || []"
                          :key="opt"
                          :value="opt"
                        >
                          {{ permissionOptionLabel(opt) }}
                        </a-select-option>
                      </a-select>

                      <a-select
                        v-if="currentValue(record.id, column.key) === PermissionOptionValue.SPECIFIC_USERS"
                        mode="multiple"
                        size="small"
                        class="w-full"
                        :loading="baseUsersLoading"
                        :value="currentUserIds(record.id, column.key)"
                        :placeholder="$t('placeholder.selectUsers')"
                        @update:value="(v) => setEditedUserIds(record.id, column.key, v)"
                      >
                        <a-select-option v-for="u of baseUsers" :key="u.id" :value="u.id">
                          {{ u.email || u.display_name || u.id }}
                        </a-select-option>
                      </a-select>
                    </div>
                  </template>
                </template>
              </NcTable>
            </div>
          </a-collapse-panel>
        </a-collapse>
      </template>
      <div v-else class="flex items-center justify-center py-10 text-nc-content-gray-subtle">
        {{ $t('general.noData') }}
      </div>
    </div>
  </div>
</template>
