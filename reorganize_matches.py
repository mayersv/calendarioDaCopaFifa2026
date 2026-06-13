import re
import json

INI_FILE = "Calendário da Copa do Mundo da FIFA 2026 - site da fifa.ini"
MATCHES_FILE = "matches.js"

# Mapeamento de estádios para nomes completos e amigáveis
STADIUM_MAP = {
    "Estádio da Cidade do México": "Cidade do México (Estádio Azteca)",
    "Estádio de Guadalajara": "Guadalajara (Estádio Akron)",
    "Estádio de Atlanta": "Atlanta (Mercedes-Benz Stadium)",
    "Estádio de Monterrey": "Monterrey (Estádio BBVA)",
    "Estádio de Toronto": "Toronto (BMO Field)",
    "Estádio da Baía de São Francisco": "San Francisco (Levi's Stadium)",
    "Estádio de Los Angeles": "Los Angeles (SoFi Stadium)",
    "BC Place de Vancouver": "Vancouver (BC Place)",
    "Estádio de Boston": "Boston (Gillette Stadium)",
    "Estádio de Filadélfia": "Filadélfia (Lincoln Financial Field)",
    "Estádio de Miami": "Miami (Hard Rock Stadium)",
    "Estádio de Houston": "Houston (NRG Stadium)",
    "Estádio de Kansas City": "Kansas City (Arrowhead Stadium)",
    "Estádio de Dallas": "Dallas (AT&T Stadium)",
    "Estádio de Seattle": "Seattle (Lumen Field)",
    "Estádio de Nova York-Nova Jersey": "Nova York / Nova Jersey (MetLife)",
    # Knockout Stage fallbacks
    "Nova York / Nova Jersey": "Nova York / Nova Jersey (MetLife)",
    "Cidade do México": "Cidade do México (Estádio Azteca)",
    "Dallas": "Dallas (AT&T Stadium)",
    "Seattle": "Seattle (Lumen Field)",
    "Atlanta": "Atlanta (Mercedes-Benz Stadium)",
    "Vancouver": "Vancouver (BC Place)",
    "Boston": "Boston (Gillette Stadium)",
    "Los Angeles": "Los Angeles (SoFi Stadium)",
    "Miami": "Miami (Hard Rock Stadium)",
    "Kansas City": "Kansas City (Arrowhead Stadium)",
    "Toronto": "Toronto (BMO Field)",
    "Guadalajara": "Guadalajara (Estádio Akron)",
    "Filadélfia": "Filadélfia (Lincoln Financial Field)",
    "Houston": "Houston (NRG Stadium)",
    "San Francisco": "San Francisco (Levi's Stadium)",
    "Monterrey": "Monterrey (Estádio BBVA)",
}

# Tradução de nomes de seleções
TEAM_TRANSLATIONS = {
    "Bósnia-Herzegóvina": "Bósnia e Herzegovina",
    "República Democrática do Congo": "RD Congo",
}

def parse_ini_groups(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f.readlines()]
        
    current_group = None
    group_matches = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line:
            i += 1
            continue
        
        if line.startswith("Grupo"):
            current_group = line
            i += 1
            continue
            
        # Match "11 JUN, 16:00"
        if re.match(r"^\d+\s+[A-Z]{3},\s+\d{2}:\d{2}$", line):
            date_time_str = line
            i += 1
            team1_line = lines[i]
            i += 1
            sep = lines[i]
            i += 1
            team2_line = lines[i]
            i += 1
            stadium_line = lines[i]
            i += 1
            
            # Date/Time parse
            day, month_str = date_time_str.split(",")[0].strip().split()
            time_str = date_time_str.split(",")[1].strip()
            month_map = {"JUN": "06", "JUL": "07"}
            date_formatted = f"{day.zfill(2)}/{month_map[month_str]}/2026"
            
            # Team 1
            t1_match = re.match(r"^(.*?)\s*(\d+)?\s*$", team1_line)
            team1 = t1_match.group(1).strip()
            score1 = int(t1_match.group(2)) if t1_match.group(2) else None
            team1 = TEAM_TRANSLATIONS.get(team1, team1)
            
            # Team 2
            t2_match = re.match(r"^\s*(\d+)?\s*(.*?)$", team2_line)
            score2 = int(t2_match.group(1)) if t2_match.group(1) else None
            team2 = t2_match.group(2).strip()
            team2 = TEAM_TRANSLATIONS.get(team2, team2)
            
            # Stadium
            stadium_raw = stadium_line.strip("()")
            stadium = STADIUM_MAP.get(stadium_raw, stadium_raw)
            
            match_data = {
                "data": date_formatted,
                "hora": time_str,
                "fase": current_group,
                "partida": f"{team1} x {team2}",
                "time_casa": team1,
                "time_fora": team2,
                "local": stadium,
                "eliminatoria": False
            }
            if score1 is not None and score2 is not None:
                match_data["gols_casa"] = score1
                match_data["gols_fora"] = score2
                
            group_matches.append(match_data)
        else:
            i += 1
            
    return group_matches

def main():
    print("Iniciando reorganização e ordenação cronológica das partidas...")
    
    # 1. Parsear jogos da fase de grupos do INI
    group_matches = parse_ini_groups(INI_FILE)
    print(f"Lidos {len(group_matches)} jogos da fase de grupos do arquivo INI.")
    
    # 2. Carregar partidas atuais de matches.js
    with open(MATCHES_FILE, "r", encoding="utf-8") as f:
        js_content = f.read()
        
    m = re.search(r"const COPA_2026_MATCHES\s*=\s*(\[.*?\]);", js_content, re.DOTALL)
    if not m:
        print("ERRO: Não foi possível encontrar a variável COPA_2026_MATCHES em matches.js")
        return
        
    all_current_matches = json.loads(m.group(1))
    
    # 3. Separar as partidas eliminatórias atuais (id >= 73)
    knockout_matches = [m for m in all_current_matches if m.get("eliminatoria", False) or m.get("id", 1) >= 73]
    print(f"Lidos {len(knockout_matches)} jogos do mata-mata do matches.js.")
    
    # Atualizar locais dos estádios dos jogos do mata-mata para o padrão completo
    for m in knockout_matches:
        raw_local = m["local"]
        m["local"] = STADIUM_MAP.get(raw_local, raw_local)
        m["eliminatoria"] = True # Garantir flag ativa
    
    # 4. Juntar e ordenar todas as partidas
    combined_matches = group_matches + knockout_matches
    
    # Função de ordenação
    def get_sort_key(match):
        day, month, year = map(int, match["data"].split("/"))
        if match["hora"] == "A definir":
            hour, minute = 23, 59
        else:
            hour, minute = map(int, match["hora"].split(":"))
        # Usamos o ID original para manter a ordenação original do mata-mata no mesmo dia
        orig_id = match.get("id", 0)
        return (year, month, day, hour, minute, orig_id)
        
    combined_matches.sort(key=get_sort_key)
    
    # 5. Re-atribuir IDs sequenciais de 1 a 104
    for idx, match in enumerate(combined_matches):
        match["id"] = idx + 1
        
    # 6. Gravar de volta no matches.js
    updated_json_str = json.dumps(combined_matches, indent=2, ensure_ascii=False)
    updated_js_content = f"const COPA_2026_MATCHES = {updated_json_str};\n"
    
    with open(MATCHES_FILE, "w", encoding="utf-8") as f:
        f.write(updated_js_content)
        
    print(f"Sucesso! Reorganizados e ordenados {len(combined_matches)} jogos no {MATCHES_FILE}.")

if __name__ == "__main__":
    main()
