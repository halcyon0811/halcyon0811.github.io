overview = function(){
    this.initVis();
}  

overview.prototype.initVis = function(){
    this.dendrogram();
    this.fdgram();
}

overview.prototype.dendrogram = function(){
   var svg = d3.select("#dendArea svg").remove();
    var width = 1200;   
var height = 600;  

var cluster = d3.layout.cluster()           
   .size([height-50, width-50]);   
var diagonal = d3.svg.diagonal()           
   .projection (function(d) { return [y(d.x), x(d.y)];});   
var svg = d3.select("#dendArea").append("svg")           
   .attr("width",width)           
   .attr("height",height)
   .attr("align", "center")           
   .append("g")         
   .attr("transform","translate(100,0)");

var xs = [];   
var ys = [];   
function getXYfromJSONTree(node){           
   xs.push(node.x);          
   ys.push(node.y);           
   if(typeof node.children != 'undefined'){                   
      for ( j in node.children){                           
         getXYfromJSONTree(node.children[j]);                   
      }           
   }   
}   
var ymax = Number.MIN_VALUE;   
var ymin = Number.MAX_VALUE;  
var xmax = Number.MIN_VALUE;   
var xmin = Number.MAX_VALUE;  
d3.json("Dendrogram_Data.json", function(error, json){         
   getXYfromJSONTree(json);    
 
   var nodes = cluster.nodes(json);          
   var links = cluster.links(nodes);           
   nodes.forEach( function(d,i){                   
      if(typeof xs[i] != 'undefined'){                           
         d.x = xs[i];                   
      }                   
      if(typeof ys[i] != 'undefined'){                           
         d.y = ys[i];                   
      }           
   });           
   nodes.forEach( function(d){                   
      if(d.y > ymax)
         ymax = d.y;
      if(d.y < ymin)                           
         ymin = d.y;   
      if(d.x > xmax)
         xmax = d.x;
      if(d.x < xmin)                           
         xmin = d.x;           
   });           
   x = d3.scale.linear().domain([ymin, ymax]).range([100, height-100]);           
   xinv = d3.scale.linear().domain([ymax, ymin]).range([100, height-100]);
   y = d3.scale.linear().domain([xmin, xmax+200]).range([100, width-100]);           
   var link = svg.selectAll(".link")                  
      .data(links)                   
      .enter().append("path")                   
      .attr("class","link")                   
      .attr("d", diagonal);           
   var node = svg.selectAll(".node")                  
      .data(nodes)                   
      .enter().append("g")                   
      .attr("class","node")                   
      .attr("transform", function(d) {                     
         return "translate(" + y(d.x) + "," + x(d.y) + ")";               
      });           
   node.append("circle")                   
      .attr("r", 4.5);           
   node.append("text")                   
      .attr("dx", function(d) { return d.children ? 20 : -20; })                   
      .attr("dy", 20)                  
      //.style("text-anchor", function(d) { return d.children ? "end" : "start"; })           
      .text( function(d){ return d.name;});       
   var g = svg.append("g")            
      //.attr("transform","translate(100,600)");       
   g.append("line")            
      .attr("x1",50)           
      .attr("y1",xinv(ymax))            
      .attr("x2",50)            
      .attr("y2",xinv(ymin));       
   g.selectAll(".ticks")            
      .data(x.ticks(5))           
      .enter().append("line")            
      .attr("class","ticks")            
      .attr("x1", 50)           
      .attr("y1", function(d) { return xinv(d); })            
      .attr("x2", 53)            
      .attr("y2", function(d) {return xinv(d); });       
   g.selectAll(".label")            
      .data(x.ticks(5))            
      .enter().append("text")            
      .attr("class","label")            
      .text(String)            
      .attr("x", 35)            
      .attr("y", function(d) {return xinv(d); })           
	  .style("font-size", "12px")
      .attr("text-anchor","middle"); });
}

overview.prototype.fdgram = function(){

   var svg = d3.select("#forceArea svg").remove();
   var svg = d3.select("#forceArea").append("svg")
               .attr("align", "center")
               .attr("width", "1200")
               .attr("height", "500");


    d3.json("marketOverview/Force_Directed_Data.json", function(error, graph){
       if(error) throw error;

       var index = [];
       for(var m=0; m<graph.nodes.length;m++){
          index[m] = {"id": graph.nodes[m].id, "num": m}
       }

       for(var i = 0; i< graph.links.length; i++){
          for(var j=0; j<index.length; j++){
             if(graph.links[i].source == index[j].id){
               graph.links[i].source = index[j].num;
             }
             if(graph.links[i].target == index[j].id){
               graph.links[i].target = index[j].num;
             }
          }
       }

         var force = d3.layout.force()
                           .nodes(graph.nodes)
                           .links(graph.links)
                           .size([800, 500])
                           .linkDistance(120)
                           .linkStrength(0.1)
                           .friction(0.9)
                           .charge([-400]);
         
         force.start();

         //add lines
         var svg_edges = svg.selectAll("line")
                           .data(graph.links)
                           .enter()
                              .append("line")
                              .style("stroke","#ccc")
                              .style("stroke-width",1);
         var color = d3.scale.category20();

         //add nodes
         var svg_nodes = svg.selectAll("circle")
                           .data(graph.nodes)
                           .enter()
                           .append("circle")
                           .attr("r",10)
                           .style("fill",function(d,i){
                                 return color(d.group);
                           })
                           .call(force.drag);

         //add labels
         var svg_texts = svg.selectAll("text")
                           .data(graph.nodes)
                           .enter()
                           .append("text")
                           .style("fill", "black")
                           .attr("dx", 20)
                           .attr("dy", 8)
                           .text(function(d){
                              return d.id;
                           });
         force.on("tick", function(){
            svg_edges.attr("x1",function(d){ return d.source.x; })
               .attr("y1",function(d){ return d.source.y; })
               .attr("x2",function(d){ return d.target.x; })
               .attr("y2",function(d){ return d.target.y; });

            svg_nodes.attr("cx",function(d){ return d.x; })
               .attr("cy",function(d){ return d.y; });

            svg_texts.attr("x", function(d){ return d.x; })
               .attr("y", function(d){ return d.y; });
         });
    });
}
 