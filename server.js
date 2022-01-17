const express = require('express');
const app = express();
const PORT = 8080
const CONNECT_STRING = 'mongodb://khg93:1q2w3e4r@cluster0-shard-00-00.dkcev.mongodb.net:27017,cluster0-shard-00-01.dkcev.mongodb.net:27017,cluster0-shard-00-02.dkcev.mongodb.net:27017/todoapp?ssl=true&replicaSet=atlas-um0pft-shard-0&authSource=admin&retryWrites=true&w=majority'
app.set('view engine', 'ejs');
// 포트번호로 서버 열어주기
// app.listen(PORT, function(){
//     console.log('listening on 8080')
// })

// 몽고db 연결하기
let db;
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect(CONNECT_STRING, function(에러, client){
    if (에러) return console.log(에러)

    db = client.db('todoapp');
    
    app.listen(PORT, function() {
        console.log('몽고db와 연뎔된 8080')
    })
    
})

app.use(express.static(`${__dirname}`))

app.get('/', function(요청, 응답){
    // [1] db에서 데이터를 꺼내와서
    // [2] rendering 해주기
    db.collection('post').find().toArray(function(에러, 결과){
        응답.render('index.ejs', { posts : 결과 } )
    });
})    

app.get('/post', function(요청, 응답){
    응답.render('post.ejs')
})

app.get('/detail/:id', function(요청, 응답){
    db.collection('post').findOne(
        { _id : parseInt(요청.params.id) },
        (요청, 결과) => {
            결과 && 응답.render('detail.ejs', { data : 결과 } )
        })
})

// POST 처리하기
app.use(express.json());
app.use(express.urlencoded( {extended : true} ))


app.post('/newpost', function(요청, 응답){
    const 요청내용 = 요청.body;
    // counter 콜렉션에서 총 게시물갯수 뽑아오기
    // db.collection('콜렉션이름').findOne( { 수정하고싶은 특정 도큐먼트 } , 콜백함수)
    db.collection('counter').findOne(
        {name : '게시물갯수'}, 
        function(에러, 결과){
            const totalPost = 결과.totalPost;
            
            db.collection('post').insertOne(
                { _id : totalPost + 1 , ...요청내용 }, 
                (에러, 결과) => {
                    // counter 콜렉션 수정하기
                    // db.collection('콜렉션이름').updateOne({ 수정할 데이터 }, { 수정 값 }, 콜백함수 )
                    // { 수정값 } 부분은 operator가 들어가서 쪼끔 어려움
                    // operator : %set, %inc, 기타 등등
                    db.collection('counter').updateOne({name:'게시물갯수'}, { $inc : {totalPost : 1} }, function(에러, 결과){
                        if (에러) return console.log(에러)
                        응답.redirect('/')
                    })
                }
            )
        }
    )
})

app.delete('/delete/:id', (요청, 응답) => {
    // db.collection('콜렉션').deleteOne( { 삭제할대상 }, 콜백함수 )
    db.collection('post').deleteOne( 
        { _id : parseInt(요청.params.id) }, 
        function(에러,결과){
        응답.status(200).send( { message : '성공' });
    })
})

app.get('/edit/:id', (req, response) => {
    db.collection('post').findOne(
        { _id : parseInt(req.params.id) },
        ( error, result ) => {
            response.render( 'edit.ejs', { post : result } )
        }
    )
})
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

app.put('/edit/:id', (req,res) => {
    const reqNumber = parseInt(req.params.id);
    const reqBody = req.body;

    // db.collection('post').updateOne( {바꿀데이터}, {바꿀내용}, 콜백함수 )
    db.collection('post').updateOne(
        { _id : reqNumber },
        { $set : { _id : reqNumber, ...reqBody } },
        ( error, result ) => {
            res.redirect('/')
        }
    )
})
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

// 미들웨어 세팅
// {secret : '비밀코드', ... } secret은 세션 생성시 쓸 비밀번호. 입맛껏 만들어쓰셈
app.use( session( {secret : '비밀코드', resave : true, saveUninitialized: false} ) ); // 
app.use( passport.initialize(  ) );
app.use( passport.session(  ) ); 


app.get('/login', (req,res) => {
    res.render('login.ejs')
})

app.post('/login', passport.authenticate(
    'local', 
    { failureRedirect : '/fail' }), 
    (req,res) => {
        res.redirect('/')
    }
)

passport.use(new LocalStrategy({
    usernameField: 'id', // 유저가 제출한 아이디가 적혀있는 input 태그의 name
    passwordField: 'pw', // 유저가 제출한 비번이 적혀있는 input 태그의 name
    session: true, // 세션 만드쉴?
    passReqToCallback: false, // id/pw 말고 다른 정보도 검사 할거임?
  }, function (입력한아이디, 입력한비번, done) {
      // db의 login 콜렉션에 저장된 회원정보랑 비교할거임
      // id가 있는지, pw은 맞는지 검사
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
      // 입력한 id가 db상에 있으면 결과에 뭔가 담겨있겠지?
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
}));


passport.serializeUser( (user, done) => { 
    done( null, user.id ) 
})

passport.deserializeUser( (userId, done) => {
        db.collection('login').findOne({ id : userId }, (err, res) => {
            console.log(res)
            done(null, res)
        })
    }
)

const isLogined = function(req, res, next) {
    if (req.user) {   // req.user엔 신기하게도  deseriallzeUser 함수에서 뱉어낸 유저정보가 담겨있음
        next()        // 다음 미들웨어로의 액세스 함수
                      // 그러니까 req.user가 정상적으로 있으면 isLogined 옆의 화살표 함수로 넘어가겠다는 뜻
    } else {
        res.send('로그인 안하셨는데요???')
    }
}

app.get('/mypage', isLogined, (req,res) => {
    res.render('mypage.ejs', { user : req.user });
})

