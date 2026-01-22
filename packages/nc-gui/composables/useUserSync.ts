export interface UserObject {
  id?: string
  email?: string
  display_name?: string
}

export const useUserSync = createSharedComposable(() => {
  const { user } = useGlobal()
  const currentUser = ref<UserObject | null>(null)
  currentUser.value = user.value
  watch(
    () => user.value,
    (newUser) => {
      currentUser.value = newUser
    },
    { deep: true },
  )

  return {
    currentUser: readonly(currentUser),
  }
})
