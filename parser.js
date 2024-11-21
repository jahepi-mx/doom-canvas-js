class Parser {

    constructor(player, camZOffset, tan, hw3d, hh3d, hw, hh, stack, textureCanvas) {
        this.sectors = new Map();
        this.player = player;
        this.camZOffset = camZOffset;
        this.tan = tan;
        this.hw3d = hw3d;
        this.hh3d = hh3d;
        this.hw = hw;
        this.hh = hh;
        this.stack = stack;
        this.textureManager = new TextureManager();
        this.textureCanvas = textureCanvas;
        this.texturesLoaded = 0;
        this.callback = null;
    }

    loadTextures(callback) {
        var textures = [];
        this.callback = callback;
        fetch("assets/map/textures.dat").then((res) => res.text()).then((text) => {
            const lines = text.split('\n');
            for (let ls of lines) {
                if (ls.indexOf("#textures") == -1) {
                    const line = ls.split(',');
                    var file = line[0].trim();
                    var id = line[1].trim();
                    textures.push({id: id, file: file});
                }
            }
            for (let texture of textures) {
                const img = new Image();
                img.onload = function() { 
                    const context = this.textureCanvas.getContext('2d');
                    this.textureCanvas.width = img.width;
                    this.textureCanvas.height = img.height;
                    context.drawImage(img, 0, 0);
                    var imageData = context.getImageData(0, 0, img.width, img.height);
                    this.textureManager.add(texture.id, new Texture(imageData));
                    this.texturesLoaded++;
                    if (this.texturesLoaded == textures.length) {
                        this.loadMap();
                    }
                }.bind(this);
                img.src = "assets/textures/" + texture.file;
            }

        }).catch((e) => console.error(e));
    }

    loadMap() {
        fetch("assets/map/map.dat").then((res) => res.text()).then((text) => {
            const lines = text.split('\n');
            var type = "";
            var wallsData = new Map();
            for (let ls of lines) {
                if (ls.indexOf("#sectors") >= 0) {
                    type = "sectors";
                    continue;
                } else if (ls.indexOf("#walls") >= 0) {
                    type = "walls";
                    continue;
                } else if (ls.indexOf("#subsectors") >= 0) {
                    type = "subsectors";
                    continue;
                }
                const line = ls.split(',');
                if (type == "sectors") {
                    var id = parseInt(line[0].trim());
                    var floorZPos = parseInt(line[1].trim());
                    var height = parseInt(line[2].trim());
                    var playerZPos = parseInt(line[3].trim());
                    var hasFloor = line[4].trim() != "0";
                    var hasCeiling = line[5].trim() != "0";
                    var inStack = line[6].trim() == "true";
                    this.sectors.set(id, new Sector(id, this.player, this.camZOffset, floorZPos, height, this.tan, this.hw3d, this.hh3d, this.hw, this.hh, playerZPos));
                    this.sectors.get(id).hasFloor = hasFloor;
                    this.sectors.get(id).hasCeiling = hasCeiling;
                    if (hasFloor) {
                        this.sectors.get(id).floorTexture = this.textureManager.get(line[4].trim());
                    }
                    if (hasCeiling) {
                        this.sectors.get(id).ceilingTexture = this.textureManager.get(line[5].trim());
                    }
                    if (inStack) {
                        this.stack.sectors.push(this.sectors.get(id));
                    }
                }
                if (type == "walls") {
                    var id = parseInt(line[0].trim());
                    var x = parseInt(line[1].trim());
                    var y = parseInt(line[2].trim());
                    var color = line[3].trim();
                    var bottomHeight = parseInt(line[4].trim());
                    var topHeight = parseInt(line[5].trim());
                    var obstructed = line[6].trim() == "true";
                    var draw = line[7].trim() == "true";
                    var connectedSector = line[8].trim();
                    var wallTextureBottom = line[9].trim();
                    var wallTextureTop = line[10].trim();
                    if (!wallsData.has(id)) {
                        wallsData.set(id, []);
                    }
                    wallsData.get(id).push({"id": id, "x": x, "y": y, "color": color, "bottom": bottomHeight, "top": topHeight, "obstructed": obstructed, "draw": draw, "sector": connectedSector, "wallTextureTop": wallTextureTop, "wallTextureBottom": wallTextureBottom});
                }
                if (type == "subsectors") {
                    var idA = parseInt(line[0].trim());
                    var idB = parseInt(line[1].trim());
                    this.sectors.get(idA).innerSectors.push(this.sectors.get(idB));
                }
            }
            wallsData.forEach(function(value, key, map) {
                var len = value.length;
                for (var i = 0; i < len; i++) {
                    var wall = value[i];
                    var nextWall = value[(i + 1) % len];
                    var textureBottom = wall.wallTextureBottom == "null" ? null : this.textureManager.get(wall.wallTextureBottom);
                    this.sectors.get(wall.id).add(wall.x, wall.y, nextWall.x, nextWall.y, wall.color, wall.bottom, wall.top, wall.obstructed, wall.draw, wall.sector == "null" ? null : this.sectors.has(parseInt(wall.sector)) ? this.sectors.get(parseInt(wall.sector)) : null, this.textureManager.get(wall.wallTextureTop), textureBottom);
                }
            }, this);
            this.callback();
        }).catch((e) => console.error(e));
    }
}