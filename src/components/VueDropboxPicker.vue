<template>
  <div
    v-if="scriptLoaded && dropboxChooserIsSupported && buttonType == 'chooser'"
    @click="dropboxIconClicked"
  >
    <slot />
    <button v-if="!this.$slots.default">Open dropbox picker</button>
  </div>
  <div
    v-if="scriptLoaded && dropboxChooserIsSupported && buttonType == 'saver'"
    @click="dropboxSaverIconClicked"
  >
    <slot />
    <button v-if="!this.$slots.default">Save to Dropbox</button>
  </div>
</template>

<script>
//Taken from https://github.com/Feniksss/vue-dropbox-chooser/blob/master/src/components/DropboxPicker.vue
export default {
  emits: ["picked", "saved", "cancel", "progress", "error"],
  props: {
    apiKey: {
      type: String,
      required: true,
    },
    linkType: {
      type: String,
      default: "preview",
    },
    multiselect: {
      type: Boolean,
      default: false,
    },
    extensions: {
      type: Array,
      default: function() {
        return [];
      },
    },
    folderselect: {
      type: Boolean,
      default: false,
    },
    sizeLimit: {
      type: Number,
      default: 0,
    },
    buttonType: {
      type: String,
      default: "chooser",
    },
    uploadFiles: {
      type: Array,
      default: function() {
        return [];
      },
    },
  },
  data: () => ({
    scriptLoaded: false,
    dropboxChooserIsSupported: false,
  }),
  mounted() {
    if (window.Dropbox) {
      this.scriptLoaded = true;
    } else {
      const dropBoxScript = document.createElement("script");
      dropBoxScript.onload = () => {
        this.scriptLoaded = true;
        this.dropboxChooserIsSupported = window.Dropbox.isBrowserSupported();
        if (!this.dropboxChooserIsSupported) {
          console.warn("VueDropboxPicker: This browser is not supported");
        }
      };
      dropBoxScript.setAttribute(
        "src",
        "https://www.dropbox.com/static/api/2/dropins.js"
      );
      dropBoxScript.setAttribute("id", "dropboxjs");
      dropBoxScript.setAttribute("data-app-key", this.apiKey);
      document.head.appendChild(dropBoxScript);
    }
  },
  methods: {
    dropboxIconClicked() {
      var that = this;
      let options = {
        success: async (files) => {
          let attachments = [];
          for (let i = 0; i < files.length; i++) {
            let attachment = {};
            attachment._id = files[i].id;
            attachment.title = files[i].name;
            attachment.size = files[i].bytes;
            attachment.iconURL = files[i].icon;
            attachment.link = files[i].link;
            attachment.extension = `. ${files[i].name.split(".")[1]}`;
            attachments.push(attachment);
          }
          that.tempAttachments = attachments;
          that.$emit("picked", that.tempAttachments);
        },
        cancel: function() {
          that.$emit("cancel");
        },
        linkType: that.linkType,
        multiselect: that.multiselect,
        folderselect: that.folderselect,
      };
      if (this.extensions.length) {
        options.extensions = this.extensions;
      }
      if (this.sizeLimit) {
        options.sizeLimit = this.sizeLimit;
      }
      window.Dropbox.choose(options);
    },
    dropboxSaverIconClicked() {
      var that = this;
      let options = {
        files: this.uploadFiles,
        success: function() {
          that.$emit("saved");
        },
        cancel: function() {
          that.$emit("cancel");
        },
        progress: function(progress) {
          that.$emit("progress", { progress: progress });
        },
        error: function(errorMessage) {
          that.$emit("error", { errorMessage: errorMessage });
        },
      };
      if (this.extensions.length) {
        options.extensions = this.extensions;
      }
      if (this.sizeLimit) {
        options.sizeLimit = this.sizeLimit;
      }
      window.Dropbox.save(options);
    },
  },
};
</script>

<style></style>
