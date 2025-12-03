import os
import re

# ==========================
# CONFIGURAÇÕES
# ==========================

# Pasta onde estão os arquivos exportados do Audacity
FOLDER = r"C:\Users\Carol\Documents\Audacity\carol2"

# Prefixo dos arquivos exportados (ex: "audio-01.mp3", "voz-01.mp3"...)
PREFIX = "audio"  # <- MUDE AQUI se o prefixo for outro

# Extensão dos arquivos exportados
EXT = ".mp3"

# Se True: só mostra o que faria, sem renomear
# Se False: renomeia de verdade
DRY_RUN = False
# ==========================
# LISTA DE NOMES FINAIS
# ==========================

target_names = []

# 64 casas: a1..a8, ..., h1..h8
files_squares = []
for col in "abcdefgh":
    for row in range(1, 9):
        files_squares.append(f"{col}{row}.mp3")

target_names.extend(files_squares)

# 6 peças
files_pieces = [
    "peao.mp3",
    "cavalo.mp3",
    "bispo.mp3",
    "torre.mp3",
    "dama.mp3",
    "rei.mp3",
]
target_names.extend(files_pieces)

# 7 ações
files_actions = [
    "captura.mp3",
    "xeque.mp3",
    "xeque_mate.mp3",
    "roque_pequeno.mp3",
    "roque_grande.mp3",
    "promocao.mp3",
    "en_passant.mp3",
]
target_names.extend(files_actions)

# Checagem de segurança
TOTAL_ESPERADO = 64 + 6 + 7  # 77
if len(target_names) != TOTAL_ESPERADO:
    raise RuntimeError(f"Lista de nomes finais tem {len(target_names)} itens, esperado {TOTAL_ESPERADO}.")


# ==========================
# COLETA E ORDENAÇÃO DOS ARQUIVOS
# ==========================

def extract_index(filename: str) -> int:
    """
    Extrai o número do arquivo no padrão:
    PREFIX-01.mp3, PREFIX-02.mp3, ..., PREFIX-77.mp3

    Retorna um inteiro para ordenar corretamente.
    """
    pattern = rf"^{re.escape(PREFIX)}-(\d+){re.escape(EXT)}$"
    m = re.match(pattern, filename)
    if not m:
        # Se não bater o padrão, joga pro final
        return 10**9
    return int(m.group(1))


# Lista todos os arquivos na pasta que batem PREFIX-*.EXT
all_files = os.listdir(FOLDER)
candidate_files = [
    f for f in all_files
    if f.startswith(PREFIX + "-") and f.endswith(EXT)
]

if not candidate_files:
    raise RuntimeError(f"Nenhum arquivo encontrado com padrão {PREFIX}-XX{EXT} em {FOLDER}")

# Ordena pelo número depois do prefixo
candidate_files.sort(key=extract_index)

print("Arquivos encontrados e ordenados:")
for f in candidate_files:
    print("  ", f)

if len(candidate_files) < len(target_names):
    print("\n[AVISO] Há menos arquivos do que nomes finais.")
    print(f"Arquivos: {len(candidate_files)}   Nomes finais: {len(target_names)}")
    print("O script só vai renomear até onde tiver par (arquivo, nome).")
elif len(candidate_files) > len(target_names):
    print("\n[AVISO] Há MAIS arquivos do que nomes finais.")
    print(f"Arquivos: {len(candidate_files)}   Nomes finais: {len(target_names)}")
    print("Arquivos extras serão ignorados.\n")

# ==========================
# RENOMEAR
# ==========================

num_pairs = min(len(candidate_files), len(target_names))
print(f"\nTotal de renomeações previstas: {num_pairs}\n")

for i in range(num_pairs):
    old_name = candidate_files[i]
    new_name = target_names[i]

    old_path = os.path.join(FOLDER, old_name)
    new_path = os.path.join(FOLDER, new_name)

    print(f"{old_name}  -->  {new_name}")

    if not DRY_RUN:
        # Segurança extra: se já existir o arquivo destino, avisa e não sobrescreve
        if os.path.exists(new_path):
            print(f"  [ERRO] Já existe {new_name}, não vou sobrescrever. Pulei.")
            continue
        os.rename(old_path, new_path)

if DRY_RUN:
    print("\n[DRY RUN] Nenhum arquivo foi renomeado. "
          "Se estiver tudo certo, mude DRY_RUN = False e rode de novo.")
else:
    print("\n[OK] Renomeação concluída.")
