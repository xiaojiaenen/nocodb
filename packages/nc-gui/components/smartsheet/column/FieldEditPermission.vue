<script setup lang="ts">
import {
  PermissionEntity,
  PermissionGrantedType,
  PermissionKey,
  PermissionRole,
} from 'nocodb-sdk'

const props = defineProps<{
  baseId: string
  columnId: string
  disabled?: boolean
}>()

const { t } = useI18n()
const { $api } = useNuxtApp()
const basesStore = useBases()

const { loadPermissions } = usePermissions()

const isLoading = ref(false)
const baseUsersLoading = ref(false)
const baseUsers = ref<any[]>([])

type Mode = 'inherit' | 'nobody' | 'role' | 'user'

const mode = ref<Mode>('inherit')
const grantedRole = ref<PermissionRole>(PermissionRole.EDITOR)
const userIds = ref<string[]>([])
const enforceForForm = ref(true)
const enforceForAutomation = ref(true)

const initialSnapshot = ref<string>('')

const isDirty = computed(() => {
  const snapshot = JSON.stringify({
    mode: mode.value,
    grantedRole: grantedRole.value,
    userIds: userIds.value.slice().sort(),
    enforceForForm: enforceForForm.value,
    enforceForAutomation: enforceForAutomation.value,
  })
  return initialSnapshot.value !== snapshot
})

function setInitialSnapshot() {
  initialSnapshot.value = JSON.stringify({
    mode: mode.value,
    grantedRole: grantedRole.value,
    userIds: userIds.value.slice().sort(),
    enforceForForm: enforceForForm.value,
    enforceForAutomation: enforceForAutomation.value,
  })
}

async function loadUsers() {
  if (!props.baseId) return
  try {
    baseUsersLoading.value = true
    const { users } = await basesStore.getBaseUsers({ baseId: props.baseId, force: true })
    baseUsers.value = users || []
  } finally {
    baseUsersLoading.value = false
  }
}

async function reload() {
  if (!props.baseId || !props.columnId) return
  try {
    isLoading.value = true
    const res = await $api.instance.get(
      `/api/v2/meta/bases/${props.baseId}/permissions/${PermissionEntity.FIELD}/${props.columnId}/${PermissionKey.RECORD_FIELD_EDIT}`,
    )
    const record = res.data
    if (!record) {
      mode.value = 'inherit'
      grantedRole.value = PermissionRole.EDITOR
      userIds.value = []
      enforceForForm.value = true
      enforceForAutomation.value = true
      setInitialSnapshot()
      return
    }

    const grantedType = record.granted_type as PermissionGrantedType | string
    enforceForForm.value = record.enforce_for_form !== false
    enforceForAutomation.value = record.enforce_for_automation !== false

    if (grantedType === PermissionGrantedType.NOBODY || grantedType === 'no_one') {
      mode.value = 'nobody'
      userIds.value = []
    } else if (grantedType === PermissionGrantedType.ROLE || grantedType === 'role') {
      mode.value = 'role'
      grantedRole.value = (record.granted_role as PermissionRole) || PermissionRole.EDITOR
      userIds.value = []
    } else if (grantedType === PermissionGrantedType.USER || grantedType === 'user') {
      mode.value = 'user'
      const subjects = Array.isArray(record.subjects) ? record.subjects : []
      userIds.value = subjects.filter((s) => s?.type === 'user' && s?.id).map((s) => s.id)
    } else {
      mode.value = 'inherit'
      userIds.value = []
    }

    setInitialSnapshot()
  } catch {
    mode.value = 'inherit'
    setInitialSnapshot()
  } finally {
    isLoading.value = false
  }
}

async function saveIfNeeded() {
  if (!props.baseId || !props.columnId) return true
  if (props.disabled) return true
  if (!isDirty.value) return true

  const url = `/api/v2/meta/bases/${props.baseId}/permissions/${PermissionEntity.FIELD}/${props.columnId}/${PermissionKey.RECORD_FIELD_EDIT}`

  try {
    isLoading.value = true

    if (mode.value === 'inherit') {
      await $api.instance.delete(url)
      await loadPermissions({ force: true })
      await reload()
      return true
    }

    if (mode.value === 'nobody') {
      await $api.instance.put(url, {
        granted_type: PermissionGrantedType.NOBODY,
        enforce_for_form: enforceForForm.value,
        enforce_for_automation: enforceForAutomation.value,
      })
      await loadPermissions({ force: true })
      await reload()
      return true
    }

    if (mode.value === 'role') {
      await $api.instance.put(url, {
        granted_type: PermissionGrantedType.ROLE,
        granted_role: grantedRole.value,
        enforce_for_form: enforceForForm.value,
        enforce_for_automation: enforceForAutomation.value,
      })
      await loadPermissions({ force: true })
      await reload()
      return true
    }

    await $api.instance.put(url, {
      granted_type: PermissionGrantedType.USER,
      subjects: userIds.value.map((id) => ({ type: 'user', id })),
      enforce_for_form: enforceForForm.value,
      enforce_for_automation: enforceForAutomation.value,
    })
    await loadPermissions({ force: true })
    await reload()
    return true
  } catch (e: any) {
    message.error(await extractSdkResponseErrorMsg(e))
    return false
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.baseId,
  async () => {
    userIds.value = []
    await loadUsers()
  },
  { immediate: true },
)

watch(
  () => props.columnId,
  async () => {
    await reload()
  },
  { immediate: true },
)

watch(
  mode,
  async (m) => {
    if (m === 'user' && !baseUsers.value.length) await loadUsers()
  },
  { immediate: true },
)

defineExpose({ reload, saveIfNeeded, isDirty })
</script>

<template>
  <div class="p-4 border-[0.1px] rounded-lg border-grey w-full flex flex-col gap-3">
    <div class="flex items-center justify-between gap-2">
      <div class="text-[13px] text-nc-content-gray font-medium">
        {{ t('objects.field') }}{{ t('general.permissions') }}
      </div>
      <NcButton size="xsmall" type="primary" :disabled="disabled || !isDirty" :loading="isLoading" @click="saveIfNeeded">
        {{ t('general.save') }}
      </NcButton>
    </div>

    <div class="flex flex-col gap-2">
      <a-select v-model:value="mode" size="small" class="w-full" :disabled="disabled || isLoading">
        <a-select-option value="inherit">{{ t('general.default') }}</a-select-option>
        <a-select-option value="role">{{ t('objects.role') }}</a-select-option>
        <a-select-option value="user">{{ t('objects.user') }}</a-select-option>
        <a-select-option value="nobody">{{ t('general.noAccess') }}</a-select-option>
      </a-select>

      <a-select
        v-if="mode === 'role'"
        v-model:value="grantedRole"
        size="small"
        class="w-full"
        :disabled="disabled || isLoading"
      >
        <a-select-option :value="PermissionRole.VIEWER">{{ t('objects.roleType.viewer') }}</a-select-option>
        <a-select-option :value="PermissionRole.COMMENTER">{{ t('objects.roleType.commenter') }}</a-select-option>
        <a-select-option :value="PermissionRole.EDITOR">{{ t('objects.roleType.editor') }}</a-select-option>
        <a-select-option :value="PermissionRole.CREATOR">{{ t('objects.roleType.creator') }}</a-select-option>
        <a-select-option :value="PermissionRole.OWNER">{{ t('objects.roleType.owner') }}</a-select-option>
      </a-select>

      <a-select
        v-if="mode === 'user'"
        v-model:value="userIds"
        mode="multiple"
        size="small"
        class="w-full"
        :loading="baseUsersLoading"
        :disabled="disabled || isLoading"
        :placeholder="t('placeholder.selectUsers')"
      >
        <a-select-option v-for="u of baseUsers" :key="u.id" :value="u.id">
          {{ u.email || u.display_name || u.id }}
        </a-select-option>
      </a-select>

      <div class="flex items-center gap-4">
        <a-checkbox v-model:checked="enforceForForm" :disabled="disabled || isLoading">{{ t('objects.viewType.form') }}</a-checkbox>
        <a-checkbox v-model:checked="enforceForAutomation" :disabled="disabled || isLoading">{{ t('general.automation') }}</a-checkbox>
      </div>
    </div>
  </div>
</template>
