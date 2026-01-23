<script setup lang="ts">
import type { WelcomeEventType } from 'nocodb-sdk'

const props = defineProps<{
  item: WelcomeEventType
}>()

const item = toRef(props, 'item')
</script>

<template>
  <NotificationItemWrapper :item="item">
    <div>{{ $t('msg.info.welcomeToXingLan') }}</div>
  </NotificationItemWrapper>
</template>
