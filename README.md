# Chess Exercises Organizer Ionic Vue

Manage your chess exercises and train yourself with them against the device.

## Credits

* Using compiled Stockfish WebAssembly from project [Stockfish.js](https://github.com/nmrugg/stockfish.js/tree/master/src).
* Using some vectors from flaticon.com :
    * Folder : https://www.flaticon.com/free-icon/folder_715563 (by DinosoftLabs)
    * File : https://www.flaticon.com/free-icon/files_901533 (by PhatPlus)


## Developers

### Setup

1. Set up a file `dropboxkey.json` in the folder `services` : put the client with the `id` key
    ```
    {
        "id": "YOUR_DROPBOX_CLIENT_ID"
    }
    ```
2. Install NodeJs (and eventually yarn)
3. `npm install -g @ionic/cli@latest native-run cordova-res` (or `yarn global add @ionic/cli@latest native-run cordova-res`)
4. `npm i` # installing dependencies (or `yarn`)
5. `cordova-res --copy` # generating icon and splash screen

### Build

`ionic build`

### Run 

`ionic capacitor run android --no-open`

even

`ionic capacitor run android --no-open -l --external` (for live reload on device)