import type { FormDefinition, IntegrationsType, SyncCategory } from 'nocodb-sdk'
import type { VNode } from '@vue/runtime-dom'
import type { CSSProperties, FunctionalComponent, SVGAttributes } from 'nuxt/dist/app/compat/capi'
import { ClientType, IntegrationCategoryType, SyncDataType } from '#imports'

export const integrationsInitialized = ref(false)
export interface IntegrationItemType {
  title: string
  icon: FunctionalComponent<SVGAttributes, {}, any, {}> | VNode
  sub_type: SyncDataType | ClientType
  type: IntegrationCategoryType | IntegrationsType
  isAvailable?: boolean
  iconStyle?: CSSProperties
  isOssOnly?: boolean
  subtitle?: string
  dynamic?: boolean
  hidden?: boolean
  form?: FormDefinition
  sync_category?: SyncCategory
}

export interface IntegrationCategoryItemType {
  title: string
  subtitle: string
  value: IntegrationCategoryType
  isAvailable?: boolean
  teleEventName?: IntegrationCategoryType
}

export const integrationCategories: IntegrationCategoryItemType[] = [
  {
    title: 'labels.database',
    subtitle: 'objects.integrationCategories.databaseSubtitle',
    value: IntegrationCategoryType.DATABASE,
    isAvailable: true,
  },
  {
    title: 'Auth Provider',
    subtitle: 'Auth',
    value: IntegrationCategoryType.AUTH,
    isAvailable: true,
  },
]

export const allIntegrations: IntegrationItemType[] = [
  // Database
  {
    title: 'objects.syncData.nocodb',
    sub_type: SyncDataType.NOCODB,
    icon: iconMap.nocodbPg,
    type: IntegrationCategoryType.DATABASE,
    isAvailable: true,
    iconStyle: {
      width: '32px',
      height: '32px',
    },
  },
  {
    title: 'objects.syncData.mysql',
    sub_type: ClientType.MYSQL,
    icon: iconMap.mysql,
    type: IntegrationCategoryType.DATABASE,
    isAvailable: true,
    iconStyle: {
      width: '32px',
      height: '32px',
    },
  },
  {
    title: 'objects.syncData.postgreSQL',
    sub_type: ClientType.PG,
    icon: iconMap.postgreSql,
    type: IntegrationCategoryType.DATABASE,
    isAvailable: true,
  },
  {
    title: 'objects.syncData.sqlite',
    sub_type: ClientType.SQLITE,
    icon: iconMap.sqlServer,
    type: IntegrationCategoryType.DATABASE,
    isAvailable: true,
    isOssOnly: true,
  },
]

export const allIntegrationsMapBySubType = allIntegrations.reduce((acc, integration) => {
  acc[integration.sub_type] = integration

  return acc
}, {} as Record<(typeof allIntegrations)[number]['sub_type'], IntegrationItemType>)
