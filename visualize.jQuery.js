/**
 * --------------------------------------------------------------------
 * jQuery-Plugin "visualize"
 * by Scott Jehl, scott@filamentgroup.com
 * http://www.filamentgroup.com
 * Copyright (c) 2009 Filament Group 
 * Dual licensed under the MIT (filamentgroup.com/examples/mit-license.txt) and GPL (filamentgroup.com/examples/gpl-license.txt) licenses.
 * 	
 * --------------------------------------------------------------------
 */
(function($) { 
$.fn.visualize = function(options, container){
	return $(this).each(function(){
		//configuration
		var o = $.extend({
			type: 'bar', //also available: area, pie, line
			width: $(this).width(), //height of canvas - defaults to table height
			height: $(this).height(), //height of canvas - defaults to table height
			appendTitle: true, //table caption text is added to chart
			title: null, //grabs from table caption if null
			appendKey: true, //color key is added to chart
			colors: ['#be1e2d','#666699','#92d5ea','#ee8310','#8d10ee','#5a3b16','#26a4ed','#f45a90','#e9e744'],
			textColors: [], //corresponds with colors array. null/undefined items will fall back to CSS
			parseDirection: 'x', //which direction to parse the table data
			pieMargin: 20, //pie charts only - spacing around pie
			pieLabelPos: 'inside',
			lineWeight: 4, //for line and area - stroke weight
			barGroupMargin: 10,
			barMargin: 1 //space around bars in bar chart (added to both sides of bar)
		},options);
		
		//reset width, height to numbers
		o.width = parseInt(o.width,10);
		o.height = parseInt(o.height,10);
		
		
		var self = $(this);
		
		//function to scrape data from html table
		function scrapeTable(){
			var colors = o.colors;
			var textColors = o.textColors;
			var tableData = {
				members: function(){
					var members = [];
					if(o.parseDirection == 'x'){
						self.find('tr:gt(0)').each(function(i){
							members[i] = {};
							members[i].points = [];
							members[i].color = colors[i];
							if(textColors[i]){ members[i].textColor = textColors[i]; }
							$(this).find('td').each(function(){
								members[i].points.push($(this).text()*1);
							});
						});
					}
					else {
						var cols = self.find('tr:eq(1) td').size();
						for(var i=0; i<cols; i++){
							members[i] = {};
							members[i].points = [];
							members[i].color = colors[i];
							if(textColors[i]){ members[i].textColor = textColors[i]; }
							self.find('tr:gt(0)').each(function(){
								members[i].points.push( $(this).find('td').eq(i).text()*1 );
							});
						};
					}
					return members;
				},
				allData: function(){
					var allData = [];
					$(this.members()).each(function(){
						allData.push(this.points);
					});
					return allData;
				},
				dataSum: function(){
					var dataSum = 0;
					var allData = this.allData().join(',').split(',');
					$(allData).each(function(){
						dataSum += parseInt(this,10);
					});
					return dataSum
				},	
				topValue: function(){
						var topValue = 0;
						var allData = this.allData().join(',').split(',');
						$(allData).each(function(){
							if(parseInt(this,10)>topValue) topValue = parseInt(this,10);
						});
						return topValue;
				},
				memberTotals: function(){
					var memberTotals = [];
					var members = this.members();
					$(members).each(function(l){
						var count = 0;
						$(members[l].points).each(function(m){
							count +=members[l].points[m];
						});
						memberTotals.push(count);
					});
					return memberTotals;
				},
				yTotals: function(){
					var yTotals = [];
					var members = this.members();
					var loopLength = this.xLabels().length;
					for(var i = 0; i<loopLength; i++){
						yTotals[i] =[];
						var thisTotal = 0;
						$(members).each(function(l){
							yTotals[i].push(this.points[i]);
						});
						yTotals[i].join(',').split(',');
						$(yTotals[i]).each(function(){
							thisTotal += parseInt(this);
						});
						yTotals[i] = thisTotal;
						
					}
					return yTotals;
				},
				topYtotal: function(){
					var topYtotal = 0;
						var yTotals = this.yTotals().join(',').split(',');
						$(yTotals).each(function(){
							if(parseInt(this,10)>topYtotal) topYtotal = parseInt(this,10);
						});
						return topYtotal;
				},
				xLabels: function(){
					var xLabels = [];
					if(o.parseDirection == 'x'){
						self.find('tr:eq(0) th').each(function(){
							xLabels.push($(this).html());
						});
					}
					else{
						self.find('tr:gt(0) th').each(function(){
							xLabels.push($(this).html());
						});
					}
					return xLabels;
				},
				yLabels: function(){
					var yLabels = [];
					var chartHeight = o.height;
					var numLabels = chartHeight / 30;
					var loopInterval = Math.round(this.topValue() / numLabels);
	
					for(var j=0; j<=numLabels; j++){
						yLabels.push(j*loopInterval);
					}
					if(yLabels[numLabels] != this.topValue()) {
						yLabels.pop();
						yLabels.push(this.topValue());
					}
					return yLabels;
				}			
			};
			
			return tableData;
		};
		
		
		//function to create a chart
		var createChart = {
			pie: function(){	
				
				canvasContain
					.addClass('visualize-pie');
				
				if(o.pieLabelPos == 'outside'){ canvasContain.addClass('visualize-pie-outside'); }	
						
				var centerx = Math.round(canvas.width()/2);
				var centery = Math.round(canvas.height()/2);
				var radius = centery - o.pieMargin;				
				var counter = 0.0;
				var toRad = function(integer){ return (Math.PI/180)*integer; };
				var labels = $('<ul class="visualize-labels"></ul>')
					.insertAfter(canvas);

				//draw the pie pieces
				$.each(memberTotals, function(i){
					var fraction = this / dataSum;
					ctx.beginPath();
					ctx.moveTo(centerx, centery);
					ctx.arc(centerx, centery, radius, 
						counter * Math.PI * 2 - Math.PI * 0.5,
						(counter + fraction) * Math.PI * 2 - Math.PI * 0.5,
		                false);
			        ctx.lineTo(centerx, centery);
			        ctx.closePath();
			        ctx.fillStyle = members[i].color;
			        ctx.fill();
			        // draw labels
			       	var sliceMiddle = (counter + fraction/2);
			       	var distance = o.pieLabelPos == 'inside' ? radius/1.5 : radius +  radius / 5;
			        var labelx = Math.round(centerx + Math.sin(sliceMiddle * Math.PI * 2) * (distance));
			        var labely = Math.round(centery - Math.cos(sliceMiddle * Math.PI * 2) * (distance));
			        var leftRight = (labelx > centerx) ? 'right' : 'left';
			        var topBottom = (labely > centery) ? 'bottom' : 'top';
			        var labeltext = $('<span class="visualize-label">' + Math.round(fraction*100) + '%</span>')
			        	.css(leftRight, 0)
			        	.css(topBottom, 0);
			        var label = $('<li class="visualize-label-pos"></li>')
			       			.appendTo(labels)
			        		.css({left: labelx, top: labely})
			        		.append(labeltext);	
			        labeltext
			        	.css('font-size', radius / 8)		
			        	.css('margin-'+leftRight, -labeltext.width()/2)
			        	.css('margin-'+topBottom, -labeltext.outerHeight()/2);
			        	
			        if(members[i].textColor){ labeltext.css('color', members[i].textColor); }	
			      	counter+=fraction;
				});
			},
			
			line: function(area){
			
				if(area){ canvasContain.addClass('visualize-area'); }
				else{ canvasContain.addClass('visualize-line'); }
			
				//write X labels
				var xInterval = canvas.width() / (xLabels.length -1);
				var xlabelsUL = $('<ul class="visualize-labels-x"></ul>')
					.width(canvas.width())
					.height(canvas.height())
					.insertBefore(canvas);
				$.each(xLabels, function(i){ 
					var thisLi = $('<li><span>'+this+'</span></li>')
						.prepend('<span class="line" />')
						.css('left', xInterval * i)
						.appendTo(xlabelsUL);						
					var label = thisLi.find('span:not(.line)');
					var leftOffset = label.width()/-2;
					if(i == 0){ leftOffset = 0; }
					else if(i== xLabels.length-1){ leftOffset = -label.width(); }
					label
						.css('margin-left', leftOffset)
						.addClass('label');
				});

				//write Y labels
				var yScale = canvas.height() / topValue;
				var liBottom = canvas.height() / (yLabels.length-1);
				var ylabelsUL = $('<ul class="visualize-labels-y"></ul>')
					.width(canvas.width())
					.height(canvas.height())
					.insertBefore(canvas);
					
				$.each(yLabels, function(i){  
					var thisLi = $('<li><span>'+this+'</span></li>')
						.prepend('<span class="line"  />')
						.css('bottom',liBottom*i)
						.prependTo(ylabelsUL);
					var label = thisLi.find('span:not(.line)');
					var topOffset = label.height()/-2;
					if(i == 0){ topOffset = -label.height(); }
					else if(i== yLabels.length-1){ topOffset = 0; }
					label
						.css('margin-top', topOffset)
						.addClass('label');
				});

				//start from the bottom left
				ctx.translate(0,canvas.height());
				//iterate and draw
				$.each(members,function(h){
					ctx.beginPath();
					ctx.lineWidth = o.lineWeight;
					ctx.lineJoin = 'round';
					var points = this.points;
					var integer = 0;
					ctx.moveTo(0,-(points[0]*yScale));
					$.each(points, function(){
						ctx.lineTo(integer,-(this*yScale));
						integer+=xInterval;
					});
					ctx.strokeStyle = this.color;
					ctx.stroke();
					if(area){
						ctx.lineTo(integer,0);
						ctx.lineTo(0,0);
						ctx.closePath();
						ctx.fillStyle = this.color;
						ctx.globalAlpha = .3;
						ctx.fill();
						ctx.globalAlpha = 1.0;
					}
					else {ctx.closePath();}
				});
			},
			
			area: function(){
				createChart.line(true);
			},
			
			bar: function(){
				
				canvasContain.addClass('visualize-bar');
			
				//write X labels
				var xInterval = canvas.width() / (xLabels.length);
				var xlabelsUL = $('<ul class="visualize-labels-x"></ul>')
					.width(canvas.width())
					.height(canvas.height())
					.insertBefore(canvas);
				$.each(xLabels, function(i){ 
					var thisLi = $('<li><span class="label">'+this+'</span></li>')
						.prepend('<span class="line" />')
						.css('left', xInterval * i)
						.width(xInterval)
						.appendTo(xlabelsUL);
					var label = thisLi.find('span.label');
					label.addClass('label');
				});

				//write Y labels
				var yScale = canvas.height() / topValue;
				var liBottom = canvas.height() / (yLabels.length-1);
				var ylabelsUL = $('<ul class="visualize-labels-y"></ul>')
					.width(canvas.width())
					.height(canvas.height())
					.insertBefore(canvas);
				$.each(yLabels, function(i){  
					var thisLi = $('<li><span>'+this+'</span></li>')
						.prepend('<span class="line"  />')
						.css('bottom',liBottom*i)
						.prependTo(ylabelsUL);
						var label = thisLi.find('span:not(.line)');
						var topOffset = label.height()/-2;
						if(i == 0){ topOffset = -label.height(); }
						else if(i== yLabels.length-1){ topOffset = 0; }
						label
							.css('margin-top', topOffset)
							.addClass('label');
				});

				//start from the bottom left
				ctx.translate(0,canvas.height());
				//iterate and draw
				for(var h=0; h<members.length; h++){
					ctx.beginPath();
					var linewidth = (xInterval-o.barGroupMargin*2) / members.length; //removed +1 
					var strokeWidth = linewidth - (o.barMargin*2);
					ctx.lineWidth = strokeWidth;
					var points = members[h].points;
					var integer = 0;
					for(var i=0; i<points.length; i++){
						var xVal = (integer-o.barGroupMargin)+(h*linewidth)+linewidth/2;
						xVal += o.barGroupMargin*2;
						
						ctx.moveTo(xVal, 0);
						ctx.lineTo(xVal, Math.round(-points[i]*yScale));
						integer+=xInterval;
					}
					ctx.strokeStyle = members[h].color;
					ctx.stroke();
					ctx.closePath();
				}
			}
		};
	
		//create new canvas, set w&h attrs (not inline styles)
		var canvas = $('<canvas/>')
			.attr('height',o.height)
			.attr('width',o.width)
			.css({width: o.width, height: o.height});

		
		//create canvas wrapper div, set inline w&h, append
		var canvasContain = (container || $('<div class="visualize" role="presentation" />'))
			.height(o.height)
			.width(o.width)
			.append(canvas);
		
		//scrape table (this should be cleaned up into an obj)
		var tableData = scrapeTable();
		var members = tableData.members();
		var allData = tableData.allData();
		var dataSum = tableData.dataSum();
		var topValue = tableData.topValue();
		var memberTotals = tableData.memberTotals();
		var xLabels = tableData.xLabels();
		var yLabels = tableData.yLabels();
				
		//title/key container
		if(o.appendTitle || o.appendKey){
			var infoContain = $('<div class="visualize-info"></div>')
				.appendTo(canvasContain);
		}
		
		//append title
		if(o.appendTitle){
			var title = o.title || self.find('caption').text();
			$('<div class="visualize-title">'+ title +'</div>')
				.appendTo(infoContain);
		}
		
		//append key
		if(o.appendKey){
			var newKey = $('<ul class="visualize-key"></ul>');
			var selector = (o.parseDirection == 'x') ? 'tr:gt(0) th' : 'tr:eq(0) th' ;
			self.find(selector).each(function(i){
				$('<li><span class="visualize-key-color" style="background: '+members[i].color+'"></span><span class="visualize-key-label">'+ $(this).text() +'</span></li>')
					.appendTo(newKey);
			});
			newKey.appendTo(infoContain);
		};		
		
		//append new canvas to page
		
		if(!container){canvasContain.insertAfter(this); }
		if($.browser.msie){ G_vmlCanvasManager.initElement(canvas[0]); }	
		
		//set up the drawing board	
		var ctx = canvas[0].getContext('2d');
		
		//create chart
		createChart[o.type]();
		
		//clean up some doubled lines that sit on top of canvas borders (done via JS due to IE)
		$('.visualize-line li:first-child span.line, .visualize-line li:last-child span.line, .visualize-area li:first-child span.line, .visualize-area li:last-child span.line, .visualize-bar li:first-child span.line,.visualize-bar .visualize-labels-y li:last-child span.line').css('border','none');
		if(!container){
		//add event for updating
		canvasContain.bind('visualizeRefresh', function(){
			self.visualize(o, $(this).empty()); 
		});
		}
	}).next(); //returns canvas(es)
};
})(jQuery);


