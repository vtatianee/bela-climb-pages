# Metadados da App Store — Bela Climb

Campos prontos para colar no **App Store Connect**. O app será publicado em
**Estados Unidos, Canadá (inglês)** e **Brasil (português)**.

- **Idioma primário:** Portuguese (Brazil)
- **Idioma adicional:** English (U.S.) — cobre EUA e Canadá
- **Privacy Policy URL:** https://vtatianee.github.io/bela-climb-pages/privacy.html
- **Support URL:** https://vtatianee.github.io/bela-climb-pages/support.html
- **Marketing URL (opcional):** https://vtatianee.github.io/bela-climb-pages/
- **Copyright:** © 2026 Vanessa Tatiane Evangelista Assink
- **Categoria primária:** Games → Arcade
- **Categoria secundária:** Games → Casual

---

## 🇺🇸🇨🇦 English (U.S.)

**App Name** (≤30): `Bela Climb`

**Subtitle** (≤30): `Slingshot climb through biomes`

**Promotional Text** (≤170):
`Fling Bela the goat up 5 living biomes to the Sacred Super Grass! Simple one-finger slingshot control, endless levels, no ads, fully offline.`

**Keywords** (≤100, no spaces):
`goat,climb,slingshot,jump,arcade,platformer,casual,offline,cute,animal,mountain,kids,fling`

**Description:**
```
Bela the goat wants to reach the Sacred Super Grass at the top of the mountain — and she climbs the only way a stylish goat knows how: by slingshot!

Pull Bela back, aim, and release to fling her from platform to platform. Time each jump, dodge the obstacles, and climb through 5 living biomes — Forest, River, Lake, Volcano, and Snow.

FEATURES
• Simple one-finger slingshot control — easy to learn, tricky to master
• 5 biomes with endless, procedurally generated levels
• Two difficulties: Gentle Goat and Wild Goat — with crumbling platforms, rolling rocks, and the Hungry Wolf
• Surprise chaotic levels where gravity itself turns against you
• Earn up to 3 stars on every level
• 100% offline — no ads, no accounts, no data collected
• Handcrafted art and sound, made with love

Can you help Bela reach the top?
```

---

## 🇧🇷 Português (Brasil)

**Nome do app** (≤30): `Bela Climb`

**Subtítulo** (≤30): `Arremesse a cabra pelos biomas`

**Texto promocional** (≤170):
`Arremesse a Bela por 5 biomas até o Super Capim Sagrado! Controle de estilingue com um dedo, fases infinitas, sem anúncios e 100% offline.`

**Palavras-chave** (≤100, sem espaços):
`cabra,escalar,estilingue,pular,arcade,plataforma,casual,offline,fofo,animais,montanha,bode`

**Descrição:**
```
A Bela, nossa cabra, quer alcançar o Super Capim Sagrado no topo da montanha — e ela sobe do único jeito que uma cabra estilosa conhece: no estilingue!

Puxe a Bela para trás, mire e solte para arremessá-la de plataforma em plataforma. Cronometre cada salto, desvie dos obstáculos e escale 5 biomas vivos — Floresta, Rio, Lago, Vulcão e Neve.

DESTAQUES
• Controle de estilingue com um dedo — fácil de aprender, difícil de dominar
• 5 biomas com fases geradas proceduralmente, infinitas
• Duas dificuldades: a tranquila "Cabra Mansa" e a fera "Cabra da Peste" — com plataformas que desabam, pedras rolantes e o Lobo Faminto
• Fases caóticas surpresa, onde a própria gravidade vira contra você
• Ganhe até 3 estrelas em cada fase
• 100% offline — sem anúncios, sem contas, sem coleta de dados
• Arte e som feitos à mão, com carinho

Você ajuda a Bela a chegar ao topo?
```

---

## Classificação etária (Age Rating)

No questionário do App Store Connect, responda conforme o conteúdo real do jogo:

- **Cartoon or Fantasy Violence:** _Infrequent/Mild_ (o "Lobo Faminto" alcança a
  Bela e a fase termina; pedras rolantes). É violência de desenho, leve.
- Todo o resto (linguagem, temas adultos, apostas, etc.): **None**.

→ Resultado esperado: **4+** ou **9+**. Nada que bloqueie a publicação.

## Screenshots

Em `store/screenshots/` (capturados do simulador iPhone 17 Pro Max, **1320×2868**,
tamanho de tela **6.9"** — o obrigatório na App Store; a Apple aceita este mesmo
conjunto para os slots menores, reescalando):

1. `6.9-01-titulo.png` — tela de título
2. `6.9-02-gameplay.png` — gameplay (Mundo 1-1, Cabra Mansa)
3. `6.9-03-pausa.png` — menu de pausa
4. `6.9-04-dificil.png` — modo Cabra da Peste (Pimenta + grama falsa)

Barra de status "de vitrine" (9:41, bateria/sinal cheios) aplicada.

## Screenshots (prontas)

Capturadas do simulador iPhone 17 Pro Max em **1320×2868** (tamanho 6.9", o maior
que a Apple exige). Barra de status limpa (9:41, bateria/sinal cheios).

- `store/screenshots/pt-BR/` — título, gameplay e pausa em português (ficha do Brasil)
- `store/screenshots/en-US/` — title, gameplay e paused em inglês (ficha de EUA/Canadá)

O jogo detecta o idioma do aparelho automaticamente (`js/i18n.js`), então as duas
fichas mostram o app no idioma do respectivo país.

## Notas ao App Review (argumento contra a Guideline 4.2)

Sugestão de texto para o campo "Notes" no envio:

```
Bela Climb is an original single-player arcade game, not a website wrapper.

- Original slingshot physics engine written from scratch (no game engine).
- All art is drawn programmatically on Canvas; all sound effects are synthesized
  at runtime via the Web Audio API. No stock assets.
- 5 distinct biomes with procedurally generated levels (endless), guaranteed
  solvable by a reach constraint in the level generator.
- Two difficulty modes. Hard mode adds crumbling platforms, rolling rocks
  (from World 2) and a rising Hungry Wolf (from World 3).
- Surprise "chaotic" levels with oscillating gravity and lateral wind.
- Native iOS integration: Haptics feedback on impacts, AVAudioSession configured
  for playback, portrait lock, safe-area aware layout.
- Local progress persistence, pause menu, and automatic PT-BR/EN localization.
- Runs 100% offline. No accounts, no ads, no analytics, no data collected.
```

## Pendências para você confirmar
- **Nome de exibição:** manter `Bela Climb` nos dois países? (cabe nos 30 caracteres).
