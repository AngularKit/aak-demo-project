# Profil-projet AAK — TaskFlow

> Généré par `/aak-init-profile`. Adapté à la main si besoin.
> Les 4 agents AAK lisent ce fichier à chaque invocation.

## Projet & langue

- **Nom du projet** : `TaskFlow` (package `taskflow`).
- **Langue des livrables** (specs, ADRs, rapports) : `français`. Identifiants de
  code et noms de patterns établis restent en VO.

## Gestionnaire de paquets & commandes canoniques (gates)

- **Gestionnaire** : `pnpm`, version `≥ 11` (`pnpm@11.9.0`). Binaire installé :
  `pnpm exec <cmd>` ; ad-hoc : `pnpm dlx <pkg>`. **Aucune** autre commande ne
  franchit les gates.
- **test** (source de vérité du typecheck) : `pnpm test` (= `ng test`,
  builder `@angular/build:unit-test` + Vitest). Compile les `*.spec.ts` via
  `tsconfig.spec.json` (qui `include` `src/**/*.spec.ts`) ⇒ le typecheck des
  specs est inclus. Le repo n'a aucun spec pour l'instant : « no tests found »
  est attendu, pas une panne du runner.
- **lint** : `pnpm lint` (= `eslint .`). Flat config `eslint.config.mjs` :
  `angular-eslint` v22 (TS + templates) + le préréglage AAK vendoré
  (`.claude/eslint/aak-conventions.mjs`, spread `...aak`). **Rouge sur le
  `before`** : il signale les smells legacy (`prefer-standalone`,
  `prefer-inject`, `prefer-control-flow`, `no-output-native`, a11y) — c'est
  voulu, le gate passe au vert une fois les migrations faites.
- **build** : `pnpm build` (= `ng build`, bundle prod). **N'est pas** la source
  de vérité des types pour les specs (l'app-tsconfig ne compile pas les specs).
- **invalidation cache** : `<aucun>` — pas de système type Nx. Le cache de build
  Angular vit dans `.angular/cache/` (incrémental esbuild/vite, invalidé par le
  CLI). Aucune commande de reset dédiée ⇒ les agents tracent « invalidation
  cache non vérifiée » si un diff touche la config de build.

## Stack & bibliothèques (choix structurants)

- **Version Angular & détection par défaut** : major `22`. **Détection de
  changement** : conventions **modernes** ⇒ `OnPush` **écrit explicitement** sur
  chaque composant. Le repo part en CD Eager (smell legacy assumé du « before ») :
  c'est une cible de modernisation, pas la convention à préserver.
- **État partagé** : `NgRx`. Cible moderne = **Signal Store** (`@ngrx/signals`,
  `signalStore`) ; le repo part de **NgRx classique** (`@ngrx/store` +
  `@ngrx/effects`, fichiers `store/`) en cours de migration (vidéo 3).
  **Seuil de promotion en store** : **systématique** — tout état partagé hors d'un
  seul composant passe par le store (déjà en place, on s'en sert tout le temps).
  Signals locaux réservés à l'UI strictement interne d'un composant (saisie,
  ouverture/fermeture, etc.).
- **Coordinateur de feature (facade)** : un service injectable qui *front* des
  use-cases / gateways et les adapte au view **n'est pas un store**. Naming :
  suffixe `Facade`, jamais `Store`. Portée : instance-scopé via provider de
  route/composant. (Aucune facade dans le repo aujourd'hui — convention à
  appliquer si le besoin émerge.)
- **Validation aux frontières** : `<aucune>` — pas de lib (Zod/Yup absents).
  Données mockées typées en mémoire, sans validation runtime. Tracé.
- **Persistance** : mock **in-memory** (`of(MOCK_TASKS).pipe(delay(300))`).
  Backend/auth : `non` — aucune API, aucune authentification.
- **Async / réactivité** : cible moderne ⇒ `resource()` / `toSignal()` d'abord ;
  RxJS réservé aux vrais flux. Le repo part en RxJS partout (`BehaviorSubject`,
  `combineLatest`) — cible de migration (vidéo 2).
- **Cross-platform** : `aucun`.
- **Forme des modèles** : `interface` (cf. `Task`). Dérivation depuis un schéma
  de validation : `<aucune>` (pas de lib de validation).

## Naming & arborescence

- **Nommage des fichiers** : **pas** de suffixe redondant `.component.` /
  `.service.` (cible v22 ; ex. `task-list.ts`, `task.ts`). Le repo porte encore
  les suffixes legacy (`task-list.component.ts`) — smell à corriger.
- **Préfixe sélecteur** : `app` (depuis `angular.json`).
- **Pages de feature** : `src/app/<feature>/**` (ex. `src/app/tasks/**`). Pas de
  dossier `features/` dédié.
- **DS / primitives partagées** : `<aucun>` — pas de `shared/ui/**`.
- **Domaine pur** (logique testable hors UI) : `<aucun>` dossier dédié — le
  modèle vit dans `src/app/tasks/task.model.ts`.
- **Seuils d'altitude composant** (advisory `code-reviewer`) : défauts universels
  `250` LOC / `6` collaborateurs injectés.

## Styling & design system

- **Règle styling** : **CSS custom properties** / tokens sémantiques (variables
  `:root` dans `src/styles.css`) ; pas de couleur ni d'espacement en dur dans les
  templates.
- **Localisation des styles** : **styles globaux** dans `src/styles.css` (pas de
  styles par composant ; aucun `styleUrl`).
- **Nom du DS / palette** : `<aucun>` DS formalisé — thème ad-hoc (accent
  indigo/violet) porté par variables CSS.
- **Tokens-clés** : `--accent`, `--accent-strong`, `--surface`, `--border`,
  `--text`, `--muted`, `--radius`, `--shadow`.
- **Cible & viewport de référence** : web **desktop-first**, layout responsive
  (1 colonne sous `720px`).
- **Tokens cross-platform** (safe-area, gestes) : `aucun`.

## Tests

- **Framework** : `Vitest` (builder `@angular/build:unit-test`, env `jsdom`) +
  **`@testing-library/angular`** (`render`/`screen`, requêtes par rôle/texte) avec
  **`@testing-library/user-event`** pour les interactions (saisie, clic, clavier).
  Matchers `@testing-library/jest-dom` enregistrés via `src/test-setup.ts`
  (câblé en `setupFiles` dans `angular.json`, inclus dans `tsconfig.spec.json`).
  **Doctrine** : tester par le comportement observable (rôles accessibles, texte
  rendu, sorties émises), pas les détails d'implémentation ; `userEvent` plutôt que
  des events DOM bruts. `TestBed` natif reste permis pour le non-composant (sélecteurs,
  reducers, effects purs).
- **Régime zone** : `zone.js` — **présent** dans les dépendances. `fakeAsync` /
  `tick` / `waitForAsync` **autorisés** en spec (patches zone disponibles via le
  polyfill `zone.js`). Voir aussi le skill `angular-async-testing`.
- **Frontières d'I/O** (seuls fakes légitimes — liste fermée) : **horloge /
  timers** (le `delay(300)` du mock). Pas de réseau réel, pas d'IndexedDB, pas de
  source d'aléa aujourd'hui (à étendre si un backend est branché).
- **Statut des adapters in-memory / fakes de persistance** : **implémentation
  runtime** — l'app tourne réellement sur `MOCK_TASKS` en dev/démo (pas de
  backend). C'est du code applicatif, testable comme tout gateway (pas un fake
  test-only).
- **Carve-out unitaire direct** (sacré) : `<aucun>` — `task.model.ts` n'est que
  des types (rien à tester unitairement).
- **Projet de test visuel** (DOM réel, navigateur) : `aucun`.
- **Glossaire domaine / builders** : `Task` (agrégat unique) ⇒ un builder `Task`
  est justifié dès qu'il est construit >1× dans les specs.
- **Exemple Router-en-test stable** : `<aucun>` — pas de routing réel dans le repo.

## Revue UI/design (optionnelle)

- **Outil de scoring visuel** : `aucun` — validation manuelle/structurelle.
- **Chemin du bundle compilé** (grep des règles `[_nghost-…]`) : `dist/taskflow/`.
- **Composants à forte interaction tactile** : `aucun`.

## Politique commentaires (archéologie interdite)

- **Pattern grep d'archéologie** : `ADR-[0-9]|spec [0-9]{3}|§ ?[A-Z]|ajouté pour|/\*\*`.
- **Règle** (universelle) : par défaut **aucun** commentaire ; seul légitime =
  **une ligne** de WHY intemporel non-évident. Interdits : numéro de spec/ticket,
  réf ADR/§, récit de diagnostic/rétro, « ajouté pour X », le QUOI, le bloc
  narratif. (Note : le « before » contient des commentaires pédagogiques décrivant
  les smells — ils sont là pour les vidéos, pas une convention à imiter.)
- **Garde-fou `pre-commit`** : `aucun`.

## Patterns projet (respectés ; signalés en finding si violés)

- Modèles en `interface` (jamais `class` pour un DTO).
- Données mockées en mémoire via `of(MOCK_TASKS).pipe(delay(...))` (aucun backend).
- (Vide pour le reste ⇒ aucun autre pattern maison vérifié, et c'est tracé.)

## Outillage intake (`intake-auditor`, dimensions 1/5/10)

- `pnpm dlx madge --circular --extensions ts` (cycles) ;
  `pnpm dlx knip` (dead code) ;
  `pnpm dlx depcheck` (deps inutilisées) ;
  `pnpm audit --prod` (CVEs). Dégradation propre si un outil échoue.
- **CI/CD** (dimension 10, **GitHub Actions uniquement**) : `CI non auditée :
  aucun workflow GitHub Actions` (pas de `.github/workflows/`). Tracé, dégradation
  propre. À brancher, les gates attendus en CI = `pnpm test` / (lint) / `pnpm build`.
