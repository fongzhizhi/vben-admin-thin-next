<template>
  <div>{{ vitePort }}</div>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';

  export default defineComponent({
    name: 'TestApp',
    setup() {
      const vitePort = ref(import.meta.env.VITE_PORT);
      return {
        vitePort,
      };
    },
  });
</script>
