<template>
  <p>Authentication successful</p>
</template>

<script>
import { parseQueryString } from "@/utils/UrlUtils";
export default {
    setup() {
        const code = parseQueryString(window.location.href).code;
        console.log(code);
    }
};
</script>
