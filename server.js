const express = require('express');
const dotenv = require('dotenv')
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors')
const app = express();
app.use(cors());
app.use(express.json());
dotenv.config()

let allEmails = []
let allUsernames = []
let allNumbers = []

const db = mysql.createConnection({
    host: 'sql11.freemysqlhosting.net',
    user: 'sql11463787',
    password: `${process.env.PASSWORD}`,
    database: 'sql11463787'
})

function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if(token == null) return res.send("error0")

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user)=>{
        if(err) return res.send("error1")
        req.user = user
        next()
    })
}

const getAllData = () => {
    let sql = `
    SELECT emails.email, passwords.password, numbers.number, usernames.username FROM main
    LEFT JOIN emails ON main.email_id = emails.id
    LEFT JOIN passwords ON main.password_id=passwords.id
    LEFT JOIN numbers ON main.number_id=numbers.id
    LEFT JOIN usernames ON main.username_id=usernames.id`
     db.query(sql, (err, result)=>{
         result.forEach(function(data,i){
             allEmails[i] = data.email
             allUsernames[i] = data.username
             allNumbers[i] = data.number+""
         })
     })
}

db.connect(function(err) {
    if (err) throw err;
    getAllData()
    console.log("Connected")
});

app.get("/", (req, res)=>{
    res.send("home route")
})


app.post('/register', async function(req, res) {
    try{
        const {email, password, username, number} = req.body
        const hash = await bcrypt.hash(password, 10);

        const numToString = number + ""

        if(numToString[0]!=2){
            throw new Error("IN")
        }
        if(allEmails.includes(email)){
            throw new Error("WE")
        }
        if(allUsernames.includes(username)){
            throw new Error("WU")
        }

        if(allNumbers.includes(number)){
            throw new Error("WN")
        }


        let sql = `INSERT INTO emails (email) VALUES ('${email}');`
        await db.query(sql, (err, result)=>{
            if (err) throw err;
            let sql = `INSERT INTO numbers (number) VALUES (${number});`
            db.query(sql, (err, result)=>{
                if (err) throw err;
                let sql = `INSERT INTO passwords (password) VALUES ('${hash}');`
                db.query(sql, (err, result)=>{
                    if (err) throw err;
                    let sql = `INSERT INTO usernames (username) VALUES ('${username}');`
                    db.query(sql, (err, result)=>{
                        if (err) throw err;
                        let sql = `INSERT INTO main (email_id, number_id, password_id, username_id) VALUES (
                                     (SELECT id FROM emails WHERE email='${email}'),
                                     (SELECT id FROM numbers WHERE number=${number}),
                                     (SELECT id FROM passwords WHERE password='${hash}'),
                                     (SELECT id FROM usernames WHERE username='${username}')
                                 )`
                        db.query(sql, (err, result)=>{
                            if (err) throw err;
                            getAllData()
                            res.status(200).json({
                                "status": "done"
                            })
                        })
                    })
                })
            })
        })
    }catch(e){
        const Error = e.message
        res.status(400).json({"status": false, "message": Error})
    }
})

app.post("/login", async function(req, res) {
    try{
        const {email, password} = req.body
        if(!email||!password) throw new Error("Email or passord empty")
        let sql = `SELECT id, email FROM emails WHERE email='${email}'`
        db.query(sql, (err, result)=>{
            if (err) throw err;
            if(result==""){
                res.json({"status": false})
            }else{
            const user_id = result[0].id
            let sql = `SELECT password FROM passwords WHERE id=${user_id}`
            db.query(sql, async (err, result1)=>{
                const user_hash = result1[0].password
                const validPass = await bcrypt.compare(password, user_hash)
                if(validPass){
                    const user = {email: result[0].email}
                    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)

                    res.status(200).json({
                        "status": true,
                        "token": accessToken
                    })

                }else{
                    res.status(400).json({
                        "status": false
                    })
                }
            })}
        })
    }catch(e){
        res.status(400).json({
            "message": e.message
        })
    }
})

app.get('/account', authenticateToken, function (req, res) {
    let sql = `SELECT id, email FROM emails WHERE email='${req.user.email}'`
    db.query(sql, function (err, result) {
        const user_id = result[0].id
        let sql = `SELECT emails.email, numbers.number, usernames.username FROM main
        LEFT JOIN emails ON emails.id=${user_id}
        LEFT JOIN numbers on numbers.id=${user_id}
        LEFT JOIN usernames ON usernames.id=${user_id}`
        db.query(sql, (err, result1)=>{
            res.send(result1[0])
        })
    })
})

app.listen(process.env.PORT || 3000)