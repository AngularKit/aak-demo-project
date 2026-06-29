---
type: intake-audit
---

# Intake audit — repo entier

## Description

Audit d'entrée du scope **repo** (repo entier). Déclenché le 2026-06-29 via
`/aak-audit`. Aucun diff : la portée est ce scope.

## Intake audit

**Scope** : repo (`src/` entier — 11 fichiers `.ts`, 417 LOC, scope-repo ⇒ § I.0 sauté)
**Date** : 2026-06-29
**Outils exécutés** : pnpm audit ✅ | madge ✅ | knip ✅ | depcheck ✅
**CI auditée** (dim 10, GitHub Actions) : N/A (aucun workflow GitHub Actions — `CI non auditée : aucun workflow GitHub Actions`, tracé profil)
**Gates CI locaux** : tests ⚠️ (« no tests found » — attendu, zéro spec dans le repo ; cf. F010) / lint ❌ (16 erreurs, smells legacy du « before » assumés) / build ✅ (bundle prod 259,62 kB)
**Candidats hors-périmètre écartés** : N/A (scope-repo)

> **Cadre de lecture — repo-démo « before » assumé.** Le profil et chaque fichier
> documentent que ce repo est volontairement un legacy Angular v15 (cibles de
> modernisation des vidéos 1/2/3). Les smells *profilés* (non-standalone, CD eager,
> injection par constructeur, RxJS-first, NgRx classique, suffixes `.component.`,
> `*ngIf`/`*ngFor`, commentaires pédagogiques) **ne sont pas remontés comme dette
> à corriger** : ce sont les cibles de migration, déjà tracées par le profil et la
> grille lint (rouge voulu). Ils sont consolidés en **un seul constat de cadrage
> (F001)**. Les constats F002→F012 isolent ce que le cadrage « before » **ne couvre
> pas** : bugs latents, dette non profilée, incohérences au-delà du script de migration.
> Le plancher de 20-60 constats ne s'applique pas (§ « Cible de volume ») : repo
> minuscule et intentionnellement figé.

### Vue d'ensemble

TaskFlow est une SPA Angular 22 mono-feature (`src/app/tasks/**`), bootstrappée en
NgModule legacy (`platformBrowserDynamic().bootstrapModule`), sans backend ni auth :
toute la donnée vient de `MOCK_TASKS` (6 tâches en mémoire) servie via
`of(MOCK_TASKS).pipe(delay(300))`. **Mode de rendu : SPA pure** (builder
`@angular/build:application`, `browser: src/main.ts`, aucune config serveur/SSR/
prerender dans `angular.json`) — aucun constat à effet `<head>`/JSON-LD/cycle de vie
DOM-prérendu ne s'applique ici (§ III ter sans objet). Entry points : `main.ts` →
`AppModule` → `AppComponent` (conteneur intelligent câblé au store NgRx) → `TaskListComponent`
(liste présentationnelle) + `TaskDetailComponent`. Styles 100 % globaux (`src/styles.css`,
tokens CSS `:root`). Le repo est délibérément figé en Angular v15 (cf. cadre de lecture) ;
ses hotspots de volume sont `task-list.component.ts` (98 LOC) et `task.service.ts` (61 LOC).

Fait structurant non profilé révélé par l'audit : le repo porte **deux systèmes
d'état parallèles** (le store NgRx, qui pilote réellement l'app, et `TaskService`,
un service RxJS injecté seulement par `TaskListComponent` mais dont aucune méthode
de chargement n'est jamais appelée) — source des constats F002/F003.

### Pistes d'enquête prioritaires (nommées)

1. `src/app/tasks/task.service.ts` — 61 LOC, plus gros service ; suspecté inerte (vérifié : l'est).
2. `src/app/tasks/task-list/task-list.component.ts` — 98 LOC, hotspot volume ; `console.log` + état `loading` mort.
3. `src/app/app.component.ts` — conteneur intelligent, seule source d'état réellement câblée.
4. `src/app/tasks/store/task.effects.ts` — couplage `useDefineForClassFields=false` ↔ pattern `createEffect` champ.
5. `src/app/tasks/store/task.selectors.ts` — exports composés uniquement en interne (knip).
6. `src/app/tasks/store/task.reducer.ts` — type `StatusFilter` importé d'un service inerte (couplage).
7. `tsconfig.json` — absence de `strict`, `useDefineForClassFields=false` legacy.
8. `package.json` — deps déclarées non importées (`@angular/forms`, `@angular/router`).
9. `src/main.ts` — bootstrap legacy, `.catch(console.error)`.
10. `src/app/tasks/task.model.ts` — agrégat unique, sain (référence de propreté).

### Synthèse (classée par impact)

1. **F002** — Deux systèmes d'état parallèles : `TaskService` (RxJS) coexiste avec le store NgRx ; ses méthodes de chargement/filtre ne sont jamais appelées ⇒ service quasi-mort.
2. **F003** — `TaskListComponent.loading` est mort : abonné à `TaskService.loading$`, un `BehaviorSubject(false)` que rien ne fait basculer ⇒ le « Loading tasks… » de la liste ne s'affiche jamais.
3. **F004** — Type domaine `StatusFilter` exporté depuis `task.service.ts` (service inerte) et importé par les fichiers `store/` ⇒ couplage du domaine à une couche morte.
4. **F010** — Zéro spec dans le repo : aucune dimension testée, gate test mécaniquement « no tests found ».
5. **F005** — `console.log` résiduel en production dans un setter d'`@Input` (bruit + exécuté à chaque mise à jour de binding).
6. **F001** — Smells de modernisation legacy v15 (cadrage « before », non actionnables hors plan vidéos 1/2/3).
7. **F006** — `tsconfig.json` sans `strict: true` (ni `strictNullChecks` explicite) sur un repo neuf Angular 22.
8. **F007** — Deps déclarées jamais importées (`@angular/forms`, `@angular/router`).
9. **F011** — Aucune CI : gates `lint`/`build` verts en local mais aucun workflow ne les exécute.
10. **F008/F009/F012** — Exports NgRx morts, `useDefineForClassFields=false` non documenté côté risque, divergence `packageManager`.

### Légende des catégories (OBLIGATOIRE — le compte rendu peut être transmis à un tiers sans accès au contrat)

**Catégorie** (dimension d'audit) : 1 Délitement architectural · 2 Érosion de la cohérence · 3 Dette de types et contrats · 4 Dette de tests · 5 Dette de dépendances et configuration · 6 Performance et gestion des ressources · 7 Gestion des erreurs et observabilité · 8 Sécurité · 9 Dérive de la documentation · 10 Dette de CI/CD et automatisation.
**Sévérité** : Critique (casse prod / sécurité / régression silencieuse) · Élevée (ralentit le travail courant) · Moyenne (friction modérée) · Faible (cosmétique / pérennité). **Effort** : S ≤ ½ j · M ≤ 2 j · L > 2 j.
**`[dep]`** : sans objet (scope-repo).

### Constats (table — PROBLÈMES ACTIONNABLES UNIQUEMENT)

| ID | Catégorie | fichier:ligne | Sévérité | Effort | Description | Recommandation |
| --- | --- | --- | --- | --- | --- | --- |
| F001 | 2 | src/app/tasks/task-list/task-list.component.ts:35 | Faible | L | **Cadrage « before » (consolidé)** : smells legacy v15 profilés et tracés par la grille lint (16 erreurs : `prefer-standalone`, `prefer-inject`, `prefer-control-flow`, `no-output-native`, a11y) répartis sur tous les composants/templates + suffixes `.component.` + bootstrap NgModule + RxJS-first + NgRx classique. **Non actionnable en tant que dette** : ce sont les cibles de migration des vidéos 1/2/3. | Aucune action hors du plan de modernisation déjà cadré (profil). Listé pour traçabilité, pas pour correction immédiate. |
| F002 | 1 | src/app/tasks/task.service.ts:45 | Élevée | M | **Deux systèmes d'état parallèles.** `TaskService.loadTasks()`/`setFilter()`/`filteredTasks$`/`tasks$`/`filter$`/`getById()` ne sont appelés **nulle part** (vérifié par grep : seul `loading$` est consommé, cf. F003). L'app tourne entièrement sur le store NgRx (`AppComponent` dispatche, `TaskEffects` charge `MOCK_TASKS`). Le service est une couche d'état fantôme dupliquant la logique du store (filtre identique en doublon : `filter === 'all' ? … : filter(...)` présent ici **et** dans `selectFilteredTasks`). | Trancher : soit `TaskService` redevient le gateway de données du store (l'effect appelle `taskService.fetchTasks()` au lieu de `MOCK_TASKS` en dur), soit le service est supprimé. Aujourd'hui c'est de la dette dormante qui induit en erreur. Question d'archi → remonter à `architect`. |
| F003 | 1 | src/app/tasks/task-list/task-list.component.ts:64 | Moyenne | S | **État `loading` mort.** `TaskListComponent` s'abonne (`ngOnInit`) à `taskService.loading$`, un `BehaviorSubject(false)` que **rien ne fait basculer** : `TaskService.loadTasks()` (seul à appeler `loadingSubject.next(true)`) n'est jamais invoqué (cf. F002). Le `<p *ngIf="loading">Loading tasks…</p>` (task-list.component.html:5) est donc **code mort** : il ne s'affiche jamais. L'indicateur de chargement réel vient du store (`loading$` de `AppComponent`). | Supprimer l'abonnement `loading$` + le champ `loading` + son template, ou faire passer le vrai état de chargement du store en `@Input`. Le `ngOnDestroy`/`Subscription` ne protège alors plus rien. |
| F004 | 3 | src/app/tasks/store/task.reducer.ts:4 | Moyenne | S | **Type domaine couplé à une couche morte.** `StatusFilter` (type métier `'all' \| TaskStatus`) est défini dans `task.service.ts:7` puis importé par `task.reducer.ts:4`, `task.actions.ts:3`, `app.component.ts:6`. Le store dépend en types d'un service quasi-mort (F002) — si le service est supprimé, le store casse. | Déplacer `StatusFilter` dans `task.model.ts` (lieu naturel du domaine, déjà sans dépendance). Découple le store du sort de `TaskService`. |
| F005 | 7 | src/app/tasks/task-list/task-list.component.ts:46 | Moyenne | S | **`console.log` en production** dans le setter d'`@Input set tasks()` ⇒ exécuté à **chaque** mise à jour de binding (chaque cycle de CD eager qui repropage `filteredTasks$`). Bruit console + micro-coût répété. Au-delà du smell pédagogique : un `console.log` actif n'est pas une convention « before » du profil (qui n'autorise que les *commentaires* pédagogiques). | Supprimer la ligne. Si trace utile, passer par un vrai logger conditionné à l'environnement. |
| F006 | 5 | tsconfig.json:5 | Élevée | S | **`strict` absent.** `compilerOptions` active plusieurs flags fins (`noImplicitOverride`, `noImplicitReturns`…) mais **pas** `"strict": true` ni `strictNullChecks` explicite. Sur un repo Angular 22, `strict` est le défaut des nouveaux projets CLI ; son absence laisse passer `null`/`undefined` non gardés (ex. `task: Task \| undefined \| null` en task-detail) sans filet du compilateur. | Ajouter `"strict": true` à `tsconfig.json` puis traiter les erreurs révélées. Friction réelle dès que des specs/feature arrivent. |
| F007 | 5 | package.json:18 | Faible | S | **Deps déclarées non importées** : `@angular/forms` (package.json:18) et `@angular/router` (package.json:21) — confirmé par knip **et** depcheck, et grep : aucun `import` ni route ni formulaire dans `src/`. Poids inutile dans le graphe d'install. | Retirer les deux des `dependencies` tant qu'aucun formulaire/routing n'est branché (les rajouter au besoin). `tslib`/`@angular/build`/`compiler-cli`/`prettier` signalés par depcheck sont des **faux positifs** (cf. section dédiée). |
| F008 | 1 | src/app/tasks/store/task.selectors.ts:9 | Faible | S | **Exports composés uniquement en interne.** `selectAllTasks` (selectors:9) et `selectSelectedId` (selectors:15) ne sont consommés que par d'autres sélecteurs **du même fichier** (`selectFilteredTasks`, `selectSelectedTask`) ; idem `selectTaskState` (selectors:7) et `initialTaskState` (reducer:17), consommés seulement dans leur propre fichier (knip). Ils devraient être `const` non exportées. | Dé-exporter (retirer `export`) tant qu'aucun consommateur externe. Trivial — le dossier `store/` est de toute façon cible de collapse vidéo 3 (F001), donc gain faible. |
| F009 | 5 | tsconfig.json:14 | Moyenne | S | **`useDefineForClassFields=false` : contrainte runtime non tracée comme risque.** Le commentaire explique le *pourquoi* (le pattern champ `createEffect` référence `this.actions$`), mais cette config legacy v15 est un **piège** : tout code neuf qui suppose la sémantique TC39 standard (initialiseurs de champ après le constructeur) se comportera différemment. Aucun ADR ne fige cette décision structurante. | Lors de la migration NgRx → Signal Store (vidéo 3), le pattern `createEffect`-champ disparaît : repasser `useDefineForClassFields` au défaut `true` et acter la bascule dans un ADR. D'ici là, documenter le risque hors d'un simple commentaire de fichier. |
| F010 | 4 | src/app/tasks/store/task.effects.ts:16 | Élevée | M | **Zéro test dans le repo.** Aucun `*.spec.ts` (gate `pnpm test` ⇒ « no tests found », attendu par profil mais constat réel). La logique non triviale n'est couverte par rien : filtre par statut (dupliqué service+store), effect `loadTasks$` (succès/échec via `catchError`), résolution `selectSelectedTask`. High-churn récent (5 commits) sans aucun filet. | Démarrer la couverture par la logique pure et testable : `selectFilteredTasks`/`selectSelectedTask` (sélecteurs purs), le reducer (transitions d'état), l'effect (succès + échec). Le profil autorise `fakeAsync`/`tick` pour le `delay(300)`. |
| F011 | 10 | .github/workflows:0 | Moyenne | S | **Aucune CI.** Gates `lint`/`build` exécutables en local (profil) mais **aucun workflow** ne les rejoue : rien n'empêche de pousser un build cassé ou des lint errors. Drift gate local↔CI total (la CI n'existe pas). Tracé par le profil mais reste une dette. | Ajouter un workflow GitHub Actions minimal exécutant `pnpm install --frozen-lockfile` puis `pnpm build` (+ `pnpm test` quand des specs existent). Épingler les actions sur SHA, bloc `permissions:` least-privilege. **N.B.** : `pnpm lint` rouge volontairement aujourd'hui (F001) ⇒ ne pas en faire un gate bloquant tant que la migration n'est pas faite. |
| F012 | 5 | angular.json:8 | Faible | S | **Divergence de gestionnaire de paquets.** `angular.json:8` déclare `"cli": { "packageManager": "npm" }` alors que le repo, le profil et `package.json` (`"packageManager": "pnpm@11.9.0"`) imposent **pnpm exclusif**. Tout schematic CLI (`ng generate`, `ng add`) invoquera `npm` et désynchronisera le lockfile pnpm. | Mettre `"packageManager": "pnpm"` dans `angular.json`. |

### Priorités absolues (« si tu ne corriges rien d'autre »)

1. **F002** — Trancher le double système d'état. Tant que `TaskService` et le store coexistent sans contrat clair, toute évolution (et la migration vidéo 2/3) part sur une base ambiguë. Décider : gateway du store, ou suppression. → arbitrage `architect`.
2. **F003** — Supprimer l'état `loading` mort de `TaskListComponent` (ou le câbler au store). Bug silencieux : un indicateur de chargement qui ne s'allume jamais.
3. **F006** — Activer `strict` avant d'écrire la moindre feature ou spec : le coût de rétro-fit grandit avec chaque ligne ajoutée sans filet.

### Gains rapides (effort faible × sévérité moyenne+)

- [ ] **F005** — Supprimer le `console.log` de `task-list.component.ts:46` (< 5 min).
- [ ] **F012** — `angular.json` : `packageManager` → `pnpm` (< 5 min).
- [ ] **F004** — Déplacer `StatusFilter` de `task.service.ts` vers `task.model.ts` (< 15 min).
- [ ] **F007** — Retirer `@angular/forms` + `@angular/router` de `package.json` (< 10 min).
- [ ] **F003** — Supprimer abonnement + champ + template `loading` de `TaskListComponent` (< 20 min).

### Bonnes pratiques notables (informatif)

- `src/app/tasks/task.model.ts` — agrégat domaine isolé, types `interface`, `MOCK_TASKS` typé, zéro dépendance entrante problématique. Référence de propreté du repo, à préserver telle quelle.
- Styling 100 % tokens CSS sémantiques (`--accent`, `--surface`…) dans `src/styles.css`, aucune couleur en dur dans les templates — conforme au profil, à reproduire ailleurs.
- `task.effects.ts:24` — l'effect gère déjà le chemin d'échec (`catchError` → `loadTasksFailure`), même sans backend réel : bonne hygiène d'erreur sur un mock.

### Faux positifs assumés (BLOQUANT NON-VIDE)

- **Smells legacy profilés (non-standalone, CD eager, `inject()` absent, `*ngIf`/`*ngFor`, suffixes `.component.`, bootstrap NgModule, RxJS-first)** — un audit naïf les remonterait en masse comme dette Angular 22. Dans CE repo ils sont la **cible de modernisation assumée** du « before » AAK (profil §« Stack » + commentaires de chaque fichier + grille lint rouge voulue). Consolidés en F001, pas démultipliés.
- **Commentaires `/**` (task.service.ts:9, app.component.ts:15, task-list.component.ts:16)** — le grep d'archéologie du profil les flague (`/\*\*`). Ce sont des **en-têtes pédagogiques décrivant les smells pour les vidéos**, explicitement bénis par le profil (« le before contient des commentaires pédagogiques… ils sont là pour les vidéos, pas une convention à imiter »). Aucune réf ADR/§/n° spec dedans (vérifié). Non remontés comme violation d'archéologie — mais à supprimer lors de la modernisation (pas une convention durable).
- **depcheck `tslib`, `@angular/build`, `@angular/compiler-cli`, `prettier`** — signalés « unused » mais **consommés hors-import** : `tslib` est injecté par `importHelpers: true` (tsconfig), `@angular/build`/`@angular/compiler-cli` sont l'outillage de build/CLI (jamais importés depuis `src/`), `prettier` est un binaire de formatage. Faux positifs classiques d'analyse statique. Seuls `@angular/forms`/`@angular/router` sont de vrais inutilisés (F007, confirmés par knip + grep).
- **knip `initialTaskState`/`selectTaskState`/`selectAllTasks`/`selectSelectedId`** — « unused exports » mais bel et bien consommés à l'intérieur de leur fichier (réducteur / composition de sélecteurs). Pas du code mort : juste un `export` superflu (rétrogradé en F008 Faible, pas en finding de suppression).
- **`madge` 0 cycle / `pnpm audit` 0 CVE** — verts légitimes sur un graphe de 11 fichiers et des deps Angular 22 à jour. Aucun constat à fabriquer.
- **Pas de `subscribe` sans cleanup non géré** — les deux `subscribe` réels (task.service.ts:48, task-list.component.ts:67) : le second est tenu par un `Subscription`/`ngOnDestroy` (legacy mais correct) ; le premier (`fetchTasks().subscribe` dans le service) complète après une émission unique (`of().pipe(delay)`) — pas de fuite. `main.ts:9` est un `.catch` de bootstrap, pas un subscribe. Aucune fuite RxJS à remonter (dim 6).

### Questions ouvertes pour l'équipe

- **F002 — intentionnel ou dérive ?** `TaskService` était-il censé être le gateway que l'effect appelle (et le câblage a été oublié), ou bien un vestige d'une étape antérieure du « before » remplacée par le store NgRx ? La réponse décide entre « recâbler » et « supprimer » — c'est un arbitrage d'architecture.
- **Le double filtre est-il un point pédagogique voulu** (montrer la même logique métier dupliquée service vs sélecteur, pour motiver la consolidation vidéo 3) ou une duplication accidentelle ? Si voulu, le tracer ; sinon, F002 prime.
- **Stratégie de tests pendant la migration** : écrit-on des specs sur le code « before » (qui sera réécrit) ou attend-on l'état « after » ? Impacte la priorité de F010.
