class TextureManager {
    constructor() {
        this.textures = new Map();
    }

    add(id, texture) {
        this.textures.set(id, texture);
    }

    get(id) {
        return this.textures.get(id);
    }
}