import { _decorator, Button, Color, Component, Graphics, Label, Node, Sprite, tween, UIOpacity, UITransform, Vec3 } from "cc";
import { cats, DATA, districts, districtFor } from "./data";
import { GameState, type ModeId, type ModeSession, type Order } from "./core/state";
import { TextureLibrary } from "./TextureLibrary";
import { BoardController } from "./BoardController";
import { C, makeButton, makeLabel, makeNode, makeRect, makeSprite, setButtonEnabled } from "./CocosUI";
const { ccclass } = _decorator;

@ccclass("UIController")
export class UIController extends Component {
  private state!: GameState;
  private textures!: TextureLibrary;
  private board!: BoardController;
  private energyLabel!: Label;
  private starsLabel!: Label;
  private coinsLabel!: Label;
  private keysLabel!: Label;
  private chapterLabel!: Label;
  private districtLabel!: Label;
  private storyLabel!: Label;
  private progressLabel!: Label;
  private restoreButton!: Button;
  private restoreLabel!: Label;
  private ordersRoot!: Node;
  private generatorsRoot!: Node;
  private coachLabel!: Label;
  private modal: Node | null = null;
  private toastRoot!: Node;
  onModalChange: ((open: boolean) => void) | null = null;

  init(state: GameState, textures: TextureLibrary, board: BoardController): void {
    this.state = state;
    this.textures = textures;
    this.board = board;
    this.buildTopbar();
    this.buildDistrict();
    this.ordersRoot = makeNode("Orders", this.node);
    this.generatorsRoot = makeNode("Generators", this.node);
    this.buildNavigation();
    this.buildCoach();
    this.toastRoot = makeNode("Toasts", this.node, 0, 505);
    this.state.on("change", () => this.refresh());
    this.state.on("error", ({ reason }) => this.toast(String(reason)));
    this.state.on("restore", (detail) => this.showRestorationStory(detail));
    this.state.on("achievement", (detail) => {
      if (detail.resident) this.toast(`Новый житель: ${(detail.cat as { name: string }).name}`);
      else if (detail.achievement) this.toast(`Достижение: ${(detail.achievement as { name: string }).name}`);
    });
    this.state.on("level", ({ level }) => this.toast(`Уровень ${level}! Энергия и монеты получены`));
    this.state.on("mode", (detail) => {
      if (detail.active === false && typeof detail.completed === "boolean") this.showModeResult(detail.id as ModeId, detail.completed, Number(detail.score ?? 0));
    });
    this.refresh();
  }

  private buildTopbar(): void {
    makeRect(this.node, "Top shade", 0, 605, 720, 150, new Color(10, 18, 30, 150), 0);
    makeLabel(this.node, "КОТОГОРОД", -320, 602, 27, C.amber, 250);
    this.energyLabel = makeLabel(this.node, "", -62, 603, 23, C.cream, 100);
    this.starsLabel = makeLabel(this.node, "", 63, 603, 23, C.amber, 100);
    this.coinsLabel = makeLabel(this.node, "", 180, 603, 23, C.amber, 100);
    this.keysLabel = makeLabel(this.node, "", 285, 603, 23, C.mint, 80);
    makeSprite(this.node, this.textures.get("ui-1"), -95, 603, 31, 31, "Energy icon");
    makeSprite(this.node, this.textures.get("ui-2"), 30, 603, 31, 31, "Star icon");
    makeSprite(this.node, this.textures.get("ui-3"), 147, 603, 31, 31, "Coin icon");
    makeSprite(this.node, this.textures.get("ui-4"), 250, 603, 31, 31, "Key icon");
    const settings = makeButton(this.node, "Settings", "", 323, 554, 50, 48, new Color(46, 60, 78, 230), () => this.openSettings(), 25);
    makeSprite(settings.node, this.textures.get("ui2-2"), 0, 0, 31, 31, "Settings icon");
  }

  private buildDistrict(): void {
    this.chapterLabel = makeLabel(this.node, "", -315, 510, 14, C.amber, 330);
    this.districtLabel = makeLabel(this.node, "", -315, 479, 27, C.cream, 350);
    this.storyLabel = makeLabel(this.node, "", -315, 439, 15, C.muted, 350);
    this.storyLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
    this.storyLabel.enableWrapText = true;
    this.storyLabel.node.getComponent(UITransform)!.height = 54;
    this.progressLabel = makeLabel(this.node, "", -315, 390, 17, C.cream, 170);
    this.restoreLabel = makeLabel(this.node, "", -315, 348, 17, C.cream, 255);
    const result = makeButton(this.node, "Restore", "", -175, 287, 290, 56, C.amber, () => this.state.restore(), 21);
    this.restoreButton = result.button;
    this.restoreLabel = result.label;
  }

  private buildNavigation(): void {
    const entries: Array<[string, string, () => void]> = [
      ["⌂", "Город", () => this.openMap()],
      ["♡", "Заказы", () => this.openOrders()],
      ["✦", "Режимы", () => this.openModes()],
      ["♧", "Жители", () => this.openCats()],
      ["•••", "Ещё", () => this.openMore()]
    ];
    makeRect(this.node, "Bottom navigation", 0, -610, 720, 60, new Color(13, 23, 38, 250), 0);
    entries.forEach(([icon, text, action], index) => {
      const x = -280 + index * 140;
      const generatedIcon = icon === "⌂" ? "ui-6" : icon === "✦" ? "ui-7" : icon === "♧" ? "ui-8" : icon === "♡" ? "ui2-1" : icon === "•••" ? "ui2-3" : null;
      if (generatedIcon) makeSprite(this.node, this.textures.get(generatedIcon), x, -590, 30, 30, "Navigation icon");
      else makeLabel(this.node, icon, x, -590, 25, C.amber, 100, Label.HorizontalAlign.CENTER);
      const button = makeButton(this.node, text, text, x, -623, 125, 28, new Color(0, 0, 0, 0), action, 14);
      button.label.color = C.muted;
    });
  }

  private buildCoach(): void {
    makeRect(this.node, "Coach", 148, 459, 355, 104, new Color(25, 37, 53, 235), 20);
    makeSprite(this.node, this.textures.cat("avgust"), 30, 453, 82, 95, "Mayor");
    this.coachLabel = makeLabel(this.node, "", 88, 464, 16, C.cream, 260);
    this.coachLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
    this.coachLabel.enableWrapText = true;
    this.coachLabel.node.getComponent(UITransform)!.height = 85;
  }

  private refresh(): void {
    const p = this.state.profile;
    this.state.syncEnergy();
    this.energyLabel.string = `${p.energy}/${this.state.energyCap}`;
    this.starsLabel.string = compactNumber(p.stars);
    this.coinsLabel.string = compactNumber(p.coins);
    this.keysLabel.string = compactNumber(p.keys);
    const district = this.state.currentDistrict;
    const mode = this.state.mode;
    const task = this.state.currentTask;
    this.restoreButton.node.off(Button.EventType.CLICK);
    if (mode) {
      this.chapterLabel.string = "Особый режим · сюжетная доска сохранена";
      this.districtLabel.string = DATA.modes.find((entry) => entry.id === mode.id)?.name ?? "Испытание";
      this.storyLabel.string = modeObjective(mode.id);
      this.progressLabel.string = modeProgressText(mode);
      this.restoreButton.node.getComponentInChildren(Label)!.string = "Вернуться в город";
      this.restoreButton.node.on(Button.EventType.CLICK, () => this.state.exitMode());
      setButtonEnabled(this.restoreButton, true);
    } else {
      this.chapterLabel.string = district.chapter;
      this.districtLabel.string = district.name;
      this.storyLabel.string = district.story;
      const progress = p.districtProgress[p.currentDistrict] ?? 0;
      this.progressLabel.string = `Восстановлено: ${progress} / ${district.tasks.length}`;
      this.restoreLabel.string = task ? task.name : "Район сияет!";
      this.restoreButton.node.getComponentInChildren(Label)!.string = task ? `${task.name} · ${task.cost} ★` : "Открыть карту района";
      this.restoreButton.node.on(Button.EventType.CLICK, () => task ? this.state.restore() : this.openMap());
      setButtonEnabled(this.restoreButton, task ? p.stars >= task.cost : true);
    }
    this.refreshOrders();
    this.refreshGenerators();
    const tips = [
      "Перетащи клубок на клубок. Три одинаковых создадут игрушку для Моти!",
      "Мышка готова! Нажми «Отдать» в просьбе Моти под городом.",
      "Звёзды превращаются в тёплый дом. Нажми на первую задачу реставрации!",
      "Соединяй пять предметов для двойного результата. Новые просьбы уже ждут!"
    ];
    this.coachLabel.string = mode ? modeCoachText(mode.id) : tips[Math.min(p.tutorial, 3)];
  }

  private refreshOrders(): void {
    this.ordersRoot.destroyAllChildren();
    if (!this.state.activeOrders.length) return;
    this.state.activeOrders.forEach((order, index) => {
      const x = (index - (this.state.activeOrders.length - 1) / 2) * 230;
      const ready = this.state.hasRequirement(order);
      makeRect(this.ordersRoot, "Order", x, 205, 216, 94, ready ? new Color(47, 83, 70, 245) : new Color(30, 43, 61, 245), 18);
      makeSprite(this.ordersRoot, this.textures.cat(order.cat), x - 75, 204, 57, 67, "Cat");
      makeSprite(this.ordersRoot, this.textures.item(order.chain, order.tier), x - 20, 208, 54, 54, "Required item");
      makeLabel(this.ordersRoot, cats.find((cat) => cat.id === order.cat)?.name ?? "", x - 51, 242, 12, C.muted, 105);
      makeLabel(this.ordersRoot, `+${order.stars} ★`, x + 43, 235, 15, C.amber, 75, Label.HorizontalAlign.CENTER);
      const result = makeButton(this.ordersRoot, "Deliver", "Отдать", x + 57, 191, 77, 43, ready ? C.mint : new Color(69, 80, 96, 255), () => this.state.deliver(order.id), 15);
      setButtonEnabled(result.button, ready, new Color(69, 80, 96, 230));
    });
  }

  private refreshGenerators(): void {
    this.generatorsRoot.destroyAllChildren();
    const available = this.state.playableChains;
    const spacing = Math.min(105, 650 / available.length);
    available.forEach((chain, index) => {
      const x = (index - (available.length - 1) / 2) * spacing;
      const result = makeButton(this.generatorsRoot, `Generate ${chain}`, "", x, -535, 91, 50, new Color(49, 57, 74, 245), () => this.state.spawn(chain), 13);
      makeSprite(result.node, this.textures.item(chain, 1), 0, 6, 32, 32, "Generator item");
      makeLabel(result.node, `${chainsName(chain)} · 1ϟ`, 0, -17, 10, C.cream, 86, Label.HorizontalAlign.CENTER);
      result.button.interactable = this.state.profile.energy > 0;
    });
  }

  tick(): void {
    if (!this.energyLabel) return;
    this.state.tickMode();
    if (this.state.mode?.endsAt) this.progressLabel.string = modeProgressText(this.state.mode);
    const seconds = Math.ceil(this.state.energyCountdown() / 1000);
    this.energyLabel.string = this.state.profile.energy >= this.state.energyCap ? `${this.state.profile.energy}/${this.state.energyCap}` : `${this.state.profile.energy}/${this.state.energyCap} · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }

  private openOrders(): void {
    if (!this.state.activeOrders.length) {
      this.toast(this.state.mode ? modeObjective(this.state.mode.id) : "Новые просьбы появятся совсем скоро");
      return;
    }
    this.openModal("Просьбы жителей", this.state.mode ? "Заказы текущего испытания" : "Каждая выполненная просьба приближает сундук", (content) => {
      this.state.activeOrders.forEach((order, index) => {
        const y = 300 - index * 175;
        makeRect(content, "Large order", 0, y, 570, 150, new Color(46, 62, 80, 255), 20);
        makeSprite(content, this.textures.cat(order.cat), -220, y, 105, 122, "Cat");
        makeLabel(content, cats.find((cat) => cat.id === order.cat)?.name ?? "", -145, y + 45, 20, C.amber, 250);
        makeLabel(content, order.title, -145, y + 12, 17, C.cream, 250);
        makeSprite(content, this.textures.item(order.chain, order.tier), -85, y - 43, 60, 60, "Item");
        makeLabel(content, `${DATA.chains[order.chain].items[order.tier - 1]} · ${order.stars} ★`, -40, y - 43, 15, C.muted, 230);
        const deliver = makeButton(content, "Deliver", "Отдать", 190, y + 20, 120, 52, C.mint, () => { if (this.state.deliver(order.id).ok) this.closeModal(); }, 18);
        setButtonEnabled(deliver.button, this.state.hasRequirement(order));
        makeButton(content, "Reroll", "Другой · 3 ●", 190, y - 43, 120, 40, new Color(82, 91, 109, 255), () => { this.state.rerollOrder(order.id); this.closeModal(); this.openOrders(); }, 14);
      });
      if (!this.state.mode) makeButton(content, "Chest", this.chestText(), 0, -260, 400, 65, C.amber, () => { const result = this.state.openChest(); if (result.ok) { this.closeModal(); this.toast("Сундук открыт: предметы и награды уже у вас"); } }, 18);
    });
  }

  private chestText(): string {
    const chest = this.state.profile.chest;
    if (chest.readyAt === null) return `Сундук · ещё ${3 - chest.progress} заказа`;
    const remaining = Math.max(0, chest.readyAt - Date.now());
    return remaining <= 0 ? "Открыть сундук сюрпризов" : `Сундук откроется через ${Math.ceil(remaining / 60000)} мин`;
  }

  private openMap(): void {
    this.openModal("Карта Котогорода", "12 глав основной истории · за ними — бесконечные ночные истории", (content) => {
      districts.forEach((district, index) => {
        const col = index % 2, row = Math.floor(index / 2);
        const x = col ? 150 : -150, y = 345 - row * 125;
        const unlocked = index < this.state.profile.unlockedDistricts;
        const completed = this.state.profile.completedDistricts.includes(index);
        makeRect(content, district.name, x, y, 280, 108, unlocked ? new Color(51, 68, 86, 255) : new Color(34, 43, 57, 230), 16);
        makeLabel(content, `${index + 1}. ${district.name}`, x - 125, y + 25, 17, unlocked ? C.amber : C.muted, 250);
        const status = completed ? "✓ Восстановлен" : unlocked ? `${this.state.profile.districtProgress[index]} / 8 задач` : "Закрыто";
        makeLabel(content, status, x - 125, y - 5, 14, completed ? C.mint : C.muted, 250);
        if (unlocked) makeButton(content, "Travel", index === this.state.profile.currentDistrict ? "Вы здесь" : "В район", x + 72, y - 31, 115, 35, C.amber, () => { this.state.travelTo(index); this.closeModal(); }, 14);
        else if (index === this.state.profile.unlockedDistricts && this.state.profile.completedDistricts.includes(index - 1)) makeButton(content, "Unlock", "◆ 1", x + 72, y - 31, 115, 35, C.amber, () => { if (this.state.unlockDistrict(index).ok) { this.closeModal(); this.showDistrictIntro(index); } }, 15);
      });
      if (this.state.profile.completedDistricts.includes(districts.length - 1)) {
        const latest = Math.max(districts.length, this.state.profile.unlockedDistricts - 1);
        const index = this.state.profile.completedDistricts.includes(latest) ? latest + 1 : latest;
        const district = districtFor(index);
        const unlocked = index < this.state.profile.unlockedDistricts;
        makeRect(content, district.name, 0, -425, 570, 82, new Color(61, 62, 91, 255), 16);
        makeLabel(content, `${index + 1}. ${district.name}`, -250, -407, 18, C.amber, 350);
        makeLabel(content, unlocked ? `${this.state.profile.districtProgress[index] ?? 0} / 8 задач · новая история` : "Новая ночная история", -250, -442, 14, C.muted, 350);
        if (unlocked) makeButton(content, "Travel endless", index === this.state.profile.currentDistrict ? "Вы здесь" : "В район", 190, -425, 125, 42, C.amber, () => { this.state.travelTo(index); this.closeModal(); }, 15);
        else makeButton(content, "Unlock endless", "◆ 1", 190, -425, 125, 42, C.amber, () => { if (this.state.unlockDistrict(index).ok) { this.closeModal(); this.showDistrictIntro(index); } }, 15);
      }
    });
  }

  private showDistrictIntro(index: number): void {
    const district = districtFor(index);
    this.showStory(`${district.id}-intro`, district.intro as Array<[string, string]>);
  }

  private showRestorationStory(detail: Record<string, unknown>): void {
    const task = detail.task as { id: string; cat: string; line: string };
    const completed = Boolean(detail.completed);
    const district = detail.district as typeof districts[number];
    const lines: Array<[string, string]> = [[task.cat, task.line]];
    if (completed) lines.push(...district.outro as Array<[string, string]>);
    this.showStory(task.id, lines);
  }

  private showStory(id: string, lines: Array<[string, string]>): void {
    if (this.state.profile.storySeen.includes(id) || !lines.length) return;
    let index = 0;
    this.openModal("История Котогорода", "", (content) => {
      const portrait = makeSprite(content, null, 0, 130, 245, 282, "Story cat");
      const speaker = makeLabel(content, "", 0, -55, 22, C.amber, 540, Label.HorizontalAlign.CENTER);
      const text = makeLabel(content, "", 0, -165, 20, C.cream, 520, Label.HorizontalAlign.CENTER);
      text.overflow = Label.Overflow.RESIZE_HEIGHT;
      text.enableWrapText = true;
      text.node.getComponent(UITransform)!.height = 150;
      const next = makeButton(content, "Next", "Дальше", 0, -340, 220, 58, C.amber, () => {}, 19);
      const renderLine = () => {
        const [catId, line] = lines[index];
        portrait.getComponent(Sprite)!.spriteFrame = this.textures.cat(catId);
        speaker.string = cats.find((cat) => cat.id === catId)?.name ?? "";
        text.string = line;
        next.label.string = index === lines.length - 1 ? "Вернуться в город" : "Дальше";
        portrait.setScale(0.85, 0.85, 1);
        tween(portrait).to(0.25, { scale: Vec3.ONE }, { easing: "backOut" }).start();
      };
      next.node.on(Button.EventType.CLICK, () => {
        index++;
        if (index >= lines.length) {
          this.state.markStorySeen(id);
          this.closeModal();
        } else renderLine();
      });
      renderLine();
    });
  }

  private openCats(): void {
    this.openModal("Жители Котогорода", `${this.state.profile.cats.length} из ${cats.length} открыто`, (content) => {
      cats.forEach((cat, index) => {
        const col = index % 3, row = Math.floor(index / 3);
        const x = -195 + col * 195, y = 340 - row * 130;
        const unlocked = this.state.profile.cats.includes(cat.id);
        makeRect(content, cat.name, x, y, 180, 118, new Color(45, 59, 78, 230), 16);
        const portrait = makeSprite(content, unlocked ? this.textures.cat(cat.id) : null, x - 43, y + 4, 75, 86, "Cat");
        if (!unlocked) makeLabel(content, "?", x - 43, y + 5, 43, C.muted, 70, Label.HorizontalAlign.CENTER);
        makeLabel(content, unlocked ? cat.name : "Неизвестно", x + 5, y + 26, 16, unlocked ? C.amber : C.muted, 105);
        makeLabel(content, unlocked ? cat.role : "Продолжайте историю", x + 5, y - 8, 12, C.muted, 105);
      });
    });
  }

  private openModes(): void {
    this.openModal("Режимы игры", "История и дополнительные испытания", (content) => {
      DATA.modes.forEach((mode, index) => {
        const y = 325 - index * 145;
        const unlocked = this.state.profile.unlockedDistricts > mode.unlock;
        makeRect(content, mode.name, 0, y, 570, 125, unlocked ? new Color(54, 69, 91, 255) : new Color(36, 45, 59, 230), 18);
        makeLabel(content, mode.name, -250, y + 26, 22, unlocked ? C.amber : C.muted, 350);
        makeLabel(content, mode.description, -250, y - 10, 15, C.muted, 370);
        makeLabel(content, unlocked ? "Доступно" : `Откройте район ${mode.unlock + 1}`, -250, y - 40, 13, unlocked ? C.mint : C.muted, 250);
        const button = makeButton(content, "Play", unlocked ? "Играть" : "Закрыто", 205, y, 115, 50, C.amber, () => {
          if (mode.id === "story") {
            if (this.state.mode) this.state.exitMode();
            this.closeModal();
            return;
          }
          if (this.state.startMode(mode.id as ModeId).ok) this.closeModal();
        }, 17);
        setButtonEnabled(button.button, unlocked);
      });
    });
  }

  private showModeResult(id: ModeId, completed: boolean, score: number): void {
    const name = DATA.modes.find((mode) => mode.id === id)?.name ?? "Испытание";
    const rewards: Record<ModeId, string> = {
      dreams: "Новый сон открыт. Монеты уже добавлены.",
      rush: `Лучший результат сохранён. Очки: ${score}.`,
      night: "Ночное дежурство завершено.",
      festival: "Маршрут пройден: +80 монет и радужный усилитель."
    };
    this.openModal(completed ? `${name}: цель достигнута` : `${name}: попробуйте ещё раз`, completed ? "Город гордится вами" : "Сюжетный прогресс не потерян", (content) => {
      makeLabel(content, completed ? rewards[id] : "Цель не выполнена. Меняйте стратегию и возвращайтесь.", 0, 100, 21, C.cream, 500, Label.HorizontalAlign.CENTER);
      makeButton(content, "Result close", "Вернуться в город", 0, -160, 320, 62, C.amber, () => this.closeModal(), 19);
    });
  }

  private openSettings(): void {
    this.openModal("Настройки", "Котогород сохраняется на этом устройстве", (content) => {
      const settings = this.state.profile.settings;
      [["Звуки", "sound"], ["Музыка", "music"], ["Меньше анимации", "reducedMotion"]].forEach(([name, key], index) => {
        const y = 260 - index * 85;
        makeLabel(content, name, -240, y, 21, C.cream, 300);
        const typedKey = key as "sound" | "music" | "reducedMotion";
        makeButton(content, key, settings[typedKey] ? "Включено" : "Выключено", 170, y, 190, 52, C.amber, ( ) => {
          this.state.setSetting(typedKey, !this.state.profile.settings[typedKey]);
          this.closeModal(); this.openSettings();
        }, 17);
      });
      makeLabel(content, "Громкость", -240, -5, 20, C.cream, 220);
      const volumeLabel = makeLabel(content, `${Math.round(settings.volume * 100)}%`, 0, -5, 20, C.amber, 100, Label.HorizontalAlign.CENTER);
      const changeVolume = (delta: number) => {
        const value = Math.round(Math.max(0, Math.min(1, this.state.profile.settings.volume + delta)) * 10) / 10;
        this.state.setSetting("volume", value);
        volumeLabel.string = `${Math.round(value * 100)}%`;
      };
      makeButton(content, "Volume down", "−", 115, -5, 60, 48, C.amber, () => changeVolume(-0.1), 22);
      makeButton(content, "Volume up", "+", 215, -5, 60, 48, C.amber, () => changeVolume(0.1), 22);
      makeButton(content, "Energy", "＋30 энергии · 20 монет", 0, -90, 400, 58, C.amber, () => this.state.buyEnergy(), 18);
      makeButton(content, "Daily", "Получить ежедневный подарок", 0, -175, 400, 58, C.amber, () => { const result = this.state.claimDaily(); if (result.ok) this.toast("Подарок получен. Возвращайтесь завтра!"); }, 18);
      makeButton(content, "Reset", "Начать историю заново", 0, -285, 330, 50, new Color(117, 66, 68, 255), () => this.confirmReset(), 17);
    });
  }

  private confirmReset(): void {
    this.openModal("Начать заново?", "Весь прогресс на этом устройстве будет удалён", (content) => {
      makeLabel(content, "Это действие нельзя отменить.", 0, 130, 22, C.rose, 500, Label.HorizontalAlign.CENTER);
      makeButton(content, "Cancel", "Остаться", -140, -100, 220, 60, C.mint, () => this.closeModal(), 18);
      makeButton(content, "Reset", "Удалить прогресс", 140, -100, 220, 60, new Color(172, 87, 83, 255), () => { this.state.reset(); this.closeModal(); }, 18);
    });
  }

  private openMore(): void {
    this.openModal("Смотрительская", "Ваши достижения и запасные вещи", (content) => {
      makeLabel(content, `Уровень ${this.state.profile.level} · ${this.state.profile.stats.merges} слияний · ${this.state.profile.stats.orders} заказов`, 0, 320, 20, C.amber, 570, Label.HorizontalAlign.CENTER);
      makeLabel(content, `Время в городе: ${Math.floor(this.state.profile.stats.playSeconds / 60)} мин · Открыто жителей: ${this.state.profile.cats.length}/${cats.length}`, 0, 270, 17, C.muted, 570, Label.HorizontalAlign.CENTER);
      makeButton(content, "Inventory", `Сумка и усилители · ${this.state.profile.inventory.length}/${this.state.profile.inventoryCap}`, 0, 150, 420, 62, C.amber, () => this.openInventory(), 19);
      makeButton(content, "Achievements", `Все достижения · ${this.state.profile.achievements.length}/${DATA.achievements.length}`, 0, 55, 420, 62, C.amber, () => this.openAchievements(), 19);
      makeButton(content, "Shuffle", `Перетасовать доску · ${this.state.profile.boosters.shuffle}`, 0, -70, 420, 58, C.amber, () => { if (this.state.shuffleBoard().ok) this.closeModal(); }, 18);
    });
  }

  private openInventory(): void {
    this.openModal("Сумка и усилители", "Выберите предмет на доске, затем примените действие", (content) => {
      const selected = this.board.selectedIndex;
      const item = selected >= 0 ? this.state.board[selected] : null;
      makeLabel(content, item ? `Выбрано: ${DATA.chains[item.chain].items[item.tier - 1]}` : "На доске ничего не выбрано", 0, 320, 20, item ? C.amber : C.muted, 540, Label.HorizontalAlign.CENTER);
      if (item) makeSprite(content, this.textures.item(item.chain, item.tier), 0, 220, 105, 105, "Selected item");
      const apply = (action: () => { ok: boolean }) => {
        const currentModal = this.modal;
        if (!action().ok) return;
        this.board.clearSelection();
        if (this.modal === currentModal) this.closeModal();
      };
      makeButton(content, "Hammer", `Молоток · ${this.state.profile.boosters.hammer}`, -170, 85, 250, 58, C.amber, () => apply(() => this.state.useHammer(selected)), 17);
      makeButton(content, "Rainbow", `Улучшить · ${this.state.profile.boosters.rainbow}`, 170, 85, 250, 58, C.amber, () => apply(() => this.state.useRainbow(selected)), 17);
      makeButton(content, "Store", "Положить в сумку", 0, 5, 330, 55, C.mint, () => apply(() => this.state.storeItem(selected)), 17);
      makeLabel(content, `В сумке ${this.state.profile.inventory.length}/${this.state.profile.inventoryCap}`, 0, -80, 19, C.cream, 400, Label.HorizontalAlign.CENTER);
      if (!this.state.profile.inventory.length) makeLabel(content, "Здесь появятся отложенные предметы", 0, -170, 17, C.muted, 500, Label.HorizontalAlign.CENTER);
      this.state.profile.inventory.forEach((stored, index) => {
        const x = -180 + index % 3 * 180, y = -155 - Math.floor(index / 3) * 145;
        makeSprite(content, this.textures.item(stored.chain, stored.tier), x, y + 22, 66, 66, "Stored item");
        makeLabel(content, DATA.chains[stored.chain].items[stored.tier - 1], x - 70, y - 22, 13, C.muted, 140, Label.HorizontalAlign.CENTER);
        makeButton(content, "Retrieve", "Вернуть", x, y - 55, 120, 35, C.amber, () => apply(() => this.state.retrieveItem(index)), 14);
      });
      makeButton(content, "Back", "Назад", 0, -430, 250, 50, C.mint, () => this.openMore(), 17);
    });
  }

  private openAchievements(): void {
    this.openModal("Достижения", `${this.state.profile.achievements.length} из ${DATA.achievements.length} получено`, (content) => {
      DATA.achievements.forEach((achievement, index) => {
        const x = index % 2 ? 145 : -145, y = 335 - Math.floor(index / 2) * 72;
        const done = this.state.profile.achievements.includes(String(achievement.id));
        const value = achievement.stat === "level" ? this.state.profile.level : Number(this.state.profile.stats[achievement.stat as keyof typeof this.state.profile.stats] ?? 0);
        makeRect(content, "Achievement", x, y, 275, 62, new Color(45, 59, 78, 230), 12);
        makeLabel(content, `${done ? "✓" : "○"} ${achievement.name}`, x - 125, y + 12, 14, done ? C.mint : C.cream, 250);
        makeLabel(content, `${Math.min(value, Number(achievement.target))} / ${achievement.target} · +${achievement.coins}`, x - 125, y - 16, 12, C.muted, 250);
      });
      makeButton(content, "Back", "Назад", 0, -430, 250, 50, C.mint, () => this.openMore(), 17);
    });
  }

  private openModal(title: string, subtitle: string, build: (content: Node) => void): void {
    this.closeModal();
    this.modal = makeNode("Modal", this.node, 0, 0, 720, 1280);
    makeRect(this.modal, "Modal backdrop", 0, 0, 720, 1280, new Color(5, 11, 21, 215), 0);
    makeRect(this.modal, "Modal panel", 0, 0, 650, 1040, new Color(27, 41, 59, 255), 30);
    makeLabel(this.modal, title, -280, 465, 28, C.cream, 520);
    if (subtitle) makeLabel(this.modal, subtitle, -280, 425, 14, C.muted, 540);
    const close = makeButton(this.modal, "Close", "", 275, 463, 52, 52, new Color(65, 77, 96, 255), () => this.closeModal(), 28);
    makeSprite(close.node, this.textures.get("ui2-6"), 0, 0, 27, 27, "Close icon");
    const content = makeNode("Modal content", this.modal);
    build(content);
    if (this.state.profile.settings.reducedMotion) this.modal.setScale(Vec3.ONE);
    else {
      this.modal.setScale(0.94, 0.94, 1);
      tween(this.modal).to(0.22, { scale: Vec3.ONE }, { easing: "backOut" }).start();
    }
    this.onModalChange?.(true);
  }

  closeModal(): void {
    if (!this.modal) return;
    this.modal.destroy();
    this.modal = null;
    this.onModalChange?.(false);
  }

  toast(text: string): void {
    const background = makeRect(this.toastRoot, "Toast", 0, 0, Math.min(620, 80 + text.length * 12), 55, new Color(20, 31, 47, 250), 16);
    makeLabel(background, text, 0, 0, 17, C.amber, background.getComponent(UITransform)!.width - 30, Label.HorizontalAlign.CENTER);
    const opacity = background.addComponent(UIOpacity);
    background.setPosition(0, -this.toastRoot.children.length * 62, 0);
    tween(background).delay(2.1).call(() => background.destroy()).start();
    tween(opacity).delay(1.7).to(0.4, { opacity: 0 }).start();
  }
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU", { notation: value >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function chainsName(chain: string): string {
  return DATA.chains[chain as keyof typeof DATA.chains]?.name ?? chain;
}

function modeObjective(id: ModeId): string {
  const text: Record<ModeId, string> = {
    dreams: "Создайте предмет цели до того, как закончатся ходы.",
    rush: "Соединяйте предметы и набирайте очки за три минуты. Генераторы бесплатны.",
    night: "Выполняйте бесконечные заказы. Каждые пять заказов повышают сложность.",
    festival: "Пройдите три этапа праздничного маршрута и получите особый усилитель."
  };
  return text[id];
}

function modeProgressText(mode: ModeSession): string {
  if (mode.id === "rush") {
    const seconds = Math.ceil(Math.max(0, (mode.endsAt ?? 0) - Date.now()) / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} · ${mode.score} очков`;
  }
  if (mode.id === "night") return `Выполнено заказов: ${mode.completed} · Счёт: ${mode.score}`;
  const target = mode.target ? `${DATA.chains[mode.target.chain].items[mode.target.tier - 1]} · уровень ${mode.target.tier}` : "";
  const stage = mode.id === "festival" ? `Этап ${mode.stage + 1}/3 · ` : "";
  return `${stage}${target} · Ходы: ${mode.movesLeft ?? "∞"}`;
}

function modeCoachText(id: ModeId): string {
  const text: Record<ModeId, string> = {
    dreams: "Планируйте слияния заранее. Пять одинаковых предметов дают двойной результат и экономят ходы.",
    rush: "Не останавливайтесь: генераторы не тратят энергию, а слияние пяти приносит двойные очки.",
    night: "Свободно создавайте предметы. Сложность заказов растёт, а лучший результат сохраняется.",
    festival: "Выполните заказ на текущем этапе. После этого доска обновится, а цель станет сложнее."
  };
  return text[id];
}
