
// start of intiating map on to page

var w = 450;
var h = 700;
var projection = d3.geo.albers()
    .center([100.0, 13.5])
    .rotate([0, 24])
    .parallels([5, 21])
    .scale(1200 * 2)
    .translate([-100, 200]);

var path = d3.geo.path().projection(projection);
var t = projection.translate(); // the projection's default translation
var s = projection.scale() // the projection's default scale

var map = d3.select("#vis").append("svg:svg")
    .attr("id", "overlay")
    .attr("width", w)
    .attr("height", h)
    // enable pan zoom
    //- .call(d3.behavior.zoom().on("zoom", redraw));

var axes = map.append("svg:g").attr("id", "axes");

var xAxis = axes.append("svg:line")
    .attr("x1", t[0])
    .attr("y1", 0)
    .attr("x2", t[0])
    .attr("y2", h);

var yAxis = axes.append("svg:line")
    .attr("x1", 0)
    .attr("y1", t[1])
    .attr("x2", w)
    .attr("y2", t[1]);

var thailand = map.append("svg:g").attr("id", "thailand");
var legend = map.append("svg:g").attr("id", "legend");
var accidentMap = map.append("svg:g")
  .attr("id", "accident-map")
  .attr("clip-path", "url(#map-clip)");
var injuryMap = accidentMap.append("svg:g").attr("id", "injury-map");
var casualtyMap = accidentMap.append("svg:g").attr("id", "casualty-map");

var dataset;
var databucket = {};
var province = {};
var province_data = [];

var number_format = d3.format('0,000');
var injured_color = d3.rgb('#FF3F1F');

d3.json("thailand.json", function (json) {

  parse_province(json);

  // draw legend

  thailand.selectAll(".province")
      .data(json.features)
    .enter().append("svg:path")
      .attr("class", function(d) { return "province province-" + d.properties.CHA_NE+' province-'+d.properties.code; })
      .attr("d", path);

  thailand.selectAll(".province-center")
    .data(province_data)
    .enter().append("svg:circle")
      .attr('class', function(d) { return 'province-center'; })
      .attr('cx', function(d) {
        return projection(d.center)[0];
        })
      .attr('cy', function(d) { return projection(d.center)[1]; })
      .attr('r', function(d) { return 0; })
      ;

  // d3.csv("data/100_samples_newyear_casualties"+".csv", function(error, data) {
  d3.csv("data/all-provinces-1000.csv", function(error, data) {
    if (error) { // when data is failed to load, do nothing.
      console.error(error);
    } else {
      // data is loaded successfully, we can start to visualize it.
      console.log(data);
      dataset = data;

      console.log('total data:', dataset.length);
      //- console.log('loading...');

      console.time('bucket');
      // initTimeslotBucket();

      // use it to stop overflow
      // return null;
      console.timeEnd('bucket');

      databucket = dataset;
      startTimelineScene();

    }

  });

});

// function prefilterUtil(data) {
//   var result = {};
//   for (var i = 0, len = data.length; i < len; ++i) {
//     var day = parseInt(data[i]['วันที่เกิดเหตุ']);
//     var hour = parseInt(data[i]['เวลาเกิดเหตุ']);
//     hour = (hour === 24)? 0 : hour;
//     if (!(day in result)){
//       result[day] = {};
//     }
//     if (!(hour in result[day])) {
//       result[day][hour] = [];
//     }
//     result[day][hour].push(data[i]);
//   }
//   console.log(result);
//   return result;
// }
//
// function initTimeslotBucket() {
//   databucket = prefilterUtil(dataset);
// }

function startTimelineScene() {
  var speed = 200;
  var parallelism = 1;
  var counter = 0;

  // var now = [ 28, 0 ];
  var selected_data;
  var selected_counter = 0;

  var intervalId = setInterval(updateTimelineScene, speed);

  // function getNext() {
  //   // console.log("getNext");
  //   console.log(selected_data);
  //   // console.log(selected_counter);
  //
  //   // stops when the date is 4th
  //   if (now[0] == 4) return null;
  //
  //   if (selected_data && selected_counter < selected_data.length) {
  //     console.log("inn");
  //     console.log(selected_data.length);
  //     return selected_data[selected_counter++];
  //   }
  //
  //   console.log(databucket);
  //   // filter data
  //   selected_data = databucket[now[0]] ? databucket[now[0]][now[1]] : [];
  //   selected_counter = 0;
  //
  //   // move to next time slot
  //   now[1]++;
  //   if (now[1] === 24) {
  //     now[0]++;
  //     if (now[0] > 31) now[0] = 1;
  //     now[1] = 0;
  //   }
  //
  //   // console.log(selected_data[selected_counter++]);
  //   console.log(selected_data[0]);
  //   // return selected_data[selected_counter++];
  //   return selected_data[0];
  // }

  function updateTimelineScene() {
    console.log("updateTimelineScene");
    var data;
    var optimizeSpeed = counter > 400;

    var i = 0;
    try {
      console.log("try");
      // for (var i=0, data=getNext(); data && i<parallelism; data=getNext(), i++) {
      data = databucket;
      while (i < data.length) {
        console.log("while");
        // avoid rendering some injury accidents
        // to reduce computation time
        if (optimizeSpeed && i%5 != 0) {
          counter++;
        } else if (shoot(data[i], counter, true)) {
          counter++;
        }
        i++;
      }
    } catch (e) {
      console.log("catch");
    } finally {

    }

    console.log("step 2");
    // step 2
    if (speed != 0 && counter > 25) {
      speed = 50;
      parallelism = 1;
      clearInterval(intervalId);
      intervalId = setInterval(updateTimelineScene, speed);
    }

    // step 3
    if (speed != 0 && counter > 100) {
      speed = 50;
      parallelism = 3;
      clearInterval(intervalId);
      intervalId = setInterval(updateTimelineScene, speed);
    }

    // step 4
    if (speed != 0 && counter > 400) {
      speed = 0;
      parallelism = 200;
      clearInterval(intervalId);
      intervalId = setInterval(updateTimelineScene, speed);
    }

    console.log(counter);
    // finish at date 4
    // if (now[0] === 4) {
    //   clearInterval(intervalId);
    // }
    if (counter === 1000){
      clearInterval(intervalId);
    }

  }
}

function startEmotionalScene() {
  var speed = 200;
  var parallelism = 1;
  var target = 10000;
  var counter = 0;

  var intervalId = setInterval(updateEmotionalScene, speed);
  function updateEmotionalScene() {

    for (var i=0; i<parallelism; i++) {
      if (shoot(Math.floor(Math.random()*90)+10, counter, true)) {
        counter++;
      }
    }

    // $('#total-casualty .count').text(number_format(counter));

    // step 2
    if (speed != 0 && counter > 25) {
      speed = 50;
      parallelism = 1;
      clearInterval(intervalId);
      intervalId = setInterval(updateEmotionalScene, speed);
    }

    // step 3
    if (speed != 0 && counter > 100) {
      speed = 50;
      parallelism = 3;
      clearInterval(intervalId);
      intervalId = setInterval(updateEmotionalScene, speed);
    }

    // step 4
    if (speed != 0 && counter > 400) {
      speed = 0;
      parallelism = 33;
      clearInterval(intervalId);
      intervalId = setInterval(updateEmotionalScene, speed);
    }

    // finish
    if (counter > target) {
      clearInterval(intervalId);
    }
  }
}

function parse_province(data) {
  data.features.forEach(function(f) {
    var id = f.properties.code;
    f.id = id;
    f.region_type = 'province';
    f.center = get_avg_point(f);
    // add to list
    province_data.push(f);
    province[id] = f;
  });
}
function get_coords(province) {
  if (province.geometry.type === 'Polygon') return province.geometry.coordinates[0];
  if (province.geometry.type === 'MultiPolygon') return province.geometry.coordinates[0][0];
  return null;
}
function get_avg_point(province) {
  var xt=0, yt=0;
  var data = get_coords(province);
  //- if (geometry.type === 'Polygon') data = geometry.coordinates[0];
  //- if (geometry.type === 'MultiPolygon') data = geometry.coordinates[0][0];
  data.forEach(function(d) {
    xt += d[0];
    yt += d[1];
  });
  return [ xt/data.length, yt/data.length];
}

// identifying by province_id -> 10 is bkk,...

function shoot(data, order, animate) {

  var province_id = data['รหัสจังหวัด'];
  var p = province[province_id];
  if (!p) return false;
  data.center = path.centroid(p);

  var p_data = [data];
  var dv = Math.log(order+1) * 2;

  // add accident point randomly
  var color = injured_color.hsl().toString();
  var parent = injuryMap;
  var circle = parent.selectAll(".accident-"+order)
    .data(p_data)
    .enter().append("svg:circle")
      .attr('class', function(d) {
        return 'accident accident-dead accident-'+order;
      })
      .attr('cx', function(d) {
        return d.center[0] + Math.random()*dv*2 - dv;
        //- return projection(d.center)[0] + Math.random()*dv*2 - dv;
      })
      .attr('cy', function(d) {;
        return d.center[1] + Math.random()*dv*2 - dv;
        //- return projection(d.center)[1] + Math.random()*dv*2 - dv;
      });
    circle
      .attr('fill', color);

    if (animate) {
      circle
        .attr('r', function(d) { return 3; })
        .transition()
        .attr('r', function(d) { return 1; });
    } else {
      circle
        .attr('r', function(d) { return 1; });
    }
  return true;
}
