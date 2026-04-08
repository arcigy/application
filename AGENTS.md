<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Architektúra automatizácií na mieru (Custom Automations)

Tento projekt využíva špecifickú "Modulárnu architektúru" (App Store model) pre poskytovanie na mieru šitých automatizácií a funkcií pre rôznych klientov bez nutnosti vytvárať nové relačné tabuľky pre každého klienta. **Nikdy nevytvárame novú databázovú tabuľku pre špecifickú automatizáciu alebo klienta!**

## 1. Databázová štruktúra (Prisma)

Všetky vlastné moduly a ich dáta sa ukladajú pomocou dvoch univerzálnych tabuliek využívajúcich JSONB stĺpce:

- `AutomationModule`: Záznam o tom, aké moduly má konkrétny používateľ aktívne. Obsahuje `slug` (identifikátor) a `config` (nastavenia klienta).
- `AutomationData`: Samotné dáta prislúchajúce modulu a používateľovi. Štruktúra dát je ľubovoľná a ukladá sa v stĺpci `data` typu `Json`.

## 2. Pridávanie novej automatizácie

1. **Frontend UI:** Vytvor React komponent v zložke `src/automations/` (napr. `src/automations/FakturyProcessor.tsx`).
2. **Logika/Backend:** Komponent by mal vykonávať volania na Next.js API Routes alebo priamo využívať Server Actions, pričom zapisuje/číta z tabuľky `AutomationData` pomocou kľúča (slug) modulu.
3. **Aktivácia pre klienta:** Do tabuľky `AutomationModule` sa vloží nový riadok s `userId` klienta, priradí sa `slug` (napr. `faktury-processor`) a stav sa nastaví na aktívny.
4. **Vykreslenie:** Klientsky dashboard (`app/[user]/dashboard/page.tsx`) automaticky načíta z databázy všetky moduly, ktoré má daný používateľ aktívne, a dynamicky pre ne vyrenderuje zodpovedajúce komponenty zo zložky `src/automations/`.

## 3. Odoberanie automatizácie

Pre odobranie automatizácie z dashboardu používateľa stačí v databáze zmeniť stav v tabuľke `AutomationModule` na neaktívny (napríklad zmazaním riadku alebo prepnutím boolean vlajky `isActive`). Z kódu nie je nutné mazať komponent, ak ho využívajú iní klienti.

## 4. Upravovanie

Pri požiadavke na zmenu funkčnosti pre konkrétnu automatizáciu vždy upravujeme výhradne príslušný súbor v `src/automations/`. Ak je zmena radikálna a špecifická len pre jedného klienta (pričom modul zdieľa viacero klientov), vytvárame nový klon modulu (napr. `src/automations/FakturyProcessorClientB.tsx`) a v databáze zmeníme danému klientovi `slug`.

## 5. Práca s Dátami (Prisma Json)

Pri čítaní alebo zapisovaní dát do databázy používame formátovanie Prisma JSON:

- Tvorba: `prisma.automationData.create({ data: { moduleId: id, data: { suma: 100 } } })`
- Čítanie: JSON polia môžeme filtrovať pomocou natívnych Postgres JSON operátorov v Prisma (`path`, `equals`, atď.).
