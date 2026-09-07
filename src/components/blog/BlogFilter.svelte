<script lang="ts">
  import { resolveTags, tagKey } from '../../utils/tags';
  import { onMount } from 'svelte';
  import { currentLanguage, translate as t, translateContent, type Language } from '../../i18n';
  import { buildSearchIndex, matchesSearch, type SearchPost } from '../../scripts/post-search';

  export let types: string[] = [];
  export let tags: string[] = [];
  export let moreTags: string[] = [];
  export let posts: SearchPost[] = [];

  let language: Language = 'en';
  let activeType = 'ALL';
  let activeTags = new Set<string>();
  let query = '';
  let resultCount = posts.length;
  let searchInput: HTMLInputElement;
  let mounted = false;
  let showMoreTags = false;
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  const index = buildSearchIndex(posts);

  // Typing fires per keystroke; filtering walks every card. Coalesce the bursts.
  function queueFilter() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => applyFilters(), 120);
  }

  function applyFilters(sync = true) {
    if (!mounted) return;
    let visible = 0;
    document.querySelectorAll<HTMLElement>('[data-post-card]').forEach(card => {
      const cardTags = new Set((card.dataset.tags || '').split(',').map(tagKey));
      const typeOk = activeType === 'ALL' || card.dataset.type === activeType;
      const tagOk = [...activeTags].every(tag => cardTags.has(tagKey(tag)));
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
    clearTimeout(searchTimer);
    const params = new URLSearchParams(window.location.search);
    query = params.get('q') || '';
    activeType = params.get('type') || 'ALL';
    activeTags = new Set(resolveTags((params.get('tags') || '').split(','), [...tags, ...moreTags]));
    // A tag arriving from the URL may live in the long tail — open it, or the
    // page would filter by a button the reader cannot see.
    if (moreTags.some(tag => activeTags.has(tag))) showMoreTags = true;
    applyFilters(false);
  }
  function selectType(value: string) { activeType = value; applyFilters(); }
  function toggleTag(tag: string) {
    const next = new Set(activeTags);
    if (next.has(tag)) next.delete(tag); else next.add(tag);
    activeTags = next;
    applyFilters();
  }
  function clearAll() { clearTimeout(searchTimer); query = ''; activeType = 'ALL'; activeTags = new Set(); applyFilters(); }
  function clearSearch() { clearTimeout(searchTimer); query = ''; applyFilters(); searchInput.focus(); }

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
      clearTimeout(searchTimer);
      window.removeEventListener('languagechange', updateLanguage);
      window.removeEventListener('keydown', shortcut);
      window.removeEventListener('popstate', restore);
    };
  });
</script>

<div class="blog-search" role="search" aria-label={t('搜索文章', language)}>
  <label class="search-field">
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/><path d="m13 13 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    <input bind:this={searchInput} bind:value={query} on:input={queueFilter} type="search" placeholder={t('搜索标题、摘要或标签…', language)} aria-label={t('搜索文章', language)} aria-controls="post-list" autocomplete="off" />
    <kbd aria-hidden="true">⌘ / Ctrl K</kbd>
  </label>
  {#if query}<button class="clear-search" on:click={clearSearch} aria-label={t('清除搜索', language)}>×</button>{/if}
</div>
<div class="filters" aria-label={t('搜索和筛选文章', language)}>
  {#if types.length > 1}
    <div class="filter-line"><span class="filter-label">{t('类型', language)}</span><div class="filter-options">
      <button class="filter-button" aria-pressed={activeType === 'ALL'} on:click={() => selectType('ALL')}>{t('全部', language)}</button>
      {#each types as type}<button class="filter-button" aria-pressed={activeType === type} on:click={() => selectType(type)}>{t(type, language)}</button>{/each}
    </div></div>
  {/if}
  <div class="filter-line"><span class="filter-label">{t('标签', language)}</span><div class="filter-options">
    {#each tags as tag}<button class="filter-button" aria-pressed={activeTags.has(tag)} on:click={() => toggleTag(tag)}>{translateContent(tag, language)}</button>{/each}
    {#if showMoreTags}
      {#each moreTags as tag}<button class="filter-button" aria-pressed={activeTags.has(tag)} on:click={() => toggleTag(tag)}>{translateContent(tag, language)}</button>{/each}
    {/if}
    {#if moreTags.length}
      <button class="filter-more" aria-expanded={showMoreTags} on:click={() => (showMoreTags = !showMoreTags)}>
        {showMoreTags ? t('收起', language) : language === 'zh' ? `更多标签（${moreTags.length}）` : `+${moreTags.length} ${t('更多标签', language)}`}
      </button>
    {/if}
  </div></div>
</div>
<div class="search-summary">
  <p role="status" aria-live="polite">{language === 'en' ? `${resultCount} ${resultCount === 1 ? 'post' : 'posts'}` : `${resultCount} 篇文章`}</p>
  {#if query || activeTags.size || activeType !== 'ALL'}<button class="clear-filter" on:click={clearAll}>{t('重置搜索与筛选', language)}</button>{/if}
</div>
