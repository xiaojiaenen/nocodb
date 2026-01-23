<script lang="ts" setup>
interface Props {
  size?: number
  animate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 90,
  animate: false,
})

const { size, animate } = toRefs(props)

const ping = autoResetRef(false, 1000)

const onClick = useThrottleFn(() => {
  ping.value = true
}, 1000)
</script>

<template>
  <div
    :style="{ left: `calc(50% - ${size / 2}px)`, top: `-${size / 2}px` }"
    class="color-transition absolute rounded-lg pt-1 pl-1 -ml-1"
    @click="onClick"
  >
    <img
      v-else
      src="~/assets/img/brand/logo.svg"
      :style="{ width: `${size}px`, height: `${size}px` }"
      alt="星澜"
    />
  </div>
</template>
