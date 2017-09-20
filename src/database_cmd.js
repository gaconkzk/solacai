//----------------------
// The default data
var drinkLocation = [
  "La Cà - Ngô Thị Thu Minh ố ô ỳe ye",
  "La Cà - Đường Phố - Hoàng Sa - Bờ kè thoáng mát hợp vệ sinh ngon lắm anh êy",
  "1B - Thích Quảng Đức Bưởi da trắng, Cam Đào Mận Xoài đủ cả (heart)",
  "Nhậu thì ra 45 - Phan Đăng Lưu, thơm mũi mát mắt nha mấy anh"
];

var swearMe = [
  "sao anh chửi em?",
  "em vô tội",
  "ngon nhào vô đi!",
  "cám ơn, anh cũng vậy"
];

var confuse = [
  "xin lỗi, em bị ngu",
  "xin lỗi, em chỉ là con bot.",
  "à, hiểu, mà hỏi người khác đi nha",
  "trời xanh xanh ngát xanh gió tung tăng trên lá xanh!"
];

var bug = [
  "bug!!! BUG!!!!!",
  "lỗi nặng rồi!! CỨU với",
  "xong! chắc server chết rồi!"
];

var conversationGreeting = [
  "xin chào",
  "konichiwa",
  "hai hai",
  "hello",
  "chào anh"
];

var conversationBye = [
  "tạm biệt",
  "bái bai",
  "good bye"
];

var data = {
  "drinkLocation": drinkLocation,
  "swearMe": swearMe,
  "confuse": confuse,
  "conversationGreeting": conversationGreeting,
  "conversationBye": conversationBye,
  "bug": bug
};

class DatabaseCmd {
  constructor(db) {
      this._db = db;

      this.initialize = this.initialize.bind(this);
      this.action = this.action.bind(this);
      this.list = this.list.bind(this);

      this.initialize();
  }

  getData() {
    return data;
  }

  action(session, msg) {
    let data = msg.split('db: ')[1].split(' ');
    let cmd = data.shift().trim();
    switch (cmd) {
      case 'list':
      let collection = data.shift().trim();
      this
        .list(collection, data)
        .then((res)=>{
          session.endDialog(JSON.stringify(res),null,2);
        })
        .catch((err)=>{session.endDialog("lấy ko được data. code lại đi")});
      break;
      default:
      session.endDialog("unknown command");
      break;
    }
  }

  list(c, q) {
    // TODO fix query
    return this._db.collection(c).find({}).toArray();
  }

  initialize() {
    this._db.collection('drinkLocation').find({}).toArray().then((res)=> {
      if (!res.length) this._db.collection('drinkLocation').insert(drinkLocation.map(s => {return {"value":s};}));
      else
        data.drinkLocation = res.map(v => v.value);
    })
  
    this._db.collection('swearMe').find({}).toArray().then((res)=> {
      if (!res.length) this._db.collection('swearMe').insert(swearMe.map(s => {return {"value":s};}));
      else
        data.swearMe = res.map(v => v.value);
    });
  
    this._db.collection('confuse').find({}).toArray().then((res)=> {
      if (!res.length) this._db.collection('confuse').insert(confuse.map(s => {return {"value":s};}));
      else
        data.confuse = res.map(v => v.value);
    });
  
    this._db.collection('conversationGreeting').find({}).toArray().then((res)=> {
      if (!res.length) this._db.collection('conversationGreeting').insert(conversationGreeting.map(s => {return {"value":s};}));
      else
        data.conversationGreeting = res.map(v => v.value);
    });
  
    this._db.collection('conversationBye').find({}).toArray().then((res)=> {
      if (!res.length) this._db.collection('conversationBye').insert(conversationBye.map(s => {return {"value":s};}));
      else
        data.conversationBye = res.map(v => v.value);
    });
  
    this._db.collection('bug').find({}).toArray().then((res)=> {
      if (!res.length) this._db.collection('bug').insert(bug.map(s => {return {"value":s};}));
      else
        data.bug = res.map(v => v.value);
    });
  }
}

module.exports = { DatabaseCmd, data }