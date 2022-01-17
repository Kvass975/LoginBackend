const express = require('express');
const dotenv = require('dotenv')
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const app = express();
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
             allNumbers[i] = data.number
         })
         console.log(allEmails, allUsernames, allNumbers)
     })
}

db.connect(function(err) {
    if (err) throw err;
    getAllData()
});


app.post('/register', async function(req, res) {
    try{
        const {email, password, username, number} = req.body
        const hash = await bcrypt.hash(password, 10);

        const numToString = number + ""
        if(numToString[0]!=2){
            throw new Error("Incorrect number")
        }

        if(allEmails.includes(email)||
        allUsernames.includes(username)||
        allNumbers.includes(number)){
            throw new Error("In use")
        }

        let sql = `INSERT INTO emails (email) VALUES ('${email}');`
        await db.query(sql, (err, result)=>{

            let sql = `INSERT INTO numbers (number) VALUES (${number});`
            db.query(sql, (err, result)=>{
            
                let sql = `INSERT INTO passwords (password) VALUES ('${hash}');`
                db.query(sql, (err, result)=>{
            
                    let sql = `INSERT INTO usernames (username) VALUES ('${username}');`
                    db.query(sql, (err, result)=>{
                        
                        let sql = `INSERT INTO main (email_id, number_id, password_id, username_id) VALUES (
                                     (SELECT id FROM emails WHERE email='${email}'),
                                     (SELECT id FROM numbers WHERE number=${number}),
                                     (SELECT id FROM passwords WHERE password='${hash}'),
                                     (SELECT id FROM usernames WHERE username='${username}')
                                 )`
                        db.query(sql, (err, result)=>{
                            if (err) res.status(400).json({"message": "There was an error"});
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
        console.log(e)
        res.send("Something broke!")
    }
})

app.post("/login", async function(req, res) {
    try{
        const {email, password} = req.body
        let sql = `SELECT id, email FROM emails WHERE email='${email}'`
        db.query(sql, (err, result)=>{
            if(result==""){
                res.send("No such account exists")
            }else{
            const user_id = result[0].id
            let sql = `SELECT password FROM passwords WHERE id=${user_id}`
            db.query(sql, async (err, result1)=>{
                const user_hash = result1[0].password
                const validPass = await bcrypt.compare(password, user_hash)
                if(validPass){
                    res.status(200).json(true)
                }else{
                    res.status(400).json(false)
                }
            })}
        })
    }catch(e){
        console.log(e)
        res.send("Something went wrong")
    }
})


app.get('/:username', function (req, res) {
    let sql = `SELECT * FROM emails`
    db.query(sql, function (err, result) {
        res.send(result)
    })
})


app.listen(3000)