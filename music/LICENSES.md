# Trilhas de fundo — Bela Climb

O jogo espera **5 arquivos .mp3** nesta pasta, um por mundo/bioma. Os nomes são
fixos (referenciados em `js/music.js`, constante `MUSIC_TRACKS`):

| Mundo | Bioma    | Arquivo esperado      | Clima sugerido                          |
|-------|----------|-----------------------|-----------------------------------------|
| 1     | Floresta | `music/floresta.mp3`  | leve, alegre, orgânico                   |
| 2     | Rio      | `music/rio.mp3`       | fluido, tranquilo, borbulhante           |
| 3     | Lago     | `music/lago.mp3`      | calmo, contemplativo                     |
| 4     | Vulcão   | `music/vulcao.mp3`    | tenso, quente, percussivo                |
| 5     | Neve     | `music/neve.mp3`      | cristalino, etéreo, frio                 |

Se um arquivo faltar, o jogo continua normalmente — apenas sem música naquele
mundo (fallback seguro em `js/music.js`).

## ⚠️ Licenciamento (obrigatório para publicar na App Store)

Use SOMENTE faixas com licença que permita **uso comercial** e **redistribuição
dentro de um app**. Preencha a tabela abaixo para cada faixa adicionada, como
prova de proveniência:

| Arquivo        | Título / Autor | Fonte (URL) | Licença | Exige atribuição? |
|----------------|----------------|-------------|---------|-------------------|
| floresta.mp3   |                |             |         |                   |
| rio.mp3        |                |             |         |                   |
| lago.mp3       |                |             |         |                   |
| vulcao.mp3     |                |             |         |                   |
| neve.mp3       |                |             |         |                   |

### Fontes recomendadas (seguras para App Store)
- **Pixabay Music** (pixabay.com/music) — Pixabay Content License: uso comercial
  livre, **sem exigência de atribuição**. Mais simples para app pago/publicado.
- **OpenGameArt.org** — filtre por **CC0** (domínio público): sem atribuição.
- **Kevin MacLeod / incompetech.com** — CC-BY: livre inclusive comercial, mas
  **exige crédito ao autor** (precisaria de uma tela de créditos no jogo).

Evite: YouTube "no copyright" sem licença clara, faixas "free" sem termos
explícitos, e qualquer coisa cuja licença você não consiga comprovar.
