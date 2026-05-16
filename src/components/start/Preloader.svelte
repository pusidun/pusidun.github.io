<script>
  import { onMount } from 'svelte';

  let progress = 0;
  let sealed = false;
  let vibrating = false;
  let fading = false;
  let removed = false;

  // 3 discrete shakes with pauses at 90% scale between them.
  // Keep this in sync with the @keyframes shake3 duration below.
  const SHAKE_MS = 2200;
  const FADE_MS = 500;

  onMount(() => {
    // Lock scroll on the document until we reach 100%
    document.documentElement.classList.add('preloading');

    let real = 0;
    const tick = () => {
      if (real < 95) {
        real += (95 - real) * 0.06 + 0.3;
        if (real > 95) real = 95;
      }
      progress = Math.floor(real);
      if (!sealed) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const finish = () => {
      real = 100;
      progress = 100;
      // Hold for a beat so the user sees "100%"
      setTimeout(() => {
        sealed = true;
        vibrating = true;
        // Unlock scroll and announce — user can start exploring during the shake.
        document.documentElement.classList.remove('preloading');
        window.dispatchEvent(new CustomEvent('preloader:done'));

        // After 3 shakes (with pauses), fade out and unmount.
        setTimeout(() => {
          vibrating = false;
          fading = true;
          setTimeout(() => {
            removed = true;
          }, FADE_MS);
        }, SHAKE_MS);
      }, 350);
    };

    if (document.readyState === 'complete') {
      setTimeout(finish, 600);
    } else {
      window.addEventListener('load', () => setTimeout(finish, 300), { once: true });
      setTimeout(finish, 5000);
    }
  });
</script>

{#if !removed}
<aside
  class="calling"
  class:sealed
  class:vibrating
  class:fading
  aria-live="polite"
>
  <!-- Top ribbon: 予告状 / CALLING CARD -->
  <div class="ribbon">
    <span class="jp">予告状</span>
    <span class="en">CALLING CARD</span>
  </div>

  <div class="body">
    <!-- Ransom-note headline -->
    <div class="head" aria-hidden="true">
      <span class="ch r">L</span><span class="ch w sk">O</span><span class="ch y">A</span><span class="ch w sk">D</span><span class="ch r">.</span>
    </div>

    <!-- Progress bar -->
    <div class="row">
      <div class="bar-wrap">
        <div class="bar" style:width="{progress}%"></div>
        <div class="stripes"></div>
      </div>
    </div>

    <!-- Percentage + status -->
    <div class="meta">
      <div class="pct">
        <span class="n">{String(progress).padStart(3, '0')}</span><span class="u">%</span>
      </div>
      <div class="status">
        {#if sealed}
          <span class="ready">READY ▸ SCROLL ▼</span>
        {:else}
          <span>FETCHING DATA…</span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Corner stamp: changes when sealed -->
  <div class="stamp" class:sealed>{sealed ? 'SEALED' : 'TOP / SECRET'}</div>

  <!-- Tiny skull signature -->
  <svg class="skull" viewBox="0 0 40 28" aria-hidden="true">
    <path
      d="M20 2 L30 9 L32 18 L28 23 L23 21 L20 23 L17 21 L12 23 L8 18 L10 9 Z"
      fill="#0A0A0A"
      stroke="#F5F1E8"
      stroke-width="1.5"
    />
    <rect x="13" y="12" width="3.5" height="3.5" fill="#E60012" />
    <rect x="23.5" y="12" width="3.5" height="3.5" fill="#E60012" />
  </svg>
</aside>
{/if}

<style>
  .calling {
    position: absolute;
    bottom: 4rem;
    right: 1.25rem;
    z-index: 20;
    width: 150px;
    background: #F5F1E8;
    color: #0A0A0A;
    padding: 0.3rem 0.5rem 0.5rem;
    transform: rotate(-2deg);
    box-shadow:
      4px 4px 0 #E60012,
      8px 8px 0 #0A0A0A,
      0 0 0 2px #0A0A0A inset;
    clip-path: polygon(
      0 5%, 4% 0, 50% 1.5%, 96% 0, 100% 5%,
      99% 95%, 96% 100%, 50% 98%, 4% 100%, 0 95%
    );
    animation: callingIn 600ms cubic-bezier(0.2, 0, 0.2, 1.2) 200ms both;
  }
  @keyframes callingIn {
    from { transform: rotate(-8deg) translateY(40px) scale(0.85); opacity: 0; }
    to { transform: rotate(-2deg) translateY(0) scale(1); opacity: 1; }
  }

  /* Three discrete shakes, each followed by a brief pause at scale(0.9). */
  .calling.vibrating {
    animation: shake3 2200ms cubic-bezier(0.4, 0, 0.4, 1) forwards;
  }
  @keyframes shake3 {
    /* --- Shake 1 (0% → 14%) at full scale --- */
    0%   { transform: rotate(-2deg) translate(0, 0) scale(1); }
    3%   { transform: rotate(-7deg) translate(-3px, 1px) scale(1); }
    6%   { transform: rotate(2deg)  translate(3px, -1px) scale(1); }
    9%   { transform: rotate(-7deg) translate(-3px, 1px) scale(1); }
    12%  { transform: rotate(2deg)  translate(2px, -1px) scale(1); }
    14%  { transform: rotate(-2deg) translate(0, 0) scale(1); }
    /* Pause 1: settle to 0.9 (14% → 30%) */
    20%  { transform: rotate(-2deg) scale(0.9); }
    30%  { transform: rotate(-2deg) scale(0.9); }

    /* --- Shake 2 (30% → 45%) --- */
    32%  { transform: rotate(-2deg) translate(0, 0) scale(1); }
    35%  { transform: rotate(-7deg) translate(-3px, 1px) scale(1); }
    38%  { transform: rotate(2deg)  translate(3px, -1px) scale(1); }
    41%  { transform: rotate(-7deg) translate(-3px, 1px) scale(1); }
    44%  { transform: rotate(2deg)  translate(2px, -1px) scale(1); }
    46%  { transform: rotate(-2deg) translate(0, 0) scale(1); }
    /* Pause 2 */
    52%  { transform: rotate(-2deg) scale(0.9); }
    60%  { transform: rotate(-2deg) scale(0.9); }

    /* --- Shake 3 (60% → 76%) --- */
    62%  { transform: rotate(-2deg) translate(0, 0) scale(1); }
    65%  { transform: rotate(-7deg) translate(-3px, 1px) scale(1); }
    68%  { transform: rotate(2deg)  translate(3px, -1px) scale(1); }
    71%  { transform: rotate(-7deg) translate(-3px, 1px) scale(1); }
    74%  { transform: rotate(2deg)  translate(2px, -1px) scale(1); }
    76%  { transform: rotate(-2deg) translate(0, 0) scale(1); }
    /* Final settle at 0.9 — held until fade kicks in */
    82%  { transform: rotate(-2deg) scale(0.9); }
    100% { transform: rotate(-2deg) scale(0.9); }
  }

  /* Final fade-out: continues from the 0.9 settle, drifts down & shrinks further. */
  .calling.fading {
    animation: none;
    opacity: 0;
    transform: rotate(-2deg) translateY(8px) scale(0.82);
    transition:
      opacity 500ms ease-out,
      transform 500ms ease-out;
    pointer-events: none;
  }

  /* Ribbon */
  .ribbon {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.3rem;
    background: #0A0A0A;
    color: #F5F1E8;
    margin: -0.3rem -0.7rem 0.35rem;
    padding: 0.15rem 0.7rem;
    transform: skewX(-8deg);
    font-weight: 900;
    letter-spacing: 0.1em;
  }
  .ribbon .jp {
    color: #E60012;
    font-size: 0.7rem;
  }
  .ribbon .en {
    color: #FFD400;
    font-size: 0.42rem;
    letter-spacing: 0.18em;
  }

  /* Headline ransom letters */
  .head {
    font-family: 'Anton', 'Impact', sans-serif;
    font-size: 0.95rem;
    line-height: 1;
    letter-spacing: 0.02em;
    display: flex;
    gap: 1.5px;
    margin: 0.1rem 0 0.35rem;
  }
  .ch {
    display: inline-block;
    padding: 0.02em 0.18em;
    border: 1.5px solid #0A0A0A;
    transform: rotate(calc(var(--r, 0) * 1deg));
  }
  .ch:nth-child(1) { --r: -4; }
  .ch:nth-child(2) { --r: 5; }
  .ch:nth-child(3) { --r: -3; }
  .ch:nth-child(4) { --r: 4; }
  .ch:nth-child(5) { --r: -2; }
  .ch.r { background: #E60012; color: #F5F1E8; }
  .ch.y { background: #FFD400; color: #0A0A0A; }
  .ch.w { background: #F5F1E8; color: #0A0A0A; }
  .ch.sk { transform: rotate(calc(var(--r, 0) * 1deg)) skewX(-8deg); }

  /* Progress bar */
  .row {
    margin-top: 0.1rem;
  }
  .bar-wrap {
    position: relative;
    height: 10px;
    background: #0A0A0A;
    border: 1.5px solid #0A0A0A;
    overflow: hidden;
  }
  .bar {
    position: absolute;
    inset: 0 auto 0 0;
    background: #E60012;
    transition: width 80ms linear;
  }
  .stripes {
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
      -45deg,
      transparent 0, transparent 5px,
      rgba(0,0,0,0.35) 5px, rgba(0,0,0,0.35) 7px
    );
    pointer-events: none;
  }

  /* Meta row */
  .meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-top: 0.2rem;
    gap: 0.3rem;
  }
  .pct {
    font-family: 'Anton', 'Impact', sans-serif;
    line-height: 1;
    display: flex;
    align-items: baseline;
    gap: 1px;
  }
  .pct .n {
    color: #E60012;
    font-size: 1.1rem;
  }
  .pct .u {
    color: #0A0A0A;
    font-size: 0.6rem;
  }
  .status {
    font-size: 0.42rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    color: #0A0A0A;
    text-align: right;
  }
  .status .ready {
    background: #0A0A0A;
    color: #FFD400;
    padding: 1px 4px;
    display: inline-block;
    transform: skewX(-8deg);
  }

  /* Stamp */
  .stamp {
    position: absolute;
    top: -0.55rem;
    left: -0.55rem;
    background: #F5F1E8;
    border: 1.5px solid #E60012;
    color: #E60012;
    font-weight: 900;
    letter-spacing: 0.14em;
    font-size: 0.42rem;
    padding: 2px 4px;
    transform: rotate(-14deg);
    z-index: 3;
    transition: background 300ms, color 300ms, border-color 300ms;
  }
  .stamp.sealed {
    background: #E60012;
    color: #FFD400;
    border-color: #0A0A0A;
  }

  /* Skull */
  .skull {
    position: absolute;
    bottom: 0.25rem;
    right: 0.3rem;
    width: 14px;
    height: auto;
    opacity: 0.35;
  }

  @media (max-width: 640px) {
    .calling {
      width: 130px;
      bottom: 3.5rem;
      right: 0.75rem;
    }
    .head { font-size: 0.85rem; }
    .pct .n { font-size: 1rem; }
    .ribbon .en { display: none; }
  }
</style>
