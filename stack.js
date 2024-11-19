class Stack {

    constructor() {
        this.sectors = [];
        this.stack = [];
        this.bounds = [];
        this.zCam = 0;
        this.canMove = true;
    }

    run(dt, bounds, localContext, imageData, sort) {
        this.stack = [];
        this.bounds = [];
        for (let sector of this.sectors) {
            var sign = null;
            var isInside = true;
            for (let line of sector.lines) {
                line.update(0);
                var cross = line.cross(0);
                sign = sign == null ? cross >= 0 : sign;
                isInside = sign && cross < 0 ? false : isInside;
                isInside = !sign && cross >= 0 ? false : isInside;
            }
            if (isInside) {
                this.addSector(sector, bounds);
                break;
            }
        }

        this.zCam = 0;
        this.canMove = true;
        while (this.stack.length > 0) {
            var sector = this.stack.pop();
            sector.update(dt);
            sector.render(localContext, this, this.bounds[sector.id], imageData, sort);
            this.canMove = this.canMove && !sector.collided;
            this.zCam = sector.isInside ? Math.max(this.zCam, sector.zCam) : this.zCam;
        }
    }

    addSector(sector, bounds) {
        if (this.bounds[sector.id] == null) {
            this.bounds[sector.id] = bounds;
            this.stack.push(sector);
            for (let innerSector of sector.innerSectors) {
                this.addSector(innerSector, bounds);
            }
        }
    }
}