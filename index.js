const user = '[{"id":1,"nombre":"Atsumi","apellido":"Amaya","email":"AtsumiAmaya@gmail.com","password": "pass1"},' +
            '{"id":2,"nombre":"Carlos","apellido":"Lopez","email":"CarlosLopez@gmail.com","password": "pass2"},' +
            '{"id":3,"nombre":"Joshep","apellido":"Cconislla","email":"JoshepCconislla@gmail.com","password": "pass3"}]';

var objU = JSON.parse(user);

require('dotenv').config()
const express = require('express');
const app = express();
app.listen(3000, () => {
    console.log('Servidor en Puerto 3000');
});
const jwt = require("jsonwebtoken");
const bodyParser = require('body-parser');
const ejs = require('ejs');
const { send } = require('express/lib/response');
const url = require('url'); 
const http = require('http')
const server = http.createServer(app)

const {Server} = require('socket.io')
const io = new Server(server)

var mysql      = require('mysql');
var connection = mysql.createPool({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database: 'daw_db'
});

const multer  = require('multer')
const multerS3 = require('multer-s3')
const uploadimg = multer({ dest: 'images/' })
const AwsClient = require('./config/s3')

const initDB = require('./config/db');
const modelUser = require('./models/user');
const modelStory = require('./models/story');

initDB();

app.use(express.static("public")); 

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

io.on('connection', (socket) =>{
    console.log('usuario conectado')
    socket.on('chat', (msg) =>{
        io.emit('chat', msg)
        console.log('Mansaje: ' + msg)
    });
});

// LOGIN //

app.get('/', (req, res) => {
    var notif = req.query.notif;
    res.render('index',{notif:notif});
    //res.sendFile(__dirname+'public/index1.html');
});

app.post('/login', (req, res) => {
    var auth = false;
    connection.query('SELECT * FROM usuarios', function(err, rows, field) {
        if (err) throw err;
        for(var i=0; i<rows.length; i++){
            if(req.body.email == rows[i].email && req.body.password == rows[i].password) {
                auth = true;
                var u = rows[i];
            }
        };
        if(auth == true){
            const user = {
                nombre : u.username,
                password : u.password
            };
            jwt.sign({user: user}, 'secretkey', (err, token) => {
                res.redirect(url.format({
                    pathname:"/menu",
                    query: {
                    "u": u
                    }
                }));
            });  
        } else {
            res.redirect(url.format({
                pathname:"/",
                query: {
                "notif": 'loginError'
                }
            }));
        };
        
    })
});

// USUARIOS //

app.get('/new', (req, res) => {
    res.render('register');
});

app.post('/user', (req, res) => {
    /*
    var sql = `INSERT INTO usuarios (nombre, apellido, email, password) VALUES ('${req.body.nombre}', '${req.body.apellido}', '${req.body.email}', '${req.body.password}')`;
    connection.query(sql, function (err, result) {
        if (err) throw err;
            res.redirect(url.format({
            pathname:"/",
            query: {
            "notif": 'registerSuccess'
            }
        }));
    });
    */
    const data = req.body;

    modelUser.create(data, (err, docs) =>{
        if(err){
            console.log('Error ', err);
        }else{
            console.log({data:docs});
            res.redirect(url.format({
                pathname:"/",
                query: {
                "notif": 'registerSuccess'
                }
            }));
        }
        
    })
})

app.get('/user/:id', (req, res) => {
    res.redirect(url.format({
        pathname:"/userUpdate",
        query: {
        "id": req.params.id
        }
    }));
});

app.get('/userUpdate', (req, res) => {
    connection.query(`SELECT * FROM usuarios WHERE id = ${req.query.id}`, function(err, row, field) {
        if (err) throw err;
        res.render('updateUser',{user:row[0]});
    })
});

// POR ACTUALIZAR

app.put('/user/update', (req, res) => {
    var newU = req.body;
    for(var i=0; i<objU.length; i++){
        if (req.params.id == objU[i].id) {
            objU[i].nombre = newU.nombre;
            objU[i].apellido = newU.apellido;
        }
    };
    res.render('updateSuccess',{users:objU});
});

app.delete('/user/:id', (req, res) => {
    for(var i=0; i<objU.length; i++){
        if(req.params.id == objU[i].id) {
            delete objU[i];
        }
    };
    res.render('deleteSuccess',{users:objU});
});

// PASSWORD //

app.get('/forgotPassword', (req, res) => {
    var notif = req.query.notif;
    res.render('forgotPassword',{notif:notif});
});

app.post('/newP', (req, res) => {
    res.redirect(url.format({
        pathname:"/newPassword",
        query: {
        "email": req.body.email
        }
    }));
});

app.get('/newPassword', (req, res) => {
    console.log(req.query.email);
    var notif = req.query.notif;
    connection.query(`SELECT * FROM usuarios WHERE email ='${req.query.email}'`, function(err, rows, field) {
        if (err) throw err;
        if (rows.length>0) {
            res.render('newPassword', {email:rows[0].email, notif:notif});
        } else {
            res.redirect(url.format({
                pathname:"/forgotPassword",
                query: {
                "notif": 'ErrorEmail'
                }
            }));
        }
    })
});

app.post('/updateP', (req, res) => {
    if (req.body.newpassword==req.body.confnewpassword){
        connection.query(`UPDATE usuarios SET password = '${req.body.newpassword}' WHERE email = '${req.body.email}'`, function(err, rows, field) {
            if (err) throw err;
            res.redirect(url.format({
                pathname:"/",
                query: {
                "notif": 'NewPassSuccess'
                }
            }));
        })
    } else {
        res.redirect(url.format({
            pathname:"/newPassword",
            query: {
            "notif": 'ErrorPassword',
            "email": req.body.email
            }
        }));
    }
});

// MENU //

app.get('/menu', (req, res) => {
    var notif = req.query.notif;
    /*
    connection.query('SELECT * FROM historias', function(err, rowsS, field) {
        if (err) throw err;
        connection.query('SELECT * FROM usuarios', function(err, rowsU, field) {
            if (err) throw err;
            res.render('menu',{u:req.query.u, stories:rowsS, users:rowsU});
        })
    })
    */
    modelStory.find()
        .then(async (stories) =>  {
            await 
            console.log(stories)
            modelUser.find()
                .then(async (users) =>  {
                    await 
                    console.log(users)
                    res.render('menu',{u:req.query.u, stories:stories, users:users});
                })
                .catch((error) => {
                    console.log('Error en Login: ' + error);  
                });
        })
        .catch((error) => {
            console.log('Error en Login: ' + error);  
        });
});

// STORY //

app.get('/story', (req, res) => {
    res.render('viewStories',{stories:objS});
});

app.get('/newS', (req, res) => {
    res.render('addStory');
});


const BUCKET=process.env.BUCKET
const s3 = new AwsClient.AWS.S3();
const upload = multer({
    storage: multerS3({
        bucket: BUCKET,
        s3:s3,  
        acl: "public-read",
        key: function (req,file,cb) {
            console.log(file);
            cb(null, file.originalname)
        }
    })        
})

app.post('/addS',upload.single("file"), async function (req, res) {
    console.log(req.file)
    const data = req.body;
    data.imagen = req.file.location;
    modelStory.create(data, (err, docs) =>{
        if(err){
            console.log('Error ', err);
        }else{
            console.log({data:docs});
            res.redirect(url.format({
                pathname:"/menu",
                query: {
                "notif": 'registerSuccess'
                }
            }));
        }
    })
});

app.get('/story/:id', (req, res) => {
    res.redirect(url.format({
        pathname:"/storyUpdate",
        query: {
        "id": req.params.id
        }
    }));
});

app.get('/storyUpdate', (req, res) => {
    modelStory.
    connection.query(`SELECT * FROM historias WHERE id = ${req.query.id}`, function(err, row, field) {
        if (err) throw err;
        res.render('updateStory',{story:row[0]});
    })
});

app.post('/updateS', (req, res) => {
    connection.query(`UPDATE historias SET titulo = '${req.body.titulo}', autor = '${req.body.autor}', texto = '${req.body.texto}' WHERE id = ${req.body.id}`), function(err, rows, field) {
        if (err) throw err;
        console.log(req.body);
    }
    res.redirect(url.format({
        pathname:"/menu",
        query: {
            "notif": 'UserUpdateSuccess'
        }
    }));
});

app.post('/deleteS/:id', (req, res) => {
    var sql = `DELETE FROM historias WHERE id = ${req.params.id}`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log(objS);
        res.redirect(url.format({
        pathname:"/menu",
        query: {
        }
    }));
    });
});

// COMMENTS //

app.get('/comments/:id', (req, res) => {
    res.redirect(url.format({
        pathname:"/comments",
        query: {
        "id": req.params.id
        }
    }));
});

app.get('/comments', (req, res) => {
    connection.query(`SELECT * FROM comentarios WHERE historia_id = ${req.query.id}`, function(err, rows, field) {
        if (err) throw err;
        console.log(rows);
        res.render('comments',{comments:rows, storyid:req.query.id});
    })
});

app.post('/addC', (req, res) => {
    var newC = req.body;
    var sql = `INSERT INTO comentarios (comentario, autor, historia_id) VALUES ('${newC.comentario}', '${newC.autor}', '${newC.historia_id}')`;
    connection.query(sql, function (err, result) {
        if (err) throw err;
        res.redirect(url.format({
            pathname:`/comments/${newC.historia_id}`,
            query: {
            "notif": 'registerSuccess'
            }
        }));
    });
});

// OTROS //

app.get('/chat', (req, res) =>{
  
    res.sendFile(__dirname + '/public/chat.html');

});

app.get('/metrics', verifyToken ,(req, res) => {
    jwt.verify(req.token, 'secretkey', (error, authData) => {
        if(error){
            res.sendFile(__dirname + '/public/error.html');
        }
        else{
            res.json({
                mensaje: "Usuario Logeado",
                authData : authData
            });

            res.sendFile(__dirname + '/public/index-2.html');
        }
    });
    //res.sendFile(__dirname + '/public/index-2.html');
});

function verifyToken(req, res, next){
    const bearerHeader = req.headers['authorization'];
    if(typeof bearerHeader !== 'undefined'){
        bearerToken = bearerHeader.split(" ")[1];
        req.token = bearerToken;
        next();
    }
    else{
        res.sendFile(__dirname + '/public/error.html');
    }
}

app.get('/imageList', async (req,res)=>{
    let f = await s3.listObjectsV2({Bucket:BUCKET}).promise()
    let x = f.Contents.map(item => item.Key);
    console.log(f)
    console.log(x)
    res.send(x)
})

app.get("/download/:filename", async (req, res) => {
    const filename = req.params.filename
    let x = await s3.getObject({ Bucket: BUCKET, Key: filename }).promise();
    res.send(x)
})



