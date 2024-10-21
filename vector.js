class Vector {
    
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.z = 0; // Height
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    clone() {
        return new Vector(this.x, this.y);
    }
}