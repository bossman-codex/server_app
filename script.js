

const express = require ("express")
const BodyParser = require("body-parser")
const cors = require('cors')
const bcrypt = require('bcrypt-nodejs')
const knex = require('knex')
const fileUpload = require("express-fileupload")
const FileType = require('file-type')
const multer = require('multer');
const path = require("path")


const database = knex({
    client: 'mysql',
    version: '15.1',
    
    connection: {
        host : "localhost",
        user : "checkire_ad",
        password : "element2020!1",
        database : "checkire_admin",
    //   host : "db4free.net",
    //   user : "adminlogger",
    //   password : "Possible2020!!",
    //   database : "adminlog",
      timezone: 'utc',
      port: "3360"
}
  });

const app = express()

app.use(BodyParser.json())
app.use(BodyParser.urlencoded({ extended: false }))
app.use(cors())
app.use(fileUpload())
app.use(express.static('uploads')); //to access the files in public folder
 


    
app.get('/' , (req , res) =>  {
    res.send("its working")
})




app.post ('/signin', (req,res) => {
    const{email ,password} = req.body
    if (!email  || !password) {
        return res.status(400).json("incorrect form submission")
    }
  database.select('email' , "password")
  .from('user_details')
  .where('email' , "=" , email)
  .then(data =>{
    const isValid = bcrypt.compareSync(password , data[0].password)
    if (isValid) {
       return database.select('*').from ('persons')
        .where('email', '=', email)
        
        .then(user =>{
            res.status(200).json(user[0])
        })
        .then(users =>{
        database.insert
       ({
           email: email,
           Time_LoggedIn:new Date()

        })
       .into("logins")
      .then(user=>{
        res.status(200).json()
        })
        .catch(err=>{
            console.log(err)
        })
        })

        .catch(err => res.status(400).json("unable to connect"))
    }else{
        res.status(400).json("Wrong credentials")
    }
  })
 
  
  .catch(err => res.status(400).json("Wrong credentials"))
})



// app.post('/search', (req ,res) =>{
//    database.select('certificatenumber').from("addcertificate")
//    .where('certificatenumber',"=", req.body.cert)
//   .then(user =>{
//       const isCorrect = req.body.cert == user[0].certificatenumber

//          if (isCorrect) {
//                database.select('*').from('addcertificate')
//                .where('certificatenumber' ,'=',req.body.cert)
//                .then(user =>{ 
//                     res.status(200).json(user[0])
//                })
//                .catch(err => res.status(400).json(err))
//          } 
          
//         })
//         .catch(err => res.status(400).json("bad "))
//   })
  


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
        .into('user_details') 
        .then(loginEmail =>{
            return trx('persons')
            .insert({
                Email:email,
                Name:name
            }) 
            .then(user =>{ 
                res.status(200).json("success")
                })
            })
        .then(trx.commit)
        .catch(trx.rollback)
    })
        .catch(err => res.status(400).json(err))
    
})
app.post("/update" , (req, res) =>{
    const {companyname ,testname,item,itemid,refnumber,expires,certnumber} = req.body 
   database('addcertificate')
  .where(CertificateNumber, "=", certnumber)
  .then(user=>{
      const isCorrect = certnumber === user[0]["CertificateNumber"]
    if(isCorrect){
    database('addcertificate')
    .where(CertificateNumber, "=", certnumber)
    .update({
    CompanyName: companyname,
    TestName: testname,
    Item: item,
    ItemIdentification : itemid,
    RefNumber : refnumber,
    Expires:expires
  }).then(user =>{ 
    res.status(200).json("user")
    }) 
    .catch(err=> res.status(400).json("error"))
    }
    
  })
 .catch(err=> res.status(400).json("invalid"))
})

app.post("/delete" , (req, res) =>{
    const {cert} = req.body 
   database('addcertificate')
   .where(Certificatenumber, cert)
   .then(user=>{
    const isCorrect = cert === user[0].CertificateNumber
    if(isCorrect){
      database('addcertificate')
   .where(Certificatenumber, cert)
   .del()
   .then(user =>{ 
    res.status(200).json("user")
    }) 
    .catch(err=> res.status(400).json("user"))  
    }
    })
    .catch(err=> res.status(400).json("invalid"))  
})
   
app.post('/addcert', (req, res)=>{
    function makeid(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
           result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
     }

    const {companyname,testname,item,itemid,expires,refnumber} = req.body
    if (!companyname||!testname||!item||!itemid||!refnumber||!expires) {
        return res.status(400).json("incorrect form submission")
    }
    database('addcertificate')
    .insert({
        CompanyName: companyname,
        TestName: testname,
        Item: item,
        ItemIdentification : itemid,
        RefNumber : refnumber,
        Expires:expires,
        CertificateNumber: makeid(5)
    })
    .then(user =>{ 
        res.status(200).json("success")
        }) 
        .catch(err=> res.status(400).json(err))
})


app.post('/upload', (req, res) => {
    const certnumber = req.body.Certnumber
    
     
    database('addcertificate')
    .where(Certificatenumber, certnumber)
    .then(user=>{
        const isCorrect = certnumber === user[0].CertificateNumber
        
        const myFile = req.files.file;
         if (!req.files) {
        return res.status(500).send({ msg: "file is not found" })
       }if(isCorrect){
       database('image')
       .insert({
        Name:certnumber,
        productimage:myFile.name,
        image:myFile.data
      }) 
        .then(user =>{ 
        res.status(200).json("success")
        }) 
        .catch(err=> res.status(400).json(err))
         }
        })
       .catch(err=>res.status(400).json(err))
})
        // accessing the file
    
  



app.post('/image', (req, res) => {
 database.select('name').from("image").where('name',"=", req.body.certnumber)
.then(user=>{
     const isCorrect = req.body.certnumber == user[0].name
                if (isCorrect) {
               database.select('image').from('image')
                 .where('name' ,'=',req.body.certnumber) 
                 .then(users=>{
                res.status(200).json(users)
                 })
                 .catch(err=>{
                   console.log(err)
                 })     
                }  
             } ) 
             .catch(err=>res.status(400).json("error"))
            } )
                
   
   
app.listen(process.env.PORT || 3030)
