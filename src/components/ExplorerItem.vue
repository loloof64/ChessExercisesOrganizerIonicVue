<template>
  <div class="item" @click="handleClick">
    <ion-img class="icon" :src="image"></ion-img>
    <div class="filename">{{ name }}</div>
  </div>
</template>

<script>
import { IonImg } from "@ionic/vue";
export default {
  props: {
    type: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    function handleClick() {
      emit("click", { type: props.type, name: props.name });
    }

    return {
      handleClick,
    };
  },
  components: {
    IonImg,
  },
};
</script>

<style scoped>
.item {
  width: 100%;
  height: 18vw;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  border-bottom: 1px solid black;
}

.item > .icon {
  width: 14vw;
  height: 14vw;
  margin: 4vw;
}

.item > .filename {
  font-size: 0.8em;
}
</style>