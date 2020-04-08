// pages/weather/weather.js
const db = wx.cloud.database();
const app = getApp();
let util = require('../../util/util.js');
let globalData = app.globalData;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    imgUrl:'',//图片路径，云开发-存储图片的文件夹地址
    weatherParms:'', //天气参数，坐标和key
    cityName:"", //城市名
    weekday:"", //今天周几
    nowWeather:[],//今天天气
    hoursHourly:[], //未来小时的温度
    weekLong:[], // 最近一周的天气
    //天气指数
    lifestyleList:[],//天气指数列表
    lifestyles: {
      'comf': '舒适度指数',
      'cw': '洗车指数',
      'drsg': '穿衣指数',
      'flu': '感冒指数',
      'sport': '运动指数',
      'trav': '旅游指数',
      'uv': '紫外线指数',
      'air': '空气污染扩散条件指数',
      'ac': '空调开启指数',
      'ag': '过敏指数',
      'gl': '太阳镜指数',
      'mu': '化妆指数',
      'airc': '晾晒指数',
      'ptfc': '交通指数',
      'fsh': '钓鱼指数',
      'spi': '防晒指数',
    },
    //天气记录相关数据
    weatherRecord:{
      keywords:['tmp_max','tmp_min','sr','ss','mr','ms','pop','pcpn','pres','hum','wind_dir','wind_spd','fl','vis','uv_index'],
      val: {
        tmp_max: '最高温度',
        tmp_min:'最低温度',
        sr: '日出',
        ss: '日落',
        mr: '月升',
        ms: '月落',
        pop: '降雨率',
        pcpn: '降雨量',
        pres: '大气压',
        hum: '湿度',
        wind_dir: '风向',
        wind_spd: '风速',
        fl: '体感',
        vis: '能见度',
        uv_index: '紫外线',
      },
    },

    isNight:false,//白天-黑夜状态

  },

  // ************************以下的接口都是和风天气的开发版，更多功能需要花钱开通商业版https://console.heweather.com/app/price************************

  //获取今日天气
  getWeather(location){
    let that = this,
        key = globalData.key;
    const newWeatherRecord = that.data.weatherRecord,
          newWeaVal = that.data.weatherRecord.val;
    var params = {};
    params.location = location;
    params.key = key;
    that.setData({
      weatherParms:params
    })

    util.showLoading('加载中...')

    //***现在的***
    util.requestAjax.post(`${globalData.requestUrl.weather}`+'now',params)
     .then((res)=> {
      // console.log(res)
       const data = res.data.HeWeather6[0],
              dataNow = data.now;
        newWeaVal['pres'] = dataNow.pres;
        newWeaVal['hum'] = dataNow.hum;
        newWeaVal['wind_dir'] = dataNow.wind_dir;
        newWeaVal['wind_spd'] = dataNow.wind_spd;
        newWeaVal['fl'] = dataNow.fl;
        newWeaVal['vis'] = dataNow.vis;
        that.setData({
          nowWeather:dataNow,
          cityName: data.basic.location,
          weekday: util.formatWeekday(new Date()),
          weatherRecord: newWeatherRecord
        })
    }).catch((res)=>{
      console.log(res);
    });
    //
    Promise.all([that.getHourWeather(),that.getSevenWeather(),that.getLifeStyle()])
      .then((res) => {
      //  console.log(res)
      })
      .catch((err)=>{
      })
  },

  //***逐小时预报（未来1天逐三小时）***
  getHourWeather(){
    let that = this;
    var params = that.data.weatherParms;
  return util.requestAjax.post(`${globalData.requestUrl.weather}`+'hourly',params)
    .then((res)=> {
        var hourly = res.data.HeWeather6[0].hourly;
        // console.log(hourly)
        that.setData({
          hoursHourly:hourly
        })
        return res.data.HeWeather6[0]
      }).catch((res)=>{
        console.log(res);
    });
  },

  //***未来7天***
  getSevenWeather(){
    let that = this;
    const newWeatherRecord =  that.data.weatherRecord,
          newWeaVal = that.data.weatherRecord.val;
    var params = that.data.weatherParms;
    return util.requestAjax.post(`${globalData.requestUrl.weather}`+'forecast',params)
     .then((res)=> {
      // console.log(res)
       const data = res.data.HeWeather6[0],
            dailyForecast0 = data.daily_forecast[0],
            weekLong = data.daily_forecast,
            newWeekLong = [];
        //
        newWeaVal['tmp_max'] =  dailyForecast0.tmp_max;
        newWeaVal['tmp_min'] =  dailyForecast0.tmp_min;
        newWeaVal['sr'] =  dailyForecast0.sr;
        newWeaVal['ss'] =  dailyForecast0.ss;
        newWeaVal['ms'] =  dailyForecast0.ms;
        newWeaVal['mr'] =  dailyForecast0.mr;
        newWeaVal['pop'] =  dailyForecast0.pop;
        newWeaVal['pcpn'] =  dailyForecast0.pcpn;
        newWeaVal['uv_index'] =  dailyForecast0.uv_index;
        newWeatherRecord.val = newWeaVal;

        //weekLong增加新属性：week=星期几
        weekLong.map((item,index)=>{
          var myDate = new Date(Date.parse(item.date)); 
          newWeekLong.push(
              Object.assign({},item,{week:util.formatWeek(item.date)})
            )
        });
        that.setData({
          weatherRecord: newWeatherRecord,
          weekLong: newWeekLong
        })
        that.dayNight();
        return res.data.HeWeather6[0]
        
    }).catch((res)=>{
      console.log(res);
    });
  },

  //***生活指数***
  getLifeStyle(){
    let that = this;
    var params = that.data.weatherParms;
    return util.requestAjax.post(`${globalData.requestUrl.weather}`+'lifestyle',params)
    .then((res)=> {
      // console.log(res)
      const data = res.data.HeWeather6[0],
            lifestyle = data.lifestyle,
            len = lifestyle.length;
      //生活指数详细描述
      var n = 0,lifestyles = that.data.lifestyles;
      const newLifestyle = lifestyle.map((obj,index) =>{ 
        obj.typeName = "";
        if(obj.type=="comf"){
          obj.typeName = lifestyles.comf;
        }else if(obj.type=="drsg"){
          obj.typeName = lifestyles.drsg;
        }else if(obj.type=="flu"){
          obj.typeName = lifestyles.flu;
        }else if(obj.type=="sport"){
          obj.typeName = lifestyles.sport;
        }else if(obj.type=="trav"){
          obj.typeName = lifestyles.trav;
        }else if(obj.type=="uv"){
          obj.typeName = lifestyles.uv;
        }else if(obj.type=="cw"){
          obj.typeName = lifestyles.cw;
        }else if(obj.type=="air"){
          obj.typeName = lifestyles.air;
        }
        return obj;
      });
      that.setData({
        lifestyleList:newLifestyle
      })
      return res.data.HeWeather6[0]
    }).catch((res)=>{
      console.log(res);
    });

  },

  //获取地址
  getAddress(){
    let that = this;
    var city = that.data.city;
    var myLocationAddress = wx.getStorageSync('myLocationAddress');
    //city不存在就用缓存
    if(typeof(city)=="undefined"){
      city = globalData.city;
    }else{
      city = that.data.city;
    }
    // console.log(city)
    //此判断是否从city页面传过来city城市参数，反之获取自己的定位城市
    if(city){
      that.getWeather(city);
      return
    }else{
      that.getWeather(myLocationAddress);
    }
  },

  //获取用户的授权定位
  getMyLocation(){
    let that = this;
    var myLocationAddress = '';
    if (globalData.isLocation && globalData.isLocation != '') {
        myLocationAddress = wx.getStorageSync('myLocationAddress');
        that.getAddress();
        // that.getWeather(myLocationAddress);
     } else {
      // 由于 getLocation 是网络请求，可能会在 Page.onLoad 之后才返回 ; 所以此处加入 callback 以防止这种情况
      app.isLocationCallback = isLocation => {
       if (isLocation != '') {
          myLocationAddress = wx.getStorageSync('myLocationAddress');
          that.getAddress();
          // that.getWeather(myLocationAddress);
       }
      }
     }
     //未获取地址前，默认为广州
     if(globalData.is_Address!=1){
        // var city = wx.getStorageSync('city');
        var city = globalData.city;
        var originCity = city?city:'广州';
        that.getWeather(originCity);
     }
  },

  //清除缓存地址
  removeCity(){
    let that = this;
    // wx.removeStorageSync('city'); //此地址为city.js那传过来的city参数
    globalData.city = null;
    that.setData({
      city: globalData.city
    })
  },

  //判断白天和黑夜
  dayNight(){
    let that = this;
    var now = new Date(),hour = now.getHours();
    if(hour>=6 && hour<18){
      that.setData({
        isNight:false
      })
    }else{
      that.setData({
        isNight:true
      })
    }
  },

 
 //点击执行一次是否用户位置授权
  bindAutoUserLocation(){ 
    let that = this;
    app.autoUserLocation();
    that.removeCity();
    that.getMyLocation();
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;

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
    let that = this;
    // console.log(globalData.city)
    if(globalData.city){
      that.setData({
        city: globalData.city
      })
    }
    that.getMyLocation();
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
    //执行一次是否用户位置授权
    // app.autoUserLocation();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
     //执行一次是否用户位置授权
    // app.autoUserLocation();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})