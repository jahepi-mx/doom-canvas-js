class Segment {

    constructor(player, camera, zBottom, height, tan, hw3d, hh3d, hw, hh) {
        this.player = player;
        this.positions = [];
        this.localPositions = [];
        this.mins = [];
        this.maxs = [];
        this.ys = new Set();
        this.zBottom = zBottom;
        this.height = height;
        this.zUp = zBottom + height;
        this.min = Number.MAX_VALUE;
        this.max = Number.MIN_VALUE;
        this.hasFloor = true;
        this.hasCeiling = true;
        this.gap = 2;
        this.lines = [];
        this.camera = camera;
        this.tan = tan;
        this.hw3d = hw3d;
        this.hh3d = hh3d;
        this.hw = hw;
        this.hh = hh;
    }

    add(x1, y1, x2, y2, color, floor, ceiling) {
        if (x2 != null) {
            var line = new Line(this.hw, this.hh, x1, y1, x2, y2, color, this.player);
            line.z = this.zBottom;
            line.height = this.height;
            line.floor = floor;
            line.ceiling = ceiling;
            this.lines.push(line);
        }
        this.positions.push(new Vector(x1, y1));
    }

    update(dt) {
        this.localPositions = [];
        for (let position of this.positions) {
            this.localPositions.push(this.player.convertToLocal(position.x, position.y, true));
        }
        this.interpolate();
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

    render(yBuffer, context, localContext) {
        var hasIntersections = false;
        // Draws lines (walls)
        for (let line of this.lines) {
            line.update(0);
            line.render(context);
            line.localRender(localContext);
            if (line.hasIntersectionPoints()) {
                hasIntersections = true;
                line.intersectLocalRender(localContext);

                line.intersectA.z -= this.camera.z;
                line.intersectB.z -= this.camera.z;
                line.intersectA.z += line.z;
                line.intersectB.z += line.z;
    
                if (line.floor == 0 && line.ceiling == 0) {
                    this.projectLine(yBuffer, line, 0, line.height);
                }
                if (line.floor > 0) {
                    this.projectLine(yBuffer, line, 0, line.floor);
                }
                if (line.ceiling > 0) {
                    this.projectLine(yBuffer, line, line.height - line.ceiling, line.height);
                }
            }
        }
        if (!hasIntersections) {
            return;
        }
        // Draws floor and ceiling of the segment
        var tanH = this.tan * this.hh3d;
        var tanW = this.tan * this.hw3d;
        for (var y = this.min; y <= this.max - this.gap; y += this.gap) {
            var min = this.mins[y];
            var max = this.maxs[y];
            //localContext.fillStyle = "white";
            //localContext.fillRect(hw + min, hh - y, max - min, 1);

            if (this.hasFloor) {
                var szMin2 = (-this.camera.z + this.zBottom) * (1 / (y + this.gap)) * tanH;

                var sxMin = min * (1 / y) * tanW;
                var szMin = (-this.camera.z + this.zBottom) * (1 / y) * tanH;
                var sxMax = max * (1 / y) * tanW;
                //var szMax = (-this.camera.z + this.zBottom) * (1 / y) * tanH;
                var height = szMin - szMin2;
                if (szMin < szMin2) {
                    height = szMin2 - szMin;
                    szMin += height;
                }
                yBuffer.push({'height': height + 1, 'x': sxMin, 'z': szMin, 'color': 'white', 'width': sxMax - sxMin, 'order': y});
            }
            if (this.hasCeiling) {
                var szMin2 = (-this.camera.z + this.zUp) * (1 / (y + this.gap)) * tanH;

                var sxMin = min * (1 / y) * tanW;
                var szMin = (-this.camera.z + this.zUp) * (1 / y) * tanH;
                var sxMax = max * (1 / y) * tanW;
                //var szMax = (-this.camera.z + this.zUp) * (1 / y) * tanH;
                var height = szMin - szMin2;
                if (szMin < szMin2) {
                    height = szMin2 - szMin;
                    szMin += height;
                }
                yBuffer.push({'height': height + 1, 'x': sxMin, 'z': szMin, 'color': 'black', 'width': sxMax - sxMin, 'order': y});
            }
        }
    }

    projectLine(yBuffer, line, down, up) {
        var tanW = this.tan * this.hw3d;
        var tanH = this.tan * this.hh3d;
        var x = line.intersectA.x;
        var y = line.intersectA.y;
        var z = line.intersectA.z;
        var prevX = line.intersectB.x;
        var prevY = line.intersectB.y;
        var prevZ = line.intersectB.z;
    
        var sxAUp = prevX * (1 / prevY) * tanW;
        var szAUp = (prevZ + up) * (1 / prevY) * tanH;
        var sxBUp = x * (1 / y) * tanW;
        var szBUp = (z + up) * (1 / y) * tanH;
    
        var sxADown = prevX * (1 / prevY) * tanW;
        var szADown = (prevZ + down) * (1 / prevY) * tanH;
        var sxBDown = x * (1 / y) * tanW;
        var szBDown = (z + down) * (1 / y) * tanH;
    
        var screenToLocal = tanH * (up - down);
        var upSlope = (szBUp - szAUp) / (sxBUp - sxAUp);
        var downSlope = (szBDown - szADown) / (sxBDown - sxADown);
        var lineWidth = 2;
        var max = Math.max(sxAUp, sxBUp);
        for (var e = Math.min(sxAUp, sxBUp); e < max; e += lineWidth) {
            var top = upSlope * e + upSlope * -sxAUp + szAUp;
            var bottom = downSlope * e + downSlope * -sxADown + szADown;
            // From screen to local coords to get Y coord (depth)
            var localY = screenToLocal / (top - bottom);
            yBuffer.push({'height': top - bottom, 'x': e, 'z': top, 'color': line.color, 'width': lineWidth + 1, 'order': localY});
        } 
    }
}