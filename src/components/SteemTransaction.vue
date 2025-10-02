<template>
  <div>
    <div class="p-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">Steem Transaction</h3>
      </div>

      <div class="mt-4 grid grid-cols-5 md:grid-cols-5 gap-4">
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-500">Transaction ID</label>
          <p class="mt-1 text-sm font-mono text-gray-900 break-all">{{ tx.transaction_id }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-500">Block Number</label>
          <p class="mt-1 text-sm text-gray-900">{{ tx.block_num?.toLocaleString() }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-500">Expiration</label>
          <p class="mt-1 text-sm text-gray-900">{{ tx.expiration }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-500">Operations</label>
          <p class="mt-1 text-sm text-gray-900">{{ tx.operations?.length || 0 }}</p>
        </div>
      </div>
      <div class="mt-4 border-t pt-4">
        <h4 class="text-sm font-medium text-gray-600 mb-2">Operations</h4>
        <div class="space-y-3">
          <div v-for="(operation, i) in tx.operations" :key="i">
            <div class="flex items-start justify-between">
              <div>
                <span
                  class="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-indigo-100 text-indigo-800">{{
                    operation[0] }}</span>
              </div>
              <div class="text-sm text-gray-500">{{ operation[1].required_auths?.join(', ') }}</div>
            </div>

            <div class="mt-2 text-sm text-gray-800">
              <div class="mt-4 grid grid-cols-3 md:grid-cols-3 gap-4">
                <div v-if="operation[1].id"><strong>ID:</strong> {{ operation[1].id }}</div>
                <div v-if="operation[1].required_auths">
                  <strong>Required Auths:</strong>
                  {{ prettyJSON(operation[1].required_auths[0]) }}
                </div>
                <div v-if="operation[1].required_posting_auths">
                  <strong>Required Posting Auths:</strong>
                  {{ prettyJSON(operation[1].required_posting_auths[0]) }}
                </div>
              </div>

              <div v-if="operation[1].json">
                <strong>JSON:</strong>
                <pre
                  class="text-xs whitespace-pre-wrap mt-1 bg-white border rounded p-2">{{ prettyJSON(operation[1].json) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
    <div class="flex justify-center mt-6">
      <div
        class="inline-flex items-center justify-center w-full bg-gradient-to-br from-primary-300 to-primary-700">
        <svg class="w-8 h-8 text-white animate-bounce mt-2" viewBox="0 0 24 24" fill="none"
          xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ tx: { type: Object, required: true } })

const prettyJSON = (s) => {
  try { return JSON.stringify(JSON.parse(s), null, 2) } catch (e) { return s }
}
</script>
