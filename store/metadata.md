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
- **Preço do app:** **Grátis** (a venda é via compra no app — ver seção IAP abaixo)

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

## Screenshots (prontas)

Capturadas do simulador iPhone 17 Pro Max em **1320×2868** (tamanho **6.9"**, o
maior que a Apple exige; ela reescala para os slots menores). Renderização Hi-DPI,
barra de status "de vitrine" (9:41, bateria/sinal cheios). **4 telas por idioma**,
cada ficha no idioma do respectivo país (o jogo detecta o locale via `js/i18n.js`):

**`store/screenshots/en-US/`** (ficha de EUA/Canadá):
1. `1-title.png` — tela de título
2. `2-gameplay.png` — gameplay (World 1-1, Gentle Goat)
3. `3-wild-goat.png` — modo difícil (Wild Goat): Pimenta + plataformas de grama falsa
4. `4-paused.png` — menu de pausa

**`store/screenshots/pt-BR/`** (ficha do Brasil):
1. `1-titulo.png` — tela de título
2. `2-gameplay.png` — gameplay (Mundo 1-1, Cabra Mansa)
3. `3-cabra-da-peste.png` — modo difícil: Pimenta + plataformas de grama falsa
4. `4-pausa.png` — menu de pausa

A tela de modo difícil (item 3) mostra a profundidade do jogo — útil também como
reforço visual do argumento contra a Guideline 4.2.

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

## Compra no app (IAP) — desbloqueio do jogo completo

Modelo: **app grátis** com Mundo 1-1 a 1-3 jogáveis; uma **compra única** libera
o jogo inteiro. Implementado com StoreKit 2 nativo (plugin `BelaIAP`), sem SDKs de
terceiros e sem coleta de dados.

**Produto a criar no App Store Connect** (My Apps → Bela Climb → In-App Purchases):
- **Tipo:** Non-Consumable (não-consumível)
- **Product ID:** `com.vtatianee.belaclimb.fullunlock`  ← precisa ser EXATAMENTE este
  (é o id em `js/iap.js` e no plugin nativo)
- **Reference Name:** Full Game Unlock
- **Preço:** faixa **US$ 2.99** (a Apple define o equivalente ~R$ 14,90 no Brasil)
- **Localizações (nome de exibição / descrição):**
  - pt-BR: "Jogo Completo" / "Desbloqueie os 5 biomas, fases infinitas, o modo
    Cabra da Peste e as fases caóticas."
  - en-US: "Full Game" / "Unlock all 5 biomes, endless levels, Wild Goat mode and
    chaotic levels."
- Screenshot de review do IAP: usar a tela do paywall (o App Store Connect pede uma).

**Passos:**
1. Em App Store Connect, definir o **preço do app como Free** (Pricing and Availability).
2. Criar o IAP acima e submetê-lo **junto com a primeira versão do app** (IAPs novos
   são revisados junto do binário na 1ª vez).
3. O app já chama a StoreKit por esse Product ID — nada mais a mudar no código.

**Testar a compra ANTES de enviar:**
- *Local (simulador/Mac):* no Xcode, Product → Scheme → Edit Scheme → Run → Options →
  **StoreKit Configuration** → selecionar `ios/App/BelaClimb.storekit`. Rodar, jogar
  até a 4ª fase e comprar no diálogo de teste (não cobra nada). O `.storekit` é
  ignorado em release/TestFlight.
- *Sandbox (iPhone real):* criar um **Sandbox Tester** em App Store Connect → Users
  and Access → Sandbox, e logar nele em Ajustes → App Store → Sandbox Account. A
  compra usa o ambiente de teste (não cobra).

**Botão "Restaurar compra":** já existe no paywall (a Apple exige para
não-consumíveis) e chama `restore` → `AppStore.sync()`.
