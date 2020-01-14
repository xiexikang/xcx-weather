// pages/weather/weather.js
const app = getApp();
let util = require('../../util/util.js');
let globalData = app.globalData;
const key = globalData.key;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    cityName:"", //城市
    weatherState:"", //天气状况
    temperature:"", //温度
    weekday:"", //今天周几
    hours24:[], //24小时的温度
    weekLong:[], // 最近一周的天气
    //天气指数
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
    lifeDescribe:"", //今天天气气指数描述
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

  },

  //获取天气
  getWeather(location){
    let that = this,
        key = globalData.key;
    const newWeatherRecord =  that.data.weatherRecord,
          newWeaVal = that.data.weatherRecord.val;

    var params = {location:location,key:key};
    //***现在的***
    util.requestAjax.post(`${globalData.requestUrl.weather}`+'now',params)
     .then((res)=> {
      // console.log(res)
       const data = res.data.HeWeather6[0],
              dataNow = data.now;
        //
        newWeaVal['pres'] = dataNow.pres;
        newWeaVal['hum'] = dataNow.hum;
        newWeaVal['wind_dir'] = dataNow.wind_dir;
        newWeaVal['wind_spd'] = dataNow.wind_spd;
        newWeaVal['fl'] = dataNow.fl;
        newWeaVal['vis'] = dataNow.vis;

        that.setData({
          cityName: data.basic.location,
          weekday: util.formatWeekday(new Date()),
          weatherState: dataNow.cond_txt,
          temperature: dataNow.tmp,
          weatherRecord: newWeatherRecord
        })
    }).catch((res)=>{
      console.log(res);
    });

    //***未来3天***
    util.requestAjax.post(`${globalData.requestUrl.weather}`+'forecast',params)
     .then((res)=> {
      console.log(res)
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
        
    }).catch((res)=>{
      console.log(res);
    });

    //***生活指数***
    util.requestAjax.post(`${globalData.requestUrl.weather}`+'lifestyle',params)
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
        lifeDescribe:newLifestyle[n].typeName +'：'+ newLifestyle[n].txt
      })
      setInterval(()=>{
        n = Math.floor(Math.random() * len + 1)-1;
        that.setData({
          lifeDescribe:newLifestyle[n].typeName +'：'+ newLifestyle[n].txt
        })
      },10e3);

    }).catch((res)=>{
      console.log(res);
    });
      
    //***逐小时预报***
    util.requestAjax.post(`${globalData.requestUrl.weather}`+'hourly',params)
    .then((res)=> {
        // console.log(res)   
      }).catch((res)=>{
        console.log(res);
    });

  },

  //获取地址
  getMyLocation(){
    let that = this;
    wx.getLocation({
      type: 'gcj02', //wgs84,gcj02
      success (res) {
        const myLatlong = `${res.latitude},${res.longitude}`;
        that.getWeather(myLatlong)
      },fail: (res) => {
        console.log(res)
      }
     })
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getMyLocation();

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