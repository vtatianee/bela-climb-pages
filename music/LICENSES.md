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

Todas as faixas abaixo vieram do **Pixabay**, sob a **Pixabay Content License**:
uso comercial livre, **sem exigência de atribuição**, permitido adaptar. O uso aqui
(música de fundo dentro de um jogo) não é "standalone" — a faixa integra uma obra
nova, que é o uso permitido pela licença.

| Arquivo      | Título                      | Autor (Pixabay) | ID     | Fonte (URL)                                                                         | Licença                 | Atribuição  |
|--------------|-----------------------------|-----------------|--------|-------------------------------------------------------------------------------------|-------------------------|-------------|
| floresta.m4a | Forest Path                 | vitmatnotes     | 212664 | https://pixabay.com/music/happy-childrens-tunes-forest-path-212664/                 | Pixabay Content License | Não exigida |
| rio.m4a      | Kids                        | the_mountain    | 513158 | https://pixabay.com/music/happy-childrens-tunes-kids-513158/                        | Pixabay Content License | Não exigida |
| lago.m4a     | Happy Cute Kids             | mondamusic      | 560127 | https://pixabay.com/music/happy-childrens-tunes-happy-cute-kids-560127/             | Pixabay Content License | Não exigida |
| vulcao.m4a   | Powerful Percussion         | energysound     | 513717 | https://pixabay.com/music/beats-powerful-percussion-513717/                         | Pixabay Content License | Não exigida |
| neve.m4a     | Happy Kids Background Music | bombinsound     | 499554 | https://pixabay.com/music/happy-childrens-tunes-happy-kids-background-music-499554/ | Pixabay Content License | Não exigida |

Os IDs conferem com as URLs de origem, e os autores vieram no nome do arquivo
baixado do Pixabay.

**Formato:** os MP3 originais (256 kbps, 15 MB no total) foram reencodados para
**AAC 96 kbps (.m4a)** com `afconvert`, caindo para ~6,3 MB — codec nativo do iOS,
sem diferença audível como trilha de fundo. A licença do Pixabay permite
explicitamente adaptar/modificar o conteúdo. Os MP3 originais estão preservados em
`~/Downloads` (e no histórico do git, commit `4a1db2e`), caso seja preciso
reencodar a partir da fonte de maior qualidade.

### Fontes recomendadas (seguras para App Store)
- **Pixabay Music** (pixabay.com/music) — Pixabay Content License: uso comercial
  livre, **sem exigência de atribuição**. Mais simples para app pago/publicado.
- **OpenGameArt.org** — filtre por **CC0** (domínio público): sem atribuição.
- **Kevin MacLeod / incompetech.com** — CC-BY: livre inclusive comercial, mas
  **exige crédito ao autor** (precisaria de uma tela de créditos no jogo).

Evite: YouTube "no copyright" sem licença clara, faixas "free" sem termos
explícitos, e qualquer coisa cuja licença você não consiga comprovar.
