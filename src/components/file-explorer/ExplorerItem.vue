<template>
  <div
    class="item"
    @click="handleClick"
    :class="{ selected: selected }"
    :name="name"
  >
    <ion-img class="icon" :src="image"></ion-img>
    <div class="filename">{{ name }}</div>
  </div>
</template>

<script>
import Hammer from "hammerjs";
import { ref, onMounted } from "vue";
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
    selected: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const timer = ref(null);

    function handleClick() {
      emit("click", { type: props.type, name: props.name });
    }

    function startTimer() {
      const timeOutMs = 600;
      timer.value = setTimeout(toggleActivatedState, timeOutMs);
    }

    function cancelTimer() {
      if (timer.value !== null) {
        clearTimeout(timer.value);
      }
    }

    function toggleActivatedState() {
      emit("selected-changed");
    }

    onMounted(() => {
      if (props.type === 'goBack') return;
      const gesture = new Hammer(
        document.querySelector(`.item[name = '${props.name}']`)
      );
      gesture.get("tap").set({ enable: false });
      gesture.get("rotate").set({ enable: false });
      gesture.get("pinch").set({ enable: false });
      gesture.get("swipe").set({ enable: false });

      gesture.get("pan").set({ enable: false });
      gesture.on("press", startTimer);
      gesture.on("pressup", cancelTimer);
    });

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
  width: 70vw;
  font-size: 0.8em;
  word-wrap: break-word;
  overflow-wrap: anywhere;
}

.selected {
  background-color: slateblue;
}
</style>