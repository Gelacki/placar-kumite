// Variáveis globais
let timerInterval;
let duration = 180; // Duração padrão da partida em segundos (3 minutos)
let timeLeft = duration; // Tempo restante na partida
let pontos = { aka: 0, ao: 0 }; // Objeto para armazenar os pontos de cada atleta (AKA - vermelho, AO - azul)
let activeSenshu = null; // Rastreia quem tem a vantagem Senshu ('aka', 'ao' ou null)
let matchEnded = false; // Flag para indicar se a partida terminou, prevenindo ações adicionais

// Inicializa o display quando o DOM (Document Object Model) é carregado
document.addEventListener("DOMContentLoaded", () => {
  updateDisplay(); // Atualiza o display do timer e placar
  // Adiciona listeners de clique para permitir a edição dos nomes e da categoria
  document
    .getElementById("nomeAo")
    .addEventListener("click", () => editText("nomeAo", "Nome do Atleta AO"));
  document
    .getElementById("nomeAka")
    .addEventListener("click", () => editText("nomeAka", "Nome do Atleta AKA"));
  document
    .getElementById("categoria")
    .addEventListener("click", () =>
      editText("categoria", "Nome da Categoria")
    );
  document
    .getElementById("divisao")
    .addEventListener("click", () => editText("divisao", "Nome da Divisão"));

  // Delegação de eventos para os controles principais e placar
  document
    .querySelector(".placar")
    .addEventListener("click", handlePlacarClick);
  document
    .querySelector(".controle")
    .addEventListener("click", handleControleClick);
});

/**
 * Gerencia cliques nos botões do placar (pontos, penalidades, senshu) usando delegação de eventos.
 * @param {Event} e - O objeto do evento de clique.
 */
function handlePlacarClick(e) {
  const target = e.target;
  const action = target.dataset.action;

  if (!action) return;

  const atleta = target.dataset.atleta;

  switch (action) {
    case "add-ponto":
      const valor = parseInt(target.dataset.valor, 10);
      addPonto(atleta, valor);
      break;
    case "toggle-penalty":
      const tipo = target.dataset.tipo;
      togglePenalty(atleta, tipo);
      break;
    case "toggle-senshu":
      toggleSenshu(atleta);
      break;
  }
}

/**
 * Gerencia cliques nos botões de controle (timer, reset, etc.).
 * @param {Event} e - O objeto do evento de clique.
 */
function handleControleClick(e) {
  const action = e.target.dataset.action;
  if (!action) return;

  const actions = {
    "definir-tempo": definirTempo,
    "start-timer": startTimer,
    "pause-timer": pauseTimer,
    "reset-all": resetAll,
    "toggle-fullscreen": alternarTelaCheia,
  };

  if (actions[action]) {
    actions[action]();
  }
}

/**
 * Capitaliza (deixa em maiúscula) a primeira letra de uma string.
 * @param {string} str - A string de entrada.
 * @returns {string} A string com a primeira letra maiúscula.
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Permite a edição do conteúdo de texto para os nomes dos atletas e categoria.
 * @param {string} id - O ID do elemento HTML a ser editado.
 * @param {string} defaultText - O texto padrão para mostrar no prompt de edição.
 */
function editText(id, defaultText) {
  const element = document.getElementById(id);
  const currentText = element.innerText;
  let newText = prompt(`Enter new text for ${defaultText}:`, currentText);

  if (newText !== null) {
    // User did not cancel
    element.innerText = newText.trim() === "" ? defaultText : newText.trim(); // Se o texto for vazio, usa o padrão
  }
}

/**
 * Ativa ou desativa a vantagem Senshu para um atleta.
 * @param {string} lado - O lado ('aka' ou 'ao') para o qual ativar/desativar o Senshu.
 */
function toggleSenshu(lado) {
  if (matchEnded) return; // Não faz nada se a partida já terminou

  const btn = document.getElementById(lado + "Senshu");

  if (activeSenshu === lado) {
    // Se o Senshu já estiver ativo para este lado, desativa-o
    btn.classList.remove("active");
    activeSenshu = null;
  } else {
    // Desativa qualquer outro Senshu que esteja ativo
    if (activeSenshu) {
      document
        .getElementById(activeSenshu + "Senshu")
        .classList.remove("active");
    }
    // Ativa o Senshu para o novo lado
    btn.classList.add("active");
    activeSenshu = lado;
  }
}

/**
 * Adiciona ou subtrai pontos para um atleta.
 * Concede Senshu se for o primeiro ponto da partida.
 * @param {string} atleta - O lado do atleta ('aka' ou 'ao').
 * @param {number} valor - O valor do ponto a ser adicionado (ex: 1, 2, 3) ou subtraído (-1).
 */
function addPonto(atleta, valor) {
  if (matchEnded) return; // Impede a alteração do placar se a partida terminou

  const oldPoints = pontos[atleta];
  pontos[atleta] = Math.max(0, pontos[atleta] + valor); // Garante que a pontuação não seja negativa
  document.getElementById(`pontos${capitalize(atleta)}`).innerText =
    pontos[atleta];

  // Concede Senshu se for o primeiro ponto da partida e nenhum Senshu estiver ativo
  const totalPoints = pontos.aka + pontos.ao;
  if (totalPoints === valor && valor > 0 && activeSenshu === null) {
    toggleSenshu(atleta);
  }

  verificarVencedor(); // Verifica se há um vencedor após a mudança de pontos
}

/**
 * Ativa ou desativa uma penalidade para um atleta.
 * Aplica lógica específica para penalidades de Hansoku.
 * @param {string} atleta - O lado do atleta ('aka' ou 'ao').
 * @param {string} tipo - O tipo de penalidade (ex: 'C1', 'H').
 */
function togglePenalty(atleta, tipo) {
  if (matchEnded && tipo !== "H") return; // Permite que Hansoku seja alterado mesmo se a partida terminou por outros meios

  const el = document.getElementById(`${atleta}${tipo}`);
  el.classList.toggle("active");

  // Specific logic for Hansoku (H)
  if (tipo === "H") {
    const outroLado = atleta === "aka" ? "ao" : "aka";
    if (el.classList.contains("active")) {
      document.getElementById(outroLado).classList.add("blink"); // Oponente pisca para indicar vitória
      document.getElementById(atleta).classList.remove("blink"); // O lado penalizado para de piscar
      pauseTimer(); // Pausa o timer no Hansoku
      matchEnded = true; // A partida termina com Hansoku
    } else {
      // Se o Hansoku for desativado, remove o pisca-pisca e permite que o timer continue
      document.getElementById(outroLado).classList.remove("blink");
      document.getElementById(atleta).classList.remove("blink");
      matchEnded = false; // A partida não está mais terminada por Hansoku
    }
  }
  verificarVencedor(); // Reavalia o vencedor após a mudança de penalidade
}

/**
 * Obtém a contagem de penalidades ativas para um atleta.
 * @param {string} atleta - O lado do atleta ('aka' ou 'ao').
 * @returns {number} O número total de penalidades ativas.
 */
function getPenaltyCount(atleta) {
  let count = 0;
  const penalties = ["C1", "C2", "C3", "HC", "H"];
  penalties.forEach((p) => {
    if (document.getElementById(`${atleta}${p}`).classList.contains("active")) {
      count++;
    }
  });
  return count;
}

/**
 * Verifica todas as condições de vitória e atualiza o display.
 * As condições são verificadas na ordem de prioridade da WKF: Hansoku > Diferença de 8 pontos > Fim do tempo.
 */
function verificarVencedor() {
  // Limpa qualquer efeito de piscar anterior
  document.getElementById("aka").classList.remove("blink");
  document.getElementById("ao").classList.remove("blink");
  matchEnded = false; // Reseta a flag de fim de partida para reavaliação

  const akaHansoku = document
    .getElementById("akaH")
    .classList.contains("active");
  const aoHansoku = document.getElementById("aoH").classList.contains("active");

  // 1. Hansoku (Vitória automática para o oponente)
  if (akaHansoku) {
    document.getElementById("ao").classList.add("blink"); // AO vence
    pauseTimer();
    matchEnded = true;
    return;
  }
  if (aoHansoku) {
    document.getElementById("aka").classList.add("blink"); // AKA vence
    pauseTimer();
    matchEnded = true;
    return;
  }

  // 2. Diferença de 8 pontos (Vitória por pontuação)
  const diff = Math.abs(pontos.aka - pontos.ao);
  if (diff >= 8) {
    const vencedor = pontos.aka > pontos.ao ? "aka" : "ao";
    document.getElementById(vencedor).classList.add("blink"); // O atleta com mais pontos vence
    pauseTimer();
    matchEnded = true;
    return;
  }

  // 3. Fim do tempo
  if (timeLeft === 0) {
    pauseTimer(); // Garante que o timer esteja parado
    matchEnded = true; // A partida terminou por tempo

    let winner = null;
    if (pontos.aka > pontos.ao) {
      winner = "aka";
    } else if (pontos.ao > pontos.aka) {
      winner = "ao";
    } else {
      // Pontuações empatadas
      if (activeSenshu === "aka") {
        winner = "aka";
      } else if (activeSenshu === "ao") {
        winner = "ao";
      } else {
        // Empate, sem Senshu
        const akaPenalties = getPenaltyCount("aka");
        const aoPenalties = getPenaltyCount("ao");

        if (akaPenalties < aoPenalties) {
          winner = "aka";
        } else if (aoPenalties < akaPenalties) {
          winner = "ao";
        } else {
          // Empate total: Hantei (Decisão dos árbitros)
          // Em um cenário real, isso exigiria a decisão dos árbitros.
          // Aqui, simplesmente não declaramos um vencedor piscando.
          console.log("Partida empatada, decisão por Hantei necessária.");
        }
      }
    }
    if (winner) {
      document.getElementById(winner).classList.add("blink"); // Indica o vencedor
    }
    return; // Sai da função após as verificações de fim de tempo
  }

  // Se a partida ainda está em andamento, garante que ninguém esteja piscando
  if (!matchEnded) {
    document.getElementById("aka").classList.remove("blink");
    document.getElementById("ao").classList.remove("blink");
  }
}

/**
 * Define a duração da partida.
 */
function definirTempo() {
  if (timerInterval) {
    // Prevent changing time while timer is running
    alert("Please pause the timer before setting a new time.");
    return;
  }
  let newMin = prompt("Enter minutes:", String(Math.floor(duration / 60)));
  let newSec = prompt("Enter seconds:", String(duration % 60).padStart(2, "0"));

  const min = parseInt(newMin);
  const sec = parseInt(newSec);

  if (!isNaN(min) && !isNaN(sec) && min >= 0 && sec >= 0 && sec < 60) {
    duration = min * 60 + sec;
    timeLeft = duration;
    updateDisplay();
  } else {
    alert(
      "Invalid time entered. Please enter valid numbers for minutes (>=0) and seconds (0-59)."
    );
  }
}

/**
 * Atualiza o display do timer e aplica estilos de aviso/final.
 */
function updateDisplay() {
  let min = Math.floor(timeLeft / 60);
  let sec = timeLeft % 60;
  const timerElement = document.getElementById("timer");
  timerElement.innerText = `${String(min).padStart(2, "0")}:${String(
    sec
  ).padStart(2, "0")}`;

  // Adiciona classes CSS para indicar tempo acabando ou zerado
  timerElement.classList.remove("warning", "final");
  if (timeLeft <= 15 && timeLeft > 0) {
    timerElement.classList.add("warning");
  } else if (timeLeft === 0) {
    timerElement.classList.add("final");
  }
}

/**
 * Inicia o cronômetro da partida.
 */
function startTimer() {
  if (timerInterval || matchEnded) return; // Impede o início se já estiver rodando ou se a partida terminou

  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      verificarVencedor(); // Verifica o vencedor quando o tempo acaba
    }
  }, 1000);
}

/**
 * Pausa o cronômetro da partida.
 */
function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

/**
 * Reseta todos os placares, penalidades, timer e Senshu.
 */
function resetAll() {
  pauseTimer();
  pontos.aka = 0;
  pontos.ao = 0;
  document.getElementById("pontosAka").innerText = "0"; // Reseta placar AKA
  document.getElementById("pontosAo").innerText = "0"; // Reseta placar AO

  // Reseta todos os botões de penalidade
  document
    .querySelectorAll(".pen-btn")
    .forEach((btn) => btn.classList.remove("active"));

  // Remove o efeito de piscar das seções dos atletas
  document.getElementById("aka").classList.remove("blink");
  document.getElementById("ao").classList.remove("blink");

  // Reseta o Senshu
  document.getElementById("akaSenshu").classList.remove("active");
  document.getElementById("aoSenshu").classList.remove("active");
  activeSenshu = null;

  timeLeft = duration; // Reseta o tempo para a duração inicial
  matchEnded = false; // Reseta a flag de fim de partida
  updateDisplay(); // Atualiza o display do timer
}

/**
 * Alterna o modo de tela cheia para o documento.
 */
function alternarTelaCheia() {
  // Renomeado de toggleFullScreen para consistência
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      alert(
        `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
      );
    });
  } else {
    document.exitFullscreen();
  }
}

// ------------------ Atalhos de Teclado ------------------
// Espaço: inicia/pausa o cronômetro
// Faltas AO: C1=Q, C2=W, C3=E, HC=R, H=T
// Faltas AKA: C1=U, C2=I, C3=O, HC=P, H=L
// Pontos AO: Yuki=1, Wazari=2, Ippon=3
// Pontos AKA: Yuki=7, Wazari=8, Ippon=9
document.addEventListener("keydown", (e) => {
  // Ignora quando o foco está em um campo editável
  const tag = e.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable)
    return;

  const key = (e.key || "").toLowerCase();

  // Espaço: inicia/pausa
  if (e.code === "Space" || key === " ") {
    e.preventDefault();
    if (timerInterval) pauseTimer();
    else startTimer();
    return;
  }

  // Pontos AO
  if (key === "1") {
    addPonto("ao", 1);
    return;
  }
  if (key === "2") {
    addPonto("ao", 2);
    return;
  }
  if (key === "3") {
    addPonto("ao", 3);
    return;
  }

  // Pontos AKA
  if (key === "7") {
    addPonto("aka", 1);
    return;
  }
  if (key === "8") {
    addPonto("aka", 2);
    return;
  }
  if (key === "9") {
    addPonto("aka", 3);
    return;
  }

  // Faltas AO
  if (key === "q") {
    togglePenalty("ao", "C1");
    return;
  }
  if (key === "w") {
    togglePenalty("ao", "C2");
    return;
  }
  if (key === "e") {
    togglePenalty("ao", "C3");
    return;
  }
  if (key === "r") {
    togglePenalty("ao", "HC");
    return;
  }
  if (key === "t") {
    togglePenalty("ao", "H");
    return;
  }

  // Faltas AKA
  if (key === "u") {
    togglePenalty("aka", "C1");
    return;
  }
  if (key === "i") {
    togglePenalty("aka", "C2");
    return;
  }
  if (key === "o") {
    togglePenalty("aka", "C3");
    return;
  }
  if (key === "p") {
    togglePenalty("aka", "HC");
    return;
  }
  if (key === "l") {
    togglePenalty("aka", "H");
    return;
  }
});
