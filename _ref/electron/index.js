import { app, BrowserWindow, screen, shell, Menu, dialog, globalShortcut, ipcMain, Tray } from 'electron';
import electronSquirrelStartup from 'electron-squirrel-startup';
import Store from 'electron-store';
const store = new Store();
import path, { dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const port = 55106;

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('fxd', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('fxd')
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (electronSquirrelStartup) {
  app.quit();
}

let mainWindow;
let appicon;

const createWindow = async () => {
  // 动态导入模块
  const appModulePath = path.join(__dirname, 'local-api', 'app.js');
  const appModule = await import(pathToFileURL(appModulePath));
  console.log('appModule', appModule);

  app.server = appModule.default(port, globalShortcut, BrowserWindow);
  // Create the browser window.

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  let windowWidth = Math.round(width * 0.9) > 900 ? 900 : Math.round(width * 0.9);
  let windowHeight = Math.round(height * 0.9) > 600 ? 600 : Math.round(height * 0.9);
  let windowX = Math.round(width * 0.05);
  let windowY = Math.round(height * 0.05);


  const windowBounds = store.get('windowBounds');
  if (windowBounds) {
    const { width, height, x, y } = windowBounds;
    if (width) windowWidth = width;
    if (height) windowHeight = height;

    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    // 如果位置超出显示器，改为铺满屏幕
    windowX = x + width > screenWidth ? 0 : x;
    windowY = y + height > screenHeight ? 0 : y;
  }
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: windowX,
    y: windowY,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    // frame: true,
    // transparent: true,
    resizable: true,
    autoHideMenuBar: process.platform === 'win32' ? true : false,
  });

  // and load the index.html of the app.
  // mainWindow.loadFile(path.join(__dirname, 'index.html'));
  // 如果 store 中有值，就用 store 中的值
  const mainWindowUrl = store.get('mainWindowUrl');

  // 当环境变量 DEV 为 true 时，加载本地服务
  if (process.env.DEV_IN_ELECTRON) {
    mainWindow.loadURL(`http://dd.ftqq.com:5173`);
  } else {
    mainWindow.loadURL(`http://localhost:${port}`);
  }

  // if (mainWindowUrl) {
  //   mainWindow.loadURL(mainWindowUrl);
  // } else {
  //   mainWindow.loadURL(`http://dd.ftqq.com:5173`);
  // }
  // mainWindow.loadURL(`http://localhost:${port}`);
  // if (mainWindowUrl) {
  //   mainWindow.loadURL(mainWindowUrl);
  // } else {
  //   mainWindow.loadURL(`http://localhost:${port}`);
  // }


  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
  // 当 mainWindow URL 改变时，更新 store 中的值
  mainWindow.webContents.on('did-navigate-in-page', (event, url) => {
    console.log('did-navigate-in-page', url);
    store.set('mainWindowUrl', url);
  });

  // 当 mainWindow 移动或者resize时，更新 store 中的值
  mainWindow.on('move', () => {
    const { width, height, x, y } = mainWindow.getBounds();
    store.set('windowBounds', { width, height, x, y });
  });
  mainWindow.on('resize', () => {
    const { width, height, x, y } = mainWindow.getBounds();
    store.set('windowBounds', { width, height, x, y });
  });

  let menu = Menu.buildFromTemplate([
    {
      label: '关于',
      submenu: [
        { label: `FlowDeer V${app.getVersion()}`, role: 'about' },
        { label: '退出', role: 'quit', accelerator: 'CmdOrCtrl+Q', click: () => { app.quit(); } },
      ]
    }
    ,
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo', accelerator: 'CmdOrCtrl+Z' },
        { label: '重做', role: 'redo', accelerator: 'CmdOrCtrl+Y' },
        { type: 'separator' },
        { label: '剪切', role: 'cut', accelerator: 'CmdOrCtrl+X' },
        { label: '复制', role: 'copy', accelerator: 'CmdOrCtrl+C' },
        { label: '粘贴', role: 'paste', accelerator: 'CmdOrCtrl+V' },
        { label: '全选', role: 'selectAll', accelerator: 'CmdOrCtrl+A' },
        { type: 'separator' },
        { label: '查找', role: 'find', accelerator: 'CmdOrCtrl+F' },
        { label: '替换', role: 'replace', accelerator: 'CmdOrCtrl+H' },
        { type: 'separator' },
        // 打开 devtools
        { label: '开发者工具', role: 'toggleDevTools', accelerator: 'CmdOrCtrl+Alt+I' },
        // 鼠标右键
        { label: '刷新', role: 'reload', accelerator: 'CmdOrCtrl+R' },
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
  // windows 下 設置 Tray 菜單
  if (process.platform === 'win32') {
    appicon = new Tray(path.join(__dirname, '..' ,'image', 'icon.ico'));
    appicon.setToolTip('FlowDeer');
    appicon.setContextMenu(menu);  
  }    


  // 监听主窗口加载完成事件
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      // config.fileProtocol is my custom file protocol
      if (url.startsWith('file:')) {
        return { action: 'allow' };
      }
      // open url in a browser and prevent default
      shell.openExternal(url);
      return { action: 'deny' };
    });
  })

};

// 如果是 Mac OS 
// if (process.platform === 'darwin') {

//   interfaceInit(app)

//   // 处理协议 在本例中，我们选择显示一个错误提示对话框。
//   app.on('open-url', (event, url) => {
//     // 从 mainwindow 中获取 window.origin
//     urlToLogin(url, mainWindow)
//   })

// } else {
//   const gotTheLock = app.requestSingleInstanceLock()

//   if (!gotTheLock) {
//     app.quit()
//   } else {
//     app.on('second-instance', (event, commandLine, workingDirectory) => {
//       // 用户正在尝试运行第二个实例，我们需要让焦点指向我们的窗口
//       if (mainWindow) {
//         if (mainWindow.isMinimized()) mainWindow.restore()
//         mainWindow.focus()
//       }
//       // 命令行是一个字符串数组，其中最后一个元素是深度链接的URL。
//       // dialog.showErrorBox('Welcome Back', `You arrived from: ${commandLine.pop()}`)
//       urlToLogin(commandLine.pop(), mainWindow)
//     })

//     // 创建主窗口，加载应用程序的其他部分，等等...
//     interfaceInit(app)

//   }
// }

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}
else{
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 用户正在尝试运行第二个实例，我们需要让焦点指向我们的窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      urlToLogin(commandLine.pop(), mainWindow)
    }
  })

  // 创建主窗口，加载应用程序的其他部分，等等...
  interfaceInit(app)

  app.on('open-url', (event, url) => {
    // 从 mainwindow 中获取 window.origin
    urlToLogin(url, mainWindow)
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 退出之前完成一些操作
app.on('before-quit', () => {
  console.log('before-quit');
  // 关闭server
  app.server.close();
});

function urlToLogin(url, mainWindow) {
  if( !mainWindow ) return  false;
  const clientURL = mainWindow.webContents.getURL()
  const origin = new URL(clientURL).origin

  // 从 url 中获取 querystring 里边的 token
  const token = new URL(url).searchParams.get('token')

  // 拼接目标地址
  const targetURL = `${origin}/login/auto?token=${token}`

  // 转向
  mainWindow.loadURL(targetURL)

  // 将Token写入 ~/.fxd/token
  // const tokenPath = path.join(app.getPath('home'), '.fxd', 'token')
  // fs.writeFileSync(tokenPath, token)
}

function interfaceInit(app) {
  app.whenReady().then(() => {
    ipcMain.handle('helper:selector', handleSelector)
    createWindow();
  });
}

function createNewWindow(url) {
  // 占用 90% 的屏幕
  
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  let windowWidth = Math.round(width * 0.9);
  if( String(url).includes('/chat') && windowWidth > 600 ) windowWidth = 600;
  const windowHeight = Math.round(height * 0.9);
  const windowX = Math.round(width * 0.05);
  const windowY = Math.round(height * 0.05);

  const newWin = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: windowX,
      y: windowY,
      webPreferences: {
          preload: path.join(__dirname, 'preload.js')
      }
  });

  newWin.loadURL(url); // 使用 loadURL 而不是 loadFile
  // 注入脚本，点击链接则发送open-new-window事件 
  newWin.webContents.executeJavaScript(`
  window.addEventListener('click', (event) => {
    const { target } = event

    // 检查点击目标是否为链接
    if (target.tagName === 'A' && target.href.startsWith('http')) {
      // 阻止默认行为(在 Electron 窗口内打开)
      event.preventDefault()

      // 在默认浏览器中打开链接
      window.fxd.openNewWindow(target.href);
    }
  })
  `);

}

ipcMain.on('open-new-window', (event, url) => {
  // 检查 url 是否包含 http 或者 https 开头
  if( url.startsWith('http') ){
      // createNewWindow(url);
      // 外部网址用浏览器打开
      shell.openExternal(url);
      return;
  }else
  {
    // 拼接 http://localhost:port
    // 去掉 url 前面的 /
    const cleanUrl = url.replace(/^\//, '');
    const fullUrl = `http://localhost:${port}/${cleanUrl}`;
    createNewWindow(fullUrl);
    return;
  }
});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
async function handleSelector(event, url) {
  if (!url) return false;
  console.log("url", url);

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  let windowWidth = Math.round(width * 0.9);
  if( String(url).includes('/chat') && windowWidth > 600 ) windowWidth = 600;
  const windowHeight = Math.round(height * 0.9);
  const windowX = Math.round(width * 0.05);
  const windowY = Math.round(height * 0.05);

  const selectorWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: windowX,
      y: windowY,
      webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
      },
  });

  // selectorWindow.webContents.openDevTools();

  const js_string = fs.readFileSync(path.join(__dirname, 'dom-inspector.min.js'), 'utf8') + "\r\n" +
      `
      function getFavicon(){
          var favicon = undefined;
          var nodeList = document.getElementsByTagName("link");
          for (var i = 0; i < nodeList.length; i++)
          {
              if((nodeList[i].getAttribute("rel") == "icon")||(nodeList[i].getAttribute("rel") == "shortcut icon"))
              {
                  favicon = nodeList[i].getAttribute("href");
              }
          }
          return favicon;
      }

      function getFaviconUrl(){
          let icon_url = getFavicon();
          if( !icon_url ) return null;
          if( icon_url.substring(0,4) != 'http' )
          {
              if( icon_url.substring(0,2) == '//' )
              {
                  icon_url = window.location.protocol + icon_url;
              }else
              {
                  if( icon_url.substring(0,1) != '/' ) icon_url = window.origin+ '/' + icon_url;
                  else icon_url = window.origin + icon_url;
              }
          }
          return icon_url;
      }
      function launchDomInspector() {
          inspector = new DomInspector({
              maxZIndex: 9999,
              onClick: async (element) => {
                element.favIcon = getFaviconUrl();
                element.title = document.title;
                element.url = window.location.href;
                window.fxd.sendSelectedElement(element);
              }
          });
          inspector.enable();
          alert("可视化选择器已启动，请移动鼠标框住要获取Selector的区域后点击");
          document.addEventListener('keyup', e => {
              if (e.key === "Escape") {
                  if (!inspector.is_enabled) {
                      inspector.enable();
                      inspector.is_enabled = true;
                  } else {
                      inspector.disable();
                      inspector.is_enabled = false;
                  }
              }
          });
      }

      if (!window.__fxd_inspector_injected__) {
        const btn = document.createElement('button');
        btn.id = "btn_launch_inspector";
        btn.innerText = "点我开始选择监测元素";
        btn.style.position = "fixed";
        btn.style.bottom = "0px";
        btn.style.right = "0px";
        btn.style.zIndex = "9999";
        btn.style.margin = "5px";
        btn.onclick = launchDomInspector;
        document.body.appendChild(btn);
        window.__fxd_inspector_injected__ = true;
      }

      `

  selectorWindow.loadURL(`${url}`);
  const injectScript = () => {
    selectorWindow.webContents.executeJavaScript(js_string).catch(console.error);
  };

  selectorWindow.webContents.on('dom-ready', injectScript);
  selectorWindow.webContents.on('did-navigate', injectScript);

  selectorWindow.webContents.setWindowOpenHandler(({ url }) => {
    selectorWindow.loadURL(url);
    return { action: 'deny' };
  });

  return new Promise((resolve) => {
    const onSelectedElement = (event, element) => {
      // console.log('Selected element:', element);
      selectorWindow.close();
      ipcMain.removeListener('selected-element', onSelectedElement);
      resolve(element);
    };

    ipcMain.on('selected-element', onSelectedElement);

    selectorWindow.on('closed', () => {
      ipcMain.removeListener('selected-element', onSelectedElement);
    });
  });
}
