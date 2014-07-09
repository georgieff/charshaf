var schedule = require('node-schedule');

var rule = new schedule.RecurrenceRule();
// rule.minute = 51;
rule.hour = 17;

var j = schedule.scheduleJob(rule, function(){
    var exec = require('child_process').exec,
        child;

    child = exec('node ./charshaf.js',
      function (error, stdout, stderr) {
        console.log(stdout + '\n');
        console.log(stderr);
        console.log("\nend\n")
        if (error !== null) {
          console.log('exec error: ' + error);
        }
    });
});
