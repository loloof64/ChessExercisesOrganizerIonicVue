<template>
  <ion-page>
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tab1" href="/tabs/tab1">
          <ion-icon :icon="library" />
          <ion-label>{{ getTranslation("main_page.samples_tab") }}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/tabs/tab2">
          <ion-icon :icon="cloudDownloadOutline" />
          <ion-label>{{ getTranslation("main_page.cloud_tab")}}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" href="/tabs/tab3">
          <ion-icon :icon="square" />
          <ion-label>Tab 3</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script>
import {
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonLabel,
  IonIcon,
  IonPage,
} from "@ionic/vue";
import { ellipse, square, library, cloudDownloadOutline } from "ionicons/icons";
import useTranslationUtils from "@/hooks/TranslationUtils";

export default {
  name: "Tabs",
  components: { IonLabel, IonTabs, IonTabBar, IonTabButton, IonIcon, IonPage },
  setup() {
    const {getTranslation, initTranslationsUtils} = useTranslationUtils();
    initTranslationsUtils();

    return {
      ellipse,
      square,
      library,
      cloudDownloadOutline,
      getTranslation,
    };
  },
};
</script>