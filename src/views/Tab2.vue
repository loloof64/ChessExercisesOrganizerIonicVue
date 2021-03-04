<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ getTranslation("download_tab.title") }}</ion-title>
        <ion-button @click="connectToDropbox">
          {{ getTranslation("download_tab.connect_button") }}
        </ion-button>
        <a v-if="isConnected" :href="authUrl" class="actionButton">
          {{ getTranslation("download_tab.download_button") }}
        </a>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Tab 2</ion-title>
        </ion-toolbar>
      </ion-header>

      <ExploreContainer name="Tab 2 page" />
    </ion-content>
  </ion-page>
</template>

<script>
import DropboxCommunication from "@/services/DropboxCommunication";
import { ref, computed } from "vue";
import useTranslationUtils from "@/hooks/TranslationUtils";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
} from "@ionic/vue";
import ExploreContainer from "@/components/ExploreContainer.vue";

export default {
  name: "Tab2",
  components: {
    ExploreContainer,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonButton,
  },
  setup() {
    const { getTranslation, initTranslationsUtils } = useTranslationUtils();
    initTranslationsUtils();

    const dropboxChannel = ref(new DropboxCommunication());
    const authUrl = ref(null);
    const isConnected = computed(() => {
      return false;
    });

    const connectToDropbox = async () => {
      try {
        const localAuthUrl = await dropboxChannel.value.connect();
        authUrl.value = localAuthUrl;
      } catch (err) {
        console.error(err);
      }
    };

    return {
      getTranslation,
      connectToDropbox,
      isConnected,
      authUrl,
    };
  },
};
</script>

<style scoped>
a.actionButton {
  margin: 3px;
  padding: 10px;
  background-color: green;
  color: white;
  border-radius: 3px;
}
</style>
