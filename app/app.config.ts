export default defineAppConfig({
  ui: {
    button: {
      slots: {
        base: 'rounded-none font-mono font-normal text-[11px] tracking-[.24em] uppercase disabled:opacity-35 aria-disabled:opacity-35 active:scale-[.97] disabled:scale-100 aria-disabled:scale-100 transition-[background,transform,border-color,color] duration-200 ease-[var(--eo)]'
      },
      variants: {
        size: {
          md: {
            base: 'px-8 py-[15px] text-[11px] gap-2'
          }
        }
      }
    }
  }
})
