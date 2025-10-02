<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useTransactionService } from '../composables/useTransactionService';
import { useTokenListStore } from '../stores/useTokenList';
import { useApiService } from '../composables/useApiService';

const { getUserCount, getLatestBlock } = useApiService();
const userCount = ref(0);
const latestBlock = ref<any | null>(null);
const lastBlockSeenAt = ref<number | null>(null)

// kafka notifier
const txService = useTransactionService()
const isKafkaConnected = txService.isConnected

// compute last kafka event time and elapsed ms
const lastKafkaEventAt = computed<number | null>(() => {
  try {
    const logComputed = txService.kafkaEventLog
    const log = (logComputed && typeof logComputed === 'object' && 'value' in logComputed) ? logComputed.value : (txService.getKafkaEventLog ? txService.getKafkaEventLog() : [])
    if (!Array.isArray(log) || log.length === 0) return null
    // kafkaEventLog items have receivedAt ISO string or parsed.timestamp
    const first = log[0]
    const raw = first.receivedAt || first.parsed?.timestamp || first.timestamp || null
    if (!raw) return null
    const parsed = Date.parse(raw)
    return Number.isNaN(parsed) ? null : parsed
  } catch (e) {
    return null
  }
})

const timeSinceLastKafkaMs = computed(() => {
  if (!lastKafkaEventAt.value) return Infinity
  return Date.now() - lastKafkaEventAt.value
})
const appDescription = 'MeeRay is a modular sidechain for Steem, written in TypeScript (ESM), using MongoDB for storage, Kafka for notifications, WebSocket for P2P networking, and Express for HTTP APIs.';
let refreshInterval = null;
onMounted(async () => {
  const res = await getUserCount();
  userCount.value = res.count;
  const latestBlockRes = await getLatestBlock();
  latestBlock.value = latestBlockRes.block;
  // initialize last seen time when we first get a block
  if (latestBlock.value?.blockNum) lastBlockSeenAt.value = Date.now()
  refreshInterval = setInterval(refreshLatestBlock, 3000); // Refresh every 3 seconds

});

const refreshLatestBlock = async () => {
  const latestBlockRes = await getLatestBlock();
  const newBlock = latestBlockRes.block
  // if block number changed, update last seen timestamp
  if (newBlock?.blockNum && newBlock.blockNum !== latestBlock.value?.blockNum) {
    lastBlockSeenAt.value = Date.now()
  }
  latestBlock.value = newBlock;
};

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// compute steem delay (ms) between meeray block timestamp and steem block timestamp
const steemDelayMs = computed<number | null>(() => {
  const b = latestBlock.value
  if (!b) return null
  const meerayTs = b.timestamp
  // prefer explicit steemBlockTimestamp from API, fallback to parsing steemBlock.timestamp if present
  const steemTsRaw = b.steemBlockTimestamp ?? (b.steemBlock?.timestamp ?? null)
  if (!meerayTs || !steemTsRaw) return null
  const m = typeof meerayTs === 'string' ? parseInt(meerayTs) : meerayTs
  let s = steemTsRaw
  if (typeof steemTsRaw === 'string') {
    const parsed = Date.parse(steemTsRaw)
    s = Number.isNaN(parsed) ? parseInt(steemTsRaw) : parsed
  }
  const ms = (typeof s === 'string' ? parseInt(s) : s)
  if (Number.isNaN(m) || Number.isNaN(ms)) return null
  return Math.max(0, m - ms)
})

const steemDelaySeconds = computed(() => steemDelayMs.value !== null ? Math.round((steemDelayMs.value / 1000) * 100) / 100 : null)

// helper to format millisecond epoch timestamps into a readable UTC string
const formatLatestTs = (ts: number | string | undefined | null) => {
  if (!ts) return '-'
  const n = typeof ts === 'string' ? parseInt(ts) : ts
  if (Number.isNaN(n)) return '-'
  const d = new Date(n)
  return d.toISOString().replace('T', ' ').replace('Z', ' UTC')
}

// time since last seen block (ms)
const timeSinceLastBlockMs = computed(() => {
  if (!lastBlockSeenAt.value) return Infinity
  return Date.now() - lastBlockSeenAt.value
})

// network status color and label based on elapsed time since last block
const networkStatus = computed(() => {
  const t = timeSinceLastBlockMs.value
  // thresholds: <=6s = green, >6s && <=12s = orange, >12s = red
  if (t <= 6000) return { color: 'bg-green-500', label: 'Online' }
  if (t <= 12000) return { color: 'bg-amber-500', label: 'Delayed' }
  return { color: 'bg-red-500', label: 'Offline' }
})



const features = [
  { title: 'Token Creation', description: 'Discover tokens created on Meeray and inspect token metadata and supply.', icon: '🪙' },
  { title: 'Pools & Liquidity', description: 'View pools, LP positions, and historical volume for each pair.', icon: '�' },
  { title: 'Market Trades', description: 'Explore recent trades, orderbook snapshots and price charts.', icon: '�' },
  { title: 'Farms & Rewards', description: 'Track farm pools, APRs and earned rewards per pool.', icon: '🌾' },
  { title: 'NFTs & Collections', description: 'Browse NFT collections, individual items, and ownership history.', icon: '🖼️' },
  { title: 'Launchpad', description: 'See upcoming launches, token sale details and participation stats.', icon: '�' },
];

const howItWorks = [
  { icon: '�', title: 'Index & Search', desc: 'Fast full-text search for blocks, transactions and accounts with direct links to details.' },
  { icon: '⏱️', title: 'Real-time Notifications', desc: 'WebSocket/Kafka notifications keep you updated about new transactions and events.' },
  { icon: '🧭', title: 'Block & Tx Explorer', desc: 'Deep dive into Meeray blocks and the corresponding Steem context (on-chain mapping).' },
  { icon: '📊', title: 'Analytics & Charts', desc: 'View charts for volume, fees, and active accounts over time.' },
];

const faqs = [
  { q: 'What does this explorer show?', a: 'This explorer indexes Meeray sidechain blocks, transactions, accounts, tokens, pools, NFTs and launchpad activity, and maps sidechain events to their Steem block context.' },
  { q: 'How fresh is the data?', a: 'Blocks are refreshed every ~3s; live events arrive via a WebSocket/Kafka notifier. Use the live indicator in the header to check network health.' },
  { q: 'How do I find a transaction?', a: 'Paste a transaction hash in the search bar (40 hex chars) or search by account name or block number.' },
  { q: 'Can I get notified on transactions?', a: 'Yes — the app connects to a Kafka-based notifier. You can also subscribe to specific transaction IDs via the transaction service.' },
];
</script>


<template>
  <div class="min-h-screen md:px-0 ">
    <!-- Fancy Hero Section -->
    <section class="relative overflow-hidden">
      <div
        class="absolute inset-0 -z-10 bg-gradient-to-r from-primary-50 via-white to-gray-50 dark:from-primary-900 dark:via-gray-900 dark:to-gray-950 opacity-95">
      </div>
      <div class="max-w-6xl mx-auto px-6 py-20">
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 class="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900 dark:text-white">
              <div class=" flex">
                <span>About</span>
                <span
                  class="ml-2 block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-600">MeeRay</span>
              </div>
              <div>
                the Steem
                sidechain
              </div>
            </h1>

            <p class="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl">{{ appDescription }}</p>

            <div class="mt-8 flex flex-wrap gap-3">
              <router-link to="/"
                class="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-lg shadow-lg font-medium">
                Get Started
              </router-link>

              <a href="#features"
                class="inline-flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg bg-white/60 hover:bg-white/80">Documentation</a>
              <a href="https://github.com/meeray-explorer"
                class="inline-flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg bg-white/60 hover:bg-white/80">View
                on github</a>
            </div>

            <div class="mt-8 grid grid-cols-3 gap-3">
              <div class="p-3 rounded-lg bg-white shadow-sm border dark:bg-gray-800 dark:border-gray-800">
                <div class="text-sm text-gray-500">Speed</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">Near-instant</div>
              </div>
              <div class="p-3 rounded-lg bg-white shadow-sm border dark:bg-gray-800 dark:border-gray-800">
                <div class="text-sm text-gray-500">Security</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">Steem-backed</div>
              </div>
              <div class="p-3 rounded-lg bg-white shadow-sm border dark:bg-gray-800 dark:border-gray-800">
                <div class="text-sm text-gray-500">Open</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">Auditable</div>
              </div>
            </div>
          </div>

          <div class="hidden md:flex items-center justify-center">
            <div
              class="w-full max-w-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-6 text-center">
              <div class="text-sm text-gray-500">Live</div>
              <div class="mt-2 flex items-center justify-center gap-3">
                <div :class="['w-4 h-4 rounded-full', networkStatus.color]"></div>
                <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ networkStatus.label }}</div>
                <div class="text-xs text-gray-400 ml-2">({{ Math.round(timeSinceLastBlockMs / 1000) }}s)</div>
                <div class="ml-4 flex items-center" title="Kafka connection status">
                  <span
                    :class="['inline-block w-3 h-3 rounded-full mr-2', isKafkaConnected ? 'bg-green-500' : 'bg-red-500']"></span>
                  <span class="text-sm text-gray-500 dark:text-gray-300">WS Notifier</span>
                  <span class="text-xs text-gray-400 ml-2">({{ isFinite(timeSinceLastKafkaMs) ?
                    Math.round(timeSinceLastKafkaMs / 1000) + 's' : '-' }})</span>
                </div>
              </div>
              <div class="mt-6">
                <router-link :to="`/block/${latestBlock?.blockNum ?? ''}`"
                  class="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 text-white font-medium">Explore</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- decorative bottom wave -->
      <svg class="absolute bottom-0 left-0 w-full -mb-1" viewBox="0 0 1440 120" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path d="M0 40c120 40 240 40 360 0s240-40 360 0 240 40 360 0 240-40 360 0v80H0V40z"
          fill="rgba(99,102,241,0.06)" />
      </svg>
    </section>

    <section v-if="latestBlock" class="py-12 bg-primary-500">
      <div class="max-w-6xl mx-auto">
        <div
          class="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div class="flex items-center gap-4">
              <div
                class="h-24 min-w-28 rounded-xl bg-gradient-to-br from-primary-300 to-primary-700 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg px-6">
                {{ latestBlock.blockNum?.toLocaleString() }}
              </div>
              <div>
                <h3 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Latest Block</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ latestBlock.hash?.slice(0, 12) }}...</p>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-2">Timestamp: <span class="font-mono">{{
                  formatLatestTs(latestBlock.timestamp) }}</span></p>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 w-full md:w-auto">
              <div
                class="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-gray-100 dark:border-gray-800">
                <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ latestBlock.txs?.length || 0 }}</div>
                <div class="text-xs text-gray-500">Transactions</div>
              </div>
              <div
                class="col-span-2 bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-gray-100 dark:border-gray-800">
                <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ latestBlock.witness || '-' }}</div>
                <div class="text-xs text-gray-500">Witness</div>
              </div>
              <div
                class="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-gray-100 dark:border-gray-800">
                <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ userCount }}</div>
                <div class="text-xs text-gray-500">Total Users</div>
              </div>
              <div
                class="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-gray-100 dark:border-gray-800">
                <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ steemDelayMs !== null ?
                  steemDelaySeconds : '-' }}</div>
                <div class="text-xs text-gray-500">Steem delay (s)</div>
                <div v-if="steemDelayMs !== null" class="text-xs text-gray-400 mt-1 font-mono">{{ steemDelayMs }} ms
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 border-t pt-4 flex items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <router-link :to="`/block/${latestBlock.blockNum}`"
                class="inline-flex items-center px-4 py-2 rounded-lg bg-primary-500 text-white font-medium shadow hover:bg-primary-600">View
                Block</router-link>
            </div>
            <div class="text-sm text-gray-500">Updated every 3s</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Platforms Section -->
    <section class="py-12 relative overflow-hidden">
      <svg class="absolute top-0 left-0 w-full -mb-1" viewBox="0 0 1440 120" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <!-- Straight top edge, wavy bottom edge -->
        <path d="M0 0H1440V40C1240 60 920 0 720 40C520 80 200 20 0 40V0Z" fill="rgba(99,102,241,0.06)" />
      </svg>
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-white">Meeray Platforms</h2>

        <div class="grid gap-8 md:grid-cols-3">
          <!-- NFT Platform -->
          <div
            class="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800">
            <div class="flex items-start gap-4">
              <img src="/images/nft.png" alt="NFT" class="w-24 h-24 rounded-lg object-cover" />
              <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">nft.meeray.com</h3>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">A full-featured NFT marketplace: collections,
                  items, ownership and trading history.</p>
              </div>
            </div>

            <div class="mt-4 grid gap-2">
              <div class="text-sm text-gray-700 dark:text-gray-200">• Browse collections and individual NFTs</div>
              <div class="text-sm text-gray-700 dark:text-gray-200">• View provenance and ownership history</div>
            </div>

            <div class="mt-6 flex items-center justify-between">
              <a href="https://nft.meeray.com" target="_blank"
                class="w-full text-center px-4 py-2 rounded-lg bg-pink-600 text-white font-medium shadow hover:bg-pink-700">Open
                NFT</a>
            </div>
          </div>

          <!-- DEX Platform -->
          <div
            class="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800">
            <div class="flex items-start gap-4">
              <img src="/images/dex.png" alt="DEX" class="w-24 h-24 rounded-lg object-cover" />
              <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">dex.meeray.com</h3>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">AMM DEX with pools, swaps, LP analytics and
                  historical data for traders and liquidity providers.</p>
              </div>
            </div>

            <div class="mt-4 grid gap-2">
              <div class="text-sm text-gray-700 dark:text-gray-200">• Inspect pools, liquidity and volume</div>
              <div class="text-sm text-gray-700 dark:text-gray-200">• Track LP positions and earned fees</div>
            </div>

            <div class="mt-6 flex items-center justify-between">
              <a href="https://dex.meeray.com" target="_blank"
                class="w-full text-center px-4 py-2 rounded-lg bg-primary-600 text-white font-medium shadow hover:bg-primary-700">Open
                DEX</a>
            </div>
          </div>

          <!-- Launchpad Platform -->
          <div
            class="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800">
            <div class="flex items-start gap-4">
              <img src="/images/pad.png" alt="PAD" class="w-24 h-24 rounded-lg object-cover" />
              <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">pad.meeray.com</h3>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">Launchpad for token sales, ICO/IDO-style
                  offerings, and project onboarding.</p>
              </div>
            </div>

            <div class="mt-4 grid gap-2">
              <div class="text-sm text-gray-700 dark:text-gray-200">• Upcoming sales and whitelist info</div>
              <div class="text-sm text-gray-700 dark:text-gray-200">• Historical sale data and allocations</div>
            </div>

            <div class="mt-6 flex items-center justify-between">
              <a href="https://pad.meeray.com" target="_blank"
                class="w-full text-center px-4 py-2 rounded-lg bg-amber-500 text-white font-medium shadow hover:bg-amber-600">Open
                Launchpad</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works / Security Section -->
    <section class="py-12">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-white">How It Works</h2>
        <div class="grid md:grid-cols-4 gap-8">
          <div v-for="item in howItWorks" :key="item.title"
            class="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800">
            <div class="text-3xl mb-3 text-primary-500">{{ item.icon }}</div>
            <h4 class="text-lg font-bold mb-1 text-gray-900 dark:text-white">{{ item.title }}</h4>
            <p class="text-gray-700 dark:text-gray-200 text-sm">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="py-12 bg-primary-400 dark:bg-primary-600">
      <div class="max-w-6xl mx-auto">
        <h2 class="font-bold text-center mb-10 text-gray-900 dark:text-white">FAQ</h2>
        <div class="grid md:grid-cols-2 gap-8">
          <div v-for="(faq, i) in faqs.slice(0, 2)" :key="faq.q" class="mb-4">
            <details
              class="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800">
              <summary class="text-lg font-bold cursor-pointer text-gray-900 dark:text-white">{{ faq.q }}</summary>
              <div class="text-gray-700 dark:text-gray-200 mt-2">{{ faq.a }}</div>
            </details>
          </div>
          <div v-for="(faq, i) in faqs.slice(2, 4)" :key="faq.q" class="mb-4">
            <details
              class="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800">
              <summary class="text-lg font-bold cursor-pointer text-gray-900 dark:text-white">{{ faq.q }}</summary>
              <div class="text-gray-700 dark:text-gray-200 mt-2">{{ faq.a }}</div>
            </details>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped></style>