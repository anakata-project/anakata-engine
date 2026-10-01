// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import { getDefaultAttributes } from 'eslint-plugin-better-tailwindcss/api/defaults'

export default withNuxt(
  betterTailwindcss.configs['correctness-error'],
  {
    settings: {
      'better-tailwindcss': {
        entryPoint: '../anakata-ui/app/assets/css/main.css',
        attributes: [
          ...getDefaultAttributes(),
          ['^v-bind:ui$', [{ match: 'objectValues' }]]
        ]
      }
    },
    rules: {
      'better-tailwindcss/no-unknown-classes': ['error', {
        ignore: [
          '^(engine|topbar|brand|brand-mark|brand-mark--dark|brand-mark--light|topnav|nav-toggle|on|lang|locale|wrap|stage|home|heroband|sky|coords|coords-point|coords-dash|coords-place|disp|hero-desk|hero-mob|hero-line|sub|find-title|hero-prow|stepper|step|dot|lbl|done|current|upcoming|crumbs|crumb|cur|engine-footer|footer-intimate|footer-mark|footer-kicker|footer-social|soc|footer-bar|footer-rights|guest-panel|guest-note|guest-lines|guest-aside|gstep|prowmark|placeholder-copy|engine-placeholder|engine-placeholder__header|engine-placeholder__title|engine-placeholder__body|btn|cta|o|lb|ico|mono|klabel|bbnote|bookwrap|bookbar|bb|open|pop|yr|mgrid|mn|dis|sel|inrange|hint|gpop|grow|gl|n|itins|itin|img|grad|tag|tagline|bd|chips|chip|dealbar|foot|price|f|v|depsList|dlInner|overview|depRow|full|deal-on|d|y|st-av|st-ur|st-fu|dep-actions|pr|deal|was|nowpr|waitlist-mask|waitlist-stub|waitlist-form|consent-bar|consent-actions|complete-page|scale-row|duebox|locked|guardian|detgrid|trip-main|dt-head|badges|badge|hl|hero|tagg|facts|fact|fact-mark|fl|fv|desc|tabs|tab|tabbody|hlrow|spaced|dt-actions|trip-sheet|trip-kicker|route-line|faq|faq-q|faq-a|faq-plus|dates-more|go-back|dth|dtable|dhead|drow|selrow|dd|outside|dy|dcta|rail|railbox|from|amt|tick|railsel|rail-cta|railnote|route-map|eyebrow|days|railfoot|mapwrap|map|card|cday|sites|tags|w|dayrow|active|val|act|cabgrid|suite-page|suite-head|suite-status|suite-picks|suite-field|suite-count|suite-count-menu|suite-count-item|suite-count-label|suite-board|suite-layout|suite-slots|suite-slot|suite-rail|slot-kicker|slot-name|guest-line|guest-step|your-selection|pick-card|pick-copy|pick-kicker|pick-points|deck-block|deck-kicker|deck-key|swatch|suite-actions|swatch|av|hold|booked|details-page|details-layout|details-rail|details-block|details-back|contact-names|is-placeholder|proceed-title|wgrid|selbox|partyline|cabtabs|cabtab|cabtab-row|t|s|deck|deck-200|deck-plan|ori|hull|cabrow|owner|cabx|cn|ct|taken|cabwarn|side|line|hd|sand|info|tot|note|promo|pmsg|applied|paths|path|ph|pd|pay|perk|payzero|r|fsec|field|err|cols2|radio|opt|chkrow|guest-row|ver|confirm|bigid|next3|nx|itin-kicker|itin-layout|itin-search|itin-desk|itin-mfind|itin-mbox|itin-mrow|itin-mval|itin-mpop|itin-mnote|itin-panel|yr-tabs|yr-tab|itin-guest|itin-gl|search-btn|itin-main|photo|map-btn|dur|specs|occ|see-dates|chev|dep-year|yacht-ico|dep-act|dep-pick|dep-continue|dep-go|dep-arrow)$'
        ]
      }]
    }
  }
)
