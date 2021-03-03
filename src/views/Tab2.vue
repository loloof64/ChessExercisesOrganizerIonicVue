<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ getTranslation("download_tab.title") }}</ion-title>
        <VueDropboxPicker
          :api-key="dropboxApiKey"
          link-type="direct"
          :multiselect="true"
          :extensions="['.pgn']"
          :folderselect="false"
          button-type="chooser"
          @picked="onPicked"
        >
          <span class="dropbox_button">{{ getTranslation("download_tab.download_button") }}</span>
        </VueDropboxPicker>
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
import dropboxKey from "@/services/dropboxkey.json";
import { ref } from "vue";
import useTranslationUtils from "@/hooks/TranslationUtils";
import VueDropboxPicker from "@/components/VueDropboxPicker";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
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
    VueDropboxPicker,
  },
  setup() {
    const { getTranslation, initTranslationsUtils } = useTranslationUtils();
    initTranslationsUtils();

    const dropboxApiKey = ref(dropboxKey.id);

    function onPicked(data) {
      console.log(data.map(it => it.link));
    }

    return {
      getTranslation,
      dropboxApiKey,
      onPicked, 
    };
  },
};
</script>

<style scoped>
.dropbox_button {
  margin: 5px;
  padding: 5px 20px;
  text-decoration: none;
  background-color: green;
  color: whitesmoke;
  border-radius: 10px;
}
</style>
