// 创建服务器
// 引入express
const express = require("express");
//加载fs模块(FileSystem)
const fs = require("fs");
//加载Multer模块
const multer = require("multer");
//加载uuid
const uuid = require("uuid");
// 引入mysql
const mysql = require("mysql");
// 引入cors 解决跨域
const cors = require("cors");
const app = express();
// y引入中间件body-parser
const bodyParser = require("body-parser");
const { title } = require("process");
const { log } = require("console");
//创建mysql连接池
const pool = mysql.createPool({
  host: "127.0.0.1",
  port: "3306",
  user: "root",
  password: "",
  database: "tz",
});
var upload = multer({
  //destination,目标(即上传文件保存的位置)
  dest: "../hello-world/src/assets/product/",
});
//使用cors模块
app.use(
  cors({
    origin: ["http://127.0.0.1:8080", "http://localhost:8080"],
  })
);
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
// 上传图片
//多个文件上传的表单路由(自定义规则)
// server.get('/custom',(req,res)=>{
//   var data = fs.readFileSync('./03.html',{encoding:'utf8'});
//   res.send(data);
// });

//自定义存储规则
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    var path = "../hello-world/src/assets/product";
    path = path + "/";
    //判断目录是否存在
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, (err) => {
        if (err) throw err;
      });
    }
    cb(null, path);
  },
  filename: function (req, file, cb) {
    //构建Date对象
    var now = new Date();
    var fullYear = now.getFullYear();
    var month = now.getMonth() + 1;
    month = month < 10 ? "0" + month : month;
    var day = now.getDate();
    day = day < 10 ? "0" + day : day;
    //获取上传文件的原始名称
    var extension = file.originalname
      .substr(file.originalname.lastIndexOf(".") + 1)
      .toLowerCase();
    //产生基于时间戳的UUID,作为主文件名
    var mainame = uuid.v1();
    var filename =
      fullYear + "-" + month + "-" + day + "-" + mainame + "." + extension;
    cb(null, filename);
  },
});

upload = multer({ storage: storage });
//处理多文件上传的路由
app.post("/custom", upload.array("avatar"), (req, res) => {
  // console.log(req.files);
  console.log(req.body.avatar[0]);
  var title = req.body.avatar[0];
  var origin_price = req.body.avatar[1];
  var price = req.body.avatar[2];
  if (req.files) {
    var arr = [];
    req.files.forEach((item) => {
      arr.push(item.filename);
    });

    var imgs = JSON.stringify(arr);
    var sql =
      "insert tz_index_product_hot(img,title,origin_price,price) values(?,?,?,?)";
    pool.query(sql, [imgs, title, origin_price, price], (err, result) => {
      if (err) throw err;
      if (result.affectedRows == 1) {
        res.send("1");
      } else {
        res.send("0");
      }
    });
  }
});

// 注册
app.post("/register", upload.single("content"), (req, res) => {
  // console.log(req.body);
  var username = req.body.content[0];
  var password = req.body.content[1];
  var avatar = req.file.filename;
  var sql = "insert tz_user(username,password,avatar) values(?,?,?)";
  pool.query(sql, [username, password, avatar], (err, result) => {
    if (err) throw err;
    if (result.affectedRows == 1) {
      res.send("1");
    } else {
      res.send("0");
    }
  });
});

// 登录
app.post("/login", (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  var sql =
    "select id,username,password,avatar from tz_user where username=? and password=?";
  pool.query(sql, [username, password], (err, result) => {
    console.log(result.length);
    console.log(result);
    if (err) throw err;
    if (result.length == 1) {
      res.send({ result: result[0], code: 1 });
    } else {
      res.send({ code: 0 });
    }
  });
});

// 查询index首页的轮播图图片
app.get("/banner", (req, res) => {
  var sql = "select img from tz_index_carousel";
  pool.query(sql, (err, result) => {
    if (err) throw err;
    res.send({ carousel: result });
  });
});

// 爆款的数据
app.get("/hot", (req, res) => {
  var sql = "select id,img,title,origin_price,price from tz_index_product_hot";
  pool.query(sql, (err, result) => {
    if (err) throw err;
    res.send({ hot: result, imgs: result.img });
  });
});

// 查询商品详情
app.get("/details", (req, res) => {
  var id = req.query.id;
  console.log(id);
  var sql = "select * from tz_index_product_hot where id=?";
  pool.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.send({ hot: result[0] });
  });
});

// 加入购物车
app.post("/cart", (req, res) => {
  console.log(req.body);
  var count = req.body.count;
  var price = req.body.price;
  var total = req.body.total;
  var color = req.body.color;
  // console.log(color);
  var size = req.body.size;
  var imgUrl = req.body.imgUrl;
  var username = req.body.username;
  var title = req.body.title;
  var sql =
    "insert tz_cart(title,count,price,total,exterior,size,imgUrl,username) values(?,?,?,?,?,?,?,?)";
  pool.query(
    sql,
    [title, count, price, total, color, size, imgUrl, username],
    (err, result) => {
      if (err) throw err;
      if (result.affectedRows == 1) {
        res.send("1");
      } else {
        res.send("0");
      }
    }
  );
});

// 删除购物车
app.get("/delete", (req, res) => {
  var id = req.query.id;
  console.log(id);
  var sql = "delete from tz_cart where id=?";
  pool.query(sql, [id], (err, result) => {
    if (err) throw err;
    if (result.affectedRows == 1) {
      res.send("1");
    } else {
      res.send("0");
    }
  });
});

// 查询购物车
app.get("/shopingCar", (req, res) => {
  console.log(req.query);
  var username = req.query.username;
  var sql = "select * from tz_cart where username=?";
  pool.query(sql, [username], (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send(result);
  });
});
app.listen(3000, () => {
  console.log("http://127.0.0.1:3000");
});
