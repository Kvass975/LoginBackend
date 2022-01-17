const express = require('express');
const dotenv = require('dotenv')
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const app = express();
app.use(express.json());
dotenv.config()


const db = mysql.createConnection({
    host: 'sql11.freemysqlhosting.net',
    user: 'sql11463787',
    password: `${process.env.PASSWORD}`,
    database: 'sql11463787'
})
db.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});


app.post('/register', async function(req, res) {
    try{
        const {email, password, username, number} = req.body
        const hash = await bcrypt.hash(password, 10);
        let sql = `INSERT INTO emails (email) VALUES ('${email}');`
        await db.query(sql, (err, result)=>{
            if (err) res.status(400).json({"message": "There was an error"});

            let sql = `INSERT INTO numbers (number) VALUES (${number});`
            db.query(sql, (err, result)=>{
                if (err) res.status(400).json({"message": "There was an error"});
            
                let sql = `INSERT INTO passwords (password) VALUES ('${hash}');`
                db.query(sql, (err, result)=>{
                    if (err) res.status(400).json({"message": "There was an error"});
            
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
            if (err) res.status(400).json({"message": "There was an error"});
            if(result==""){
                res.send("No such account exists")
            }else{
            const user_id = result[0].id
            let sql = `SELECT password FROM passwords WHERE id=${user_id}`
            db.query(sql, async (err, result1)=>{
                if (err) res.status(400).json({"message": "There was an error"});
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