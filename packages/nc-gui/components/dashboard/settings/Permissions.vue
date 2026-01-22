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

const { getMeta } = useMetas()
const fieldPermissionsOpen = ref(false)
const fieldPermissionsLoading = ref(false)
const fieldPermissionsTable = ref<TableType | null>(null)
const fieldPermissionsMeta = ref<TableType | null>(null)

const fieldColumns = computed(() => {
  return (fieldPermissionsMeta.value?.columns || []).filter((c: any) => c?.id)
})

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
const selectedSourceId = ref<string>('')
const pageSize = ref<number>(50)

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
  const key = `msg.permissions.permissionOptions.${opt.toLowerCase()}`
  const translated = t(key)
  if (translated !== key) return translated

  const fallbackKey = `objects.permissions.permissionOptions.${opt.toLowerCase()}`
  const fallbackTranslated = t(fallbackKey)
  if (fallbackTranslated !== fallbackKey) return fallbackTranslated

  return getPermissionLabel(opt)
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
    if (!selectedSourceId.value) {
      selectedSourceId.value = tableGroups.value[0]?.sourceId || ''
    } else if (!tableGroups.value.some((g) => g.sourceId === selectedSourceId.value)) {
      selectedSourceId.value = tableGroups.value[0]?.sourceId || ''
    }
  },
  { immediate: true },
)

const activeGroup = computed(() => {
  return tableGroups.value.find((g) => g.sourceId === selectedSourceId.value) || tableGroups.value[0]
})

function permissionKey(entity: PermissionEntity, entityId: string, permission: PermissionKey) {
  return `${entity}:${entityId}:${permission}`
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

function getPlaceholder(permission: PermissionKey) {
  switch (permission) {
    case PermissionKey.TABLE_VISIBILITY:
      return t('placeholder.selectUsersToView')
    case PermissionKey.TABLE_RECORD_ADD:
      return t('placeholder.selectUsersToCreate')
    case PermissionKey.RECORD_FIELD_EDIT:
      return t('placeholder.selectUsersToEdit')
    case PermissionKey.TABLE_RECORD_DELETE:
      return t('placeholder.selectUsersToDelete')
    default:
      return t('placeholder.selectUsers')
  }
}

function getPermissionRecord(entity: PermissionEntity, entityId: string, permission: PermissionKey) {
  return permissions.value.find((p) => p.entity === entity && p.entity_id === entityId && p.permission === permission)
}

function currentValue(entity: PermissionEntity, entityId: string, permission: PermissionKey) {
  const key = permissionKey(entity, entityId, permission)
  if (edited.value[key]) return edited.value[key].value
  return optionFromPermissionRecord(permission, getPermissionRecord(entity, entityId, permission))
}

function currentUserIds(entity: PermissionEntity, entityId: string, permission: PermissionKey) {
  const key = permissionKey(entity, entityId, permission)
  if (edited.value[key]?.userIds) return edited.value[key].userIds
  const record = getPermissionRecord(entity, entityId, permission)
  return (record?.subjects || [])
    .filter((s) => s.type === 'user')
    .map((s) => s.id)
}

function setEditedValue(entity: PermissionEntity, entityId: string, permission: PermissionKey, value: PermissionOptionValue) {
  const key = permissionKey(entity, entityId, permission)
  edited.value[key] = {
    value,
    userIds: value === PermissionOptionValue.SPECIFIC_USERS ? currentUserIds(entity, entityId, permission) : [],
  }
}

function setEditedUserIds(entity: PermissionEntity, entityId: string, permission: PermissionKey, userIds: string[]) {
  const key = permissionKey(entity, entityId, permission)
  edited.value[key] = {
    value: PermissionOptionValue.SPECIFIC_USERS,
    userIds,
  }
}

async function openFieldPermissions(table: TableType) {
  fieldPermissionsTable.value = table
  fieldPermissionsOpen.value = true
  try {
    fieldPermissionsLoading.value = true
    fieldPermissionsMeta.value = await getMeta(props.baseId, table.id!, true)
  } finally {
    fieldPermissionsLoading.value = false
  }
}

const batchEditOpen = ref(false)
const batchEditState = ref<
  Record<
    string,
    {
      checked: boolean
      value: PermissionOptionValue
      userIds: string[]
    }
  >
>({})

function openBatchEdit() {
  batchEditOpen.value = true
  // Reset state
  batchEditState.value = {}
  for (const col of permissionColumns) {
    batchEditState.value[col.key] = {
      checked: false,
      value: col.defaultValue,
      userIds: [],
    }
  }
}

function applyBatchEdit() {
  const tablesToUpdate = activeGroup.value.filteredTables || []
  if (!tablesToUpdate.length) return

  let hasChanges = false

  for (const col of permissionColumns) {
    const setting = batchEditState.value[col.key]
    if (!setting || !setting.checked) continue

    hasChanges = true
    for (const table of tablesToUpdate) {
      if (setting.value === PermissionOptionValue.SPECIFIC_USERS) {
        setEditedUserIds(PermissionEntity.TABLE, table.id!, col.key, setting.userIds)
      } else {
        setEditedValue(PermissionEntity.TABLE, table.id!, col.key, setting.value)
      }
    }
  }

  if (hasChanges) {
    message.success(t('msg.success.batchUpdated'))
  }
  batchEditOpen.value = false
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

    const perms = await $api.instance.get(`/api/v1/db/meta/projects/${props.baseId}/permissions`)
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
    const [entity, entityId, permission] = k.split(':')
    return {
      entity,
      entityId,
      permission,
      value: v.value,
      userIds: v.userIds,
    }
  })

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
    {
      key: 'field_permissions',
      title: `${t('objects.fields')} ${t('general.permissions')}`,
      width: 140,
      minWidth: 140,
      padding: '0px 12px',
      align: 'center',
    },
  ] as NcTableColumnProps[]
})
</script>

<template>
  <div class="h-full w-full flex flex-col min-h-0 bg-nc-bg-default">
    <div class="flex items-center justify-between p-4 border-b border-nc-border-gray-medium bg-nc-bg-default">
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

    <div class="flex flex-1 min-h-0">
      <!-- Left Sidebar: Data Sources -->
      <div class="w-64 border-r border-nc-border-gray-medium bg-nc-bg-gray-extralight flex flex-col">
        <div class="p-3 text-xs font-semibold text-nc-content-gray-subtle uppercase tracking-wider">
          {{ $t('labels.dataSources') }}
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-1">
          <div
            v-for="g in tableGroups"
            :key="g.sourceId"
            class="group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm transition-colors"
            :class="[
              selectedSourceId === g.sourceId
                ? 'bg-primary-selected text-primary font-medium'
                : 'text-nc-content-gray hover:bg-nc-bg-gray-light',
            ]"
            @click="selectedSourceId = g.sourceId"
          >
            <div class="flex items-center gap-2 min-w-0">
              <GeneralBaseLogo
                v-if="g.iconColor"
                :color="g.iconColor"
                class="flex-none w-4 h-4"
              />
              <GeneralBaseLogo v-else class="flex-none w-4 h-4" />
              <span class="truncate">{{ g.title }}</span>
            </div>
            <span
              class="text-xs flex-none"
              :class="selectedSourceId === g.sourceId ? 'text-primary' : 'text-nc-content-gray-subtle'"
            >
              {{ g.total }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right Content: Table -->
      <div class="flex-1 flex flex-col min-w-0 bg-nc-bg-default">
        <div class="p-4 border-b border-nc-border-gray-medium flex items-center justify-between gap-4">
          <a-input
            v-model:value="searchInput"
            :placeholder="$t('placeholder.searchModels')"
            allow-clear
            class="nc-acl-search !w-[320px] nc-input-sm"
          >
            <template #prefix>
              <component :is="iconMap.search" class="text-nc-content-gray-subtle2" />
            </template>
          </a-input>

          <div class="text-sm text-nc-content-gray-subtle">
            {{ activeGroup?.filtered || 0 }} / {{ activeGroup?.total || 0 }} {{ $t('objects.tables') }}
          </div>
          <NcButton size="small" type="secondary" class="!rounded-lg !px-3" @click="openBatchEdit">
             <div class="flex items-center gap-2">
                <GeneralIcon icon="ncEdit" class="w-4 h-4" />
                <span>{{ $t('general.batchEdit') }}</span>
             </div>
          </NcButton>
        </div>

        <div class="flex-1 overflow-hidden p-4">
          <div v-if="activeGroup" class="h-full rounded-lg border border-nc-border-gray-medium bg-nc-bg-default flex flex-col">
            <NcTable
              :columns="columns"
              :data="activeGroup.filteredTables"
              :loading="isLoading"
              class="nc-acl-table flex-1"
              size="small"
              row-key="id"
              row-height="auto"
              header-row-height="44px"
              :pagination="true"
              :pagination-offset="pageSize"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'table'">
                  <div class="flex items-center gap-3 max-w-full py-1">
                    <div class="min-w-6 flex items-center justify-center">
                      <GeneralTableIcon size="small" :meta="{ meta: {}, synced: record?.synced }" class="text-nc-content-gray-muted" />
                    </div>
                    <div class="flex flex-col min-w-0 gap-0.5 w-full">
                      <NcTooltip class="truncate font-medium text-gray-900 dark:text-gray-100 text-sm" show-on-truncate-only>
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

                <template v-else-if="column.key === 'field_permissions'">
                  <div class="flex items-center justify-center">
                    <NcButton size="xsmall" type="secondary" class="!px-2" @click.stop="openFieldPermissions(record)">
                      <div class="flex items-center gap-1">
                        <GeneralIcon icon="ncLock" class="w-3 h-3" />
                        <span class="text-xs">{{ $t('general.configure') }}</span>
                      </div>
                    </NcButton>
                  </div>
                </template>

                <template v-else>
                  <div class="flex flex-col gap-2 py-1">
                    <a-select
                      class="w-full"
                      size="small"
                      :value="currentValue(PermissionEntity.TABLE, record.id, column.key)"
                      :dropdown-match-select-width="false"
                      @update:value="(v) => setEditedValue(PermissionEntity.TABLE, record.id, column.key, v)"
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
                      v-if="currentValue(PermissionEntity.TABLE, record.id, column.key) === PermissionOptionValue.SPECIFIC_USERS"
                      mode="multiple"
                      size="small"
                      class="w-full"
                      :loading="baseUsersLoading"
                      :value="currentUserIds(PermissionEntity.TABLE, record.id, column.key)"
                      :placeholder="getPlaceholder(column.key)"
                      :dropdown-match-select-width="false"
                      @update:value="(v) => setEditedUserIds(PermissionEntity.TABLE, record.id, column.key, v)"
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

          <div v-else class="flex items-center justify-center h-full text-nc-content-gray-subtle">
            {{ $t('general.noData') }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <a-modal
    v-model:visible="fieldPermissionsOpen"
    width="820px"
    :footer="null"
    @cancel="fieldPermissionsOpen = false"
  >
    <template #title>
      <div class="text-gray-900 dark:text-gray-100">
        {{ `${fieldPermissionsTable?.title || ''} - ${$t('objects.fields')}${$t('general.permissions')}` }}
      </div>
    </template>
    <div class="flex items-center justify-end pb-3">
      <NcButton type="primary" size="small" class="!rounded-lg !px-2" :loading="isSaving" @click="save">
        <div class="flex flex-row items-center w-full gap-x-1">
          <component :is="iconMap.save" />
          <div class="flex">{{ $t('general.save') }}</div>
        </div>
      </NcButton>
    </div>

    <div v-if="fieldPermissionsLoading" class="py-8 flex items-center justify-center text-nc-content-gray-subtle">
      {{ $t('general.loading') }}
    </div>
    <div v-else class="flex flex-col gap-3">
      <div v-if="!fieldColumns.length" class="py-6 text-nc-content-gray-subtle">
        {{ $t('general.noData') }}
      </div>
      <div v-for="col in fieldColumns" :key="col.id" class="flex items-start gap-3">
        <div class="min-w-0 flex-1">
          <div class="truncate font-medium text-nc-content-gray">{{ col.title }}</div>
          <div class="truncate text-xs text-nc-content-gray-subtle">{{ col.column_name }}</div>
        </div>
        <div class="w-[260px] flex flex-col gap-2">
          <a-select
            class="w-full"
            size="small"
            :value="currentValue(PermissionEntity.FIELD, col.id, PermissionKey.RECORD_FIELD_EDIT)"
            @update:value="(v) => setEditedValue(PermissionEntity.FIELD, col.id, PermissionKey.RECORD_FIELD_EDIT, v)"
          >
            <a-select-option
              v-for="opt of permissionColumns.find((c) => c.key === PermissionKey.RECORD_FIELD_EDIT)?.options || []"
              :key="opt"
              :value="opt"
            >
              {{ permissionOptionLabel(opt) }}
            </a-select-option>
          </a-select>

          <a-select
            v-if="currentValue(PermissionEntity.FIELD, col.id, PermissionKey.RECORD_FIELD_EDIT) === PermissionOptionValue.SPECIFIC_USERS"
            mode="multiple"
            size="small"
            class="w-full"
            :loading="baseUsersLoading"
            :value="currentUserIds(PermissionEntity.FIELD, col.id, PermissionKey.RECORD_FIELD_EDIT)"
            :placeholder="getPlaceholder(PermissionKey.RECORD_FIELD_EDIT)"
            @update:value="(v) => setEditedUserIds(PermissionEntity.FIELD, col.id, PermissionKey.RECORD_FIELD_EDIT, v)"
          >
            <a-select-option v-for="u of baseUsers" :key="u.id" :value="u.id">
              {{ u.email || u.display_name || u.id }}
            </a-select-option>
          </a-select>
        </div>
      </div>
    </div>
  </a-modal>

  <a-modal
    v-model:visible="batchEditOpen"
    width="600px"
    :title="$t('general.batchEdit')"
    @ok="applyBatchEdit"
    @cancel="batchEditOpen = false"
  >
    <div class="flex flex-col gap-4 py-4">
      <div class="text-sm text-nc-content-gray-subtle mb-2">
         {{ $t('msg.batchEditDescription') }}
      </div>
      
      <div v-for="col in permissionColumns" :key="col.key" class="flex items-start gap-4 p-3 border rounded-md border-nc-border-gray-medium">
        <a-checkbox v-model:checked="batchEditState[col.key].checked" class="mt-1.5" />
        
        <div class="flex-1 min-w-0 flex flex-col gap-2" :class="{ 'opacity-50 pointer-events-none': !batchEditState[col.key].checked }">
           <div class="font-medium text-nc-content-gray">{{ col.title }}</div>
           
           <a-select
              class="w-full"
              size="small"
              v-model:value="batchEditState[col.key].value"
              :dropdown-match-select-width="false"
            >
              <a-select-option
                v-for="opt of col.options || []"
                :key="opt"
                :value="opt"
              >
                {{ permissionOptionLabel(opt) }}
              </a-select-option>
            </a-select>

            <a-select
              v-if="batchEditState[col.key].value === PermissionOptionValue.SPECIFIC_USERS"
              mode="multiple"
              size="small"
              class="w-full"
              :loading="baseUsersLoading"
              v-model:value="batchEditState[col.key].userIds"
              :placeholder="getPlaceholder(col.key)"
              :dropdown-match-select-width="false"
            >
              <a-select-option v-for="u of baseUsers" :key="u.id" :value="u.id">
                {{ u.email || u.display_name || u.id }}
              </a-select-option>
            </a-select>
        </div>
      </div>
    </div>
  </a-modal>
</template>
