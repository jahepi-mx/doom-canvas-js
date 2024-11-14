class Texture {

    constructor() {
        this.texcolors = [];
        this.texcolorsints = [];
        this.width = 0;
        this.height = 0;
    }

    loadTextureData(imageData) {
        this.width = imageData.width;
        this.height = imageData.height;
        for (var x = 0; x <= imageData.width; x++) {
            for (var y = 0; y <= imageData.height; y++) {
                var i = (y * imageData.width + x) * 4;
                this.texcolorsints[y * imageData.width + x] = imageData.data[i] << 16 | imageData.data[i + 1] << 8 | imageData.data[i + 2];
                this.texcolors[y * imageData.width + x] = "#" + (1 << 24 | imageData.data[i] << 16 | imageData.data[i + 1] << 8 | imageData.data[i + 2]).toString(16).slice(1);
            }
        }
    }
}