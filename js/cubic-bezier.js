
(function() {

    var self = window.CubicBezier = function(coordinates) {
        if (typeof coordinates === 'string') {
            if(coordinates.indexOf('#') === 0) {
                coordinates = coordinates.slice(1);
            }
            
            this.coordinates = coordinates.split(',');
        }
        else {
            this.coordinates = coordinates;
        }
        
        if(!this.coordinates) {
            throw 'No offsets were defined';
        }
        
        this.coordinates = this.coordinates.map(function(n) { return +n; });
        
        for(var i=4; i--;) {
            var xy = this.coordinates[i];
            if(isNaN(xy) || (!(i%2) && (xy < 0 || xy > 1))) {
                throw 'Wrong coordinate at ' + i + '(' + xy + ')';
            }
        }
        
        this.coordinates.toString = function() {
            return this.map(self.prettifyNumber) + '';
        }
    };
    
    self.prototype = {
        get P1() {
            return this.coordinates.slice(0, 2);
        },
        
        get P2() {
            return this.coordinates.slice(2);
        },
        
        // Clipped to the range 0-1
        get clipped() {
            var coordinates = this.coordinates.slice();
            
            for(var i=coordinates.length; i--;) {
                coordinates[i] = Math.max(0, Math.min(coordinates[i], 1));
            }
            
            return new self(coordinates);
        },
        
        get inRange() {
            var coordinates = this.coordinates;
    
            return Math.abs(coordinates[1] - .5) <= .5 && Math.abs(coordinates[3] - .5) <= .5;
        },
        
        toString: function() {
            return 'cubic-bezier(' + this.coordinates + ')';
        },
            
        applyStyle: function(element) {
            element.style.setProperty(prefix + 'transition-timing-function', this, null);
        },
    };
    
    Chainvas.extend(self, {
        prettifyNumber: function(val) {
            return (Math.round(val * 100)/100 + '').replace(/^0\./, '.');
        },
        
       
    });
    
    })();
    
    (function(){
    
    var self = window.BezierCanvas = function(canvas, bezier, padding) {
        this.canvas = canvas;
        this.bezier = bezier;
        this.padding = self.getPadding(padding);
        
        // Convert to a cartesian coordinate system with axes from 0 to 1
        var ctx = this.canvas.getContext('2d'),
            p = this.padding;
                
        ctx.scale(canvas.width * (1 - p[1] - p[3]), -canvas.height * (1 - p[0] - p[2]));
        ctx.translate(p[3] / (1 - p[1] - p[3]), -1 - p[0] / (1 - p[0] - p[2]));
    };
    
    self.prototype = {
        get offsets() {
            var p = this.padding, w = this.canvas.width, h = this.canvas.height;
            
            return [{
                left: w * (this.bezier.coordinates[0] * (1 - p[3] - p[1]) - p[3]) + 'px',
                top: h * (1 - this.bezier.coordinates[1] * (1 - p[0] - p[2]) - p[0]) + 'px'
            }, {
                left: w * (this.bezier.coordinates[2] * (1 - p[3] - p[1]) - p[3]) + 'px',
                top: h * (1 - this.bezier.coordinates[3] * (1 - p[0] - p[2]) - p[0]) + 'px'
            }]
        },
        
        offsetsToCoordinates: function(element) {
            var p = this.padding, w = this.canvas.width, h = this.canvas.height;
            
            // Convert padding percentage to actual padding
            p = p.map(function(a, i) { return a * (i % 2? w : h)});
            
            return [
                (parseInt(element.style.left) - p[3]) / (w + p[1] + p[3]),
                (h - parseInt(element.style.top) - p[2]) / (h - p[0] - p[2])
            ];
        },
        
        plot: function(settings) {
            var xy = this.bezier.coordinates,
                ctx = this.canvas.getContext('2d');
            
            var defaultSettings = {
                handleColor: 'rgba(0,0,0,.6)',
                handleThickness: .008,
                bezierColor: 'black',
                bezierThickness: .02
            };
            
            settings || (settings = {});
            
            for (var setting in defaultSettings) {
                (setting in settings) || (settings[setting] = defaultSettings[setting]);
            }
            
            ctx.clearRect(-.5,-.5, 2, 2);
                
            // Draw control handles
            ctx.beginPath().prop({
                fillStyle: settings.handleColor,
                lineWidth: settings.handleThickness,
                strokeStyle: settings.handleColor
            });
            
            ctx.moveTo(0, 0).lineTo(xy[0], xy[1]);
            ctx.moveTo(1,1).lineTo(xy[2], xy[3]);
            
            ctx.stroke().closePath();
            
            ctx.circle(xy[0], xy[1], 1.5 * settings.handleThickness).fill()
               .circle(xy[2], xy[3], 1.5 * settings.handleThickness).fill();
            
            // Draw bezier curve
            ctx.beginPath()
                .prop({
                    lineWidth: settings.bezierThickness,
                    strokeStyle: settings.bezierColor
                }).moveTo(0,0)
                .bezierCurveTo(xy[0], xy[1], xy[2], xy[3], 1,1).stroke()
                .closePath();
        }
        
    };
    
    self.getPadding = function(padding) {
        var p = typeof padding === 'number'? [padding] : padding;
        
        if (p.length === 1) {
            p[1] = p[0];
        }
        
        if (p.length === 2) {
            p[2] = p[0];
        }
        
        if (p.length === 3) {
            p[3] = p[1];
        }
        
        return p;
    }
    
    })();