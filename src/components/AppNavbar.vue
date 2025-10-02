<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { SteemAuth, useAuthStore } from 'steem-auth-vue';
import { useApiService } from '../composables/useApiService';
import { useRouter, useRoute } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const api = useApiService();
const isDarkTheme = ref(false);
const toggleTheme = () => { isDarkTheme.value = !isDarkTheme.value; handleThemeChange(isDarkTheme.value); };

// Search functionality
const searchQuery = ref('');
const isSearching = ref(false);
const searchResults = ref([]);
const showSearchDropdown = ref(false);

const searchTimeout = ref(null);

const performSearch = async (query: string) => {
  if (!query.trim()) {
    searchResults.value = [];
    showSearchDropdown.value = false;
    return;
  }

  try {
    isSearching.value = true;
    searchResults.value = [];

    // Try different search types based on query pattern
    const results = [];

    // Check if it's a transaction hash (40 characters hex)
    if (/^[a-fA-F0-9]{40}$/.test(query)) {
      try {
        const txData = await api.getTransaction(query) as any;
        if (txData?.success && txData?.block) {
          results.push({
            type: 'transaction',
            id: query,
            title: `Transaction ${query.substring(0, 8)}...`,
            description: `Block #${txData.block?.blockNum || 'Unknown'}`,
            url: `/tx/${query}`
          });
        }
      } catch (e) {
        console.log('Transaction search failed:', e);
      }
    }

    // Check if it's a block number
    if (/^\d+$/.test(query)) {
      try {
        const blockData = await api.getBlockByHeight(parseInt(query)) as any;
        console.log('Block data:', blockData);
        if (blockData?.success && blockData?.block) {
          results.push({
            type: 'block',
            id: query,
            title: `Block #${query}`,
            description: `${blockData.block?.txs?.length || 0} transactions`,
            url: `/block/${query}`
          });
        }
      } catch (e) {
        console.log('Block search failed:', e);
      }
    }

    // Check if it's a username/account
    if (/^[a-zA-Z0-9\-\.]+$/.test(query) && query.length >= 3) {
      try {
        const accountData = await api.getAccountDetails(query);
        if (accountData?.account) {
          results.push({
            type: 'account',
            id: query,
            title: `@${query}`,
            description: 'User account',
            url: `/@${query}`
          });
        }

      } catch (e) {
        console.log('Account search failed:', e);
      }
    }

    searchResults.value = results;
    showSearchDropdown.value = results.length > 0;
  } catch (error) {
    console.error('Search error:', error);
  } finally {
    isSearching.value = false;
  }
};

const handleSearchInput = (event: Event) => {
  const query = (event.target as HTMLInputElement).value;
  searchQuery.value = query;

  // Clear previous timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  // Debounce search
  searchTimeout.value = setTimeout(() => {
    performSearch(query);
  }, 300);
};

const handleSearchSubmit = () => {
  if (searchQuery.value.trim()) {
    // If we have results, go to the first one
    if (searchResults.value.length > 0) {
      router.push(searchResults.value[0].url);
    } else {
      // Try to determine the type and navigate
      const query = searchQuery.value.trim();
      if (/^[a-fA-F0-9]{40}$/.test(query)) {
        router.push(`/tx/${query}`);
      } else if (/^\d+$/.test(query)) {
        router.push(`/block/${query}`);
      } else {
        router.push(`/@${query}`);
      }
    }
    closeSearch();
  }
};

const selectSearchResult = (result: any) => {
  router.push(result.url);
  closeSearch();
};

const closeSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  showSearchDropdown.value = false;
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
};

// Close search when clicking outside
const searchContainer = ref(null);
const handleClickOutside = (event: Event) => {
  if (searchContainer.value && !searchContainer.value.contains(event.target)) {
    closeSearch();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});

const menuItems = [
  { label: 'Explore', href: '/explore' },
  { label: 'Witnesses', href: '/witnesses' },
];
const THEME_STORAGE_KEY = 'steem-auth-theme';

function isActive(item: any) {
  // For exact match or startsWith for subroutes
  if (!item.href) return false;
  const path = item.href.startsWith('/') ? item.href : '/' + item.href;
  return route.path === path || route.path.startsWith(path + '/');
}

const handleThemeChange = (isDark: boolean): void => {
  console.log('Theme changed:', isDark ? 'dark' : 'light');
  isDarkTheme.value = isDark;
  applyTheme(isDark);
};

const applyTheme = (isDark: boolean) => {
  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  }
};

// Theme management

const initTheme = () => {
  if (typeof window === 'undefined') return;
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme) {
    isDarkTheme.value = storedTheme === 'dark';
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // Use system preference if no stored theme
    isDarkTheme.value = true;
  }

  applyTheme(isDarkTheme.value);

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        isDarkTheme.value = e.matches;
        applyTheme(isDarkTheme.value);
      }
    });
  }
};

function handleModalOpen() {
  document.body.classList.add('steem-auth-modal-open');
  setTimeout(() => {
    const row = document.querySelector('.steem-auth-accounts-row') as (Element & { _wheelHandler?: (e: WheelEvent) => void, scrollLeft?: number });
    if (row && !row._wheelHandler) {
      row._wheelHandler = function (e: WheelEvent) {
        if (e.deltaY !== 0) {
          e.preventDefault();
          if (typeof row.scrollLeft === 'number') {
            row.scrollLeft += e.deltaY;
          }
        }
      };
      row.addEventListener('wheel', row._wheelHandler, { passive: false });
    }
  }, 0);
}

function handleModalClose() {
  document.body.classList.remove('steem-auth-modal-open');
  const row = document.querySelector('.steem-auth-accounts-row') as (Element & { _wheelHandler?: (e: WheelEvent) => void });
  if (row && row._wheelHandler) {
    row.removeEventListener('wheel', row._wheelHandler);
    delete row._wheelHandler;
  }
}

onMounted(() => {
  initTheme();

});

</script>

<template>
  <nav
    class="fixed top-0 left-0 w-full z-50 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 shadow-sm font-sans h-16">
    <div class="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
      <!-- Logo -->
      <router-link to="/" class="flex items-center">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center">
          <img src="/images/meeray.svg" alt="logo" class="w-10 h-10">
        </div>
        <h1 class="ml-2 text-xl font-bold text-white">MeeRay</h1>
      </router-link>
      <!-- Menu -->
      <ul class="flex items-stretch h-full space-x-6 pb-[1px]">
        <li v-for="item in menuItems" :key="item.label" class="relative flex items-center h-full">
          <router-link :to="item.href" :class="[
            'px-3 py-2 font-medium text-base transition-all duration-150 h-full flex items-center',
            isActive(item)
              ? 'border-t-2 border-primary-500 text-primary-500 dark:bg-gray-950'
              : 'hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-primary-400 hover:border-t-2 hover:border-primary-500'
          ]">
            {{ item.label }}
          </router-link>
        </li>
        <li>
          <a href="https://doc.meeray.com" target="_blank" rel="noopener"
            class="px-3 py-2 font-medium text-base transition-all duration-150 h-full flex items-center hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-primary-400 hover:border-t-2 hover:border-primary-500">
            Documentation
          </a>
        </li>
      </ul>

      <!-- Search -->
      <div ref="searchContainer" class="relative flex-1 max-w-sm mx-8">
        <div class="relative">
          <input v-model="searchQuery" @input="handleSearchInput" @keyup.enter="handleSearchSubmit"
            @focus="showSearchDropdown = searchResults.length > 0" type="text"
            placeholder="Search blocks, transactions, accounts..."
            class="w-full px-4 py-2 pl-10 pr-4 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400" />
          <div class="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg v-if="!isSearching" class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div v-else class="w-4 h-4">
              <div class="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-primary-500"></div>
            </div>
          </div>
          <button v-if="searchQuery" @click="closeSearch" class="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg class="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Search Results Dropdown -->
        <div v-if="showSearchDropdown && (searchResults.length > 0 || isSearching)"
          class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div v-if="isSearching" class="p-4 text-center text-gray-500 dark:text-gray-400">
            <div class="flex items-center justify-center space-x-2">
              <div class="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-primary-500"></div>
              <span>Searching...</span>
            </div>
          </div>

          <div v-else-if="searchResults.length === 0 && searchQuery.trim()"
            class="p-4 text-center text-gray-500 dark:text-gray-400">
            No results found
          </div>

          <div v-else>
            <button v-for="result in searchResults" :key="`${result.type}-${result.id}`"
              @click="selectSearchResult(result)"
              class="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                  <div :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
                    result.type === 'transaction' ? 'bg-blue-500' :
                      result.type === 'block' ? 'bg-green-500' : 'bg-purple-500'
                  ]">
                    {{ result.type === 'transaction' ? 'TX' : result.type === 'block' ? 'BL' : '@' }}
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ result.title }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {{ result.description }}
                  </p>
                </div>
                <div class="flex-shrink-0">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center space-x-3">
        <button class="steem-auth-theme-toggle" @click="toggleTheme" type="button">
          {{ isDarkTheme ? '☀️' : '🌙' }}
        </button>
        <router-link v-if="auth.state.isAuthenticated" :to="`/@${auth.state.username}`"
          class="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <svg class="w-6 h-6 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" stroke-width="2"
            viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
          </svg>
        </router-link>
        <SteemAuth @modalOpen="handleModalOpen" @modalClose="handleModalClose" appName="future.app"
          callbackURL="http://localhost:3000" steemApi="https://testapi.moecki.online"
          :steemApiOptions="{ addressPrefix: 'MTN', chainId: '1aa939649afcc54c67e01a809967f75b8bee5d928aa6bdf237d0d5d6bfbc5c22' }" />
      </div>
    </div>
  </nav>
</template>
