class Segment {

    constructor(player, down, up) {
        this.player = player;
        this.positions = [];
        this.localPositions = [];
        this.mins = [];
        this.maxs = [];
        this.ys = new Set();
        this.down = down;
        this.up = up;
        this.min = Number.MAX_VALUE;
        this.max = Number.MIN_VALUE;
    }

    add(x, y) {
        this.positions.push(new Vector(x, y))
    }

    update(dt) {
        this.localPositions = [];
        for (let position of this.positions) {
            this.localPositions.push(this.player.convertToLocal(position.x, position.y, true));
        }
    }

    interpolate() {
        this.ys.clear();
        this.mins = [];
        this.maxs = [];
        this.min = Number.MAX_VALUE;
        this.max = Number.MIN_VALUE;
        var len = this.localPositions.length;
        for (var a = 0; a < len; a++) {
            var aPos = this.localPositions[a];
            var bPos = this.localPositions[(a + 1) % len];
            var xA = parseInt(aPos.x);
            var yA = parseInt(aPos.y);
            var xB = parseInt(bPos.x);
            var yB = parseInt(bPos.y);
            if (yB < yA) {
                var tmpX = xA;
                var tmpY = yA;
                xA = xB;
                yA = yB;
                xB = tmpX;
                yB = tmpY;
            }
            var xDiff = xB - xA;
            var yDiff = yB - yA;
            for (var y = yA; y <= yB; y++) {
                // p.y + d.y*? = t
                // ? = (t - p.y) / d.y
                if (yDiff > 0 && y >= 0) {
                    var ratio = (y - yA) / yDiff;
                    var x = xA + ratio * xDiff;
                    this.ys.add(y);
                    if (this.mins[y] == undefined) {
                        this.mins[y] = x;
                    }
                    if (this.maxs[y] == undefined) {
                        this.maxs[y] = x;
                    }
                    this.mins[y] = Math.min(x, this.mins[y]);
                    this.maxs[y] = Math.max(x, this.maxs[y]);
                    this.min = Math.min(y, this.min);
                    this.max = Math.max(y, this.max);
                }
            }
        }
    }
}