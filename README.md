# Chess Audio Narrator — Tampermonkey Extension

Este projeto permite **narrar automaticamente os movimentos do Chess.com** usando áudios personalizados gravados pelo próprio usuário.

## 📌 Funcionalidade

Durante a análise de uma partida no Chess.com, o script identifica o **movimento atualmente selecionado** e toca automaticamente a combinação correta de áudios, como:

- Nome da peça (ex.: _peão_, _cavalo_)
- Ações (ex.: _captura_, _xeque_, _promoção_)
- Coordenadas (ex.: _e4_, _d5_)

Exemplo de narração automática:

> **"peão" + "captura" + "d6"**

Tudo é montado dinamicamente com base no texto SAN exibido na lista de movimentos do Chess.com.

---

# 🎯 Como funciona

## 1) Captura de movimentos no Chess.com

O script lê o HTML da página usando Tampermonkey e identifica o movimento ativo através do seletor:

```
span.node-highlight-content.offset-for-annotation-icon.selected
```

Esse elemento contém o SAN do lance, como:

```
e4
Nf3
Qxd5+
O-O
exd8=Q#
```

O código então interpreta:

- peça
- captura
- destino
- xeque / xeque-mate
- promoção
- roque curto / longo

E monta a lista de áudios correspondentes.

---

# 🔊 2) Áudios usados

Você precisa gravar **77 áudios**:

### ✔️ 64 casas

`a1.mp3` … `h8.mp3`

### ✔️ 6 peças

`peao.mp3`  
`cavalo.mp3`  
`bispo.mp3`  
`torre.mp3`  
`dama.mp3`  
`rei.mp3`

### ✔️ 7 ações

`captura.mp3`  
`xeque.mp3`  
`xeque_mate.mp3`  
`roque_pequeno.mp3`  
`roque_grande.mp3`  
`promocao.mp3`  
`en_passant.mp3`

### TOTAL = **77 arquivos**

---

# 🎙️ Como gravar os áudios

## 1. Gravar tudo de uma vez

No Audacity:

1. Clique **Gravar**
2. Leia as 77 palavras em ordem
3. Deixe **~1 segundo de silêncio** entre cada palavra
4. Finalize a gravação

## 2. Separar automaticamente

Use **Detectar Silêncio** → **Split on Silence**  
O Audacity irá dividir automaticamente em 77 faixas.

## 3. Exportar tudo

Arquivo → Exportar → **Exportar Múltiplos**  
Formato: **MP3 320kbps**

Os arquivos serão gerados assim:

```
audio-01.mp3
audio-02.mp3
...
```

---

# 🔄 3) Renomear automaticamente (Python)

Use o script Python incluído no repositório.

Ele lê os arquivos exportados pelo Audacity e renomeia automaticamente para os nomes corretos do addon.

Exemplo:

```
audio-01.mp3 → a1.mp3
audio-02.mp3 → a2.mp3
...
audio-64.mp3 → h8.mp3
audio-65.mp3 → peao.mp3
...
```

Basta ajustar a pasta e o prefixo:

```python
FOLDER = r"C:\Users\SeuUsuario\Documents\Audacity\meus_audios"
PREFIX = "audio"
```

---

# 🧩 4) Instalando o script no navegador

### ✔️ Passo 1 — Instalar o Tampermonkey

Chrome:  
https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo

Firefox:  
https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/

### ✔️ Passo 2 — Criar um novo script

No Tampermonkey:

1. Clique **Criar Novo Script**
2. Apague tudo
3. Cole o conteúdo do arquivo `chess_audio.js` do repositório

### ✔️ Passo 3 — Testar

Abra:

```
https://www.chess.com/analysis
```

# 🤝 Contribuições

Você pode:

- Gravar sua própria voz
- Criar novos pacotes de áudio
- Melhorar a detecção de movimentos
- Criar modo “narrador feminino/masculino”
- Distribuir como extensão do Chrome futuramente

---

# ❤️ Agradecimentos

Muito obrigada por usar e apoiar este projeto!  
Foi um prazer desenvolver esse addon — aproveite e divirta-se melhorando sua experiência de xadrez.
