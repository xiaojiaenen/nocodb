import { useStorage } from '@vueuse/core'
import type { JwtPayload } from 'jwt-decode'
import type { AppInfo, State, StoredState } from './types'
import { INITIAL_LEFT_SIDEBAR_WIDTH } from '~/lib/constants'

export function useGlobalState(storageKey = 'nocodb-gui-v2'): State {
  /** todo: reimplement; get the preferred dark mode setting, according to browser settings */
  //   const prefersDarkMode = $(usePreferredDark())
  const prefersDarkMode = false

  /** reactive timestamp to check token expiry against */
  const timestamp = useTimestamp({ immediate: true, interval: 100 })

  const router = useRouter()

  const isSharedBaseOrErdOrView = computed(() => isSharedBaseOrErdOrViewRoute(router.currentRoute.value))

  const preferredLanguage = 'zh-Hans' as const

  const { width } = useWindowSize()
  const isViewPortMobile = () => {
    return width.value < MAX_WIDTH_FOR_MOBILE_MODE
  }

  /** State */
  const initialState: StoredState = {
    token: null,
    lang: preferredLanguage,
    darkMode: prefersDarkMode,
    filterAutoSave: true,
    includeM2M: false,
    showNull: false,
    currentVersion: null,
    latestRelease: null,
    hiddenRelease: null,
    isMobileMode: null,
    lastOpenedWorkspaceId: null,
    gridViewPageSize: 25,
    leftSidebarSize: {
      old: INITIAL_LEFT_SIDEBAR_WIDTH,
      current: INITIAL_LEFT_SIDEBAR_WIDTH,
    },
    isAddNewRecordGridMode: true,
    syncDataUpvotes: [],
    giftBannerDismissedCount: 0,
    isLeftSidebarOpen: !isViewPortMobile(),
    lastUsedAuthMethod: null,
  }

  /** saves a reactive state, any change to these values will write/delete to localStorage */
  const storage = useStorage<StoredState>(storageKey, initialState, localStorage, { mergeDefaults: true })

  /** force turn off of dark mode, regardless of previously stored settings */
  storage.value.darkMode = false

  /** current token ref, used by `useJwt` to reactively parse our token payload */
  /**
   * Token management behavior (read/write rules):
   *
   * Issue:
   * - When opening a Shared Base, ERD, or Shared View in a new tab,
   *   the main application’s auth token from `localStorage` gets reused.
   * - This incorrectly treats the user as authenticated, even though
   *   shared resources must always behave as "guest/readonly" access.
   *
   * Fix:
   * - When we detect that current route is a Shared Base / ERD / Shared View,
   *   we completely avoid reading from or writing to localStorage.
   * - This ensures:
   *    ✅ Shared views always open as guest users
   *    ✅ Real login session in main app remains unaffected
   *    ✅ No accidental privilege escalation when opening links in new tab
   *
   * Result:
   * - Main app uses persistent auth from localStorage
   * - Shared resources use a temporary, isolated token only in memory
   */
  const token = computed({
    get: () => (isSharedBaseOrErdOrView.value ? '' : storage.value.token || ''),
    set: (val) => {
      if (isSharedBaseOrErdOrView.value) return

      storage.value.token = val
    },
  })

  const config = useRuntimeConfig()

  const appInfo = ref<AppInfo>({
    ncSiteUrl: config.public.ncBackendUrl || BASE_FALLBACK_URL,
    authType: 'jwt',
    connectToExternalDB: false,
    defaultLimit: 0,
    firstUser: true,
    githubAuthEnabled: false,
    googleAuthEnabled: false,
    oidcAuthEnabled: false,
    oidcProviderName: null,
    openReplayKey: null,
    samlAuthEnabled: false,
    samlProviderName: null,
    ncMin: false,
    oneClick: false,
    baseHasAdmin: false,
    teleEnabled: true,
    errorReportingEnabled: false,
    auditEnabled: true,
    type: 'nocodb',
    version: '0.0.0',
    ncAttachmentFieldSize: 20,
    ncMaxAttachmentsAllowed: 10,
    isCloud: false,
    automationLogLevel: 'OFF',
    disableEmailAuth: false,
    dashboardPath: '/dashboard',
    inviteOnlySignup: false,
    giftUrl: '',
    isOnPrem: false,
    disableGroupByAggregation: false,
  })

  /** reactive token payload */
  const { payload } = useJwt<JwtPayload & User>(token)

  /** currently running requests */
  const runningRequests = useCounter()

  /** global error */
  const error = ref()

  /** our local user object */
  const user = ref<User | null>(null)

  return {
    ...toRefs(storage.value),
    storage,
    token,
    jwtPayload: payload,
    timestamp,
    runningRequests,
    error,
    user,
    appInfo,
  }
}
