var mysql = require('mysql');
var express = require('express');
var app = express();
var path = require('path');
var PORT = process.env.PORT || 8080;
var IP = process.env.HOST || 'localhost';
var bodyParser = require('body-parser');
var pug = require('ejs');
var session = require('express-session');
app.use(bodyParser());
app.use(function (req, response, next) {
    // res.header("Access-Control-Allow-Origin", "YOUR-DOMAIN.TLD"); // update to match the domain you will make the request from
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    // response.header('Content-Type', 'application/json; charset=utf-8');

    response.header('Access-Control-Allow-Origin', '*');
    // response.header('Access-Control-Allow-Credentials', 'true');
    // response.header('Access-Control-Allow-Methods', ' POST, GET, OPTIONS');
    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With,Origin,Accept');
    // response.header('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
    next();
    // header('Access-Control-Allow-Origin: *');
    // header("Access-Control-Allow-Credentials: true");
    // header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    // header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    // header("Content-Type: application/json; charset=utf-8");

});
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

var config = require('./config/config');
var con = mysql.createConnection(config);
var multer = require('multer')
var md5 = require('md5');
var fs = require('fs');
let UPLOAD_PATH = '.upload';
con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

const moveFile = require('move-file');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // console.log(req);
        cb(null, 'upload/')
    },
    filename: function (req, file, cb) {
        // console.log(req);
        cb(null, file.originalname)
    }
})
const upload = multer({ storage: storage })
app.set('view engine', 'ejs');
app.set('views', './client');
app.use(express.static(path.join(__dirname, './client')));

app.get('/', function (request, response) {
    // request.session.destroy();
    if (request.session.loggedin) {
        response.redirect('/home');
    } else {
        response.render('index', {})
    }
    response.end();
});

app.post('/loginApp', function (request, response) {
    // console.log(request.body.password);
    // console.log(request.body.password);
    var qry = "SELECT * FROM person WHERE p_id =? and p_password = ?";

    con.query(qry, [request.body.username, md5(request.body.password)], function (err, result, fields) {
        if (typeof result[0] != "undefined") {
            var p_status;
            if (result[0].p_status == 's') {
                p_status = "student"
            } else if (result[0].p_status == 't') {
                p_status = "teacher"
            } else {
                p_status = "master"
            }

            var data = '{"username":"' + result[0].p_id + '","password":"' + result[0].p_password + '", "fname":"' + result[0].p_fname + '","lname":"' + result[0].p_lname + '","tel":"' + result[0].p_tel + '","email":"' + result[0].p_email + '","photo":"' + result[0].p_photo + '","status":"' + p_status + '"}';
            var results = JSON.parse(data);
            // console.log(data);
            response.json({ results, success: true });
        }
        else {

            response.json({ success: false, msg: 'ID or Password invalid!' });
        }
    });
});

app.post('/checkshcedule', function (request, response) {
    // console.log(request.body);
    if (request.body.status == 'STUDENT') {
        var query = "SELECT m.class_id,c.class_name,c.class_time FROM class_detail as c join class_member as m on c.class_id = m.class_id WHERE m.p_id = ? ORDER BY class_id DESC";
        con.query(query, [request.body.username], function (err, results) {
            response.json({ schedule: results, success: 'true' });
        });
    } else {
        var query = "SELECT class_id FROM sup_teach WHERE p_id = ? ORDER BY class_id DESC";
        con.query(query, [request.body.username], function (err, results) {
            // console.log(results);
            if (typeof results == "undefined") {
                var query = "SELECT class_id,class_name,class_time FROM class_detail WHERE p_id = ? ORDER BY class_id DESC";
                con.query(query, [request.body.username], function (err, results) {
                    response.json({ schedule: results, success: 'true' });
                });
            }
        });
        // var query = "SELECT class_id FROM sup_teach WHERE p_id = '?' ORDER BY class_id DESC";
    }
});

app.post('/mystudent', function (request, response) {
    // console.log(request.body);
    var query = "SELECT c.p_id as p_id,concat(UPPER(p.p_fname), ' ', UPPER(p.p_lname)) as fullname FROM class_member as c join person as p on c.p_id = p.p_id WHERE class_id = ? ORDER BY p_id DESC;";
    con.query(query, [request.body.class_id], function (err, results) {
        console.log(results);
        response.json({ mystudent: results, success: 'true', class_id: request.body.class_id });
        // array('success' => true, 'mystudent' => $new_array, 'class_id' => $postjson['class_id']));
    });
});

app.post('/mydata', function (request, response) {
    // console.log(request.body);
    var query = "SELECT m.class_id,c.class_name,m.p_id FROM class_detail as c join class_member as m on c.class_id = m.class_id WHERE m.p_id = ? and m.class_id = ?;";
    con.query(query, [request.body.username, request.body.class_id], function (err, results) {

        var getcountround = "SELECT class_date_check,COUNT(class_id) as countofdate FROM class_round  WHERE class_id = ? GROUP BY class_date_check ORDER BY class_date_check ASC; ";
        con.query(getcountround, [request.body.class_id], function (err, resultscountround) {
            var getdate = "SELECT DISTINCT class_date_check as date FROM class_round  WHERE class_id = ? ORDER BY class_date_check ASC;";
            con.query(getdate, [request.body.class_id], function (err, datecheck) {
                // console.log(datecheck.length);
                var class_date_check = [];
                for (i = 0; i < datecheck.length; i++) {
                    var d = new Date(datecheck[i].date);
                    var dd = d.getDate();
                    var mm = d.getMonth() + 1; //January is 0!

                    var yyyy = d.getFullYear();
                    if (dd < 10) {
                        dd = '0' + dd;
                    }
                    if (mm < 10) {
                        mm = '0' + mm;
                    }
                    var d = yyyy + '-' + mm + '-' + dd;
                    // console.log(d);
                    // if(i == 0){
                    //     class_date_check += " class_date_check = '" + d + "'";
                    // }else{
                    //     class_date_check += " or class_date_check = '" + d + "'";
                    // }
                    var mycount = "SELECT class_date_check, COUNT(class_id) as countofdate FROM class_check WHERE p_id = ? AND class_id = ? AND class_date_check = ?";
                    // console.log(mycount);
                    con.query(mycount, [request.body.username, request.body.class_id, d], function (err, mydata, f) {
                        class_date_check.push(mydata[0]);
                    });

                }
                setTimeout(function () {
                    response.json({ classdetails: results[0], mydata: class_date_check, countround: resultscountround, success: 'true' });
                }, 200);


            });

        });

        // array('success' => true, 'mystudent' => $new_array, 'class_id' => $postjson['class_id']));
    });
});

app.post('/detaildate', function (request, response) {
    // console.log(request.body);
    var query = "SELECT * FROM `class_check` WHERE class_date_check = ? AND p_id = ? AND class_id = ?";
    con.query(query, [request.body.date, request.body.username, request.body.class_id], function (err, result) {
        response.json({ detaildate: result, success: 'true' });
    });
});

app.post('/scan', function (request, response) {
    // console.log(request.body)
    var query = "SELECT class_id FROM class_code WHERE class_code = ?";
    con.query(query, [request.body.qrcode], function (err, result) {
        if (err) throw err;
        if (result != "") {
            // console.log(result[0].class_id);
            var join = "SELECT * FROM class_member WHERE class_id = ? AND p_id = ?";
            con.query(join, [result[0].class_id, request.body.username], function (err, resultmem) {
                if (err) throw err;
                // console.log(resultmem);
                if (resultmem != "") {
                    var data = "SELECT class_round_id FROM class_round WHERE class_id = ? ORDER BY class_round_id DESC LIMIT 1"
                    con.query(data, [result[0].class_id], function (err, resultaddmem) {
                        if (err) throw err;
                        else {
                            var class_round_id = resultaddmem[0].class_round_id.toString();
                            var round_id = ""
                            var splitround = class_round_id.split("");
                            if (splitround[7] === undefined) {
                                // console.log(Number(str[6] + str[7]) + 1);
                                round_id = splitround[6];
                                // $round_id = "hi";
                            } else {
                                round_id = splitround[6] + splitround[7];
                                // $round_id = "hi";
                            }
                            var class_id = [];
                            class_id.push({ class_id: result[0].class_id, round_id: round_id });
                            // console.log({ class_id: class_id, success: 'true' });
                            response.json({ class_id: class_id, success: 'true' });
                        }
                    });
                } else {
                    // console.log(result[0].class_id);
                    var addmem = "INSERT INTO class_member values (?,?)"
                    con.query(addmem, [result[0].class_id, request.body.username], function (err, resultaddmem) {
                        if (err) throw err;
                        else {
                            var data = "SELECT class_round_id FROM class_round WHERE class_id = ? ORDER BY class_round_id DESC LIMIT 1"
                            con.query(data, [result[0].class_id], function (err, resultaddmem) {
                                if (err) throw err;
                                else {

                                    var class_round_id = resultaddmem[0].class_round_id.toString();
                                    var round_id = ""
                                    var splitround = class_round_id.split("");
                                    if (splitround[7] === undefined) {
                                        // console.log(Number(str[6] + str[7]) + 1);
                                        round_id = splitround[6];
                                        // $round_id = "hi";
                                    } else {
                                        round_id = splitround[6] + splitround[7];
                                        // $round_id = "hi";
                                    }
                                    var class_id = [];
                                    class_id.push({ class_id: result[0].class_id, round_id: round_id });
                                    // console.log({ class_id: class_id, success: 'true' });
                                    response.json({ class_id: class_id, success: 'true' });

                                }
                            });
                        }
                    });
                }
            });
        } else {
            response.json({ success: false, msg: '...' });
        }
    });
});

app.post('/checkpoint', function (request, response) {
    console.log(request.body);
    var checkround = "SELECT class_round_id,p_id FROM class_check WHERE class_round_id = ? AND p_id = ?";
    con.query(checkround, [request.body.class_round_id, request.body.username], function (error, result) {
        if (result != "") {
            response.json({ success: false, msg: 'Already check!' });
        } else {
            var checkstatus = "Select class_round_status from class_round where class_round_id = ?";
            // console.log(request.body.class_round_id);
            con.query(checkstatus, [request.body.class_round_id], function (err, res) {
                if (err) throw err;
                console.log(res)
                if (res[0].class_round_status == 0) {
                    response.json({ success: false, msg: 'Time out!' });
                } else {
                    var today = new Date();
                    var dd = today.getDate();
                    var mm = today.getMonth() + 1; //January is 0!

                    var yyyy = today.getFullYear();
                    if (dd < 10) {
                        dd = '0' + dd;
                    }
                    if (mm < 10) {
                        mm = '0' + mm;
                    }
                    var date = yyyy + '-' + mm + '-' + dd;
                    var time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
                    var checkpoint = "insert into class_check values(?,?,?,?,?,?,?,?,?)"
                    con.query(checkpoint, [date, time, request.body.class_pos_lat, request.body.class_pos_long, request.body.check_address, request.body.student_photo, request.body.class_round_id, request.body.class_id, request.body.username], function (e, r) {
                        if (e) throw e;
                        response.json({ success: true });
                    });
                }
            });
        }
    });
});

app.post('/checkimg', upload.single('image'), function (request, response) {
    response.json({ success: 'true' });
});

app.post('/moveimgcheck', function (request, response) {
    console.log('hi');
    var dir = './image/classcheck/' + request.body.class_id;
    console.log(dir);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    var dir2 = './image/classcheck/' + request.body.class_id + '/' + request.body.username;
    console.log(dir2);
    if (!fs.existsSync(dir2)) {
        fs.mkdirSync(dir2);
    }

    fs.rename('./upload/' + request.body.student_photo, './image/classcheck/' + request.body.class_id + '/' + request.body.username + '/' + request.body.student_photo, (err) => {
        if (err) throw err;
        console.log('Rename complete!');
        response.json({ success: 'true' });
    });
});

app.post('/edit', function (request, response) {
    // console.log(request.body);
    if (typeof request.body.password == 'undefined') {
        var query = "UPDATE person SET p_fname = ?, p_lname = ?,p_tel = ?, p_email = ? WHERE p_id = ?"
    } else {
        var password = md5(request.body.password);
        var query = "UPDATE person SET p_password = '" + password + "' p_fname = ?, p_lname = ?,p_tel = ?, p_email = ? WHERE p_id = ?"
    }
    con.query(query, [request.body.fname, request.body.lname, request.body.phone, request.body.email, request.body.username], function (err, result) {
        if (err) throw err;
        else {
            var qry = "SELECT * FROM person WHERE p_id =?";
            con.query(qry, [request.body.username], function (err, result) {
                // console.log(result);
                var p_status;
                if (result[0].p_status == 's') {
                    p_status = "student"
                } else if (result[0].p_status == 't') {
                    p_status = "teacher"
                } else {
                    p_status = "master"
                }
                var data = '{"username":"' + result[0].p_id + '","password":"' + result[0].p_password + '", "fname":"' + result[0].p_fname + '","lname":"' + result[0].p_lname + '","tel":"' + result[0].p_tel + '","email":"' + result[0].p_email + '","photo":"' + result[0].p_photo + '","status":"' + p_status + '"}';
                // console.log(data);
                var results = JSON.parse(data);
                // console.log(data);
                response.json({ results, success: 'true' });
            });
        }
    });
});

app.post('/login', function (request, response) {
    console.log(request.body)
    var username = request.body.id;
    var password = request.body.password;

    if (username && password) {
        username = username.toUpperCase();

        con.query('SELECT * FROM person WHERE p_id = ? AND p_password = ?', [username, md5(password)], function (error, results, fields) {
            if (results != '') {
                console.log(results[0].p_status);
                if (results[0].p_status == 't') {
                    request.session.loggedin = 'teacher';
                    request.session.username = username;
                } else if (results[0].p_status == 's') {
                    request.session.loggedin = 'student';
                    request.session.username = username;
                } else if (results[0].p_status == 'm') {
                    request.session.loggedin = 'master';
                    request.session.username = username;
                } else {
                    response.end();
                    response.redirect('/');
                }
                response.redirect('/home');
            } else { // con.end();
                response.redirect('/');

            }
            response.end();
        });


        // response.end();
        // response.redirect('/');
    }
});

app.post('/register', function (request, response) {
    var studentId = request.body.studentId;
    var rpassword = request.body.rpassword;
    var fName = request.body.fName;
    var lName = request.body.lName;
    var eMail = request.body.eMail;
    var phone = request.body.phone;
    var sql = "INSERT INTO person VALUES (?,?,?,?,?,?,?,?)";
    // var values = [studentId.toUpperCase(),rpassword,fName.toUpperCase(),lName.toUpperCase(),eMail,phone,'default'];
    con.query(sql, [studentId.toUpperCase(), md5(rpassword), fName.toUpperCase(), lName.toUpperCase(), phone, eMail, 'default', 's'], function (err, result) {
        if (err) {
            throw err;
        }
        console.log("1 record inserted, " + studentId.toUpperCase());
        if (typeof request.body.aksi != "undefined") {
            response.json({ msg: "1 record inserted, " + studentId.toUpperCase(), success: 'true' });
            response.redirect('/');
        } else {
            response.end();
            response.redirect('/');
        }

    });
});


app.post('/addclass', function (request, response) {
    console.log(request.body);
    var classid = request.body.classid;
    var classname = request.body.classname;
    var day = request.body.day;
    var beginh = [];
    var beginm = [];
    var endh = [];
    var endm = [];
    var room = [];
    var addday = "";
    // console.log(Array.isArray(day));
    if (Array.isArray(day)) {
        for (let index = 0; index < day.length; index++) {
            beginh.push(day[index] + "BeginHours");
            beginm.push(day[index] + "BeginMin");
            endh.push(day[index] + "EndHours");
            endm.push(day[index] + "EndMin");
            room.push(day[index] + "Room");
        }
        for (let index = 0; index < day.length; index++) {
            // console.log(request.body,beginh[index]);
            if (index + 1 == day.length) {
                addday += day[index] + " " + request.body[beginh[index]] + ":" + request.body[beginm[index]] + " to " + request.body[endh[index]] + ":" + request.body[endm[index]] + " Room:" + request.body[room[index]].toUpperCase();
            } else {
                addday += day[index] + " " + request.body[beginh[index]] + ":" + request.body[beginm[index]] + " to " + request.body[endh[index]] + ":" + request.body[endm[index]] + " Room:" + request.body[room[index]].toUpperCase() + " , ";
            }
        }
    }
    else {
        beginh.push(day + "BeginHours");
        beginm.push(day + "BeginMin");
        endh.push(day + "EndHours");
        endm.push(day + "EndMin");
        room.push(day + "Room");
        addday += day + " " + request.body[beginh[0]] + ":" + request.body[beginm[0]] + " to " + request.body[endh[0]] + ":" + request.body[endm[0]] + " Room:" + request.body[room[0]].toUpperCase()
    }
    // console.log(request.body[room[0]])


    // var lName = request.body.lName;
    // var eMail = request.body.eMail;
    // var phone = request.body.phone;
    // console.log(addday);

    var sql = "INSERT INTO class_detail VALUES (" + classid + ",'" + classname.toUpperCase() + "','" + addday + "',0,'" + request.session.username + "')";
    // console.log(sql);
    con.query(sql, function (err, result) {
        if (err) throw err;
        response.redirect('/');
        response.end();

        // con.query('INSERT INTO class_code VALUES (?,"XXXXXXXXXX")', [classid], function (error, res) {
        //     console.log("1 record inserted, " + classid);

        // });
    });
});
app.get('/home', function (request, response) {
    console.log(request.session.loggedin);
    if (request.session.loggedin == 'student') {
        var text = "";
        con.query("SELECT cd.* from class_member c right join class cd on c.class_id = cd.class_id where p_id = ?", [request.session.username], function (error, results, fields) {
            if (results) {
                for (var i = 0; i < results.length; i++) {
                    text += "<tr>";
                    text += "<td>" + results[i].class_id + "</td>";
                    text += "<td>" + results[i].class_name + "</td>";
                    text += "<td>" + results[i].class_time + "</td>";
                    text += "<td><button class=\"ui inverted black  button\" value=\"" + results[i].class_id + "\" id=\"detail" + results[i].class_id + "\" name=\"detail\">Detail</button></td>";
                    text += "</tr>";
                }
                // console.log(text); 
                // text = results[0].class_id;


            }
            return response.render('homest', { table: text });
        });
        // response.send('Welcome student, ' + request.session.username + '! <br> <button class="ui button" onclick="window.location.href=\'logout\'">Logout</button>');
    } else if (request.session.loggedin == 'teacher') {
        var text = "";
        con.query('SELECT * FROM class_detail WHERE p_id = ?', [request.session.username], function (error, results, fields) {
            for (var i = 0; i < results.length; i++) {
                text += "<tr>";
                text += "<td>" + results[i].class_id + "</td>";
                text += "<td>" + results[i].class_name + "</td>";
                text += "<td>" + results[i].class_time + "</td>";
                text += "<td><button type=\"submit\" formMethod=\"post\" formAction=\"selectclass\" class=\"ui inverted black  button\" value=\"" + results[i].class_id + "\" id=\"detail\" name=\"detail\">Detail</button>";
                text += "<button type=\"submit\" formMethod=\"post\" formAction=\"summary\" class=\"ui inverted black  button\" value=\"" + results[i].class_id + "," + results[i].class_name + "\" id=\"classid\" name=\"classid\">Summary</button></td>";
                text += "</tr>";
            }
            // console.log(results); 
            // return response.render('hometeach.ejs', { table: text });
            // response.render('hometeach',{});
            return response.render('hometeach', { table: text })
        });

        // return response.render('hometeach', { table: text });

    } else {
        response.redirect('/');
    }
    // response.end();
});


app.post('/summary', (request, response) => {
    const classID = request.body.classid.split(",")
    // console.log(classID)
    let test = ""
    let test2 = ""
    let valueToCSV = ""
    let _status = ""
    let icon = "<i class=\"exclamation circle icon\"></i>"
    con.query('SELECT ccm.c_id, ccm.c_fname, ccm.c_lname, ccm.c_status FROM class_check_member ccm WHERE ccm.class_id = ? AND ccm.c_status != ? ORDER BY ccm.c_id ASC', [classID[0], 'd'], function (err, result) {
        // console.log(result)
        con.query('SELECT ccm.c_id, ccm.c_fname, ccm.c_lname, ccm.c_status FROM class_check_member AS ccm WHERE ccm.class_id = ?', [classID[0]], function(err, res ){
            res.forEach((ele, i) => {
                if(ele.c_status == 'n'){
                    _status = 'Normal'
                }else if(ele.c_status == 'd'){
                    _status = 'Delete'
                }
                valueToCSV += (i + 1)+ "," + ele.c_id + "," + ele.c_fname + " " + ele.c_lname + "," + _status
                if(i == 0){
                    valueToCSV += "+"
                }
            })
            // console.log(valueToCSV)
            if(result == ""){
                test2 += "<h2>" + icon +  "No Student In Class</h2>"
                let csv = valueToCSV
                return response.render('summaryclass', { test: test, class_id: classID[0], class_name: classID[1], test2: test2, csv: csv });
            }else{
                result.forEach((element, index) => {
                    // console.log(element)
                    let status = ""
                    if(element.c_status == 'n'){
                        status = "Normal"
                    }else if(element.c_status == 'r'){
                        status = "Remove"
                    }
                    let no = index + 1
                    let b = classID[0] + "," + element.c_id + "," + classID[1]
                    test += "<tr>"
                    test += "<td>" + no + "</td>"
                    test += "<td>" + element.c_id + "</td>"
                    test += "<td>" + element.c_fname + " " + element.c_lname + "</td>"
                    test += "<td>" + status + "</td>"
                    test += "<td>" + "<button type=\"submit\" formMethod=\"post\" formAction=\"stddetail\" class=\"ui inverted black  button\" value=\"" + b + "\" id=\"stddetail\" name=\"stddetail\">Detail</button>";
                    test += "<button type=\"submit\" formMethod=\"post\" formAction=\"deleteSTD\" class=\"ui inverted black  button\" value=\"" + element.c_id  + "\" id=\"delete\" name=\"delete\">Delete</button></td>";
                    test += "</tr>"
                })
                // console.log(test)
                let csv = valueToCSV
                return response.render('summaryclass', { test: test, class_id: classID[0], class_name: classID[1], test2: test2, csv: csv });
            }
        })
    })
})

app.post('/search', (request, response) => {
    const value = request.body
    // console.log(value)
    let test = ""
    let test2 = ""
    let sql = ""
    let valueToCSV = ""
    let icon = "<i class=\"exclamation circle icon\"></i>"
    if(value.seach_value == ""){
        sql = 'SELECT ccm.c_id, ccm.c_fname, ccm.c_lname, ccm.c_status FROM class_check_member ccm WHERE ccm.class_id = ? AND ccm.c_status != ? ORDER BY ccm.c_id ASC'
        con.query(sql, [ value.class, 'd' ], function(err, result){
            con.query('SELECT ccm.c_id, ccm.c_fname, ccm.c_lname, ccm.c_status FROM class_check_member AS ccm WHERE ccm.class_id = ?', [value.class], function(err, res ){
                res.forEach((ele, i) => {
                    if(ele.c_status == 'n'){
                        _status = 'Normal'
                    }else if(ele.c_status == 'd'){
                        _status = 'Delete'
                    }
                    valueToCSV += (i + 1)+ "," + ele.c_id + "," + ele.c_fname + " " + ele.c_lname + "," + _status
                    if(i == 0){
                        valueToCSV += "+"
                    }
                })
                // console.log(result)
                if(result == ""){
                    test2 += "<h2>" + icon +  "No Student In Class</h2>"
                    let csv = valueToCSV
                    return response.render('summaryclass', { test: test, class_id: value.class, class_name: value.class_name, test2: test2, csv: csv });
                }else{
                    result.forEach((element, index) => {
                        // console.log(element)
                        let status = ""
                        if(element.c_status == 'n'){
                            status = "Normal"
                        }else if(element.c_status == 'r'){
                            status = "Remove"
                        }
                        let no = index + 1
                        let b = value.class + "," + element.c_id + "," + value.class_name
                        test += "<tr>"
                        test += "<td>" + no + "</td>"
                        test += "<td>" + element.c_id + "</td>"
                        test += "<td>" + element.c_fname + " " + element.c_lname + "</td>"
                        test += "<td>" + status + "</td>"
                        test += "<td>" + "<button type=\"submit\" formMethod=\"post\" formAction=\"stddetail\" class=\"ui inverted black  button\" value=\"" + b + "\" id=\"stddetail\" name=\"stddetail\">Detail</button>";
                        test += "<button type=\"submit\" formMethod=\"post\" formAction=\"deleteSTD\" class=\"ui inverted black  button\" value=\"" + element.c_id  + "\" id=\"delete\" name=\"delete\">Delete</button></td>";
                        test += "</tr>"
                    })
                    // console.log(test)
                    let csv = valueToCSV
                    return response.render('summaryclass', { test: test, class_id: value.class, class_name: value.class_name, test2: test2, csv: csv });
                }
            })
        })
    }else{
        // console.log('have value from search')
        let _value = "%" + value.seach_value + "%"
        sql = 'SELECT ccm.c_id, ccm.c_fname, ccm.c_lname, ccm.c_status FROM class_check_member ccm WHERE ccm.class_id = ? AND ccm.c_status != ? AND ccm.c_id LIKE ? ORDER BY ccm.c_id ASC'
        con.query(sql, [ value.class, 'd', _value ], function(err, result){
            con.query('SELECT ccm.c_id, ccm.c_fname, ccm.c_lname, ccm.c_status FROM class_check_member AS ccm WHERE ccm.class_id = ?', [value.class], function(err, res ){
                res.forEach((ele, i) => {
                    if(ele.c_status == 'n'){
                        _status = 'Normal'
                    }else if(ele.c_status == 'd'){
                        _status = 'Delete'
                    }
                    valueToCSV += (i + 1)+ "," + ele.c_id + "," + ele.c_fname + " " + ele.c_lname + "," + _status
                    if(i == 0){
                        valueToCSV += "+"
                    }
                })
                if(result == ""){
                    test2 += "<h2>" + icon + "Cannot find information.</h2>"
                    let csv = valueToCSV
                    return response.render('summaryclass', { test: test, class_id: value.class, class_name: value.class_name, test2: test2, csv: csv });
                }else{
                    result.forEach((element, index) => {
                        let status = ""
                        if(element.c_status == 'n'){
                            status = "Normal"
                        }else if(element.c_status == 'r'){
                            status = "Remove"
                        }
                        let no = index + 1
                        let b = value.class + "," + element.c_id + "," + value.class_name
                        test += "<tr>"
                        test += "<td>" + no + "</td>"
                        test += "<td>" + element.c_id + "</td>"
                        test += "<td>" + element.c_fname + " " + element.c_lname + "</td>"
                        test += "<td>" + status + "</td>"
                        test += "<td>" + "<button type=\"submit\" formMethod=\"post\" formAction=\"stddetail\" class=\"ui inverted black  button\" value=\"" + b + "\" id=\"stddetail\" name=\"stddetail\">Detail</button>";
                        test += "<button type=\"submit\" formMethod=\"post\" formAction=\"deleteSTD\" class=\"ui inverted black  button\" value=\"" + element.c_id  + "\" id=\"delete\" name=\"delete\">Delete</button></td>";
                        test += "</tr>"
                        // console.log(test)
                        // con.query('SELECT COUNT(class_id) AS count_class, COUNT(p_id) AS count_p_id FROM class_check WHERE class_id = ? AND p_id = ?', [ value.class, element.p_id ], function(err, res){
                            // });
                        })
                    let csv = valueToCSV
                    return response.render('summaryclass', { test: test, class_id: value.class, class_name: value.class_name, test2: test2, csv: csv });
                }
            })
            // console.log(result)
    })
    }
})

const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
        // console.log(req);
        cb(null, 'files/')
    },
    filename: function (req, file, cb) {
        // console.log(req);
        cb(null, file.originalname)
    }
})
const uploadFile = multer({ storage: storage2 })

app.post('/uploadFile', uploadFile.single('csv'), function (request, response) {
    console.log(request.body)
    // response.json({ success: 'true' });
});
app.post('/stddetail', function (request, response){
    // console.log(request.body.stddetail)
    let value = request.body.stddetail.split(",")
    // console.log(value)
    let test = ""
    let test2 = ""
    let icon = "<i class=\"exclamation circle icon\"></i>"
    con.query('SELECT DATE_FORMAT(c.class_date_check, "%d %M %Y") as class_date_check, c.class_time_check, c.check_address, c.class_round_id, c.p_id, p.p_fname, p.p_lname, c.class_id, cd.class_name FROM class_check c JOIN person p ON p.p_id = c.p_id JOIN class_detail cd ON c.class_id = cd.class_id WHERE c.class_id = ? AND c.p_id = ? ORDER BY c.class_round_id ASC', [ value[0], value[1] ], function(err, result){ 
        // console.log(result)
        if(result == ""){
            // console.log(value)
            test2 += "<h2>" + icon +  "No Data</h2>"
            return response.render('stddetail', { test: test, class_id: value[0], class_name: value[2], test2: test2 });
        }else{
            // console.log("result2")
            result.forEach((element, index) => {
                let a = index + 1
                test += "<tr>"
                test += "<td>" + a + "</td>"
                test += "<td>" + element.class_round_id.toString().substr(6) + "</td>"
                test += "<td>" + element.class_date_check + "</td>"
                test += "<td>" + element.class_time_check + "</td>"
                test += "<td>" + element.p_id + "</td>"
                test += "<td>" + element.p_fname + " " + element.p_lname + "</td>"
                test += "<td>" + element.check_address + "</td>"
                test += "<td>" + "<button class=\"ui inverted black  button\" id=\"photo\" name=\"photo\"><i class=\"eye icon\"></i></button></td>";
                test += "</tr>"
                // console.log(element)
            });
            return response.render('stddetail', { test: test, class_id: value[0], class_name: value[2], test2: test2 });
        }
    })
})

app.post('/addSTD', (request, response) => {
    console.log(request.body)
    let req = request.body
    let sql = 'INSERT INTO class_check_member(c_std_id, c_fname, c_lname, class_id) VALUES(?, ?, ?, ?)'
    const value = [ req.std_id, req.firstname, req.lastname, req.classID ]
    // console.log(value)
    // con.query( sql, value, function(err, result){ 
    //     console.log(result)
    //     if(err == "ER_DUP_ENTRY"){
    //         console.log('id is repeatedly')
    //         return response.render('summaryclass', { test: test, class_id: classID[0], class_name: classID[1], test2: test2, csv: csv });
    //     }else{
    //         console.log('insert new student success')
    //         return response.render('summaryclass', { test: test, class_id: classID[0], class_name: classID[1], test2: test2, csv: csv });
    //     }
    // })
})

app.post('/deleteSTD', (request, response) => {
    // console.log(request.body)
    let req = request.body
    let sql = 'UPDATE class_check_member SET c_status = ? WHERE c_id = ?'
    const value = [ 'd', req.delete ]
    con.query( sql, value, function(err, result){ 
        console.log('delete ', req.delete)
    })
})

app.post('/selectclass', function (request, response) {
    request.session.selectclass = request.body.detail;
    if (request.session.selectclass != undefined) {
        response.redirect('detail');
        response.end();
    }

});

app.get('/detail', function (request, response) {
    // console.log('hi');
    class_id = request.session.selectclass;

    if (request.session.loggedin == 'student') {
        response.redirect('/');
    } else if (request.session.loggedin == 'teacher') {
        var sql = 'SELECT c.*,concat(t.p_fname , " " , t.p_lname) AS fullname FROM class_detail c LEFT JOIN person t on t.p_id = c.p_id  WHERE c.class_id = ?;'
        con.query(sql, [class_id], function (error, results, fields) {
            if (error) throw error;
            con.query('SELECT count(class_id) as count_check from class_round where class_id = ?', [class_id], function (e, r) {
                if (e) throw e;
                con.query('SELECT count(p_id) as count_student from class_member where class_id = ?', [class_id], function (err, res) {
                    if (err) throw err;
                    var class_name = results[0].class_name;
                    var class_time = results[0].class_time.split(" , ");;
                    var count_check = r[0].count_check;
                    var count_std = res[0].count_student;
                    var class_time_html = "";
                    for (let index = 0; index < class_time.length; index++) {
                        if (index + 1 == class_time.length) {
                            class_time_html += class_time[index];
                        } else {
                            class_time_html += class_time[index] + "<br>";
                        }
                    }
                    // console.log(results.length);
                    if (results.length > 0) {
                        var t_name = "";
                        for (let index = 0; index < results.length; index++) {
                            if (index == results.length - 1) {
                                t_name += results[index].fullname;
                            } else {
                                t_name += results[index].fullname + " , ";
                            }
                        }
                        response.render('detailclass', { class_name: class_name, class_time: class_time, count_check: count_check, t_name: t_name, count_std: count_std, class_time_html: class_time_html });

                    } else {
                        var t_name = results[0].fullname;
                        // console.log(class_name +" "+ class_time_html +" "+ t_name +" "+ count_check);
                        response.render('detailclass', { class_name: class_name, class_time: class_time, count_check: count_check, t_name: t_name, count_std: count_std, class_time_html: class_time_html });
                    }

                });
            });


        });
    } else {
        response.redirect('/');
    }
});


app.post('/genqrcode', function (request, response) {
    // console.log(request.body.qrcode);
    // console.log(request.body.class_id);
    var addcode = 'insert into class_code values (?,?)';
    con.query(addcode, [request.body.class_id, request.body.qrcode], function (err, result) {
        if (err) throw err;
        console.log("QR Code Class " + request.body.class_id + " Change! QR code = " + request.body.qrcode);
        if (typeof request.body.aksi != "undefined") {
            response.json({ data: "QR Code Class " + request.body.class_id + " Change! QR code = " + request.body.qrcode, class_id: request.body.class_id, success: 'true' });
        }
    });
    // var sql = 'UPDATE class_code SET class_code = ? WHERE class_id = ?';
    // con.query(sql, [request.body.qrcode, request.body.class_id], function (error, results, fields) {
    //     console.log("QR Code Class " + request.body.class_id + " Change! QR code = " + request.body.qrcode);
    //     if (typeof request.body.aksi != "undefined") {
    //         response.json({ data: "QR Code Class " + request.body.class_id + " Change! QR code = " + request.body.qrcode, class_id: request.body.class_id, success: 'true' });
    //     }
    // });


});

app.post('/deletecode', function (request, response) {
    console.log(request.body.qrcode);
    var deletecode = 'delete from class_code where class_id = ? and class_code = ?';
    con.query(deletecode, [request.body.class_id, request.body.qrcode], function (err, result) {
        if (err) throw err;
        console.log('close code ' + request.body.qrcode + ' from class = ' + request.body.class_id);
    });
});

app.post('/closecheck', function (request, response) {
    // console.log(request.body.qrcode);
    // console.log(request.body.class_id);
    con.query('SELECT class_round_id from class_round where class_id = ? order by class_round_id desc limit 1', [request.body.class_id], function (err, res, fie) {
        // console.log(res);
        var sql = 'UPDATE class_round SET class_round_status = ? WHERE class_round_id = ?';
        con.query(sql, [0, res[0].class_round_id], function (error, results, fields) {
            // console.log("close class check id : " + res[0].class_round_id);
            con.query('delete from class_code where class_id = ?', [request.body.class_id], function (err, res) {
                console.log('Close check class = ' + request.body.class_id);
            });
        });
    })


});
app.post('/classround', function (request, response) {
    // console.log("hi");
    // console.log(request.body);
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!

    var yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    var today = yyyy + '-' + mm + '-' + dd;
    var classroundid = "";

    con.query('SELECT class_round_id from class_round where class_id = ? order by class_round_id desc limit 1', [request.body.class_id], function (err, res, fie) {
        // console.log('ressssssss', res[0])
        if (res == "" || res[0] == undefined) {
            classroundid = request.body.class_id + "1"
        } else {
            var str = res[0].class_round_id.toString().split("");
            if (str[7] != null) {
                // console.log(Number(str[6] + str[7]) + 1);
                classroundid = request.body.class_id + "" + (Number(str[6] + str[7]) + 1);
            } else {
                // console.log(Number(str[6]) + 1);
                classroundid = request.body.class_id + "" + (Number(str[6]) + 1);
            }
        }
        // console.log('fffffff', classroundid);
        let sql1 = "INSERT INTO class_round VALUES ('" + classroundid + "','" + today + "', 1,'" + request.body.class_id + "')";
        con.query(sql1, function (error, results, fields) {
            if (error) throw error;
            console.log("1 check round inserted, " + classroundid);
            if (typeof request.body.aksi != "undefined") {
                response.json({ data: "1 check round inserted, " + classroundid, success: 'true' });
            }
        });
    });

    // var classroundid = request.body.class_id 
})

app.post('/editdaystime', function (request, response) {

    var day = request.body.day;
    var beginh = [];
    var beginm = [];
    var endh = [];
    var endm = [];
    var room = [];
    var addday = "";
    // console.log(Array.isArray(day));
    if (Array.isArray(day)) {
        for (let index = 0; index < day.length; index++) {
            beginh.push(day[index] + "BeginHours");
            beginm.push(day[index] + "BeginMin");
            endh.push(day[index] + "EndHours");
            endm.push(day[index] + "EndMin");
            room.push(day[index] + "Room");

        }
        for (let index = 0; index < day.length; index++) {
            // console.log(request.body,beginh[index]);
            if (index + 1 == day.length) {
                addday += day[index] + " " + request.body[beginh[index]] + ":" + request.body[beginm[index]] + " to " + request.body[endh[index]] + ":" + request.body[endm[index]] + " " + request.body[room[index]].toUpperCase() + " Room:" + request.body[room[index]].toUpperCase();
            } else {
                addday += day[index] + " " + request.body[beginh[index]] + ":" + request.body[beginm[index]] + " to " + request.body[endh[index]] + ":" + request.body[endm[index]] + " " + request.body[room[index]].toUpperCase() + " Room:" + request.body[room[index]].toUpperCase() + " , ";
            }
        }
    }
    else {
        beginh.push(day + "BeginHours");
        beginm.push(day + "BeginMin");
        endh.push(day + "EndHours");
        endm.push(day + "EndMin");
        room.push(day + "Room");
        addday += day + " " + request.body[beginh[0]] + ":" + request.body[beginm[0]] + " to " + request.body[endh[0]] + ":" + request.body[endm[0]] + " Room:" + request.body[room[index]].toUpperCase();
    }

    var sql = 'UPDATE class_detail SET class_time = ? WHERE class_id = ?';
    con.query(sql, [addday, request.body.cid], function (error, results, fields) {
        if (error) throw error;
        console.log("Days/Time Class " + request.body.cid + " Change! Day/Time = " + addday);
        response.redirect('/');
    });

});

app.get('/logout', function (request, response) {
    request.session.destroy();
    response.redirect('/');
});

var server = app.listen(PORT, IP, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Listening at http://%s:%s", host, port);
});