# How to compile

## Windows
### First time setup:
1. Install the following programs:
    - The source code of the DIYPlayer (will be linked in the builds channel)
    - [NodeJS](https://nodejs.org/dist/v24.18.0/node-v24.18.0-x64.msi)
    - [git](https://github.com/git-for-windows/git/releases/download/v2.55.0.windows.2/Git-2.55.0.2-64-bit.exe)

2. Extract the source code of DIYPlayer and run `npm ci` inside of it
    - If you get an error saying "Scripts are disabled on this system", run the following command in a powershell window: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

3. Run either `set BUILD_SCAFFOLDING=true&& set INSTALL_SCAFFOLDING_DEPS=true&& npm run dev` if you are using CMD, or `$env:BUILD_SCAFFOLDING="true"; $env:INSTALL_SCAFFOLDING_DEPS="true"; npm run dev` if you are using Powershell.

4. Navigate to http://localhost:5173/ in your browser.

### Subsequent runs

1. Run `npm run dev`

2. Navigate to http://localhost:5173/ in your browser.

## Linux
The setup is effectively the same, just use `BUILD_SCAFFOLDING=true INSTALL_SCAFFOLDING_DEPS=true  npm run dev` as the command instead (because unix is better lol)

<br>

# How to add new Minigames

1. Upload your file to a file sharing service (eg; filegarden)

2. Add a link to your project to the list inside `routes/+page.svelte`
