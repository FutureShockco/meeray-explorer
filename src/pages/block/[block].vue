<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Block Details</h1>
        <p class="mt-2 text-gray-600">Block: {{ $route.params.block }}</p>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>

      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error loading block</h3>
            <p class="mt-2 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="block" class="space-y-6">
        <BlockDetails :block="block" :steemBlock="steemBlock">
          <!-- keep default tx-actions slot -->
        </BlockDetails>
      </div>

      <div v-else class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">Block not found</h3>
            <p class="mt-2 text-sm text-yellow-700">The requested block could not be found or loaded.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useApiService } from '../../composables/useApiService'
import { useDsteemClient } from '../../composables/useDsteemClient'
import moment from 'moment'
import BlockDetails from '../../components/BlockDetails.vue'

const api = useApiService()
const dsteemClient = useDsteemClient()
const route = useRoute()

const loading = ref(true)
const error = ref(null)
const block = ref(null)
const steemBlock = ref(null)

const formatTimestamp = (timestamp) => {
  return moment(timestamp).format('YYYY-MM-DD HH:mm:ss UTC')
}

const loadBlock = async () => {
  try {
    loading.value = true
    const blk = route.params.block
    if (!blk) {
      error.value = 'No block specified'
      return
    }

    let data
    if (/^\d+$/.test(blk)) {
      data = await api.getBlockByHeight(parseInt(blk))
    } else {
      data = await api.getBlockByHash(blk)
    }

    console.log('Block data', data)

    if (data?.success && data?.block) {
      block.value = data.block
      // fetch steem block
      try {
        const sblock = await dsteemClient.database.getBlock(block.value.steemBlockNum)
        steemBlock.value = sblock
      } catch (e) {
        console.warn('Failed to fetch steem block', e)
      }
    } else if (data?.blockNum) {
      // getLatestBlock returns a Block interface directly
      block.value = data
      try {
        const sblock = await dsteemClient.database.getBlock(block.value.steemBlockNum)
        steemBlock.value = sblock
      } catch (e) {
        console.warn('Failed to fetch steem block', e)
      }
    } else {
      error.value = 'Block not found'
    }

  } catch (err) {
    console.error(err)
    error.value = err.message || 'Failed to load block'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBlock()
})
</script>

<style scoped>
.break-all {
  word-break: break-all;
}
</style>
