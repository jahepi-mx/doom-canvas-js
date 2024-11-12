class Sector {

    constructor(id, player, camera, zBottom, height, tan, hw3d, hh3d, hw, hh, zCam) {
        this.id = id;
        this.player = player;
        this.positions = [];
        this.localPositions = [];
        this.innerSectors = [];
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
        this.collided = false;
        this.isInside = false;
        this.zCam = zCam;
        // For ceiling and floor texturing
        this.minx = Number.MAX_VALUE;
        this.maxx = Number.MIN_VALUE;
        this.miny = Number.MAX_VALUE;
        this.maxy = Number.MIN_VALUE;
        this.texcolors = [];
        this.texcolorsints = [];
    }

    add(x1, y1, x2, y2, color, floor, ceiling, isWall, draw, connectedSector) {
        this.lines.push(new Line(this.hw, this.hh, x1, y1, x2, y2, color, this.player, this.zBottom, this.height, floor, ceiling, isWall, draw, connectedSector));
        this.minx = Math.min(x1, this.minx);
        this.maxx = Math.max(x1, this.maxx);
        this.miny = Math.min(y1, this.miny);
        this.maxy = Math.max(y1, this.maxy);
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
            var xA = aPos.x | 0;
            var yA = aPos.y | 0;
            var xB = bPos.x | 0;
            var yB = bPos.y | 0;
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

    render(yBuffer, context, localContext, stack, bounds) {
        var hasIntersections = false;
        this.collided = false;
        this.isInside = true;
        var sign = null;
        for (let line of this.lines) {
            line.update(0);
            line.render(context);
            line.localRender(localContext);
            var cross = line.cross();
            sign = sign == null ? cross >= 0 : sign;
            this.isInside = sign && cross < 0 ? false : this.isInside;
            this.isInside = !sign && cross >= 0 ? false : this.isInside;
            if (line.hasIntersectionPoints()) {
                hasIntersections = true;
                line.intersectLocalRender(localContext);
                line.intersectA.z -= this.camera.z;
                line.intersectB.z -= this.camera.z;
                line.intersectA.z += line.z;
                line.intersectB.z += line.z;
                this.collided =  line.isWall && line.intersect(this.player.wallSensor) != null ? true : this.collided;
                if (line.connectedSector != null) stack.addSector(line.connectedSector, line.getBounds(this.tan * this.hw3d, this.tan * this.hh3d, -this.hw3d, this.hw3d, this.hh3d, -this.hh3d));
                if (line.draw && line.floor == 0 && line.ceiling == 0) this.drawWall(yBuffer, line, 0, line.height, bounds);
                if (line.draw && line.floor > 0) this.drawWall(yBuffer, line, 0, line.floor, bounds);
                if (line.draw && line.ceiling > 0) this.drawWall(yBuffer, line, line.height - line.ceiling, line.height, bounds);
            }
        }
        if (!hasIntersections) {
            return;
        }
        if (this.hasCeiling) this.drawSurface(yBuffer, this.zUp, bounds);
        if (this.hasFloor) this.drawSurface(yBuffer, this.zBottom, bounds);
    }
    /* The idea behind this is to get the Z screen coordinates, which represent the screen height. We then loop through that range, retrieving the Y world coordinate (depth) and the X world coordinate, 
       and convert them to X screen coordinates. As we loop through this range, we convert each pixel back to world coordinates to get the color of the texture. */
    drawSurface(yBuffer, height, bounds) {
        var tanH = this.tan * this.hh3d;
        var tanW = this.tan * this.hw3d;
        var zScreenMinA = (-this.camera.z + height) * (1 / this.min) * tanH;
        var zScreenMaxA = (-this.camera.z + height) * (1 / this.max) * tanH;
        zScreenMinA = zScreenMinA < bounds.bottom ? bounds.bottom : zScreenMinA;
        zScreenMinA = zScreenMinA > bounds.top ? bounds.top : zScreenMinA;
        zScreenMaxA = zScreenMaxA < bounds.bottom ? bounds.bottom : zScreenMaxA;
        zScreenMaxA = zScreenMaxA > bounds.top ? bounds.top : zScreenMaxA;
        var maxz = Math.max(zScreenMinA, zScreenMaxA);
        for (var sz = Math.min(zScreenMinA, zScreenMaxA); sz < maxz; sz++) {
            var y = ((-this.camera.z + height) * tanH * (1 / sz)) | 0;
            var min = this.mins[y];
            var max = this.maxs[y];
            var xMinScreen = Math.max(min * (1 / y) * tanW, bounds.left);
            var xMaxScreen = Math.min(max * (1 / y) * tanW, bounds.right);
            var prevColorInt = null;
            var prevColor = null;
            var prevSize = 0;
            var prevX = xMinScreen;
            var draws = [];
            for (var xScreen = xMinScreen; xScreen <= xMaxScreen; xScreen++) {
                var x = xScreen / ((1 / y) * tanW);
                var world = this.player.convertToWorld(x, y);
                var index = (world.y - this.miny) * (this.maxx - this.minx) + (world.x - this.minx);
                var color = this.texcolors[index];
                var colorint = this.texcolorsints[index];
                if (prevColorInt != colorint && xScreen > xMinScreen) {
                    draws.push({'height': 2, 'x': prevX, 'z': sz, 'color': prevColor, 'width': prevSize + 1});
                    prevX = xScreen;
                    prevSize = 0;
                }
                prevSize++;
                prevColorInt = colorint;
                prevColor = color;
            }
            draws.push({'height': 2, 'x': prevX, 'z': sz, 'color': prevColor, 'width': prevSize + 1});
            yBuffer.push({'order': y, 'img': 0, 'data': draws});
        }
    }
    
    drawWall(yBuffer, line, down, up, bounds) {
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
        var dotProj = line.localDiff.x * line.localDiff.x + line.localDiff.y * line.localDiff.y;
        var startPos = diffX1 * diffX2 + diffY1 * diffY2 <= 0 ? line.localPosition1 : line.localPosition2;

        var screenToLocalUp = (prevZ + up) * tanH;
        var screenToLocalDown = (prevZ + down) * tanH;
        var upSlope = (szBUp - szAUp) / (sxBUp - sxAUp);
        var downSlope = (szBDown - szADown) / (sxBDown - sxADown);
        var lineWidth = 2;
        var max = Math.max(sxAUp, sxBUp);
        max = Math.min(max, bounds.right);
        var min = Math.min(sxAUp, sxBUp);
        for (var e = Math.max(min, bounds.left); e < max; e += lineWidth) {
            var top = upSlope * e + upSlope * -sxAUp + szAUp;
            var bottom = downSlope * e + downSlope * -sxADown + szADown;
            var newy = top == 0 ? screenToLocalDown / bottom : screenToLocalUp / top;
            var newx = e / (1 / newy * tanW);
            var texRatio = Math.abs((newx - startPos.x) * line.localDiff.x + (newy - startPos.y) * line.localDiff.y) / dotProj;
            if ((top >= bounds.bottom && top <= bounds.top) || (bottom >= bounds.bottom && bottom <= bounds.top) || (bottom <= bounds.bottom && top >= bounds.top)) {
                yBuffer.push({'height': top - bottom + 1, 'x': e, 'z': top, 'color': line.color, 'width': lineWidth, 'order': newy, 'img': 1, 'texratio': texRatio});
            }
        } 
    }

    loadFloorCeilingTextureData(imageData) {
        for (var x = this.minx; x <= this.maxx; x++) {
            for (var y = this.miny; y <= this.maxy; y++) {
                var rx = (x - this.minx) / (this.maxx - this.minx);
                var ry = (y - this.miny) / (this.maxy - this.miny);
                var ix = (imageData.width * rx) | 0;
                var iy = (imageData.height * ry) | 0;
                var i = (iy * imageData.width + ix) * 4;
                this.texcolorsints[(y - this.miny) * (this.maxx - this.minx) + (x - this.minx)] = imageData.data[i] << 16 | imageData.data[i + 1] << 8 | imageData.data[i + 2];
                this.texcolors[(y - this.miny) * (this.maxx - this.minx) + (x - this.minx)] = "#" + (1 << 24 | imageData.data[i] << 16 | imageData.data[i + 1] << 8 | imageData.data[i + 2]).toString(16).slice(1);
            }
        }
    }
}