var http = require("http"),
    fs = require('fs'),
    config_file = __dirname + '/websites.json',
    config_data = require(config_file),
    colors = require('colors'),
    scrapped_arr = [],
    email_config   = require("emailjs/email"),
    mail_server  = email_config.server.connect({
       user:    "",
       password:"",
       host:    "192.168.0.112" //set your smtp. more info here: https://github.com/eleith/emailjs
    });

var system_message = function (message, type) {
  type = type || "system";
  console.log("[".grey + type.grey + "] ".grey + message);
}
var remove_duplicates = function (array_to_merge) {
  var temp = new Array();
  label:for (i=0;i<array_to_merge.length;i++) {
        for (var j=0; j<temp.length;j++ ) {//check duplicates
            if (temp[j]==array_to_merge[i])//skip if already present
               continue label;
        }
        temp[temp.length] = array_to_merge[i];
  }
  return temp;
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

var to_absolute = function (href, base) {
  // remove last character if href finishes on "/"
  if (href.slice(-1) == "/") href = href.slice(0, -1);
  //if it starts on "/" - it's probably relative
  if (href.indexOf("/") == 0 && href.indexOf("//") != 0) {
    return base.replace(/\/$/, "") + href;
  }
  //but if it starts with "//" it's another domain : )
  else if (href.indexOf("//") == 0) {
    return base.split("/")[0] + href;
  }
  else {
    return href;
  }
}

var merge_subscribers = function (main_list, first_list, second_list) {
  if (!main_list) main_list = [];
  if (!first_list) first_list = [];
  if (!second_list) second_list = [];
  return remove_duplicates(main_list.concat(first_list, second_list));
}

var send_mail = function (server, email_to, email_text) {
  server.send({
     from:    "WCAT Reporting <noreply@telerik.com>",
     to:      email_to,
     subject: "Anchors Consistency Report",
     text:    email_text
  }, function(err, message) {
    if (err) system_message(err);
  });
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
      //save anchors
      remove_file("./sites/anchors_" + crawl_options['site_name'] + '.json', function () {
        fs.writeFileSync("./sites/anchors_" + crawl_options['site_name'] + '.json', JSON.stringify(arr));
        system_message(crawl_options['site_name'].bold + ' parsing - done. '.green + content.length.toString().white.bold + " anchors added".green, "parser");
        scrapped_arr[crawl_options['site_name']] = arr;
        callback();
      });
    });
}

var crawl_page = function (crawl_options, callback) {
  callback = callback || function() {};
  var data = "";
  http.get(crawl_options['host'], function (http_res) {

    http_res.on("data", function (chunk) {
      //sum the content
      data += chunk;
    });

    http_res.on("end", function () {
      //save page
      fs.writeFileSync("./sites/" + crawl_options['site_name'] + '.txt', data);
      system_message(crawl_options['site_name'].bold + ' crawling - done'.cyan, "crawler");
      callback(crawl_options);
    });
  });
}

//check if sites folder doesn't exist
if (!fs.existsSync("./sites/")) {
  fs.mkdirSync("./sites/")
}

function compare_anchors(scrapped_arr, config_data) {
  var found_errors = [];
  website_anchors = scrapped_arr[config_data['websites'][0]['site_name']];
  website_anchors.forEach(function(anchor) {
    for (var i = config_data['websites'].length - 1; i > 0; i--) {
      var found_it = false,
      website_anchors_tocompare = scrapped_arr[config_data['websites'][i]['site_name']];
      website_anchors_tocompare.forEach(function(anchor_tocompare) {
        if (anchor.text == anchor_tocompare.text && anchor.url == anchor_tocompare.url) {
          found_it = true;
          return;
        }
      });
      //if we didn't find the equal log it as a error
      if (!found_it) {
        system_message("[FAIL]".red + " with " + anchor.text.yellow + " on " + config_data['websites'][0]['host'].grey + " and " + config_data['websites'][i]['host'].grey);
        var error_message = "Different \"" + anchor.text + "\" anchor on " + config_data['websites'][0]['host'] + " and " + config_data['websites'][i]['host'];
        var subscribers = merge_subscribers(config_data['subscribers'],config_data['websites'][0]['subscribers'], config_data['websites'][i]['subscribers']);

        subscribers.forEach(function(subscriber) {
          if (!found_errors[subscriber]) found_errors[subscriber] = [];
          found_errors[subscriber] += (error_message + "\n")
        });
      }
    };
  });
  return found_errors;
}

asyncLoop(config_data['websites'].length, function(loop) {
  var website = config_data['websites'][loop.iteration()];
  crawl_page(website, function(crawl_options) {
    parse_anchors(crawl_options, function() {
      loop.next();
    });
  })},
  function() {
    var errors_lists = compare_anchors(scrapped_arr, config_data),
        has_errors = false;
    for (subscriber_mail in errors_lists) {
      // send_mail(mail_server, subscriber_mail, errors_lists[subscriber_mail]);
      system_message("Email to " + subscriber_mail.grey + "... sent.");
      has_errors = true;
    }
    if (!has_errors) system_message("The day has just become even more amazing!".green);
  }
);
