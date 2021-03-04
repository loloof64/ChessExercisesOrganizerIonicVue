import { DropboxAuth } from "dropbox";

import dropboxKey from "@/services/dropboxkey.json";
const dropboxApiKey = dropboxKey.id;

export default class DropboxCommunication {
  connect() {
    return new Promise((resolve, reject) => {
      const dbx = new DropboxAuth({
        clientId: dropboxApiKey,
      });
      dbx
        .getAuthenticationUrl(
          "http://localhost:8100/auth",
          null,
          "code",
          "offline",
          ["files.metadata.read", "files.content.read"],
          "none",
          true
        )
        .then((uri) => {
          resolve(uri);
        })
        .catch((err) => reject(err));
    });
  }
}
