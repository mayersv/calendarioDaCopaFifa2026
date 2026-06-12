import re
import json
import time
import unicodedata
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

# Configurações
FIFA_URL = "https://www.fifa.com/pt/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=&wtw-filter=ALL"
MATCHES_FILE = "matches.js"
LOG_FILE = "log.txt"

def log_action(message):
    timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    log_line = f"[{timestamp}] {message}\n"
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_line)
    print(log_line.strip())

def normalize_team_name(name):
    if not name:
        return ""
    # Remover acentos e converter para minúsculas
    n = unicodedata.normalize('NFKD', name).encode('ASCII', 'ignore').decode('utf-8')
    n = n.lower().strip()
    # Mapear sinônimos comuns
    synonyms = {
        "eua": "estados unidos",
        "estados unidos da america": "estados unidos",
        "usa": "estados unidos",
        "rep. checa": "republica tcheca",
        "republica checa": "republica tcheca",
        "tchequia": "republica tcheca",
        "bosnia": "bosnia e herzegovina",
        "bosnia & herzegovina": "bosnia e herzegovina",
        "bosnia-herzegovina": "bosnia e herzegovina",
        "paises baixos": "holanda",
        "netherlands": "holanda",
        "rd congo": "rd congo",
        "congo dr": "rd congo",
        "republica democratica do congo": "rd congo",
        "rd do congo": "rd congo",
        "coreia": "coreia do sul",
        "coreia do sul": "coreia do sul",
        "south korea": "coreia do sul",
        "republica da coreia": "coreia do sul",
        "ri do ira": "ira",
        "ira": "ira",
        "curacau": "curacao",
        "arabia saudita": "arabia saudita",
        "saudi arabia": "arabia saudita",
        "africa do sul": "africa do sul",
        "south africa": "africa do sul",
        "costa do marfim": "costa do marfim",
        "ivory coast": "costa do marfim",
        "nova zelandia": "nova zelandia",
        "new zealand": "nova zelandia",
    }
    return synonyms.get(n, n)

def parse_match_lines(lines):
    status_indicators = ["fim", "ft", "ended", "encerrado"]
    for i, line in enumerate(lines):
        clean_line = line.lower().strip()
        if clean_line in status_indicators:
            if i >= 2 and i + 2 < len(lines):
                home_team = lines[i - 2]
                home_score = lines[i - 1]
                away_score = lines[i + 1]
                away_team = lines[i + 2]
                try:
                    return {
                        "home_team": home_team.strip(),
                        "home_score": int(home_score.strip()),
                        "away_score": int(away_score.strip()),
                        "away_team": away_team.strip(),
                        "finished": True
                    }
                except ValueError:
                    pass
    return None

def main():
    log_action("Iniciando rotina de atualização de placares...")
    
    # 1. Carregar base de dados local
    try:
        with open(MATCHES_FILE, "r", encoding="utf-8") as f:
            js_content = f.read()
            
        match = re.search(r"const COPA_2026_MATCHES\s*=\s*(\[.*?\]);", js_content, re.DOTALL)
        if not match:
            log_action("ERRO CRÍTICO: Não foi possível encontrar a variável COPA_2026_MATCHES em matches.js")
            return
            
        matches_json_str = match.group(1)
        matches = json.loads(matches_json_str)
    except Exception as e:
        log_action(f"ERRO CRÍTICO ao ler base de dados local: {e}")
        return

    # Filtrar partidas que ainda não possuem placar
    pending_matches = [m for m in matches if "gols_casa" not in m or "gols_fora" not in m]
    if not pending_matches:
        log_action("Nenhuma partida pendente de atualização no matches.js.")
        return

    log_action(f"Encontradas {len(pending_matches)} partidas pendentes no banco local.")

    # 2. Configurar Selenium Headless
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    
    driver = None
    scraped_matches = []
    
    try:
        driver = webdriver.Chrome(options=options)
        log_action(f"Navegando para {FIFA_URL}...")
        driver.get(FIFA_URL)
        
        # Aguarda carregamento do React
        time.sleep(8)
        
        # Buscar os links das partidas
        links = driver.find_elements(By.XPATH, "//a[contains(@href, '/match-centre/match/')]")
        log_action(f"Encontrados {len(links)} elementos de partidas na página da FIFA.")
        
        for link in links:
            text = link.text
            if not text:
                continue
            lines = [line.strip() for line in text.split("\n") if line.strip()]
            parsed = parse_match_lines(lines)
            if parsed:
                scraped_matches.append(parsed)
                
        log_action(f"Extraídos com sucesso {len(scraped_matches)} placares finalizados da página da FIFA.")
    except Exception as e:
        log_action(f"ERRO durante o scraping da página da FIFA (Processo interrompido de forma segura): {e}")
        if driver:
            driver.quit()
        return
    finally:
        if driver:
            driver.quit()

    # 3. Mapear e atualizar os dados locais
    updates_made = 0
    updated_matches_info = []

    for local_match in matches:
        # Pular se já tem placar
        if "gols_casa" in local_match and "gols_fora" in local_match:
            continue
            
        local_home_norm = normalize_team_name(local_match["time_casa"])
        local_away_norm = normalize_team_name(local_match["time_fora"])
        
        # Procurar correspondência nos dados raspados
        for scraped in scraped_matches:
            scraped_home_norm = normalize_team_name(scraped["home_team"])
            scraped_away_norm = normalize_team_name(scraped["away_team"])
            
            # Se bater mandante e visitante
            if local_home_norm == scraped_home_norm and local_away_norm == scraped_away_norm:
                local_match["gols_casa"] = scraped["home_score"]
                local_match["gols_fora"] = scraped["away_score"]
                updates_made += 1
                
                info = f"Jogo {local_match['id']} - {local_match['time_casa']} {scraped['home_score']} x {scraped['away_score']} {local_match['time_fora']} (Original: {local_match['data']} às {local_match['hora']})"
                updated_matches_info.append(info)
                break

    # 4. Salvar base de dados e registrar logs se houver atualizações
    if updates_made > 0:
        try:
            # Reconstruir string do matches.js
            updated_json_str = json.dumps(matches, indent=2, ensure_ascii=False)
            updated_js_content = f"const COPA_2026_MATCHES = {updated_json_str};\n"
            
            with open(MATCHES_FILE, "w", encoding="utf-8") as f:
                f.write(updated_js_content)
                
            log_action(f"Sucesso! {updates_made} placares foram atualizados em {MATCHES_FILE}.")
            for info in updated_matches_info:
                log_action(f"ATUALIZADO: {info}")
        except Exception as e:
            log_action(f"ERRO CRÍTICO ao gravar arquivo {MATCHES_FILE}: {e}")
    else:
        log_action("Nenhuma atualização de placar foi realizada nesta rodada.")

if __name__ == "__main__":
    main()
