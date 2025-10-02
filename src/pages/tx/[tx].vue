<template>
    <div class="min-h-screen bg-gray-50 py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900">Transaction Details</h1>
                <p class="mt-2 text-gray-600">Transaction ID: {{ txId }}</p>
            </div>

            <div v-if="loading" class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>

            <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">Error loading transaction</h3>
                        <p class="mt-2 text-sm text-red-700">{{ error }}</p>
                    </div>
                </div>
            </div>

            <div v-else-if="transaction"
                class="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800">
                <SteemTransaction v-if="transaction.steemTransaction" :tx="transaction.steemTransaction" />

                <div class="grid md:grid-cols-2">
                    <MeerayTransaction :tx="transaction.meerayTransaction" :blockData="transaction.blockData" />
                    <BlockDetails :block="transaction.block" :steemBlock="steemBlock" />
                </div>
            </div>

            <div v-else class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-yellow-800">Transaction not found</h3>
                        <p class="mt-2 text-sm text-yellow-700">The requested transaction could not be found or loaded.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useApiService } from '../../composables/useApiService'
import { useDsteemClient } from '../../composables/useDsteemClient'
import MeerayTransaction from '../../components/MeerayTransaction.vue'
import SteemTransaction from '../../components/SteemTransaction.vue'
import BlockDetails from '../../components/BlockDetails.vue'

const route = useRoute()
const api = useApiService()
const dsteemClient = useDsteemClient()

const txId = computed(() => route.params.tx)
const loading = ref(true)
const error = ref(null)
const transaction = ref(null)
const steemBlock = ref(null)

const loadTransaction = async () => {
    loading.value = true
    error.value = null
    transaction.value = null
    steemBlock.value = null
    try {
        const id = txId.value
        if (!id) {
            error.value = 'No transaction id'
            return
        }

        const res = await api.getTransaction(id)
        if (res?.success && res.block) {
            const block = res.block
            const meerayTx = Array.isArray(block.txs) ? block.txs.find(t => t.hash === id) : null

            let steemTx = null
            if (block?.steemBlockNum && meerayTx?.ref) {
                try {
                    const sblock = await dsteemClient.database.getBlock(block.steemBlockNum)
                    steemBlock.value = sblock
                    const parts = String(meerayTx.ref).split(':')
                    const idx = parts.length > 1 ? parseInt(parts[1]) : undefined
                    if (!Number.isNaN(idx) && sblock?.transactions) steemTx = sblock.transactions[idx]
                } catch (e) {
                    // non-fatal: steem block lookup failed
                    console.warn('failed to fetch steem block', e)
                }
            }

            const blockData = {
                blockNum: block.blockNum,
                blockHash: block.hash,
                witness: block.witness,
                steemBlockNum: block.steemBlockNum,
                steemBlockTimestamp: block.steemBlockTimestamp,
                timestamp: block.timestamp,
                signature: block.signature,
                dist: block.dist,
                sync: block.sync
            }

            transaction.value = { meerayTransaction: meerayTx, steemTransaction: steemTx, blockData, block }
        } else {
            error.value = 'Transaction not found'
        }
    } catch (e) {
        error.value = e?.message || String(e)
    } finally {
        loading.value = false
    }
}

onMounted(loadTransaction)
</script>

<style scoped>
.break-all {
    word-break: break-all
}
</style>
