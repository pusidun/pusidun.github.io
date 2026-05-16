<script>
  import { onMount } from 'svelte';

  export let types = [];
  export let tags = [];

  let activeType = 'ALL';
  let activeTags = new Set();

  function applyFilters() {
    const cards = document.querySelectorAll('[data-post-card]');
    let visible = 0;
    cards.forEach((card) => {
      const cardType = card.dataset.type;
      const cardTags = (card.dataset.tags || '').split(',').filter(Boolean);

      const typeOk = activeType === 'ALL' || cardType === activeType;
      const tagOk =
        activeTags.size === 0 ||
        [...activeTags].every((t) => cardTags.includes(t));

      const show = typeOk && tagOk;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    const empty = document.getElementById('post-empty');
    if (empty) empty.style.display = visible === 0 ? '' : 'none';

    // Sync URL
    const params = new URLSearchParams();
    if (activeType !== 'ALL') params.set('type', activeType);
    if (activeTags.size > 0) params.set('tags', [...activeTags].join(','));
    const qs = params.toString();
    history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }

  function selectType(t) {
    activeType = t;
    applyFilters();
  }
  function toggleTag(t) {
    if (activeTags.has(t)) activeTags.delete(t);
    else activeTags.add(t);
    activeTags = new Set(activeTags);
    applyFilters();
  }
  function clearAll() {
    activeType = 'ALL';
    activeTags = new Set();
    applyFilters();
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('type');
    const tg = params.get('tags');
    if (t) activeType = t;
    if (tg) activeTags = new Set(tg.split(',').filter(Boolean));
    applyFilters();
  });
</script>

<div class="space-y-4">
  <!-- Types -->
  <div>
    <div class="text-xs font-black tracking-widest text-p5-yellow mb-2">TYPE</div>
    <div class="flex flex-wrap gap-2">
      <button
        class="px-3 py-1 text-sm font-black tracking-wider p5-skew border-2 transition-colors {activeType === 'ALL' ? 'bg-p5-red text-p5-white border-p5-red' : 'border-p5-white/30 text-p5-white/80 hover:border-p5-red hover:text-p5-red'}"
        on:click={() => selectType('ALL')}
      >
        <span class="p5-skew-rev inline-block">ALL</span>
      </button>
      {#each types as t}
        <button
          class="px-3 py-1 text-sm font-black tracking-wider p5-skew border-2 transition-colors {activeType === t ? 'bg-p5-red text-p5-white border-p5-red' : 'border-p5-white/30 text-p5-white/80 hover:border-p5-red hover:text-p5-red'}"
          on:click={() => selectType(t)}
        >
          <span class="p5-skew-rev inline-block">{t}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Tags -->
  <div>
    <div class="flex items-center justify-between mb-2">
      <div class="text-xs font-black tracking-widest text-p5-yellow">TAG</div>
      {#if activeTags.size > 0 || activeType !== 'ALL'}
        <button
          class="text-xs font-bold text-p5-red hover:text-p5-yellow underline"
          on:click={clearAll}
        >
          清除筛选
        </button>
      {/if}
    </div>
    <div class="flex flex-wrap gap-1.5">
      {#each tags as tag}
        <button
          class="text-xs font-bold tracking-wider px-2 py-1 border transition-colors {activeTags.has(tag) ? 'bg-p5-yellow text-p5-black border-p5-yellow' : 'border-p5-white/30 text-p5-white/70 hover:border-p5-yellow hover:text-p5-yellow'}"
          on:click={() => toggleTag(tag)}
        >
          #{tag}
        </button>
      {/each}
    </div>
  </div>
</div>
