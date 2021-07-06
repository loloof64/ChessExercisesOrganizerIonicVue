const axios = require("axios").default;
import sjcl from "sjcl";

import dropboxKey from "@/services/dropboxkey.json";

function generateCodeVerifier() {
  const randomLength = Math.floor(Math.random() * 85) + 43;
  let pass = "";
  for (let i = 0; i < randomLength; i++) {
    const randomCharCode = Math.floor(Math.random() * 94) + 32;
    const randomChar = String.fromCharCode(randomCharCode);
    pass += randomChar;
  }
  return pass;
}

function generateCodeChallengeFrom(codeVerifier) {
  const myBitArray = sjcl.hash.sha256.hash(codeVerifier);
  const sha256Code = sjcl.codec.hex.fromBits(myBitArray);
  return btoa(sha256Code);
}

function generateRandomState() {
  let pass = "";
  for (let i = 0; i < 100; i++) {
    const randomCharCode = Math.floor(Math.random() * 94) + 32;
    const randomChar = String.fromCharCode(randomCharCode);
    pass += randomChar;
  }
  return pass;
}

export default class DropboxCommunication {
  connect() {
    return new Promise((resolve, reject) => {
      const URL = "https://www.dropbox.com/oauth2/authorize";
      const verifier = generateCodeVerifier();
      const state = generateRandomState();
      const code_challenge = generateCodeChallengeFrom(verifier);
      const headers = {
        "Content-Type": "text/plain",
      };

      const params = {
        response_type: "code",
          client_id: dropboxKey.id,
          scope: [
            "account_info.read",
            "files.metadata.read",
            "files.content.read",
          ],
          state,
          code_challenge,
          code_challenge_method: "S256",
      };

      axios
        .get(URL, params, headers)
        .then((uri) => {
          resolve({ uri, verifier });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
