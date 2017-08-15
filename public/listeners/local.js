const {
  ipcMain,
} = require('electron');

const openApp = require('../libs/open-app');
const scanInstalledAsync = require('../libs/scan-installed-async');
const uninstallAppAsync = require('../libs/uninstall-app-async');
const installAppAsync = require('../libs/install-app-async');

const loadLocalListeners = () => {
  ipcMain.on('scan-installed-apps', (e) => {
    scanInstalledAsync()
      .then((installedApps) => {
        installedApps.forEach((installedApp) => {
          e.sender.send('set-local-app', installedApp.id, 'INSTALLED', installedApp);
        });
      })
      .catch(err => e.sender.send('log', err));
  });

  ipcMain.on('open-app', (e, id, name) => {
    openApp(id, name);
  });

  ipcMain.on('uninstall-app', (e, id, name) => {
    e.sender.send('set-local-app', id, 'UNINSTALLING');

    uninstallAppAsync(id, name, { shouldClearStorageData: true })
      .then(() => e.sender.send('set-local-app', id, null))
      .catch((err) => {
        e.sender.send('log', err);
        e.sender.send('set-local-app', id, 'INSTALLED');
      });
  });

  let p = Promise.resolve();

  ipcMain.on('install-app', (e, appObj) => {
    e.sender.send('set-local-app', appObj.id, 'INSTALLING');

    p = p.then(() => installAppAsync(appObj))
      .then(() => e.sender.send('set-local-app', appObj.id, 'INSTALLED'))
      .catch((err) => {
        e.sender.send('log', err);
        e.sender.send('set-local-app', appObj.id, null);
      });
  });
};

module.exports = loadLocalListeners;
