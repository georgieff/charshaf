var http = require("http"),
    fs = require('fs'),
    config_file = __dirname + '/websites.json',
    config_data = require(config_file),
    colors = require('colors');

var to_absolute = function (href, base) {
  if(href.indexOf("/") == 0) {
    return base.replace(/\/$/, "") + href;
  } else {
    return href;
  }
}

var parse_anchors = function(crawl_options) {
  // read each file and parse the needed anchors, then save them to jsons
  fs.readFile( __dirname + "/sites/" + crawl_options['site_name'] + ".txt", function (err, data) {
    if (err) {
      throw err;
    }
    var cheerio = require('cheerio'),
    $ = cheerio.load(data.toString());

    var arr = []
    var content = $(config_data.eq_selector)
      .find('a')
      .each(function() {
        arr.push({
          "href": $(this).attr('href'),
          "text": $(this).text(),
          "url": to_absolute($(this).attr('href'), crawl_options['host'])
        })
      });
      // /save anchors
    fs.writeFile("./sites/anchors_" + crawl_options['site_name'] + '.txt', JSON.stringify(arr));
    console.log(crawl_options['site_name'].bold + ' parsing - done'.green);
  });
}

var crawl_page = function (crawl_options, callback) {
  callback = callback || function(){};
  var data = "";
  http.get(crawl_options['host'], function (http_res) {

    http_res.on("data", function (chunk) {
      //sum the data
      data += chunk;
    });

    http_res.on("end", function () {
      //save page
      fs.writeFile("./sites/" + crawl_options['site_name'] + '.txt', data);
      console.log(crawl_options['site_name'].bold + ' crawling - done'.cyan);
      callback(crawl_options);
    });
  });
}

for(var key in config_data['websites']){
  var website = config_data['websites'][key];
  crawl_page(website, parse_anchors)
}
