<template>
  <div>
    <div class="p-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">Meeray Transaction</h3>
        <span class="text-sm text-gray-500">Type {{ TxTypes[tx.type] }}</span>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-500">Hash</label>
          <p class="mt-1 text-sm font-mono text-gray-900 break-all">{{ tx.hash }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-500">Sender</label>
          <p class="mt-1 text-sm text-gray-900">{{ tx.sender }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-500">Timestamp</label>
          <p class="mt-1 text-sm text-gray-900">{{ formatTimestamp(tx.ts) }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-500">Reference</label>
          <p class="mt-1 text-sm font-mono text-gray-900">{{ tx.ref }}</p>
        </div>
      </div>

      <div>

        <div v-if="tx.data && typeof tx.data === 'object'">
          <strong>Payload:</strong>
          <pre class="text-xs whitespace-pre-wrap mt-1 bg-white border rounded p-2">{{ prettyJSON(tx.data) }}</pre>
        </div>
      </div>
      <div v-if="blockData" class="mt-4 border-t pt-4">
        <h4 class="text-sm font-medium text-gray-600">Block Context</h4>
        <div class="mt-2 text-sm text-gray-800">
          <div><strong>Block:</strong> {{ blockData.blockNum }}</div>
          <div><strong>Witness:</strong> {{ blockData.witness }}</div>
          <div><strong>Hash:</strong> <span class="font-mono">{{ blockData.blockHash }}</span></div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import moment from 'moment'
import { TxTypes } from '../types/transactions'
const props = defineProps({
  tx: { type: Object, required: true },
  blockData: { type: Object, required: false }
})

const formatTimestamp = (ts) => ts ? moment(ts).format('YYYY-MM-DD HH:mm:ss UTC') : '-'

const prettyJSON = (s) => {
  try { return JSON.stringify(JSON.parse(s), null, 2) } catch (e) { return s }
}
</script>

<style scoped>
.break-all {
  word-break: break-all;
}
</style>