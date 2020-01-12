var mysql = require('mysql');
var express = require('express');
var app = express();
var path = require('path');
var pug = require('ejs');
var PORT = process.env.PORT || 8080;
var session = require('express-session');
var connection  = require('express-myconnection'); 
var bodyParser = require('body-parser');
app.use(bodyParser());

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));


app.use(
    connection(mysql,{

        host: '127.0.0.1',
        user: 'itches',
        password : '2525',
        port : 3306, //port mysql
        database:'justcheck'
},'chester')
);
// var con = mysql.createConnection({
//     host: "127.0.0.1",
//     port: 3306,
//     user: "itches",
//     password: "2525",
//     database: 'justcheck'
//     // insecureAuth: true
// });

// var con = mysql.createConnection({
//     host: "remotemysql.com",
//     // port: 3306,
//     user: "lxKMWpFBrq",
//     password: "xzjvYPxZ7d",
//     database: 'lxKMWpFBrq',
//     insecureAuth: true
// });

con.connect(function (err) {
    console.log("Connected!");
});
app.set('view engine', 'ejs');
app.set('views', './client');
app.use(express.static(path.join(__dirname, './client')));
app.get('/', function (request, response) {
    if (request.session.loggedin) {
        response.redirect('/home');
    } else {
        response.render('index', {})
    }
    response.end();

});

app.post('/login', function (request, response) {
    var username = request.body.id;
    var password = request.body.password;
    if (username && password) {
        username = username.toUpperCase();
        var check = username.indexOf("B");
        console.log(check);
        if (check == 0) {
            con.query('SELECT * FROM student WHERE student_id = ? AND student_password = ?', [username, password], function (error, results, fields) {
                if (results != '') {
                    request.session.loggedin = 'student';
                    request.session.username = username;
                    response.redirect('/home');
                } else { // con.end();
                    response.redirect('/');

                }
                response.end();
            });
        } else {
            con.query('SELECT * FROM teacher WHERE teacher_id = ? AND teacher_password = ?', [username, password], function (error, results, fields) {
                if (results != '') {
                    request.session.loggedin = 'teacher';
                    request.session.username = username;
                   
                    response.redirect('/home');
                } else { // con.end();
                    response.end();
                    response.redirect('/');

                }
                response.end();
            });
        }

    } else {

        response.end();
        response.redirect('/');
    }
});

app.post('/register', function (request, response) {
    var studentId = request.body.studentId;
    var rpassword = request.body.rpassword;
    var fName = request.body.fName;
    var lName = request.body.lName;
    var eMail = request.body.eMail;
    var phone = request.body.phone;
    var sql = "INSERT INTO student VALUES (?,?,?,?,?,?,?)";
    // var values = [studentId.toUpperCase(),rpassword,fName.toUpperCase(),lName.toUpperCase(),eMail,phone,'default'];
    con.query(sql, [studentId.toUpperCase(), rpassword, fName.toUpperCase(), lName.toUpperCase(), phone, eMail, 'default'], function (err, result) {
        if (err) throw err;
        console.log("1 record inserted, " + studentId.toUpperCase());
        response.end();
        response.redirect('/');
    });
});

app.post('/addclass', function (request, response) {
    var classid = request.body.classid;
    var classname = request.body.classname;
    var day = request.body.day;
    var beginh = [];
    var beginm = [];
    var endh = [];
    var endm = [];
    var addday = "";
    // console.log(Array.isArray(day));
    if (Array.isArray(day)) {
        for (let index = 0; index < day.length; index++) {
            beginh.push(day[index] + "BeginHours");
            beginm.push(day[index] + "BeginMin");
            endh.push(day[index] + "EndHours");
            endm.push(day[index] + "EndMin");
        }
        for (let index = 0; index < day.length; index++) {
            // console.log(request.body,beginh[index]);
            if (index + 1 == day.length) {
                addday += day[index] + " " + request.body[beginh[index]] + ":" + request.body[beginm[index]] + " to " + request.body[endh[index]] + ":" + request.body[endm[index]];
            } else {
                addday += day[index] + " " + request.body[beginh[index]] + ":" + request.body[beginm[index]] + " to " + request.body[endh[index]] + ":" + request.body[endm[index]] + " , ";
            }
        }
    }
    else {
        beginh.push(day + "BeginHours");
        beginm.push(day + "BeginMin");
        endh.push(day + "EndHours");
        endm.push(day + "EndMin");
        addday += day + " " + request.body[beginh[0]] + ":" + request.body[beginm[0]] + " to " + request.body[endh[0]] + ":" + request.body[endm[0]]
    }



    // var lName = request.body.lName;
    // var eMail = request.body.eMail;
    // var phone = request.body.phone;
    // console.log(addday);
    var sql = "INSERT INTO class_detail VALUES (" + classid + ",'" + classname.toUpperCase() + "','" + addday + "','XXXXX',0,'" + request.session.username + "')";
    // // var values = [studentId.toUpperCase(),rpassword,fName.toUpperCase(),lName.toUpperCase(),eMail,phone,'default'];
    console.log(sql);
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted, " + classid);
        response.end();
        response.redirect('/');
    });
});

app.get('/home', function (request, response) {
    // var text = "";
    // response.setHeader('content-type', 'application/json');
    if (request.session.loggedin == 'student') {
        response.send('Welcome student, ' + request.session.username + '! <br> <button class="ui button" onclick="window.location.href=\'logout\'">Logout</button>');
    } else if (request.session.loggedin == 'teacher') {
        var text;
        con.query('SELECT * FROM class_detail WHERE teacher_id = ?', [request.session.username], function (error, results, fields) {
            // for (var i = 0; i < results.length; i++) {
            //     text += "<tr>";
            //     text += "<td>" + results[i].class_id + "</td>";
            //     text += "<td>" + results[i].class_name + "</td>";
            //     text += "<td>" + results[i].class_time + "</td>";
            //     text += "<td></td>";
            //     text += "</tr>";
            // }
            // console.log(text); 
            text = results;
        });
        console.log(text);
        response.render('hometeach', {table:''});
    } else {
        response.redirect('/');
    }
    response.end();
});

app.get('/logout', function (request, response) {
    request.session.destroy();
    response.redirect('/');
});

var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Listening at http://%s:%s", host, port);
});