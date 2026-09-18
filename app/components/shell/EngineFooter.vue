<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <footer class="engine-footer">
    {{ t('footer.line1') }}<br><br>
    <span class="coords">{{ t('footer.line2Before') }}</span>{{ t('footer.line2After') }}
    <ShellApiStatus />
    <img
      class="prowmark"
      src="/brand/prow.png"
      alt=""
      width="46"
      height="24"
      draggable="false"
    >
  </footer>
</template>
