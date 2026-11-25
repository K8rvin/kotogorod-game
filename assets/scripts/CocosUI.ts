import { Button, Color, Graphics, Label, Node, Sprite, SpriteFrame, UITransform } from "cc";

export const C = {
  cream: new Color(255, 244, 223, 255),
  muted: new Color(181, 193, 209, 255),
  amber: new Color(255, 204, 119, 255),
  mint: new Color(139, 215, 173, 255),
  ink: new Color(20, 31, 47, 255),
  panel: new Color(29, 43, 61, 242),
  cell: new Color(46, 61, 79, 255),
  rose: new Color(239, 156, 167, 255)
};

export function makeNode(name: string, parent: Node, x = 0, y = 0, width = 100, height = 100): Node {
  const node = new Node(name);
  parent.addChild(node);
  node.addComponent(UITransform).setContentSize(width, height);
  node.setPosition(x, y, 0);
  return node;
}

export function makeRect(parent: Node, name: string, x: number, y: number, width: number, height: number, color: Color, radius = 18): Node {
  const node = makeNode(name, parent, x, y, width, height);
  const graphics = node.addComponent(Graphics);
  graphics.fillColor = color;
  graphics.roundRect(-width / 2, -height / 2, width, height, radius);
  graphics.fill();
  return node;
}

export function makeLabel(parent: Node, text: string, x: number, y: number, fontSize: number, color: Color = C.cream, width = 600, align = Label.HorizontalAlign.LEFT): Label {
  const node = makeNode("Label", parent, x, y, width, fontSize * 1.35);
  const transform = node.getComponent(UITransform)!;
  transform.setAnchorPoint(align === Label.HorizontalAlign.LEFT ? 0 : align === Label.HorizontalAlign.RIGHT ? 1 : 0.5, 0.5);
  const label = node.addComponent(Label);
  label.string = text;
  label.fontSize = fontSize;
  label.lineHeight = fontSize * 1.25;
  label.color = color;
  label.horizontalAlign = align;
  label.verticalAlign = Label.VerticalAlign.CENTER;
  label.overflow = Label.Overflow.SHRINK;
  return label;
}

export function makeSprite(parent: Node, frame: SpriteFrame | null, x: number, y: number, width: number, height: number, name = "Sprite"): Node {
  const node = makeNode(name, parent, x, y, width, height);
  const sprite = node.addComponent(Sprite);
  sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  sprite.spriteFrame = frame;
  return node;
}

export function makeButton(parent: Node, name: string, text: string, x: number, y: number, width: number, height: number, color: Color, onClick: () => void, fontSize = 23): { node: Node; label: Label; button: Button } {
  const node = makeRect(parent, name, x, y, width, height, color, Math.min(18, height * 0.28));
  const button = node.addComponent(Button);
  button.transition = Button.Transition.SCALE;
  button.zoomScale = 1.045;
  button.duration = 0.12;
  const label = makeLabel(node, text, 0, 0, fontSize, C.ink, width - 18, Label.HorizontalAlign.CENTER);
  node.on(Button.EventType.CLICK, onClick);
  return { node, label, button };
}

export function setButtonEnabled(button: Button, enabled: boolean, idle = new Color(83, 94, 111, 210)): void {
  button.interactable = enabled;
  const graphics = button.node.getComponent(Graphics);
  if (graphics) {
    const transform = button.node.getComponent(UITransform)!;
    const width = transform.width, height = transform.height;
    graphics.clear();
    graphics.fillColor = enabled ? new Color(244, 199, 119, 255) : idle;
    graphics.roundRect(-width / 2, -height / 2, width, height, Math.min(18, height * 0.28));
    graphics.fill();
  }
  const label = button.node.getComponentInChildren(Label);
  if (label) label.color = enabled ? C.ink : C.muted;
}
