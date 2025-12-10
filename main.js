const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Cria a janela do navegador.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets/icon.png'), // Ícone para Windows e Linux
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Altamente recomendado para segurança
      nodeIntegration: false // Altamente recomendado para segurança
    }
  });

  // e carrega o index.html do seu aplicativo.
  mainWindow.loadFile('Index.html');

  // Abre o DevTools (ferramentas de desenvolvedor) - opcional.
  // mainWindow.webContents.openDevTools();
}

// Este método será chamado quando o Electron terminar
// a inicialização e estiver pronto para criar janelas do navegador.
app.whenReady().then(createWindow);

app.on('activate', () => {
  // No macOS, é comum recriar uma janela no aplicativo quando o
  // ícone do dock é clicado e não há outras janelas abertas.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Encerra o aplicativo quando todas as janelas são fechadas (exceto no macOS).
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});