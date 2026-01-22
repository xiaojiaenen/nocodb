import { type Ref, computed, reactive, ref } from 'vue'
import type { Row } from '#imports'

export const useVirtualScroll = ({
  totalRows,
  rowHeight,
  gridWrapper,
  cachedRows,
  loadData,
  clearCache,
  chunkStates: externalChunkStates,
}: {
  totalRows: Ref<number>
  rowHeight: Ref<number>
  gridWrapper: Ref<HTMLElement | undefined>
  cachedRows: Ref<Map<number, Row>>
  loadData: (params: any) => Promise<Row[]>
  clearCache: (start: number, end: number) => void
  chunkStates?: Ref<Array<'loading' | 'loaded' | undefined>>
}) => {
  const CHUNK_SIZE = 50
  const BUFFER_SIZE = 100
  const INITIAL_LOAD_SIZE = 100
  const PREFETCH_THRESHOLD = 40
  const debounceDelay = 50

  const chunkStates = externalChunkStates || ref<Array<'loading' | 'loaded' | undefined>>([])
  const rowSlice = reactive({
    start: 0,
    end: 100,
  })

  let debounceTimeout: any = null

  const fetchChunk = async (chunkId: number, isInitialLoad = false) => {
    if (chunkStates.value[chunkId]) return

    const offset = chunkId * CHUNK_SIZE
    const limit = isInitialLoad ? INITIAL_LOAD_SIZE : CHUNK_SIZE

    if (offset >= totalRows.value) return

    chunkStates.value[chunkId] = 'loading'
    if (isInitialLoad) {
      chunkStates.value[chunkId + 1] = 'loading'
    }

    try {
      const newItems = await loadData({ offset, limit })
      newItems.forEach((item) => cachedRows.value.set(item.rowMeta.rowIndex, item))

      chunkStates.value[chunkId] = 'loaded'
      if (isInitialLoad) {
        chunkStates.value[chunkId + 1] = 'loaded'
      }
    } catch (error) {
      console.error(`Error fetching chunk ${chunkId}:`, error)
      chunkStates.value[chunkId] = undefined
      if (isInitialLoad) {
        chunkStates.value[chunkId + 1] = undefined
      }
    }
  }

  const updateVisibleRows = async (fromCalculateSlice = false) => {
    const { start, end } = rowSlice

    const firstChunkId = Math.floor(start / CHUNK_SIZE)
    const lastChunkId = Math.floor((end - 1) / CHUNK_SIZE)

    const chunksToFetch = new Set<number>()

    for (let chunkId = firstChunkId; chunkId <= lastChunkId; chunkId++) {
      if (!chunkStates.value[chunkId]) chunksToFetch.add(chunkId)
    }

    const nextChunkId = lastChunkId + 1
    if (end % CHUNK_SIZE > CHUNK_SIZE - PREFETCH_THRESHOLD && !chunkStates.value[nextChunkId]) {
      chunksToFetch.add(nextChunkId)
    }

    const prevChunkId = firstChunkId - 1
    if (prevChunkId >= 0 && start % CHUNK_SIZE < PREFETCH_THRESHOLD && !chunkStates.value[prevChunkId]) {
      chunksToFetch.add(prevChunkId)
    }

    if (chunksToFetch.size === 0) return

    clearTimeout(debounceTimeout)

    debounceTimeout = setTimeout(
      async () => {
        const isInitialLoad = firstChunkId === 0 && !chunkStates.value[0]

        if (isInitialLoad) {
          await fetchChunk(0, true)
          chunksToFetch.delete(0)
          chunksToFetch.delete(1)
        }

        await Promise.all([...chunksToFetch].map((chunkId) => fetchChunk(chunkId)))

        const bufferStart = Math.max(0, start - BUFFER_SIZE)
        const bufferEnd = Math.min(totalRows.value, end + BUFFER_SIZE)

        clearCache(bufferStart, bufferEnd)
      },
      fromCalculateSlice ? debounceDelay : 25,
    )
  }

  const calculateSlice = () => {
    if (!gridWrapper.value) return

    const { scrollTop, clientHeight } = gridWrapper.value
    const start = Math.floor(scrollTop / rowHeight.value)
    const visibleCount = Math.ceil(clientHeight / rowHeight.value)
    const end = start + visibleCount

    if (start !== rowSlice.start || end !== rowSlice.end) {
      rowSlice.start = start
      rowSlice.end = end
      updateVisibleRows(true)
    }
  }

  const totalMaxPlaceholderRows = computed(() => {
    if (!gridWrapper.value || rowSlice.start <= 1) {
      return 0
    }
    return parseInt(`${gridWrapper.value?.clientHeight / (rowHeight.value || 32)}`) * 3
  })

  const placeholderStartRows = computed(() => {
    const length = rowSlice.start > 1 ? Math.min(rowSlice.start - 1, totalMaxPlaceholderRows.value) : 0
    return {
      length,
      rowHeight: rowHeight.value,
      totalRowHeight: length * rowHeight.value,
    }
  })

  const placeholderEndRows = computed(() => {
    const length =
      rowSlice.end < totalRows.value - 1 ? Math.min(totalRows.value - 1 - rowSlice.end, totalMaxPlaceholderRows.value) : 0
    return {
      length,
      rowHeight: rowHeight.value,
      totalRowHeight: length * rowHeight.value,
    }
  })

  const topOffset = computed(() => {
    return rowHeight.value * (rowSlice.start - placeholderStartRows.value.length)
  })

  return {
    rowSlice,
    chunkStates,
    updateVisibleRows,
    calculateSlice,
    placeholderStartRows,
    placeholderEndRows,
    topOffset,
  }
}
