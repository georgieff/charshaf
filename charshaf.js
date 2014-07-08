var http = require("http"),
    fs = require('fs'),
    config_file = __dirname + '/websites.json',
    config_data = require(config_file),
    colors = require('colors'),
    scrapped_arr = [];

var to_absolute = function (href, base) {
  if(href.indexOf("/") == 0) {
    return base.replace(/\/$/, "") + href;
  } else {
    return href;
  }
}

var remove_file = function (file_name, callback) {
  callback = callback || function () {};
  fs.exists(file_name, function(exists) {
    if (exists) {
      fs.unlinkSync(file_name)
    }
    callback();
  });
}

var parse_anchors = function(crawl_options, callback) {
  // read each file and parse the needed anchors, then save them to jsons
  fs.readFile( __dirname + "/sites/" + crawl_options['site_name'] + ".txt", function (err, data) {
    if (err) {
      throw err;
    }
    var cheerio = require('cheerio'),
    $ = cheerio.load(data.toString());

    var arr = [];

    var content = $(config_data.eq_selector)
    .find('a');
    content.each(function() {
      arr.push({
        "href": $(this).attr('href'),
        "text": $(this).text().trim(),
        "url": to_absolute($(this).attr('href'), crawl_options['host'])
      })
    });
      // /save anchors
      remove_file("./sites/anchors_" + crawl_options['site_name'] + '.json', function () {
        fs.writeFileSync("./sites/anchors_" + crawl_options['site_name'] + '.json', JSON.stringify(arr));
        console.log(crawl_options['site_name'].bold + ' parsing - done. '.green + content.length.toString().white.bold + " anchors added".green );
        scrapped_arr[crawl_options['site_name']] = arr;
        callback();
      });
    });
}

var crawl_page = function (crawl_options, callback) {
  callback = callback || function(){};
  var data = "";
  http.get(crawl_options['host'], function (http_res) {

    http_res.on("data", function (chunk) {
      //sum the content
      data += chunk;
    });

    http_res.on("end", function () {
      //save page
      fs.writeFileSync("./sites/" + crawl_options['site_name'] + '.txt', data);
      console.log(crawl_options['site_name'].bold + ' crawling - done'.cyan);
      callback(crawl_options);
    });
  });
}

//check if sites folder doesn't exist
if (!fs.existsSync("./sites/")) {
  fs.mkdirSync("./sites/")
}

function asyncLoop(iterations, func, callback) {
  var index = 0;
  var done = false;
  var loop = {
    next: function() {
      if (done) {
        return;
      }

      if (index < iterations) {
        index++;
        func(loop);

      } else {
        done = true;
        callback();
      }
    },

    iteration: function() {
      return index - 1;
    },

    break: function() {
      done = true;
      callback();
    }
  };
  loop.next();
  return loop;
}

function compare_anchors(scrapped_arr, config_data) {
  website_anchors = scrapped_arr[config_data['websites'][0]['site_name']];
  website_anchors.forEach(function(anchor) {
    for (var i = config_data['websites'].length - 1; i > 0; i--) {
      var found_it = false,
          website_anchors_tocompare = scrapped_arr[config_data['websites'][i]['site_name']];
      website_anchors_tocompare.forEach(function(anchor_tocompare) {
        if(anchor.text == anchor_tocompare.text && anchor.url == anchor_tocompare.url) {
          found_it = true;
          return;
        }
      });
      if(!found_it) {
        console.log("[FAIL]".red + " with " + anchor.text.yellow + " on " + config_data['websites'][0]['host'].grey + " and " + config_data['websites'][i]['host'].grey);
      }
    };
  });
}

asyncLoop(config_data['websites'].length, function(loop) {
  var website = config_data['websites'][loop.iteration()];
  crawl_page(website, function(crawl_options) {
    parse_anchors(crawl_options, function() {
      loop.next();
    });
  })},
  function() {
    compare_anchors(scrapped_arr, config_data);
  }
);
