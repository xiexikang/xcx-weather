// pages/city/city.js
const db = wx.cloud.database();
const app = getApp();
let util = require('../../util/util.js');
let globalData = app.globalData;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    imgUrl:'https://7765-weather-osr6u-1301385777.tcb.qcloud.la',//图片路径
    // myCityWeatherList:[],//我的城市天气列表
    animSpread: {},//展开动画
    animShrnk: {}, //收缩动画
    isShowPop:false, //弹窗状态
    time:'', //时间
    valueText:'', //输入框的文字
    cityResultList:[],//搜索成功显示的城市列表
    nowWeather:[],//城市的天气
    cityName:'',//搜索城市列表选中的城市
    startX: 0, //开始坐标x
    startY: 0, //开始坐标y
  },

  //获取城市对应的天气状况
  getWeather(location){
    let that = this,
        key = globalData.key,
        city = location;
    const params = {};
    params.location = city;
    params.key = key;
    return util.requestAjax.post(`${globalData.requestUrl.weather}`+'now',params)
      .then((res)=> {
        // console.log(res)
        const now = res.data.HeWeather6[0].now;
        var tmp = now.tmp;
        that.setData({
          nowWeather: now
        })
        return now
      })
  },

  //添加城市集的天气到云后台
  addCityWeather(){
    let that = this;
    db.collection('cityWeather').add({
      data: {
        city: that.data.cityName
      },
      success(res){
        console.log(res)
        util.showSuccess('添加成功~');
        that.getMyCityWeater();
      },
      fail(res) {
        console.log(res)
      }
    })
  },


  //获取我的地址 从云后台
  getMyCityWeater(){
    let that = this;
    //通过openid获取数据库的数据
    if(wx.getStorageSync('openid')){
      util.showLoading('加载中...');
      //
      db.collection('cityWeather').where({
        _openid: globalData.openid
      }).get({
        async success(res){
          var result = res.data;
          //异步回调 async一下
          let arr = [];
          for (let i = 0; i < result.length; i++) {
            try {
              let val = await that.getWeather(result[i].city);
              // console.log(val)
              arr.push(val);
              arr.forEach((v,i)=>{
                result[i].tmp = v.tmp;
              })
              result.forEach((v,i)=>{
                v.isTouchMove = false; //用于滑动
              })
              //
              that.setData({
                myCityWeatherList: result,
                isLoadList: true
              })
            
            } catch (e) {}
          }
        },fail(res){
          console.log(res)
        }
      })
    }
  },

  //搜索城市-键盘输入监听
  bindSearchInput(e){
    let that = this;
    var value = e.detail.value;
    that.setData({
      valueText:value
    })
    if(value==''||value==null||value==undefined){
      that.setData({
        cityResultList:[]
      })
      return
    }
    let parameters = {};
    parameters.location = value;
    parameters.key = globalData.key;
    parameters.mode = 'match';
    parameters.number = 10;
    util.requestAjax.post(`${globalData.requestUrl.cityFind}`,parameters) //这官方接口不太完善，GG思密达...
    .then((res)=> {
        const data =  res.data.HeWeather6[0];
        const basic = data.basic;
        if(data.status=='unknown location'){
          that.setData({
            cityResultList:[],
            addressNone:true
          })
        }
        if(data.status=='ok'){
          that.setData({
            cityResultList:basic,
            addressNone:false
          })
        }
      }).catch((res)=>{
        console.log(res);
    });
  },

  //搜索列表中的-选中该城市
  bindChooseCity(e){
    let that = this;
    let cityName = e.currentTarget.dataset.cityname;
    that.setData({
      cityName:cityName 
    })
    that.addCityWeather();
    that.bindAddPopHide();
  },

  //我的城市集中-选择
  selectCityWeather(e){
    let that = this;
    let city = e.currentTarget.dataset.city;
    wx.setStorageSync('city', city);
    util.pageMenu('../weather/weather?city=' + city);
  },
  
  //打开弹窗-
  bindAddPopShow(){
    let that = this;
    var animSpread = wx.createAnimation({
      duration: 300,
      delay: 0,
      timingFunction: "ease",
    });
    var animShrnk = wx.createAnimation({
      duration: 300,
      delay: 0,
      timingFunction: "ease",
    });
    animSpread.bottom(0).step();
    animShrnk.translateY(15).scale(0.92).step();
    that.setData({
      animSpread: animSpread.export(),
      animShrnk: animShrnk.export(),
      isShowPop:true
    })
  },

  //隐藏弹窗-
  bindAddPopHide(){
    let that = this;
    var animSpread = wx.createAnimation({
      duration: 300,
      delay: 0,
      timingFunction: "ease",
    });
    var animShrnk = wx.createAnimation({
      duration: 300,
      delay: 0,
      timingFunction: "ease",
    });
    animSpread.bottom(-95+'%').step();
    animShrnk.translateY(0).scale(1).step();
    that.setData({
      animSpread: animSpread.export(),
      animShrnk: animShrnk.export(),
      isShowPop:false,
      valueText:'',
      cityResultList:[]
    })
  },

  //获取时间 时间格式 15：20
  getTime(){
    let that = this;
    that.turnDate();
    setInterval(()=>{ 
      that.turnDate();
    },1e3);
  },

  //转换日期时间
  turnDate(){
    let that = this;
    var date = new Date();
    const hour = date.getHours();
    const minute = date.getMinutes();
    var time =  [hour, minute].map(that.formatNumber).join(':');
    that.setData({
      time: time
    })
  },

  //转换格式
  formatNumber(n){
    n = n.toString()
    return n[1] ? n : '0' + n
  },

  
  //开始触摸时
  touchstart(e) {
    var that = this;
    var items = that.data.myCityWeatherList;
    items.forEach(function (v, i) {
      if (v.isTouchMove){
        v.isTouchMove = false;
      }
    })
    that.setData({
      startX: e.changedTouches[0].clientX,
      startY: e.changedTouches[0].clientY,
      myCityWeatherList: that.data.myCityWeatherList
    })
  },

  //滑动事件处理
  touchmove(e) {
    var that = this,
      items = that.data.myCityWeatherList,
      index = e.currentTarget.dataset.index,//当前索引
      startX = that.data.startX,//开始X坐标
      startY = that.data.startY,//开始Y坐标
      touchMoveX = e.changedTouches[0].clientX,//滑动变化坐标
      touchMoveY = e.changedTouches[0].clientY,//滑动变化坐标
      //获取滑动角度
      angle = that.angle({ X: startX, Y: startY }, { X: touchMoveX, Y: touchMoveY });

    items.forEach(function (v, i) {
      v.isTouchMove = false
      //滑动超过30度角 return
      if (Math.abs(angle) > 30) return;
      if (i == index) {
        if (touchMoveX > startX){
          v.isTouchMove = false;  //右滑
        }else{
          v.isTouchMove = true; //左滑
        } 
      }
    })
   
    that.setData({
      myCityWeatherList: that.data.myCityWeatherList
    })
  },
 
  // 计算滑动角度 start 起点坐标  end 终点坐标
  angle(start, end) {
    var _X = end.X - start.X,
      _Y = end.Y - start.Y
    //返回角度 /Math.atan()返回数字的反正切值
    return 360 * Math.atan(_Y / _X) / (2 * Math.PI);
  },

 
  //删除城市
  bindDelete(e) {
    var that = this,
        id = e.currentTarget.dataset.id,
        index = e.currentTarget.dataset.index,
        items = that.data.myCityWeatherList;
    items[index].isTouchMove = true; 
    that.setData({
      myCityWeatherList: that.data.myCityWeatherList
    })
    wx.showModal({
      title: '温馨提示',
      content: '亲，您确定要取消此城市吗？',
      success(res) {
        if (res.confirm) {
          db.collection('cityWeather').doc(id).remove({
            success(res) {
              items.splice(index, 1);
              that.setData({
                myCityWeatherList: that.data.myCityWeatherList
              })
              util.showSuccess('删除成功~');
            },fail(res){
              console.log(res)
            }
          })
        } else if (res.cancel) {
          items[index].isTouchMove = false;
          that.setData({
            myCityWeatherList: that.data.myCityWeatherList
          })
        }
      }
    })
  
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    that.getTime();
    that.getMyCityWeater();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})