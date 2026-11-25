import { DATA, cats, chains, districts } from "../data";

export type ChainId = keyof typeof chains;
export type GameEvent = "change" | "spawn" | "merge" | "move" | "swap" | "deliver" | "restore" | "chest" | "district" | "achievement" | "level" | "error";

export interface BoardItem {
  id: number;
  chain: ChainId;
  tier: number;
}

export interface Order {
  id: number;
  cat: string;
  chain: ChainId;
  tier: number;
  title: string;
  stars: number;
  coins: number;
  xp: number;
}

export interface GameProfile {
  schema: number;
  createdAt: number;
  lastSaved: number;
  rngState: number;
  nextItemId: number;
  nextOrderId: number;
  energy: number;
  energyAt: number;
  stars: number;
  coins: number;
  keys: number;
  xp: number;
  level: number;
  currentDistrict: number;
  unlockedDistricts: number;
  districtProgress: number[];
  completedDistricts: number[];
  endlessDistrict: number;
  board: Array<BoardItem | null>;
  inventory: BoardItem[];
  inventoryCap: number;
  orders: Order[];
  ordersCompleted: number;
  chest: { progress: number; readyAt: number | null };
  cats: string[];
  discovered: Record<string, number[]>;
  boosters: Record<"hammer" | "rainbow" | "shuffle", number>;
  tutorial: number;
  storySeen: string[];
  achievements: string[];
  daily: { lastClaim: string; streak: number };
  settings: { sound: boolean; music: boolean; volume: number; reducedMotion: boolean };
  stats: {
    merges: number;
    merges5: number;
    orders: number;
    cats: number;
    districts: number;
    bestTier: number;
    dreams: number;
    rushBest: number;
    nightBest: number;
    festivals: number;
    itemsCreated: number;
    playSeconds: number;
  };
  modeProgress: {
    dreamLevel: number;
    festivalStage: number;
    nightUnlocked: boolean;
  };
}

interface ActionResult {
  ok: boolean;
  reason?: string;
  [key: string]: unknown;
}

const STORAGE_KEY = "kotogorod.profile.v3";
const BACKUP_KEY = "kotogorod.profile.backup";
const REGEN_MS = 90_000;
const CHEST_DELAY = 10 * 60_000;

function makeProfile(): GameProfile {
  const board: Array<BoardItem | null> = Array(DATA.boardSize).fill(null);
  board[17] = { id: 1, chain: "cozy", tier: 1 };
  board[18] = { id: 2, chain: "cozy", tier: 1 };
  board[19] = { id: 3, chain: "cozy", tier: 1 };
  return {
    schema: DATA.saveVersion,
    createdAt: Date.now(),
    lastSaved: Date.now(),
    rngState: (Date.now() ^ 0x9e3779b9) >>> 0,
    nextItemId: 4,
    nextOrderId: 4,
    energy: 80,
    energyAt: Date.now(),
    stars: 0,
    coins: 35,
    keys: 0,
    xp: 0,
    level: 1,
    currentDistrict: 0,
    unlockedDistricts: 1,
    districtProgress: Array(districts.length).fill(0),
    completedDistricts: [],
    endlessDistrict: 0,
    board,
    inventory: [],
    inventoryCap: 6,
    orders: [
      { id: 1, cat: "motya", chain: "cozy", tier: 2, title: "Игрушка против одиночества", stars: 5, coins: 4, xp: 15 },
      { id: 2, cat: "avgust", chain: "cozy", tier: 2, title: "Маленький подарок городу", stars: 3, coins: 2, xp: 12 },
      { id: 3, cat: "motya", chain: "food", tier: 2, title: "Первый ужин", stars: 3, coins: 2, xp: 12 }
    ],
    ordersCompleted: 0,
    chest: { progress: 0, readyAt: null },
    cats: ["avgust"],
    discovered: { cozy: [1], food: [1] },
    boosters: { hammer: 2, rainbow: 1, shuffle: 2 },
    tutorial: 0,
    storySeen: [],
    achievements: [],
    daily: { lastClaim: "", streak: 0 },
    settings: { sound: true, music: true, volume: 0.65, reducedMotion: false },
    stats: { merges: 0, merges5: 0, orders: 0, cats: 1, districts: 0, bestTier: 1, dreams: 0, rushBest: 0, nightBest: 0, festivals: 0, itemsCreated: 3, playSeconds: 0 },
    modeProgress: { dreamLevel: 0, festivalStage: 0, nightUnlocked: false }
  };
}

function loadProfile(): GameProfile | null {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameProfile>;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.board)) return null;
    const base = makeProfile();
    const profile: GameProfile = {
      ...base,
      ...parsed,
      schema: DATA.saveVersion,
      board: parsed.board.slice(0, DATA.boardSize),
      chest: { ...base.chest, ...parsed.chest },
      daily: { ...base.daily, ...parsed.daily },
      settings: { ...base.settings, ...parsed.settings },
      stats: { ...base.stats, ...parsed.stats },
      modeProgress: { ...base.modeProgress, ...parsed.modeProgress },
      boosters: { ...base.boosters, ...parsed.boosters },
      discovered: { ...base.discovered, ...parsed.discovered }
    };
    while (profile.board.length < DATA.boardSize) profile.board.push(null);
    while (profile.districtProgress.length < districts.length) profile.districtProgress.push(0);
    profile.board = profile.board.map((item) => item && chains[item.chain] ? { id: Number(item.id), chain: item.chain, tier: Math.max(1, Math.min(7, Number(item.tier))) } : null);
    profile.orders = Array.isArray(parsed.orders) ? parsed.orders.filter((order) => order && chains[order.chain]).slice(0, 3) : [];
    return profile;
  } catch {
    return null;
  }
}

export class GameState extends EventTarget {
  profile: GameProfile;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.profile = loadProfile() ?? makeProfile();
    this.syncEnergy();
    this.ensureOrders();
    this.checkAchievements();
  }

  private random(): number {
    this.profile.rngState = (Math.imul(this.profile.rngState, 1664525) + 1013904223) >>> 0;
    return this.profile.rngState / 4294967296;
  }

  private pick<T>(values: readonly T[]): T {
    return values[Math.floor(this.random() * values.length)];
  }

  on(event: GameEvent, callback: (detail: Record<string, unknown>) => void): () => void {
    const listener = (event: Event) => callback((event as CustomEvent).detail ?? {});
    this.addEventListener(event, listener);
    return () => this.removeEventListener(event, listener);
  }

  private emit(event: GameEvent, detail: Record<string, unknown> = {}): void {
    this.dispatchEvent(new CustomEvent(event, { detail }));
  }

  changed(): void {
    this.profile.lastSaved = Date.now();
    this.emit("change", { profile: this.profile });
    this.scheduleSave();
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), 120);
  }

  save(): boolean {
    try {
      if (!globalThis.localStorage) return false;
      const previous = globalThis.localStorage.getItem(STORAGE_KEY);
      if (previous) globalThis.localStorage.setItem(BACKUP_KEY, previous);
      globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      return true;
    } catch {
      return false;
    }
  }

  exportSave(): string {
    return JSON.stringify(this.profile, null, 2);
  }

  importSave(raw: string): boolean {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.board) || typeof parsed.level !== "number") return false;
      globalThis.localStorage?.setItem(STORAGE_KEY, raw);
      const loaded = loadProfile();
      if (!loaded) return false;
      this.profile = loaded;
      this.ensureOrders();
      this.changed();
      this.emit("district", { index: this.profile.currentDistrict });
      return true;
    } catch {
      return false;
    }
  }

  reset(): void {
    this.profile = makeProfile();
    this.changed();
    this.emit("district", { index: 0, reset: true });
    this.save();
  }

  get energyCap(): number {
    return 80 + Math.min(40, (this.profile.level - 1) * 2);
  }

  get currentDistrict() {
    return districts[Math.min(this.profile.currentDistrict, districts.length - 1)];
  }

  get currentTask() {
    const progress = this.profile.districtProgress[this.profile.currentDistrict] ?? 0;
    return this.currentDistrict.tasks[progress] ?? null;
  }

  get availableChains(): ChainId[] {
    const result = new Set<ChainId>();
    districts.slice(0, this.profile.unlockedDistricts).forEach((district) => district.chains.forEach((chain) => result.add(chain as ChainId)));
    return [...result];
  }

  syncEnergy(now = Date.now()): void {
    const p = this.profile;
    if (p.energy >= this.energyCap) {
      p.energy = this.energyCap;
      p.energyAt = now;
      return;
    }
    const elapsed = Math.max(0, now - p.energyAt);
    const gained = Math.floor(elapsed / REGEN_MS);
    if (gained > 0) {
      p.energy = Math.min(this.energyCap, p.energy + gained);
      p.energyAt += gained * REGEN_MS;
      if (p.energy >= this.energyCap) p.energyAt = now;
    }
  }

  energyCountdown(now = Date.now()): number {
    if (this.profile.energy >= this.energyCap) return 0;
    return Math.max(0, REGEN_MS - (now - this.profile.energyAt));
  }

  private newItem(chain: ChainId, tier = 1): BoardItem {
    return { id: this.profile.nextItemId++, chain, tier };
  }

  private discover(item: BoardItem): void {
    const list = this.profile.discovered[item.chain] ??= [];
    if (!list.includes(item.tier)) list.push(item.tier);
    this.profile.stats.bestTier = Math.max(this.profile.stats.bestTier, item.tier);
  }

  spawn(chain: ChainId, free = false, preferredIndex?: number): ActionResult {
    this.syncEnergy();
    if (!this.availableChains.includes(chain)) return this.fail("Эта цепочка ещё не открыта");
    if (!free && this.profile.energy < 1) return this.fail("Энергия восстановится совсем скоро");
    const empty = this.emptyCells(preferredIndex);
    if (!empty.length) return this.fail("Доска заполнена. Слейте предметы или уберите что-нибудь в сумку");
    if (!free) this.profile.energy--;
    const index = this.pick(empty);
    const item = this.newItem(chain);
    this.profile.board[index] = item;
    this.profile.stats.itemsCreated++;
    this.discover(item);
    this.emit("spawn", { index, item });
    this.changed();
    return { ok: true, index, item };
  }

  private emptyCells(preferred?: number): number[] {
    const empty: number[] = [];
    this.profile.board.forEach((item, index) => { if (!item) empty.push(index); });
    if (preferred !== undefined) {
      empty.sort((a, b) => this.distance(a, preferred) - this.distance(b, preferred));
    } else {
      for (let i = empty.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [empty[i], empty[j]] = [empty[j], empty[i]];
      }
    }
    return empty;
  }

  private distance(a: number, b: number): number {
    const ax = a % DATA.columns, ay = Math.floor(a / DATA.columns);
    const bx = b % DATA.columns, by = Math.floor(b / DATA.columns);
    return Math.abs(ax - bx) + Math.abs(ay - by);
  }

  moveItem(from: number, to: number): ActionResult {
    const board = this.profile.board;
    const source = board[from];
    if (!source || from === to || from < 0 || to < 0 || from >= board.length || to >= board.length) return { ok: false };
    const target = board[to];
    if (!target) {
      board[to] = source;
      board[from] = null;
      this.emit("move", { from, to, item: source });
      this.changed();
      return { ok: true, type: "move" };
    }
    if (source.chain !== target.chain || source.tier !== target.tier) {
      board[from] = target;
      board[to] = source;
      this.emit("swap", { from, to, source, target });
      this.changed();
      return { ok: true, type: "swap" };
    }

    const candidates = board
      .map((item, index) => ({ item, index }))
      .filter(({ item, index }) => index !== from && index !== to && item?.chain === source.chain && item.tier === source.tier)
      .sort((a, b) => this.distance(a.index, to) - this.distance(b.index, to));
    if (!candidates.length) {
      board[from] = target;
      board[to] = source;
      this.emit("swap", { from, to, source, target });
      this.changed();
      return { ok: true, type: "swap" };
    }

    const count = candidates.length >= 3 ? 5 : 3;
    const sources = [from, to, ...candidates.slice(0, count - 2).map(({ index }) => index)];
    sources.forEach((index) => { board[index] = null; });
    const bonus = count === 5;

    if (source.tier >= 7) {
      const stars = 30 + this.profile.currentDistrict * 5;
      const coins = bonus ? 100 : 55;
      this.profile.stars += stars;
      this.profile.coins += coins;
      this.profile.stats.merges++;
      if (bonus) this.profile.stats.merges5++;
      this.addXp(50);
      this.emit("merge", { sources, to, recycled: true, bonus, stars, coins, source });
      this.afterProgress();
      return { ok: true, type: "recycle" };
    }

    const item = this.newItem(source.chain, source.tier + 1);
    board[to] = item;
    const outputs = [to];
    if (bonus) {
      const empty = this.emptyCells(to)[0];
      if (empty !== undefined) {
        board[empty] = this.newItem(source.chain, source.tier + 1);
        outputs.push(empty);
      }
      this.profile.stats.merges5++;
    }
    this.profile.stats.merges++;
    this.profile.tutorial = Math.max(this.profile.tutorial, 1);
    this.discover(item);
    this.addXp(item.tier * 3 + (bonus ? 8 : 0));
    this.emit("merge", { sources, to, outputs, item, bonus, source });
    this.afterProgress();
    return { ok: true, type: "merge", item, bonus, outputs };
  }

  private ensureOrders(): void {
    while (this.profile.orders.length < 3) this.profile.orders.push(this.generateOrder());
  }

  private generateOrder(): Order {
    const available = this.availableChains;
    const chain = this.pick<ChainId>(available.length ? available : ["cozy"]);
    const maxTier = Math.min(5, 2 + Math.floor((this.profile.ordersCompleted + 4) / 8));
    const roll = this.random();
    const tier = Math.max(2, Math.min(maxTier, 2 + Math.floor(roll * maxTier)));
    const district = this.currentDistrict;
    const residentPool = [district.resident, ...this.profile.cats];
    const cat = this.pick(residentPool);
    const titles = DATA.orderNames[chain];
    return {
      id: this.profile.nextOrderId++,
      cat,
      chain,
      tier,
      title: this.pick(titles),
      stars: Math.max(2, Math.round(Math.pow(3, tier - 1) * 0.48 * (1 + this.profile.currentDistrict * 0.16))),
      coins: tier + Math.floor(this.profile.currentDistrict / 2),
      xp: tier * 7
    };
  }

  hasRequirement(order: Order): boolean {
    return this.profile.board.some((item) => item?.chain === order.chain && item.tier === order.tier);
  }

  deliver(orderId: number): ActionResult {
    const index = this.profile.orders.findIndex((order) => order.id === orderId);
    if (index < 0) return { ok: false };
    const order = this.profile.orders[index];
    const itemIndex = this.profile.board.findIndex((item) => item?.chain === order.chain && item.tier === order.tier);
    if (itemIndex < 0) return this.fail("Такого предмета пока нет на доске");
    const item = this.profile.board[itemIndex];
    this.profile.board[itemIndex] = null;
    this.profile.stars += order.stars;
    this.profile.coins += order.coins;
    this.profile.ordersCompleted++;
    this.profile.stats.orders++;
    this.profile.tutorial = Math.max(this.profile.tutorial, 2);
    this.addXp(order.xp);
    this.profile.orders[index] = this.generateOrder();

    const chest = this.profile.chest;
    if (chest.readyAt === null) {
      chest.progress = Math.min(3, chest.progress + 1);
      if (chest.progress >= 3) {
        chest.progress = 0;
        chest.readyAt = Date.now() + (this.profile.ordersCompleted <= 3 ? 0 : CHEST_DELAY);
      }
    }

    this.emit("deliver", { order, item, itemIndex });
    this.afterProgress();
    return { ok: true, order, item };
  }

  rerollOrder(orderId: number): ActionResult {
    const index = this.profile.orders.findIndex((order) => order.id === orderId);
    if (index < 0) return { ok: false };
    if (this.profile.coins < 3) return this.fail("Для смены заказа нужно 3 монеты");
    this.profile.coins -= 3;
    const old = this.profile.orders[index];
    let next = this.generateOrder();
    for (let tries = 0; tries < 4 && next.chain === old.chain && next.tier === old.tier; tries++) next = this.generateOrder();
    this.profile.orders[index] = next;
    this.changed();
    return { ok: true, order: next };
  }

  restore(): ActionResult {
    const task = this.currentTask;
    if (!task) return this.fail("Этот район уже сияет. Пора открыть следующий!");
    if (this.profile.stars < task.cost) return this.fail(`Нужно ещё ${task.cost - this.profile.stars} ★`);
    this.profile.stars -= task.cost;
    const districtIndex = this.profile.currentDistrict;
    const progress = this.profile.districtProgress[districtIndex] + 1;
    this.profile.districtProgress[districtIndex] = progress;
    this.profile.tutorial = Math.max(this.profile.tutorial, 3);
    this.addXp(25 + districtIndex * 4);
    if (progress === 2 || progress === 8) this.unlockCat(this.currentDistrict.resident);
    const completed = progress >= this.currentDistrict.tasks.length;
    if (completed && !this.profile.completedDistricts.includes(districtIndex)) {
      this.profile.completedDistricts.push(districtIndex);
      this.profile.stats.districts++;
      this.profile.keys++;
    }
    this.emit("restore", { task, districtIndex, progress, completed, district: this.currentDistrict });
    this.afterProgress();
    return { ok: true, task, completed };
  }

  unlockDistrict(index: number): ActionResult {
    if (index !== this.profile.unlockedDistricts || index >= districts.length) return this.fail("Сначала завершите предыдущий район");
    if (!this.profile.completedDistricts.includes(index - 1)) return this.fail("Предыдущий район ещё ждёт восстановления");
    const district = districts[index];
    if (this.profile.keys < district.keyCost) return this.fail("Нужен ключ от района");
    this.profile.keys -= district.keyCost;
    this.profile.unlockedDistricts++;
    this.profile.currentDistrict = index;
    district.chains.forEach((chain) => { this.profile.discovered[chain] ??= [1]; });
    this.emit("district", { index, district });
    this.afterProgress();
    return { ok: true, district };
  }

  travelTo(index: number): ActionResult {
    if (index < 0 || index >= this.profile.unlockedDistricts || index >= districts.length) return this.fail("Район ещё закрыт");
    this.profile.currentDistrict = index;
    this.emit("district", { index, district: districts[index] });
    this.changed();
    return { ok: true };
  }

  private unlockCat(id: string): void {
    if (!this.profile.cats.includes(id)) {
      this.profile.cats.push(id);
      this.profile.stats.cats = this.profile.cats.length;
      const cat = cats.find((entry) => entry.id === id);
      if (cat) this.emit("achievement", { cat, resident: true });
    }
  }

  openChest(): ActionResult {
    const chest = this.profile.chest;
    if (chest.readyAt === null) return this.fail("Сундук появится после трёх заказов");
    if (Date.now() < chest.readyAt) return this.fail("Сундук ещё закрыт");
    const empty = this.emptyCells();
    if (empty.length < 2) return this.fail("Освободите хотя бы две клетки для сюрпризов");
    const drops: Array<{ index: number; item: BoardItem }> = [];
    const chain = this.pick(this.availableChains);
    [1, 1, 2].forEach((tier, i) => {
      const index = empty[i];
      if (index === undefined) return;
      const item = this.newItem(chain, tier);
      this.profile.board[index] = item;
      this.discover(item);
      drops.push({ index, item });
    });
    this.profile.stars += 5 + this.profile.currentDistrict * 2;
    this.profile.coins += 10;
    chest.readyAt = null;
    chest.progress = 0;
    this.emit("chest", { drops, chain });
    this.afterProgress();
    return { ok: true, drops };
  }

  storeItem(index: number): ActionResult {
    const item = this.profile.board[index];
    if (!item) return { ok: false };
    if (this.profile.inventory.length >= this.profile.inventoryCap) return this.fail("Сумка заполнена");
    this.profile.board[index] = null;
    this.profile.inventory.push(item);
    this.changed();
    return { ok: true };
  }

  retrieveItem(inventoryIndex: number, boardIndex?: number): ActionResult {
    const item = this.profile.inventory[inventoryIndex];
    if (!item) return { ok: false };
    const empty = boardIndex !== undefined && !this.profile.board[boardIndex] ? boardIndex : this.emptyCells()[0];
    if (empty === undefined || this.profile.board[empty]) return this.fail("На доске нет свободной клетки");
    this.profile.board[empty] = item;
    this.profile.inventory.splice(inventoryIndex, 1);
    this.emit("spawn", { index: empty, item });
    this.changed();
    return { ok: true, index: empty };
  }

  sellItem(index: number): ActionResult {
    const item = this.profile.board[index];
    if (!item) return { ok: false };
    const value = Math.max(1, Math.round(Math.pow(2, item.tier - 1) / 2));
    this.profile.board[index] = null;
    this.profile.coins += value;
    this.changed();
    return { ok: true, value, item };
  }

  buyEnergy(): ActionResult {
    this.syncEnergy();
    if (this.profile.energy >= this.energyCap) return this.fail("Энергия уже полная");
    if (this.profile.coins < 20) return this.fail("Нужно 20 монет");
    this.profile.coins -= 20;
    this.profile.energy = Math.min(this.energyCap, this.profile.energy + 30);
    if (this.profile.energy >= this.energyCap) this.profile.energyAt = Date.now();
    this.changed();
    return { ok: true };
  }

  shuffleBoard(free = false): ActionResult {
    if (!free) {
      if (this.profile.boosters.shuffle < 1) return this.fail("Нет перетасовок");
      this.profile.boosters.shuffle--;
    }
    const items = this.profile.board.filter((item): item is BoardItem => Boolean(item));
    const positions = this.profile.board.map((_, index) => index);
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    this.profile.board.fill(null);
    items.forEach((item, i) => { this.profile.board[positions[i]] = item; });
    this.emit("swap", { shuffle: true });
    this.changed();
    return { ok: true };
  }

  claimDaily(): ActionResult {
    const today = new Date().toISOString().slice(0, 10);
    if (this.profile.daily.lastClaim === today) return this.fail("Сегодняшний подарок уже получен");
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    this.profile.daily.streak = this.profile.daily.lastClaim === yesterday ? this.profile.daily.streak + 1 : 1;
    this.profile.daily.lastClaim = today;
    const reward = DATA.daily[(this.profile.daily.streak - 1) % DATA.daily.length];
    if (reward.coins) this.profile.coins += reward.coins;
    if (reward.energy) this.profile.energy = Math.min(this.energyCap, this.profile.energy + reward.energy);
    if (reward.booster) this.profile.boosters[reward.booster as "hammer" | "rainbow"] += reward.amount ?? 1;
    this.changed();
    return { ok: true, reward };
  }

  private addXp(amount: number): void {
    this.profile.xp += amount;
    let threshold = 80 + (this.profile.level - 1) * 45;
    while (this.profile.xp >= threshold) {
      this.profile.xp -= threshold;
      this.profile.level++;
      this.profile.coins += 10 + this.profile.level * 2;
      this.profile.energy = Math.min(this.energyCap, this.profile.energy + 15);
      this.emit("level", { level: this.profile.level });
      threshold = 80 + (this.profile.level - 1) * 45;
    }
  }

  private afterProgress(): void {
    this.checkAchievements();
    this.changed();
  }

  private checkAchievements(): void {
    DATA.achievements.forEach((achievement) => {
      const id = String(achievement.id);
      if (this.profile.achievements.includes(id)) return;
      const value = achievement.stat === "level" ? this.profile.level : Number(this.profile.stats[achievement.stat as keyof GameProfile["stats"]]);
      if (value >= Number(achievement.target)) {
        this.profile.achievements.push(id);
        this.profile.coins += Number(achievement.coins);
        this.emit("achievement", { achievement });
      }
    });
  }

  markStorySeen(id: string): void {
    if (!this.profile.storySeen.includes(id)) {
      this.profile.storySeen.push(id);
      this.changed();
    }
  }

  setSetting<K extends keyof GameProfile["settings"]>(key: K, value: GameProfile["settings"][K]): void {
    this.profile.settings[key] = value;
    this.changed();
  }

  private fail(reason: string): ActionResult {
    this.emit("error", { reason });
    return { ok: false, reason };
  }
}
