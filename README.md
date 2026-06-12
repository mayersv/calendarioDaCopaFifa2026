# 🏆 Calendário Interativo da Copa do Mundo FIFA 2026

Um site informativo de alto padrão estético dedicado a centralizar, filtrar e apresentar os detalhes de todas as **104 partidas** programadas para a Copa do Mundo FIFA 2026, organizada conjuntamente por Canadá, Estados Unidos e México.

---

## 🌟 Funcionalidades Principais

* **Centralização Oficial**: Exibe todas as 104 partidas (do jogo de abertura à grande final) organizadas cronologicamente.
* **Destaque Dinâmico (Próximo Jogo)**: Um widget no topo da página que calcula e destaca a próxima partida a acontecer com relógio regressivo em tempo real.
* **Conversor de Fuso Horário**: Mapeia automaticamente as cidades-sede de todo o continente norte-americano e exibe as horas no horário local da sede, UTC e horário de Brasília (BRT).

* **Filtros e Busca Avançados**:
  - Busca textual em tempo real por equipe, estádio, cidade-sede ou grupo.
  - Filtro por Fase (Fase de Grupos, 16-avos, Oitavas, Quartas, Semifinal, Final).
  - Filtro rápido por grupos específicos (A até L).
* **Atualização Automática de Placares**:
  - Rotina automatizada integrada com o site oficial da FIFA que busca e atualiza os resultados de partidas finalizadas.
* **Design Premium e Responsivo**:
  - Estética moderna baseada em Glassmorphism com Dark Mode nativo.
  - Botão de toggle rápido para tema Claro/Escuro.
  - Adaptação dinâmica para dispositivos móveis, tablets e desktops (com otimização especial de tamanho para telas de até 266px).

---

## 📁 Estrutura de Arquivos

* `index.html` - Estrutura da aplicação e referências de recursos.
* `index.css` - Sistema de estilização, variáveis de tema, transições e responsividade.
* `app.js` - Lógica de busca, simulação temporal, controle de fuso horário e manipulação do DOM.
* `matches.js` - Base de dados estruturada de todas as partidas em formato de constante global.
* `update_scores.py` - Script Python de raspagem via Selenium Headless que monitora e atualiza os placares oficiais em `matches.js` a partir do site da FIFA.
* `log.txt` - Histórico de execuções e de atualizações aplicadas pela rotina automática.
* `.github/workflows/update-scores.yml` - Workflow de CI/CD do GitHub Actions para agendamento periódico da rotina.
* `parse_matches.py` - Script utilitário em Python que parseia o arquivo bruto do Markdown para JSON e atualiza o `matches.js`.
* `lista-de-jogos-copa-fifa-2026.md` - Programação oficial bruta de partidas da Copa.

---

## 🤖 Automação e Atualização de Placares

Para garantir a atualização dos placares em tempo real sem custos com APIs privadas, o projeto conta com um pipeline automatizado:

1. **Raspagem com Selenium Headless (`update_scores.py`)**: 
   Como a página da FIFA é renderizada dinamicamente com React, o script simula um navegador Chrome em modo invisível, aguarda a montagem da página e extrai os placares.
2. **Dicionário de Normalização**:
   O script mapeia automaticamente grafias divergentes das seleções (ex: `República da Coreia` ➡️ `Coreia do Sul`, `RI do Irã` ➡️ `Irã`, `RD do Congo` ➡️ `RD Congo`, `Tchéquia` ➡️ `República Tcheca`, `EUA` ➡️ `Estados Unidos`).
3. **Logs de Auditoria (`log.txt`)**:
   Registra com carimbo de data/hora cada verificação e placar atualizado.
4. **Agendamento no GitHub Actions**:
   Configurado via cron para rodar a cada **30 minutos**, efetuando um `git pull --rebase` e `git push` automáticos das atualizações.

---

## 🚀 Como Rodar o Projeto Localmente

Como a aplicação foi construída com tecnologias nativas da web (**HTML5, CSS Vanilla e Javascript puro**), não são necessários processos de build ou dependências de pacotes.

### Método 1: Abertura Direta (Sem Servidor)
Basta dar um duplo clique ou abrir o arquivo `index.html` diretamente no seu navegador de preferência. A importação local funcionará perfeitamente.

### Método 2: Servidor Local Simples
Se desejar executar utilizando um servidor HTTP para fins de desenvolvimento, navegue até a pasta do projeto em seu terminal e execute:

```bash
# Se tiver o Python instalado:
python -m http.server 8000
```
Em seguida, acesse `http://localhost:8000` no seu navegador.

