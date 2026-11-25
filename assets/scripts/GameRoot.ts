import { _decorator, Color, Component, director, Label, ResolutionPolicy, UITransform, view } from "cc";
import { GameState } from "./core/state";
import { TextureLibrary } from "./TextureLibrary";
import { C, makeLabel, makeNode, makeRect } from "./CocosUI";
import { CityController } from "./CityController";
import { BoardController } from "./BoardController";
import { UIController } from "./UIController";
import { AudioDirector } from "./AudioDirector";
const { ccclass } = _decorator;

@ccclass("GameRoot")
export class GameRoot extends Component {
  private ui?: UIController;
  private board?: BoardController;
  private audio?: AudioDirector;
  private gameState?: GameState;

  onLoad(): void {
    view.setDesignResolutionSize(720, 1280, ResolutionPolicy.SHOW_ALL);
  }

  start(): void {
    makeRect(this.node, "Night background", 0, 0, 720, 1280, new Color(14, 24, 39, 255), 0);
    const loading = makeLabel(this.node, "КОТОГОРОД", 0, 120, 42, C.amber, 600, Label.HorizontalAlign.CENTER);
    const caption = makeLabel(this.node, "Зажигаем первый огонёк…", 0, 55, 20, C.muted, 600, Label.HorizontalAlign.CENTER);
    const bar = makeRect(this.node, "Loading track", 0, -20, 340, 10, new Color(49, 65, 83, 255), 5);
    const fill = makeRect(bar, "Loading fill", -165, 0, 10, 6, C.amber, 3);
    this.gameState = new GameState();
    const state = this.gameState;
    const textures = new TextureLibrary();
    textures.load((value) => {
      fill.getComponent(UITransform)!.setContentSize(Math.max(10, 330 * value), 6);
      caption.string = value >= 1 ? "Город готов" : `Зажигаем первый огонёк… ${Math.round(value * 100)}%`;
    }).then(() => {
      loading.node.destroy();
      caption.node.destroy();
      bar.destroy();
      const cityNode = makeNode("City", this.node);
      const city = cityNode.addComponent(CityController);
      city.init(state, textures);
      const boardNode = makeNode("Board", this.node);
      const board = boardNode.addComponent(BoardController);
      this.board = board;
      board.init(state, textures);
      const uiNode = makeNode("Interface", this.node);
      const ui = uiNode.addComponent(UIController);
      this.ui = ui;
      ui.onModalChange = (open) => board.setEnabled(!open);
      ui.init(state, textures, board);
      this.audio = this.node.addComponent(AudioDirector);
      this.audio.init(state);
      director.on("kotogorod-pause", this.onPause, this);
    }).catch((error) => {
      caption.string = `Не удалось загрузить ресурсы: ${error}`;
      caption.color = C.rose;
    });
  }

  private onPause(): void {
    this.board?.setEnabled(false);
  }

  update(deltaTime: number): void {
    this.gameState?.trackTime(deltaTime);
    this.ui?.tick();
  }
}
