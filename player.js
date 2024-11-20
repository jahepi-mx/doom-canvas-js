class Player {
    
    constructor(offsetx, offsety) {
        this.toRadians = Math.PI / 180;
        this.toDegrees = 180 / Math.PI;
        this.degrees = 0;
        this.position = new Vector(0, 0);
        this.velocity = new Vector(200, 120);
        this.left = this.right = this.up = false;
        this.offset = new Vector(offsetx, offsety);
        this.size = new Vector(10, 10);

        this.xAxis = new Vector(Math.cos((this.degrees - 90) * this.toRadians), Math.sin((this.degrees - 90) * this.toRadians));
        this.yAxis = new Vector(Math.cos(this.degrees * this.toRadians), Math.sin(this.degrees * this.toRadians));
        this.invXAxis = new Vector(0, 0);
        this.invYAxis = new Vector(0, 0);

        this.fovDegrees = 45;
        this.fovLen = 2700;
        this.fovLeft = new Line(0, 0, 0, 0, 0, 0, 'green', this);
        this.fovRight = new Line(0, 0, 0, 0, 0, 0, 'green', this);
        this.fovTop = new Line(0, 0, 0, 0, 0, 0, 'green', this);
        this.wallSensor = new Line(0, 0, 0, 0, 0, 0, 'pink', this);
        this.canMove = false;

        this.tmpLocalPos = new Vector(0, 0);
    }

    update(dt) {

        if (this.left) {
            this.degrees -= this.velocity.y * dt;
        }
        if (this.right) {
            this.degrees += this.velocity.y * dt;
        }

        this.yAxis.x = Math.cos(this.degrees * this.toRadians);
        this.yAxis.y = Math.sin(this.degrees * this.toRadians);
        this.xAxis.x = Math.cos((this.degrees - 90) * this.toRadians);
        this.xAxis.y = Math.sin((this.degrees - 90) * this.toRadians);

        this.invXAxis.x = this.xAxis.x;
        this.invXAxis.y = this.yAxis.x;
        this.invYAxis.x = this.xAxis.y;
        this.invYAxis.y = this.yAxis.y;

        var radL = (this.degrees + this.fovDegrees) * this.toRadians;
        var radR = (this.degrees - this.fovDegrees) * this.toRadians;
        
        this.fovLeft.updateState(this.offset.x, this.offset.y, this.position.x, this.position.y, this.position.x + Math.cos(radL) * this.fovLen, this.position.y + Math.sin(radL) * this.fovLen);
        this.fovRight.updateState(this.offset.x, this.offset.y, this.position.x, this.position.y, this.position.x + Math.cos(radR) * this.fovLen, this.position.y + Math.sin(radR) * this.fovLen);
        this.fovTop.updateState(this.offset.x, this.offset.y, this.fovLeft.position2.x, this.fovLeft.position2.y, this.fovRight.position2.x, this.fovRight.position2.y);
        this.wallSensor.updateState(this.offset.x, this.offset.y, this.position.x, this.position.y, this.position.x + this.yAxis.x * 10, this.position.y + this.yAxis.y * 10);
        this.fovLeft.update(dt);
        this.fovRight.update(dt);
        this.fovTop.update(dt);
        this.wallSensor.update(dt);

        if (this.up && this.canMove) {
            this.position.x += this.yAxis.x * this.velocity.x * dt;
            this.position.y += this.yAxis.y * this.velocity.x * dt;
        }
    }

    localRender(context) {

        var x = this.offset.x - this.size.x * 0.5;
        var y = this.offset.y - this.size.y * 0.5;
        context.fillStyle = "red";
        context.fillRect(x, y, this.size.x, this.size.y);

        context.lineWidth = 2;
        context.strokeStyle = 'red';

        var newPos = this.convertToLocal(this.xAxis.x, this.xAxis.y, false);
        context.beginPath();
        context.moveTo(this.offset.x, this.offset.y);
        context.lineTo(this.offset.x + newPos.x * 30, this.offset.y - newPos.y * 30);
        context.stroke();

        newPos = this.convertToLocal(this.yAxis.x, this.yAxis.y, false);
        context.beginPath();
        context.moveTo(this.offset.x, this.offset.y);
        context.lineTo(this.offset.x + newPos.x * 30, this.offset.y - newPos.y * 30);
        context.stroke();

        this.fovLeft.localRender(context);
        this.fovRight.localRender(context);
        this.fovTop.localRender(context);
    }

    convertToLocal(x, y, hasOffset) {
        if (hasOffset) {
            x += this.position.x * -1;
            y += this.position.y * -1;
        }
        var nx = x * this.invXAxis.x + y * this.invYAxis.x;
        var ny = x * this.invXAxis.y + y * this.invYAxis.y;
        return new Vector(nx, ny);
    }

    convertToWorld(x, y) {
        //x.x * x, x.y * x
        //y.x * y, y.y * y
        this.tmpLocalPos.x = (x * this.xAxis.x + y * this.yAxis.x) + this.position.x;
        this.tmpLocalPos.y = (x * this.xAxis.y + y * this.yAxis.y) + this.position.y;
        return this.tmpLocalPos;
    }
}