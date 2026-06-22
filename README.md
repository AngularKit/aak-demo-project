# TaskFlow — repo-démo « before » (AAK)

Petit codebase Angular **volontairement legacy** (style v15), support des 3 sessions filmées AAK.
Le même repo se modernise vidéo après vidéo — une seule histoire, plus forte que 3 repos séparés.

> ⚠️ Ce n'est **pas** une vraie app. Le scope est un plafond, pas un plancher.
> Tooling moderne (Angular CLI 22), patterns legacy **écrits à la main**.
> Aucun backend : données mockées en mémoire via `of(MOCK_TASKS).pipe(delay(300))`.

## Démarrer

```bash
npm install        # déjà fait si tu clones le repo packagé
npm start          # ng serve  → http://localhost:4200
npm run build      # build de prod
```

Stack : Angular 22 (CLI moderne) câblé en **NgModule + zone.js** à la main, NgRx classique
(`@ngrx/store` + `@ngrx/effects`), RxJS partout. Rien de tout ça n'est « la bonne façon » en
v20+ — c'est exactement le propos.

## Domaine

« TaskFlow » : une liste de tâches, un filtre par statut, un panneau détail. Assez pour les 3 démos, rien de plus.

## Arborescence

```
src/app/
  app.module.ts                     # bootstrap NgModule (legacy)
  app.component.ts / .html          # container câblé au store NgRx
  tasks/
    task.model.ts                   # interface Task + MOCK_TASKS
    task.service.ts                 # ⟵ VIDÉO 2 (RxJS → signals)
    task-list/
      task-list.component.ts        # ⟵ VIDÉO 1 (audit)
      task-list.component.html
    task-detail/
      task-detail.component.ts
      task-detail.component.html
    store/                          # ⟵ VIDÉO 3 (NgRx → Signal Store)
      task.actions.ts
      task.reducer.ts
      task.selectors.ts
      task.effects.ts
```

## L'arc raconté

| Vidéo | Sujet | Cible de refactor | After visé |
|---|---|---|---|
| 1 | Audit composant legacy | `task-list.component.ts` | standalone, OnPush/zoneless, `inject()`, `@if`/`@for` + `track`, `input()`/`output()`, `takeUntilDestroyed`, `viewChild()`, `computed()`, fichier `task-list.ts` |
| 2 | RxJS → signals | `task.service.ts` | état en `signal()`, dérivé en `computed()`, chargement via `resource()`/`toSignal()`, plus aucun `subscribe` côté conso |
| 3 | NgRx → Signal Store | `store/` (4 fichiers) | un seul `signalStore({ providedIn: 'root' })` avec `withState`/`withComputed`/`withMethods` + `rxMethod`/`resource` |
| Bonus | Setup Claude Code + « ne pas se faire avoir par du code halluciné » | même repo | — |

## Les « smells » plantés exprès

### VIDÉO 1 — `task-list/task-list.component.ts`
- `@Component` non standalone (`standalone: false`, déclaré dans `app.module.ts`)
- Change detection **par défaut** (pas d'`OnPush`)
- **Injection par constructeur** (`constructor(private taskService: TaskService)`)
- Template en `*ngIf` / `*ngFor` **sans `track`**
- `@Input() set tasks(...)` avec logique dans le setter + `@Output() select = new EventEmitter()`
- **Subscribe manuel** dans `ngOnInit` + `Subscription` + `ngOnDestroy` → `unsubscribe()`
- `@ViewChild('search', { static: false })`
- `get filteredTasks()` recalculé à chaque cycle de CD (devrait être un `computed`)
- Suffixe `.component` redondant dans le nom de fichier

### VIDÉO 2 — `task.service.ts`
- État interne en `BehaviorSubject<Task[]>` exposé via `asObservable()`
- Fetch mocké renvoyant `Observable<Task[]>` (`of(MOCK_TASKS).pipe(delay(300))`)
- Dérivé via `combineLatest([tasks$, filter$]).pipe(map(...))`
- Les consommateurs `subscribe()` à la main

### VIDÉO 3 — `store/`
- `createAction` / `createReducer` / `createSelector` / `@Injectable()` Effects + `createEffect` + `ofType`
- `app.component.ts` qui `store.select(selectFilteredTasks)` et `store.dispatch(loadTasks())`

> Note assumée : le repo porte **deux sources d'état en parallèle** (le store NgRx + le `TaskService`
> RxJS). C'est volontaire — cette redondance est elle-même un smell legacy à réconcilier, et donne
> de la matière à l'audit du bonus.

## Tags

- `v0-legacy` — le « before » (ce repo). À filer aux apprenants comme support d'entraînement :
  ils refont les 3 migrations eux-mêmes.
- `v1-modern` — le « after », produit au fil des vidéos (pas inclus dans ce tag de départ).
