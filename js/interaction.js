
(function() {

    var self = window.bezierLibrary = {
        curves: {},
        
        render: function() {
            var items = $$('a', library);
            
            for(var i=items.length; i--;) {
                library.removeChild(items[i]);
            }
            
            for (var name in self.curves) {
                try { var bezier = new CubicBezier(self.curves[name]); }
                catch(e) { continue; }
                
                self.add(name, bezier);
            }
        },
        
        add: function (name, bezier) {
            var canvas = document.createElement('canvas').prop({
                    width:100,
                    height:100
                }),
                a = document.createElement('a').prop({
                    href: '#' + bezier.coordinates,
                    bezier: bezier,
                    bezierCanvas: new BezierCanvas(canvas, bezier, .15)
                });
            
            if(!bezier.applyStyle) console.log(bezier);
            bezier.applyStyle(a);
            
            library.insertBefore(a, $('footer', library));
            
            a.appendChild(canvas)
            
            a.appendChild(document.createElement('span').prop({
                textContent: name,
                title: name
            }));
            
           
            
            a.bezierCanvas.plot(self.thumbnailStyle);
            
            a.onclick = this.selectThumbnail;
            
          
        },
        
        selectThumbnail: function() {
            var selected = $('.selected', this.parentNode);
            
            if (selected) {
                selected.classList.remove('selected');
                selected.bezierCanvas.plot(self.thumbnailStyle);
            }
            
            this.classList.add('selected');
            
            this.bezierCanvas.plot(self.thumbnailStyleSelected);
            
            compare.style.cssText = this.style.cssText;
    
          
    
            compareCanvas.bezier = this.bezier;
            
            compareCanvas.plot({
                handleColor: 'rgba(255,255,255,.5)',
                bezierColor: 'white',
                handleThickness: .03,
                bezierThickness: .06
            });
        },
        
        deleteItem: function(a) {
            var name = $('span', a).textContent;
                                
            delete bezierLibrary.curves[name];
    
            bezierLibrary.save();
            
            library.removeChild(a);
            
            if (a.classList.contains('selected')) {	
                $('a:first-of-type', library).onclick();
            }
        },
        
        save: function(curves) {
            localStorage.curves = JSON.stringify(curves || self.curves);
        },
        
        thumbnailStyle: {
            handleColor: 'rgba(0,0,0,.3)',
            handleThickness: .018,
            bezierThickness: .032
        },
        
        thumbnailStyleSelected: {
            handleColor: 'rgba(255,255,255,.6)',
            bezierColor: 'white',
            handleThickness: .018,
            bezierThickness: .032
        }
    };
    
    })();
    
    /**
     * Init
     */
    
    // Ensure global vars for ids (most browsers already do this anyway, so…)
    [
        'values', 'curve','P1','P2', 'current', 'compare', 'duration', 
        'library', 'save', 'copy', 'copyoptionstoggle', 'copybuttons', 'copyoptions', 'copystatement', 'copycss', 'copyvalue', 'go', 'import', 'export','compareCurve', 'json', 'importexport'
    ].forEach(function(id) { window[id] = $('#' + id); });
    
    var ctx = curve.getContext("2d"),
        bezierCode = $('h1 code'),
        curveBoundingBox = curve.getBoundingClientRect(),
        bezierCanvas = new BezierCanvas(curve, null, [.25, 0]),
        currentCanvas = new BezierCanvas(current, null, .15),
        compareCanvas = new BezierCanvas(compare, null, .15),
        favicon = document.createElement('canvas'),
        faviconCtx = favicon.getContext('2d'),
        pixelDepth = window.devicePixelRatio || 1;
    
    // Add predefined curves
    if (!localStorage.curves) {
        bezierLibrary.save(CubicBezier.predefined);
    }
    
    bezierLibrary.curves = JSON.parse(localStorage.curves);
    
    bezierLibrary.render();
    
    if(location.hash) {
        bezierCanvas.bezier = window.bezier = new CubicBezier(decodeURI(location.hash));
        
        var offsets = bezierCanvas.offsets;
        
        P1.style.prop(offsets[0]);
        P2.style.prop(offsets[1]);
    }
    
    favicon.width = favicon.height = 16 * pixelDepth;
    
    update();
    updateDelayed();
    
    /**
     * Event handlers
     */
    // Make the handles draggable
    P1.onmousedown = 
    P2.onmousedown = function() { 
        var me = this;
        
        document.onmousemove = function drag(e) {
            var x = e.pageX, y = e.pageY,
                left = curveBoundingBox.left,
                top = curveBoundingBox.top;
            
            if (x === 0 && y == 0) {
                return;
            }
            
            // Constrain x
            x = Math.min(Math.max(left, x), left + curveBoundingBox.width);
            
            me.style.prop({
                left: x - left + 'px',
                top: y - top + 'px'
            });
            
            update();
        };
        
        document.onmouseup = function () {
            me.focus();
            
            document.onmousemove = document.onmouseup = null;
        }
    };
    
    P1.onkeydown =
    P2.onkeydown = function(evt) {
        var code = evt.keyCode;
        
        if(code >= 37 && code <= 40) {
            evt.preventDefault();
            
            // Arrow keys pressed
            var left = parseInt(this.style.left),
                top = parseInt(this.style.top)
                offset = 3 * (evt.shiftKey? 10 : 1);
    
            switch (code) {
                case 37: this.style.left = left - offset + 'px'; break;
                case 38: this.style.top = top - offset + 'px'; break;
                case 39: this.style.left = left + offset + 'px'; break;
                case 40: this.style.top = top + offset + 'px'; break; 
            }
            
            update();
            updateDelayed();
            
            return false;
        }
    };
    
    P1.onblur =
    P2.onblur =
    P1.onmouseup =
    P2.onmouseup = updateDelayed;
    
    curve.onclick = function(evt) {
        var left = curveBoundingBox.left,
            top = curveBoundingBox.top,
            x = evt.pageX - left, y = evt.pageY - top;
            
        // Find which point is closer
        var distP1 = distance(x, y, parseInt(P1.style.left), parseInt(P1.style.top)),
            distP2 = distance(x, y, parseInt(P2.style.left), parseInt(P2.style.top));
    
        (distP1 < distP2? P1 : P2).style.prop({
            left: x + 'px',
            top: y + 'px'
        });
        
        update();
        updateDelayed();
        
        function distance(x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        }
    };
    
    curve.onmousemove = function(evt) {
        var left = curveBoundingBox.left,
            top = curveBoundingBox.top,
            height = curveBoundingBox.height,
            x = evt.pageX - left, y = evt.pageY - top;
        
        this.parentNode.setAttribute('data-time', Math.round(100 * x / curveBoundingBox.width));
        this.parentNode.setAttribute('data-progression', Math.round(100 * (3*height/4 - y) / (height * .5)));
    };
 
   
    
 
    
    go.onclick = function() {
        updateDelayed();
        
        current.classList.toggle('move');
            
        compare.classList.toggle('move');
    };
    
  

   
 

    
   
    
    /**
     * Helper functions
     */
    
 
    
    function update() {
        // Redraw canvas
        bezierCanvas.bezier = 
        currentCanvas.bezier = 
        window.bezier = new CubicBezier(
            bezierCanvas.offsetsToCoordinates(P1)
            .concat(bezierCanvas.offsetsToCoordinates(P2))
        );
        
        bezierCanvas.plot();
        
     
    
    
        
        var params = $$('.param', bezierCode), 
            prettyOffsets = bezier.coordinates.toString().split(',');
        
        for(var i=params.length; i--;) {
            params[i].textContent = prettyOffsets[i]; 
        }
    }
    
    
    // For actions that can wait
    function updateDelayed() {
        bezier.applyStyle(current);
        
        var hash = '#' + bezier.coordinates,
            size = 16 * pixelDepth;
        
       
        
        if(history.pushState) {
            history.pushState(null, null, hash);
        }
        else {
            location.hash = hash;
        }
    
        
    
        
     
    }