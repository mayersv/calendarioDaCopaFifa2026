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

// Estados do Simulador de Tempo
let currentDate = new Date("2026-06-11T00:00:00"); // Inicializa em 11 de Junho de 2026

// Seletores DOM
const matchesGrid = document.getElementById("matchesGrid");
const nextMatchContent = document.getElementById("nextMatchContent");
const searchInput = document.getElementById("searchInput");
const phaseFilter = document.getElementById("phaseFilter");
const groupTabs = document.getElementById("groupTabs");
const simDateInput = document.getElementById("simDateInput");
const simDateDisplay = document.getElementById("simDateDisplay");
const btnResetDate = document.getElementById("btnResetDate");
const themeToggle = document.getElementById("themeToggle");

// Inicialização da Aplicação
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  updateSimulationUI();
  renderFeaturedMatch();
  renderMatches();
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

  // Simulador de Data
  simDateInput.addEventListener("change", (e) => {
    if (e.target.value) {
      currentDate = new Date(`${e.target.value}T00:00:00`);
      updateSimulationUI();
      renderFeaturedMatch();
      renderMatches();
    }
  });

  btnResetDate.addEventListener("click", () => {
    // Redefine para a data real de hoje (se for 2026) ou data padrão do início da Copa
    const today = new Date();
    if (today.getFullYear() === 2026 && today.getMonth() >= 5 && today.getMonth() <= 6) {
      currentDate = today;
    } else {
      currentDate = new Date("2026-06-11T00:00:00");
    }
    
    // Atualiza input de data
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDate.getDate()).padStart(2, '0');
    simDateInput.value = `${yyyy}-${mm}-${dd}`;
    
    updateSimulationUI();
    renderFeaturedMatch();
    renderMatches();
  });

  // Alternador de Tema
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
  });
}

// Atualizar Interface do Simulador
function updateSimulationUI() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = currentDate.toLocaleDateString('pt-BR', options);
  simDateDisplay.textContent = `Data Atual do Sistema: ${dateStr}`;
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
  // Encontra o próximo jogo que irá acontecer (ou que está em andamento a menos de 90 min)
  let featured = null;
  const ninetyMinutesInMs = 90 * 60 * 1000;
  
  // Ordena os jogos por ID/cronologia
  const sortedMatches = [...COPA_2026_MATCHES].sort((a, b) => a.id - b.id);
  
  for (const m of sortedMatches) {
    const matchTime = parseMatchDateTime(m.data, m.hora);
    // O jogo permanece em destaque se a hora de início + 90 min for maior ou igual à data atual
    if (matchTime.getTime() + ninetyMinutesInMs >= currentDate.getTime()) {
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
    countdownText = `Começa em instantes!`;
  } else {
    const elapsedMinutes = Math.floor((currentDate - matchTime) / (1000 * 60));
    countdownText = `Em Andamento: ${elapsedMinutes}'`;
  }

  nextMatchContent.innerHTML = `
    <div class="widget-teams-row ${classPlaceholder}">
      <div class="widget-team home-team">
        <span class="widget-team-name">${featured.time_casa}</span>
        <div class="flag-placeholder">${isPlaceholder ? '🏳️' : getFlagEmoji(featured.time_casa)}</div>
      </div>
      <div class="widget-vs">VS</div>
      <div class="widget-team away-team">
        <div class="flag-placeholder">${isPlaceholder ? '🏳️' : getFlagEmoji(featured.time_fora)}</div>
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
  const sortedMatches = [...COPA_2026_MATCHES].sort((a, b) => a.id - b.id);
  for (const m of sortedMatches) {
    const matchTime = parseMatchDateTime(m.data, m.hora);
    if (matchTime >= currentDate) {
      nextMatchId = m.id;
      break;
    }
  }

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

    return matchesQuery && matchesPhase && matchesGroup;
  });

  // Renderizar no grid
  matchesGrid.innerHTML = "";

  if (filtered.length === 0) {
    matchesGrid.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">⚽</div>
        <h3>Nenhuma partida encontrada</h3>
        <p>Tente ajustar a busca ou os filtros aplicados.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(match => {
    const times = calculateTimes(match);
    const matchTime = parseMatchDateTime(match.data, match.hora);
    
    const ninetyMinutes = 90 * 60 * 1000;
    const matchTimeMs = matchTime.getTime();
    const currentTimeMs = currentDate.getTime();
    
    // Status da partida
    let statusText = "Agendado";
    let statusClass = "future";
    
    if (currentTimeMs >= matchTimeMs && currentTimeMs < matchTimeMs + ninetyMinutes) {
      // A partida começou e faz menos de 90 minutos (está ocorrendo)
      statusText = "Ao Vivo";
      statusClass = "live";
    } else if (currentTimeMs >= matchTimeMs + ninetyMinutes) {
      // A partida já terminou
      statusText = "Encerrado";
      statusClass = "finished";
    }

    const isPlaceholder = match.partida.includes("Grupo") || match.partida.includes("Jogo");
    const cardClass = isPlaceholder ? 'placeholder-game' : '';
    const isFeaturedClass = match.id === nextMatchId ? 'featured' : '';
    const flagHome = isPlaceholder ? '🏳️' : getFlagEmoji(match.time_casa);
    const flagAway = isPlaceholder ? '🏳️' : getFlagEmoji(match.time_fora);

    const matchCard = document.createElement("div");
    matchCard.className = `match-card ${cardClass} ${isFeaturedClass}`;
    matchCard.innerHTML = `
      <div class="match-header">
        <span class="match-id-badge">Jogo ${match.id}</span>
        <span class="match-fase">${match.fase}</span>
        <span class="match-status-badge ${statusClass}">${statusText}</span>
      </div>
      <div class="match-body">
        <div class="team-row">
          <div class="team-info">
            <span class="flag-mini">${flagHome}</span>
            <span class="team-name">${match.time_casa}</span>
          </div>
          <span class="team-score">${(statusClass === 'finished' || statusClass === 'live') ? getDeterministicScore(match.id, true) : '-'}</span>
        </div>
        <div class="team-row">
          <div class="team-info">
            <span class="flag-mini">${flagAway}</span>
            <span class="team-name">${match.time_fora}</span>
          </div>
          <span class="team-score">${(statusClass === 'finished' || statusClass === 'live') ? getDeterministicScore(match.id, false) : '-'}</span>
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
    matchesGrid.appendChild(matchCard);
  });
}

// Gera placares fictícios determinísticos com base no ID do jogo para manter a consistência nas renderizações
function getDeterministicScore(gameId, isHome) {
  // Uma fórmula simples que usa o ID do jogo para gerar placares consistentes e realistas (0 a 3 gols)
  const factor = isHome ? 7 : 13;
  return (gameId * factor + (isHome ? 3 : 1)) % 4;
}

// Retorna o emoji da bandeira baseado no nome do país (mapeamento amigável)
function getFlagEmoji(countryName) {
  const flags = {
    "México": "🇲🇽", "África do Sul": "🇿🇦", "Coreia do Sul": "🇰🇷", "República Tcheca": "🇨🇿",
    "Canadá": "🇨🇦", "Bósnia e Herzegovina": "🇧🇦", "Estados Unidos": "🇺🇸", "Paraguai": "🇵🇾",
    "Haiti": "🇭🇹", "Escócia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Austrália": "🇦🇺", "Turquia": "🇹🇷", "Brasil": "🇧🇷",
    "Marrocos": "🇲🇦", "Catar": "🇶🇦", "Suíça": "🇨🇭", "Costa do Marfim": "🇨🇮", "Equador": "🇪🇨",
    "Alemanha": "🇩🇪", "Curaçao": "🇨🇼", "Holanda": "🇳🇱", "Japão": "🇯🇵", "Suécia": "🇸🇪",
    "Tunísia": "🇹🇳", "Arábia Saudita": "🇸🇦", "Uruguai": "🇺🇾", "Espanha": "🇪🇸", "Cabo Verde": "🇨🇻",
    "Irã": "🇮🇷", "Nova Zelândia": "🇳🇿", "Bélgica": "🇧🇪", "Egito": "🇪🇬", "França": "🇫🇷",
    "Senegal": "🇸🇳", "Iraque": "🇮🇶", "Noruega": "🇳🇴", "Argentina": "🇦🇷", "Argélia": "🇩🇿",
    "Áustria": "🇦🇹", "Jordânia": "🇯🇴", "Gana": "🇬🇭", "Panamá": "🇵🇦", "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "Croácia": "🇭🇷", "Portugal": "🇵🇹", "RD Congo": "🇨🇩", "Uzbequistão": "🇺🇿", "Colômbia": "🇨🇴"
  };
  return flags[countryName] || "🏳️";
}
