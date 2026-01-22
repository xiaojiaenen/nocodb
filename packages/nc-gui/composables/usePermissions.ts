import {
  PermissionEntity,
  PermissionGrantedType,
  PermissionKey,
  PermissionOptionValue,
  PermissionOptions,
  PermissionRoleMap,
  PermissionRolePower,
  getPermissionIcon,
  getPermissionLabel,
  getPermissionOption,
} from 'nocodb-sdk'

// Re-export the interface from SDK for backward compatibility
export type { PermissionOption } from 'nocodb-sdk'

type PermissionRecord = {
  entity: PermissionEntity | string
  entity_id: string
  permission: PermissionKey | string
  granted_type: PermissionGrantedType | string
  granted_role?: string | null
  subjects?: Array<{ type: 'user' | 'team' | string; id: string }>
}

export const usePermissions = createSharedComposable(() => {
  const permissionOptions = PermissionOptions

  const { $api } = useNuxtApp()
  const { user } = useGlobal()

  const injectedBaseId = inject(ProjectIdInj, ref<string>(''))
  const activeBaseId = computed(() => injectedBaseId.value || user.value?.base_id || '')

  const permissions = ref<PermissionRecord[]>([])
  const loadedBaseId = ref<string>('')
  const loading = ref(false)

  const permissionsByEntity = computed<Record<string, PermissionRecord[]>>(() => {
    return permissions.value.reduce((acc, p) => {
      const key = String(p.entity || '')
      const list = acc[key] || []
      list.push(p)
      acc[key] = list
      return acc
    }, {} as Record<string, PermissionRecord[]>)
  })

  function currentUserBaseRole(): string {
    const roles = user.value?.base_roles && Object.keys(user.value.base_roles).length ? user.value.base_roles : user.value?.roles
    const keys = roles ? Object.keys(roles) : []
    const firstTrue = keys.find((k) => (roles as any)?.[k])
    return firstTrue || ''
  }

  function findPermissionRecord(entity: PermissionEntity, entityId: string, permission: PermissionKey) {
    return permissions.value.find((p) => p.entity === entity && p.entity_id === entityId && p.permission === permission)
  }

  async function loadPermissions(options: { force?: boolean } = {}) {
    const baseId = activeBaseId.value
    if (!baseId) return
    if (!options.force && loadedBaseId.value === baseId && permissions.value.length) return

    try {
      loading.value = true
      const res = await $api.instance.get(`/api/v2/meta/bases/${baseId}/permissions`)
      permissions.value = Array.isArray(res.data) ? res.data : []
      loadedBaseId.value = baseId
    } catch {
      permissions.value = []
      loadedBaseId.value = baseId
    } finally {
      loading.value = false
    }
  }

  watch(
    activeBaseId,
    async (next, prev) => {
      if (!next || next === prev) return
      permissions.value = []
      loadedBaseId.value = ''
      await loadPermissions({ force: true })
    },
    { immediate: true },
  )

  const isAllowed = (entity: PermissionEntity, entityId: string, permissionType: PermissionKey) => {
    const record = findPermissionRecord(entity, entityId, permissionType)
    if (!record) return true

    const grantedType = record.granted_type
    if (grantedType === PermissionGrantedType.NOBODY || grantedType === 'no_one') return false

    const userId = user.value?.id
    if (!userId) return true

    if (grantedType === PermissionGrantedType.USER || grantedType === 'user') {
      const subjects = record.subjects || []
      return subjects.some((s) => s.type === 'user' && s.id === userId)
    }

    if (grantedType === PermissionGrantedType.ROLE || grantedType === 'role') {
      const baseRole = currentUserBaseRole()
      const userPermissionRole = (PermissionRoleMap as any)?.[baseRole]
      const requiredRole = record.granted_role
      const userPower = (PermissionRolePower as any)?.[userPermissionRole] ?? 0
      const requiredPower = (PermissionRolePower as any)?.[requiredRole as any] ?? 0
      return userPower >= requiredPower
    }

    return true
  }

  const getPermissionSummary = (_entity: string, _entityId: string, _permissionType: string) => {
    return PermissionOptionValue.EDITORS_AND_UP
  }

  const getPermissionSummaryLabel = (entity: string, entityId: string, permissionType: string) => {
    const internalValue = getPermissionSummary(entity, entityId, permissionType)
    return getPermissionLabel(internalValue)
  }

  const getPermissionColor = () => 'gray'
  const getPermissionTextColor = () => 'text-gray-700'

  return {
    permissionOptions,
    permissionsByEntity,
    getPermissionOption,
    getPermissionLabel,
    getPermissionIcon,
    getPermissionColor,
    getPermissionTextColor,
    getPermissionSummary,
    getPermissionSummaryLabel,
    isAllowed,
    loadPermissions,
    isPermissionsLoading: loading,
  }
})
