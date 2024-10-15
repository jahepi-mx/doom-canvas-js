class Line {
    
    constructor(offsetx, offsety, x1, y1, x2, y2, color, player) {
        this.position1 = new Vector(x1, y1);
        this.position2 = new Vector(x2, y2);
        this.localPosition1 = new Vector(0, 0);
        this.localPosition2 = new Vector(0, 0);
        this.localUnit = new Vector(0, 0);
        this.localDiff = new Vector(0, 0);
        this.color = color;
        this.offset = new Vector(offsetx, offsety);
        this.ratio = 0;
        this.player = player;
        this.len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        this.lenNoSqrt = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    }

    update(dt) {
        this.localPosition1 = this.player.convertToLocal(this.position1.x, this.position1.y, true);
        this.localPosition2 = this.player.convertToLocal(this.position2.x, this.position2.y, true);
        this.localDiff.x = this.localPosition2.x - this.localPosition1.x;
        this.localDiff.y = this.localPosition2.y - this.localPosition1.y;
        this.localUnit.x = this.localDiff.x / this.len;
        this.localUnit.y = this.localDiff.y / this.len;
        if (this.localUnit.x != 0) {
            this.ratio = this.localDiff.x / this.localUnit.x;
        }
        if (this.localUnit.y != 0) {
            this.ratio = this.localDiff.y / this.localUnit.y
        }
    }

    render(context) {
        context.beginPath();
        context.moveTo(this.offset.x + this.position1.x, this.offset.y - this.position1.y);
        context.lineTo(this.offset.x + this.position2.x, this.offset.y - this.position2.y);
        context.lineWidth = 3;
        context.strokeStyle = this.color;
        context.stroke();
    }

    localRender(context) {
        context.beginPath();
        context.moveTo(this.offset.x + this.localPosition1.x, this.offset.y - this.localPosition1.y);
        context.lineTo(this.offset.x + this.localPosition2.x, this.offset.y - this.localPosition2.y);
        context.lineWidth = 3;
        context.strokeStyle = this.color;
        context.stroke();
    }

    intersect(line) {
        var den1 = this.localPosition2.x - this.localPosition1.x;
        var den2 = line.localPosition2.x - line.localPosition1.x;
        if (den1 != 0 || den2 != 0) {
            var x = 0;
            var y = 0;
            if (den1 == 0) {
                var s2 = (line.localPosition2.y - line.localPosition1.y) / den2;
                x = this.localPosition1.x;
                y = s2 * x - s2 * line.localPosition1.x + line.localPosition1.y;
            } else if (den2 == 0) {
                var s1 = (this.localPosition2.y - this.localPosition1.y) / den1;
                x = line.localPosition1.x;
                y = s1 * x - s1 * this.localPosition1.x + this.localPosition1.y;
            } else {
                var s1 = (this.localPosition2.y - this.localPosition1.y) / den1;
                var s2 = (line.localPosition2.y - line.localPosition1.y) / den2;
                x = (-s2 * line.localPosition1.x + line.localPosition1.y + s1 * this.localPosition1.x - this.localPosition1.y) / (s1 - s2);
                y = s1 * x - s1 * this.localPosition1.x + this.localPosition1.y;
            }
            var ratio = 0;
            var diff = new Vector(x - line.localPosition1.x, y - line.localPosition1.y);
            if (line.localUnit.x != 0) {
                ratio = diff.x / line.localUnit.x;
            }
            if (line.localUnit.y != 0) {
                ratio = diff.y / line.localUnit.y
            }

            var diff = new Vector(x - this.localPosition1.x, y - this.localPosition1.y);
            var dot = diff.x * this.localUnit.x + diff.y * this.localUnit.y;
            var len = diff.x * diff.x + diff.y * diff.y;
    
            if ((s1 - s2) != 0 && ratio >= 0 && ratio <= line.ratio && dot > 0 && len <= this.lenNoSqrt) {
                return new Vector(x, y);
            }
        }
        return null;
    }
}