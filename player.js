class Player {
    
    constructor(offsetx, offsety) {
        this.toRadians = Math.PI / 180;
        this.toDegrees = 180 / Math.PI;
        this.degrees = 90;
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
        this.fovLen = 1500;
        this.fovLeft = null;
        this.fovRight = null;
        this.fovCenter = null;
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

        this.fovLeft = new Line(this.offset.x, this.offset.y, this.position.x, this.position.y, this.position.x + Math.cos((this.degrees + this.fovDegrees) * this.toRadians) * this.fovLen, this.position.y + Math.sin((this.degrees + this.fovDegrees) * this.toRadians) * this.fovLen, 'green', this);
        this.fovRight = new Line(this.offset.x, this.offset.y, this.position.x, this.position.y, this.position.x + Math.cos((this.degrees - this.fovDegrees) * this.toRadians) * this.fovLen, this.position.y + Math.sin((this.degrees - this.fovDegrees) * this.toRadians) * this.fovLen, 'green', this);
        this.fovCenter = new Line(this.offset.x, this.offset.y, this.fovLeft.position2.x, this.fovLeft.position2.y, this.fovRight.position2.x, this.fovRight.position2.y, 'green', this);
        this.fovLeft.update(dt);
        this.fovRight.update(dt);
        this.fovCenter.update(dt);

        if (this.up) {
            this.position.x += this.yAxis.x * this.velocity.x * dt;
            this.position.y += this.yAxis.y * this.velocity.x * dt;
        }
    }

    render(context) {
        var x = this.offset.x + this.position.x - this.size.x * 0.5;
        var y = this.offset.y - (this.position.y + this.size.y * 0.5);
        context.fillStyle = "red";
        context.fillRect(x, y, this.size.x, this.size.y);

        context.lineWidth = 2;
        context.strokeStyle = 'red';

        context.beginPath();
        context.moveTo(this.offset.x + this.position.x, this.offset.y - this.position.y);
        context.lineTo(this.offset.x + this.position.x + this.xAxis.x * 30, this.offset.y - (this.position.y + this.xAxis.y * 30));
        context.stroke();

        context.beginPath();
        context.moveTo(this.offset.x + this.position.x, this.offset.y - this.position.y);
        context.lineTo(this.offset.x + this.position.x + this.yAxis.x * 30, this.offset.y - (this.position.y + this.yAxis.y * 30));
        context.stroke();

        this.fovLeft.render(context);
        this.fovRight.render(context);
        this.fovCenter.render(context);
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
        this.fovCenter.localRender(context);
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
        var nx = x * this.xAxis.x + y * this.yAxis.x;
        var ny = x * this.xAxis.y + y * this.yAxis.y;
        nx += this.position.x;
        ny += this.position.y;
        return new Vector(parseInt(nx), parseInt(ny));
    }
}