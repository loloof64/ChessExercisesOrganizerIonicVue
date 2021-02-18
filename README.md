# Chess Exercises Organizer Ionic Vue

Manage your chess exercises and train yourself with them against the device.

## Credits

* Using compiled Stockfish WebAssembly from project [Stockfish.js](https://github.com/nmrugg/stockfish.js/tree/master/src).
* Using some vectors from flaticon.com :
    * Folder : https://www.flaticon.com/free-icon/folder_715563 (by DinosoftLabs)
    * File : https://www.flaticon.com/free-icon/files_901533 (by PhatPlus)


## Developers

### Setup

1. Install NodeJs and Android Studio (and eventually yarn)
2. `npm install -g @ionic/cli@latest native-run cordova-res` (or `yarn global add @ionic/cli@latest native-run cordova-res`)
3. `npm i` # installing dependencies (or `yarn`)
4. `cordova-res --copy` # generating icon and splash screen

### Build

1. `ionic build`
2. `npx cap copy`
3. `npx cap open android` # Also adapt capacitor.config.json, and change the path to Android Studio

You may also need to run `ionic capacitor update android`.