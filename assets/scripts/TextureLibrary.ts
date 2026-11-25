import { SpriteFrame, resources } from "cc";

export class TextureLibrary {
  private frames = new Map<string, SpriteFrame>();

  load(onProgress: (value: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      resources.loadDir("textures", SpriteFrame, (finished, total) => onProgress(total ? finished / total : 0), (error, frames) => {
        if (error) {
          reject(error);
          return;
        }
        frames.forEach((frame) => this.frames.set(frame.name, frame));
        onProgress(1);
        resolve();
      });
    });
  }

  get(name: string): SpriteFrame | null {
    return this.frames.get(name) ?? null;
  }

  item(chain: string, tier: number): SpriteFrame | null {
    return this.get(`${chain}-${tier}`);
  }

  cat(id: string): SpriteFrame | null {
    return this.get(id);
  }
}
