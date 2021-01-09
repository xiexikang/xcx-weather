// pages/weather/weather.js
const db = wx.cloud.database();
const app = getApp();
let globalData = app.globalData;
let util = require('../../util/util.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    imgUrl: globalData.imgUrl, //图片路径
    cityName: "", //城市名
    location: '', //城市坐标
    weatherInfo: {}, //天气信息
    weekday: "", //今天周几
    hourlyList: [], //未来小时的温度
    weekLong: [], // 最近一周的天气
    lifestyleList: [], //天气指数列表
    isNight: false, //白天-黑夜状态
    isCancle: false,
  },

  // ************************以下的接口都是和风天气的开发版dev************************
  //获取今日天气
  getWeather(location) {
    var params = {};
    params.location = location;
    params.key = globalData.key;
    util.showLoading('加载中...')
    util.requestAjax.get('https://devapi.qweather.com/v7/weather/now', params)
      .then((res) => {
        if (res.data.code != 200) {
          return
        }
        const now = res.data.now;
        this.setData({
          weatherInfo: now,
          weekday: util.formatWeek(now.obsTime)
        })
        util.hideLoading();
        wx.stopPullDownRefresh();
      }).catch((err) => {})
    this.getHour(params);
    this.getSeven(params);
    this.getLifeStyle(params);
    this.dayNight();
  },

  //获取逐小时预报
  getHour(params) {
    util.requestAjax.get('https://devapi.qweather.com/v7/weather/24h', params)
      .then((res) => {
        if (res.data.code != 200) {
          return
        }
        const hourly = res.data.hourly;
        hourly.forEach((v) => {
          v.hour = util.formatHour(v.fxTime)
        })
        this.setData({
          hourlyList: res.data.hourly
        })
      });
  },

  //获取未来7天
  getSeven(params) {
    util.requestAjax.get('https://devapi.qweather.com/v7/weather/7d', params)
      .then((res) => {
        if (res.data.code != 200) {
          return
        }
        const daily = res.data.daily;
        daily.forEach((v) => {
          v.week = util.formatWeek(v.fxDate)
        })
        this.setData({
          weekLong: res.data.daily
        })
      });
  },

  //获取生活指数
  getLifeStyle(params) {
    Object.assign(params, {
      type: 0
    });
    util.requestAjax.get('https://devapi.qweather.com/v7/indices/1d', params)
      .then((res) => {
        if (res.data.code != 200) {
          return
        }
        this.setData({
          lifestyleList: res.data.daily
        })
      })
  },

  //判断白天和黑夜
  dayNight() {
    let that = this;
    var now = new Date(),
      hour = now.getHours();
    if (hour >= 6 && hour < 18) {
      that.setData({
        isNight: false
      })
    } else {
      that.setData({
        isNight: true
      })
    }
  },

  //清除值
  removeValues() {
    globalData.cityName = '';
    globalData.location = '';
  },

  //获取city页面data
  getGlobalCity(location) {
    this.setData({
      cityName: globalData.cityName,
      location: globalData.location,
    })
    this.getWeather(location);
  },

  //获取用户的授权定位
  getMyLocation() {
    let isLocation = wx.getStorageSync('isLocation'),
      myCityName = wx.getStorageSync('myCityName'),
      myLocation = wx.getStorageSync('myLocation'),
      location = globalData.location;
    if (!isLocation) {
      if (location) {
        this.getGlobalCity(location);
        return
      }
      this.removeValues();
      this.setData({
        cityName: globalData.defalutCityName,
        location: globalData.defalutLocation,
      })
      this.getWeather(globalData.defalutLocation);
    } else {
      if (location) {
        this.getGlobalCity(location);
        return
      }
      this.removeValues();
      this.setData({
        cityName: myCityName,
        location: myLocation,
      })
      this.getWeather(myLocation);
    }
  },

  //点击按钮打开设置-用户定位
  bindGetUserLocation() {
    app.openSettingLocation((res) => {
      if (res) {
        this.setData({
          isCancle: false
        })
        wx.setStorageSync('isLocation', true)
        this.removeValues();
        app.isLocationCallback = res => {
          if (res) {
            let resLocation = `${res.longitude},${res.latitude}`;
            this.setData({
              cityName: res.myCityName,
            })
            this.getWeather(resLocation);
            return
          }
        }
      }
      return;
    });
  },

  //点击执行一次是否用户位置授权
  bindAutoUserLocation() {
    app.autoUserLocation();
    app.isCancleCallback = res => {
      this.setData({
        isCancle: true
      })
    }
    setTimeout(() => {
      this.removeValues();
      this.getMyLocation();
    }, 1e3)
  },

  //初始化
  init() {
    this.getMyLocation();
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.init();
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
    this.init();
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