<template>
    <div id="root" :style="{ width: sizePixels, height: sizePixels}"></div>
</template>

<script>
import {computed} from 'vue';
export default {
    props: {
        sizePx: {
            type: Number,
            default: 60,
        }
    },
    setup(props) {
        const sizePixels = computed(function() {
            const {sizePx} = props;
            return sizePx+'px';
        });
        return {sizePixels};
    }
}
</script>

<style lang="scss" scoped>
    #root {
        background-color: orangered;
    }
</style>