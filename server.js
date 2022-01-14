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
    응답.send('포스트요청 완료')
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
                    })
                }
            )
        }
    )
})

app.delete('/delete', (요청, 응답) => {
    요청.body._id = parseInt(요청.body._id);
    // db.collection('콜렉션').deleteOne( { 삭제할대상 }, 콜백함수 )
    db.collection('post').deleteOne( 요청.body, function(에러,결과){
        응답.status(200).send( {message : '성공' });
    } )
})





