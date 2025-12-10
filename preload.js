const { contextBridge, ipcRenderer } = require('electron');

// Exemplo de como expor APIs seguras para o processo de renderização (seu index.html)
// Por enquanto, não vamos expor nada, mas a estrutura está aqui.
contextBridge.exposeInMainWorld('electronAPI', {
  // Exemplo: toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen')
});

console.log('Preload script loaded.');