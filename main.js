const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Cria a janela do navegador.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // __dirname aponta para a raiz do projeto
      // preload: path.join(__dirname, 'preload.js') // Descomente se precisar de scripts de pré-carregamento
    },
    // Ícone da janela (opcional, mas recomendado)
    // icon: path.join(__dirname, 'caminho/para/seu/icone.ico') 
  });

  // e carrega o index.html do seu aplicativo.
  mainWindow.loadFile('Index.html');

  // Abre o DevTools (ferramentas de desenvolvedor) - opcional.
  // mainWindow.webContents.openDevTools();
}

// Este método será chamado quando o Electron terminar
// a inicialização e estiver pronto para criar janelas do navegador.
app.whenReady().then(createWindow);

// Encerra o aplicativo quando todas as janelas são fechadas (exceto no macOS).
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});