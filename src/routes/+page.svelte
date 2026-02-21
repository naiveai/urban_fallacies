<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fallacyFiles } from '$lib/assets/fallacies/index.ts';
  
  function generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function parseFallacies(text) {
    const fallacies = [];
    const sections = Object.entries(fallacyFiles).sort(([a], [b]) => a.localeCompare(b)).map(([_, content]) => content);
    
    sections.forEach(section => {
      const lines = section.split('\n');
      let title = '';
      let icon = '';
      let claim = '';
      let response = '';
      let sources = [];
      let inResponse = false;
      let inSources = false;
      let pastTitle = false;
      
      lines.forEach(line => {
        if (line.startsWith('# ')) {
          title = line.substring(2).trim();
          pastTitle = true;
        } else if (line.startsWith('## Response')) {
          inResponse = true;
          inSources = false;
        } else if (line.startsWith('## Sources')) {
          inResponse = false;
          inSources = true;
        } else if (pastTitle && !icon && /^[\p{Emoji}\p{Emoji_Component}]+$/u.test(line.trim())) {
          // This line is an emoji icon
          icon = line.trim();
        } else if (!line.startsWith('#') && line.trim()) {
          if (inSources) {
            // Parse source line
            if (line.startsWith('**')) {
              sources.push(line);
            }
          } else if (inResponse) {
            response += line + '\n\n';
          } else if (title && icon && !claim) {
            claim += line + ' ';
          }
        }
      });
      
      if (title && claim && response) {
        fallacies.push({
          title: title.trim(),
          slug: generateSlug(title.trim()),
          icon: icon || '🏙️',
          claim: claim.trim(),
          response: response.trim(),
          sources: sources
        });
      }
    });
    
    return fallacies;
  }

  // Component state
  let fallacies = parseFallacies();
  let selectedFallacy = null;

  // Handle URL hash changes
  $: {
    const hash = $page.url.hash.slice(1); // Remove the # character
    if (hash) {
      const fallacy = fallacies.find(f => f.slug === hash);
      if (fallacy) {
        selectedFallacy = fallacy;
      }
    } else {
      selectedFallacy = null;
    }
  }

  function openFallacy(fallacy) {
    goto(`#${fallacy.slug}`, { replaceState: false, noScroll: true });
  }

  function closeModal() {
    goto('/', { replaceState: false });
  }

  function closeModalOverlay(event) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  // Handle escape key
  onMount(() => {
    const handleKeydown = (e) => {
      if (e.key === 'Escape' && selectedFallacy) {
        closeModal();
      }
    };
    
    document.addEventListener('keydown', handleKeydown);
    
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  function renderSource(source) {
    const match = source.match(/\*\*(.*?):\*\*(.*)/);
    if (!match) return '';
    
    const label = match[1].trim();
    const content = match[2].trim();
    const urlMatch = content.match(/(.*?)(https?:\/\/[^\s]+)/);
    if (!urlMatch) return '';
    
    const text = urlMatch[1].trim();
    const url = urlMatch[2];
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    
    return {
      isVideo: label.toLowerCase() === 'video' && youtubeMatch,
      videoId: youtubeMatch ? youtubeMatch[1] : null,
      text,
      url
    };
  }
</script>

<svelte:head>
  <title>{selectedFallacy ? `${selectedFallacy.title} - ` : ''}Your Urbanism Fallacy Is...</title>
  {#if selectedFallacy}
    <meta name="description" content={selectedFallacy.claim} />
    <meta property="og:title" content={selectedFallacy.title} />
    <meta property="og:description" content={selectedFallacy.claim} />
    <meta property="og:type" content="article" />
  {/if}
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'primary-orange': '#ff6b35',
            'bright-orange': '#ff8c42',
            'dark-orange': '#e55525',
            'bg-dark': '#0a0a0a',
            'bg-card': '#1a1a1a',
            'bg-card-hover': '#252525',
            'text-secondary': '#b0b0b0',
          }
        }
      }
    }
  </script>
</svelte:head>

<style>
  @keyframes shimmer {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  .animate-shimmer {
    animation: shimmer 3s infinite;
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.2s ease;
  }
  
  .animate-slideIn {
    animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  :global(body) {
    background: #0a0a0a;
    background-image: 
      radial-gradient(circle at 20% 50%, rgba(255, 107, 53, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(255, 107, 53, 0.05) 0%, transparent 50%);
    min-height: 100vh;
  }
</style>

<header class="bg-gradient-to-br from-bg-card to-bg-dark border-b-2 border-primary-orange text-white py-16 px-5 text-center relative overflow-hidden">
  <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary-orange to-transparent animate-shimmer"></div>
  <div class="max-w-[1000px] mx-auto px-5">
    <h1 class="text-5xl md:text-6xl mb-4 font-extrabold bg-gradient-to-br from-bright-orange to-primary-orange bg-clip-text text-transparent tracking-tight">
      Your Urbanism Fallacy Is...
    </h1>
  </div>
</header>

<main class="max-w-[1000px] mx-auto px-5">
  <div class="my-10 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] max-[480px]:grid-cols-1">
    {#each fallacies as fallacy}
      <button 
        class="flex flex-col items-center justify-center w-full bg-bg-card border-2 border-primary-orange/30 p-7 text-lg font-semibold text-white cursor-pointer rounded-xl transition-all duration-300 ease-out text-center relative overflow-hidden min-h-[180px] hover:bg-bg-card-hover hover:border-primary-orange hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,107,53,0.3),0_12px_32px_rgba(0,0,0,0.5)] active:translate-y-0 sm:text-base sm:p-5 sm:min-h-[160px]"
        on:click={() => openFallacy(fallacy)}
      >
        <div class="w-16 h-16 mb-4 bg-primary-orange/15 border-2 border-primary-orange rounded-xl flex items-center justify-center text-3xl transition-all duration-300 ease-out sm:w-14 sm:h-14 sm:text-[1.75em]">
          {fallacy.icon}
        </div>
        <div>{fallacy.title}</div>
      </button>
    {/each}
  </div>
</main>

<footer class="text-center py-16 px-5 text-text-secondary text-sm border-t border-primary-orange/10 mt-16">
  <div class="max-w-[1000px] mx-auto px-5">
    <p>
      Inspired by <a href="https://yourveganfallacyis.com/en" target="_blank" class="text-primary-orange no-underline font-semibold transition-colors duration-300 hover:text-bright-orange hover:underline">Your Vegan Fallacy Is</a>
    </p>
  </div>
</footer>

{#if selectedFallacy}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div 
    class="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1000] flex items-center justify-center p-5 animate-fadeIn" 
    on:click={closeModalOverlay}
  >
    <div class="bg-bg-card border border-primary-orange/30 max-w-[800px] w-full max-h-[90vh] overflow-y-auto rounded-[20px] shadow-[0_0_60px_rgba(255,107,53,0.3),0_20px_60px_rgba(0,0,0,0.6)] relative animate-slideIn [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-bg-dark [&::-webkit-scrollbar-thumb]:bg-primary-orange [&::-webkit-scrollbar-thumb]:rounded-md [&::-webkit-scrollbar-thumb:hover]:bg-bright-orange">
      <div class="bg-gradient-to-br from-primary-orange to-dark-orange text-white p-10 relative rounded-t-[20px]">
        <button 
          class="absolute top-5 right-5 bg-black/20 border-2 border-white/30 text-white text-2xl cursor-pointer w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 font-light hover:bg-black/40 hover:border-white/60 hover:rotate-90"
          on:click={closeModal}
        >
          &times;
        </button>
        <h2 class="text-4xl mb-0 font-extrabold pr-12 leading-tight md:text-2xl">
          {selectedFallacy.title}
        </h2>
      </div>
      <div class="p-10 bg-bg-dark md:p-6">
        <div class="bg-primary-orange/10 border-l-4 border-primary-orange p-6 mb-8 italic rounded-lg text-text-secondary text-lg leading-relaxed">
          {selectedFallacy.claim}
        </div>
        <div class="response-section">
          <h3 class="text-primary-orange mb-5 text-2xl font-bold">The Reality</h3>
          {#each selectedFallacy.response.split('\n\n') as paragraph}
            <p class="mb-5 text-lg leading-relaxed text-text-secondary">{paragraph}</p>
          {/each}
        </div>
        {#if selectedFallacy.sources && selectedFallacy.sources.length > 0}
          <div class="mt-8 pt-6 border-t-2 border-primary-orange/20">
            <h3 class="text-primary-orange mb-5 text-2xl font-bold">Sources</h3>
            {#each selectedFallacy.sources as source}
              {@const rendered = renderSource(source)}
              {#if rendered.isVideo && rendered.videoId}
                <div class="mb-6 bg-bg-card border-2 border-primary-orange/30 rounded-xl overflow-hidden">
                  <div class="relative pb-[56.25%] h-0 overflow-hidden bg-black">
                    <iframe 
                      class="absolute top-0 left-0 w-full h-full border-0"
                      src="https://www.youtube.com/embed/{rendered.videoId}" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowfullscreen
                      title={rendered.text}
                    ></iframe>
                  </div>
                  <div class="p-3 text-text-secondary text-sm bg-primary-orange/5">
                    <a href={rendered.url} target="_blank" rel="noopener noreferrer" class="text-white no-underline font-semibold transition-colors duration-300 hover:text-primary-orange">{rendered.text}</a>
                  </div>
                </div>
              {/if}
            {/each}
            <div class="grid gap-3 mt-4">
              {#each selectedFallacy.sources as source}
                {@const rendered = renderSource(source)}
                {#if !rendered.isVideo && rendered.url}
                  <div class="p-3 bg-primary-orange/5 border-l-[3px] border-primary-orange rounded-md">
                    <a href={rendered.url} target="_blank" rel="noopener noreferrer" class="text-text-secondary no-underline transition-colors duration-300 text-sm leading-relaxed block hover:text-bright-orange hover:underline">{rendered.text || rendered.url}</a>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
