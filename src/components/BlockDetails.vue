<script setup>
import moment from 'moment'
import { TxTypes } from '../types/transactions'

const props = defineProps({
    block: {
        type: Object,
        required: true
    },
    steemBlock: {
        type: Object,
        required: false
    }
})

const formatTimestamp = (timestamp) => {
    return timestamp ? moment(timestamp).format('YYYY-MM-DD HH:mm:ss UTC') : '-'
}

const getSteemTimestamp = () => {
    // prefer explicit steemBlockTimestamp on the meeray block, fallback to steemBlock.timestamp (string)
    if (props.block?.steemBlockTimestamp) return props.block.steemBlockTimestamp
    if (props.steemBlock?.timestamp) {
        // try to parse steemBlock.timestamp which is likely an ISO string like '2025-10-02T12:34:56'
        const t = Date.parse(props.steemBlock.timestamp)
        return Number.isNaN(t) ? null : t
    }
    return null
}

const steemDelayMs = (() => {
    try {
        const meerayTs = props.block?.timestamp
        const steemTs = getSteemTimestamp()
        if (!meerayTs || !steemTs) return null
        // both are in ms epoch (ensure numbers)
        const m = typeof meerayTs === 'string' ? parseInt(meerayTs) : meerayTs
        const s = typeof steemTs === 'string' ? parseInt(steemTs) : steemTs
        if (Number.isNaN(m) || Number.isNaN(s)) return null
        return Math.max(0, m - s)
    } catch (e) {
        return null
    }
})()

const steemDelaySeconds = steemDelayMs !== null ? (Math.round((steemDelayMs / 1000) * 100) / 100) : null

onMounted(() => {
    console.log('BlockDetails mounted with block:', props.block);
});
</script>

<style scoped>
.break-all {
    word-break: break-all;
}
</style>

<template>
    <div>
        <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-500">Block Number</label>
                    <p class="mt-1 text-lg font-semibold text-gray-900">{{ block.blockNum?.toLocaleString() }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Witness</label>
                    <p class="mt-1 text-lg text-gray-900">{{ block.witness }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Timestamp</label>
                    <p class="mt-1 text-lg text-gray-900">{{ formatTimestamp(block.timestamp) }}</p>
                </div>
            </div>

            <!-- show delay between Meeray timestamp and Steem timestamp (in ms) -->
            <div v-if="steemDelayMs !== null" class="mt-4">
                <label class="block text-sm font-medium text-gray-500">Steem delay</label>
                <p class="mt-1 text-sm text-gray-900">{{ steemDelayMs }} ms (~{{ steemDelaySeconds }} s)</p>
            </div>

            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-500">Block Hash</label>
                    <p class="mt-1 text-sm font-mono text-gray-900 break-all">{{ block.hash }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Steem Block</label>
                    <p class="mt-1 text-sm text-gray-900">{{ block.steemBlockNum?.toLocaleString() }}</p>
                </div>
            </div>

            <div class="mt-6">
                <label class="block text-sm font-medium text-gray-500">Signature</label>
                <p class="mt-1 text-sm font-mono text-gray-900 break-all">{{ block.signature }}</p>
            </div>

            <div class="mt-6 border-t pt-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Transactions ({{ block.txs?.length || 0 }})</h3>
                <div class="space-y-3">
                    <div v-for="tx in block.txs" :key="tx.hash"
                        class="bg-gray-50 rounded-lg p-4 flex items-start justify-between">
                        <div class="flex-1">
                            <p class="text-sm text-gray-500">Type {{ TxTypes[tx.type] }} • {{ tx.sender }}</p>
                            <p class="text-sm font-mono text-gray-900 break-all">{{ tx.hash }}</p>
                        </div>
                        <div class="flex-shrink-0 ml-4">
                            <slot name="tx-actions" :tx="tx">
                                <router-link :to="`/tx/${tx.hash}`"
                                    class="inline-flex items-center px-3 py-1 rounded-full bg-blue-500 text-white text-sm">View</router-link>
                            </slot>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="steemBlock" class="mt-6 border-t pt-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Corresponding Steem Block</h3>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-500">Block Number</label>
                            <p class="mt-1 text-lg font-semibold text-gray-900">{{
                                steemBlock.block_num?.toLocaleString() }}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">Timestamp</label>
                            <p class="mt-1 text-lg text-gray-900">{{ steemBlock.timestamp }}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">Transactions</label>
                            <p class="mt-1 text-lg text-gray-900">{{ steemBlock.transactions?.length }}</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>
