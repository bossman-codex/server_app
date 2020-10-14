

const express = require ("express")
const BodyParser = require("body-parser")
const cors = require('cors')
const bcrypt = require('bcrypt-nodejs')
const knex = require('knex')


const database = knex({
     client: 'mssql',
    connection: {
      host : 'eu-az-sql-serv1.database.windows.net',
      user : 'myusername',
      password : "Supermans1!",
      database : 'AdminLogin',
      options: {
        "enableArithAbort": true,
        'encrypt': true 
    }
}
  });

const app = express()

app.use(BodyParser.json())
app.use(cors())
    
app.get('/' , (req , res) =>  {
    res.send("its working")
})

app.post ('/signin', (req,res) => {
    const{email ,password} = req.body
    if (!email  || !password) {
        return res.status(400).json("incorrect form submission")
    }
  database.select('email' , "password")
  .from('Logins')
  .where('email' , "=" , email)
  .then(data =>{
    const isValid = bcrypt.compareSync(password , data[0].password)
    if (isValid) {
       return database.select('*').from ('person')
        .where('email', '=', email)
        .then(user =>{
            res.status(200).json(user[0])
        })
        .catch(err => res.status(400).json("unable to connect"))
    }else{
        res.status(400).json("Wrong credentials")
    }
  })
  .catch(err => res.status(400).json("Wrong credentials"))
})

app.post('/search', (req ,res) =>{
   database.select('certificatenumber').from("addcertificate")
   .where('certificatenumber',"=", req.body.cert)
  .then(user =>{
      const isCorrect = req.body.cert == user[0].certificatenumber

         if (isCorrect) {
               database.select('*').from('addcertificate')
               .where('certificatenumber' ,'=',req.body.cert)
               .then(user =>{ 
                    res.status(200).json(user[0])
               })
               .catch(err => res.status(400).json(err))
         } 
          
        })
        .catch(err => res.status(400).json("bad "))
  })
  


app.get('/table', (req, res)=> {
    database.select('*').from('addcertificate')
    .then(user =>{
        res.json(user)
    })
  });

  

app.post('/register',(req,res) =>{
    const{email, name ,password} = req.body
    if (!email || !name || !password) {
        return res.status(400).json("incorrect form submission")
    }
    const hash = bcrypt.hashSync(password)
    database.transaction(trx =>{
        trx.insert({
            password:hash,
            email:email
        })
        .into('Logins')
        .returning('email')
        .then(loginEmail =>{
            return trx('persons')
            .returning('*')
            .insert({
                email:loginEmail,
                name:name
            })
            .then(user =>{
                res.json(user[0])
                })
            })
        .then(trx.commit)
        .catch(trx.rollback)
    })
        .catch(err => res.status(400).json("Wrong cred"))
    
})
app.post('/addcert', (req, res)=>{
    const {companyname ,testname,item,itemid} = req.body
    if (!companyname || !testname || !item || !itemid) {
        return res.status(400).json("incorrect form submission")
    }
    database('AddCertificate')
    .returning("*")
    .insert({
        CompanyName: companyname,
        TestName: testname,
        Item: item,
        ItemIdentification : itemid
    }).then(user =>{ 
        res.status(200).json(user[0])
        }) 
        .catch(err=> res.status(400).json("wrong cred"))
})





app.listen(process.env.PORT || 3030)
