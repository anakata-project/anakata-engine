<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <footer class="engine-footer">
    <p class="footer-intimate">
      {{ t('footer.intimate') }}
    </p>
    <img
      class="footer-mark"
      src="/brand/wordmark-dark.png"
      alt=""
      draggable="false"
    >
    <p class="footer-kicker">
      {{ t('footer.yacht') }}
    </p>
    <div class="footer-social">
      <span
        class="soc"
        :aria-label="t('footer.instagram')"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
        >
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
          />
          <circle
            cx="12"
            cy="12"
            r="4.2"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
          />
          <circle
            cx="17.2"
            cy="6.8"
            r="1"
            fill="currentColor"
          />
        </svg>
      </span>
      <span
        class="soc"
        :aria-label="t('footer.linkedin')"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
        >
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
          />
          <path
            d="M8 10.5V17M8 7.5v.2M12 17v-4.2a2 2 0 0 1 4 0V17M12 12.2V17"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </span>
    </div>
    <div class="footer-bar">
      <nav>
        <span>{{ t('footer.terms') }}</span>
        <span>{{ t('footer.privacy') }}</span>
        <span>{{ t('footer.privacy') }}</span>
      </nav>
      <p>
        <span>{{ t('footer.credit') }}</span>
        <span>{{ t('footer.rights') }}</span>
      </p>
    </div>
  </footer>
</template>
