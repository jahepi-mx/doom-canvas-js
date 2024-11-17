class Texture {

    constructor(imageData) {
        this.imageData = imageData.data;
        this.width = imageData.width;
        this.height = imageData.height;
        
    }

    getIndex(x, y) {
        if (x < 0) {
            x = 0;
        }
        if (x >= this.width) {
            x = this.width - 1;
        }
        if (y < 0) {
            y = 0;
        }
        if (y >= this.height) {
            y = this.height - 1;
        }
        return (y * this.width + x) * 4;
    }
}