const express = require('express');
const mysql = require('mysql2');
//create user 'portfolio1'@'localhost' identified by 'portfolio1@';
//GRANT ALL PRIVILEGES on portfolio1_db.* to 'portfolio1'@'localhost';
const session = require('express-session');
//npm install express-session
const bcrypt = require('bcrypt');
//npm install bcrypt
const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'portfolio1',
  password: 'portfolio1@',
  database: 'portfolio1_db'
});
//express-sessionで必要
app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req,res,next)=>{
  if(req.session.userId===undefined){
    res.locals.username='ゲスト';
    res.locals.isLoggedIn=false;
  }else{
    res.locals.username=req.session.username;
    res.locals.isLoggedIn=true;
  }
  next();
});

app.get('/',(req,res)=>{
  res.render('top.ejs');
});

app.get('/index',(req,res)=>{
  connection.query('select * from items',
    (error,results)=>{

      res.render('index.ejs',{items:results});
    }
  )
  
});

app.get('/new',(req,res)=>{
  res.render('new.ejs');
});

app.get('/signup',(req,res)=>{
  res.render('signup.ejs',{errors:[]});
});
app.get('/login',(req,res)=>{
  res.render('login.ejs');
});

app.post('/login',(req,res)=>{
  const email=req.body.email;
  
  connection.query('select * from users where email=?',
    [email],
    (error,results)=>{
        const plain=req.body.password;
        const hash=results[0].password;
        bcrypt.compare(plain,hash,(error,isEqual)=>{
          if(isEqual){
            req.session.userId=results[0].id;
            req.session.username=results[0].username;
            res.redirect('/index');
          }else{
            res.redirect('/login');
          }
        })
      
    }
  )

});
app.post('/signup',(req,res,next)=>{
  console.log('check1');
  const username=req.body.username;
  const email=req.body.email;
  const password=req.body.password;

  const errors=[];
  if(username===''){
    errors.push('ユーザー名が空です');
  }
  if(email===''){
    errors.push('メールアドレスが空です');
  }
  if(password===''){
    errors.push('パスワードが空です');
  }
  console.log(errors);
  if(errors.length>0){
    res.render('signup.ejs',{errors:errors});
  }else{
    next();
  }
},
(req,res,next)=>{
  console.log('check2');
  const email=req.body.email;
  const errors=[];
  connection.query('select * from users where email=?',
    [email],
    (error,results)=>{
      if(results.length>0){
        errors.push('認証に失敗しました');
        res.render('signup.ejs',{errors:errors});
      }else{
        next();
      }
    }
  )
},
(req,res)=>{
  console.log('check3');
  const username=req.body.username;
  const email=req.body.email;
  const password=req.body.password;
  bcrypt.hash(password,10,(error,hash)=>{
    connection.query('insert into users (username,email,password) values (?,?,?)',
      [username,email,hash],
      (error,results)=>{
        
      }
    )
  })

}

);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});