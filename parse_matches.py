import re
import json

file_path = "lista-de-jogos-copa-fifa-2026.md"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

hours_map = {}
in_rodada_1 = False

for line in lines:
    if "Fase de Grupos - Rodada 1" in line or "⚽ Rodada 1 - Fase de Grupos" in line:
        in_rodada_1 = True
        continue
    if in_rodada_1:
        if line.startswith("📅") or "Rodada 2" in line or "Fases Seguintes" in line or "## ⚽" in line:
            in_rodada_1 = False
            continue
        parts = line.strip().split("\t")
        if len(parts) >= 4 and parts[0] != "Data":
            date = parts[0].strip()
            time = parts[1].strip()
            teams = parts[3].strip()
            match_key = re.sub(r'\s+', '', teams.lower())
            hours_map[match_key] = time

matches = []

for line in lines:
    line_str = line.strip()
    if not line_str.startswith("|"):
        continue
    
    parts = [p.strip() for p in line_str.split("|")]
    if len(parts) >= 6:
        id_str = parts[1].replace("*", "").strip()
        if id_str.lower() == "jogo" or ":---" in line_str or "---" in id_str:
            continue
            
        if id_str.isdigit():
            id_jogo = int(id_str)
            data = parts[2].strip()
            grupo_ou_fase = parts[3].strip()
            partida = parts[4].strip()
            local = parts[5].strip()
            
            # Tentar obter a hora do mapeamento
            match_key = re.sub(r'\s+', '', partida.lower())
            match_key = match_key.replace("vs", "x")
            
            hora = "A definir"
            if match_key in hours_map:
                hora = hours_map[match_key]
            else:
                for k, h in hours_map.items():
                    if k in match_key or match_key in k:
                        hora = h
                        break
            
            # Separar times
            teams = [t.strip() for t in partida.split(" x ")]
            time_casa = teams[0] if len(teams) > 0 else ""
            time_fora = teams[1] if len(teams) > 1 else ""

            is_knockout = len(grupo_ou_fase) > 1 and grupo_ou_fase != "Grupo"
            
            # Definir nome bonito da fase
            if is_knockout:
                fase_nome = grupo_ou_fase
            else:
                fase_nome = f"Grupo {grupo_ou_fase}"
                
            matches.append({
                "id": id_jogo,
                "data": data,
                "hora": hora,
                "fase": fase_nome,
                "partida": partida,
                "time_casa": time_casa,
                "time_fora": time_fora,
                "local": local,
                "eliminatoria": is_knockout
            })

matches.sort(key=lambda x: x["id"])

# Gravar no arquivo matches.js
js_content = f"const COPA_2026_MATCHES = {json.dumps(matches, indent=2, ensure_ascii=False)};\n"
output_path = "matches.js"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"Sucesso! Gerados {len(matches)} jogos.")
