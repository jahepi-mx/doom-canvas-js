class Segment {

    constructor(player, camera, zBottom, height, tan, hw3d, hh3d, hw, hh) {
        this.player = player;
        this.positions = [];
        this.localPositions = [];
        this.mins = [];
        this.maxs = [];
        this.zBottom = zBottom;
        this.height = height;
        this.zUp = zBottom + height;
        this.min = Number.MAX_VALUE;
        this.max = Number.MIN_VALUE;
        this.hasFloor = true;
        this.hasCeiling = true;
        this.lines = [];
        this.camera = camera;
        this.tan = tan;
        this.hw3d = hw3d;
        this.hh3d = hh3d;
        this.hw = hw;
        this.hh = hh;

        // For ceiling and floor texturing
        this.texmins = new Map();
        this.texmaxs = new Map();
        this.ytexmin = Number.MAX_VALUE;
        this.ytexmax = Number.MIN_VALUE;
        this.texcolors = [];
        this.texcolorsints = [];
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
                if (yDiff != 0 && y >= 1) {
                    var ratio = (y - yA) / yDiff;
                    var x = xA + ratio * xDiff;
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
    
                if (line.floor == 0 && line.ceiling == 0) this.projectLine(yBuffer, line, 0, line.height);
                if (line.floor > 0) this.projectLine(yBuffer, line, 0, line.floor);
                if (line.ceiling > 0) this.projectLine(yBuffer, line, line.height - line.ceiling, line.height);
            }
        }
        if (!hasIntersections) {
            return;
        }
        if (this.hasCeiling) this.drawSurfaceTexture(this.zUp);
        if (this.hasFloor) this.drawSurfaceTexture(this.zBottom);
    }
    /* The idea behind this is to get the Z screen coordinates, which represent the screen height. We then loop through that range, retrieving the Y world coordinate (depth) and the X world coordinate, 
       and convert them to X screen coordinates. As we loop through this range, we convert each pixel back to world coordinates to get the color of the texture. */
    drawSurfaceTexture(height) {
        var tanH = this.tan * this.hh3d;
        var tanW = this.tan * this.hw3d;
        var zScreenMinA = (-this.camera.z + height) * (1 / this.min) * tanH;
        var zScreenMaxA = (-this.camera.z + height) * (1 / this.max) * tanH;
        zScreenMinA = zScreenMinA < -this.hh3d ? -this.hh3d : zScreenMinA;
        zScreenMinA = zScreenMinA > this.hh3d ? this.hh3d : zScreenMinA;
        zScreenMaxA = zScreenMaxA < -this.hh3d ? -this.hh3d : zScreenMaxA;
        zScreenMaxA = zScreenMaxA > this.hh3d ? this.hh3d : zScreenMaxA;
        var maxz = Math.max(zScreenMinA, zScreenMaxA);
        for (var sz = Math.min(zScreenMinA, zScreenMaxA); sz <= maxz; sz++) {
            var y = parseInt((-this.camera.z + height) * tanH * (1 / sz));
            var min = this.mins[y];
            var max = this.maxs[y];
            //localContext.fillStyle = "white";
            //localContext.fillRect(hw + min, hh - y, max - min, 1);
            var xMinScreen = min * (1 / y) * tanW;
            var xMaxScreen = max * (1 / y) * tanW;
            xMinScreen = xMinScreen < -this.hw3d ? -this.hw3d : xMinScreen;
            xMinScreen = xMinScreen > this.hw3d ? this.hw3d : xMinScreen;
            xMaxScreen = xMaxScreen < -this.hw3d ? -this.hw3d : xMaxScreen;
            xMaxScreen = xMaxScreen > this.hw3d ? this.hw3d : xMaxScreen;
            var prevColorInt = null;
            var prevColor = null;
            var prevSize = 0;
            var prevX = xMinScreen;
            for (var xScreen = xMinScreen; xScreen <= xMaxScreen; xScreen++) {
                var x = xScreen / ((1 / y) * tanW);
                var world = this.player.convertToWorld(x, y);
                var index = (world.y + 1000) * 10000 + world.x + 1000;
                var color = this.texcolors[index];
                var colorint = this.texcolorsints[index];
                if (prevColorInt != colorint && xScreen > xMinScreen) {
                    yBuffer.push({'height': 2, 'x': prevX, 'z': sz, 'color': prevColor, 'width': prevSize + 1, 'order': y, 'img': 0});
                    prevX = xScreen;
                    prevSize = 0;
                }
                prevSize++;
                prevColorInt = colorint;
                prevColor = color;
            }
            yBuffer.push({'height': 2, 'x': prevX, 'z': sz, 'color': prevColor, 'width': prevSize + 1, 'order': y, 'img': 0});
        }
    }
    // Draws walls
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

        // Texture
        var intersA = line.intersectA;
        var intersB = line.intersectB;
        if (sxAUp < sxBUp) {
            intersA = line.intersectB;
            intersB = line.intersectA;
        }
        var diffX1 = intersB.x - intersA.x;
        var diffY1 = intersB.y - intersA.y;
        var diffX2 = line.localPosition1.x - intersA.x;
        var diffY2 = line.localPosition1.y - intersA.y;
        var diffX3 = line.localPosition2.x - intersA.x;
        var diffY3 = line.localPosition2.y - intersA.y;
        var dot1 = diffX1 * diffX2 + diffY1 * diffY2 <= 0 ? diffX2 * line.localDiff.x + diffY2 * line.localDiff.y : 0;
        dot1 = diffX1 * diffX3 + diffY1 * diffY3 <= 0 ? diffX3 * line.localDiff.x + diffY3 * line.localDiff.y : dot1;
        var dotProj = line.localDiff.x * line.localDiff.x + line.localDiff.y * line.localDiff.y;
        var fromRatio = Math.abs(dot1 / dotProj);
    
        var screenToLocal = (prevZ + up) * tanH;
        var upSlope = (szBUp - szAUp) / (sxBUp - sxAUp);
        var downSlope = (szBDown - szADown) / (sxBDown - sxADown);
        var lineWidth = 2;
        var max = Math.max(sxAUp, sxBUp);
        for (var e = Math.min(sxAUp, sxBUp); e < max; e += lineWidth) {
            var top = upSlope * e + upSlope * -sxAUp + szAUp;
            var bottom = downSlope * e + downSlope * -sxADown + szADown;
            var newy = screenToLocal / top;
            var newx = e / (1 / newy * tanW);
            var newx1 = newx - intersA.x;
            var newy1 = newy - intersA.y;
            var texRatio = fromRatio + Math.abs((newx1 * line.localDiff.x + newy1 * line.localDiff.y) / dotProj);
            yBuffer.push({'height': top - bottom, 'x': e, 'z': top, 'color': line.color, 'width': lineWidth + 1, 'order': newy, 'img': 1, 'texratio': texRatio});
        } 
    }

    texturizeFloorCeiling() {
        var len = this.positions.length;
        for (var a = 0; a < len; a++) {
            var aPos = this.positions[a];
            var bPos = this.positions[(a + 1) % len];
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
                if (yDiff != 0) {
                    var ratio = (y - yA) / yDiff;
                    var x = xA + ratio * xDiff;
                    if (!this.texmins.has(y)) {
                        this.texmins.set(y, x);
                    }
                    if (!this.texmaxs.has(y)) {
                        this.texmaxs.set(y, x);
                    }
                    this.texmins.set(y, Math.min(x, this.texmins.get(y)));
                    this.texmaxs.set(y, Math.max(x, this.texmaxs.get(y)));
                    this.ytexmin = Math.min(y, this.ytexmin);
                    this.ytexmax = Math.max(y, this.ytexmax);
                }
            }
        }
        var colors = ["red", "red", "red", "red", "black", "black", "black", "black", "black", "black"];
        var colorsints = [1, 1, 1, 1, 2, 2, 2, 2, 2, 2];
        for (var y = this.ytexmin, inc = 0; y <= this.ytexmax; y++, inc++) {
            var xmin = this.texmins.get(y);
            var xmax = this.texmaxs.get(y);
            for (var x = xmin; x <= xmax; x++) {
                this.texcolors[(y + 1000) * 10000 + x + 1000] = colors[inc % colors.length];
                this.texcolorsints[(y + 1000) * 10000 + x + 1000] = colorsints[inc % colors.length];
            }
        }
    }
}