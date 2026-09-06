<script lang="ts">
  import { onMount } from 'svelte';
  import { currentLanguage, translate as t, type Language } from '../../i18n';
  import { buildSearchIndex, matchesSearch, type SearchPost } from '../../scripts/post-search';

  export let types: string[] = [];
  export let tags: string[] = [];
  export let posts: SearchPost[] = [];

  let language: Language = 'en';
  let activeType = 'ALL';
  let activeTags = new Set<string>();
  let query = '';
  let resultCount = posts.length;
  let searchInput: HTMLInputElement;
  let mounted = false;
  const index = buildSearchIndex(posts);

  function applyFilters(sync = true) {
    if (!mounted) return;
    let visible = 0;
    document.querySelectorAll<HTMLElement>('[data-post-card]').forEach(card => {
      const cardTags = (card.dataset.tags || '').split(',').filter(Boolean);
      const typeOk = activeType === 'ALL' || card.dataset.type === activeType;
      const tagOk = [...activeTags].every(tag => cardTags.includes(tag));
      const show = typeOk && tagOk && matchesSearch(index.get(card.dataset.postId || '') || '', query);
      card.hidden = !show;
      if (show) visible++;
    });
    resultCount = visible;
    const empty = document.getElementById('post-empty');
    if (empty) empty.style.display = visible === 0 ? '' : 'none';
    if (sync) {
      const url = new URL(window.location.href);
      for (const key of ['q', 'type', 'tags']) url.searchParams.delete(key);
      if (query.trim()) url.searchParams.set('q', query.trim());
      if (activeType !== 'ALL') url.searchParams.set('type', activeType);
      if (activeTags.size) url.searchParams.set('tags', [...activeTags].join(','));
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    }
  }
  function restore() {
    const params = new URLSearchParams(window.location.search);
    query = params.get('q') || '';
    activeType = params.get('type') || 'ALL';
    activeTags = new Set((params.get('tags') || '').split(',').filter(Boolean));
    applyFilters(false);
  }
  function selectType(value: string) { activeType = value; applyFilters(); }
  function toggleTag(tag: string) {
    const next = new Set(activeTags);
    if (next.has(tag)) next.delete(tag); else next.add(tag);
    activeTags = next;
    applyFilters();
  }
  function clearAll() { query = ''; activeType = 'ALL'; activeTags = new Set(); applyFilters(); }
  function clearSearch() { query = ''; applyFilters(); searchInput.focus(); }

  onMount(() => {
    mounted = true;
    language = currentLanguage();
    restore();
    const updateLanguage = () => { language = currentLanguage(); };
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !document.querySelector('dialog[open]')) {
        event.preventDefault(); searchInput.focus(); searchInput.select();
      }
      if (event.key === 'Escape' && document.activeElement === searchInput) { event.preventDefault(); clearSearch(); }
    };
    window.addEventListener('languagechange', updateLanguage);
    window.addEventListener('keydown', shortcut);
    window.addEventListener('popstate', restore);
    return () => {
      window.removeEventListener('languagechange', updateLanguage);
      window.removeEventListener('keydown', shortcut);
      window.removeEventListener('popstate', restore);
    };
  });
</script>

<div class="blog-search" role="search" aria-label={t('搜索文章', language)}>
  <label class="search-field">
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/><path d="m13 13 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    <input bind:this={searchInput} bind:value={query} on:input={() => applyFilters()} type="search" placeholder={t('搜索标题、标签或正文…', language)} aria-label={t('搜索文章', language)} aria-controls="post-list" autocomplete="off" />
    <kbd aria-hidden="true">⌘ / Ctrl K</kbd>
  </label>
  {#if query}<button class="clear-search" on:click={clearSearch} aria-label={t('清除搜索', language)}>×</button>{/if}
</div>
<div class="filters" aria-label={t('搜索和筛选文章', language)}>
  <div class="filter-line"><span class="filter-label">{t('类型', language)}</span><div class="filter-options">
    <button class="filter-button" aria-pressed={activeType === 'ALL'} on:click={() => selectType('ALL')}>{t('全部', language)}</button>
    {#each types as type}<button class="filter-button" aria-pressed={activeType === type} on:click={() => selectType(type)}>{t(type, language)}</button>{/each}
  </div></div>
  <div class="filter-line"><span class="filter-label">{t('标签', language)}</span><div class="filter-options">
    {#each tags as tag}<button class="filter-button" aria-pressed={activeTags.has(tag)} on:click={() => toggleTag(tag)}>{t(tag, language)}</button>{/each}
  </div></div>
</div>
<div class="search-summary">
  <p role="status" aria-live="polite">{language === 'en' ? `${resultCount} ${resultCount === 1 ? 'post' : 'posts'}` : `${resultCount} 篇文章`}</p>
  {#if query || activeTags.size || activeType !== 'ALL'}<button class="clear-filter" on:click={clearAll}>{t('清除筛选', language)}</button>{/if}
</div>
