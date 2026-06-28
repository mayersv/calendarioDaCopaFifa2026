// app.js - Lógica principal do Calendário da Copa de 2026

// Mapeamento de Fuso Horário de cada Sede em relação ao UTC (Junho/Julho - Horário de Verão Local)
const VENUE_TIMEZONES = {
  // Pacífico (UTC-7)
  "Vancouver": { name: "PDT", offset: -7, label: "Pacífico (Vancouver)" },
  "Los Angeles": { name: "PDT", offset: -7, label: "Pacífico (Los Angeles)" },
  "San Francisco": { name: "PDT", offset: -7, label: "Pacífico (San Francisco)" },
  "Seattle": { name: "PDT", offset: -7, label: "Pacífico (Seattle)" },
  
  // Centro (UTC-5)
  "Dallas": { name: "CDT", offset: -5, label: "Central (Dallas)" },
  "Houston": { name: "CDT", offset: -5, label: "Central (Houston)" },
  "Kansas City": { name: "CDT", offset: -5, label: "Central (Kansas City)" },
  "Atlanta": { name: "CDT", offset: -5, label: "Central (Atlanta)" },
  
  // México (UTC-6)
  "Cidade do México": { name: "CST", offset: -6, label: "Hora do México" },
  "Guadalajara": { name: "CST", offset: -6, label: "Hora do México" },
  "Monterrey": { name: "CST", offset: -6, label: "Hora do México" },
  
  // Leste (UTC-4)
  "Boston": { name: "EDT", offset: -4, label: "Leste (Boston)" },
  "Miami": { name: "EDT", offset: -4, label: "Leste (Miami)" },
  "Nova York / Nova Jersey": { name: "EDT", offset: -4, label: "Leste (NY/NJ)" },
  "Filadélfia": { name: "EDT", offset: -4, label: "Leste (Filadélfia)" },
  "Toronto": { name: "EDT", offset: -4, label: "Leste (Toronto)" }
};

// Estado de data do sistema (Usa a data e hora atual do computador)
let currentDate = new Date();
let showGroupStage = false;
let show16avos = false;
let showOitavas = false;
let showQuartas = false;
let showSemifinal = false;
let showFinais = false;

// Seletores DOM
const matchesSections = document.getElementById("matchesSections");
const nextMatchContent = document.getElementById("nextMatchContent");
const searchInput = document.getElementById("searchInput");
const phaseFilter = document.getElementById("phaseFilter");
const groupTabs = document.getElementById("groupTabs");
const themeToggle = document.getElementById("themeToggle");

const toggleGroupStageBtn = document.getElementById("toggleGroupStageBtn");
const toggleGroupStageText = document.getElementById("toggleGroupStageText");
const groupStageToggleContainer = document.getElementById("groupStageToggleContainer");

const toggle16avosBtn = document.getElementById("toggle16avosBtn");
const toggle16avosText = document.getElementById("toggle16avosText");
const toggle16avosContainer = document.getElementById("toggle16avosContainer");

const toggleOitavasBtn = document.getElementById("toggleOitavasBtn");
const toggleOitavasText = document.getElementById("toggleOitavasText");
const toggleOitavasContainer = document.getElementById("toggleOitavasContainer");

const toggleQuartasBtn = document.getElementById("toggleQuartasBtn");
const toggleQuartasText = document.getElementById("toggleQuartasText");
const toggleQuartasContainer = document.getElementById("toggleQuartasContainer");

const toggleSemifinaisBtn = document.getElementById("toggleSemifinaisBtn");
const toggleSemifinaisText = document.getElementById("toggleSemifinaisText");
const toggleSemifinaisContainer = document.getElementById("toggleSemifinaisContainer");

const toggleFinaisBtn = document.getElementById("toggleFinaisBtn");
const toggleFinaisText = document.getElementById("toggleFinaisText");
const toggleFinaisContainer = document.getElementById("toggleFinaisContainer");

// Grids e seções de fases
const matchesGridGroups = document.getElementById("matchesGridGroups");
const matchesGrid16avos = document.getElementById("matchesGrid16avos");
const matchesGridOitavas = document.getElementById("matchesGridOitavas");
const matchesGridQuartas = document.getElementById("matchesGridQuartas");
const matchesGridSemifinais = document.getElementById("matchesGridSemifinais");
const matchesGridFinais = document.getElementById("matchesGridFinais");

const sectionGroups = document.getElementById("sectionGroups");
const section16avos = document.getElementById("section16avos");
const sectionOitavas = document.getElementById("sectionOitavas");
const sectionQuartas = document.getElementById("sectionQuartas");
const sectionSemifinais = document.getElementById("sectionSemifinais");
const sectionFinais = document.getElementById("sectionFinais");

// Função para calcular a expansão padrão (a fase atual e as seguintes abertas)
function determineDefaultExpansionStates() {
  const todayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  
  const phases = {
    groups: false,
    "16-avos": false,
    "Oitavas": false,
    "Quartas": false,
    "Semifinal": false,
    "Finais": false
  };

  COPA_2026_MATCHES.forEach(match => {
    const matchTime = parseMatchDateTime(match.data, match.hora);
    const matchDateOnly = new Date(matchTime.getFullYear(), matchTime.getMonth(), matchTime.getDate());
    
    if (matchDateOnly >= todayStart) {
      if (!match.eliminatoria) {
        phases.groups = true;
      } else if (match.fase === "16-avos") {
        phases["16-avos"] = true;
      } else if (match.fase === "Oitavas") {
        phases["Oitavas"] = true;
      } else if (match.fase === "Quartas") {
        phases["Quartas"] = true;
      } else if (match.fase === "Semifinal") {
        phases["Semifinal"] = true;
      } else if (match.fase === "3º Lugar" || match.fase === "Final") {
        phases["Finais"] = true;
      }
    }
  });

  // Atribuir aos estados globais
  showGroupStage = phases.groups;
  show16avos = phases["16-avos"];
  showOitavas = phases["Oitavas"];
  showQuartas = phases["Quartas"];
  showSemifinal = phases["Semifinal"];
  showFinais = phases["Finais"];
}

// Aplica as classes iniciais nos botões baseadas no estado padrão determinado
function applyInitialButtonClasses() {
  if (showGroupStage && toggleGroupStageBtn && toggleGroupStageText) {
    toggleGroupStageBtn.classList.add("expanded");
    toggleGroupStageText.textContent = "Esconder Fase de Grupos (72)";
  }
  if (show16avos && toggle16avosBtn && toggle16avosText) {
    toggle16avosBtn.classList.add("expanded");
    toggle16avosText.textContent = "Esconder 16-avos (16)";
  }
  if (showOitavas && toggleOitavasBtn && toggleOitavasText) {
    toggleOitavasBtn.classList.add("expanded");
    toggleOitavasText.textContent = "Esconder Oitavas (8)";
  }
  if (showQuartas && toggleQuartasBtn && toggleQuartasText) {
    toggleQuartasBtn.classList.add("expanded");
    toggleQuartasText.textContent = "Esconder Quartas (4)";
  }
  if (showSemifinal && toggleSemifinaisBtn && toggleSemifinaisText) {
    toggleSemifinaisBtn.classList.add("expanded");
    toggleSemifinaisText.textContent = "Esconder Semifinais (2)";
  }
  if (showFinais && toggleFinaisBtn && toggleFinaisText) {
    toggleFinaisBtn.classList.add("expanded");
    toggleFinaisText.textContent = "Esconder Finais (2)";
  }
}

// Inicialização da Aplicação
document.addEventListener("DOMContentLoaded", () => {
  determineDefaultExpansionStates();
  setupEventListeners();
  applyInitialButtonClasses();
  renderFeaturedMatch();
  renderMatches();
  
  // Ticking em tempo real a cada 10 segundos para atualizar tempos dos jogos ao vivo sem piscar a tela
  setInterval(() => {
    currentDate = new Date();
    renderFeaturedMatch();
    
    // Atualizar apenas o texto do badge de tempo dos cards ao vivo já renderizados
    const liveCards = document.querySelectorAll(".match-card.live");
    liveCards.forEach(card => {
      const matchId = parseInt(card.id.replace("match-card-", ""));
      const match = COPA_2026_MATCHES.find(m => m.id === matchId);
      if (match) {
        const matchTime = parseMatchDateTime(match.data, match.hora);
        const badge = card.querySelector(".match-status-badge.live");
        if (badge) {
          if (match.tempo_jogo && match.tempo_atualizado) {
            if (match.tempo_jogo.includes("'")) {
              const baseMin = parseInt(match.tempo_jogo);
              const elapsedMs = currentDate.getTime() - match.tempo_atualizado;
              const currentMin = baseMin + Math.floor(elapsedMs / (1000 * 60));
              badge.textContent = `Em Andamento: ${currentMin}'`;
            } else {
              badge.textContent = match.tempo_jogo;
            }
          } else {
            const elapsedMinutes = Math.floor((currentDate - matchTime) / (1000 * 60));
            badge.textContent = `Em Andamento: ${elapsedMinutes}'`;
          }
        }
      }
    });
  }, 10000);
});

// Configuração dos Event Listeners
function setupEventListeners() {
  // Filtros de busca e fase
  searchInput.addEventListener("input", filterAndRender);
  phaseFilter.addEventListener("change", filterAndRender);
  
  // Tabs dos Grupos
  groupTabs.addEventListener("click", (e) => {
    if (e.target.classList.contains("tab-btn")) {
      document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
      e.target.classList.add("active");
      filterAndRender();
    }
  });

  // Alternador de Tema
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
  });

  // Alternador de Filtros no Mobile
  const filtersToggleBtn = document.getElementById("filtersToggleBtn");
  const controlsPanel = document.querySelector(".controls-panel");
  if (filtersToggleBtn && controlsPanel) {
    filtersToggleBtn.addEventListener("click", () => {
      controlsPanel.classList.toggle("show");
      filtersToggleBtn.classList.toggle("active");
    });
  }

  // Alternador do botão de mostrar/esconder Fase de Grupos
  if (toggleGroupStageBtn && toggleGroupStageText) {
    toggleGroupStageBtn.addEventListener("click", () => {
      showGroupStage = !showGroupStage;
      toggleGroupStageBtn.classList.toggle("expanded", showGroupStage);
      toggleGroupStageText.textContent = showGroupStage 
        ? "Esconder Fase de Grupos (72)" 
        : "Mostrar Fase de Grupos (72)";
      filterAndRender();
    });
  }

  // Alternador dos 16-avos de Final
  if (toggle16avosBtn && toggle16avosText) {
    toggle16avosBtn.addEventListener("click", () => {
      show16avos = !show16avos;
      toggle16avosBtn.classList.toggle("expanded", show16avos);
      toggle16avosText.textContent = show16avos 
        ? "Esconder 16-avos (16)" 
        : "Mostrar 16-avos (16)";
      filterAndRender();
    });
  }

  // Alternador das Oitavas de Final
  if (toggleOitavasBtn && toggleOitavasText) {
    toggleOitavasBtn.addEventListener("click", () => {
      showOitavas = !showOitavas;
      toggleOitavasBtn.classList.toggle("expanded", showOitavas);
      toggleOitavasText.textContent = showOitavas 
        ? "Esconder Oitavas (8)" 
        : "Mostrar Oitavas (8)";
      filterAndRender();
    });
  }

  // Alternador das Quartas de Final
  if (toggleQuartasBtn && toggleQuartasText) {
    toggleQuartasBtn.addEventListener("click", () => {
      showQuartas = !showQuartas;
      toggleQuartasBtn.classList.toggle("expanded", showQuartas);
      toggleQuartasText.textContent = showQuartas 
        ? "Esconder Quartas (4)" 
        : "Mostrar Quartas (4)";
      filterAndRender();
    });
  }

  // Alternador das Semifinais
  if (toggleSemifinaisBtn && toggleSemifinaisText) {
    toggleSemifinaisBtn.addEventListener("click", () => {
      showSemifinal = !showSemifinal;
      toggleSemifinaisBtn.classList.toggle("expanded", showSemifinal);
      toggleSemifinaisText.textContent = showSemifinal 
        ? "Esconder Semifinais (2)" 
        : "Mostrar Semifinais (2)";
      filterAndRender();
    });
  }

  // Alternador das Finais
  if (toggleFinaisBtn && toggleFinaisText) {
    toggleFinaisBtn.addEventListener("click", () => {
      showFinais = !showFinais;
      toggleFinaisBtn.classList.toggle("expanded", showFinais);
      toggleFinaisText.textContent = showFinais 
        ? "Esconder Finais (2)" 
        : "Mostrar Finais (2)";
      filterAndRender();
    });
  }
}

// Converte string de data "DD/MM/AAAA" e hora "HH:MM" para um Objeto Date do JavaScript
function parseMatchDateTime(dateStr, timeStr) {
  const [day, month, year] = dateStr.split("/").map(Number);
  let hour = 12; // Valor padrão se a hora for indeterminada
  let minute = 0;
  
  if (timeStr && timeStr !== "A definir") {
    const [h, m] = timeStr.split(":").map(Number);
    hour = h;
    minute = m;
  }
  
  return new Date(year, month - 1, day, hour, minute);
}

// Calcular os horários convertidos (UTC, Local do Estádio e BRT)
function calculateTimes(match) {
  const brtTime = match.hora;
  if (!brtTime || brtTime === "A definir") {
    return { brt: "A definir", utc: "A definir", local: "A definir", timeZoneLabel: "" };
  }

  // A data informada já está em BRT (Horário de Brasília - UTC-3)
  const matchDateTimeBRT = parseMatchDateTime(match.data, brtTime);
  
  // Hora UTC (BRT + 3 horas)
  const utcDate = new Date(matchDateTimeBRT.getTime() + (3 * 60 * 60 * 1000));
  const utcHour = String(utcDate.getUTCHours()).padStart(2, '0');
  const utcMin = String(utcDate.getUTCMinutes()).padStart(2, '0');
  const utcString = `${utcHour}:${utcMin} UTC`;

  // Hora Local do Estádio / Cidade Sede
  let localString = "A definir";
  let timeZoneLabel = "";
  
  // Limpar nome da cidade no caso de conter estádio ou país
  // Ex: "Cidade do México (Estádio Azteca)" -> "Cidade do México"
  const rawCity = match.local.split("(")[0].trim();
  const tzConfig = VENUE_TIMEZONES[rawCity];
  
  if (tzConfig) {
    // Offset local em milissegundos
    const localDate = new Date(utcDate.getTime() + (tzConfig.offset * 60 * 60 * 1000));
    const localHour = String(localDate.getUTCHours()).padStart(2, '0');
    const localMin = String(localDate.getUTCMinutes()).padStart(2, '0');
    localString = `${localHour}:${localMin} (${tzConfig.name})`;
    timeZoneLabel = tzConfig.label;
  }

  return {
    brt: `${brtTime} BRT`,
    utc: utcString,
    local: localString,
    timeZoneLabel: timeZoneLabel
  };
}

// Renderiza a partida em destaque (Próximo Jogo)
function renderFeaturedMatch() {
  // Encontra o próximo jogo que irá acontecer (ou que está em andamento a menos de 130 min)
  let featured = null;
  const oneHundredThirtyMinutesInMs = 130 * 60 * 1000;
  
  // Ordena os jogos por ID/cronologia
  const sortedMatches = [...COPA_2026_MATCHES].sort((a, b) => {
    const dateA = parseMatchDateTime(a.data, a.hora);
    const dateB = parseMatchDateTime(b.data, b.hora);
    return dateA - dateB || a.id - b.id;
  });
  
  for (const m of sortedMatches) {
    const matchTime = parseMatchDateTime(m.data, m.hora);
    // O jogo permanece em destaque se a hora de início + 130 min for maior ou igual à data atual
    if (matchTime.getTime() + oneHundredThirtyMinutesInMs >= currentDate.getTime()) {
      featured = m;
      break;
    }
  }

  // Se a Copa do Mundo acabou (todos os jogos passaram da data atual)
  if (!featured) {
    featured = sortedMatches[sortedMatches.length - 1]; // Pega a final como backup
    nextMatchContent.innerHTML = `
      <div class="no-next-match" style="text-align: center; padding: 20px;">
        <h3 style="font-family: var(--font-title); color: var(--text-highlight); font-size: 1.5rem; margin-bottom: 8px;">🏆 A Copa do Mundo de 2026 acabou!</h3>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Todas as 104 partidas foram realizadas. O grande campeão foi coroado na Final em Nova York / Nova Jersey!</p>
      </div>
    `;
    return;
  }

  const times = calculateTimes(featured);
  const isPlaceholder = featured.partida.includes("Grupo") || featured.partida.includes("Jogo");
  const classPlaceholder = isPlaceholder ? 'placeholder-game' : '';

  // Relógio de Contagem Regressiva Simulado
  const matchTime = parseMatchDateTime(featured.data, featured.hora);
  const diffTime = matchTime - currentDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  let countdownText = "";
  if (diffDays > 0) {
    countdownText = `Faltam ${diffDays} dia(s) e ${diffHours} hora(s)`;
  } else if (diffHours > 0) {
    countdownText = `Falta(m) ${diffHours} hora(s)`;
  } else if (diffTime > 0) {
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    if (diffMinutes <= 15) {
      countdownText = `Começa em instantes!`;
    } else {
      countdownText = `Faltam ${diffMinutes} minuto(s)`;
    }
  } else {
    if (featured.tempo_jogo && featured.tempo_atualizado) {
      if (featured.tempo_jogo.includes("'")) {
        const baseMin = parseInt(featured.tempo_jogo);
        const elapsedMs = currentDate.getTime() - featured.tempo_atualizado;
        const currentMin = baseMin + Math.floor(elapsedMs / (1000 * 60));
        countdownText = `Em Andamento: ${currentMin}'`;
      } else {
        countdownText = `Em Andamento: ${featured.tempo_jogo}`;
      }
    } else {
      const elapsedMinutes = Math.floor((currentDate - matchTime) / (1000 * 60));
      countdownText = `Em Andamento: ${elapsedMinutes}'`;
    }
  }

  const oneHundredThirtyMinutes = 130 * 60 * 1000;
  const matchTimeMs = matchTime.getTime();
  const currentTimeMs = currentDate.getTime();
  const isFinished = currentTimeMs >= matchTimeMs + oneHundredThirtyMinutes;
  const showScore = currentTimeMs >= matchTimeMs;
  const scoreHome = showScore ? (featured.gols_casa !== undefined ? featured.gols_casa : (isFinished ? getDeterministicScore(featured.id, true) : 0)) : '';
  const scoreAway = showScore ? (featured.gols_fora !== undefined ? featured.gols_fora : (isFinished ? getDeterministicScore(featured.id, false) : 0)) : '';
  
  const vsDisplay = showScore ? `<div class="widget-vs" style="font-size: 1.8rem; background: var(--accent); color: white; padding: 6px 20px;">${scoreHome} - ${scoreAway}</div>` : `<div class="widget-vs">VS</div>`;

  nextMatchContent.innerHTML = `
    <div class="widget-teams-row ${classPlaceholder}">
      <div class="widget-team home-team">
        <span class="widget-team-name">${featured.time_casa}</span>
        ${getFlagHtml(featured.time_casa, 'large')}
      </div>
      ${vsDisplay}
      <div class="widget-team away-team">
        ${getFlagHtml(featured.time_fora, 'large')}
        <span class="widget-team-name">${featured.time_fora}</span>
      </div>
    </div>
    <div class="widget-details">
      <div class="widget-detail-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>Data: <strong>${featured.data}</strong></span>
      </div>
      <div class="widget-detail-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>Horários: <strong>${times.brt}</strong> | <strong>${times.local}</strong></span>
      </div>
      <div class="widget-detail-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>Local: <strong>${featured.local}</strong></span>
      </div>
      <div class="widget-detail-item" style="color: var(--primary);">
        <strong style="color: var(--primary);">${countdownText}</strong>
      </div>
      <div class="widget-detail-item" style="grid-column: 1 / -1; margin-top: 10px;">
        <button class="sim-btn" onclick="scrollToMatch(${featured.id})" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>
          Ver detalhes da partida no grid
        </button>
      </div>
    </div>
  `;
}

// Filtra as partidas baseando-se nas entradas do painel de controle e renderiza
function filterAndRender() {
  renderMatches();
}

// Renderizar a lista de cards de partidas
function renderMatches() {
  const query = searchInput.value.toLowerCase().trim();
  const selectedPhase = phaseFilter.value;
  const activeTab = document.querySelector(".tab-btn.active");
  const selectedGroup = activeTab ? activeTab.getAttribute("data-group") : "all";

  // Identifica o id do próximo jogo em destaque
  let nextMatchId = -1;
  const sortedMatches = [...COPA_2026_MATCHES].sort((a, b) => {
    const dateA = parseMatchDateTime(a.data, a.hora);
    const dateB = parseMatchDateTime(b.data, b.hora);
    return dateA - dateB || a.id - b.id;
  });
  for (const m of sortedMatches) {
    const matchTime = parseMatchDateTime(m.data, m.hora);
    if (matchTime >= currentDate) {
      nextMatchId = m.id;
      break;
    }
  }

  // Grids por fase
  const grids = {
    groups: matchesGridGroups,
    "16-avos": matchesGrid16avos,
    "Oitavas": matchesGridOitavas,
    "Quartas": matchesGridQuartas,
    "Semifinal": matchesGridSemifinais,
    "Finais": matchesGridFinais
  };

  // Seções por fase
  const sections = {
    groups: sectionGroups,
    "16-avos": section16avos,
    "Oitavas": sectionOitavas,
    "Quartas": sectionQuartas,
    "Semifinal": sectionSemifinais,
    "Finais": sectionFinais
  };

  // Contêineres de botões (toggles)
  const toggles = {
    groups: groupStageToggleContainer,
    "16-avos": toggle16avosContainer,
    "Oitavas": toggleOitavasContainer,
    "Quartas": toggleQuartasContainer,
    "Semifinal": toggleSemifinaisContainer,
    "Finais": toggleFinaisContainer
  };

  // Limpar todos os grids
  Object.values(grids).forEach(grid => {
    if (grid) grid.innerHTML = "";
  });

  // Exibir ou ocultar os botões de controle de fase (toggles)
  const isDefaultView = selectedPhase === "all" && selectedGroup === "all" && !query;

  Object.entries(toggles).forEach(([key, toggleBtn]) => {
    if (toggleBtn) {
      toggleBtn.style.display = isDefaultView ? "flex" : "none";
    }
  });

  // Resetar display das seções para block por padrão
  Object.values(sections).forEach(sec => {
    if (sec) sec.style.display = "block";
  });

  // Filtragem
  const filtered = COPA_2026_MATCHES.filter(match => {
    // 1. Filtro por Busca Textual
    const searchString = `${match.partida} ${match.local} ${match.fase}`.toLowerCase();
    const matchesQuery = searchString.includes(query);

    // 2. Filtro por Fase
    let matchesPhase = true;
    if (selectedPhase === "groups") {
      matchesPhase = !match.eliminatoria;
    } else if (selectedPhase !== "all") {
      matchesPhase = match.fase.includes(selectedPhase);
    }

    // 3. Filtro por Grupo específico (apenas para fase de grupos)
    let matchesGroup = true;
    if (selectedGroup !== "all") {
      matchesGroup = match.fase === `Grupo ${selectedGroup}`;
    }

    // 4. Alternadores de visibilidade das Fases (aplicado quando visualizando Todas as Fases, sem busca/grupo específico)
    let matchesStageToggle = true;
    if (isDefaultView) {
      if (!match.eliminatoria) {
        if (!showGroupStage) matchesStageToggle = false;
      } else {
        if (match.fase === "16-avos") {
          if (!show16avos) matchesStageToggle = false;
        } else if (match.fase === "Oitavas") {
          if (!showOitavas) matchesStageToggle = false;
        } else if (match.fase === "Quartas") {
          if (!showQuartas) matchesStageToggle = false;
        } else if (match.fase === "Semifinal") {
          if (!showSemifinal) matchesStageToggle = false;
        } else if (match.fase === "3º Lugar" || match.fase === "Final") {
          if (!showFinais) matchesStageToggle = false;
        }
      }
    }

    return matchesQuery && matchesPhase && matchesGroup && matchesStageToggle;
  });

  // Exibir placeholder de no-results se nenhum jogo for encontrado
  if (filtered.length === 0) {
    Object.values(sections).forEach(sec => {
      if (sec) sec.style.display = "none";
    });

    let noResultsDiv = document.getElementById("noResultsPlaceholder");
    if (!noResultsDiv) {
      noResultsDiv = document.createElement("div");
      noResultsDiv.id = "noResultsPlaceholder";
      noResultsDiv.className = "no-results";
      if (matchesSections) matchesSections.appendChild(noResultsDiv);
    }
    noResultsDiv.style.display = "block";
    noResultsDiv.innerHTML = `
      <div class="no-results-icon">⚽</div>
      <h3>Nenhuma partida encontrada</h3>
      <p>Tente ajustar a busca ou os filtros aplicados.</p>
    `;
    return;
  } else {
    const noResultsDiv = document.getElementById("noResultsPlaceholder");
    if (noResultsDiv) {
      noResultsDiv.style.display = "none";
    }
  }

  // Ordenar as partidas de forma cronológica antes da exibição
  filtered.sort((a, b) => {
    const dateA = parseMatchDateTime(a.data, a.hora);
    const dateB = parseMatchDateTime(b.data, b.hora);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    }
    return a.id - b.id;
  });

  // Preencher os cards nos grids apropriados
  filtered.forEach(match => {
    const times = calculateTimes(match);
    const matchTime = parseMatchDateTime(match.data, match.hora);
    
    const oneHundredThirtyMinutes = 130 * 60 * 1000;
    const matchTimeMs = matchTime.getTime();
    const currentTimeMs = currentDate.getTime();
    
    // Status da partida
    let statusText = "Agendado";
    let statusClass = "future";
    
    if (currentTimeMs >= matchTimeMs && currentTimeMs < matchTimeMs + oneHundredThirtyMinutes) {
      statusClass = "live";
      if (match.tempo_jogo && match.tempo_atualizado) {
        if (match.tempo_jogo.includes("'")) {
          const baseMin = parseInt(match.tempo_jogo);
          const elapsedMs = currentDate.getTime() - match.tempo_atualizado;
          const currentMin = baseMin + Math.floor(elapsedMs / (1000 * 60));
          statusText = `Em Andamento: ${currentMin}'`;
        } else {
          statusText = match.tempo_jogo;
        }
      } else {
        const elapsedMinutes = Math.floor((currentDate - matchTime) / (1000 * 60));
        statusText = `Em Andamento: ${elapsedMinutes}'`;
      }
    } else if (currentTimeMs >= matchTimeMs + oneHundredThirtyMinutes) {
      statusText = "Encerrado";
      statusClass = "finished";
    }

    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const currentDateStr = `${day}/${month}/${year}`;
    const isToday = match.data === currentDateStr;
    const todayClass = isToday ? 'today-match' : '';

    const isPlaceholder = match.partida.includes("Grupo") || match.partida.includes("Jogo");
    const cardClass = isPlaceholder ? 'placeholder-game' : '';
    const isFeaturedClass = match.id === nextMatchId ? 'featured' : '';
    const isBrasil = match.time_casa === "Brasil" || match.time_fora === "Brasil";
    const brasilClass = isBrasil ? 'brasil-match' : '';

    const matchCard = document.createElement("div");
    matchCard.id = `match-card-${match.id}`;
    matchCard.className = `match-card ${cardClass} ${isFeaturedClass} ${brasilClass} ${statusClass} ${todayClass}`;
    matchCard.innerHTML = `
      <div class="match-header">
        <span class="match-id-badge">Jogo ${match.id}</span>
        <span class="match-fase">${match.fase}</span>
        <span class="match-status-badge ${statusClass}">${statusText}</span>
      </div>
      <div class="match-body">
        <div class="team-row">
          <div class="team-info">
            ${getFlagHtml(match.time_casa, 'mini')}
            <span class="team-name">${match.time_casa}</span>
          </div>
          <span class="team-score">${match.gols_casa !== undefined ? match.gols_casa : (statusClass === 'finished' ? getDeterministicScore(match.id, true) : (statusClass === 'live' ? 0 : '-'))}</span>
        </div>
        <div class="team-row">
          <div class="team-info">
            ${getFlagHtml(match.time_fora, 'mini')}
            <span class="team-name">${match.time_fora}</span>
          </div>
          <span class="team-score">${match.gols_fora !== undefined ? match.gols_fora : (statusClass === 'finished' ? getDeterministicScore(match.id, false) : (statusClass === 'live' ? 0 : '-'))}</span>
        </div>
      </div>
      <div class="match-footer">
        <div class="match-time-row">
          <span class="match-date">${match.data}</span>
          <span class="match-time ${match.hora === 'A definir' ? 'tbd' : ''}">${times.brt}</span>
        </div>
        <div class="match-stadium" title="${match.local}">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${match.local}
        </div>
      </div>
    `;

    // Descobrir qual o grid de destino
    let targetGrid = null;
    if (!match.eliminatoria) {
      targetGrid = matchesGridGroups;
    } else if (match.fase === "16-avos") {
      targetGrid = matchesGrid16avos;
    } else if (match.fase === "Oitavas") {
      targetGrid = matchesGridOitavas;
    } else if (match.fase === "Quartas") {
      targetGrid = matchesGridQuartas;
    } else if (match.fase === "Semifinal") {
      targetGrid = matchesGridSemifinais;
    } else if (match.fase === "3º Lugar" || match.fase === "Final") {
      targetGrid = matchesGridFinais;
    }

    if (targetGrid) {
      targetGrid.appendChild(matchCard);
    }
  });

  // Se estivermos em modo de busca ou filtro ativo, ocultamos as seções que ficaram vazias
  if (!isDefaultView) {
    Object.entries(grids).forEach(([key, grid]) => {
      const sec = sections[key];
      if (sec) {
        if (grid.children.length === 0) {
          sec.style.display = "none";
        } else {
          sec.style.display = "block";
        }
      }
    });
  }
}

// Gera placares fictícios determinísticos com base no ID do jogo para manter a consistência nas renderizações
function getDeterministicScore(gameId, isHome) {
  // Uma fórmula simples que usa o ID do jogo para gerar placares consistentes e realistas (0 a 3 gols)
  const factor = isHome ? 7 : 13;
  return (gameId * factor + (isHome ? 3 : 1)) % 4;
}

// Mapeamento de bandeiras do sprite sheet bandeiras-paises-copa.jpg (grade de 7x7)
const FLAG_MAP = {
  "África do Sul": { col: 0, row: 0 },
  "Alemanha": { col: 1, row: 0 },
  "Argélia": { col: 2, row: 0 },
  "Argentina": { col: 3, row: 0 },
  "Arábia Saudita": { col: 4, row: 0 },
  "Austrália": { col: 5, row: 0 },
  "Áustria": { col: 6, row: 0 },
  
  "Bélgica": { col: 0, row: 1 },
  "Bósnia e Herzegovina": { col: 1, row: 1 },
  "Brasil": { col: 2, row: 1 },
  "Cabo Verde": { col: 3, row: 1 },
  "Canadá": { col: 4, row: 1 },
  "Colômbia": { col: 5, row: 1 },
  "Coreia do Sul": { col: 6, row: 1 },
  
  "Costa do Marfim": { col: 0, row: 2 },
  "Croácia": { col: 1, row: 2 },
  "Curaçao": { col: 2, row: 2 },
  "Egito": { col: 3, row: 2 },
  "Equador": { col: 4, row: 2 },
  "Escócia": { col: 5, row: 2 },
  "Espanha": { col: 6, row: 2 },
  
  "Estados Unidos": { col: 0, row: 3 },
  "França": { col: 1, row: 3 },
  "Gana": { col: 2, row: 3 },
  "Haiti": { col: 3, row: 3 },
  "Holanda": { col: 4, row: 3 },
  "Inglaterra": { col: 5, row: 3 },
  "Irã": { col: 6, row: 3 },
  
  "Iraque": { col: 0, row: 4 },
  "Japão": { col: 1, row: 4 },
  "Jordânia": { col: 2, row: 4 },
  "Marrocos": { col: 3, row: 4 },
  "México": { col: 4, row: 4 },
  "Noruega": { col: 5, row: 4 },
  "Nova Zelândia": { col: 6, row: 4 },
  
  "Panamá": { col: 0, row: 5 },
  "Paraguai": { col: 1, row: 5 },
  "Portugal": { col: 2, row: 5 },
  "Catar": { col: 3, row: 5 },
  "RD Congo": { col: 4, row: 5 },
  "República Tcheca": { col: 5, row: 5 },
  "Senegal": { col: 6, row: 5 },
  
  "Suécia": { col: 0, row: 6 },
  "Suíça": { col: 1, row: 6 },
  "Tunísia": { col: 2, row: 6 },
  "Turquia": { col: 3, row: 6 },
  "Uruguai": { col: 4, row: 6 },
  "Uzbequistão": { col: 5, row: 6 }
};

// Calcula a coordenada background-position para a bandeira do país
function getFlagPosition(countryName) {
  const coords = FLAG_MAP[countryName];
  if (!coords) return null;
  // coluna * 16.6667% e linha * 16.6667% (tendo 7 colunas, o intervalo vai de 0/6 a 6/6)
  const x = (coords.col * 16.6667).toFixed(4) + "%";
  const y = (coords.row * 16.6667).toFixed(4) + "%";
  return { x, y };
}

// Retorna a tag HTML com a bandeira renderizada em sprite sheet
function getFlagHtml(countryName, size = 'mini') {
  const isPlaceholder = !countryName || countryName.includes("Grupo") || countryName.includes("Jogo");
  if (isPlaceholder) {
    return `<div class="flag-sprite ${size} placeholder"></div>`;
  }
  
  const position = getFlagPosition(countryName);
  if (!position) {
    return `<div class="flag-sprite ${size} placeholder"></div>`;
  }
  
  return `<div class="flag-sprite ${size}" style="background-position: ${position.x} ${position.y};"></div>`;
}

// Rola até o card do jogo com efeito ease-out personalizado (rápido no começo, mais lento no final)
function scrollToMatch(id) {
  const target = document.getElementById(`match-card-${id}`);
  if (!target) return;

  const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - 120; // offset para cabeçalho
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  const duration = 1200; // Duração em milissegundos
  let startTime = null;

  // Função de Easing: Ease Out Cubic (rápido no início, lento no final)
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = easeOutCubic(progress);

    window.scrollTo(0, startPosition + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    } else {
      // Efeito de pulso rápido de destaque ao chegar no card
      target.classList.add("pulse-highlight");
      setTimeout(() => target.classList.remove("pulse-highlight"), 1500);
    }
  }

  requestAnimationFrame(animation);
}
