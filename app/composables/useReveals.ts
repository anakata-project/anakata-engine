export function watchReveals(root?: ParentNode): void {
  if (!import.meta.client) {
    return
  }

  const scope = root ?? document
  const els = Array.from(scope.querySelectorAll<HTMLElement>('[data-reveal]:not(.rv)'))
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduced || typeof IntersectionObserver === 'undefined') {
    els.forEach(el => el.classList.add('rv'))
    return
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('rv')
        observer.unobserve(entry.target)
      }
    })
  }, { rootMargin: '-60px' })

  els.forEach(el => observer.observe(el))
}
