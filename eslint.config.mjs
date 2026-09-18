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
          '^(engine|topbar|brand|brand-mark--dark|brand-mark--light|topnav|on|lang|wrap|stage|heroband|sky|coords|disp|sub|crumbs|crumb|cur|done|engine-footer|prowmark|api-status|api-status--ok|api-status--down|placeholder-copy|engine-placeholder|engine-placeholder__header|engine-placeholder__title|engine-placeholder__body|btn|cta|o|lb|ico|mono)$'
        ]
      }]
    }
  }
)
