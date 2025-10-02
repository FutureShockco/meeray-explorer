<template>
  <div class="bg-white shadow rounded-lg overflow-hidden">
    <div class="p-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">Account</h3>
        <span class="text-sm text-gray-500">{{ account.name }}</span>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-500">Created</label>
          <p class="mt-1 text-sm text-gray-900">{{ account.created }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-500">Total Tokens</label>
          <p class="mt-1 text-sm text-gray-900">{{ tokenCount }}</p>
        </div>
      </div>

      <div class="mt-4 border-t pt-4">
        <h4 class="text-sm font-medium text-gray-600 mb-2">Balances</h4>
        <div v-if="balances && Object.keys(balances).length">
          <div v-for="(b, k) in balances" :key="k" class="flex justify-between text-sm py-1">
            <div class="text-gray-500">{{ k }}</div>
            <div class="font-medium text-gray-900">{{ b.amount }}</div>
          </div>
        </div>
        <div v-else class="text-sm text-gray-500">No balances available</div>
      </div>

      <div v-if="account.nfts && Object.keys(account.nfts).length" class="mt-4 border-t pt-4">
        <h4 class="text-sm font-medium text-gray-600 mb-2">NFTs</h4>
        <div class="text-sm text-gray-800">
          <pre class="text-xs whitespace-pre-wrap">{{ JSON.stringify(account.nfts, null, 2) }}</pre>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
const props = defineProps({ account: { type: Object, required: true } })

const balances = props.account.balances || {}
const tokenCount = Object.keys(balances).length
</script>

<style scoped>
pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Courier New', monospace; }
</style>