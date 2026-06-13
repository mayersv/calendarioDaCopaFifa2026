import os
import subprocess
import re
import json
import time
import unicodedata
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

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
    n = unicodedata.normalize('NFKD', name).encode('ASCII', 'ignore').decode('utf-8')
    n = n.lower().strip()
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
        is_live_indicator = re.match(r"^\d+'$", clean_line) or clean_line in ["live", "ao vivo", "em andamento", "1º tempo", "2º tempo", "intervalo", "int"]
        if clean_line in status_indicators or is_live_indicator:
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
                        "finished": clean_line in status_indicators,
                        "tempo_jogo": line.strip()
                    }
                except ValueError:
                    pass
    return None

def parse_match_datetime(date_str, time_str):
    if not time_str or time_str == "A definir":
        return None
    try:
        return datetime.strptime(f"{date_str} {time_str}", "%d/%m/%Y %H:%M")
    except Exception:
        return None

def run_git_push():
    # Helper to push changes when GITHUB_ACTIONS is active
    if os.environ.get("GITHUB_ACTIONS"):
        try:
            subprocess.run(["git", "config", "--global", "user.name", "FIFA 2026 Score Updater"], check=True)
            subprocess.run(["git", "config", "--global", "user.email", "bot@copa2026.info"], check=True)
            subprocess.run(["git", "add", "matches.js", "log.txt"], check=True)
            
            # Check diff
            diff = subprocess.run(["git", "diff", "--staged", "--quiet"])
            if diff.returncode != 0:
                subprocess.run(["git", "commit", "-m", "Auto-update: placares das partidas (tempo real) [Bot]"], check=True)
                subprocess.run(["git", "pull", "--rebase"], check=True)
                subprocess.run(["git", "push"], check=True)
                log_action("Commit e Push realizados com sucesso no GitHub.")
            else:
                log_action("Nenhuma alteração nos placares para commitar.")
        except Exception as e:
            log_action(f"Falha ao realizar commit/push no Git: {e}")

def main():
    log_action("Iniciando rotina de atualização de placares...")
    
    loop_count = 0
    while True:
        loop_count += 1
        log_action(f"Executando iteração {loop_count} do ciclo de atualização...")
        
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

        now = datetime.now()
        
        # Filtrar partidas pendentes ou ao vivo
        pending_or_live_matches = []
        has_any_live_match = False
        
        for m in matches:
            has_score = "gols_casa" in m and "gols_fora" in m
            has_live_indicators = "tempo_jogo" in m
            match_time = parse_match_datetime(m["data"], m["hora"])
            
            is_live = False
            if match_time:
                # Diferença em minutos
                diff_minutes = (now - match_time).total_seconds() / 60.0
                # O jogo está "ao vivo" se estiver ocorrendo no intervalo de início até início + 130 minutos
                if -15 <= diff_minutes < 130:
                    is_live = True
                    has_any_live_match = True
            
            # Se não tem placar, se está rolando ao vivo ou se ainda possui chaves de tempo ativo a serem limpas
            if not has_score or is_live or has_live_indicators:
                pending_or_live_matches.append(m)

        if not pending_or_live_matches:
            log_action("Nenhuma partida pendente de atualização ou ao vivo no momento.")
            break

        log_action(f"Encontradas {len(pending_or_live_matches)} partidas para verificar (Jogos Ao Vivo ativos: {has_any_live_match}).")

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
            
            time.sleep(8)
            
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
                    
            log_action(f"Extraídos com sucesso {len(scraped_matches)} placares (ao vivo ou encerrados) da página da FIFA.")
        except Exception as e:
            log_action(f"ERRO durante o scraping da página da FIFA: {e}")
            if driver:
                driver.quit()
        finally:
            if driver:
                driver.quit()

        # 3. Mapear e atualizar os dados locais
        updates_made = 0
        updated_matches_info = []

        for local_match in matches:
            local_home_norm = normalize_team_name(local_match["time_casa"])
            local_away_norm = normalize_team_name(local_match["time_fora"])
            
            match_time = parse_match_datetime(local_match["data"], local_match["hora"])
            is_live = False
            if match_time:
                diff_minutes = (now - match_time).total_seconds() / 60.0
                if -15 <= diff_minutes < 130:
                    is_live = True
            
            # Só atualizamos se não tinha score, se está ao vivo ou se possui chaves a limpar
            has_score = "gols_casa" in local_match and "gols_fora" in local_match
            has_live_indicators = "tempo_jogo" in local_match
            
            for scraped in scraped_matches:
                scraped_home_norm = normalize_team_name(scraped["home_team"])
                scraped_away_norm = normalize_team_name(scraped["away_team"])
                
                if local_home_norm == scraped_home_norm and local_away_norm == scraped_away_norm:
                    # Se não tinha placar ou se o placar atual/tempo mudou ou se o jogo finalizou na FIFA
                    old_home = local_match.get("gols_casa")
                    old_away = local_match.get("gols_fora")
                    old_tempo = local_match.get("tempo_jogo")
                    
                    if not has_score or is_live or has_live_indicators:
                        if not has_score or (old_home != scraped["home_score"] or old_away != scraped["away_score"] or old_tempo != scraped["tempo_jogo"] or scraped["finished"]):
                            local_match["gols_casa"] = scraped["home_score"]
                            local_match["gols_fora"] = scraped["away_score"]
                        
                        if not scraped["finished"]:
                            local_match["tempo_jogo"] = scraped["tempo_jogo"]
                            local_match["tempo_atualizado"] = int(time.time() * 1000)
                        else:
                            local_match.pop("tempo_jogo", None)
                            local_match.pop("tempo_atualizado", None)
                            
                        updates_made += 1
                        
                        status_str = 'Encerrado' if scraped['finished'] else f"Ao Vivo - {scraped['tempo_jogo']}"
                        info = f"Jogo {local_match['id']} - {local_match['time_casa']} {scraped['home_score']} x {scraped['away_score']} {local_match['time_fora']} (Status: {status_str})"
                        updated_matches_info.append(info)
                    break

        # 4. Salvar base de dados e registrar logs se houver atualizações
        if updates_made > 0:
            try:
                updated_json_str = json.dumps(matches, indent=2, ensure_ascii=False)
                updated_js_content = f"const COPA_2026_MATCHES = {updated_json_str};\n"
                
                with open(MATCHES_FILE, "w", encoding="utf-8") as f:
                    f.write(updated_js_content)
                    
                log_action(f"Sucesso! {updates_made} placares foram atualizados em {MATCHES_FILE}.")
                for info in updated_matches_info:
                    log_action(f"ATUALIZADO: {info}")
                
                # Executar push imediato das atualizações
                run_git_push()
            except Exception as e:
                log_action(f"ERRO CRÍTICO ao gravar arquivo {MATCHES_FILE}: {e}")
        else:
            log_action("Nenhuma alteração de placar foi realizada nesta rodada.")

        # Se houver algum jogo ao vivo ocorrendo neste exato momento, dorme 5 minutos e repete
        if has_any_live_match:
            log_action("Existe jogo em andamento. Aguardando 5 minutos para a próxima verificação...")
            time.sleep(300) # 5 minutos
        else:
            log_action("Não há jogos em andamento no momento. Finalizando rotina.")
            break

if __name__ == "__main__":
    main()
