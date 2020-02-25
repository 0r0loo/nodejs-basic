// 라이브러리 소환
const express = require("express");
// 사용 객체
const app = express();

// post요청으로 보낸 파라미터가 req에 저장되어있는데 그거 가져다 쓰려고 라이브러리 하나 받아서 만든 코드  라이브러리 이름 : body-parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// mongodb 라이브러리
const MongoClient = require("mongodb").MongoClient;

// ejs 라이브러리
app.set("view engine", "ejs");

// static 파일을 보관하기 위해 public 폴더를 쓸거다 미들웨어
app.use("/public", express.static("public"));

// HTML에서 PUT/DELETE 요청할수 있게해주는 라이브러리
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

var db;

// DB가 연결이 되면 서버를 띄워주세요
// connect('url', code)
MongoClient.connect(
  "mongodb+srv://chotg:chotg@cluster0-a6vu8.mongodb.net/test?retryWrites=true&w=majority",
  function(error, client) {
    if (error) {
      return console.log(error);
    }

    db = client.db("todoapp");

    // db.collection("post").insertOne({ 이름: "John", 나이: 20 }, function(
    //   error,
    //   result
    // ) {
    //   console.log("저장 완료");
    // });

    app.listen(8080, function() {
      console.log("listening on 8080"); //8080 port로 웹서버열고 잘 열리면 출력
    });
  }
);

// 서버를 열수있음   (서버띄울 포트번호, 띄운후 실행할 코드)
// app.listen(8080, function() {
//   console.log("listening on 8080"); //8080 port로 웹서버열고 잘 열리면 출력
// });

//                 아디 : 비번       MongoDB 이 url로 접속해주세요
// mongodb+srv://chotg:chotg@cluster0-a6vu8.mongodb.net/test?retryWrites=true&w=majority

// 누군가가 /pet 으로 방문을 하면 pet관련된 안내문을 띄워주자
// get(경로, func)
app.get("/pet", function(req, resp) {
  // 응답.send('펫용품 쇼핑 페이지입니다.');
  resp.send("펫용품 쇼핑할 수 있는 페이지입니다.");
});

app.get("/beauty", function(req, resp) {
  resp.send("뷰티용품 쇼핑할 수 있는 페이지입니다.");
});

// sendFile()은 파일을 보내는 함수 __dirname은 현재 파일의 경로(언더바2개임)
// app.get("/", function(req, resp) {
//   resp.sendFile(__dirname + "/index.html");
// });

// app.get("/write", function(req, resp) {
//   resp.sendFile(__dirname + "/write.html");
// });

app.get("/", (req, resp) => {
  resp.render("index.ejs");
});

app.get("/write", (req, resp) => {
  resp.render("write.ejs");
});

// 어떤 사람이 /add 경로로 POST 요청을 하면 어떤 코드를 실행해 주세요.
app.post("/add", function(req, resp) {
  resp.send("전송 완료");
  // req.body가 post로 보낸 애들 저장되있음
  console.log(req.body);
  console.log(req.body.title);
  console.log(req.body.date);

  // name이 게시물갯수 인걸 찾아주세요
  db.collection("counter").findOne({ name: "게시물갯수" }, (error, result) => {
    console.log(result.totalPost);
    var 총게시물갯수 = result.totalPost;

    // DB에 저장해주세요.
    db.collection("post").insertOne(
      { _id: 총게시물갯수 + 1, title: req.body.title, date: req.body.date },
      function(error, result) {
        console.log("저장완료");

        // Counter라는 콜렉션에 있는 totalPost 라는 항목도 1 증가시켜야함
        // updateOne(어떤 데이터를 수정할지, 수정 값, 콜백함수)             $set <- operator 연산자 바꿔주고싶을때 씀(변경 그걸로)  $inc : 증가시켜주세요 (그 숫자만큼 증가)
        db.collection("counter").updateOne(
          { name: "게시물갯수" },
          { $inc: { totalPost: 1 } },
          (error, result) => {
            if (error) {
              return console.log(error);
            }
          }
        );
      }
    );
  });
});

// /list로 GET 요청으로 접속하면 실제 DB에 저장된 데이터들로 예쁘게 꾸며진 HTML을 보여줌
app.get("/list", function(req, resp) {
  // 디비에 저장된 post라는 collection 안의 모든 데이터를 꺼내주세요
  db.collection("post")
    .find()
    .toArray((error, result) => {
      console.log(result);

      // list.ejs를 렌더링하고 posts라는 키로 result를 보냄
      resp.render("list.ejs", { posts: result });
    });
});

app.delete("/delete", function(req, resp) {
  console.log(req.body);
  req.body._id = parseInt(req.body._id);
  // 요청.body에 담겨온 게시물 번호를 가진 글을 db에서 찾아서 삭제하는 코드
  db.collection("post").deleteOne(req.body, (error, result) => {
    console.log("삭제완료");
    resp.status(200).send({ message: "성공 했습니다." });
  });
});

// /detail로 접속하면 detail.ejs를 보여줌             : 기호는 뒤에 string 붙혀서 할수있음
app.get("/detail/:id", function(req, resp) {
  db.collection("post").findOne({ _id: parseInt(req.params.id) }, function(
    error,
    result
  ) {
    console.log(result);
    resp.render("detail.ejs", { data: result });
  });
});

app.get("/edit/:id", function(req, resp) {
  db.collection("post").findOne({ _id: parseInt(req.params.id) }, function(
    error,
    result
  ) {
    console.log(result);
    resp.render("edit.ejs", { data: result });
  });
});

app.put("/edit", function(req, resp) {
  // 폼에 담긴 제목 데이터, 날짜 데이터 를 가지고 db를 업데이트하는 코드 작성할려고
  // updateOne({이 데이터를 찾아서}.{이렇게 바꿔주세요},fuc)
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { title: req.body.title, date: req.body.date } },
    function(error, result) {
      console.log("수정 완료");
      resp.redirect("/list");
    }
  );
});

// session 방식으로 로그인 기능 만들 라이브러리
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

// 미들웨어 쓰기 요청 응답중간에 실행되는 코드가 미들웨어
app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/login", function(req, resp) {
  resp.render("login.ejs");
});

app.post(
  "/login",
  /*검사하세요 이게 통과되야 뒤 펑션 실행*/ passport.authenticate("local", {
    failureRedirect: "/fail"
  }),
  function(req, resp) {
    resp.redirect("/");
  }
);

passport.use(
  new LocalStrategy(
    {
      // form name이 id, pw인거 가져와서  usernameField에 넣음
      usernameField: "id",
      passwordField: "pw",
      session: true, // session 정보를 저장하는 코드
      passReqToCallback: false // 특수한경우
    },
    function(입력한아이디, 입력한비번, done) {
      console.log(입력한아이디, 입력한비번);
      db.collection("login").findOne({ id: 입력한아이디 }, function(
        error,
        result
      ) {
        if (error) return done(error);
        if (!result)
          return done(null, flase, { message: "존재하지 않는 아이디입니다." });
        if (입력한비번 == result.pw) {
          return done(null, result);
        } else {
          return done(null, false, { message: "비밀번가호 틀렸습니다." });
        }
      });
    }
  )
);

// id를 이용해서 세션을 저장시키는 코드(로그인 성공시 발동)
passport.serializeUser((user /*위에 코드 result가 user로 들어감  */, done) => {
  console.log(user);
  done(null, user.id);
});

// 이 세션 데이터를 가진 사람을 DB에서 찾아주세요(마이페이지 접속시 발동)
passport.deserializeUser((id, done) => {
  console.log(id);
  // db에서 위에있는 user.id로 유저를 찾은 뒤에 유저 정보를 done(null,{요기에 넣음})
  db.collection("login").findOne({ id: id }, (error, result) => {
    done(null, result);
  });
});

app.get("/mypage", Islogin, (req, resp) => {
  console.log(req.user);
  resp.render("mypage.ejs", { user: req.user });
});

function Islogin(req, resp, next) {
  console.log(req.user);
  if (req.user) {
    next();
  } else {
    resp.send("로그인을 하지 않았습니다.");
  }
}
